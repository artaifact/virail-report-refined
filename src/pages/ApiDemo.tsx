import { useState } from 'react';
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
      console.error('Erreur test fetchReport:', error);
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
      console.error('Erreur test startAnalysis:', error);
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
      console.error('Erreur test listReports:', error);
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
      console.log('📋 Rapports disponibles:', reportsList.length);

      // 2. Récupérer le rapport Booking.com
      const bookingReport = await fetchReport('504606b0bc67caad');
      console.log('📄 Rapport booking récupéré:', !!bookingReport);

      // 3. Lancer une nouvelle analyse
      const newAnalysis = await startAnalysis('https://exemple.com');
      console.log('🚀 Nouvelle analyse:', newAnalysis?.reportId);

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
      console.error('Erreur workflow complet:', error);
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
      console.error('Erreur appels parallèles:', error);
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
      console.error('Erreur appels séquentiels:', error);
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
      console.error('Erreur analyse optimisée:', error);
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
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Démonstration des Appels API Optimisés
          </CardTitle>
          <CardDescription>
            Testez les différentes stratégies pour faire deux appels API et comparez leurs performances
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="url">URL à analyser</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="model">Modèle pour /optimize</Label>
              <select
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="gpt-4o">GPT-4O</option>
                <option value="gpt-4">GPT-4</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                <option value="claude-3-opus">Claude 3 Opus</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={runParallelAnalysis}
              disabled={loading !== null}
              className="h-24 flex flex-col gap-1"
              variant="outline"
            >
              {loading === 'parallel' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  En cours...
                </>
              ) : (
                <>
                  <span className="text-lg">⚡</span>
                  <span>Appels Parallèles</span>
                  <small className="text-xs opacity-60">Plus rapide</small>
                </>
              )}
            </Button>
            
            <Button 
              onClick={runSequentialAnalysis}
              disabled={loading !== null}
              className="h-24 flex flex-col gap-1"
              variant="outline"
            >
              {loading === 'sequential' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  En cours...
                </>
              ) : (
                <>
                  <span className="text-lg">🔗</span>
                  <span>Appels Séquentiels</span>
                  <small className="text-xs opacity-60">2ème dépend du 1er</small>
                </>
              )}
            </Button>
            
            <Button 
              onClick={runOptimizedAnalysis}
              disabled={loading !== null}
              className="h-24 flex flex-col gap-1"
              variant="outline"
            >
              {loading === 'optimized' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  En cours...
                </>
              ) : (
                <>
                  <span className="text-lg">🎯</span>
                  <span>Auto-optimisé</span>
                  <small className="text-xs opacity-60">Sélection intelligente</small>
                </>
              )}
            </Button>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">💡 Explication des Stratégies</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
              <div>
                <strong>⚡ Parallèle:</strong>
                <p>Lance l'analyse principale + récupération de métadonnées simultanément.</p>
              </div>
              <div>
                <strong>🔗 Séquentiel:</strong>
                <p>Lance l'analyse, puis utilise ses résultats pour l'optimisation.</p>
              </div>
              <div>
                <strong>🎯 Auto-optimisé:</strong>
                <p>Choisit automatiquement la meilleure stratégie selon le contexte.</p>
              </div>
            </div>
            <div className="border-t pt-3">
              <h5 className="font-medium text-sm mb-1">🎯 Endpoints utilisés :</h5>
              <div className="text-xs space-y-1">
                <div><strong>Tous :</strong> <code>POST /analyze</code> avec <code>{"{"}"url": "..."{"}"}</code></div>
                <div><strong>Parallèle :</strong> <code>POST /analyze/config</code> avec métadonnées</div>
                <div><strong>Séquentiel :</strong> <code>POST /optimize</code> avec <code>{"{"}"url": "...", "model": "{model}"{"}"}</code></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              📊 Résultats des Tests
              <Button 
                onClick={() => setResults([])}
                variant="outline" 
                size="sm"
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-4 w-4" />
                Vider
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((test, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{test.icon}</span>
                    <Badge className={`${test.color} text-white`}>{test.type}</Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      ⏱️ {test.duration}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{test.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Report ID:</strong> {test.result?.reportId || 'N/A'}
                    </div>
                    <div>
                      <strong>Status:</strong> {test.result?.status || 'N/A'}
                    </div>
                    
                    {test.result?.metadata && (
                      <div className="md:col-span-2">
                        <strong>Métadonnées (appels parallèles):</strong>
                        <div className="bg-green-50 border border-green-200 p-2 rounded text-xs mt-1 max-h-32 overflow-y-auto">
                          <pre>{JSON.stringify(test.result.metadata, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                    
                    {test.result?.optimizationResults && (
                      <div className="md:col-span-2">
                        <strong>Résultats d'optimisation (appels séquentiels):</strong>
                        <div className="bg-blue-50 border border-blue-200 p-2 rounded text-xs mt-1 max-h-32 overflow-y-auto">
                          <pre>{JSON.stringify(test.result.optimizationResults, null, 2)}</pre>
                        </div>
                      </div>
                    )}

                    {test.result?.error && (
                      <div className="md:col-span-2">
                        <strong>Erreur:</strong>
                        <div className="bg-red-50 border border-red-200 p-2 rounded text-xs mt-1">
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