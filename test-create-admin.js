/**
 * Script de test pour créer un compte administrateur
 * Utilise l'endpoint POST /auth/create-admin
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://api.viraill.com';

async function createAdmin() {
  const adminData = {
    email: "admin@viraill.com",
    username: "neeewadmin", 
    password: "password"
  };

  try {
    console.log('🔧 Création d\'un compte administrateur...');
    console.log('📤 Données envoyées:', adminData);

    const response = await fetch(`${API_BASE_URL}/auth/create-admin`, {
      method: 'POST',
      credentials: 'include', // Important pour les cookies
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminData),
    });

    console.log('📊 Statut de la réponse:', response.status);
    console.log('📊 Headers de la réponse:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erreur lors de la création:', errorData);
      throw new Error(`Erreur ${response.status}: ${errorData.message || 'Erreur inconnue'}`);
    }

    const data = await response.json();
    console.log('✅ Compte admin créé avec succès!');
    console.log('📋 Données retournées:', data);

    return data;
  } catch (error) {
    console.error('❌ Erreur lors de la création du compte admin:', error.message);
    throw error;
  }
}

// Exécuter le test
createAdmin()
  .then((result) => {
    console.log('🎉 Test réussi!');
    console.log('👤 Compte admin créé:', result);
  })
  .catch((error) => {
    console.error('💥 Test échoué:', error.message);
    process.exit(1);
  });
