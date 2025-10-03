import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePayment } from '@/hooks/usePayment';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCompetitiveAnalysis } from "@/hooks/useCompetitiveAnalysis";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import CompetitiveAnalysisDisplay from "@/components/competitive-analysis/CompetitiveAnalysisDisplay";
import DetailedCompetitiveAnalysis from "@/components/competitive-analysis/DetailedCompetitiveAnalysis";
import { listCompetitorAnalyses, getCompetitorAnalysisById, startCompetitorAnalysis, extractDomain, CompetitorAnalysisResponse, CompetitorAnalysisSummary } from '@/services/competitorAnalysisService';

const Competition = () => {
  const [userUrl, setUserUrl] = useState("");
  const [selectedTab, setSelectedTab] = useState("saved");
  const { toast } = useToast();
  
  // États pour la nouvelle API
  const [competitorAnalyses, setCompetitorAnalyses] = useState<CompetitorAnalysisSummary[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<CompetitorAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingSavedAnalyses, setLoadingSavedAnalyses] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { usageLimits, canUseFeature } = usePayment() as any;

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
    <div className="flex-1 min-h-screen bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Hero Header Section */}
        <div className="relative overflow-hidden bg-card px-8 py-12 border-b border-border">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-muted/50"></div>
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-muted/50 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-muted/50 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                {/* <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div> */}
                {/* <Badge className="bg-neutral-900 text-white border-neutral-900">
                  ⚔️ Analyse Concurrentielle
                </Badge> */}
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-3">
                Analyse Concurrentielle GEO
              </h1>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                Comparez votre positionnement avec vos concurrents et dominez votre marché.
              </p>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => setSelectedTab("setup")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg font-semibold px-6 py-3 h-auto"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Nouvelle Analyse
                </Button>
                <Button 
                  onClick={() => setSelectedTab("saved")}
                  className="bg-card text-foreground hover:bg-muted shadow-lg font-semibold px-6 py-3 h-auto transition-all duration-300 border border-border"
                >
                  <History className="h-5 w-5 mr-2" />
                  Mes Analyses
                </Button>
              </div>
            </div>
            
            {/* Stats preview */}
            <div className="hidden lg:block">
              <div className="bg-primary rounded-2xl p-6 border border-primary">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-foreground mb-1">{competitorAnalyses.length}</div>
                  <div className="text-primary-foreground/80 text-sm font-medium">Analyses Sauvées</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Star className="w-4 h-4 text-yellow-300" />
                    <span className="text-primary-foreground text-sm">Premium</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8 space-y-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <div className="bg-card rounded-2xl p-2 shadow-sm border border-border">
            <TabsList className="grid w-full grid-cols-3 bg-muted p-1 h-auto rounded-xl">
              <TabsTrigger 
                value="saved" 
                className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg h-12 font-semibold transition-all duration-300 text-muted-foreground"
              >
                <History className="h-4 w-4 mr-2" />
                Analyses sauvegardées
              </TabsTrigger>
              <TabsTrigger 
                value="setup" 
                className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg h-12 font-semibold transition-all duration-300 text-muted-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle analyse
              </TabsTrigger>
              <TabsTrigger 
                value="results" 
                disabled={!currentAnalysis && !isAnalyzing} 
                className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg h-12 font-semibold transition-all duration-300 disabled:opacity-50 text-muted-foreground"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Résultats
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="saved" className="space-y-6 mt-8">
            <Card className="border border-border shadow-sm bg-card overflow-hidden">
              <CardHeader className="bg-muted border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                        <History className="h-5 w-5 text-muted-foreground" />
                      </div>
                      Analyses Concurrentielles
                    </CardTitle>
                    <CardDescription className="mt-2 text-muted-foreground">
                      Accédez à vos analyses et comparez l'évolution de votre positionnement
                    </CardDescription>
                  </div>
                  <Badge className="bg-primary/10 text-primary">
                    <Trophy className="w-3 h-3 mr-1" />
                    {competitorAnalyses.length} analyse{competitorAnalyses.length > 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingSavedAnalyses ? (
                  <div className="text-center py-16">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      <span className="text-muted-foreground">Chargement des analyses...</span>
                    </div>
                  </div>
                ) : competitorAnalyses.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Trophy className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">Aucune analyse sauvegardée</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Commencez votre première analyse concurrentielle et découvrez comment vous vous positionnez face à vos concurrents.
                    </p>
                    <Button 
                      onClick={() => setSelectedTab("setup")} 
                      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm font-semibold px-8 py-3 h-auto"
                    >
                      <Rocket className="h-5 w-5 mr-2" />
                      Lancer ma première analyse
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {competitorAnalyses.map((analysis, index) => (
                      <div 
                        key={analysis.analysis_id} 
                        className="group p-6 hover:bg-muted/40 cursor-pointer transition-all duration-300 hover:shadow-sm relative overflow-hidden"
                        onClick={() => handleLoadSavedAnalysis(analysis.analysis_id)}
                      >
                        {/* Decorative line */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <Trophy className="h-6 w-6 text-foreground" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="text-lg font-bold text-foreground group-hover:text-foreground transition-colors">
                                    {extractDomain(analysis.url)}
                                  </h4>
                                  <Badge className="bg-muted text-foreground font-semibold shadow-sm">
                                    #{index + 1}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4">
                                  <Badge className="bg-muted text-foreground font-medium">
                                    {analysis.status === 'completed' ? 'Terminée' : 'En cours'}
                                  </Badge>
                                  <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                                    {analysis.total_competitors_found} concurrent{analysis.total_competitors_found > 1 ? 's' : ''}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>Analysé {formatDistanceToNow(new Date(analysis.created_at), { 
                                  addSuffix: true, 
                                  locale: fr 
                                })}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{analysis.total_competitors_found} concurrent{analysis.total_competitors_found > 1 ? 's' : ''} analysé{analysis.total_competitors_found > 1 ? 's' : ''}</span>
                              </div>
                            </div>

                            {/* Enhanced insights preview */}
                            <div className="bg-muted rounded-xl p-4 group-hover:bg-muted/60 transition-all border border-border">
                              <div className="grid md:grid-cols-3 gap-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                                    <Award className="h-4 w-4 text-foreground" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-foreground">
                                      {analysis.total_models_executed} Modèles
                                    </div>
                                    <div className="text-xs text-muted-foreground">IA utilisés</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                                    <Clock className="h-4 w-4 text-foreground" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-foreground">
                                      {analysis.status === 'completed' ? 'Terminée' : 'En cours'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Statut</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                                    <BarChart3 className="h-4 w-4 text-foreground" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-foreground">
                                      Analyse #{analysis.analysis_id}
                                    </div>
                                    <div className="text-xs text-muted-foreground">ID unique</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 ml-6">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteAnalysis(analysis.analysis_id, e)}
                              className="text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-all hover:scale-110 w-10 h-10 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
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

          <TabsContent value="setup" className="space-y-6 mt-8">
            <Card className="border-0 shadow-xl bg-card backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-muted border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                        <Search className="h-5 w-5 text-primary-foreground" />
                      </div>
                      Nouvelle Analyse Concurrentielle
                    </CardTitle>
                    <CardDescription className="mt-2 text-muted-foreground">
                      Entrez l'URL de votre site pour commencer l'analyse GEO
                    </CardDescription>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">
                    <Zap className="w-3 h-3 mr-1" />
                    IA Powered
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8">
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
                        className="h-14 text-lg border border-border focus:border-primary rounded-xl shadow-sm"
                      />
                    </div>
                    <Button 
                      onClick={handleStartAnalysis}
                      disabled={!userUrl.trim() || isAnalyzing}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg h-14 px-8 font-semibold text-lg rounded-xl"
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
                  
                  <div className="bg-muted rounded-2xl p-6 border border-border">
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-3 text-lg">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <Info className="h-4 w-4 text-primary-foreground" />
                      </div>
                      Comment ça fonctionne ?
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-foreground text-xs font-bold">1</span>
                          </div>
                          <span className="text-sm text-muted-foreground">Analyse GEO complète de votre site</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-foreground text-xs font-bold">2</span>
                          </div>
                          <span className="text-sm text-muted-foreground">Identification des concurrents par IA</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-foreground text-xs font-bold">3</span>
                          </div>
                          <span className="text-sm text-muted-foreground">Analyse GEO de chaque concurrent</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-foreground text-xs font-bold">4</span>
                          </div>
                          <span className="text-sm text-muted-foreground">Comparaison détaillée et insights</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-foreground text-xs font-bold">5</span>
                          </div>
                          <span className="text-sm text-muted-foreground">Recommandations personnalisées</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-foreground text-xs font-bold">6</span>
                          </div>
                          <span className="text-sm text-muted-foreground">Sauvegarde pour suivi temporel</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6 mt-8">
            {/* Enhanced Header avec informations sur l'analyse chargée */}
            {currentAnalysis && (
              <Card className="border-0 shadow-xl bg-muted overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse"></div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground tracking-tight">
                          Analyse de {extractDomain(currentAnalysis.url)}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded-full bg-card border border-border text-muted-foreground">
                            {formatDistanceToNow(new Date(currentAnalysis.created_at), { addSuffix: true, locale: fr })}
                          </span>
                          {currentAnalysis.target_positioning ? (
                            <span className="px-2 py-0.5 rounded-full bg-card border border-border text-muted-foreground">
                              Rang {currentAnalysis.target_positioning.overall_rank}/{currentAnalysis.target_positioning.total_competitors}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-card border border-border text-muted-foreground">
                              {currentAnalysis.consolidated_competitors?.length || 0} concurrents
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-1.5 rounded-md">
                        {currentAnalysis.target_positioning?.market_position || 'En cours d\'analyse'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTab("saved")}
                        className="text-muted-foreground hover:text-foreground border border-transparent hover:border-border bg-transparent hover:bg-muted/40 rounded-md"
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
                    console.log('🔄 Test manuel des quotas...');
                    const testResult = canUseFeature('competitor_analysis');
                    const featureLimits = usageLimits?.can_use_competitor_analysis;
                    console.log('📊 Résultat test:', testResult);
                    console.log('📋 Détails complets:', {
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
                    console.log('🔄 Rechargement manuel des quotas...');
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
                    console.log('🔐 Test de session...');

                    // Tester via une requête API pour voir si la session est valide
                    try {
                      const response = await fetch('/api/v1/usage/limits', {
                        method: 'GET',
                        credentials: 'include'
                      });

                      if (response.ok) {
                        alert('✅ Session valide - Authentification réussie');
                        console.log('✅ Session valide');
                      } else if (response.status === 401) {
                        alert('❌ Session expirée - Reconnexion nécessaire\nRedirection vers la page de connexion...');
                        console.log('❌ Session expirée');
                        window.location.href = '/login';
                      } else {
                        alert(`❓ Erreur inconnue: ${response.status}`);
                        console.log('❓ Erreur inconnue:', response.status);
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
              <Card className="border-border bg-muted shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-foreground animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Veuillez patienter</h3>
                      <p className="text-muted-foreground mt-1">Votre analyse est en cours de finalisation. Les résultats vont s'afficher dès qu'ils sont prêts.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced État de chargement */}
            {isAnalyzing && (
              <Card className="border-0 shadow-xl bg-muted overflow-hidden">
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-xl">
                        <Loader2 className="h-10 w-10 text-primary-foreground animate-spin" />
                      </div>
                      <div className="absolute inset-0 rounded-full border-4 border-border border-t-primary animate-spin"></div>
                    </div>
                    <div className="max-w-md">
                      <h3 className="text-2xl font-bold text-foreground mb-3">
                        Analyse concurrentielle en cours...
                      </h3>
                      <p className="text-muted-foreground mb-6 text-lg">
                        Notre IA analyse votre site et identifie vos concurrents avec 3 modèles différents
                      </p>
                      <div className="w-80 bg-muted rounded-full h-3 mx-auto shadow-inner">
                        <div 
                          className="bg-primary h-3 rounded-full transition-all duration-1000 shadow-sm animate-pulse"
                          style={{ width: `75%` }}
                        ></div>
                      </div>
                      <p className="text-muted-foreground mt-3 font-semibold">Analyse en cours...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Affichage complet de toutes les données */}
            {!isAnalyzing && currentAnalysis && (
              <div className="space-y-6 mb-6">
                {/* Informations générales de l'analyse */}
                <Card className="bg-card border border-border">
                  <CardContent className="space-y-6 text-foreground p-6">
                    {/* Métriques principales */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                        <div className="text-2xl font-bold text-foreground">{currentAnalysis.models_analysis?.length || 0}</div>
                        <div className="text-sm text-muted-foreground">Modèles IA</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl border border-green-500/20">
                        <div className="text-2xl font-bold text-foreground">
                          {currentAnalysis.models_analysis?.reduce((total, model) => total + (model.competitors?.length || 0), 0) || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Concurrents Trouvés</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20">
                        <div className="text-2xl font-bold text-foreground">
                          {new Date(currentAnalysis.created_at).toLocaleDateString('fr-FR', { 
                            day: '2-digit', 
                            month: '2-digit' 
                          })}
                        </div>
                        <div className="text-sm text-muted-foreground">Date d'Analyse</div>
                      </div>
                    </div>
                    
                    {/* Détails de l'analyse */}
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                        <div className="text-sm font-medium text-muted-foreground mb-2">URL Analysée</div>
                        <a 
                          href={currentAnalysis.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary hover:underline break-all"
                        >
                          {currentAnalysis.url}
                        </a>
                      </div>
                      
                      <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                        <div className="text-sm font-medium text-muted-foreground mb-2">Titre</div>
                        <div className="text-foreground">{currentAnalysis.title}</div>
                      </div>
                      
                      {currentAnalysis.description && (
                        <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                          <div className="text-sm font-medium text-muted-foreground mb-2">Description</div>
                          <div className="text-foreground">{currentAnalysis.description}</div>
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

                {/* Détails par modèle */}
                <Card className="bg-card border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg text-foreground">🤖 Détails par Modèle IA</CardTitle>
                  </CardHeader>
                  <CardContent className="text-foreground">
                    <div className="space-y-3">
                      {currentAnalysis.models_analysis?.map((model, modelIdx) => (
                        <details key={modelIdx} className="group border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-card border border-border/50 flex items-center justify-center overflow-hidden">
                                {(() => {
                                  const modelName = model.model_info?.display_name?.toLowerCase() || '';
                                  if (modelName.includes('claude')) {
                                    return <img src="/prompt-model-claude.svg" alt="Claude" className="w-6 h-6" />;
                                  } else if (modelName.includes('gpt') || modelName.includes('openai')) {
                                    return <img src="/prompt-model-openai-for-light.svg" alt="OpenAI" className="w-6 h-6" />;
                                  } else if (modelName.includes('gemini')) {
                                    return <img src="/prompt-model-gemini.svg" alt="Gemini" className="w-6 h-6" />;
                                  } else if (modelName.includes('mistral')) {
                                    return <img src="/Mistral.png" alt="Mistral" className="w-6 h-6" />;
                                  } else if (modelName.includes('perplexity')) {
                                    return <img src="/prompt-model-perplexity.svg" alt="Perplexity" className="w-6 h-6" />;
                                  } else {
                                    return <span className="text-sm font-bold text-primary">🤖</span>;
                                  }
                                })()}
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground text-lg">
                                  {(() => {
                                    const displayName = model.model_info?.display_name || '';
                                    // Nettoyer et formater le nom du modèle
                                    if (displayName.toLowerCase().includes('claude')) {
                                      return 'Claude';
                                    } else if (displayName.toLowerCase().includes('gpt')) {
                                      // Extraire la version du modèle (ex: GPT-5, GPT-4, etc.)
                                      const versionMatch = displayName.match(/gpt-?(\d+)/i);
                                      if (versionMatch) {
                                        return `GPT-${versionMatch[1]}`;
                                      }
                                      return 'GPT';
                                    } else if (displayName.toLowerCase().includes('gemini')) {
                                      return 'Gemini';
                                    } else if (displayName.toLowerCase().includes('mistral')) {
                                      return 'Mistral';
                                    } else if (displayName.toLowerCase().includes('perplexity')) {
                                      return 'Perplexity';
                                    } else {
                                      // Nettoyer les noms génériques
                                      return displayName
                                        .replace(/\([^)]*\)/g, '') // Supprimer les parenthèses
                                        .replace(/\/.*$/, '') // Supprimer tout après le slash
                                        .trim();
                                    }
                                  })()}
                                </h4>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                                    {model.model_info?.competitors_found || 0} concurrents
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    {Math.round((model.model_info?.average_score || 0) * 100)}% score
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={model.model_info?.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                {model.model_info?.status}
                              </Badge>
                              <svg className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </summary>
                          
                          <div className="px-4 pb-4 border-t border-border/50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
                              <div className="text-center p-3 bg-card rounded-lg border border-border/50">
                                <div className="text-xl font-bold text-foreground">{model.model_info?.competitors_found || 0}</div>
                                <div className="text-sm text-muted-foreground">Concurrents trouvés</div>
                              </div>
                              <div className="text-center p-3 bg-card rounded-lg border border-border/50">
                                <div className="text-xl font-bold text-foreground">{Math.round((model.model_info?.average_score || 0) * 100)}%</div>
                                <div className="text-sm text-muted-foreground">Score moyen</div>
                              </div>
                              <div className="text-center p-3 bg-card rounded-lg border border-border/50">
                                <div className="text-xl font-bold text-foreground">
                                  {Math.round((model.model_info?.min_score || 0) * 100)}% - {Math.round((model.model_info?.max_score || 0) * 100)}%
                                </div>
                                <div className="text-sm text-muted-foreground">Score min-max</div>
                              </div>
                            </div>

                            {model.competitors && model.competitors.length > 0 && (
                              <div>
                                <h5 className="font-medium mb-3 text-foreground">Concurrents identifiés:</h5>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {model.competitors.map((competitor, compIdx) => (
                                    <div key={compIdx} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-foreground truncate">{competitor.name}</div>
                                        <div className="text-sm text-muted-foreground truncate">{competitor.url}</div>
                                      </div>
                                      <div className="text-right ml-3">
                                        <div className="text-sm font-bold text-foreground">
                                          {Math.round((competitor.similarity_score || 0) * 100)}%
                                        </div>
                                        <div className="text-xs text-muted-foreground">Score</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </details>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Positionnement cible */}
                {currentAnalysis.target_positioning && (
                  <Card className="bg-card border border-border">
                    <CardHeader>
                      <CardTitle className="text-lg text-foreground">Positionnement Cible</CardTitle>
                    </CardHeader>
                    <CardContent className="text-foreground">
                      <div className="space-y-4">
                        {Object.entries(((currentAnalysis.target_positioning as any)?.trends_by_model || {})).map(([modelName, trends]) => {
                          const t: any = trends as any;
                          return (
                          <div key={modelName} className="border border-border rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 rounded-lg bg-card border border-border/50 flex items-center justify-center overflow-hidden">
                                {(() => {
                                  const name = modelName.toLowerCase();
                                  if (name.includes('claude')) {
                                    return <img src="/prompt-model-claude.svg" alt="Claude" className="w-5 h-5" />;
                                  } else if (name.includes('gpt') || name.includes('openai')) {
                                    return <img src="/prompt-model-openai-for-light.svg" alt="OpenAI" className="w-5 h-5" />;
                                  } else if (name.includes('gemini')) {
                                    return <img src="/prompt-model-gemini.svg" alt="Gemini" className="w-5 h-5" />;
                                  } else if (name.includes('mistral')) {
                                    return <img src="/Mistral.png" alt="Mistral" className="w-5 h-5" />;
                                  } else if (name.includes('perplexity')) {
                                    return <img src="/prompt-model-perplexity.svg" alt="Perplexity" className="w-5 h-5" />;
                                  } else {
                                    return <span className="text-sm font-bold text-primary">🎯</span>;
                                  }
                                })()}
                              </div>
                              <h4 className="font-semibold text-foreground">
                                {(() => {
                                  // Nettoyer et formater le nom du modèle
                                  if (modelName.toLowerCase().includes('claude')) {
                                    return 'Claude';
                                  } else if (modelName.toLowerCase().includes('gpt')) {
                                    const versionMatch = modelName.match(/gpt-?(\d+)/i);
                                    if (versionMatch) {
                                      return `GPT-${versionMatch[1]}`;
                                    }
                                    return 'GPT';
                                  } else if (modelName.toLowerCase().includes('gemini')) {
                                    return 'Gemini';
                                  } else if (modelName.toLowerCase().includes('mistral')) {
                                    return 'Mistral';
                                  } else if (modelName.toLowerCase().includes('perplexity')) {
                                    return 'Perplexity';
                                  } else {
                                    return modelName
                                      .replace(/\([^)]*\)/g, '')
                                      .replace(/\/.*$/, '')
                                      .trim();
                                  }
                                })()}
                              </h4>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center">
                                <div className="text-lg font-bold">{t.count}</div>
                                <div className="text-sm text-muted-foreground">Points</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-foreground">{t.delta_30d > 0 ? '+' : ''}{t.delta_30d}%</div>
                                <div className="text-sm text-muted-foreground">Delta 30j</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-foreground">
                                  {t.points?.[0]?.global_score || 0}
                                </div>
                                <div className="text-sm text-muted-foreground">Score global</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-foreground">
                                  {t.points?.[0]?.llmo_score || 0}
                                </div>
                                <div className="text-sm text-muted-foreground">Score LLMO</div>
                              </div>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Top concurrents */}
                {currentAnalysis.target_positioning?.top_competitors && currentAnalysis.target_positioning.top_competitors.length > 0 && (
                  <Card className="bg-card border border-border">
                    <CardHeader>
                      <CardTitle className="text-lg text-foreground flex items-center gap-2">
                        <Award className="h-5 w-5 text-muted-foreground" />
                        Top concurrents
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Classement des meilleurs concurrents identifiés pour votre marché
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="divide-y divide-border rounded-lg overflow-hidden border border-border">
                        {currentAnalysis.target_positioning.top_competitors.map((c, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-card hover:bg-muted/40 transition-colors">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border text-sm font-bold">
                                #{c.rank}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-foreground truncate">
                                  {c.name}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                  <span>Score: {Math.round(Number(c.score))}/100</span>
                                  <span>•</span>
                                  <span>Écart: {c.gap_vs_you > 0 ? '+' : ''}{Number(c.gap_vs_you).toFixed(1)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge
                                className={`${String(c.status).includes('devant') || String(c.status).includes('Leader') ? 'bg-red-500/10 text-red-600' : String(c.status).includes('derrière') ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}
                              >
                                {c.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Avantages concurrentiels et axes d'amélioration */}
                {(currentAnalysis.target_positioning?.competitive_advantages?.length || 0) > 0 || (currentAnalysis.target_positioning?.improvement_areas?.length || 0) > 0 ? (
                  <Card className="bg-card border border-border">
                    <CardHeader>
                      <CardTitle className="text-lg text-foreground">Analyse qualitative</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Points forts identifiés et axes d'amélioration recommandés
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Points forts */}
                        <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                          <h4 className="text-sm font-semibold text-green-600 mb-3 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Points forts
                          </h4>
                          {(currentAnalysis.target_positioning?.competitive_advantages || []).length > 0 ? (
                            <ul className="space-y-2 list-disc list-inside">
                              {currentAnalysis.target_positioning!.competitive_advantages.map((item, idx) => (
                                <li key={idx} className="text-sm text-foreground">{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-sm text-muted-foreground">Aucun point fort listé</div>
                          )}
                        </div>

                        {/* À améliorer */}
                        <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                          <h4 className="text-sm font-semibold text-amber-600 mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            À améliorer
                          </h4>
                          {(currentAnalysis.target_positioning?.improvement_areas || []).length > 0 ? (
                            <ul className="space-y-2 list-disc list-inside">
                              {currentAnalysis.target_positioning!.improvement_areas.map((item, idx) => (
                                <li key={idx} className="text-sm text-foreground">{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-sm text-muted-foreground">Aucun axe d'amélioration listé</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            )}

            {/* Affichage détaillé de l'analyse concurrentielle */}
            {!isAnalyzing && currentAnalysis && (
              <>
                {console.log('🔍 Debug currentAnalysis:', currentAnalysis)}
                {console.log('🔍 Debug consolidated_competitors:', currentAnalysis.consolidated_competitors)}
                {console.log('🔍 Debug competitors length:', currentAnalysis.consolidated_competitors?.length || 0)}
                {console.log('🔍 Debug models_analysis:', currentAnalysis.models_analysis)}
                {console.log('🔍 Debug models_analysis length:', currentAnalysis.models_analysis?.length || 0)}
                {console.log('🔍 Debug first model competitors:', currentAnalysis.models_analysis?.[0]?.competitors)}
                {console.log('🔍 Debug first model competitors length:', currentAnalysis.models_analysis?.[0]?.competitors?.length || 0)}
                {console.log('🔍 Debug target_positioning:', currentAnalysis.target_positioning)}
                {console.log('🔍 Debug global_stats:', currentAnalysis.global_stats)}
                <DetailedCompetitiveAnalysis 
                  competitors={(() => {
                    console.log('🔍 Fallback logic - consolidated_competitors length:', currentAnalysis.consolidated_competitors?.length || 0);
                    
                    if (currentAnalysis.consolidated_competitors?.length > 0) {
                      console.log('✅ Using consolidated_competitors');
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
                      console.log('🔄 Using models_analysis fallback');
                      const extracted = currentAnalysis.models_analysis?.flatMap(model => {
                        console.log('🔍 Processing model:', model.model_info?.display_name);
                        console.log('🔍 Model competitors:', model.competitors?.length || 0);
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
                      console.log('🔍 Extracted competitors:', extracted.length);
                      return extracted;
                    }
                  })()} 
                  isLoading={false}
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </div>
  );
};

export default Competition;