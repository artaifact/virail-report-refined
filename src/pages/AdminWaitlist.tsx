import { useEffect, useMemo, useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiService } from "@/services/apiService";
import { AdminService } from "@/services/adminService";
import {
  Loader2,
  Users,
  BarChart3,
  Shield,
  UserCheck,
  Mail,
  CreditCard,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { UserManagement } from "@/components/admin/UserManagement";
import { UserDetails } from "@/components/admin/UserDetails";
import { MessageManagement } from "@/components/admin/MessageManagement";
import { MessageDetails } from "@/components/admin/MessageDetails";
import { SubscriptionManagement } from "@/components/admin/SubscriptionManagement";
import { SubscriptionDetails } from "@/components/admin/SubscriptionDetails";
import { PendingUsersManagement } from "@/components/admin/PendingUsersManagement";

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
  usePageTitle("Admin - Plateforme");

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

  // États pour la navigation admin
  const [activeTab, setActiveTab] = useState<
    "waitlist" | "users" | "pending-users" | "create-admin" | "messages" | "subscriptions"
  >("waitlist");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<number | null>(null);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  // États pour la création d'admin
  const [createAdminLoading, setCreateAdminLoading] = useState(false);
  const [createAdminForm, setCreateAdminForm] = useState({
    email: "",
    username: "",
    password: "",
  });
  const [createAdminMessage, setCreateAdminMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleCreateAdmin = async () => {
    if (!createAdminForm.email || !createAdminForm.username || !createAdminForm.password) {
      setCreateAdminMessage({
        type: "error",
        text: "Veuillez remplir tous les champs obligatoires.",
      });
      return;
    }

    setCreateAdminLoading(true);
    setCreateAdminMessage(null);

    try {
      const result = await AdminService.createAdmin(createAdminForm);

      if (result.success) {
        setCreateAdminMessage({
          type: "success",
          text: result.message,
        });
        setCreateAdminForm({
          email: "",
          username: "",
          password: "",
        });
      } else {
        setCreateAdminMessage({
          type: "error",
          text: result.message,
        });
      }
    } catch {
      setCreateAdminMessage({
        type: "error",
        text: "Erreur inattendue lors de la création du compte administrateur.",
      });
    } finally {
      setCreateAdminLoading(false);
    }
  };

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
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        setAdminLoading(true);
        const isAdmin = await AdminService.checkAdminPrivileges();
        setHasAdminAccess(isAdmin);
      } catch {
        setHasAdminAccess(false);
      } finally {
        setAdminLoading(false);
      }
    };

    checkAdminAccess();
  }, []);

  const handleUserSelect = (userId: number) => setSelectedUserId(userId);
  const handleBackToUserList = () => setSelectedUserId(null);

  const handleMessageSelect = (messageId: number) => setSelectedMessageId(messageId);
  const handleBackToMessageList = () => setSelectedMessageId(null);

  const handleSubscriptionSelect = (subscriptionId: number) =>
    setSelectedSubscriptionId(subscriptionId);
  const handleBackToSubscriptionList = () => setSelectedSubscriptionId(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.status.toLowerCase().includes(q)
    );
  }, [entries, query]);

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="border-b border-border bg-card/60 backdrop-blur-sm px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 px-2.5 py-0.5 text-xs font-semibold border-primary/20 bg-primary/5 text-primary">
              <Shield className="h-3 w-3" />
              Espace Administration
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Gestion de la plateforme
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Pilotez les inscriptions sur liste d'attente, les utilisateurs, les abonnements et les messages.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="overflow-x-auto pb-1">
          <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-auto">
            <TabsList className="bg-muted/80 p-1 rounded-xl border border-border/60">
              <TabsTrigger
                value="waitlist"
                className="gap-2 rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-xs px-3 sm:px-4"
              >
                <Users className="h-4 w-4" />
                <span>Liste d'attente</span>
              </TabsTrigger>

              {hasAdminAccess && (
                <>
                  <TabsTrigger
                    value="users"
                    className="gap-2 rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-xs px-3 sm:px-4"
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Utilisateurs</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="pending-users"
                    className="gap-2 rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-xs px-3 sm:px-4"
                  >
                    <Clock className="h-4 w-4" />
                    <span>En attente</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="messages"
                    className="gap-2 rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-xs px-3 sm:px-4"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Messages</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="subscriptions"
                    className="gap-2 rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-xs px-3 sm:px-4"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Abonnements</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="create-admin"
                    className="gap-2 rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-xs px-3 sm:px-4"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Créer Admin</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </Tabs>
        </div>

        {/* Onglet Waitlist */}
        {activeTab === "waitlist" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              <Card className="border-border shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Inscrits
                  </CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-foreground">
                    {summary ? summary.total_entries : "—"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Inscrits liste d'attente</p>
                </CardContent>
              </Card>

              <Card className="border-border shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    7 derniers jours
                  </CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-foreground">
                    {summary ? summary.recent_entries_7_days : "—"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Nouvelles inscriptions récentes</p>
                </CardContent>
              </Card>

              <Card className="border-border shadow-xs sm:col-span-2 lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Répartition par statut
                  </CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Shield className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {summary && summary.status_breakdown ? (
                      Object.entries(summary.status_breakdown).map(([k, v]) => (
                        <Badge
                          key={k}
                          variant="outline"
                          className="text-xs bg-muted/60 text-foreground border-border font-medium"
                        >
                          {k}: {v}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Waitlist Table Card */}
            <Card className="border-border shadow-xs overflow-hidden">
              <CardHeader className="px-6 py-4 border-b border-border bg-muted/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">
                      Entrées de la liste d'attente
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      {filtered.length} inscription{filtered.length > 1 ? "s" : ""} trouvée{filtered.length > 1 ? "s" : ""}
                    </CardDescription>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher nom, email..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {loading ? (
                  <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
                    <Loader2 className="w-7 h-7 animate-spin text-primary" />
                    <span className="text-sm font-medium">Chargement de la liste d'attente...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table className="min-w-[650px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">ID</TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Date d'inscription</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((e) => (
                          <TableRow key={e.id}>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              #{e.id}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              {e.name || "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{e.email}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="text-xs bg-primary/5 text-primary border-primary/20 font-medium"
                              >
                                {e.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">
                              {new Date(e.created_at).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                        {filtered.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="py-12 text-center text-muted-foreground text-xs">
                              Aucune entrée trouvée.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Onglet Utilisateurs */}
        {activeTab === "users" && (
          <div>
            {adminLoading ? (
              <Card className="border-border">
                <CardContent className="p-12 flex items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </CardContent>
              </Card>
            ) : selectedUserId ? (
              <UserDetails
                userId={selectedUserId}
                onBack={handleBackToUserList}
                className="w-full"
              />
            ) : (
              <UserManagement className="w-full" onUserSelect={handleUserSelect} />
            )}
          </div>
        )}

        {/* Onglet Utilisateurs en attente */}
        {activeTab === "pending-users" && (
          <div className="space-y-6">
            <PendingUsersManagement className="w-full" />
          </div>
        )}

        {/* Onglet Créer Admin */}
        {activeTab === "create-admin" && (
          <div className="max-w-2xl space-y-6">
            <Card className="border-border shadow-xs">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Shield className="h-4 w-4 text-primary" />
                  Créer un compte administrateur
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Ce compte disposera des permissions complètes sur l'ensemble de la plateforme.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-email" className="text-xs font-medium">
                      Email professionnel
                    </Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@viraill.com"
                      value={createAdminForm.email}
                      onChange={(e) =>
                        setCreateAdminForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="admin-username" className="text-xs font-medium">
                      Nom d'utilisateur
                    </Label>
                    <Input
                      id="admin-username"
                      type="text"
                      placeholder="admin"
                      value={createAdminForm.username}
                      onChange={(e) =>
                        setCreateAdminForm((prev) => ({ ...prev, username: e.target.value }))
                      }
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admin-pass" className="text-xs font-medium">
                    Mot de passe sécurisé
                  </Label>
                  <Input
                    id="admin-pass"
                    type="password"
                    placeholder="Au moins 8 caractères"
                    value={createAdminForm.password}
                    onChange={(e) =>
                      setCreateAdminForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className="text-sm"
                  />
                </div>

                {createAdminMessage && (
                  <Alert
                    variant={createAdminMessage.type === "success" ? "default" : "destructive"}
                    className="py-2.5"
                  >
                    {createAdminMessage.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertTitle className="text-xs font-semibold">
                      {createAdminMessage.type === "success" ? "Succès" : "Erreur"}
                    </AlertTitle>
                    <AlertDescription className="text-xs mt-0.5">
                      {createAdminMessage.text}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleCreateAdmin}
                  disabled={createAdminLoading}
                  className="w-full gap-2 font-semibold"
                >
                  {createAdminLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <UserCheck className="h-4 w-4" />
                  <span>{createAdminLoading ? "Création en cours..." : "Créer le compte admin"}</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Onglet Messages */}
        {activeTab === "messages" && (
          <div>
            {adminLoading ? (
              <Card className="border-border">
                <CardContent className="flex items-center justify-center py-16">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </CardContent>
              </Card>
            ) : selectedMessageId ? (
              <MessageDetails
                messageId={selectedMessageId}
                onBack={handleBackToMessageList}
                className="w-full"
              />
            ) : (
              <MessageManagement className="w-full" onMessageSelect={handleMessageSelect} />
            )}
          </div>
        )}

        {/* Onglet Abonnements */}
        {activeTab === "subscriptions" && (
          <div>
            {adminLoading ? (
              <Card className="border-border">
                <CardContent className="flex items-center justify-center py-16">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
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
