#!/bin/bash

# Script de health check pour LLMO Report
# Usage: ./scripts/health-check.sh

PROJECT_NAME="llmo-report"
APP_URL="http://localhost:3000"
LOG_FILE="/var/log/health-check.log"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Fonction de logging
log_with_timestamp() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

log_success() {
    log_with_timestamp "✅ $1"
}

log_warning() {
    log_with_timestamp "⚠️  $1"
}

log_error() {
    log_with_timestamp "❌ $1"
}

# Vérifier le processus PM2
check_pm2_process() {
    if pm2 list | grep -q "$PROJECT_NAME.*online"; then
        log_success "PM2: Application $PROJECT_NAME est en ligne"
        return 0
    else
        log_error "PM2: Application $PROJECT_NAME n'est pas en ligne"
        return 1
    fi
}

# Vérifier la réponse HTTP
check_http_response() {
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL)
    
    if [ "$response_code" = "200" ]; then
        log_success "HTTP: Application répond avec le code $response_code"
        return 0
    else
        log_error "HTTP: Application répond avec le code $response_code"
        return 1
    fi
}

# Vérifier l'utilisation de la mémoire
check_memory_usage() {
    local memory_usage=$(pm2 show $PROJECT_NAME | grep "memory usage" | awk '{print $4}' | sed 's/M//')
    
    if [ -n "$memory_usage" ] && [ "$memory_usage" -lt 500 ]; then
        log_success "Mémoire: Utilisation normale ($memory_usage MB)"
        return 0
    elif [ -n "$memory_usage" ] && [ "$memory_usage" -lt 800 ]; then
        log_warning "Mémoire: Utilisation élevée ($memory_usage MB)"
        return 0
    else
        log_error "Mémoire: Utilisation critique ($memory_usage MB)"
        return 1
    fi
}

# Vérifier l'espace disque
check_disk_space() {
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -lt 80 ]; then
        log_success "Disque: Espace disponible ($disk_usage% utilisé)"
        return 0
    elif [ "$disk_usage" -lt 90 ]; then
        log_warning "Disque: Espace faible ($disk_usage% utilisé)"
        return 0
    else
        log_error "Disque: Espace critique ($disk_usage% utilisé)"
        return 1
    fi
}

# Vérifier les logs d'erreurs récentes
check_error_logs() {
    local error_count=$(pm2 logs $PROJECT_NAME --lines 100 --nostream | grep -i "error" | wc -l)
    
    if [ "$error_count" -eq 0 ]; then
        log_success "Logs: Aucune erreur récente"
        return 0
    elif [ "$error_count" -lt 5 ]; then
        log_warning "Logs: $error_count erreurs récentes"
        return 0
    else
        log_error "Logs: $error_count erreurs récentes (critique)"
        return 1
    fi
}

# Fonction de redémarrage automatique
auto_restart() {
    log_warning "Tentative de redémarrage automatique..."
    
    pm2 restart $PROJECT_NAME
    sleep 15
    
    if check_pm2_process && check_http_response; then
        log_success "Redémarrage automatique réussi"
        return 0
    else
        log_error "Redémarrage automatique échoué"
        return 1
    fi
}

# Envoyer une notification (webhook, email, etc.)
send_notification() {
    local message="$1"
    local severity="$2"
    
    # Exemple avec webhook Discord/Slack (à personnaliser)
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"[$severity] LLMO Report: $message\"}" \
    #     YOUR_WEBHOOK_URL
    
    log_with_timestamp "Notification: $message"
}

# Fonction principale de health check
main_health_check() {
    local failed_checks=0
    local total_checks=5
    
    log_with_timestamp "🔍 Début du health check pour $PROJECT_NAME"
    
    # Exécuter tous les checks
    check_pm2_process || ((failed_checks++))
    check_http_response || ((failed_checks++))
    check_memory_usage || ((failed_checks++))
    check_disk_space || ((failed_checks++))
    check_error_logs || ((failed_checks++))
    
    # Évaluer les résultats
    if [ $failed_checks -eq 0 ]; then
        log_success "Health check: Tous les tests sont passés ($total_checks/$total_checks)"
        return 0
    elif [ $failed_checks -le 2 ]; then
        log_warning "Health check: Quelques problèmes détectés ($((total_checks-failed_checks))/$total_checks)"
        send_notification "Problèmes mineurs détectés" "WARNING"
        return 1
    else
        log_error "Health check: Problèmes critiques détectés ($((total_checks-failed_checks))/$total_checks)"
        send_notification "Problèmes critiques détectés" "CRITICAL"
        
        # Tentative de redémarrage automatique
        if auto_restart; then
            send_notification "Redémarrage automatique réussi" "INFO"
            return 0
        else
            send_notification "Redémarrage automatique échoué - intervention manuelle requise" "CRITICAL"
            return 2
        fi
    fi
}

# Mode détaillé
detailed_status() {
    echo "=== Status détaillé de $PROJECT_NAME ==="
    echo
    echo "🔧 Processus PM2:"
    pm2 show $PROJECT_NAME
    echo
    echo "📊 Utilisation des ressources:"
    pm2 monit
    echo
    echo "📝 Logs récents:"
    pm2 logs $PROJECT_NAME --lines 20
}

# Gestion des arguments
case "$1" in
    "detailed"|"--detailed"|"-d")
        detailed_status
        ;;
    "silent"|"--silent"|"-s")
        main_health_check > /dev/null 2>&1
        exit $?
        ;;
    *)
        main_health_check
        exit $?
        ;;
esac 