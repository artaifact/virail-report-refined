import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminService } from '@/services/adminService';
import { AdminSubscription, AdminSubscriptionsStats } from '@/types/admin';
import {
  CreditCard,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Mail,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SubscriptionManagementProps {
  onSubscriptionSelect?: (subscriptionId: number) => void;
  className?: string;
}

export function SubscriptionManagement({ onSubscriptionSelect, className = '' }: SubscriptionManagementProps) {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [stats, setStats] = useState<AdminSubscriptionsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  // Charger les abonnements
  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const filters: any = {
        page: currentPage,
        per_page: 10,
      };

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      if (planFilter !== 'all') {
        filters.plan_id = planFilter;
      }

      const response = await AdminService.getSubscriptions(filters);
      setSubscriptions(response.subscriptions);
      setTotalPages(response.total_pages);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques
  const loadStats = async () => {
    try {
      const statsData = await AdminService.getSubscriptionsStats();
      setStats(statsData);
    } catch (error) {
    }
  };

  useEffect(() => {
    loadSubscriptions();
    loadStats();
  }, [currentPage, statusFilter, planFilter]);

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatPrice = (price?: number) => {
    if (!price) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
  };

  return (
    <div className={className}>
      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-none shadow-sm bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total</p>
                  <div className="text-3xl font-bold">{stats.total_subscriptions}</div>
                  <p className="text-xs text-muted-foreground mt-1">Abonnements</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-slate-200/50 dark:bg-slate-700/50 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950 dark:to-emerald-900/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">Actifs</p>
                  <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{stats.active_subscriptions}</div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">En cours</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-200/50 dark:bg-emerald-800/50 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950 dark:to-orange-900/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Expirés</p>
                  <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{stats.expired_subscriptions}</div>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">À renouveler</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-200/50 dark:bg-orange-800/50 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Revenu</p>
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{formatPrice(stats.total_revenue)}</div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Total</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-200/50 dark:bg-blue-800/50 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Barre de recherche et filtres */}
      <Card className="mb-6 border-none shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par utilisateur, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 border-muted-foreground/20 focus-visible:ring-1"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[170px] h-10 border-muted-foreground/20">
                <div className="flex items-center gap-2 text-sm">
                  <Filter className="w-4 h-4" />
                  <SelectValue placeholder="Statut" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="expired">Expiré</SelectItem>
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full md:w-[170px] h-10 border-muted-foreground/20">
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4" />
                  <SelectValue placeholder="Plan" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les plans</SelectItem>
                <SelectItem value="free">Gratuit</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des abonnements */}
      <Card>
        <CardHeader>
          <CardTitle>Abonnements ({subscriptions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun abonnement trouvé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="group relative border border-muted-foreground/10 rounded-xl p-5 hover:shadow-md hover:border-primary/20 cursor-pointer transition-all duration-200 bg-card"
                  onClick={() => onSubscriptionSelect?.(subscription.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-foreground text-base">
                          {subscription.user?.username || `User #${subscription.user_id}`}
                        </h4>
                        {getStatusBadge(subscription.status)}
                        {getPlanBadge(subscription.plan_id)}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        {subscription.user?.email || '-'}
                      </p>
                    </div>
                    <div className="text-right bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg px-3 py-2">
                      <div className="text-lg font-bold text-foreground">
                        {formatPrice(subscription.plan?.price)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {subscription.plan?.interval === 'month' ? '/mois' : '/an'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Début</span>
                      <div className="font-medium text-foreground">{formatDate(subscription.start_date)}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Fin</span>
                      <div className="font-medium text-foreground">{formatDate(subscription.end_date)}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Renouvellement</span>
                      <div className="font-medium">
                        {subscription.auto_renew ? (
                          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Auto
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">
                            <XCircle className="w-3 h-3 mr-1" />
                            Manuel
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Plan</span>
                      <div className="font-medium text-foreground">{subscription.plan?.name || subscription.plan_id}</div>
                    </div>
                  </div>

                  {/* Hover indicator */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-5 h-5 text-primary" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8 px-3 hover:bg-primary/10 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-8 w-8 p-0 ${currentPage === pageNum ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/10'}`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-3 hover:bg-primary/10 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

