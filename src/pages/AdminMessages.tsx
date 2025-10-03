import React, { useEffect, useMemo, useState } from 'react';
import { AdminService } from '@/services/adminService';
import { AdminMessage } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Mail, Search, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const AdminMessages: React.FC = () => {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [priority, setPriority] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / perPage)), [total, perPage]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      if (query.trim()) {
        const res = await AdminService.searchMessages({ query, status, priority, page, per_page: perPage });
        setMessages(res.messages);
        setTotal(res.total);
      } else {
        const res = await AdminService.getMessages({ page, per_page: perPage, status, priority });
        setMessages(res.messages);
        setTotal(res.total);
      }
    } catch (e: any) {
      setError(e?.message || 'Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, status, priority]);

  const resetFilters = () => {
    setStatus(undefined);
    setPriority(undefined);
    setQuery('');
    setPage(1);
  };

  const openMessage = (msg: AdminMessage) => {
    setSelectedMessage(msg);
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Messages (Admin)</h1>
          <p className="text-muted-foreground">Gestion des messages: recherche, filtres, pagination</p>
        </div>

        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Filtres</CardTitle>
            <CardDescription className="text-muted-foreground">Affinez la liste selon le statut, la priorité ou une recherche textuelle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Recherche (email, sujet, contenu)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9 border-border bg-card text-foreground"
                  />
                </div>
              </div>
              <Select value={status ?? undefined as any} onValueChange={(v) => { setStatus(v === 'all' ? undefined : v); setPage(1); }}>
                <SelectTrigger className="border-border bg-card">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="unread">Non lus</SelectItem>
                  <SelectItem value="read">Lus</SelectItem>
                  <SelectItem value="replied">Répondus</SelectItem>
                  <SelectItem value="archived">Archivés</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priority ?? undefined as any} onValueChange={(v) => { setPriority(v === 'all' ? undefined : v); setPage(1); }}>
                <SelectTrigger className="border-border bg-card">
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => { setPage(1); loadMessages(); }} disabled={loading} className="bg-primary text-primary-foreground">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Appliquer
              </Button>
              <Button variant="outline" onClick={resetFilters} className="border-border">Réinitialiser</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Liste des messages</CardTitle>
            <CardDescription className="text-muted-foreground">{total} résultats • Page {page}/{totalPages}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {error && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            {messages.length === 0 && !loading ? (
              <div className="text-muted-foreground text-sm">Aucun message trouvé.</div>
            ) : (
              <div className="divide-y divide-border">
                {messages.map((m) => (
                  <div key={m.id} className="py-3 flex items-start justify-between gap-4 cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => openMessage(m)}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                        <Mail className="h-4 w-4 text-foreground" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{m.subject || '(Sans sujet)'}</div>
                        <div className="text-sm text-muted-foreground">{m.first_name} {m.last_name} • {m.email}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2 mt-1">{m.message}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2">
                        {m.status ? <Badge variant="outline" className="border-border">{m.status}</Badge> : null}
                        {m.priority ? <Badge variant="outline" className="border-border">{m.priority}</Badge> : null}
                      </div>
                      <div className="text-xs text-muted-foreground">ID: {m.id}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Par page</span>
                <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
                  <SelectTrigger className="h-8 w-[90px] border-border bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="border-border" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Précédent</Button>
                <Button variant="outline" className="border-border" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Suivant</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {selectedMessage && (
          <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
            <DialogContent className="bg-card border-border max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">{selectedMessage.subject || '(Sans sujet)'}</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {selectedMessage.first_name} {selectedMessage.last_name} • {selectedMessage.email}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={selectedMessage.status === 'unread' ? 'default' : 'secondary'} className="text-xs">
                    {selectedMessage.status === 'unread' ? 'Non lu' : selectedMessage.status === 'read' ? 'Lu' : selectedMessage.status === 'replied' ? 'Répondu' : 'Archivé'}
                  </Badge>
                  {selectedMessage.priority && (
                    <Badge variant={selectedMessage.priority === 'urgent' || selectedMessage.priority === 'high' ? 'destructive' : 'outline'} className="text-xs">
                      {selectedMessage.priority === 'urgent' ? 'Urgente' : selectedMessage.priority === 'high' ? 'Haute' : selectedMessage.priority === 'medium' ? 'Moyenne' : 'Basse'}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs border-border">ID: {selectedMessage.id}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(selectedMessage.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-foreground whitespace-pre-wrap">{selectedMessage.message}</div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedMessage(null)} className="border-border">Fermer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default AdminMessages;


