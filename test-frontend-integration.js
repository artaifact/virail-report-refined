/**
 * Script de test pour l'intégration frontend avec le backend Virail
 * Teste la connexion, l'abonnement et les quotas
 */

const API_BASE_URL = 'http://localhost:8000';

// Configuration de test
const TEST_USER = {
  username: 'testuser2',
  password: 'testpassword123',
  email: 'testuser2@example.com'
};

const TEST_PLAN = 'pro';

// Fonction utilitaire pour les requêtes
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Erreur inconnue' }));
    throw new Error(errorData.detail?.message || errorData.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// Test 1: Connexion
async function testLogin() {
  console.log('🔐 Test de connexion...');
  
  try {
    const response = await makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: TEST_USER.username,
        password: TEST_USER.password
      })
    });

    console.log('✅ Connexion réussie:', response);
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    return false;
  }
}

// Test 2: Récupération des plans
async function testGetPlans() {
  console.log('\n📋 Test de récupération des plans...');
  
  try {
    const response = await makeRequest('/api/v1/plans/');
    console.log('✅ Plans récupérés:', response);
    
    const proPlan = response.plans.find(plan => plan.id === 'pro');
    if (proPlan) {
      console.log('✅ Plan Pro trouvé:', proPlan);
    } else {
      console.log('⚠️ Plan Pro non trouvé');
    }
    
    return response.plans;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des plans:', error.message);
    return [];
  }
}

// Test 3: Récupération de l'abonnement actuel
async function testGetCurrentSubscription() {
  console.log('\n💳 Test de récupération de l\'abonnement actuel...');
  
  try {
    const response = await makeRequest('/api/v1/subscriptions/current');
    console.log('✅ Abonnement actuel:', response);
    return response;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'abonnement:', error.message);
    return null;
  }
}

// Test 4: Récupération des quotas
async function testGetUsageLimits() {
  console.log('\n📊 Test de récupération des quotas...');
  
  try {
    const response = await makeRequest('/api/v1/usage/limits');
    console.log('✅ Quotas récupérés:', response);
    
    // Vérifier les fonctionnalités
    const features = ['analysis', 'report', 'competitor_analysis', 'optimize'];
    features.forEach(feature => {
      const key = `can_use_${feature}`;
      const limits = response[key];
      if (limits) {
        console.log(`  ${feature}: ${limits.allowed ? '✅' : '❌'} (${limits.used}/${limits.limit})`);
      }
    });
    
    return response;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des quotas:', error.message);
    return null;
  }
}

// Test 5: Création d'un abonnement (si pas d'abonnement actif)
async function testCreateSubscription() {
  console.log('\n🆕 Test de création d\'abonnement...');
  
  try {
    const subscriptionData = {
      plan_id: TEST_PLAN,
      payment_method: {
        type: 'card',
        card_number: '4242424242424242',
        exp_month: 12,
        exp_year: 2025,
        cvc: '123'
      }
    };

    const response = await makeRequest('/api/v1/subscriptions/', {
      method: 'POST',
      body: JSON.stringify(subscriptionData)
    });

    console.log('✅ Abonnement créé:', response);
    return response;
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'abonnement:', error.message);
    return null;
  }
}

// Test 6: Test d'une fonctionnalité protégée
async function testProtectedFeature() {
  console.log('\n🔒 Test d\'une fonctionnalité protégée...');
  
  try {
    // Test d'analyse de concurrents
    const response = await makeRequest('/api/v1/competitors/analyze', {
      method: 'POST',
      body: JSON.stringify({
        url: 'https://example.com',
        query: 'test analysis',
        competitors: ['competitor1.com', 'competitor2.com']
      })
    });

    console.log('✅ Fonctionnalité protégée testée:', response);
    return response;
  } catch (error) {
    console.error('❌ Erreur lors du test de fonctionnalité protégée:', error.message);
    return null;
  }
}

// Test principal
async function runAllTests() {
  console.log('🚀 Démarrage des tests d\'intégration frontend...\n');
  
  // Test 1: Connexion
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('❌ Impossible de continuer sans connexion');
    return;
  }
  
  // Test 2: Plans
  await testGetPlans();
  
  // Test 3: Abonnement actuel
  const currentSubscription = await testGetCurrentSubscription();
  
  // Test 4: Quotas
  await testGetUsageLimits();
  
  // Test 5: Création d'abonnement (si nécessaire)
  if (!currentSubscription?.subscription) {
    await testCreateSubscription();
  }
  
  // Test 6: Fonctionnalité protégée
  await testProtectedFeature();
  
  console.log('\n🎉 Tests terminés !');
}

// Exécuter les tests
runAllTests().catch(console.error);









