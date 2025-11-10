// 🧪 Script de Test pour l'Intégration API
// Exécuter dans la console du navigateur pour tester l'API

// Test 1: Vérifier que l'API est accessible
async function testApiEndpoint() {
  try {
   //console.log('🧪 Test 1: Vérification de l\'endpoint API...');
    
    const response = await fetch('http://localhost:8000/api/v1/competitors/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        url: 'https://alan.com',
        min_score: 0.5,
        min_mentions: 1
      })
    });

   //console.log('📊 Status:', response.status);
   //console.log('📊 Headers:', Object.fromEntries(response.headers));
    
    if (response.ok) {
      const data = await response.json();
     //console.log('✅ Réponse API:', data);
      return data;
    } else {
      console.error('❌ Erreur API:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Détails:', errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error);
    return null;
  }
}

// Test 2: Simuler le clic sur le bouton
async function testButtonClick() {
 //console.log('🧪 Test 2: Simulation du clic sur le bouton...');
  
  // Trouver le composant React (si disponible)
  const button = document.querySelector('button[type="button"]');
  if (button && button.textContent.includes('Lancer')) {
   //console.log('🔘 Bouton trouvé:', button);
    button.click();
  } else {
    console.warn('⚠️ Bouton "Lancer l\'analyse" non trouvé');
  }
}

// Test 3: Vérifier les cookies d'authentification
function testAuthCookies() {
 //console.log('🧪 Test 3: Vérification des cookies...');
  
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=');
    acc[name] = value;
    return acc;
  }, {});
  
 //console.log('🍪 Cookies disponibles:', cookies);
  
  // Vérifier les cookies d'authentification courants
  const authCookies = ['session', 'token', 'auth', 'jwt', 'access_token'];
  const foundAuthCookies = authCookies.filter(name => cookies[name]);
  
  if (foundAuthCookies.length > 0) {
   //console.log('✅ Cookies d\'authentification trouvés:', foundAuthCookies);
  } else {
    console.warn('⚠️ Aucun cookie d\'authentification détecté');
  }
  
  return cookies;
}

// Test 4: Vérifier le format de la réponse
function testResponseFormat(apiResponse) {
 //console.log('🧪 Test 4: Vérification du format de réponse...');
  
  if (!apiResponse) {
    console.error('❌ Pas de données à tester');
    return false;
  }
  
  // Format 1: Réponse directe
  if (apiResponse.user_site && apiResponse.competitors) {
   //console.log('✅ Format 1 détecté: Réponse directe');
    return 'format1';
  }
  
  // Format 2: Réponse avec analysis_result
  if (apiResponse.analysis_result || apiResponse.competitive_analysis) {
   //console.log('✅ Format 2 détecté: Réponse avec analysis_result');
    return 'format2';
  }
  
  // Format inconnu
  console.warn('⚠️ Format de réponse non reconnu');
 //console.log('📊 Structure reçue:', Object.keys(apiResponse));
  return 'unknown';
}

// Test 5: Tester l'endpoint GET d'une analyse spécifique par ID
async function testGetAnalysisById(analysisId) {
  try {
   //console.log('🧪 Test 5: Récupération d\'une analyse spécifique par ID:', analysisId);
    
    const response = await fetch(`http://localhost:8000/api/v1/competitors/analyses/${analysisId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

   //console.log('📊 Status:', response.status);
   //console.log('📊 Headers:', Object.fromEntries(response.headers));
    
    if (response.ok) {
      const data = await response.json();
     //console.log('✅ Analyse spécifique récupérée:', data);
      
      // Vérifier la structure des données
      if (data.userSite && data.competitors) {
       //console.log('📋 Format: Analyse complète détectée');
       //console.log('🏆 Score utilisateur:', data.userSite.report?.total_score);
       //console.log('🎯 Concurrents:', data.competitors.length);
      } else {
        console.warn('⚠️ Format d\'analyse non reconnu:', Object.keys(data));
      }
      
      return data;
    } else {
      console.error('❌ Erreur API:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Détails:', errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error);
    return null;
  }
}

// Test 6: Tester l'endpoint GET des analyses sauvegardées
async function testGetAnalyses() {
  try {
   //console.log('🧪 Test 6: Récupération des analyses sauvegardées...');
    
    const response = await fetch('http://localhost:8000/api/v1/competitors/analyses', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

   //console.log('📊 Status:', response.status);
   //console.log('📊 Headers:', Object.fromEntries(response.headers));
    
    if (response.ok) {
      const data = await response.json();
     //console.log('✅ Analyses récupérées:', data);
      
      // Vérifier le format des données
      if (Array.isArray(data)) {
       //console.log('📋 Format: Tableau direct -', data.length, 'analyses');
      } else if (data.analyses && Array.isArray(data.analyses)) {
       //console.log('📋 Format: Objet avec propriété analyses -', data.analyses.length, 'analyses');
      } else if (data.data && Array.isArray(data.data)) {
       //console.log('📋 Format: Objet avec propriété data -', data.data.length, 'analyses');
      } else {
        console.warn('⚠️ Format non reconnu:', Object.keys(data));
      }
      
      return data;
    } else {
      console.error('❌ Erreur API:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Détails:', errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error);
    return null;
  }
}

// Test complet
async function runAllTests() {
 //console.log('🚀 === DÉBUT DES TESTS D\'INTÉGRATION API ===');
  
  // Test des cookies
  const cookies = testAuthCookies();
  
  // Test de l'endpoint POST (analyse)
  const apiResponse = await testApiEndpoint();
  
  // Test de l'endpoint GET (analyses sauvegardées)
  const savedAnalyses = await testGetAnalyses();
  
  // Test de l'endpoint GET by ID (si on a des analyses)
  let specificAnalysis = null;
  if (savedAnalyses && Array.isArray(savedAnalyses) && savedAnalyses.length > 0) {
    const firstAnalysisId = savedAnalyses[0].id;
    specificAnalysis = await testGetAnalysisById(firstAnalysisId);
  } else if (savedAnalyses && savedAnalyses.analyses && savedAnalyses.analyses.length > 0) {
    const firstAnalysisId = savedAnalyses.analyses[0].id;
    specificAnalysis = await testGetAnalysisById(firstAnalysisId);
  }
  
  // Test du format
  const format = testResponseFormat(apiResponse);
  
  // Résumé
 //console.log('📋 === RÉSUMÉ DES TESTS ===');
 //console.log('🍪 Cookies:', Object.keys(cookies).length > 0 ? '✅' : '❌');
 //console.log('🌐 API POST (analyse):', apiResponse ? '✅' : '❌');
 //console.log('📄 API GET (analyses):', savedAnalyses ? '✅' : '❌');
 //console.log('🔍 API GET by ID:', specificAnalysis ? '✅' : '❌');
 //console.log('📊 Format:', format !== 'unknown' ? '✅' : '❌');
  
  const allSuccess = apiResponse && savedAnalyses && format !== 'unknown';
  if (allSuccess) {
   //console.log('🎉 Intégration API complète fonctionnelle !');
    if (specificAnalysis) {
     //console.log('🚀 Bonus: Chargement d\'analyse spécifique aussi fonctionnel !');
    }
  } else {
   //console.log('⚠️ Problèmes détectés, vérifiez les logs ci-dessus');
  }
  
 //console.log('🏁 === FIN DES TESTS ===');
  
  return {
    cookies,
    apiResponse,
    savedAnalyses,
    specificAnalysis,
    format,
    success: allSuccess
  };
}

// Utilitaires pour le debugging
const debugUtils = {
  // Afficher la requête cURL équivalente
  showCurlCommand: () => {
    const cookies = document.cookie;
   //console.log('📋 Commande cURL équivalente:');
   //console.log(`curl -X POST "http://localhost:8000/api/v1/competitors/analyze" \\
  -H "Content-Type: application/json" \\
  -H "Cookie: ${cookies}" \\
  -d '{
    "url": "https://alan.com",
    "min_score": 0.5,
    "min_mentions": 1
  }'`);
  },
  
  // Vérifier l'état du composant React
  checkReactState: () => {
    // Essayer de trouver l'état React (méthode approximative)
    const reactElements = document.querySelectorAll('[data-reactroot], [data-react-checksum]');
   //console.log('⚛️ Éléments React trouvés:', reactElements.length);
    
    // Chercher les éléments avec des classes spécifiques à l'app
    const analysisElements = document.querySelectorAll('[class*="analysis"], [class*="competitive"]');
   //console.log('🔍 Éléments d\'analyse trouvés:', analysisElements.length);
  }
};

// Exporter les fonctions pour utilisation dans la console
window.testAPI = {
  runAllTests,
  testApiEndpoint,
  testGetAnalyses,
  testGetAnalysisById,
  testButtonClick,
  testAuthCookies,
  testResponseFormat,
  debugUtils
};

console.log('🧪 Tests API chargés ! Utilisez:');
console.log('- testAPI.runAllTests() pour lancer tous les tests');
console.log('- testAPI.testApiEndpoint() pour tester POST /analyze');
console.log('- testAPI.testGetAnalyses() pour tester GET /analyses');
console.log('- testAPI.testGetAnalysisById("id") pour tester GET /analyses/{id}');
console.log('- testAPI.debugUtils.showCurlCommand() pour voir la commande cURL');
