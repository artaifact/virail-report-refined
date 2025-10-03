# Guide de Déploiement sur app.virail.studio

## 🎯 Configuration DNS

### 1. Configuration dans votre registrar de domaine (virail.studio)

Ajoutez un enregistrement A pour le sous-domaine `app` :

```
Type: A
Nom: app
Valeur: [IP_DE_VOTRE_VPS]
TTL: 300 (5 minutes) ou 3600 (1 heure)
```

**Exemple :**
- Si votre VPS a l'IP `123.45.67.89`, créez :
  - `app.virail.studio` → `123.45.67.89`

### 2. Vérification DNS

Testez que le DNS fonctionne :

```bash
# Vérifier la résolution DNS
nslookup app.virail.studio
dig app.virail.studio

# Vérifier depuis différents serveurs DNS
dig @8.8.8.8 app.virail.studio
dig @1.1.1.1 app.virail.studio
```

**Note :** La propagation DNS peut prendre de 5 minutes à 24 heures selon votre TTL.

## 🚀 Déploiement sur le VPS

### 1. Connexion au VPS

```bash
ssh root@[IP_DE_VOTRE_VPS]
# ou
ssh votre_utilisateur@[IP_DE_VOTRE_VPS]
```

### 2. Préparation du système

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation des prérequis
sudo apt install -y curl git nginx

# Installation de Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installation de PM2
sudo npm install -g pm2

# Installation de Certbot pour SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 3. Clonage et configuration du projet

```bash
# Aller dans le répertoire de travail
cd /home/root

# Cloner le projet (remplacez par votre URL de repo)
git clone https://github.com/votre-username/virail-report-refined.git
cd virail-report-refined

# Copier le fichier d'environnement
cp env.production .env.production

# Rendre les scripts exécutables
chmod +x scripts/*.sh
```

### 4. Configuration et lancement

```bash
# Lancer le déploiement automatique
./scripts/deploy.sh production
```

**Le script va automatiquement :**
- Installer les dépendances
- Construire l'application
- Configurer Nginx
- Démarrer l'application avec PM2
- Proposer la configuration SSL

## 🔒 Configuration SSL automatique

Pendant le déploiement, quand demandé :

1. Répondez `y` pour configurer SSL
2. Entrez `app.virail.studio` comme domaine
3. Certbot configurera automatiquement HTTPS

**Ou manuellement après :**

```bash
sudo certbot --nginx -d app.virail.studio

# Tester le renouvellement automatique
sudo certbot renew --dry-run
```

## 🔧 Configuration manuelle si nécessaire

### 1. Configuration Nginx

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

### 2. Démarrage PM2

```bash
# Construire l'application
npm ci
npm run build

# Démarrer avec PM2
pm2 start ecosystem.config.js --env production

# Sauvegarder la configuration
pm2 save

# Configurer le démarrage automatique
pm2 startup
```

## ✅ Vérification du déploiement

### 1. Vérification des services

```bash
# Statut de l'application
pm2 status

# Statut de Nginx
sudo systemctl status nginx

# Logs de l'application
pm2 logs llmo-report

# Logs Nginx
sudo tail -f /var/log/nginx/llmo-report-access.log
sudo tail -f /var/log/nginx/llmo-report-error.log
```

### 2. Tests d'accès

```bash
# Test local
curl http://localhost:3000

# Test du domaine
curl https://app.virail.studio

# Test avec détails SSL
curl -I https://app.virail.studio
```

### 3. Vérification browser

Ouvrez votre navigateur et allez sur :
- `https://app.virail.studio`

Vérifiez :
- ✅ Le site se charge correctement
- ✅ Le certificat SSL est valide (cadenas vert)
- ✅ Pas d'erreurs dans la console développeur
- ✅ L'authentification fonctionne
- ✅ Les appels API vers `https://api.virail.studio` fonctionnent

## 🔄 Mise à jour

### Déploiement rapide des mises à jour

```bash
cd /home/root/virail-report-refined

# Récupérer les dernières modifications
git pull origin main

# Redéployer
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
pm2 restart llmo-report
```

## 🐛 Dépannage

### Problèmes DNS

```bash
# Si app.virail.studio ne résout pas
nslookup app.virail.studio

# Vérifier la configuration DNS chez votre registrar
# Attendre la propagation (jusqu'à 24h)
```

### Problèmes SSL

```bash
# Renouveler le certificat manuellement
sudo certbot renew

# Vérifier les certificats
sudo certbot certificates

# Reconfigurer SSL
sudo certbot --nginx -d app.virail.studio
```

### Problèmes d'application

```bash
# Vérifier les logs PM2
pm2 logs llmo-report

# Redémarrer l'application
pm2 restart llmo-report

# Vérifier les logs Nginx
sudo tail -f /var/log/nginx/llmo-report-error.log
```

### Problèmes de CORS/API

Si les appels vers `https://api.virail.studio` échouent :

1. Vérifiez que l'API backend est déployée sur `api.virail.studio`
2. Vérifiez la configuration CORS de votre backend
3. Vérifiez les logs de l'application pour voir les erreurs

## 📋 Checklist post-déploiement

- [ ] DNS configuré et résolu
- [ ] SSL activé et fonctionnel
- [ ] Application accessible sur `https://app.virail.studio`
- [ ] PM2 configuré pour redémarrage automatique
- [ ] Nginx configuré et actif
- [ ] Logs accessibles et monitornés
- [ ] Authentification fonctionnelle
- [ ] API calls vers `https://api.virail.studio` fonctionnels
- [ ] Certificats SSL configurés pour renouvellement automatique

## 🎉 URLs finales

Une fois déployé avec succès :

- **Application frontend :** `https://app.virail.studio`
- **API backend :** `https://api.virail.studio`
- **Monitoring PM2 :** `pm2 monit` sur le serveur

## 📞 Support

### Logs importants

```bash
# Application
pm2 logs llmo-report

# Nginx
sudo tail -f /var/log/nginx/llmo-report-*.log

# SSL
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### Commandes de diagnostic

```bash
# Status général
pm2 status
sudo systemctl status nginx
sudo systemctl status certbot.timer

# Test de connectivité
curl -I https://app.virail.studio
curl -I https://api.virail.studio
``` 