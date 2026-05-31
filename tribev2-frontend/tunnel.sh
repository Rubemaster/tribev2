#!/bin/bash
# Start SSH tunnel to Vast instance for TRIBE v2 API
set -e

VAST_PORT=${1:-38300}
echo "🔗 Starting SSH tunnel to Vast instance on port $VAST_PORT..."
echo "   Frontend API → localhost:9000 → Vast instance:9000"
echo "   Press Ctrl+C to stop"

ssh -o StrictHostKeyChecking=accept-new \
    -o ServerAliveInterval=30 \
    -i ~/.ssh/vastai \
    -N -L 9000:localhost:9000 \
    root@194.228.55.129 \
    -p "$VAST_PORT"
