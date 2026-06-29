/** Diagnostics screen — comprehensive system checks */
import type { AppContext } from '../context.js';
import { Screen, divider, PALETTE, c, bold, dim, Spinner, ICONS } from '../theme.js';
import { t } from '../i18n.js';
import { ConnectivityChecker } from '../utils/network.js';
import { validate } from '../config/manager.js';
import { readAnswer } from '../cli/input.js';
import { existsSync, accessSync, constants, statfsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { platform, arch, release, totalmem, freemem } from 'os';

const execAsync = promisify(exec);
const screen = new Screen();

interface CheckResult {
  name: string;
  status: 'passed' | 'warning' | 'failed';
  detail?: string;
  recommendation?: string;
}

async function checkCommand(cmd: string): Promise<{ exists: boolean; version?: string }> {
  try {
    const { stdout } = await execAsync(`which ${cmd}`);
    if (!stdout.trim()) return { exists: false };
    try {
      const versionCmd = cmd === 'bun' ? 'bun --version' :
                         cmd === 'git' ? 'git --version' :
                         `${cmd} --version`;
      const { stdout: version } = await execAsync(versionCmd);
      return { exists: true, version: version.trim().split('\n')[0] };
    } catch {
      return { exists: true };
    }
  } catch {
    return { exists: false };
  }
}

async function getDiskSpace(path: string): Promise<{ total: number; free: number; used: number }> {
  try {
    const stats = statfsSync(path);
    const total = stats.blocks * stats.bsize;
    const free = stats.bfree * stats.bsize;
    const used = total - free;
    return { total, free, used };
  } catch {
    return { total: 0, free: 0, used: 0 };
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export async function runDoctor(ctx: AppContext): Promise<void> {
  const { config, browserManager, httpServer, logger } = ctx;

  screen.clear();
  process.stdout.write(` ${bold(t('doctor.title'))}\n`);
  process.stdout.write(` ${divider()}\n\n`);

  const results: CheckResult[] = [];
  const spinner = new Spinner();

  // 1. System Information
  spinner.start('Checking system...');
  const systemInfo = { platform: platform(), arch: arch(), kernel: release() };
  spinner.stop();
  results.push({ name: 'Platform', status: 'passed', detail: `${systemInfo.platform} ${systemInfo.arch} (${systemInfo.kernel})` });

  // 2. Bun
  spinner.start('Checking Bun...');
  const bunCheck = await checkCommand('bun');
  spinner.stop();
  results.push({ name: 'Bun', status: bunCheck.exists ? 'passed' : 'failed', detail: bunCheck.version, recommendation: bunCheck.exists ? undefined : 'Install Bun: https://bun.sh' });

  // 3. Git
  spinner.start('Checking Git...');
  const gitCheck = await checkCommand('git');
  spinner.stop();
  results.push({ name: 'Git', status: gitCheck.exists ? 'passed' : 'warning', detail: gitCheck.version, recommendation: gitCheck.exists ? undefined : 'Install Git for version control' });

  // 4. Internet + DNS
  spinner.start('Checking connectivity...');
  const checker = new ConnectivityChecker(logger);
  let conn;
  try {
    conn = await checker.check(config.qwen.baseUrl, config.mail.apiUrl);
  } catch {
    conn = { internet: false, dns: false, qwen: false, mailApi: false };
  }
  spinner.stop();
  results.push({ name: 'Internet', status: conn.internet ? 'passed' : 'failed', recommendation: conn.internet ? undefined : 'Check network connection' });
  results.push({ name: 'DNS', status: conn.dns ? 'passed' : 'failed', recommendation: conn.dns ? undefined : 'Check DNS settings' });

  // 5. HTTPS Endpoints
  results.push({ name: 'Qwen API', status: conn.qwen ? 'passed' : 'warning', detail: config.qwen.baseUrl, recommendation: conn.qwen ? undefined : 'Qwen service may be unavailable' });
  results.push({ name: 'CatchMail API', status: conn.mailApi ? 'passed' : 'warning', detail: config.mail.apiUrl, recommendation: conn.mailApi ? undefined : 'Mail service may be unavailable' });

  // 6. Configuration
  const configValidation = validate(config);
  results.push({ name: 'Configuration', status: configValidation.valid ? 'passed' : 'failed', detail: configValidation.valid ? 'config.json' : configValidation.errors.join(', '), recommendation: configValidation.valid ? undefined : 'Fix config.json or run config reset' });

  // 7. Storage Directory
  const storageExists = existsSync(config.storage.dir);
  let storageWritable = false;
  if (storageExists) {
    try { accessSync(config.storage.dir, constants.W_OK); storageWritable = true; } catch {}
  }
  results.push({ name: 'Storage Directory', status: storageExists && storageWritable ? 'passed' : 'failed', detail: config.storage.dir, recommendation: storageExists && storageWritable ? undefined : 'Check directory exists and is writable' });

  // 8. accounts.json
  const accountsFile = `${config.storage.dir}/accounts.json`;
  const accountsExists = existsSync(accountsFile);
  results.push({ name: 'accounts.json', status: accountsExists ? 'passed' : 'warning', detail: accountsExists ? accountsFile : 'Will be created on first use' });

  // 9. Browser Profile
  const profileExists = existsSync(config.browser.profileDir);
  results.push({ name: 'Browser Profile', status: profileExists ? 'passed' : 'warning', detail: config.browser.profileDir, recommendation: profileExists ? undefined : 'Will be created on first browser start' });

  // 10. HTTP Server
  results.push({ name: 'HTTP Server', status: httpServer.isRunning() ? 'passed' : 'warning', detail: httpServer.isRunning() ? `Running on port ${config.server.port}` : 'Not started' });

  // 11. Browser
  results.push({ name: 'Browser', status: browserManager.isRunning() ? 'passed' : 'warning', detail: browserManager.isRunning() ? 'Running' : 'Not started (lazy init)' });

  // 12. Disk Space
  spinner.start('Checking disk space...');
  const diskSpace = await getDiskSpace('.');
  spinner.stop();
  const diskUsedPercent = diskSpace.total > 0 ? (diskSpace.used / diskSpace.total) * 100 : 0;
  const diskStatus = diskUsedPercent > 95 ? 'failed' : diskUsedPercent > 85 ? 'warning' : 'passed';
  results.push({ name: 'Disk Space', status: diskStatus, detail: `${formatBytes(diskSpace.free)} free of ${formatBytes(diskSpace.total)} (${diskUsedPercent.toFixed(1)}% used)`, recommendation: diskStatus !== 'passed' ? 'Low disk space - consider cleaning up' : undefined });

  // 13. Memory
  const totalMem = totalmem();
  const freeMem = freemem();
  const usedMem = totalMem - freeMem;
  const memUsedPercent = (usedMem / totalMem) * 100;
  const memStatus = memUsedPercent > 95 ? 'warning' : 'passed';
  results.push({ name: 'Memory', status: memStatus, detail: `${formatBytes(freeMem)} free of ${formatBytes(totalMem)} (${memUsedPercent.toFixed(1)}% used)`, recommendation: memStatus !== 'passed' ? 'High memory usage' : undefined });

  // Display results
  for (const r of results) {
    let icon: string;
    let color: string;
    if (r.status === 'passed') { icon = ICONS.SUCCESS; color = PALETTE.SUCCESS; }
    else if (r.status === 'warning') { icon = ICONS.WARNING; color = PALETTE.WARNING; }
    else { icon = ICONS.ERROR; color = PALETTE.ERROR; }
    const detailStr = r.detail ? ` ${dim(`(${r.detail})`)}` : '';
    process.stdout.write(` ${c(color, icon)} ${r.name}${detailStr}\n`);
  }

  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const warnings = results.filter((r) => r.status === 'warning').length;

  process.stdout.write(`\n${divider()}\n`);
  process.stdout.write(` ${c(PALETTE.SUCCESS, `${ICONS.SUCCESS} Passed:`)} ${passed}`);
  if (warnings > 0) process.stdout.write(`  ${c(PALETTE.WARNING, `${ICONS.WARNING} Warnings:`)} ${warnings}`);
  if (failed > 0) process.stdout.write(`  ${c(PALETTE.ERROR, `${ICONS.ERROR} Failed:`)} ${failed}`);
  process.stdout.write('\n');

  const recs = results.filter((r) => r.recommendation);
  if (recs.length > 0) {
    process.stdout.write(`\n${bold('Recommendations:')}\n`);
    for (const r of recs) {
      process.stdout.write(` ${c(PALETTE.WARNING, ICONS.BULLET)} ${r.name}: ${dim(r.recommendation!)}\n`);
    }
  }

  const statusMsg = failed === 0 ? `${ICONS.SUCCESS} All critical checks passed` : `${ICONS.ERROR} ${failed} critical issue${failed > 1 ? 's' : ''} found`;
  process.stdout.write(`\n${c(failed === 0 ? PALETTE.SUCCESS : PALETTE.ERROR, statusMsg)}\n`);

  process.stdout.write(`\n${divider()}\n`);
  process.stdout.write(`\n${dim('[ENTER] →')}\n`);
  await readAnswer();
}
