#!/bin/bash
# Start the full pipeline: Cyrus + Middleware + ngrok
# Usage: ./pipeline/start.sh
#
# Features:
# - caffeinate prevents Mac sleep while pipeline runs
# - Health check loop auto-restarts crashed processes
# - Clean shutdown on SIGTERM/SIGINT

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CYRUS_PORT=3456
MIDDLEWARE_PORT=3457
NGROK_DOMAIN="fishy-bao-profligately.ngrok-free.dev"
HEALTH_INTERVAL=30  # seconds between health checks
LOG_PREFIX="[Pipeline]"

# Linear token — reads from Cyrus config automatically
export LINEAR_TOKEN=$(python3 -c "import json; print(json.load(open('$HOME/.cyrus/config.json'))['linearWorkspaces'][list(json.load(open('$HOME/.cyrus/config.json'))['linearWorkspaces'].keys())[0]]['linearToken'])")

# Cyrus API key for webhook proxy auth
export CYRUS_API_KEY="e9922e5b09069695d8a859b7c607ac7f"

# --- PIDs ---
CYRUS_PID=""
MIDDLEWARE_PID=""
NGROK_PID=""
CAFFEINATE_PID=""
SHUTTING_DOWN=false

# --- Logging ---
log() { echo "$(date '+%H:%M:%S') $LOG_PREFIX $*"; }

# --- Clean shutdown ---
cleanup() {
  if $SHUTTING_DOWN; then return; fi
  SHUTTING_DOWN=true
  log "Shutting down..."

  for pid in $NGROK_PID $MIDDLEWARE_PID $CYRUS_PID $CAFFEINATE_PID; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done

  # Wait briefly for processes to exit
  sleep 2

  # Force kill anything still on our ports
  for port in $CYRUS_PORT $MIDDLEWARE_PORT; do
    pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
      kill -9 $pid 2>/dev/null || true
    fi
  done
  pkill -f "ngrok http.*$NGROK_DOMAIN" 2>/dev/null || true

  log "Shutdown complete."
  exit 0
}

trap cleanup SIGTERM SIGINT SIGHUP EXIT

# --- Process management ---
kill_port() {
  local port=$1
  local pid=$(lsof -ti:$port 2>/dev/null || true)
  if [ -n "$pid" ]; then
    log "Killing process on port $port (PID $pid)"
    kill -9 $pid 2>/dev/null || true
    sleep 1
  fi
}

start_caffeinate() {
  # Prevent system sleep while pipeline is active
  caffeinate -i -w $$ &
  CAFFEINATE_PID=$!
  log "caffeinate started (PID $CAFFEINATE_PID) — system sleep prevented"
}

start_cyrus() {
  kill_port $CYRUS_PORT
  log "Starting Cyrus on port $CYRUS_PORT..."
  cyrus start &
  CYRUS_PID=$!
  sleep 3
  if kill -0 $CYRUS_PID 2>/dev/null; then
    log "Cyrus running (PID $CYRUS_PID)"
  else
    log "WARNING: Cyrus failed to start"
    CYRUS_PID=""
  fi
}

start_middleware() {
  kill_port $MIDDLEWARE_PORT
  log "Starting middleware on port $MIDDLEWARE_PORT..."
  node "$SCRIPT_DIR/server.js" &
  MIDDLEWARE_PID=$!
  sleep 1
  if kill -0 $MIDDLEWARE_PID 2>/dev/null; then
    log "Middleware running (PID $MIDDLEWARE_PID)"
  else
    log "WARNING: Middleware failed to start"
    MIDDLEWARE_PID=""
  fi
}

start_ngrok() {
  pkill -f "ngrok http.*$NGROK_DOMAIN" 2>/dev/null || true
  sleep 1
  log "Starting ngrok tunnel → middleware:$MIDDLEWARE_PORT..."
  ngrok http $MIDDLEWARE_PORT --url $NGROK_DOMAIN &
  NGROK_PID=$!
  sleep 3
  if kill -0 $NGROK_PID 2>/dev/null; then
    log "ngrok running (PID $NGROK_PID)"
  else
    log "WARNING: ngrok failed to start"
    NGROK_PID=""
  fi
}

check_process() {
  local name=$1
  local pid=$2
  if [ -z "$pid" ] || ! kill -0 "$pid" 2>/dev/null; then
    return 1
  fi
  return 0
}

# --- Initial startup ---
log "Pipeline Startup"
log "==================="

# Kill existing processes on our ports
for port in $CYRUS_PORT $MIDDLEWARE_PORT; do
  kill_port $port
done
pkill -f "ngrok http" 2>/dev/null || true
sleep 1

# Start caffeinate first
start_caffeinate

# Start all services
start_cyrus
start_middleware
start_ngrok

echo ""
log "Pipeline running!"
log "  Cyrus:      http://localhost:$CYRUS_PORT (PID $CYRUS_PID)"
log "  Middleware:  http://localhost:$MIDDLEWARE_PORT (PID $MIDDLEWARE_PID)"
log "  ngrok:      https://$NGROK_DOMAIN → middleware"
log ""
log "  Flow: Linear(Todo) → Cyrus → In Review → QA → Done → Deploy → Deployed"
log ""
log "Health checks every ${HEALTH_INTERVAL}s. Press Ctrl+C to stop."

# --- Health check loop ---
while ! $SHUTTING_DOWN; do
  sleep $HEALTH_INTERVAL

  if $SHUTTING_DOWN; then break; fi

  # Check Cyrus
  if ! check_process "Cyrus" "$CYRUS_PID"; then
    log "Cyrus crashed — restarting..."
    start_cyrus
  fi

  # Check Middleware
  if ! check_process "Middleware" "$MIDDLEWARE_PID"; then
    log "Middleware crashed — restarting..."
    start_middleware
  fi

  # Check ngrok
  if ! check_process "ngrok" "$NGROK_PID"; then
    log "ngrok crashed — restarting..."
    start_ngrok
  fi

  # Check caffeinate
  if ! check_process "caffeinate" "$CAFFEINATE_PID"; then
    log "caffeinate died — restarting..."
    start_caffeinate
  fi
done
