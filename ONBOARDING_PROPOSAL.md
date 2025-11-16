# 🎯 Plan d'Onboarding pour Viraill - Proposition Détaillée

## 📋 Vue d'ensemble

Ce document propose un plan d'onboarding structuré pour guider les nouveaux utilisateurs dans la découverte et l'utilisation de la plateforme Viraill (analyse SEO/GEO et concurrentielle).

---

## 🎨 Objectifs de l'onboarding

1. **Accueillir** : Faire sentir les nouveaux utilisateurs bienvenus
2. **Éduquer** : Expliquer les fonctionnalités principales
3. **Guider** : Montrer comment réaliser la première action (créer une analyse)
4. **Engager** : Encourager l'exploration des fonctionnalités avancées
5. **Rassurer** : Informer sur les limites d'usage et les plans disponibles

---

## 🚀 Structure de l'onboarding (5 étapes)

### **Étape 1 : Bienvenue et Présentation** (Modal plein écran)
**Durée estimée** : 30-45 secondes

**Contenu** :
```
🎉 Bienvenue sur Viraill !

Viraill vous aide à analyser et optimiser votre positionnement géographique en ligne.

Avec Viraill, vous pouvez :
✓ Analyser votre site web (SEO/GEO)
✓ Comparer avec vos concurrents
✓ Obtenir des recommandations d'optimisation
✓ Suivre vos performances

Prêt à commencer ? 🚀
```

**Actions** :
- Bouton "Commencer" → Passage à l'étape 2
- Bouton "Passer" → Fermer l'onboarding (marquer comme complété)

**Design** :
- Fond dégradé avec logo Viraill
- Icônes pour chaque fonctionnalité
- Animation légère d'entrée

---

### **Étape 2 : Découverte du Tableau de bord** (Tooltip sur la page Index)
**Durée estimée** : 20-30 secondes

**Contenu** :
```
📍 Voici votre tableau de bord

C'est votre centre de contrôle. Vous y trouverez :
• Vos analyses récentes
• Vos statistiques de performance
• Des actions rapides

👉 Cliquez sur "Analyser un nouveau site" pour commencer
```

**Position** : Tooltip centré en haut de la page Index
**Cible** : La carte "Actions rapides" ou la section principale

**Actions** :
- Bouton "Suivant" → Étape 3
- Bouton "Passer" → Fermer l'onboarding

---

### **Étape 3 : Navigation dans la Sidebar** (Tooltip sur la sidebar)
**Durée estimée** : 30-40 secondes

**Contenu** :
```
🧭 Votre menu de navigation

Utilisez le menu latéral pour accéder à :

📊 Analyses GEO
   Analysez votre site web en profondeur

🏆 Analyse concurrentielle
   Comparez-vous à vos concurrents

⚙️ Sites pour optimisation
   Gérez vos sites à optimiser

💳 Plans & Tarifs
   Consultez vos limites d'usage
```

**Position** : Tooltip à droite de la sidebar (ou highlight de la sidebar)
**Cible** : La sidebar entière

**Actions** :
- Bouton "Suivant" → Étape 4
- Bouton "Précédent" → Retour à l'étape 2

**Note** : Sur mobile, adapter avec un modal explicatif

---

### **Étape 4 : Créer votre première analyse** (Tooltip sur le bouton)
**Durée estimée** : 45-60 secondes

**Contenu** :
```
🎯 Créer votre première analyse

Pour analyser un site :
1. Cliquez sur "Analyses GEO" dans le menu
2. Entrez l'URL de votre site
3. Lancez l'analyse
4. Consultez les résultats

💡 Astuce : Vous pouvez activer l'optimisation automatique pour obtenir des recommandations personnalisées
```

**Position** : Tooltip sur le bouton "Analyser un nouveau site" ou sur la page Analyses
**Cible** : Le bouton d'action ou le formulaire de création d'analyse

**Actions** :
- Bouton "Créer une analyse" → Redirige vers /analyses avec le formulaire pré-rempli (optionnel)
- Bouton "Plus tard" → Étape 5
- Bouton "Précédent" → Retour à l'étape 3

---

### **Étape 5 : Comprendre les limites et plans** (Tooltip/Modal informatif)
**Durée estimée** : 30-40 secondes

**Contenu** :
```
📊 Vos limites d'usage

Viraill fonctionne avec un système de quotas :
• Analyses GEO : X restantes
• Analyses concurrentielles : X restantes

💳 Besoin de plus ?
Consultez nos plans dans "Plans & Tarifs" pour augmenter vos limites.

✅ Vous êtes prêt ! Explorez la plateforme à votre rythme.
```

**Position** : Tooltip sur le composant UsageLimits ou modal informatif
**Cible** : La section des limites d'usage (si visible) ou un point d'information

**Actions** :
- Bouton "Découvrir les plans" → Redirige vers /pricing
- Bouton "Terminer" → Ferme l'onboarding et marque comme complété

---

## 🎯 Variante : Onboarding Progressif (Recommandé)

Au lieu d'un onboarding en une seule fois, proposer un **onboarding progressif** qui s'active contextuellement :

### **Phase 1 : Premier Login** (Modal de bienvenue)
- Message d'accueil simple
- Option "Découvrir les fonctionnalités" ou "Commencer directement"

### **Phase 2 : Première visite sur Index** (Tooltip discret)
- Expliquer le tableau de bord
- Montrer où créer une analyse

### **Phase 3 : Première visite sur Analyses** (Tooltip contextuel)
- Expliquer comment créer une analyse
- Guider vers le formulaire

### **Phase 4 : Après la première analyse** (Notification de succès)
- Féliciter l'utilisateur
- Suggérer de consulter les résultats
- Proposer de découvrir l'analyse concurrentielle

### **Phase 5 : Découverte des fonctionnalités avancées** (Tooltips contextuels)
- Lors de la première visite sur /competition
- Lors de la première visite sur /sites-optimization
- Lors de l'atteinte de 50% des limites d'usage

---

## 🛠️ Implémentation Technique (Recommandations)

### **Option 1 : Utiliser react-joyride** (Recommandé)
Bibliothèque spécialisée pour les tours guidés interactifs.

**Avantages** :
- ✅ Très simple à implémenter
- ✅ Gestion automatique des tooltips et highlights
- ✅ Support mobile
- ✅ Personnalisable

**Exemple d'utilisation** :
```typescript
import Joyride from 'react-joyride';

const steps = [
  {
    target: '.dashboard-card',
    content: 'Voici votre tableau de bord...',
  },
  {
    target: '.sidebar',
    content: 'Utilisez le menu pour naviguer...',
  },
];
```

### **Option 2 : Utiliser driver.js** (Alternative légère)
Bibliothèque moderne et légère pour les highlights.

**Avantages** :
- ✅ Très léger
- ✅ Pas de dépendances React
- ✅ Style moderne

### **Option 3 : Implémentation custom avec shadcn/ui**
Utiliser les composants existants (Dialog, Tooltip, Progress).

**Avantages** :
- ✅ Contrôle total
- ✅ Utilise les composants existants
- ✅ Pas de nouvelle dépendance

---

## 💾 Gestion de l'état d'onboarding

### **Stratégie de stockage**

1. **localStorage** (Recommandé pour commencer)
   ```typescript
   localStorage.setItem('onboarding_completed', 'true');
   localStorage.setItem('onboarding_step', '3');
   localStorage.setItem('onboarding_data', JSON.stringify({...}));
   ```

2. **API Backend** (Pour une expérience multi-appareils)
   - Endpoint : `GET /user/onboarding-status`
   - Endpoint : `POST /user/onboarding-complete`

### **Flags à suivre**

```typescript
interface OnboardingState {
  completed: boolean;
  currentStep: number;
  skipped: boolean;
  completedAt?: Date;
  stepsCompleted: string[]; // ['welcome', 'dashboard', 'analysis']
}
```

---

## 🎨 Design et UX

### **Principes de design**

1. **Non intrusif** : Ne pas bloquer l'utilisateur
2. **Option de skip** : Toujours permettre de passer
3. **Progressif** : Ne pas surcharger avec trop d'informations
4. **Visuel** : Utiliser des icônes et illustrations
5. **Responsive** : Adapter pour mobile

### **Composants UI à utiliser**

- `Dialog` pour les modals de bienvenue
- `Tooltip` pour les explications contextuelles
- `Progress` pour la barre de progression
- `Card` pour structurer le contenu
- `Button` pour les actions

### **Couleurs et style**

- Utiliser les couleurs de la charte graphique Viraill
- Bleu pour les actions principales
- Vert pour les succès
- Gris pour les informations neutres

---

## 📱 Adaptation mobile

### **Stratégie mobile**

1. **Simplifier** : Réduire le nombre d'étapes sur mobile
2. **Modal plein écran** : Pour les étapes importantes
3. **Tooltips adaptés** : Plus grands et centrés sur mobile
4. **Navigation tactile** : Boutons plus grands

### **Étapes mobiles recommandées**

1. Bienvenue (modal plein écran)
2. Créer une analyse (tooltip sur le bouton)
3. Consulter les résultats (tooltip après création)

---

## 🔄 Flux utilisateur recommandé

### **Nouvel utilisateur**

```
1. Inscription → Register.tsx
2. Attente d'approbation admin
3. Login → Login.tsx
4. Redirection vers Index.tsx
5. Détection nouveau utilisateur → Afficher onboarding
6. Étape 1 : Bienvenue
7. Étape 2 : Tableau de bord
8. Étape 3 : Navigation
9. Étape 4 : Créer analyse (optionnel)
10. Étape 5 : Limites d'usage
11. Marquer onboarding comme complété
```

### **Utilisateur existant**

```
1. Login → Login.tsx
2. Redirection vers Index.tsx
3. Vérification onboarding_completed
4. Si complété → Pas d'onboarding
5. Si incomplet → Reprendre où il s'est arrêté
```

---

## 📊 Métriques à suivre

### **KPIs d'onboarding**

1. **Taux de complétion** : % d'utilisateurs qui terminent l'onboarding
2. **Taux de skip** : % d'utilisateurs qui passent l'onboarding
3. **Temps moyen** : Temps moyen pour compléter l'onboarding
4. **Taux de première action** : % d'utilisateurs qui créent une analyse après l'onboarding
5. **Taux de rétention** : % d'utilisateurs qui reviennent après l'onboarding

### **Événements à tracker**

```typescript
// Événements à suivre
- onboarding_started
- onboarding_step_completed (step_id)
- onboarding_skipped
- onboarding_completed
- onboarding_step_skipped (step_id)
- first_analysis_created (après onboarding)
```

---

## 🎯 Contenu détaillé par étape

### **Étape 1 : Bienvenue**

**Titre** : "Bienvenue sur Viraill ! 🎉"

**Description** :
```
Viraill est votre assistant intelligent pour analyser et optimiser votre présence géographique en ligne.

Découvrez comment :
• Analyser votre site web en profondeur
• Comparer avec vos concurrents
• Obtenir des recommandations personnalisées
• Suivre vos performances

Commençons par un tour rapide de la plateforme !
```

**Actions** :
- [Commencer le tour] (Primary)
- [Passer] (Secondary)

---

### **Étape 2 : Tableau de bord**

**Titre** : "Votre tableau de bord 📊"

**Description** :
```
Votre tableau de bord est votre centre de contrôle. Ici, vous pouvez :

📈 Voir vos analyses récentes
📊 Consulter vos statistiques
🎯 Accéder aux actions rapides
📋 Suivre vos optimisations

👉 Commençons par créer votre première analyse !
```

**Cible** : La section principale du tableau de bord
**Actions** :
- [Suivant] (Primary)
- [Précédent] (Secondary)
- [Passer] (Tertiary)

---

### **Étape 3 : Navigation**

**Titre** : "Naviguer dans Viraill 🧭"

**Description** :
```
Utilisez le menu latéral pour accéder aux différentes fonctionnalités :

📊 Analyses GEO
   Analysez votre site web en profondeur avec des rapports détaillés

🏆 Analyse concurrentielle
   Comparez-vous à vos concurrents et identifiez vos forces et faiblesses

⚙️ Sites pour optimisation
   Gérez vos sites et suivez leurs optimisations

💳 Plans & Tarifs
   Consultez vos limites d'usage et gérez votre abonnement

👤 Profile
   Gérez vos paramètres et préférences
```

**Cible** : La sidebar
**Actions** :
- [Suivant] (Primary)
- [Précédent] (Secondary)

---

### **Étape 4 : Créer une analyse**

**Titre** : "Créer votre première analyse 🎯"

**Description** :
```
Pour analyser un site web, c'est très simple :

1️⃣ Cliquez sur "Analyses GEO" dans le menu
2️⃣ Entrez l'URL de votre site (ex: example.com)
3️⃣ Activez l'optimisation si vous le souhaitez
4️⃣ Lancez l'analyse
5️⃣ Consultez les résultats détaillés

💡 Astuce : L'optimisation automatique vous donne des recommandations personnalisées pour améliorer votre site.
```

**Cible** : Le bouton "Analyser un nouveau site" ou la page Analyses
**Actions** :
- [Créer une analyse] (Primary) → Redirige vers /analyses
- [Plus tard] (Secondary)
- [Précédent] (Tertiary)

---

### **Étape 5 : Limites d'usage**

**Titre** : "Vos limites d'usage 📊"

**Description** :
```
Viraill fonctionne avec un système de quotas pour chaque type d'analyse :

✅ Analyses GEO : X analyses restantes
✅ Analyses concurrentielles : X analyses restantes

💳 Besoin de plus d'analyses ?
Consultez nos plans dans "Plans & Tarifs" pour augmenter vos limites et accéder à des fonctionnalités avancées.

✨ Vous êtes maintenant prêt à utiliser Viraill ! Explorez la plateforme à votre rythme.
```

**Cible** : Le composant UsageLimits ou un point d'information
**Actions** :
- [Découvrir les plans] (Primary) → Redirige vers /pricing
- [Terminer] (Secondary) → Ferme l'onboarding

---

## 🚀 Prochaines étapes d'implémentation

### **Phase 1 : MVP (Minimum Viable Product)**
1. ✅ Créer le composant Onboarding
2. ✅ Intégrer la détection de nouvel utilisateur
3. ✅ Implémenter l'étape 1 (Bienvenue)
4. ✅ Implémenter l'étape 2 (Tableau de bord)
5. ✅ Gérer le stockage dans localStorage

### **Phase 2 : Onboarding complet**
1. ✅ Implémenter toutes les étapes
2. ✅ Ajouter la barre de progression
3. ✅ Adapter pour mobile
4. ✅ Ajouter les animations

### **Phase 3 : Améliorations**
1. ✅ Onboarding progressif contextuel
2. ✅ Intégration avec l'API backend
3. ✅ Analytics et métriques
4. ✅ Personnalisation selon le plan utilisateur

---

## 📝 Notes importantes

### **Points d'attention**

1. **Ne pas bloquer** : Toujours permettre de fermer/sauter l'onboarding
2. **Performance** : Ne pas ralentir le chargement initial
3. **Accessibilité** : S'assurer que l'onboarding est accessible (ARIA, clavier)
4. **Traduction** : Prévoir la traduction si nécessaire
5. **Tests** : Tester sur différents navigateurs et appareils

### **Cas limites**

1. **Utilisateur qui skip** : Ne pas réafficher l'onboarding
2. **Utilisateur qui revient** : Proposer de reprendre l'onboarding
3. **Mobile** : Adapter le contenu et la navigation
4. **Erreurs** : Gérer les erreurs gracieusement

---

## 🎉 Conclusion

Ce plan d'onboarding offre une expérience progressive et non intrusive pour guider les nouveaux utilisateurs dans la découverte de Viraill. Il peut être implémenté progressivement, en commençant par un MVP simple, puis en ajoutant des fonctionnalités avancées.

L'objectif est de **réduire la friction** et **augmenter l'engagement** en aidant les utilisateurs à comprendre rapidement la valeur de la plateforme.

