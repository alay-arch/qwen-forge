/** Simple logger with file output and rotation */
import { appendFile, mkdir, rename, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname } from 'path';
import type { LogLevel, LogOutputMode } from '../types.js';
import { isDebug } from './runtime.js';
import { sanitize, sanitizeObject } from './sanitizer.js';

export class Logger {
  private file: string;
  private level: number;
  private maxSize: number;
  private maxFiles: number;
  private name: string;
  private consoleOutput: boolean;

  constructor(opts: {
    file: string;
    level?: LogLevel;
    mode?: LogOutputMode;
    maxSize?: string;
    maxFiles?: number;
    name?: string;
    consoleOutput?: boolean;
  }) {
    this.file = opts.file;
    this.maxSize = parseMaxSize(opts.maxSize || '10MB');
    this.maxFiles = opts.maxFiles || 5;
    this.name = opts.name || 'main';
    this.level = levelOrder(parseLogLevel(opts.level || 'INFO'));
    this.consoleOutput = opts.consoleOutput ?? false;
  }

  child(name: string): Logger {
    return new Logger({
      file: this.file,
      level: logLevel(this.level),
      maxSize: `${this.maxSize}`,
      maxFiles: this.maxFiles,
      name: `${this.name}:${name}`,
      consoleOutput: this.consoleOutput,
    });
  }

  trace(msg: string, meta?: any): void { this.log('TRACE', msg, meta); }
  debug(msg: string, meta?: any): void { this.log('DEBUG', msg, meta); }
  info(msg: string, meta?: any): void { this.log('INFO', msg, meta); }
  success(msg: string, meta?: any): void { this.log('SUCCESS', msg, meta); }
  warn(msg: string, meta?: any): void { this.log('WARN', msg, meta); }
  error(msg: string, meta?: any): void { this.log('ERROR', msg, meta); }

  /** Log with timing information */
  timing(operation: string, duration: number): void {
    if (isDebug()) {
      this.debug(`${operation} completed in ${duration}ms`);
    }
  }

  /** Log HTTP request */
  http(method: string, url: string, status?: number, duration?: number): void {
    if (isDebug()) {
      const statusStr = status ? ` [${status}]` : '';
      const durationStr = duration ? ` (${duration}ms)` : '';
      this.debug(`HTTP ${method} ${url}${statusStr}${durationStr}`);
    }
  }

  /** Log retry attempt */
  retry(operation: string, attempt: number, maxAttempts: number): void {
    if (isDebug()) {
      this.debug(`Retry ${operation}: attempt ${attempt}/${maxAttempts}`);
    }
  }

  /** Log polling */
  poll(operation: string, interval: number): void {
    if (isDebug()) {
      this.debug(`Polling ${operation} (interval: ${interval}ms)`);
    }
  }

  private shouldLog(level: string): boolean {
    return levelOrder(level) >= this.level;
  }

  private log(level: string, msg: string, meta?: any): void {
    if (!this.shouldLog(level)) return;
    const ts = new Date().toISOString();

    const sanitizedMsg = sanitize(msg);
    const sanitizedMeta = meta ? sanitizeObject(meta) : undefined;
    const metaStr = sanitizedMeta ? ` ${JSON.stringify(sanitizedMeta)}` : '';
    const line = `[${ts}] [${level}] [${this.name}] ${sanitizedMsg}${metaStr}`;

    if (this.consoleOutput || isDebug()) {
      const colorMap: Record<string, string> = {
        TRACE: '\x1b[90m',
        DEBUG: '\x1b[36m',
        INFO: '\x1b[37m',
        SUCCESS: '\x1b[32m',
        WARN: '\x1b[33m',
        ERROR: '\x1b[31m',
        FATAL: '\x1b[35m',
      };
      const color = colorMap[level] || '\x1b[37m';
      const reset = '\x1b[0m';
      console.log(`${color}${line}${reset}`);
    }

    this.writeToFile(line).catch(() => {});
  }

  private async writeToFile(line: string): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true }).catch(() => {});
    try {
      const stats = await stat(this.file);
      if (stats.size > this.maxSize) await this.rotate();
    } catch {}
    await appendFile(this.file, line + '\n', 'utf-8');
  }

  private async rotate(): Promise<void> {
    for (let i = this.maxFiles - 1; i >= 1; i--) {
      const oldFile = `${this.file}.${i}`;
      const newFile = `${this.file}.${i + 1}`;
      if (existsSync(oldFile)) {
        await rename(oldFile, newFile).catch(() => {});
      }
    }
    if (existsSync(this.file)) {
      await rename(this.file, `${this.file}.1`).catch(() => {});
    }
  }
}

function parseLogLevel(l: string): string {
  const levels = ['TRACE', 'DEBUG', 'INFO', 'SUCCESS', 'WARN', 'ERROR', 'FATAL'];
  return levels.includes(l.toUpperCase()) ? l.toUpperCase() : 'INFO';
}

function levelOrder(l: string): number {
  const order: Record<string, number> = { TRACE: 0, DEBUG: 1, INFO: 2, SUCCESS: 3, WARN: 4, ERROR: 5, FATAL: 6 };
  return order[l] ?? 2;
}

function logLevel(n: number): LogLevel {
  const levels: LogLevel[] = ['TRACE', 'DEBUG', 'INFO', 'SUCCESS', 'WARN', 'ERROR', 'FATAL'];
  return levels[n] || 'INFO';
}

function parseMaxSize(s: string): number {
  const m = s.match(/^(\d+)(KB|MB|GB)?$/i);
  if (!m) return 10 * 1024 * 1024;
  const n = parseInt(m[1], 10);
  const u = (m[2] || 'MB').toUpperCase();
  if (u === 'KB') return n * 1024;
  if (u === 'MB') return n * 1024 * 1024;
  if (u === 'GB') return n * 1024 * 1024 * 1024;
  return n;
}
