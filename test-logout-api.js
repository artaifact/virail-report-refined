// Script de test pour l'endpoint de déconnexion
const API_BASE_URL = 'http://localhost:8000';

async function testLogoutAPI() {
  console.log('🔄 Test de l\'endpoint de déconnexion...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('📡 Status:', response.status);
    console.log('📡 Status Text:', response.statusText);
    console.log('📡 Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json().catch(() => null);
      console.log('✅ Déconnexion réussie:', data || 'Pas de contenu');
    } else {
      const errorText = await response.text();
      console.log('❌ Erreur:', errorText);
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error.message);
  }
}

// Exécuter le test
testLogoutAPI();
