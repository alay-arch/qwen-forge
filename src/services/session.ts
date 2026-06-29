/** Session accounts tracking */
import type { SessionAccount, AccountStatus } from '../types.js';
import { Screen, divider, PALETTE, c, bold, dim, ICONS } from '../theme.js';
import { t } from '../i18n.js';
import { readAnswer, confirmAction } from '../cli/input.js';

const screen = new Screen();

export class SessionAccountsManager {
  private accounts: SessionAccount[] = [];
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  add(account: SessionAccount): void {
    this.accounts.push(account);
  }

  updateLast(status: AccountStatus, error?: string, duration?: number): void {
    const last = this.accounts[this.accounts.length - 1];
    if (last) {
      last.status = status;
      if (error) last.error = error;
      if (duration !== undefined) last.duration = duration;
    }
  }

  getAll(): SessionAccount[] { return [...this.accounts]; }

  getSuccessCount(): number {
    return this.accounts.filter(a => a.status === 'SUCCESS').length;
  }

  getFailedCount(): number {
    return this.accounts.filter(a => a.status !== 'SUCCESS').length;
  }

  getSuccessRate(): number {
    return this.accounts.length > 0 ? (this.getSuccessCount() / this.accounts.length) * 100 : 0;
  }

  getAverageDuration(): number {
    const withDuration = this.accounts.filter(a => a.duration !== undefined);
    if (withDuration.length === 0) return 0;
    return withDuration.reduce((sum, a) => sum + (a.duration || 0), 0) / withDuration.length;
  }

  getUptime(): number { return Date.now() - this.startTime; }

  clear(): void {
    this.accounts = [];
    this.startTime = Date.now();
  }

  async displayScreen(): Promise<void> {
    screen.clear();
    const out: string[] = [];
    out.push(` ${bold(t('session.title'))}`);
    out.push('');
    out.push(divider());
    out.push('');

    const accounts = this.getAll();
    if (accounts.length === 0) {
      out.push(` ${dim(t('session.no_accounts'))}`);
    } else {
      for (const a of accounts) {
        const icon = a.status === 'SUCCESS' ? c(PALETTE.SUCCESS, ICONS.SUCCESS) : c(PALETTE.ERROR, ICONS.ERROR);
        const statusText = a.status === 'SUCCESS' ? c(PALETTE.SUCCESS, t('session.status_success')) : c(PALETTE.ERROR, a.status);
        const dur = a.duration ? dim(` (${(a.duration / 1000).toFixed(1)}s)`) : '';
        out.push(` ${icon} ${a.email} ${dim('|')} ${statusText}${dur}`);
        if (a.error) out.push(`   ${dim(a.error)}`);
      }
    }

    out.push('');
    out.push(divider());
    out.push(` ${c(PALETTE.SUCCESS, `${ICONS.SUCCESS} ${t('session.success')}:`)} ${bold(String(this.getSuccessCount()))}`);
    out.push(` ${c(PALETTE.ERROR, `${ICONS.ERROR} ${t('session.failed')}:`)} ${bold(String(this.getFailedCount()))}`);
    out.push(` ${dim(t('session.success_rate'))} ${bold(this.getSuccessRate().toFixed(1) + '%')}`);

    const avg = this.getAverageDuration();
    if (avg > 0) {
      const s = Math.floor(avg / 1000);
      out.push(` ${dim(t('session.avg_time'))} ${bold((s / 60).toFixed(0) + 'm ' + (s % 60).toFixed(0) + 's')}`);
    }

    const uptime = this.getUptime();
    const mins = Math.floor(uptime / 60000);
    const secs = Math.floor((uptime % 60000) / 1000);
    out.push(` ${dim(t('session.uptime'))} ${bold(`${mins}m ${secs}s`)}`);
    out.push('');
    out.push(divider());
    out.push(` ${c(PALETTE.PRIMARY, '1')}  ${t('session.clear')}`);
    out.push(` ${c(PALETTE.PRIMARY, '0')}  ${t('options.back')}`);
    out.push('');
    out.push(divider());
    out.push('');

    process.stdout.write(out.join('\n'));

    const answer = (await readAnswer(` ${c(PALETTE.PRIMARY, '❯')} `)).trim();
    if (answer === '') return;
    if (answer === '1') {
      const ok = await confirmAction(t('session.clear_confirm'));
      if (ok) {
        this.clear();
        process.stdout.write(`\n ${c(PALETTE.SUCCESS, `${ICONS.SUCCESS} ${t('session.cleared')}`)}\n`);
        await readAnswer(` ${dim('[ENTER] →')} `);
      }
    }
  }
}
