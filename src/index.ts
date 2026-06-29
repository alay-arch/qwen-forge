#!/usr/bin/env bun
/** Qwen Forge v0.1.0-beta — Minimal, professional CLI */

import { Lock } from './utils/lock.js';
import { ConfigManager } from './config/manager.js';
import { setLanguage, t } from './i18n.js';
import { Logger } from './utils/logger.js';
import { EventBus } from './utils/eventbus.js';
import { Storage } from './storage/json.js';
import { AccountService } from './services/account.js';
import { BrowserManager } from './browser/manager.js';
import { RegistrationService } from './services/registration.js';
import { LogoutService } from './services/logout.js';
import { SessionAccountsManager } from './services/session.js';
import { ConnectivityChecker } from './utils/network.js';
import { Server, registerRoutes } from './server/http.js';
import { Screen, divider, PALETTE, c, bold, dim } from './theme.js';
import { showMenu, closeReadline, readAnswer } from './cli/input.js';
import { createAccount } from './services/create.js';
import { batchCreate } from './services/batch.js';
import { showStats } from './services/stats.js';
import { runDoctor } from './diagnostics/doctor.js';
import type { AppConfig, Language } from './types.js';
import type { AppContext } from './context.js';
import { mkdir } from 'fs/promises';
import { sleep } from './cli/helpers.js';
import { initRuntime, isDebug } from './utils/runtime.js';
import { saveCrashReport } from './utils/crash.js';

let isShuttingDown = false;
let context: AppContext | null = null;
let lock: Lock | null = null;
const screen = new Screen();

// ── Help ─────────────────────────────────────────────────────────────

function printHelp(): void {
  const v = '0.1.0-beta';
  console.log(`
 Qwen Forge v${v}

 Usage:
   qf                     Запуск интерактивного меню
   qf --debug             Запуск с расширенным логированием (TRACE)
   qf --help              Показать эту справку
   qf --version           Показать версию

 Description:
   Автоматическая регистрация аккаунтов Qwen (chat.qwen.ai)
   с поддержкой одноразовой почты CatchMail.

 Flags:
   --debug         Режим отладки (логи уровня TRACE + вывод в консоль)
   --help, -h      Показать справку
   --version, -v   Показать версию

 Documentation:
   README.md  —  Русский
   README.en.md  —  English
`);
}

// ── Bootstrap ────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  // Handle --help / -h / --version / -v before anything else
  const rawArgs = process.argv.slice(2);
  if (rawArgs.includes('--help') || rawArgs.includes('-h')) {
    printHelp();
    return;
  }
  if (rawArgs.includes('--version') || rawArgs.includes('-v')) {
    console.log('0.1.0-beta');
    return;
  }

  initRuntime();

  if (isDebug()) {
    console.log(c(PALETTE.PRIMARY, '[DEBUG MODE ENABLED]'));
  }

  lock = new Lock();
  const locked = await lock.acquire();
  if (!locked) {
    console.error(`\n ${c(PALETTE.ERROR, `${'✗'} ${t('errors.lock_failed')}`)}\n`);
    process.exit(1);
  }

  const configManager = new ConfigManager();
  let config = await configManager.load();

  if (config.cli.firstRun) {
    await sleep(2000);
    config = await firstRunWizard(configManager);
  }

  setLanguage(config.cli.language);
  const logger = new Logger({
    file: config.logger.file,
    mode: 'silent',
    level: isDebug() ? 'TRACE' : 'INFO',
  });

  await mkdir(config.storage.dir, { recursive: true }).catch(() => {});
  await mkdir('logs', { recursive: true }).catch(() => {});

  const eventBus = new EventBus();
  const storage = new Storage(config.storage.dir);
  await storage.init();
  const accountService = new AccountService(storage, logger);

  const connectivity = new ConnectivityChecker(logger);
  const conn = await connectivity.checkWithRetry(config.qwen.baseUrl, config.mail.apiUrl, 3);

  if (!conn.internet || !conn.dns) {
    console.error(`\n ${c(PALETTE.ERROR, `${'✗'} ${t('errors.no_internet')}`)}\n`);
    await cleanup(); process.exit(1);
  }

  if (!conn.qwen) console.error(`\n ${c(PALETTE.WARNING, `${'⚠'} ${t('connectivity.qwen_unavailable')}`)}\n`);
  if (!conn.mailApi) console.error(`\n ${c(PALETTE.WARNING, `${'⚠'} ${t('connectivity.mail_unavailable')}`)}\n`);

  // Lazy init — browser is NOT started
  const browserManager = new BrowserManager(logger, eventBus);
  await browserManager.init({
    headless: false, humanize: true, geoip: true,
    userDataDir: config.browser.profileDir,
    args: [
      '--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox',
      '--disable-popup-blocking', '--mute-audio', '--no-first-run',
      '--disable-background-networking', '--disable-default-apps',
      '--disable-sync', '--disable-translate', '--metrics-recording-only',
      '--disable-blink-features=AutomationControlled',
    ],
    timeout: config.browser.timeout,
  });

  const registrationService = new RegistrationService(logger, eventBus);
  await registrationService.init();

  const logoutService = new LogoutService(logger, eventBus, browserManager);
  await logoutService.init();

  const httpServer = new Server(logger, eventBus, config.server.port, 'localhost');
  registerRoutes(httpServer, browserManager, registrationService, logoutService, config);
  await httpServer.start();

  const sessionAccountsManager = new SessionAccountsManager();

  context = {
    config, configManager, logger, eventBus, storage,
    browserManager, registrationService, logoutService,
    accountService, httpServer, sessionAccountsManager,
  };

  showDashboard(context);
  await cliLoop(context);
}

// ── First Run Wizard ────────────────────────────────────────────────

async function firstRunWizard(configManager: ConfigManager): Promise<AppConfig> {
  let lang: Language = 'ru';

  while (true) {
    screen.clear();
    process.stdout.write(` ${bold(t('wizard.welcome'))}`);
    process.stdout.write(`\n${divider()}\n`);
    process.stdout.write(` ${dim(t('wizard.select_language'))}\n\n`);
    process.stdout.write(` ${c(PALETTE.PRIMARY, '1')}  English\n`);
    process.stdout.write(` ${c(PALETTE.PRIMARY, '2')}  Русский\n`);
    process.stdout.write(`\n${divider()}\n`);
    const ans = (await readAnswer(` ${c(PALETTE.PRIMARY, '❯')} `)).toLowerCase();
    if (ans === '1' || ans === 'en' || ans === 'english') { lang = 'en'; break; }
    if (ans === '2' || ans === 'ru' || ans === 'русский') { lang = 'ru'; break; }
  }

  setLanguage(lang);
  const config = configManager.get();
  config.cli.language = lang;
  config.cli.firstRun = false;
  await configManager.save(config);

  screen.clear();
  process.stdout.write(` ${c(PALETTE.SUCCESS, `${'✓'} ${t('wizard.config_saved')}`)}\n`);
  await sleep(1000);

  return configManager.get();
}

// ── Dashboard ───────────────────────────────────────────────────────

function showDashboard(ctx: AppContext): void {
  const { config, httpServer, browserManager } = ctx;
  const srv = httpServer.isRunning() ? c(PALETTE.SUCCESS, 'OK') : c(PALETTE.ERROR, 'OFF');
  const brw = browserManager.isRunning() ? c(PALETTE.SUCCESS, 'OK') : c(PALETTE.PRIMARY, 'Idle');
  const lang = config.cli.language === 'ru' ? t('lang.russian') : t('lang.english');

  screen.clear();
  console.log(` ${bold(t('title'))}  ${dim('v' + config.version)}`);
  console.log(divider());
  console.log(` ${dim('Browser')}    ${brw}`);
  console.log(` ${dim('Server')}     ${srv}`);
  console.log(` ${dim('Language')}   ${c(PALETTE.PRIMARY, lang)}`);
  console.log(divider());
  console.log();
}

// ── CLI Loop ─────────────────────────────────────────────────────────

async function cliLoop(ctx: AppContext): Promise<void> {
  let exitAfterSuccess = false;

  while (true) {
    const items = [
      { key: '1', label: t('menu.create'), action: async () => {
        const ok = await createAccount(ctx);
        if (ok) exitAfterSuccess = true;
      } },
      { key: '2', label: t('menu.batch'), action: async () => { await batchCreate(ctx); } },
      { key: '3', label: t('menu.session'), action: async () => { await ctx.sessionAccountsManager.displayScreen(); } },
      { key: '4', label: t('menu.stats'), action: async () => { await showStats(ctx); } },
      { key: '5', label: t('menu.doctor'), action: async () => { await runDoctor(ctx); } },
      { key: '6', label: t('menu.config'), action: async () => { await ConfigManager.displayScreen(ctx.configManager); } },
      { key: '0', label: t('menu.exit'), action: async () => { exitAfterSuccess = true; } },
    ];
    await showMenu(items);
    if (exitAfterSuccess) {
      await shutdown();
      return;
    }
  }
}

// ── Shutdown / Cleanup ───────────────────────────────────────────────

async function shutdown(): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  if (isDebug()) {
    console.log(c(PALETTE.PRIMARY, '\n[Graceful shutdown started]'));
  }

  const shutdownTimeout = setTimeout(() => {
    console.error(c(PALETTE.WARNING, '\n⚠ Shutdown timeout - forcing exit'));
    process.exit(1);
  }, 10000); // 10 second timeout

  try {
    if (context) {
      // Stop HTTP server
      if (context.httpServer.isRunning()) {
        if (isDebug()) console.log(c(PALETTE.PRIMARY, '[Stopping HTTP server...]'));
        await context.httpServer.stop();
      }

      // Stop browser
      if (context.browserManager.isRunning()) {
        if (isDebug()) console.log(c(PALETTE.PRIMARY, '[Stopping browser...]'));
        await context.browserManager.stop();
      }

      // Close storage (save pending writes)
      if (isDebug()) console.log(c(PALETTE.PRIMARY, '[Closing storage...]'));
      await context.storage.close();

      // Shutdown services
      if (isDebug()) console.log(c(PALETTE.PRIMARY, '[Shutting down services...]'));
      await context.registrationService.shutdown();
      await context.logoutService.shutdown();
    }

    // Release lock file
    if (lock) {
      if (isDebug()) console.log(c(PALETTE.PRIMARY, '[Releasing lock file...]'));
      await lock.release();
    }

    // Close readline
    closeReadline();

    clearTimeout(shutdownTimeout);
    console.log(`\n ${c(PALETTE.SUCCESS, `${'✓'} ${t('messages.goodbye')}`)}\n`);
  } catch (err: any) {
    clearTimeout(shutdownTimeout);
    console.error(c(PALETTE.ERROR, `\nShutdown error: ${err.message}`));
  }
}

async function cleanup(): Promise<void> {
  try {
    if (lock) await lock.release();
  } catch {}
}

process.on('SIGINT', async () => { console.log(); await shutdown(); process.exit(0); });
process.on('SIGTERM', async () => { await shutdown(); process.exit(0); });
process.on('uncaughtException', async (err) => {
  console.error(`\n ${c(PALETTE.ERROR, `${'✗'} ${err.message}`)}\n`);
  await saveCrashReport(err, 'uncaughtException');
  await cleanup(); process.exit(1);
});
process.on('unhandledRejection', async (reason: any) => {
  const err = reason instanceof Error ? reason : new Error(String(reason?.message || reason));
  console.error(`\n ${c(PALETTE.ERROR, `${'✗'} ${err.message}`)}\n`);
  await saveCrashReport(err, 'unhandledRejection');
  await cleanup(); process.exit(1);
});

bootstrap().catch(async (err) => {
  console.error(`\n ${c(PALETTE.ERROR, `${'✗'} ${err.message}`)}\n`);
  await saveCrashReport(err, 'bootstrap');
  await cleanup(); process.exit(1);
});
