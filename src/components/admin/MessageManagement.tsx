import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminService } from '@/services/adminService';
import { AdminMessage, AdminMessagesStats } from '@/types/admin';
import {
  Mail,
  MailOpen,
  AlertCircle,
  CheckCircle,
  Archive,
  Search,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MessageManagementProps {
  onMessageSelect?: (messageId: number) => void;
  className?: string;
}

export function MessageManagement({ onMessageSelect, className = '' }: MessageManagementProps) {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [stats, setStats] = useState<AdminMessagesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Charger les messages
  const loadMessages = async () => {
    setLoading(true);
    try {
      const filters: any = {
        page: currentPage,
        per_page: 10,
      };

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      if (priorityFilter !== 'all') {
        filters.priority = priorityFilter;
      }

      const response = await AdminService.getMessages(filters);
      setMessages(response.messages);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques
  const loadStats = async () => {
    try {
      const statsData = await AdminService.getMessagesStats();
      setStats(statsData);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  // Rechercher des messages
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadMessages();
      return;
    }

    setLoading(true);
    try {
      const response = await AdminService.searchMessages({
        query: searchQuery,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        page: currentPage,
        per_page: 10,
      });
      setMessages(response.messages);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    loadStats();
  }, [currentPage, statusFilter, priorityFilter]);

  const getStatusBadge = (status?: string) => {
    const statusConfig = {
      new: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Nouveau' },
      unread: { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Non lu' },
      read: { color: 'bg-slate-50 text-slate-600 border-slate-200', label: 'Lu' },
      replied: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Répondu' },
      archived: { color: 'bg-slate-50 text-slate-500 border-slate-200', label: 'Archivé' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    return <Badge variant="outline" className={`${config.color} text-xs font-medium`}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority?: string) => {
    const priorityConfig = {
      low: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Basse' },
      medium: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Moyenne' },
      high: { color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Haute' },
      urgent: { color: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Urgente' },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge variant="outline" className={`${config.color} text-xs font-medium`}>{config.label}</Badge>;
  };

  return (
    <div className={className}>
      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Total</p>
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.total_messages}</div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Messages</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-200/50 dark:bg-blue-800/50 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950 dark:to-amber-900/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">Non lus</p>
                  <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">{stats.unread_messages}</div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">À traiter</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-200/50 dark:bg-amber-800/50 flex items-center justify-center">
                  <MailOpen className="w-6 h-6 text-amber-600 dark:text-amber-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950 dark:to-emerald-900/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">Répondus</p>
                  <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{stats.replied_messages}</div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Traités</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-200/50 dark:bg-emerald-800/50 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950 dark:to-rose-900/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-rose-700 dark:text-rose-300 mb-1">Priorité haute</p>
                  <div className="text-3xl font-bold text-rose-900 dark:text-rose-100">{stats.high_priority_messages || 0}</div>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">Urgents</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-rose-200/50 dark:bg-rose-800/50 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-300" />
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
                  placeholder="Rechercher par email, nom, sujet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
                <SelectItem value="new">Nouveau</SelectItem>
                <SelectItem value="unread">Non lu</SelectItem>
                <SelectItem value="read">Lu</SelectItem>
                <SelectItem value="replied">Répondu</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                <SelectItem value="low">Basse</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Rechercher
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des messages */}
      <Card>
        <CardHeader>
          <CardTitle>Messages ({messages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun message trouvé</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onMessageSelect?.(message.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">
                          {message.first_name} {message.last_name}
                        </h4>
                        {getStatusBadge(message.status)}
                        {getPriorityBadge(message.priority)}
                      </div>
                      <p className="text-sm text-muted-foreground">{message.email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {message.created_at ? new Date(message.created_at).toLocaleDateString('fr-FR') : '-'}
                    </span>
                  </div>
                  <h5 className="font-medium text-foreground mb-1">{message.subject}</h5>
                  <p className="text-sm text-muted-foreground line-clamp-2">{message.message}</p>
                  {message.tags && message.tags.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {message.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

