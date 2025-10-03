import { 
  MappedReportData,
  OverviewData,
  PerceptionData,
  AudienceData,
  RecommendationData,
  ValuePropData,
  SemanticAnalysisData,
  StrategicSynthesisData
} from '../types/llmo-report';
import { FullReportData, Analysis } from './api';

/**
 * Fonction principale qui mappe les données JSON du backend vers une structure
 * pour l'affichage dans les composants React
 */
export function mapLLMOReportData(data: FullReportData | null): MappedReportData {
  if (!data || !data.report || !data.analyses) {
    console.error('Erreur: Données d\'entrée invalides pour mapLLMOReportData');
    return createEmptyMappedData();
  }

  try {
    const { report, analyses } = data;
    
    // Création des données mappées pour chaque section
    const overview = mapOverviewData(analyses);
    const perceptions = mapPerceptionData(analyses);
    const audiences = mapAudienceData(analyses);
    const recommendations = mapRecommendationData(analyses);
    const valueProps = mapValuePropData(analyses);
    const semanticAnalyses = mapSemanticAnalysisData(analyses);
    const strategicSyntheses = mapStrategicSynthesisData(analyses);

    return {
      url: report.url,
      overview,
      perceptions,
      audiences,
      recommendations,
      valueProps,
      semanticAnalyses,
      strategicSyntheses
    };
  } catch (error) {
    console.error('Erreur lors du mapping des données LLMO:', error);
    return createEmptyMappedData();
  }
}

function mapOverviewData(analyses: Analysis[]): OverviewData {
  const recommendationScores = analyses
    .map(a => a.modules.recommandation?.score)
    .filter((s): s is number => typeof s === 'number' && s >= 0);
  
  const semanticScores = analyses
    .map(a => a.modules.semantique?.score_global)
    .filter((s): s is number => typeof s === 'number' && s >= 0);

  const totalDuration = analyses.reduce((acc, a) => acc + (a.duree || 0), 0);
  
  return {
    totalAnalyses: analyses.length,
    completedAnalyses: analyses.filter(a => a.statut.startsWith('Terminée')).length,
    averageDuration: analyses.length > 0 ? parseFloat((totalDuration / analyses.length).toFixed(1)) : 0,
    averageRecommendationScore: recommendationScores.length > 0 ? Math.round(recommendationScores.reduce((a, b) => a + b, 0) / recommendationScores.length) : 0,
    averageSemanticScore: semanticScores.length > 0 ? Math.round(semanticScores.reduce((a, b) => a + b, 0) / semanticScores.length) : 0,
    llmNames: analyses.map(a => a.llm_name),
  };
}

function mapPerceptionData(analyses: Analysis[]): PerceptionData[] {
  return analyses.map(analysis => ({
    llm: analysis.llm_name,
    mainSubject: analysis.modules.perception?.sujet_principal,
    generalTone: analysis.modules.perception?.ton_general,
    writingStyle: analysis.modules.perception?.style_d_ecriture,
    bias: analysis.modules.perception?.biais,
    synthesis: analysis.modules.perception?.synthese_perception,
    readability: undefined, // Non fourni par le nouveau format
  }));
}

function mapAudienceData(analyses: Analysis[]): AudienceData[] {
  return analyses.map(analysis => ({
    llm: analysis.llm_name,
    audienceDescription: analysis.modules.audience?.description_audience,
    explicitIndicators: analysis.modules.audience?.indices_explicites,
    needsDesires: analysis.modules.audience?.besoins_desires,
    distinctiveSignals: analysis.modules.audience?.signaux_distinctifs,
  }));
}

function mapRecommendationData(analyses: Analysis[]): RecommendationData[] {
  return analyses.map(analysis => ({
    llm: analysis.llm_name,
    score: analysis.modules.recommandation?.score ?? 0,
    justification: analysis.modules.recommandation?.justification ?? '',
    citableElements: analysis.modules.recommandation?.elements_citables,
    llmVisibility: analysis.modules.recommandation?.visibilite_percue_llm,
    suggestions: analysis.modules.recommandation?.suggestions ?? [],
  }));
}

function mapValuePropData(analyses: Analysis[]): ValuePropData[] {
  return analyses.map(analysis => ({
    llm: analysis.llm_name,
    mainValueProp: analysis.modules.valeur?.proposition_valeur_principale,
    perceivedPositioning: analysis.modules.valeur?.positionnement_percu,
    relevanceReliability: analysis.modules.valeur?.pertinence_fiabilite_fraicheur,
    analysisSynthesis: analysis.modules.valeur?.synthese_analyse,
  }));
}

function mapSemanticAnalysisData(analyses: Analysis[]): SemanticAnalysisData[] {
  return analyses.map(analysis => ({
    llm: analysis.llm_name,
    overallScore: analysis.modules.semantique?.score_global ?? 0,
    coherenceScore: analysis.modules.semantique?.coherence_score,
    densityScore: analysis.modules.semantique?.densite_score,
    complexityScore: analysis.modules.semantique?.complexite_score,
    clarityScore: analysis.modules.semantique?.clarte_score,
    // Les champs suivants ne correspondent pas directement, à ajuster si nécessaire
    embeddingScore: undefined,
    tokenizationScore: undefined,
    executiveSummary: undefined,
    improvements: [],
  }));
}

function mapStrategicSynthesisData(analyses: Analysis[]): StrategicSynthesisData[] {
  return analyses.map(analysis => ({
    llm: analysis.llm_name,
    globalSynthesis: analysis.modules.synthese?.synthese_globale,
    quickWins: analysis.modules.synthese?.quick_wins ?? [],
    strategicActions: analysis.modules.synthese?.actions_strategiques ?? [],
    conclusion: analysis.modules.synthese?.conclusion,
  }));
}

function createEmptyMappedData(): MappedReportData {
  return {
    url: '',
    overview: {
      totalAnalyses: 0,
      completedAnalyses: 0,
      averageDuration: 0,
      averageRecommendationScore: 0,
      averageSemanticScore: 0,
      llmNames: [],
    },
    perceptions: [],
    audiences: [],
    recommendations: [],
    valueProps: [],
    semanticAnalyses: [],
    strategicSyntheses: [],
  };
} 