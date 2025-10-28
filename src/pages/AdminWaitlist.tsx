import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiService } from "@/services/apiService";
import { AdminService } from "@/services/adminService";
import { Loader2, Users, BarChart3, Shield, UserCheck, ArrowLeft, Mail, CreditCard } from "lucide-react";
import { UserManagement } from "@/components/admin/UserManagement";
import { UserDetails } from "@/components/admin/UserDetails";
import { MessageManagement } from "@/components/admin/MessageManagement";
import { MessageDetails } from "@/components/admin/MessageDetails";
import { SubscriptionManagement } from "@/components/admin/SubscriptionManagement";
import { SubscriptionDetails } from "@/components/admin/SubscriptionDetails";

type WaitlistEntry = {
  id: number;
  name: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
  notes?: string | null;
  contacted_at?: string | null;
  converted_at?: string | null;
};

export default function AdminWaitlist() {
  // États pour la waitlist
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [summary, setSummary] = useState<{
    total_entries: number;
    status_breakdown: Record<string, number>;
    recent_entries_7_days: number;
    last_updated: string;
  } | null>(null);
  const [query, setQuery] = useState("");

  // États pour la gestion des utilisateurs
  const [activeTab, setActiveTab] = useState<'waitlist' | 'users' | 'create-admin' | 'messages' | 'subscriptions'>('waitlist');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<number | null>(null);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  // États pour la création d'admin
  const [createAdminLoading, setCreateAdminLoading] = useState(false);
  const [createAdminForm, setCreateAdminForm] = useState({
    email: '',
    username: '',
    password: ''
  });
  const [createAdminMessage, setCreateAdminMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Fonction pour créer un admin
  const handleCreateAdmin = async () => {
    if (!createAdminForm.email || !createAdminForm.username || !createAdminForm.password) {
      setCreateAdminMessage({
        type: 'error',
        text: 'Veuillez remplir tous les champs'
      });
      return;
    }

    setCreateAdminLoading(true);
    setCreateAdminMessage(null);

    try {
      const result = await AdminService.createAdmin(createAdminForm);
      
      if (result.success) {
        setCreateAdminMessage({
          type: 'success',
          text: result.message
        });
        // Réinitialiser le formulaire
        setCreateAdminForm({
          email: '',
          username: '',
          password: ''
        });
      } else {
        setCreateAdminMessage({
          type: 'error',
          text: result.message
        });
      }
    } catch (error) {
      setCreateAdminMessage({
        type: 'error',
        text: 'Erreur lors de la création du compte admin'
      });
    } finally {
      setCreateAdminLoading(false);
    }
  };

  // Charger les données de la waitlist
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const [list, stats] = await Promise.all([
          apiService.listWaitlist(),
          apiService.getWaitlistSummary(),
        ]);
        if (!cancelled) {
          setEntries(list);
          setSummary(stats);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Vérifier les privilèges admin
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        setAdminLoading(true);
        const isAdmin = await AdminService.checkAdminPrivileges();
        setHasAdminAccess(isAdmin);
      } catch (error) {
        console.error('❌ Erreur lors de la vérification des privilèges admin:', error);
        setHasAdminAccess(false);
      } finally {
        setAdminLoading(false);
      }
    };

    checkAdminAccess();
  }, []);

  // Gestion de la navigation admin
  const handleUserSelect = (userId: number) => {
    setSelectedUserId(userId);
  };

  const handleBackToUserList = () => {
    setSelectedUserId(null);
  };

  const handleMessageSelect = (messageId: number) => {
    setSelectedMessageId(messageId);
  };

  const handleBackToMessageList = () => {
    setSelectedMessageId(null);
  };

  const handleSubscriptionSelect = (subscriptionId: number) => {
    setSelectedSubscriptionId(subscriptionId);
  };

  const handleBackToSubscriptionList = () => {
    setSelectedSubscriptionId(null);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.status.toLowerCase().includes(q)
    );
  }, [entries, query]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Administration
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Gérez votre plateforme depuis ce tableau de bord
          </p>
        </div>

        {/* Onglets de navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveTab('waitlist')}
            className={`group relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'waitlist'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-white dark:bg-slate-800 text-muted-foreground hover:text-foreground hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Liste d'attente</span>
            </div>
            {activeTab === 'waitlist' && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-foreground rounded-full" />
            )}
          </button>
          
          {hasAdminAccess && (
            <>
              <button
                onClick={() => setActiveTab('users')}
                className={`group relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'users'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-white dark:bg-slate-800 text-muted-foreground hover:text-foreground hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Utilisateurs</span>
                </div>
                {activeTab === 'users' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-foreground rounded-full" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('create-admin')}
                className={`group relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'create-admin'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-white dark:bg-slate-800 text-muted-foreground hover:text-foreground hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  <span>Créer Admin</span>
                </div>
                {activeTab === 'create-admin' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-foreground rounded-full" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('messages')}
                className={`group relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'messages'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-white dark:bg-slate-800 text-muted-foreground hover:text-foreground hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Messages</span>
                </div>
                {activeTab === 'messages' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-foreground rounded-full" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`group relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'subscriptions'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-white dark:bg-slate-800 text-muted-foreground hover:text-foreground hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Abonnements</span>
                </div>
                {activeTab === 'subscriptions' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-foreground rounded-full" />
                )}
              </button>
            </>
          )}
        </div>

      {/* Contenu conditionnel selon l'onglet actif */}
      {activeTab === 'waitlist' && (
        <>
          {/* Statistiques de la waitlist */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Total</p>
                    <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                      {summary ? summary.total_entries : '-'}
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Entrées accumulées</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-200/50 dark:bg-blue-800/50 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950 dark:to-emerald-900/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">7 derniers jours</p>
                    <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                      {summary ? summary.recent_entries_7_days : '-'}
                    </div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Nouvelles entrées</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-emerald-200/50 dark:bg-emerald-800/50 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white dark:bg-slate-800">
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">Répartition des statuts</p>
                  <div className="flex flex-wrap gap-2">
                    {summary ? (
                      Object.entries(summary.status_breakdown).map(([k, v]) => (
                        <Badge 
                          key={k} 
                          variant="outline" 
                          className="text-xs bg-primary/5 text-primary border-primary/20"
                        >
                          {k}: {v}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-neutral-500">-</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tableau de la waitlist */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-sm font-medium">Entrées de la liste d'attente</CardTitle>
                <div className="w-64">
                  <Input placeholder="Rechercher nom, email, statut…" value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-12 flex items-center justify-center text-neutral-500">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin"/> Chargement…
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-neutral-500">
                        <th className="py-2 pr-4">ID</th>
                        <th className="py-2 pr-4">Nom</th>
                        <th className="py-2 pr-4">Email</th>
                        <th className="py-2 pr-4">Statut</th>
                        <th className="py-2 pr-4">Créé le</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((e) => (
                        <tr key={e.id} className="border-t">
                          <td className="py-2 pr-4">{e.id}</td>
                          <td className="py-2 pr-4">{e.name}</td>
                          <td className="py-2 pr-4">{e.email}</td>
                          <td className="py-2 pr-4"><Badge variant="outline">{e.status}</Badge></td>
                          <td className="py-2 pr-4">{new Date(e.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-neutral-500">Aucun résultat</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Onglet Gestion des utilisateurs */}
      {activeTab === 'users' && (
        <div>
          {adminLoading ? (
            <Card>
              <CardContent className="p-8">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </CardContent>
            </Card>
          ) : selectedUserId ? (
            <UserDetails 
              userId={selectedUserId} 
              onBack={handleBackToUserList}
              className="w-full"
            />
          ) : (
            <UserManagement 
              className="w-full"
              onUserSelect={handleUserSelect}
            />
          )}
        </div>
      )}

      {/* Onglet Créer Admin */}
      {activeTab === 'create-admin' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Créer un compte administrateur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="admin@virail.studio"
                    value={createAdminForm.email}
                    onChange={(e) => setCreateAdminForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom d'utilisateur</label>
                  <Input
                    type="text"
                    placeholder="admin"
                    value={createAdminForm.username}
                    onChange={(e) => setCreateAdminForm(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mot de passe</label>
                <Input
                  type="password"
                  placeholder="Mot de passe sécurisé"
                  value={createAdminForm.password}
                  onChange={(e) => setCreateAdminForm(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
              
              {createAdminMessage && (
                <div className={`p-3 rounded-lg ${
                  createAdminMessage.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {createAdminMessage.text}
                </div>
              )}

              <Button
                onClick={handleCreateAdmin}
                disabled={createAdminLoading}
                className="w-full"
              >
                {createAdminLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Créer le compte admin
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Le compte admin aura tous les privilèges d'administration</p>
              <p>• L'email doit être unique dans le système</p>
              <p>• Le nom d'utilisateur doit être unique</p>
              <p>• Le mot de passe doit être sécurisé (minimum 8 caractères)</p>
              <p>• Le compte sera automatiquement activé et vérifié</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Onglet Messages */}
      {activeTab === 'messages' && (
        <div className="space-y-6">
          {adminLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Chargement des messages...</p>
                </div>
              </CardContent>
            </Card>
          ) : selectedMessageId ? (
            <MessageDetails 
              messageId={selectedMessageId} 
              onBack={handleBackToMessageList}
              className="w-full"
            />
          ) : (
            <MessageManagement 
              className="w-full"
              onMessageSelect={handleMessageSelect}
            />
          )}
        </div>
      )}

      {/* Onglet Abonnements */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          {adminLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Chargement des abonnements...</p>
                </div>
              </CardContent>
            </Card>
          ) : selectedSubscriptionId ? (
            <SubscriptionDetails 
              subscriptionId={selectedSubscriptionId} 
              onBack={handleBackToSubscriptionList}
              className="w-full"
            />
          ) : (
            <SubscriptionManagement 
              className="w-full"
              onSubscriptionSelect={handleSubscriptionSelect}
            />
          )}
        </div>
      )}
      </div>
    </div>
  );
}



