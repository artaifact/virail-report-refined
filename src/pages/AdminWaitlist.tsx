import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiService } from "@/services/apiService";
import { AdminService } from "@/services/adminService";
import { Loader2, Users, BarChart3, Shield, UserCheck, ArrowLeft } from "lucide-react";
import { UserManagement } from "@/components/admin/UserManagement";
import { UserDetails } from "@/components/admin/UserDetails";

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
  const [activeTab, setActiveTab] = useState<'waitlist' | 'users'>('waitlist');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

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
    <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Administration</h1>
      </div>


      {/* Onglets de navigation */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'waitlist' ? 'default' : 'outline'}
          onClick={() => setActiveTab('waitlist')}
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          Liste d'attente
        </Button>
        {hasAdminAccess && (
          <Button
            variant={activeTab === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('users')}
            className="flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            Gestion des utilisateurs
          </Button>
        )}
      </div>

      {/* Contenu conditionnel selon l'onglet actif */}
      {activeTab === 'waitlist' && (
        <>
          {/* Statistiques de la waitlist */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2"><Users className="w-4 h-4"/> Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary ? summary.total_entries : '-'}</div>
                <p className="text-xs text-neutral-500">Entrées accumulées</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="w-4 h-4"/> 7 derniers jours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary ? summary.recent_entries_7_days : '-'}</div>
                <p className="text-xs text-neutral-500">Nouvelles entrées</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Répartition des statuts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {summary ? (
                    Object.entries(summary.status_breakdown).map(([k, v]) => (
                      <Badge key={k} variant="secondary" className="text-xs">{k}: {v}</Badge>
                    ))
                  ) : (
                    <span className="text-xs text-neutral-500">-</span>
                  )}
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
    </div>
  );
}



