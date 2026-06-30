/** Unified Chromium runtime check — used by install.sh, doctor, browser init */
import { spawnSync } from 'child_process';
import { accessSync, constants, existsSync, readdirSync, readFileSync, statSync } from 'fs';

// ── Types ────────────────────────────────────────────────────────────

export type DistroId = 'ubuntu' | 'debian' | 'fedora' | 'rhel' | 'arch' | 'opensuse' | 'alpine' | 'void' | 'gentoo' | 'unknown';

export interface DistroInfo {
  id: DistroId;
  name: string;
  version: string;
  majorVersion: number;
}

export interface ChromiumDiagResult {
  canLaunch: boolean;
  binaryFound: boolean;
  binaryPath?: string;
  distro: DistroInfo;
  launchError?: string;
  missingLib?: string;
  installCmd: string[];
}

interface LaunchResult {
  canLaunch: boolean;
  error?: string;
  binaryFound: boolean;
  binaryPath?: string;
  missingLib?: string;
}

// ── Distro Detection ────────────────────────────────────────────────

export function detectDistro(): DistroInfo {
  const info: DistroInfo = { id: 'unknown', name: 'Unknown', version: '', majorVersion: 0 };

  if (existsSync('/etc/os-release')) {
    const content = readFileSync('/etc/os-release', 'utf-8');
    const get = (key: string): string => {
      const m = content.match(new RegExp(`^${key}=["']?(.*?)["']?$`, 'm'));
      return m ? m[1].trim() : '';
    };
    info.name = get('NAME') || 'Unknown';
    info.version = get('VERSION_ID') || '';
    info.majorVersion = parseInt(info.version, 10) || 0;
    const id = get('ID').toLowerCase();
    const like = get('ID_LIKE').toLowerCase().split(/\s+/).filter(Boolean);

    if (id === 'ubuntu') info.id = 'ubuntu';
    else if (id === 'debian') info.id = 'debian';
    else if (id === 'fedora') info.id = 'fedora';
    else if (id === 'rhel' || id === 'centos') info.id = 'rhel';
    else if (id === 'arch') info.id = 'arch';
    else if (id === 'opensuse' || id === 'suse') info.id = 'opensuse';
    else if (id === 'alpine') info.id = 'alpine';
    else if (id === 'void') info.id = 'void';
    else if (id === 'gentoo') info.id = 'gentoo';
    else if (like.includes('arch')) info.id = 'arch';
    else if (like.includes('fedora')) info.id = 'fedora';
    else if (like.includes('rhel')) info.id = 'rhel';
    else if (like.includes('debian')) info.id = 'debian';
    else if (like.includes('ubuntu')) info.id = 'ubuntu';
    else if (like.includes('suse')) info.id = 'opensuse';
    else if (like.includes('gentoo')) info.id = 'gentoo';
  } else if (existsSync('/etc/arch-release')) {
    info.id = 'arch';
    info.name = 'Arch Linux';
  } else if (existsSync('/etc/alpine-release')) {
    info.id = 'alpine';
    info.name = 'Alpine Linux';
    info.version = readFileSync('/etc/alpine-release', 'utf-8').trim();
    info.majorVersion = parseInt(info.version, 10) || 0;
  } else if (existsSync('/etc/gentoo-release')) {
    info.id = 'gentoo';
    info.name = 'Gentoo Linux';
  } else if (existsSync('/etc/void-release')) {
    info.id = 'void';
    info.name = 'Void Linux';
  }

  return info;
}

// ── Find Chromium Binary ────────────────────────────────────────────

function findChromiumBinary(): string | undefined {
  const home = process.env.HOME || '';
  const cacheDir = process.env.CLOAKBROWSER_CACHE_DIR || `${home}/.cloakbrowser`;

  const cached = findCachedCloakBinary(cacheDir);

  const candidates = [
    process.env.CLOAKBROWSER_BINARY_PATH,
    cached,
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/snap/bin/chromium',
    '/usr/bin/chromium.chromium',
  ];

  for (const bin of candidates) {
    if (bin && existsSync(bin)) return bin;
  }
  return undefined;
}

function findCachedCloakBinary(cacheDir: string): string | undefined {
  if (!cacheDir || !existsSync(cacheDir)) return undefined;

  try {
    return readdirSync(cacheDir)
      .filter((name) => name.startsWith('chromium-'))
      .map((name) => {
        const dir = `${cacheDir}/${name}`;
        const bin = process.platform === 'darwin'
          ? `${dir}/Chromium.app/Contents/MacOS/Chromium`
          : process.platform === 'win32'
            ? `${dir}/chrome.exe`
            : `${dir}/chrome`;
        return { bin, mtimeMs: statSync(dir).mtimeMs };
      })
      .filter(({ bin }) => existsSync(bin))
      .sort((a, b) => b.mtimeMs - a.mtimeMs)[0]?.bin;
  } catch {
    return undefined;
  }
}

// ── Chromium Launch Test ────────────────────────────────────────────

export function tryLaunchChromium(binaryPath?: string): LaunchResult {
  const bin = binaryPath || findChromiumBinary();
  if (!bin) return { canLaunch: false, error: 'No Chromium binary found', binaryFound: false };

  try {
    accessSync(bin, constants.X_OK);

    const result = spawnSync(bin, [
      '--headless=new',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-first-run',
      '--dump-dom',
      'about:blank',
    ], {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (result.status === 0) {
      return { canLaunch: true, binaryFound: true, binaryPath: bin };
    }

    if (result.error) {
      return { canLaunch: false, error: `Cannot execute: ${result.error.message}`, binaryFound: true, binaryPath: bin };
    }

    const stderr = result.stderr?.trim() || '';
    const stdout = result.stdout?.trim() || '';

    if (stderr.includes('error while loading shared libraries')) {
      const match = stderr.match(/error while loading shared libraries: ([^\s:]+)/);
      const missingLib = match ? match[1] : undefined;
      return {
        canLaunch: false,
        error: missingLib ? `Missing library: ${missingLib}` : stderr,
        binaryFound: true,
        binaryPath: bin,
        missingLib,
      };
    }

    if (stderr || stdout) {
      return { canLaunch: false, error: stderr || stdout, binaryFound: true, binaryPath: bin };
    }

    return { canLaunch: false, error: `Exit code ${result.status}`, binaryFound: true, binaryPath: bin };
  } catch (e: any) {
    return { canLaunch: false, error: e.message, binaryFound: true, binaryPath: bin };
  }
}

// ── Soname → Package Mapping (version-aware) ────────────────────────
//
// Key: soname as it appears in "error while loading shared libraries: <name>"
// e.g. "libEGL.so.1", "libXcomposite.so.1"

interface PkgMap {
  [soname: string]: string;
}

const DEBIAN12_PKGS: PkgMap = {
  'libnss3.so': 'libnss3',
  'libnssutil3.so': 'libnss3',
  'libsmime3.so': 'libnss3',
  'libnspr4.so': 'libnspr4',
  'libatk-1.0.so.0': 'libatk1.0-0',
  'libatk-bridge-2.0.so.0': 'libatk-bridge2.0-0',
  'libcups.so.2': 'libcups2',
  'libdrm.so.2': 'libdrm2',
  'libdbus-1.so.3': 'libdbus-1-3',
  'libasound.so.2': 'libasound2',
  'libxkbcommon.so.0': 'libxkbcommon0',
  'libXcomposite.so.1': 'libxcomposite1',
  'libXdamage.so.1': 'libxdamage1',
  'libXrandr.so.2': 'libxrandr2',
  'libgbm.so.1': 'libgbm1',
  'libpango-1.0.so.0': 'libpango-1.0-0',
  'libcairo.so.2': 'libcairo2',
  'libexpat.so.1': 'libexpat1',
  'libxshmfence.so.1': 'libxshmfence1',
  'libEGL.so.1': 'libegl1',
  'libGLESv2.so.2': 'libgles2',
  'libopenh264.so.7': 'libopenh264-7',
  'libfreetype.so.6': 'libfreetype6',
  'libfontconfig.so.1': 'libfontconfig1',
  'libharfbuzz.so.0': 'libharfbuzz0b',
  'libglib-2.0.so.0': 'libglib2.0-0',
};

const DEBIAN13_PKGS: PkgMap = {
  'libnss3.so': 'libnss3',
  'libnssutil3.so': 'libnss3',
  'libsmime3.so': 'libnss3',
  'libnspr4.so': 'libnspr4',
  'libatk-1.0.so.0': 'libatk1.0-0t64',
  'libatk-bridge-2.0.so.0': 'libatk-bridge2.0-0t64',
  'libcups.so.2': 'libcups2t64',
  'libdrm.so.2': 'libdrm2',
  'libdbus-1.so.3': 'libdbus-1-3',
  'libasound.so.2': 'libasound2t64',
  'libxkbcommon.so.0': 'libxkbcommon0',
  'libXcomposite.so.1': 'libxcomposite1',
  'libXdamage.so.1': 'libxdamage1',
  'libXrandr.so.2': 'libxrandr2',
  'libgbm.so.1': 'libgbm1',
  'libpango-1.0.so.0': 'libpango-1.0-0',
  'libcairo.so.2': 'libcairo2',
  'libexpat.so.1': 'libexpat1',
  'libxshmfence.so.1': 'libxshmfence1',
  'libEGL.so.1': 'libegl1',
  'libGLESv2.so.2': 'libgles2',
  'libopenh264.so.7': 'libopenh264-7',
  'libfreetype.so.6': 'libfreetype6',
  'libfontconfig.so.1': 'libfontconfig1',
  'libharfbuzz.so.0': 'libharfbuzz0b',
  'libglib-2.0.so.0': 'libglib2.0-0t64',
};

const UBU22_PKGS: PkgMap = {
  ...DEBIAN12_PKGS,
  'libatk-bridge-2.0.so.0': 'libatk-bridge2.0-0',
  'libcups.so.2': 'libcups2',
  'libasound.so.2': 'libasound2',
};

const UBU24_PKGS: PkgMap = {
  'libnss3.so': 'libnss3',
  'libnssutil3.so': 'libnss3',
  'libsmime3.so': 'libnss3',
  'libnspr4.so': 'libnspr4',
  'libatk-1.0.so.0': 'libatk1.0-0t64',
  'libatk-bridge-2.0.so.0': 'libatk-bridge2.0-0t64',
  'libcups.so.2': 'libcups2t64',
  'libdrm.so.2': 'libdrm2',
  'libdbus-1.so.3': 'libdbus-1-3',
  'libasound.so.2': 'libasound2t64',
  'libxkbcommon.so.0': 'libxkbcommon0',
  'libXcomposite.so.1': 'libxcomposite1',
  'libXdamage.so.1': 'libxdamage1',
  'libXrandr.so.2': 'libxrandr2',
  'libgbm.so.1': 'libgbm1',
  'libpango-1.0.so.0': 'libpango-1.0-0',
  'libcairo.so.2': 'libcairo2',
  'libexpat.so.1': 'libexpat1',
  'libxshmfence.so.1': 'libxshmfence1',
  'libEGL.so.1': 'libegl1',
  'libGLESv2.so.2': 'libgles2',
  'libopenh264.so.7': 'libopenh264-7',
  'libfreetype.so.6': 'libfreetype6',
  'libfontconfig.so.1': 'libfontconfig1',
  'libharfbuzz.so.0': 'libharfbuzz0b',
  'libglib-2.0.so.0': 'libglib2.0-0t64',
};

const ARCH_PKGS: PkgMap = {
  'libnss3.so': 'nss',
  'libnssutil3.so': 'nss',
  'libsmime3.so': 'nss',
  'libnspr4.so': 'nspr',
  'libatk-1.0.so.0': 'at-spi2-core',
  'libatk-bridge-2.0.so.0': 'at-spi2-core',
  'libcups.so.2': 'libcups',
  'libdrm.so.2': 'libdrm',
  'libdbus-1.so.3': 'dbus',
  'libasound.so.2': 'alsa-lib',
  'libxkbcommon.so.0': 'libxkbcommon',
  'libXcomposite.so.1': 'libxcomposite',
  'libXdamage.so.1': 'libxdamage',
  'libXrandr.so.2': 'libxrandr',
  'libgbm.so.1': 'mesa',
  'libpango-1.0.so.0': 'pango',
  'libcairo.so.2': 'cairo',
  'libexpat.so.1': 'expat',
  'libxshmfence.so.1': 'libxshmfence',
  'libEGL.so.1': 'libglvnd',
  'libGLESv2.so.2': 'libglvnd',
  'libopenh264.so.8': 'libopenh264',
  'libfreetype.so.6': 'freetype2',
  'libfontconfig.so.1': 'fontconfig',
  'libharfbuzz.so.0': 'harfbuzz',
  'libglib-2.0.so.0': 'glib2',
};

const FEDORA_PKGS: PkgMap = {
  'libnss3.so': 'nss',
  'libnssutil3.so': 'nss',
  'libsmime3.so': 'nss',
  'libnspr4.so': 'nspr',
  'libatk-1.0.so.0': 'atk',
  'libatk-bridge-2.0.so.0': 'at-spi2-atk',
  'libcups.so.2': 'cups-libs',
  'libdrm.so.2': 'libdrm',
  'libdbus-1.so.3': 'dbus-libs',
  'libasound.so.2': 'alsa-lib',
  'libxkbcommon.so.0': 'libxkbcommon',
  'libXcomposite.so.1': 'libXcomposite',
  'libXdamage.so.1': 'libXdamage',
  'libXrandr.so.2': 'libXrandr',
  'libgbm.so.1': 'mesa-libgbm',
  'libpango-1.0.so.0': 'pango',
  'libcairo.so.2': 'cairo',
  'libexpat.so.1': 'expat',
  'libxshmfence.so.1': 'libxshmfence',
  'libEGL.so.1': 'libEGL',
  'libGLESv2.so.2': 'libGLESv2',
  'libopenh264.so.8': 'openh264',
  'libfreetype.so.6': 'freetype',
  'libfontconfig.so.1': 'fontconfig',
  'libharfbuzz.so.0': 'harfbuzz',
  'libglib-2.0.so.0': 'glib2',
};

const ALPINE_PKGS: PkgMap = {
  'libnss3.so': 'nss',
  'libnssutil3.so': 'nss',
  'libsmime3.so': 'nss',
  'libnspr4.so': 'nspr',
  'libatk-1.0.so.0': 'atk',
  'libatk-bridge-2.0.so.0': 'at-spi2-atk',
  'libcups.so.2': 'cups-libs',
  'libdrm.so.2': 'libdrm',
  'libdbus-1.so.3': 'dbus',
  'libasound.so.2': 'alsa-lib',
  'libxkbcommon.so.0': 'libxkbcommon',
  'libXcomposite.so.1': 'libxcomposite',
  'libXdamage.so.1': 'libxdamage',
  'libXrandr.so.2': 'libxrandr',
  'libgbm.so.1': 'mesa-gbm',
  'libpango-1.0.so.0': 'pango',
  'libcairo.so.2': 'cairo',
  'libexpat.so.1': 'expat',
  'libxshmfence.so.1': 'libxshmfence',
  'libEGL.so.1': 'libegl',
  'libGLESv2.so.2': 'libgles2',
  'libopenh264.so.8': 'libopenh264',
  'libfreetype.so.6': 'freetype',
  'libfontconfig.so.1': 'fontconfig',
  'libharfbuzz.so.0': 'harfbuzz',
  'libglib-2.0.so.0': 'glib',
};

const OPENSUSE_PKGS: PkgMap = {
  ...FEDORA_PKGS,
  'libdbus-1.so.3': 'dbus-1',
  'libgbm.so.1': 'Mesa-libgbm1',
  'libEGL.so.1': 'Mesa-libEGL1',
  'libGLESv2.so.2': 'Mesa-libGLESv2-2',
};

const VOID_PKGS: PkgMap = {
  ...ARCH_PKGS,
  'libatk-1.0.so.0': 'at-spi2-core',
  'libatk-bridge-2.0.so.0': 'at-spi2-core',
  'libcups.so.2': 'cups-libs',
  'libasound.so.2': 'alsa-lib',
  'libEGL.so.1': 'libglvnd',
  'libGLESv2.so.2': 'libglvnd',
};

const GENTOO_PKGS: PkgMap = {
  ...FEDORA_PKGS,
  'libnss3.so': 'dev-libs/nss',
  'libnssutil3.so': 'dev-libs/nss',
  'libsmime3.so': 'dev-libs/nss',
  'libnspr4.so': 'dev-libs/nspr',
  'libcups.so.2': 'net-print/cups',
  'libasound.so.2': 'media-libs/alsa-lib',
  'libEGL.so.1': 'media-libs/libglvnd',
  'libGLESv2.so.2': 'media-libs/libglvnd',
};

function getPackageMap(distro: DistroInfo): PkgMap {
  switch (distro.id) {
    case 'debian':
      return distro.majorVersion >= 13 ? DEBIAN13_PKGS : DEBIAN12_PKGS;
    case 'ubuntu':
      return distro.majorVersion >= 24 ? UBU24_PKGS : UBU22_PKGS;
    case 'arch':
      return ARCH_PKGS;
    case 'fedora':
    case 'rhel':
      return FEDORA_PKGS;
    case 'opensuse':
      return OPENSUSE_PKGS;
    case 'alpine':
      return ALPINE_PKGS;
    case 'void':
      return VOID_PKGS;
    case 'gentoo':
      return GENTOO_PKGS;
    default:
      return {};
  }
}

function buildInstallCommand(distro: DistroInfo, missingLib: string): string[] {
  const pkgMap = getPackageMap(distro);
  const pkg = pkgMap[missingLib];
  if (!pkg) return [];
  if (isPackageInstalled(distro, pkg)) return [];

  const pkgs = [...new Set([pkg])];
  const sudo = process.getuid?.() === 0 ? '' : 'sudo ';

  switch (distro.id) {
    case 'ubuntu':
    case 'debian':
      return [`${sudo}apt-get update && ${sudo}apt-get install -y ${pkgs.join(' ')}`];
    case 'fedora':
    case 'rhel':
      return [`${sudo}dnf install -y ${pkgs.join(' ')}`];
    case 'arch':
      return [`${sudo}pacman -S --needed ${pkgs.join(' ')}`];
    case 'opensuse':
      return [`${sudo}zypper --non-interactive install ${pkgs.join(' ')}`];
    case 'alpine':
      return [`${sudo}apk add ${pkgs.join(' ')}`];
    case 'void':
      return [`${sudo}xbps-install -S ${pkgs.join(' ')}`];
    case 'gentoo':
      return [`${sudo}emerge ${pkgs.join(' ')}`];
    default:
      return [`# Install package providing ${missingLib} for ${distro.name}`];
  }
}

function isPackageInstalled(distro: DistroInfo, pkg: string): boolean {
  const check = (cmd: string, args: string[], outputIncludes?: string) => {
    const result = spawnSync(cmd, args, { encoding: 'utf-8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] });
    return result.status === 0 && (!outputIncludes || result.stdout.includes(outputIncludes));
  };

  switch (distro.id) {
    case 'ubuntu':
    case 'debian':
      return check('dpkg-query', ['-W', '-f=${Status}', pkg], 'install ok installed');
    case 'arch':
      return check('pacman', ['-Q', pkg]);
    case 'fedora':
    case 'rhel':
      return check('rpm', ['-q', pkg]);
    case 'opensuse':
      return check('rpm', ['-q', pkg]);
    case 'alpine':
      return check('apk', ['info', '-e', pkg]);
    case 'void':
      return check('xbps-query', ['-p', 'pkgver', pkg]);
    case 'gentoo':
      return check('qlist', ['-IC', pkg]) || check('equery', ['list', pkg]);
    default:
      return false;
  }
}

// ── Main Diagnostic ─────────────────────────────────────────────────
//
// Algorithm:
//   1. Detect distro
//   2. Find Chromium binary (CloakBrowser's download → system paths)
//   3. Try to launch in minimal headless mode
//   4. If OK → done (no false positives from ldconfig)
//   5. If error → parse stderr for missing shared library
//   6. Map soname → distro-version-aware package name
//   7. Generate install command

export function runChromiumDiagnostic(): ChromiumDiagResult {
  const distro = detectDistro();
  const launchResult = tryLaunchChromium();

  if (launchResult.canLaunch) {
    return {
      canLaunch: true,
      binaryFound: true,
      binaryPath: launchResult.binaryPath,
      distro,
      installCmd: [],
    };
  }

  // Only failed real launches are analyzed for install recommendations.
  const missingLibMatch = launchResult.missingLib;
  const installCmd = missingLibMatch
    ? buildInstallCommand(distro, missingLibMatch)
    : [];

  return {
    canLaunch: false,
    binaryFound: launchResult.binaryFound,
    binaryPath: launchResult.binaryPath,
    distro,
    launchError: launchResult.error,
    missingLib: missingLibMatch,
    installCmd,
  };
}

export function formatDiagResult(result: ChromiumDiagResult): string {
  const lines: string[] = [];

  lines.push(`Distro: ${result.distro.name} ${result.distro.version}`);

  if (result.canLaunch) {
    if (result.binaryPath) lines.push(`Binary: ${result.binaryPath}`);
    lines.push('Chromium launch: OK');
  } else if (!result.binaryFound) {
    lines.push('Chromium launch: NOT FOUND (no binary on system)');
  } else if (result.missingLib) {
    lines.push(`Missing library: ${result.missingLib}`);
    if (result.installCmd.length > 0) {
      lines.push(`Install: ${result.installCmd[0]}`);
    }
  } else if (result.launchError) {
    lines.push(`Chromium launch: FAILED — ${result.launchError}`);
  }

  return lines.join('\n');
}

// ── CLI entry point (for install.sh and standalone use) ─────────────

const isMain = process.argv[1]?.endsWith('chromium.ts');
if (isMain) {
  const result = runChromiumDiagnostic();
  const summary = formatDiagResult(result);
  process.stdout.write(summary + '\n');
  process.exit(result.canLaunch ? 0 : 1);
}
