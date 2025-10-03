interface AnalysisResult {
  website: {
    url: string;
    title: string;
    description: string;
    status: 'analyzed' | 'analyzing' | 'error';
  };
  metrics: {
    llmoScore: number;
    semanticCoherence: number;
    tokenizationEase: number;
    conceptualClarity: number;
  };
  audience: {
    primaryAge: string;
    profile: string;
    segments: Array<{
      title: string;
      percentage: number;
      description: string;
      characteristics: string[];
    }>;
  };
  content: {
    strengths: string[];
    weaknesses: Array<{
      type: string;
      severity: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      impact: string;
    }>;
    semanticMetrics: Array<{
      category: string;
      score: number;
      status: 'excellent' | 'good' | 'moderate' | 'poor';
      description: string;
    }>;
  };
  recommendations: {
    quickWins: Array<{
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      effort: 'high' | 'medium' | 'low';
      impact: 'high' | 'medium' | 'low';
      timeframe: string;
    }>;
    strategic: Array<{
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      effort: 'high' | 'medium' | 'low';
      impact: 'high' | 'medium' | 'low';
      timeframe: string;
    }>;
  };
}

export const analyzeWebsite = async (url: string): Promise<AnalysisResult> => {
  // Simulation d'analyse - dans un vrai projet, cela ferait appel à une API
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Génération de données basées sur l'URL
  const isVirail = url.includes('virail');
  
  return {
    website: {
      url,
      title: isVirail ? 'Virail.com' : extractDomainName(url),
      description: isVirail ? 'Plateforme de comparaison de transport' : 'Site web analysé',
      status: 'analyzed'
    },
    metrics: {
      llmoScore: isVirail ? 52 : Math.floor(Math.random() * 40) + 30,
      semanticCoherence: isVirail ? 75 : Math.floor(Math.random() * 30) + 50,
      tokenizationEase: isVirail ? 85 : Math.floor(Math.random() * 30) + 60,
      conceptualClarity: isVirail ? 80 : Math.floor(Math.random() * 30) + 55
    },
    audience: {
      primaryAge: isVirail ? '18-55 ans' : '25-45 ans',
      profile: isVirail ? 'Voyageurs internationaux' : 'Utilisateurs en ligne',
      segments: isVirail ? [
        {
          title: "Touristes",
          percentage: 40,
          description: "Voyageurs loisirs recherchant les meilleures offres",
          characteristics: ["Flexibilité horaires", "Sensibilité prix", "Comparaison approfondie"]
        },
        {
          title: "Professionnels",
          percentage: 35,
          description: "Voyageurs d'affaires privilégiant l'efficacité",
          characteristics: ["Rapidité réservation", "Horaires précis", "Services premium"]
        },
        {
          title: "Étudiants",
          percentage: 25,
          description: "Jeunes voyageurs avec budget limité",
          characteristics: ["Prix bas prioritaire", "Transport multimodal", "Flexibilité dates"]
        }
      ] : [
        {
          title: "Utilisateurs principaux",
          percentage: 60,
          description: "Audience cible principale",
          characteristics: ["Actifs en ligne", "Recherche d'information", "Engagement digital"]
        },
        {
          title: "Utilisateurs secondaires",
          percentage: 40,
          description: "Audience secondaire",
          characteristics: ["Visite occasionnelle", "Découverte", "Comparaison"]
        }
      ]
    },
    content: {
      strengths: isVirail ? [
        "Vocabulaire spécialisé cohérent",
        "Structure tokenization-friendly",
        "Concepts clairement définis",
        "Contenu actualisé"
      ] : [
        "Structure cohérente",
        "Contenu organisé",
        "Navigation claire"
      ],
      weaknesses: isVirail ? [
        {
          type: "Structure",
          severity: "high",
          title: "Manque de structure HTML sémantique",
          description: "Absence de balises h1, h2, etc. pour hiérarchiser le contenu",
          impact: "Difficulté pour les IA à comprendre la structure du contenu"
        },
        {
          type: "Données",
          severity: "high",
          title: "Absence de statistiques précises",
          description: "Manque de données chiffrées et sourcées",
          impact: "Réduction de la crédibilité et de la citable par les IA"
        },
        {
          type: "Originalité",
          severity: "medium",
          title: "Peu d'éléments citables originaux",
          description: "Contenu principalement promotionnel sans valeur ajoutée unique",
          impact: "Faible probabilité de recommandation par les IA"
        }
      ] : [
        {
          type: "Structure",
          severity: "medium",
          title: "Structure à optimiser",
          description: "Amélioration possible de la hiérarchie du contenu",
          impact: "Compréhension limitée par les IA"
        },
        {
          type: "Contenu",
          severity: "medium",
          title: "Enrichissement possible",
          description: "Opportunités d'ajout de contenu à valeur ajoutée",
          impact: "Potentiel de recommandation sous-exploité"
        }
      ],
      semanticMetrics: [
        {
          category: "Cohérence sémantique",
          score: isVirail ? 72 : Math.floor(Math.random() * 20) + 60,
          status: "good",
          description: isVirail ? "Vocabulaire cohérent lié au voyage et à la réservation" : "Vocabulaire cohérent dans le domaine"
        },
        {
          category: "Densité informationnelle",
          score: isVirail ? 67 : Math.floor(Math.random() * 15) + 55,
          status: "moderate",
          description: isVirail ? "Information diluée par répétitions" : "Densité d'information modérée"
        },
        {
          category: "Clarté conceptuelle",
          score: isVirail ? 80 : Math.floor(Math.random() * 20) + 65,
          status: "good",
          description: isVirail ? "Concepts clés bien définis" : "Concepts relativement clairs"
        },
        {
          category: "Facilité de tokenisation",
          score: isVirail ? 85 : Math.floor(Math.random() * 15) + 70,
          status: "excellent",
          description: isVirail ? "Structure bien adaptée aux tokenizers" : "Structure compatible avec les IA"
        }
      ]
    },
    recommendations: {
      quickWins: isVirail ? [
        {
          title: "Structurer avec des balises HTML sémantiques",
          description: "Ajouter des balises h1, h2, h3 pour hiérarchiser le contenu",
          priority: "high",
          effort: "low",
          impact: "high",
          timeframe: "1-2 jours"
        },
        {
          title: "Optimiser l'introduction",
          description: "Clarifier immédiatement la proposition de valeur dès les premières lignes",
          priority: "high",
          effort: "low",
          impact: "medium",
          timeframe: "1 jour"
        },
        {
          title: "Réduire les listes répétitives",
          description: "Condenser les listes longues et éliminer les répétitions",
          priority: "medium",
          effort: "low",
          impact: "medium",
          timeframe: "2-3 jours"
        }
      ] : [
        {
          title: "Améliorer la structure HTML",
          description: "Optimiser l'utilisation des balises sémantiques",
          priority: "high",
          effort: "low",
          impact: "medium",
          timeframe: "1-2 jours"
        },
        {
          title: "Enrichir le contenu",
          description: "Ajouter des éléments informatifs à valeur ajoutée",
          priority: "medium",
          effort: "medium",
          impact: "high",
          timeframe: "1-2 semaines"
        }
      ],
      strategic: isVirail ? [
        {
          title: "Intégrer des données chiffrées précises",
          description: "Ajouter des statistiques sourcées",
          priority: "high",
          effort: "high",
          impact: "high",
          timeframe: "2-4 semaines"
        },
        {
          title: "Développer du contenu éditorial",
          description: "Créer des guides de voyage et analyses comparatives",
          priority: "high",
          effort: "high",
          impact: "high",
          timeframe: "1-3 mois"
        }
      ] : [
        {
          title: "Créer du contenu original",
          description: "Développer des analyses et études de cas uniques",
          priority: "high",
          effort: "high",
          impact: "high",
          timeframe: "1-2 mois"
        },
        {
          title: "Optimiser pour les IA",
          description: "Structurer le contenu pour améliorer la compréhension par les IA",
          priority: "medium",
          effort: "medium",
          impact: "high",
          timeframe: "3-6 semaines"
        }
      ]
    }
  };
};

export const analyzeFile = async (file: File): Promise<AnalysisResult> => {
  // Simulation d'analyse de fichier
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  return {
    website: {
      url: file.name,
      title: `Analyse de ${file.name}`,
      description: 'Fichier analysé',
      status: 'analyzed'
    },
    metrics: {
      llmoScore: Math.floor(Math.random() * 50) + 25,
      semanticCoherence: Math.floor(Math.random() * 40) + 40,
      tokenizationEase: Math.floor(Math.random() * 30) + 60,
      conceptualClarity: Math.floor(Math.random() * 35) + 50
    },
    audience: {
      primaryAge: '25-50 ans',
      profile: 'Lecteurs du document',
      segments: [
        {
          title: "Lecteurs principaux",
          percentage: 70,
          description: "Audience cible du document",
          characteristics: ["Intérêt spécialisé", "Recherche d'information", "Expertise domain"]
        },
        {
          title: "Lecteurs occasionnels",
          percentage: 30,
          description: "Consultation ponctuelle",
          characteristics: ["Découverte", "Référence", "Comparaison"]
        }
      ]
    },
    content: {
      strengths: [
        "Contenu structuré",
        "Information organisée",
        "Format adapté"
      ],
      weaknesses: [
        {
          type: "Structure",
          severity: "medium",
          title: "Optimisation possible",
          description: "Structure du document à améliorer",
          impact: "Compréhension limitée"
        }
      ],
      semanticMetrics: [
        {
          category: "Cohérence textuelle",
          score: Math.floor(Math.random() * 30) + 50,
          status: "moderate",
          description: "Cohérence du contenu du document"
        },
        {
          category: "Lisibilité",
          score: Math.floor(Math.random() * 25) + 60,
          status: "good",
          description: "Facilité de lecture et compréhension"
        }
      ]
    },
    recommendations: {
      quickWins: [
        {
          title: "Optimiser la structure",
          description: "Améliorer l'organisation du contenu",
          priority: "medium",
          effort: "low",
          impact: "medium",
          timeframe: "1-3 jours"
        }
      ],
      strategic: [
        {
          title: "Enrichir le contenu",
          description: "Ajouter des éléments différenciants",
          priority: "medium",
          effort: "medium",
          impact: "high",
          timeframe: "2-4 semaines"
        }
      ]
    }
  };
};

// Ajouter l'import pour les analyses concurrentielles
import { getCompetitiveAnalyses } from './competitiveAnalysisService';

// Nouvelle fonction pour récupérer toutes les analyses (LLMO + concurrentielles)
export const getAllAnalyses = () => {
  const llmoAnalyses = getLLMOAnalyses();
  const competitiveAnalyses = getCompetitiveAnalyses();
  
  // Combiner et trier par date
  const allAnalyses = [
    ...llmoAnalyses.map(analysis => ({
      ...analysis,
      type: 'llmo',
      displayName: analysis.website.title || extractDomainName(analysis.website.url)
    })),
    ...competitiveAnalyses.map(analysis => ({
      ...analysis,
      type: 'competitive',
      displayName: extractDomainName(analysis.userSite.url),
      // Adapter la structure pour compatibilité
      website: {
        url: analysis.userSite.url,
        title: extractDomainName(analysis.userSite.url),
        status: 'analyzed'
      },
      metrics: {
        llmoScore: analysis.userSite.report.total_score
      }
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  return allAnalyses;
};

// Fonction pour récupérer les analyses LLMO uniquement (compatibilité)
const getLLMOAnalyses = () => {
  try {
    const stored = localStorage.getItem('llmo_analyses');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const extractDomainName = (url: string): string => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return 'Site Web';
  }
};
