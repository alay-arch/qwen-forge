/** Colors, layout helpers, screen manager */

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const fg = (n: number) => `\x1b[38;5;${n}m`;

export const PALETTE = {
  PRIMARY: fg(117),    // soft blue
  SUCCESS: fg(114),    // soft green
  ERROR: fg(210),      // soft red
  WARNING: fg(222),    // soft yellow
  DIM: DIM,
  BOLD: BOLD,
  RESET: RESET,
} as const;

export const c = (color: string, text: string): string => `${color}${text}${RESET}`;
export const bold = (text: string): string => `${BOLD}${text}${RESET}`;
export const dim = (text: string): string => `${DIM}${text}${RESET}`;

export const ICONS = {
  SUCCESS: '✓',
  ERROR: '✗',
  WARNING: '⚠',
  INFO: '○',
  BULLET: '•',
} as const;

const DIVIDER_CHAR = '─';
const DIVIDER_LENGTH = 48;

export const divider = (): string => ` ${dim(DIVIDER_CHAR.repeat(DIVIDER_LENGTH))}`;

export function kv(key: string, value: string): string {
  return ` ${dim(key)}  ${value}`;
}

export class Screen {
  clear(): void {
    process.stdout.write('\x1b[2J\x1b[H');
  }
}

export class Spinner {
  private interval: ReturnType<typeof setInterval> | null = null;
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private i = 0;

  start(text: string): void {
    this.i = 0;
    this.interval = setInterval(() => {
      process.stdout.write(`\r ${c(PALETTE.PRIMARY, this.frames[this.i])} ${text}`);
      this.i = (this.i + 1) % this.frames.length;
    }, 80);
    process.stdout.write(`\r ${c(PALETTE.PRIMARY, this.frames[0])} ${text}`);
  }

  success(text: string): void {
    this._stop();
    process.stdout.write(`\r ${c(PALETTE.SUCCESS, `${ICONS.SUCCESS} ${text}`)}\n`);
  }

  fail(text: string): void {
    this._stop();
    process.stdout.write(`\r ${c(PALETTE.ERROR, `${ICONS.ERROR} ${text}`)}\n`);
  }

  warn(text: string): void {
    this._stop();
    process.stdout.write(`\r ${c(PALETTE.WARNING, `${ICONS.WARNING} ${text}`)}\n`);
  }

  private _stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  stop(): void {
    this._stop();
  }
}
