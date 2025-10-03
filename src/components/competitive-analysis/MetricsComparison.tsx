import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Shield, 
  FileText, 
  Target, 
  Monitor, 
  TrendingUp,
  Info,
  Eye,
  EyeOff
} from "lucide-react";
import { MetricComparisonData, getScoreColor, getAdvantageColor } from "@/lib/competitive-mapper";

interface MetricsComparisonProps {
  data: MetricComparisonData[];
}

const MetricsComparison: React.FC<MetricsComparisonProps> = ({ data }) => {
  const [selectedMetric, setSelectedMetric] = useState<string>(data[0]?.metric || '');
  const [showInsights, setShowInsights] = useState<boolean>(false);

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'Crédibilité & Autorité':
        return <Shield className="h-5 w-5" />;
      case 'Structure & Lisibilité':
        return <FileText className="h-5 w-5" />;
      case 'Pertinence Contextuelle':
        return <Target className="h-5 w-5" />;
      case 'Compatibilité Technique':
        return <Monitor className="h-5 w-5" />;
      default:
        return <BarChart3 className="h-5 w-5" />;
    }
  };

  const getMaxScore = (metricData: MetricComparisonData): number => {
    return Math.max(metricData.alan, metricData.wakam, metricData.malakoff);
  };

  const getBarWidth = (score: number, maxScore: number): string => {
    return `${(score / 20) * 100}%`;
  };

  const getBarColor = (score: number, isAlan: boolean = false): string => {
    if (isAlan) return "bg-blue-500";
    if (score >= 15) return "bg-green-400";
    if (score >= 12) return "bg-yellow-400";
    return "bg-red-400";
  };

  const selectedMetricData = data.find(d => d.metric === selectedMetric);

  return (
    <div className="space-y-6">
      {/* Sélecteur de métriques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Comparaison des Métriques LLMO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedMetric} onValueChange={setSelectedMetric}>
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              {data.map((metric) => (
                <TabsTrigger 
                  key={metric.metric} 
                  value={metric.metric}
                  className="flex items-center gap-2 text-xs"
                >
                  {getMetricIcon(metric.metric)}
                  <span className="hidden sm:inline">{metric.metric}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {data.map((metric) => (
              <TabsContent key={metric.metric} value={metric.metric} className="space-y-4">
                {/* Graphique de comparaison */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="space-y-4">
                    {/* Alan */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-700">Alan</span>
                        <span className={`text-sm font-bold ${getScoreColor(metric.alan)}`}>
                          {metric.alan}/20
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: getBarWidth(metric.alan, 20) }}
                        />
                      </div>
                    </div>

                    {/* Wakam */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Wakam</span>
                        <span className={`text-sm font-bold ${getScoreColor(metric.wakam)}`}>
                          {metric.wakam}/20
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`${getBarColor(metric.wakam)} h-3 rounded-full transition-all duration-300`}
                          style={{ width: getBarWidth(metric.wakam, 20) }}
                        />
                      </div>
                    </div>

                    {/* Malakoff */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Malakoff Humanis</span>
                        <span className={`text-sm font-bold ${getScoreColor(metric.malakoff)}`}>
                          {metric.malakoff}/20
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`${getBarColor(metric.malakoff)} h-3 rounded-full transition-all duration-300`}
                          style={{ width: getBarWidth(metric.malakoff, 20) }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Avantages Alan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        Avantage vs Wakam
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-lg font-bold ${getAdvantageColor(metric.alanAdvantage.vs_wakam)}`}>
                        {metric.alanAdvantage.vs_wakam}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        Avantage vs Malakoff
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-lg font-bold ${getAdvantageColor(metric.alanAdvantage.vs_malakoff)}`}>
                        {metric.alanAdvantage.vs_malakoff}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Insights détaillés */}
      {selectedMetricData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                Analyse Détaillée - {selectedMetricData.metric}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInsights(!showInsights)}
              >
                {showInsights ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Masquer
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Afficher
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {showInsights && (
            <CardContent className="space-y-6">
              {/* Insights vs Wakam */}
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-green-700 mb-2">
                  Comparaison avec Wakam ({selectedMetricData.alanAdvantage.vs_wakam})
                </h4>
                <div className="space-y-3">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h5 className="font-medium text-green-900 mb-1">Description</h5>
                    <p className="text-sm text-green-800">
                      {selectedMetricData.insights.vs_wakam.description}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h5 className="font-medium text-green-900 mb-1">Justification</h5>
                    <p className="text-sm text-green-800">
                      {selectedMetricData.insights.vs_wakam.justification}
                    </p>
                  </div>
                </div>
              </div>

              {/* Insights vs Malakoff */}
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-blue-700 mb-2">
                  Comparaison avec Malakoff Humanis ({selectedMetricData.alanAdvantage.vs_malakoff})
                </h4>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-1">Description</h5>
                    <p className="text-sm text-blue-800">
                      {selectedMetricData.insights.vs_malakoff.description}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-1">Justification</h5>
                    <p className="text-sm text-blue-800">
                      {selectedMetricData.insights.vs_malakoff.justification}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};

export default MetricsComparison; 