import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  Search, 
  TrendingUp, 
  Layers, 
  BookOpen, 
  Wrench, 
  Maximize2, 
  ChevronRight 
} from 'lucide-react';
import { UnifiedActionabilityScore } from '@/types/scoring';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MethodologyModal } from './MethodologyModal';

interface ActionabilityScoreDetailProps {
  unified: UnifiedActionabilityScore | null;
  domain?: string;
  onOpenModal?: () => void;
  onSwitchToFullView?: () => void;
  isModalView?: boolean;
}

export const ActionabilityScoreDetail: React.FC<ActionabilityScoreDetailProps> = ({
  unified,
  domain = 'tally.so',
  onOpenModal,
  onSwitchToFullView,
  isModalView = false,
}) => {
  const navigate = useNavigate();
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const overallScore = unified?.overallScore ?? (unified as any)?.score ?? 63;
  const grade = unified?.grade || 'C';

  const level1 = unified?.levels?.found_and_cited;
  const level2 = unified?.levels?.understood_and_preferred;
  const level3 = unified?.levels?.actionable_and_transacting;

  return (
    <div className={`space-y-6 ${isModalView ? 'p-1' : 'w-full'}`}>
      {/* ─── Hero / Header Card (shadcn Card) ──────────────────────────────── */}
      <Card className="rounded-xl border border-border shadow-xs relative overflow-hidden bg-card">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              {/* Grade Badge */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-border bg-muted/40 flex flex-col items-center justify-center shrink-0">
                <span className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {grade}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Grade
                </span>
              </div>

              {/* Score & Title info */}
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    Score d'Actionnabilité Unifié : <span>{overallScore}/100</span>
                  </h2>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {overallScore >= 80 ? 'Excellente visibilité' : overallScore >= 60 ? 'Maturité intermédiaire' : 'Optimisation requise'}
                  </Badge>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
                  Évaluation holistique en 3 niveaux pour <strong className="text-foreground">{domain}</strong> : visibilité générative multi-LLM, structure sémantique et réactivité machine-to-machine.
                </p>

                {/* Échelle des grades avec Badges shadcn */}
                <div className="flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground flex-wrap">
                  <span className="font-medium text-foreground">Échelle :</span>
                  <Badge variant={grade === 'F' ? 'default' : 'outline'} className="text-[10px] py-0 px-1.5 font-normal">F &lt;35</Badge>
                  <Badge variant={grade === 'D' ? 'default' : 'outline'} className="text-[10px] py-0 px-1.5 font-normal">D 35-49</Badge>
                  <Badge variant={grade === 'C' ? 'default' : 'outline'} className="text-[10px] py-0 px-1.5 font-normal">C 50-64</Badge>
                  <Badge variant={grade === 'B' ? 'default' : 'outline'} className="text-[10px] py-0 px-1.5 font-normal">B 65-79</Badge>
                  <Badge variant={grade === 'A' || grade === 'A+' ? 'default' : 'outline'} className="text-[10px] py-0 px-1.5 font-normal">A/A+ ≥80</Badge>
                </div>
              </div>
            </div>

            {/* Quick Actions & Simulation */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 self-stretch md:self-auto justify-center">
              <div className="p-3 rounded-xl border border-border bg-muted/40 flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-foreground">Potentiel : +28 pts</span>
                  <p className="text-[11px] text-muted-foreground">Passage au Grade A possible via 3 correctifs</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate('/ameliorer')}
                  className="flex-1 text-xs font-medium gap-1.5 cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Appliquer</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMethodologyOpen(true)}
                  className="text-xs font-medium cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1" />
                  <span>Méthode</span>
                </Button>

                {onSwitchToFullView && isModalView && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSwitchToFullView}
                    className="text-xs font-medium cursor-pointer"
                    title="Afficher en pleine page sur le tableau de bord"
                  >
                    <Maximize2 className="w-3.5 h-3.5 mr-1" />
                    <span className="hidden sm:inline">Plein écran</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Global Progress Bar via shadcn Progress */}
          <div className="mt-5 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
              <span>Actionnabilité globale</span>
              <span className="font-semibold text-foreground">{overallScore}%</span>
            </div>
            <Progress value={overallScore} className="h-2 bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* ─── The 3 Canonical Pillars Cards (shadcn Cards) ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Niveau 1 : Être trouvé & cité */}
        <Card className="rounded-xl border border-border shadow-xs flex flex-col justify-between bg-card">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <Badge variant="outline" className="text-xs font-normal">
                Niveau 1 (40%)
              </Badge>
              <Badge variant="secondary" className="text-xs font-medium">
                {level1?.score ?? 50}/100
              </Badge>
            </div>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-1.5">
              <Search className="w-4 h-4 text-muted-foreground" />
              <span>Être trouvé & cité</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Part de voix et fréquence de recommandation dans les réponses de ChatGPT, Perplexity, Gemini, Claude.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 pt-0">
            <div className="space-y-3 pt-2 border-t border-border">
              <div>
                <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1">
                  <span>Taux de citation multi-modèles</span>
                  <span className="font-medium text-foreground">{level1?.score ?? 50}%</span>
                </div>
                <Progress value={level1?.score ?? 50} className="h-1.5 bg-muted" />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1">
                  <span>Autorité des domaines sources</span>
                  <span className="font-medium text-foreground">45%</span>
                </div>
                <Progress value={45} className="h-1.5 bg-muted" />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1">
                  <span>Sentiment comparatif vs concurrents</span>
                  <span className="font-medium text-foreground">53%</span>
                </div>
                <Progress value={53} className="h-1.5 bg-muted" />
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-5 pt-0">
            <div className="w-full text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/60">
              <strong className="text-foreground">Diagnostic :</strong> Présence recensée mais encore dépassée par les leaders sur les requêtes à forte intention commerciale.
            </div>
          </CardFooter>
        </Card>

        {/* Niveau 2 : Être compris & choisi */}
        <Card className="rounded-xl border border-border shadow-xs flex flex-col justify-between bg-card">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <Badge variant="outline" className="text-xs font-normal">
                Niveau 2 (30%)
              </Badge>
              <Badge variant="secondary" className="text-xs font-medium">
                {level2?.score ?? 60}/100
              </Badge>
            </div>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <span>Être compris & choisi</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Lisibilité de l'offre pour les extracteurs IA : balisage Schema.org JSON-LD, sémantique HTML, netteté des entités.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 pt-0">
            <div className="space-y-3 pt-2 border-t border-border">
              <div>
                <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1">
                  <span>Données structurées (Schema.org)</span>
                  <span className="font-medium text-foreground">50% (partiel)</span>
                </div>
                <Progress value={50} className="h-1.5 bg-muted" />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1">
                  <span>Structure sémantique HTML (Hn, tableaux)</span>
                  <span className="font-medium text-foreground">65%</span>
                </div>
                <Progress value={65} className="h-1.5 bg-muted" />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1">
                  <span>Clarté factuelle & extraction de tarifs</span>
                  <span className="font-medium text-foreground">65%</span>
                </div>
                <Progress value={65} className="h-1.5 bg-muted" />
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-5 pt-0">
            <div className="w-full text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/60">
              <strong className="text-foreground">Diagnostic :</strong> Risque d'hallucination ou de mauvaise interprétation des offres payantes par manque de JSON-LD explicite.
            </div>
          </CardFooter>
        </Card>

        {/* Niveau 3 : Être actionnable & convertir */}
        <Card className="rounded-xl border border-border shadow-xs flex flex-col justify-between bg-card">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <Badge variant="outline" className="text-xs font-normal">
                Niveau 3 (30%)
              </Badge>
              <Badge variant="secondary" className="text-xs font-medium">
                {level3?.score ?? 50}/100
              </Badge>
            </div>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-muted-foreground" />
              <span>Être actionnable (M2M)</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Capacité d'un agent autonome (ChatGPT Operator, Claude Computer Use) à interagir et finaliser des actions.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 pt-0">
            <div className="space-y-3 pt-2 border-t border-border">
              <div>
                <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1">
                  <span>Aiguillage /llms.txt</span>
                  <span className="font-medium text-foreground">Non détecté</span>
                </div>
                <Progress value={20} className="h-1.5 bg-muted" />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1">
                  <span>Contrat d'outils (OpenAPI 3.1)</span>
                  <span className="font-medium text-foreground">Partiel</span>
                </div>
                <Progress value={40} className="h-1.5 bg-muted" />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1">
                  <span>Validation par Parcours Réels (Journeys)</span>
                  <span className="font-medium text-foreground">45% de succès</span>
                </div>
                <Progress value={45} className="h-1.5 bg-muted" />
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-5 pt-0">
            <div className="w-full text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/60">
              <strong className="text-foreground">Diagnostic :</strong> Blocage critique pour les agents M2M en l'absence de fichier /llms.txt direct et d'OpenAPI structurée.
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* ─── Plan de Remédiation Prioritaire (shadcn Card) ────────────────── */}
      <Card className="rounded-xl border border-border shadow-xs bg-card">
        <CardHeader className="p-5 sm:p-6 pb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span>3 Correctifs Prioritaires pour Atteindre le Grade A (91/100)</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Actions directes générées par le moteur d'actionnabilité Viraill pour maximiser votre retour sur investissement génératif.
              </CardDescription>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/ameliorer')}
              className="text-xs font-medium gap-1.5 cursor-pointer"
            >
              <span>Générer le patch unifié (.patch)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 pt-0 space-y-3">
          {/* Fix 1 */}
          <div className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/40 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-md bg-muted text-muted-foreground flex items-center justify-center font-medium text-xs shrink-0 mt-0.5">
                1
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-semibold text-foreground">Déployer un fichier /llms.txt à la racine du domaine</h4>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Impact Fort (+15 pts)
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    5 min
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Fournit aux LLMs et agents un sommaire Markdown propre pointant vers vos pages clés sans coût de crawling inutile.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/ameliorer')}
              className="text-xs font-medium text-muted-foreground hover:text-foreground self-start sm:self-auto shrink-0 h-auto p-1"
            >
              <span>Voir le code</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </div>

          {/* Fix 2 */}
          <div className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/40 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-md bg-muted text-muted-foreground flex items-center justify-center font-medium text-xs shrink-0 mt-0.5">
                2
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-semibold text-foreground">Injecter le balisage Schema.org JSON-LD (Product & FAQPage)</h4>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Impact Fort (+10 pts)
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    10 min
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Permet à ChatGPT et Perplexity d'extraire instantanément vos fonctionnalités et plans tarifaires sans ambiguïté.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/ameliorer')}
              className="text-xs font-medium text-muted-foreground hover:text-foreground self-start sm:self-auto shrink-0 h-auto p-1"
            >
              <span>Voir le code</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </div>

          {/* Fix 3 */}
          <div className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/40 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-md bg-muted text-muted-foreground flex items-center justify-center font-medium text-xs shrink-0 mt-0.5">
                3
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-semibold text-foreground">Exposer le contrat machine OpenAPI 3.1 (/openapi.json)</h4>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Impact Moyen (+8 pts)
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    Effort Moyen
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Transforme votre site de simple vitrine en API appelable directement par les agents autonomes de vos prospects.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/ameliorer')}
              className="text-xs font-medium text-muted-foreground hover:text-foreground self-start sm:self-auto shrink-0 h-auto p-1"
            >
              <span>Voir le code</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Methodology Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
};
