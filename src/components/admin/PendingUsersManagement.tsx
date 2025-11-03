import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Users, CheckCircle, XCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { AdminService } from '@/services/adminService';
import { AdminUser, AdminUsersResponse } from '@/types/admin';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PendingUsersManagementProps {
  className?: string;
}

export const PendingUsersManagement: React.FC<PendingUsersManagementProps> = ({ className = '' }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState<number | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadUsers();
  }, [currentPage, perPage]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des utilisateurs en attente...', { currentPage, perPage });
      const response: AdminUsersResponse = await AdminService.getPendingUsers(currentPage, perPage);
      console.log('✅ Réponse reçue dans le composant:', response);
      setUsers(response.users);
      setTotal(response.total);
      setTotalPages(response.total_pages);
      console.log(`✅ ${response.users.length} utilisateur(s) en attente chargé(s) sur ${response.total} total`);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des utilisateurs en attente:', error);
      toast({
        title: "Erreur de chargement",
        description: error instanceof Error ? error.message : "Impossible de charger les utilisateurs en attente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: number) => {
    try {
      setActionLoading(userId);
      await AdminService.approveUser(userId, true, notes.trim() || undefined);
      toast({
        title: "Utilisateur approuvé",
        description: "L'utilisateur a été approuvé avec succès",
      });
      setApproveDialogOpen(null);
      setNotes('');
      await loadUsers(); // Recharger la liste
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'approuver l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: number) => {
    try {
      setActionLoading(userId);
      await AdminService.approveUser(userId, false, notes.trim() || undefined);
      toast({
        title: "Utilisateur rejeté",
        description: "L'utilisateur a été rejeté",
      });
      setRejectDialogOpen(null);
      setNotes('');
      await loadUsers(); // Recharger la liste
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de rejeter l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Utilisateurs en attente d'approbation
            </CardTitle>
            <Badge variant="outline" className="text-sm">
              {total} en attente
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Recherche */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Chargement...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "Aucun utilisateur trouvé" : "Aucun utilisateur en attente d'approbation"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          <Clock className="h-3 w-3 mr-1" />
                          En attente
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Bouton Approuver */}
                          <Dialog open={approveDialogOpen === user.id}                             onOpenChange={(open) => {
                            setApproveDialogOpen(open ? user.id : null);
                            if (!open) setNotes('');
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="default"
                                className="flex items-center gap-2"
                                disabled={actionLoading !== null}
                              >
                                <CheckCircle className="h-4 w-4" />
                                Approuver
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Approuver l'utilisateur</DialogTitle>
                                <DialogDescription>
                                  Êtes-vous sûr de vouloir approuver {user.username} ({user.email}) ?
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <Label htmlFor="approve-notes">Notes (optionnel)</Label>
                                  <Textarea
                                    id="approve-notes"
                                    placeholder="Ajouter une note..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="mt-2"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setApproveDialogOpen(null);
                                    setNotes('');
                                  }}
                                >
                                  Annuler
                                </Button>
                                <Button
                                  onClick={() => handleApprove(user.id)}
                                  disabled={actionLoading === user.id}
                                >
                                  {actionLoading === user.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Traitement...
                                    </>
                                  ) : (
                                    'Approuver'
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {/* Bouton Rejeter */}
                          <Dialog open={rejectDialogOpen === user.id}                             onOpenChange={(open) => {
                            setRejectDialogOpen(open ? user.id : null);
                            if (!open) setNotes('');
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="flex items-center gap-2"
                                disabled={actionLoading !== null}
                              >
                                <XCircle className="h-4 w-4" />
                                Rejeter
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Rejeter l'utilisateur</DialogTitle>
                                <DialogDescription>
                                  Êtes-vous sûr de vouloir rejeter {user.username} ({user.email}) ?
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <Label htmlFor="reject-notes">Notes (recommandé)</Label>
                                  <Textarea
                                    id="reject-notes"
                                    placeholder="Expliquer la raison du rejet (ex: Email professionnel non valide)..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="mt-2"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setRejectDialogOpen(null);
                                    setNotes('');
                                  }}
                                >
                                  Annuler
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleReject(user.id)}
                                  disabled={actionLoading === user.id}
                                >
                                  {actionLoading === user.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Traitement...
                                    </>
                                  ) : (
                                    'Rejeter'
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} sur {totalPages} ({total} utilisateurs)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || loading}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || loading}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

