import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, TrendingUp, Users, Calendar, FileText, ChevronRight, ArrowLeft, Plus, RefreshCw, Loader2, Zap, Sparkles, Target, Star, Brain, CheckCircle, Clock } from "lucide-react";
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

const Analyses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { reports, loading, error, refetch } = useReports();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOptimizedDialogOpen, setIsOptimizedDialogOpen] = useState(false);
  const [optimizedAnalysisUrl, setOptimizedAnalysisUrl] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizedAnalyzing, setIsOptimizedAnalyzing] = useState(false);
  const [analysisUrl, setAnalysisUrl] = useState("");
  const [selectedTab, setSelectedTab] = useState("saved");

  const handleAnalysis = async (url: string, isOptimized = false) => {
    if (isOptimized) {
      setIsOptimizedAnalyzing(true);
    } else {
      setIsAnalyzing(true);
    }

    try {
      const response = await AuthService.makeAuthenticatedRequest(
        `${import.meta.env.VITE_API_BASE_URL || 'https://api.virail.studio'}/llmo/analyze`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse');
      }

      const data = await response.json();
      
      toast({
        title: "Analyse lancée",
        description: "Votre analyse LLMO est en cours de traitement.",
      });

      // Refresh the reports list
      refetch();
      
      if (isOptimized) {
        setIsOptimizedDialogOpen(false);
      } else {
        setIsDialogOpen(false);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      if (isOptimized) {
        setIsOptimizedAnalyzing(false);
      } else {
        setIsAnalyzing(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <div className="container mx-auto px-6 py-8">
        <BreadcrumbCustom 
          items={[
            { label: "Accueil", href: "/" },
            { label: "Analyses", href: "/analyses" }
          ]}
        />

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analyses LLMO</h1>
              <p className="text-gray-600 mt-2">Gérez et optimisez vos analyses d'intelligence artificielle</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Analyses</p>
                    <p className="text-3xl font-bold">{reports.length}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Sites Uniques</p>
                    <p className="text-3xl font-bold">
                      {new Set(reports.map(r => new URL(r.url).hostname.replace('www.', ''))).size}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Score Moyen</p>
                    <p className="text-3xl font-bold">
                      {reports.length > 0 
                        ? Math.round(reports.reduce((acc, r) => acc + (r.metadata.score || 0), 0) / reports.length)
                        : '--'
                      }
                    </p>
                  </div>
                  <Star className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Modern Reports List */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-white mb-2">
                      Rapports Récents
                    </CardTitle>
                    <CardDescription className="text-blue-100 text-lg">
                      Dernières analyses LLMO effectuées
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4 mr-2" />
                    IA
                  </Badge>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {loading ? (
                  <div className="flex items-center justify-center p-16">
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Chargement des rapports</h3>
                        <p className="text-gray-600">Analyse des données en cours...</p>
                      </div>
                    </div>
                  </div>
                ) : error ? (
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-red-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <FileText className="h-10 w-10 text-red-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Erreur de chargement</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      onClick={() => window.location.reload()}
                      className="border-red-200 text-red-700 hover:bg-red-50 px-6 py-3"
                    >
                      <RefreshCw className="h-5 w-5 mr-2" />
                      Réessayer
                    </Button>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="p-16 text-center">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                      <FileText className="h-12 w-12 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Aucun rapport disponible</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">Créez votre première analyse LLMO pour commencer votre optimisation</p>
                    <Button 
                      onClick={() => setIsDialogOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Plus className="h-5 w-5 mr-3" />
                      Première analyse
                    </Button>
                  </div>
                ) : (
                  reports.map((report, index) => (
                    <div 
                      key={report.id}
                      className={`group flex items-center justify-between p-8 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 cursor-pointer transition-all duration-500 hover:shadow-lg relative overflow-hidden ${
                        index !== reports.length - 1 ? 'border-b border-gray-100/50' : ''
                      }`}
                      onClick={() => {
                        setSelectedReportId(report.id);
                        navigate('/llmo-dashboard', { state: { selectedReportId: report.id } });
                      }}
                    >
                      {/* Modern decorative line */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                      
                      {/* Background pattern */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="flex items-center gap-6 relative z-10">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                            <FileText className="h-8 w-8 text-white" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-xl group-hover:text-blue-700 transition-colors duration-300 mb-2">
                            {new URL(report.url).hostname.replace('www.', '')}
                          </h4>
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-500" />
                              <span className="font-medium">{new Date(report.createdAt).toLocaleDateString('fr-FR')}</span>
                            </div>
                            {report.duration > 0 && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-indigo-500" />
                                <span className="font-medium">{report.duration.toFixed(1)}s</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={
                                  report.status === "completed" 
                                    ? "text-green-700 border-green-200 bg-green-50 px-3 py-1" 
                                    : report.status === "processing"
                                    ? "text-blue-700 border-blue-200 bg-blue-50 px-3 py-1"
                                    : "text-gray-700 border-gray-200 bg-gray-50 px-3 py-1"
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
                      </div>
                      <div className="flex items-center gap-6 relative z-10">
                        {report.metadata.score && (
                          <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl px-6 py-4 shadow-lg">
                            <div className="text-3xl font-bold text-blue-700 mb-1">{report.metadata.score}</div>
                            <div className="text-sm text-blue-600 font-medium">Score LLMO</div>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="lg"
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 px-6 py-3 shadow-lg hover:shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-105"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOptimizedAnalysisUrl(report.url);
                            setIsOptimizedDialogOpen(true);
                          }}
                          disabled={isOptimizedAnalyzing || isAnalyzing}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Optimiser
                        </Button>
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                          <ChevronRight className="h-5 w-5 text-white group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dialogs */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nouvelle analyse LLMO</DialogTitle>
              <DialogDescription>
                Entrez l'URL du site web que vous souhaitez analyser avec l'intelligence artificielle.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="url">URL du site web</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={analysisUrl}
                  onChange={(e) => setAnalysisUrl(e.target.value)}
                />
              </div>
              <Button 
                onClick={() => handleAnalysis(analysisUrl)} 
                disabled={isAnalyzing || !analysisUrl}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Lancer l'analyse
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isOptimizedDialogOpen} onOpenChange={setIsOptimizedDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Optimiser l'analyse</DialogTitle>
              <DialogDescription>
                Lancez une nouvelle analyse optimisée pour ce site web.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>URL:</strong> {optimizedAnalysisUrl}
                </p>
              </div>
              <Button 
                onClick={() => handleAnalysis(optimizedAnalysisUrl, true)} 
                disabled={isOptimizedAnalyzing}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isOptimizedAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Optimisation en cours...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Optimiser l'analyse
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Analyses;

