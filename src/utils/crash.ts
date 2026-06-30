/** Crash reporter — automatically saves crash reports to logs/crash-*.log */
import { appendFile, mkdir } from 'fs/promises';
import { platform, arch, release, version } from 'os';
import { getUptime } from './runtime.js';
import { VERSION } from '../version.js';

export interface CrashReport {
  timestamp: string;
  error: Error;
  command?: string;
  environment: {
    os: string;
    platform: string;
    arch: string;
    kernel: string;
    nodeVersion: string;
    projectVersion: string;
  };
  uptime: string;
  stack?: string;
}

export async function saveCrashReport(error: Error, command?: string): Promise<void> {
  const now = new Date();
  const timestamp = now.toISOString();
  const date = now.toISOString().split('T')[0];
  const filename = `logs/crash-${date}.log`;

  const report: CrashReport = {
    timestamp,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } as Error,
    command,
    environment: {
      os: `${platform()} ${release()}`,
      platform: platform(),
      arch: arch(),
      kernel: version(),
      nodeVersion: process.version,
      projectVersion: VERSION,
    },
    uptime: getUptime() + 'ms',
    stack: error.stack,
  };

  await mkdir('logs', { recursive: true }).catch(() => {});

  const separator = '\n' + '='.repeat(80) + '\n';
  const content = [
    separator,
    `CRASH REPORT - ${timestamp}`,
    separator,
    `Error: ${error.name}: ${error.message}`,
    command ? `Command: ${command}` : '',
    ``,
    `Environment:`,
    `  OS: ${report.environment.os}`,
    `  Platform: ${report.environment.platform}`,
    `  Arch: ${report.environment.arch}`,
    `  Kernel: ${report.environment.kernel}`,
    `  Node: ${report.environment.nodeVersion}`,
    `  Project: v${report.environment.projectVersion}`,
    `  Uptime: ${report.uptime}`,
    ``,
    `Stack trace:`,
    error.stack || '(no stack trace available)',
    separator,
    '',
  ].filter(Boolean).join('\n');

  try {
    await appendFile(filename, content, 'utf-8');
    console.error(`\n[Crash report saved to ${filename}]\n`);
  } catch {}
}
