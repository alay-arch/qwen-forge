# Installation

## Requirements

- **Bun** ≥ 1.1 (https://bun.sh)
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
1. Checks for Bun, Git, curl
2. Clones the repository to `~/.qwen-forge`
3. Runs `bun install`
4. Registers the `qf` command globally in `~/.local/bin/qf`
5. Adds `~/.local/bin` to your PATH (via `.bashrc`/`.zshrc`)

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
bun run src/index.ts
```

Or using the entry point:

```bash
./bin/qf
```

Global registration:

```bash
bun link
```

## Updates

Re-run the install script:

```bash
curl -fsSL https://raw.githubusercontent.com/alay-arch/qwen-forge/main/install.sh | bash
```

The script fetches the latest changes and resets the local repository.
