import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, TrendingUp, Users, Calendar, FileText, ChevronRight, ArrowLeft, Plus, RefreshCw, Loader2, Zap, Sparkles, Target, Star, Brain } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BreadcrumbCustom } from "@/components/ui/breadcrumb-custom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from '@/services/authService';
import ReportModules from "@/components/reports/ReportModules";
import ReportDetails from "@/components/reports/ReportDetails";
import { LLMOReportDisplay } from "@/components/llmo-report";
import { useReports, useReport } from "@/hooks/useReports";
import type { ReportResponse } from "@/lib/api";
import { mapLLMOReportData } from '@/lib/llmo-mapper';

const Analyses = () => {
  const navigate = useNavigate();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [newAnalysisUrl, setNewAnalysisUrl] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [includeOptimization, setIncludeOptimization] = useState(true);

  // États pour l'analyse optimisée
  const [optimizedAnalysisUrl, setOptimizedAnalysisUrl] = useState("");
  const [isOptimizedDialogOpen, setIsOptimizedDialogOpen] = useState(false);
  const [isOptimizedAnalyzing, setIsOptimizedAnalyzing] = useState(false);
  const [optimizedProgress, setOptimizedProgress] = useState(0);
  
  const { reports, loading, error, createAnalysis } = useReports();
  const { report, loading: reportLoading, error: reportError } = useReport(selectedReportId);
  const { toast } = useToast();

  const handleStartNewAnalysis = async () => {
    if (!newAnalysisUrl.trim()) return;
    
    try {
      setIsAnalyzing(true);
      setProgress(0);
      
      // Normaliser l'URL (préfixe https:// si absent)
      const normalizedUrl = newAnalysisUrl.startsWith('http://') || newAnalysisUrl.startsWith('https://')
        ? newAnalysisUrl
        : `https://${newAnalysisUrl}`;
      setNewAnalysisUrl(normalizedUrl);
      
      toast({
        title: "Analyse démarrée",
        description: `${includeOptimization ? 'Analyse LLMO avec optimisation' : 'Analyse LLMO simple'} de ${normalizedUrl} en cours...`,
      });

      // Simuler la progression
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      const reportId = await createAnalysis(normalizedUrl, includeOptimization);
      
      if (reportId) {
        clearInterval(progressInterval);
        setProgress(100);

        setTimeout(() => {
          setIsAnalyzing(false);
          setIsDialogOpen(false);
          setNewAnalysisUrl("");
          setProgress(0);

          toast({
            title: "Analyse terminée",
            description: `L'analyse LLMO ${includeOptimization ? 'avec optimisation' : 'simple'} est maintenant disponible.`,
          });

          // Auto-sélectionner le nouveau rapport
          setSelectedReportId(reportId);
        }, 1000);
      } else {
        throw new Error("Impossible de créer l'analyse");
      }

    } catch (error) {
      console.error("Erreur lors de l'analyse:", error);
      setIsAnalyzing(false);
      setProgress(0);
      toast({
        title: "Erreur d'analyse",
        description: "Une erreur est survenue lors de l'analyse. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleOptimizedAnalysis = async () => {
    if (!optimizedAnalysisUrl.trim()) return;
    
    try {
      setIsOptimizedAnalyzing(true);
      setOptimizedProgress(0);
      
      // Normaliser l'URL (préfixe https:// si absent)
      const normalizedUrl = optimizedAnalysisUrl.startsWith('http://') || optimizedAnalysisUrl.startsWith('https://')
        ? optimizedAnalysisUrl
        : `https://${optimizedAnalysisUrl}`;
      setOptimizedAnalysisUrl(normalizedUrl);
      
      toast({
        title: "Analyse optimisée démarrée",
        description: `Optimisation LLMO de ${normalizedUrl} en cours...`,
      });

      // Simuler la progression
      const progressInterval = setInterval(() => {
        setOptimizedProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      // Appel direct à l'endpoint /optimize
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.virail.studio';
      const response = await AuthService.makeAuthenticatedRequest(`${API_BASE_URL}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: normalizedUrl,
          model: 'gpt-4o',
          include_optimization: true
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Réponse /optimize:', data);
      
      clearInterval(progressInterval);
      setOptimizedProgress(100);

      setTimeout(() => {
        setIsOptimizedAnalyzing(false);
        setIsOptimizedDialogOpen(false);
        setOptimizedAnalysisUrl("");
        setOptimizedProgress(0);

        toast({
          title: "Analyse optimisée terminée",
          description: `L'optimisation LLMO de ${extractDomainFromUrl(optimizedAnalysisUrl)} a été effectuée avec succès.`,
        });
      }, 1000);

    } catch (error) {
      console.error("Erreur lors de l'analyse optimisée:", error);
      setIsOptimizedAnalyzing(false);
      setOptimizedProgress(0);
      
      toast({
        title: "Erreur d'analyse optimisée",
        description: "Une erreur est survenue lors de l'optimisation. Veuillez réessayer.",
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

  if (selectedReportId) {
    const reportInfo = reports.find(r => r.id === selectedReportId);
    
    const breadcrumbItems = [
      { label: "Analyses", onClick: () => setSelectedReportId(null) },
      { label: reportInfo?.url || report?.report.url || "" }
    ];

    if (reportLoading) {
      return (
        <div className="flex-1 min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-neutral-600" />
            <p className="text-gray-600 font-medium">Chargement de l'analyse...</p>
          </div>
        </div>
      );
    }
    
    if (reportError || !report) {
       return (
        <div className="flex-1 min-h-screen bg-background p-8 pt-6">
          <Button variant="outline" size="sm" onClick={() => setSelectedReportId(null)} className="gap-2 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <Card className="border border-border shadow-sm bg-card">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-bold text-foreground mb-2">Erreur de chargement</h3>
              <p className="text-muted-foreground">{reportError || 'Impossible de charger les détails du rapport.'}</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Mapper les données pour les composants qui en ont besoin
    const mappedData = mapLLMOReportData(report);

    return (
      <div className="flex-1 space-y-6 p-8 pt-6 bg-background min-h-screen">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedReportId(null)}
            className="gap-2 bg-card hover:bg-muted border-border"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux analyses
          </Button>
        </div>

        <BreadcrumbCustom items={breadcrumbItems} />

        <Card className="border border-border shadow-sm bg-card">
          <Tabs defaultValue="overview" className="w-full">
            <div className="border-b border-border px-6 pt-6">
              <TabsList className="grid w-full max-w-md grid-cols-3 bg-muted p-1 rounded-xl">
                <TabsTrigger value="overview" className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg text-foreground">
                  Vue d'ensemble
                </TabsTrigger>
                <TabsTrigger value="modules" className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg text-foreground">
                  Modules
                </TabsTrigger>
                <TabsTrigger value="details" className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg text-foreground">
                  Détails
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6">
              <TabsContent value="overview" className="space-y-6 mt-0">
                <LLMOReportDisplay reportData={report} />
              </TabsContent>
              
              <TabsContent value="modules" className="space-y-6 mt-0">
                <ReportModules mappedData={mappedData} />
              </TabsContent>
              
              <TabsContent value="details" className="space-y-6 mt-0">
                <ReportDetails mappedData={mappedData} />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-background">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden bg-card px-8 py-12 border-b border-border">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-muted/50"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="max-w-3xl">
              {/* <div className="flex items-center gap-3 mb-4"> */}
                {/* <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center"> */}
                  {/* <Brain className="w-6 h-6 text-white" /> */}
                {/* </div> */}
                {/* <Badge className="bg-neutral-900 text-white border-neutral-900">
                  🧠 IA Analytics
                </Badge> */}
              {/* </div> */}
              <h1 className="text-4xl font-bold text-foreground mb-3">
                Analyses GEO
              </h1>
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                Analysez et optimisez vos contenus avec l'intelligence artificielle.
              </p>
              <div className="flex items-center gap-4">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-semibold px-6 py-3 h-auto"
                      disabled={isAnalyzing || isOptimizedAnalyzing}
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      {isAnalyzing ? "Analyse en cours..." : "Nouvelle Analyse"}
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
            
            {/* Stats preview */}
            <div className="hidden lg:block">
              <div className="bg-card rounded-2xl p-6 border border-border">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground mb-1">{reports?.length || 0}</div>
                  <div className="text-muted-foreground text-sm font-medium">Analyses Totales</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Star className="w-4 h-4 text-yellow-300" />
                    <span className="text-yellow-300 text-sm">Premium</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8 space-y-8">
        {/* Dialogs */}
        <Dialog open={isOptimizedDialogOpen} onOpenChange={setIsOptimizedDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-foreground" />
                Analyse Optimisée
              </DialogTitle>
              <DialogDescription>
                L'URL a été pré-remplie à partir de l'analyse sélectionnée.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="optimized-url">URL du site web</Label>
                <Input
                  id="optimized-url"
                  placeholder="exemple.com"
                  value={optimizedAnalysisUrl}
                  onChange={(e) => setOptimizedAnalysisUrl(e.target.value)}
                  onBlur={() => {
                    if (optimizedAnalysisUrl && !optimizedAnalysisUrl.startsWith('http://') && !optimizedAnalysisUrl.startsWith('https://')) {
                      setOptimizedAnalysisUrl(`https://${optimizedAnalysisUrl}`)
                    }
                  }}
                  disabled={isOptimizedAnalyzing}
                  className="border-border focus:border-primary"
                />
              </div>
              
              {isOptimizedAnalyzing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Progression de l'optimisation</span>
                    <span>{Math.round(optimizedProgress)}%</span>
                  </div>
                  <Progress value={optimizedProgress} className="h-3" />
                  <p className="text-xs text-muted-foreground">
                    Optimisation en cours... Cela peut prendre quelques minutes.
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsOptimizedDialogOpen(false);
                    setOptimizedAnalysisUrl("");
                  }}
                  disabled={isOptimizedAnalyzing}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleOptimizedAnalysis}
                  disabled={!optimizedAnalysisUrl.trim() || isOptimizedAnalyzing}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isOptimizedAnalyzing ? "Optimisation en cours..." : "Lancer l'optimisation"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-foreground" />
                Nouvelle Analyse GEO
              </DialogTitle>
              <DialogDescription>
                Entrez l'URL du site web que vous souhaitez analyser avec notre moteur LLMO.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL du site web</Label>
                <Input
                  id="url"
                  placeholder="exemple.com"
                  value={newAnalysisUrl}
                  onChange={(e) => setNewAnalysisUrl(e.target.value)}
                  onBlur={() => {
                    if (newAnalysisUrl && !newAnalysisUrl.startsWith('http://') && !newAnalysisUrl.startsWith('https://')) {
                      setNewAnalysisUrl(`https://${newAnalysisUrl}`)
                    }
                  }}
                  disabled={isAnalyzing}
                  className="border-border focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Type d'analyse</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="optimization"
                    checked={includeOptimization}
                    onCheckedChange={(checked) => setIncludeOptimization(checked as boolean)}
                    disabled={isAnalyzing}
                  />
                  <Label htmlFor="optimization" className="text-sm font-normal">
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
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <p className="text-xs text-muted-foreground">
                    Analyse en cours... Cela peut prendre quelques minutes.
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isAnalyzing}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleStartNewAnalysis}
                  disabled={!newAnalysisUrl.trim() || isAnalyzing}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isAnalyzing ? "Analyse en cours..." : "Lancer l'analyse"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Enhanced Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-neutral-50 border border-neutral-200 overflow-hidden relative"> */}
            {/* <div className="absolute top-0 right-0 w-20 h-20 bg-neutral-300/20 rounded-full blur-xl"></div> */}
            {/* <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-neutral-800">Analyses Total</CardTitle>
              <div className="w-10 h-10 bg-neutral-300 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <BarChart3 className="h-5 w-5 text-neutral-700" />
              </div>
            </CardHeader> */}
            {/* <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-neutral-900 mb-1">156</div>
              <p className="text-sm text-neutral-600 font-semibold">+12 ce mois</p>
            </CardContent> */}
          {/* </Card> */}
          
          {/* <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-neutral-50 border border-neutral-200 overflow-hidden relative"> */}
            {/* <div className="absolute top-0 right-0 w-20 h-20 bg-neutral-300/20 rounded-full blur-xl"></div> */}
            {/* <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-neutral-800">Score Moyen</CardTitle>
              <div className="w-10 h-10 bg-neutral-300 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="h-5 w-5 text-neutral-700" />
              </div>
            </CardHeader> */}
            {/* <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-neutral-900 mb-1">
                {reports.length > 0 
                  ? Math.round(reports.reduce((acc, r) => acc + (r.metadata.score || 0), 0) / reports.filter(r => r.metadata.score).length)
                  : 0
                }
              </div> */}
              {/* <p className="text-sm text-neutral-600 font-semibold">
                {reports.length > 0 ? `${reports.length} analyses` : 'Aucune analyse'}
              </p>
            </CardContent>
          </Card> */}
          
          {/* <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-neutral-50 border border-neutral-200 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-neutral-300/20 rounded-full blur-xl"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-neutral-800">Sites Analysés</CardTitle>
              <div className="w-10 h-10 bg-neutral-300 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5 text-neutral-700" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-neutral-900 mb-1">
                {new Set(reports.map(r => new URL(r.url).hostname.replace('www.', ''))).size}
              </div>
              <p className="text-sm text-neutral-600 font-semibold">
                {reports.length > 0 ? `${reports.length} analyses totales` : 'Aucun site analysé'}
              </p>
            </CardContent>
          </Card> */}
          
          {/* <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-neutral-50 border border-neutral-200 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-neutral-300/20 rounded-full blur-xl"></div> */}
            {/* <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-neutral-800">Temps Moyen</CardTitle>
              <div className="w-10 h-10 bg-neutral-300 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Calendar className="h-5 w-5 text-neutral-700" />
              </div>
            </CardHeader> */}
            {/* <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-neutral-900 mb-1">95.4s</div>
              <p className="text-sm text-neutral-600 font-semibold">-8.7% optimisation</p>
            </CardContent> */}
          {/* </Card> */}
        </div>
        
        {/* Enhanced Reports List */}
        <Card className="border border-border shadow-sm bg-card overflow-hidden">
          <CardHeader className="bg-muted border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-xl text-foreground">
                  <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                    <FileText className="h-5 w-5 text-foreground" />
                  </div>
                  Rapports Récents
                </CardTitle>
                <CardDescription className="mt-2 text-muted-foreground">Dernières analyses LLMO effectuées</CardDescription>
              </div>
              <Badge className="bg-muted text-muted-foreground">IA</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground font-medium">Chargement des rapports...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Erreur de chargement</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.reload()}
                    className="border-border text-foreground hover:bg-muted"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réessayer
                  </Button>
                </div>
              ) : reports.length === 0 ? (
                <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Aucun rapport disponible</h3>
                  <p className="text-muted-foreground mb-6">Créez votre première analyse LLMO pour commencer</p>
                  <Button 
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Première analyse
                  </Button>
                </div>
              ) : (
                reports.map((report, index) => (
                  <div 
                    key={report.id}
                    className={`group flex items-center justify-between p-6 hover:bg-muted/40 cursor-pointer transition-all duration-300 hover:shadow-sm relative overflow-hidden ${
                      index !== reports.length - 1 ? 'border-b border-border' : ''
                    }`}
                    onClick={() => {
                      setSelectedReportId(report.id);
                      navigate('/llmo-dashboard', { state: { selectedReportId: report.id } });
                    }}
                  >
                    {/* Decorative line */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <FileText className="h-7 w-7 text-foreground" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-lg group-hover:text-muted-foreground transition-colors">
                          {new URL(report.url).hostname.replace('www.', '')}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{new Date(report.createdAt).toLocaleDateString('fr-FR')}</span>
                          {report.duration > 0 && (
                            <>
                              <span>•</span>
                              <span>{report.duration.toFixed(1)}s</span>
                            </>
                          )}
                          <span>•</span>
                          <Badge 
                            variant="outline" 
                            className={
                              report.status === "completed" 
                                ? "text-foreground border-border bg-muted" 
                                : report.status === "processing"
                                ? "text-muted-foreground border-border bg-muted"
                                : "text-muted-foreground border-border bg-muted"
                            }
                          >
                            {
                              report.status === "completed" ? "Terminé" : 
                              report.status === "processing" ? "En cours" : "Échoué"
                            }
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {report.metadata.score &&
                        <div className="text-right">
                          <div className="text-2xl font-bold text-foreground">{report.metadata.score}</div>
                          <div className="text-sm text-muted-foreground">Score</div>
                        </div>
                      }
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-card hover:bg-muted border-border text-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOptimizedAnalysisUrl(report.url);
                          setIsOptimizedDialogOpen(true);
                        }}
                        disabled={isOptimizedAnalyzing || isAnalyzing}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Optimiser
                      </Button>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analyses;