import { afterAll, describe, expect, test } from 'bun:test';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { tryLaunchChromium } from './chromium.js';

const tmp = mkdtempSync(join(tmpdir(), 'qf-chromium-diag-'));

afterAll(() => rmSync(tmp, { recursive: true, force: true }));

function fakeBinary(name: string, body: string): string {
  const path = join(tmp, name);
  writeFileSync(path, `#!/bin/sh\n${body}\n`);
  chmodSync(path, 0o755);
  return path;
}

describe('Chromium diagnostics', () => {
  test('accepts a real successful launch', () => {
    const bin = fakeBinary('ok-chrome', 'printf "<html></html>"');

    expect(tryLaunchChromium(bin)).toMatchObject({
      canLaunch: true,
      binaryFound: true,
      binaryPath: bin,
    });
  });

  test('parses missing shared library only after launch failure', () => {
    const bin = fakeBinary(
      'missing-lib-chrome',
      'printf "%s" "error while loading shared libraries: libfoo.so.1: cannot open shared object file" >&2\nexit 127',
    );

    expect(tryLaunchChromium(bin)).toMatchObject({
      canLaunch: false,
      binaryFound: true,
      missingLib: 'libfoo.so.1',
    });
  });
});
