import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePayment } from '@/hooks/usePayment';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Plus,
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
  Info,
  ChevronRight,
  Award,
  Users,
  Clock,
  Lightbulb,
  History,
  Trash2,
  Calendar,
  Sparkles,
  Trophy,
  Rocket,
  Star,
  Zap,
  Brain
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
import { listCompetitorAnalyses, getCompetitorAnalysisById, startCompetitorAnalysis, extractDomain, CompetitorAnalysisResponse, CompetitorAnalysisSummary, MiniLLMResult } from '@/services/competitorAnalysisService';

const Competition = () => {
  const [userUrl, setUserUrl] = useState("");
  const [selectedTab, setSelectedTab] = useState("saved");
  const [dateFilter, setDateFilter] = useState('15 nov - 21 nov');
  const [regionFilter, setRegionFilter] = useState('France');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const { toast } = useToast();
  
  // États pour la nouvelle API
  const [competitorAnalyses, setCompetitorAnalyses] = useState<CompetitorAnalysisSummary[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<CompetitorAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingSavedAnalyses, setLoadingSavedAnalyses] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // État pour les analyses LLM détaillées
  const [miniLLMResults, setMiniLLMResults] = useState<MiniLLMResult[]>([]);
  const [loadingMiniLLM, setLoadingMiniLLM] = useState(false);

  const { usageLimits, canUseFeature } = usePayment() as any;

  // Charger l'URL depuis sessionStorage si elle provient de l'onboarding
  useEffect(() => {
    const onboardingUrl = sessionStorage.getItem('onboarding-site-url');
    if (onboardingUrl && !userUrl) {
      setUserUrl(onboardingUrl);
      // Passer automatiquement à l'onglet "Nouvelle analyse" si l'URL provient de l'onboarding
      setSelectedTab("new");
      // Nettoyer sessionStorage après utilisation (c'est la dernière étape qui l'utilise)
      sessionStorage.removeItem('onboarding-site-url');
    }
  }, []);

  // Charger les analyses sauvegardées
  useEffect(() => {
    const loadAnalyses = async () => {
      try {
        setLoadingSavedAnalyses(true);
        const analyses = await listCompetitorAnalyses();
        setCompetitorAnalyses(analyses);
      } catch (error) {
        console.error('Erreur lors du chargement des analyses:', error);
      } finally {
        setLoadingSavedAnalyses(false);
      }
    };

    loadAnalyses();
  }, []);

  const handleStartAnalysis = async () => {
    if (!userUrl.trim()) return;

    try {
      setIsAnalyzing(true);
      setError(null);
      
      // Normaliser l'URL (préfixe https:// si absent)
      const normalizedUrl = userUrl.startsWith('http://') || userUrl.startsWith('https://')
        ? userUrl
        : `https://${userUrl}`;
      setUserUrl(normalizedUrl);

      // Toast d'information immédiat
      toast({
        title: "Analyse lancée",
        description: "Veuillez patienter, votre analyse sera prête dans quelques instants.",
      });

      const analysis = await startCompetitorAnalysis({
        url: normalizedUrl
      });

      setCurrentAnalysis(analysis);
      
      // Charger les données mini_llm_results si disponibles
      if (analysis.mini_llm_results && analysis.mini_llm_results.length > 0) {
        setMiniLLMResults(analysis.mini_llm_results);
      }
      
      // Recharger la liste des analyses
      const updatedAnalyses = await listCompetitorAnalyses();
      setCompetitorAnalyses(updatedAnalyses);

      // Passer à l'onglet résultats seulement en cas de succès
      setSelectedTab("results");
      toast({
        title: "Analyse terminée",
        description: "Votre analyse concurrentielle est prête !"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';

      console.error('❌ Erreur dans handleStartAnalysis:', error);
 
      setError(errorMessage);

      toast({
        title: "Erreur d'analyse",
        description: errorMessage,
        variant: "destructive"
      });

      // En cas d'erreur, rester/retourner sur Analyses sauvegardées
      setSelectedTab("saved");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadSavedAnalysis = async (analysisId: number) => {
    try {
      // Passer à l'onglet résultats immédiatement pour un feedback visuel
      setSelectedTab("results");
      
      // Charger l'analyse depuis l'API
      const analysis = await getCompetitorAnalysisById(analysisId);
      setCurrentAnalysis(analysis);
      
      // Charger les données mini_llm_results si disponibles
      if (analysis.mini_llm_results && analysis.mini_llm_results.length > 0) {
        setMiniLLMResults(analysis.mini_llm_results);
      }
      
      toast({
        title: "Analyse chargée",
        description: `Analyse de ${extractDomain(analysis.url)} chargée avec succès`
      });
    } catch (error) {
      console.error('Erreur lors du chargement de l\'analyse:', error);
      toast({
        title: "Erreur de chargement",
        description: "Une erreur est survenue lors du chargement",
        variant: "destructive"
      });
      setSelectedTab("saved");
    }
  };

  const handleDeleteAnalysis = async (analysisId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    // TODO: Implémenter la suppression via API quand disponible
    toast({
      title: "Fonction non disponible",
      description: "La suppression d'analyses n'est pas encore implémentée",
      variant: "destructive"
    });
  };

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
      <div className="mx-auto space-y-6" style={{ maxWidth: '1700px' }}>
        {/* Header avec titre et filtres */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Concurrence.</h1>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[180px] border-gray-300 bg-white hover:bg-gray-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15 nov - 21 nov">15 nov - 21 nov</SelectItem>
                    <SelectItem value="8 nov - 14 nov">8 nov - 14 nov</SelectItem>
                    <SelectItem value="1 nov - 7 nov">1 nov - 7 nov</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger className="w-[180px] border-gray-300 bg-white hover:bg-gray-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="États-Unis">États-Unis</SelectItem>
                    <SelectItem value="Royaume-Uni">Royaume-Uni</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="border-gray-300 bg-white hover:bg-gray-50">
                <Search className="h-4 w-4 mr-2" />
                Ajouter un filtre
              </Button>
            </div>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            Analysez votre positionnement concurrentiel et identifiez les opportunités d'amélioration de votre visibilité GEO.
          </p>
        </div>
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            <TabsList className="grid w-full grid-cols-3 bg-gray-50 p-1 h-auto rounded-lg">
              <TabsTrigger 
                value="saved" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md h-12 font-semibold transition-all duration-300 text-gray-600"
              >
                <History className="h-4 w-4 mr-2" />
                Analyses sauvegardées
              </TabsTrigger>
              <TabsTrigger 
                value="setup" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md h-12 font-semibold transition-all duration-300 text-gray-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle analyse
              </TabsTrigger>
              <TabsTrigger 
                value="results" 
                disabled={!currentAnalysis && !isAnalyzing} 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md h-12 font-semibold transition-all duration-300 disabled:opacity-50 text-gray-600"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Résultats
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="saved" className="space-y-6 mt-6">
            <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                      <History className="h-5 w-5 text-gray-600" />
                      Analyses Concurrentielles
                    </CardTitle>
                    <CardDescription className="mt-2 text-gray-600">
                      Accédez à vos analyses et comparez l'évolution de votre positionnement
                    </CardDescription>
                  </div>
                  <Badge className="bg-gray-100 text-gray-700 border-gray-300">
                    {competitorAnalyses.length} analyse{competitorAnalyses.length > 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 bg-white">
                {loadingSavedAnalyses ? (
                  <div className="text-center py-16 bg-white">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
                      <span className="text-gray-600">Chargement des analyses...</span>
                    </div>
                  </div>
                ) : competitorAnalyses.length === 0 ? (
                  <div className="text-center py-16 bg-white">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Aucune analyse sauvegardée</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Commencez votre première analyse concurrentielle et découvrez comment vous vous positionnez face à vos concurrents.
                    </p>
                    <Button 
                      onClick={() => setSelectedTab("setup")} 
                      className="bg-black hover:bg-gray-900 text-white shadow-sm font-semibold px-8 py-3 h-auto"
                    >
                      <Rocket className="h-5 w-5 mr-2" />
                      Lancer ma première analyse
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {competitorAnalyses.map((analysis, index) => (
                      <div 
                        key={analysis.analysis_id} 
                        className="group p-6 hover:bg-gray-50 cursor-pointer transition-all duration-300 relative overflow-hidden bg-white"
                        onClick={() => handleLoadSavedAnalysis(analysis.analysis_id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900 group-hover:text-gray-900 transition-colors">
                                    {extractDomain(analysis.url)}
                                  </h4>
                                  <Badge className="bg-gray-100 text-gray-700 font-semibold border-gray-300">
                                    #{index + 1}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4">
                                  <Badge className="bg-gray-100 text-gray-700 font-medium border-gray-300">
                                    {analysis.status === 'completed' ? 'Terminée' : 'En cours'}
                                  </Badge>
                                  <Badge variant="outline" className="bg-white text-gray-600 border-gray-300">
                                    {analysis.total_competitors_found} concurrent{analysis.total_competitors_found > 1 ? 's' : ''}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Users className="h-4 w-4 text-gray-500" />
                                <span>{analysis.total_competitors_found} concurrent{analysis.total_competitors_found > 1 ? 's' : ''} analysé{analysis.total_competitors_found > 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 ml-6">
                            <div className="flex items-center gap-2 text-gray-500 group-hover:text-gray-900 transition-colors">
                              <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                Voir l'analyse
                              </span>
                              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="setup" className="space-y-6 mt-6">
            <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-white border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Search className="h-5 w-5 text-gray-700" />
                      </div>
                      Nouvelle Analyse Concurrentielle
                    </CardTitle>
                    <CardDescription className="mt-2 text-gray-600">
                      Entrez l'URL de votre site pour commencer l'analyse GEO
                    </CardDescription>
                  </div>
                  <Badge className="bg-gray-100 text-gray-700 border-gray-300">
                    <Zap className="w-3 h-3 mr-1" />
                    IA Powered
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8 bg-white">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="votre-site.com"
                        value={userUrl}
                        onChange={(e) => setUserUrl(e.target.value)}
                        onBlur={() => {
                          if (userUrl && !userUrl.startsWith('http://') && !userUrl.startsWith('https://')) {
                            setUserUrl(`https://${userUrl}`)
                          }
                        }}
                        className="h-14 text-lg border border-gray-300 focus:border-gray-400 rounded-lg shadow-sm bg-white"
                      />
                    </div>
                    <Button 
                      onClick={handleStartAnalysis}
                      disabled={!userUrl.trim() || isAnalyzing}
                      className="bg-black hover:bg-gray-900 text-white shadow-sm h-14 px-8 font-semibold text-lg rounded-lg"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                          Analyse...
                        </>
                      ) : (
                        <>
                          <Rocket className="h-5 w-5 mr-3" />
                          Lancer l'analyse
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-3 text-lg">
                      <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Info className="h-4 w-4 text-gray-700" />
                      </div>
                      Comment ça fonctionne ?
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">1</span>
                          </div>
                          <span className="text-sm text-gray-700">Analyse GEO complète de votre site</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">2</span>
                          </div>
                          <span className="text-sm text-gray-700">Identification des concurrents par IA</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">3</span>
                          </div>
                          <span className="text-sm text-gray-700">Analyse GEO de chaque concurrent</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">4</span>
                          </div>
                          <span className="text-sm text-gray-700">Comparaison détaillée et insights</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">5</span>
                          </div>
                          <span className="text-sm text-gray-700">Recommandations personnalisées</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">6</span>
                          </div>
                          <span className="text-sm text-gray-700">Sauvegarde pour suivi temporel</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6 mt-6">
            {/* Enhanced Header avec informations sur l'analyse chargée */}
            {currentAnalysis && (
              <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
                <CardContent className="p-6 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-2.5 h-2.5 bg-gray-700 rounded-full animate-pulse"></div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 tracking-tight">
                          Analyse de {extractDomain(currentAnalysis.url)}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-300 text-gray-600">
                            {formatDistanceToNow(new Date(currentAnalysis.created_at), { addSuffix: true, locale: fr })}
                          </span>
                          {currentAnalysis.target_positioning ? (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-300 text-gray-600">
                              Rang {currentAnalysis.target_positioning.overall_rank}/{currentAnalysis.target_positioning.total_competitors}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-300 text-gray-600">
                              {currentAnalysis.consolidated_competitors?.length || 0} concurrents
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-gray-100 text-gray-700 font-semibold px-3 py-1.5 rounded-md border-gray-300">
                        {currentAnalysis.target_positioning?.market_position || 'En cours d\'analyse'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTab("saved")}
                        className="text-gray-700 hover:text-gray-900 border-gray-300 bg-white hover:bg-gray-50 rounded-md"
                      >
                        Retour aux analyses
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                   //console.log('🔄 Test manuel des quotas...');
                    const testResult = canUseFeature('competitor_analysis');
                    const featureLimits = usageLimits?.can_use_competitor_analysis;
                   //console.log('📊 Résultat test:', testResult);
                   //console.log('📋 Détails complets:', {
                      canUseFeature: testResult,
                      featureLimits,
                      usageLimits: usageLimits
                    });
                    alert(`canUseFeature: ${testResult}\nLimits: ${JSON.stringify(featureLimits, null, 2)}`);
                  }}
                  size="sm"
                  variant="outline"
                >
                  Tester Quotas
                </Button>
                <Button
                  onClick={async () => {
                   //console.log('🔄 Rechargement manuel des quotas...');
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
                   //console.log('🔐 Test de session...');

                    // Tester via une requête API pour voir si la session est valide
                    try {
                      const response = await fetch('/api/v1/usage/limits', {
                        method: 'GET',
                        credentials: 'include'
                      });

                      if (response.ok) {
                        alert('✅ Session valide - Authentification réussie');
                       //console.log('✅ Session valide');
                      } else if (response.status === 401) {
                        alert('❌ Session expirée - Reconnexion nécessaire\nRedirection vers la page de connexion...');
                       //console.log('❌ Session expirée');
                        window.location.href = '/login';
                      } else {
                        alert(`❓ Erreur inconnue: ${response.status}`);
                       //console.log('❓ Erreur inconnue:', response.status);
                      }
                    } catch (error) {
                      alert('❌ Erreur de réseau - Vérifiez votre connexion');
                      console.error('❌ Erreur de test de session:', error);
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
            {error && !isAnalyzing && (
              <Card className="border-gray-200 bg-gray-50 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-gray-700 animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Veuillez patienter</h3>
                      <p className="text-gray-600 mt-1">Votre analyse est en cours de finalisation. Les résultats vont s'afficher dès qu'ils sont prêts.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced État de chargement */}
            {isAnalyzing && (
              <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
                <CardContent className="p-12 text-center bg-white">
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center shadow-xl">
                        <Loader2 className="h-10 w-10 text-white animate-spin" />
                      </div>
                      <div className="absolute inset-0 rounded-full border-4 border-gray-200 border-t-gray-900 animate-spin"></div>
                    </div>
                    <div className="max-w-md">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        Analyse concurrentielle en cours...
                      </h3>
                      <p className="text-gray-600 mb-6 text-lg">
                        Notre IA analyse votre site et identifie vos concurrents avec 3 modèles différents
                      </p>
                      <div className="w-80 bg-gray-200 rounded-full h-3 mx-auto shadow-inner">
                        <div 
                          className="bg-gray-900 h-3 rounded-full transition-all duration-1000 shadow-sm animate-pulse"
                          style={{ width: `75%` }}
                        ></div>
                      </div>
                      <p className="text-gray-600 mt-3 font-semibold">Analyse en cours...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Affichage complet de toutes les données */}
            {!isAnalyzing && currentAnalysis && (
              <div className="space-y-6 mb-6">
                {/* Informations générales de l'analyse */}
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardContent className="space-y-6 text-gray-900 p-6">
                    {/* Métriques principales */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-2xl font-bold text-gray-900">{currentAnalysis.models_analysis?.length || 0}</div>
                        <div className="text-sm text-gray-600">Modèles IA</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-2xl font-bold text-gray-900">
                          {currentAnalysis.models_analysis?.reduce((total, model) => total + (model.competitors?.length || 0), 0) || 0}
                        </div>
                        <div className="text-sm text-gray-600">Concurrents Trouvés</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-2xl font-bold text-gray-900">
                          {new Date(currentAnalysis.created_at).toLocaleDateString('fr-FR', { 
                            day: '2-digit', 
                            month: '2-digit' 
                          })}
                        </div>
                        <div className="text-sm text-gray-600">Date d'Analyse</div>
                      </div>
                    </div>
                    
                    {/* Détails de l'analyse */}
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-sm font-medium text-gray-600 mb-2">URL Analysée</div>
                        <a 
                          href={currentAnalysis.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-gray-900 hover:underline break-all"
                        >
                          {currentAnalysis.url}
                        </a>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-sm font-medium text-gray-600 mb-2">Titre</div>
                        <div className="text-gray-900">{currentAnalysis.title}</div>
                      </div>
                      
                      {currentAnalysis.description && (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="text-sm font-medium text-gray-600 mb-2">Description</div>
                          <div className="text-gray-900">{currentAnalysis.description}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

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

                {/* Section Top concurrents et Détails par Modèle IA côte à côte */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top concurrents */}
                  {currentAnalysis.target_positioning?.top_competitors && currentAnalysis.target_positioning.top_competitors.length > 0 && (
                    <Card className="bg-white border-gray-200 shadow-sm" style={{ borderRadius: '20px', padding: '28px', boxShadow: '0 18px 35px rgba(15, 23, 42, 0.06)', border: '1px solid rgba(226, 232, 240, 0.9)' }}>
                      <div className="mb-5">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Top concurrents</h3>
                        <p className="text-xs text-gray-600">
                          Classement des meilleurs concurrents identifiés pour votre marché
                        </p>
                      </div>
                      <div className="divide-y divide-gray-200 rounded-lg overflow-hidden border border-gray-200">
                        {currentAnalysis.target_positioning.top_competitors.map((c, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-300 text-sm font-bold text-gray-900">
                                #{c.rank}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-gray-900 truncate text-sm">
                                  {c.name}
                                </div>
                                <div className="text-xs text-gray-600 flex items-center gap-2">
                                  <span>Score: {Math.round(Number(c.score))}/100</span>
                                  <span>•</span>
                                  <span>Écart: {c.gap_vs_you > 0 ? '+' : ''}{Number(c.gap_vs_you).toFixed(1)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge
                                className={`text-xs ${String(c.status).includes('devant') || String(c.status).includes('Leader') ? 'bg-red-100 text-red-700 border-red-300' : String(c.status).includes('derrière') ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                              >
                                {c.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Détails par modèle */}
                  {(() => {
                    const competitorsByModel: Record<string, any[]> = {};
                    
                    // Grouper les concurrents par modèle
                    const competitors = (currentAnalysis as any)?.competitors;
                    if (competitors && Array.isArray(competitors)) {
                      competitors.forEach((competitor: any) => {
                        if (competitor.sources && Array.isArray(competitor.sources)) {
                          competitor.sources.forEach((source: string) => {
                            if (!competitorsByModel[source]) {
                              competitorsByModel[source] = [];
                            }
                            competitorsByModel[source].push(competitor);
                          });
                        }
                      });
                    }

                    const modelNames = Object.keys(competitorsByModel);
                    const defaultModel = modelNames[0] || '';
                    const currentSelectedModel = selectedModel || defaultModel;
                    const currentCompetitors = competitorsByModel[currentSelectedModel] || [];
                    
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
                        <div className="flex justify-between items-center mb-5">
                          <h3 className="text-sm font-semibold text-gray-900">Détails par Modèle IA</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">Modèle:</span>
                            <Select value={currentSelectedModel} onValueChange={setSelectedModel}>
                              <SelectTrigger className="w-[180px] h-8 text-xs border-gray-300 bg-white rounded-md px-2.5 py-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {modelNames.map((model) => (
                                  <SelectItem key={model} value={model}>
                                    <div className="flex items-center gap-2">
                                      {getModelLogo(model) ? (
                                        <img src={getModelLogo(model)!} alt={model} className="w-4 h-4 object-contain" />
                                      ) : (
                                        <Zap size={14} className="text-blue-500" />
                                      )}
                                      <span>{model.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3" style={{ letterSpacing: '1.2px' }}>
                            {currentCompetitors.length} Concurrent{currentCompetitors.length > 1 ? 's' : ''} - {currentSelectedModel.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          
                          <div className="max-h-[500px] overflow-y-auto pr-2">
                            {currentCompetitors.map((competitor: any, index: number) => {
                              const rank = competitor.model_rank || `#${index + 1}`;
                              const domain = extractDomain(competitor.url || competitor.primary_url || '');
                              return (
                                <div key={index} className="flex items-center gap-3 py-3 border-b border-gray-200 last:border-b-0 hover:bg-blue-50/30 transition-colors" style={{ borderBottom: index < currentCompetitors.length - 1 ? '1px solid #edf2f7' : 'none' }}>
                                  <div className="text-base font-bold text-gray-400 min-w-[32px]" style={{ fontSize: '13px', fontWeight: 700 }}>{rank}</div>
                                  <div className="flex-1">
                                    <div className="font-semibold text-gray-900 mb-0.5" style={{ fontSize: '15px', fontWeight: 600 }}>{competitor.name || domain}</div>
                                    <div className="text-gray-500" style={{ fontSize: '13px', color: '#94a3b8' }}>{domain}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          <Button 
                            variant="outline" 
                            className="w-full mt-6 border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium py-2.5"
                            onClick={() => setSelectedTab("saved")}
                          >
                            → Voir l'analyse concurrentielle complète
                          </Button>
                        </div>
                      </Card>
                    );
                  })()}

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

                        {/* À améliorer */}
                        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                          <h4 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            À améliorer
                          </h4>
                          {(currentAnalysis.target_positioning?.improvement_areas || []).length > 0 ? (
                            <ul className="space-y-2 list-disc list-inside">
                              {currentAnalysis.target_positioning!.improvement_areas.map((item, idx) => (
                                <li key={idx} className="text-sm text-gray-900">{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-sm text-gray-600">Aucun axe d'amélioration listé</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}


                  {/* Données Benchmark */}
                  {(currentAnalysis as any).benchmark_results?.benchmark && (() => {
                  const benchmarkData = (currentAnalysis as any).benchmark_results.benchmark;
                  const classement = benchmarkData.classement || [];
                  const yourSiteIndex = classement.findIndex((e: any) => e.url === currentAnalysis.url);
                  const yourSiteRank = yourSiteIndex >= 0 ? yourSiteIndex + 1 : null;
                  
                  return (
                    <Card className="bg-white border-gray-200 shadow-sm" style={{ borderRadius: '20px', padding: '28px', boxShadow: '0 18px 35px rgba(15, 23, 42, 0.06)', border: '1px solid rgba(226, 232, 240, 0.9)' }}>
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
                      
                      {/* Dropdown et liste */}
                      <div>
                        <div className="flex justify-end mb-4">
                          <Select defaultValue="score">
                            <SelectTrigger className="w-[160px] h-9 text-sm border-gray-300 bg-white">
                              <SelectValue placeholder="Score Benchmark" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="score">Score Benchmark</SelectItem>
                              <SelectItem value="mention">Taux de Mention</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Table Header */}
                        <div className="grid grid-cols-[40px_1fr_120px] gap-4 pb-2 border-b border-gray-200 mb-2">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide"></div>
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Marque</div>
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Score</div>
                        </div>
                        
                        {/* Liste scrollable */}
                        <div className="max-h-[500px] overflow-y-auto pr-2">
                          {classement.map((entry: any, idx: number) => {
                            const competitor = (currentAnalysis as any).competitors?.find((c: any) => c.url === entry.url);
                            const isYourSite = entry.url === currentAnalysis.url;
                            const brandName = isYourSite ? 'Votre site' : (competitor?.name || extractDomain(entry.url));
                            const domain = extractDomain(entry.url);
                            const rank = idx + 1;
                            
                            return (
                              <div 
                                key={idx}
                                className="grid grid-cols-[40px_1fr_120px] gap-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors items-center"
                              >
                                <div className="text-xs text-gray-400 flex-shrink-0">
                                  {rank}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-900 text-sm truncate">{brandName}</div>
                                  <div className="text-xs text-gray-500 truncate">{domain}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-gray-900">{entry.score || 0}%</div>
                                  <div className="text-xs font-medium text-orange-500">+0.0%</div>
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

              </div>
            )}

            {/* Analyses LLM détaillées */}
            {!isAnalyzing && currentAnalysis && miniLLMResults.length > 0 && (
              <Card className="border-gray-200 shadow-sm bg-white">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Analyses Détaillées
                  </CardTitle>
                  <p className="text-gray-600">
                    Analyses approfondies de vos concurrents principaux
                  </p>
                </CardHeader>
                <CardContent>
                  <MiniLLMAnalysis 
                    data={miniLLMResults} 
                    isLoading={loadingMiniLLM}
                  />
                </CardContent>
              </Card>
            )}

            {/* Affichage détaillé de l'analyse concurrentielle */}
            {!isAnalyzing && currentAnalysis && (
              <>
                {/* <DetailedCompetitiveAnalysis 
                  competitors={(() => {
                   //console.log('🔍 Fallback logic - consolidated_competitors length:', currentAnalysis.consolidated_competitors?.length || 0);
                    
                    if (currentAnalysis.consolidated_competitors?.length > 0) {
                     //console.log('✅ Using consolidated_competitors');
                      return currentAnalysis.consolidated_competitors.map(comp => ({
                        name: comp.name,
                        domain: comp.primary_url,
                        traffic: 0,
                        keywords: 0,
                        backlinks: 0,
                        domain_rating: comp.average_score,
                        organic_keywords: 0,
                        paid_keywords: 0,
                        top_keywords: [],
                        strengths: [],
                        weaknesses: [],
                        opportunities: []
                      }));
                    } else {
                     //console.log('🔄 Using models_analysis fallback');
                      const extracted = currentAnalysis.models_analysis?.flatMap(model => {
                       //console.log('🔍 Processing model:', model.model_info?.display_name);
                       //console.log('🔍 Model competitors:', model.competitors?.length || 0);
                        return model.competitors?.map(comp => ({
                          name: comp.name,
                          domain: comp.url,
                          traffic: 0,
                          keywords: 0,
                          backlinks: 0,
                          domain_rating: comp.similarity_score,
                          organic_keywords: 0,
                          paid_keywords: 0,
                          top_keywords: comp.mentioned_features || [],
                          strengths: comp.competitive_advantages || [],
                          weaknesses: [],
                          opportunities: [],
                          // Toutes les données supplémentaires
                          url: comp.url,
                          alternative_urls: comp.alternative_urls || [],
                          similarity_score: comp.similarity_score,
                          confidence_level: comp.confidence_level,
                          model_rank: comp.model_rank,
                          reasoning: comp.reasoning,
                          context_snippet: comp.context_snippet,
                          mentioned_features: comp.mentioned_features || [],
                          competitive_advantages: comp.competitive_advantages || []
                        })) || [];
                      }) || [];
                     //console.log('🔍 Extracted competitors:', extracted.length);
                      return extracted;
                    }
                  })()} 
                  isLoading={false}
                /> */}
               
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Competition;