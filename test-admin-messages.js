/**
 * Script de test pour les endpoints de gestion des messages admin
 * Teste tous les endpoints implémentés dans le frontend
 */

const API_BASE_URL = 'http://localhost:8000';

// Fonction pour afficher les résultats de manière formatée
function displayResult(title, data) {
 //console.log('\n' + '='.repeat(60));
 //console.log(`📋 ${title}`);
 //console.log('='.repeat(60));
 //console.log(JSON.stringify(data, null, 2));
}

// 1. GET /admin/messages - Liste des messages
async function testGetMessages() {
  try {
   //console.log('\n🔍 Test: GET /admin/messages');
    
    const params = new URLSearchParams({
      page: '1',
      per_page: '10',
      // status: 'unread',
      // priority: 'high'
    });

    const response = await fetch(`${API_BASE_URL}/admin/messages?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

   //console.log('📊 Statut:', response.status);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erreur ${response.status}: ${error.message || 'Erreur inconnue'}`);
    }

    const data = await response.json();
    displayResult('Liste des messages', {
      total: data.total,
      page: data.page,
      per_page: data.per_page,
      total_pages: data.total_pages,
      messages_count: data.messages?.length || 0,
      first_message: data.messages?.[0]
    });

    return data.messages?.[0]?.id; // Retourne l'ID du premier message pour les tests suivants
  } catch (error) {
    console.error('❌ Erreur lors du test GET /admin/messages:', error.message);
    return null;
  }
}

// 2. GET /admin/messages/stats/overview - Statistiques
async function testGetMessagesStats() {
  try {
   //console.log('\n🔍 Test: GET /admin/messages/stats/overview');

    const response = await fetch(`${API_BASE_URL}/admin/messages/stats/overview`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

   //console.log('📊 Statut:', response.status);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erreur ${response.status}: ${error.message || 'Erreur inconnue'}`);
    }

    const data = await response.json();
    displayResult('Statistiques des messages', data);

    return true;
  } catch (error) {
    console.error('❌ Erreur lors du test GET /admin/messages/stats/overview:', error.message);
    return false;
  }
}

// 3. GET /admin/messages/search - Recherche avancée
async function testSearchMessages() {
  try {
   //console.log('\n🔍 Test: GET /admin/messages/search');

    const params = new URLSearchParams({
      query: 'support',
      page: '1',
      per_page: '5',
      // status: 'unread',
      // priority: 'high'
    });

    const response = await fetch(`${API_BASE_URL}/admin/messages/search?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

   //console.log('📊 Statut:', response.status);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erreur ${response.status}: ${error.message || 'Erreur inconnue'}`);
    }

    const data = await response.json();
    displayResult('Résultats de recherche', {
      total: data.total,
      messages_found: data.messages?.length || 0,
      first_result: data.messages?.[0]
    });

    return true;
  } catch (error) {
    console.error('❌ Erreur lors du test GET /admin/messages/search:', error.message);
    return false;
  }
}

// 4. GET /admin/messages/{id} - Détails d'un message
async function testGetMessageById(messageId) {
  if (!messageId) {
   //console.log('\n⚠️  Aucun ID de message disponible pour le test');
    return false;
  }

  try {
   //console.log(`\n🔍 Test: GET /admin/messages/${messageId}`);

    const response = await fetch(`${API_BASE_URL}/admin/messages/${messageId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

   //console.log('📊 Statut:', response.status);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erreur ${response.status}: ${error.message || 'Erreur inconnue'}`);
    }

    const data = await response.json();
    displayResult('Détails du message', data);

    return true;
  } catch (error) {
    console.error(`❌ Erreur lors du test GET /admin/messages/${messageId}:`, error.message);
    return false;
  }
}

// 5. PUT /admin/messages/{id} - Mise à jour d'un message
async function testUpdateMessage(messageId) {
  if (!messageId) {
   //console.log('\n⚠️  Aucun ID de message disponible pour le test');
    return false;
  }

  try {
   //console.log(`\n🔍 Test: PUT /admin/messages/${messageId}`);

    const updateData = {
      status: 'read',
      priority: 'medium',
      admin_response: 'Votre message a été pris en compte. Nous reviendrons vers vous sous 24h.',
      tags: ['support', 'en-cours', 'test']
    };

   //console.log('📤 Données envoyées:', updateData);

    const response = await fetch(`${API_BASE_URL}/admin/messages/${messageId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

   //console.log('📊 Statut:', response.status);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erreur ${response.status}: ${error.message || 'Erreur inconnue'}`);
    }

    const data = await response.json();
    displayResult('Message mis à jour', data);

    return true;
  } catch (error) {
    console.error(`❌ Erreur lors du test PUT /admin/messages/${messageId}:`, error.message);
    return false;
  }
}

// 6. DELETE /admin/messages/{id} - Suppression d'un message
async function testDeleteMessage(messageId) {
  if (!messageId) {
   //console.log('\n⚠️  Aucun ID de message disponible pour le test');
    return false;
  }

  try {
   //console.log(`\n🔍 Test: DELETE /admin/messages/${messageId}`);
   //console.log('⚠️  ATTENTION: Ce test va supprimer le message!');

    const response = await fetch(`${API_BASE_URL}/admin/messages/${messageId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

   //console.log('📊 Statut:', response.status);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erreur ${response.status}: ${error.message || 'Erreur inconnue'}`);
    }

    const data = await response.json();
    displayResult('Message supprimé', data);

    return true;
  } catch (error) {
    console.error(`❌ Erreur lors du test DELETE /admin/messages/${messageId}:`, error.message);
    return false;
  }
}

// Fonction principale pour exécuter tous les tests
async function runAllTests() {
 //console.log('🚀 Démarrage des tests des endpoints admin messages...');
 //console.log(`📍 API Base URL: ${API_BASE_URL}`);
 //console.log('🔐 Note: Assurez-vous d\'être authentifié avec un compte admin');

  const results = {
    total: 6,
    passed: 0,
    failed: 0
  };

  // Test 1: Liste des messages
  const messageId = await testGetMessages();
  if (messageId) results.passed++;
  else results.failed++;

  // Pause de 500ms entre les tests
  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 2: Statistiques
  const statsSuccess = await testGetMessagesStats();
  if (statsSuccess) results.passed++;
  else results.failed++;

  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 3: Recherche
  const searchSuccess = await testSearchMessages();
  if (searchSuccess) results.passed++;
  else results.failed++;

  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 4: Détails d'un message (si on a un ID)
  if (messageId) {
    const detailsSuccess = await testGetMessageById(messageId);
    if (detailsSuccess) results.passed++;
    else results.failed++;

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 5: Mise à jour (si on a un ID)
    const updateSuccess = await testUpdateMessage(messageId);
    if (updateSuccess) results.passed++;
    else results.failed++;

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 6: Suppression (si on a un ID) - OPTIONNEL
   //console.log('\n⚠️  Test 6 (DELETE) commenté pour éviter la suppression réelle');
   //console.log('💡 Pour tester la suppression, décommentez le code dans test-admin-messages.js');
    // const deleteSuccess = await testDeleteMessage(messageId);
    // if (deleteSuccess) results.passed++;
    // else results.failed++;
    
    // Pour le moment, on compte ce test comme ignoré
    results.failed++;
  } else {
   //console.log('\n⚠️  Tests 4, 5 et 6 ignorés (pas de message disponible)');
    results.failed += 3;
  }

  // Résumé final
 //console.log('\n' + '='.repeat(60));
 //console.log('📊 RÉSUMÉ DES TESTS');
 //console.log('='.repeat(60));
 //console.log(`✅ Tests réussis: ${results.passed}/${results.total}`);
 //console.log(`❌ Tests échoués: ${results.failed}/${results.total}`);
 //console.log(`📈 Taux de réussite: ${Math.round((results.passed / results.total) * 100)}%`);
 //console.log('='.repeat(60));

  if (results.passed === results.total) {
   //console.log('🎉 Tous les tests ont réussi!');
    process.exit(0);
  } else {
   //console.log('⚠️  Certains tests ont échoué. Vérifiez les logs ci-dessus.');
    process.exit(1);
  }
}

// Exécuter tous les tests
runAllTests().catch(error => {
  console.error('💥 Erreur fatale lors de l\'exécution des tests:', error);
  process.exit(1);
});

