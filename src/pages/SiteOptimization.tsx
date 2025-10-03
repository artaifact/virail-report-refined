import React, { useState, useEffect } from 'react';
import { Globe, Zap, Target, Loader2, BarChart3, Sparkles, Rocket, Settings, TrendingUp, Star, Brain, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import SiteUrlsOverview from '@/components/SiteUrlsOverview';

interface OptimizationStats {
  totalSites: number;
  totalOptimizations: number;
  averageScore: number;
  sitesWithOptimization: number;
}

const SiteOptimization: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<OptimizationStats>({
    totalSites: 0,
    totalOptimizations: 0,
    averageScore: 0,
    sitesWithOptimization: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // États pour le dialogue d'analyse LLMO
  const [newAnalysisUrl, setNewAnalysisUrl] = useState("");
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [includeOptimization, setIncludeOptimization] = useState(true);

  // Fonction pour charger les statistiques depuis l'API
  const loadOptimizationStats = async () => {
    try {
      setIsLoadingStats(true);
      setStatsError(null);

      // Récupérer les données depuis /optimize
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.virail.studio';
      console.log('🔄 Chargement des statistiques depuis:', `${API_BASE_URL}/optimize`);
      const optimizeResponse = await AuthService.makeAuthenticatedRequest(`${API_BASE_URL}/optimize`);
      
      if (optimizeResponse.ok) {
        const optimizeData = await optimizeResponse.json();
        console.log('✅ Données récupérées depuis /optimize:', optimizeData);
        
        // Adapter selon la structure des données
        let sitesData = [];
        if (Array.isArray(optimizeData)) {
          sitesData = optimizeData;
        } else if (optimizeData.sites) {
          sitesData = optimizeData.sites;
        } else if (optimizeData.data) {
          sitesData = optimizeData.data;
        }

        // Calculer les statistiques
        const totalSites = sitesData.length;
        const totalOptimizations = sitesData.reduce((acc: number, site: any) => 
          acc + (site.optimizationCount || site.optimizations || 0), 0
        );
        const sitesWithOptimization = sitesData.filter((site: any) => 
          site.hasOptimization || site.optimized || (site.optimizationCount || site.optimizations || 0) > 0
        ).length;
        
        const scores = sitesData
          .map((site: any) => site.score || site.llmo_score || site.optimization_score || 0)
          .filter((score: number) => score > 0);
        const averageScore = scores.length > 0 
          ? Math.round(scores.reduce((acc: number, score: number) => acc + score, 0) / scores.length)
          : 0;

        const finalStats = {
          totalSites,
          totalOptimizations,
          averageScore,
          sitesWithOptimization
        };
        console.log('📊 Statistiques calculées:', finalStats);
        setStats(finalStats);

      } else {
        console.warn('⚠️ Erreur API /optimize, tentative avec l\'endpoint textual-optimizations...');
        
        // Tentative avec l'endpoint des optimisations textuelles
        try {
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.virail.studio';
          const textualOptResponse = await AuthService.makeAuthenticatedRequest(`${API_BASE_URL}/textual-optimizations`);
          
          if (textualOptResponse.ok) {
            const textualOptData = await textualOptResponse.json();
            
            // Compter les optimisations textuelles
            let optimizations = [];
            if (Array.isArray(textualOptData)) {
              optimizations = textualOptData;
            } else if (textualOptData.optimizations) {
              optimizations = textualOptData.optimizations;
            } else if (textualOptData.data) {
              optimizations = textualOptData.data;
            }

            // Extraire les sites uniques des optimisations
            const uniqueSites = new Set();
            optimizations.forEach((opt: any) => {
              if (opt.input_parameters?.content_domain || opt.original_text) {
                uniqueSites.add(opt.input_parameters?.content_domain || 'Site inconnu');
              }
            });

            setStats({
              totalSites: uniqueSites.size,
              totalOptimizations: optimizations.length,
              averageScore: 0,
              sitesWithOptimization: uniqueSites.size
            });

          } else {
            throw new Error('Échec de récupération des optimisations textuelles');
          }
        } catch (fallbackError) {
          console.error('❌ Erreur fallback:', fallbackError);
          setStatsError('Impossible de récupérer les données des optimisations');
        }
      }

    } catch (error) {
      console.error('❌ Erreur lors du chargement des statistiques:', error);
      setStatsError(error instanceof Error ? error.message : 'Erreur lors du chargement');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleStartNewAnalysis = async () => {
    if (!newAnalysisUrl.trim()) return;
    
    try {
      setIsAnalyzing(true);
      setAnalysisProgress(0);
      
      toast({
        title: "Optimisation démarrée",
        description: `Optimisation GEO de ${newAnalysisUrl} en cours...`,
      });

      // Simuler la progression
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      // Appel direct et indépendant à l'endpoint /optimize
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.virail.studio';
      const response = await AuthService.makeAuthenticatedRequest(`${API_BASE_URL}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: newAnalysisUrl,
          model: 'gpt-4o',
          include_optimization: includeOptimization
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Réponse /optimize:', data);
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);

      setTimeout(() => {
        setIsAnalyzing(false);
        setIsAnalysisDialogOpen(false);
        setNewAnalysisUrl("");
        setAnalysisProgress(0);

        toast({
          title: "Optimisation terminée",
          description: `L'optimisation GEO de ${extractDomainFromUrl(newAnalysisUrl)} a été effectuée avec succès.`,
        });

        // Recharger les statistiques après l'optimisation
        loadOptimizationStats();
      }, 1000);

    } catch (error) {
      console.error("Erreur lors de l'optimisation:", error);
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      
      // Gestion d'erreur spécifique
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isServerError = errorMessage.includes('500') || errorMessage.includes('playwright') || errorMessage.includes('dependencies');
      
      toast({
        title: "Erreur d'optimisation",
        description: isServerError 
          ? "Le serveur d'optimisation est temporairement indisponible. Veuillez réessayer plus tard."
          : "Une erreur est survenue lors de l'optimisation. Veuillez vérifier l'URL et réessayer.",
        variant: "destructive",
      });
    }
  };

  const extractDomainFromUrl = (url: string): string => {
    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  // Charger les statistiques au montage du composant
  useEffect(() => {
    loadOptimizationStats();
  }, []);

  return (
    <div className="flex-1 min-h-screen bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Hero Header Section */}
        <div className="relative overflow-hidden bg-card px-8 py-12 border-b border-border">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-neutral-50/50"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="max-w-3xl">
              {/* <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-neutral-900 text-white border-neutral-900">
                  🚀 Optimisation IA
                </Badge>
              </div> */}
              <h1 className="text-4xl font-bold text-foreground mb-3">
                Optimisation de Sites
              </h1>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                Optimisez vos contenus avec l'intelligence artificielle et boostez vos performances.
              </p>
              <div className="flex items-center gap-4">
                <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-semibold px-6 py-3 h-auto"
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <BarChart3 className="h-5 w-5 mr-2" />}
                      {isAnalyzing ? "Analyse en cours..." : "Nouvelle Optimisation"}
                    </Button>
                  </DialogTrigger>
                </Dialog>
                {/* <Button 
                  variant="outline"
                  className="border-neutral-200 text-neutral-700 hover:bg-neutral-50 px-6 py-3 h-auto"
                  onClick={() => navigate('/analyses')}
                >
                  <Brain className="h-5 w-5 mr-2" />
                  Voir les analyses
                </Button> */}
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8 space-y-8">
        {/* Dialog */}
        <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
          <DialogContent className="sm:max-w-md bg-card text-foreground border border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <Rocket className="h-5 w-5 text-foreground" />
                Optimisation GEO
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Entrez l'URL du site web que vous souhaitez optimiser directement avec notre moteur GEO.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-analysis-url" className="text-foreground">URL du site web</Label>
                <Input
                  id="site-analysis-url"
                  placeholder="exemple.com"
                  value={newAnalysisUrl}
                  onChange={(e) => setNewAnalysisUrl(e.target.value)}
                  disabled={isAnalyzing}
                  className="border border-border focus:border-primary bg-card text-foreground"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-foreground">Type d'analyse</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="site-analysis-optimization"
                    checked={includeOptimization}
                    onCheckedChange={(checked) => setIncludeOptimization(checked as boolean)}
                    disabled={isAnalyzing}
                  />
                  <Label htmlFor="site-analysis-optimization" className="text-sm font-normal text-foreground">
                    Inclure l'optimisation automatique
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  {includeOptimization 
                    ? "Analyse complète avec recommandations d'optimisation" 
                    : "Analyse simple sans optimisation"
                  }
                </p>
              </div>
              
              {isAnalyzing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Progression de l'analyse</span>
                    <span>{Math.round(analysisProgress)}%</span>
                  </div>
                  <Progress value={analysisProgress} className="h-3" />
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleStartNewAnalysis}
                  disabled={!newAnalysisUrl.trim() || isAnalyzing}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isAnalyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}
                  {isAnalyzing ? 'Optimisation en cours...' : 'Lancer l\'Optimisation'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAnalysisDialogOpen(false);
                    setNewAnalysisUrl("");
                  }}
                  disabled={isAnalyzing}
                  className="border border-border text-foreground hover:bg-muted"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>


        {/* Sites Overview */}
        <SiteUrlsOverview />

        {/* Enhanced Guide */}
        <Card className="border border-border shadow-sm bg-card overflow-hidden">
          <CardHeader className="bg-muted border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-xl text-foreground">
                  <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                    <Settings className="h-5 w-5 text-foreground" />
                  </div>
                  Comment procéder ?
                </CardTitle>
                <CardDescription className="mt-2 text-muted-foreground">
                  Guide rapide pour optimiser le contenu de vos sites avec l'IA
                </CardDescription>
              </div>
              <Badge className="bg-muted text-foreground">Guide</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="group space-y-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-primary-foreground font-bold text-lg">1</span>
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-lg mb-2">Sélectionnez un site</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Choisissez un site parmi ceux déjà analysés ou lancez une nouvelle analyse GEO pour découvrir de nouvelles opportunités.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  <span>Analyse automatique</span>
                </div>
              </div>
              
              <div className="group space-y-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-primary-foreground font-bold text-lg">2</span>
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-lg mb-2">Configurez l'optimisation</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Définissez votre stratégie, audience cible et contraintes pour une optimisation textuelle personnalisée et efficace.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Settings className="h-4 w-4" />
                  <span>Personnalisation avancée</span>
                </div>
              </div>
              
              <div className="group space-y-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-primary-foreground font-bold text-lg">3</span>
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-lg mb-2">Obtenez vos résultats</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Récupérez le contenu optimisé avec une analyse détaillée et des recommandations d'amélioration basées sur l'IA.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>Résultats mesurables</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default SiteOptimization;