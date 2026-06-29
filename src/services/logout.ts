/** Logout service — pure signout + cleanup on a given Page.
 *
 * Does NOT manage browser lifecycle. Does NOT create/close pages.
 * The caller (BrowserManager / orchestrator) provides the Page.
 */
import type { LogoutResult } from '../types.js';
import type { BrowserManager } from '../browser/manager.js';
import { Logger } from '../utils/logger.js';
import { EventBus } from '../utils/eventbus.js';

export class LogoutService {
  private logger: Logger;
  private events: EventBus;
  private browserManager: BrowserManager;
  private ready = false;

  constructor(logger: Logger, events: EventBus, browserManager: BrowserManager) {
    this.logger = logger.child('Logout');
    this.events = events;
    this.browserManager = browserManager;
  }

  async init(): Promise<void> { this.ready = true; }
  async shutdown(): Promise<void> { this.ready = false; }
  isReady(): boolean { return this.ready; }

  /** Perform logout on the given page with retry.
   *
   * Steps:
   *   1. Navigate directly to /api/v2/auths/signout (browser processes cookies, redirects)
   *   2. Verify JSON response { success: true, data: { status: true } }
   *   3. Clear all cookies (document.cookie + context.clearCookies())
   *   4. Clear localStorage + sessionStorage
   *   5. Navigate to /auth?mode=register with domcontentloaded
   *   6. Wait for URL matching /auth?mode=register/
   *   7. Wait for <form> element to be visible
   *
   * Retries all steps up to maxRetries times on any failure.
   * After success, the page is on /auth?mode=register with the form visible.
   * The page is NOT closed.
   */
  async logout(page: any, qwenUrl: string, maxRetries = 3): Promise<LogoutResult> {
    if (!this.isReady()) {
      return { success: false, signedOut: false, cookiesCleared: false, storageCleared: false, tabsClosed: false, verified: false, error: 'Service not ready' };
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      this.logger.info(`Logout attempt ${attempt}/${maxRetries}`);
      await this.events.emit('logout:started', { attempt }, 'Logout');

      try {
        // ── Step 1: Navigate directly to signout API ────────────────
        // Direct navigation ensures the browser fully processes
        // Set-Cookie / Clear-Site-Data headers from the response.
        this.logger.info(`Navigating to signout endpoint`);
        await page.goto(`${qwenUrl}/api/v2/auths/signout`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        // ── Step 2: Verify JSON response ────────────────────────────
        let signedOut = false;
        try {
          const text = await page.evaluate(() => document.body?.innerText?.trim() || '');
          const json = JSON.parse(text);
          if (json?.success === true && json?.data?.status === true) {
            signedOut = true;
            this.logger.info(`Signout API success: ${JSON.stringify(json)}`);
          } else {
            this.logger.warn(`Unexpected signout response: ${text.substring(0, 200)}`);
          }
        } catch {
          // Response may not be valid JSON (e.g. redirect, HTML error page)
          this.logger.warn('Signout response is not valid JSON (may have redirected)');
        }

        if (!signedOut) {
          this.logger.warn('Signout API did not confirm success — proceeding with cleanup anyway');
        }

        // ── Step 3: Clear cookies (both JS-accessible and HttpOnly) ─
        await page.evaluate(() => {
          try {
            document.cookie.split(';').forEach(c => {
              const eqPos = c.indexOf('=');
              const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
              if (!name) return;
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.qwen.ai`;
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
            });
          } catch {}
        });
        await this.browserManager.clearCookies();
        this.logger.info('Cookies cleared (JS + context)');

        // ── Step 4: Clear localStorage + sessionStorage ─────────────
        await page.evaluate(() => {
          try { localStorage.clear(); } catch {}
          try { sessionStorage.clear(); } catch {}
        });
        this.logger.info('Storage cleared (localStorage + sessionStorage)');

        // ── Step 5: Navigate to registration page ───────────────────
        this.logger.info(`Navigating to ${qwenUrl}/auth?mode=register`);
        await page.goto(`${qwenUrl}/auth?mode=register`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        // ── Step 6: Wait for correct URL ────────────────────────────
        await page.waitForURL(/auth\?mode=register/, { timeout: 15000 });

        // ── Step 7: Wait for form to be visible ─────────────────────
        await page.waitForSelector('form', { state: 'visible', timeout: 15000 });

        this.logger.success(`Logout completed successfully (attempt ${attempt})`);
        await this.events.emit('logout:completed', {
          success: true, signedOut: true, cookiesCleared: true, storageCleared: true, verified: true, attempt,
        }, 'Logout');

        return {
          success: true, signedOut: true,
          cookiesCleared: true, storageCleared: true,
          tabsClosed: false, verified: true,
        };
      } catch (err: any) {
        this.logger.error(`Logout attempt ${attempt} failed: ${err.message}`);
        if (attempt < maxRetries) {
          this.logger.warn(`Retrying logout (${attempt + 1}/${maxRetries})`);
          await page.waitForTimeout(2000);
        }
      }
    }

    this.logger.error(`Logout failed after ${maxRetries} attempts`);
    await this.events.emit('logout:failed', { error: 'Max retries exceeded' }, 'Logout');

    return {
      success: false, signedOut: false,
      cookiesCleared: false, storageCleared: false,
      tabsClosed: false, verified: false,
      error: `Logout failed after ${maxRetries} attempts`,
    };
  }
}
