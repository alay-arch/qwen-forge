# Installation

## Requirements

| Dependency | Minimum Version |
|------------|----------------|
| Bun        | ≥ 1.3          |
| Git        | any            |
| Chromium / Google Chrome | system package |

**OS**: Linux (Windows via WSL)

```bash
curl -fsSL https://bun.sh/install | bash
```

## Install (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/alay-arch/qwen-forge/main/install.sh | bash
```

The install.sh script:
1. Checks for Bun, Git, and curl/wget
2. Clones the repository to `~/.qwen-forge`
3. Installs dependencies (`bun install`)
4. Creates a `qf` symlink at `~/.local/bin/qf`
5. Prepends `~/.local/bin` to PATH via shell configuration
6. Verifies PATH resolution
7. Runs Chromium diagnostics (real headless launch)

**Do not run via `sudo`** — installation is for the current user. For root environments, use `QWEN_FORGE_ALLOW_ROOT=1`.

After installation, restart your terminal:

```bash
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

The script performs `git fetch` and `git reset --hard` in `~/.qwen-forge` only if there are no local changes.

## Uninstalling

```bash
rm -rf ~/.qwen-forge
rm -f ~/.local/bin/qf
```

Remove the `~/.local/bin` line from your shell config (`~/.bashrc`, `~/.zshrc`, etc.) if it was added by the install script.

## Supported Shells

| Shell | Supported |
|-------|-----------|
| bash  | Yes       |
| zsh   | Yes       |
| fish  | Yes       |

The install script automatically detects your configuration file.

## PATH

The `qf` command is installed in `~/.local/bin/`. This directory is prepended to PATH via the first found configuration file:

- `~/.bashrc`
- `~/.zshrc`
- `~/.config/fish/config.fish`

If PATH did not update after installation, open a new terminal or run `source ~/.bashrc` (or the corresponding file for your shell).

## Installation Troubleshooting

### `command not found: qf`

1. Restart your terminal
2. Verify `~/.local/bin` is in PATH: `echo $PATH`
3. Check that the symlink exists: `ls -la ~/.local/bin/qf`

### Chromium not found

Install Chromium or Google Chrome:

```bash
# Debian / Ubuntu
sudo apt install chromium-browser

# Arch Linux
sudo pacman -S chromium

# Fedora
sudo dnf install chromium
```

### Bun not found

```bash
curl -fsSL https://bun.sh/install | bash
```

### Error: Application already running

The previous process did not exit. Remove the lock file:

```bash
rm -f .qwen-forge.lock
```

### Debug Mode

Run with extended logging:

```bash
qf --debug
```

Logs are output to the console (TRACE level) and written to `logs/app.log`.