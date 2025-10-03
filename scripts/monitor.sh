#!/bin/bash

# Script de monitoring continu pour LLMO Report
# Usage: ./scripts/monitor.sh [start|stop|status]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HEALTH_CHECK_SCRIPT="$SCRIPT_DIR/health-check.sh"
PID_FILE="/var/run/llmo-monitor.pid"
INTERVAL=300  # 5 minutes

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] ${YELLOW}[WARNING]${NC} $1"
}

# Fonction de monitoring en boucle
monitor_loop() {
    log_info "Démarrage du monitoring LLMO Report (intervalle: ${INTERVAL}s)"
    
    while true; do
        # Exécuter le health check en mode silencieux
        if ! $HEALTH_CHECK_SCRIPT silent; then
            log_warning "Health check échoué - vérification en cours..."
            
            # Health check détaillé en cas d'échec
            $HEALTH_CHECK_SCRIPT detailed
        fi
        
        # Attendre l'intervalle suivant
        sleep $INTERVAL
    done
}

# Démarrer le monitoring
start_monitor() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
        log_error "Le monitoring est déjà en cours (PID: $(cat $PID_FILE))"
        return 1
    fi
    
    log_info "Démarrage du monitoring en arrière-plan..."
    
    # Démarrer en arrière-plan et sauvegarder le PID
    nohup bash -c "$(declare -f monitor_loop log_info log_error log_warning); monitor_loop" \
        > /var/log/llmo-monitor.log 2>&1 &
    
    echo $! > $PID_FILE
    log_info "Monitoring démarré (PID: $!)"
    log_info "Logs disponibles: /var/log/llmo-monitor.log"
}

# Arrêter le monitoring
stop_monitor() {
    if [ ! -f "$PID_FILE" ]; then
        log_error "Aucun fichier PID trouvé - le monitoring n'est peut-être pas en cours"
        return 1
    fi
    
    local pid=$(cat $PID_FILE)
    
    if kill -0 "$pid" 2>/dev/null; then
        log_info "Arrêt du monitoring (PID: $pid)..."
        kill "$pid"
        rm -f "$PID_FILE"
        log_info "Monitoring arrêté"
    else
        log_warning "Le processus $pid n'existe pas - nettoyage du fichier PID"
        rm -f "$PID_FILE"
    fi
}

# Statut du monitoring
status_monitor() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
        local pid=$(cat $PID_FILE)
        log_info "Monitoring actif (PID: $pid)"
        
        # Afficher les dernières lignes du log
        echo -e "\n📝 Dernières activités:"
        tail -10 /var/log/llmo-monitor.log 2>/dev/null || echo "Aucun log disponible"
        
        return 0
    else
        log_error "Monitoring inactif"
        return 1
    fi
}

# Installation comme service systemd (optionnel)
install_service() {
    log_info "Installation du service systemd..."
    
    cat > /etc/systemd/system/llmo-monitor.service << EOF
[Unit]
Description=LLMO Report Monitor
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$(dirname "$SCRIPT_DIR")
ExecStart=$SCRIPT_DIR/monitor.sh start-service
ExecStop=$SCRIPT_DIR/monitor.sh stop
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable llmo-monitor.service
    log_info "Service installé. Utilisez: systemctl start llmo-monitor"
}

# Démarrage pour service systemd
start_service() {
    # Pour systemd, on ne fait pas de fork
    monitor_loop
}

# Gestion des arguments
case "$1" in
    "start")
        start_monitor
        ;;
    "stop")
        stop_monitor
        ;;
    "restart")
        stop_monitor
        sleep 2
        start_monitor
        ;;
    "status")
        status_monitor
        ;;
    "install-service")
        install_service
        ;;
    "start-service")
        start_service
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|install-service}"
        echo
        echo "Commandes:"
        echo "  start           - Démarrer le monitoring"
        echo "  stop            - Arrêter le monitoring"
        echo "  restart         - Redémarrer le monitoring"
        echo "  status          - Voir le statut du monitoring"
        echo "  install-service - Installer comme service systemd"
        exit 1
        ;;
esac 