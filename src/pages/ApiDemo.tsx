import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Zap, Database, Globe, FileText, ArrowRight, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchReport, startAnalysis, listReports, type ReportResponse } from '@/lib/api';
import { startAnalysisSequential, startOptimizedAnalysis } from '@/lib/api';

/**
 * Page de démonstration des endpoints LLMO mock
 * Cette page permet de tester tous les endpoints de l'API simulée
 */
const ApiDemo = () => {
  usePageTitle('API Demo');
  const [testUrl, setTestUrl] = useState('');
  const [reportId, setReportId] = useState('504606b0bc67caad');
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const { toast } = useToast();
  const [url, setUrl] = useState('https://example.com');
  const [model, setModel] = useState('gpt-4o');
  const [results, setResults] = useState<any[]>([]);

  // Test de récupération d'un rapport par ID
  const testFetchReport = async () => {
    if (!reportId.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un ID de rapport",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      
      const report = await fetchReport(reportId);
      setResult({
        type: 'fetchReport',
        success: true,
        data: {
          id: report?.id,
          url: report?.url,
          status: report?.status,
          duration: report?.duration,
          metadata: report?.metadata,
          hasRawData: !!report?.rawData,
          rawDataLength: report?.rawData?.length || 0
        }
      });

      toast({
        title: "✅ Test réussi",
        description: `Rapport ${reportId} récupéré avec succès`
      });

    } catch (error) {
      setResult({
        type: 'fetchReport',
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });

      toast({
        title: "❌ Test échoué",
        description: "Erreur lors de la récupération du rapport",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Test de création d'une nouvelle analyse
  const testStartAnalysis = async () => {
    if (!testUrl.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une URL",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      
      const analysisResult = await startAnalysis(testUrl);
      setResult({
        type: 'startAnalysis',
        success: true,
        data: analysisResult
      });

      toast({
        title: "✅ Analyse lancée",
        description: `Analyse de ${testUrl} démarrée avec succès`
      });

    } catch (error) {
      setResult({
        type: 'startAnalysis',
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });

      toast({
        title: "❌ Test échoué",
        description: "Erreur lors du lancement de l'analyse",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Test de listing des rapports
  const testListReports = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      const reportsList = await listReports();
      setReports(reportsList);
      setResult({
        type: 'listReports',
        success: true,
        data: {
          count: reportsList.length,
          reports: reportsList.map(r => ({
            id: r.id,
            url: r.url,
            status: r.status,
            metadata: r.metadata
          }))
        }
      });

      toast({
        title: "✅ Liste récupérée",
        description: `${reportsList.length} rapport(s) trouvé(s)`
      });

    } catch (error) {
      setResult({
        type: 'listReports',
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });

      toast({
        title: "❌ Test échoué",
        description: "Erreur lors de la récupération de la liste",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Test complet de la chaîne d'API
  const testFullWorkflow = async () => {
    try {
      setLoading(true);
      setResult(null);

      // 1. Lister les rapports
      const reportsList = await listReports();

      // 2. Récupérer le rapport Booking.com
      const bookingReport = await fetchReport('504606b0bc67caad');

      // 3. Lancer une nouvelle analyse
      const newAnalysis = await startAnalysis('https://exemple.com');

      setResult({
        type: 'fullWorkflow',
        success: true,
        data: {
          step1: { count: reportsList.length },
          step2: { 
            found: !!bookingReport,
            hasData: !!bookingReport?.rawData,
            duration: bookingReport?.duration
          },
          step3: { 
            reportId: newAnalysis?.reportId,
            status: newAnalysis?.status
          }
        }
      });

      toast({
        title: "✅ Workflow complet",
        description: "Tous les endpoints fonctionnent correctement"
      });

    } catch (error) {
      setResult({
        type: 'fullWorkflow',
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });

      toast({
        title: "❌ Workflow échoué",
        description: "Erreur dans la chaîne d'API",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runParallelAnalysis = async () => {
    setLoading('parallel');
    try {
      const startTime = Date.now();
      const result = await startAnalysis(url);
      const duration = Date.now() - startTime;
      
      setResults(prev => [...prev, {
        type: 'Parallèle (2 appels simultanés)',
        duration: `${duration}ms`,
        result,
        color: 'bg-green-500',
        icon: '⚡',
        description: 'Appel principal + métadonnées en parallèle'
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        type: 'Parallèle (2 appels simultanés)',
        duration: 'Erreur',
        result: { error: error.message },
        color: 'bg-red-500',
        icon: '❌',
        description: 'Échec des appels parallèles'
      }]);
    } finally {
      setLoading(null);
    }
  };

  const runSequentialAnalysis = async () => {
    setLoading('sequential');
    try {
      const startTime = Date.now();
      const result = await startAnalysisSequential(url, { model });
      const duration = Date.now() - startTime;
      
      setResults(prev => [...prev, {
        type: 'Séquentiel (2ème dépend du 1er)',
        duration: `${duration}ms`,
        result,
        color: 'bg-blue-500',
        icon: '🔗',
        description: 'Analyse → puis optimisation basée sur résultats'
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        type: 'Séquentiel (2ème dépend du 1er)',
        duration: 'Erreur',
        result: { error: error.message },
        color: 'bg-red-500',
        icon: '❌',
        description: 'Échec des appels séquentiels'
      }]);
    } finally {
      setLoading(null);
    }
  };

  const runOptimizedAnalysis = async () => {
    setLoading('optimized');
    try {
      const startTime = Date.now();
      const result = await startOptimizedAnalysis(url, {
        strategy: 'auto',
        optimizationLevel: 'high',
        model
      });
      const duration = Date.now() - startTime;
      
      setResults(prev => [...prev, {
        type: 'Auto-optimisé (sélection intelligente)',
        duration: `${duration}ms`,
        result,
        color: 'bg-purple-500',
        icon: '🎯',
        description: 'Sélection automatique de la meilleure stratégie'
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        type: 'Auto-optimisé (sélection intelligente)',
        duration: 'Erreur',
        result: { error: error.message },
        color: 'bg-red-500',
        icon: '❌',
        description: 'Échec de l\'analyse optimisée'
      }]);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 bg-background text-foreground min-h-screen">
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Démonstration des Appels API Optimisés</CardTitle>
              <CardDescription>
                Testez les différentes stratégies d'appels API et observez les temps de réponse
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL à analyser</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Modèle pour /optimize</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger id="model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4O</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                  <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={runParallelAnalysis}
              disabled={loading !== null}
              className="h-24 flex flex-col gap-1 items-center justify-center"
              variant="outline"
            >
              {loading === 'parallel' ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">En cours...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">⚡</span>
                  <span className="font-semibold text-sm">Appels Parallèles</span>
                  <span className="text-xs text-muted-foreground">Plus rapide (simultané)</span>
                </>
              )}
            </Button>
            
            <Button 
              onClick={runSequentialAnalysis}
              disabled={loading !== null}
              className="h-24 flex flex-col gap-1 items-center justify-center"
              variant="outline"
            >
              {loading === 'sequential' ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">En cours...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">🔗</span>
                  <span className="font-semibold text-sm">Appels Séquentiels</span>
                  <span className="text-xs text-muted-foreground">2ème dépend du 1er</span>
                </>
              )}
            </Button>
            
            <Button 
              onClick={runOptimizedAnalysis}
              disabled={loading !== null}
              className="h-24 flex flex-col gap-1 items-center justify-center"
              variant="outline"
            >
              {loading === 'optimized' ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">En cours...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">🎯</span>
                  <span className="font-semibold text-sm">Auto-optimisé</span>
                  <span className="text-xs text-muted-foreground">Sélection intelligente</span>
                </>
              )}
            </Button>
          </div>

          <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
              <span>💡</span> Explication des Stratégies
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <strong className="text-foreground">⚡ Parallèle:</strong>
                <p className="text-muted-foreground">Lance l'analyse principale + récupération de métadonnées simultanément.</p>
              </div>
              <div className="space-y-1">
                <strong className="text-foreground">🔗 Séquentiel:</strong>
                <p className="text-muted-foreground">Lance l'analyse, puis utilise ses résultats pour l'optimisation.</p>
              </div>
              <div className="space-y-1">
                <strong className="text-foreground">🎯 Auto-optimisé:</strong>
                <p className="text-muted-foreground">Choisit automatiquement la meilleure stratégie selon le contexte.</p>
              </div>
            </div>
            <div className="border-t border-border/60 pt-3">
              <h5 className="font-semibold text-xs text-foreground mb-1.5">🎯 Endpoints utilisés :</h5>
              <div className="text-xs space-y-1 text-muted-foreground">
                <div><strong className="text-foreground">Tous :</strong> <code className="bg-muted px-1 py-0.5 rounded font-mono">POST /analyze</code></div>
                <div><strong className="text-foreground">Parallèle :</strong> <code className="bg-muted px-1 py-0.5 rounded font-mono">POST /analyze/config</code> avec métadonnées</div>
                <div><strong className="text-foreground">Séquentiel :</strong> <code className="bg-muted px-1 py-0.5 rounded font-mono">POST /optimize</code></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <span>📊</span> Résultats des Tests
              </CardTitle>
              <Button 
                onClick={() => setResults([])}
                variant="outline" 
                size="sm"
                className="gap-1.5"
              >
                <RotateCcw className="h-4 w-4" />
                Vider
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((test, index) => (
                <div key={index} className="border border-border rounded-xl p-4 bg-muted/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{test.icon}</span>
                    <Badge variant="secondary" className="font-medium">{test.type}</Badge>
                    <Badge variant="outline" className="font-mono text-xs">
                      ⏱️ {test.duration}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">{test.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-2 rounded bg-background border border-border">
                      <span className="text-muted-foreground">Report ID:</span> <span className="font-mono font-medium text-foreground">{test.result?.reportId || 'N/A'}</span>
                    </div>
                    <div className="p-2 rounded bg-background border border-border">
                      <span className="text-muted-foreground">Status:</span> <span className="font-medium text-foreground">{test.result?.status || 'N/A'}</span>
                    </div>
                    
                    {test.result?.metadata && (
                      <div className="md:col-span-2">
                        <strong className="text-muted-foreground block mb-1">Métadonnées (appels parallèles):</strong>
                        <div className="bg-muted/50 border border-border p-3 rounded-lg text-xs font-mono max-h-32 overflow-y-auto">
                          <pre>{JSON.stringify(test.result.metadata, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                    
                    {test.result?.optimizationResults && (
                      <div className="md:col-span-2">
                        <strong className="text-muted-foreground block mb-1">Résultats d'optimisation (appels séquentiels):</strong>
                        <div className="bg-muted/50 border border-border p-3 rounded-lg text-xs font-mono max-h-32 overflow-y-auto">
                          <pre>{JSON.stringify(test.result.optimizationResults, null, 2)}</pre>
                        </div>
                      </div>
                    )}

                    {test.result?.error && (
                      <div className="md:col-span-2">
                        <strong className="text-destructive block mb-1">Erreur:</strong>
                        <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg text-xs text-destructive">
                          {test.result.error}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ApiDemo; 