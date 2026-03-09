import { useState, useEffect, useMemo } from "react";
import { usePageTitle } from '@/hooks/usePageTitle';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePayment } from '@/hooks/usePayment';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Target,
  Eye,
  ExternalLink,
  TrendingUp,
  AlertTriangle,
  TrendingDown,
  BarChart3,
  Shield,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronRight,
  Award,
  Users,
  Clock,
  Lightbulb,
  Calendar,
  Trophy,
  Star,
  Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCompetitiveAnalysis } from "@/hooks/useCompetitiveAnalysis";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// === CONSTANTES ===
const modelLogos: Record<string, string> = {
  'openai': '/prompt-model-openai-for-light.svg',
  'chatgpt': '/prompt-model-openai-for-light.svg',
  'gpt': '/prompt-model-openai-for-light.svg',
  'perplexity': '/prompt-model-perplexity.svg',
  'gemini': '/prompt-model-gemini.svg',
  'google': '/prompt-model-gemini.svg',
  'ai overview': '/prompt-model-gemini.svg',
  'claude': '/prompt-model-claude.svg',
  'anthropic': '/prompt-model-claude.svg',
  'mistral': '/Mistral.png',
  'mixtral': '/Mistral.png',
  'sonar': '/prompt-model-perplexity.svg',
  'deepseek': '/prompt-model-deepseek.svg',
  'qwen': '/prompt-model-qwen.svg',
  'llama': '/prompt-model-llama.svg',
  'meta': '/prompt-model-llama.svg',
  'grok': '/prompt-model-grok.svg',
};

/**
 * Récupère le logo d'un modèle avec une recherche par mot-clé
 */
const getModelLogo = (modelName: string): string | null => {
  if (!modelName) return null;
  const name = modelName.toLowerCase();

  for (const [key, path] of Object.entries(modelLogos)) {
    if (name.includes(key)) return path;
  }
  return null;
};

// Mapper les noms techniques API vers des noms commerciaux (marque uniquement)
const getCommercialModelName = (apiName: string): string => {
  const n = apiName.toLowerCase().trim();
  if (n.includes('sonar')) return 'Perplexity';
  if (n.includes('claude')) return 'Claude';
  if (n.startsWith('gpt') || n === 'chatgpt') return 'ChatGPT';
  if (n.includes('gemini') || n === 'ai overview' || n === 'ai-overview') return 'Gemini';
  if (n.includes('mistral') || n.includes('mixtral')) return 'Mistral';
  if (n.includes('deepseek')) return 'DeepSeek';
  if (n.includes('llama')) return 'Meta AI';
  if (n.includes('qwen')) return 'Qwen';
  if (n.includes('grok')) return 'Grok';
  return apiName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Fonction pour obtenir le suffixe ordinal (1st, 2nd, 3rd, etc.)
const getOrdinalSuffix = (n: number): string => {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return 'er';
  if (j === 2 && k !== 12) return 'ème';
  if (j === 3 && k !== 13) return 'ème';
  return 'ème';
};
import CompetitiveAnalysisDisplay from "@/components/competitive-analysis/CompetitiveAnalysisDisplay";
import DetailedCompetitiveAnalysis from "@/components/competitive-analysis/DetailedCompetitiveAnalysis";
import MiniLLMAnalysis from "@/components/competitive-analysis/MiniLLMAnalysis";
import {
  getCompetitorAnalysisById,
  extractDomain,
  CompetitorAnalysisResponse,
  MiniLLMResult,
  getCompetitorAnalysisFromReport,
} from '@/services/competitorAnalysisService';
import { useReports, useReport } from '@/hooks/useReports';
import { useSearchParams } from 'react-router-dom';
import type { AnalyseConcurrentielleV3, BenchmarkTechnique, EvolutionConcurrents } from '@/lib/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const Competition = () => {
  usePageTitle('Veille concurrentielle');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const { toast } = useToast();

  // États pour la nouvelle API
  const [currentAnalysis, setCurrentAnalysis] = useState<CompetitorAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // État pour les analyses LLM détaillées
  const [miniLLMResults, setMiniLLMResults] = useState<MiniLLMResult[]>([]);
  const [loadingMiniLLM, setLoadingMiniLLM] = useState(false);

  // État pour le mode d'affichage benchmark
  const [benchmarkView, setBenchmarkView] = useState<'score' | 'raw_data'>('score');

  // État pour le modal de détails GEO
  const [geoModalOpen, setGeoModalOpen] = useState(false);
  const [selectedGeoEntry, setSelectedGeoEntry] = useState<{ url: string; domain: string; data: any } | null>(null);

  // État pour le tooltip hover de la matrice
  const [hoveredMatricePoint, setHoveredMatricePoint] = useState<string | null>(null);
  const [showAllLegend, setShowAllLegend] = useState(false);

  const { usageLimits, canUseFeature, subscription } = usePayment() as any;
  const isStarter = subscription?.plan?.id === 'solo';

  // Récupérer la liste des rapports comme dans la home page (useReports -> /llmo/reports)
  const { reports, loading: reportsLoading } = useReports();
  const [searchParams] = useSearchParams();
  const explicitReportId = searchParams.get('reportId');
  // Priorité : reportId de l'URL > dernier rapport de la liste
  const latestReportId = explicitReportId || (reports.length > 0 ? reports[reports.length - 1].id : null);

  // Charger le rapport complet pour accéder à analyse_concurrentielle_v3 et materiality_matrix
  const { report: reportData } = useReport(latestReportId);

  // Données v3, materiality_matrix et benchmark_technique depuis le rapport
  const v3Data = reportData?.analyse_concurrentielle_v3 as AnalyseConcurrentielleV3 | null | undefined;
  const benchmarkTechnique = reportData?.benchmark_technique as BenchmarkTechnique | null | undefined;
  const materialityMatrix = (reportData as any)?.materiality_matrix as {
    brands: Array<{
      name: string;
      url: string;
      is_target: boolean;
      audited: boolean;
      visibility: number;
      sentiment: number;
      total_score: number;
      pillars: Record<string, { score: number; max: number }>;
      gaps: string[];
    }>;
    quadrants: { leaders: string[]; niche_players: string[]; controversial: string[]; laggers: string[] };
    stats: { total_brands: number; with_audit: number; without_audit: number; source: string };
  } | null | undefined;

  // Fonction pour charger une analyse par ID
  const loadAnalysisById = async (analysisId: number) => {
    try {
      setMiniLLMResults([]);

      let analysis: CompetitorAnalysisResponse | null = null;

      try {
        analysis = await getCompetitorAnalysisFromReport(analysisId);
      } catch (reportError) {
      }

      if (!analysis) {
        analysis = await getCompetitorAnalysisById(analysisId);
      }

      if (analysis) {
        setCurrentAnalysis(analysis);
        if (analysis.mini_llm_results && analysis.mini_llm_results.length > 0) {
          setMiniLLMResults(analysis.mini_llm_results);
        }
      }
    } catch (error) {
    }
  };

  // Fonction pour charger la liste des analyses depuis l'API
  // Charger automatiquement la dernière analyse via le dernier report ID
  useEffect(() => {
    if (latestReportId && !reportsLoading) {
      loadAnalysisById(Number(latestReportId));
    }
  }, [latestReportId, reportsLoading]);

  // Fake data pour preview (à supprimer quand l'API est prête)
  const FAKE_EVOLUTION_DATA: EvolutionConcurrents = {
    target_evolution: [
      { session_id: 1, date: '2025-06-01', score: 0.35 },
      { session_id: 2, date: '2025-07-01', score: 0.38 },
      { session_id: 3, date: '2025-08-01', score: 0.42 },
      { session_id: 4, date: '2025-09-01', score: 0.45 },
      { session_id: 5, date: '2025-10-01', score: 0.48 },
      { session_id: 6, date: '2025-11-01', score: 0.52 },
      { session_id: 7, date: '2025-12-01', score: 0.55 },
      { session_id: 8, date: '2026-01-01', score: 0.60 },
      { session_id: 9, date: '2026-02-01', score: 0.63 },
    ],
    target_trend: { direction: 'up', change: 0.28 },
    competitors: {},
    new_competitors: [],
    disappeared_competitors: [],
  };

  // Données d'évolution concurrentielle depuis le rapport, fallback sur fake data
  const evolutionData = (reportData?.evolution_concurrents as EvolutionConcurrents | null) || FAKE_EVOLUTION_DATA;

  // Fonction extractDomain déjà importée du service

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getGradeColor = (grade: string) => {
    if (grade.includes("optimisé")) return "bg-red-100 text-red-800";
    if (grade.includes("Révisions")) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <div className="min-h-screen bg-[#F5F6F7] p-6">
      <div className="w-full space-y-6">
        {/* Header avec titre et filtres */}
        
        <div className="space-y-6">

            {/* Bouton de débogage temporaire */}
            {/* <div className="mb-4 p-4 bg-muted rounded-lg">
              <h3 className="text-sm font-semibold mb-2">🔧 Débogage Quotas</h3>
              <div className="text-xs space-y-1">
                <div>UsageLimits chargé: {usageLimits ? '✅' : '❌'}</div>
                {usageLimits && (
                  <div>Analyse concurrentielle: {usageLimits.can_use_competitor_analysis?.allowed ? '✅' : '❌'} ({usageLimits.can_use_competitor_analysis?.limit})</div>
                )}
                <div>Cookies présents: {document.cookie.length > 10 ? '✅' : '❌'}</div>
                <div>Session valide: {document.cookie.length > 10 ? '✅' : '❌'}</div>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={async () => {
                    const testResult = canUseFeature('competitor_analysis');
                    const featureLimits = usageLimits?.can_use_competitor_analysis;
                    alert(`canUseFeature: ${testResult}\nLimits: ${JSON.stringify(featureLimits, null, 2)}`);
                  }}
                  size="sm"
                  variant="outline"
                >
                  Tester Quotas
                </Button>
                <Button
                  onClick={async () => {
                    // Forcer le rechargement
                    window.location.reload();
                  }}
                  size="sm"
                  variant="outline"
                >
                  Recharger
                </Button>
                <Button
                  onClick={async () => {
                    // Tester via une requête API pour voir si la session est valide
                    try {
                      const response = await fetch('/api/v1/usage/limits', {
                        method: 'GET',
                        credentials: 'include'
                      });

                      if (response.ok) {
                        alert('✅ Session valide - Authentification réussie');
                      } else if (response.status === 401) {
                        alert('❌ Session expirée - Reconnexion nécessaire\nRedirection vers la page de connexion...');
                        window.location.href = '/login';
                      } else {
                        alert(`❓ Erreur inconnue: ${response.status}`);
                      }
                    } catch (error) {
                      alert('❌ Erreur de réseau - Vérifiez votre connexion');
                    }
                  }}
                  size="sm"
                  variant="outline"
                >
                  Tester Session
                </Button>
              </div>
            </div> */}

            {/* Affichage des erreurs */}
            {error && (
              <Card className="border-gray-200 bg-gray-50 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Veuillez patienter</h3>
                      <p className="text-gray-600 mt-1">Votre analyse est en cours de finalisation. Les résultats vont s'afficher dès qu'ils sont prêts.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* État vide - Squelette */}
            {!currentAnalysis && !error && (
              <Card className="bg-white border-gray-200 shadow-sm" style={{ borderRadius: '20px', boxShadow: '0 18px 35px rgba(15, 23, 42, 0.06)', border: '1px solid rgba(226, 232, 240, 0.9)' }}>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {/* Squelette header */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 w-48 bg-gray-100 rounded-lg animate-pulse" />
                        <div className="h-3 w-32 bg-gray-50 rounded-lg animate-pulse" />
                      </div>
                    </div>

                    {/* Squelette cards concurrents */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-5 rounded-xl border border-gray-100 bg-gray-50/50">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
                              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                            </div>
                            <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                          </div>
                          <div className="space-y-2">
                            <div className="h-2 w-full bg-gray-100 rounded-full animate-pulse" />
                            <div className="h-2 w-3/4 bg-gray-100 rounded-full animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Squelette graphique */}
                    <div className="p-6 rounded-xl border border-gray-100 bg-gray-50/50">
                      <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-4 mx-auto" />
                      <div className="h-48 w-full bg-gray-100 rounded-lg animate-pulse" />
                    </div>

                    {/* Message */}
                    <div className="text-center py-4">
                      <p className="text-gray-400 text-sm">
                        Aucune analyse disponible
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Affichage complet de toutes les données */}
            {currentAnalysis && (
              <div className="space-y-6 mb-6">

                {/* Statistiques globales */}
                {/* <Card className="bg-card border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg text-foreground">📈 Statistiques Globales</CardTitle>
                  </CardHeader>
                  <CardContent className="text-foreground">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-xl font-bold">{currentAnalysis.global_stats?.total_models_executed || 0}</div>
                        <div className="text-sm text-muted-foreground">Modèles exécutés</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-xl font-bold">{currentAnalysis.global_stats?.total_competitors_found || 0}</div>
                        <div className="text-sm text-muted-foreground">Concurrents trouvés</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-xl font-bold">{currentAnalysis.global_stats?.analysis_duration_ms || 0}ms</div>
                        <div className="text-sm text-muted-foreground">Durée d'analyse</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-xl font-bold">{currentAnalysis.global_stats?.average_competitors_per_model || 0}</div>
                        <div className="text-sm text-muted-foreground">Moyenne par modèle</div>
                      </div>
                    </div>
                  </CardContent>
                </Card> */}

                {/* Métadonnées de l'analyse */}
                {/* <Card className="bg-card border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg text-foreground">⚙️ Métadonnées de l'Analyse</CardTitle>
                  </CardHeader>
                  <CardContent className="text-foreground">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div><strong>Score minimum:</strong> {currentAnalysis.analysis_metadata?.min_score || 0}</div>
                        <div><strong>Mentions minimum:</strong> {currentAnalysis.analysis_metadata?.min_mentions || 0}</div>
                        <div><strong>Include raw:</strong> {currentAnalysis.analysis_metadata?.include_raw ? 'Oui' : 'Non'}</div>
                        <div><strong>Include benchmark:</strong> {currentAnalysis.analysis_metadata?.include_benchmark ? 'Oui' : 'Non'}</div>
                      </div>
                      <div className="space-y-2">
                        <div><strong>Benchmark competitors:</strong> {currentAnalysis.analysis_metadata?.benchmark_competitors_count || 0}</div>
                        <div><strong>LLMO analysis:</strong> {currentAnalysis.analysis_metadata?.include_llmo_analysis ? 'Oui' : 'Non'}</div>
                        <div><strong>LLMO count:</strong> {currentAnalysis.analysis_metadata?.llmo_analysis_count || 0}</div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <strong>Modèles demandés:</strong>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {currentAnalysis.analysis_metadata?.models_requested?.map((model, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs text-foreground">
                            {model}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card> */}

                {/* Section Evo concurrentielle et Détails par Modèle côte à côte */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Évolution concurrentielle - Graphiques et données */}
                  {(() => {
                    if (!evolutionData || !evolutionData.target_evolution) return null;

                    const trendIcon = (dir: string) => dir === 'up' ? '\u2191' : dir === 'down' ? '\u2193' : '\u2192';
                    const trendColor = (dir: string) => dir === 'up' ? 'text-green-600' : dir === 'down' ? 'text-red-500' : 'text-gray-500';

                    // Build line chart data from target_evolution only
                    const lineChartData = (evolutionData.target_evolution || [])
                      .filter(s => s && s.date)
                      .map(s => ({ date: String(s.date), Score: Math.round((s.score || 0) * 100) }))
                      .sort((a, b) => a.date.localeCompare(b.date));

                    return (
                      <Card className="bg-white border-gray-200 shadow-sm" style={{ borderRadius: '20px', padding: '28px', boxShadow: '0 18px 35px rgba(15, 23, 42, 0.06)', border: '1px solid rgba(226, 232, 240, 0.9)' }}>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4" style={{ letterSpacing: '1.2px' }}>
                          Évolution concurrentielle
                        </div>

                        {/* A) Line chart - votre score */}
                        {lineChartData.length > 0 && (
                          <div className="mb-6">
                            <div className="text-sm font-semibold text-gray-700 mb-2">Votre score dans le temps</div>
                            <div style={{ width: '100%', height: 260 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={lineChartData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                                  <Tooltip formatter={(value: number) => `${value}%`} />
                                  <Line type="monotone" dataKey="Score" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}

                        {/* B) Badge trend */}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs gap-1">
                            <span className={trendColor(evolutionData.target_trend.direction)}>
                              {trendIcon(evolutionData.target_trend.direction)}
                            </span>
                            Vous {evolutionData.target_trend.change !== 0 && `(${evolutionData.target_trend.change > 0 ? '+' : ''}${Math.round(evolutionData.target_trend.change * 100)}%)`}
                          </Badge>
                        </div>

                      </Card>
                    );
                  })()}

                  {/* Détails par modèle */}
                  {(() => {
                    // Grouper les concurrents par nom commercial (fusionner sonar + sonar-pro → Perplexity)
                    const competitorsByCommercial: Record<string, any[]> = {};

                    const isV3 = !!(v3Data && v3Data.consolidated_competitors && v3Data.consolidated_competitors.length > 0);

                    // Domaine client pour exclusion
                    const clientUrl = currentAnalysis?.url || v3Data?.url || '';
                    const clientDomain = extractDomain(clientUrl).toLowerCase().replace('www.', '');
                    const clientBase = clientDomain.split('.')[0];

                    if (isV3) {
                      // SOURCE PRIORITAIRE: v3 consolidated_competitors avec source_models
                      const filtered = v3Data!.consolidated_competitors.filter(c => {
                        const compDomain = extractDomain(c.primary_url).toLowerCase().replace('www.', '');
                        const compBase = compDomain.split('.')[0];
                        const compName = (c.name || '').toLowerCase();
                        return !clientBase || (compDomain !== clientDomain && compBase !== clientBase && !compName.includes(clientBase));
                      });

                      filtered.forEach(c => {
                        if (c.source_models && Array.isArray(c.source_models)) {
                          c.source_models.forEach(model => {
                            const commercial = getCommercialModelName(model);
                            if (!competitorsByCommercial[commercial]) {
                              competitorsByCommercial[commercial] = [];
                            }
                            const domain = extractDomain(c.primary_url);
                            const alreadyAdded = competitorsByCommercial[commercial].some(
                              (existing: any) => extractDomain(existing.url || existing.primary_url || '') === domain
                            );
                            if (!alreadyAdded) {
                              competitorsByCommercial[commercial].push({
                                ...c,
                                url: c.primary_url,
                                sources: c.source_models,
                              });
                            }
                          });
                        }
                      });
                    } else {
                      // FALLBACK: ancienne logique
                      const competitors = (currentAnalysis as any)?.competitors;
                      if (competitors && Array.isArray(competitors)) {
                        competitors.forEach((competitor: any) => {
                          if (competitor.sources && Array.isArray(competitor.sources)) {
                            competitor.sources.forEach((source: string) => {
                              const commercial = getCommercialModelName(source);
                              if (!competitorsByCommercial[commercial]) {
                                competitorsByCommercial[commercial] = [];
                              }
                              const domain = extractDomain(competitor.url || competitor.primary_url || '');
                              const alreadyAdded = competitorsByCommercial[commercial].some(
                                (c: any) => extractDomain(c.url || c.primary_url || '') === domain
                              );
                              if (!alreadyAdded) {
                                competitorsByCommercial[commercial].push(competitor);
                              }
                            });
                          }
                        });
                      }
                    }

                    const modelNames = Object.keys(competitorsByCommercial);
                    const defaultModel = modelNames[0] || '';
                    const currentSelectedModel = selectedModel || defaultModel;
                    const currentCompetitors = competitorsByCommercial[currentSelectedModel] || [];

                    // Initialiser le modèle sélectionné si vide
                    if (!selectedModel && defaultModel) {
                      setSelectedModel(defaultModel);
                    }

                    if (modelNames.length === 0) {
                      return (
                        <Card className="bg-white border-gray-200 shadow-sm">
                          <CardContent className="flex flex-col items-center justify-center py-8">
                            <Users className="h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="font-semibold text-gray-900 mb-2">Aucun concurrent trouvé</h3>
                            <p className="text-sm text-gray-600 text-center">
                              Les concurrents seront affichés ici une fois l'analyse terminée.
                            </p>
                          </CardContent>
                        </Card>
                      );
                    }

                    return (
                      <Card className="bg-white border-gray-200 shadow-sm" style={{ borderRadius: '20px', padding: '28px', boxShadow: '0 18px 35px rgba(15, 23, 42, 0.06)', border: '1px solid rgba(226, 232, 240, 0.9)' }}>
                        <div className="flex justify-end items-center mb-4">
                          <Select value={currentSelectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger className="w-[180px] h-8 text-xs border-gray-300 bg-white rounded-md px-2.5 py-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {modelNames.map((commercialName) => (
                                <SelectItem key={commercialName} value={commercialName}>
                                  <div className="flex items-center gap-2">
                                    {getModelLogo(commercialName) ? (
                                      <img src={getModelLogo(commercialName)!} alt={commercialName} className="w-4 h-4 object-contain" />
                                    ) : null}
                                    <span>{commercialName}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3" style={{ letterSpacing: '1.2px' }}>
                            {currentCompetitors.length} Concurrent{currentCompetitors.length > 1 ? 's' : ''} - {currentSelectedModel}
                          </div>
                          
                          <div className="max-h-[500px] overflow-y-auto pr-2">
                            {currentCompetitors.map((competitor: any, index: number) => {
                              const rank = competitor.model_rank || (index + 1);
                              const domain = extractDomain(competitor.url || competitor.primary_url || '');
                              return (
                                <div key={index} className="flex items-center gap-3 py-3 border-b border-gray-200 last:border-b-0 hover:bg-blue-50/30 transition-colors" style={{ borderBottom: index < currentCompetitors.length - 1 ? '1px solid #edf2f7' : 'none' }}>
                                  <div className="text-base font-bold text-gray-400 min-w-[32px]" style={{ fontSize: '13px', fontWeight: 700 }}>{rank}</div>
                                  <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt={domain} width={20} height={20} style={{ borderRadius: '4px', flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                  <div className="flex-1">
                                    <div className="font-semibold text-gray-900 mb-0.5" style={{ fontSize: '15px', fontWeight: 600 }}>{competitor.name || domain}</div>
                                    <div className="text-gray-500" style={{ fontSize: '13px', color: '#94a3b8' }}>{domain}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </Card>
                    );
                  })()}
                </div>

                {/* Analyses détaillées LLM */}

                {/* Avantages concurrentiels et axes d'amélioration */}
                {(currentAnalysis.target_positioning?.competitive_advantages?.length || 0) > 0 || (currentAnalysis.target_positioning?.improvement_areas?.length || 0) > 0 ? (
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-200">
                      <CardTitle className="text-lg font-semibold text-gray-900">Analyse qualitative</CardTitle>
                      <CardDescription className="text-gray-600">
                        Points forts identifiés et axes d'amélioration recommandés
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Points forts */}
                        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                          <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Points forts
                          </h4>
                          {(currentAnalysis.target_positioning?.competitive_advantages || []).length > 0 ? (
                            <ul className="space-y-2 list-disc list-inside">
                              {currentAnalysis.target_positioning!.competitive_advantages.map((item, idx) => (
                                <li key={idx} className="text-sm text-gray-900">{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-sm text-gray-600">Aucun point fort listé</div>
                          )}
                        </div>

                      </div>
                    </CardContent>
                  </Card>
                ) : null}


                  {/* Matrice de Matérialité */}
                  {(() => {
                    // Source prioritaire : materialityMatrix (endpoint dédié)
                    // Fallback : ancienne logique via competitors + benchmark_results.raw_data
                    const useMateriality = !!(materialityMatrix && materialityMatrix.brands && materialityMatrix.brands.length > 0);

                    type MatricePoint = {
                      name: string;
                      url: string;
                      favicon_url?: string;
                      visibility: number;
                      sentiment: number;
                      totalScore: number;
                      mentions: number;
                      isTarget: boolean;
                      audited: boolean;
                      scoreDetails?: any;
                      grade?: string;
                      recommendations?: string[];
                      pillars?: Record<string, { score: number; max: number }>;
                      gaps?: string[];
                    };

                    const dataPoints: MatricePoint[] = [];

                    if (useMateriality) {
                      // Nouvelle source : materiality_matrix
                      materialityMatrix!.brands.forEach(b => {
                        const domain = extractDomain(b.url);
                        dataPoints.push({
                          name: b.name,
                          url: b.url,
                          favicon_url: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
                          visibility: b.visibility,
                          sentiment: b.sentiment,
                          totalScore: b.total_score,
                          mentions: 0,
                          isTarget: b.is_target,
                          audited: b.audited,
                          pillars: b.pillars,
                          gaps: b.gaps,
                        });
                      });
                    } else {
                      // Fallback : ancienne logique
                      const competitors = (currentAnalysis as any)?.competitors;
                      const benchmarkRaw = (currentAnalysis as any)?.benchmark_results?.raw_data;
                      const analysisUrl = currentAnalysis?.url || '';

                      if (!competitors || competitors.length === 0) return null;

                      const competitorsByUrl = new Map<string, any>();
                      for (const c of competitors) {
                        const existing = competitorsByUrl.get(c.url);
                        if (!existing || c.mentions > existing.mentions) {
                          competitorsByUrl.set(c.url, c);
                        }
                      }

                      for (const [url, comp] of competitorsByUrl) {
                        const benchEntry = benchmarkRaw?.[url];
                        const hasScore = benchEntry && typeof benchEntry.total_score === 'number';
                        const totalScore = hasScore ? benchEntry.total_score : 0;

                        dataPoints.push({
                          name: comp.name,
                          url,
                          favicon_url: comp.favicon_url || `https://www.google.com/s2/favicons?domain=${url.replace(/^https?:\/\//, '').replace(/\/.*/, '')}&sz=32`,
                          visibility: totalScore,
                          sentiment: comp.average_score || 0,
                          totalScore,
                          mentions: comp.mentions || 0,
                          isTarget: false,
                          audited: false,
                          scoreDetails: hasScore ? benchEntry : undefined,
                          grade: hasScore ? benchEntry.grade : undefined,
                          recommendations: hasScore ? benchEntry.primary_recommendations : undefined,
                        });
                      }

                      // Add user's site
                      if (analysisUrl && benchmarkRaw?.[analysisUrl]) {
                        const targetEntry = benchmarkRaw[analysisUrl];
                        const targetScore = targetEntry.total_score || 0;
                        const domain = analysisUrl.replace(/^https?:\/\//, '').replace(/\/.*/, '');
                        dataPoints.push({
                          name: domain,
                          url: analysisUrl,
                          favicon_url: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
                          visibility: targetScore,
                          sentiment: Math.min(1, targetScore / 100 * 1.2),
                          totalScore: targetScore,
                          mentions: 0,
                          isTarget: true,
                          audited: true,
                          scoreDetails: targetEntry,
                          grade: targetEntry.grade,
                          recommendations: targetEntry.primary_recommendations,
                        });
                      }
                    }

                    if (dataPoints.length === 0) return null;

                    // Limiter à 12 concurrents max pour éviter le parasitage
                    const MAX_DISPLAY = 12;
                    let displayPoints = dataPoints;
                    if (dataPoints.length > MAX_DISPLAY) {
                      const target = dataPoints.filter(d => d.isTarget);
                      const others = dataPoints.filter(d => !d.isTarget)
                        .sort((a, b) => b.totalScore - a.totalScore)
                        .slice(0, MAX_DISPLAY - target.length);
                      displayPoints = [...target, ...others];
                    }

                    const chartW = 1000;
                    const chartH = 720;
                    const pad = { top: 40, right: 40, bottom: 75, left: 75 };
                    const plotW = chartW - pad.left - pad.right;
                    const plotH = chartH - pad.top - pad.bottom;
                    const xScale = (v: number) => pad.left + (v / 100) * plotW;
                    const yScale = (s: number) => pad.top + plotH - s * plotH;

                    // Legend pagination
                    const LEGEND_INITIAL = 5;
                    const legendItems = displayPoints;
                    const visibleLegend = showAllLegend ? legendItems : legendItems.slice(0, LEGEND_INITIAL);
                    const hasMoreLegend = legendItems.length > LEGEND_INITIAL;

                    return (
                      <Card className="w-full bg-white border-gray-200 shadow-sm" style={{ borderRadius: '20px', padding: '28px', boxShadow: '0 18px 35px rgba(15, 23, 42, 0.06)', border: '1px solid rgba(226, 232, 240, 0.9)' }}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ textAlign: 'center' }}>
                          Matrice de Matérialité
                        </h3>
                        {dataPoints.length > MAX_DISPLAY && (
                          <p className="text-xs text-gray-400 mb-3" style={{ textAlign: 'center' }}>
                            Top {MAX_DISPLAY} concurrents affichés sur {dataPoints.length}
                          </p>
                        )}

                        {/* Legend with pagination */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16, alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 12, color: '#64748B' }}>Marques</span>
                          {visibleLegend.map(d => (
                            <div
                              key={d.url}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4, cursor: isStarter ? 'default' : 'pointer',
                                padding: '2px 8px', borderRadius: 6,
                                background: d.isTarget ? '#EEF2FF' : 'transparent',
                                border: d.isTarget ? '1px solid #C7D2FE' : '1px solid transparent',
                              }}
                              onClick={() => {
                                if (isStarter) return;
                                setSelectedGeoEntry({
                                  url: d.url,
                                  domain: extractDomain(d.url),
                                  data: d.scoreDetails || { pillars: d.pillars, gaps: d.gaps, total_score: d.totalScore, audited: d.audited, visibility: d.visibility, sentiment: d.sentiment }
                                });
                                setGeoModalOpen(true);
                              }}
                            >
                              <img
                                src={d.favicon_url}
                                alt={d.name}
                                style={{ width: 16, height: 16, borderRadius: 3 }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                              <span style={{ fontSize: 11, color: d.isTarget ? '#4F46E5' : '#475569', fontWeight: d.isTarget ? 600 : 400 }}>
                                {d.name}
                              </span>
                              {d.audited && (
                                <span style={{ fontSize: 9, color: '#16A34A', fontWeight: 600 }} title="Audité">&#x2713;</span>
                              )}
                            </div>
                          ))}
                          {hasMoreLegend && (
                            <button
                              onClick={() => setShowAllLegend(!showAllLegend)}
                              style={{
                                fontSize: 11, color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer',
                                padding: '2px 6px', fontWeight: 500, textDecoration: 'underline',
                              }}
                            >
                              {showAllLegend ? 'Voir moins' : `+${legendItems.length - LEGEND_INITIAL} autres`}
                            </button>
                          )}
                        </div>

                        {/* SVG Scatter Chart */}
                        <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
                          <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', maxWidth: chartW, height: 'auto' }}>
                            {/* Quadrant backgrounds */}
                            <rect x={pad.left} y={pad.top} width={plotW} height={plotH} fill="#FAFBFC" />

                            {/* Quadrant labels */}
                            <text x={pad.left + plotW * 0.25} y={pad.top + 22} textAnchor="middle" fontSize="14" fill="#6B7280" fontWeight="600">Niche Players</text>
                            <text x={pad.left + plotW * 0.75} y={pad.top + 22} textAnchor="middle" fontSize="14" fill="#16A34A" fontWeight="600">Leaders</text>
                            <text x={pad.left + plotW * 0.25} y={pad.top + plotH - 10} textAnchor="middle" fontSize="14" fill="#DC2626" fontWeight="600">Laggers</text>
                            <text x={pad.left + plotW * 0.75} y={pad.top + plotH - 10} textAnchor="middle" fontSize="14" fill="#D97706" fontWeight="600">Controversial</text>

                            {/* Grid lines */}
                            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(v => (
                              <g key={`x-${v}`}>
                                <line x1={xScale(v)} y1={pad.top} x2={xScale(v)} y2={pad.top + plotH} stroke="#E5E7EB" strokeWidth={0.5} strokeDasharray={v === 50 ? "0" : "4 2"} />
                                <text x={xScale(v)} y={pad.top + plotH + 20} textAnchor="middle" fontSize="11" fill="#9CA3AF">{v}%</text>
                              </g>
                            ))}
                            {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map(s => (
                              <g key={`y-${s}`}>
                                <line x1={pad.left} y1={yScale(s)} x2={pad.left + plotW} y2={yScale(s)} stroke="#E5E7EB" strokeWidth={0.5} strokeDasharray={s === 0.5 ? "0" : "4 2"} />
                                <text x={pad.left - 12} y={yScale(s) + 4} textAnchor="end" fontSize="11" fill="#9CA3AF">{s.toFixed(1)}</text>
                              </g>
                            ))}

                            {/* Center cross */}
                            <line x1={xScale(50)} y1={pad.top} x2={xScale(50)} y2={pad.top + plotH} stroke="#CBD5E1" strokeWidth={1} />
                            <line x1={pad.left} y1={yScale(0.5)} x2={pad.left + plotW} y2={yScale(0.5)} stroke="#CBD5E1" strokeWidth={1} />

                            {/* Axis labels */}
                            <text x={pad.left + plotW / 2} y={chartH - 10} textAnchor="middle" fontSize="13" fill="#6B7280" fontWeight="500">Visibility</text>
                            <text x={18} y={pad.top + plotH / 2} textAnchor="middle" fontSize="13" fill="#6B7280" fontWeight="500" transform={`rotate(-90, 18, ${pad.top + plotH / 2})`}>Sentiment</text>

                            {/* Data points - render non-hovered first, hovered last so tooltip stays on top */}
                            {[...displayPoints].sort((a, b) => (a.url === hoveredMatricePoint ? 1 : 0) - (b.url === hoveredMatricePoint ? 1 : 0)).map((d, i) => {
                              const cx = xScale(d.visibility);
                              const cy = yScale(d.sentiment);
                              const quadrantInfo = d.visibility >= 50
                                ? (d.sentiment >= 0.5
                                  ? { label: 'Leader', desc: 'Très bien positionné. Forte visibilité et perception positive par les IA.', color: '#22C55E' }
                                  : { label: 'Controversial', desc: 'Visible mais mal perçu. Les IA le mentionnent souvent mais avec un sentiment négatif.', color: '#F59E0B' })
                                : (d.sentiment >= 0.5
                                  ? { label: 'Niche Player', desc: 'Bien perçu mais peu visible. Les IA en parlent positivement mais rarement.', color: '#6366F1' }
                                  : { label: 'Lagger', desc: 'En retard. Faible visibilité et perception négative par les IA.', color: '#EF4444' });
                              const isHovered = hoveredMatricePoint === d.url;
                              const tooltipW = 220;
                              const tooltipH = 130;
                              const tooltipX = cx + tooltipW + 20 > chartW ? cx - tooltipW - 10 : cx + 24;
                              const tooltipY = cy - tooltipH / 2 < 0 ? 4 : (cy + tooltipH / 2 > chartH ? chartH - tooltipH - 4 : cy - tooltipH / 2);


                              return (
                                <g
                                  key={d.url + i}
                                  style={{ cursor: isStarter ? 'default' : 'pointer' }}
                                  onMouseEnter={() => setHoveredMatricePoint(d.url)}
                                  onMouseLeave={() => setHoveredMatricePoint(null)}
                                  onClick={() => {
                                    if (isStarter) return;
                                    setSelectedGeoEntry({
                                      url: d.url,
                                      domain: extractDomain(d.url),
                                      data: d.scoreDetails || { pillars: d.pillars, gaps: d.gaps, total_score: d.totalScore, audited: d.audited, visibility: d.visibility, sentiment: d.sentiment }
                                    });
                                    setGeoModalOpen(true);
                                  }}
                                >
                                  <circle cx={cx} cy={cy} r={isHovered ? 28 : 26} fill="rgba(0,0,0,0.06)" />
                                  <circle
                                    cx={cx} cy={cy} r={isHovered ? 26 : 24}
                                    fill={d.isTarget ? '#4F46E5' : '#fff'}
                                    stroke={d.isTarget ? '#4F46E5' : d.audited ? '#22C55E' : '#E2E8F0'}
                                    strokeWidth={isHovered ? 3 : 2}
                                    strokeDasharray={d.audited ? '0' : '4 2'}
                                  />
                                  <image
                                    href={d.favicon_url}
                                    x={cx - 14} y={cy - 14} width={28} height={28}
                                    style={{ pointerEvents: 'none' }}
                                  />
                                  {isHovered && (
                                    <foreignObject x={tooltipX} y={tooltipY} width={tooltipW} height={tooltipH} style={{ pointerEvents: 'none', overflow: 'visible' }}>
                                      <div style={{
                                        background: '#F8FAFC', color: '#1E293B', borderRadius: 10, padding: '12px 14px',
                                        fontSize: 11, lineHeight: 1.5, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0',
                                        filter: isStarter ? 'blur(4px)' : 'none',
                                      }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                          <span style={{ fontWeight: 700, fontSize: 13, color: '#1E293B' }}>{d.name}</span>
                                          <span style={{ fontSize: 10, fontWeight: 600, color: quadrantInfo.color, background: '#F1F5F9', padding: '1px 6px', borderRadius: 4 }}>{quadrantInfo.label}</span>
                                          {d.audited && <span style={{ fontSize: 9, color: '#16A34A', fontWeight: 600, background: '#F0FDF4', padding: '1px 4px', borderRadius: 3 }}>Audité</span>}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#475569', marginBottom: 8, lineHeight: 1.4 }}>
                                          {quadrantInfo.desc}
                                        </div>
                                        <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                                          <span><span style={{ color: '#64748B' }}>Visibility </span><span style={{ fontWeight: 600, color: '#1E293B' }}>{d.visibility}%</span></span>
                                          <span><span style={{ color: '#64748B' }}>Sentiment </span><span style={{ fontWeight: 600, color: '#1E293B' }}>{(d.sentiment * 100).toFixed(0)}%</span></span>
                                        </div>
                                      </div>
                                    </foreignObject>
                                  )}
                                  {/* Lock overlay for solo plan on hover */}
                                  {isHovered && isStarter && (
                                    <foreignObject x={tooltipX} y={tooltipY} width={tooltipW} height={tooltipH} style={{ pointerEvents: 'none', overflow: 'visible' }}>
                                      <div style={{
                                        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      }}>
                                        <div style={{
                                          background: 'rgba(255,255,255,0.85)', borderRadius: 8, padding: '8px 14px',
                                          display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        }}>
                                          <Lock className="w-3.5 h-3.5 text-gray-500" />
                                          <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>Plan supérieur requis</span>
                                        </div>
                                      </div>
                                    </foreignObject>
                                  )}
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      </Card>
                    );
                  })()}

                  {/* Benchmark Technique */}
                  {benchmarkTechnique && benchmarkTechnique.status === 'completed' && (() => {
                    const targetUrl = benchmarkTechnique.target?.url || currentAnalysis?.url || '';
                    const targetDomain = extractDomain(targetUrl).toLowerCase().replace('www.', '');
                    const targetScore = benchmarkTechnique.target?.score_global ?? null;

                    // Build list: ranking + target if not already in ranking
                    const ranking = benchmarkTechnique.ranking || [];
                    const targetInRanking = ranking.some(s => extractDomain(s.url).toLowerCase().replace('www.', '') === targetDomain);
                    const allSites = targetInRanking ? ranking : [
                      ...(targetScore !== null ? [{ url: targetUrl, score_global: targetScore }] : []),
                      ...ranking,
                    ].sort((a, b) => ((b as any).score_global ?? (b as any).total_score ?? 0) - ((a as any).score_global ?? (a as any).total_score ?? 0));

                    if (allSites.length === 0) return null;

                    return (
                      <Card className="bg-white border-gray-200 shadow-sm" style={{ borderRadius: '20px', padding: '28px', boxShadow: '0 18px 35px rgba(15, 23, 42, 0.06)', border: '1px solid rgba(226, 232, 240, 0.9)' }}>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4" style={{ letterSpacing: '1.2px' }}>
                          Benchmark Technique — {allSites.length} sites
                        </div>

                        {/* Rows */}
                        <div className="max-h-[600px] overflow-y-auto">
                          {allSites.map((site, idx) => {
                            const domain = extractDomain(site.url);
                            const isTarget = domain.toLowerCase().replace('www.', '') === targetDomain;
                            const s = site as any;
                            const globalScore = s.score_global ?? s.total_score ?? s.score ?? 0;
                            const scoreColor = (s: number) => s >= 70 ? '#10B981' : s >= 40 ? '#F59E0B' : '#EF4444';

                            return (
                              <div
                                key={idx}
                                className={`flex items-center gap-4 py-4 border-b border-gray-100 last:border-b-0 ${isTarget ? 'bg-blue-50/50' : 'hover:bg-gray-50'} transition-colors px-2`}
                              >
                                <div className="text-base font-bold text-gray-400 min-w-[32px]">{idx + 1}</div>
                                <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt={domain} width={24} height={24} style={{ borderRadius: '4px', flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                <span className={`flex-1 text-base font-medium truncate ${isTarget ? 'text-blue-600' : 'text-gray-900'}`}>{domain}</span>
                                <span className="text-lg font-bold" style={{ color: scoreColor(globalScore) }}>{Math.round(globalScore)}<span className="text-sm text-gray-400 font-normal">/100</span></span>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    );
                  })()}

                  {/* Données Benchmark - Mode Paysage - Pleine Largeur */}
                  {(currentAnalysis as any).benchmark_results?.benchmark && (() => {
                  const benchmarkData = (currentAnalysis as any).benchmark_results.benchmark;
                  const classement = benchmarkData.classement || [];
                  const yourSiteIndex = classement.findIndex((e: any) => e.url === currentAnalysis.url);
                  const yourSiteRank = yourSiteIndex >= 0 ? yourSiteIndex + 1 : null;
                  
                  return (
                    <Card className="w-full bg-white border-gray-200 shadow-sm" style={{ borderRadius: '20px', padding: '28px', boxShadow: '0 18px 35px rgba(15, 23, 42, 0.06)', border: '1px solid rgba(226, 232, 240, 0.9)' }}>
                        {/* Header */}
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              Analyse Benchmark
                            </h3>
                            <p className="text-sm text-gray-600">
                              {benchmarkData.comparaison || 'Comparaison de votre positionnement avec vos concurrents'}
                            </p>
                          </div>
                          {yourSiteRank && (
                            <div className="text-right">
                              <div className="text-3xl font-bold text-gray-900">{yourSiteRank}{getOrdinalSuffix(yourSiteRank)}</div>
                              <div className="text-sm font-medium text-orange-500">+0</div>
                            </div>
                          )}
                        </div>

                        {/* Dropdown et tableau en mode paysage */}
                        <div className="w-full">
                          <div className="flex justify-end mb-4">
                            <Select value={benchmarkView} onValueChange={(val) => setBenchmarkView(val as 'score' | 'raw_data')}>
                              <SelectTrigger className="w-[200px] h-9 text-sm border-gray-300 bg-white">
                                <SelectValue placeholder="Score Benchmark" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="score">Score Benchmark</SelectItem>
                                <SelectItem value="raw_data">Analyse GEO</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {benchmarkView === 'score' ? (
                          <>
                          {/* Table Header - Mode Paysage avec plus de colonnes - Pleine Largeur */}
                          <div className="w-full overflow-x-auto">
                            <div className="w-full">
                              <div className="grid grid-cols-[60px_2fr_1fr_120px] gap-6 pb-3 border-b-2 border-gray-200 mb-3">
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rang</div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Marque / Domaine</div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Score</div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Position</div>
                              </div>

                              {/* Liste scrollable en mode paysage */}
                              <div className="max-h-[600px] overflow-y-auto">
                                {classement.map((entry: any, idx: number) => {
                                  const competitor = (currentAnalysis as any).competitors?.find((c: any) => c.url === entry.url);
                                  const isYourSite = entry.url === currentAnalysis.url;
                                  const brandName = isYourSite ? 'Votre site' : (competitor?.name || extractDomain(entry.url));
                                  const domain = extractDomain(entry.url);
                                  const rank = idx + 1;

                                  return (
                                    <div
                                      key={idx}
                                      className={`grid grid-cols-[60px_2fr_1fr_120px] gap-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors items-center ${isYourSite ? 'bg-blue-50/50' : ''}`}
                                    >
                                      <div className="flex items-center">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${isYourSite ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                          {rank}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3 min-w-0">
                                        <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt={domain} width={20} height={20} style={{ borderRadius: '4px', flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        <div className="min-w-0">
                                          <div className={`font-semibold text-sm ${isYourSite ? 'text-blue-600' : 'text-gray-900'}`}>
                                            {brandName}
                                          </div>
                                          <div className="text-xs text-gray-500 truncate">{domain}</div>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-base font-bold text-gray-900">{entry.score || 0}%</div>
                                      </div>
                                      <div className="text-right">
                                        <Badge
                                          variant="outline"
                                          className={`${isYourSite ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-100 border-gray-300 text-gray-700'}`}
                                        >
                                          {rank}{getOrdinalSuffix(rank)}
                                        </Badge>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          </>
                          ) : (
                          <>
                          {/* Vue Analyse GEO - raw_data */}
                          {(() => {
                            const rawData = (currentAnalysis as any)?.benchmark_results?.raw_data;
                            if (!rawData || Object.keys(rawData).length === 0) {
                              return (
                                <div className="text-center text-gray-500 py-8">
                                  Aucune donnée GEO disponible pour cette analyse.
                                </div>
                              );
                            }

                            const rawEntries = Object.entries(rawData)
                              .map(([url, data]: [string, any]) => ({
                                url,
                                domain: extractDomain(url),
                                totalScore: data.total_score || 0,
                                grade: data.grade || '-',
                                credibility: data.credibility_authority?.score || 0,
                                structure: data.structure_readability?.score || 0,
                                relevance: data.contextual_relevance?.score || 0,
                                technical: data.technical_compatibility?.score || 0,
                                recommendations: data.primary_recommendations || [],
                                fullData: data,
                              }))
                              .sort((a, b) => b.totalScore - a.totalScore);

                            const geoContent = (
                              <div className="w-full overflow-x-auto">
                                <div className="w-full">
                                  <div className="grid grid-cols-[60px_2fr_repeat(4,80px)_100px] gap-4 pb-3 border-b-2 border-gray-200 mb-3">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rang</div>
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Marque / Domaine</div>
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Crédibilité</div>
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Structure</div>
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Pertinence</div>
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Technique</div>
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Total</div>
                                  </div>

                                  <div className="max-h-[600px] overflow-y-auto">
                                    {rawEntries.map((entry, idx) => {
                                      const isYourSite = entry.url === currentAnalysis.url;
                                      const competitor = (currentAnalysis as any).competitors?.find((c: any) => c.url === entry.url);
                                      const brandName = isYourSite ? 'Votre site' : (competitor?.name || entry.domain);

                                      return (
                                        <div
                                          key={idx}
                                          className={`grid grid-cols-[60px_2fr_repeat(4,80px)_100px] gap-4 py-4 border-b border-gray-100 last:border-b-0 transition-colors items-center ${isStarter ? '' : 'cursor-pointer hover:bg-gray-50'} ${isYourSite ? 'bg-blue-50/50' : ''}`}
                                          onClick={() => {
                                            if (isStarter) return;
                                            setSelectedGeoEntry({ url: entry.url, domain: entry.domain, data: entry.fullData });
                                            setGeoModalOpen(true);
                                          }}
                                        >
                                          <div className="flex items-center">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${isYourSite ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                              {idx + 1}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-3 min-w-0">
                                            <img src={`https://www.google.com/s2/favicons?domain=${entry.domain}&sz=32`} alt={entry.domain} width={20} height={20} style={{ borderRadius: '4px', flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                            <div className="min-w-0">
                                              <div className={`font-semibold text-sm ${isYourSite ? 'text-blue-600' : 'text-gray-900'}`}>
                                                {brandName}
                                              </div>
                                              <div className="text-xs text-gray-500 truncate">{entry.domain}</div>
                                            </div>
                                          </div>
                                          <div className="text-center">
                                            <div className="text-sm font-semibold text-gray-900">{entry.credibility}</div>
                                          </div>
                                          <div className="text-center">
                                            <div className="text-sm font-semibold text-gray-900">{entry.structure}</div>
                                          </div>
                                          <div className="text-center">
                                            <div className="text-sm font-semibold text-gray-900">{entry.relevance}</div>
                                          </div>
                                          <div className="text-center">
                                            <div className="text-sm font-semibold text-gray-900">{entry.technical}</div>
                                          </div>
                                          <div className="text-center">
                                            <div className="text-base font-bold text-gray-900">{entry.totalScore}%</div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            );

                            if (isStarter) {
                              return (
                                <div style={{ position: 'relative' }}>
                                  <div style={{ filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none' }}>
                                    {geoContent}
                                  </div>
                                  <div style={{
                                    position: 'absolute', inset: 0,
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    background: 'rgba(255,255,255,0.4)', zIndex: 10, borderRadius: '12px'
                                  }}>
                                    <Lock size={28} style={{ color: '#6366F1', marginBottom: 10 }} />
                                    <p style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>
                                      Contenu réservé aux plans supérieurs
                                    </p>
                                    <p style={{ fontSize: '13px', color: '#64748B' }}>
                                      Passez à un plan supérieur pour accéder à l'analyse GEO
                                    </p>
                                  </div>
                                </div>
                              );
                            }

                            return geoContent;
                          })()}
                          </>
                          )}
                        </div>
                      </Card>
                  );
                })()}

                {/* Modal détails GEO raw_data */}
                <Dialog open={geoModalOpen} onOpenChange={(open) => {
                  setGeoModalOpen(open);
                  if (!open) setSelectedGeoEntry(null);
                }}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {selectedGeoEntry && (() => {
                      const d = selectedGeoEntry.data;
                      const competitor = (currentAnalysis as any)?.competitors?.find((c: any) => c.url === selectedGeoEntry.url);
                      const brandName = selectedGeoEntry.url === currentAnalysis?.url ? 'Votre site' : (competitor?.name || selectedGeoEntry.domain);
                      const isAudited = !!d.audited;

                      // Pillars depuis materiality_matrix
                      const p = d.pillars as Record<string, { score: number; max: number }> | undefined;

                      const categories = [
                        {
                          label: 'Crédibilité & Autoridé',
                          score: d.credibility_authority?.score ?? p?.credibility_authority?.score ?? 0,
                          max: p?.credibility_authority?.max ?? 25,
                          details: d.credibility_authority?.details || {},
                          labels: {
                            sources_verifiables: 'Sources vérifiables',
                            certifications: 'Certifications',
                            avis_clients: 'Avis clients',
                            historique_marque: 'Historique marque',
                          }
                        },
                        {
                          label: 'Structure & Lisibilité',
                          score: d.structure_readability?.score ?? p?.structure_readability?.score ?? 0,
                          max: p?.structure_readability?.max ?? 25,
                          details: d.structure_readability?.details || {},
                          labels: {
                            hierarchie: 'Hiérarchie',
                            formatage: 'Formatage',
                            lisibilite: 'Lisibilité',
                            longueur_optimale: 'Longueur optimale',
                            multimedia: 'Multimédia',
                          }
                        },
                        {
                          label: 'Pertinence contextuelle',
                          score: d.contextual_relevance?.score ?? p?.contextual_relevance?.score ?? 0,
                          max: p?.contextual_relevance?.max ?? 25,
                          details: d.contextual_relevance?.details || {},
                          labels: {
                            reponse_intention: 'Réponse intention',
                            personnalisation: 'Personnalisation',
                            actualite: 'Actualité',
                            langue_naturelle: 'Langue naturelle',
                            localisation: 'Localisation',
                          }
                        },
                        {
                          label: 'Compatibilité technique',
                          score: d.technical_compatibility?.score ?? p?.technical_compatibility?.score ?? 0,
                          max: p?.technical_compatibility?.max ?? 25,
                          details: d.technical_compatibility?.details || {},
                          labels: {
                            donnees_structurees: 'Données structurées',
                            meta_donnees: 'Métadonnées',
                            performances: 'Performances',
                            compatibilite_mobile: 'Compatibilité mobile',
                            securite: 'Sécurité',
                          }
                        },
                      ];

                      // Quadrant info
                      const vis = d.visibility ?? 0;
                      const sent = d.sentiment ?? 0;
                      const quadrant = vis >= 50
                        ? (sent >= 0.5
                          ? { label: 'Leader', color: '#22C55E', desc: 'Forte visibilité et perception positive par les IA.' }
                          : { label: 'Controversial', color: '#F59E0B', desc: 'Visible mais mal perçu par les IA.' })
                        : (sent >= 0.5
                          ? { label: 'Niche Player', color: '#6366F1', desc: 'Bien perçu mais peu visible par les IA.' }
                          : { label: 'Lagger', color: '#EF4444', desc: 'Faible visibilité et perception négative.' });

                      // Gaps
                      const gaps = (d.gaps as string[]) || [];
                      const gapLabels: Record<string, string> = {
                        sources_verifiables: 'Sources vérifiables', certifications: 'Certifications',
                        avis_clients: 'Avis clients', historique_marque: 'Historique marque',
                        hierarchie: 'Hiérarchie', formatage: 'Formatage', lisibilite: 'Lisibilité',
                        longueur_optimale: 'Longueur optimale', multimedia: 'Multimédia',
                        reponse_intention: 'Réponse intention', personnalisation: 'Personnalisation',
                        actualite: 'Actualité', langue_naturelle: 'Langue naturelle', localisation: 'Localisation',
                        donnees_structurees: 'Données structurées', meta_donnees: 'Métadonnées',
                        performances: 'Performances', compatibilite_mobile: 'Compatibilité mobile', securite: 'Sécurité',
                      };

                      return (
                        <div className="space-y-6">
                          {/* Header */}
                          <div className="flex items-center gap-4">
                            <img src={`https://www.google.com/s2/favicons?domain=${selectedGeoEntry.domain}&sz=64`} alt={selectedGeoEntry.domain} width={40} height={40} style={{ borderRadius: '8px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            <div>
                              <h2 className="text-xl font-bold text-gray-900">{brandName}</h2>
                              <p className="text-sm text-gray-500">{selectedGeoEntry.domain}</p>
                            </div>
                            <div className="ml-auto text-right">
                              <div className="text-3xl font-bold text-gray-900">{d.total_score || 0}<span className="text-lg text-gray-400">/100</span></div>
                            </div>
                          </div>

                          {/* Quadrant + Visibility/Sentiment */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: quadrant.color + '18', color: quadrant.color }}>{quadrant.label}</span>
                            <span className="text-xs text-gray-500">Visibilité <span className="font-semibold text-gray-800">{Math.round(vis)}%</span></span>
                            <span className="text-xs text-gray-500">Sentiment <span className="font-semibold text-gray-800">{Math.round(sent * 100)}%</span></span>
                          </div>
                          <p className="text-xs text-gray-500">{quadrant.desc}</p>

                          {/* Categories */}
                          {categories.length > 0 && (
                            <div className="space-y-4">
                              {categories.map((cat, catIdx) => {
                                const hasDetails = Object.keys(cat.details).length > 0;
                                const scoreVal = Math.round(cat.score * 10) / 10;
                                const barColor = scoreVal >= 18 ? '#10B981' : scoreVal >= 10 ? '#F59E0B' : '#EF4444';
                                return (
                                  <div key={catIdx} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="text-sm font-semibold text-gray-800">{cat.label}</span>
                                      <span className="text-lg font-bold" style={{ color: barColor }}>
                                        {scoreVal}<span className="text-sm text-gray-400 font-normal">/{cat.max}</span>
                                      </span>
                                    </div>
                                    {hasDetails && (
                                      <div className="space-y-2">
                                        {Object.entries(cat.details as Record<string, number>).map(([key, value]) => {
                                          const label = (cat.labels as Record<string, string>)[key] || key.replace(/_/g, ' ');
                                          const percentage = Math.min((value / 5) * 100, 100);
                                          return (
                                            <div key={key} className="flex items-center gap-3">
                                              <span className="text-xs text-gray-500 w-[140px] shrink-0">{label}</span>
                                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full bg-gray-900" style={{ width: `${percentage}%`, transition: 'width 0.5s ease' }} />
                                              </div>
                                              <span className="text-xs font-semibold text-gray-700 w-[28px] text-right">{value}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}


                          {/* Gaps */}
                          {gaps.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-800 mb-2">Points faibles identifiés</h4>
                              <div className="flex flex-wrap gap-2">
                                {gaps.map(g => (
                                  <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-medium">
                                    {gapLabels[g] || g.replace(/_/g, ' ')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </DialogContent>
                </Dialog>



              </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default Competition;