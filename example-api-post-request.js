// 🚀 Exemple de Modification pour Requête POST Réelle

// AVANT (actuellement dans votre code)
export const runCompetitiveAnalysis = async (url: string) => {
  // Charge depuis un fichier JSON statique
  const response = await fetch('/analyse_comparative_alan.json');
  // ...
};

// APRÈS (requête POST vers votre vraie API)
export const runCompetitiveAnalysis = async (url: string) => {
  try {
    console.log('🚀 Lancement analyse concurrentielle pour:', url);

    // REQUÊTE POST VERS VOTRE API RÉELLE
    const response = await fetch(`${API_BASE_URL}/analyze/competitive`, {
      method: 'POST',  // ← MÉTHODE POST
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`, // Si authentification nécessaire
      },
      body: JSON.stringify({  // ← PAYLOAD DE LA REQUÊTE
        url: url,
        analysis_type: 'competitive',
        depth: 'full',
        include_competitors: true,
        max_competitors: 5
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} - ${response.statusText}`);
    }
    
    const apiData = await response.json();
    console.log('✅ Réponse API reçue:', apiData);
    
    // Mapper la réponse de votre API vers le format attendu
    const result = mapApiResponseToAnalysisResult(apiData, url);
    
    // Sauvegarder l'analyse localement
    saveCompetitiveAnalysis(result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse concurrentielle:', error);
    throw new Error('Impossible de lancer l\'analyse concurrentielle');
  }
};

// Fonction utilitaire pour mapper la réponse API
function mapApiResponseToAnalysisResult(apiData, originalUrl) {
  return {
    id: apiData.analysis_id || `comp_${Date.now()}`,
    timestamp: new Date().toISOString(),
    userSite: {
      url: originalUrl,
      domain: extractDomain(originalUrl),
      report: mapToLLMOReport(apiData.user_analysis)
    },
    competitors: apiData.competitors?.map(comp => ({
      url: comp.url,
      domain: extractDomain(comp.url), 
      report: mapToLLMOReport(comp.analysis)
    })) || [],
    summary: {
      userRank: apiData.ranking?.user_rank || 1,
      totalAnalyzed: apiData.ranking?.total_sites || 1,
      strengthsVsCompetitors: apiData.insights?.strengths || [],
      weaknessesVsCompetitors: apiData.insights?.weaknesses || [],
      opportunitiesIdentified: apiData.insights?.opportunities || []
    }
  };
}

// Configuration API
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://api.virail.studio';

function getAuthToken() {
  // Récupérer le token d'authentification depuis le localStorage ou context
  return localStorage.getItem('auth_token') || '';
}

// Exemple de payload que votre bouton enverrait
const examplePayload = {
  url: "https://client-site.com",
  analysis_type: "competitive", 
  depth: "full",
  include_competitors: true,
  max_competitors: 5,
  webhook_url: "https://client-site.com/webhook/analysis-complete", // Optionnel
  priority: "normal" // normal | high | urgent
};

// Exemple de réponse attendue de votre API
const exampleApiResponse = {
  analysis_id: "comp_1704067200000",
  status: "completed", // processing | completed | failed
  processing_time: "4.2s",
  user_analysis: {
    url: "https://client-site.com",
    total_score: 78,
    grade: "Bien optimisé",
    credibility_authority: { score: 16, details: {...} },
    structure_readability: { score: 18, details: {...} },
    contextual_relevance: { score: 20, details: {...} },
    technical_compatibility: { score: 13, details: {...} },
    recommendations: [...]
  },
  competitors: [
    {
      url: "https://competitor1.com",
      analysis: {
        total_score: 82,
        grade: "Très bien optimisé",
        // ... scores détaillés
      }
    }
  ],
  ranking: {
    user_rank: 2,
    total_sites: 4
  },
  insights: {
    strengths: ["Pertinence contextuelle exceptionnelle"],
    weaknesses: ["Compatibilité technique à améliorer"],
    opportunities: ["Optimisation des données structurées"]
  }
};
