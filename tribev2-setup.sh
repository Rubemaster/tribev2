#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Setting up OpenClaw git-autocommit plugin"
echo ""

# 1. Check OpenClaw available
if ! command -v openclaw &>/dev/null; then
  echo "   ⚠️  OpenClaw not found. Install it: npm install -g openclaw"
  exit 1
fi

# 2. Install plugin from npm
echo "   → Installing @rubengrick2/git-autocommit..."
openclaw plugins install npm:@rubengrick2/git-autocommit \
  --dangerously-force-unsafe-install 2>&1 | sed 's/^/     /'

echo ""
echo "✅ Done. Dude 🛹 will auto-commit repo changes before every turn."
echo "   Check 'git log' after making changes to see auto-snapshots."
