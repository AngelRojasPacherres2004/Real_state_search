#!/bin/bash
# Cron Job Manager for Real Estate Scrapers
# Allows enabling, disabling, and pausing automated scraper execution

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CRON_FILE="/tmp/scraper_cron"
STATUS_FILE="$SCRIPT_DIR/.scraper_cron_status"

# Initialize status file if it doesn't exist
if [ ! -f "$STATUS_FILE" ]; then
    echo "enabled" > "$STATUS_FILE"
fi

show_usage() {
    echo "=========================================="
    echo "GESTOR DE CRON JOBS - SCRAPERS INMOBILIARIOS"
    echo "=========================================="
    echo ""
    echo "Uso: $0 {enable|disable|pause|resume|status|install|uninstall}"
    echo ""
    echo "Comandos:"
    echo "  enable    - Activar ejecución automática de scrapers"
    echo "  disable   - Desactivar ejecución automática de scrapers"
    echo "  pause     - Pausar temporalmente (equivalente a disable)"
    echo "  resume    - Reanudar ejecución (equivalente a enable)"
    echo "  status    - Ver estado actual de los cron jobs"
    echo "  install   - Instalar cron jobs (ejecutar cada 12 horas)"
    echo "  uninstall - Desinstalar cron jobs completamente"
    echo ""
}

get_status() {
    if [ -f "$STATUS_FILE" ]; then
        cat "$STATUS_FILE"
    else
        echo "unknown"
    fi
}

enable_cron() {
    echo "enabled" > "$STATUS_FILE"
    echo "✅ Cron jobs ACTIVADOS"
    echo "   Los scrapers se ejecutarán automáticamente cada 12 horas"
}

disable_cron() {
    echo "disabled" > "$STATUS_FILE"
    echo "⏸️  Cron jobs DESACTIVADOS"
    echo "   Los scrapers NO se ejecutarán automáticamente"
}

show_status() {
    status=$(get_status)
    echo "=========================================="
    echo "ESTADO DE CRON JOBS"
    echo "=========================================="
    echo ""
    
    if [ "$status" = "enabled" ]; then
        echo "Estado: ✅ ACTIVADO"
        echo "Los scrapers se ejecutan automáticamente cada 12 horas"
    elif [ "$status" = "disabled" ]; then
        echo "Estado: ⏸️  DESACTIVADO"
        echo "Los scrapers NO se ejecutan automáticamente"
    else
        echo "Estado: ❓ DESCONOCIDO"
    fi
    
    echo ""
    echo "Scrapers configurados:"
    echo "  • Urbania"
    echo "  • Adondevivir"
    echo "  • Infocasas"
    echo "  • Properati"
    echo "  • Babilonia"
    echo "  • Los Portales"
    echo "  • Nexo Inmobiliario"
    echo "  • Mitula"
    echo "  • La Encontré"
    echo ""
    
    # Check if cron job is installed
    if crontab -l 2>/dev/null | grep -q "run_all_scrapers.sh"; then
        echo "Cron job: ✅ INSTALADO"
        echo ""
        echo "Próxima ejecución programada:"
        crontab -l 2>/dev/null | grep "run_all_scrapers.sh"
    else
        echo "Cron job: ❌ NO INSTALADO"
        echo ""
        echo "Para instalar: $0 install"
    fi
    echo ""
}

install_cron() {
    # Create cron job that runs every 12 hours
    # Format: minute hour day month weekday command
    # 0 */12 * * * means: at minute 0 of every 12th hour
    
    # Create wrapper script that checks status before running
    cat > "$SCRIPT_DIR/run_scrapers_if_enabled.sh" << 'EOF'
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
EOF
    
    chmod +x "$SCRIPT_DIR/run_scrapers_if_enabled.sh"
    
    # Add to crontab
    (crontab -l 2>/dev/null | grep -v "run_scrapers_if_enabled.sh"; echo "0 */12 * * * cd $SCRIPT_DIR && ./run_scrapers_if_enabled.sh >> /tmp/scraper_cron.log 2>&1") | crontab -
    
    echo "✅ Cron job INSTALADO"
    echo "   Los scrapers se ejecutarán cada 12 horas"
    echo "   Log: /tmp/scraper_cron.log"
    echo ""
    echo "Para desactivar temporalmente: $0 disable"
    echo "Para desinstalar completamente: $0 uninstall"
}

uninstall_cron() {
    # Remove from crontab
    crontab -l 2>/dev/null | grep -v "run_scrapers_if_enabled.sh" | crontab -
    
    # Remove wrapper script
    if [ -f "$SCRIPT_DIR/run_scrapers_if_enabled.sh" ]; then
        rm "$SCRIPT_DIR/run_scrapers_if_enabled.sh"
    fi
    
    echo "✅ Cron job DESINSTALADO"
    echo "   Los scrapers ya no se ejecutarán automáticamente"
}

# Main command handler
case "$1" in
    enable)
        enable_cron
        ;;
    disable)
        disable_cron
        ;;
    pause)
        disable_cron
        ;;
    resume)
        enable_cron
        ;;
    status)
        show_status
        ;;
    install)
        install_cron
        ;;
    uninstall)
        uninstall_cron
        ;;
    *)
        show_usage
        exit 1
        ;;
esac
