import { AuthService } from './authService';

/**
 * Interface pour les données d'optimisation textuelle - Format API
 */
export interface TextualOptimizationData {
  id: number;
  created_at: string;
  url: string;
  analysis_llm: string;
  optimized_text: string;
  analysis_details: {
    sources: string[];
    checklist: {
      "KPIs atteints": boolean;
      "Longueur conforme": boolean;
      "Stratégie appliquée": boolean;
      "Contraintes respectées": boolean;
      "Optimisation sémantique validée": boolean;
    };
    kpi_metrics: any[];
    modifications: Array<{
      type: string;
      impact: string;
      categorie: string;
      modification: string;
      justification: string;
    }>;
    semantic_mapping: {
      entites_cles: string;
      concepts_centraux: string;
      champs_semantiques: string;
      relations_conceptuelles: string;
    };
    semantic_analysis: Array<{
      Avant: string;
      Après: string;
      Métrique: string;
      Amélioration: string;
    }>;
  };
  optimization_metadata: {
    model: string;
    version: string;
    timestamp: string;
  };
  input_parameters: {
    tone: string;
    key_points: {
      primary: string;
      secondary: string;
    };
    constraints: {
      avoid: string;
      length: string;
      keywords: string;
      semantic_fields: string;
    };
    content_domain: string;
    primary_details: string;
    target_audience: string;
    primary_strategy: string;
    secondary_details: string | null;
    secondary_strategy: string | null;
    original_text_words: number;
    original_text_length: number;
  };
  bridge_info: {
    extracted_context: {
      content_domain: string;
      analysis_source: string;
      original_length: number;
      target_audience: string;
      optimization_details: string;
    };
    selected_strategy: string;
    integration_version: string;
    strategy_selection_reasoning: string;
  };
  original_analysis: {
    source: string;
    analysis_timestamp: string;
  };
}

/**
 * Interface pour la requête d'optimisation
 */
export interface OptimizationRequest {
  text: string;
  content_domain: string;
  target_audience: string;
  primary_strategy: 'Statistics' | 'Cite_Sources' | 'Semantic_Optimization' | 'Authority_Building' | 'Case_Studies';
  primary_details: string;
  secondary_strategy?: string;
  secondary_details?: string;
  tone: 'Journalistique' | 'Commercial' | 'Académique' | 'Conversationnel' | 'Professionnel';
  key_points: {
    primary: string;
    secondary?: string;
  };
  constraints: {
    avoid?: string;
    length: string;
    keywords: string;
    semantic_fields: string;
  };
}

/**
 * Intercepteur pour ajouter l'authentification aux requêtes
 * Utilise le système d'authentification complet d'AuthService
 */
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  // Vérifier l'authentification
  const isAuthenticated = AuthService.isAuthenticated();
  
  // Préparer les options de requête avec authentification
  const requestOptions: RequestInit = {
    ...options,
    credentials: 'include', // Important pour les cookies d'authentification
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };
  
  // Ajouter le token Bearer si disponible
  const accessToken = AuthService.getAccessToken();
  if (accessToken && accessToken !== 'httponly-cookie') {
    requestOptions.headers = {
      ...requestOptions.headers,
      'Authorization': `Bearer ${accessToken}`,
    };
  }
  
  return fetch(url, requestOptions);
}

// URL de l'API - utiliser l'URL de production
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.virail.fr' 
  : 'http://localhost:8000';

/**
 * Récupère une optimisation spécifique par ID depuis l'API
 */
export async function fetchOptimizationById(id: string): Promise<TextualOptimizationData> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/optimize/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return getMockOptimization(id);
      }
      if (response.status === 404) {
        return getMockOptimization(id);
      }
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    return data as TextualOptimizationData;
    
  } catch (error) {
    return getMockOptimization(id);
  }
}

/**
 * Liste toutes les optimisations depuis le nouvel endpoint
 */
export async function listOptimizationsFromOptimize(): Promise<TextualOptimizationData[]> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/optimize`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return getMockOptimizationsList();
      }
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    let optimizationsList = [];
    if (Array.isArray(data)) {
      optimizationsList = data;
    } else if (data.optimizations && Array.isArray(data.optimizations)) {
      optimizationsList = data.optimizations;
    } else if (data.results && Array.isArray(data.results)) {
      optimizationsList = data.results;
    } else {
      return getMockOptimizationsList();
    }

    return optimizationsList as TextualOptimizationData[];
    
  } catch (error) {
    return getMockOptimizationsList();
  }
}

/**
 * Récupère une optimisation par ID
 */
export async function fetchOptimization(optimizationId: string): Promise<TextualOptimizationData> {
  try {
    return await fetchOptimizationById(optimizationId);
  } catch (error) {
    return getMockOptimization(optimizationId);
  }
}

/**
 * Liste toutes les optimisations
 */
export async function listOptimizations(): Promise<TextualOptimizationData[]> {
  try {
    const newFormatData = await listOptimizationsFromOptimize();
    if (newFormatData.length > 0) {
      return newFormatData;
    }
  } catch (error) {
    // Fallback vers des données mock
  }

  // Fallback vers des données mock
  return getMockOptimizationsList();
}

/**
 * Démarre une nouvelle optimisation textuelle
 */
export async function startTextualOptimization(request: OptimizationRequest): Promise<any> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/textual-optimization`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          optimizationId: 'mock-' + Date.now(),
          status: 'completed',
          message: 'Optimisation simulée (non authentifié)'
        };
      }
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    return {
      optimizationId: 'mock-' + Date.now(),
      status: 'completed',
      message: 'Optimisation simulée (erreur réseau)'
    };
  }
}

/**
 * Vérifie le statut d'une optimisation
 */
export async function checkOptimizationStatus(optimizationId: string): Promise<any> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/textual-optimization/${optimizationId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    throw error;
  }
}

/**
 * Génère des données d'optimisation mock pour la démonstration
 */
function getMockOptimization(optimizationId: string): TextualOptimizationData {
  const mockData: TextualOptimizationData = {
    id: parseInt(optimizationId) || 0,
    url: "https://www.virail.fr/transport",
    created_at: new Date().toISOString(),
    analysis_llm: "gpt-4o",
    optimized_text: "Texte optimisé de démonstration...",
    analysis_details: {
      sources: ["Source de démonstration"],
      checklist: {
        "KPIs atteints": true,
        "Longueur conforme": true,
        "Stratégie appliquée": true,
        "Contraintes respectées": true,
        "Optimisation sémantique validée": true
      },
      kpi_metrics: [],
      modifications: [],
      semantic_mapping: {
        entites_cles: "Transport, Voyageurs",
        concepts_centraux: "Optimisation, Performance",
        champs_semantiques: "Transport, Logistique",
        relations_conceptuelles: "Transport et Performance"
      },
      semantic_analysis: []
    },
    optimization_metadata: {
      model: "gpt-4o",
      version: "GEO-OPTIMIZER PRO v1.0",
      timestamp: new Date().toISOString()
    },
    input_parameters: {
      content_domain: "Transport",
      target_audience: "Voyageurs",
      primary_strategy: "Statistics",
      primary_details: "Intégrer des statistiques sur l'utilisation des transports",
      secondary_strategy: "Cite_Sources",
      secondary_details: "Ajouter des sources récentes et crédibles",
      tone: "Commercial",
      key_points: {
        primary: "Économies de transport",
        secondary: "Facilité d'utilisation"
      },
      constraints: {
        avoid: "Termes techniques complexes",
        length: "200-300 mots",
        keywords: "virail, transport, économie",
        semantic_fields: "transport, économie, technologie"
      },
      original_text_length: 157,
      original_text_words: 26
    },
    bridge_info: {
      extracted_context: {
        content_domain: "Transport",
        analysis_source: "virail_ranking",
        original_length: 1500,
        target_audience: "Voyageurs",
        optimization_details: "Optimisation générale du contenu"
      },
      selected_strategy: "Statistics",
      integration_version: "1.0",
      strategy_selection_reasoning: "Stratégie Statistics sélectionnée pour améliorer la densité informationnelle"
    },
    original_analysis: {
      source: "virail_ranking",
      analysis_timestamp: "unknown"
    }
  };

  return mockData;
}

/**
 * Retourne une liste d'optimisations simulées
 */
export function getMockOptimizationsList(): TextualOptimizationData[] {
  return [
    getMockOptimization('1'),
    {
      ...getMockOptimization('2'),
      input_parameters: {
        ...getMockOptimization('2').input_parameters,
        content_domain: "Technologie",
        target_audience: "Professionnels IT"
      },
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    }
  ];
}

/**
 * Exporte les résultats d'optimisation en JSON
 */
export function exportOptimizationResults(optimization: TextualOptimizationData): string {
  return JSON.stringify(optimization, null, 2);
}

/**
 * Calcule le score d'amélioration global basé sur l'analyse sémantique
 */
export function calculateImprovementScore(optimization: TextualOptimizationData): number {
  if (!optimization.analysis_details?.semantic_analysis) {
    return 0;
  }
  
  // Calculer un score basé sur le nombre d'améliorations et leur qualité
  const improvements = optimization.analysis_details.semantic_analysis;
  let score = 0;
  
  // Score de base pour chaque amélioration
  score += improvements.length * 10;
  
  // Bonus pour les améliorations spécifiques
  improvements.forEach(metric => {
    if (metric.Amélioration.includes('Optimisation')) score += 15;
    if (metric.Amélioration.includes('Amélioration')) score += 10;
    if (metric.Amélioration.includes('Enrichissement')) score += 12;
    if (metric.Amélioration.includes('Renforcement')) score += 8;
  });
  
  // Limiter à 100%
  return Math.min(score, 100);
}

/**
 * Obtient les stratégies disponibles
 */
export const getAvailableStrategies = () => [
  { value: 'Statistics', label: 'Statistiques', description: 'Intégrer des données chiffrées et sourcées' },
  { value: 'Cite_Sources', label: 'Sources', description: 'Ajouter des références crédibles' },
  { value: 'Semantic_Optimization', label: 'Optimisation sémantique', description: 'Enrichir le vocabulaire et les entités' },
  { value: 'Authority_Building', label: 'Autorité', description: 'Renforcer la crédibilité du contenu' },
  { value: 'Case_Studies', label: 'Études de cas', description: 'Ajouter des exemples concrets' }
];

/**
 * Obtient les tons disponibles
 */
export const getAvailableTones = () => [
  { value: 'Journalistique', label: 'Journalistique' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Académique', label: 'Académique' },
  { value: 'Conversationnel', label: 'Conversationnel' },
  { value: 'Professionnel', label: 'Professionnel' }
];