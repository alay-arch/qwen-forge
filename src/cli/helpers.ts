/** Utility functions — sleep, ESC detection, formatting */
import { readAnswer } from './input.js';

export function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Sleep but check for ESC every ~100ms.
 * Returns true if ESC was pressed during sleep.
 */
export async function sleepWithEsc(ms: number): Promise<boolean> {
  const step = 100;
  const steps = Math.floor(ms / step);
  for (let i = 0; i < steps; i++) {
    if (await checkForEsc(step - 5)) return true;
  }
  const remainder = ms % step;
  if (remainder > 0) {
    await sleep(remainder);
  }
  return false;
}

/**
 * Non-blocking ESC key check.
 * Briefly sets raw mode to detect if ESC was pressed.
 * Returns true if ESC was pressed within timeoutMs.
 * Uses removeListener (not removeAllListeners) so readline is NOT broken.
 * Does NOT pause stdin — readline manages stdin lifecycle.
 */
export async function checkForEsc(timeoutMs = 100): Promise<boolean> {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) return false;
  return new Promise<boolean>(resolve => {
    const wasRaw = process.stdin.isRaw || false;
    try {
      process.stdin.setRawMode(true);
      process.stdin.resume();

      let resolved = false;

      const onData = (chunk: Buffer) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        try { process.stdin.setRawMode(wasRaw); } catch {}
        process.stdin.removeListener('data', onData);
        resolve(chunk[0] === 0x1b);
      };

      process.stdin.on('data', onData);

      const timer = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        try { process.stdin.setRawMode(wasRaw); } catch {}
        process.stdin.removeListener('data', onData);
        resolve(false);
      }, timeoutMs);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Interactive cancellation prompt.
 * Shows a confirmation and waits for ESC (confirm) or ENTER (continue).
 * Returns true if cancelled, false if continuing.
 */
export async function showCancelPrompt(title: string): Promise<boolean> {
  process.stdout.write('\n');
  process.stdout.write(` ${'─'.repeat(40)}\n`);
  process.stdout.write(` ${title}\n\n`);
  process.stdout.write(' ESC → Confirm  ·  ENTER → Continue\n');
  process.stdout.write(` ${'─'.repeat(40)}\n`);

  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    const ans = (await readAnswer('')).trim().toLowerCase();
    return ans === 'esc' || ans === 'e';
  }

  return new Promise<boolean>(resolve => {
    const wasRaw = process.stdin.isRaw || false;
    try {
      process.stdin.setRawMode(true);
      process.stdin.resume();

      const onData = (chunk: Buffer) => {
        const byte = chunk[0];
        try { process.stdin.setRawMode(wasRaw); } catch {}
        process.stdin.removeListener('data', onData);
        resolve(byte === 0x1b);
      };

      process.stdin.on('data', onData);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Read a single keypress in raw mode.
 * Returns the key name: 'enter', 'escape', 's', 'y', etc.
 * Falls back to readAnswer if raw mode is unavailable.
 */
export async function readKey(prompt = ''): Promise<string> {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    const ans = (await readAnswer(prompt)).toLowerCase();
    if (ans === '' || ans === 'y' || ans === 'yes') return 'enter';
    return ans;
  }

  if (prompt) process.stdout.write(prompt);

  return new Promise<string>(resolve => {
    const wasRaw = process.stdin.isRaw || false;
    try {
      process.stdin.setRawMode(true);
      process.stdin.resume();

      const onData = (chunk: Buffer) => {
        try { process.stdin.setRawMode(wasRaw); } catch {}
        process.stdin.removeListener('data', onData);

        const byte = chunk[0];
        if (byte === 0x0d || byte === 0x0a) resolve('enter');
        else if (byte === 0x1b) resolve('escape');
        else if (byte === 0x03) resolve('ctrl-c');
        else resolve(String.fromCharCode(byte).toLowerCase());
      };

      process.stdin.on('data', onData);
    } catch {
      resolve('enter');
    }
  });
}

export function formatTime(ms: number): string {
  const abs = Math.abs(ms);
  const s = Math.floor(abs / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `today ${time}`;
  return `${d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} ${time}`;
}

/** Safe JSON parse — returns fallback on failure */
export function safeJsonParse<T>(text: string, fallback: T): T {
  try { return JSON.parse(text) as T; }
  catch { return fallback; }
}
