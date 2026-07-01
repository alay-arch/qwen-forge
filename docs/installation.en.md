# Installation

## Requirements

| Dependency | Minimum version |
|------------|-----------------|
| Bun        | ≥ 1.3           |
| Git        | any             |
| Chromium / Google Chrome | system package |

**OS**: Linux (Windows via WSL)

## Installation (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/alay-arch/qwen-forge/main/install.sh | bash
```

The `install.sh` script:
1. Checks for Bun, Git, and curl/wget
2. Clones the repository to `~/.qwen-forge`
3. Installs dependencies (`bun install`)
4. Creates a `qf` symlink in `~/.local/bin/qf`
5. Adds `~/.local/bin` to PATH
6. Runs Chromium diagnostics

**Do not run with `sudo`** — installation is for the current user only.

After installation, restart your terminal:
```bash
source ~/.bashrc
qf --version
```

## Manual installation

```bash
git clone https://github.com/alay-arch/qwen-forge.git
cd qwen-forge
bun install
```

Run without global registration:
```bash
./bin/qf
```

Or via Bun:
```bash
bun src/index.ts
```

## Updating

```bash
curl -fsSL https://raw.githubusercontent.com/alay-arch/qwen-forge/main/install.sh | bash
```

Or manually:
```bash
cd ~/.qwen-forge
git pull
bun install
```

## Verify installation

```bash
qf --version
```

Should display version `0.1.3-beta`.

## Next steps

- [Usage](cli.en.md)
- [Configuration](configuration.en.md)
- [Troubleshooting](troubleshooting.en.md)
