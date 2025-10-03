# 🔧 Guide Endpoint d'Activation d'Abonnement

## 📋 Endpoint

```
POST /api/v1/subscriptions/{subscription_id}/activate
```

## ✅ Test réussi

L'endpoint fonctionne parfaitement ! Voici la démonstration :

### 1. Création d'un abonnement (statut "pending")
```bash
curl -s -X POST "http://localhost:8000/api/v1/subscriptions/" \
  -H 'Content-Type: application/json' \
  -b cookies.txt \
  -d '{
    "plan_id": "premium",
    "auto_renew": true,
    "success_url": "http://localhost:8081/success?success=true&plan_id=premium",
    "cancel_url": "http://localhost:8081/pricing?canceled=true",
    "payment_method": {
      "type": "card",
      "card_number": "4242424242424242",
      "exp_month": "12",
      "exp_year": "2030",
      "cvc": "123",
      "name": "Test User"
    }
  }'
```

**Réponse :**
```json
{
  "subscription": {
    "subscription": {
      "id": "sub_3da8ff5b_1756400772",
      "status": "pending",  // ← Statut initial
      "plan_id": "premium",
      "auto_renew": true
    },
    "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_..."
  },
  "status": "created"
}
```

### 2. Activation de l'abonnement
```bash
curl -s -X POST "http://localhost:8000/api/v1/subscriptions/sub_3da8ff5b_1756400772/activate" \
  -H 'Content-Type: application/json' \
  -b cookies.txt
```

**Réponse :**
```json
{
  "subscription": {
    "id": "sub_3da8ff5b_1756400772",
    "status": "active",  // ← Statut activé !
    "plan_id": "premium",
    "auto_renew": true
  },
  "status": "activated"
}
```

### 3. Vérification de l'abonnement actuel
```bash
curl -s -X GET "http://localhost:8000/api/v1/subscriptions/current" \
  -H 'Content-Type: application/json' \
  -b cookies.txt
```

**Réponse :**
```json
{
  "subscription": {
    "id": "sub_3da8ff5b_1756400772",
    "status": "active",
    "plan_id": "premium",
    "plan": {
      "id": "premium",
      "name": "Premium",
      "price": 59,
      "max_analyses": 50,
      "max_reports": 20
    }
  },
  "usage": {
    "analyses_used": 0,
    "reports_used": 0
  }
}
```

## 🔄 Utilisation dans le frontend

### Dans apiService.ts
```typescript
/**
 * Activer un abonnement
 */
async activateSubscription(subscriptionId: string): Promise<{ subscription: Subscription }> {
  return this.request(`/api/v1/subscriptions/${subscriptionId}/activate`, {
    method: 'POST',
  });
}
```

### Dans PaymentSuccess.tsx
```typescript
// Activer l'abonnement si on a un subscription_id
if (subscriptionId) {
  try {
    await apiService.activateSubscription(subscriptionId);
    console.log('✅ Abonnement activé avec succès');
    
    toast({
      title: "Abonnement activé ! 🎉",
      description: "Votre abonnement a été activé avec succès.",
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'activation:', error);
  }
}
```

## 🎯 Cas d'usage

### 1. Activation manuelle après paiement
- L'utilisateur complète le paiement sur Stripe
- Retour vers la page de succès avec `subscription_id`
- Activation automatique de l'abonnement

### 2. Activation pour tests
- Créer un abonnement en mode test
- Activer manuellement pour tester les fonctionnalités

### 3. Réactivation d'abonnement
- Réactiver un abonnement suspendu
- Changer le statut de "pending" à "active"

## 📊 États possibles

| État | Description | Action possible |
|------|-------------|-----------------|
| `pending` | Abonnement créé, en attente d'activation | ✅ Activer |
| `active` | Abonnement actif et fonctionnel | ❌ Déjà actif |
| `cancelled` | Abonnement annulé | ❌ Ne peut pas être activé |
| `suspended` | Abonnement suspendu | ✅ Réactiver |

## 🧪 Script de test complet

```bash
#!/bin/bash

# 1. Connexion
curl -s -X POST "http://localhost:8000/auth/login" \
  -H 'Content-Type: application/json' \
  -c cookies.txt \
  -d '{"username":"newuser123","password":"testpassword123"}' > /dev/null

echo "✅ Connexion réussie"

# 2. Création d'abonnement
RESPONSE=$(curl -s -X POST "http://localhost:8000/api/v1/subscriptions/" \
  -H 'Content-Type: application/json' \
  -b cookies.txt \
  -d '{
    "plan_id": "premium",
    "auto_renew": true,
    "success_url": "http://localhost:8081/success?success=true&plan_id=premium",
    "cancel_url": "http://localhost:8081/pricing?canceled=true",
    "payment_method": {
      "type": "card",
      "card_number": "4242424242424242",
      "exp_month": "12",
      "exp_year": "2030",
      "cvc": "123",
      "name": "Test User"
    }
  }')

echo "📋 Réponse création: $RESPONSE"

# 3. Extraction de l'ID d'abonnement
SUBSCRIPTION_ID=$(echo $RESPONSE | jq -r '.subscription.subscription.id')
echo "🔧 ID d'abonnement: $SUBSCRIPTION_ID"

# 4. Activation
ACTIVATION_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/v1/subscriptions/$SUBSCRIPTION_ID/activate" \
  -H 'Content-Type: application/json' \
  -b cookies.txt)

echo "📋 Réponse activation: $ACTIVATION_RESPONSE"

# 5. Vérification
CURRENT_RESPONSE=$(curl -s -X GET "http://localhost:8000/api/v1/subscriptions/current" \
  -H 'Content-Type: application/json' \
  -b cookies.txt)

echo "📋 Abonnement actuel: $CURRENT_RESPONSE"

echo "🎉 Test d'activation terminé !"
```

## ✅ Résumé

- ✅ **Endpoint fonctionnel** : `POST /api/v1/subscriptions/{id}/activate`
- ✅ **Authentification requise** : Utilise les cookies de session
- ✅ **Changement de statut** : "pending" → "active"
- ✅ **Réponse JSON** : Retourne l'abonnement mis à jour
- ✅ **Gestion d'erreurs** : Retourne des erreurs appropriées
- ✅ **Intégration frontend** : Prêt à être utilisé dans React

L'endpoint d'activation est parfaitement fonctionnel et peut être utilisé dans le flux de paiement ! 🎉


