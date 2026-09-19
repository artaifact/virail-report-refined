import { usePageTitle } from '@/hooks/usePageTitle';
import { Users, UserPlus, Target, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const Audience = () => {
  usePageTitle('Audience');
  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8 bg-background text-foreground min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Audience & Démographie</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            Analyse de votre audience cible, répartition par pays et profils de recherche.
          </p>
        </div>
      </div>
      
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total abonnés</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground">24,157</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">+12.4% ce mois</p>
          </CardContent>
        </Card>
        
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nouveaux cette semaine</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <UserPlus className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground">573</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">+18.7% vs semaine dernière</p>
          </CardContent>
        </Card>
        
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Taux d'engagement</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Target className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground">8.9%</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">+2.1% ce mois</p>
          </CardContent>
        </Card>
        
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Portée globale</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Globe className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground">156K</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">+7.3% ce mois</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Démographie de l'audience</CardTitle>
            <CardDescription>Répartition par tranches d'âge</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 text-sm font-medium text-muted-foreground">18-24</div>
                  <Progress value={35} className="flex-1 h-2" />
                  <div className="w-12 text-sm text-right font-mono font-semibold text-foreground">35%</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 text-sm font-medium text-muted-foreground">25-34</div>
                  <Progress value={42} className="flex-1 h-2" />
                  <div className="w-12 text-sm text-right font-mono font-semibold text-foreground">42%</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 text-sm font-medium text-muted-foreground">35-44</div>
                  <Progress value={18} className="flex-1 h-2" />
                  <div className="w-12 text-sm text-right font-mono font-semibold text-foreground">18%</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 text-sm font-medium text-muted-foreground">45+</div>
                  <Progress value={5} className="flex-1 h-2" />
                  <div className="w-12 text-sm text-right font-mono font-semibold text-foreground">5%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3 border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Top pays</CardTitle>
            <CardDescription>Répartition géographique des requêtes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-sm font-medium text-foreground">France</span>
                <span className="text-sm font-mono font-semibold text-foreground">45.2%</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-sm font-medium text-foreground">Canada</span>
                <span className="text-sm font-mono font-semibold text-foreground">23.1%</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-sm font-medium text-foreground">Belgique</span>
                <span className="text-sm font-mono font-semibold text-foreground">12.8%</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-sm font-medium text-foreground">Suisse</span>
                <span className="text-sm font-mono font-semibold text-foreground">8.4%</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm font-medium text-muted-foreground">Autres</span>
                <span className="text-sm font-mono font-semibold text-muted-foreground">10.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Audience;
