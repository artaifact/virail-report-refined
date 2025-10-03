// Test temporaire pour vérifier le mapping LLMO
import { mapLLMOReportData } from './lib/llmo-mapper';
import { loadLLMOTestData } from './lib/test-data';

async function testLLMOMapping() {
  try {
    console.log('🧪 Test du mapping LLMO...');
    
    // Charger les données de test
    const rawData = await loadLLMOTestData();
    console.log('✅ Données chargées, longueur:', rawData.length);
    
    // Mapper les données
    const mappedData = mapLLMOReportData(rawData);
    console.log('✅ Mapping terminé');
    
    // Afficher les résultats
    console.log('📊 Résultats du mapping:');
    console.log('- URL:', mappedData.url);
    console.log('- Analyses totales:', mappedData.overview.totalAnalyses);
    console.log('- Analyses complétées:', mappedData.overview.completedAnalyses);
    console.log('- Durée moyenne:', mappedData.overview.averageDuration + 's');
    console.log('- Score recommandation moyen:', mappedData.overview.averageRecommendationScore);
    console.log('- Score sémantique moyen:', mappedData.overview.averageSemanticScore);
    console.log('- LLMs:', mappedData.overview.llmNames.join(', '));
    
    console.log('📈 Sections avec données:');
    console.log('- Perceptions:', mappedData.perceptions.length);
    console.log('- Audiences:', mappedData.audiences.length);
    console.log('- Recommandations:', mappedData.recommendations.length);
    console.log('- Analyses sémantiques:', mappedData.semanticAnalyses.length);
    console.log('- Synthèses stratégiques:', mappedData.strategicSyntheses.length);
    
    if (mappedData.perceptions.length > 0) {
      console.log('🔍 Premier exemple de perception:');
      const perception = mappedData.perceptions[0];
      console.log('  - LLM:', perception.llm);
      console.log('  - Sujet principal:', perception.mainSubject?.substring(0, 100) + '...');
    }
    
    if (mappedData.recommendations.length > 0) {
      console.log('🎯 Premier exemple de recommandation:');
      const rec = mappedData.recommendations[0];
      console.log('  - LLM:', rec.llm);
      console.log('  - Score:', rec.score);
      console.log('  - Suggestions:', rec.suggestions.length);
    }
    
    console.log('✅ Test réussi !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exporter pour usage dans la console
(window as any).testLLMOMapping = testLLMOMapping;

export { testLLMOMapping }; 