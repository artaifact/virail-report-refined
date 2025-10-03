#!/usr/bin/env node

/**
 * Test d'intégration paiement avec activation
 * 
 * Ce script teste le processus complet :
 * 1. Connexion utilisateur
 * 2. Création d'un abonnement
 * 3. Simulation du retour de paiement
 * 4. Activation de l'abonnement
 */

const API_BASE_URL = 'http://localhost:8000';
const CJ = '/home/nerilus/virail-report-refined/cookies.txt';

async function testPaymentActivation() {
  console.log('🧪 Test d\'intégration paiement avec activation\n');

  try {
    // 1. Connexion
    console.log('1️⃣ Connexion utilisateur...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        username: 'newuser123',
        password: 'testpassword123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Erreur de connexion: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Connexion réussie');

    // 2. Création d'un abonnement
    console.log('\n2️⃣ Création d\'un abonnement...');
    const subscriptionResponse = await fetch(`${API_BASE_URL}/api/v1/subscriptions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        plan_id: 'premium',
        auto_renew: true,
        success_url: 'http://localhost:8081/success?success=true&plan_id=premium',
        cancel_url: 'http://localhost:8081/pricing?canceled=true',
        payment_method: {
          type: "card",
          card_number: "4242424242424242",
          exp_month: "12",
          exp_year: "2030",
          cvc: "123",
          name: "Test User"
        }
      })
    });

    if (!subscriptionResponse.ok) {
      const errorText = await subscriptionResponse.text();
      throw new Error(`Erreur création abonnement: ${subscriptionResponse.status} - ${errorText}`);
    }

    const subscriptionData = await subscriptionResponse.json();
    console.log('✅ Abonnement créé');
    console.log('📋 Données:', JSON.stringify(subscriptionData, null, 2));

    // 3. Récupération de l'ID d'abonnement
    const subscriptionId = subscriptionData.subscription?.subscription?.id;
    if (!subscriptionId) {
      throw new Error('Pas d\'ID d\'abonnement trouvé dans la réponse');
    }

    console.log(`\n3️⃣ ID d'abonnement récupéré: ${subscriptionId}`);

    // 4. Simulation du retour de paiement (URL de succès)
    const successUrl = `http://localhost:8081/success?success=true&plan_id=premium&subscription_id=${subscriptionId}`;
    console.log(`\n4️⃣ URL de succès simulée: ${successUrl}`);

    // 5. Activation de l'abonnement (comme le ferait la page de succès)
    console.log(`\n5️⃣ Activation de l'abonnement ${subscriptionId}...`);
    const activationResponse = await fetch(`${API_BASE_URL}/api/v1/subscriptions/${subscriptionId}/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!activationResponse.ok) {
      const errorText = await activationResponse.text();
      throw new Error(`Erreur activation: ${activationResponse.status} - ${errorText}`);
    }

    const activationData = await activationResponse.json();
    console.log('✅ Abonnement activé avec succès');
    console.log('📋 Données d\'activation:', JSON.stringify(activationData, null, 2));

    // 6. Vérification de l'abonnement actuel
    console.log('\n6️⃣ Vérification de l\'abonnement actuel...');
    const currentResponse = await fetch(`${API_BASE_URL}/api/v1/subscriptions/current`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!currentResponse.ok) {
      const errorText = await currentResponse.text();
      throw new Error(`Erreur récupération abonnement: ${currentResponse.status} - ${errorText}`);
    }

    const currentData = await currentResponse.json();
    console.log('✅ Abonnement actuel récupéré');
    console.log('📋 Abonnement actuel:', JSON.stringify(currentData, null, 2));

    // 7. Vérification des quotas
    console.log('\n7️⃣ Vérification des quotas d\'usage...');
    const usageResponse = await fetch(`${API_BASE_URL}/api/v1/usage/limits`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!usageResponse.ok) {
      const errorText = await usageResponse.text();
      throw new Error(`Erreur récupération quotas: ${usageResponse.status} - ${errorText}`);
    }

    const usageData = await usageResponse.json();
    console.log('✅ Quotas récupérés');
    console.log('📋 Quotas:', JSON.stringify(usageData, null, 2));

    console.log('\n🎉 Test d\'intégration réussi !');
    console.log('\n📝 Résumé:');
    console.log(`   - Abonnement créé: ${subscriptionId}`);
    console.log(`   - Abonnement activé: ✅`);
    console.log(`   - Plan actuel: ${currentData.subscription?.plan?.name || 'Non défini'}`);
    console.log(`   - Statut: ${currentData.subscription?.status || 'Non défini'}`);
    console.log(`   - Quotas disponibles: ${Object.keys(usageData).filter(k => k.startsWith('can_use_')).length} fonctionnalités`);

    // 8. Test de l'URL de succès
    console.log('\n8️⃣ Test de l\'URL de succès...');
    console.log(`🌐 URL à tester dans le navigateur: ${successUrl}`);
    console.log('📋 Cette URL devrait:');
    console.log('   - Rediriger vers la page de succès');
    console.log('   - Activer automatiquement l\'abonnement');
    console.log('   - Afficher les informations du plan Premium');
    console.log('   - Rediriger vers l\'accueil après 5 secondes');

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    process.exit(1);
  }
}

// Test avec curl si fetch n'est pas disponible
async function testWithCurl() {
  console.log('🧪 Test d\'intégration avec curl\n');

  const { execSync } = require('child_process');

  try {
    // 1. Connexion
    console.log('1️⃣ Connexion utilisateur...');
    execSync(`curl -i -s -X POST "${API_BASE_URL}/auth/login" -H 'Content-Type: application/json' -c "${CJ}" -d '{"username":"newuser123","password":"testpassword123"}'`, { stdio: 'inherit' });
    console.log('✅ Connexion réussie');

    // 2. Création d'abonnement
    console.log('\n2️⃣ Création d\'un abonnement...');
    const subscriptionResult = execSync(`curl -s -X POST "${API_BASE_URL}/api/v1/subscriptions/" -H 'Content-Type: application/json' -b "${CJ}" -d '{"plan_id":"premium","auto_renew":true,"success_url":"http://localhost:8081/success?success=true&plan_id=premium","cancel_url":"http://localhost:8081/pricing?canceled=true","payment_method":{"type":"card","card_number":"4242424242424242","exp_month":"12","exp_year":"2030","cvc":"123","name":"Test User"}}'`, { encoding: 'utf8' });
    
    const subscriptionData = JSON.parse(subscriptionResult);
    console.log('✅ Abonnement créé');
    console.log('📋 Données:', JSON.stringify(subscriptionData, null, 2));

    const subscriptionId = subscriptionData.subscription?.subscription?.id;
    if (!subscriptionId) {
      throw new Error('Pas d\'ID d\'abonnement trouvé');
    }

    // 3. Activation
    console.log(`\n3️⃣ Activation de l'abonnement ${subscriptionId}...`);
    const activationResult = execSync(`curl -s -X POST "${API_BASE_URL}/api/v1/subscriptions/${subscriptionId}/activate" -H 'Content-Type: application/json' -b "${CJ}"`, { encoding: 'utf8' });
    
    const activationData = JSON.parse(activationResult);
    console.log('✅ Abonnement activé');
    console.log('📋 Données d\'activation:', JSON.stringify(activationData, null, 2));

    // 4. Vérification
    console.log('\n4️⃣ Vérification de l\'abonnement actuel...');
    const currentResult = execSync(`curl -s -X GET "${API_BASE_URL}/api/v1/subscriptions/current" -H 'Content-Type: application/json' -b "${CJ}"`, { encoding: 'utf8' });
    
    const currentData = JSON.parse(currentResult);
    console.log('✅ Abonnement actuel récupéré');
    console.log('📋 Abonnement actuel:', JSON.stringify(currentData, null, 2));

    // 5. URL de succès
    const successUrl = `http://localhost:8081/success?success=true&plan_id=premium&subscription_id=${subscriptionId}`;
    console.log('\n5️⃣ URL de succès à tester:');
    console.log(`🌐 ${successUrl}`);

    console.log('\n🎉 Test d\'intégration réussi !');

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    process.exit(1);
  }
}

// Exécution du test
if (typeof fetch !== 'undefined') {
  testPaymentActivation();
} else {
  testWithCurl();
}


