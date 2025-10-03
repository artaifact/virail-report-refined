# 🔐 Intégration des Endpoints Admin - Documentation

## 📋 Vue d'ensemble

Cette intégration ajoute des fonctionnalités d'administration des utilisateurs au LLMODashboard avec une sécurité renforcée basée sur l'authentification par cookies et la vérification des privilèges administrateur.

## 🚀 Fonctionnalités implémentées

### 1. **Endpoints Admin intégrés**
- ✅ `GET /admin/users` - Liste des utilisateurs avec pagination et filtres
- ✅ `GET /admin/users/{id}` - Détails d'un utilisateur spécifique  
- ✅ `GET /admin/users/stats` - Statistiques globales des utilisateurs
- ✅ `GET /admin/users/search` - Recherche d'utilisateurs par email/username

### 2. **Sécurité implémentée**
- ✅ Authentification par cookies uniquement
- ✅ Vérification du statut admin (`is_admin: true`)
- ✅ Vérification du statut actif (`is_active: true`)
- ✅ Accès refusé aux utilisateurs non-admin
- ✅ Gestion des erreurs 401/403

## 🏗️ Architecture

### **Types TypeScript** (`src/types/admin.ts`)
```typescript
interface AdminUser {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
  last_login?: string;
  total_reports?: number;
  total_analyses?: number;
}
```

### **Service Admin** (`src/services/adminService.ts`)
- Classe `AdminService` avec méthodes statiques
- Vérification automatique des privilèges admin
- Gestion des erreurs et fallbacks
- Requêtes authentifiées avec cookies

### **Composants UI**

#### **UserManagement** (`src/components/admin/UserManagement.tsx`)
- 📊 Tableau de bord avec statistiques
- 🔍 Recherche et filtres avancés
- 📄 Pagination des résultats
- 🎯 Sélection d'utilisateurs (clic pour voir détails)

#### **UserDetails** (`src/components/admin/UserDetails.tsx`)
- 👤 Affichage détaillé d'un utilisateur
- 🏷️ Statuts et rôles avec badges
- 📈 Métriques d'activité
- ↩️ Navigation retour

## 🔧 Intégration dans LLMODashboard

### **Nouvel onglet "Administration"**
- Affiché uniquement pour les utilisateurs admin
- Navigation fluide entre liste et détails
- Interface cohérente avec le design existant

### **Sécurité par couches**
1. **Vérification initiale** : `AdminService.checkAdminPrivileges()`
2. **Vérification par requête** : `AdminService.verifyAdminAccess()`
3. **Gestion des erreurs** : Messages d'erreur appropriés
4. **Interface conditionnelle** : Onglet masqué si non-admin

## 🎨 Interface utilisateur

### **Tableau de bord admin**
- 📈 **4 cartes de statistiques** : Total, Actifs, Admins, Nouveaux
- 🔍 **Barre de recherche** : Par email/username
- 🎛️ **Filtres** : Statut actif, Rôle, Vérification
- 📊 **Tableau interactif** : Clic pour voir détails

### **Page de détails utilisateur**
- 👤 **Informations personnelles** : Username, Email, ID, Date création
- 🏷️ **Statuts visuels** : Badges colorés pour Actif/Vérifié/Admin
- 📊 **Métriques d'activité** : Dernière connexion, Rapports, Analyses
- ↩️ **Navigation** : Bouton retour à la liste

## 🔒 Sécurité

### **Authentification**
```typescript
// Vérification des privilèges admin
private static async verifyAdminAccess(): Promise<void> {
  const userProfile = await AuthService.getUserProfile();
  
  if (!userProfile.is_admin) {
    throw new Error('Accès refusé: privilèges administrateur requis');
  }
  
  if (!userProfile.is_active) {
    throw new Error('Accès refusé: compte utilisateur inactif');
  }
}
```

### **Gestion des erreurs**
- **401** : Authentification requise
- **403** : Privilèges administrateur requis
- **Fallback** : Messages d'erreur utilisateur-friendly

## 🚀 Utilisation

### **Pour les administrateurs**
1. Se connecter avec un compte admin
2. L'onglet "Administration" apparaît automatiquement
3. Accéder à la gestion des utilisateurs
4. Utiliser les filtres et la recherche
5. Cliquer sur un utilisateur pour voir ses détails

### **Pour les développeurs**
```typescript
// Utilisation du service admin
import { AdminService } from '@/services/adminService';

// Vérifier les privilèges
const isAdmin = await AdminService.checkAdminPrivileges();

// Récupérer les utilisateurs
const users = await AdminService.getUsers(1, 20, { is_active: true });

// Rechercher des utilisateurs
const results = await AdminService.searchUsers({
  query: 'john@example.com',
  page: 1,
  per_page: 10
});
```

## 📁 Fichiers créés/modifiés

### **Nouveaux fichiers**
- `src/types/admin.ts` - Types TypeScript
- `src/services/adminService.ts` - Service admin
- `src/components/admin/UserManagement.tsx` - Gestion des utilisateurs
- `src/components/admin/UserDetails.tsx` - Détails utilisateur

### **Fichiers modifiés**
- `src/pages/LLMODashboard.tsx` - Intégration de l'onglet admin

## 🔄 Flux de données

```mermaid
graph TD
    A[LLMODashboard] --> B{Admin?}
    B -->|Oui| C[Afficher onglet Admin]
    B -->|Non| D[Masquer onglet]
    C --> E[UserManagement]
    E --> F[AdminService.getUsers]
    F --> G[API /admin/users]
    E --> H[Clic utilisateur]
    H --> I[UserDetails]
    I --> J[AdminService.getUserById]
    J --> K[API /admin/users/{id}]
```

## ✅ Tests recommandés

1. **Test de sécurité** : Vérifier que les non-admin ne voient pas l'onglet
2. **Test d'authentification** : Vérifier les erreurs 401/403
3. **Test de navigation** : Liste → Détails → Retour
4. **Test de recherche** : Fonctionnalité de recherche et filtres
5. **Test de pagination** : Navigation entre les pages

## 🎯 Prochaines améliorations

- [ ] Actions admin (activer/désactiver utilisateurs)
- [ ] Export des données utilisateurs
- [ ] Logs d'activité admin
- [ ] Notifications en temps réel
- [ ] Graphiques d'évolution des utilisateurs
