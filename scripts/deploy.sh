#!/bin/bash

# Script de déploiement LLMO Report
# Usage: ./scripts/deploy.sh [production|staging]

set -e  # Arrêter le script en cas d'erreur

# Configuration
PROJECT_NAME="llmo-report"
APP_DIR="/home/root/virail-report-refined"
NGINX_CONFIG_PATH="/etc/nginx/sites-available/llmo-report"
NGINX_ENABLED_PATH="/etc/nginx/sites-enabled/llmo-report"
PM2_LOG_DIR="/var/log/pm2"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérification des prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé"
        exit 1
    fi
    
    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        log_error "npm n'est pas installé"
        exit 1
    fi
    
    # Vérifier PM2
    if ! command -v pm2 &> /dev/null; then
        log_warning "PM2 n'est pas installé. Installation..."
        npm install -g pm2
    fi
    
    # Vérifier Nginx
    if ! command -v nginx &> /dev/null; then
        log_error "Nginx n'est pas installé"
        exit 1
    fi
    
    log_success "Tous les prérequis sont satisfaits"
}

# Création des répertoires de logs
setup_logging() {
    log_info "Configuration des logs..."
    
    sudo mkdir -p $PM2_LOG_DIR
    sudo chown root:root $PM2_LOG_DIR
    sudo chmod 755 $PM2_LOG_DIR
    
    log_success "Configuration des logs terminée"
}

# Installation et build de l'application
build_application() {
    log_info "Build de l'application..."
    
    cd $APP_DIR
    
    # Installation des dépendances
    log_info "Installation des dépendances..."
    npm ci --production=false
    
    # Build pour la production
    log_info "Build de l'application pour la production..."
    npm run build
    
    # Vérifier que le build a réussi
    if [ ! -d "dist" ]; then
        log_error "Le build a échoué - le dossier dist n'existe pas"
        exit 1
    fi
    
    log_success "Build terminé avec succès"
}

# Configuration de Nginx
setup_nginx() {
    log_info "Configuration de Nginx..."
    
    # Copier la configuration
    sudo cp nginx/llmo-report.conf $NGINX_CONFIG_PATH
    
    # Activer le site
    sudo ln -sf $NGINX_CONFIG_PATH $NGINX_ENABLED_PATH
    
    # Tester la configuration
    if sudo nginx -t; then
        log_success "Configuration Nginx valide"
        sudo systemctl reload nginx
        log_success "Nginx rechargé"
    else
        log_error "Configuration Nginx invalide"
        exit 1
    fi
}

# Déploiement avec PM2
deploy_with_pm2() {
    log_info "Déploiement avec PM2..."
    
    cd $APP_DIR
    
    # Arrêter l'application si elle existe
    if pm2 list | grep -q "$PROJECT_NAME"; then
        log_info "Arrêt de l'application existante..."
        pm2 stop $PROJECT_NAME
        pm2 delete $PROJECT_NAME
    fi
    
    # Démarrer l'application
    log_info "Démarrage de l'application..."
    pm2 start ecosystem.config.js --env production
    
    # Sauvegarder la configuration PM2
    pm2 save
    
    # Générer le script de démarrage pour redémarrage automatique
    pm2 startup
    
    log_success "Application déployée avec PM2"
}

# Vérification de santé
health_check() {
    log_info "Vérification de santé de l'application..."
    
    # Attendre que l'application démarre
    sleep 10
    
    # Vérifier que l'application répond
    if curl -f http://localhost:3000/ > /dev/null 2>&1; then
        log_success "L'application répond correctement"
    else
        log_error "L'application ne répond pas"
        pm2 logs $PROJECT_NAME --lines 50
        exit 1
    fi
    
    # Vérifier le statut PM2
    pm2 status $PROJECT_NAME
}

# Nettoyage
cleanup() {
    log_info "Nettoyage..."
    
    cd $APP_DIR
    
    # Nettoyer les node_modules de dev si nécessaire
    # npm prune --production
    
    # Nettoyer les anciens logs
    sudo find $PM2_LOG_DIR -name "*.log" -mtime +7 -delete 2>/dev/null || true
    
    log_success "Nettoyage terminé"
}

# Installation de SSL avec certbot (optionnel)
setup_ssl() {
    log_info "Configuration SSL (optionnel)..."
    
    read -p "Voulez-vous configurer SSL avec Let's Encrypt? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Entrez votre domaine (ex: example.com): " domain
        
        if command -v certbot &> /dev/null; then
            sudo certbot --nginx -d $domain -d www.$domain
            log_success "SSL configuré pour $domain"
        else
            log_warning "Certbot n'est pas installé. Veuillez l'installer pour configurer SSL automatiquement."
            log_info "Installation: sudo apt install certbot python3-certbot-nginx"
        fi
    fi
}

# Affichage des informations finales
show_final_info() {
    log_success "Déploiement terminé!"
    echo
    log_info "Informations de l'application:"
    echo "  - Application: $PROJECT_NAME"
    echo "  - Port: 3000"
    echo "  - Logs PM2: $PM2_LOG_DIR"
    echo "  - Configuration Nginx: $NGINX_CONFIG_PATH"
    echo
    log_info "Commandes utiles:"
    echo "  - Voir les logs: pm2 logs $PROJECT_NAME"
    echo "  - Redémarrer: pm2 restart $PROJECT_NAME"
    echo "  - Arrêter: pm2 stop $PROJECT_NAME"
    echo "  - Status: pm2 status"
    echo "  - Recharger Nginx: sudo systemctl reload nginx"
    echo
    log_info "URLs d'accès:"
    echo "  - Local: http://localhost:3000"
    echo "  - Public: http://votre-domaine.com (après configuration DNS)"
}

# Script principal
main() {
    log_info "Début du déploiement de LLMO Report"
    
    check_prerequisites
    setup_logging
    build_application
    setup_nginx
    deploy_with_pm2
    health_check
    cleanup
    setup_ssl
    show_final_info
    
    log_success "Déploiement terminé avec succès!"
}

# Vérifier les arguments
if [ "$1" != "production" ] && [ "$1" != "staging" ] && [ "$1" != "" ]; then
    log_error "Usage: $0 [production|staging]"
    exit 1
fi

# Confirmation avant déploiement en production
if [ "$1" = "production" ]; then
    log_warning "Vous êtes sur le point de déployer en PRODUCTION"
    read -p "Êtes-vous sûr? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Déploiement annulé"
        exit 0
    fi
fi

# Exécution du script principal
main 