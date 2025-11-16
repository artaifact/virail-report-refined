# 🎫 Tickets de Mise en Production et Sécurité

## 📊 Vue d'ensemble

Ce document liste tous les tickets nécessaires pour une mise en production sécurisée et complète de l'application Virail Studio.

**Date de création**: $(date)
**Statut global**: 🔴 Non prêt pour la production

---

## 🔴 CRITIQUE - Sécurité

### TICKET-001: Secrets exposés dans le code
**Priorité**: 🔴 CRITIQUE  
**Statut**: ⚠️ À corriger immédiatement

**Problème**:
- `VITE_STRIPE_SECRET_KEY` dans `env.example` - Les clés secrètes ne doivent JAMAIS être dans le frontend
- Les variables `VITE_*` sont compilées dans le bundle et visibles côté client
- Risque de fuite de secrets Stripe

**Actions requises**:
- [ ] Retirer `VITE_STRIPE_SECRET_KEY` de `env.example` (clé secrète = backend uniquement)
- [ ] Vérifier qu'aucune clé secrète n'est dans les variables `VITE_*`
- [ ] Documenter que seules les clés publiques (pk_*) peuvent être dans le frontend
- [ ] Ajouter une validation pour empêcher les secrets dans les variables d'environnement frontend

**Fichiers concernés**:
- `env.example` (ligne 7)
- `src/services/apiService.ts`
- Tous les fichiers utilisant `import.meta.env.VITE_STRIPE_SECRET_KEY`

---

### TICKET-002: Console.log en production
**Priorité**: 🔴 CRITIQUE  
**Statut**: ⚠️ À corriger

**Problème**:
- 1316 occurrences de `console.log/error/warn/debug` dans le code
- Les logs peuvent exposer des informations sensibles
- Impact sur les performances en production

**Actions requises**:
- [ ] Créer un système de logging conditionnel (dev vs prod)
- [ ] Remplacer tous les `console.log` par un logger qui se désactive en production
- [ ] Utiliser un outil comme `vite-plugin-remove-console` pour le build production
- [ ] Garder uniquement les logs d'erreur critiques en production

**Fichiers concernés**:
- Tous les fichiers dans `src/` (126 fichiers)

**Solution proposée**:
```typescript
// src/utils/logger.ts
const isDev = import.meta.env.DEV;
export const logger = {
  log: (...args: any[]) => isDev && console.log(...args),
  error: (...args: any[]) => console.error(...args), // Toujours actif
  warn: (...args: any[]) => isDev && console.warn(...args),
  debug: (...args: any[]) => isDev && console.debug(...args),
};
```

---

### TICKET-003: Headers de sécurité manquants
**Priorité**: 🔴 CRITIQUE  
**Statut**: ⚠️ Partiellement configuré

**Problème**:
- Headers de sécurité dans Nginx mais pas dans l'application React
- Manque Content-Security-Policy (CSP)
- Manque Permissions-Policy

**Actions requises**:
- [ ] Ajouter CSP dans `index.html` via meta tags
- [ ] Configurer CSP strict pour bloquer XSS
- [ ] Ajouter Permissions-Policy pour limiter les APIs du navigateur
- [ ] Vérifier que tous les headers sont présents dans Nginx
- [ ] Tester avec securityheaders.com

**Fichiers concernés**:
- `index.html`
- `nginx/llmo-report.conf`

**Headers à ajouter**:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

### TICKET-004: Validation des entrées utilisateur
**Priorité**: 🔴 CRITIQUE  
**Statut**: ⚠️ À vérifier

**Problème**:
- Pas de validation visible sur les URLs soumises pour analyse
- Risque d'injection de code malveillant
- Pas de sanitization des inputs

**Actions requises**:
- [ ] Valider toutes les URLs avec une regex stricte
- [ ] Sanitizer les inputs avant envoi à l'API
- [ ] Limiter la longueur des inputs
- [ ] Ajouter une validation côté client ET serveur
- [ ] Bloquer les URLs suspectes (localhost, IPs privées en prod)

**Fichiers concernés**:
- `src/pages/Analyses.tsx`
- `src/pages/Competition.tsx`
- `src/services/apiService.ts`

---

### TICKET-005: Gestion des tokens JWT
**Priorité**: 🔴 CRITIQUE  
**Statut**: ⚠️ À améliorer

**Problème**:
- Tokens stockés dans localStorage (vulnérable au XSS)
- Pas de refresh automatique des tokens
- Pas de gestion de l'expiration

**Actions requises**:
- [ ] Préférer httpOnly cookies pour les tokens (backend)
- [ ] Implémenter un système de refresh token automatique
- [ ] Ajouter une gestion d'expiration avec redirection vers login
- [ ] Nettoyer les tokens expirés automatiquement
- [ ] Ajouter un mécanisme de rotation des tokens

**Fichiers concernés**:
- `src/services/authService.ts`
- `src/hooks/useAuth.ts`

---

## 🟠 HAUTE PRIORITÉ - Configuration Production

### TICKET-006: Variables d'environnement production
**Priorité**: 🟠 HAUTE  
**Statut**: ⚠️ Incomplet

**Problème**:
- `env.production` existe mais est minimal (3 lignes)
- Pas de validation des variables requises
- Pas de fallback sécurisé

**Actions requises**:
- [ ] Compléter `env.production` avec toutes les variables nécessaires
- [ ] Créer un script de validation des variables d'environnement
- [ ] Documenter toutes les variables requises vs optionnelles
- [ ] Ajouter des valeurs par défaut sécurisées
- [ ] Créer un template `.env.production.example`

**Fichiers concernés**:
- `env.production`
- `env.example`

**Variables à ajouter**:
```bash
VITE_API_BASE_URL=https://api.viraill.com
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_GOOGLE_ANALYTICS_ID=G-...
# etc.
```

---

### TICKET-007: Configuration TypeScript stricte
**Priorité**: 🟠 HAUTE  
**Statut**: ⚠️ Mode non-strict activé

**Problème**:
- `noImplicitAny: false`
- `strictNullChecks: false`
- `noUnusedLocals: false`
- Risque d'erreurs runtime non détectées

**Actions requises**:
- [ ] Activer `strict: true` progressivement
- [ ] Corriger les erreurs TypeScript une par une
- [ ] Activer `noUnusedLocals` et `noUnusedParameters`
- [ ] Ajouter des types stricts pour toutes les APIs
- [ ] Configurer des règles ESLint plus strictes

**Fichiers concernés**:
- `tsconfig.json`
- Tous les fichiers TypeScript

---

### TICKET-008: Build et optimisation production
**Priorité**: 🟠 HAUTE  
**Statut**: ⚠️ À optimiser

**Problème**:
- Source maps activées même en production (ligne 33 vite.config.ts)
- Pas de compression gzip/brotli configurée
- Pas de cache busting visible
- Pas d'analyse de bundle size

**Actions requises**:
- [ ] Désactiver source maps en production
- [ ] Configurer la compression dans Nginx
- [ ] Vérifier le cache busting des assets
- [ ] Analyser et optimiser la taille du bundle
- [ ] Configurer le code splitting optimal
- [ ] Ajouter un service worker pour le cache (optionnel)

**Fichiers concernés**:
- `vite.config.ts`
- `nginx/llmo-report.conf`

---

### TICKET-009: Gestion des erreurs globale
**Priorité**: 🟠 HAUTE  
**Statut**: ⚠️ Manquante

**Problème**:
- Pas de Error Boundary React
- Erreurs non capturées peuvent crasher l'app
- Pas de reporting d'erreurs en production

**Actions requises**:
- [ ] Créer un Error Boundary React
- [ ] Implémenter un système de reporting d'erreurs (Sentry, LogRocket, etc.)
- [ ] Capturer les erreurs non gérées
- [ ] Afficher des messages d'erreur user-friendly
- [ ] Logger les erreurs côté serveur

**Fichiers concernés**:
- `src/App.tsx`
- Nouveau: `src/components/ErrorBoundary.tsx`

---

### TICKET-010: Monitoring et observabilité
**Priorité**: 🟠 HAUTE  
**Statut**: ⚠️ Manquant

**Problème**:
- Pas de monitoring d'application
- Pas de métriques de performance
- Pas d'alertes en cas de problème

**Actions requises**:
- [ ] Intégrer un service de monitoring (Sentry, Datadog, New Relic)
- [ ] Ajouter des métriques de performance (Web Vitals)
- [ ] Configurer des alertes pour les erreurs critiques
- [ ] Ajouter un dashboard de santé de l'application
- [ ] Logger les métriques importantes (temps de réponse API, etc.)

**Fichiers concernés**:
- `src/App.tsx`
- Nouveau: `src/utils/monitoring.ts`

---

## 🟡 MOYENNE PRIORITÉ - Qualité et Tests

### TICKET-011: Tests de sécurité
**Priorité**: 🟡 MOYENNE  
**Statut**: ⚠️ Non effectués

**Problème**:
- Pas de tests de sécurité automatisés
- Pas de scan de dépendances vulnérables
- Pas de tests de pénétration

**Actions requises**:
- [ ] Exécuter `npm audit` et corriger les vulnérabilités
- [ ] Configurer Dependabot ou Snyk
- [ ] Effectuer un scan OWASP
- [ ] Tester les endpoints API pour les vulnérabilités courantes
- [ ] Vérifier la protection CSRF

**Commandes**:
```bash
npm audit
npm audit fix
npx snyk test
```

---

### TICKET-012: Tests end-to-end en production
**Priorité**: 🟡 MOYENNE  
**Statut**: ⚠️ Tests existants mais à valider

**Problème**:
- Tests E2E existants mais pas de pipeline CI/CD
- Pas de tests sur l'environnement de staging
- Pas de tests de régression automatiques

**Actions requises**:
- [ ] Configurer un pipeline CI/CD (GitHub Actions, GitLab CI, etc.)
- [ ] Exécuter les tests E2E avant chaque déploiement
- [ ] Créer un environnement de staging
- [ ] Automatiser les tests de smoke après déploiement
- [ ] Ajouter des tests de performance

**Fichiers concernés**:
- `.github/workflows/` (à créer)
- `e2e/` (existant)

---

### TICKET-013: Documentation de déploiement
**Priorité**: 🟡 MOYENNE  
**Statut**: ⚠️ Partiellement documenté

**Problème**:
- Documentation existante mais peut être améliorée
- Pas de runbook pour les incidents
- Pas de guide de rollback détaillé

**Actions requises**:
- [ ] Compléter la documentation de déploiement
- [ ] Créer un runbook pour les incidents courants
- [ ] Documenter le processus de rollback
- [ ] Ajouter un checklist pré-déploiement
- [ ] Documenter la configuration de tous les services

**Fichiers concernés**:
- `PRODUCTION_CHECKLIST.md` (existant)
- `docs/DEPLOYMENT_GUIDE.md` (existant)
- Nouveau: `docs/RUNBOOK.md`

---

## 🟢 BASSE PRIORITÉ - Améliorations

### TICKET-014: Performance et optimisation
**Priorité**: 🟢 BASSE  
**Statut**: ⚠️ À optimiser

**Problème**:
- Pas d'analyse de performance approfondie
- Pas de lazy loading des routes
- Pas d'optimisation des images

**Actions requises**:
- [ ] Analyser avec Lighthouse
- [ ] Implémenter le lazy loading des routes
- [ ] Optimiser les images (WebP, lazy loading)
- [ ] Réduire le JavaScript initial
- [ ] Optimiser les fonts (subset, preload)

---

### TICKET-015: Accessibilité (a11y)
**Priorité**: 🟢 BASSE  
**Statut**: ⚠️ Non vérifié

**Problème**:
- Pas de tests d'accessibilité
- Pas de vérification ARIA
- Pas de tests au clavier

**Actions requises**:
- [ ] Exécuter un audit d'accessibilité (axe-core, WAVE)
- [ ] Corriger les problèmes d'accessibilité
- [ ] Tester la navigation au clavier
- [ ] Vérifier le contraste des couleurs
- [ ] Ajouter des labels ARIA manquants

---

### TICKET-016: SEO et métadonnées
**Priorité**: 🟢 BASSE  
**Statut**: ⚠️ À améliorer

**Problème**:
- Pas de métadonnées dynamiques
- Pas de sitemap
- Pas de robots.txt optimisé

**Actions requises**:
- [ ] Ajouter des meta tags dynamiques (title, description, OG)
- [ ] Créer un sitemap.xml
- [ ] Optimiser robots.txt
- [ ] Ajouter des structured data (JSON-LD)
- [ ] Configurer les canonical URLs

**Fichiers concernés**:
- `index.html`
- `public/robots.txt` (existant mais à vérifier)

---

## 📋 Checklist Pré-Déploiement

### Sécurité
- [ ] TICKET-001: Secrets retirés du frontend
- [ ] TICKET-002: Console.log supprimés en production
- [ ] TICKET-003: Headers de sécurité configurés
- [ ] TICKET-004: Validation des inputs implémentée
- [ ] TICKET-005: Gestion JWT sécurisée
- [ ] TICKET-011: Tests de sécurité effectués

### Configuration
- [ ] TICKET-006: Variables d'environnement complètes
- [ ] TICKET-007: TypeScript en mode strict
- [ ] TICKET-008: Build optimisé pour production

### Qualité
- [ ] TICKET-009: Error Boundary implémenté
- [ ] TICKET-010: Monitoring configuré
- [ ] TICKET-012: Tests E2E validés
- [ ] TICKET-013: Documentation complète

### Infrastructure
- [ ] SSL/TLS configuré et valide
- [ ] Nginx configuré correctement
- [ ] PM2 configuré avec auto-restart
- [ ] Backups configurés
- [ ] Firewall configuré (ufw)
- [ ] Health checks fonctionnels

---

## 🚀 Ordre de Priorité Recommandé

### Phase 1 - Critique (Avant tout déploiement)
1. TICKET-001: Secrets exposés
2. TICKET-002: Console.log
3. TICKET-003: Headers sécurité
4. TICKET-004: Validation inputs
5. TICKET-005: Gestion JWT

### Phase 2 - Essentiel (Avant production)
6. TICKET-006: Variables environnement
7. TICKET-008: Build optimisé
8. TICKET-009: Error Boundary
9. TICKET-010: Monitoring
10. TICKET-011: Tests sécurité

### Phase 3 - Qualité (Post-lancement)
11. TICKET-007: TypeScript strict
12. TICKET-012: Tests E2E
13. TICKET-013: Documentation
14. TICKET-014: Performance
15. TICKET-015: Accessibilité
16. TICKET-016: SEO

---

## 📞 Support et Questions

Pour toute question sur ces tickets, référez-vous à:
- `PRODUCTION_CHECKLIST.md` pour le déploiement
- `docs/DEPLOYMENT_GUIDE.md` pour les détails techniques
- Les fichiers de configuration dans `nginx/` et `scripts/`

---

**Dernière mise à jour**: $(date)  
**Prochaine révision**: Après résolution des tickets critiques

