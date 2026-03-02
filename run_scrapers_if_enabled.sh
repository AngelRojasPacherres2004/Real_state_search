#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
STATUS_FILE="$SCRIPT_DIR/.scraper_cron_status"

# Check if cron is enabled
if [ -f "$STATUS_FILE" ]; then
    status=$(cat "$STATUS_FILE")
    if [ "$status" = "enabled" ]; then
        echo "[$(date)] Ejecutando scrapers automáticamente..."
        cd "$SCRIPT_DIR"
        ./run_all_scrapers.sh
    else
        echo "[$(date)] Scrapers desactivados, saltando ejecución"
    fi
else
    echo "[$(date)] Estado desconocido, saltando ejecución"
fi
