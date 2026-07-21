#!/bin/bash
#
# setup.sh - UrTrack Deploy Script (Debian)
# Run this as root on a fresh Debian server.
#
# Usage: sudo bash setup.sh
#   or:  bash setup.sh --dry-run  (to preview without running)
#

set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
    DRY_RUN=true
fi

log()  { echo -e "\e[32m[INFO]\e[0m $*"; }
warn() { echo -e "\e[33m[WARN]\e[0m $*"; }
fatal(){ echo -e "\e[31m[FATAL]\e[0m $*"; exit 1; }

run() {
    if $DRY_RUN; then
        echo -e "\e[36m[DRY-RUN]\e[0m $*"
    else
        "$@"
    fi
}

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
INSTALL_DIR="/opt/urtrack"

log "=== UrTrack Deployment ==="
log "Source: $REPO_DIR"
log "Target: $INSTALL_DIR"
$DRY_RUN && warn "DRY-RUN mode -- no changes will be made"

log "[1/8] Installing system dependencies..."
run apt-get update -qq
run apt-get install -y -qq \
    python3 \
    python3-venv \
    python3-pip \
    nodejs \
    npm \
    git \
    curl \
    build-essential \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    shared-mime-info

log "[2/8] Creating urtrack user..."
if id "urtrack" &>/dev/null; then
    log "User urtrack already exists"
else
    run useradd --system --create-home --shell /usr/sbin/nologin urtrack
fi

log "[3/8] Copying project to $INSTALL_DIR..."
run mkdir -p "$INSTALL_DIR"
run cp -r "$REPO_DIR/backend"   "$INSTALL_DIR/backend"
run cp -r "$REPO_DIR/frontend"  "$INSTALL_DIR/frontend"
run cp -r "$REPO_DIR/deploy"    "$INSTALL_DIR/deploy"

log "[4/8] Creating data directories..."
run mkdir -p "$INSTALL_DIR/data"
run mkdir -p "$INSTALL_DIR/data/backups"

log "[5/8] Setting up Python virtual environment..."
run python3 -m venv "$INSTALL_DIR/backend/venv"
run "$INSTALL_DIR/backend/venv/bin/pip" install --upgrade pip wheel -q
run "$INSTALL_DIR/backend/venv/bin/pip" install --upgrade -r "$INSTALL_DIR/backend/requirements.txt" -q

log "[6/8] Building frontend..."
run npm --prefix "$INSTALL_DIR/frontend" install --silent
run npm --prefix "$INSTALL_DIR/frontend" run build

log "[7/8] Configuring environment..."
ENV_FILE="$INSTALL_DIR/deploy/urtrack.env"
if [ ! -f "$ENV_FILE" ]; then
    log "Creating urtrack.env from template (edit it to add ALLOWED_IPS)"
    run cp "$INSTALL_DIR/deploy/urtrack.env.template" "$ENV_FILE"
    if ! $DRY_RUN; then
        NEW_SECRET=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 48)
        sed -i "s/^SECRET_KEY=.*/SECRET_KEY=$NEW_SECRET/" "$ENV_FILE"
    fi
    warn ""
    warn ">>> IMPORTANT: Edit $ENV_FILE and set ALLOWED_IPS"
    warn ">>> Example: ALLOWED_IPS=192.168.1.100,203.0.113.50"
    warn ">>> Leave ALLOWED_IPS empty to allow all IPs."
    warn ""
else
    log "urtrack.env already exists, keeping existing"
fi

log "[8/8] Installing systemd service..."
SERVICE_FILE="/etc/systemd/system/urtrack.service"
run cp "$INSTALL_DIR/deploy/urtrack.service" "$SERVICE_FILE"
run chmod 644 "$SERVICE_FILE"

if ! $DRY_RUN; then
    if [[ "$(uname)" == "Linux" ]]; then
        sed -i "s|/opt/urtrack|$INSTALL_DIR|g" "$SERVICE_FILE"
    fi
fi

log "Setting ownership to urtrack:urtrack..."
run chown -R urtrack:urtrack "$INSTALL_DIR"

run systemctl daemon-reload
run systemctl enable urtrack.service
run systemctl start urtrack.service

log ""
log "=== UrTrack deployment complete! ==="
log ""

SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -n "$SERVER_IP" ]; then
    log "  Access: http://$SERVER_IP:8000"
else
    log "  Access: http://<server-ip>:8000"
fi
log "  Status: sudo systemctl status urtrack.service"
log "  Logs:   sudo journalctl -u urtrack.service -f"
log ""

if [ -f "$ENV_FILE" ] && grep -q "^ALLOWED_IPS=127.0.0.1$" "$ENV_FILE" 2>/dev/null; then
    warn "!!! ALLOWED_IPS is set to default (127.0.0.1 only) !!!"
    warn "    Edit $ENV_FILE to add your external IPs."
    warn "    Format: ALLOWED_IPS=203.0.113.50,192.168.1.100"
fi
