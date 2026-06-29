#!/usr/bin/env bash
set -euo pipefail

echo "🧹 Preparing project for publication..."
echo ""

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# ── Helper ────────────────────────────────────────────────────────
remove_if_exists() {
  local path="$1"
  if [ -e "$path" ]; then
    rm -rf "$path"
    echo "  ✓ Removed: $path"
  fi
}

remove_glob() {
  local pattern="$1"
  local found=false
  while IFS= read -r -d '' f; do
    rm -rf "$f"
    echo "  ✓ Removed: $f"
    found=true
  done < <(find . -maxdepth 1 -name "$pattern" -print0 2>/dev/null)
  $found || true
}

# ── Build artifacts ───────────────────────────────────────────────
echo "[1/7] Build artifacts"
remove_if_exists "node_modules"
remove_if_exists "dist"
remove_if_exists "build"
remove_if_exists "coverage"
remove_if_exists ".cache"
remove_if_exists ".tmp"
remove_if_exists "temp"

# ── Logs & temp files ─────────────────────────────────────────────
echo ""
echo "[2/7] Logs and temporary files"
remove_if_exists "logs"
remove_glob "*.log"
remove_glob "*.tmp"
remove_glob "*.temp"
remove_if_exists "npm-debug.log*"
remove_if_exists "yarn-debug.log*"
remove_if_exists "yarn-error.log*"

# ── Environment files ─────────────────────────────────────────────
echo ""
echo "[3/7] Environment and secrets"
remove_if_exists ".env"
remove_if_exists ".env.local"
remove_if_exists ".env.development"
remove_if_exists ".env.production"
remove_if_exists ".env.test"

# ── Browser profiles & caches ──────────────────────────────────
echo ""
echo "[4/7] Browser profiles and caches"
remove_if_exists ".browser"
remove_if_exists ".browser-profile"
remove_if_exists ".alay"
remove_if_exists ".asd"
remove_if_exists ".asdk"
remove_if_exists ".asdsaqw"
remove_if_exists ".brow"
remove_if_exists "cookies"
remove_if_exists "sessions"
remove_glob ".playwright*"
remove_glob "chromium*"
remove_glob "chrome*"
remove_if_exists ".cache/playwright"
remove_if_exists ".cache/chromium"
remove_if_exists ".cache/puppeteer"

# ── Cache and temp dirs ───────────────────────────────────────────
echo ""
echo "[5/7] Cache and temporary directories"
remove_if_exists ".cache"
remove_glob "*.sqlite"
remove_glob "*.sqlite3"
remove_glob "*.db"
remove_glob "*.db-journal"
remove_if_exists ".nyc_output"
remove_if_exists ".tsbuildinfo"
remove_glob "*.tsbuildinfo"

# ── Platform-specific files ───────────────────────────────────────
echo ""
echo "[6/7] Platform-specific files"
remove_glob ".DS_Store"
remove_glob "Thumbs.db"
remove_glob "desktop.ini"

# ── QA / reference / temp project dirs ───────────────────────────
echo ""
echo "[7/7] QA and reference directories"
# Remove any .qa-* directories created during testing
while IFS= read -r -d '' d; do
  if [[ "$d" == ./.qa-* ]]; then
    rm -rf "$d"
    echo "  ✓ Removed: $d"
  fi
done < <(find . -maxdepth 1 -type d -name '.qa-*' -print0 2>/dev/null || true)

# ── Verify preserved files ───────────────────────────────────────
echo ""
echo "── Verification ──────────────────────────────────────────"
for required in "src" "package.json" "tsconfig.json" "README.md"; do
  if [ -e "$required" ]; then
    echo "  ✓ Preserved: $required"
  else
    echo "  ⚠ Missing: $required"
  fi
done

echo ""
echo "──────────────────────────────────────────────────────────"
echo "✅ Project is ready for publication."
