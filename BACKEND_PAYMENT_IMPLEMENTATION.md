# 🚀 Instructions d'Implémentation Backend - Système de Paiement

## 📋 Vue d'ensemble

Ce document détaille l'implémentation côté backend du système de paiement avec 3 plans (Standard, Premium, Pro) pour l'application Virail Studio.

## 🗄️ Structure de Base de Données

### Tables à créer

#### 1. Table `plans`
```sql
CREATE TABLE plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    interval ENUM('month', 'year') DEFAULT 'month',
    max_analyses INT DEFAULT -1 COMMENT '-1 = illimité',
    max_reports INT DEFAULT -1 COMMENT '-1 = illimité',
    features JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insérer les plans par défaut
INSERT INTO plans (id, name, price, currency, interval, max_analyses, max_reports, features) VALUES
('free', 'Gratuit', 0.00, 'EUR', 'month', 3, 1, '["3 analyses LLMO par mois", "1 rapport concurrentiel", "Support communauté", "Historique 7 jours"]'),
('standard', 'Standard', 29.00, 'EUR', 'month', 10, 5, '["10 analyses LLMO par mois", "5 rapports concurrentiels", "Support email", "Optimisations de base", "Historique 30 jours"]'),
('premium', 'Premium', 59.00, 'EUR', 'month', 50, 20, '["50 analyses LLMO par mois", "20 rapports concurrentiels", "Support prioritaire", "Optimisations avancées", "Historique illimité", "Exports PDF/Excel", "API access"]'),
('pro', 'Pro', 129.00, 'EUR', 'month', -1, -1, '["Analyses LLMO illimitées", "Rapports concurrentiels illimités", "Support téléphonique 24/7", "IA personnalisée", "Intégrations avancées", "Tableau de bord custom", "Formation dédiée", "Manager dédié"]');
```

#### 2. Table `subscriptions`
```sql
CREATE TABLE subscriptions (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    plan_id VARCHAR(50) NOT NULL,
    status ENUM('active', 'inactive', 'cancelled', 'pending') DEFAULT 'pending',
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    auto_renew BOOLEAN DEFAULT TRUE,
    stripe_subscription_id VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id),
    INDEX idx_user_status (user_id, status),
    INDEX idx_status_end_date (status, end_date)
);
```

#### 3. Table `payments`
```sql
CREATE TABLE payments (
    id VARCHAR(50) PRIMARY KEY,
    subscription_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    stripe_payment_id VARCHAR(100) NULL,
    payment_method_type ENUM('card', 'paypal', 'bank_transfer') DEFAULT 'card',
    payment_method_details JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
    INDEX idx_subscription_status (subscription_id, status),
    INDEX idx_payment_date (payment_date)
);
```

#### 4. Table `usage_tracking`
```sql
CREATE TABLE usage_tracking (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    feature_type ENUM('analysis', 'report') NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    count_used INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_feature_period (user_id, feature_type, period_start),
    INDEX idx_user_period (user_id, period_start, period_end)
);
```

## 🔧 API Endpoints à Implémenter

### 1. Plans et Tarification

#### GET `/api/v1/plans`
```javascript
// Récupérer tous les plans disponibles
{
  "plans": [
    {
      "id": "standard",
      "name": "Standard",
      "price": 29.00,
      "currency": "EUR",
      "interval": "month",
      "features": [...],
      "maxAnalyses": 10,
      "maxReports": 5,
      "popular": false
    },
    // ...autres plans
  ]
}
```

#### GET `/api/v1/plans/{planId}`
```javascript
// Récupérer un plan spécifique
{
  "plan": {
    "id": "premium",
    "name": "Premium",
    // ...détails du plan
  }
}
```

### 2. Abonnements

#### GET `/api/v1/subscriptions/current`
```javascript
// Récupérer l'abonnement actuel de l'utilisateur
{
  "subscription": {
    "id": "sub_123",
    "planId": "premium",
    "status": "active",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-02-01T00:00:00Z",
    "autoRenew": true
  },
  "usage": {
    "analysesUsed": 15,
    "reportsUsed": 3,
    "periodStart": "2024-01-01",
    "periodEnd": "2024-02-01"
  }
}
```

#### POST `/api/v1/subscriptions`
```javascript
// Créer un nouvel abonnement
// Body:
{
  "planId": "premium",
  "paymentMethod": {
    "type": "card",
    "stripeToken": "tok_123...",
    "saveCard": true
  }
}

// Response:
{
  "subscription": {
    "id": "sub_456",
    "status": "active",
    // ...détails
  },
  "payment": {
    "id": "pay_789",
    "status": "completed",
    "amount": 59.00
  }
}
```

#### PUT `/api/v1/subscriptions/{subscriptionId}/plan`
```javascript
// Changer de plan
// Body:
{
  "newPlanId": "pro"
}

// Response:
{
  "subscription": { /* nouveau plan */ },
  "prorationAmount": 35.00,
  "effectiveDate": "2024-01-15T00:00:00Z"
}
```

#### POST `/api/v1/subscriptions/{subscriptionId}/cancel`
```javascript
// Annuler un abonnement
// Body:
{
  "cancelAtPeriodEnd": true,
  "reason": "user_requested"
}

// Response:
{
  "subscription": {
    "status": "cancelled",
    "cancelledAt": "2024-01-15T10:30:00Z",
    "endsAt": "2024-02-01T00:00:00Z"
  }
}
```

### 3. Paiements

#### GET `/api/v1/payments/history`
```javascript
// Historique des paiements
{
  "payments": [
    {
      "id": "pay_123",
      "amount": 59.00,
      "currency": "EUR",
      "status": "completed",
      "paymentDate": "2024-01-01T00:00:00Z",
      "description": "Abonnement Premium - Janvier 2024"
    }
    // ...autres paiements
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

### 4. Limites d'Usage

#### GET `/api/v1/usage/limits`
```javascript
// Vérifier les limites d'usage
{
  "canUseAnalysis": {
    "allowed": true,
    "used": 15,
    "limit": 50,
    "remaining": 35
  },
  "canUseReport": {
    "allowed": false,
    "used": 20,
    "limit": 20,
    "remaining": 0,
    "reason": "Limite de rapports atteinte pour ce mois"
  }
}
```

#### POST `/api/v1/usage/increment`
```javascript
// Incrémenter l'usage (appelé après chaque action)
// Body:
{
  "featureType": "analysis" // ou "report"
}

// Response:
{
  "newUsage": {
    "analysesUsed": 16,
    "reportsUsed": 3
  }
}
```

## 💳 Intégration Stripe

### Configuration Stripe
```javascript
// Variables d'environnement
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Webhook Stripe
```javascript
// POST `/webhooks/stripe`
// Gérer les événements Stripe
const webhookHandlers = {
  'customer.subscription.created': handleSubscriptionCreated,
  'customer.subscription.updated': handleSubscriptionUpdated,
  'customer.subscription.deleted': handleSubscriptionDeleted,
  'invoice.payment_succeeded': handlePaymentSucceeded,
  'invoice.payment_failed': handlePaymentFailed,
};
```

## 🔒 Middleware d'Authentification et Limites

### Middleware de Vérification des Limites
```javascript
// middleware/checkUsageLimits.js
const checkUsageLimits = (featureType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const canUse = await UsageService.canUseFeature(userId, featureType);
      
      if (!canUse.allowed) {
        return res.status(403).json({
          error: 'USAGE_LIMIT_EXCEEDED',
          message: canUse.reason,
          upgradeRequired: true
        });
      }
      
      // Stocker dans req pour usage ultérieur
      req.featureUsage = { type: featureType, canUse };
      next();
    } catch (error) {
      res.status(500).json({ error: 'Failed to check usage limits' });
    }
  };
};

// Utilisation dans les routes
app.post('/api/v1/analyze', 
  authenticateUser,
  checkUsageLimits('analysis'),
  async (req, res) => {
    // Logique d'analyse...
    
    // Incrémenter l'usage après succès
    await UsageService.incrementUsage(req.user.id, 'analysis');
    
    res.json({ result });
  }
);
```

## 📊 Services Backend

### 1. PlanService
```javascript
class PlanService {
  static async getPlans() {
    return await Plan.findAll({ where: { is_active: true } });
  }
  
  static async getPlanById(planId) {
    return await Plan.findByPk(planId);
  }
}
```

### 2. SubscriptionService
```javascript
class SubscriptionService {
  static async createSubscription(userId, planId, paymentMethod) {
    const plan = await PlanService.getPlanById(planId);
    
    // Créer l'abonnement Stripe
    const stripeSubscription = await stripe.subscriptions.create({
      customer: user.stripeCustomerId,
      items: [{ price: plan.stripePriceId }],
      default_payment_method: paymentMethod.id,
    });
    
    // Sauvegarder en base
    const subscription = await Subscription.create({
      id: `sub_${Date.now()}`,
      user_id: userId,
      plan_id: planId,
      status: stripeSubscription.status,
      start_date: new Date(stripeSubscription.current_period_start * 1000),
      end_date: new Date(stripeSubscription.current_period_end * 1000),
      stripe_subscription_id: stripeSubscription.id,
    });
    
    return subscription;
  }
  
  static async getCurrentSubscription(userId) {
    return await Subscription.findOne({
      where: { 
        user_id: userId, 
        status: ['active', 'cancelled'] 
      },
      include: [{ model: Plan }],
      order: [['created_at', 'DESC']]
    });
  }
}
```

### 3. UsageService
```javascript
class UsageService {
  static async canUseFeature(userId, featureType) {
    const subscription = await SubscriptionService.getCurrentSubscription(userId);
    
    if (!subscription || subscription.status !== 'active') {
      return { allowed: false, reason: 'Aucun abonnement actif' };
    }
    
    const plan = subscription.Plan;
    const currentUsage = await this.getCurrentUsage(userId, featureType);
    
    const limit = featureType === 'analysis' ? plan.max_analyses : plan.max_reports;
    
    if (limit === -1) {
      return { allowed: true }; // Illimité
    }
    
    if (currentUsage >= limit) {
      return { 
        allowed: false, 
        reason: `Limite de ${featureType === 'analysis' ? 'analyses' : 'rapports'} atteinte pour ce mois` 
      };
    }
    
    return { allowed: true, used: currentUsage, limit, remaining: limit - currentUsage };
  }
  
  static async incrementUsage(userId, featureType) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    await UsageTracking.upsert({
      user_id: userId,
      feature_type: featureType,
      period_start: periodStart,
      period_end: periodEnd,
      count_used: sequelize.literal('count_used + 1')
    });
  }
  
  static async getCurrentUsage(userId, featureType) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const usage = await UsageTracking.findOne({
      where: {
        user_id: userId,
        feature_type: featureType,
        period_start: periodStart
      }
    });
    
    return usage ? usage.count_used : 0;
  }
}
```

## 🔄 Tâches Cron

### Reset mensuel des usages
```javascript
// jobs/resetMonthlyUsage.js
const cron = require('node-cron');

// Exécuter le 1er de chaque mois à 00:00
cron.schedule('0 0 1 * *', async () => {
  console.log('🔄 Reset mensuel des usages...');
  
  // Les nouvelles entrées se créeront automatiquement
  // Pas besoin de reset explicite grâce à la logique par période
  
  console.log('✅ Reset mensuel terminé');
});
```

### Renouvellement des abonnements
```javascript
// jobs/renewSubscriptions.js
cron.schedule('0 2 * * *', async () => {
  console.log('🔄 Vérification des renouvellements...');
  
  const expiredSubscriptions = await Subscription.findAll({
    where: {
      status: 'active',
      end_date: {
        [Op.lte]: new Date()
      },
      auto_renew: true
    }
  });
  
  for (const subscription of expiredSubscriptions) {
    await SubscriptionService.renew(subscription.id);
  }
});
```

## 🧪 Tests d'Intégration

### Test des Limites
```javascript
// tests/usageLimits.test.js
describe('Usage Limits', () => {
  test('should block analysis when limit reached', async () => {
    // Créer un utilisateur avec plan Standard (10 analyses)
    const user = await createTestUser('standard');
    
    // Utiliser 10 analyses
    for (let i = 0; i < 10; i++) {
      await UsageService.incrementUsage(user.id, 'analysis');
    }
    
    // La 11ème devrait être bloquée
    const canUse = await UsageService.canUseFeature(user.id, 'analysis');
    expect(canUse.allowed).toBe(false);
  });
});
```

## 🚀 Déploiement

### Variables d'environnement de production
```bash
# .env.production
DATABASE_URL=postgresql://user:pass@host:5432/virail_prod
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
REDIS_URL=redis://...
NODE_ENV=production
```

### Migration de production
```bash
# Migrations à exécuter
npm run migrate:production
npm run seed:plans
```

## 📝 Documentation API

Générer la documentation Swagger/OpenAPI pour tous les endpoints avec des exemples de requêtes/réponses.

---

Cette implémentation fournit un système de paiement robuste et scalable avec gestion des limites, intégration Stripe, et toutes les fonctionnalités nécessaires pour monétiser votre application Virail Studio.
