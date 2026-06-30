#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/alay-arch/qwen-forge.git"
BRANCH="main"
INSTALL_DIR="${HOME}/.qwen-forge"
BIN_DIR="${HOME}/.local/bin"
QF_LINK="${BIN_DIR}/qf"

ok()    { printf "  ✓ %s\n" "$*"; }
warn()  { printf "  ⚠ %s\n" "$*"; }
fail()  { printf "  ✗ %s\n" "$*"; exit 1; }

[ "$(id -u)" -ne 0 ] || [ -n "${QWEN_FORGE_ALLOW_ROOT:-}" ] || fail "Do not run as root"
case "$HOME" in *$'\n'*|*$'\r'*|*'`'*|*'"'*|*'\\'*) fail "Unsafe HOME path"; esac

check_prerequisites() {
  command -v git >/dev/null || fail "git not found"
  ok "git"
  command -v curl >/dev/null || command -v wget >/dev/null || fail "curl or wget not found"
  ok "curl/wget"
  command -v bun >/dev/null || fail "bun not found — Install: curl -fsSL https://bun.sh/install | bash"
  ok "bun $(bun --version 2>/dev/null || true)"
}

detect_platform() {
  if [ -f /etc/os-release ]; then
    (. /etc/os-release && printf "%s" "${ID}")
  elif [ -f /etc/arch-release ]; then echo "arch"
  elif [ -f /etc/alpine-release ]; then echo "alpine"
  elif [ -f /etc/gentoo-release ]; then echo "gentoo"
  elif [ -f /etc/void-release ]; then echo "void"
  else echo "unknown"
  fi
}

clone_or_update() {
  if [ -d "$INSTALL_DIR" ]; then
    cd "$INSTALL_DIR"
    git fetch origin "$BRANCH" 2>/dev/null || true
    git reset --hard "origin/$BRANCH" 2>/dev/null || fail "Failed to update repository"
  else
    git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$INSTALL_DIR" || fail "Failed to clone repository"
  fi
  cd "$INSTALL_DIR"
}

install_dependencies() {
  bun install 2>&1 || fail "bun install failed"
  bun run typecheck 2>/dev/null || warn "Type check found issues"
}

register_command() {
  mkdir -p "$BIN_DIR"
  ln -sf "$INSTALL_DIR/bin/qf" "$QF_LINK"
}

update_shell_path() {
  local updated=false

  if [ -f "$HOME/.config/fish/config.fish" ]; then
    grep -qsF "$BIN_DIR" "$HOME/.config/fish/config.fish" 2>/dev/null || {
      printf '\n%s\n' "fish_add_path $BIN_DIR" >> "$HOME/.config/fish/config.fish"
      updated=true
    }
  fi

  for f in "$HOME/.bashrc" "$HOME/.bash_profile" "$HOME/.profile" \
           "$HOME/.zshrc" "$HOME/.zprofile"; do
    [ -f "$f" ] || continue
    grep -qsF "$BIN_DIR" "$f" 2>/dev/null && continue
    printf '\n%s\n' "export PATH=\"$BIN_DIR:\$PATH\"" >> "$f"
    updated=true
  done

  export PATH="$BIN_DIR:$PATH"
  hash -r 2>/dev/null || true
  [ "$updated" = true ]
}

verify_installation() {
  command -v qf >/dev/null
}

chromium_diagnostic() {
  [ -f "$INSTALL_DIR/src/diagnostics/chromium.ts" ] || return 0

  local output
  if output=$(bun run "$INSTALL_DIR/src/diagnostics/chromium.ts" 2>/dev/null); then
    ok "Runtime OK"
    return 0
  fi

  local not_found=false
  local install_cmd=""

  while IFS= read -r line; do
    case "$line" in
      "Chromium launch: NOT FOUND"*) not_found=true ;;
      "Install: "*) install_cmd="${line#Install: }" ;;
    esac
  done <<< "$output"

  if [ "$not_found" = true ]; then
    ok "Will download on first run"
    return 0
  fi

  printf "  ✗ Missing system libraries\n"
  [ -n "$install_cmd" ] && printf "    %s\n" "$install_cmd"
  return 0
}

get_version() {
  cd "$INSTALL_DIR" 2>/dev/null && bun -e "
    import { readFileSync } from 'fs';
    console.log(JSON.parse(readFileSync('package.json','utf-8')).version);
  " 2>/dev/null || echo "unknown"
}

printf "\n"

printf "  ⠼ Checking environment...\n"
check_prerequisites

printf "\n"
printf "  ⠼ Installing Qwen Forge...\n"
clone_or_update
ok "Repository ready"

printf "\n"
printf "  ⠼ Installing dependencies...\n"
install_dependencies
ok "Dependencies installed"

printf "\n"
printf "  ⠼ Registering qf...\n"
register_command
ok "qf ready"

printf "\n"
if update_shell_path; then
  ok "PATH updated"
fi

printf "  ⠼ Verifying installation...\n"
if verify_installation; then
  ok "qf is available"
else
  warn "Restart your shell or run: export PATH=\"$BIN_DIR:\$PATH\""
fi

printf "\n"
printf "  ⠼ Chromium runtime...\n"
chromium_diagnostic

printf "\n"
ok "Installed Qwen Forge $(get_version)"
printf "\n"
printf "  Run: qf\n"
