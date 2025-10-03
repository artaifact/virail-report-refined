import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePayment } from '@/contexts/PaymentContext';
import { AlertTriangle, BarChart3, FileText, Crown, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UsageLimitsProps {
  className?: string;
}

const UsageLimits: React.FC<UsageLimitsProps> = ({ className = '' }) => {
  const { userPlan } = usePayment();

  if (!userPlan) {
    return null;
  }

  const { currentPlan, usage } = userPlan;
  
  const analysisPercent = currentPlan.maxAnalyses === -1 
    ? 0 
    : (usage.analysesUsed / currentPlan.maxAnalyses) * 100;
  
  const reportPercent = currentPlan.maxReports === -1 
    ? 0 
    : (usage.reportsUsed / currentPlan.maxReports) * 100;

  const isAnalysisLimitReached = currentPlan.maxAnalyses !== -1 && usage.analysesUsed >= currentPlan.maxAnalyses;
  const isReportLimitReached = currentPlan.maxReports !== -1 && usage.reportsUsed >= currentPlan.maxReports;
  const isNearLimit = analysisPercent > 80 || reportPercent > 80;

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Utilisation - Plan {currentPlan.name}
            </CardTitle>
            <CardDescription>
              Période du {new Date(usage.periodStart).toLocaleDateString()} au {new Date(usage.periodEnd).toLocaleDateString()}
            </CardDescription>
          </div>
          <Badge 
            variant={currentPlan.id === 'free' ? 'secondary' : 'default'}
            className={currentPlan.id === 'pro' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : ''}
          >
            {currentPlan.name}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Analyses LLMO */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Analyses GEO</span>
            </div>
            <span className="text-sm text-gray-600">
              {currentPlan.maxAnalyses === -1 
                ? `${usage.analysesUsed} (Illimité)`
                : `${usage.analysesUsed}/${currentPlan.maxAnalyses}`
              }
            </span>
          </div>
          
          {currentPlan.maxAnalyses !== -1 && (
            <div>
              <Progress 
                value={analysisPercent} 
                className={`h-2 ${analysisPercent > 90 ? 'bg-red-100' : analysisPercent > 80 ? 'bg-yellow-100' : 'bg-green-100'}`}
              />
              {isAnalysisLimitReached && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Limite atteinte pour ce mois</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rapports Concurrentiels */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Rapports Concurrentiels</span>
            </div>
            <span className="text-sm text-gray-600">
              {currentPlan.maxReports === -1 
                ? `${usage.reportsUsed} (Illimité)`
                : `${usage.reportsUsed}/${currentPlan.maxReports}`
              }
            </span>
          </div>
          
          {currentPlan.maxReports !== -1 && (
            <div>
              <Progress 
                value={reportPercent} 
                className={`h-2 ${reportPercent > 90 ? 'bg-red-100' : reportPercent > 80 ? 'bg-yellow-100' : 'bg-green-100'}`}
              />
              {isReportLimitReached && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Limite atteinte pour ce mois</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions si limite atteinte ou proche */}
        {(isAnalysisLimitReached || isReportLimitReached || isNearLimit) && currentPlan.id !== 'pro' && (
          <div className="pt-4 border-t">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Crown className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-900 mb-1">
                    {isAnalysisLimitReached || isReportLimitReached 
                      ? 'Limite atteinte !' 
                      : 'Bientôt à la limite'
                    }
                  </h4>
                  <p className="text-sm text-purple-700 mb-3">
                    {isAnalysisLimitReached || isReportLimitReached
                      ? 'Passez à un plan supérieur pour continuer à utiliser toutes les fonctionnalités.'
                      : 'Pensez à passer à un plan supérieur pour éviter les interruptions.'
                    }
                  </p>
                  <Link to="/pricing">
                    <Button size="sm" className="bg-gradient-to-r from-purple-600 to-indigo-600">
                      <Crown className="h-4 w-4 mr-2" />
                      Voir les plans
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plan gratuit - incitation à l'upgrade */}
        {currentPlan.id === 'free' && (
          <div className="pt-4 border-t">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
              <div className="text-center">
                <Crown className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-900 mb-1">
                  Débloquez tout le potentiel
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Analyses illimitées, rapports avancés, support prioritaire et plus encore.
                </p>
                <Link to="/pricing">
                  <Button size="sm" className="bg-gradient-to-r from-purple-600 to-indigo-600">
                    <Crown className="h-4 w-4 mr-2" />
                    Découvrir Premium
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UsageLimits;
