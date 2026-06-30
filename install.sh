#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/alay-arch/qwen-forge.git"
BRANCH="main"
INSTALL_DIR="${HOME}/.qwen-forge"
BIN_DIR="${HOME}/.local/bin"
QF_LINK="${BIN_DIR}/qf"
QF_VERSION="unknown"
CLEANUP_DIR=""
SPINNER_PID=""

# ─── Spinner & Output Helpers ────────────────────────────────────────
SPIN_FRAMES=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")

stop_spinner() {
    if [ -n "${SPINNER_PID:-}" ]; then
        # Проверяем, что процесс ещё существует, прежде чем взаимодействовать
        if kill -0 "$SPINNER_PID" 2>/dev/null; then
            kill "$SPINNER_PID" 2>/dev/null || true
            wait "$SPINNER_PID" 2>/dev/null || true
        fi
        SPINNER_PID=""
    fi
    # Очищаем строку от остатков спиннера
    printf '\r\033[K' >&2
}

trap stop_spinner EXIT INT TERM

spin_msg() {
    stop_spinner
    local msg="$1"
    (
        local i=0
        while true; do
            printf "\r  %s %s" "${SPIN_FRAMES[$((i % ${#SPIN_FRAMES[@]}))]}" "$msg" >&2
            i=$((i + 1))
            sleep 0.08
        done
    ) &
    SPINNER_PID=$!
    disown "$SPINNER_PID" 2>/dev/null || true
}

ok() {
    stop_spinner
    printf "  ✓ %s\n" "$*"
}

warn() {
    stop_spinner
    printf "  ⚠ %s\n" "$*"
}

fail() {
    stop_spinner
    printf "  ✗ %s\n" "$*"
    exit 1
}

# ─── Safety Checks ───────────────────────────────────────────────────
if [ -z "${HOME:-}" ]; then
    fail "HOME environment variable is not set."
fi

[ "$(id -u)" -ne 0 ] || [ -n "${QWEN_FORGE_ALLOW_ROOT:-}" ] || fail "Do not run as root"
case "$HOME" in *$'\n'*|*$'\r'*|*'`'*|*'"'*|*'\\'*) fail "Unsafe HOME path"; esac

cleanup() {
    stop_spinner
    if [ -n "$CLEANUP_DIR" ] && [ -d "$CLEANUP_DIR" ]; then
        rm -rf "$CLEANUP_DIR"
    fi
}
trap cleanup EXIT

# ─── Core Functions ──────────────────────────────────────────────────
detect_user_shell() {
    local shell_path=""
    if command -v getent >/dev/null 2>&1; then
        shell_path=$(getent passwd "$(id -u)" 2>/dev/null | cut -d: -f7)
    fi
    if [ -z "$shell_path" ] && [ -n "${SHELL:-}" ]; then
        shell_path="$SHELL"
    fi
    if [ -z "$shell_path" ]; then
        if [ -n "${BASH_VERSION:-}" ]; then shell_path="bash"
        elif [ -n "${ZSH_VERSION:-}" ]; then shell_path="zsh"
        elif [ -n "${FISH_VERSION:-}" ]; then shell_path="fish"
        else shell_path="sh"
        fi
    fi
    basename "$shell_path"
}

is_path_configured() {
    local f="$1"
    if grep -qF "$BIN_DIR" "$f" 2>/dev/null; then return 0; fi
    if grep -qF "\$HOME/.local/bin" "$f" 2>/dev/null; then return 0; fi
    if grep -qF "\${HOME}/.local/bin" "$f" 2>/dev/null; then return 0; fi
    if grep -qF "fish_add_path" "$f" 2>/dev/null && grep -qF ".local/bin" "$f" 2>/dev/null; then return 0; fi
    return 1
}

check_prerequisites() {
    spin_msg "Checking environment..."
    command -v git >/dev/null || fail "git not found"
    ok "git"

    spin_msg "Checking environment..."
    command -v curl >/dev/null || command -v wget >/dev/null || fail "curl or wget not found"
    ok "curl/wget"

    spin_msg "Checking environment..."
    command -v bun >/dev/null || fail "bun not found — Install: curl -fsSL https://bun.sh/install | bash"
    ok "bun"
}

clone_or_update() {
    spin_msg "Installing Qwen Forge..."
    if [ -d "$INSTALL_DIR" ]; then
        if [ ! -d "$INSTALL_DIR/.git" ]; then
            fail "$INSTALL_DIR exists but is not a git repository. Remove it manually to reinstall."
        fi
        cd "$INSTALL_DIR"

        if ! git diff-index --quiet HEAD -- 2>/dev/null || ! git diff-index --cached --quiet HEAD -- 2>/dev/null; then
            fail "Uncommitted changes to tracked files detected in $INSTALL_DIR. Aborting to protect your work."
        fi

        if ! git symbolic-ref HEAD >/dev/null 2>&1; then
            fail "Repository is in a detached HEAD state. Aborting."
        fi

        spin_msg "Updating repository..."
        git fetch origin "$BRANCH" >/dev/null 2>&1 || fail "Failed to fetch from origin"

        local local_hash origin_hash
        local_hash=$(git rev-parse HEAD 2>/dev/null || echo "")
        origin_hash=$(git rev-parse "origin/$BRANCH" 2>/dev/null || echo "")

        if [ -z "$local_hash" ] || [ -z "$origin_hash" ]; then
            fail "Failed to resolve git references."
        fi

        if [ "$local_hash" != "$origin_hash" ]; then
            if git merge-base --is-ancestor "$local_hash" "origin/$BRANCH" 2>/dev/null; then
                git merge --ff-only "origin/$BRANCH" >/dev/null 2>&1 || fail "Fast-forward merge failed."
            else
                fail "Local commits detected in $INSTALL_DIR that diverge from origin. Aborting to prevent data loss."
            fi
        fi
    else
        CLEANUP_DIR="$INSTALL_DIR"
        git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$INSTALL_DIR" >/dev/null 2>&1 || fail "Failed to clone repository"
        CLEANUP_DIR=""
        cd "$INSTALL_DIR"
    fi
    ok "Repository installed"
}

install_dependencies() {
    spin_msg "Installing dependencies..."
    if [ -f "bun.lockb" ] || [ -f "bun.lock" ]; then
        bun install --frozen-lockfile >/dev/null 2>&1 || fail "bun install --frozen-lockfile failed"
    else
        bun install >/dev/null 2>&1 || fail "bun install failed"
    fi
    ok "Dependencies installed"
}

read_version() {
    if [ -f "$INSTALL_DIR/package.json" ]; then
        QF_VERSION=$(QF_PKG="$INSTALL_DIR/package.json" bun -e "import { readFileSync } from 'fs'; console.log(JSON.parse(readFileSync(process.env.QF_PKG, 'utf8')).version);" 2>/dev/null || echo "unknown")
    fi
}

register_command() {
    spin_msg "Registering qf..."
    mkdir -p "$BIN_DIR" || fail "Failed to create $BIN_DIR"

    local target="$INSTALL_DIR/bin/qf"
    if [ ! -f "$target" ]; then
        fail "Target script $target does not exist"
    fi
    if [ ! -x "$target" ]; then
        chmod +x "$target" || fail "Failed to make $target executable"
    fi

    if [ -e "$QF_LINK" ] || [ -L "$QF_LINK" ]; then
        if [ -L "$QF_LINK" ]; then
            local current_target
            current_target=$(readlink "$QF_LINK")
            if [ "$current_target" != "$target" ] && [ "$current_target" != "$INSTALL_DIR/bin/qf" ]; then
                warn "$QF_LINK already exists and points to $current_target. Overwriting."
            fi
        else
            fail "$QF_LINK exists and is not a symlink. Please remove it manually."
        fi
    fi

    ln -sf "$target" "$QF_LINK" || fail "Failed to create symlink $QF_LINK"

    if [ ! -L "$QF_LINK" ]; then
        fail "Symlink $QF_LINK was not created"
    fi
    if [ ! -e "$QF_LINK" ]; then
        fail "Symlink $QF_LINK is broken (target missing)"
    fi
    ok "qf launcher installed"
}

update_shell_config() {
    local shell_name="$1"

    if [ "$shell_name" = "fish" ]; then
        if command -v fish >/dev/null 2>&1; then
            if ! fish -c "contains $BIN_DIR \$fish_user_paths" >/dev/null 2>&1; then
                if fish -c "fish_add_path $BIN_DIR" >/dev/null 2>&1; then
                    echo "added:fish_user_paths"
                    return 0
                fi
            else
                echo "present:fish_user_paths"
                return 0
            fi
        fi
    fi

    local config_files=()
    local path_cmd=""

    case "$shell_name" in
        zsh)
            config_files=("$HOME/.zshrc" "$HOME/.zprofile")
            path_cmd="export PATH=\"$BIN_DIR:\$PATH\""
            ;;
        fish)
            config_files=("$HOME/.config/fish/config.fish")
            path_cmd="set -gx PATH \"$BIN_DIR\" \$PATH"
            ;;
        bash|*)
            config_files=("$HOME/.bashrc" "$HOME/.bash_profile" "$HOME/.profile")
            path_cmd="export PATH=\"$BIN_DIR:\$PATH\""
            ;;
    esac

    for f in "${config_files[@]}"; do
        if [ -f "$f" ]; then
            if is_path_configured "$f"; then
                echo "present:$f"
                return 0
            fi
        fi
    done

    for f in "${config_files[@]}"; do
        local dir
        dir="$(dirname "$f")"
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir" 2>/dev/null || continue
        fi
        if [ -w "$dir" ] || [ -w "$f" ]; then
            printf '\n# Qwen Forge\n%s\n' "$path_cmd" >> "$f"
            echo "added:$f"
            return 0
        fi
    done

    echo "none"
}

verify_current_shell() {
    case ":$PATH:" in
        *":$BIN_DIR:"*)
            if command -v qf >/dev/null 2>&1; then
                local qf_path
                qf_path=$(command -v qf)
                if [ "$qf_path" = "$QF_LINK" ] || [ "$qf_path" = "$INSTALL_DIR/bin/qf" ] || [ "$qf_path" = "$BIN_DIR/qf" ]; then
                    if qf --version >/dev/null 2>&1; then
                        echo "ready"
                    else
                        echo "broken"
                    fi
                else
                    echo "shadowed"
                fi
            else
                echo "broken"
            fi
            ;;
        *)
            echo "missing"
            ;;
    esac
}

chromium_diagnostic() {
    if [ ! -f "$INSTALL_DIR/src/diagnostics/chromium.ts" ]; then
        return 0
    fi

    spin_msg "Checking Chromium runtime..."
    if bun run "$INSTALL_DIR/src/diagnostics/chromium.ts" >/dev/null 2>&1; then
        ok "Chromium runtime OK"
    else
        warn "Chromium dependencies might be missing. Run 'qf' and select 'Diagnostics'."
    fi
}

verify_system() {
    printf "\n  ⠼ Qwen Forge Health Check\n\n"

    if [ -d "$INSTALL_DIR/.git" ]; then ok "Repository"; else fail "Repository missing"; fi
    if [ -d "$INSTALL_DIR/node_modules" ] || [ -d "$INSTALL_DIR/.bun" ]; then ok "Dependencies"; else warn "Dependencies missing"; fi
    if [ -f "$INSTALL_DIR/bin/qf" ] && [ -x "$INSTALL_DIR/bin/qf" ]; then ok "qf launcher source"; else fail "qf launcher source missing"; fi
    if [ -L "$QF_LINK" ] && [ -e "$QF_LINK" ]; then ok "qf symlink"; else warn "qf symlink broken or missing"; fi

    local shell_name
    shell_name=$(detect_user_shell)
    local configured=false
    if [ "$shell_name" = "fish" ]; then
        if command -v fish >/dev/null 2>&1 && fish -c "contains $BIN_DIR \$fish_user_paths" >/dev/null 2>&1; then
            configured=true
        fi
    else
        local config_files=()
        case "$shell_name" in
            zsh) config_files=("$HOME/.zshrc" "$HOME/.zprofile") ;;
            *) config_files=("$HOME/.bashrc" "$HOME/.bash_profile" "$HOME/.profile") ;;
        esac
        for f in "${config_files[@]}"; do
            if [ -f "$f" ] && is_path_configured "$f"; then
                configured=true
                break
            fi
        done
    fi
    if [ "$configured" = true ]; then ok "Shell configuration"; else warn "Shell configuration missing"; fi

    case ":$PATH:" in
        *":$BIN_DIR:"*)
            if command -v qf >/dev/null 2>&1; then
                ok "PATH & command resolution"
                if qf --version >/dev/null 2>&1; then
                    ok "qf execution"
                else
                    warn "qf execution failed"
                fi
            else
                warn "qf not found in current PATH"
            fi
            ;;
        *)
            warn "BIN_DIR not in current PATH (requires shell restart or source)"
            ;;
    esac

    read_version
    ok "Version: $QF_VERSION"

    printf "\n"
    exit 0
}

main() {
    if [ "${1:-}" = "--verify" ]; then
        verify_system
    fi

    printf "\n"
    check_prerequisites

    printf "\n"
    clone_or_update

    printf "\n"
    install_dependencies

    read_version

    printf "\n"
    register_command

    printf "\n"
    spin_msg "Updating shell configuration..."
    local user_shell
    user_shell=$(detect_user_shell)

    local config_result
    config_result=$(update_shell_config "$user_shell")

    local status="${config_result%%:*}"
    local file="${config_result#*:}"

    if [ "$status" = "added" ]; then
        local display_file="${file/#$HOME/\~}"
        ok "Added $BIN_DIR to $display_file"
    elif [ "$status" = "present" ]; then
        local display_file="${file/#$HOME/\~}"
        ok "$BIN_DIR already in $display_file"
    else
        warn "Could not find a writable shell configuration file"
    fi

    printf "\n"
    spin_msg "Verifying installation..."
    local shell_status
    shell_status=$(verify_current_shell)

    if [ "$shell_status" = "ready" ]; then
        ok "qf is ready"
    elif [ "$shell_status" = "broken" ]; then
        warn "qf is in PATH but verification failed"
    elif [ "$shell_status" = "shadowed" ]; then
        warn "qf is shadowed by another binary in PATH"
    else
        stop_spinner
        printf "\n"
        printf "────────────────────────────\n"
        printf "Qwen Forge has been installed.\n"
        printf "\n"
        printf "To enable the qf command, restart your shell\n"
        printf "or run\n"
        printf "\n"
        local source_cmd="source ~/.bashrc"
        if [ "$status" = "added" ] || [ "$status" = "present" ]; then
            source_cmd="source ${file/#$HOME/\~}"
        fi
        printf "%s\n" "$source_cmd"
        printf "\n"
        printf "Then verify:\n"
        printf "\n"
        printf "qf --version\n"
        printf "────────────────────────────\n"
    fi

    printf "\n"
    chromium_diagnostic

    printf "\n"
    ok "Installed Qwen Forge $QF_VERSION"
    printf "\n"
}

main "$@"