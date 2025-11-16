#!/usr/bin/env node

/**
 * Script de validation des variables d'environnement
 * Usage: node scripts/validate-env.js [production|development]
 */

const fs = require('fs');
const path = require('path');

const ENV = process.argv[2] || 'production';
const ENV_FILE = ENV === 'production' ? '.env.production' : '.env';
const ENV_EXAMPLE = 'env.example';

// Variables requises pour la production
const REQUIRED_VARS = {
  production: [
    'VITE_API_BASE_URL',
    'VITE_APP_ENV',
    'VITE_APP_VERSION',
    'VITE_STRIPE_PUBLISHABLE_KEY',
  ],
  development: [
    'VITE_API_BASE_URL',
  ],
};

// Variables interdites (secrets qui ne doivent JAMAIS être dans le frontend)
const FORBIDDEN_VARS = [
  'VITE_STRIPE_SECRET_KEY',
  'VITE_SECRET_KEY',
  'VITE_API_SECRET',
  'VITE_DATABASE_URL',
  'VITE_PRIVATE_KEY',
];

// Variables optionnelles mais recommandées
const RECOMMENDED_VARS = [
  'VITE_GOOGLE_ANALYTICS_ID',
  'VITE_MIXPANEL_TOKEN',
  'VITE_SUPPORT_EMAIL',
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

function validateEnv() {
  console.log(`\n🔍 Validation des variables d'environnement (${ENV})...\n`);
  
  const env = loadEnvFile(ENV_FILE);
  const example = loadEnvFile(ENV_EXAMPLE);
  
  let errors = [];
  let warnings = [];
  let success = [];
  
  // Vérifier les variables requises
  const required = REQUIRED_VARS[ENV] || REQUIRED_VARS.production;
  required.forEach(varName => {
    if (!env[varName] || env[varName] === '') {
      errors.push(`❌ Variable requise manquante: ${varName}`);
    } else if (env[varName].includes('your_') || env[varName].includes('example')) {
      warnings.push(`⚠️  Variable ${varName} contient une valeur d'exemple`);
    } else {
      success.push(`✅ ${varName} = ${env[varName].substring(0, 30)}...`);
    }
  });
  
  // Vérifier les variables interdites
  FORBIDDEN_VARS.forEach(varName => {
    if (env[varName]) {
      errors.push(`🔴 CRITIQUE: Variable secrète trouvée dans le frontend: ${varName}`);
    }
    if (example[varName]) {
      errors.push(`🔴 CRITIQUE: Variable secrète dans env.example: ${varName}`);
    }
  });
  
  // Vérifier les variables recommandées
  RECOMMENDED_VARS.forEach(varName => {
    if (!env[varName] || env[varName] === '') {
      warnings.push(`💡 Variable recommandée manquante: ${varName}`);
    }
  });
  
  // Vérifier que VITE_API_BASE_URL est HTTPS en production
  if (ENV === 'production' && env.VITE_API_BASE_URL) {
    if (!env.VITE_API_BASE_URL.startsWith('https://')) {
      errors.push(`❌ VITE_API_BASE_URL doit utiliser HTTPS en production`);
    }
  }
  
  // Vérifier que VITE_APP_ENV est correct
  if (env.VITE_APP_ENV && env.VITE_APP_ENV !== ENV) {
    warnings.push(`⚠️  VITE_APP_ENV=${env.VITE_APP_ENV} mais validation pour ${ENV}`);
  }
  
  // Afficher les résultats
  console.log('📊 Résultats de la validation:\n');
  
  if (success.length > 0) {
    console.log('✅ Variables valides:');
    success.forEach(msg => console.log(`   ${msg}`));
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  Avertissements:');
    warnings.forEach(msg => console.log(`   ${msg}`));
    console.log('');
  }
  
  if (errors.length > 0) {
    console.log('❌ Erreurs:');
    errors.forEach(msg => console.log(`   ${msg}`));
    console.log('');
  }
  
  // Résumé final
  console.log('─'.repeat(60));
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Toutes les validations sont passées!\n');
    process.exit(0);
  } else if (errors.length === 0) {
    console.log('⚠️  Validation passée avec avertissements\n');
    process.exit(0);
  } else {
    console.log(`❌ ${errors.length} erreur(s) critique(s) détectée(s)\n`);
    console.log('🔧 Actions requises:');
    console.log('   1. Corriger les erreurs ci-dessus');
    console.log('   2. Relancer la validation: node scripts/validate-env.js\n');
    process.exit(1);
  }
}

// Exécuter la validation
try {
  validateEnv();
} catch (error) {
  console.error('❌ Erreur lors de la validation:', error.message);
  process.exit(1);
}


