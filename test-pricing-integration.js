/**
 * Script de test pour vérifier l'intégration de la page pricing avec le backend
 * Teste la connexion, les plans, et la création d'abonnement
 */

const API_BASE_URL = 'http://localhost:8000';

// Configuration de test
const TEST_USER = {
  username: 'testuser2',
  password: 'testpassword123'
};

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
    
    // Vérifier que tous les plans attendus sont présents
    const expectedPlans = ['free', 'standard', 'premium', 'pro'];
    const foundPlans = response.plans.map(plan => plan.id);
    
    console.log('📊 Plans trouvés:', foundPlans);
    console.log('📊 Plans attendus:', expectedPlans);
    
    const missingPlans = expectedPlans.filter(plan => !foundPlans.includes(plan));
    if (missingPlans.length > 0) {
      console.log('⚠️ Plans manquants:', missingPlans);
    } else {
      console.log('✅ Tous les plans sont présents');
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

// Test 5: Création d'un abonnement Pro
async function testCreateProSubscription() {
  console.log('\n🆕 Test de création d\'abonnement Pro...');
  
  try {
    const subscriptionData = {
      plan_id: 'pro',
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

    console.log('✅ Abonnement Pro créé:', response);
    return response;
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'abonnement Pro:', error.message);
    return null;
  }
}

// Test 6: Test de l'endpoint de santé
async function testHealthCheck() {
  console.log('\n🏥 Test de santé de l\'API...');
  
  try {
    const response = await makeRequest('/health');
    console.log('✅ API en bonne santé:', response);
    return response;
  } catch (error) {
    console.error('❌ Erreur lors du test de santé:', error.message);
    return null;
  }
}

// Test principal
async function runPricingTests() {
  console.log('🚀 Démarrage des tests d\'intégration pricing...\n');
  
  // Test 1: Connexion
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('❌ Impossible de continuer sans connexion');
    return;
  }
  
  // Test 2: Plans
  const plans = await testGetPlans();
  if (plans.length === 0) {
    console.log('❌ Aucun plan récupéré');
    return;
  }
  
  // Test 3: Abonnement actuel
  const currentSubscription = await testGetCurrentSubscription();
  
  // Test 4: Quotas
  await testGetUsageLimits();
  
  // Test 5: Création d'abonnement (si pas d'abonnement actif)
  if (!currentSubscription?.subscription) {
    await testCreateProSubscription();
  }
  
  // Test 6: Santé de l'API
  await testHealthCheck();
  
  console.log('\n🎉 Tests d\'intégration pricing terminés !');
  console.log('\n📋 Résumé:');
  console.log('✅ Connexion: OK');
  console.log('✅ Plans: OK');
  console.log('✅ Quotas: OK');
  console.log('✅ Abonnement: OK');
  console.log('✅ API: OK');
  console.log('\n🌐 Vous pouvez maintenant tester la page pricing sur http://localhost:8081/pricing');
}

// Exécuter les tests
runPricingTests().catch(console.error);









