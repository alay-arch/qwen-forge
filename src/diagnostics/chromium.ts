/** Unified Chromium runtime check — used by install.sh, doctor, browser init */
import { execSync, spawnSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';

// ── Types ────────────────────────────────────────────────────────────

export type DistroId = 'ubuntu' | 'debian' | 'fedora' | 'rhel' | 'arch' | 'opensuse' | 'alpine' | 'unknown';

export interface DistroInfo {
  id: DistroId;
  name: string;
  version: string;
  like: string[];
}

export interface LibCheck {
  name: string;
  found: boolean;
  path?: string;
}

export interface ChromiumDiagResult {
  allLibsFound: boolean;
  distro: DistroInfo;
  results: LibCheck[];
  missing: LibCheck[];
  foundCount: number;
  totalCount: number;
  installCmd: string[];
  canLaunch: boolean;
  launchError?: string;
}

// ── Distro Detection ────────────────────────────────────────────────

export function detectDistro(): DistroInfo {
  const info: DistroInfo = { id: 'unknown', name: 'Unknown', version: '', like: [] };

  if (existsSync('/etc/os-release')) {
    const content = readFileSync('/etc/os-release', 'utf-8');
    const get = (key: string): string => {
      const m = content.match(new RegExp(`^${key}=["']?(.*?)["']?$`, 'm'));
      return m ? m[1].trim() : '';
    };
    info.name = get('NAME') || 'Unknown';
    info.version = get('VERSION_ID') || '';
    const id = get('ID').toLowerCase();
    info.like = get('ID_LIKE').toLowerCase().split(/\s+/).filter(Boolean);

    if (id === 'ubuntu') info.id = 'ubuntu';
    else if (id === 'debian') info.id = 'debian';
    else if (id === 'fedora') info.id = 'fedora';
    else if (id === 'rhel' || id === 'centos') info.id = 'rhel';
    else if (id === 'arch' || info.like.includes('arch')) info.id = 'arch';
    else if (id === 'opensuse' || id === 'suse') info.id = 'opensuse';
    else if (id === 'alpine') info.id = 'alpine';
    else if (info.like.includes('ubuntu')) info.id = 'ubuntu';
    else if (info.like.includes('debian')) info.id = 'debian';
    else if (info.like.includes('fedora')) info.id = 'fedora';
    else if (info.like.includes('rhel')) info.id = 'rhel';
  } else if (existsSync('/etc/arch-release')) {
    info.id = 'arch';
    info.name = 'Arch Linux';
  } else if (existsSync('/etc/alpine-release')) {
    info.id = 'alpine';
    info.name = 'Alpine Linux';
    info.version = readFileSync('/etc/alpine-release', 'utf-8').trim();
  }

  return info;
}

// ── Library Check ───────────────────────────────────────────────────

const REQUIRED_LIBS = [
  'libnss3.so',
  'libnssutil3.so',
  'libsmime3.so',
  'libnspr4.so',
  'libatk-1.0.so',
  'libatk-bridge-2.0.so',
  'libcups.so',
  'libdrm.so',
  'libdbus-1.so',
  'libasound.so',
  'libxkbcommon.so',
  'libxcomposite.so',
  'libxdamage.so',
  'libxrandr.so',
  'libgbm.so',
  'libpango-1.0.so',
  'libcairo.so',
  'libexpat.so',
  'libxshmfence.so',
  'libegl.so',
  'libGLESv2.so',
  'libopenh264.so',
  'libfreetype.so',
  'libfontconfig.so',
  'libharfbuzz.so',
  'libglib-2.0.so',
];

export function checkLibraries(): LibCheck[] {
  return REQUIRED_LIBS.map(lib => {
    try {
      const path = execSync(`ldconfig -p 2>/dev/null | grep -m1 "\\b${lib}\\b"`, { encoding: 'utf-8' }).trim();
      if (path) {
        const parts = path.split('=>').map(s => s.trim());
        return { name: lib, found: true, path: parts[parts.length - 1] };
      }
    } catch {}
    for (const dir of ['/usr/lib', '/usr/lib64', '/usr/lib/x86_64-linux-gnu', '/lib', '/lib64', '/usr/local/lib']) {
      const full = `${dir}/${lib}`;
      if (existsSync(full)) {
        return { name: lib, found: true, path: full };
      }
    }
    return { name: lib, found: false };
  });
}

// ── Package Maps ────────────────────────────────────────────────────

const PACKAGE_MAP: Record<DistroId, Record<string, string[]>> = {
  ubuntu: {
    'libnss3.so': ['libnss3'],
    'libnssutil3.so': ['libnss3'],
    'libsmime3.so': ['libnss3'],
    'libnspr4.so': ['libnspr4'],
    'libatk-1.0.so': ['libatk1.0-0t64'],
    'libatk-bridge-2.0.so': ['libatk-bridge2.0-0t64'],
    'libcups.so': ['libcups2t64'],
    'libdrm.so': ['libdrm2'],
    'libdbus-1.so': ['libdbus-1-3'],
    'libasound.so': ['libasound2t64'],
    'libxkbcommon.so': ['libxkbcommon0'],
    'libxcomposite.so': ['libxcomposite1'],
    'libxdamage.so': ['libxdamage1'],
    'libxrandr.so': ['libxrandr2'],
    'libgbm.so': ['libgbm1'],
    'libpango-1.0.so': ['libpango-1.0-0'],
    'libcairo.so': ['libcairo2'],
    'libexpat.so': ['libexpat1'],
    'libxshmfence.so': ['libxshmfence1'],
    'libegl.so': ['libegl1'],
    'libGLESv2.so': ['libgles2'],
    'libopenh264.so': ['libopenh264-7'],
    'libfreetype.so': ['libfreetype6'],
    'libfontconfig.so': ['libfontconfig1'],
    'libharfbuzz.so': ['libharfbuzz0b'],
    'libglib-2.0.so': ['libglib2.0-0t64'],
  },
  debian: {},
  fedora: {
    'libnss3.so': ['nss'],
    'libnssutil3.so': ['nss'],
    'libsmime3.so': ['nss'],
    'libnspr4.so': ['nspr'],
    'libatk-1.0.so': ['atk'],
    'libatk-bridge-2.0.so': ['at-spi2-atk'],
    'libcups.so': ['cups-libs'],
    'libdrm.so': ['libdrm'],
    'libdbus-1.so': ['dbus-libs'],
    'libasound.so': ['alsa-lib'],
    'libxkbcommon.so': ['libxkbcommon'],
    'libxcomposite.so': ['libXcomposite'],
    'libxdamage.so': ['libXdamage'],
    'libxrandr.so': ['libXrandr'],
    'libgbm.so': ['mesa-libgbm'],
    'libpango-1.0.so': ['pango'],
    'libcairo.so': ['cairo'],
    'libexpat.so': ['expat'],
    'libxshmfence.so': ['libxshmfence'],
    'libegl.so': ['libEGL'],
    'libGLESv2.so': ['libGLESv2'],
    'libopenh264.so': ['openh264'],
    'libfreetype.so': ['freetype'],
    'libfontconfig.so': ['fontconfig'],
    'libharfbuzz.so': ['harfbuzz'],
    'libglib-2.0.so': ['glib2'],
  },
  rhel: {},
  arch: {
    'libnss3.so': ['nss'],
    'libnssutil3.so': ['nss'],
    'libsmime3.so': ['nss'],
    'libnspr4.so': ['nspr'],
    'libatk-1.0.so': ['atk'],
    'libatk-bridge-2.0.so': ['at-spi2-atk'],
    'libcups.so': ['libcups'],
    'libdrm.so': ['libdrm'],
    'libdbus-1.so': ['dbus'],
    'libasound.so': ['alsa-lib'],
    'libxkbcommon.so': ['libxkbcommon'],
    'libxcomposite.so': ['libxcomposite'],
    'libxdamage.so': ['libxdamage'],
    'libxrandr.so': ['libxrandr'],
    'libgbm.so': ['mesa'],
    'libpango-1.0.so': ['pango'],
    'libcairo.so': ['cairo'],
    'libexpat.so': ['expat'],
    'libxshmfence.so': ['libxshmfence'],
    'libegl.so': ['libegl'],
    'libGLESv2.so': ['libgles2'],
    'libopenh264.so': ['libopenh264'],
    'libfreetype.so': ['freetype2'],
    'libfontconfig.so': ['fontconfig'],
    'libharfbuzz.so': ['harfbuzz'],
    'libglib-2.0.so': ['glib2'],
  },
  opensuse: {},
  alpine: {
    'libnss3.so': ['nss'],
    'libnssutil3.so': ['nss'],
    'libsmime3.so': ['nss'],
    'libnspr4.so': ['nspr'],
    'libatk-1.0.so': ['atk'],
    'libatk-bridge-2.0.so': ['at-spi2-atk'],
    'libcups.so': ['cups-libs'],
    'libdrm.so': ['libdrm'],
    'libdbus-1.so': ['dbus'],
    'libasound.so': ['alsa-lib'],
    'libxkbcommon.so': ['libxkbcommon'],
    'libxcomposite.so': ['libxcomposite'],
    'libxdamage.so': ['libxdamage'],
    'libxrandr.so': ['libxrandr'],
    'libgbm.so': ['mesa-gbm'],
    'libpango-1.0.so': ['pango'],
    'libcairo.so': ['cairo'],
    'libexpat.so': ['expat'],
    'libxshmfence.so': ['libxshmfence'],
    'libegl.so': ['libegl'],
    'libGLESv2.so': ['libgles2'],
    'libopenh264.so': ['libopenh264'],
    'libfreetype.so': ['freetype'],
    'libfontconfig.so': ['fontconfig'],
    'libharfbuzz.so': ['harfbuzz'],
    'libglib-2.0.so': ['glib'],
  },
  unknown: {},
};

function getPackageMap(distro: DistroId): Record<string, string[]> {
  const map = PACKAGE_MAP[distro];
  if (map && Object.keys(map).length > 0) return map;
  if (distro === 'debian') return PACKAGE_MAP['ubuntu'];
  if (distro === 'rhel' || distro === 'opensuse') return PACKAGE_MAP['fedora'];
  return {};
}

function buildInstallCommands(distro: DistroId, missingLibs: LibCheck[]): string[] {
  const pkgMap = getPackageMap(distro);
  const pkgSet = new Set<string>();

  for (const lib of missingLibs) {
    const pkgs = pkgMap[lib.name];
    if (pkgs) pkgs.forEach(p => pkgSet.add(p));
  }

  const pkgs = [...pkgSet].sort();
  if (pkgs.length === 0) return [];

  switch (distro) {
    case 'ubuntu':
    case 'debian':
      return [`sudo apt-get update && sudo apt-get install -y ${pkgs.join(' ')}`];
    case 'fedora':
    case 'rhel':
      return [`sudo dnf install -y ${pkgs.join(' ')}`];
    case 'arch':
      return [`sudo pacman -S --needed ${pkgs.join(' ')}`];
    case 'opensuse':
      return [`sudo zypper install -y ${pkgs.join(' ')}`];
    case 'alpine':
      return [`sudo apk add ${pkgs.join(' ')}`];
    default:
      return [];
  }
}

// ── Actual Chromium Launch Test ─────────────────────────────────────

export function tryLaunchChromium(binaryPath?: string): { canLaunch: boolean; error?: string } {
  const candidates = binaryPath ? [binaryPath] : [
    process.env.CLOAKBROWSER_BINARY_PATH,
    `${process.env.HOME}/.cloakbrowser/chromium/chrome`,
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/snap/bin/chromium',
  ].filter(Boolean) as string[];

  for (const bin of candidates) {
    if (!existsSync(bin)) continue;
    try {
      const result = spawnSync(bin, ['--version'], {
        encoding: 'utf-8',
        timeout: 5000,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      if (result.status === 0 && result.stdout.trim()) {
        return { canLaunch: true };
      }
      if (result.error) {
        return { canLaunch: false, error: `Binary found at ${bin} but cannot execute: ${result.error.message}` };
      }
      if (result.stderr?.includes('error while loading shared libraries')) {
        return { canLaunch: false, error: result.stderr.trim() };
      }
    } catch (e: any) {
      return { canLaunch: false, error: e.message };
    }
  }
  return { canLaunch: false, error: 'No Chromium binary found on system PATH' };
}

// ── Main Diagnostic ─────────────────────────────────────────────────

export function runChromiumDiagnostic(): ChromiumDiagResult {
  const distro = detectDistro();
  const results = checkLibraries();
  const missing = results.filter(r => !r.found);
  const foundCount = results.filter(r => r.found).length;
  const installCmd = missing.length > 0 ? buildInstallCommands(distro.id, missing) : [];

  const launchResult = installCmd.length === 0 ? tryLaunchChromium() : { canLaunch: false, error: undefined };

  return {
    allLibsFound: missing.length === 0,
    distro,
    results,
    missing,
    foundCount,
    totalCount: results.length,
    installCmd,
    canLaunch: launchResult.canLaunch,
    launchError: launchResult.error,
  };
}

export function formatDiagResult(result: ChromiumDiagResult): string {
  const lines: string[] = [];

  lines.push(`Distro: ${result.distro.name} ${result.distro.version}`);
  lines.push(`All libraries: ${result.allLibsFound ? 'OK' : `MISSING ${result.missing.length}/${result.totalCount}`}`);

  if (result.missing.length > 0 && result.installCmd.length > 0) {
    lines.push(`Install: ${result.installCmd[0]}`);
  }

  if (result.canLaunch) {
    lines.push('Chromium launch: OK');
  } else if (result.launchError) {
    lines.push(`Chromium launch: FAILED — ${result.launchError}`);
  } else if (!result.allLibsFound) {
    lines.push('Chromium launch: SKIPPED (missing libraries)');
  } else {
    lines.push('Chromium launch: FAILED (no binary found)');
  }

  return lines.join('\n');
}

// ── CLI entry point (for install.sh and standalone use) ─────────────

// When invoked directly with `bun run src/diagnostics/chromium.ts`
const isMain = process.argv[1]?.endsWith('chromium.ts');
if (isMain) {
  const result = runChromiumDiagnostic();
  const summary = formatDiagResult(result);
  process.stdout.write(summary + '\n');
  process.exit(result.canLaunch ? 0 : 1);
}
