import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Bot, 
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
import { Separator } from '@/components/ui/separator';

interface ActionabilityScoreDetailProps {
  unified: UnifiedActionabilityScore | null;
  domain?: string;
  onOpenModal?: () => void;
  onSwitchToFullView?: () => void;
  isModalView?: boolean;
}

const getGradeColors = (grade: string) => {
  switch (grade) {
    case 'A+':
    case 'A':
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        ring: 'ring-emerald-500/20',
        progress: 'bg-emerald-500',
      };
    case 'B':
      return {
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        text: 'text-indigo-700',
        badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        ring: 'ring-indigo-500/20',
        progress: 'bg-indigo-600',
      };
    case 'C':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
        ring: 'ring-amber-500/20',
        progress: 'bg-amber-500',
      };
    default:
      return {
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-700',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
        ring: 'ring-rose-500/20',
        progress: 'bg-rose-500',
      };
  }
};

export const ActionabilityScoreDetail: React.FC<ActionabilityScoreDetailProps> = ({
  unified,
  domain = 'tally.so',
  onOpenModal,
  onSwitchToFullView,
  isModalView = false,
}) => {
  const navigate = useNavigate();
  const overallScore = unified?.overallScore ?? (unified as any)?.score ?? 63;
  const grade = unified?.grade || 'C';
  const gradeColors = getGradeColors(grade);

  const level1 = unified?.levels?.found_and_cited;
  const level2 = unified?.levels?.understood_and_preferred;
  const level3 = unified?.levels?.actionable_and_transacting;

  return (
    <div className={`space-y-6 ${isModalView ? 'p-1' : 'w-full'}`}>
      {/* ─── Hero / Header Card (shadcn Card) ──────────────────────────────── */}
      <Card className="rounded-2xl border-slate-200/80 shadow-xs relative overflow-hidden bg-white">
        {/* Subtle Background Decoration */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-50/50 rounded-full blur-2xl pointer-events-none" />

        <CardContent className="p-5 sm:p-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              {/* Grade Badge */}
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${gradeColors.bg} border-2 ${gradeColors.border} flex flex-col items-center justify-center shrink-0 shadow-xs ring-4 ${gradeColors.ring}`}>
                <span className={`text-2xl sm:text-3xl font-black ${gradeColors.text} tracking-tight`}>
                  {grade}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Grade
                </span>
              </div>

              {/* Score & Title info */}
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Score d'Actionnabilité Unifié : <span className={gradeColors.text}>{overallScore}/100</span>
                  </h2>
                  <Badge variant="outline" className={`text-xs font-semibold ${gradeColors.badgeBg}`}>
                    {overallScore >= 80 ? 'Excellente visibilité' : overallScore >= 60 ? 'Maturité intermédiaire' : 'Optimisation requise'}
                  </Badge>
                </div>

                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
                  Évaluation holistique en 3 niveaux pour <strong className="text-slate-800">{domain}</strong> : visibilité générative multi-LLM, structure sémantique et réactivité machine-to-machine.
                </p>

                {/* Échelle des grades avec Badges shadcn */}
                <div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-400 flex-wrap">
                  <span className="font-medium text-slate-600">Échelle :</span>
                  <Badge variant={grade === 'F' ? 'destructive' : 'outline'} className="text-[10px] py-0 px-1.5 font-medium">F &lt;35</Badge>
                  <Badge variant={grade === 'D' ? 'secondary' : 'outline'} className={`text-[10px] py-0 px-1.5 font-medium ${grade === 'D' ? 'bg-amber-100 text-amber-800' : ''}`}>D 35-49</Badge>
                  <Badge variant={grade === 'C' ? 'secondary' : 'outline'} className={`text-[10px] py-0 px-1.5 font-medium ${grade === 'C' ? 'bg-amber-100 text-amber-800' : ''}`}>C 50-64</Badge>
                  <Badge variant={grade === 'B' ? 'secondary' : 'outline'} className={`text-[10px] py-0 px-1.5 font-medium ${grade === 'B' ? 'bg-indigo-100 text-indigo-800' : ''}`}>B 65-79</Badge>
                  <Badge variant={grade === 'A' || grade === 'A+' ? 'default' : 'outline'} className={`text-[10px] py-0 px-1.5 font-medium ${grade === 'A' || grade === 'A+' ? 'bg-emerald-600 text-white' : ''}`}>A/A+ ≥80</Badge>
                </div>
              </div>
            </div>

            {/* Quick Actions & Simulation */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 self-stretch md:self-auto justify-center">
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-emerald-900">Potentiel : +28 pts</span>
                  <p className="text-[11px] text-emerald-700">Passage au Grade A possible via 3 correctifs</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate('/ameliorer')}
                  className="flex-1 text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs rounded-xl cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Appliquer</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="rounded-xl text-xs font-medium text-slate-700"
                >
                  <Link to="/methodologie">
                    <BookOpen className="w-3.5 h-3.5 mr-1" />
                    <span>Méthode</span>
                  </Link>
                </Button>

                {onSwitchToFullView && isModalView && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSwitchToFullView}
                    className="rounded-xl text-xs font-medium text-slate-700 cursor-pointer"
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
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
              <span>Actionnabilité globale</span>
              <span>{overallScore}%</span>
            </div>
            <Progress value={overallScore} className="h-2.5 bg-slate-100" />
          </div>
        </CardContent>
      </Card>

      {/* ─── The 3 Canonical Pillars Cards (shadcn Cards) ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Niveau 1 : Être trouvé & cité */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs flex flex-col justify-between bg-white">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold py-0.5">
                Niveau 1 (40%)
              </Badge>
              <Badge variant="secondary" className="text-xs font-bold text-slate-900 bg-slate-100">
                {level1?.score ?? 50}/100
              </Badge>
            </div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-emerald-600" />
              <span>Être trouvé & cité</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Part de voix et fréquence de recommandation dans les réponses de ChatGPT, Perplexity, Gemini, Claude.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 pt-0">
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span>Taux de citation multi-modèles</span>
                  <span className="font-semibold text-slate-900">{level1?.score ?? 50}%</span>
                </div>
                <Progress value={level1?.score ?? 50} className="h-1.5 bg-slate-100" />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span>Autorité des domaines sources</span>
                  <span className="font-semibold text-slate-900">45%</span>
                </div>
                <Progress value={45} className="h-1.5 bg-slate-100" />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span>Sentiment comparatif vs concurrents</span>
                  <span className="font-semibold text-slate-900">53%</span>
                </div>
                <Progress value={53} className="h-1.5 bg-slate-100" />
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-5 pt-0">
            <div className="w-full text-[11px] text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/50">
              <strong className="text-slate-900">Diagnostic :</strong> Présence recensée mais encore dépassée par les leaders sur les requêtes à forte intention commerciale.
            </div>
          </CardFooter>
        </Card>

        {/* Niveau 2 : Être compris & choisi */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs flex flex-col justify-between bg-white">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-bold py-0.5">
                Niveau 2 (30%)
              </Badge>
              <Badge variant="secondary" className="text-xs font-bold text-slate-900 bg-slate-100">
                {level2?.score ?? 60}/100
              </Badge>
            </div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Être compris & choisi</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Lisibilité de l'offre pour les extracteurs IA : balisage Schema.org JSON-LD, sémantique HTML, netteté des entités.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 pt-0">
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span>Données structurées (Schema.org)</span>
                  <span className="font-semibold text-amber-600">50% (partiel)</span>
                </div>
                <Progress value={50} className="h-1.5 bg-slate-100" />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span>Structure sémantique HTML (Hn, tableaux)</span>
                  <span className="font-semibold text-indigo-600">65%</span>
                </div>
                <Progress value={65} className="h-1.5 bg-slate-100" />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span>Clarté factuelle & extraction de tarifs</span>
                  <span className="font-semibold text-indigo-600">65%</span>
                </div>
                <Progress value={65} className="h-1.5 bg-slate-100" />
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-5 pt-0">
            <div className="w-full text-[11px] text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/50">
              <strong className="text-slate-900">Diagnostic :</strong> Risque d'hallucination ou de mauvaise interprétation des offres payantes par manque de JSON-LD explicite.
            </div>
          </CardFooter>
        </Card>

        {/* Niveau 3 : Être actionnable & convertir */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs flex flex-col justify-between bg-white">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-bold py-0.5">
                Niveau 3 (30%)
              </Badge>
              <Badge variant="secondary" className="text-xs font-bold text-slate-900 bg-slate-100">
                {level3?.score ?? 50}/100
              </Badge>
            </div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-rose-600" />
              <span>Être actionnable (M2M)</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Capacité d'un agent autonome (ChatGPT Operator, Claude Computer Use) à interagir et finaliser des actions.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 pt-0">
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span>Aiguillage /llms.txt</span>
                  <span className="font-semibold text-rose-600">Non détecté</span>
                </div>
                <Progress value={20} className="h-1.5 bg-slate-100" />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span>Contrat d'outils (OpenAPI 3.1)</span>
                  <span className="font-semibold text-amber-600">Partiel</span>
                </div>
                <Progress value={40} className="h-1.5 bg-slate-100" />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span>Validation par Parcours Réels (Journeys)</span>
                  <span className="font-semibold text-indigo-600">45% de succès</span>
                </div>
                <Progress value={45} className="h-1.5 bg-slate-100" />
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-5 pt-0">
            <div className="w-full text-[11px] text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/50">
              <strong className="text-slate-900">Diagnostic :</strong> Blocage critique pour les agents M2M en l'absence de fichier `/llms.txt` direct et d'OpenAPI structurée.
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* ─── Plan de Remédiation Prioritaire (shadcn Card) ────────────────── */}
      <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white">
        <CardHeader className="p-5 sm:p-6 pb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>3 Correctifs Prioritaires pour Atteindre le Grade A (91/100)</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Actions directes générées par le moteur d'actionnabilité Viraill pour maximiser votre retour sur investissement génératif.
              </CardDescription>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/ameliorer')}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <span>Générer le patch unifié (.patch)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 pt-0 space-y-3">
          {/* Fix 1 */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200/60 flex items-center justify-center font-bold text-xs text-indigo-700 shrink-0 mt-0.5">
                1
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold text-slate-900">Déployer un fichier /llms.txt à la racine du domaine</h4>
                  <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200 py-0">
                    Impact Fort (+15 pts)
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 py-0">
                    Effort Faible (5 min)
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Fournit aux LLMs et agents un sommaire Markdown propre pointant vers vos pages clés sans coût de crawling inutile.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/ameliorer')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 self-start sm:self-auto shrink-0 h-auto p-1"
            >
              <span>Voir le code</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </div>

          {/* Fix 2 */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200/60 flex items-center justify-center font-bold text-xs text-indigo-700 shrink-0 mt-0.5">
                2
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold text-slate-900">Injecter le balisage Schema.org JSON-LD (Product & FAQPage)</h4>
                  <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200 py-0">
                    Impact Fort (+10 pts)
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 py-0">
                    Effort Faible (10 min)
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Permet à ChatGPT et Perplexity d'extraire instantanément vos fonctionnalités et plans tarifaires sans ambiguïté.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/ameliorer')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 self-start sm:self-auto shrink-0 h-auto p-1"
            >
              <span>Voir le code</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </div>

          {/* Fix 3 */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200/60 flex items-center justify-center font-bold text-xs text-indigo-700 shrink-0 mt-0.5">
                3
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold text-slate-900">Exposer le contrat machine OpenAPI 3.1 (/openapi.json)</h4>
                  <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 py-0">
                    Impact Moyen (+8 pts)
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 py-0">
                    Effort Moyen
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Transforme votre site de simple vitrine en API appelable directement par les agents autonomes de vos prospects.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/ameliorer')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 self-start sm:self-auto shrink-0 h-auto p-1"
            >
              <span>Voir le code</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
