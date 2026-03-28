#!/bin/bash
# Start the pipeline: Middleware + ngrok
# Cursor Cloud Agent handles development — no local agent process needed.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MIDDLEWARE_PORT=3457
NGROK_DOMAIN="fishy-bao-profligately.ngrok-free.dev"
HEALTH_INTERVAL=30
LOG_PREFIX="[Pipeline]"

log() { echo "$(date '+%H:%M:%S') $LOG_PREFIX $*" | tee -a ~/Library/Logs/fifa-pipeline.log; }

# Load secrets
if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  source "$SCRIPT_DIR/.env"
  set +a
fi

# Linear token — read from Cyrus config if available, else fall back to personal key
load_linear_token() {
  local config="$HOME/.cyrus/config.json"
  if [ -f "$config" ]; then
    local token
    token=$(python3 -c "
import json
c = json.load(open('$config'))
ws = list(c['linearWorkspaces'].keys())[0]
print(c['linearWorkspaces'][ws]['linearToken'])
" 2>/dev/null || echo "")
    if [ -n "$token" ]; then
      export LINEAR_TOKEN="$token"
      return 0
    fi
  fi
  # Fall back to personal key
  export LINEAR_TOKEN="${LINEAR_PERSONAL_KEY}"
}

# Validate Linear token
check_linear_token() {
  local resp
  resp=$(curl -s -X POST https://api.linear.app/graphql \
    -H "Content-Type: application/json" \
    -H "Authorization: $LINEAR_TOKEN" \
    -d '{"query":"{ viewer { id } }"}')
  echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print('ok' if not d.get('errors') else 'error')" 2>/dev/null || echo "error"
}

# Try to refresh the token via OAuth if it's expired
refresh_linear_token() {
  local config="$HOME/.cyrus/config.json"
  [ -f "$config" ] || return 1

  local ws_id
  ws_id=$(python3 -c "import json; print(list(json.load(open('$config'))['linearWorkspaces'].keys())[0])")
  local refresh
  refresh=$(python3 -c "import json; print(json.load(open('$config'))['linearWorkspaces']['$ws_id'].get('linearRefreshToken',''))")

  [ -z "$refresh" ] || [ -z "$LINEAR_CLIENT_ID" ] || [ -z "$LINEAR_CLIENT_SECRET" ] && return 1

  local token_resp
  token_resp=$(curl -s -X POST https://api.linear.app/oauth/token \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=refresh_token&refresh_token=$refresh&client_id=$LINEAR_CLIENT_ID&client_secret=$LINEAR_CLIENT_SECRET")

  local new_token
  new_token=$(echo "$token_resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))" 2>/dev/null)

  [[ "$new_token" == lin_oauth_* ]] || return 1

  python3 << PYEOF
import json
config = json.load(open('$config'))
ws_id = '$ws_id'
config['linearWorkspaces'][ws_id]['linearToken'] = '$new_token'
json.dump(config, open('$config', 'w'), indent=4)
PYEOF
  log "Linear token refreshed"
  load_linear_token
}

# Load token at startup
load_linear_token
if [ "$(check_linear_token)" != "ok" ]; then
  log "Linear token invalid — attempting refresh..."
  if ! refresh_linear_token; then
    log "WARNING: Token refresh failed — falling back to LINEAR_PERSONAL_KEY"
    export LINEAR_TOKEN="${LINEAR_PERSONAL_KEY}"
    if [ "$(check_linear_token)" != "ok" ]; then
      log "ERROR: LINEAR_PERSONAL_KEY is also invalid — pipeline may not work"
    else
      log "LINEAR_PERSONAL_KEY is valid — using it"
    fi
  fi
fi

export LINEAR_PERSONAL_KEY="${LINEAR_PERSONAL_KEY:?LINEAR_PERSONAL_KEY must be set in pipeline/.env}"
export LINEAR_CLIENT_ID="${LINEAR_CLIENT_ID}"
export LINEAR_CLIENT_SECRET="${LINEAR_CLIENT_SECRET}"

# --- PIDs ---
MIDDLEWARE_PID=""
NGROK_PID=""
CAFFEINATE_PID=""
SHUTTING_DOWN=false

cleanup() {
  if $SHUTTING_DOWN; then return; fi
  SHUTTING_DOWN=true
  log "Shutting down..."
  for pid in $NGROK_PID $MIDDLEWARE_PID $CAFFEINATE_PID; do
    [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null && kill "$pid" 2>/dev/null || true
  done
  sleep 2
  local pid
  pid=$(lsof -ti:$MIDDLEWARE_PORT 2>/dev/null || true)
  [ -n "$pid" ] && kill -9 $pid 2>/dev/null || true
  pkill -f "ngrok http.*$NGROK_DOMAIN" 2>/dev/null || true
  log "Shutdown complete."
  exit 0
}

trap cleanup SIGTERM SIGINT SIGHUP EXIT

kill_port() {
  local pid
  pid=$(lsof -ti:$1 2>/dev/null || true)
  if [ -n "$pid" ]; then
    log "Killing process on port $1 (PID $pid)"
    kill -9 $pid 2>/dev/null || true
    sleep 1
  fi
}

start_caffeinate() {
  caffeinate -i -w $$ &
  CAFFEINATE_PID=$!
  log "caffeinate started (PID $CAFFEINATE_PID)"
}

start_middleware() {
  kill_port $MIDDLEWARE_PORT
  log "Starting middleware on port $MIDDLEWARE_PORT..."
  node "$SCRIPT_DIR/server.js" >> ~/Library/Logs/fifa-pipeline.log 2>&1 &
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
  log "Starting ngrok → middleware:$MIDDLEWARE_PORT..."
  ngrok http $MIDDLEWARE_PORT --url $NGROK_DOMAIN >> ~/Library/Logs/fifa-pipeline.log 2>&1 &
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
  [ -n "$2" ] && kill -0 "$2" 2>/dev/null
}

# --- Startup ---
log "Pipeline starting (Cursor Cloud Agent mode)"
log "========================================"

kill_port $MIDDLEWARE_PORT
pkill -f "ngrok http" 2>/dev/null || true
sleep 1

start_caffeinate
start_middleware
start_ngrok

echo ""
log "Pipeline running!"
log "  Middleware: http://localhost:$MIDDLEWARE_PORT (PID $MIDDLEWARE_PID)"
log "  ngrok:      https://$NGROK_DOMAIN → middleware"
log "  Agent:      Cursor Cloud (assigned on Todo)"
log ""
log "  Flow: Todo → assign Cursor → In Progress → In Review → Done → merge PR → Deployed"
log ""
log "Health checks every ${HEALTH_INTERVAL}s. Press Ctrl+C to stop."

LAST_TOKEN_CHECK=0
TOKEN_CHECK_INTERVAL=3600

while ! $SHUTTING_DOWN; do
  sleep $HEALTH_INTERVAL
  if $SHUTTING_DOWN; then break; fi

  # Periodic token refresh
  NOW=$(date +%s)
  if [ $((NOW - LAST_TOKEN_CHECK)) -ge $TOKEN_CHECK_INTERVAL ]; then
    LAST_TOKEN_CHECK=$NOW
    if [ "$(check_linear_token)" != "ok" ]; then
      log "Linear token expired — refreshing..."
      refresh_linear_token || log "WARNING: Token refresh failed"
    else
      log "Linear token valid"
    fi
  fi

  if ! check_process "Middleware" "$MIDDLEWARE_PID"; then
    log "Middleware crashed — restarting..."
    start_middleware
  fi

  if ! check_process "ngrok" "$NGROK_PID"; then
    log "ngrok crashed — restarting..."
    start_ngrok
  fi

  if ! check_process "caffeinate" "$CAFFEINATE_PID"; then
    log "caffeinate died — restarting..."
    start_caffeinate
  fi
done
