import { Analysis } from '@/lib/api';

export interface MatrixRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  impact_score: number; // 0-100
  effort_score: number; // 0-100
  priority: 'critical' | 'high' | 'medium' | 'low';
  category_type: 'quick_win' | 'major_project' | 'fill_in' | 'avoid';
  estimated_time: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  implementation_guide?: string;
}

/**
 * Mappe les données API vers le format de la matrice Impact/Effort
 */
export function mapApiDataToMatrix(analyses: Analysis[]): MatrixRecommendation[] {
  const recommendations: MatrixRecommendation[] = [];

  analyses.forEach((analysis, analysisIndex) => {
    // Extraire les recommandations de chaque module
    const modules = analysis.modules || {};
    
    // Module Audit GEO - Plan d'action
    if (modules.audit_geo?.plan_action_geo) {
      const geoPlan = modules.audit_geo.plan_action_geo;
      if (Array.isArray(geoPlan)) {
        geoPlan.forEach((action, actionIndex) => {
          if (typeof action === 'string' && action.trim()) {
            recommendations.push({
              id: `geo_${analysisIndex}_${actionIndex}`,
              title: `Action GEO: ${action.substring(0, 50)}...`,
              description: action,
              category: 'Audit GEO',
              impact_score: calculateImpactScore(action, 'geo'),
              effort_score: calculateEffortScore(action, 'geo'),
              priority: determinePriority(action, 'geo'),
              category_type: determineCategoryType(action, 'geo'),
              estimated_time: estimateTime(action, 'geo'),
              difficulty_level: determineDifficulty(action, 'geo'),
              implementation_guide: generateImplementationGuide(action, 'geo')
            });
          }
        });
      }
    }

    // Module Recommandation
    if (modules.recommandation?.recommandations) {
      const recs = modules.recommandation.recommandations;
      if (Array.isArray(recs)) {
        recs.forEach((rec, recIndex) => {
          if (typeof rec === 'string' && rec.trim()) {
            recommendations.push({
              id: `rec_${analysisIndex}_${recIndex}`,
              title: `Recommandation: ${rec.substring(0, 50)}...`,
              description: rec,
              category: 'Recommandations',
              impact_score: calculateImpactScore(rec, 'recommendation'),
              effort_score: calculateEffortScore(rec, 'recommendation'),
              priority: determinePriority(rec, 'recommendation'),
              category_type: determineCategoryType(rec, 'recommendation'),
              estimated_time: estimateTime(rec, 'recommendation'),
              difficulty_level: determineDifficulty(rec, 'recommendation'),
              implementation_guide: generateImplementationGuide(rec, 'recommendation')
            });
          }
        });
      }
    }

    // Module Perception - Améliorations
    if (modules.perception?.ameliorations) {
      const amels = modules.perception.ameliorations;
      if (Array.isArray(amels)) {
        amels.forEach((amel, amelIndex) => {
          if (typeof amel === 'string' && amel.trim()) {
            recommendations.push({
              id: `perception_${analysisIndex}_${amelIndex}`,
              title: `Perception: ${amel.substring(0, 50)}...`,
              description: amel,
              category: 'Perception',
              impact_score: calculateImpactScore(amel, 'perception'),
              effort_score: calculateEffortScore(amel, 'perception'),
              priority: determinePriority(amel, 'perception'),
              category_type: determineCategoryType(amel, 'perception'),
              estimated_time: estimateTime(amel, 'perception'),
              difficulty_level: determineDifficulty(amel, 'perception'),
              implementation_guide: generateImplementationGuide(amel, 'perception')
            });
          }
        });
      }
    }

    // Module Valeur - Optimisations
    if (modules.valeur?.optimisations) {
      const opts = modules.valeur.optimisations;
      if (Array.isArray(opts)) {
        opts.forEach((opt, optIndex) => {
          if (typeof opt === 'string' && opt.trim()) {
            recommendations.push({
              id: `valeur_${analysisIndex}_${optIndex}`,
              title: `Valeur: ${opt.substring(0, 50)}...`,
              description: opt,
              category: 'Valeur',
              impact_score: calculateImpactScore(opt, 'valeur'),
              effort_score: calculateEffortScore(opt, 'valeur'),
              priority: determinePriority(opt, 'valeur'),
              category_type: determineCategoryType(opt, 'valeur'),
              estimated_time: estimateTime(opt, 'valeur'),
              difficulty_level: determineDifficulty(opt, 'valeur'),
              implementation_guide: generateImplementationGuide(opt, 'valeur')
            });
          }
        });
      }
    }

    // Module Sémantique - Améliorations
    if (modules.semantique?.ameliorations) {
      const sems = modules.semantique.ameliorations;
      if (Array.isArray(sems)) {
        sems.forEach((sem, semIndex) => {
          if (typeof sem === 'string' && sem.trim()) {
            recommendations.push({
              id: `semantique_${analysisIndex}_${semIndex}`,
              title: `Sémantique: ${sem.substring(0, 50)}...`,
              description: sem,
              category: 'Sémantique',
              impact_score: calculateImpactScore(sem, 'semantique'),
              effort_score: calculateEffortScore(sem, 'semantique'),
              priority: determinePriority(sem, 'semantique'),
              category_type: determineCategoryType(sem, 'semantique'),
              estimated_time: estimateTime(sem, 'semantique'),
              difficulty_level: determineDifficulty(sem, 'semantique'),
              implementation_guide: generateImplementationGuide(sem, 'semantique')
            });
          }
        });
      }
    }
  });

  return recommendations;
}

/**
 * Calcule le score d'impact basé sur le contenu et le type
 */
function calculateImpactScore(content: string, type: string): number {
  const contentLower = content.toLowerCase();
  
  // Mots-clés d'impact élevé
  const highImpactKeywords = [
    'critique', 'essentiel', 'prioritaire', 'urgent', 'important',
    'amélioration significative', 'gain important', 'impact majeur',
    'optimisation critique', 'performance', 'visibilité', 'référencement'
  ];
  
  // Mots-clés d'impact moyen
  const mediumImpactKeywords = [
    'amélioration', 'optimisation', 'mise à jour', 'modernisation',
    'améliorer', 'optimiser', 'renforcer', 'développer'
  ];
  
  // Mots-clés d'impact faible
  const lowImpactKeywords = [
    'détail', 'précision', 'clarification', 'information',
    'documentation', 'explication', 'description'
  ];
  
  let score = 50; // Score de base
  
  // Vérifier les mots-clés d'impact élevé
  if (highImpactKeywords.some(keyword => contentLower.includes(keyword))) {
    score += 30;
  }
  
  // Vérifier les mots-clés d'impact moyen
  if (mediumImpactKeywords.some(keyword => contentLower.includes(keyword))) {
    score += 15;
  }
  
  // Vérifier les mots-clés d'impact faible
  if (lowImpactKeywords.some(keyword => contentLower.includes(keyword))) {
    score -= 20;
  }
  
  // Ajustement selon le type
  switch (type) {
    case 'geo':
      score += 10; // Les actions GEO ont généralement un impact élevé
      break;
    case 'recommendation':
      score += 5;
      break;
    case 'perception':
      score += 8;
      break;
    case 'valeur':
      score += 12;
      break;
    case 'semantique':
      score += 6;
      break;
  }
  
  // Normaliser entre 0 et 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Calcule le score d'effort basé sur le contenu et le type
 */
function calculateEffortScore(content: string, type: string): number {
  const contentLower = content.toLowerCase();
  
  // Mots-clés d'effort élevé
  const highEffortKeywords = [
    'développement', 'création', 'conception', 'implémentation',
    'refonte', 'restructuration', 'migration', 'intégration',
    'système', 'plateforme', 'architecture', 'infrastructure'
  ];
  
  // Mots-clés d'effort moyen
  const mediumEffortKeywords = [
    'mise à jour', 'modification', 'ajout', 'amélioration',
    'optimisation', 'configuration', 'paramétrage', 'ajustement'
  ];
  
  // Mots-clés d'effort faible
  const lowEffortKeywords = [
    'vérification', 'contrôle', 'validation', 'test',
    'correction', 'ajustement mineur', 'petite modification'
  ];
  
  let score = 50; // Score de base
  
  // Vérifier les mots-clés d'effort élevé
  if (highEffortKeywords.some(keyword => contentLower.includes(keyword))) {
    score += 30;
  }
  
  // Vérifier les mots-clés d'effort moyen
  if (mediumEffortKeywords.some(keyword => contentLower.includes(keyword))) {
    score += 15;
  }
  
  // Vérifier les mots-clés d'effort faible
  if (lowEffortKeywords.some(keyword => contentLower.includes(keyword))) {
    score -= 25;
  }
  
  // Ajustement selon le type
  switch (type) {
    case 'geo':
      score += 5; // Les actions GEO peuvent être complexes
      break;
    case 'recommendation':
      score += 10;
      break;
    case 'perception':
      score += 8;
      break;
    case 'valeur':
      score += 15; // Les optimisations de valeur peuvent être complexes
      break;
    case 'semantique':
      score += 12;
      break;
  }
  
  // Normaliser entre 0 et 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Détermine la priorité basée sur le contenu
 */
function determinePriority(content: string, type: string): 'critical' | 'high' | 'medium' | 'low' {
  const contentLower = content.toLowerCase();
  
  // Mots-clés de priorité critique
  if (contentLower.includes('critique') || contentLower.includes('urgent') || contentLower.includes('prioritaire')) {
    return 'critical';
  }
  
  // Mots-clés de priorité élevée
  if (contentLower.includes('important') || contentLower.includes('essentiel') || contentLower.includes('majeur')) {
    return 'high';
  }
  
  // Mots-clés de priorité moyenne
  if (contentLower.includes('amélioration') || contentLower.includes('optimisation') || contentLower.includes('recommandé')) {
    return 'medium';
  }
  
  // Priorité faible par défaut
  return 'low';
}

/**
 * Détermine le type de catégorie basé sur l'impact et l'effort
 */
function determineCategoryType(content: string, type: string): 'quick_win' | 'major_project' | 'fill_in' | 'avoid' {
  const impact = calculateImpactScore(content, type);
  const effort = calculateEffortScore(content, type);
  
  if (impact >= 70 && effort <= 40) return 'quick_win';
  if (impact >= 70 && effort >= 60) return 'major_project';
  if (impact <= 40 && effort <= 40) return 'fill_in';
  return 'avoid';
}

/**
 * Estime le temps requis
 */
function estimateTime(content: string, type: string): string {
  const contentLower = content.toLowerCase();
  
  if (contentLower.includes('simple') || contentLower.includes('rapide') || contentLower.includes('facile')) {
    return '1-2 heures';
  }
  
  if (contentLower.includes('modéré') || contentLower.includes('moyen') || contentLower.includes('standard')) {
    return '1-2 jours';
  }
  
  if (contentLower.includes('complexe') || contentLower.includes('développement') || contentLower.includes('création')) {
    return '1-2 semaines';
  }
  
  if (contentLower.includes('majeur') || contentLower.includes('refonte') || contentLower.includes('système')) {
    return '1-2 mois';
  }
  
  // Estimation par défaut basée sur le type
  switch (type) {
    case 'geo': return '2-4 heures';
    case 'recommendation': return '1-2 jours';
    case 'perception': return '1-2 jours';
    case 'valeur': return '1-2 semaines';
    case 'semantique': return '2-4 heures';
    default: return '1-2 jours';
  }
}

/**
 * Détermine le niveau de difficulté
 */
function determineDifficulty(content: string, type: string): 'beginner' | 'intermediate' | 'advanced' {
  const contentLower = content.toLowerCase();
  
  if (contentLower.includes('simple') || contentLower.includes('facile') || contentLower.includes('rapide')) {
    return 'beginner';
  }
  
  if (contentLower.includes('complexe') || contentLower.includes('développement') || contentLower.includes('technique')) {
    return 'advanced';
  }
  
  return 'intermediate';
}

/**
 * Génère un guide d'implémentation
 */
function generateImplementationGuide(content: string, type: string): string {
  return `Guide d'implémentation pour: ${content.substring(0, 100)}...

1. Analyse des besoins
2. Planification des étapes
3. Implémentation
4. Tests et validation
5. Déploiement

Pour plus de détails, consultez la documentation technique.`;
}
