import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePayment } from '@/hooks/usePayment';
import UsageQuota from '@/components/UsageQuota';
import ErrorHandler, { createPaymentError } from '@/components/ErrorHandler';
import { BarChart3, Zap, Target, FileText, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

const AnalysisExample: React.FC = () => {
  const {
    analyzeWebsite,
    analyzeCompetitors,
    optimizeWebsite,
    canUseFeature,
    getQuotaInfo,
    getUsagePercentage,
    isProcessing,
    error
  } = usePayment();

  const [url, setUrl] = useState('');
  const [results, setResults] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<any>(null);

  const handleAnalysis = async () => {
    if (!url) return;

    try {
      setAnalysisError(null);
      setResults(null);

      // Vérifier si l'analyse est disponible
      if (!canUseFeature('analysis')) {
        const quotaInfo = getQuotaInfo('analysis');
        const error = createPaymentError(
          'QUOTA_EXCEEDED',
          quotaInfo?.reason || 'Limite d\'analyses atteinte'
        );
        setAnalysisError(error);
        return;
      }

      // Lancer l'analyse avec vérification automatique des quotas
      const result = await analyzeWebsite(url, `analysis_${Date.now()}`);
      setResults(result);
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
      setAnalysisError(error);
    }
  };

  const handleCompetitorAnalysis = async () => {
    if (!url) return;

    try {
      setAnalysisError(null);
      setResults(null);

      // Vérifier si l'analyse de concurrents est disponible
      if (!canUseFeature('competitor_analysis')) {
        const quotaInfo = getQuotaInfo('competitor_analysis');
        const error = createPaymentError(
          'QUOTA_EXCEEDED',
          quotaInfo?.reason || 'Limite d\'analyses de concurrents atteinte'
        );
        setAnalysisError(error);
        return;
      }

      const result = await analyzeCompetitors(url, {
        min_score: 0.3,
        min_mentions: 1
      });
      setResults(result);
    } catch (error) {
      console.error('Erreur lors de l\'analyse de concurrents:', error);
      setAnalysisError(error);
    }
  };

  const handleOptimization = async () => {
    if (!url) return;

    try {
      setAnalysisError(null);
      setResults(null);

      // Vérifier si l'optimisation est disponible
      if (!canUseFeature('optimize')) {
        const quotaInfo = getQuotaInfo('optimize');
        const error = createPaymentError(
          'QUOTA_EXCEEDED',
          quotaInfo?.reason || 'Limite d\'optimisations atteinte'
        );
        setAnalysisError(error);
        return;
      }

      const result = await optimizeWebsite(url);
      setResults(result);
    } catch (error) {
      console.error('Erreur lors de l\'optimisation:', error);
      setAnalysisError(error);
    }
  };

  const getFeatureStatus = (featureType: 'analysis' | 'competitor_analysis' | 'optimize') => {
    const canUse = canUseFeature(featureType);
    const percentage = getUsagePercentage(featureType);
    
    if (canUse) {
      if (percentage > 80) {
        return { status: 'warning', icon: <AlertTriangle className="h-4 w-4 text-yellow-500" /> };
      }
      return { status: 'available', icon: <CheckCircle className="h-4 w-4 text-green-500" /> };
    }
    
    return { status: 'unavailable', icon: <AlertTriangle className="h-4 w-4 text-red-500" /> };
  };

  const analysisStatus = getFeatureStatus('analysis');
  const competitorStatus = getFeatureStatus('competitor_analysis');
  const optimizeStatus = getFeatureStatus('optimize');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Analyse de Site Web
        </h1>
        <p className="text-lg text-gray-600">
          Analysez votre site web avec l'IA et découvrez des opportunités d'amélioration
        </p>
      </div>

      {/* Gestionnaire d'erreurs */}
      <ErrorHandler
        error={analysisError}
        onDismiss={() => setAnalysisError(null)}
        onUpgrade={() => window.location.href = '/pricing'}
      />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Formulaire d'analyse */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Nouvelle analyse
              </CardTitle>
              <CardDescription>
                Entrez l'URL du site web à analyser
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL du site web</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Button
                  onClick={handleAnalysis}
                  disabled={!url || isProcessing || !canUseFeature('analysis')}
                  className="flex items-center gap-2"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BarChart3 className="h-4 w-4" />
                  )}
                  {analysisStatus.icon}
                  Analyser
                </Button>

                <Button
                  onClick={handleCompetitorAnalysis}
                  disabled={!url || isProcessing || !canUseFeature('competitor_analysis')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Target className="h-4 w-4" />
                  )}
                  {competitorStatus.icon}
                  Concurrents
                </Button>

                <Button
                  onClick={handleOptimization}
                  disabled={!url || isProcessing || !canUseFeature('optimize')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {optimizeStatus.icon}
                  Optimiser
                </Button>
              </div>

              {/* Statuts des fonctionnalités */}
              <div className="grid gap-2 md:grid-cols-3 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  {analysisStatus.icon}
                  <span>Analyses: {getUsagePercentage('analysis').toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {competitorStatus.icon}
                  <span>Concurrents: {getUsagePercentage('competitor_analysis').toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {optimizeStatus.icon}
                  <span>Optimisations: {getUsagePercentage('optimize').toFixed(0)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Résultats */}
          {results && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Résultats de l'analyse</CardTitle>
                <CardDescription>
                  Analyse terminée pour {url}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quotas d'usage */}
        <div>
          <UsageQuota 
            showUpgradePrompt={true}
            compact={true}
          />
        </div>
      </div>
    </div>
  );
};

export default AnalysisExample;
