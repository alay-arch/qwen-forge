/** HTTP server with router and API routes */
import { Logger } from '../utils/logger.js';
import { EventBus } from '../utils/eventbus.js';
import { BrowserManager } from '../browser/manager.js';
import { RegistrationService } from '../services/registration.js';
import { LogoutService } from '../services/logout.js';
import type { AppConfig } from '../types.js';

export class Server {
  private server: any = null;
  private logger: Logger;
  private events: EventBus;
  private port: number;
  private host: string;
  private routes: Map<string, (req: Request) => Promise<Response>> = new Map();

  constructor(logger: Logger, events: EventBus, port = 3030, host = 'localhost') {
    this.logger = logger.child('Server');
    this.events = events;
    this.port = port;
    this.host = host;
  }

  get(path: string, handler: (req: Request) => Promise<Response>): void {
    this.routes.set(`GET:${path}`, handler);
  }

  post(path: string, handler: (req: Request) => Promise<Response>): void {
    this.routes.set(`POST:${path}`, handler);
  }

  async start(): Promise<void> {
    if (this.server) return;
    this.logger.info(`Starting on ${this.host}:${this.port}`);
    try {
      this.server = Bun.serve({
        port: this.port,
        hostname: this.host,
        fetch: async (req: Request) => {
          const url = new URL(req.url);
          const origin = req.headers.get('origin');
          if (origin && origin !== `http://${this.host}:${this.port}` && origin !== `http://127.0.0.1:${this.port}`) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
          }
          if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
          const key = `${req.method}:${url.pathname}`;
          const handler = this.routes.get(key);
          if (handler) {
            try { return await handler(req); } catch (err: any) { this.logger.error('HTTP handler failed', { error: err.message }); return Response.json({ error: 'Internal server error' }, { status: 500 }); }
          }
          return Response.json({ error: 'Not found' }, { status: 404 });
        },
      });
      this.logger.success(`Running on http://${this.host}:${this.port}`);
      await this.events.emit('server:started', { port: this.port }, 'Server');
    } catch (err: any) {
      this.logger.error('Server start failed', { error: err.message });
      throw err;
    }
  }

  async stop(): Promise<void> {
    if (!this.server) return;
    this.logger.info('Stopping...');
    try {
      await this.server.stop(true);
      this.server = null;
      this.logger.success('Stopped');
      await this.events.emit('server:stopped', {}, 'Server');
    } catch (err: any) { this.logger.error('Stop error', { error: err.message }); }
  }

  isRunning(): boolean { return this.server !== null; }
}

export function registerRoutes(server: Server, browser: BrowserManager, registration: RegistrationService, logout: LogoutService, config: AppConfig): void {
  server.get('/api/ping', async () => Response.json({ status: 'ok', version: config.version }));

  server.post('/api/register', async (req) => {
    let body: any;
    try { body = await req.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
    const { email, password } = body;
    if (typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || typeof password !== 'string' || password.length < 8 || password.length > 256) {
      return Response.json({ error: 'Invalid email or password' }, { status: 400 });
    }
    if (browser.isBusy()) return Response.json({ error: 'Browser is busy' }, { status: 409 });
    browser.setBusy(true);
    const page = await browser.createPage();
    try {
      const result = await registration.register(page, email, password, config.qwen.baseUrl);
      return Response.json(result);
    } finally {
      await browser.closePage(page);
      browser.setBusy(false);
    }
  });

  server.post('/api/logout', async () => {
    if (browser.isBusy()) return Response.json({ error: 'Browser is busy' }, { status: 409 });
    browser.setBusy(true);
    const page = await browser.getSharedPage();
    try {
      const result = await logout.logout(page, config.qwen.baseUrl);
      return Response.json(result);
    } finally {
      browser.setBusy(false);
    }
  });
}
