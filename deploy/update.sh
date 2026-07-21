#!/bin/bash
#
# update.sh - Update UrTrack on Debian
# Pulls latest code, rebuilds frontend, restarts service.
#
# Usage: sudo bash update.sh
#

set -euo pipefail

INSTALL_DIR="/opt/urtrack"

log()  { echo -e "\e[32m[INFO]\e[0m $*"; }

log "=== UrTrack Update ==="

if [ -d "$INSTALL_DIR/.git" ]; then
    log "Pulling latest changes from git..."
    cd "$INSTALL_DIR"
    git pull
else
    log "No git repo found at $INSTALL_DIR -- assuming manual update."
    log "Please copy updated files manually."
fi

log "Updating Python dependencies..."
"$INSTALL_DIR/backend/venv/bin/pip" install -r "$INSTALL_DIR/backend/requirements.txt" -q

log "Rebuilding frontend..."
npm --prefix "$INSTALL_DIR/frontend" install --silent
npm --prefix "$INSTALL_DIR/frontend" run build

log "Restarting urtrack service..."
systemctl restart urtrack.service

log "=== Update complete! ==="
