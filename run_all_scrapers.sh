#!/bin/bash
# Script to run all functional scrapers in production with contact extraction
# Usage: ./run_all_scrapers.sh

echo "=========================================="
echo "EJECUTANDO TODOS LOS SCRAPERS EN PRODUCCIÓN"
echo "=========================================="
echo ""

# Array of functional scrapers
scrapers=(
    "urbania"
    "adondevivir"
    "infocasas"
    "properati"
    "babilonia"
    "losportales"
    "nexoinmobiliario"
    "mitula"
    "laencontre"
)

# Create logs directory if it doesn't exist
mkdir -p /tmp/scraper_logs

# Run each scraper in the background
for scraper in "${scrapers[@]}"; do
    echo "▶ Iniciando scraper: $scraper"
    nohup python3 scrapers/${scraper}.py > /tmp/scraper_logs/${scraper}.log 2>&1 &
    pid=$!
    echo "  PID: $pid"
    echo "  Log: /tmp/scraper_logs/${scraper}.log"
    echo ""
    
    # Small delay between launches
    sleep 2
done

echo "=========================================="
echo "TODOS LOS SCRAPERS INICIADOS"
echo "=========================================="
echo ""
echo "Para ver el progreso de un scraper:"
echo "  tail -f /tmp/scraper_logs/<nombre_scraper>.log"
echo ""
echo "Para ver todos los procesos:"
echo "  ps aux | grep 'python3 scrapers'"
echo ""
echo "Para detener todos los scrapers:"
echo "  pkill -f 'python3 scrapers/'"
echo ""
