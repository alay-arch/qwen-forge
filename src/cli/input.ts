/** CLI input — menu loop, readline, prompts */
import readline from 'readline';
import { readFileSync } from 'fs';
import { Screen, divider, PALETTE, c } from '../theme.js';
import { t } from '../i18n.js';
import { VERSION } from '../version.js';

const screen = new Screen();
const isPipe = !Boolean(process.stdin.isTTY);
const pipeInput = isPipe ? readFileSync(0, 'utf-8').split(/\r?\n/) : [];
const rl = isPipe ? null : readline.createInterface({ input: process.stdin, output: process.stdout });
let readlineClosed = !rl;
rl?.on('close', () => { readlineClosed = true; });

export interface MenuItem {
  key: string;
  label: string;
  action: () => Promise<void>;
}

export async function readAnswer(prompt = ''): Promise<string> {
  if (isPipe) {
    if (prompt) process.stdout.write(prompt);
    return (pipeInput.length > 0 ? pipeInput.shift() : '0')!.trim();
  }
  if (!rl || readlineClosed) return '0';
  return new Promise(r => { rl.question(prompt, (a: string) => r(a.trim())); });
}

export function closeReadline(): void {
  if (rl && !readlineClosed) { rl.close(); readlineClosed = true; }
}

export async function askQuestion(question: string, defaultValue?: string): Promise<string> {
  const def = defaultValue ? ` [${defaultValue}]` : '';
  return readAnswer(` ${question}${def} ${c(PALETTE.PRIMARY, '❯')} `).then(a => a || defaultValue || '');
}

export async function confirmAction(msg: string): Promise<boolean> {
  const a = (await askQuestion(`${msg} (y/n)`, 'y')).toLowerCase();
  return a === 'y' || a === 'yes' || a === t('messages.yes');
}

/** Build and show the main menu */
export async function showMenu(items: MenuItem[]): Promise<void> {
  let errMsg: string | undefined;
  while (true) {
    screen.clear();
    const lines: string[] = [];
    lines.push(` ${t('title')}  v${VERSION}`);
    lines.push(divider());
    lines.push('');
    for (const item of items) {
      lines.push(` ${c(PALETTE.PRIMARY, item.key)}  ${item.label}`);
    }
    if (errMsg) { lines.push(''); lines.push(` ${c(PALETTE.ERROR, errMsg)}`); }
    lines.push('');
    lines.push(divider());
    lines.push('');
    process.stdout.write(lines.join('\n'));

    const ans = (await readAnswer(` ${c(PALETTE.PRIMARY, '❯')} `)).trim();
    if (!ans) { errMsg = undefined; continue; }
    if (ans === '0' || ans.toLowerCase() === 'q' || ans.toLowerCase() === 'exit') {
      const exit_item = items.find(i => i.key === '0');
      if (exit_item) await exit_item.action();
      return;
    }
    const match = items.find(i => i.key === ans);
    if (match) { errMsg = undefined; await match.action(); return; }
    errMsg = t('menu.invalid');
  }
}
