# 🔐 Guide de Création de Compte Administrateur

## 📋 Vue d'ensemble

Ce guide explique comment créer un compte administrateur dans votre application Virail Studio en utilisant l'endpoint `/auth/create-admin`.

## 🚀 Méthodes de création

### 1. **Via l'interface web (Recommandé)**

1. **Accéder à la page admin** :
   - URL : `http://localhost:3000/admin/waitlist`
   - Se connecter avec un compte admin existant

2. **Naviguer vers l'onglet "Créer Admin"** :
   - Cliquer sur l'onglet "Créer Admin" (visible uniquement pour les admins)

3. **Remplir le formulaire** :
   - **Email** : `admine@virail.studio`
   - **Nom d'utilisateur** : `neeewadmin`
   - **Mot de passe** : `password`

4. **Créer le compte** :
   - Cliquer sur "Créer le compte admin"
   - Le compte sera créé avec tous les privilèges admin

### 2. **Via l'API directement**

#### **Endpoint** : `POST /auth/create-admin`

#### **URL complète** : `http://localhost:8000/auth/create-admin`

#### **Headers requis** :
```json
{
  "Content-Type": "application/json"
}
```

#### **Body de la requête** :
```json
{
  "email": "admine@virail.studio",
  "username": "neeewadmin",
  "password": "password"
}
```

#### **Exemple avec curl** :
```bash
curl -X POST http://localhost:8000/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admine@virail.studio",
    "username": "neeewadmin",
    "password": "password"
  }'
```

#### **Exemple avec JavaScript** :
```javascript
const response = await fetch('http://localhost:8000/auth/create-admin', {
  method: 'POST',
  credentials: 'include', // Important pour les cookies
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: "admine@virail.studio",
    username: "neeewadmin",
    password: "password"
  })
});

const data = await response.json();
console.log('Compte admin créé:', data);
```

### 3. **Via le script de test**

```bash
node test-create-admin.js
```

## 🔒 Sécurité et Authentification

### **Cookies HttpOnly**
- L'application utilise des cookies HttpOnly pour l'authentification
- Les cookies sont automatiquement inclus dans les requêtes
- Pas besoin de gérer les tokens manuellement

### **Privilèges Admin**
- Le compte créé aura automatiquement `is_admin: true`
- Le compte sera automatiquement activé (`is_active: true`)
- Le compte sera automatiquement vérifié (`is_verified: true`)

## 📊 Réponse de l'API

### **Succès (201 Created)** :
```json
{
  "success": true,
  "message": "Compte administrateur créé avec succès",
  "user": {
    "id": 123,
    "email": "admine@virail.studio",
    "username": "neeewadmin",
    "is_admin": true,
    "is_active": true,
    "is_verified": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### **Erreur (400 Bad Request)** :
```json
{
  "success": false,
  "message": "Email déjà utilisé"
}
```

## 🎯 Utilisation après création

### **Se connecter avec le nouveau compte** :
1. Aller sur la page de connexion
2. Utiliser les identifiants :
   - **Nom d'utilisateur** : `neeewadmin`
   - **Mot de passe** : `password`

### **Accéder aux fonctionnalités admin** :
- Page d'administration : `/admin/waitlist`
- Gestion des utilisateurs
- Création d'autres comptes admin
- Statistiques et rapports

## 🔧 Dépannage

### **Erreurs courantes** :

1. **"Email déjà utilisé"** :
   - Changer l'email dans le formulaire
   - Utiliser un email unique

2. **"Nom d'utilisateur déjà utilisé"** :
   - Changer le nom d'utilisateur
   - Utiliser un nom unique

3. **"Erreur d'authentification"** :
   - Vérifier que vous êtes connecté avec un compte admin
   - Vérifier que les cookies sont activés

4. **"Accès refusé"** :
   - Se connecter avec un compte ayant les privilèges admin
   - Vérifier que le compte est actif

## 📝 Notes importantes

- **Unicité** : L'email et le nom d'utilisateur doivent être uniques
- **Sécurité** : Utiliser des mots de passe sécurisés en production
- **Cookies** : L'application utilise des cookies HttpOnly pour la sécurité
- **Privilèges** : Seuls les admins peuvent créer d'autres comptes admin
- **Activation** : Les comptes admin sont automatiquement activés

## 🎉 Félicitations !

Une fois le compte admin créé, vous pouvez :
- Gérer tous les utilisateurs du système
- Accéder aux statistiques avancées
- Créer d'autres comptes administrateur
- Modérer le contenu et les analyses
