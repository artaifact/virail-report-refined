import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminService } from '@/services/adminService';
import { AdminSubscription } from '@/types/admin';
import {
  ArrowLeft,
  User,
  Calendar,
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  RefreshCw,
  Zap,
  Plus,
  Ban,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SubscriptionDetailsProps {
  subscriptionId: number;
  onBack: () => void;
  className?: string;
}

export function SubscriptionDetails({ subscriptionId, onBack, className = '' }: SubscriptionDetailsProps) {
  const [subscription, setSubscription] = useState<AdminSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [extendDays, setExtendDays] = useState('30');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSubscription();
  }, [subscriptionId]);

  const loadSubscription = async () => {
    setLoading(true);
    try {
      const data = await AdminService.getSubscriptionById(subscriptionId);
      setSubscription(data);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'abonnement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForceActivate = async () => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const result = await AdminService.forceActivateSubscription(subscriptionId);
      if (result.success) {
        setActionMessage({ type: 'success', text: result.message });
        loadSubscription();
      } else {
        setActionMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setActionMessage({ type: 'error', text: 'Erreur lors de l\'activation' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceCancel = async () => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const result = await AdminService.forceCancelSubscription(subscriptionId);
      if (result.success) {
        setActionMessage({ type: 'success', text: result.message });
        loadSubscription();
      } else {
        setActionMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setActionMessage({ type: 'error', text: 'Erreur lors de l\'annulation' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtend = async () => {
    const days = parseInt(extendDays);
    if (isNaN(days) || days <= 0) {
      setActionMessage({ type: 'error', text: 'Veuillez entrer un nombre de jours valide' });
      return;
    }

    setActionLoading(true);
    setActionMessage(null);
    try {
      const result = await AdminService.extendSubscription(subscriptionId, days);
      if (result.success) {
        setActionMessage({ type: 'success', text: result.message });
        loadSubscription();
      } else {
        setActionMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setActionMessage({ type: 'error', text: 'Erreur lors de l\'extension' });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    const statusConfig = {
      active: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Actif', icon: CheckCircle },
      inactive: { color: 'bg-slate-50 text-slate-600 border-slate-200', label: 'Inactif', icon: XCircle },
      cancelled: { color: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Annulé', icon: XCircle },
      pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'En attente', icon: Clock },
      expired: { color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Expiré', icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={`${config.color} text-xs font-medium`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPlanBadge = (planId?: string) => {
    const planConfig: Record<string, { color: string; label: string }> = {
      standard: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Standard' },
      premium: { color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Premium' },
      pro: { color: 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-900 border-amber-200', label: 'Pro' },
      free: { color: 'bg-slate-50 text-slate-600 border-slate-200', label: 'Gratuit' },
    };

    const config = planConfig[planId || ''] || { color: 'bg-slate-50 text-slate-600 border-slate-200', label: planId || 'Inconnu' };
    return <Badge variant="outline" className={`${config.color} text-xs font-medium`}>{config.label}</Badge>;
  };

  const formatPrice = (price?: number) => {
    if (!price) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
  };

  if (loading) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Abonnement non trouvé</p>
            <Button onClick={onBack} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Bouton retour */}
      <Button 
        variant="ghost" 
        onClick={onBack} 
        className="mb-6 hover:bg-primary/10 text-sm h-9 px-3"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour à la liste
      </Button>

      {/* Détails de l'abonnement */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="mb-2">
                Abonnement #{subscription.id}
              </CardTitle>
              <div className="flex gap-2">
                {getStatusBadge(subscription.status)}
                {getPlanBadge(subscription.plan_id)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations utilisateur */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Informations utilisateur
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">ID Utilisateur</label>
                <p className="text-foreground">{subscription.user_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nom d'utilisateur</label>
                <p className="text-foreground">{subscription.user?.username || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-foreground">{subscription.user?.email || '-'}</p>
              </div>
            </div>
          </div>

          {/* Informations du plan */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Informations du plan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Plan</label>
                <p className="text-foreground font-semibold">{subscription.plan?.name || subscription.plan_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Prix</label>
                <p className="text-foreground font-semibold text-lg">
                  {formatPrice(subscription.plan?.price)}
                  <span className="text-sm text-muted-foreground ml-1">
                    {subscription.plan?.interval === 'month' ? '/mois' : '/an'}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Renouvellement automatique</label>
                <p className="text-foreground">
                  {subscription.auto_renew ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Activé
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700">
                      <XCircle className="w-3 h-3 mr-1" />
                      Désactivé
                    </Badge>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Informations des dates */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Dates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date de début</label>
                <p className="text-foreground">
                  {subscription.start_date ? new Date(subscription.start_date).toLocaleString('fr-FR') : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date de fin</label>
                <p className="text-foreground">
                  {subscription.end_date ? new Date(subscription.end_date).toLocaleString('fr-FR') : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Créé le</label>
                <p className="text-foreground">
                  {subscription.created_at ? new Date(subscription.created_at).toLocaleString('fr-FR') : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Statut détaillé */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Statut et informations
            </h3>
            <div className="p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Statut actuel</label>
                  <div className="mt-1">{getStatusBadge(subscription.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dernière mise à jour</label>
                  <p className="text-foreground">
                    {subscription.updated_at ? new Date(subscription.updated_at).toLocaleString('fr-FR') : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions administrateur */}
      <Card className="border-none shadow-sm">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            Actions administrateur
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Message de feedback */}
          {actionMessage && (
            <div
              className={`p-4 rounded-xl flex items-center gap-3 ${
                actionMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {actionMessage.type === 'success' ? (
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{actionMessage.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Activer de force */}
            <div className="p-4 border border-emerald-100 rounded-xl bg-emerald-50/50 space-y-3">
              <div>
                <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-600" />
                  Activer de force
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Active immédiatement l'abonnement
                </p>
              </div>
              <Button
                onClick={handleForceActivate}
                disabled={actionLoading || subscription.status === 'active'}
                className="w-full h-9 text-sm bg-emerald-600 hover:bg-emerald-700"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Activer
                  </>
                )}
              </Button>
            </div>

            {/* Annuler de force */}
            <div className="p-4 border border-rose-100 rounded-xl bg-rose-50/50 space-y-3">
              <div>
                <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Ban className="h-4 w-4 text-rose-600" />
                  Annuler de force
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Annule immédiatement l'abonnement
                </p>
              </div>
              <Button
                onClick={handleForceCancel}
                disabled={actionLoading || subscription.status === 'cancelled'}
                variant="destructive"
                className="w-full h-9 text-sm"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    Annuler
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Étendre la durée */}
          <div className="p-4 border border-blue-100 rounded-xl bg-blue-50/50 space-y-3">
            <div>
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-600" />
                Étendre la durée
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Ajouter des jours supplémentaires à l'abonnement
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
                placeholder="Jours"
                min="1"
                disabled={actionLoading}
                className="h-9 text-sm flex-1 bg-white"
              />
              <Button
                onClick={handleExtend}
                disabled={actionLoading}
                className="whitespace-nowrap h-9 text-sm bg-blue-600 hover:bg-blue-700"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Étendre
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations complémentaires */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Informations complémentaires</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• L'abonnement peut être géré depuis le tableau de bord utilisateur</p>
          <p>• Le renouvellement automatique peut être activé/désactivé par l'utilisateur</p>
          <p>• Les paiements sont traités via Stripe</p>
          <p>• En cas de problème, contactez le support technique</p>
          <p>• ⚠️ Les actions administrateur sont irréversibles</p>
        </CardContent>
      </Card>
    </div>
  );
}

