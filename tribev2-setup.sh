#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$REPO_DIR/plugins/git-autocommit"

echo "🔧 Setting up OpenClaw git-autocommit plugin for tribev2"
echo ""

# 1. Check OpenClaw available
if ! command -v openclaw &>/dev/null; then
  echo "   ⚠️  OpenClaw not found. Install it: npm install -g openclaw"
  exit 1
fi

# 2. Write config
OC_CONFIG="$HOME/.openclaw/openclaw.json"
mkdir -p "$(dirname "$OC_CONFIG")"
python3 -c "
import json
try:
    with open('$OC_CONFIG') as f:
        cfg = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    cfg = {'plugins': {'entries': {}, 'load': {'paths': []}}}

plugins = cfg.setdefault('plugins', {})
entries = plugins.setdefault('entries', {})
entries['git-autocommit'] = {'enabled': True}

load = plugins.setdefault('load', {})
paths = load.setdefault('paths', [])
p = '$PLUGIN_DIR'
if p not in paths:
    paths.append(p)

with open('$OC_CONFIG', 'w') as f:
    json.dump(cfg, f, indent=2)
print('   ✅ git-autocommit enabled in config')
"

echo ""
echo "✅ Done. Dude 🛹 will auto-commit tribev2 changes."
