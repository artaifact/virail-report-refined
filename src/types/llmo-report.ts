// Types pour le rapport LLMO complet
export interface LLMOReport {
  url: string;
  analyses_detaillees: AnalyseDetailleeParLLM[];
}

export interface AnalyseDetailleeParLLM {
  llm_name: string;
  statut: string;
  duree: number;
  perception_marque?: PerceptionMarque;
  audience_cible?: AudienceCible;
  probabilite_recommandation?: ProbabiliteRecommandation;
  proposition_valeur?: PropositionValeur;
  analyse_semantique?: AnalyseSemantique;
  synthese_strategique?: SyntheseStrategique;
}

export interface PerceptionMarque {
  perception_generale_par_ia?: {
    sujet_principal?: string;
    ton_general?: string;
    style_d_ecriture?: string;
    biais?: string;
  };
  accessibilite_structure_semantique?: {
    lisibilite_comprehensibilite?: string;
    hierarchie_implicite?: string;
    introduction_du_sujet?: string;
    coherence_thematiques?: string;
  };
  synthese_perception?: string;
}

export interface AudienceCible {
  indices_explicites?: string;
  besoins_desires?: string;
  signaux_distinctifs?: string;
  description_audience?: string;
}

export interface ProbabiliteRecommandation {
  score: number;
  justification: string;
  elements_citables?: string;
  visibilite_percue_llm?: string;
  suggestions?: string[];
}

export interface PropositionValeur {
  proposition_valeur_principale?: string;
  positionnement_percu?: string;
  pertinence_fiabilite_fraicheur?: string;
  synthese_analyse?: string;
}

export interface AnalyseSemantique {
  coherence_semantique?: {
    score: number;
    analyse: string;
    points_forts?: string[];
    points_faibles?: string[];
  };
  densite_informationnelle?: {
    score: number;
    analyse: string;
    ratio_information_bruit?: string;
    concepts_uniques_detectes?: string[];
  };
  complexite_syntaxique?: {
    score: number;
    analyse: string;
    variete_structures?: string;
    qualite_grammaticale?: string;
  };
  clarte_conceptuelle?: {
    score: number;
    analyse: string;
    entites_principales?: string[];
    hierarchie_logique?: string;
  };
  qualite_embeddings?: {
    score: number;
    analyse: string;
    richesse_contextuelle?: string;
    distinctivite_potentielle?: string;
  };
  facilite_tokenisation?: {
    score: number;
    analyse: string;
    compatibilite_tokenizers?: string;
    segmentation_optimale?: string;
  };
  score_global: number;
  resume_executif?: string;
  recommandations_amelioration?: string[];
}

export interface SyntheseStrategique {
  synthese_globale?: string;
  quick_wins?: string[];
  actions_strategiques?: string[];
  conclusion?: string;
}

// Types pour les composants mappés
export interface MappedReportData {
  url: string;
  overview: OverviewData;
  perceptions: PerceptionData[];
  audiences: AudienceData[];
  recommendations: RecommendationData[];
  valueProps: ValuePropData[];
  semanticAnalyses: SemanticAnalysisData[];
  strategicSyntheses: StrategicSynthesisData[];
  analyseCitation?: CitationAnalysisData;
  competitiveAnalysis?: CompetitiveAnalysisData;
}

export interface CitationAnalysisData {
  client_site_url: string;
  client_site_name: string;
  total_queries: number;
  total_llm_calls: number;
  global_probability: number;
  probability_by_model: Record<string, number>;
  total_citations: number;
  citations_by_model: Record<string, number>;
  average_position: number;
  detailed_results: DetailedCitationResult[];
}

export interface DetailedCitationResult {
  query: string;
  llm_model: string;
  citation_detected: boolean;
  citation_text: string | null;
  position_in_response: number | null;
  confidence_score: number;
  mentions: number;
}

export interface OverviewData {
  totalAnalyses: number;
  completedAnalyses: number;
  averageDuration: number;
  averageRecommendationScore: number;
  averageSemanticScore: number;
  llmNames: string[];
}

export interface PerceptionData {
  llm: string;
  mainSubject?: string;
  generalTone?: string;
  writingStyle?: string;
  bias?: string;
  readability?: string;
  hierarchyScore?: number;
  synthesis?: string;
}

export interface AudienceData {
  llm: string;
  explicitIndicators?: string;
  needsDesires?: string;
  distinctiveSignals?: string;
  audienceDescription?: string;
}

export interface RecommendationData {
  llm: string;
  score: number;
  justification: string;
  citableElements?: string;
  llmVisibility?: string;
  suggestions: string[];
}

export interface ValuePropData {
  llm: string;
  mainValueProp?: string;
  perceivedPositioning?: string;
  relevanceReliability?: string;
  analysisSynthesis?: string;
}

export interface SemanticAnalysisData {
  llm: string;
  overallScore: number;
  coherenceScore?: number;
  densityScore?: number;
  complexityScore?: number;
  clarityScore?: number;
  embeddingScore?: number;
  tokenizationScore?: number;
  executiveSummary?: string;
  improvements: string[];
}

export interface StrategicSynthesisData {
  llm: string;
  globalSynthesis?: string;
  quickWins: string[];
  strategicActions: string[];
  conclusion?: string;
}

// Types pour l'analyse concurrentielle
export interface CompetitorData {
  name: string;
  url: string;
  urls: string[];
  average_score: number;
  mentions: number;
  sources: string[];
  score_details: Record<string, number>;
}

export interface MiniLLMResultData {
  competitor_name: string;
  competitor_url: string;
  llm_analysis: {
    analyse_resume: string;
    score_menace: number;
    status: string;
  };
  status: string;
}

export interface UrlScoreDetailsData {
  credibility_authority: {
    score: number;
    details: {
      domain_reputation: string;
      content_expertise: string;
      citation_potential: string;
    };
  };
  structure_readability: {
    score: number;
    details: {
      semantic_structure: string;
      content_clarity: string;
      information_hierarchy: string;
    };
  };
  contextual_relevance: {
    score: number;
    details: {
      topic_alignment: string;
      query_matching: string;
      intent_coverage: string;
    };
  };
  technical_compatibility: {
    score: number;
    details: {
      crawlability: string;
      content_accessibility: string;
      structured_data: string;
    };
  };
  total_score: number;
  grade: string;
  primary_recommendations: string[];
}

export interface BenchmarkResultsData {
  benchmark: {
    classement: Array<{ url: string; score: number }>;
    position_cible: number;
    ecarts_vs_cible: Array<{ url: string; score: number; ecart_vs_cible: number }>;
  };
  url_scores: Record<string, UrlScoreDetailsData | { url: string; error: string }>;
}

export interface CompetitiveAnalysisData {
  version: string;
  session_id: string | null;
  url: string;
  competitors: CompetitorData[];
  mini_llm_results: MiniLLMResultData[];
  benchmark_results: BenchmarkResultsData;
  stats: {
    total_mentions: number;
    unique_competitors: number;
    models_used: string[];
  };
  created_at: string;
} 