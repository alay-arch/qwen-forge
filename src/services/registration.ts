/** Registration service — fills the Qwen registration form on a given Page.
 *
 * Does NOT manage browser lifecycle. Does NOT create/close pages.
 * The caller (BrowserManager / orchestrator) provides the Page.
 */
import type { RegistrationResult } from '../types.js';
import { Logger } from '../utils/logger.js';
import { EventBus } from '../utils/eventbus.js';
import { timer } from '../utils/runtime.js';

export class RegistrationService {
  private logger: Logger;
  private events: EventBus;
  private ready = false;

  constructor(logger: Logger, events: EventBus) {
    this.logger = logger.child('Registration');
    this.events = events;
  }

  async init(): Promise<void> { this.ready = true; }
  async shutdown(): Promise<void> { this.ready = false; }
  isReady(): boolean { return this.ready; }

  /** Register a new account on the given page.
   *
   * Steps:
   *   1. Navigate to /auth?mode=register
   *   2. Fill form (username, email, password, confirm)
   *   3. Check terms checkbox
   *   4. Submit
   *   5. Detect result (redirect or success indicator)
   *
   * Returns RegistrationResult. Does NOT close the page.
   */
  async register(page: any, email: string, password: string, qwenUrl: string): Promise<RegistrationResult> {
    const ts = new Date().toISOString();
    const t = timer();
    if (!this.isReady()) return { success: false, email, submitted: false, error: 'Service not ready', timestamp: ts };

    this.logger.debug(`Starting registration for ${email}`);
    await this.events.emit('registration:started', { email }, 'Registration');

    try {
      this.logger.debug(`Navigating to ${qwenUrl}/auth?mode=register`);
      await page.goto(`${qwenUrl}/auth?mode=register`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2500);

      this.logger.debug('Waiting for form inputs');
      await page.waitForSelector('input', { state: 'visible', timeout: 20000 });

      const urlBefore = page.url();
      const visibleInputs: any[] = [];
      for (const input of await page.$$('input')) {
        if (await input.isVisible()) {
          const type = (await input.getAttribute('type')) || 'text';
          if (type !== 'checkbox' && type !== 'hidden') visibleInputs.push(input);
        }
      }

      if (visibleInputs.length < 4) throw new Error(`Form has ${visibleInputs.length} inputs, need 4+`);

      this.logger.debug(`Filling form fields (found ${visibleInputs.length} inputs)`);
      await visibleInputs[0].fill(email.split('@')[0]);
      await visibleInputs[1].fill(email);
      await visibleInputs[2].fill(password);
      await visibleInputs[3].fill(password);

      const checkbox = await page.$('input[type="checkbox"]');
      if (checkbox && !(await checkbox.isChecked())) {
        this.logger.debug('Checking terms checkbox');
        await checkbox.click();
      }

      const submitBtn = await page.$('button[type="submit"]')
        || await page.$('button:has-text("Create"), button:has-text("Sign up"), button:has-text("Register"), button:has-text("Создать"), button:has-text("Зарегистрироваться")')
        || await page.$('form button');
      if (!submitBtn) throw new Error('Submit button not found');

      this.logger.debug('Submitting registration form');
      await submitBtn.click();
      const submitResult = await this.detectResult(page, urlBefore);

      const result: RegistrationResult = {
        success: submitResult.success,
        email, submitted: submitResult.success,
        message: submitResult.message, error: submitResult.error, timestamp: ts,
      };

      this.logger.timing('Registration process', t.stop());
      if (submitResult.success) {
        this.logger.success(`Registration successful for ${email}`);
        await this.events.emit('registration:completed', { email }, 'Registration');
      } else {
        this.logger.error(`Registration failed for ${email}: ${submitResult.error}`);
        await this.events.emit('registration:failed', { email, error: submitResult.error }, 'Registration');
      }

      return result;
    } catch (err: any) {
      const r: RegistrationResult = { success: false, email, submitted: false, error: err.message, timestamp: ts };
      await this.events.emit('registration:failed', { email, error: err.message }, 'Registration');
      return r;
    }
  }

  private async detectResult(page: any, urlBefore: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const maxWait = 10000;
    const start = Date.now();
    const indicators = ['check your email', 'проверьте почту', 'подтвердите', 'verify', 'verification', 'sent', 'отправлено', 'подтверждение'];
    const failures = ['captcha', 'rate limit', 'too many', 'blocked', 'invalid', 'ошибка', 'слишком много'];

    while (Date.now() - start < maxWait) {
      try {
        const now = page.url();
        const body = await page.evaluate(() => document.body?.innerText || '');
        const lower = `${now}\n${body}`.toLowerCase();
        for (const ind of indicators) { if (lower.includes(ind)) return { success: true, message: `Success indicator: ${ind}` }; }
        for (const fail of failures) { if (lower.includes(fail)) return { success: false, error: `Failure indicator: ${fail}` }; }

        const errEls = await page.$$('.text-red-500, .text-red-600, [class*="error"], [class*="Error"]');
        for (const el of errEls) { if (await el.isVisible()) return { success: false, error: 'Validation errors visible' }; }
        await page.waitForTimeout(500);
      } catch { await page.waitForTimeout(500); }
    }

    try {
      const body = await page.evaluate(() => document.body?.innerText || '');
      const lower = body.toLowerCase();
      if (lower.includes('check') || lower.includes('проверь') || lower.includes('sent') || lower.includes('отправ')) return { success: true, message: 'Late success' };
    } catch {}

    return { success: false, error: 'No confirmation after 10s' };
  }
}
