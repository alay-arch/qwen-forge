#!/usr/bin/env bash
set -eu

# ─── Qwen Forge Installer ─────────────────────────────────────────────────
# Usage: curl -fsSL https://raw.githubusercontent.com/alay-arch/qwen-forge/main/install.sh | bash
#
# Installs Qwen Forge globally:
#   1. Checks prerequisites (bash, curl/wget, git, bun)
#   2. Clones or updates the repo to ~/.qwen-forge
#   3. Installs dependencies and runs TypeScript checks
#   4. Symlinks qf to ~/.local/bin/qf (or $HOME/bin/qf)
#   5. Prints next steps
# ──────────────────────────────────────────────────────────────────────────

REPO_URL="https://github.com/alay-arch/qwen-forge.git"
INSTALL_DIR="${HOME}/.qwen-forge"
BIN_DIR="${HOME}/.local/bin"
QF_LINK="${BIN_DIR}/qf"
BRANCH="main"

# ─── Helper functions ──────────────────────────────────────────────────────

info()  { printf "\033[36m%s\033[0m\n" "$*"; }
ok()    { printf "\033[32m✓ %s\033[0m\n" "$*"; }
warn()  { printf "\033[33m⚠ %s\033[0m\n" "$*"; }
fail()  { printf "\033[31m✗ %s\033[0m\n" "$*"; exit 1; }
cmd()   { command -v "$1" >/dev/null 2>&1; }

# ─── Step 0: Check prerequisites ──────────────────────────────────────────

section_header() { printf "\n─── %s ───\n\n" "$1"; }

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║        Qwen Forge Installer              ║"
echo "╚══════════════════════════════════════════╝"
echo ""

section_header "1/4  Checking prerequisites"

MISSING=""

for tool in bash curl git; do
  if cmd "$tool"; then
    ok "$tool"
  else
    warn "$tool not found"
    MISSING="$MISSING $tool"
  fi
done

# Check for bun (required)
if cmd "bun"; then
  ok "bun"
else
  warn "bun not found"
  MISSING="$MISSING bun"
fi

if [ -n "$MISSING" ]; then
  echo ""
  warn "Missing components:$MISSING"
  echo ""
  echo "  Install Bun (required):"
  echo "    curl -fsSL https://bun.sh/install | bash"
  echo ""
  echo "  Install Git:"
  echo "    apt install git   # Debian/Ubuntu"
  echo "    pacman -S git     # Arch"
  echo "    dnf install git   # Fedora"
  echo ""
  echo "  curl and bash are typically pre-installed."
  exit 1
fi

# ─── Step 1: Clone or update repo ─────────────────────────────────────────

section_header "2/4  Installing Qwen Forge"

if [ -d "$INSTALL_DIR" ]; then
  info "Updating existing installation at $INSTALL_DIR"

  # Save current version for rollback info
  OLD_VERSION=""
  if [ -f "$INSTALL_DIR/package.json" ]; then
    OLD_VERSION=$(grep '"version"' "$INSTALL_DIR/package.json" | head -1 | sed 's/.*: *"\(.*\)".*/\1/' 2>/dev/null || true)
  fi

  cd "$INSTALL_DIR"
  git fetch origin "$BRANCH" 2>/dev/null || true
  git reset --hard "origin/$BRANCH" 2>/dev/null || fail "Failed to update repository"

  NEW_VERSION=""
  if [ -f "$INSTALL_DIR/package.json" ]; then
    NEW_VERSION=$(grep '"version"' "$INSTALL_DIR/package.json" | head -1 | sed 's/.*: *"\(.*\)".*/\1/' 2>/dev/null || true)
  fi

  if [ -n "$NEW_VERSION" ] && [ "$OLD_VERSION" != "$NEW_VERSION" ]; then
    info "  Updated: ${OLD_VERSION:-unknown} → $NEW_VERSION"
  else
    ok "Already up to date"
  fi
else
  info "Cloning repository..."
  git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$INSTALL_DIR" || \
    fail "Failed to clone repository. Check network or URL: $REPO_URL"
  ok "Repository cloned"
fi

cd "$INSTALL_DIR"

# ─── Step 2: Install dependencies ──────────────────────────────────────────

section_header "3/4  Installing dependencies"

info "Running bun install..."
bun install 2>&1 | tail -3 || fail "bun install failed"
ok "Dependencies installed"

info "Running type check..."
if bun run typecheck 2>&1; then
  ok "Type check passed"
else
  warn "Type check found issues — installation continues"
fi

# ─── Step 3: Register global command ───────────────────────────────────────

section_header "4/4  Registering global command"

mkdir -p "$BIN_DIR"

# Create a wrapper script that points to the installed repo
cat > "$QF_LINK" << 'WRAPPER'
#!/usr/bin/env bash
exec bun run "$HOME/.qwen-forge/src/index.ts" "$@"
WRAPPER
chmod +x "$QF_LINK"
ok "qf registered at $QF_LINK"

# Ensure BIN_DIR is in PATH
SHELL_CONFIG=""
if [ -f "$HOME/.bashrc" ]; then
  SHELL_CONFIG="$HOME/.bashrc"
elif [ -f "$HOME/.zshrc" ]; then
  SHELL_CONFIG="$HOME/.zshrc"
elif [ -f "$HOME/.profile" ]; then
  SHELL_CONFIG="$HOME/.profile"
elif [ -f "$HOME/.bash_profile" ]; then
  SHELL_CONFIG="$HOME/.bash_profile"
fi

if [ -n "$SHELL_CONFIG" ]; then
  if ! grep -q "$BIN_DIR" "$SHELL_CONFIG" 2>/dev/null; then
    printf '\nexport PATH="$PATH:%s"\n' "$BIN_DIR" >> "$SHELL_CONFIG"
    ok "Added $BIN_DIR to PATH in $SHELL_CONFIG"
  else
    ok "$BIN_DIR already in PATH"
  fi
else
  warn "No shell config found. Add to PATH manually:"
  echo "    export PATH=\"\$PATH:$BIN_DIR\""
fi

# If .local/bin isn't in PATH right now, update PATH for this session
case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *) export PATH="$PATH:$BIN_DIR" ;;
esac

# ─── Done ──────────────────────────────────────────────────────────────────

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Installation complete!                  ║"
echo "╚══════════════════════════════════════════╝"
echo ""

ok "Qwen Forge is installed"

if [ -f "$INSTALL_DIR/package.json" ]; then
  VERSION=$(grep '"version"' "$INSTALL_DIR/package.json" | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
  info "  Version: $VERSION"
fi
info "  Location: $INSTALL_DIR"
info "  Command:  qf"
echo ""

info "Usage:"
echo "  qf              Start interactive menu"
echo "  qf --debug      Run with debug logging (TRACE)"
echo "  qf --help       Show help"
echo ""

# Verify
if cmd "qf"; then
  ok "qf command is available"
  echo ""
  info "Open a new terminal and run:"
  echo "  qf"
else
  warn "qf not yet in PATH for this session"
  echo ""
  info "Run one of these:"
  echo "  source $SHELL_CONFIG"
  echo "  export PATH=\"\$PATH:$BIN_DIR\""
  echo "  qf"
fi
echo ""
