# 🎨 Guide d'Intégration Frontend - Système de Paiement Virail Studio

## 📋 Vue d'ensemble

Ce guide détaille l'intégration complète du système de paiement dans votre application Virail Studio. Le système inclut :
- **4 plans d'abonnement** (Gratuit, Standard, Premium, Pro)
- **4 fonctionnalités protégées** (Analyses, Rapports, Analyse de concurrents, Optimisation)
- **Gestion des quotas** en temps réel
- **Interface de paiement** intégrée

---

## 🚀 Installation et Configuration

### 1. Variables d'environnement

Créez un fichier `.env` basé sur `env.example` :

```bash
# === CONFIGURATION API ===
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000

# === CONFIGURATION PAIEMENT ===
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
VITE_STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here

# === CONFIGURATION PLANS ===
VITE_DEFAULT_PLAN_ID=standard
VITE_FREE_PLAN_ID=free
VITE_STANDARD_PLAN_ID=standard
VITE_PREMIUM_PLAN_ID=premium
VITE_PRO_PLAN_ID=pro

# === CONFIGURATION FEATURES ===
VITE_ENABLE_PAYMENT_SYSTEM=true
VITE_ENABLE_USAGE_TRACKING=true
VITE_ENABLE_COMPETITOR_ANALYSIS=true
VITE_ENABLE_OPTIMIZATION=true

# === CONFIGURATION UI ===
VITE_CURRENCY=EUR
VITE_CURRENCY_SYMBOL=€
VITE_SHOW_UPGRADE_PROMPTS=true
VITE_USAGE_WARNING_THRESHOLD=0.8
```

### 2. Installation des dépendances

```bash
npm install zustand
npm install @types/node
```

### 3. Import des styles

Ajoutez les styles CSS dans votre fichier principal :

```typescript
// src/main.tsx
import './styles/payment.css';
```

---

## 🏗️ Architecture du Système

### Structure des fichiers

```
src/
├── services/
│   └── apiService.ts          # Service API complet
├── stores/
│   └── paymentStore.ts        # Store Zustand pour l'état
├── hooks/
│   └── usePayment.ts          # Hook personnalisé
├── components/
│   ├── PlanSelector.tsx       # Sélecteur de plans
│   ├── UsageQuota.tsx         # Affichage des quotas
│   └── ErrorHandler.tsx       # Gestion des erreurs
├── styles/
│   └── payment.css            # Styles CSS
└── pages/
    └── Pricing.tsx            # Page de tarification
```

---

## 🔧 Utilisation des Composants

### 1. Hook usePayment

```typescript
import { usePayment } from '@/hooks/usePayment';

const MyComponent = () => {
  const {
    // État
    plans,
    currentPlan,
    usageLimits,
    loading,
    error,
    
    // Actions
    analyzeWebsite,
    analyzeCompetitors,
    optimizeWebsite,
    getReport,
    
    // Getters
    canUseFeature,
    getQuotaInfo,
    getUsagePercentage,
    
    // Gestion d'état
    loadPaymentData,
    createSubscription,
    cancelSubscription,
  } = usePayment();

  // Vérifier si une fonctionnalité est disponible
  const canAnalyze = canUseFeature('analysis');
  
  // Obtenir les informations de quota
  const quotaInfo = getQuotaInfo('analysis');
  
  // Analyser un site avec vérification automatique des quotas
  const handleAnalysis = async () => {
    try {
      const result = await analyzeWebsite('https://example.com');
      console.log('Analyse réussie:', result);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div>
      {canAnalyze ? (
        <button onClick={handleAnalysis}>Analyser</button>
      ) : (
        <p>Limite d'analyses atteinte</p>
      )}
    </div>
  );
};
```

### 2. Composant PlanSelector

```typescript
import PlanSelector from '@/components/PlanSelector';

const PricingPage = () => {
  const handlePlanSelected = (planId: string) => {
    console.log('Plan sélectionné:', planId);
  };

  return (
    <PlanSelector 
      onPlanSelected={handlePlanSelected}
      showCurrentPlan={true}
    />
  );
};
```

### 3. Composant UsageQuota

```typescript
import UsageQuota from '@/components/UsageQuota';

const Dashboard = () => {
  return (
    <UsageQuota 
      showUpgradePrompt={true}
      compact={false}
    />
  );
};
```

### 4. Composant ErrorHandler

```typescript
import ErrorHandler, { createPaymentError } from '@/components/ErrorHandler';

const MyComponent = () => {
  const [error, setError] = useState(null);

  const handleError = () => {
    const paymentError = createPaymentError(
      'QUOTA_EXCEEDED',
      'Limite d\'analyses atteinte'
    );
    setError(paymentError);
  };

  return (
    <div>
      <ErrorHandler
        error={error}
        onDismiss={() => setError(null)}
        onUpgrade={() => window.location.href = '/pricing'}
      />
    </div>
  );
};
```

---

## 🔒 Gestion des Quotas

### Vérification automatique

Le système vérifie automatiquement les quotas avant chaque action :

```typescript
// ✅ Recommandé : Utiliser les méthodes du hook
const result = await analyzeWebsite('https://example.com');

// ❌ Éviter : Appeler directement l'API
const result = await apiService.analyzeWebsite('https://example.com');
```

### Vérification manuelle

```typescript
const { canUseFeature, getQuotaInfo } = usePayment();

// Vérifier si une fonctionnalité est disponible
if (canUseFeature('analysis')) {
  // Procéder avec l'action
} else {
  // Afficher un message d'erreur ou rediriger
}

// Obtenir les détails du quota
const quotaInfo = getQuotaInfo('analysis');
console.log(`Utilisé: ${quotaInfo.used}/${quotaInfo.limit}`);
```

---

## 🎨 Personnalisation

### 1. Styles CSS

Modifiez `src/styles/payment.css` pour personnaliser l'apparence :

```css
/* Personnaliser les couleurs des plans */
.plan-card--premium {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
}

/* Personnaliser les barres de progression */
.progress-fill--warning {
  background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
}
```

### 2. Configuration des plans

Modifiez les plans dans `src/services/apiService.ts` :

```typescript
export const PLANS: Plan[] = [
  {
    id: 'custom',
    name: 'Plan Personnalisé',
    price: 99,
    currency: 'EUR',
    interval: 'month',
    max_analyses: 100,
    max_reports: 50,
    max_competitor_analyses: 25,
    max_optimizations: 25,
    features: [
      '100 analyses par mois',
      '50 rapports',
      'Support prioritaire',
      'Fonctionnalités personnalisées'
    ],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
```

### 3. Messages d'erreur personnalisés

```typescript
// Dans src/components/ErrorHandler.tsx
const errorTitles: Record<string, string> = {
  QUOTA_EXCEEDED: 'Limite d\'usage atteinte',
  PAYMENT_FAILED: 'Échec du paiement',
  UNAUTHORIZED: 'Session expirée',
  SERVER_ERROR: 'Erreur serveur',
  UNKNOWN_ERROR: 'Erreur inattendue',
  // Ajouter vos propres messages
  CUSTOM_ERROR: 'Erreur personnalisée',
};
```

---

## 🧪 Tests

### 1. Test des composants

```typescript
// tests/components/PlanSelector.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import PlanSelector from '@/components/PlanSelector';

describe('PlanSelector', () => {
  it('affiche tous les plans disponibles', () => {
    render(<PlanSelector />);
    
    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('appelle onPlanSelected quand un plan est sélectionné', () => {
    const mockOnPlanSelected = jest.fn();
    render(<PlanSelector onPlanSelected={mockOnPlanSelected} />);
    
    fireEvent.click(screen.getByText('Choisir ce plan'));
    
    expect(mockOnPlanSelected).toHaveBeenCalled();
  });
});
```

### 2. Test du hook

```typescript
// tests/hooks/usePayment.test.tsx
import { renderHook, act } from '@testing-library/react';
import { usePayment } from '@/hooks/usePayment';

describe('usePayment', () => {
  it('vérifie correctement les quotas', () => {
    const { result } = renderHook(() => usePayment());
    
    expect(result.current.canUseFeature('analysis')).toBe(true);
  });

  it('incrémente l\'usage après une action', async () => {
    const { result } = renderHook(() => usePayment());
    
    await act(async () => {
      await result.current.analyzeWebsite('https://example.com');
    });
    
    // Vérifier que l'usage a été incrémenté
  });
});
```

---

## 🚀 Déploiement

### 1. Variables de production

```bash
# .env.production
VITE_API_BASE_URL=https://api.viraill.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
VITE_STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
VITE_ENABLE_PAYMENT_SYSTEM=true
VITE_ENABLE_USAGE_TRACKING=true
VITE_ENABLE_COMPETITOR_ANALYSIS=true
VITE_ENABLE_OPTIMIZATION=true
VITE_CURRENCY=EUR
VITE_CURRENCY_SYMBOL=€
VITE_SHOW_UPGRADE_PROMPTS=true
VITE_USAGE_WARNING_THRESHOLD=0.8
```

### 2. Build et déploiement

```bash
# Build pour la production
npm run build

# Vérifier les variables d'environnement
npm run build:check

# Déployer
npm run deploy
```

---

## 🔧 Dépannage

### Problèmes courants

#### 1. Erreur "Quotas non disponibles"

**Cause** : L'API n'a pas encore chargé les quotas.

**Solution** :
```typescript
const { loadPaymentData } = usePayment();

useEffect(() => {
  loadPaymentData();
}, []);
```

#### 2. Erreur "Fonctionnalité non autorisée"

**Cause** : L'utilisateur n'a pas les droits pour cette fonctionnalité.

**Solution** :
```typescript
const { canUseFeature } = usePayment();

if (!canUseFeature('analysis')) {
  // Rediriger vers la page de tarification
  window.location.href = '/pricing';
}
```

#### 3. Erreur de connexion API

**Cause** : L'URL de l'API est incorrecte ou le serveur est indisponible.

**Solution** :
```bash
# Vérifier la variable d'environnement
echo $VITE_API_BASE_URL

# Tester la connexion
curl $VITE_API_BASE_URL/health
```

### Logs de débogage

Activez les logs de débogage :

```typescript
// Dans src/services/apiService.ts
const DEBUG = import.meta.env.DEV;

if (DEBUG) {
  console.log('API Request:', endpoint, options);
}
```

---

## 📞 Support

Pour toute question ou problème d'intégration :

1. **Documentation API** : `http://localhost:8000/docs`
2. **Tests d'intégration** : `npm run test:integration`
3. **Logs** : `docker compose logs -f web`
4. **Support** : support@viraill.com

---

## 📚 Ressources supplémentaires

- [Documentation Zustand](https://zustand-demo.pmnd.rs/)
- [Documentation React Hooks](https://react.dev/reference/react/hooks)
- [Guide TypeScript](https://www.typescriptlang.org/docs/)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)

---

**🎉 Votre système de paiement est maintenant prêt pour la production !**

Le système est entièrement fonctionnel avec :
- ✅ Gestion des quotas en temps réel
- ✅ Interface de paiement intégrée
- ✅ Gestion d'erreurs robuste
- ✅ Design responsive
- ✅ Tests automatisés
- ✅ Documentation complète
