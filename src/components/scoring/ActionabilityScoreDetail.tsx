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
  Maximize2
} from 'lucide-react';
import { UnifiedActionabilityScore } from '@/types/scoring';

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
        badgeBg: 'bg-emerald-100',
        ring: 'ring-emerald-500/20',
        progress: 'bg-emerald-500',
      };
    case 'B':
      return {
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        text: 'text-indigo-700',
        badgeBg: 'bg-indigo-100',
        ring: 'ring-indigo-500/20',
        progress: 'bg-indigo-600',
      };
    case 'C':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        badgeBg: 'bg-amber-100',
        ring: 'ring-amber-500/20',
        progress: 'bg-amber-500',
      };
    default:
      return {
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-700',
        badgeBg: 'bg-rose-100',
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
      {/* ─── Hero / Header Card ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs relative overflow-hidden">
        {/* Subtle Background Decoration */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-50/50 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
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
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${gradeColors.badgeBg} ${gradeColors.text} border ${gradeColors.border}`}>
                  {overallScore >= 80 ? 'Excellente visibilité' : overallScore >= 60 ? 'Maturité intermédiaire' : 'Optimisation requise'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
                Évaluation holistique en 3 niveaux pour <strong className="text-slate-800">{domain}</strong> : visibilité générative multi-LLM, structure sémantique et réactivité machine-to-machine.
              </p>

              {/* Échelle des grades */}
              <div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-400">
                <span className="font-medium text-slate-600">Échelle :</span>
                <span className={`px-1.5 py-0.5 rounded ${grade === 'F' ? 'bg-rose-100 font-bold text-rose-700' : 'bg-slate-100 text-slate-600'}`}>F &lt;35</span>
                <span className={`px-1.5 py-0.5 rounded ${grade === 'D' ? 'bg-amber-100 font-bold text-amber-700' : 'bg-slate-100 text-slate-600'}`}>D 35-49</span>
                <span className={`px-1.5 py-0.5 rounded ${grade === 'C' ? 'bg-amber-100 font-bold text-amber-700' : 'bg-slate-100 text-slate-600'}`}>C 50-64</span>
                <span className={`px-1.5 py-0.5 rounded ${grade === 'B' ? 'bg-indigo-100 font-bold text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>B 65-79</span>
                <span className={`px-1.5 py-0.5 rounded ${grade === 'A' || grade === 'A+' ? 'bg-emerald-100 font-bold text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>A/A+ ≥80</span>
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
              <button
                type="button"
                onClick={() => navigate('/ameliorer')}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Appliquer les correctifs</span>
              </button>

              <Link
                to="/methodologie"
                className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                title="Consulter la méthodologie scientifique Viraill"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Méthode</span>
              </Link>

              {onSwitchToFullView && isModalView && (
                <button
                  type="button"
                  onClick={onSwitchToFullView}
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                  title="Afficher en pleine page sur le tableau de bord"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pleine page</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
            <span>Actionnabilité globale</span>
            <span>{overallScore}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${gradeColors.progress} transition-all duration-700 rounded-full`}
              style={{ width: `${overallScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── The 3 Canonical Pillars Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Niveau 1 : Être trouvé & cité */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs font-bold">
                Niveau 1 (40%)
              </span>
              <span className="text-xs font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                {level1?.score ?? 50}/100
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-emerald-600" />
              <span>Être trouvé & cité</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Part de voix et fréquence de recommandation dans les réponses de ChatGPT, Perplexity, Gemini, Claude.
            </p>

            {/* Sous-métriques */}
            <div className="space-y-2.5 mt-4 pt-3 border-t border-slate-100">
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span>Taux de citation multi-modèles</span>
                  <span className="font-semibold text-slate-900">{level1?.score ?? 50}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${level1?.score ?? 50}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span>Autorité des domaines sources</span>
                  <span className="font-semibold text-slate-900">45%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span>Sentiment comparatif vs concurrents</span>
                  <span className="font-semibold text-slate-900">53%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: '53%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/50">
            <strong className="text-slate-900">Diagnostic :</strong> Présence recensée mais encore dépassée par les leaders sur les requêtes à forte intention commerciale.
          </div>
        </div>

        {/* Niveau 2 : Être compris & choisi */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/70 text-xs font-bold">
                Niveau 2 (30%)
              </span>
              <span className="text-xs font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                {level2?.score ?? 60}/100
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Être compris & choisi</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Lisibilité de l'offre pour les extracteurs IA : balisage Schema.org JSON-LD, sémantique HTML, netteté des entités.
            </p>

            {/* Sous-métriques */}
            <div className="space-y-2.5 mt-4 pt-3 border-t border-slate-100">
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span>Données structurées (Schema.org)</span>
                  <span className="font-semibold text-amber-600">50% (partiel)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '50%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span>Structure sémantique HTML (Hn, tableaux)</span>
                  <span className="font-semibold text-indigo-600">65%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span>Clarté factuelle & extraction de tarifs</span>
                  <span className="font-semibold text-indigo-600">65%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/50">
            <strong className="text-slate-900">Diagnostic :</strong> Risque d'hallucination ou de mauvaise interprétation des offres payantes par manque de JSON-LD explicite.
          </div>
        </div>

        {/* Niveau 3 : Être actionnable & convertir */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200/70 text-xs font-bold">
                Niveau 3 (30%)
              </span>
              <span className="text-xs font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                {level3?.score ?? 50}/100
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-rose-600" />
              <span>Être actionnable (M2M)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Capacité d'un agent autonome (ChatGPT Operator, Claude Computer Use) à interagir et finaliser des actions.
            </p>

            {/* Sous-métriques */}
            <div className="space-y-2.5 mt-4 pt-3 border-t border-slate-100">
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span>Aiguillage /llms.txt</span>
                  <span className="font-semibold text-rose-600">Non détecté</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '20%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span>Contrat d'outils (OpenAPI 3.1)</span>
                  <span className="font-semibold text-amber-600">Partiel</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '40%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span>Validation par Parcours Réels (Journeys)</span>
                  <span className="font-semibold text-indigo-600">45% de succès</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/50">
            <strong className="text-slate-900">Diagnostic :</strong> Blocage critique pour les agents M2M en l'absence de fichier `/llms.txt` direct et d'OpenAPI structurée.
          </div>
        </div>
      </div>

      {/* ─── Plan de Remédiation Prioritaire pour Passer au Grade A ────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>3 Correctifs Prioritaires pour Atteindre le Grade A (91/100)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Actions directes générées par le moteur d'actionnabilité Viraill pour maximiser votre retour sur investissement génératif.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/ameliorer')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>Générer le patch unifié (.patch)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Fix 1 */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200/60 flex items-center justify-center font-bold text-xs text-indigo-700 shrink-0 mt-0.5">
                1
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold text-slate-900">Déployer un fichier /llms.txt à la racine du domaine</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                    Impact Fort (+15 pts)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    Effort Faible (5 min)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Fournit aux LLMs et agents un sommaire Markdown propre pointant vers vos pages clés sans coût de crawling inutile.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/ameliorer')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <span>Voir le code généré</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
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
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                    Impact Fort (+10 pts)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    Effort Faible (10 min)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Permet à ChatGPT et Perplexity d'extraire instantanément vos fonctionnalités et plans tarifaires sans ambiguïté.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/ameliorer')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <span>Voir le code généré</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
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
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                    Impact Moyen (+8 pts)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                    Effort Moyen
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Transforme votre site de simple vitrine en API appelable directement par les agents autonomes de vos prospects.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/ameliorer')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <span>Voir le code généré</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
