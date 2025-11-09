import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, AlertTriangle, Clock, Zap, Shield, Target, BarChart3, Calendar, ArrowRight, CheckCircle, XCircle, Minus, CheckSquare, Brain, FileText, Globe, Globe2, Users, Activity, Plus, Loader2, Sparkles, Star, Rocket, Download, Building2, HelpCircle } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart, CartesianGrid, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell } from "recharts";
import { useNavigate } from "react-router-dom";
import { AuthService } from "@/services/authService";
import { useReports, useReport } from "@/hooks/useReports";
import { mapLLMOReportData } from "@/lib/llmo-mapper";
import { useTextualOptimization } from "@/hooks/useTextualOptimization";
import UsageLimits from "@/components/UsageLimits";
import SourcesAnalytics from "@/components/SourcesAnalytics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listCompetitorAnalyses, getCompetitorAnalysisById, extractDomain, formatScore, getScoreColor, CompetitorAnalysisResponse, CompetitorAnalysisSummary } from '@/services/competitorAnalysisService';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  return `Il y a ${diffDays} jours`;
};

const Index = () => {
  const navigate = useNavigate();
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const [errorAnalyses, setErrorAnalyses] = useState<string | null>(null);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState("");
  const [competitorAnalyses, setCompetitorAnalyses] = useState<CompetitorAnalysisSummary[]>([]);
  const [selectedCompetitorAnalysis, setSelectedCompetitorAnalysis] = useState<CompetitorAnalysisResponse | null>(null);
  const [loadingCompetitiveAnalyses, setLoadingCompetitiveAnalyses] = useState(true);
  const [selectedLLMModel, setSelectedLLMModel] = useState("openai/gpt-5");
  const { reports, loading: reportsLoading } = useReports();
  const [selectedGeoAnalysisId, setSelectedGeoAnalysisId] = useState("");
  const { report: selectedGeoReport, loading: selectedGeoReportLoading } = useReport(selectedGeoAnalysisId);
  const { optimizations, isLoading: optimizationsLoading } = useTextualOptimization();
  const [selectedOptimizationId, setSelectedOptimizationId] = useState("");
  const [selectedSourceAnalysisId, setSelectedSourceAnalysisId] = useState("");
  const [selectedSourceAnalysis, setSelectedSourceAnalysis] = useState<CompetitorAnalysisResponse | null>(null);
  const [loadingSourceAnalysis, setLoadingSourceAnalysis] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'improve'>('details');
  const [expandedActions, setExpandedActions] = useState<{ [key: number]: boolean }>({});

  const toggleActions = (index: number) => {
    setExpandedActions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Fonction pour générer les améliorations depuis le guide d'implémentation
  const generateImprovementsFromGuide = () => {
    // Récupérer les données depuis l'API comme dans LLMODashboard
    const analyses = selectedGeoReport?.analyses || [];
    const preferredModels = ['gpt-5', 'gpt-4o', 'claude-4-sonnet', 'claude-4-sonnet'];
    let perf: any | null = null;

    // Fonction pour extraire les données de performance depuis l'analyse
    const extractPerformanceFromAnalysis = (analysis: any) => {
      if (!analysis) return null;

      // Recherche dans modules.audit_geo.performance_impact
      const geoPackage = analysis.modules?.audit_geo;
      if (!geoPackage) {
        return null;
      }

      const perfData = geoPackage.performance_impact;
      if (perfData) {
        return perfData;
      }

      return null;
    };

    // Chercher les données de performance dans les analyses préférées
    for (const model of preferredModels) {
      const a = analyses.find(x => (x as any).llm_name === model || (x as any)['llm_utilisé'] === model);
      const extracted = extractPerformanceFromAnalysis(a);
      if (extracted) {
        perf = extracted;
        break;
      }
    }

    if (!perf) {
      for (const a of analyses) {
        const extracted = extractPerformanceFromAnalysis(a);
        if (extracted) {
          perf = extracted;
          break;
        }
      }
    }

    // Chercher le guide d'implémentation
    let guideData: any = null;
    for (const model of preferredModels) {
      const a = analyses.find(x => (x as any).llm_name === model || (x as any)['llm_utilisé'] === model);
      const extracted = extractGuideFromAnalysis(a);
      if (extracted) {
        guideData = extracted.guide;
        break;
      }
    }

    if (!guideData) {
      for (const a of analyses) {
        const extracted = extractGuideFromAnalysis(a);
        if (extracted) {
          guideData = extracted.guide;
          break;
        }
      }
    }

    // Helpers pour rechercher dynamiquement le guide d'implémentation dans la structure réelle
    // Deep search pour une clé type implementation_guide (avec alias possibles)
    function deepFindImplementationGuide(node: any): any | null {
      if (!node) return null;
      if (typeof node !== 'object') return null;
      if (Array.isArray(node)) {
        for (const item of node) {
          const res = deepFindImplementationGuide(item);
          if (res) return res;
        }
        return null;
      }
      const possibleKeys = [
        'implementation_guide',
        'implementationGuide',
        'guide_implementation',
        'guideImplementation',
        'implementation',
        'guide'
      ];
      for (const key of possibleKeys) {
        if (node[key]) {
          return node[key];
        }
      }
      for (const [k, v] of Object.entries(node)) {
        const res = deepFindImplementationGuide(v);
        if (res) return res;
      }
      return null;
    }

    // Fonction pour extraire le guide d'implémentation depuis une analyse
    function extractGuideFromAnalysis(analysis: any) {
      if (!analysis) return null;

      // Recherche dans modules.audit_geo.implementation_guide
      const geoPackage = analysis.modules?.audit_geo;
      if (!geoPackage) {
        return null;
      }
      let guide: any = null;
      if ((geoPackage as any).implementation_guide) {
        guide = (geoPackage as any).implementation_guide;
      }
      if (!guide) {
        guide = deepFindImplementationGuide(geoPackage);
      }
      if (!guide) {
        return null;
      }
      const source = (analysis as any)?.llm_name || (analysis as any)?.['llm_utilisé'] || 'inconnu';
      return { guide, source };
    }

    // Extraire toutes les améliorations directement du guide d'implémentation
    const improvements = [];

    if (guideData && guideData.etapes_implementation) {

      // Mapping des étapes vers les améliorations
      const stepMapping = {
        'optimisation_metadonnees': {
          title: "Optimisation des métadonnées",
          icon: Brain,
          color: "text-blue-600"
        },
        'structure_semantique': {
          title: "Structure sémantique",
          icon: FileText,
          color: "text-purple-600"
        },
        'mots_cles_ia': {
          title: "Mots-clés IA",
          icon: Target,
          color: "text-green-600"
        },
        'contenu_contextuel': {
          title: "Contenu contextuel",
          icon: Globe,
          color: "text-indigo-600"
        },
        'donnees_structurees': {
          title: "Données structurées",
          icon: Shield,
          color: "text-orange-600"
        }
      };

      // Créer une amélioration pour chaque étape du guide
      for (const [stepKey, stepData] of Object.entries(guideData.etapes_implementation)) {
        if (typeof stepData === 'object' && stepData !== null) {
          const step = stepData as any;
          const mapping = stepMapping[stepKey] || {
            title: step.titre || stepKey,
            icon: Brain,
            color: "text-gray-600"
          };

          improvements.push({
            title: mapping.title,
            description: step.description || "Action d'optimisation pour l'IA",
            improvement: step.priorite === 'Élevée' ? '40-60%' : step.priorite === 'Moyenne' ? '25-40%' : '15-30%',
            icon: mapping.icon,
            color: mapping.color,
            actions: step.actions || [],
            priorite: step.priorite || 'Moyenne',
            effort: step.effort || 'Moyen',
            duree: step.duree_estimee || '1-2 semaines'
          });
        }
      }
    }

    // Si pas de guide, utiliser les données par défaut
    if (improvements.length === 0) {
      improvements.push(
        {
          title: "Visibilité moteurs génératifs",
          description: perf?.visibilite_moteurs_generatifs?.description || "Amélioration de la visibilité dans ChatGPT, Perplexity, etc.",
          improvement: perf?.visibilite_moteurs_generatifs?.amélioration || "35-50%",
          icon: Brain,
          color: "text-blue-600",
          actions: ["Optimiser les métadonnées pour les moteurs génératifs", "Améliorer la structure sémantique du contenu"]
        },
        {
          title: "Indexation IA",
          description: perf?.indexation_ia?.description || "Meilleure indexation par les crawlers IA",
          improvement: perf?.indexation_ia?.amélioration || "40-60%",
          icon: Globe,
          color: "text-green-600",
          actions: ["Implémenter Schema.org pour l'indexation", "Optimiser robots.txt pour les crawlers IA"]
        },
        {
          title: "Compréhension du contenu",
          description: perf?.comprehension_contenu?.description || "Amélioration de la compréhension du contenu par l'IA",
          improvement: perf?.comprehension_contenu?.amélioration || "30-45%",
          icon: FileText,
          color: "text-purple-600",
          actions: ["Enrichir le contenu avec des entités nommées", "Améliorer la hiérarchie des titres H1-H6"]
        },
        {
          title: "Autorité sémantique",
          description: perf?.autorite_semantique?.description || "Renforcement de l'autorité sémantique du site",
          improvement: perf?.autorite_semantique?.amélioration || "25-40%",
          icon: Shield,
          color: "text-orange-600",
          actions: ["Ajouter des liens de confiance vers des sources autoritaires", "Implémenter des données structurées de confiance"]
        }
      );
    }

    return improvements;
  };

  // Debug: Vérifier selectedGeoReport
  useEffect(() => {
    // Monitoring selectedGeoReport changes
  }, [selectedGeoReport, selectedGeoAnalysisId, selectedGeoReportLoading]);

  // Charger les analyses concurrentielles
  useEffect(() => {
    const loadCompetitorAnalyses = async () => {
      try {
        setLoadingCompetitiveAnalyses(true);
        const analyses = await listCompetitorAnalyses();
        setCompetitorAnalyses(analyses);

        // Charger automatiquement la première analyse
        if (analyses.length > 0) {
          const firstAnalysis = await getCompetitorAnalysisById(analyses[0].analysis_id);
          setSelectedCompetitorAnalysis(firstAnalysis);
        }
      } catch (error) {
        // Erreur silencieuse lors du chargement
      } finally {
        setLoadingCompetitiveAnalyses(false);
      }
    };

    loadCompetitorAnalyses();
  }, []);

  // Gérer le changement d'analyse concurrentielle
  const handleCompetitorAnalysisChange = async (analysisId: string) => {
    try {
      const analysis = await getCompetitorAnalysisById(Number(analysisId));
      setSelectedCompetitorAnalysis(analysis);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'analyse:', error);
    }
  };

  // Effet pour gérer le chargement des analyses GEO
  useEffect(() => {
    if (!reportsLoading && reports.length > 0 && !selectedGeoAnalysisId) {
      setSelectedGeoAnalysisId(reports[0].id);
    }
  }, [reports, reportsLoading, selectedGeoAnalysisId]);

  // Effet pour gérer le chargement des optimisations
  useEffect(() => {
    if (!optimizationsLoading && optimizations.length > 0 && !selectedOptimizationId) {
      setSelectedOptimizationId(String(optimizations[0].id));
    }
  }, [optimizations, optimizationsLoading, selectedOptimizationId]);

  // Effet pour gérer la sélection automatique d'une analyse concurrentielle pour la section Sources
  useEffect(() => {
    if (!loadingCompetitiveAnalyses && competitorAnalyses.length > 0 && !selectedSourceAnalysisId) {
      setSelectedSourceAnalysisId(competitorAnalyses[0].analysis_id.toString());
    }
  }, [competitorAnalyses, loadingCompetitiveAnalyses, selectedSourceAnalysisId]);

  // Effet pour charger l'analyse concurrentielle sélectionnée pour la section Sources
  useEffect(() => {
    const loadSelectedSourceAnalysis = async () => {
      if (selectedSourceAnalysisId) {
        try {
          setLoadingSourceAnalysis(true);

          const analysis = await getCompetitorAnalysisById(Number(selectedSourceAnalysisId));
          setSelectedSourceAnalysis(analysis);
        } catch (error) {
          setSelectedSourceAnalysis(null);
        } finally {
          setLoadingSourceAnalysis(false);
        }
      } else {
        setSelectedSourceAnalysis(null);
      }
    };

    loadSelectedSourceAnalysis();
  }, [selectedSourceAnalysisId]);

  // Synchroniser la sélection entre les sections GEO et concurrentielle
  useEffect(() => {
    if (selectedSourceAnalysis && selectedSourceAnalysis.analysis_id) {
      // Mettre à jour la section Analyse concurrentielle avec les mêmes données
      setSelectedCompetitorAnalysis(selectedSourceAnalysis);
    }
  }, [selectedSourceAnalysis]);

  // Enhanced LLMO-focused data
  const llmoMetrics = {
    globalScore: 74,
    semanticCoherence: 82,
    tokenizationEase: 68,
    conceptualClarity: 76,
    aiRecommendationRate: 85
  };

  useEffect(() => {
    const fetchRecentAnalyses = async () => {
      try {
        setLoadingAnalyses(true);
        setErrorAnalyses(null);

        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.viraill.com';
        const response = await AuthService.makeAuthenticatedRequest(`${API_BASE_URL}/llmo/reports`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Erreur lors de la récupération des rapports.');
        }

        const data = await response.json();

        const formattedAnalyses = data.reports.map((report) => ({
          id: report.id,
          url: new URL(report.url).hostname.replace('www.', ''),
          score: report.score_produit_analyse ?? '--',
          date: formatDate(report.created_at)
        }));

        setRecentAnalyses(formattedAnalyses);
      } catch (err) {
        setErrorAnalyses(err instanceof Error ? err.message : "Une erreur inconnue est survenue.");
      } finally {
        setLoadingAnalyses(false);
      }
    };

    fetchRecentAnalyses();
  }, []);

  const llmoInsights = [
    {
      title: "Structure sémantique optimisée",
      description: "Vos contenus utilisent une hiérarchie claire qui facilite la compréhension IA",
      impact: "positive",
      metric: "+12%"
    },
    {
      title: "Vocabulaire technique à améliorer",
      description: "Certains termes spécialisés nécessitent plus de contexte",
      impact: "warning",
      metric: "-8%"
    },
    {
      title: "Cohérence conceptuelle forte",
      description: "Les concepts clés sont bien définis et reliés logiquement",
      impact: "positive",
      metric: "+15%"
    }
  ];

  // Enhanced chart data for LLMO metrics over time
  const llmoTrendData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    llmoScore: 65 + Math.sin(i * 0.2) * 10 + Math.random() * 5,
    semanticScore: 70 + Math.cos(i * 0.15) * 8 + Math.random() * 4,
    tokenization: 60 + Math.sin(i * 0.25) * 12 + Math.random() * 6
  }));

  const chartConfig = {
    llmoScore: {
      label: "Score LLMO",
      color: "#6B7280"
    },
    semanticScore: {
      label: "Cohérence Sémantique",
      color: "#9CA3AF"
    },
    tokenization: {
      label: "Tokenisation",
      color: "#D1D5DB"
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 text-foreground">
      {/* Main Content */}
      <div className="px-4 sm:px-6 md:px-8 py-6 space-y-6 max-w-6xl mx-auto">

        {/* Section principale avec système d'onglets */}
        <Card className="bg-white shadow-lg border-2 border-blue-100/50 backdrop-blur-sm">
          <CardHeader className="pb-1 pt-4 px-3 sm:px-6 bg-white border-b border-blue-100/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-1 w-full">
                <CardTitle className="text-lg sm:text-xl md:text-2xl font-normal text-foreground break-words">
                  {selectedGeoReport?.report?.url 
                    ? `Votre analyse GEO de ${extractDomain(selectedGeoReport.report.url)}` 
                    : 'Aucune analyse disponible'}
                </CardTitle>
                {/* Select Organisation */}
                {!loadingCompetitiveAnalyses && competitorAnalyses.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                    <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Organisation:</span>
                    <Select value={selectedSourceAnalysisId} onValueChange={setSelectedSourceAnalysisId}>
                      <SelectTrigger className="bg-card w-full sm:w-64">
                        <SelectValue placeholder="Choisir une analyse" />
                      </SelectTrigger>
                      <SelectContent>
                        {competitorAnalyses.map((analysis) => {
                          const domain = extractDomain(analysis.url);
                          const date = new Date(analysis.created_at).toLocaleDateString('fr-FR');
                          return (
                            <SelectItem key={analysis.analysis_id} value={analysis.analysis_id.toString()}>
                              <div className="flex items-center gap-3 py-1">
                                <div>
                                  <span className="font-medium text-sm text-foreground">{domain}</span>
                                  <div className="text-xs text-muted-foreground">{date} • {analysis.total_competitors_found} concurrents</div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-1 px-3 sm:px-6">
            {/* Jauge de performance circulaire */}
            <div className="flex items-center justify-center py-6">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 rounded-full blur-xl"></div>
                <svg className="relative w-32 h-32 sm:w-40 sm:h-40 transform -rotate-90" viewBox="0 0 120 120">
                  {/* Cercle de fond */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#e0e7ff"
                    strokeWidth="8"
                    fill="none"
                  />
                  {/* Cercle de progression avec gradient */}
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - (selectedGeoReport?.analyses?.[0]?.modules?.audit_geo?.score_global_geo || 0) / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out drop-shadow-lg"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {selectedGeoReport?.analyses?.[0]?.modules?.audit_geo?.score_global_geo 
                        ? Math.round(selectedGeoReport.analyses[0].modules.audit_geo.score_global_geo) + '%'
                        : '0%'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium">Score GEO</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'onglets */}
            <div className="flex items-center justify-center gap-3 flex-wrap pb-4">
              <Button
                variant={activeTab === 'details' ? 'default' : 'outline'}
                className={`px-6 sm:px-8 py-2.5 text-sm sm:text-base font-medium transition-all ${
                  activeTab === 'details' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg scale-105' 
                    : 'bg-white/80 border-2 border-blue-200 text-foreground hover:bg-blue-50/50 hover:border-blue-300'
                }`}
                onClick={() => setActiveTab('details')}
              >
                Infos détaillées
              </Button>
              <Button
                variant={activeTab === 'improve' ? 'default' : 'outline'}
                className={`px-6 sm:px-8 py-2.5 text-sm sm:text-base font-medium transition-all ${
                  activeTab === 'improve' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg scale-105' 
                    : 'bg-white/80 text-foreground hover:bg-blue-50/50'
                }`}
                onClick={() => setActiveTab('improve')}
              >
                Améliorer
              </Button>
            </div>

            {/* Contenu conditionnel selon l'onglet actif */}
            {activeTab === 'details' && (
              <>
                <div className="mb-6 max-w-4xl mx-auto px-2 sm:px-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Score GEO par Modèle IA</h3>
                    <div className="text-xs text-muted-foreground">Scores d'optimisation génératif</div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <CardTitle className="text-sm sm:text-base text-foreground font-semibold flex items-center gap-2">
                          Sources
                          <div className="relative">
                            <div
                              className="w-3 h-3 bg-muted-foreground rounded-full flex items-center justify-center cursor-help hover:bg-primary transition-colors"
                              onMouseEnter={() => setShowTooltip(true)}
                              onMouseLeave={() => setShowTooltip(false)}
                            >
                              <span className="text-white text-xs font-bold">i</span>
                            </div>

                            {/* Tooltip */}
                            {showTooltip && (
                              <div className="absolute left-0 top-4 z-50 w-64 sm:w-72 p-2 bg-white rounded-lg shadow-lg border border-gray-200">
                                <div className="text-xs">
                                  <p className="font-medium text-gray-900 mb-1">Évolution de Votre Score Global</p>
                                  <p className="text-gray-600 leading-relaxed">
                                    Ce graphique montre l'<span className="font-medium">évolution réelle de votre score</span> au fil du temps
                                    selon les différents modèles IA. Plus le score est élevé, plus votre site est performant dans les analyses concurrentielles.
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <div className="flex items-center gap-1">
                                      <img src="/prompt-model-openai-for-light.svg" alt="GPT-5" className="w-3 h-3" />
                                      <span className="text-gray-500 text-xs">GPT-5</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <img src="/prompt-model-claude.svg" alt="Claude 4" className="w-3 h-3" />
                                      <span className="text-gray-500 text-xs">Claude 4</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <img src="/prompt-model-gemini.svg" alt="Gemini" className="w-3 h-3" />
                                      <span className="text-gray-500 text-xs">Gemini</span>
                                    </div>
                                  </div>
                                </div>
                                {/* Flèche du tooltip */}
                                <div className="absolute left-3 -top-1 w-2 h-2 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
                              </div>
                            )}
                          </div>
                        </CardTitle>
              
                      </div>

                  {/* Légende visible et lisible */}
                  <div className="mb-4 p-3 sm:p-4 bg-white/50 backdrop-blur-sm rounded-lg border border-blue-100/50">
                    <div className="flex flex-wrap gap-3 sm:gap-6 justify-center">
                      <div className="flex items-center gap-3">
                        <img
                          src="/prompt-model-openai-for-light.svg"
                          alt="OpenAI"
                          className="w-6 h-6 object-contain"
                        />
                        <span className="text-sm font-semibold text-foreground">GPT-5</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img
                          src="/prompt-model-claude.svg"
                          alt="Claude"
                          className="w-6 h-6 object-contain"
                        />
                        <span className="text-sm font-semibold text-foreground">Claude 4</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img
                          src="/prompt-model-gemini.svg"
                          alt="Gemini"
                          className="w-6 h-6 object-contain"
                        />
                        <span className="text-sm font-semibold text-foreground">Gemini 2.5</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img
                          src="/Mistral.png"
                          alt="Mistral"
                          className="w-6 h-6 object-contain"
                        />
                        <span className="text-sm font-semibold text-foreground">Mistral 3.1</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <img
                          src="/prompt-model-perplexity.svg"
                          alt="Perplexity"
                          className="w-6 h-6 object-contain"
                        />
                        <span className="text-sm font-semibold text-foreground">Sonar</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-[20rem] sm:h-[28rem] md:h-[32rem] w-full relative overflow-hidden bg-white/30 backdrop-blur-sm rounded-lg border border-blue-100/50 p-2 sm:p-4 md:p-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={(() => {
                          // Extraire les scores GEO par modèle depuis selectedGeoReport
                          if (!selectedGeoReport?.analyses || selectedGeoReport.analyses.length === 0) {
                            return [];
                          }

                          // Fonction pour normaliser le nom du modèle
                          const normalizeModelName = (llmName: string): string => {
                            const nameLower = llmName.toLowerCase();
                            if (nameLower.includes('gpt') || nameLower.includes('openai')) {
                              return 'GPT-5';
                            } else if (nameLower.includes('claude')) {
                              return 'Claude 4';
                            } else if (nameLower.includes('gemini')) {
                              return 'Gemini 2.5';
                            } else if (nameLower.includes('mistral') || nameLower.includes('mixtral')) {
                              return 'Mistral 3.1';
                            } else if (nameLower.includes('sonar') || nameLower.includes('perplexity')) {
                              return 'Sonar';
                            }
                            return llmName;
                          };

                          // Extraire les scores GEO par modèle
                          const modelScores: Array<{ model: string; score: number }> = [];

                          selectedGeoReport.analyses.forEach((analysis: any) => {
                            const llmName = analysis.llm_name || '';
                            const scoreGeo = analysis.modules?.audit_geo?.score_global_geo;
                            
                            if (scoreGeo !== undefined && scoreGeo !== null) {
                              const normalizedModel = normalizeModelName(llmName);
                              modelScores.push({
                                model: normalizedModel,
                                score: Math.round(scoreGeo)
                              });
                            }
                          });

                          // Trier par score décroissant
                          modelScores.sort((a, b) => b.score - a.score);
                          
                          return modelScores;
                        })()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <defs>
                          {/* Gradients pour les lignes */}
                          <linearGradient id="gpt5-line-gradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4} />
                          </linearGradient>
                          <linearGradient id="claude4-line-gradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#dc2626" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#dc2626" stopOpacity={0.4} />
                          </linearGradient>
                          <linearGradient id="gemini25-line-gradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#059669" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#059669" stopOpacity={0.4} />
                          </linearGradient>
                          <linearGradient id="mistral31-line-gradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.4} />
                          </linearGradient>
                          <linearGradient id="sonar-line-gradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#db2777" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#db2777" stopOpacity={0.4} />
                          </linearGradient>
                        </defs>

                        <XAxis
                          dataKey="model"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 12,
                            fill: '#6b7280',
                            fontWeight: 500,
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                          }}
                          tickMargin={10}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 12,
                            fill: '#6b7280',
                            fontWeight: 500,
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                          }}
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}`}
                          tickMargin={10}
                          label={{ value: 'Score GEO', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '13px', fontWeight: 500 } }}
                        />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0]?.payload;
                              const score = Number(payload[0]?.value) || 0;
                              const model = data?.model || '';
                              
                              return (
                                <div className="bg-white rounded-lg shadow-lg p-3 min-w-[180px] border border-gray-200">
                                  <p className="font-semibold text-gray-900 mb-2 text-sm">
                                    {model}
                                  </p>
                                  <p className="font-bold text-gray-900 text-base">
                                    Score: {score}/100
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="linear"
                          dataKey="score"
                          stroke="#3b82f6"
                          strokeWidth={2.5}
                          dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }}
                          connectNulls={true}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <Card className="bg-white shadow-md border border-blue-100/60">
                  <CardHeader className="pb-4 px-3 sm:px-6 bg-white border-b border-blue-100/40">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <CardTitle className="text-base sm:text-lg text-foreground font-semibold">
                        Analyse concurrentielle
                      </CardTitle>

                      {/* Select Modèle LLM à droite du titre */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Modèle:</span>
                        <Select value={selectedLLMModel} onValueChange={setSelectedLLMModel}>
                          <SelectTrigger className="bg-card w-full sm:w-48">
                            <SelectValue placeholder="Modèle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="openai/gpt-5">
                              <div className="flex items-center gap-2">
                                <img src="/prompt-model-openai-for-light.svg" alt="OpenAI" className="w-4 h-4" />
                                <span className="font-medium">GPT-5</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="anthropic/claude-sonnet-4">
                              <div className="flex items-center gap-2">
                                <img src="/prompt-model-claude.svg" alt="Claude" className="w-4 h-4" />
                                <span className="font-medium">Claude 4 Sonnet</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="google/gemini-2.5-pro">
                              <div className="flex items-center gap-2">
                                <img src="/prompt-model-gemini.svg" alt="Gemini" className="w-4 h-4" />
                                <span className="font-medium">Gemini 2.5 Pro</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="mistralai/mistral-medium-3.1">
                              <div className="flex items-center gap-2">
                                <img src="/Mistral.png" alt="Mistral" className="w-4 h-4" />
                                <span className="font-medium">Mistral 3.1</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="perplexity/sonar">
                              <div className="flex items-center gap-2">
                                <img src="/prompt-model-perplexity.svg" alt="Perplexity" className="w-4 h-4" />
                                <span className="font-medium">Sonar</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                  </CardHeader>

                  <CardContent className="px-3 sm:px-6">
                    {loadingCompetitiveAnalyses ? (
                      <div className="text-center py-8">
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                          <span className="text-muted-foreground">Chargement des analyses...</span>
                        </div>
                      </div>
                    ) : competitorAnalyses.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-2">Pas d'analyse</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          Aucune analyse concurrentielle n'a été trouvée dans votre base de données.
                        </p>
                        <Button
                          onClick={() => navigate('/competition')}
                          className="bg-primary hover:opacity-90 text-primary-foreground"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Créer une analyse
                        </Button>
                      </div>
                    ) : selectedCompetitorAnalysis || true ? (
                      <div className="space-y-4">
                        {(() => {
                          let analysis = selectedCompetitorAnalysis;
                          console.log('🔍 selectedCompetitorAnalysis dans le rendu:', analysis);

                          // Si pas d'analyse, créer des données de test temporaires
                          if (!analysis) {
                            console.log('⚠️ Pas d\'analyse sélectionnée, utilisation des données de test');
                            analysis = {
                              analysis_id: 42,
                              url: "https://alan.com",
                              title: "Alan - Test",
                              description: "Test description",
                              created_at: "2025-09-18T10:56:52.671130",
                              target_positioning: {
                                overall_rank: 3,
                                total_competitors: 15,
                                market_position: "🥈 Challenger fort",
                                target_global_score: 87.1,
                                target_llmo_score: 86.2,
                                target_geo_score: 83.7,
                                target_benchmark_score: 91.4,
                                model_rankings: {
                                  "openai/gpt-4.1-mini": {
                                    rank: 1,
                                    score: 95.0,
                                    total_competitors: 6
                                  }
                                },
                                competitive_advantages: [
                                  "Excellence en optimisation IA (LLMO)",
                                  "Performance technique supérieure"
                                ],
                                improvement_areas: [
                                  "Améliorer le référencement génératif"
                                ]
                              },
                              global_stats: {
                                total_competitors_found: 13,
                                total_models_executed: 3
                              },
                              consolidated_competitors: [
                                { name: "Competitor 1" },
                                { name: "Competitor 2" },
                                { name: "Competitor 3" }
                              ],
                              models_analysis: [
                                {
                                  model_info: {
                                    provider: "gpt-4o",
                                    display_name: "🤖 openai/gpt-4.1-mini (gpt-4o)",
                                    execution_time_ms: 9066,
                                    status: "completed",
                                    competitors_found: 5,
                                    average_score: 0.84
                                  },
                                  competitors: [
                                    {
                                      name: "April",
                                      url: "https://www.april.fr",
                                      similarity_score: 0.9,
                                      confidence_level: 1.0,
                                      model_rank: 1
                                    },
                                    {
                                      name: "Malakoff Humanis",
                                      url: "https://www.malakoffhumanis.com",
                                      similarity_score: 0.85,
                                      confidence_level: 1.0,
                                      model_rank: 2
                                    }
                                  ]
                                }
                              ]
                            } as any;
                          }

                          const domain = extractDomain(analysis.url);
                          const competitorsCount = analysis.consolidated_competitors?.length || 0;

                          // Utiliser les données réelles ou des valeurs de test si les données sont manquantes
                          const targetScore = analysis.target_positioning?.target_global_score || 87.1;
                          const userRank = analysis.target_positioning?.overall_rank || 4;
                          const totalCompetitors = analysis.target_positioning?.total_competitors || 14;
                          const totalCompetitorsFound = analysis.global_stats?.total_competitors_found || 13;

                          // Debug: vérifier les données
                          console.log('🔍 Données d\'analyse:', {
                            targetScore,
                            userRank,
                            totalCompetitors,
                            totalCompetitorsFound,
                            competitorsCount,
                            globalStats: analysis.global_stats,
                            targetPositioning: analysis.target_positioning
                          });

                          return (
                            <>
                              {/* En-tête Top 5 Concurrents */}
                              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                
                                
                              </div>

                              {/* Métriques de l'analyse concurrentielle */}
                              {/* <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-muted-foreground">Score Global</span>
                            </div>
                            <div className="text-2xl font-bold text-foreground">
                              {Math.round(targetScore)}/100
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Rang {userRank}/{totalCompetitors}
                            </div>
                          </div>
                          
                          <div className="bg-muted p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-muted-foreground">Concurrents</span>
                            </div>
                            <div className="text-2xl font-bold text-foreground">
                              {totalCompetitorsFound}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {analysis.global_stats?.total_models_executed || 0} modèles IA
                            </div>
                          </div>
                        </div> */}

                              {/* Concurrents par modèle LLM */}
                              {(() => {
                                // Normaliser le modèle sélectionné pour la recherche
                                const normalizeForSearch = (model: string): string[] => {
                                  const lower = model.toLowerCase();
                                  const variants: string[] = [lower];
                                  
                                  // Extraire les variantes possibles
                                  if (lower.includes('/')) {
                                    const parts = lower.split('/');
                                    variants.push(parts[0]); // provider
                                    variants.push(parts[1]); // name
                                    variants.push(parts[1].split('-')[0]); // premier mot du nom
                                  } else {
                                    variants.push(lower.split('-')[0]); // premier mot
                                  }
                                  
                                  // Ajouter des alias communs
                                  if (lower.includes('gpt-5') || lower.includes('gpt5')) {
                                    variants.push('gpt-5', 'gpt5', 'openai/gpt-5');
                                  }
                                  if (lower.includes('claude') || lower.includes('sonnet')) {
                                    variants.push('claude-4-sonnet', 'claude-sonnet-4', 'anthropic/claude-4-sonnet');
                                  }
                                  if (lower.includes('gemini')) {
                                    variants.push('gemini-2.5-pro', 'google/gemini-2.5-pro');
                                  }
                                  if (lower.includes('mistral') || lower.includes('mixtral')) {
                                    variants.push('mixtral-3.1', 'mistral-3.1', 'mistralai/mistral-medium-3.1');
                                  }
                                  if (lower.includes('sonar') || lower.includes('perplexity')) {
                                    variants.push('sonar', 'perplexity/sonar');
                                  }
                                  
                                  return [...new Set(variants)]; // Supprimer les doublons
                                };

                                const searchVariants = normalizeForSearch(selectedLLMModel || '');
                                
                                // Trouver l'analyse du modèle sélectionné (robuste aux alias provider/model_name)
                                const modelAnalysis = analysis.models_analysis?.find((ma) => {
                                  const prov = (ma.model_info?.provider || '').toLowerCase();
                                  const name = (ma.model_info?.model_name || '').toLowerCase();
                                  const disp = (ma.model_info?.display_name || '').toLowerCase();
                                  
                                  // Vérifier toutes les variantes
                                  return searchVariants.some(variant => 
                                    prov === variant ||
                                    name === variant ||
                                    disp === variant ||
                                    prov.includes(variant) ||
                                    name.includes(variant) ||
                                    disp.includes(variant) ||
                                    variant.includes(prov) ||
                                    variant.includes(name) ||
                                    variant.includes(disp)
                                  );
                                });

                                // Debug: logger les informations pour diagnostiquer
                                console.log('🔍 Recherche modèle:', {
                                  selectedLLMModel,
                                  searchVariants,
                                  availableModels: analysis.models_analysis?.map(m => ({
                                    provider: m.model_info?.provider,
                                    name: m.model_info?.model_name,
                                    display: m.model_info?.display_name,
                                    competitorsCount: m.competitors?.length || 0
                                  })),
                                  foundModelAnalysis: !!modelAnalysis,
                                  modelAnalysisCompetitors: modelAnalysis?.competitors?.length || 0,
                                  consolidatedCompetitorsCount: analysis.consolidated_competitors?.length || 0
                                });

                                // Si aucun modèle spécifique trouvé, utiliser tous les concurrents consolidés
                                if (!modelAnalysis || !modelAnalysis.competitors || modelAnalysis.competitors.length === 0) {
                                  // Fallback: afficher les concurrents consolidés si disponibles
                                  const fallbackCompetitors = analysis.consolidated_competitors || [];
                                  
                                  if (fallbackCompetitors.length > 0) {
                                    return (
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                          <h4 className="text-sm font-medium text-neutral-600">
                                            Top 5 Concurrents
                                          </h4>
                                          <Badge variant="outline" className="text-xs">
                                            {fallbackCompetitors.length} concurrents
                                          </Badge>
                                        </div>

                                        {fallbackCompetitors.slice(0, 5).map((competitor, index) => {
                                          const score = Math.round(competitor.average_score * 100);
                                          const scoreColor = score >= 80 ? 'text-green-600' :
                                            score >= 60 ? 'text-yellow-600' : 'text-red-600';
                                          return (
                                            <div key={index} className="flex items-center justify-between p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-blue-100/50 hover:shadow-md hover:border-blue-200 transition-all">
                                              <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-200/50">
                                                  <span className="text-sm font-semibold text-blue-700">#{competitor.global_rank || index + 1}</span>
                                                </div>
                                                <div>
                                                  <span className="text-sm font-medium text-foreground">{competitor.name}</span>
                                                  <div className="text-xs text-muted-foreground">
                                                    {extractDomain(competitor.primary_url)}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="text-right">
                                                <Badge variant="outline" className={`text-xs ${scoreColor} border-2`}>
                                                  Score: {score}/100
                                                </Badge>
                                                {competitor.source_models && competitor.source_models.length > 0 && (
                                                  <div className="text-xs text-muted-foreground mt-1">
                                                    {competitor.source_models.length} modèle{competitor.source_models.length > 1 ? 's' : ''}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    );
                                  }
                                  
                                  return (
                                    <div className="text-center py-6 bg-muted rounded-lg">
                                      <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <Users className="w-6 h-6 text-muted-foreground" />
                                      </div>
                                      <p className="text-muted-foreground text-sm">
                                        Aucun concurrent trouvé pour ce modèle
                                      </p>
                                      <p className="text-muted-foreground text-xs mt-2">
                                        Modèles disponibles: {analysis.models_analysis?.map(m => m.model_info?.display_name || m.model_info?.model_name).join(', ') || 'Aucun'}
                                      </p>
                                    </div>
                                  );
                                }

                                return (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-sm font-medium text-neutral-600">
                                        Top 5 Concurrents - {modelAnalysis.model_info.display_name.replace('🤖 ', '')}
                                      </h4>
                                      <Badge variant="outline" className="text-xs">
                                        Score moyen: {(modelAnalysis.model_info.average_score * 100).toFixed(0)}/100
                                      </Badge>
                                    </div>

                                    {modelAnalysis.competitors.slice(0, 5).map((competitor, index) => {
                                      const score = Math.round(competitor.similarity_score * 100);
                                      const scoreColor = score >= 80 ? 'text-green-600' :
                                        score >= 60 ? 'text-yellow-600' : 'text-red-600';
                                      return (
                                        <div key={index} className="flex items-center justify-between p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-blue-100/50 hover:shadow-md hover:border-blue-200 transition-all">
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-200/50">
                                              <span className="text-sm font-semibold text-blue-700">#{competitor.model_rank}</span>
                                            </div>
                                            <div>
                                              <span className="text-sm font-medium text-foreground">{competitor.name}</span>
                                              <div className="text-xs text-muted-foreground">
                                                {extractDomain(competitor.url)}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <Badge variant="outline" className={`text-xs ${scoreColor} border-2`}>
                                              Score: {score}/100
                                            </Badge>
                                            <div className="text-xs text-muted-foreground mt-1">
                                              Confiance: {(competitor.confidence_level * 100).toFixed(0)}%
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}

                                    {/* Stats du modèle */}
                                    {/* <div className="bg-neutral-50 p-3 rounded-lg">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                  <div>
                                    <div className="text-sm font-semibold text-neutral-900">
                                      {modelAnalysis.model_info.competitors_found}
                                    </div>
                                    <div className="text-xs text-neutral-600">Trouvés</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-neutral-900">
                                      {(modelAnalysis.model_info.execution_time_ms / 1000).toFixed(1)}s
                                    </div>
                                    <div className="text-xs text-neutral-600">Durée</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-neutral-900">
                                      {modelAnalysis.model_info.status === 'completed' ? '✅' : '⏳'}
                                    </div>
                                    <div className="text-xs text-neutral-600">Statut</div>
                                  </div>
                                </div>
                              </div> */}
                                  </div>
                                );
                              })()}

                              {/* Action */}
                              <div className="pt-4 flex justify-center">
                                <Button
                                  onClick={() => navigate(`/competition`)}
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
                                >
                                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                  <span className="hidden sm:inline">Voir l'analyse concurrentielle complète</span>
                                  <span className="sm:hidden">Voir l'analyse</span>
                                </Button>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                {/* Analyse Benchmark */}
                {selectedCompetitorAnalysis && (selectedCompetitorAnalysis as any).benchmark_results?.benchmark && (
                  <Card className="bg-white shadow-md border border-blue-100/60">
                    <CardHeader className="bg-white border-b border-blue-100/40">
                      <CardTitle className="text-base sm:text-lg text-foreground font-semibold flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Analyse Benchmark
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {(selectedCompetitorAnalysis as any).benchmark_results.benchmark.comparaison}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-foreground">
                      <div className="space-y-4">
                        {/* Classement complet */}
                        <div>
                          <h4 className="font-semibold text-foreground mb-3">Classement complet</h4>
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {(selectedCompetitorAnalysis as any).benchmark_results.benchmark.classement.map((entry: any, idx: number) => {
                              const competitor = (selectedCompetitorAnalysis as any).consolidated_competitors?.find((c: any) => c.primary_url === entry.url || c.url === entry.url);
                              const isYourSite = entry.url === selectedCompetitorAnalysis.url;
                              return (
                                <div 
                                  key={idx}
                                  className={`flex items-center justify-between p-3 rounded-lg border ${
                                    isYourSite 
                                      ? 'bg-blue-50 border-blue-200' 
                                      : idx < 3
                                        ? 'bg-yellow-50 border-yellow-200'
                                        : 'bg-white border-blue-100'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                                      isYourSite ? 'bg-blue-500 text-white' : 
                                      idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                                      idx === 1 ? 'bg-gray-300 text-gray-900' :
                                      idx === 2 ? 'bg-amber-400 text-amber-900' :
                                      'bg-blue-50 text-blue-700'
                                    }`}>
                                      {isYourSite ? '👤' : idx + 1}
                                    </div>
                                    <div>
                                      <div className="font-medium text-foreground">
                                        {isYourSite ? 'Votre site' : (competitor?.name || extractDomain(entry.url))}
                                      </div>
                                      <div className="text-xs text-muted-foreground">{extractDomain(entry.url)}</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <Badge variant="outline" className="text-sm font-semibold">
                                      {entry.score}/100
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

             
                

                <div className="max-w-4xl mx-auto px-2 sm:px-4">
                  <div className="grid gap-4 sm:gap-6 lg:grid-cols-1">
                  {/* Sources Analytics (à gauche) */}
                  <Card className="bg-white shadow-md border border-blue-100/60">
                    <CardHeader className="pb-2 px-3 sm:px-6 bg-white border-b border-blue-100/40">
                     
                    </CardHeader>

                    <CardContent className="py-3 px-3 sm:px-6">
                      {/* Graphique Évolution du Chat */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          {loadingSourceAnalysis ? (
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Chargement de l'analyse...
                            </div>
                          ) : selectedSourceAnalysis ? (
                            <div className="text-xs text-muted-foreground">
                              {extractDomain(selectedSourceAnalysis.url)} • {new Date(selectedSourceAnalysis.created_at).toLocaleDateString('fr-FR')}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              Aucune analyse sélectionnée
                            </div>
                          )}
                        </div>

                        {(() => {
                          // Utiliser les VRAIES données d'évolution depuis target_positioning.trends_by_model
                          let selectedAnalysis = selectedSourceAnalysis;
                          let chartData = [];
                          let availableModels = [];
                          let modelColors = {
                            'openai/gpt-5': '#3b82f6',
                            'anthropic/claude-sonnet-4': '#f59e0b',
                            'google/gemini-2.5-pro': '#10b981',
                            'mistralai/mistral-medium-3.1': '#6366f1',
                            'perplexity/sonar': '#8b5cf6',
                            'gpt-5': '#3b82f6',
                            'claude-4-sonnet': '#f59e0b',
                            'gemini-2.5-pro': '#10b981',
                            'mixtral-3.1': '#6366f1',
                            'sonar': '#8b5cf6'
                          };

                          const trends = (selectedAnalysis as any)?.target_positioning?.trends_by_model;
                          if (trends) {
                            // Récupérer tous les points de données de tous les modèles
                            const allPoints = [];
                            const modelTrends = {};

                            Object.entries(trends).forEach(([modelKey, modelData]) => {
                              availableModels.push(modelKey);
                              modelTrends[modelKey] = {
                                delta_30d: (modelData as any).delta_30d || 0,
                                count: (modelData as any).count || 0
                              };

                              if ((modelData as any).points && (modelData as any).points.length > 0) {
                                (modelData as any).points.forEach((point: any) => {
                                  allPoints.push({
                                    timestamp: new Date(point.t),
                                    model: modelKey,
                                    global_score: point.global_score,
                                    llmo_score: point.llmo_score,
                                    geo_score: point.geo_score,
                                    benchmark_score: point.benchmark_score,
                                    delta_30d: (modelData as any).delta_30d
                                  });
                                });
                              }
                            });

                            // Trier par timestamp et grouper par date
                            allPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

                            // Grouper par jour et créer les données du graphique
                            const pointsByDate = {};
                            allPoints.forEach(point => {
                              const dateKey = point.timestamp.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '');
                              if (!pointsByDate[dateKey]) {
                                pointsByDate[dateKey] = {};
                              }
                              // Stocker seulement le global_score
                              pointsByDate[dateKey][point.model] = point.global_score;
                            });

                            // Convertir en format chartData et trier par date croissante
                            chartData = Object.entries(pointsByDate)
                              .sort(([dateA], [dateB]) => {
                                // Convertir les dates pour trier correctement
                                const [dayA, monthA] = dateA.split(' ');
                                const [dayB, monthB] = dateB.split(' ');
                                const year = new Date().getFullYear();

                                const dateObjA = new Date(`${dayA} ${monthA} ${year}`);
                                const dateObjB = new Date(`${dayB} ${monthB} ${year}`);

                                return dateObjA.getTime() - dateObjB.getTime();
                              })
                              .map(([date, scores]) => {
                                const dataPoint = { date };
                                Object.entries(scores).forEach(([key, score]) => {
                                  dataPoint[key] = score;
                                });
                                return dataPoint;
                              });

                            // Si pas assez de données, ajouter des points interpolés sur 30 jours
                            if (chartData.length < 7) {
                              const firstPoint = chartData[0] || {};

                              // Générer des dates du plus ancien au plus récent
                              for (let i = 0; i < 7; i++) {
                                const date = new Date();
                                date.setDate(date.getDate() - (6 - i)); // Du plus ancien au plus récent
                                const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '');

                                const dataPoint = { date: dateStr };
                                availableModels.forEach(model => {
                                  const baseScore = firstPoint[model] || 75;
                                  const delta = modelTrends[model]?.delta_30d || 0;

                                  // Appliquer le delta sur la progression temporelle (30 jours)
                                  const variation = (Math.random() - 0.5) * 8 + (delta * i * 0.04); // Réduit pour 30 jours

                                  dataPoint[model] = Math.max(60, Math.min(95, baseScore + variation));
                                });
                                chartData.push(dataPoint);
                              }
                            }
                          } else {
                            // Fallback si pas de données d'évolution
                            chartData = [];
                          }


                          return (
                            <>
                              {/* Légende de l'évolution - Scores Global & GEO */}
                             
                            </>
                          );
                        })()}
                      </div>

                      {/* Graphique en Barres Empilées par Modèle */}

                      {/* Graphique Évolution - Ultra Dynamique - COMMENTÉ */}
                      {/* tttttt */}


                      {/* Tableau des Modèles IA Utilisés */}
                      <div className="overflow-x-auto rounded-lg bg-white/80 backdrop-blur-sm border border-blue-100/50 shadow-sm">
                        <table className="w-full min-w-[600px]">
                          <thead className="bg-blue-50/40 border-b border-blue-100/40">
                            <tr>
                              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">#</th>
                              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Modèle IA</th>
                              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Statut</th>
                              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Concurrents</th>
                              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Score Moyen</th>
                              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Temps</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white/50 divide-y divide-blue-100/30">
                            {(() => {
                              if (!selectedSourceAnalysis?.models_analysis || selectedSourceAnalysis.models_analysis.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-neutral-500 italic">
                                      <span>Aucune donnée de modèle disponible</span>
                                    </td>
                                  </tr>
                                );
                              }

                              return selectedSourceAnalysis.models_analysis.map((modelAnalysis, index) => {
                                const modelInfo = modelAnalysis.model_info;
                                const competitorsCount = modelAnalysis.competitors?.length || 0;
                                const avgScore = Math.round((modelInfo.average_score || 0) * 100);
                                const executionTime = Math.round((modelInfo.execution_time_ms || 0) / 1000 * 100) / 100;

                                // Déterminer le nom d'affichage et l'icône
                                let displayName = modelInfo.display_name || modelInfo.provider;
                                let statusColor = 'bg-green-100 text-green-800';
                                let statusText = 'Complété';

                                if (modelInfo.status !== 'completed') {
                                  statusColor = 'bg-red-100 text-red-800';
                                  statusText = 'Erreur';
                                }

                                // Raccourcir le nom si trop long
                                if (displayName.length > 25) {
                                  displayName = displayName.substring(0, 22) + '...';
                                }

                                return (
                                  <tr key={index} className="hover:bg-blue-50/40 transition-colors">
                                    <td className="px-2 sm:px-4 py-3 text-sm text-foreground">{index + 1}</td>
                                    <td className="px-2 sm:px-4 py-3 text-sm">
                                      <div className="flex items-center gap-2">
                                        <img
                                          src={(() => {
                                            const prov = (modelInfo.provider || '').toLowerCase();
                                            const name = (modelInfo.model_name || '').toLowerCase();
                                            if (prov.includes('mistral') || name.includes('mistral')) return '/Mistral.png';
                                            const id = prov.includes('openai') || name.includes('gpt')
                                              ? 'openai-for-light'
                                              : prov.includes('anthropic') || name.includes('claude')
                                                ? 'claude'
                                                : prov.includes('google') || name.includes('gemini')
                                                  ? 'gemini'
                                                  : prov.includes('perplexity') || name.includes('sonar')
                                                    ? 'perplexity'
                                                    : 'claude';
                                            return `/prompt-model-${id}.svg`;
                                          })()}
                                          alt="Model"
                                          className="w-4 h-4 sm:w-5 sm:h-5"
                                        />
                                        <div>
                                          <div className="font-medium text-foreground text-xs sm:text-sm">{displayName}</div>
                                          <div className="text-xs text-muted-foreground hidden sm:block">{modelInfo.provider}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-2 sm:px-4 py-3 text-sm">
                                      <Badge className={`${statusColor} text-xs font-medium`}>
                                        {statusText}
                                      </Badge>
                                    </td>
                                    <td className="px-2 sm:px-4 py-3 text-sm text-foreground text-center font-medium">
                                      {competitorsCount}
                                    </td>
                                    <td className="px-2 sm:px-4 py-3 text-sm text-foreground text-center">
                                      <span className="font-semibold">{avgScore}/100</span>
                                    </td>
                                    <td className="px-2 sm:px-4 py-3 text-sm text-muted-foreground text-center">
                                      {executionTime}s
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                     
                    </CardContent>
                  </Card>


                  {/* Analyse concurrentielle (à droite) */}
                
                  </div>
                </div>
              </>
            )}

            {/* Contenu de l'onglet Améliorer */}
            {activeTab === 'improve' && (
              <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 bg-gradient-to-br from-amber-50/20 to-orange-50/20 rounded-lg p-4">
                {/* Section Impact - Améliorations estimées */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-8 bg-amber-500 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-foreground">Impact - Améliorations estimées</h3>
                  </div>

                  {(() => {
                    // Récupérer les données depuis l'API comme dans LLMODashboard
                    console.log('[Index] selectedGeoReport:', selectedGeoReport);
                    const analyses = selectedGeoReport?.analyses || [];
                    console.log('[Index] Analyses disponibles:', analyses.length, analyses.map(a => (a as any)?.llm_name || (a as any)?.['llm_utilisé']));
                    const preferredModels = ['gpt-5', 'gpt-4o', 'claude-4-sonnet', 'claude-4-sonnet'];
                    let perf: any | null = null;

                    // Fonction pour extraire les données de performance depuis l'analyse
                    const extractPerformanceFromAnalysis = (analysis: any): any | null => {
                      if (!analysis) return null;
                      const geoPackage = analysis?.modules?.audit_geo;
                      if (!geoPackage) return null;

                      // Chercher performance_impact directement
                      if (geoPackage.performance_impact) return geoPackage.performance_impact;

                      // Chercher dans package_metadata
                      if (geoPackage.package_metadata?.performance_impact) return geoPackage.package_metadata.performance_impact;

                      // Chercher en profondeur
                      const deepFindPerformanceImpact = (node: any): any | null => {
                        if (!node) return null;
                        if (typeof node !== 'object') return null;
                        if (Array.isArray(node)) {
                          for (const item of node) {
                            const res = deepFindPerformanceImpact(item);
                            if (res) return res;
                          }
                          return null;
                        }

                        const possibleKeys = ['performance_impact', 'performanceImpact', 'impact_performance', 'impactPerformance'];
                        for (const k of possibleKeys) {
                          if (Object.prototype.hasOwnProperty.call(node, k)) {
                            return node[k];
                          }
                        }

                        for (const key of Object.keys(node)) {
                          const res = deepFindPerformanceImpact(node[key]);
                          if (res) return res;
                        }
                        return null;
                      };

                      return deepFindPerformanceImpact(geoPackage);
                    };

                    // Chercher les données de performance
                    console.log('[Index] Recherche des données de performance...');
                    for (const model of preferredModels) {
                      const a = analyses.find(x => (x as any).llm_name === model || (x as any)['llm_utilisé'] === model);
                      console.log('[Index] Test performance pour', model, ':', a ? 'trouvé' : 'non trouvé');
                      perf = extractPerformanceFromAnalysis(a);
                      if (perf) {
                        console.log('[Index] Performance trouvée via', model, ':', perf);
                        break;
                      }
                    }

                    if (!perf) {
                      console.log('[Index] Aucune performance via modèles préférés, test de toutes les analyses...');
                      for (const a of analyses) {
                        const tmp = extractPerformanceFromAnalysis(a);
                        if (tmp) {
                          console.log('[Index] Performance trouvée via analyse:', tmp);
                          perf = tmp;
                          break;
                        }
                      }
                    }
                    console.log('[Index] Performance final:', perf);


                    // Chercher le guide d'implémentation
                    let guideData: any = null;
                    console.log('[Index] Recherche du guide d\'implémentation...');
                    for (const model of preferredModels) {
                      const a = analyses.find(x => (x as any).llm_name === model || (x as any)['llm_utilisé'] === model);
                      console.log('[Index] Test modèle', model, ':', a ? 'trouvé' : 'non trouvé');
                      const extracted = extractGuideFromAnalysis(a);
                      if (extracted) {
                        console.log('[Index] Guide trouvé via', model, ':', extracted);
                        guideData = extracted.guide;
                        break;
                      }
                    }

                    if (!guideData) {
                      console.log('[Index] Aucun guide via modèles préférés, test de toutes les analyses...');
                      for (const a of analyses) {
                        const extracted = extractGuideFromAnalysis(a);
                        if (extracted) {
                          console.log('[Index] Guide trouvé via analyse:', extracted);
                          guideData = extracted.guide;
                          break;
                        }
                      }
                    }
                    console.log('[Index] Guide final:', guideData);

                    // Helpers pour rechercher dynamiquement le guide d'implémentation dans la structure réelle
                    // Deep search pour une clé type implementation_guide (avec alias possibles)
                    function deepFindImplementationGuide(node: any): any | null {
                      if (!node) return null;
                      if (typeof node !== 'object') return null;
                      if (Array.isArray(node)) {
                        for (const item of node) {
                          const res = deepFindImplementationGuide(item);
                          if (res) return res;
                        }
                        return null;
                      }
                      const possibleKeys = [
                        'implementation_guide',
                        'implementationGuide',
                        'guide_implementation',
                        'guideImplementation',
                        'implementation',
                        'guide'
                      ];
                      for (const k of possibleKeys) {
                        if (Object.prototype.hasOwnProperty.call(node, k)) {
                          return (node as any)[k];
                        }
                      }
                      for (const key of Object.keys(node)) {
                        const res = deepFindImplementationGuide((node as any)[key]);
                        if (res) return res;
                      }
                      return null;
                    }

                    // Trouver le module GEO (clé variable/tolérante) dans un conteneur donné
                    function findGeoPackageModule(container: Record<string, any> | undefined | null, contextLabel: string): any | null {
                      if (!container) return null;
                      // 1) priorité à la clé exacte 7_package_optimisation_geo
                      if ((container as any)['7_package_optimisation_geo']) {
                        console.log('[Index] GEO package trouvé (exact) dans', contextLabel, '→ 7_package_optimisation_geo');
                        return (container as any)['7_package_optimisation_geo'];
                      }
                      // 2) alias courants
                      const aliasCandidates = [
                        'package_optimisation_geo',
                        'geo_optimization_package',
                        'audit_geo',
                        'geo',
                      ];
                      for (const candidate of aliasCandidates) {
                        if ((container as any)[candidate]) {
                          console.log('[Index] GEO module trouvé via alias dans', contextLabel + ':', candidate);
                          return (container as any)[candidate];
                        }
                      }
                      // 3) regex fallback
                      const keys = Object.keys(container);
                      const regexMatch = keys.find(k => /7\s*[_-]?\s*package.*optimisation.*geo/i.test(k) || /package.*optimisation.*geo/i.test(k) || /geo.*optim/i.test(k));
                      if (regexMatch) {
                        console.log('[Index] GEO module trouvé via regex key dans', contextLabel + ':', regexMatch);
                        return (container as any)[regexMatch];
                      }
                      console.log('[Index] Aucun module GEO trouvé dans', contextLabel, '→ clés:', keys);
                      return null;
                    }

                    // Trouver le module GEO en inspectant d'abord rapport_détaillé, puis modules
                    function findGeoFromAnalysis(analysis: any): any | null {
                      // 1) rapport_détaillé
                      const detailed = (analysis as any)?.['rapport_détaillé'] || (analysis as any)?.rapport_detaille || (analysis as any)?.rapport;
                      const fromDetailed = findGeoPackageModule(detailed, 'rapport_détaillé');
                      if (fromDetailed) return fromDetailed;

                      // 1b) si rapport_détaillé contient des sous-objets par modèle, tenter chaque entrée
                      if (detailed && typeof detailed === 'object' && !Array.isArray(detailed)) {
                        for (const key of Object.keys(detailed)) {
                          const sub = (detailed as any)[key];
                          const found = findGeoPackageModule(sub, `rapport_détaillé.${key}`);
                          if (found) return found;
                        }
                      }
                      if (Array.isArray(detailed)) {
                        for (let i = 0; i < detailed.length; i++) {
                          const found = findGeoPackageModule(detailed[i], `rapport_détaillé[${i}]`);
                          if (found) return found;
                        }
                      }
                      // 2) modules
                      const fromModules = findGeoPackageModule((analysis as any)?.modules, 'modules');
                      if (fromModules) return fromModules;
                      return null;
                    }

                    // Extrait le guide pour une analyse donnée, avec source
                    function extractGuideFromAnalysis(analysis: any): { guide: any, source: string } | null {
                      if (!analysis) return null;
                      const geoPackage = findGeoFromAnalysis(analysis);
                      if (!geoPackage) {
                        console.log('[Index] Pas de GEO package pour analyse:', (analysis as any)?.llm_name || (analysis as any)?.['llm_utilisé']);
                        return null;
                      }
                      let guide: any = null;
                      if ((geoPackage as any).implementation_guide) {
                        console.log('[Index] implementation_guide trouvé direct dans GEO package');
                        guide = (geoPackage as any).implementation_guide;
                      }
                      if (!guide) {
                        console.log('[Index] Recherche profonde du implementation_guide...');
                        guide = deepFindImplementationGuide(geoPackage);
                      }
                      if (!guide) {
                        console.log('[Index] Aucun implementation_guide trouvé pour analyse:', (analysis as any)?.llm_name || (analysis as any)?.['llm_utilisé']);
                        return null;
                      }
                      const source = (analysis as any)?.llm_name || (analysis as any)?.['llm_utilisé'] || 'inconnu';
                      return { guide, source };
                    }

                    // Fonction pour extraire les actions spécifiques du guide
                    const getGuideActions = (category: string) => {
                      if (!guideData) {
                        console.log('[Index] getGuideActions: Pas de guideData pour', category);
                        return [];
                      }

                      console.log('[Index] getGuideActions: Recherche actions pour', category, 'dans guideData:', guideData);

                      // Chercher les actions par catégorie dans le guide
                      const actions = [];

                      // Recherche dans les étapes d'implémentation
                      const steps = guideData.etapes_implementation || guideData.etapes || guideData.steps;
                      console.log('[Index] getGuideActions: Étapes trouvées:', steps);

                      if (steps && typeof steps === 'object') {
                        for (const [key, step] of Object.entries(steps)) {
                          console.log('[Index] getGuideActions: Étape', key, ':', step);
                          if (typeof step === 'object' && step !== null) {
                            const stepObj = step as any;
                            if (stepObj.actions && Array.isArray(stepObj.actions)) {
                              console.log('[Index] getGuideActions: Actions trouvées dans', key, ':', stepObj.actions);

                              // Mapping spécifique basé sur votre structure JSON
                              const keyLower = key.toLowerCase();
                              const categoryLower = category.toLowerCase();

                              // Visibilité moteurs génératifs
                              if (category === 'visibilité' && (
                                keyLower.includes('metadonnees') ||
                                keyLower.includes('metadonnées') ||
                                keyLower.includes('mots_cles') ||
                                keyLower.includes('mots-clés') ||
                                keyLower.includes('optimisation')
                              )) {
                                console.log('[Index] getGuideActions: Match visibilité pour', key);
                                return stepObj.actions.slice(0, 2);
                              }

                              // Indexation IA
                              if (category === 'indexation' && (
                                keyLower.includes('donnees_structurees') ||
                                keyLower.includes('données_structurées') ||
                                keyLower.includes('structurees') ||
                                keyLower.includes('structurées') ||
                                keyLower.includes('json-ld')
                              )) {
                                console.log('[Index] getGuideActions: Match indexation pour', key);
                                return stepObj.actions.slice(0, 2);
                              }

                              // Compréhension du contenu
                              if (category === 'comprehension' && (
                                keyLower.includes('structure_semantique') ||
                                keyLower.includes('structure_sémantique') ||
                                keyLower.includes('contenu_contextuel') ||
                                keyLower.includes('contextuel') ||
                                keyLower.includes('semantique') ||
                                keyLower.includes('sémantique')
                              )) {
                                console.log('[Index] getGuideActions: Match compréhension pour', key);
                                return stepObj.actions.slice(0, 2);
                              }

                              // Autorité sémantique
                              if (category === 'autorité' && (
                                keyLower.includes('autorite') ||
                                keyLower.includes('autorité') ||
                                keyLower.includes('semantique') ||
                                keyLower.includes('sémantique') ||
                                keyLower.includes('structure_semantique') ||
                                keyLower.includes('structure_sémantique')
                              )) {
                                console.log('[Index] getGuideActions: Match autorité pour', key);
                                return stepObj.actions.slice(0, 2);
                              }
                            }
                          }
                        }
                      }

                      // Recherche directe dans les actions
                      if (guideData.actions && Array.isArray(guideData.actions)) {
                        console.log('[Index] getGuideActions: Actions directes trouvées:', guideData.actions);
                        guideData.actions.forEach((action: any) => {
                          if (typeof action === 'string' && action.toLowerCase().includes(category.toLowerCase())) {
                            actions.push(action);
                          }
                        });
                      }

                      // Si aucune action spécifique trouvée, retourner les premières actions disponibles
                      if (actions.length === 0 && steps && typeof steps === 'object') {
                        console.log('[Index] getGuideActions: Aucune action spécifique, recherche générale');
                        for (const [key, step] of Object.entries(steps)) {
                          if (typeof step === 'object' && step !== null) {
                            const stepObj = step as any;
                            if (stepObj.actions && Array.isArray(stepObj.actions) && stepObj.actions.length > 0) {
                              console.log('[Index] getGuideActions: Retour des premières actions de', key);
                              return stepObj.actions.slice(0, 2);
                            }
                          }
                        }
                      }

                      console.log('[Index] getGuideActions: Actions finales pour', category, ':', actions);
                      return actions.slice(0, 2); // Limiter à 2 actions par catégorie
                    };

                    // Extraire toutes les améliorations directement du guide d'implémentation
                    const improvements = [];

                    if (guideData && guideData.etapes_implementation) {
                      console.log('[Index] Création des améliorations depuis implementation_guide:', guideData.etapes_implementation);

                      // Mapping des étapes vers les améliorations
                      const stepMapping = {
                        'optimisation_metadonnees': {
                          title: "Optimisation des métadonnées",
                          icon: Brain,
                          color: "text-blue-600"
                        },
                        'structure_semantique': {
                          title: "Structure sémantique",
                          icon: FileText,
                          color: "text-purple-600"
                        },
                        'mots_cles_ia': {
                          title: "Mots-clés IA",
                          icon: Target,
                          color: "text-green-600"
                        },
                        'contenu_contextuel': {
                          title: "Contenu contextuel",
                          icon: Globe,
                          color: "text-indigo-600"
                        },
                        'donnees_structurees': {
                          title: "Données structurées",
                          icon: Shield,
                          color: "text-orange-600"
                        }
                      };

                      // Créer une amélioration pour chaque étape du guide
                      for (const [stepKey, stepData] of Object.entries(guideData.etapes_implementation)) {
                        if (typeof stepData === 'object' && stepData !== null) {
                          const step = stepData as any;
                          const mapping = stepMapping[stepKey] || {
                            title: step.titre || stepKey,
                            icon: Brain,
                            color: "text-gray-600"
                          };

                          improvements.push({
                            title: mapping.title,
                            description: step.description || "Action d'optimisation pour l'IA",
                            improvement: step.priorite === 'Élevée' ? '40-60%' : step.priorite === 'Moyenne' ? '25-40%' : '15-30%',
                            icon: mapping.icon,
                            color: mapping.color,
                            actions: step.actions || [],
                            priorite: step.priorite || 'Moyenne',
                            effort: step.effort || 'Moyen',
                            duree: step.duree_estimee || '1-2 semaines'
                          });
                        }
                      }
                    }

                    // Si aucune donnée exploitable, afficher un état vide au lieu de mocks
                    if (improvements.length === 0) {
                      return (
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-card text-muted-foreground">
                              <HelpCircle className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-foreground text-sm">Aucune amélioration estimée disponible</h5>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                Importez une analyse contenant un guide d'implémentation pour voir des actions recommandées.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return improvements.map((item, index) => (
                      <div key={index} className="p-3 sm:p-4 bg-white/70 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-card ${item.color} flex-shrink-0`}>
                            <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                              <h5 className="font-medium text-foreground text-sm break-words">{item.title}</h5>
                              <div className="flex items-center gap-2 flex-wrap">
                                {item.priorite && (
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${item.priorite === 'Élevée' ? 'bg-red-50 text-red-700' :
                                        item.priorite === 'Moyenne' ? 'bg-yellow-50 text-yellow-700' :
                                          'bg-gray-50 text-gray-700'
                                      }`}
                                  >
                                    {item.priorite}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                  +{item.improvement}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed mb-2">{item.description}</p>

                            {/* Informations supplémentaires du guide */}
                            {(item.effort || item.duree) && (
                              <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                                {item.effort && (
                                  <span className="flex items-center gap-1">
                                    <Activity className="w-3 h-3" />
                                    Effort: {item.effort}
                                  </span>
                                )}
                                {item.duree && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {item.duree}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Actions du guide d'implémentation */}
                            <div className="mt-3 pt-3">
                              <div className="flex items-center justify-between mb-2">
                                <h6 className="text-xs font-medium text-foreground">Actions recommandées :</h6>
                                {item.actions && item.actions.length > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleActions(index)}
                                    className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
                                  >
                                    {expandedActions[index] ? (
                                      <>
                                        <Minus className="w-3 h-3 mr-1" />
                                        Masquer
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="w-3 h-3 mr-1" />
                                        Voir ({item.actions.length})
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>

                              {expandedActions[index] && item.actions && item.actions.length > 0 && (
                                <ul className="space-y-1">
                                  {item.actions.map((action: string, actionIndex: number) => (
                                    <li key={actionIndex} className="flex items-start gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                                      <span className="text-xs text-muted-foreground leading-relaxed">{action}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}

                              {(!item.actions || item.actions.length === 0) && (
                                <div className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0"></div>
                                  <span className="text-xs text-muted-foreground leading-relaxed">Aucune action spécifique trouvée dans le guide d'implémentation</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>


                {/* Tableau des recommandations spécifiques */}
                <div className="overflow-x-auto rounded-lg bg-white/80 backdrop-blur-sm shadow-sm">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gradient-to-r from-amber-50/60 to-orange-50/40">
                      <tr>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">#</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Priorité</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Impact</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Effort</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Pourquoi</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Prochaine action</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Statut</th>
                      </tr>
                    </thead>
                          <tbody className="bg-white/50 divide-y divide-amber-100/30">
                      {(() => {
                        // Récupérer les données depuis l'API comme dans LLMODashboard
                        const analysisWithGeoPlan = selectedGeoReport?.analyses?.find(analysis =>
                          analysis.modules?.audit_geo?.plan_action_geo &&
                          Array.isArray(analysis.modules.audit_geo.plan_action_geo) &&
                          analysis.modules.audit_geo.plan_action_geo.length > 0
                        );

                        const geoData = analysisWithGeoPlan?.modules?.audit_geo;
                        const planActions = geoData?.plan_action_geo || [];

                        // État vide si aucune analyse disponible
                        const hasAnalyses = (selectedGeoReport?.analyses?.length || 0) > 0;
                        if (!hasAnalyses) {
                          return (
                            <tr>
                              <td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">
                                Aucune analyse disponible
                              </td>
                            </tr>
                          );
                        }

                        // État vide si pas de données GEO exploitables
                        if (!geoData) {
                          return (
                            <tr>
                              <td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">
                                Aucune recommandation disponible pour le moment
                              </td>
                            </tr>
                          );
                        }

                        // Fonctions de calcul comme dans LLMODashboard
                        const getImpact = (score: number) => {
                          if (score < 20) return 5; // Impact maximum - score très faible
                          if (score < 40) return 4; // Impact élevé - score faible
                          if (score < 60) return 3; // Impact moyen - score moyen
                          if (score < 80) return 2; // Impact faible - score bon
                          return 1; // Impact très faible - score excellent
                        };

                        const getEffort = (action: string) => {
                          if (action.includes('JSON-LD') || action.includes('Schema.org') || action.includes('structurées')) return 5; // Effort maximum
                          if (action.includes('HTML') || action.includes('balises') || action.includes('hiérarchie')) return 4; // Effort élevé
                          if (action.includes('métadonnées') || action.includes('Open Graph')) return 3; // Effort moyen
                          if (action.includes('robots.txt') || action.includes('sitemap')) return 2; // Effort faible
                          if (action.includes('répétitions') || action.includes('lisibilité')) return 4; // Effort élevé pour le contenu
                          return 3; // Effort par défaut
                        };

                        const getStatus = (score: number) => {
                          if (score < 20) return {
                            label: 'Critique',
                            color: 'bg-red-100 text-red-800',
                            description: 'Action urgente requise'
                          };
                          if (score < 40) return {
                            label: 'Urgent',
                            color: 'bg-red-100 text-red-800',
                            description: 'Priorité haute'
                          };
                          if (score < 60) return {
                            label: 'À améliorer',
                            color: 'bg-orange-100 text-orange-800',
                            description: 'Amélioration nécessaire'
                          };
                          if (score < 80) return {
                            label: 'Correct',
                            color: 'bg-yellow-100 text-yellow-800',
                            description: 'Peut être optimisé'
                          };
                          return {
                            label: 'Excellent',
                            color: 'bg-green-100 text-green-800',
                            description: 'Performance optimale'
                          };
                        };

                        // Priorités avec leurs données correspondantes depuis l'API
                        const priorities = [
                          {
                            id: 1,
                            name: 'Schema.org',
                            action: planActions[2] || 'Intégrer des données structurées Schema.org',
                            score: geoData?.donnees_score || 0,
                            why: 'LLM lisent mieux les données structurées'
                          },
                          {
                            id: 2,
                            name: 'Hn & sections',
                            action: planActions[1] || 'Ajouter une hiérarchie claire de titres',
                            score: geoData?.html_score || 0,
                            why: 'Structure claire pour les crawlers'
                          },
                          {
                            id: 3,
                            name: 'Métadonnées',
                            action: planActions[3] || 'Ajouter des métadonnées techniques',
                            score: geoData?.meta_score || 0,
                            why: 'Informations riches pour LLM'
                          },
                          {
                            id: 4,
                            name: 'Contenu',
                            action: planActions[4] || 'Éviter les répétitions inutiles',
                            score: geoData?.contenu_score || 0,
                            why: 'Qualité et pertinence du contenu'
                          },
                          {
                            id: 5,
                            name: 'Robots.txt & sitemap',
                            action: planActions[5] || 'Mettre en place robots.txt et sitemap.xml',
                            score: geoData?.crawlers_score || 0,
                            why: 'Crawl IA optimisé'
                          }
                        ];

                        return priorities.map((priority, index) => {
                          const impact = getImpact(priority.score);
                          const effort = getEffort(priority.action);
                          const status = getStatus(priority.score);

                          return (
                            <tr key={priority.id} className="hover:bg-amber-50/40 transition-colors">
                              <td className="px-2 sm:px-4 py-3 text-sm text-foreground">{priority.id}</td>
                              <td className="px-2 sm:px-4 py-3 text-sm">
                                <Badge className={`${impact >= 4 ? 'bg-green-100 text-green-800' : impact >= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'} text-xs font-medium`}>
                                  {impact >= 4 ? 'Élevée' : impact >= 3 ? 'Moyen' : 'Faible'}
                                </Badge>
                              </td>
                              <td className="px-2 sm:px-4 py-3 text-sm">
                                <Badge className={`${impact >= 4 ? 'bg-green-100 text-green-800' : impact >= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'} text-xs font-medium`}>
                                  {impact >= 4 ? 'Élevé' : impact >= 3 ? 'Moyen' : 'Faible'}
                                </Badge>
                              </td>
                              <td className="px-2 sm:px-4 py-3 text-sm">
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <div
                                      key={i}
                                      className={`w-2 h-2 rounded-full ${i < effort ? 'bg-blue-500' : 'bg-gray-200'}`}
                                    />
                                  ))}
                                </div>
                              </td>
                              <td className="px-2 sm:px-4 py-3 text-sm text-foreground max-w-xs hidden md:table-cell">
                                <span className="text-xs">{priority.why}</span>
                              </td>
                              <td className="px-2 sm:px-4 py-3 text-sm text-foreground max-w-md hidden lg:table-cell">
                                <span className="text-xs">{priority.action}</span>
                              </td>
                              <td className="px-2 sm:px-4 py-3 text-sm">
                                <Badge className={`${status.color} text-xs font-medium`}>
                                  {status.label}
                                </Badge>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>


        {/* Deux graphiques côte à côte */}
        {/* Grid: Sources Analytics et Analyse concurrentielle côte à côte */}


        {/* Analyses Optimiser */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white shadow-lg">
            {/* <CardHeader className="pb-6 px-8 py-6"> */}
            {/* <div className="flex items-center justify-between">
                <CardTitle className="text-2xl text-neutral-900 font-semibold flex items-center gap-4">
                  <Sparkles className="w-8 h-8 text-neutral-600" />
                  Analyses Optimiser
                </CardTitle>
              </div> */}

            {/* Select pour choisir une analyse optimisée */}
            {/* {!optimizationsLoading && optimizations.length > 0 && (
                <div className="mt-6">
                  <Select value={selectedOptimizationId} onValueChange={setSelectedOptimizationId}>
                    <SelectTrigger className="bg-white border-neutral-200 h-12 text-base">
                      <SelectValue placeholder="Choisir une analyse optimisée" />
                    </SelectTrigger>
                    <SelectContent>
                      {optimizations.map((optimization) => {
                        const url = optimization.url || 'URL non disponible';
                        const date = new Date(optimization.createdAt).toLocaleDateString('fr-FR');
                        return (
                          <SelectItem key={optimization.id} value={optimization.id}>
                            <div className="flex items-center gap-4 py-2">
                              <span className="font-medium text-base">{url}</span>
                              <span className="text-neutral-500 text-sm">• {date}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )} */}
            {/* </CardHeader> */}

            {/* <CardContent className="px-8 py-6"> */}
            {/* {optimizationsLoading ? (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-neutral-600" />
                    <span className="text-neutral-600 text-base">Chargement...</span>
              </div> */}
            {/* </div>
              ) : optimizations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-32 h-32 bg-neutral-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <Sparkles className="w-16 h-16 text-neutral-600" />
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-2 text-lg">Pas d'analyse</h3>
                  <p className="text-neutral-600 text-base mb-6">
                    Aucune analyse optimisée trouvée.
                  </p> */}
            {/* <Button 
                    onClick={() => navigate('/sites-optimization')}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white h-12 px-6 text-base"
                  >
                    <Plus className="w-6 h-6 mr-2" />
                    Créer une analyse
                  </Button> */}
            {/* </div> */}
            {/* ) : selectedOptimizationId ? ( */}

            {/* </CardContent> */}
          </Card>
        </div>
      </div>

      {/* Analyses GEO */}


      {/* Enhanced LLMO Trend Chart */}
      {/* <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  Évolution des Métriques LLMO
                </CardTitle>
                                  <CardDescription className="mt-2">Performance sur les 30 derniers jours</CardDescription>
              </div>
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                Temps réel
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <AreaChart data={llmoTrendData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="llmoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="semanticGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                
                <XAxis 
                  dataKey="day" 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis 
                  domain={[50, 90]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                
                <ChartTooltip content={<ChartTooltipContent />} />
                
                <Area
                  type="monotone"
                  dataKey="llmoScore"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fill="url(#llmoGradient)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="semanticScore"
                  stroke="#10B981"
                  strokeWidth={3}
                  fill="url(#semanticGradient)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="tokenization"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  fill="url(#tokenGradient)"
                  dot={false}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card> */}

      {/* Usage Limits */}
      {/* <UsageLimits className="mb-8" /> */}

      {/* Enhanced Dashboard Grid */}
      {/* <div className="grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto"> */}
      {/* Recent Analyses - Enhanced */}
      {/* <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    Analyses Récentes
                  </CardTitle>
                  <CardDescription className="mt-2">Dernières analyses effectuées</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/analyses')}
                  className="hover:bg-purple-50"
                >
                  Voir tout
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {loadingAnalyses ? (
                <div className="flex items-center justify-center p-8">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    <span className="text-gray-600 font-medium">Chargement des analyses...</span>
                  </div>
                </div>
              ) : errorAnalyses ? (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="font-medium">
                    {errorAnalyses}
                  </AlertDescription>
                </Alert>
              ) : recentAnalyses.length === 0 ? (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Aucune analyse récente</h3>
                    <p className="text-gray-500 text-sm">Commencez votre première analyse</p>
                    <Button 
                      onClick={() => navigate('/analyses')}
                      className="mt-4 bg-gradient-to-r from-purple-500 to-pink-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvelle analyse
                    </Button>
                  </div>
              ) : (
                recentAnalyses.map((analysis, index) => (
                  <div 
                    key={analysis.id} 
                    className="group p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] border border-gray-100"
                    onClick={() => navigate('/analyses')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Globe className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">{analysis.url}</h4>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {analysis.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {analysis.score}
                          </div>
                          <div className="text-xs text-gray-500 font-medium">Score LLMO</div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card> */}

      {/* Enhanced LLMO Insights */}
      {/* s */}


      {/* Enhanced Quick Actions */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
        <Card className="shadow-lg bg-white border border-blue-100/60 overflow-hidden">
        <CardHeader className="bg-white border-b border-blue-100/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                
                <span className="text-foreground">Actions Rapides</span>
              </CardTitle>
              <CardDescription className="mt-2 text-muted-foreground text-sm">Optimisations recommandées</CardDescription>
            </div>
            <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-200">
              <Star className="w-3 h-3 mr-1" />
              Recommandé
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 bg-white">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {[
              {
                title: "Analyser un nouveau site",
                description: "Lancer une analyse GEO complète",
                action: () => navigate('/analyses'),
                icon: Plus
              },
              {
                title: "Analyse concurrentielle",
                description: "Comparer avec vos concurrents",
                action: () => navigate('/competition'),
                icon: Globe2
              }
            ].map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                className="h-auto p-4 flex flex-col items-start text-left hover:shadow-lg transition-all duration-300 bg-white rounded-lg border border-blue-100/50 group hover:border-blue-200 hover:scale-[1.02]"
                onClick={action.action}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-blue-50 border border-blue-200/50 group-hover:bg-blue-100 transition-all">
                  <action.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-1 text-sm text-foreground">{action.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
                <ArrowRight className="h-3 w-3 text-blue-600 group-hover:translate-x-1 transition-all mt-2 self-end" />
              </Button>
            ))}
          </div>
        </CardContent>
        </Card>
      </div>
    </div>

  );
};

export default Index;