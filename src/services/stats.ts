/** Statistics screen */
import type { AppContext } from '../context.js';
import { Screen, divider, PALETTE, c, bold, dim } from '../theme.js';
import { t } from '../i18n.js';
import { formatDate } from '../cli/helpers.js';
import { readAnswer } from '../cli/input.js';

const screen = new Screen();

export async function showStats(ctx: AppContext): Promise<void> {
  const { accountService, sessionAccountsManager } = ctx;
  const summary = await accountService.summary();
  const avgDuration = sessionAccountsManager.getAverageDuration();

  screen.clear();
  const out: string[] = [''];
  out.push(` ${bold(t('stats.title'))}`);
  out.push('');
  out.push(divider());

  if (summary.total === 0) {
    out.push('');
    out.push(` ${dim(t('stats.no_data'))}`);
  } else {
    out.push('');
    out.push(` ${dim(t('stats.total'))}  ${bold(String(summary.total))}`);
    out.push(` ${c(PALETTE.SUCCESS, t('stats.success'))}  ${bold(String(summary.success))}`);
    out.push(` ${c(PALETTE.ERROR, t('stats.failed'))}   ${bold(String(summary.failed))}`);
    out.push(` ${dim(t('stats.rate'))}  ${bold(summary.successRate.toFixed(1) + '%')}`);

    if (avgDuration > 0) {
      const s = Math.floor(avgDuration / 1000);
      const m = Math.floor(s / 60);
      out.push(` ${dim(t('stats.avg_time'))}  ${bold(`${m}:${String(s % 60).padStart(2, '0')}`)}`);
    }

    if (summary.lastCreated) {
      out.push(` ${dim(t('stats.last'))}  ${formatDate(summary.lastCreated)}`);
    }
  }

  out.push('');
  out.push(divider());
  out.push(` ${dim('[ENTER] →')}`);
  out.push('');
  process.stdout.write(out.join('\n'));
  await readAnswer();
}
