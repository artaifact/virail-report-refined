/**
 * Script de test pour appeler l'API GET /llmo/reports/{id}
 * S'authentifie d'abord avec les cookies, puis utilise les cookies pour les appels API
 * 
 * Note: Ce script utilise curl via child_process car Node.js fetch() ne gère pas
 * automatiquement les cookies HttpOnly comme le ferait un navigateur.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE_URL = 'http://localhost:8000';
const COOKIES_FILE = '/tmp/cookies-test.txt';

// Identifiants de connexion
const CREDENTIALS = {
  username: 'admin',
  password: 'Fouchy2001&@'
};

/**
 * Fonction pour s'authentifier et obtenir les cookies
 */
function login() {
  try {
    console.log('🔐 Authentification...');
    
    const loginCmd = `curl -s -X POST "${API_BASE_URL}/auth/login" \
      -H "Content-Type: application/json" \
      -d '${JSON.stringify(CREDENTIALS)}' \
      -c ${COOKIES_FILE} \
      -w "\n%{http_code}"`;
    
    const result = execSync(loginCmd, { encoding: 'utf-8' });
    const lines = result.trim().split('\n');
    const statusCode = parseInt(lines[lines.length - 1]);
    const responseBody = lines.slice(0, -1).join('\n');
    
    if (statusCode === 200) {
      console.log('✅ Authentification réussie');
      const data = JSON.parse(responseBody);
      if (data.access_token) {
        console.log('✅ Token obtenu:', data.access_token.substring(0, 50) + '...');
      }
      return true;
    } else {
      console.error('❌ Erreur d\'authentification:', statusCode);
      console.error('📋 Réponse:', responseBody);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'authentification:', error.message);
    return false;
  }
}

/**
 * Fonction pour appeler GET /llmo/reports/{id}
 */
function testGetReport(reportId) {
  try {
    console.log(`\n📡 Test appel API GET /llmo/reports/${reportId}`);
    
    const cmd = `curl -s -X GET "${API_BASE_URL}/llmo/reports/${reportId}" \
      -H "Content-Type: application/json" \
      -b ${COOKIES_FILE} \
      -w "\n%{http_code}"`;
    
    const result = execSync(cmd, { encoding: 'utf-8' });
    const lines = result.trim().split('\n');
    const statusCode = parseInt(lines[lines.length - 1]);
    const responseBody = lines.slice(0, -1).join('\n');
    
    console.log(`📊 Status: ${statusCode}`);
    
    if (statusCode === 200) {
      try {
        const data = JSON.parse(responseBody);
        console.log('✅ Succès!');
        console.log('📄 Données du rapport:', JSON.stringify(data, null, 2));
        return data;
      } catch {
        console.log('✅ Succès!');
        console.log('📄 Réponse:', responseBody);
        return responseBody;
      }
    } else {
      console.error('❌ Erreur:', statusCode);
      try {
        const errorData = JSON.parse(responseBody);
        console.error('📋 Détails erreur:', JSON.stringify(errorData, null, 2));
      } catch {
        console.error('📋 Message erreur:', responseBody);
      }
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error.message);
    return null;
  }
}

// Tester avec différents IDs
async function runTests() {
  console.log('🧪 Tests des appels API GET /llmo/reports/{id}\n');
  
  // Nettoyer le fichier de cookies s'il existe
  if (fs.existsSync(COOKIES_FILE)) {
    fs.unlinkSync(COOKIES_FILE);
  }
  
  // D'abord s'authentifier
  const authenticated = login();
  
  if (!authenticated) {
    console.error('❌ Impossible de s\'authentifier. Arrêt des tests.');
    return;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Authentification réussie, début des tests API\n');
  
  const reportIds = ['1', '2', '3'];
  
  for (const id of reportIds) {
    console.log(`\n--- Test avec ID: ${id} ---`);
    testGetReport(id);
    console.log('\n');
  }
  
  // Nettoyer le fichier de cookies
  if (fs.existsSync(COOKIES_FILE)) {
    fs.unlinkSync(COOKIES_FILE);
  }
}

// Exécuter les tests
runTests().catch(console.error);

