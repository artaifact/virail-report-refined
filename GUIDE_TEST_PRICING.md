# 🧪 Guide de Test - Page Pricing avec Backend

## 🎯 Objectif
Vérifier que la page pricing (`http://localhost:8081/pricing`) est entièrement connectée avec votre backend (`http://localhost:8000`).

## 📋 Prérequis
- ✅ Backend démarré sur `http://localhost:8000`
- ✅ Frontend démarré sur `http://localhost:8081`
- ✅ Utilisateur `testuser2` avec mot de passe `testpassword123` créé

## 🚀 Étapes de Test

### 1. Test du Backend (Script Automatique)
```bash
# Exécuter le script de test
node test-pricing-integration.js
```

Ce script va :
- ✅ Se connecter avec `testuser2`
- ✅ Récupérer les plans disponibles
- ✅ Vérifier l'abonnement actuel
- ✅ Récupérer les quotas d'usage
- ✅ Créer un abonnement Pro si nécessaire
- ✅ Tester la santé de l'API

### 2. Test Manuel de la Page Pricing

#### 2.1 Connexion
1. Allez sur `http://localhost:8081/login`
2. Connectez-vous avec :
   - **Username** : `testuser2`
   - **Password** : `testpassword123`
3. ✅ Vérifiez que vous êtes redirigé vers le dashboard

#### 2.2 Accès à la Page Pricing
1. Cliquez sur "Plans & Tarifs" dans la sidebar
2. Ou allez directement sur `http://localhost:8081/pricing`
3. ✅ Vérifiez que la page se charge

#### 2.3 Vérification des Plans
1. ✅ Vérifiez que les 4 plans s'affichent :
   - **Free** (Gratuit)
   - **Standard** (29€/mois)
   - **Premium** (79€/mois)
   - **Pro** (129€/mois)

2. ✅ Vérifiez que les détails de chaque plan sont corrects :
   - Prix
   - Limites d'usage
   - Fonctionnalités incluses

#### 2.4 Vérification de l'Abonnement Actuel
1. ✅ Vérifiez que votre plan actuel est affiché
2. ✅ Vérifiez que le statut est "Actif"
3. ✅ Vérifiez la date de fin d'abonnement

#### 2.5 Vérification des Quotas
1. ✅ Vérifiez que les quotas d'usage s'affichent :
   - Analyses utilisées/limite
   - Rapports utilisés/limite
   - Analyses de concurrents utilisées/limite
   - Optimisations utilisées/limite

2. ✅ Vérifiez que les barres de progression sont correctes

#### 2.6 Test de Changement de Plan
1. Cliquez sur un plan différent (ex: Standard)
2. ✅ Vérifiez que le formulaire de paiement s'ouvre
3. Remplissez les informations de carte de test :
   - **Numéro** : `4242424242424242`
   - **Expiration** : `12/25`
   - **CVC** : `123`
4. Cliquez sur "Souscrire"
5. ✅ Vérifiez que l'abonnement est créé

## 🔍 Points de Vérification

### ✅ Connexion Backend
- [ ] Les plans se chargent depuis l'API
- [ ] L'abonnement actuel s'affiche
- [ ] Les quotas sont récupérés
- [ ] Pas d'erreurs dans la console

### ✅ Interface Utilisateur
- [ ] Tous les plans s'affichent correctement
- [ ] Les prix sont corrects
- [ ] Les limites d'usage sont affichées
- [ ] Le plan actuel est mis en évidence
- [ ] Les barres de progression fonctionnent

### ✅ Fonctionnalités
- [ ] Sélection de plan fonctionne
- [ ] Formulaire de paiement s'ouvre
- [ ] Création d'abonnement fonctionne
- [ ] Messages d'erreur appropriés
- [ ] Messages de succès appropriés

## 🐛 Dépannage

### Problème : Plans ne se chargent pas
**Solution** :
1. Vérifiez que le backend est démarré
2. Vérifiez la console pour les erreurs CORS
3. Vérifiez l'URL de l'API dans `src/services/apiService.ts`

### Problème : Erreur d'authentification
**Solution** :
1. Vérifiez que vous êtes connecté
2. Vérifiez les cookies de session
3. Essayez de vous reconnecter

### Problème : Formulaire de paiement ne fonctionne pas
**Solution** :
1. Vérifiez que Stripe est configuré
2. Vérifiez les clés Stripe dans les variables d'environnement
3. Vérifiez les logs du backend

## 📊 Résultats Attendus

### ✅ Succès
- Page pricing se charge sans erreur
- Tous les plans s'affichent
- Abonnement actuel visible
- Quotas d'usage affichés
- Changement de plan fonctionne

### ❌ Échec
- Page ne se charge pas
- Plans manquants
- Erreurs dans la console
- Formulaire de paiement défaillant

## 🎉 Validation Finale

Si tous les tests passent, votre page pricing est entièrement intégrée avec le backend !

**Prochaines étapes** :
1. Tester les autres pages protégées
2. Vérifier la gestion des erreurs
3. Tester avec de vraies cartes de crédit
4. Configurer les webhooks Stripe

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs du backend
2. Vérifiez la console du navigateur
3. Exécutez le script de test
4. Consultez la documentation de l'API









