# ⚡ Actions Administrateur Avancées - Documentation Complète

## 📋 Vue d'ensemble

Documentation complète de toutes les actions administrateur avancées intégrées dans Virail Studio, incluant la gestion des abonnements et des utilisateurs.

## 🚀 Endpoints implémentés

### 1️⃣ **Gestion des Abonnements** (5 endpoints)

#### ✅ `GET /admin/subscriptions/stats`
**Description** : Statistiques globales des abonnements

**Retour** :
```json
{
  "total_subscriptions": 156,
  "active_subscriptions": 89,
  "expired_subscriptions": 23,
  "cancelled_subscriptions": 15,
  "pending_subscriptions": 5,
  "total_revenue": 4567.00
}
```

#### ✅ `GET /admin/subscriptions/{id}`
**Description** : Détails d'un abonnement spécifique

**Paramètres** :
- `id` : ID de l'abonnement

#### ⚡ `PUT /admin/subscriptions/{id}/force-activate`
**Description** : Activer un abonnement de force

**Utilisation** : Activer immédiatement un abonnement expiré ou annulé

**Interface** : Bouton "⚡ Activer l'abonnement" dans SubscriptionDetails

#### ⚡ `PUT /admin/subscriptions/{id}/force-cancel`
**Description** : Annuler un abonnement de force

**Utilisation** : Annuler immédiatement un abonnement actif

**Interface** : Bouton "🚫 Annuler l'abonnement" (rouge, destructive)

#### ⏰ `PUT /admin/subscriptions/{id}/extend`
**Description** : Étendre la durée d'un abonnement

**Body** :
```json
{
  "days": 30
}
```

**Interface** : Input + Bouton "➕ Étendre" dans SubscriptionDetails

#### ⚡ `POST /admin/subscriptions/{user_id}/create`
**Description** : Créer un abonnement pour un utilisateur

**Body** :
```json
{
  "plan_id": "premium",
  "auto_renew": true,
  "duration_months": 12
}
```

**Utilisation** : Créer manuellement un abonnement (cadeau, compensation, etc.)

---

### 2️⃣ **Gestion Avancée des Utilisateurs** (5 endpoints)

#### ⚡ `PUT /admin/users/{id}`
**Description** : Modifier un utilisateur

**Body** :
```json
{
  "username": "nouveau_nom",
  "email": "nouvel_email@exemple.com",
  "is_active": true,
  "is_verified": true,
  "is_admin": false
}
```

**Interface** : Bouton "✏️ Modifier" → Formulaire avec username et email

#### ⚡ `DELETE /admin/users/{id}`
**Description** : Supprimer un utilisateur définitivement

**⚠️ Action irréversible** : Confirmation obligatoire

**Interface** : Bouton "🗑️ Supprimer" (rouge, destructive)

#### ✅ `PUT /admin/users/{id}/activate`
**Description** : Activer ou désactiver un utilisateur

**Body** :
```json
{
  "is_active": true
}
```

**Interface** : 
- Bouton "❌ Désactiver" (si actif)
- Bouton "✅ Réactiver" (si inactif)

#### 🔑 `PUT /admin/users/{id}/reset-password`
**Description** : Réinitialiser le mot de passe d'un utilisateur

**Body** :
```json
{
  "new_password": "nouveau_mot_de_passe"
}
```

**Interface** : Bouton "🔑 Réinit. MDP" → Formulaire de saisie du nouveau MDP

#### 👤 `PUT /admin/users/{id}/demote`
**Description** : Retirer les droits administrateur d'un utilisateur

**Utilisation** : Rétrograder un admin en utilisateur normal

**Interface** : Bouton "👤 Retirer admin" (visible uniquement si l'utilisateur est admin)

---

## 🎨 Interface Utilisateur

### **SubscriptionDetails.tsx**

#### **Section "Actions administrateur"**
```
┌─────────────────────────────────────────┐
│  ⚡ Actions administrateur               │
├─────────────────────────────────────────┤
│  ✅ Message de feedback (si action)     │
├─────────────────────────────────────────┤
│  Activer de force                       │
│  [⚡ Activer l'abonnement]              │
├─────────────────────────────────────────┤
│  Annuler de force                       │
│  [🚫 Annuler l'abonnement] (rouge)     │
├─────────────────────────────────────────┤
│  Étendre la durée                       │
│  [Input: 30] [➕ Étendre]              │
│  Ajouter 30 jour(s) à la date de fin   │
└─────────────────────────────────────────┘
```

### **UserDetails.tsx**

#### **Section "Actions administrateur"**
```
┌─────────────────────────────────────────┐
│  🛡️ Actions administrateur              │
├─────────────────────────────────────────┤
│  [❌ Désactiver / ✅ Réactiver]        │
│  [✏️ Modifier]                          │
│  [🔑 Réinit. MDP]                       │
│  [👤 Retirer admin] (si admin)         │
│  [🗑️ Supprimer] (rouge)                │
├─────────────────────────────────────────┤
│  📝 Formulaire d'édition (si ouvert)    │
│  - Input: Nom d'utilisateur            │
│  - Input: Email                         │
│  - [Enregistrer] [Annuler]              │
├─────────────────────────────────────────┤
│  🔑 Formulaire MDP (si ouvert)          │
│  - Input: Nouveau mot de passe          │
│  - [Réinitialiser] [Annuler]            │
└─────────────────────────────────────────┘
```

---

## 🔧 Implémentation Technique

### **AdminService.ts**

#### **Gestion des abonnements** :
```typescript
static async forceActivateSubscription(subscriptionId: number | string): Promise<{ success: boolean; message: string }>
static async forceCancelSubscription(subscriptionId: number | string): Promise<{ success: boolean; message: string }>
static async extendSubscription(subscriptionId: number | string, days: number): Promise<{ success: boolean; message: string }>
static async createSubscriptionForUser(userId: number | string, data: { ... }): Promise<{ success: boolean; message: string; subscription?: AdminSubscription }>
```

#### **Gestion des utilisateurs** :
```typescript
static async updateUser(userId: number | string, data: { ... }): Promise<{ success: boolean; message: string; user?: AdminUser }>
static async deleteUser(userId: number | string): Promise<{ success: boolean; message: string }>
static async toggleUserActivation(userId: number | string, isActive: boolean): Promise<{ success: boolean; message: string }>
static async resetUserPassword(userId: number | string, newPassword: string): Promise<{ success: boolean; message: string }>
static async demoteUser(userId: number | string): Promise<{ success: boolean; message: string }>
```

---

## 📊 Cas d'usage

### **1. Compensation client**
```
Scénario : Un client a eu un problème technique
Action : Étendre son abonnement de 7 jours
1. Aller dans Abonnements
2. Trouver l'abonnement du client
3. Entrer "7" dans le champ
4. Cliquer sur "Étendre"
```

### **2. Activer un abonnement en attente**
```
Scénario : Paiement reçu hors plateforme
Action : Activer l'abonnement manuellement
1. Aller dans Abonnements
2. Trouver l'abonnement "En attente"
3. Cliquer sur "Activer l'abonnement"
```

### **3. Réinitialiser un mot de passe oublié**
```
Scénario : Utilisateur bloqué sans accès à son email
Action : Définir un nouveau mot de passe temporaire
1. Aller dans Utilisateurs
2. Trouver l'utilisateur
3. Cliquer sur "Réinit. MDP"
4. Entrer un mot de passe temporaire
5. Communiquer le MDP à l'utilisateur
```

### **4. Modifier les informations d'un utilisateur**
```
Scénario : Demande de changement d'email
Action : Modifier l'email de l'utilisateur
1. Aller dans Utilisateurs
2. Trouver l'utilisateur
3. Cliquer sur "Modifier"
4. Changer l'email
5. Enregistrer
```

### **5. Rétrograder un administrateur**
```
Scénario : Un admin quitte son poste
Action : Retirer ses droits admin
1. Aller dans Utilisateurs
2. Trouver l'utilisateur admin
3. Cliquer sur "Retirer admin"
4. Confirmer
```

---

## ⚠️ Avertissements et Sécurité

### **Actions irréversibles** :
- ❌ **Supprimer un utilisateur** : Données perdues définitivement
- ❌ **Annuler un abonnement** : Peut affecter l'accès utilisateur
- ⚠️ **Réinitialiser un MDP** : L'ancien MDP devient invalide

### **Bonnes pratiques** :
1. ✅ **Toujours vérifier** l'identité avant d'agir
2. ✅ **Logger les actions** pour audit
3. ✅ **Communiquer avec l'utilisateur** avant les modifications
4. ✅ **Utiliser des mots de passe temporaires** forts
5. ✅ **Documenter les raisons** des actions exceptionnelles

### **Confirmations obligatoires** :
- 🔒 Supprimer un utilisateur
- 🔒 Réinitialiser un mot de passe
- 🔒 Retirer les droits admin

---

## 🧪 Tests

### **Test manuel - Abonnements** :
```bash
# 1. Activer un abonnement
POST /admin/subscriptions/1/force-activate

# 2. Étendre de 30 jours
PUT /admin/subscriptions/1/extend
Body: { "days": 30 }

# 3. Annuler
PUT /admin/subscriptions/1/force-cancel
```

### **Test manuel - Utilisateurs** :
```bash
# 1. Modifier un utilisateur
PUT /admin/users/1
Body: { "email": "newemail@example.com" }

# 2. Réinitialiser le MDP
PUT /admin/users/1/reset-password
Body: { "new_password": "TempPass123!" }

# 3. Retirer admin
PUT /admin/users/1/demote
```

---

## 📈 Statistiques et Monitoring

### **Métriques à surveiller** :
- Nombre d'actions admin par jour
- Taux d'extensions d'abonnements
- Nombre de réinitialisations de MDP
- Taux de suppressions d'utilisateurs

### **Logs recommandés** :
```
[ADMIN_ACTION] User admin@example.com activated subscription #123
[ADMIN_ACTION] User admin@example.com extended subscription #456 by 30 days
[ADMIN_ACTION] User admin@example.com reset password for user #789
[ADMIN_ACTION] User admin@example.com demoted user #101
```

---

## ✅ Checklist de déploiement

### **Backend** :
- [x] Endpoints API créés
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Logs d'audit
- [ ] Permissions vérifiées

### **Frontend** :
- [x] Méthodes AdminService créées
- [x] Interfaces SubscriptionDetails mises à jour
- [x] Interfaces UserDetails mises à jour
- [x] Messages de feedback
- [x] Confirmations pour actions critiques
- [ ] Tests E2E
- [ ] Documentation utilisateur

---

## 🎉 Résumé

Vous disposez maintenant de **10 endpoints avancés** permettant de :

### **Abonnements** :
- ✅ Activer de force
- ✅ Annuler de force
- ✅ Étendre la durée
- ✅ Créer pour un utilisateur

### **Utilisateurs** :
- ✅ Modifier les informations
- ✅ Supprimer définitivement
- ✅ Activer/Désactiver
- ✅ Réinitialiser le mot de passe
- ✅ Retirer les droits admin

**Toutes les actions sont intégrées dans l'interface avec des formulaires intuitifs et des confirmations de sécurité ! ⚡✨**
