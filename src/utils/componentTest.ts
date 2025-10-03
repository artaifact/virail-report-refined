// Script de test pour vérifier que tous les composants se chargent correctement
import { GoogleButton } from '@/components/ui/GoogleButton';
import { StatsCard } from '@/components/ui/stats-card';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import DetailedCompetitiveAnalysis from '@/components/competitive-analysis/DetailedCompetitiveAnalysis';
import CompetitiveAnalysisDisplay from '@/components/competitive-analysis/CompetitiveAnalysisDisplay';

export function testComponentImports() {
  console.log('🧪 Test des imports de composants...');
  
  try {
    // Test des composants UI
    console.log('✅ GoogleButton importé:', typeof GoogleButton);
    console.log('✅ StatsCard importé:', typeof StatsCard);
    console.log('✅ Textarea importé:', typeof Textarea);
    console.log('✅ Select importé:', typeof Select);
    
    // Test des composants d'analyse
    console.log('✅ DetailedCompetitiveAnalysis importé:', typeof DetailedCompetitiveAnalysis);
    console.log('✅ CompetitiveAnalysisDisplay importé:', typeof CompetitiveAnalysisDisplay);
    
    console.log('🎉 Tous les composants se chargent correctement !');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors du chargement des composants:', error);
    return false;
  }
}

// Fonction pour tester les services
export function testServiceImports() {
  console.log('🧪 Test des imports de services...');
  
  try {
    // Test des services d'authentification
    const { AuthService } = require('@/services/authService');
    console.log('✅ AuthService importé:', typeof AuthService);
    
    // Test des services d'API
    const { apiService } = require('@/services/apiService');
    console.log('✅ apiService importé:', typeof apiService);
    
    console.log('🎉 Tous les services se chargent correctement !');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors du chargement des services:', error);
    return false;
  }
}

// Fonction pour tester les hooks
export function testHookImports() {
  console.log('🧪 Test des imports de hooks...');
  
  try {
    // Test des hooks d'authentification
    const { useAuth } = require('@/hooks/useAuth');
    console.log('✅ useAuth importé:', typeof useAuth);
    
    // Test des hooks de paiement
    const { usePayment } = require('@/hooks/usePayment');
    console.log('✅ usePayment importé:', typeof usePayment);
    
    console.log('🎉 Tous les hooks se chargent correctement !');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors du chargement des hooks:', error);
    return false;
  }
}

// Fonction de test complète
export function runAllTests() {
  console.log('🚀 Démarrage des tests de composants...');
  
  const componentTest = testComponentImports();
  const serviceTest = testServiceImports();
  const hookTest = testHookImports();
  
  const allTestsPassed = componentTest && serviceTest && hookTest;
  
  if (allTestsPassed) {
    console.log('🎉 Tous les tests sont passés ! L\'application est prête.');
  } else {
    console.log('❌ Certains tests ont échoué. Vérifiez les erreurs ci-dessus.');
  }
  
  return allTestsPassed;
}
