#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Setting up OpenClaw git-autocommit plugin"
echo ""

if ! command -v openclaw &>/dev/null; then
  echo "⚠️  OpenClaw not found. Install it: npm install -g openclaw"
  exit 1
fi

echo "   → Installing @rubengrick2/git-autocommit..."
openclaw plugins install npm:@rubengrick2/git-autocommit \
  --dangerously-force-unsafe-install 2>&1 | sed 's/^/     /'

echo ""
echo "✅ Done. Dude 🛹 will auto-commit changes before every turn."
