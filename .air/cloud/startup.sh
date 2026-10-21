#!/usr/bin/env bash
# Air cloud startup script: prepares the environment so the app can be run
# with `npm run dev` as soon as the agent starts. Safe to re-run on resume.
set -euo pipefail

cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# --- Node.js (Vite 7 needs >= 20.19) ----------------------------------------
# The script runs in a non-interactive shell, so nvm may not be on PATH yet.
export NVM_DIR="${NVM_DIR:-/usr/local/nvm}"
if ! command -v node >/dev/null && [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
fi

node_ok() {
  command -v node >/dev/null &&
    node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>22||(a===22&&b>=12)||(a===20&&b>=19)?0:1)'
}

if ! node_ok; then
  echo "Installing Node.js LTS..."
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    nvm install --lts
    nvm alias default 'lts/*'
  else
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi
fi
echo "Using node $(node -v), npm $(npm -v)"

# --- npm dependencies --------------------------------------------------------
# Reinstall only when package-lock.json changed since the last successful install.
marker=node_modules/.startup-lock-hash
lock_hash=$(sha256sum package-lock.json | cut -d' ' -f1)
if [ -d node_modules ] && [ "$(cat "$marker" 2>/dev/null)" = "$lock_hash" ]; then
  echo "npm dependencies up to date, skipping install"
else
  echo "Installing npm dependencies..."
  npm ci --no-audit --no-fund
  echo "$lock_hash" > "$marker"
fi

# --- Agent environment -------------------------------------------------------
# Let the Vite dev server answer on the public Air URL for port 5173
# (otherwise it replies "Blocked request. This host is not allowed").
if [ -n "${JBCENTRAL_EXPOSED_PORT_URL_5173:-}" ]; then
  host=${JBCENTRAL_EXPOSED_PORT_URL_5173#*://}
  host=${host%%/*}
  grep -q __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS ~/.bashrc 2>/dev/null ||
    echo "export __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=$host" >> ~/.bashrc
fi

echo "Startup complete. Run the app with: npm run dev -- --host 0.0.0.0"
