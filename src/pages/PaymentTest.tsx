import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePayment } from '@/hooks/usePayment';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';
import { CheckCircle, XCircle, AlertCircle, Loader2, Crown, Star, Zap } from 'lucide-react';

const PaymentTest: React.FC = () => {
  const { 
    plans, 
    currentSubscription, 
    usageLimits, 
    loading, 
    error,
    canUseFeature,
    getUsagePercentage,
    analyzeWebsite,
    analyzeCompetitors,
    optimizeWebsite,
    loadPaymentData
  } = usePayment();
  
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<any>({});
  const [isTesting, setIsTesting] = useState(false);
  const [testUrl, setTestUrl] = useState('https://example.com');

  useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    try {
      setIsTesting(true);
      const result = await testFunction();
      setTestResults(prev => ({ ...prev, [testName]: { success: true, data: result } }));
      toast({
        title: `Test ${testName} réussi`,
        description: "Fonctionnalité testée avec succès",
      });
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [testName]: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Erreur inconnue' 
        } 
      }));
      toast({
        title: `Test ${testName} échoué`,
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const testAnalysis = () => runTest('analysis', () => analyzeWebsite(testUrl));
  const testCompetitorAnalysis = () => runTest('competitor_analysis', () => analyzeCompetitors(testUrl));
  const testOptimization = () => runTest('optimization', () => optimizeWebsite(testUrl));

  const getTestStatus = (testName: string) => {
    const result = testResults[testName];
    if (!result) return 'pending';
    return result.success ? 'success' : 'error';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending': return <AlertCircle className="h-5 w-5 text-gray-400" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement des données de paiement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🧪 Test du Système de Paiement</h1>
        <p className="text-gray-600">Vérification de l'intégration avec le backend</p>
      </div>

      {/* État actuel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            État de l'abonnement
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentSubscription ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Plan actuel:</span>
                <Badge variant="outline">{currentSubscription.currentPlan?.name || 'Inconnu'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <Badge variant={currentSubscription.subscription?.status === 'active' ? 'default' : 'secondary'}>
                  {currentSubscription.subscription?.status || 'Inconnu'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Date de fin:</span>
                <span>{currentSubscription.subscription?.end_date || 'N/A'}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Aucun abonnement actif</p>
          )}
        </CardContent>
      </Card>

      {/* Quotas d'usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quotas d'usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usageLimits ? (
            <div className="space-y-4">
              {['analysis', 'report', 'competitor_analysis', 'optimize'].map(feature => {
                const key = `can_use_${feature}` as keyof typeof usageLimits;
                const limits = usageLimits[key];
                const percentage = getUsagePercentage(feature as any);
                
                return (
                  <div key={feature} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="capitalize">{feature.replace('_', ' ')}:</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={limits?.allowed ? 'default' : 'secondary'}>
                          {limits?.allowed ? '✅' : '❌'}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {limits?.used || 0}/{limits?.limit === -1 ? '∞' : limits?.limit || 0}
                        </span>
                      </div>
                    </div>
                    {limits?.limit > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">Aucune donnée de quota disponible</p>
          )}
        </CardContent>
      </Card>

      {/* Tests de fonctionnalités */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Tests de fonctionnalités
          </CardTitle>
          <CardDescription>
            Testez les fonctionnalités protégées avec votre abonnement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testUrl">URL de test</Label>
            <Input
              id="testUrl"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={testAnalysis}
              disabled={isTesting || !canUseFeature('analysis')}
              className="flex items-center gap-2"
            >
              {getStatusIcon(getTestStatus('analysis'))}
              Test Analyse
            </Button>

            <Button
              onClick={testCompetitorAnalysis}
              disabled={isTesting || !canUseFeature('competitor_analysis')}
              className="flex items-center gap-2"
            >
              {getStatusIcon(getTestStatus('competitor_analysis'))}
              Test Concurrents
            </Button>

            <Button
              onClick={testOptimization}
              disabled={isTesting || !canUseFeature('optimize')}
              className="flex items-center gap-2"
            >
              {getStatusIcon(getTestStatus('optimization'))}
              Test Optimisation
            </Button>
          </div>

          {/* Résultats des tests */}
          {Object.keys(testResults).length > 0 && (
            <div className="mt-6 space-y-2">
              <h4 className="font-semibold">Résultats des tests:</h4>
              {Object.entries(testResults).map(([testName, result]: [string, any]) => (
                <div key={testName} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(result.success ? 'success' : 'error')}
                    <span className="font-medium capitalize">{testName.replace('_', ' ')}</span>
                  </div>
                  {result.success ? (
                    <p className="text-sm text-green-600">✅ Test réussi</p>
                  ) : (
                    <p className="text-sm text-red-600">❌ {result.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans disponibles */}
      <Card>
        <CardHeader>
          <CardTitle>Plans disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map(plan => (
              <div key={plan.id} className="p-4 border rounded-lg">
                <h4 className="font-semibold">{plan.name}</h4>
                <p className="text-2xl font-bold">{plan.price}€</p>
                <p className="text-sm text-gray-600">{plan.interval}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs">Analyses: {plan.max_analyses === -1 ? '∞' : plan.max_analyses}</p>
                  <p className="text-xs">Rapports: {plan.max_reports === -1 ? '∞' : plan.max_reports}</p>
                  <p className="text-xs">Concurrents: {plan.max_competitor_analyses === -1 ? '∞' : plan.max_competitor_analyses}</p>
                  <p className="text-xs">Optimisations: {plan.max_optimizations === -1 ? '∞' : plan.max_optimizations}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Erreurs */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PaymentTest;









