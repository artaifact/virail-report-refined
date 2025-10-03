const fs = require('fs');

// Lecture du fichier JSON
const rawData = fs.readFileSync('public/504606b0bc67caad.json', 'utf8');

// Test de détection des synthèses stratégiques
const sections = rawData.split(/### Analyse par :/);

console.log('🔍 Test de détection des synthèses stratégiques:');
console.log('- Nombre de sections trouvées:', sections.length - 1);

for (let i = 1; i < Math.min(sections.length, 4); i++) {
  const section = sections[i];
  const llmMatch = section.match(/^([^\n*]+)/);
  const llmName = llmMatch ? llmMatch[1].trim() : 'LLM inconnu';
  
  console.log(`\n📊 Section ${i} (${llmName}):`);
  
  // Test avec la regex corrigée - inclut la ligne de tirets
  const strategicMatch = section.match(/\*\*Synthèse Stratégique & Recommandations LLMO\s*:\*\*\n-+\n([\s\S]*?)(?=----+|$)/);
  if (strategicMatch) {
    const content = strategicMatch[1];
    console.log('  ✅ Synthèse stratégique trouvée');
    console.log('  🔍 Longueur du contenu:', content.length);
    console.log('  🔍 Début du contenu:', content.substring(0, 100) + '...');
    
    // Test synthèse globale avec le format exact
    const globalMatch = content.match(/\*\*Synthèse Stratégique Globale\*\*([\s\S]*?)(?=---\n|\*\*Recommandations|### Quick Wins|$)/);
    if (globalMatch) {
      console.log('  📄 Synthèse globale: Présente (' + globalMatch[1].trim().substring(0, 80) + '...)');
    } else {
      console.log('  📄 Synthèse globale: Absente');
      // Debug pour voir si on trouve "Synthèse Stratégique Globale"
      if (content.includes('Synthèse Stratégique Globale')) {
        const idx = content.indexOf('Synthèse Stratégique Globale');
        console.log('  🔍 "Synthèse Stratégique Globale" trouvé à la position', idx);
        console.log('  🔍 Contexte:', content.substring(idx - 10, idx + 100));
      }
    }
    
    // Test Quick Wins avec le format exact du JSON
    const quickWinsPattern = /### Quick Wins \(Actions Immédiates[^)]*\)([\s\S]*?)(?=---\n|### Actions Stratégiques|$)/i;
    const quickWinsSection = content.match(quickWinsPattern);
    if (quickWinsSection) {
      console.log('  ⚡ Section Quick Wins trouvée');
      const qwContent = quickWinsSection[1];
      
      const numberedPoints = qwContent.match(/\d+\.\s+\*\*([^*]+)\*\*/g);
      if (numberedPoints) {
        console.log('  ⚡ Quick Wins:', numberedPoints.length + ' trouvé(s)');
        numberedPoints.forEach((point, idx) => {
          const cleanPoint = point.replace(/\d+\.\s+\*\*([^*]+)\*\*/, '$1').trim();
          console.log(`     ${idx + 1}. ${cleanPoint}`);
        });
      } else {
        console.log('  ⚡ Quick Wins: Format des points non reconnu');
      }
    } else {
      console.log('  ⚡ Quick Wins: Section non trouvée');
      // Debug
      if (content.includes('Quick Wins')) {
        const idx = content.indexOf('Quick Wins');
        console.log('  🔍 "Quick Wins" trouvé à la position', idx);
        console.log('  🔍 Contexte:', content.substring(idx - 10, idx + 80));
      }
    }
    
    // Test Actions Stratégiques avec le format exact
    const actionsPattern = /### Actions Stratégiques \([^)]*\)([\s\S]*?)(?=---\n|\*\*Conclusion|$)/i;
    const actionsSection = content.match(actionsPattern);
    if (actionsSection) {
      console.log('  🎯 Section Actions Stratégiques trouvée');
      const asContent = actionsSection[1];
      const numberedActions = asContent.match(/\d+\.\s+\*\*([^*]+)\*\*/g);
      if (numberedActions) {
        console.log('  🎯 Actions Stratégiques:', numberedActions.length + ' trouvée(s)');
        numberedActions.forEach((action, idx) => {
          const cleanAction = action.replace(/\d+\.\s+\*\*([^*]+)\*\*/, '$1').trim();
          console.log(`     ${idx + 1}. ${cleanAction}`);
        });
      } else {
        console.log('  🎯 Actions Stratégiques: Format des points non reconnu');
      }
    } else {
      console.log('  🎯 Actions Stratégiques: Section non trouvée');
    }
    
    // Test Conclusion
    const conclusionMatch = content.match(/\*\*Conclusion\*\*([\s\S]*?)(?=----+|$)/);
    console.log('  📝 Conclusion:', conclusionMatch ? 'Présente (' + conclusionMatch[1].trim().substring(0, 80) + '...)' : 'Absente');
    
  } else {
    console.log('  ❌ Aucune synthèse stratégique trouvée');
    
    // Debug: recherche manuelle
    if (section.includes('Synthèse Stratégique')) {
      console.log('  🔍 Mais "Synthèse Stratégique" trouvé dans la section');
      const lines = section.split('\n').slice(0, 10);
      lines.forEach((line, idx) => {
        if (line.includes('Synthèse')) {
          console.log(`    Ligne ${idx}: ${line.substring(0, 80)}`);
        }
      });
    }
  }
}

console.log('\n✅ Test terminé'); 