/** Connectivity checking */
import { resolve } from 'node:dns/promises';
import { Logger } from './logger.js';
import { timer } from './runtime.js';

export interface ConnectivityStatus {
  internet: boolean;
  dns: boolean;
  qwen: boolean;
  mailApi: boolean;
}

export class ConnectivityChecker {
  private logger: Logger | null = null;

  constructor(logger?: Logger) {
    this.logger = logger?.child('Network') || null;
  }

  async check(qwenUrl: string, mailUrl: string): Promise<ConnectivityStatus> {
    const t = timer();
    const [internet, dnsOk, qwen, mailApi] = await Promise.all([
      this.checkInternet(),
      this.checkDns(),
      this.checkEndpoint(qwenUrl, 15000),
      this.checkEndpoint(mailUrl, 15000),
    ]);
    if (this.logger) {
      this.logger.timing('Connectivity check', t.stop());
    }
    return { internet, dns: dnsOk, qwen, mailApi };
  }

  async checkWithRetry(qwenUrl: string, mailUrl: string, retries = 3): Promise<ConnectivityStatus> {
    for (let i = 0; i < retries; i++) {
      if (this.logger && i > 0) {
        this.logger.retry('Connectivity check', i + 1, retries);
      }
      const result = await this.check(qwenUrl, mailUrl);
      if (result.internet && result.dns) return result;
      if (i < retries - 1) await this.sleep(1000 * (i + 1));
    }
    return this.check(qwenUrl, mailUrl);
  }

  private async checkInternet(): Promise<boolean> {
    const t = timer();
    try {
      const resp = await fetch('https://clients3.google.com/generate_204', { signal: AbortSignal.timeout(10000) });
      const ok = resp.ok || resp.status === 204;
      if (this.logger) {
        this.logger.http('GET', 'https://clients3.google.com/generate_204', resp.status, t.stop());
      }
      return ok;
    } catch (err: any) {
      if (this.logger) {
        this.logger.debug(`Internet check failed: ${err.message}`);
      }
      return false;
    }
  }

  private async checkDns(): Promise<boolean> {
    const t = timer();
    try {
      await resolve('google.com');
      if (this.logger) {
        this.logger.timing('DNS resolve google.com', t.stop());
      }
      return true;
    } catch (err: any) {
      if (this.logger) {
        this.logger.debug(`DNS check failed: ${err.message}`);
      }
      return false;
    }
  }

  private async checkEndpoint(url: string, timeout = 10000): Promise<boolean> {
    const t = timer();
    try {
      const resp = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(timeout) });
      const ok = resp.ok || resp.status < 500;
      if (this.logger) {
        this.logger.http('HEAD', url, resp.status, t.stop());
      }
      return ok;
    } catch (err: any) {
      if (this.logger) {
        this.logger.debug(`Endpoint check failed for ${url}: ${err.message}`);
      }
      return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
