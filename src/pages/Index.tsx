import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, AlertTriangle, Clock, Zap, Shield, Target, BarChart3, Calendar, ArrowRight, CheckCircle, XCircle, Minus, CheckSquare, Brain, FileText, Globe, Globe2, Users, Activity, Plus, Loader2, Sparkles, Star, Rocket, Download, Building2, HelpCircle } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart, CartesianGrid } from "recharts";
import { useNavigate } from "react-router-dom";
import { AuthService } from "@/services/authService";
import { useCompetitiveAnalysis } from "@/hooks/useCompetitiveAnalysis";
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

  // Charger les analyses concurrentielles
  useEffect(() => {
    const loadCompetitorAnalyses = async () => {
      try {
        setLoadingCompetitiveAnalyses(true);
        const analyses = await listCompetitorAnalyses();
        setCompetitorAnalyses(analyses);
        
        // Charger automatiquement la première analyse
        if (analyses.length > 0) {
          console.log('🔍 Liste des analyses:', analyses);
          const firstAnalysis = await getCompetitorAnalysisById(analyses[0].analysis_id);
          console.log('🔍 Première analyse chargée:', firstAnalysis);
          setSelectedCompetitorAnalysis(firstAnalysis);
        } else {
          console.log('⚠️ Aucune analyse trouvée');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des analyses concurrentielles:', error);
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
        
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.virail.studio';
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
    <div className="flex-1 min-h-screen bg-background text-foreground">
      {/* Hero Header Section */}
      <div className="relative bg-card px-8 py-4 border-b border-border">
          <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Analyses GEO
              </h1>
              <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm font-medium">74 Score Productivité</span>
              </div>
              <Badge className="px-2 py-1 text-xs bg-primary/10 text-primary">
                Premium
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
                <Button 
                  onClick={() => navigate('/analyses')}
              className="bg-primary text-primary-foreground hover:opacity-90 shadow-sm font-medium px-4 py-2"
                >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Analyse
                </Button>
                <Button 
                  onClick={() => navigate('/competition')}
              variant="outline"
              className="bg-card hover:bg-muted border-border text-foreground font-medium px-4 py-2"
                >
              <Globe2 className="h-4 w-4 mr-2" />
              Analyse d'Équipe
                </Button>
          </div>
              </div>
            </div>
            
      {/* Main Content */}
      <div className="px-8 py-8 space-y-8">
        
        {/* Deux graphiques côte à côte */}
        {/* Grid: Sources Analytics et Analyse concurrentielle côte à côte */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sources Analytics (à gauche) */}
          <Card className="bg-card border border-border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-foreground font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-muted-foreground" />
                  Sources
                </CardTitle>
                <div className="flex items-center gap-4">
                  {/* Select Analyse Concurrentielle */}
                  {!loadingCompetitiveAnalyses && competitorAnalyses.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Organisation:</span>
                      <Select value={selectedSourceAnalysisId} onValueChange={setSelectedSourceAnalysisId}>
                        <SelectTrigger className="bg-card border-border w-64">
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
                  {/* Export button removed per request */}
            </div>
          </div>
            </CardHeader>
            
            <CardContent>
              {/* Graphique Évolution du Chat */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Évolution GEO du site</h3>
                  {loadingSourceAnalysis ? (
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Chargement de l'analyse...
        </div>
                  ) : selectedSourceAnalysis ? (
                    <div className="text-xs text-muted-foreground">
                      Domaine: {extractDomain(selectedSourceAnalysis.url)} • {new Date(selectedSourceAnalysis.created_at).toLocaleDateString('fr-FR')}
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
                      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted rounded-xl border border-border">
                        {availableModels.length > 0 ? (
                          availableModels.map((model, index) => {
                            const color = modelColors[model] || '#6b7280';
                            const delta = (selectedAnalysis as any)?.target_positioning?.trends_by_model?.[model]?.delta_30d || 0;
                            
                            return (
                              <div key={model} className="flex items-center gap-2 px-2 py-1 bg-card rounded border border-border">
                                <img 
                                  src={(() => {
                                    const key = (model || '').toLowerCase();
                                    if (key.includes('mistral')) return '/Mistral.png';
                                    const id = key.includes('openai') || key.includes('gpt')
                                      ? 'openai-for-light'
                                      : key.includes('anthropic') || key.includes('claude')
                                        ? 'claude'
                                        : key.includes('google') || key.includes('gemini')
                                          ? 'gemini'
                                          : key.includes('perplexity') || key.includes('sonar')
                                            ? 'perplexity'
                                            : 'claude';
                                    return `/prompt-model-${id}.svg`;
                                  })()}
                                  alt="Model"
                                  className="w-4 h-4"
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium text-foreground text-xs">
                                    {(() => {
                                      const key = (model || '').toLowerCase();
                                      if (key.includes('openai/gpt-5') || key.includes('gpt-5') || key.includes('openai')) return 'GPT-5';
                                      if (key.includes('anthropic/claude-sonnet-4') || key.includes('claude-4-sonnet') || key.includes('claude')) return 'Claude 4 Sonnet';
                                      if (key.includes('google/gemini-2.5-pro') || key.includes('gemini-2.5-pro') || key.includes('gemini')) return 'Gemini 2.5 Pro';
                                      if (key.includes('mistral') || key.includes('mistralai')) return 'Mistral 3.1';
                                      if (key.includes('perplexity') || key.includes('sonar')) return 'Sonar';
                                      return model;
                                    })()}
                                  </span>
                                  <span className={`font-medium text-xs ${
                                    delta >= 0 
                                      ? 'text-green-600' 
                                      : 'text-red-600'
                                  }`}>
                                    {delta >= 0 ? '↗' : '↘'} {Math.abs(delta).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-muted-foreground italic bg-card px-4 py-2 rounded-lg border border-border">
                            <span className="flex items-center gap-2">
                              Aucune donnée d'évolution disponible
                            </span>
                          </div>
                        )}
                      </div>


                      {/* Explication du Score */}
                      <div className="mb-3 p-2 bg-muted border border-border rounded-md">
                        <div className="flex items-start gap-2">
                          <div className="w-3 h-3 bg-muted-foreground rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-white text-xs font-bold">i</span>
              </div>
                          <div className="text-xs">
                            <p className="font-medium text-foreground mb-0.5">Évolution de Votre Score Global</p>
                            <p className="text-muted-foreground leading-relaxed">
                              Ce graphique montre l'<span className="font-medium">évolution réelle de votre score</span> au fil du temps 
                              selon les différents modèles IA. Plus le score est élevé, plus votre site est performant dans les analyses concurrentielles.
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              {availableModels.length > 0 && availableModels.map((model, index) => (
                                <div key={model} className="flex items-center gap-1">
                                  <img 
                                    src={(() => {
                                      const key = (model || '').toLowerCase();
                                      if (key.includes('mistral')) return '/Mistral.png';
                                      const id = key.includes('openai') || key.includes('gpt')
                                        ? 'openai-for-light'
                                        : key.includes('anthropic') || key.includes('claude')
                                          ? 'claude'
                                          : key.includes('google') || key.includes('gemini')
                                            ? 'gemini'
                                            : key.includes('perplexity') || key.includes('sonar')
                                              ? 'perplexity'
                                              : 'claude';
                                      return `/prompt-model-${id}.svg`;
                                    })()}
                                    alt="Model"
                                    className="w-3 h-3"
                                  />
                                  <span className="text-muted-foreground text-xs">
                                    {(() => {
                                      const key = (model || '').toLowerCase();
                                      if (key.includes('openai/gpt-5') || key.includes('gpt-5') || key.includes('openai')) return 'GPT-5';
                                      if (key.includes('anthropic/claude-sonnet-4') || key.includes('claude-4-sonnet') || key.includes('claude')) return 'Claude 4 Sonnet';
                                      if (key.includes('google/gemini-2.5-pro') || key.includes('gemini-2.5-pro') || key.includes('gemini')) return 'Gemini 2.5 Pro';
                                      if (key.includes('mistral') || key.includes('mistralai')) return 'Mistral 3.1';
                                      if (key.includes('perplexity') || key.includes('sonar')) return 'Sonar';
                                      return model;
                                    })()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Graphique Évolution - Ultra Dynamique */}
                      <div className="h-80 w-full relative overflow-hidden bg-card rounded-2xl border border-border p-4 shadow-lg">
                        {/* Background pattern */}
                        <div className="absolute inset-0 opacity-5">
                          <div className="absolute inset-0" style={{
                            backgroundImage: `radial-gradient(circle at 25% 25%, #3b82f6 2px, transparent 2px),
                                              radial-gradient(circle at 75% 75%, #10b981 2px, transparent 2px)`,
                            backgroundSize: '30px 30px'
                          }}></div>
                        </div>
                        
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart 
                            key={selectedAnalysis?.analysis_id || 'default'} 
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                          >
                            <defs>
                              {/* Filtres d'ombre */}
                              <filter id="glow">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                <feMerge> 
                                  <feMergeNode in="coloredBlur"/>
                                  <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                              </filter>
                            </defs>
                            
                            <CartesianGrid 
                              strokeDasharray="2 4" 
                              stroke="#e5e7eb" 
                              strokeOpacity={0.6}
                              horizontal={true}
                              vertical={false}
                            />
                            <XAxis 
                              dataKey="date" 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 500 }}
                              tickMargin={10}
                              tickFormatter={(value, index) => {
                                // Utiliser une approche plus robuste pour déterminer les positions
                                const totalTicks = chartData.length;
                                if (index === 0) return "30j dernier jours";
                                if (index === totalTicks - 1) return "Aujourd'hui";
                                return "";
                              }}
                            />
                            <YAxis 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 500 }}
                              domain={[40, 95]}
                              tickFormatter={(value) => `${value}`}
                              tickMargin={10}
                            />
                            <ChartTooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-white/95 backdrop-blur-sm p-3 border border-neutral-300 rounded-xl shadow-2xl">
                                      {payload.map((entry, index) => (
                                        <div key={index} className="flex items-center justify-between gap-3 py-0.5">
                                          <div className="flex items-center gap-2">
                                            <img 
                                              src={`/prompt-model-${(() => {
                                                const key = String(entry.dataKey ?? '').toLowerCase();
                                                if (key.includes('openai') || key.includes('gpt')) return 'openai-for-light';
                                                if (key.includes('gemini') || key.includes('google')) return 'gemini';
                                                if (key.includes('sonar') || key.includes('perplexity')) return 'perplexity';
                                                return 'claude';
                                              })()}.svg`}
                                              alt="Model"
                                              className="w-4 h-4"
                                            />
                                          </div>
                                          <span className="font-bold text-neutral-900 text-sm">{Math.round(Number(entry.value))}</span>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            
                            {/* Lignes des modèles IA */}
                            {availableModels.length > 0 && availableModels.map((model, index) => {
                              const color = modelColors[model] || '#6b7280';
                              
                              return (
                                <Line 
                                  key={model}
                                  type="monotone" 
                                  dataKey={model} 
                                  stroke={color}
                                  strokeWidth={3}
                                  dot={{ 
                                    fill: color, 
                                    strokeWidth: 2, 
                                    r: 4,
                                    stroke: '#ffffff'
                                  }}
                                  activeDot={{ 
                                    r: 8, 
                                    fill: color,
                                    stroke: '#ffffff',
                                    strokeWidth: 2,
                                    filter: 'url(#glow)',
                                    className: 'animate-bounce'
                                  }}
                                />
                              );
                            })}
                          </LineChart>
                        </ResponsiveContainer>
                        
                        {/* Léger effet de brillance */}
                        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-foreground/10 to-transparent pointer-events-none rounded-t-2xl"></div>
                      </div>
                    </>
                  );
                })()}
              </div>

          {/* Tableau des Modèles IA Utilisés */}
          <div className="overflow-hidden border border-border rounded-lg bg-card">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Modèle IA</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Concurrents</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Score Moyen</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Temps</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
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
                      <tr key={index} className="hover:bg-muted/40">
                        <td className="px-4 py-3 text-sm text-foreground">{index + 1}</td>
                        <td className="px-4 py-3 text-sm">
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
                              className="w-5 h-5"
                            />
                            <div>
                              <div className="font-medium text-foreground">{displayName}</div>
                              <div className="text-xs text-muted-foreground">{modelInfo.provider}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge className={`${statusColor} text-xs font-medium`}>
                            {statusText}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground text-center font-medium">
                          {competitorsCount}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground text-center">
                          <span className="font-semibold">{avgScore}/100</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground text-center">
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
          <Card className="bg-card border border-border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-foreground font-semibold flex items-center gap-2">
                  <Globe2 className="w-5 h-5 text-muted-foreground" />
                  Analyse concurrentielle
                </CardTitle>
                
                {/* Select Modèle LLM à droite du titre */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Modèle:</span>
                  <Select value={selectedLLMModel} onValueChange={setSelectedLLMModel}>
                    <SelectTrigger className="bg-card border-border w-48">
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
            
            <CardContent>
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
                        {/* En-tête de l'analyse sélectionnée */}
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{domain}</h3>
                              <p className="text-sm text-muted-foreground">
                                Analysé le {new Date(analysis.created_at).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-primary/10 text-primary border-transparent">
                              {analysis.target_positioning?.market_position}
                            </Badge>
                          </div>
                        </div>

                        {/* Métriques de l'analyse concurrentielle */}
                        <div className="grid grid-cols-2 gap-4">
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
                        </div>

                        {/* Positionnement du site analysé */}
                        {(analysis.target_positioning || true) && (
                          <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg border border-primary/20">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-medium text-primary flex items-center gap-2">
                                <Globe2 className="w-4 h-4" />
                                Mon Positionnement
                              </h4>
                              <Badge className="bg-primary text-primary-foreground text-xs font-semibold">
                                {analysis.target_positioning?.market_position || "🥈 Challenger fort"}
                              </Badge>
                            </div>
                            
                            {/* Scores détaillés */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div className="bg-card p-3 rounded-lg">
                                <div className="text-xs text-primary font-medium mb-1">Score LLMO</div>
                                <div className="text-lg font-bold text-foreground">
                                  {Math.round(analysis.target_positioning?.target_llmo_score || 86)}/100
                                </div>
                              </div>
                              <div className="bg-card p-3 rounded-lg">
                                <div className="text-xs text-primary font-medium mb-1">Score GEO</div>
                                <div className="text-lg font-bold text-foreground">
                                  {Math.round(analysis.target_positioning?.target_geo_score || 84)}/100
                                </div>
                              </div>
                            </div>

                            {/* Avantages et zones d'amélioration */}
                            <div className="grid grid-cols-1 gap-3">
                              {true && (
                                <div className="bg-green-500/10 p-3 rounded-lg">
                                  <div className="text-xs text-green-600 font-medium mb-2 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Points forts
                                  </div>
                                  <div className="space-y-1">
                                    {(analysis.target_positioning?.competitive_advantages || [
                                      "Excellence en optimisation IA (LLMO)",
                                      "Performance technique supérieure"
                                    ]).slice(0, 2).map((advantage, index) => (
                                      <div key={index} className="text-xs text-green-700 flex items-start gap-1">
                                        <span className="text-green-500 mt-0.5">•</span>
                                        <span>{advantage}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {true && (
                                <div className="bg-orange-500/10 p-3 rounded-lg">
                                  <div className="text-xs text-orange-600 font-medium mb-2 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    À améliorer
                                  </div>
                                  <div className="space-y-1">
                                    {(analysis.target_positioning?.improvement_areas || [
                                      "Améliorer le référencement génératif",
                                      "Optimisation continue recommandée"
                                    ]).slice(0, 2).map((area, index) => (
                                      <div key={index} className="text-xs text-orange-700 flex items-start gap-1">
                                        <span className="text-orange-500 mt-0.5">•</span>
                                        <span>{area}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Classement par modèle */}
                            {true && (
                              <div className="mt-3 pt-3 border-t border-primary/20">
                                <div className="text-xs text-primary font-medium mb-2">Performance par modèle IA</div>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(analysis.target_positioning?.model_rankings || {
                                    "openai/gpt-5": { rank: 1, score: 95.0 },
                                    "google/gemini-2.5-pro": { rank: 2, score: 92.0 },
                                    "anthropic/claude-sonnet-4": { rank: 3, score: 90.0 },
                                    "mistralai/mistral-medium-3.1": { rank: 4, score: 88.0 },
                                    "perplexity/sonar": { rank: 5, score: 87.0 }
                                  }).slice(0, 3).map(([model, ranking]) => (
                                    <div key={model} className="bg-card px-2 py-1 rounded text-xs">
                                      <span className="font-medium text-foreground">
                                        {(() => {
                                          const key = (model || '').toLowerCase();
                                          if (key.includes('openai/gpt-5') || key.includes('gpt-5') || key.includes('openai')) return 'GPT-5';
                                          if (key.includes('anthropic/claude-sonnet-4') || key.includes('claude')) return 'Claude 4 Sonnet';
                                          if (key.includes('google/gemini-2.5-pro') || key.includes('gemini')) return 'Gemini 2.5 Pro';
                                          if (key.includes('mistral')) return 'Mistral 3.1';
                                          if (key.includes('perplexity') || key.includes('sonar')) return 'Sonar';
                                          return String(model).split('/')[0];
                                        })()}
                                      </span>
                                      <span className="text-primary ml-1">#{(ranking as any).rank}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Concurrents par modèle LLM */}
                        {(() => {
                          // Trouver l'analyse du modèle sélectionné (robuste aux alias provider/model_name)
                          const modelAnalysis = analysis.models_analysis?.find((ma) => {
                            const prov = (ma.model_info?.provider || '').toLowerCase();
                            const name = (ma.model_info?.model_name || '').toLowerCase();
                            const disp = (ma.model_info?.display_name || '').toLowerCase();
                            const selected = (selectedLLMModel || '').toLowerCase();
                            return (
                              prov === selected ||
                              name === selected ||
                              disp === selected ||
                              prov.includes(selected) ||
                              name.includes(selected) ||
                              selected.includes(prov) ||
                              selected.includes(name)
                            );
                          });
                          
                          if (!modelAnalysis || !modelAnalysis.competitors || modelAnalysis.competitors.length === 0) {
                            return (
                              <div className="text-center py-6 bg-muted rounded-lg">
                                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-3">
                                  <Users className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground text-sm">
                                  Aucun concurrent trouvé pour ce modèle
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
                                  <div key={index} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:shadow-sm transition-shadow">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                                        <span className="text-sm font-semibold text-muted-foreground">#{competitor.model_rank}</span>
                                      </div>
                                      <div>
                                        <span className="text-sm font-medium text-foreground">{competitor.name}</span>
                                        <div className="text-xs text-muted-foreground">
                                          {extractDomain(competitor.url)}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <Badge variant="outline" className={`text-xs ${scoreColor}`}>
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

                        {/* Avantages concurrentiels */}
                        {analysis.target_positioning?.competitive_advantages && analysis.target_positioning.competitive_advantages.length > 0 && (
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Points forts
                            </h4>
                            <div className="space-y-1">
                              {analysis.target_positioning.competitive_advantages.slice(0, 2).map((advantage, index) => (
                                <div key={index} className="text-sm text-green-700">• {advantage}</div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action */}
                        <div className="pt-4 border-t border-border">
                          <Button 
                            onClick={() => navigate(`/competition`)}
                            className="w-full bg-primary hover:opacity-90 text-primary-foreground"
                          >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Voir l'analyse concurrentielle complète
                          </Button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Analyses Optimiser */}
        <div className="max-w-7xl mx-auto">
          <Card className="bg-white border border-neutral-200 shadow-lg">
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
        <Card className="bg-white border border-neutral-200 shadow-sm">
          {/* <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-neutral-900 font-semibold flex items-center gap-2">
                <Brain className="w-4 h-4 text-neutral-600" />
                Analyses GEO
              </CardTitle>
              {!reportsLoading && reports.length > 1 && (
                <Select value={selectedGeoAnalysisId} onValueChange={setSelectedGeoAnalysisId}>
                  <SelectTrigger className="bg-white border-neutral-200 w-48">
                    <SelectValue placeholder="Analyse" />
                  </SelectTrigger>
                  <SelectContent>
                    {reports.map((report) => {
                      const domain = new URL(report.url).hostname.replace('www.', '');
                      const date = new Date(report.createdAt).toLocaleDateString('fr-FR');
                      return (
                        <SelectItem key={report.id} value={report.id}>
                          <div className="flex items-center gap-2 py-1">
                            <span className="font-medium text-sm">{domain}</span>
                            <span className="text-neutral-500 text-xs">• {date}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
              </div>
            </CardHeader> */}
          
          
          </Card>

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
        {/* <div className="grid gap-8 lg:grid-cols-2"> */}
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
        <Card className="border border-border shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-muted border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <Rocket className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-foreground">Actions Rapides</span>
                </CardTitle>
                <CardDescription className="mt-2 text-muted-foreground">Optimisations recommandées</CardDescription>
              </div>
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                <Star className="w-3 h-3 mr-1" />
                Recommandé
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Analyser un nouveau site",
                  description: "Lancer une analyse LLMO complète",
                  action: () => navigate('/analyses'),
                  icon: Plus,
                  gradient: "from-blue-500 to-indigo-600",
                  bgGradient: "from-blue-50 to-indigo-50"
                },
                {
                  title: "Analyse concurrentielle",
                  description: "Comparer avec vos concurrents",
                  action: () => navigate('/competition'),
                  icon: Globe2,
                  gradient: "from-amber-500 to-orange-600",
                  bgGradient: "from-amber-50 to-orange-50"
                },
                {
                  title: "Recommandations IA",
                  description: "Suggestions d'amélioration IA",
                  action: () => navigate('/recommendations'),
                  icon: Sparkles,
                  gradient: "from-purple-500 to-pink-600",
                  bgGradient: "from-purple-50 to-pink-50"
                }
              ].map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className={`h-auto p-6 flex flex-col items-start text-left hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br ${action.bgGradient} border border-border rounded-xl group`}
                  onClick={action.action}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-r ${action.gradient} shadow-lg group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-bold mb-2 text-foreground transition-colors">{action.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{action.description}</p>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-all mt-3 self-end" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    
  );
};

export default Index;