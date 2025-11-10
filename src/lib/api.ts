import { AuthService } from '@/services/authService';

/**
 * API mock pour simuler la réception des rapports LLMO
 * En attendant l'implémentation de l'API réelle
 */

// Configuration pour le développement
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.viraill.com';



/**
 * Intercepteur pour ajouter automatiquement l'authentification aux requêtes
 */
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  // Si l'URL est pour l'authentification, utiliser fetch normal
  if (url.includes('/auth/')) {
    return fetch(url, options);
  }

  // Pour les autres requêtes, utiliser l'intercepteur d'authentification
  return AuthService.makeAuthenticatedRequest(url, options);
}

export interface ReportResponse {
  id: string;
  url: string;
  status: 'completed' | 'processing' | 'failed';
  createdAt: string;
  duration: number;
  rawData: string;
  metadata: {
    llmsUsed: string[];
    totalAnalyses: number;
    completionRate: number;
    score?: number | null;
  };
}

export interface Report {
  id: number;
  url: string;
  status: string;
  report_path: string;
  report_filename: string;
  report_size: number;
  position_produit_analyse: number;
  score_produit_analyse: number | null;
  created_at: string;
  updated_at: string;
}

export interface AnalysisModule {
  [key: string]: any;
}

export interface Analysis {
  llm_name: string;
  statut: string;
  duree: number;
  erreurs_modules: string[];
  created_at: string;
  modules: {
    perception: AnalysisModule;
    audience: AnalysisModule;
    recommandation: AnalysisModule;
    valeur: AnalysisModule;
    semantique: AnalysisModule;
    audit_geo?: AnalysisModule;
    synthese: AnalysisModule;
  }
}

export interface FullReportData {
  report: Report;
  analyses: Analysis[];
}

/**
 * Récupère un rapport LLMO complet par ID
 */
export async function fetchReport(reportId: string): Promise<FullReportData | null> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/llmo/reports/${reportId}`);

    if (!response.ok) {
      let errorMessage = `Erreur lors du chargement du rapport: ${response.status} ${response.statusText}`;

      // Gestion spécifique des erreurs courantes
      switch (response.status) {
        case 404:
          errorMessage = 'Rapport non trouvé. Il a peut-être été supprimé.';
          break;
        case 403:
          errorMessage = 'Accès refusé. Vous n\'avez pas les permissions pour voir ce rapport.';
          break;
        case 422:
          errorMessage = 'Erreur de traitement du rapport. Le contenu analysé peut être problématique.';
          break;
        case 429:
          errorMessage = 'Trop de requêtes. Veuillez patienter quelques instants.';
          break;
        case 500:
          errorMessage = 'Erreur serveur. Le service est temporairement indisponible.';
          break;
        case 502:
        case 503:
        case 504:
          errorMessage = 'Service indisponible. Veuillez réessayer plus tard.';
          break;
      }

      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    const data: FullReportData = await response.json();
    return data;

  } catch (error) {
    console.error('Erreur lors de la récupération du rapport:', error);
    return null;
  }
}

/**
 * Lance une nouvelle analyse LLMO avec deux appels API en parallèle pour optimiser les performances
 */
export async function startAnalysis(url: string): Promise<{ reportId: string; status: string; metadata?: any } | null> {
  try {
   //console.log('🚀 Lancement de l\'analyse pour:', url);

    // Faire deux appels API en parallèle pour optimiser les performances
    const [analysisResponse, metadataResponse] = await Promise.all([
      // Premier appel : Lancer l'analyse principale
      fetchWithAuth(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      }),
      
      // Deuxième appel : Récupérer les métadonnées ou configurations
      fetchWithAuth(`${API_BASE_URL}/analyze/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url,
          get_metadata: true,
          optimization_level: 'high' 
        }),
      })
    ]);

    // Vérifier que les deux réponses sont OK
    if (!analysisResponse.ok) {
      const errorData = await analysisResponse.json().catch(() => ({ message: 'Erreur lors de l\'analyse principale' }));
      throw new Error(errorData.message || `Erreur HTTP analyse: ${analysisResponse.status}`);
    }

    if (!metadataResponse.ok) {
      console.warn('⚠️ Métadonnées non disponibles, continuons avec l\'analyse principale');
    }

    // Traiter les réponses
    const analysisData = await analysisResponse.json();
    const metadataData = metadataResponse.ok ? await metadataResponse.json() : null;

   //console.log('✅ Réponse de l\'API startAnalysis:', analysisData);
   //console.log('📊 Métadonnées reçues:', metadataData);
    
    // Adapter la réponse selon le format de votre API
    const result = {
      reportId: analysisData.id || analysisData.reportId || analysisData.analysis_id || `analysis-${Date.now()}`,
      status: analysisData.status || 'processing',
      metadata: metadataData || null
    };

   //console.log('📊 Analyse créée avec optimisations:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Erreur lors du lancement de l\'analyse optimisée:', error);
    return null;
  }
}

/**
 * Lance une nouvelle analyse LLMO avec deux appels API séquentiels 
 * (le deuxième appel dépend du premier)
 */
export async function startAnalysisSequential(
  url: string, 
  options: { model?: string } = {}
): Promise<{ reportId: string; status: string; optimizationResults?: any } | null> {
  try {
    const { model = 'gpt-4o' } = options;
   //console.log('🚀 Lancement de l\'analyse séquentielle pour:', url, 'avec modèle:', model);

    // Premier appel : Lancer l'analyse principale
   //console.log('📊 Étape 1: Lancement de l\'analyse LLMO principale...');
    const analysisResponse = await fetchWithAuth(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!analysisResponse.ok) {
      const errorData = await analysisResponse.json().catch(() => ({ message: 'Erreur lors de l\'analyse principale' }));
      throw new Error(errorData.message || `Erreur HTTP analyse: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
   //console.log('✅ Première analyse terminée:', analysisData);

    // Deuxième appel : Optimisation basée sur les résultats du premier
   //console.log('🎯 Étape 2: Lancement de l\'optimisation...');
    let optimizationData = null;
    
    // Essayer plusieurs endpoints d'optimisation
    const optimizationEndpoints = [
      `${API_BASE_URL}/optimize`,
      `${API_BASE_URL}/analyze/optimize`, 
      `${API_BASE_URL}/analyze/enhance`
    ];
    
    for (const endpoint of optimizationEndpoints) {
      try {
       //console.log(`🔄 Tentative d'optimisation via: ${endpoint}`);
        const optimizationResponse = await fetchWithAuth(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            url,
            model,
            analysis_id: analysisData.id || analysisData.reportId || analysisData.analysis_id
          }),
        });

        if (optimizationResponse.ok) {
          optimizationData = await optimizationResponse.json();
         //console.log('✅ Optimisation réussie via:', endpoint, optimizationData);
          break;
        } else {
         //console.log(`⚠️ Échec de l'optimisation via ${endpoint}:`, optimizationResponse.status);
        }
      } catch (error) {
       //console.log(`❌ Erreur lors de l'optimisation via ${endpoint}:`, error);
      }
    }
    
    if (!optimizationData) {
      console.warn('⚠️ Aucune optimisation n\'a réussi, résultats de base conservés');
    }
    
    // Retourner les résultats combinés
    const result = {
      reportId: analysisData.id || analysisData.reportId || analysisData.analysis_id || `analysis-${Date.now()}`,
      status: analysisData.status || 'processing',
      optimizationResults: optimizationData
    };

   //console.log('📊 Analyse séquentielle terminée:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse séquentielle:', error);
    return null;
  }
}

/**
 * Lance une nouvelle analyse sur le port 8001 avec les paramètres étendus
 */
export async function startAnalysisExtended(
  url: string,
  options: {
    min_score?: number;
    min_mentions?: number;
    models?: string[];
    include_raw?: boolean;
  } = {}
): Promise<{ reportId: string; status: string; data?: any } | null> {
  try {
    const {
      min_score = 0.3,
      min_mentions = 1,
      models = ['gpt-5', 'claude-4-sonnet', 'gemini-2.5-pro'],
      include_raw = false
    } = options;

   //console.log('🚀 Lancement de l\'analyse étendue pour:', url, 'avec options:', options);

    const analysisResponse = await fetchWithAuth(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        min_score,
        min_mentions,
        models,
        include_raw
      }),
    });

    if (!analysisResponse.ok) {
      const errorData = await analysisResponse.json().catch(() => ({ message: 'Erreur lors de l\'analyse étendue' }));
      throw new Error(errorData.message || `Erreur HTTP analyse étendue: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
   //console.log('✅ Analyse étendue terminée:', analysisData);
    
    const result = {
      reportId: analysisData.id || analysisData.reportId || analysisData.analysis_id || `analysis-${Date.now()}`,
      status: analysisData.status || 'processing',
      data: analysisData
    };

   //console.log('📊 Analyse étendue créée:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse étendue:', error);
    return null;
  }
}

/**
 * Lance une nouvelle analyse LLMO simple (sans optimisation)
 * Version de fallback si l'optimisation n'est pas disponible
 */
export async function startAnalysisSimple(
  url: string, 
  options: { model?: string } = {}
): Promise<{ reportId: string; status: string } | null> {
  try {
    const { model = 'gpt-4o' } = options;
   //console.log('🚀 Lancement de l\'analyse simple pour:', url, 'avec modèle:', model);

    // Appel unique : Lancer l'analyse principale
    const analysisResponse = await fetchWithAuth(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        url,
        model,
        optimization_level: 'basic' // Indiquer que c'est une analyse simple
      }),
    });

    if (!analysisResponse.ok) {
      const errorData = await analysisResponse.json().catch(() => ({ message: 'Erreur lors de l\'analyse' }));
      throw new Error(errorData.message || `Erreur HTTP analyse: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
   //console.log('✅ Analyse simple terminée:', analysisData);
    
    const result = {
      reportId: analysisData.id || analysisData.reportId || analysisData.analysis_id || `analysis-${Date.now()}`,
      status: analysisData.status || 'processing'
    };

   //console.log('📊 Analyse simple créée:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse simple:', error);
    return null;
  }
}

/**
 * Simule la vérification du statut d'une analyse en cours
 */
export async function checkAnalysisStatus(reportId: string): Promise<{ status: string; progress: number } | null> {
  try {
    // Simuler un délai
    await new Promise(resolve => setTimeout(resolve, 200));

    // Simuler une progression
    const progress = Math.min(100, Math.random() * 100);
    const status = progress >= 100 ? 'completed' : 'processing';

    return {
      status,
      progress
    };
  } catch (error) {
    console.error('Erreur lors de la vérification du statut:', error);
    return null;
  }
}

/**
 * Génère des données de rapport mock pour d'autres sites
 */
function generateMockReportData(domain: string): string {
  return `# RAPPORT D'ANALYSE LLMO POUR : https://www.${domain}
==========================================================

## ANALYSES DÉTAILLÉES PAR LLM
========================================

### Analyse par : gpt-4o
**Statut :** Terminée avec succès (Durée: 98.45s)

#### 1. Perception de la Marque/Produit
{
  "Perception_Generale_par_IA": {
    "Sujet_Principal": "Plateforme de comparaison et réservation de transports ${domain}",
    "Ton_General": "Informatif et commercial, orienté service",
    "Style_d_Ecriture": "Direct et accessible, adapté aux voyageurs",
    "Biais": "Orienté commercial pour la conversion"
  },
  "Synthese_de_la_Perception": "Contenu bien structuré avec proposition de valeur claire pour ${domain}"
}

#### 2. Audience Cible & Segments
Audience principale: Voyageurs planificateurs âgés de 25-55 ans recherchant des solutions de transport optimisées.

#### 3. Probabilité de Recommandation
score=72 justification="Contenu fiable avec bonne autorité dans le domaine du transport. Interface claire et informations utiles."

#### 4. Proposition de Valeur, Pertinence, Fiabilité & Fraîcheur
Proposition de valeur: Simplification de la recherche et comparaison de transports avec garantie du meilleur prix.

#### 5. Analyse sémantique
coherence_semantique={'score': 78, 'analyse': 'Bonne cohérence thématique autour du transport'} 
densite_informationnelle={'score': 75, 'analyse': 'Contenu riche en informations pratiques'}
score_global=76.5

**Synthèse Stratégique & Recommandations LLMO :**
---------------------------------------------
**Quick Wins:**
1. Optimiser les méta-descriptions pour les IA
2. Structurer davantage les données de transport

**Actions Stratégiques:**
1. Développer des contenus éditoriaux sur les voyages
2. Intégrer des données structurées schema.org

### Analyse par : claude-3-sonnet
**Statut :** Terminée avec succès (Durée: 105.31s)

#### 1. Perception de la Marque/Produit
Perception positive d'une plateforme de transport fiable et innovante.

#### 2. Audience Cible & Segments  
Voyageurs soucieux du budget et de l'efficacité, recherchant des options de transport optimales.

#### 3. Probabilité de Recommandation
score=68 justification="Interface utilisateur intuitive mais pourrait bénéficier de plus de contenu éditorial."

#### 4. Proposition de Valeur, Pertinence, Fiabilité & Fraîcheur
Forte proposition de valeur dans la comparaison de transports avec mise à jour régulière des données.

#### 5. Analyse sémantique  
coherence_semantique={'score': 74, 'analyse': 'Structure cohérente mais pourrait être plus fluide'}
score_global=71.0

**Synthèse Stratégique & Recommandations LLMO :**
Optimisation possible de la structure sémantique et enrichissement du contenu éditorial.
`;
}

/**
 * Liste tous les rapports disponibles depuis votre backend
 */
export async function listReports(): Promise<ReportResponse[]> {
  try {
    // Appel authentifié vers votre backend
    const response = await fetchWithAuth(`${API_BASE_URL}/llmo/reports`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Fallback vers les données mock
      return getMockReports();
    }

    const data = await response.json();

    if (!data.reports || !Array.isArray(data.reports)) {
      return getMockReports();
    }

    // Mapper la réponse du backend au format ReportResponse
    return data.reports.map((report: any) => ({
      id: report.id.toString(),
      url: report.url,
      status: report.status === 'success' ? 'completed' : 'failed',
      createdAt: report.created_at,
      duration: report.duration ?? 0,
      rawData: '', // Sera chargé lors de la sélection du rapport
      metadata: {
        // Ces valeurs ne sont pas dans l'API de liste, on met des placeholders
        llmsUsed: report.metadata?.llmsUsed ?? [],
        totalAnalyses: report.metadata?.totalAnalyses ?? 0,
        completionRate: report.metadata?.completionRate ?? (report.status === 'success' ? 100 : 0),
        score: report.score_produit_analyse
      }
    }));
    
  } catch (error) {
    console.error('❌ Erreur réseau ou autre, utilisation des données mock', error);
    // Fallback vers les données mock en cas d'erreur réseau
    return getMockReports();
  }
}

/**
 * Données mock en cas d'erreur avec le backend
 */
function getMockReports(): ReportResponse[] {
  return [
    {
      id: '504606b0bc67caad',
      url: 'https://www.booking.com',
      status: 'completed',
      createdAt: new Date().toISOString(),
      duration: 225.22,
      rawData: '',
      metadata: {
        llmsUsed: ['gpt-4o', 'claude-3-sonnet', 'gemini-pro', 'mixtral-8x7b', 'sonar'],
        totalAnalyses: 5,
        completionRate: 100
      }
    },
    {
      id: 'virail-001',
      url: 'https://www.virail.com',
      status: 'completed',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      duration: 203.76,
      rawData: '',
      metadata: {
        llmsUsed: ['gpt-4o', 'claude-3-sonnet'],
        totalAnalyses: 2,
        completionRate: 100
      }
    }
  ];
}

/**
 * Fonction utilitaire pour choisir automatiquement la meilleure stratégie d'appels API
 */
export async function startOptimizedAnalysis(
  url: string, 
  options: {
    strategy?: 'parallel' | 'sequential' | 'auto';
    includeMetadata?: boolean;
    optimizationLevel?: 'low' | 'medium' | 'high';
    model?: string;
  } = {}
): Promise<{ reportId: string; status: string; metadata?: any; optimizationResults?: any } | null> {
  const { strategy = 'auto', includeMetadata = true, optimizationLevel = 'medium', model } = options;
  
 //console.log(`🎯 Stratégie sélectionnée: ${strategy} pour ${url}${model ? ' avec modèle: ' + model : ''}`);
  
  try {
    // Auto-sélection de la stratégie
    if (strategy === 'auto') {
      // Utiliser parallèle par défaut pour de meilleures performances
      // Sauf si on a besoin d'optimisations avancées
      if (optimizationLevel === 'high') {
        const result = await startAnalysisSequential(url, { model });
        if (result) return result;
        // Fallback vers simple si séquentiel échoue
       //console.log('🔄 Fallback vers analyse simple après échec séquentiel');
        return await startAnalysisSimple(url, { model });
      } else {
        return await startAnalysis(url);
      }
    }
    
    // Stratégie manuelle
    if (strategy === 'sequential') {
      const result = await startAnalysisSequential(url, { model });
      if (result) return result;
      // Fallback vers simple si séquentiel échoue
     //console.log('🔄 Fallback vers analyse simple après échec séquentiel');
      return await startAnalysisSimple(url, { model });
    }
    
    return await startAnalysis(url);
  } catch (error) {
    console.error('❌ Erreur dans startOptimizedAnalysis, fallback vers analyse simple:', error);
    return await startAnalysisSimple(url, { model });
  }
} 