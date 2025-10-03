# Guide de Déploiement LLMO Report

## 📋 Prérequis

### Serveur VPS
- Ubuntu 20.04+ ou Debian 11+
- 2 GB RAM minimum (4 GB recommandé)
- 20 GB d'espace disque
- Accès root ou sudo

### Logiciels requis
- Node.js 18+ et npm
- PM2 (gestionnaire de processus)
- Nginx (reverse proxy)
- Git

## 🚀 Installation rapide

### 1. Cloner le projet
```bash
cd /home/root
git clone <your-repo-url> virail-report-refined
cd virail-report-refined
```

### 2. Exécuter le script de déploiement
```bash
chmod +x scripts/*.sh
./scripts/deploy.sh production
```

Le script se charge de tout automatiquement !

## 📖 Installation manuelle

### 1. Installation des prérequis

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer PM2 globalement
sudo npm install -g pm2

# Vérifier Nginx (déjà installé selon votre configuration)
nginx -v
```

### 2. Configuration du projet

```bash
# Cloner le projet
cd /home/root
git clone <your-repo-url> virail-report-refined
cd virail-report-refined

# Installer les dépendances
npm ci

# Créer le build de production
npm run build
```

### 3. Configuration Nginx

```bash
# Copier la configuration
sudo cp nginx/llmo-report.conf /etc/nginx/sites-available/llmo-report

# Activer le site
sudo ln -s /etc/nginx/sites-available/llmo-report /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

### 4. Démarrage avec PM2

```bash
# Démarrer l'application
pm2 start ecosystem.config.js --env production

# Sauvegarder la configuration PM2
pm2 save

# Configurer le démarrage automatique
pm2 startup
```

## 🔧 Configuration

### Variables d'environnement

Modifier `.env.production` :

```env
NODE_ENV=production
VITE_API_BASE_URL=https://votre-domaine.com/api
VITE_API_EXTENDED_URL=https://votre-domaine.com/api-extended
```

### Configuration Nginx

Modifier `nginx/llmo-report.conf` :
- Remplacer `votre-domaine.com` par votre domaine réel
- Ajuster les chemins SSL si nécessaire

### Configuration PM2

Modifier `ecosystem.config.js` :
- Ajuster le chemin `cwd` si nécessaire
- Modifier les paramètres de mémoire selon votre serveur

## 🔒 Configuration SSL (HTTPS)

### Avec Let's Encrypt (recommandé)

```bash
# Installer certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir le certificat
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Tester le renouvellement automatique
sudo certbot renew --dry-run
```

### Certificat manuel

1. Placer vos certificats dans `/etc/ssl/certs/`
2. Modifier les chemins dans la configuration Nginx

## 📊 Monitoring et Maintenance

### Health Check
```bash
# Vérification manuelle
./scripts/health-check.sh

# Vérification détaillée
./scripts/health-check.sh detailed
```

### Monitoring continu
```bash
# Démarrer le monitoring
./scripts/monitor.sh start

# Voir le statut
./scripts/monitor.sh status

# Arrêter le monitoring
./scripts/monitor.sh stop
```

### Installer comme service systemd
```bash
./scripts/monitor.sh install-service
sudo systemctl start llmo-monitor
sudo systemctl enable llmo-monitor
```

## 🔄 Commandes de gestion

### PM2
```bash
# Voir les processus
pm2 list

# Logs en temps réel
pm2 logs llmo-report

# Redémarrer l'application
pm2 restart llmo-report

# Arrêter l'application
pm2 stop llmo-report

# Supprimer l'application
pm2 delete llmo-report
```

### Nginx
```bash
# Tester la configuration
sudo nginx -t

# Recharger la configuration
sudo systemctl reload nginx

# Redémarrer Nginx
sudo systemctl restart nginx

# Voir les logs
sudo tail -f /var/log/nginx/llmo-report-access.log
sudo tail -f /var/log/nginx/llmo-report-error.log
```

## 🐛 Dépannage

### Application ne démarre pas
1. Vérifier les logs PM2 : `pm2 logs llmo-report`
2. Vérifier le build : `ls -la dist/`
3. Vérifier les permissions : `ls -la /home/root/virail-report-refined`

### Nginx erreur 502
1. Vérifier que l'application PM2 est en ligne
2. Vérifier que le port 3000 est bien ouvert
3. Vérifier les logs Nginx

### Problèmes de CORS
1. Vérifier la configuration `VITE_API_BASE_URL`
2. Vérifier les headers CORS dans Nginx
3. S'assurer que le backend accepte les requêtes du domaine

### Certificats SSL expirés
```bash
# Renouveler manuellement
sudo certbot renew

# Vérifier l'expiration
sudo certbot certificates
```

## 🔄 Mise à jour

### Déploiement automatique
```bash
# Pull des dernières modifications
git pull origin main

# Redéploiement complet
./scripts/deploy.sh production
```

### Mise à jour manuelle
```bash
# Arrêter l'application
pm2 stop llmo-report

# Mettre à jour le code
git pull origin main

# Réinstaller les dépendances
npm ci

# Rebuild
npm run build

# Redémarrer
pm2 start llmo-report
```

## 📁 Structure des fichiers

```
/home/root/virail-report-refined/
├── dist/                     # Build de production
├── nginx/                    # Configuration Nginx
├── scripts/                  # Scripts de déploiement
│   ├── deploy.sh            # Script principal
│   ├── health-check.sh      # Vérification de santé
│   └── monitor.sh           # Monitoring continu
├── ecosystem.config.js      # Configuration PM2
├── .env.production         # Variables d'environnement
└── ...
```

## 📞 Support

### Logs importants
- Application : `/var/log/pm2/llmo-report-*.log`
- Nginx : `/var/log/nginx/llmo-report-*.log`
- Health check : `/var/log/health-check.log`
- Monitoring : `/var/log/llmo-monitor.log`

### Commandes de diagnostic
```bash
# Status général
pm2 status
sudo systemctl status nginx

# Utilisation des ressources
pm2 monit
htop

# Logs en temps réel
pm2 logs llmo-report --lines 100
tail -f /var/log/nginx/llmo-report-error.log
```

## 🎯 Optimisations de performance

### Configuration Nginx
- Compression gzip activée
- Cache des assets statiques (1 an)
- Headers de sécurité

### PM2
- Redémarrage automatique en cas de crash
- Limitation mémoire : 1GB
- Logs rotatifs

### Application
- Build optimisé avec Vite
- Code splitting automatique
- Assets minifiés

## 🔒 Sécurité

### Headers configurés
- Strict-Transport-Security
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

### Firewall recommandé
```bash
# Ouvrir seulement les ports nécessaires
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
``` 