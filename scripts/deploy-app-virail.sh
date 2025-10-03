#!/bin/bash

# Script de déploiement spécifique pour app.virail.studio
# Usage: ./scripts/deploy-app-virail.sh

set -e

# Configuration spécifique
DOMAIN="app.virail.studio"
API_DOMAIN="api.virail.studio"
PROJECT_NAME="llmo-report"
APP_DIR="/home/root/virail-report-refined"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Vérifier que nous sommes dans le bon répertoire
check_directory() {
    if [ ! -f "package.json" ] || [ ! -d "src" ]; then
        log_error "Ce script doit être exécuté depuis la racine du projet virail-report-refined"
        exit 1
    fi
}

# Vérifier la résolution DNS
check_dns() {
    log_info "Vérification de la résolution DNS pour $DOMAIN..."
    
    if nslookup $DOMAIN > /dev/null 2>&1; then
        log_success "DNS résolu pour $DOMAIN"
    else
        log_warning "DNS non résolu pour $DOMAIN"
        log_info "Assurez-vous d'avoir configuré l'enregistrement A dans votre DNS :"
        log_info "Type: A, Nom: app, Valeur: $(curl -s ifconfig.me)"
        
        read -p "Voulez-vous continuer malgré tout ? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 0
        fi
    fi
}

# Copier le fichier d'environnement
setup_env() {
    log_info "Configuration de l'environnement de production..."
    
    if [ -f "env.production" ]; then
        cp env.production .env.production
        log_success "Fichier .env.production configuré"
    else
        log_warning "Fichier env.production non trouvé, création..."
        cat > .env.production << EOF
NODE_ENV=production
VITE_API_BASE_URL=https://$API_DOMAIN
EOF
        log_success "Fichier .env.production créé"
    fi
}

# Build de l'application
build_app() {
    log_info "Construction de l'application..."
    
    # Installation des dépendances
    npm ci
    
    # Build avec l'environnement de production
    npm run build
    
    if [ ! -d "dist" ]; then
        log_error "Le build a échoué"
        exit 1
    fi
    
    log_success "Application construite avec succès"
}

# Configuration Nginx
setup_nginx() {
    log_info "Configuration de Nginx pour $DOMAIN..."
    
    # Copier la configuration
    sudo cp nginx/llmo-report.conf /etc/nginx/sites-available/llmo-report
    
    # Activer le site
    sudo ln -sf /etc/nginx/sites-available/llmo-report /etc/nginx/sites-enabled/
    
    # Supprimer le site par défaut si présent
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Tester la configuration
    if sudo nginx -t; then
        log_success "Configuration Nginx validée"
        sudo systemctl reload nginx
        log_success "Nginx rechargé"
    else
        log_error "Configuration Nginx invalide"
        exit 1
    fi
}

# Déploiement PM2
deploy_pm2() {
    log_info "Déploiement avec PM2..."
    
    # Arrêter l'application si elle existe
    if pm2 list | grep -q "$PROJECT_NAME"; then
        log_info "Arrêt de l'application existante..."
        pm2 stop $PROJECT_NAME
        pm2 delete $PROJECT_NAME
    fi
    
    # Démarrer l'application
    pm2 start ecosystem.config.js --env production
    
    # Sauvegarder et configurer le démarrage automatique
    pm2 save
    pm2 startup > /dev/null 2>&1 || true
    
    log_success "Application déployée avec PM2"
}

# Configuration SSL
setup_ssl() {
    log_info "Configuration SSL pour $DOMAIN..."
    
    # Vérifier si certbot est installé
    if ! command -v certbot &> /dev/null; then
        log_warning "Certbot non installé, installation..."
        sudo apt update
        sudo apt install -y certbot python3-certbot-nginx
    fi
    
    # Configurer SSL
    if sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@virail.studio; then
        log_success "SSL configuré avec succès pour $DOMAIN"
    else
        log_warning "Configuration SSL échouée, l'application est accessible en HTTP"
        log_info "Vous pouvez configurer SSL manuellement avec :"
        log_info "sudo certbot --nginx -d $DOMAIN"
    fi
}

# Vérification de santé
health_check() {
    log_info "Vérification de santé de l'application..."
    
    # Attendre que l'application démarre
    sleep 10
    
    # Test local
    if curl -f http://localhost:3000/ > /dev/null 2>&1; then
        log_success "Application répond en local (port 3000)"
    else
        log_error "Application ne répond pas en local"
        pm2 logs $PROJECT_NAME --lines 20
        return 1
    fi
    
    # Test du domaine
    if curl -f http://$DOMAIN/ > /dev/null 2>&1; then
        log_success "Application accessible via $DOMAIN"
    else
        log_warning "Application non accessible via $DOMAIN (normal si SSL en cours)"
    fi
    
    # Afficher le statut PM2
    pm2 status $PROJECT_NAME
}

# Informations finales
show_info() {
    log_success "Déploiement terminé pour app.virail.studio!"
    echo
    log_info "🌐 URLs d'accès :"
    echo "  - Application: https://$DOMAIN"
    echo "  - API Backend: https://$API_DOMAIN"
    echo
    log_info "📊 Monitoring :"
    echo "  - Logs PM2: pm2 logs $PROJECT_NAME"
    echo "  - Status PM2: pm2 status"
    echo "  - Monitoring: pm2 monit"
    echo
    log_info "🔧 Commandes utiles :"
    echo "  - Redémarrer: pm2 restart $PROJECT_NAME"
    echo "  - Arrêter: pm2 stop $PROJECT_NAME"
    echo "  - Logs Nginx: sudo tail -f /var/log/nginx/llmo-report-*.log"
    echo "  - Recharger Nginx: sudo systemctl reload nginx"
    echo
    log_info "🔄 Pour mettre à jour :"
    echo "  git pull && ./scripts/deploy-app-virail.sh"
}

# Script principal
main() {
    log_info "🚀 Déploiement de LLMO Report sur $DOMAIN"
    echo
    
    check_directory
    check_dns
    setup_env
    build_app
    setup_nginx
    deploy_pm2
    setup_ssl
    health_check
    show_info
    
    log_success "✅ Déploiement terminé avec succès!"
}

# Confirmation
log_warning "Vous êtes sur le point de déployer sur $DOMAIN"
read -p "Continuer ? (Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    log_info "Déploiement annulé"
    exit 0
fi

# Exécution
main 