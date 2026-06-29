/** Single account creation — state machine orchestrator.
 *
 * Lifecycle (strictly sequential, no overlap):
 *   IDLE → ENSURE_CLEAN → REGISTER → CONFIRM → WAIT_MAIL → ACTIVATE
 *   → CLEANUP_LOGOUT → IDLE
 *
 * After EVERY outcome (success, failure, cancel, timeout) the page
 * MUST end up on /auth?mode=register with the registration form visible.
 * The next account starts from a clean slate without reopening the browser.
 */
import type { AppContext } from '../context.js';
import { Screen, divider, PALETTE, c, bold, dim, Spinner, kv } from '../theme.js';
import { t } from '../i18n.js';
import { generateEmail, generatePassword, waitForMail, activateAccount } from '../mail/service.js';
import { formatTime, checkForEsc, showCancelPrompt, readKey } from '../cli/helpers.js';
import { readAnswer } from '../cli/input.js';

const screen = new Screen();

/** Ensure browser is in clean registration state.
 * Checks that page is on /auth?mode=register and form is visible.
 * If not, attempts to navigate and verify.
 */
async function ensureCleanState(page: any, qwenUrl: string, logger: any): Promise<boolean> {
  try {
    const currentUrl = page.url();
    const isOnRegisterPage = /auth\?mode=register/.test(currentUrl);

    if (isOnRegisterPage) {
      try {
        await page.waitForSelector('form', { state: 'visible', timeout: 5000 });
        logger.info('Browser is in clean state — registration form visible');
        return true;
      } catch {
        logger.warn('On registration page but form not visible');
      }
    }

    // Not in clean state — navigate to registration page
    logger.info(`Navigating to clean state: ${qwenUrl}/auth?mode=register`);
    await page.goto(`${qwenUrl}/auth?mode=register`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForURL(/auth\?mode=register/, { timeout: 10000 });

    try {
      await page.waitForSelector('form', { state: 'visible', timeout: 10000 });
      logger.success('Clean state restored — registration form visible');
      return true;
    } catch {
      logger.error('Failed to restore clean state — form not visible');
      return false;
    }
  } catch (err: any) {
    logger.error('ensureCleanState failed', { error: err.message });
    return false;
  }
}

/** Attempt to recover from a broken page state by performing logout first. */
async function recoverCleanState(page: any, qwenUrl: string, logoutService: any, logger: any): Promise<boolean> {
  logger.warn('Attempting to recover clean state via logout');
  try {
    const result = await logoutService.logout(page, qwenUrl);
    if (result.success) return true;
    // One more try
    logger.warn('First recovery attempt failed, retrying');
    const result2 = await logoutService.logout(page, qwenUrl);
    return result2.success;
  } catch (err: any) {
    logger.error('Recovery failed', { error: err.message });
    return false;
  }
}

export async function createAccount(ctx: AppContext): Promise<boolean> {
  const startTime = Date.now();
  const { config, browserManager, registrationService, logoutService, accountService, sessionAccountsManager } = ctx;

  const email = generateEmail(config.mail.domain);
  const password = generatePassword(16);

  sessionAccountsManager.add({
    email, password, status: 'SUBMIT_FAILED',
    createdAt: new Date().toISOString(),
  });

  // Show account info
  screen.clear();
  const card: string[] = [
    ` ${bold(t('create.starting'))}`,
    '',
    divider(),
    '',
    kv(t('create.email'), email),
    kv(t('create.password'), password),
  ];
  process.stdout.write(card.join('\n') + '\n');

  // ── State machine ───────────────────────────────────────────────
  let activated = false;
  let regSubmitted = false;
  let regError: string | undefined;
  let cancelled = false;
  let page: any = null;
  let logoutSuccess = true;

  try {
    // ── State 1: GET_SHARED_PAGE ─────────────────────────────────
    page = await browserManager.getSharedPage();

    // ── State 2: ENSURE_CLEAN_STATE ───────────────────────────────
    // Before starting any registration, verify the page is showing
    // the registration form. If not, attempt to recover via logout.
    let clean = await ensureCleanState(page, config.qwen.baseUrl, ctx.logger);
    if (!clean) {
      ctx.logger.warn('Page is not in clean state — attempting recovery');
      clean = await recoverCleanState(page, config.qwen.baseUrl, logoutService, ctx.logger);
      if (!clean) {
        throw new Error('Cannot restore clean registration state — page is broken');
      }
    }

    // ── State 3: REGISTER ────────────────────────────────────────
    const regSpinner = new Spinner();
    regSpinner.start(t('create.starting'));

    // Check for ESC before starting registration
    if (await checkForEsc(100)) {
      cancelled = await showCancelPrompt(t('cancel.title'));
      if (cancelled) {
        regSpinner.stop();
        process.stdout.write(`\r ${c(PALETTE.WARNING, `${'⚠'} ${t('cancel.cancelled')}`)}\n`);
        return false;
      }
    }

    const regResult = await registrationService.register(page, email, password, config.qwen.baseUrl);
    regSpinner.stop();
    regSubmitted = regResult.submitted;

    if (!regResult.submitted) {
      regError = regResult.error;
      process.stdout.write(`\r ${c(PALETTE.ERROR, `${'✗'} ${t('errors.submit_failed')}`)}\n`);
      return false;
    }

    // ── State 4: CONFIRMATION ────────────────────────────────────
    process.stdout.write(`\n`);
    const confirmed = await askConfirmation(email, startTime);

    if (!confirmed) {
      return false;
    }

    // ── State 5: WAIT_MAIL ───────────────────────────────────────
    screen.clear();
    process.stdout.write(` ${bold(t('create.waiting_email'))}\n\n`);
    process.stdout.write(kv(t('create.email'), email) + '\n');

    const mailSpinner = new Spinner();
    mailSpinner.start(t('create.waiting_email'));
    const mailResult = await waitForMail(config.mail.apiUrl, email, config.mail.timeout * 1000);
    mailSpinner.stop();

    if (!mailResult.link) {
      process.stdout.write(`\r ${c(PALETTE.ERROR, `${'✗'} ${t('errors.no_mail')}`)}\n`);
      return false;
    }

    // ── State 6: ACTIVATE ────────────────────────────────────────
    const actSpinner = new Spinner();
    actSpinner.start(t('create.activating'));
    activated = await activateAccount(mailResult.link);
    actSpinner.stop();

    return activated;
  } catch (err: any) {
    regError = err.message;
    return false;
  } finally {

    // ── State 7: CLEANUP_LOGOUT (ALWAYS runs) ────────────────────
    // After ANY outcome, ensure the page is back on the registration form
    // so the next cycle starts clean. This is the single most important
    // invariant of the application.
    if (page) {
      try {
        ctx.logger.info('Running cleanup logout');
        const logoutSpinner = new Spinner();
        logoutSpinner.start(t('create.done'));

        const result = await logoutService.logout(page, config.qwen.baseUrl);
        logoutSuccess = result.success;

        if (!logoutSuccess) {
          ctx.logger.warn('Cleanup logout did not fully succeed — retrying once');
          // Try once more to recover
          const result2 = await logoutService.logout(page, config.qwen.baseUrl);
          logoutSuccess = result2.success;
        }

        logoutSpinner.stop();
        if (logoutSuccess) {
          ctx.logger.success('Cleanup logout completed successfully');
        } else {
          ctx.logger.error('Cleanup logout failed — page may be in broken state');
        }
      } catch (err: any) {
        logoutSuccess = false;
        ctx.logger.error('Cleanup logout threw exception', { error: err.message });
      }
    } else {
      ctx.logger.warn('No page reference available for cleanup logout');
      logoutSuccess = false;
    }

    // ── Record result ─────────────────────────────────────────────
    const duration = Date.now() - startTime;

    if (cancelled) {
      sessionAccountsManager.updateLast('SUBMIT_FAILED', 'Cancelled', duration);
      await accountService.createFromResult(email, password, false, 'SUBMIT_FAILED');
      await showResult({ success: false, email, password, time: formatTime(duration), error: t('cancel.cancelled') });
    } else if (!regSubmitted) {
      sessionAccountsManager.updateLast('SUBMIT_FAILED', regError, duration);
      await accountService.createFromResult(email, password, false, 'SUBMIT_FAILED');
      await showResult({ success: false, email, password, time: formatTime(duration), error: regError || t('errors.submit_failed') });
    } else if (activated && logoutSuccess) {
      // Full success: account activated AND session cleaned up
      sessionAccountsManager.updateLast('SUCCESS', undefined, duration);
      await accountService.createFromResult(email, password, true);
      await showResult({ success: true, email, password, time: formatTime(duration) });
    } else if (activated && !logoutSuccess) {
      // Account was activated but logout failed — page is in broken state
      sessionAccountsManager.updateLast('LOGOUT_FAILED', 'Cleanup logout failed after activation', duration);
      await accountService.createFromResult(email, password, false, 'LOGOUT_FAILED');
      await showResult({
        success: false, email, password, time: formatTime(duration),
        error: t('errors.activation_failed') + ' (logout failed)',
      });
    } else {
      const reason = regError ? 'SUBMIT_FAILED' : 'ACTIVATION_FAILED';
      sessionAccountsManager.updateLast(reason, regError || undefined, duration);
      await accountService.createFromResult(email, password, false, reason);
      await showResult({ success: false, email, password, time: formatTime(duration), error: t('errors.activation_failed') });
    }
  }
}

async function showResult(opts: {
  success: boolean; email: string; password: string; time: string;
  error?: string;
}): Promise<void> {
  screen.clear();
  const out: string[] = [''];
  if (opts.success) out.push(` ${c(PALETTE.SUCCESS, `${'✓'} ${bold(t('create.account_created'))}`)}`);
  else out.push(` ${c(PALETTE.ERROR, `${'✗'} ${bold(t('create.account_failed'))}`)}`);
  out.push('');
  out.push(divider());
  out.push('');
  out.push(kv(t('create.email'), opts.email));
  out.push(kv(t('create.password'), opts.password));
  out.push(kv(t('create.time'), opts.time));
  if (opts.error) { out.push(''); out.push(` ${dim(opts.error)}`); }
  out.push('');
  out.push(divider());
  out.push(` ${dim('[ENTER] →')}`);
  out.push('');
  process.stdout.write(out.join('\n'));
  await readAnswer();
}

async function askConfirmation(email: string, startTime: number): Promise<boolean> {
  let errMsg: string | undefined;
  while (true) {
    screen.clear();
    const out: string[] = [''];
    out.push(` ${bold(t('create.confirmation_title'))}`);
    out.push('');
    out.push(divider());
    out.push('');
    out.push(` ${dim(t('create.confirmation_desc'))}`);
    out.push(` ${dim(t('create.confirmation_skip'))}`);
    out.push('');
    out.push(kv(t('create.email'), email));
    out.push(kv('Time', formatTime(Date.now() - startTime)));
    if (errMsg) { out.push(''); out.push(` ${c(PALETTE.ERROR, errMsg)}`); }
    out.push('');
    out.push(divider());
    out.push('');
    out.push(` ${c(PALETTE.PRIMARY, '[ENTER]')} ${t('create.continue_label')}  ·  ${c(PALETTE.PRIMARY, 's')} ${t('create.skip_label')}  ·  ${c(PALETTE.WARNING, 'ESC')} ${t('cancel.title')}`);
    out.push('');
    process.stdout.write(out.join('\n'));

    const key = await readKey(` ${c(PALETTE.PRIMARY, '❯')} `);

    if (key === 'enter' || key === 'y') return true;
    if (key === 's' || key === 'n') return false;
    if (key === 'escape') {
      const cancelled = await showCancelPrompt(t('cancel.title'));
      if (cancelled) return false;
      continue;
    }
    errMsg = t('create.invalid_choice');
  }
}
