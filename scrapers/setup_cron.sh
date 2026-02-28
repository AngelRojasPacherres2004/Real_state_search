#!/bin/bash
# Setup cron job to run scrapers every 12 hours

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Create log directory
mkdir -p "$PROJECT_DIR/logs"

# Add cron job (runs at 6 AM and 6 PM every day)
CRON_JOB="0 6,18 * * * cd $SCRIPT_DIR && /usr/bin/python3 run_scrapers.py >> $PROJECT_DIR/logs/scrapers.log 2>&1"

# Check if cron job already exists
(crontab -l 2>/dev/null | grep -F "run_scrapers.py") && echo "Cron job already exists" || (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "Cron job setup complete. Scrapers will run at 6 AM and 6 PM daily."
echo "Logs will be saved to: $PROJECT_DIR/logs/scrapers.log"
