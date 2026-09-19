import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  BarChart3,
  TrendingUp,
  Globe,
  Clock,
  FileText,
  ChevronRight,
  ArrowLeft,
  Plus,
  RefreshCw,
  Loader2,
  Zap,
  Star,
  Brain,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BreadcrumbCustom } from "@/components/ui/breadcrumb-custom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/services/authService";
import ReportModules from "@/components/reports/ReportModules";
import ReportDetails from "@/components/reports/ReportDetails";
import { LLMOReportDisplay } from "@/components/llmo-report";
import { useReports, useReport } from "@/hooks/useReports";
import { useSelectedReport } from "@/contexts/SelectedReportContext";
import { mapLLMOReportData } from "@/lib/llmo-mapper";
import { ModelLogosCarousel } from "@/components/ModelLogosCarousel";
import { cn } from "@/lib/utils";

const Analyses = () => {
  usePageTitle("Analyses");
  const navigate = useNavigate();

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      navigate("/login");
    }
  }, [navigate]);

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const { setSelectedReportId: setGlobalSelectedReportId } = useSelectedReport();

  useEffect(() => {
    setGlobalSelectedReportId(selectedReportId);
  }, [selectedReportId, setGlobalSelectedReportId]);

  const [newAnalysisUrl, setNewAnalysisUrl] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [includeOptimization, setIncludeOptimization] = useState(true);

  // Charger l'URL depuis sessionStorage si elle provient de l'onboarding
  useEffect(() => {
    const onboardingUrl = sessionStorage.getItem("onboarding-site-url");
    if (onboardingUrl && !newAnalysisUrl) {
      setNewAnalysisUrl(onboardingUrl);
      setIsDialogOpen(true);
    }
  }, []);

  // États pour l'analyse optimisée
  const [optimizedAnalysisUrl, setOptimizedAnalysisUrl] = useState("");
  const [isOptimizedDialogOpen, setIsOptimizedDialogOpen] = useState(false);
  const [isOptimizedAnalyzing, setIsOptimizedAnalyzing] = useState(false);
  const [optimizedProgress, setOptimizedProgress] = useState(0);

  const { reports, loading, error, createAnalysis, refreshReports } = useReports();
  const { report, loading: reportLoading, error: reportError } = useReport(selectedReportId);
  const { toast } = useToast();

  const handleStartNewAnalysis = async () => {
    if (!newAnalysisUrl.trim()) return;

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      setIsAnalyzing(true);
      setProgress(0);

      const normalizedUrl =
        newAnalysisUrl.startsWith("http://") || newAnalysisUrl.startsWith("https://")
          ? newAnalysisUrl
          : `https://${newAnalysisUrl}`;
      setNewAnalysisUrl(normalizedUrl);

      toast({
        title: "Analyse démarrée",
        description: `${
          includeOptimization ? "Analyse GEO avec optimisation" : "Analyse GEO simple"
        } de ${normalizedUrl} en cours...`,
      });

      // Simuler la progression
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            if (progressInterval) clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      const reportId = await createAnalysis(normalizedUrl, includeOptimization);

      if (progressInterval) clearInterval(progressInterval);
      setProgress(100);

      const domain = (() => {
        try {
          const urlObj = new URL(normalizedUrl);
          return urlObj.hostname.replace("www.", "");
        } catch {
          return normalizedUrl;
        }
      })();

      setTimeout(() => {
        setIsAnalyzing(false);
        setIsDialogOpen(false);
        setNewAnalysisUrl("");
        setProgress(0);

        if (reportId) {
          toast({
            title: "Analyse lancée avec succès",
            description: (
              <div className="space-y-1 text-sm">
                <p>
                  Analyse GEO {includeOptimization ? "avec optimisation" : "simple"} de{" "}
                  <strong className="text-foreground">{domain}</strong> lancée avec succès.
                </p>
                <p className="text-xs text-muted-foreground">
                  Durée estimée : 5 à 15 minutes. Les résultats s'afficheront automatiquement.
                </p>
              </div>
            ),
            duration: 8000,
          });

          setSelectedReportId(reportId);
        } else {
          toast({
            title: "Analyse en cours",
            description: (
              <div className="space-y-1 text-sm">
                <p>
                  Analyse GEO de <strong className="text-foreground">{domain}</strong> en traitement.
                </p>
                <p className="text-xs text-muted-foreground">
                  Durée estimée : 5 à 15 minutes. Actualisez après ce délai pour voir les résultats.
                </p>
              </div>
            ),
            duration: 8000,
          });
        }
      }, 800);
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      setIsAnalyzing(false);
      setProgress(0);

      const errorMessage =
        error instanceof Error ? error.message : "Une erreur est survenue lors du lancement de l'analyse.";

      toast({
        title:
          errorMessage.includes("Limite") ||
          errorMessage.includes("limit") ||
          errorMessage.includes("gratuite") ||
          errorMessage.includes("Abonnez")
            ? "Limite atteinte"
            : "Erreur",
        description: errorMessage,
        variant: "destructive",
        duration: 8000,
      });
    }
  };

  const handleOptimizedAnalysis = async () => {
    if (!optimizedAnalysisUrl.trim()) return;

    try {
      setIsOptimizedAnalyzing(true);
      setOptimizedProgress(0);

      const normalizedUrl =
        optimizedAnalysisUrl.startsWith("http://") || optimizedAnalysisUrl.startsWith("https://")
          ? optimizedAnalysisUrl
          : `https://${optimizedAnalysisUrl}`;
      setOptimizedAnalysisUrl(normalizedUrl);

      toast({
        title: "Analyse optimisée démarrée",
        description: `Optimisation LLMO de ${normalizedUrl} en cours...`,
      });

      const progressInterval = setInterval(() => {
        setOptimizedProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.viraill.com";
      const response = await AuthService.makeAuthenticatedRequest(`${API_BASE_URL}/optimize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: normalizedUrl,
          model: "gpt-4o",
          include_optimization: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      await response.json();

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
      }, 800);
    } catch (error) {
      setIsOptimizedAnalyzing(false);
      setOptimizedProgress(0);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de l'optimisation. Veuillez réessayer.";

      toast({
        title:
          errorMessage.includes("gratuite") || errorMessage.includes("Abonnez")
            ? "Limite atteinte"
            : "Erreur d'analyse optimisée",
        description: errorMessage,
        variant: "destructive",
        duration: 8000,
      });
    }
  };

  const extractDomainFromUrl = (url: string): string => {
    try {
      const domain = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
      return domain.replace("www.", "");
    } catch {
      return url;
    }
  };

  // Calculs dynamiques de métriques pour les stats
  const stats = useMemo(() => {
    const totalReports = reports.length;
    const scoredReports = reports.filter((r) => r.metadata?.score != null);
    const avgScore =
      scoredReports.length > 0
        ? Math.round(
            scoredReports.reduce((acc, r) => acc + (Number(r.metadata?.score) || 0), 0) /
              scoredReports.length
          )
        : null;

    const uniqueDomains = new Set(
      reports.map((r) => {
        try {
          return new URL(r.url.startsWith("http") ? r.url : `https://${r.url}`).hostname.replace(
            "www.",
            ""
          );
        } catch {
          return r.url;
        }
      })
    ).size;

    const completedReports = reports.filter((r) => r.status === "completed").length;

    return {
      totalReports,
      avgScore,
      uniqueDomains,
      completedReports,
    };
  }, [reports]);

  // Vue détaillée du rapport sélectionné
  if (selectedReportId) {
    const reportInfo = reports.find((r) => r.id === selectedReportId);

    const breadcrumbItems = [
      { label: "Analyses", onClick: () => setSelectedReportId(null) },
      { label: reportInfo?.url || report?.report.url || "Rapport" },
    ];

    if (reportLoading) {
      return (
        <div className="flex-1 min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Chargement de l'analyse...</p>
          </div>
        </div>
      );
    }

    if (reportError || !report) {
      return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedReportId(null)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux analyses
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de chargement</AlertTitle>
            <AlertDescription>
              {reportError || "Impossible de charger les détails du rapport."}
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    const mappedData = mapLLMOReportData(report);

    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedReportId(null)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux analyses
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOptimizedAnalysisUrl(report.report.url);
              setIsOptimizedDialogOpen(true);
            }}
            className="gap-1.5"
          >
            <Zap className="h-3.5 w-3.5 text-primary" />
            Optimiser ce site
          </Button>
        </div>

        <BreadcrumbCustom items={breadcrumbItems} />

        <Card className="border-border shadow-xs overflow-hidden">
          <Tabs defaultValue="overview" className="w-full">
            <div className="border-b border-border px-4 sm:px-6 pt-4 bg-muted/20">
              <TabsList className="bg-muted/80 p-1 rounded-xl">
                <TabsTrigger
                  value="overview"
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-2xs text-xs font-semibold"
                >
                  Vue d'ensemble
                </TabsTrigger>
                <TabsTrigger
                  value="modules"
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-2xs text-xs font-semibold"
                >
                  Modules
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-2xs text-xs font-semibold"
                >
                  Détails
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4 sm:p-6">
              <TabsContent value="overview" className="mt-0 focus-visible:outline-none">
                <LLMOReportDisplay reportData={report} />
              </TabsContent>

              <TabsContent value="modules" className="mt-0 focus-visible:outline-none">
                <ReportModules mappedData={mappedData} />
              </TabsContent>

              <TabsContent value="details" className="mt-0 focus-visible:outline-none">
                <ReportDetails mappedData={mappedData} />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    );
  }

  // Vue Principale (Liste des analyses & stats)
  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Hero Header Section */}
      <div className="border-b border-border bg-card/60 backdrop-blur-sm px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 px-2.5 py-0.5 text-xs font-semibold border-primary/20 bg-primary/5 text-primary">
                <Brain className="h-3 w-3" />
                GEO & Moteurs LLM
              </Badge>
              <Badge variant="secondary" className="text-xs font-semibold">
                {reports.length} audit{reports.length > 1 ? "s" : ""}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Analyses & Audits GEO
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Consultez l'historique de vos audits de visibilité générative, lancez de nouveaux scans multi-modèles et comparez vos performances.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshReports && refreshReports()}
              title="Actualiser les rapports"
              disabled={loading || isAnalyzing}
              className="gap-2 border-border"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              <span>Actualiser</span>
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="gap-2 font-semibold shadow-xs"
                  disabled={isAnalyzing || isOptimizedAnalyzing}
                >
                  <Plus className="h-4 w-4" />
                  <span>Nouvelle analyse</span>
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <Card className="border-border shadow-xs hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Analyses
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <BarChart3 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {stats.totalReports}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalReports > 0
                  ? `${stats.completedReports} complétée${stats.completedReports > 1 ? "s" : ""}`
                  : "Aucune analyse"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Score GEO Moyen
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {stats.avgScore != null ? `${stats.avgScore}/100` : "—"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Moyenne des rapports évalués
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Domaines Uniques
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Globe className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {stats.uniqueDomains}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sites distincts audités
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Moteur d'Audit
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                9 IA
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                GPT-4o, Claude, Perplexity, etc.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des Rapports */}
        <Card className="border-border shadow-xs overflow-hidden">
          <CardHeader className="px-6 py-4 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Rapports récents
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Cliquez sur une ligne pour ouvrir le rapport d'audit détaillé
                </CardDescription>
              </div>

              {reports.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {reports.length} résultat{reports.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <p className="text-sm font-medium">Chargement des rapports...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center max-w-md mx-auto">
                <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Erreur de chargement</h3>
                <p className="text-xs text-muted-foreground mb-4">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshReports && refreshReports()}
                  className="gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Réessayer
                </Button>
              </div>
            ) : reports.length === 0 ? (
              <div className="py-16 px-4 text-center max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                  <FileText className="h-7 w-7" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">
                  Aucun rapport disponible
                </h3>
                <p className="text-xs text-muted-foreground mb-6">
                  Lancez votre première analyse GEO pour mesurer votre visibilité dans ChatGPT, Perplexity et Claude.
                </p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  size="sm"
                  className="gap-2 font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle analyse
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {reports.map((r) => {
                  const domain = extractDomainFromUrl(r.url);
                  const dateFormatted = new Date(r.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const score = r.metadata?.score != null ? Math.round(Number(r.metadata.score)) : null;

                  return (
                    <div
                      key={r.id}
                      onClick={() => {
                        setSelectedReportId(r.id);
                        navigate("/llmo-dashboard", { state: { selectedReportId: r.id } });
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setSelectedReportId(r.id);
                          navigate("/llmo-dashboard", { state: { selectedReportId: r.id } });
                        }
                      }}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 gap-4 hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-muted/60 border border-border/80 flex items-center justify-center text-muted-foreground shrink-0 group-hover:border-primary/40 group-hover:text-primary transition-colors">
                          <Globe className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                              {domain}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1.5 py-0 h-4 border-0 font-medium shrink-0",
                                r.status === "completed"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : r.status === "processing"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : "bg-destructive/10 text-destructive"
                              )}
                            >
                              {r.status === "completed"
                                ? "Terminé"
                                : r.status === "processing"
                                ? "En cours"
                                : "Erreur"}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{dateFormatted}</span>
                            {r.duration > 0 && (
                              <>
                                <span>•</span>
                                <span>{r.duration.toFixed(1)}s</span>
                              </>
                            )}
                            <span>•</span>
                            <span className="truncate max-w-[200px] sm:max-w-xs">{r.url}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:gap-4 shrink-0 justify-between sm:justify-end">
                        {score != null ? (
                          <div className="text-right">
                            <div className="text-base font-bold text-foreground">
                              {score}
                              <span className="text-xs font-normal text-muted-foreground">/100</span>
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                              Score GEO
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground italic">En attente</div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOptimizedAnalysisUrl(r.url);
                            setIsOptimizedDialogOpen(true);
                          }}
                          disabled={isOptimizedAnalyzing || isAnalyzing}
                        >
                          <Zap className="h-3 w-3 text-primary" />
                          <span>Optimiser</span>
                        </Button>

                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Nouvelle Analyse GEO */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-2xl border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Brain className="h-4 w-4 text-primary" />
              Nouvelle Analyse GEO
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Entrez l'URL du site à auditer sur les différents modèles d'intelligence artificielle.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="url" className="text-xs font-medium">
                URL du site web
              </Label>
              <Input
                id="url"
                placeholder="ex: tally.so ou https://mon-site.fr"
                value={newAnalysisUrl}
                onChange={(e) => setNewAnalysisUrl(e.target.value)}
                onBlur={() => {
                  if (
                    newAnalysisUrl &&
                    !newAnalysisUrl.startsWith("http://") &&
                    !newAnalysisUrl.startsWith("https://")
                  ) {
                    setNewAnalysisUrl(`https://${newAnalysisUrl}`);
                  }
                }}
                disabled={isAnalyzing}
                className="text-sm"
              />
            </div>

            <div className="p-3 rounded-xl border border-border/70 bg-muted/30 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="optimization"
                  checked={includeOptimization}
                  onCheckedChange={(checked) => setIncludeOptimization(checked as boolean)}
                  disabled={isAnalyzing}
                />
                <Label htmlFor="optimization" className="text-xs font-medium cursor-pointer">
                  Inclure l'optimisation automatique
                </Label>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed pl-6">
                {includeOptimization
                  ? "Recommandations complètes de code, balises sémantiques et plan d'action inclus."
                  : "Analyse simple des citations et scores."}
              </p>
            </div>

            {isAnalyzing && (
              <div className="space-y-3 pt-2">
                <ModelLogosCarousel className="rounded-xl bg-muted/40 border border-border/50 p-2" />
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground font-medium">
                    <span>Scan en cours...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    L'analyse complète prend de 5 à 15 minutes. Vous pouvez fermer cette fenêtre, les résultats seront enregistrés.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(false)}
              disabled={isAnalyzing}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleStartNewAnalysis}
              disabled={!newAnalysisUrl.trim() || isAnalyzing}
              className="font-semibold gap-1.5"
            >
              {isAnalyzing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isAnalyzing ? "Analyse en cours..." : "Lancer l'analyse"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Analyse Optimisée */}
      <Dialog open={isOptimizedDialogOpen} onOpenChange={setIsOptimizedDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-2xl border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Zap className="h-4 w-4 text-primary" />
              Optimisation LLMO
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Génère des optimisations techniques et sémantiques spécifiques pour ce site.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="optimized-url" className="text-xs font-medium">
                URL du site web
              </Label>
              <Input
                id="optimized-url"
                placeholder="https://example.com"
                value={optimizedAnalysisUrl}
                onChange={(e) => setOptimizedAnalysisUrl(e.target.value)}
                onBlur={() => {
                  if (
                    optimizedAnalysisUrl &&
                    !optimizedAnalysisUrl.startsWith("http://") &&
                    !optimizedAnalysisUrl.startsWith("https://")
                  ) {
                    setOptimizedAnalysisUrl(`https://${optimizedAnalysisUrl}`);
                  }
                }}
                disabled={isOptimizedAnalyzing}
                className="text-sm"
              />
            </div>

            {isOptimizedAnalyzing && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                  <span>Progression de l'optimisation</span>
                  <span>{Math.round(optimizedProgress)}%</span>
                </div>
                <Progress value={optimizedProgress} className="h-2" />
                <p className="text-[11px] text-muted-foreground">
                  Génération des patchs de remédiation en cours...
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsOptimizedDialogOpen(false);
                setOptimizedAnalysisUrl("");
              }}
              disabled={isOptimizedAnalyzing}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleOptimizedAnalysis}
              disabled={!optimizedAnalysisUrl.trim() || isOptimizedAnalyzing}
              className="font-semibold gap-1.5"
            >
              {isOptimizedAnalyzing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isOptimizedAnalyzing ? "Optimisation..." : "Lancer l'optimisation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { Analyses };
export default Analyses;