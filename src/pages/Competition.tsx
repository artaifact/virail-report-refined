import { useState, useEffect, useMemo } from "react";
import { usePageTitle } from '@/hooks/usePageTitle';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  Lock,
  Info
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

const normalizeBrandLabel = (value: string | null | undefined): string =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const toCanonicalUrl = (value: string | null | undefined): string => {
  const raw = (value || '').trim().toLowerCase();
  if (!raw) return '';
  const withProtocol = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withProtocol);
    const host = parsed.hostname.replace(/^www\./, '');
    const path = parsed.pathname.replace(/\/+$/, '');
    return `${host}${path}`;
  } catch {
    return raw
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/[?#].*$/, '')
      .replace(/\/+$/, '');
  }
};

const compareMaterialityEntries = (a: any, b: any): number => {
  if (!!a?.is_target !== !!b?.is_target) return a?.is_target ? 1 : -1;
  if (!!a?.audited !== !!b?.audited) return a?.audited ? 1 : -1;
  const scoreA = typeof a?.total_score === 'number' ? a.total_score : -1;
  const scoreB = typeof b?.total_score === 'number' ? b.total_score : -1;
  if (scoreA !== scoreB) return scoreA > scoreB ? 1 : -1;
  const visibilityA = typeof a?.visibility === 'number' ? a.visibility : -1;
  const visibilityB = typeof b?.visibility === 'number' ? b.visibility : -1;
  return visibilityA > visibilityB ? 1 : -1;
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
import type { AnalyseConcurrentielleV3, BenchmarkTechnique } from '@/lib/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
  Customized,
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

  // Données v3, materiality_matrix et benchmark depuis le rapport
  const v3Data = reportData?.analyse_concurrentielle_v3 as AnalyseConcurrentielleV3 | null | undefined;
  const v1BenchmarkResults = (reportData?.analyse_concurrentielle_v1 as any)?.benchmark_results || null;
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
    quadrants: {
      leaders: string[];
      niche_players: string[];
      controversial: string[];
      laggers: string[];
      _thresholds?: { visibility_mid?: number; sentiment_mid?: number };
    };
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

  // Données competitor_comparisons depuis benchmark_technique
  const benchmarkTechData = reportData?.benchmark_technique as BenchmarkTechnique | null;
  const competitorComparisons = (benchmarkTechData as any)?.competitor_comparisons as Array<{ url: string; score: number; [key: string]: any }> | null;

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
    <div className="min-h-screen bg-[#F5F6F7] p-3 md:p-6">
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
                <CardContent className="p-4 md:p-8">
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
                  {/* Votre positionnement concurrentiel */}
                  {(() => {
                    if (!competitorComparisons || competitorComparisons.length === 0) return null;

                    // Site cible
                    const targetUrl = benchmarkTechData?.target?.url || currentAnalysis?.url || '';
                    const targetDomain = extractDomain(targetUrl).toLowerCase().replace('www.', '');
                    const targetScore = benchmarkTechData?.target?.score_global || 0;

                    // Dédupliquer par domaine
                    const dedupMap = new Map<string, { score: number; isTarget: boolean }>();
                    competitorComparisons.forEach(comp => {
                      const domain = extractDomain(comp.url).toLowerCase().replace('www.', '');
                      const score = comp.score || 0;
                      const isTarget = domain === targetDomain;
                      if (!dedupMap.has(domain) || score > (dedupMap.get(domain)!.score)) {
                        dedupMap.set(domain, { score, isTarget });
                      }
                    });
                    if (targetDomain && !dedupMap.has(targetDomain)) {
                      dedupMap.set(targetDomain, { score: targetScore, isTarget: true });
                    }

                    // Trier par score décroissant → courbe du marché
                    const sorted = Array.from(dedupMap.entries())
                      .sort((a, b) => b[1].score - a[1].score);

                    let targetRank = 0;
                    let targetScoreVal = 0;
                    const curveData = sorted.map(([, val], i) => {
                      if (val.isTarget) {
                        targetRank = i + 1;
                        targetScoreVal = Number(val.score.toFixed(2));
                      }
                      return { rank: i + 1, score: Number(val.score.toFixed(2)) };
                    });

                    const total = sorted.length;
                    const isTop3 = targetRank <= 3 && total >= 3;
                    const medianRankX = total > 1 ? (total + 1) / 2 : 1;

                    const scoresOnly = curveData.map((d) => d.score);
                    const scoreMinPanel = Math.min(...scoresOnly);
                    const scoreMaxPanel = Math.max(...scoresOnly);
                    const yPad = Math.max((scoreMaxPanel - scoreMinPanel) * 0.12, scoreMaxPanel > 0 ? scoreMaxPanel * 0.02 : 0.5);
                    const yDomainMin = Math.max(0, scoreMinPanel - yPad);
                    const yDomainMax = scoreMaxPanel + yPad;

                    const rankTicks = Array.from(
                      new Set(
                        [1, total, targetRank, Math.ceil(total / 2)].filter((r) => r >= 1 && r <= total)
                      )
                    ).sort((a, b) => a - b);

                    const analysisDateIso =
                      currentAnalysis?.created_at
                      || v3Data?.created_at
                      || reportData?.report?.created_at
                      || reportData?.report?.updated_at;
                    let analysisDateLabel: string | null = null;
                    let analysisDateShort: string | null = null;
                    if (analysisDateIso) {
                      const d = new Date(analysisDateIso);
                      if (!Number.isNaN(d.getTime())) {
                        analysisDateLabel = d.toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        });
                        analysisDateShort = d.toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        });
                      }
                    }

                    return (
                      <Card className="bg-white border-gray-200 shadow-sm p-4 md:p-7" style={{ borderRadius: '20px', boxShadow: '0 18px 35px rgba(15, 23, 42, 0.06)', border: '1px solid rgba(226, 232, 240, 0.9)' }}>
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ letterSpacing: '1.2px' }}>
                            Votre positionnement
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="-m-0.5 rounded-full p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1"
                                aria-label="Aide : lecture de votre position sur le graphique"
                              >
                                <Info className="h-3.5 w-3.5" strokeWidth={2} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-[260px] text-xs leading-snug">
                              Meilleurs scores à gauche, plus faibles à droite. Trait vertical = milieu du classement.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        {analysisDateLabel && (
                          <p className="text-[11px] text-gray-500 mb-3">
                            Données issues de l’analyse du {analysisDateLabel}
                          </p>
                        )}
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
                          <span className="text-3xl md:text-4xl font-extrabold" style={{ color: '#6366f1' }}>
                            {targetRank}<sup className="text-lg font-semibold text-gray-400">/{total}</sup>
                          </span>
                          {isTop3 && (
                            <span className="text-[10px] font-semibold uppercase text-amber-700">Top 3</span>
                          )}
                        </div>

                        {/* Courbe marché + légende statique « Votre position » sur le graphique */}
                        <div className="w-full h-[240px] min-w-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={curveData} margin={{ left: 16, right: 14, top: 10, bottom: 28 }}>
                              <defs>
                                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#e0e7ff" stopOpacity={0.7} />
                                  <stop offset="100%" stopColor="#e0e7ff" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                              {total > 1 && (
                                <ReferenceLine
                                  x={medianRankX}
                                  stroke="#cbd5e1"
                                  strokeDasharray="4 4"
                                  strokeWidth={1}
                                  label={{
                                    value: '50%',
                                    position: 'insideTopLeft',
                                    fill: '#94a3b8',
                                    fontSize: 9,
                                  }}
                                />
                              )}
                              <XAxis
                                dataKey="rank"
                                type="number"
                                domain={[1, total]}
                                ticks={rankTicks}
                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                tickLine={false}
                                axisLine={{ stroke: '#e2e8f0' }}
                                label={{
                                  value: 'Position',
                                  position: 'bottom',
                                  offset: 10,
                                  style: { fill: '#94a3b8', fontSize: 10 },
                                }}
                              />
                              <YAxis
                                domain={[yDomainMin, yDomainMax]}
                                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                                tickFormatter={(v) =>
                                  typeof v === 'number' ? v.toFixed(1) : String(v)
                                }
                                axisLine={false}
                                tickLine={false}
                                width={54}
                                label={{
                                  value: 'Score',
                                  angle: -90,
                                  position: 'insideLeft',
                                  style: { fill: '#64748b', fontSize: 11, fontWeight: 600 },
                                }}
                              />
                              <RechartsTooltip
                                content={({ active, payload }) => {
                                  if (!active || !payload?.[0]) return null;
                                  const d = payload[0].payload;
                                  const isMe = d.rank === targetRank;
                                  return (
                                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-xs max-w-[220px]">
                                      <div className="font-semibold" style={{ color: isMe ? '#6366f1' : '#64748b' }}>
                                        {isMe ? 'Vous' : `#${d.rank}`}
                                      </div>
                                      <div className="text-gray-600 mt-0.5 text-sm font-medium tabular-nums">
                                        {d.rank}/{total} · {d.score.toFixed(2)}
                                      </div>
                                    </div>
                                  );
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="score"
                                stroke="#c7d2fe"
                                strokeWidth={2}
                                fill="url(#scoreGrad)"
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 1, stroke: '#6366f1', fill: '#fff' }}
                              />
                              <ReferenceLine
                                y={targetScoreVal}
                                stroke="#6366f1"
                                strokeDasharray="6 4"
                                strokeWidth={1}
                                strokeOpacity={0.5}
                              />
                              <Customized
                                component={(chartProps: {
                                  xAxisMap?: Record<string, { scale: (v: number) => number }>;
                                  yAxisMap?: Record<string, { scale: (v: number) => number }>;
                                  offset?: { left: number; top: number; width: number; height: number };
                                }) => {
                                  const { xAxisMap, yAxisMap, offset } = chartProps;
                                  if (!xAxisMap || !yAxisMap || !offset) return null;
                                  const xAxis = Object.values(xAxisMap)[0];
                                  const yAxis = Object.values(yAxisMap)[0];
                                  if (!xAxis?.scale || !yAxis?.scale) return null;
                                  const cx = xAxis.scale(targetRank);
                                  const cy = yAxis.scale(targetScoreVal);
                                  const boxW = 132;
                                  const boxH = analysisDateShort ? 62 : 44;
                                  const dotR = 7;
                                  const gap = 6;
                                  const left = offset.left;
                                  const top = offset.top;
                                  const right = left + offset.width;
                                  const bottom = top + offset.height;
                                  const idealAboveY = cy - boxH - gap - dotR;
                                  let fx = cx - boxW / 2;
                                  let fy = idealAboveY >= top + 4 ? idealAboveY : cy + dotR + gap;
                                  fx = Math.max(left + 4, Math.min(fx, right - boxW - 4));
                                  fy = Math.max(top + 4, Math.min(fy, bottom - boxH - 4));
                                  return (
                                    <foreignObject
                                      x={fx}
                                      y={fy}
                                      width={boxW}
                                      height={boxH}
                                      style={{ overflow: 'visible', pointerEvents: 'none' }}
                                      aria-hidden
                                    >
                                      <div
                                        className="rounded-md border border-indigo-100 bg-white/95 px-2 py-1.5 shadow-md"
                                        style={{ boxSizing: 'border-box', width: boxW, height: boxH }}
                                      >
                                        <div className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600 leading-tight">
                                          Votre position
                                        </div>
                                        <div className="text-base font-bold tabular-nums text-gray-900 leading-tight tracking-tight">
                                          {targetRank} / {total}
                                        </div>
                                        {analysisDateShort && (
                                          <div className="mt-1.5 border-t border-indigo-200/80 pt-1.5 text-[11px] font-medium leading-snug tracking-wide text-gray-800 tabular-nums">
                                            {analysisDateShort}
                                          </div>
                                        )}
                                      </div>
                                    </foreignObject>
                                  );
                                }}
                              />
                              <ReferenceDot
                                x={targetRank}
                                y={targetScoreVal}
                                r={7}
                                fill="#6366f1"
                                stroke="#fff"
                                strokeWidth={3}
                                isFront
                              />
                            </AreaChart>
                          </ResponsiveContainer>
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
                      <Card className="bg-white border-gray-200 shadow-sm p-4 md:p-7" style={{ borderRadius: '20px', boxShadow: '0 18px 35px rgba(15, 23, 42, 0.06)', border: '1px solid rgba(226, 232, 240, 0.9)' }}>
                        <div className="flex justify-end items-center mb-4">
                          <Select value={currentSelectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs border-gray-300 bg-white rounded-md px-2.5 py-1">
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
                    const quadrantNames = {
                      leaders: new Set<string>(),
                      nichePlayers: new Set<string>(),
                      controversial: new Set<string>(),
                      laggers: new Set<string>(),
                    };
                    const quadrantUrls = {
                      leaders: new Set<string>(),
                      nichePlayers: new Set<string>(),
                      controversial: new Set<string>(),
                      laggers: new Set<string>(),
                    };
                    let visibilityMid = 50;
                    let sentimentMid = 0.5;

                    if (useMateriality) {
                      // Nouvelle source : materiality_matrix
                      const dedupedByUrl = new Map<string, any>();
                      const dedupedByName = new Map<string, any>();

                      materialityMatrix!.brands.forEach((b) => {
                        const canonicalUrl = toCanonicalUrl(b.url);
                        const normalizedName = normalizeBrandLabel(b.name);

                        const urlKey = canonicalUrl || '';
                        if (urlKey) {
                          const existing = dedupedByUrl.get(urlKey);
                          if (!existing || compareMaterialityEntries(b, existing) > 0) {
                            dedupedByUrl.set(urlKey, b);
                          }
                          return;
                        }

                        if (normalizedName) {
                          const existing = dedupedByName.get(normalizedName);
                          if (!existing || compareMaterialityEntries(b, existing) > 0) {
                            dedupedByName.set(normalizedName, b);
                          }
                        }
                      });

                      const dedupedBrands = [
                        ...dedupedByUrl.values(),
                        ...dedupedByName.values(),
                      ];

                      visibilityMid = materialityMatrix?.quadrants?._thresholds?.visibility_mid ?? 50;
                      sentimentMid = materialityMatrix?.quadrants?._thresholds?.sentiment_mid ?? 0.5;

                      const addQuadrant = (
                        names: string[] | undefined,
                        nameSet: Set<string>,
                        urlSet: Set<string>
                      ) => {
                        (names || []).forEach((value) => {
                          const normalized = normalizeBrandLabel(value);
                          if (normalized) nameSet.add(normalized);
                        });

                        dedupedBrands.forEach((brand) => {
                          const normalizedBrandName = normalizeBrandLabel(brand.name);
                          if (!normalizedBrandName || !nameSet.has(normalizedBrandName)) return;
                          const brandUrlKey = toCanonicalUrl(brand.url);
                          if (brandUrlKey) urlSet.add(brandUrlKey);
                        });
                      };

                      addQuadrant(materialityMatrix?.quadrants?.leaders, quadrantNames.leaders, quadrantUrls.leaders);
                      addQuadrant(materialityMatrix?.quadrants?.niche_players, quadrantNames.nichePlayers, quadrantUrls.nichePlayers);
                      addQuadrant(materialityMatrix?.quadrants?.controversial, quadrantNames.controversial, quadrantUrls.controversial);
                      addQuadrant(materialityMatrix?.quadrants?.laggers, quadrantNames.laggers, quadrantUrls.laggers);

                      dedupedBrands.forEach((b) => {
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
                      const benchmarkRaw = (v1BenchmarkResults || (currentAnalysis as any)?.benchmark_results)?.raw_data;
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
                          visibility: benchEntry?.visibility ?? totalScore,
                          sentiment: benchEntry?.sentiment ?? comp.average_score ?? 0,
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
                          visibility: targetEntry.visibility ?? targetScore,
                          sentiment: targetEntry.sentiment ?? 0,
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

                    const getQuadrantInfo = (point: MatricePoint) => {
                      const normalizedName = normalizeBrandLabel(point.name);
                      const canonicalUrl = toCanonicalUrl(point.url);
                      if (quadrantNames.laggers.has(normalizedName) || quadrantUrls.laggers.has(canonicalUrl)) {
                        return { label: 'Lagger', desc: 'En retard. Faible visibilité et perception négative par les IA.', color: '#EF4444' };
                      }
                      if (quadrantNames.leaders.has(normalizedName) || quadrantUrls.leaders.has(canonicalUrl)) {
                        return { label: 'Leader', desc: 'Très bien positionné. Forte visibilité et perception positive par les IA.', color: '#22C55E' };
                      }
                      if (quadrantNames.controversial.has(normalizedName) || quadrantUrls.controversial.has(canonicalUrl)) {
                        return { label: 'Controversial', desc: 'Visible mais mal perçu. Les IA le mentionnent souvent mais avec un sentiment négatif.', color: '#F59E0B' };
                      }
                      if (quadrantNames.nichePlayers.has(normalizedName) || quadrantUrls.nichePlayers.has(canonicalUrl)) {
                        return { label: 'Niche Player', desc: 'Bien perçu mais peu visible. Les IA en parlent positivement mais rarement.', color: '#6366F1' };
                      }
                      return point.visibility >= visibilityMid
                        ? (point.sentiment >= sentimentMid
                          ? { label: 'Leader', desc: 'Très bien positionné. Forte visibilité et perception positive par les IA.', color: '#22C55E' }
                          : { label: 'Controversial', desc: 'Visible mais mal perçu. Les IA le mentionnent souvent mais avec un sentiment négatif.', color: '#F59E0B' })
                        : (point.sentiment >= sentimentMid
                          ? { label: 'Niche Player', desc: 'Bien perçu mais peu visible. Les IA en parlent positivement mais rarement.', color: '#6366F1' }
                          : { label: 'Lagger', desc: 'En retard. Faible visibilité et perception négative par les IA.', color: '#EF4444' });
                    };

                    // Limiter à 12 concurrents max avec équilibre par quadrant
                    const MAX_DISPLAY = 12;
                    let displayPoints = dataPoints;
                    if (dataPoints.length > MAX_DISPLAY) {
                      const quadrantOrder = ['Leader', 'Controversial', 'Niche Player', 'Lagger'] as const;
                      const targets = dataPoints.filter((d) => d.isTarget).sort((a, b) => b.totalScore - a.totalScore);
                      const selected: MatricePoint[] = [];
                      const selectedKeys = new Set<string>();
                      const pointKey = (point: MatricePoint) => `${toCanonicalUrl(point.url)}|${normalizeBrandLabel(point.name)}`;
                      const pushIfNew = (point: MatricePoint) => {
                        const key = pointKey(point);
                        if (selectedKeys.has(key) || selected.length >= MAX_DISPLAY) return false;
                        selected.push(point);
                        selectedKeys.add(key);
                        return true;
                      };

                      // Garder au moins le site cible visible
                      if (targets.length > 0) {
                        pushIfNew(targets[0]);
                      }

                      const remaining = dataPoints
                        .filter((d) => !d.isTarget)
                        .sort((a, b) => b.totalScore - a.totalScore);

                      const buckets: Record<(typeof quadrantOrder)[number], MatricePoint[]> = {
                        Leader: [],
                        Controversial: [],
                        'Niche Player': [],
                        Lagger: [],
                      };

                      remaining.forEach((point) => {
                        const label = getQuadrantInfo(point).label as (typeof quadrantOrder)[number];
                        buckets[label].push(point);
                      });

                      const slots = MAX_DISPLAY - selected.length;
                      const baseQuota = Math.max(1, Math.floor(slots / quadrantOrder.length));
                      let remainingSlots = slots;
                      const perQuadrantUsed: Record<(typeof quadrantOrder)[number], number> = {
                        Leader: 0,
                        Controversial: 0,
                        'Niche Player': 0,
                        Lagger: 0,
                      };

                      // 1er passage: garantir une présence équilibrée par quadrant quand possible
                      quadrantOrder.forEach((quadrant) => {
                        while (
                          remainingSlots > 0 &&
                          perQuadrantUsed[quadrant] < baseQuota &&
                          buckets[quadrant].length > 0
                        ) {
                          const candidate = buckets[quadrant].shift()!;
                          if (pushIfNew(candidate)) {
                            perQuadrantUsed[quadrant] += 1;
                            remainingSlots -= 1;
                          }
                        }
                      });

                      // 2e passage: compléter en round-robin pour garder l'équilibre
                      while (remainingSlots > 0) {
                        let picked = false;
                        quadrantOrder.forEach((quadrant) => {
                          if (remainingSlots <= 0 || buckets[quadrant].length === 0) return;
                          const candidate = buckets[quadrant].shift()!;
                          if (pushIfNew(candidate)) {
                            perQuadrantUsed[quadrant] += 1;
                            remainingSlots -= 1;
                            picked = true;
                          }
                        });
                        if (!picked) break;
                      }

                      // 3e passage: fallback sécurité
                      if (selected.length < MAX_DISPLAY) {
                        remaining.forEach((point) => {
                          if (selected.length < MAX_DISPLAY) pushIfNew(point);
                        });
                      }

                      displayPoints = selected;
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
                      <Card className="w-full bg-white border-gray-200 shadow-sm p-4 md:p-7" style={{ borderRadius: '20px', boxShadow: '0 18px 35px rgba(15, 23, 42, 0.06)', border: '1px solid rgba(226, 232, 240, 0.9)' }}>
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2" style={{ textAlign: 'center' }}>
                          Matrice de Matérialité
                        </h3>
                        {dataPoints.length > MAX_DISPLAY && (
                          <p className="text-xs text-gray-400 mb-3" style={{ textAlign: 'center' }}>
                            Top {MAX_DISPLAY} concurrents affichés sur {dataPoints.length}
                          </p>
                        )}

                        <div style={{ position: 'relative' }}>
                          <div
                            style={
                              isStarter
                                ? { filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none' }
                                : undefined
                            }
                          >
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
                                  data: { ...(d.scoreDetails || { pillars: d.pillars, gaps: d.gaps, total_score: d.totalScore, audited: d.audited }), visibility: d.visibility, sentiment: d.sentiment }
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
                                fontSize: 11, color: '#475569', background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer',
                                padding: '4px 12px', fontWeight: 600, borderRadius: '6px', transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; }}
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
                            <line x1={xScale(visibilityMid)} y1={pad.top} x2={xScale(visibilityMid)} y2={pad.top + plotH} stroke="#CBD5E1" strokeWidth={1} />
                            <line x1={pad.left} y1={yScale(sentimentMid)} x2={pad.left + plotW} y2={yScale(sentimentMid)} stroke="#CBD5E1" strokeWidth={1} />

                            {/* Axis labels */}
                            <text x={pad.left + plotW / 2} y={chartH - 10} textAnchor="middle" fontSize="13" fill="#6B7280" fontWeight="500">Visibility</text>
                            <text x={18} y={pad.top + plotH / 2} textAnchor="middle" fontSize="13" fill="#6B7280" fontWeight="500" transform={`rotate(-90, 18, ${pad.top + plotH / 2})`}>Sentiment</text>

                            {/* Data points - render non-hovered first, hovered last so tooltip stays on top */}
                            {[...displayPoints].sort((a, b) => (a.url === hoveredMatricePoint ? 1 : 0) - (b.url === hoveredMatricePoint ? 1 : 0)).map((d, i) => {
                              const cx = xScale(d.visibility);
                              const cy = yScale(d.sentiment);
                              const quadrantInfo = getQuadrantInfo(d);
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
                                      data: { ...(d.scoreDetails || { pillars: d.pillars, gaps: d.gaps, total_score: d.totalScore, audited: d.audited }), visibility: d.visibility, sentiment: d.sentiment }
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
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                          </div>
                          {isStarter && (
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(255,255,255,0.45)',
                                borderRadius: 12,
                                zIndex: 10,
                                padding: 16,
                              }}
                            >
                              <Lock size={32} style={{ color: '#6366F1', marginBottom: 12 }} />
                              <p style={{ fontSize: 16, fontWeight: 600, color: '#1E293B', marginBottom: 4, textAlign: 'center' }}>
                                Contenu réservé aux plans supérieurs
                              </p>
                              <p style={{ fontSize: 13, color: '#64748B', textAlign: 'center', maxWidth: 320 }}>
                                Passez à un plan supérieur pour débloquer la matrice de matérialité
                              </p>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })()}

                  {/* Benchmark - depuis benchmark_results API */}
                  {(() => {
                    const br = v1BenchmarkResults || (currentAnalysis as any)?.benchmark_results;
                    if (!br?.benchmark?.classement) return null;
                    const rawList = br.benchmark.classement || [];
                    const seen = new Set<string>();
                    const dedupList = rawList.filter((e: any) => {
                      const d = extractDomain(e.url);
                      if (seen.has(d)) return false;
                      seen.add(d);
                      return true;
                    });
                    const clientDomain = extractDomain(currentAnalysis?.url || '');

                    if (dedupList.length === 0) return null;

                    return (
                      <></>
                    );
                  })()}

                  {/* Données Benchmark - Mode Paysage - Pleine Largeur */}
                  {(() => {
                  const _br2 = v1BenchmarkResults || (currentAnalysis as any)?.benchmark_results;
                  if (!_br2?.benchmark) return null;
                  const benchmarkData = _br2.benchmark;
                  // Dédupliquer par domaine (éviter carmignac.fr et carmignac.fr/)
                  const rawClassement = benchmarkData.classement || [];
                  const seenDomains = new Set<string>();
                  const classement = rawClassement.filter((e: any) => {
                    const domain = extractDomain(e.url);
                    if (seenDomains.has(domain)) return false;
                    seenDomains.add(domain);
                    return true;
                  });
                  const yourSiteDomain = extractDomain(currentAnalysis.url || '');
                  const yourSiteIndex = classement.findIndex((e: any) => extractDomain(e.url) === yourSiteDomain);
                  const yourSiteRank = yourSiteIndex >= 0 ? yourSiteIndex + 1 : null;
                  
                  return (
                    <Card className="w-full bg-white border-gray-200 shadow-sm p-4 md:p-7" style={{ borderRadius: '20px', boxShadow: '0 18px 35px rgba(15, 23, 42, 0.06)', border: '1px solid rgba(226, 232, 240, 0.9)' }}>
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4">
                          <div className="flex-1">
                            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1">
                              Analyse Benchmark
                            </h3>
                            <p className="text-sm text-gray-600">
                              {benchmarkData.comparaison || 'Comparaison de votre positionnement avec vos concurrents'}
                            </p>
                          </div>
                          {yourSiteRank && (
                            <div className="text-right">
                              <div className="text-2xl md:text-3xl font-bold text-gray-900">{yourSiteRank}{getOrdinalSuffix(yourSiteRank)}</div>
                              <div className="text-sm font-medium text-orange-500">+0</div>
                            </div>
                          )}
                        </div>

                        {/* Dropdown et tableau en mode paysage */}
                        <div className="w-full">
                          <div className="flex justify-end mb-4">
                            <Select value={benchmarkView} onValueChange={(val) => setBenchmarkView(val as 'score' | 'raw_data')}>
                              <SelectTrigger className="w-full sm:w-[200px] h-9 text-sm border-gray-300 bg-white">
                                <SelectValue placeholder="Score Benchmark" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="score">Score GEO</SelectItem>
                                <SelectItem value="raw_data">Score Benchmark</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {benchmarkView === 'score' ? (
                          <>
                          {/* Table Header - Mode Paysage avec plus de colonnes - Pleine Largeur */}
                          <div className="w-full overflow-x-auto">
                            <div className="min-w-[500px]">
                              <div className="grid grid-cols-[60px_2fr_1fr_120px] gap-6 pb-3 border-b-2 border-gray-200 mb-3">
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Position</div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Marque / Domaine</div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Score</div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Ordre</div>
                              </div>

                              {/* Liste scrollable en mode paysage */}
                              <div className="max-h-[600px] overflow-y-auto">
                                {classement.map((entry: any, idx: number) => {
                                  const entryDomain = extractDomain(entry.url);
                                  const competitor = (currentAnalysis as any).competitors?.find((c: any) => extractDomain(c.url) === entryDomain);
                                  const isYourSite = entryDomain === yourSiteDomain;
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
                          {/* Vue Analyse GEO - materiality_matrix */}
                          {(() => {
                            const matBrands = materialityMatrix?.brands;
                            if (!matBrands || matBrands.length === 0) {
                              return (
                                <div className="text-center text-gray-500 py-8">
                                  Aucune donnée GEO disponible pour cette analyse.
                                </div>
                              );
                            }

                            const rawEntries = matBrands
                              .map((b: any) => ({
                                url: b.url,
                                domain: extractDomain(b.url),
                                totalScore: b.total_score || 0,
                                grade: '-',
                                credibility: b.pillars?.credibility_authority?.score || 0,
                                structure: b.pillars?.structure_readability?.score || 0,
                                relevance: b.pillars?.contextual_relevance?.score || 0,
                                technical: b.pillars?.technical_compatibility?.score || 0,
                                recommendations: [],
                                fullData: { pillars: b.pillars, gaps: b.gaps, total_score: b.total_score, audited: b.audited, visibility: b.visibility, sentiment: b.sentiment },
                                brandName: b.name,
                                isTarget: b.is_target,
                              }))
                              .sort((a: any, b: any) => b.totalScore - a.totalScore);

                            const geoContent = (
                              <div className="w-full overflow-x-auto">
                                <div className="min-w-[700px]">
                                  <div className="grid grid-cols-[60px_2fr_repeat(4,80px)_100px] gap-4 pb-3 border-b-2 border-gray-200 mb-3">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Position</div>
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Marque / Domaine</div>
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Crédibilité</div>
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Structure</div>
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Pertinence</div>
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Technique</div>
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Total</div>
                                  </div>

                                  <div className="max-h-[600px] overflow-y-auto">
                                    {rawEntries.map((entry: any, idx: number) => {
                                      const isYourSite = entry.isTarget || false;
                                      const brandName = isYourSite ? 'Votre site' : (entry.brandName || entry.domain);

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
                  <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
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
                      const visMid = materialityMatrix?.quadrants?._thresholds?.visibility_mid ?? 50;
                      const sentMid = materialityMatrix?.quadrants?._thresholds?.sentiment_mid ?? 0.5;
                      const laggerNames = new Set((materialityMatrix?.quadrants?.laggers || []).map((v: string) => normalizeBrandLabel(v)));
                      const selectedName = normalizeBrandLabel(brandName);
                      const selectedUrl = toCanonicalUrl(selectedGeoEntry.url);
                      const laggerByName = laggerNames.has(selectedName);
                      const laggerByUrl = (materialityMatrix?.brands || []).some((brand) => {
                        const normalizedBrandName = normalizeBrandLabel(brand.name);
                        return laggerNames.has(normalizedBrandName) && toCanonicalUrl(brand.url) === selectedUrl;
                      });
                      const isApiLagger = laggerByName || laggerByUrl;
                      const quadrant = isApiLagger
                        ? { label: 'Lagger', color: '#EF4444', desc: 'Faible visibilité et perception négative.' }
                        : vis >= visMid
                          ? (sent >= sentMid
                            ? { label: 'Leader', color: '#22C55E', desc: 'Forte visibilité et perception positive par les IA.' }
                            : { label: 'Controversial', color: '#F59E0B', desc: 'Visible mais mal perçu par les IA.' })
                          : (sent >= sentMid
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
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <img src={`https://www.google.com/s2/favicons?domain=${selectedGeoEntry.domain}&sz=64`} alt={selectedGeoEntry.domain} width={40} height={40} style={{ borderRadius: '8px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            <div>
                              <h2 className="text-lg md:text-xl font-bold text-gray-900">{brandName}</h2>
                              <p className="text-sm text-gray-500">{selectedGeoEntry.domain}</p>
                            </div>
                            <div className="sm:ml-auto text-left sm:text-right">
                              <div className="text-2xl md:text-3xl font-bold text-gray-900">{d.total_score || 0}<span className="text-base md:text-lg text-gray-400">/100</span></div>
                            </div>
                          </div>

                          {/* Quadrant */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: quadrant.color + '18', color: quadrant.color }}>{quadrant.label}</span>
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
                                        {scoreVal}
                                      </span>
                                    </div>
                                    {hasDetails && (
                                      <div className="space-y-2">
                                        {Object.entries(cat.details as Record<string, number>).map(([key, value]) => {
                                          const label = (cat.labels as Record<string, string>)[key] || key.replace(/_/g, ' ');
                                          const percentage = Math.min((value / 5) * 100, 100);
                                          return (
                                            <div key={key} className="flex items-center gap-3">
                                              <span className="text-xs text-gray-500 w-[100px] sm:w-[140px] shrink-0">{label}</span>
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