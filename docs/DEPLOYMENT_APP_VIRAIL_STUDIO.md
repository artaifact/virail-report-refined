# Guide de Déploiement sur app.viraill.com

## 🎯 Configuration DNS

### 1. Configuration dans votre registrar de domaine (viraill.com)

Ajoutez un enregistrement A pour le sous-domaine `app` :

```
Type: A
Nom: app
Valeur: [IP_DE_VOTRE_VPS]
TTL: 300 (5 minutes) ou 3600 (1 heure)
```

**Exemple :**
- Si votre VPS a l'IP `123.45.67.89`, créez :
  - `app.viraill.com` → `123.45.67.89`

### 2. Vérification DNS

Testez que le DNS fonctionne :

```bash
# Vérifier la résolution DNS
nslookup app.viraill.com
dig app.viraill.com

# Vérifier depuis différents serveurs DNS
dig @8.8.8.8 app.viraill.com
dig @1.1.1.1 app.viraill.com
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

### 4. Build et déploiement

```bash
# Installer les dépendances
npm ci

# Build en mode production
npm run build

# Déployer avec PM2
pm2 start ecosystem.config.js --env production
pm2 save
```

### 5. Configuration Nginx

- Utiliser `nginx/llmo-report.conf`
- Remplacer le `server_name` par `app.viraill.com`
- Recharger Nginx :

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 6. Configuration SSL

```bash
sudo certbot --nginx -d app.viraill.com --non-interactive --agree-tos --email admin@viraill.com
```

### 7. Variables d'environnement

- `VITE_API_BASE_URL=https://api.viraill.com`

### 8. Vérifications finales

- Application: https://app.viraill.com
- API Backend: https://api.viraill.com 