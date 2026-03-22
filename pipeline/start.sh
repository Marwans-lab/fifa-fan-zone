#!/bin/bash
# Start the full pipeline: Cyrus + Middleware + ngrok
# Usage: ./pipeline/start.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CYRUS_PORT=3456
MIDDLEWARE_PORT=3457
NGROK_DOMAIN="fishy-bao-profligately.ngrok-free.dev"

# Linear token — reads from Cyrus config automatically
export LINEAR_TOKEN=$(python3 -c "import json; print(json.load(open('$HOME/.cyrus/config.json'))['linearWorkspaces'][list(json.load(open('$HOME/.cyrus/config.json'))['linearWorkspaces'].keys())[0]]['linearToken'])")


echo "🔧 Pipeline Startup"
echo "==================="

# Kill existing processes on our ports
for port in $CYRUS_PORT $MIDDLEWARE_PORT; do
  pid=$(lsof -ti:$port 2>/dev/null || true)
  if [ -n "$pid" ]; then
    echo "Killing process on port $port (PID $pid)"
    kill -9 $pid 2>/dev/null || true
    sleep 1
  fi
done

# Kill existing ngrok and stitch watcher
pkill -f "ngrok http" 2>/dev/null || true
sleep 1

# 1. Start Cyrus
echo "Starting Cyrus on port $CYRUS_PORT..."
cyrus start &
CYRUS_PID=$!
sleep 3

# 2. Start middleware
echo "Starting pipeline middleware on port $MIDDLEWARE_PORT..."
node "$SCRIPT_DIR/server.js" &
MIDDLEWARE_PID=$!
sleep 1

# 3. Start ngrok pointing to middleware (not Cyrus directly)
echo "Starting ngrok tunnel → middleware:$MIDDLEWARE_PORT..."
ngrok http $MIDDLEWARE_PORT --url $NGROK_DOMAIN &
NGROK_PID=$!
sleep 3

echo ""
echo "✅ Pipeline running!"
echo "   Cyrus:      http://localhost:$CYRUS_PORT (PID $CYRUS_PID)"
echo "   Middleware:  http://localhost:$MIDDLEWARE_PORT (PID $MIDDLEWARE_PID)"
echo "   ngrok:       https://$NGROK_DOMAIN → middleware"
echo ""
echo "   Flow: Linear(Todo) → Cyrus → In Review → QA → Done → Deploy → Deployed"
echo ""
echo "Press Ctrl+C to stop all"

# Wait for any child to exit
wait
