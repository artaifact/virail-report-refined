# 📨 Guide de Gestion des Messages Admin

## 📋 Vue d'ensemble

Ce guide explique comment utiliser la nouvelle interface de gestion des messages dans la section admin de Virail Studio. Cette fonctionnalité permet aux administrateurs de gérer tous les messages de contact/support reçus via l'application.

## 🚀 Fonctionnalités implémentées

### 1. **Onglet Messages dans AdminWaitlist**
- ✅ Accessible depuis `/admin/waitlist`
- ✅ Visible uniquement pour les administrateurs
- ✅ Navigation fluide entre liste et détails

### 2. **Composants créés**

#### **MessageManagement** (`src/components/admin/MessageManagement.tsx`)
- 📊 Statistiques des messages (Total, Non lus, Répondus, Priorité haute)
- 🔍 Recherche avancée par email, nom, sujet
- 🎛️ Filtres par statut et priorité
- 📄 Pagination des résultats
- 🎯 Liste interactive des messages

#### **MessageDetails** (`src/components/admin/MessageDetails.tsx`)
- 👤 Affichage complet du message
- 🏷️ Statuts et priorités avec badges colorés
- ✏️ Modification du statut et de la priorité
- 💬 Ajout de réponse administrateur
- 🏷️ Gestion des tags
- 💾 Sauvegarde des modifications

## 🔌 Endpoints API utilisés

### **GET /admin/messages/**
Liste tous les messages avec pagination et filtres

**Paramètres :**
- `page` : Numéro de page (défaut: 1)
- `per_page` : Nombre de messages par page (défaut: 10)
- `status` : Filtre par statut (new, unread, read, replied, archived)
- `priority` : Filtre par priorité (low, medium, high, urgent)

**Exemple d'appel :**
```typescript
const response = await AdminService.getMessages({
  page: 1,
  per_page: 10,
  status: 'unread',
  priority: 'high'
});
```

### **GET /admin/messages/{id}**
Récupère un message spécifique (marque comme lu automatiquement)

**Exemple d'appel :**
```typescript
const message = await AdminService.getMessageById(messageId);
```

### **PUT /admin/messages/{id}**
Met à jour un message (statut, priorité, réponse admin, tags)

**Exemple d'appel :**
```typescript
await AdminService.updateMessage(messageId, {
  status: 'replied',
  priority: 'medium',
  admin_response: 'Votre demande a été traitée...',
  tags: ['support', 'résolu']
});
```

### **GET /admin/messages/stats/overview**
Récupère les statistiques complètes des messages

**Exemple d'appel :**
```typescript
const stats = await AdminService.getMessagesStats();
// Retourne: { total_messages, unread_messages, replied_messages, high_priority_messages }
```

### **GET /admin/messages/search/**
Recherche avancée avec filtres multiples

**Paramètres :**
- `query` : Terme de recherche (recherche dans nom, email, sujet, message)
- `email` : Filtre par email spécifique
- `status` : Filtre par statut
- `priority` : Filtre par priorité
- `page` : Numéro de page
- `per_page` : Nombre de résultats par page

**Exemple d'appel :**
```typescript
const results = await AdminService.searchMessages({
  query: 'support technique',
  status: 'unread',
  priority: 'high',
  page: 1,
  per_page: 10
});
```

## 🎨 Interface utilisateur

### **Tableau de bord Messages**

#### **Statistiques (4 cartes)** :
1. **Total** : Nombre total de messages reçus
2. **Non lus** : Messages à traiter (statut: new/unread)
3. **Répondus** : Messages traités (statut: replied)
4. **Priorité haute** : Messages urgents à traiter en priorité

#### **Barre de recherche et filtres** :
- 🔍 **Recherche globale** : Par email, nom, prénom, sujet, ou contenu du message
- 📋 **Filtre Statut** : Nouveau, Non lu, Lu, Répondu, Archivé
- ⚡ **Filtre Priorité** : Basse, Moyenne, Haute, Urgente
- 🔎 **Bouton Rechercher** : Lance la recherche avec les critères sélectionnés

#### **Liste des messages** :
Chaque message affiche :
- **Nom complet** : Prénom + Nom de l'expéditeur
- **Email** : Adresse email de contact
- **Badges** : Statut et priorité avec couleurs distinctives
- **Date** : Date de création du message
- **Sujet** : Titre du message
- **Aperçu** : Extrait du contenu (2 lignes max)
- **Tags** : Étiquettes associées au message

**Interaction** :
- Cliquer sur un message pour voir les détails complets

#### **Pagination** :
- Boutons Précédent/Suivant
- Affichage : "Page X sur Y"
- Navigation entre toutes les pages

### **Page de détails d'un message**

#### **Informations du message** :
- **En-tête** : Nom complet + badges (statut et priorité)
- **Email** : Adresse de contact de l'expéditeur
- **Date de création** : Date et heure complètes
- **Sujet** : Titre du message
- **Message complet** : Contenu intégral dans un bloc formaté
- **Tags actuels** : Liste des tags existants (si présents)

#### **Formulaire de mise à jour** :
1. **Statut** : Sélecteur dropdown
   - Nouveau
   - Non lu
   - Lu
   - Répondu
   - Archivé

2. **Priorité** : Sélecteur dropdown
   - Basse
   - Moyenne
   - Haute
   - Urgente

3. **Réponse administrateur** : Zone de texte multiligne
   - Permet de rédiger une réponse
   - Enregistrée avec le message

4. **Tags** : Champ texte
   - Séparés par des virgules
   - Exemples : "support, urgent, technique"

5. **Bouton Enregistrer** :
   - Sauvegarde toutes les modifications
   - Affiche un message de confirmation/erreur

#### **Bouton Retour** :
- Retour à la liste des messages
- Navigation en haut de la page

## 🎯 Workflow recommandé

### **Traitement d'un nouveau message** :

1. **Accéder à l'onglet Messages**
   - Aller sur `/admin/waitlist`
   - Cliquer sur l'onglet "Messages"

2. **Identifier les messages à traiter**
   - Vérifier les statistiques "Non lus"
   - Filtrer par statut "unread" ou "new"
   - Filtrer par priorité "urgent" ou "high" en priorité

3. **Ouvrir un message**
   - Cliquer sur le message dans la liste
   - Le message est automatiquement marqué comme "lu"

4. **Analyser et traiter**
   - Lire le contenu complet
   - Vérifier l'email et les coordonnées
   - Évaluer la priorité

5. **Mettre à jour le message**
   - Changer le statut selon le traitement
   - Ajuster la priorité si nécessaire
   - Rédiger une réponse admin (optionnel)
   - Ajouter des tags pertinents

6. **Enregistrer**
   - Cliquer sur "Enregistrer les modifications"
   - Vérifier le message de confirmation

7. **Retour à la liste**
   - Cliquer sur "Retour à la liste"
   - Passer au message suivant

## 🏷️ Système de statuts

| Statut | Badge | Signification |
|--------|-------|---------------|
| **Nouveau** | 🔵 Bleu | Message venant d'arriver |
| **Non lu** | 🟡 Jaune | Message en attente de lecture |
| **Lu** | ⚪ Gris | Message lu mais non traité |
| **Répondu** | 🟢 Vert | Message traité et répondu |
| **Archivé** | ⚫ Ardoise | Message archivé |

## ⚡ Système de priorités

| Priorité | Badge | Usage |
|----------|-------|-------|
| **Basse** | ⚪ Gris | Questions générales, informations |
| **Moyenne** | 🔵 Bleu | Demandes standard |
| **Haute** | 🟠 Orange | Problèmes nécessitant attention |
| **Urgente** | 🔴 Rouge | Problèmes critiques, bugs majeurs |

## 🔍 Exemples de recherche

### **Recherche simple** :
```
Recherche : "facturation"
→ Trouve tous les messages contenant "facturation"
```

### **Recherche avec filtres** :
```
Recherche : "bug"
Statut : "unread"
Priorité : "high"
→ Trouve les bugs non lus de haute priorité
```

### **Recherche par email** :
```
Recherche : "contact@example.com"
→ Trouve tous les messages de cet utilisateur
```

## 🏷️ Gestion des tags

### **Exemples de tags utiles** :
- `support` : Question de support
- `bug` : Signalement de bug
- `feature` : Demande de fonctionnalité
- `facturation` : Question de facturation
- `technique` : Problème technique
- `urgent` : Nécessite une réponse rapide
- `résolu` : Problème résolu
- `en-cours` : En cours de traitement

### **Ajout de tags** :
```
Tags : support, urgent, technique
→ Ajoute 3 tags au message
```

## 🔒 Sécurité

- ✅ **Authentification requise** : Seuls les admins authentifiés ont accès
- ✅ **Cookies HttpOnly** : Authentification sécurisée
- ✅ **Vérification des privilèges** : Contrôle à chaque requête
- ✅ **Lecture automatique** : Les messages sont marqués comme lus dès l'ouverture

## 📊 Statistiques disponibles

### **Vue d'ensemble** :
- **Total des messages** : Nombre total depuis le début
- **Messages non lus** : Messages nécessitant attention
- **Messages répondus** : Taux de traitement
- **Messages prioritaires** : Nombre de messages urgents

## 🎉 Félicitations !

Vous disposez maintenant d'un système complet de gestion des messages admin permettant de :
- ✅ Visualiser tous les messages reçus
- ✅ Filtrer et rechercher efficacement
- ✅ Prioriser les messages importants
- ✅ Répondre et suivre les messages
- ✅ Organiser avec des tags
- ✅ Suivre les statistiques globales
