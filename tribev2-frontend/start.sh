#!/bin/bash
# Start the TRIBE v2 frontend dev server
# Prerequisite: SSH tunnel must be running to Vast instance
#   ssh -N -L 9000:localhost:9000 root@194.228.55.129 -p 38300 -i ~/.ssh/vastai

echo "🧠 TRIBE v2 Frontend"
echo "API: ${VITE_API_BASE:-http://localhost:9000}"
echo ""
cd "$(dirname "$0")"
npm run dev
