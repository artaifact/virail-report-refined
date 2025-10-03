# 📋 Checklist de Mise en Production LLMO Report

## ✅ Avant le Déploiement

### Prérequis Serveur
- [ ] VPS avec Ubuntu 20.04+ ou Debian 11+
- [ ] 2-4 GB RAM disponible
- [ ] 20 GB d'espace disque libre
- [ ] Accès root/sudo configuré
- [ ] Domaine pointé vers le serveur (optionnel)

### Logiciels Installés
- [ ] Node.js 18+ : `node -v`
- [ ] npm : `npm -v`
- [ ] Nginx : `nginx -v`
- [ ] Git : `git --version`
- [ ] PM2 : `pm2 -v` (sera installé automatiquement)

## 🚀 Déploiement Rapide

### 1. Préparation
```bash
# Se connecter au serveur
ssh root@votre-serveur

# Se placer dans le bon répertoire
cd /home/root

# Cloner le projet
git clone <votre-repo-url> virail-report-refined
cd virail-report-refined
```

### 2. Configuration
- [ ] Modifier `.env.production` avec votre domaine
- [ ] Modifier `nginx/llmo-report.conf` avec votre domaine
- [ ] Ajuster `ecosystem.config.js` si nécessaire

### 3. Déploiement Automatique
```bash
# Rendre les scripts exécutables
chmod +x scripts/*.sh

# Lancer le déploiement
./scripts/deploy.sh production
```

### 4. Vérifications Post-Déploiement
- [ ] Application PM2 en ligne : `pm2 status`
- [ ] Réponse HTTP : `curl http://localhost:3000`
- [ ] Configuration Nginx : `sudo nginx -t`
- [ ] Logs sans erreurs : `pm2 logs llmo-report`

## 🔧 Configuration DNS (si domaine)

### Enregistrements requis
- [ ] A record : `votre-domaine.com` → IP du serveur
- [ ] A record : `www.votre-domaine.com` → IP du serveur

### Test DNS
```bash
# Vérifier la résolution
nslookup votre-domaine.com
dig votre-domaine.com
```

## 🔒 Configuration SSL

### Let's Encrypt (Recommandé)
```bash
# Installer certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir le certificat (remplacer par votre domaine)
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Vérifier le renouvellement automatique
sudo certbot renew --dry-run
```

### Vérifications SSL
- [ ] Certificat installé : `sudo certbot certificates`
- [ ] HTTPS fonctionne : `curl https://votre-domaine.com`
- [ ] Redirection HTTP→HTTPS active

## 📊 Monitoring

### Activation du Monitoring
```bash
# Démarrer le monitoring
./scripts/monitor.sh start

# Vérifier le statut
./scripts/monitor.sh status

# Installer comme service (optionnel)
./scripts/monitor.sh install-service
sudo systemctl start llmo-monitor
```

### Health Checks
- [ ] Health check manuel : `./scripts/health-check.sh`
- [ ] Monitoring actif : `./scripts/monitor.sh status`
- [ ] Logs de monitoring : `tail /var/log/llmo-monitor.log`

## 🔗 URLs de Test

Après déploiement, tester ces URLs :

### Local (serveur)
- [ ] `http://localhost:3000` - Application React
- [ ] `http://localhost:3000/health` - Health check endpoint

### Public (si domaine configuré)
- [ ] `https://votre-domaine.com` - Application principale
- [ ] `https://votre-domaine.com/api/` - Proxy API backend
- [ ] `https://votre-domaine.com/api-extended/` - Proxy API étendue

## 🛠️ Commandes de Gestion

### PM2
```bash
pm2 list                    # Liste des processus
pm2 logs llmo-report        # Logs en temps réel  
pm2 restart llmo-report     # Redémarrer
pm2 stop llmo-report        # Arrêter
pm2 monit                   # Monitoring des ressources
```

### Nginx
```bash
sudo nginx -t               # Tester la config
sudo systemctl reload nginx # Recharger
sudo systemctl status nginx # Statut du service
```

### Logs Importants
```bash
# Logs de l'application
tail -f /var/log/pm2/llmo-report-out.log
tail -f /var/log/pm2/llmo-report-error.log

# Logs Nginx
tail -f /var/log/nginx/llmo-report-access.log
tail -f /var/log/nginx/llmo-report-error.log
```

## 🔄 Mise à Jour

### Déploiement de nouvelles versions
```bash
cd /home/root/virail-report-refined
git pull origin main
./scripts/deploy.sh production
```

### Rollback en cas de problème
```bash
git log --oneline           # Voir l'historique
git checkout <commit-hash>  # Revenir à une version
./scripts/deploy.sh production
```

## 🆘 Dépannage Rapide

### Application ne démarre pas
1. `pm2 logs llmo-report` - Voir les erreurs
2. `ls -la dist/` - Vérifier le build
3. `npm run build` - Rebuilder si nécessaire

### Erreur 502 Bad Gateway
1. `pm2 status` - Vérifier que l'app est en ligne
2. `sudo netstat -tlnp | grep 3000` - Vérifier le port
3. `sudo nginx -t` - Vérifier la config Nginx

### Problèmes SSL
1. `sudo certbot certificates` - Voir les certificats
2. `sudo certbot renew` - Renouveler si expiré
3. Vérifier les chemins dans la config Nginx

## ✅ Checklist Finale

### Production Ready
- [ ] ✅ Application accessible via HTTP/HTTPS
- [ ] ✅ PM2 process manager actif
- [ ] ✅ Nginx reverse proxy configuré  
- [ ] ✅ SSL/HTTPS fonctionnel (si domaine)
- [ ] ✅ Monitoring et health checks actifs
- [ ] ✅ Logs configurés et accessibles
- [ ] ✅ Auto-restart en cas de crash
- [ ] ✅ Déploiement automatisé fonctionnel

### Optionnel mais Recommandé
- [ ] Backup automatique configuré
- [ ] Firewall configuré (ufw)
- [ ] Monitoring externe (Uptime Robot, etc.)
- [ ] Notifications (Discord/Slack webhook)
- [ ] Documentation équipe mise à jour

## 📞 Contact & Support

En cas de problème :
1. Consulter les logs : `/var/log/pm2/` et `/var/log/nginx/`
2. Vérifier le guide complet : `docs/DEPLOYMENT_GUIDE.md`
3. Tester les commandes de diagnostic du guide

---

**🎉 Félicitations ! Votre application LLMO Report est maintenant en production !** 