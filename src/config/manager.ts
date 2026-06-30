/** Config manager — schema, load, save, validate, migrate */
import { readFile, writeFile, rename } from 'fs/promises';
import type { AppConfig, Language } from '../types.js';
import { Screen, divider, PALETTE, c, bold, dim } from '../theme.js';
import { t, setLanguage } from '../i18n.js';
import { readAnswer, confirmAction } from '../cli/input.js';

const screen = new Screen();

export const DEFAULT_CONFIG: AppConfig = {
  version: '0.1.1-beta',
  server: { port: 3030 },
  browser: { profileDir: '.browser-profile', timeout: 30000 },
  mail: { apiUrl: 'https://api.catchmail.io/api/v1', domain: 'catchmail.io', timeout: 180 },
  qwen: { baseUrl: 'https://chat.qwen.ai' },
  storage: { dir: 'data' },
  logger: { file: 'logs/app.log' },
  cli: { language: 'ru', firstRun: true },
};

export function validate(cfg: any): { valid: boolean; errors: string[] } {
  const e: string[] = [];
  if (!cfg.version) e.push('Missing version');
  if (cfg.server?.port === undefined || cfg.server?.port === null) e.push('Missing server.port');
  else if (typeof cfg.server.port !== 'number' || !Number.isInteger(cfg.server.port) || cfg.server.port < 1 || cfg.server.port > 65535) e.push(`server.port must be integer 1-65535, got ${cfg.server.port}`);
  if (!cfg.browser?.profileDir || typeof cfg.browser.profileDir !== 'string' || cfg.browser.profileDir.trim() === '') e.push('Missing or empty browser.profileDir');
  if (cfg.browser?.timeout === undefined || cfg.browser?.timeout === null) e.push('Missing browser.timeout');
  else if (typeof cfg.browser.timeout !== 'number' || cfg.browser.timeout < 1000) e.push(`browser.timeout must be >= 1000ms, got ${cfg.browser.timeout}`);
  if (!cfg.mail?.apiUrl || typeof cfg.mail.apiUrl !== 'string' || cfg.mail.apiUrl.trim() === '') e.push('Missing or empty mail.apiUrl');
  if (!cfg.mail?.domain || typeof cfg.mail.domain !== 'string' || cfg.mail.domain.trim() === '') e.push('Missing or empty mail.domain');
  if (cfg.mail?.timeout === undefined || cfg.mail?.timeout === null) e.push('Missing mail.timeout');
  else if (typeof cfg.mail.timeout !== 'number' || cfg.mail.timeout < 10) e.push(`mail.timeout must be >= 10s, got ${cfg.mail.timeout}`);
  if (!cfg.qwen?.baseUrl || typeof cfg.qwen.baseUrl !== 'string' || cfg.qwen.baseUrl.trim() === '') e.push('Missing or empty qwen.baseUrl');
  if (!cfg.storage?.dir || typeof cfg.storage.dir !== 'string' || cfg.storage.dir.trim() === '') e.push('Missing or empty storage.dir');
  if (!cfg.logger?.file || typeof cfg.logger.file !== 'string' || cfg.logger.file.trim() === '') e.push('Missing or empty logger.file');
  const langs: Language[] = ['ru', 'en'];
  if (cfg.cli?.language && !langs.includes(cfg.cli.language)) e.push(`Invalid language: ${cfg.cli.language}`);
  const allowed = ['version', 'server', 'browser', 'mail', 'qwen', 'storage', 'logger', 'cli'];
  for (const key of Object.keys(cfg)) {
    if (!allowed.includes(key)) e.push(`Unknown field: ${key}`);
  }
  return { valid: e.length === 0, errors: e };
}

/** Auto-fix invalid config values to defaults, returns list of fixes applied */
export function autoFix(cfg: any): string[] {
  const fixes: string[] = [];
  if (!cfg.version) { cfg.version = DEFAULT_CONFIG.version; fixes.push('version → 1.0.0'); }
  if (cfg.server?.port === undefined || cfg.server?.port === null || typeof cfg.server.port !== 'number' || !Number.isInteger(cfg.server.port) || cfg.server.port < 1 || cfg.server.port > 65535) {
    cfg.server = cfg.server || {}; cfg.server.port = DEFAULT_CONFIG.server.port; fixes.push('server.port → 3030');
  }
  if (!cfg.browser?.profileDir || typeof cfg.browser.profileDir !== 'string' || cfg.browser.profileDir.trim() === '') {
    cfg.browser = cfg.browser || {}; cfg.browser.profileDir = DEFAULT_CONFIG.browser.profileDir; fixes.push('browser.profileDir → .browser-profile');
  }
  if (cfg.browser?.timeout === undefined || cfg.browser?.timeout === null || typeof cfg.browser.timeout !== 'number' || cfg.browser.timeout < 1000) {
    cfg.browser = cfg.browser || {}; cfg.browser.timeout = DEFAULT_CONFIG.browser.timeout; fixes.push('browser.timeout → 30000');
  }
  if (!cfg.mail?.apiUrl || typeof cfg.mail.apiUrl !== 'string' || cfg.mail.apiUrl.trim() === '') {
    cfg.mail = cfg.mail || {}; cfg.mail.apiUrl = DEFAULT_CONFIG.mail.apiUrl; fixes.push('mail.apiUrl → default');
  }
  if (!cfg.mail?.domain || typeof cfg.mail.domain !== 'string' || cfg.mail.domain.trim() === '') {
    cfg.mail = cfg.mail || {}; cfg.mail.domain = DEFAULT_CONFIG.mail.domain; fixes.push('mail.domain → catchmail.io');
  }
  if (cfg.mail?.timeout === undefined || cfg.mail?.timeout === null || typeof cfg.mail.timeout !== 'number' || cfg.mail.timeout < 10) {
    cfg.mail = cfg.mail || {}; cfg.mail.timeout = DEFAULT_CONFIG.mail.timeout; fixes.push('mail.timeout → 180');
  }
  if (!cfg.qwen?.baseUrl || typeof cfg.qwen.baseUrl !== 'string' || cfg.qwen.baseUrl.trim() === '') {
    cfg.qwen = cfg.qwen || {}; cfg.qwen.baseUrl = DEFAULT_CONFIG.qwen.baseUrl; fixes.push('qwen.baseUrl → default');
  }
  if (!cfg.storage?.dir || typeof cfg.storage.dir !== 'string' || cfg.storage.dir.trim() === '') {
    cfg.storage = cfg.storage || {}; cfg.storage.dir = DEFAULT_CONFIG.storage.dir; fixes.push('storage.dir → data');
  }
  if (!cfg.logger?.file || typeof cfg.logger.file !== 'string' || cfg.logger.file.trim() === '') {
    cfg.logger = cfg.logger || {}; cfg.logger.file = DEFAULT_CONFIG.logger.file; fixes.push('logger.file → logs/app.log');
  }
  const langs: Language[] = ['ru', 'en'];
  if (cfg.cli?.language && !langs.includes(cfg.cli.language)) {
    cfg.cli = cfg.cli || {}; cfg.cli.language = DEFAULT_CONFIG.cli.language; fixes.push('cli.language → ru');
  }
  const allowed = ['version', 'server', 'browser', 'mail', 'qwen', 'storage', 'logger', 'cli'];
  for (const key of Object.keys(cfg)) {
    if (!allowed.includes(key)) { delete cfg[key]; fixes.push(`removed unknown field: ${key}`); }
  }
  return fixes;
}

const MIGRATIONS: { from: string; to: string; migrate: (c: any) => any }[] = [
  {
    from: '0.0.0',
    to: '1.0.0',
    migrate: (c: any) => ({
      ...c,
      version: '1.0.0',
      server: c.server || { port: 3030 },
      browser: c.browser || { profileDir: '.browser-profile', timeout: 30000 },
      mail: c.mail || { apiUrl: 'https://api.catchmail.io/api/v1', domain: 'catchmail.io', timeout: 180 },
      qwen: c.qwen || { baseUrl: 'https://chat.qwen.ai' },
      storage: c.storage || { dir: 'data' },
      logger: c.logger || { file: 'logs/app.log' },
      cli: c.cli || { language: 'ru', firstRun: false },
    }),
  },
];

function getMigrations(from: string, to: string) {
  const cmp = (a: string, b: string) => {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) { if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0); }
    return 0;
  };
  return MIGRATIONS.filter(m => cmp(m.from, from) >= 0 && cmp(m.to, to) <= 0);
}

export class ConfigManager {
  private path: string;
  private config: AppConfig;

  constructor(path = 'config.json') {
    this.path = path;
    this.config = { ...DEFAULT_CONFIG };
  }

  async load(): Promise<AppConfig> {
    try {
      const content = await readFile(this.path, 'utf-8');
      const parsed = JSON.parse(content);
      const v = validate(parsed);
      if (!v.valid) {
        const fixes = autoFix(parsed);
        if (fixes.length > 0) {
          console.warn(` ${'⚠'} Config auto-fixed: ${fixes.join(', ')}`);
          await this.save(parsed as AppConfig);
        }
      }
      if (parsed.version !== DEFAULT_CONFIG.version) {
        const migrated = await this.runMigrations(parsed);
        this.config = { ...DEFAULT_CONFIG, ...migrated };
      } else {
        this.config = { ...DEFAULT_CONFIG, ...parsed };
      }
      return this.config;
    } catch (err: any) {
      if (err?.code === 'ENOENT') await this.save(DEFAULT_CONFIG);
      this.config = { ...DEFAULT_CONFIG };
      return this.config;
    }
  }

  private async runMigrations(current: any): Promise<any> {
    const migrations = getMigrations(current.version || '0.0.0', DEFAULT_CONFIG.version);
    let cfg = { ...current };
    for (const m of migrations) cfg = m.migrate(cfg);
    cfg.version = DEFAULT_CONFIG.version;
    const val = validate(cfg);
    if (!val.valid) return DEFAULT_CONFIG;
    await this.save(cfg as AppConfig);
    return cfg;
  }

  async save(config: AppConfig): Promise<void> {
    const v = validate(config);
    if (!v.valid) throw new Error(`Invalid config: ${v.errors.join(', ')}`);
    const tmp = `${this.path}.tmp`;
    await writeFile(tmp, JSON.stringify(config, null, 2), 'utf-8');
    await rename(tmp, this.path);
    this.config = config;
  }

  get(): AppConfig { return { ...this.config }; }

  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.config[key] = value;
  }

  async persist(): Promise<void> {
    await this.save(this.config);
  }

  async reset(): Promise<void> {
    this.config = { ...DEFAULT_CONFIG };
    await this.save(this.config);
  }

  /** Display config summary */
  static async displayScreen(manager: ConfigManager): Promise<void> {
    const cfg = manager.get();
    const langLabel = cfg.cli.language === 'ru' ? t('lang.russian') : t('lang.english');

    screen.clear();
    const out: string[] = [''];
    out.push(` ${bold(t('config.title'))}`);
    out.push('');
    out.push(divider());
    out.push('');
    out.push(kv(t('config.language'), c(PALETTE.PRIMARY, langLabel)));
    out.push(kv(t('config.port'), String(cfg.server.port)));
    out.push(kv(t('config.profile'), cfg.browser.profileDir));
    out.push(kv(t('config.timeout'), `${cfg.browser.timeout}ms`));
    out.push(kv(t('config.mail_timeout'), `${cfg.mail.timeout}s`));
    out.push('');
    out.push(divider());
    out.push('');
    out.push(` ${c(PALETTE.PRIMARY, '1')}  ${t('config.edit')}`);
    out.push(` ${c(PALETTE.PRIMARY, '2')}  ${t('config.reset')}`);
    out.push(` ${c(PALETTE.PRIMARY, '0')}  ${t('options.back')}`);
    out.push('');
    out.push(divider());
    out.push('');
    process.stdout.write(out.join('\n'));

    const choice = (await readAnswer(` ${c(PALETTE.PRIMARY, '❯')} `)).trim();
    if (choice === '') return;
    if (choice === '1') await ConfigManager.editScreen(manager);
    else if (choice === '2') {
      const ok = await confirmAction(t('config.reset_confirm'));
      if (ok) { manager.reset(); process.stdout.write(`\n ${c(PALETTE.SUCCESS, `${'✓'} ${t('config.saved')}`)}\n`); }
    }
    await readAnswer(` ${dim('[ENTER] →')} `);
  }

  /** Edit configuration interactively */
  static async editScreen(manager: ConfigManager): Promise<void> {
    const cfg = manager.get();

    screen.clear();
    process.stdout.write(` ${c(PALETTE.WARNING, `${'⚠'} ${t('config.edit')}`)}\n\n`);

    const langAns = await readAnswer(` ${t('config.language_prompt')} ${c(PALETTE.PRIMARY, '❯')} `);
    if (langAns === '1') { cfg.cli.language = 'ru'; setLanguage('ru'); }
    else if (langAns === '2') { cfg.cli.language = 'en'; setLanguage('en'); }

    const portAns = await readAnswer(` ${t('config.port_prompt')} ${c(PALETTE.PRIMARY, '❯')} `);
    if (portAns && !isNaN(parseInt(portAns))) cfg.server.port = parseInt(portAns);

    const profAns = await readAnswer(` ${t('config.profile_prompt')} ${c(PALETTE.PRIMARY, '❯')} `);
    if (profAns) cfg.browser.profileDir = profAns;

    const toAns = await readAnswer(` ${t('config.timeout_prompt')} ${c(PALETTE.PRIMARY, '❯')} `);
    if (toAns && !isNaN(parseInt(toAns))) cfg.browser.timeout = parseInt(toAns);

    const mtAns = await readAnswer(` ${t('config.mail_timeout_prompt')} ${c(PALETTE.PRIMARY, '❯')} `);
    if (mtAns && !isNaN(parseInt(mtAns))) cfg.mail.timeout = parseInt(mtAns);

    await manager.save(cfg);
    process.stdout.write(`\n ${c(PALETTE.SUCCESS, `${'✓'} ${t('config.saved')}`)}\n`);
    await readAnswer(` ${dim('[ENTER] →')} `);
  }
}

function kv(key: string, value: string): string {
  return ` ${dim(key)}  ${value}`;
}
