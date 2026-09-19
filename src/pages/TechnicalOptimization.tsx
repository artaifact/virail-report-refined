import React from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Code, 
  Zap, 
  Database, 
  Monitor, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  Image,
  Gauge
} from 'lucide-react';

const TechnicalOptimization: React.FC = () => {
  usePageTitle('Optimisation technique');
  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 bg-background text-foreground min-h-screen">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Code className="h-5 w-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Optimisation Technique
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Recommandations d'optimisation pour améliorer les performances techniques et le crawl de votre site.
          </p>
        </div>
      </div>

      <Separator />

      {/* Vue d'ensemble des performances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Score Global</span>
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">85<span className="text-lg text-muted-foreground font-normal">/100</span></div>
            <p className="text-xs text-muted-foreground mt-1">Bon niveau technique général</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Vitesse de Chargement</span>
              <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-amber-600 dark:text-amber-400">2.4<span className="text-lg text-muted-foreground font-normal">s</span></div>
            <p className="text-xs text-muted-foreground mt-1">Optimisations requises pour les LLM bots</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Performance Mobile</span>
              <Monitor className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-primary">78<span className="text-lg text-muted-foreground font-normal">/100</span></div>
            <p className="text-xs text-muted-foreground mt-1">Marge de progression sur les Core Web Vitals</p>
          </CardContent>
        </Card>
      </div>

      {/* Recommandations prioritaires */}
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Recommandations Prioritaires</CardTitle>
              <CardDescription>
                Actions recommandées pour améliorer significativement les performances
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 p-4 bg-destructive/5 rounded-xl border border-destructive/20">
              <div className="flex items-start gap-3">
                <Image className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground text-sm sm:text-base">Optimisation des images</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Les images représentent 60% du poids de la page. Compresser et convertir en WebP/AVIF peut réduire le temps de chargement de 40%.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="destructive" className="text-xs">Priorité Haute</Badge>
                    <Badge variant="outline" className="text-xs">Impact: -40% temps de chargement</Badge>
                  </div>
                </div>
              </div>
              <Button size="sm" variant="default" className="shrink-0 self-start sm:self-center">
                Corriger
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 p-4 bg-amber-500/5 rounded-xl border border-amber-500/20">
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground text-sm sm:text-base">Cache navigateur & CDN</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configurer des en-têtes de cache appropriés (Cache-Control: max-age=31536000) pour les ressources statiques afin d'accélérer les crawls répétés.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-0">Priorité Moyenne</Badge>
                    <Badge variant="outline" className="text-xs">Impact: +25% vitesse retour</Badge>
                  </div>
                </div>
              </div>
              <Button size="sm" variant="outline" className="shrink-0 self-start sm:self-center">
                Configurer
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground text-sm sm:text-base">Minification CSS/JS & Compression Brotli</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Les fichiers CSS et JavaScript sont correctement minifiés et compressés. Conforme aux recommandations de Google et des moteurs d'indexation.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">Optimisé</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Détails techniques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              Métriques Core Web Vitals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-foreground">LCP (Largest Contentful Paint)</span>
                <Badge variant="secondary" className="font-mono">2.1s</Badge>
              </div>
              <Progress value={70} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-foreground">FID (First Input Delay)</span>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 font-mono">45ms</Badge>
              </div>
              <Progress value={90} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-foreground">CLS (Cumulative Layout Shift)</span>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 font-mono">0.08</Badge>
              </div>
              <Progress value={85} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              Analyse des Ressources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-sm font-medium text-foreground">Images</span>
                <div className="text-right">
                  <div className="text-sm font-semibold font-mono text-foreground">2.1 MB</div>
                  <div className="text-xs text-muted-foreground">60% du total</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-sm font-medium text-foreground">JavaScript</span>
                <div className="text-right">
                  <div className="text-sm font-semibold font-mono text-foreground">580 KB</div>
                  <div className="text-xs text-muted-foreground">16% du total</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-sm font-medium text-foreground">CSS</span>
                <div className="text-right">
                  <div className="text-sm font-semibold font-mono text-foreground">120 KB</div>
                  <div className="text-xs text-muted-foreground">3% du total</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center py-1">
                <span className="text-sm font-medium text-foreground">Autres (Fonts, HTML)</span>
                <div className="text-right">
                  <div className="text-sm font-semibold font-mono text-foreground">750 KB</div>
                  <div className="text-xs text-muted-foreground">21% du total</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TechnicalOptimization; 