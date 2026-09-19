import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePayment } from '@/hooks/usePayment';
import { 
  AlertTriangle, 
  BarChart3, 
  FileText, 
  Crown, 
  Zap, 
  TrendingUp,
  Users,
  Target,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface UsageQuotaProps {
  className?: string;
  showUpgradePrompt?: boolean;
  compact?: boolean;
}

const UsageQuota: React.FC<UsageQuotaProps> = ({ 
  className = '', 
  showUpgradePrompt = true,
  compact = false 
}) => {
  const { 
    usageLimits, 
    currentPlan, 
    isOnFreePlan,
    getUsagePercentage,
    loadPaymentData 
  } = usePayment();

  // Charger les données au montage
  useEffect(() => {
    // Charger seulement si les données ne sont pas déjà disponibles
    if (!usageLimits || !currentPlan) {
      loadPaymentData();
    }
  }, []); // Dépendances vides pour éviter les re-renders

  const features = [
    { 
      type: 'analysis' as const, 
      name: 'Analyses', 
      icon: <BarChart3 className="h-4 w-4" />,
      description: 'Analyses GEO de sites web'
    },
    { 
      type: 'report' as const, 
      name: 'Rapports', 
      icon: <FileText className="h-4 w-4" />,
      description: 'Rapports détaillés'
    },
    { 
      type: 'competitor_analysis' as const, 
      name: 'Analyse de concurrents', 
      icon: <Target className="h-4 w-4" />,
      description: 'Analyse de la concurrence'
    },
    { 
      type: 'optimize' as const, 
      name: 'Optimisation', 
      icon: <Zap className="h-4 w-4" />,
      description: 'Optimisation de sites'
    },
  ];

  if (!usageLimits || !currentPlan) {
    return (
      <Card className={`${className}`}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des quotas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isAnalysisLimitReached = !usageLimits.can_use_analysis.allowed;
  const isReportLimitReached = !usageLimits.can_use_report.allowed;
  const isCompetitorLimitReached = !usageLimits.can_use_competitor_analysis.allowed;
  const isOptimizeLimitReached = !usageLimits.can_use_optimize.allowed;

  const anyLimitReached = isAnalysisLimitReached || isReportLimitReached || 
                         isCompetitorLimitReached || isOptimizeLimitReached;

  const isNearLimit = features.some(feature => {
    const percentage = getUsagePercentage(feature.type);
    return percentage > 80;
  });

  const getStatusIcon = (featureType: 'analysis' | 'report' | 'competitor_analysis' | 'optimize') => {
    const canUse = usageLimits[`can_use_${featureType}` as keyof typeof usageLimits]?.allowed;
    return canUse ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 95) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressBgColor = (percentage: number) => {
    if (percentage >= 95) return 'bg-red-100';
    if (percentage >= 80) return 'bg-yellow-100';
    return 'bg-gray-100';
  };

  return (
    <Card className={`usage-quota ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="h-5 w-5 text-primary" />
              {compact ? 'Quotas' : `Utilisation - Plan ${currentPlan.name}`}
            </CardTitle>
            {!compact && (
              <CardDescription>
                Période du {new Date().toLocaleDateString('fr-FR')} au {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}
              </CardDescription>
            )}
          </div>
          <Badge 
            variant={currentPlan.id === 'free' ? 'secondary' : 'default'}
          >
            {currentPlan.name}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Grille des quotas */}
        <div className={`grid gap-4 ${compact ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
          {features.map((feature) => {
            const limits = usageLimits[`can_use_${feature.type}` as keyof typeof usageLimits];
            const percentage = getUsagePercentage(feature.type);
            const isLimited = !limits?.allowed;
            
            return (
              <div 
                key={feature.type}
                className={`p-4 rounded-lg border transition-all ${
                  isLimited ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-card'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{feature.icon}</span>
                    <span className="font-medium text-sm text-foreground">{feature.name}</span>
                  </div>
                  {getStatusIcon(feature.type)}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Utilisé</span>
                    <span className="font-medium text-foreground">{limits?.used || 0} / {limits?.limit === -1 ? '∞' : limits?.limit || 0}</span>
                  </div>
                  
                  {limits?.limit !== -1 && (
                    <Progress value={Math.min(percentage, 100)} className="h-2" />
                  )}

                  {isLimited && (
                    <p className="text-xs text-destructive mt-1">
                      {limits?.reason || 'Limite atteinte'}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions si limite atteinte ou proche */}
        {(anyLimitReached || isNearLimit) && currentPlan.id !== 'pro' && showUpgradePrompt && (
          <div className="pt-4 border-t border-border">
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Crown className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">
                    {anyLimitReached ? 'Limite atteinte !' : 'Bientôt à la limite'}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {anyLimitReached
                      ? 'Passez à un plan supérieur pour continuer à utiliser toutes les fonctionnalités.'
                      : 'Pensez à passer à un plan supérieur pour éviter les interruptions.'
                    }
                  </p>
                  <Link to="/pricing">
                    <Button size="sm">
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
        {isOnFreePlan && showUpgradePrompt && (
          <div className="pt-4 border-t border-border">
            <div className="bg-muted/40 border border-border p-4 rounded-lg text-center">
              <Crown className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-semibold text-foreground mb-1">
                Débloquez tout le potentiel
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Analyses illimitées, rapports avancés, support prioritaire et plus encore.
              </p>
              <Link to="/pricing">
                <Button size="sm">
                  <Crown className="h-4 w-4 mr-2" />
                  Découvrir Premium
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Avertissement d'usage élevé */}
        {isNearLimit && !anyLimitReached && (
          <div className="pt-4 border-t border-border">
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">
                    Usage élevé détecté
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Vous approchez de vos limites d'usage. Pensez à passer à un plan supérieur pour éviter les interruptions.
                  </p>
                  <Link to="/pricing">
                    <Button size="sm" variant="outline">
                      Voir les plans
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UsageQuota;
