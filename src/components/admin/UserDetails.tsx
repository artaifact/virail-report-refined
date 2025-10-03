import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Mail, Calendar, Shield, CheckCircle, XCircle, Activity, UserX, UserCheck, Trash2 } from 'lucide-react';
import { AdminService } from '@/services/adminService';
import { AdminUser } from '@/types/admin';
import { toast } from '@/hooks/use-toast';

interface UserDetailsProps {
  userId: number;
  onBack: () => void;
  className?: string;
}

export const UserDetails: React.FC<UserDetailsProps> = ({ userId, onBack, className }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAdmin = await AdminService.checkAdminPrivileges();
        setHasAdminAccess(isAdmin);
        
        if (isAdmin) {
          const userData = await AdminService.getUserById(userId);
          setUser(userData);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les détails de l'utilisateur",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [userId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Actions sur l'utilisateur
  const handleDisableUser = async () => {
    if (!user) return;
    
    try {
      setActionLoading(true);
      await AdminService.disableUser(user.id);
      toast({
        title: "Utilisateur désactivé",
        description: "L'utilisateur a été désactivé avec succès",
      });
      // Recharger les données utilisateur
      const updatedUser = await AdminService.getUserById(user.id);
      setUser(updatedUser);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de désactiver l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnableUser = async () => {
    if (!user) return;
    
    try {
      setActionLoading(true);
      await AdminService.enableUser(user.id);
      toast({
        title: "Utilisateur réactivé",
        description: "L'utilisateur a été réactivé avec succès",
      });
      // Recharger les données utilisateur
      const updatedUser = await AdminService.getUserById(user.id);
      setUser(updatedUser);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de réactiver l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur "${user.username}" ? Cette action est irréversible.`)) {
      return;
    }
    
    try {
      setActionLoading(true);
      await AdminService.deleteUser(user.id);
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé définitivement",
      });
      // Retourner à la liste
      onBack();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (!hasAdminAccess) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            Accès refusé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Vous n'avez pas les privilèges administrateur requis pour accéder à cette section.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Utilisateur non trouvé</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            L'utilisateur demandé n'a pas été trouvé.
          </p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* En-tête avec bouton retour */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
        <h1 className="text-2xl font-bold">Détails de l'utilisateur</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nom d'utilisateur</label>
                  <p className="text-lg font-semibold">{user.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID utilisateur</label>
                  <p className="text-lg font-semibold">#{user.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date de création</label>
                  <p className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(user.created_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statuts et rôles */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Statuts et rôles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Compte actif</span>
                <Badge variant={user.is_active ? "default" : "secondary"}>
                  {user.is_active ? (
                    <><CheckCircle className="h-3 w-3 mr-1" /> Actif</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1" /> Inactif</>
                  )}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email vérifié</span>
                <Badge variant={user.is_verified ? "default" : "secondary"}>
                  {user.is_verified ? (
                    <><CheckCircle className="h-3 w-3 mr-1" /> Vérifié</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1" /> Non vérifié</>
                  )}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rôle</span>
                <Badge variant={user.is_admin ? "destructive" : "outline"}>
                  {user.is_admin ? (
                    <><Shield className="h-3 w-3 mr-1" /> Administrateur</>
                  ) : (
                    <><User className="h-3 w-3 mr-1" /> Utilisateur</>
                  )}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Activité */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Dernière connexion</label>
                <p className="text-sm">
                  {user.last_login ? formatDate(user.last_login) : "Jamais connecté"}
                </p>
              </div>
              
              {user.total_reports !== undefined && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total rapports</label>
                  <p className="text-sm font-semibold">{user.total_reports}</p>
                </div>
              )}
              
              {user.total_analyses !== undefined && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total analyses</label>
                  <p className="text-sm font-semibold">{user.total_analyses}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions administrateur */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Actions administrateur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {user.is_active ? (
                  <Button
                    variant="outline"
                    onClick={handleDisableUser}
                    disabled={actionLoading}
                    className="flex items-center gap-2"
                  >
                    <UserX className="h-4 w-4" />
                    Désactiver
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleEnableUser}
                    disabled={actionLoading}
                    className="flex items-center gap-2"
                  >
                    <UserCheck className="h-4 w-4" />
                    Réactiver
                  </Button>
                )}
                
                <Button
                  variant="destructive"
                  onClick={handleDeleteUser}
                  disabled={actionLoading}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>• <strong>Désactiver/Réactiver</strong> : Change le statut actif de l'utilisateur</p>
                <p>• <strong>Supprimer</strong> : Supprime définitivement l'utilisateur (irréversible)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
