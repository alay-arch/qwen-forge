/** Batch account creation */
import type { AppContext } from '../context.js';
import { Screen, divider, PALETTE, c, bold, dim } from '../theme.js';
import { t } from '../i18n.js';
import { createAccount } from './create.js';
import { sleep, checkForEsc, showCancelPrompt } from '../cli/helpers.js';
import { readAnswer } from '../cli/input.js';

const screen = new Screen();
const MAX_BATCH = 50;

export async function batchCreate(ctx: AppContext): Promise<void> {
  let count = 0;

  while (true) {
    screen.clear();
    process.stdout.write(` ${bold(t('batch.title'))}`);
    process.stdout.write(`\n${divider()}\n\n`);

    const ans = (await readAnswer(` ${t('batch.count_prompt')} ${c(PALETTE.PRIMARY, '❯')} `)).trim();
    if (ans === '') return;
    count = parseInt(ans, 10);

    if (isNaN(count) || count < 1 || count > MAX_BATCH) {
      process.stdout.write(`\n ${c(PALETTE.ERROR, `${'✗'} ${t('batch.invalid_number')}`)}\n`);
      await sleep(1500);
      continue;
    }
    break;
  }

  let successCount = 0;
  let cancelled = false;

  for (let i = 0; i < count; i++) {
    screen.clear();
    process.stdout.write(` ${bold(t('batch.title'))}  ${dim(`${i + 1}/${count}`)}`);
    process.stdout.write(`\n${divider()}\n`);

    try {
      const ok = await createAccount(ctx);
      if (ok) successCount++;
    } catch {}

    if (i < count - 1 && !cancelled) {
      for (let rem = 3; rem > 0; rem--) {
        screen.clear();
        process.stdout.write(`\n ${bold(t('batch.title'))}  ${dim(`${i + 1}/${count}`)}`);
        process.stdout.write(`\n${divider()}\n\n`);
        process.stdout.write(` ${c(PALETTE.PRIMARY, '→')} ${t('batch.next_in')} ${rem} ${t('batch.seconds')}...\n\n`);
        process.stdout.write(` ${dim('ESC → cancel')}\n`);
        if (await checkForEsc(900)) {
          cancelled = await showCancelPrompt(t('cancel.title'));
          if (cancelled) {
            process.stdout.write(`\n ${c(PALETTE.WARNING, `${'⚠'} ${t('cancel.cancelled_batch')}`)}\n`);
          }
          break;
        }
        await sleep(100);
      }
    }
  }

  const rate = count > 0 ? (successCount / count) * 100 : 0;
  screen.clear();
  const out: string[] = [''];
  out.push(` ${bold(t('batch.complete'))}`);
  out.push('');
  out.push(divider());
  out.push('');
  out.push(` ${dim(t('batch.successful'))}  ${c(PALETTE.SUCCESS, String(successCount))}`);
  out.push(` ${dim(t('batch.failed'))}     ${c(PALETTE.ERROR, String(count - successCount))}`);
  out.push(` ${dim(t('batch.rate'))}        ${bold(rate.toFixed(1) + '%')}`);
  out.push('');
  out.push(divider());
  out.push(` ${dim('[ENTER] →')}`);
  out.push('');
  process.stdout.write(out.join('\n'));
  await readAnswer();
}
