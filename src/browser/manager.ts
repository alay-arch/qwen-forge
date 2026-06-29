/** Browser manager — SOLE owner of the browser lifecycle.
 *
 * No other module may:
 *   - call context.close() / browser.close()
 *   - call context.newPage() / page.close()
 *   - call context.clearCookies() / context.cookies()
 *   - call context.pages()
 *
 * Every page MUST be obtained via createPage() and released via closePage().
 */
import { launchPersistentContext } from 'cloakbrowser';
import type { BrowserConfig, BrowserState } from '../types.js';
import { Logger } from '../utils/logger.js';
import { EventBus } from '../utils/eventbus.js';

type BrowserContext = Awaited<ReturnType<typeof launchPersistentContext>>;

export class BrowserManager {
  private browser: BrowserContext | null = null;
  private logger: Logger;
  private events: EventBus;
  private config: BrowserConfig | null = null;
  private busy = false;
  private startTime = 0;
  private sharedPage: any = null;

  constructor(logger: Logger, events: EventBus) {
    this.logger = logger.child('Browser');
    this.events = events;
  }

  async init(config: BrowserConfig): Promise<void> {
    this.config = config;
    this.logger.debug('Browser manager initialized (lazy mode)');
  }

  /** Start browser (lazy — no-op if already running) */
  async start(): Promise<void> {
    if (this.browser) return;
    if (!this.config) throw new Error('Not initialized');
    this.logger.info('Starting browser...');
    try {
      this.browser = await launchPersistentContext({
        userDataDir: this.config.userDataDir,
        headless: this.config.headless,
        humanize: this.config.humanize,
        geoip: this.config.geoip,
        args: this.config.args,
      });
      this.startTime = Date.now();
      this.busy = false;
      this.logger.success('Browser started');
      await this.events.emit('browser:started', { profileDir: this.config.userDataDir }, 'BrowserManager');
    } catch (err: any) {
      this.logger.error('Browser start failed', { error: err.message });
      await this.events.emit('browser:error', { error: err.message }, 'BrowserManager');
      throw err;
    }
  }

  /** Stop browser — close context and all pages */
  async stop(): Promise<void> {
    if (!this.browser) { this.busy = false; return; }
    this.logger.info('Stopping browser...');
    try {
      await this.browser.close();
      this.browser = null;
      this.sharedPage = null;
      this.startTime = 0;
      this.busy = false;
      this.logger.success('Browser stopped');
      await this.events.emit('browser:stopped', {}, 'BrowserManager');
    } catch (err: any) {
      this.logger.error('Browser stop error', { error: err.message });
      this.busy = false;
    }
  }

  /** Get the shared persistent page. Creates it on first call. */
  async getSharedPage(): Promise<any> {
    if (!this.browser) await this.start();
    if (!this.sharedPage) {
      this.sharedPage = await this.browser!.newPage();
      this.logger.debug('Shared page created');
    }
    return this.sharedPage;
  }

  /** Create a new page. Starts browser if needed. */
  async createPage(): Promise<any> {
    if (!this.browser) await this.start();
    return this.browser!.newPage();
  }

  /** Close a page previously obtained via createPage(). */
  async closePage(page: any): Promise<void> {
    try { await page.close(); } catch {}
  }

  /** Clear all cookies in the current context. */
  async clearCookies(): Promise<void> {
    if (!this.browser) return;
    try { await this.browser.clearCookies(); } catch {}
  }

  isRunning(): boolean { return this.browser !== null; }
  isBusy(): boolean { return this.busy; }
  setBusy(v: boolean): void { this.busy = v; }

  state(): BrowserState {
    return {
      isRunning: this.browser !== null,
      isBusy: this.busy,
      activeTabs: this.browser ? 1 : 0,
      uptime: this.startTime > 0 ? Date.now() - this.startTime : 0,
      profilePath: this.config?.userDataDir || '',
    };
  }
}
