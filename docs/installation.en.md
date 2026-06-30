# Installation

## Requirements

- **Bun** ≥ 1.3 (https://bun.sh)
- **Git** (for installation from the repository)
- **OS**: Linux (Windows via WSL)

```bash
curl -fsSL https://bun.sh/install | bash
```

## Install (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/alay-arch/qwen-forge/main/install.sh | bash
```

The install script:
1. Checks for Bun, Git, and curl/wget
2. Clones the repository to `~/.qwen-forge`
3. Runs `bun install`
4. Registers the user-local `qf` command in `~/.local/bin/qf`
5. Prepends `~/.local/bin` to PATH via your shell config
6. Verifies that PATH resolves to the installed `qf`
7. Runs Chromium diagnostics through a real headless launch

Do not run the installer through `sudo`: installation is for the current user. For root-only environments, set `QWEN_FORGE_ALLOW_ROOT=1` intentionally.

After installation, open a new terminal:

```bash
qf
```

## Manual installation

```bash
git clone https://github.com/alay-arch/qwen-forge.git
cd qwen-forge
bun install
```

Run without global registration:

```bash
bun src/index.ts
```

Or using the entry point:

```bash
./bin/qf
```

Command registration through Bun:

```bash
bun link
```

## Updates

Re-run the install script:

```bash
curl -fsSL https://raw.githubusercontent.com/alay-arch/qwen-forge/main/install.sh | bash
```

The script fetches the latest changes and resets the installed repository only when there are no local changes.
