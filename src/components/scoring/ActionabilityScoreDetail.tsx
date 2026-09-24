import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  Search,
  TrendingUp,
  Layers,
  BookOpen,
  Wrench,
  ChevronRight,
} from 'lucide-react';
import { UnifiedActionabilityScore } from '@/types/scoring';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { MethodologyModal } from './MethodologyModal';
import { ActionabilityLevelDetailModal } from './ActionabilityLevelDetailModal';

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
  isModalView = false,
}) => {
  const navigate = useNavigate();
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [selectedLevelForModal, setSelectedLevelForModal] = useState<1 | 2 | 3 | null>(null);

  const overallScore = unified?.overallScore ?? (unified as any)?.score ?? 63;
  const grade = unified?.grade || 'C';

  const level1 = unified?.levels?.found_and_cited;
  const level2 = unified?.levels?.understood_and_preferred;
  const level3 = unified?.levels?.actionable_and_transacting;

  // Calcul dynamique du gain potentiel pour atteindre le Grade A (91 pts)
  const potentialGain = Math.max(8, 91 - overallScore);
  const fixesCount = unified?.topFixes?.length || 3;

  // Grade color helper
  const getGradeColor = (g: string) => {
    if (g === 'A' || g === 'A+') return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
    if (g === 'B') return 'text-blue-500 border-blue-500/30 bg-blue-500/10';
    if (g === 'C') return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-500 border-rose-500/30 bg-rose-500/10';
  };

  const getStrokeColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 50) return '#3B82F6';
    return '#F43F5E';
  };

  // Dimensions anneau circulaire compact
  const size = 56;
  const strokeWidth = 4.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, overallScore)) / 100) * circumference;

  const l2Schema = level2?.metrics?.[0]?.score ?? 0;
  const l3LlmsTxt = (level3?.metrics?.[0]?.score ?? 0) > 0;

  return (
    <div className={`space-y-5 font-sans animate-in fade-in duration-200 ${isModalView ? 'p-1' : 'w-full'}`}>
      {/* ─── Hero / Header Card Épuré ──────────────────────────────── */}
      <Card className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {/* Jauge Circulaire Équilibrée 56px */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg width={size} height={size} className="transform -rotate-90">
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  className="text-muted/40"
                  fill="transparent"
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={getStrokeColor(overallScore)}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-base sm:text-lg font-bold font-mono tracking-tight text-foreground leading-none">
                  {overallScore}
                </span>
              </div>
            </div>

            {/* Titre, Grade et Subtitle */}
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  Score d'Actionnabilité Unifié : <span className="text-primary">{overallScore}/100</span>
                </h2>
                <Badge
                  variant="outline"
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${getGradeColor(grade)}`}
                >
                  Grade {grade}
                </Badge>
                <Badge
                  variant={overallScore >= 80 ? 'default' : overallScore >= 50 ? 'secondary' : 'destructive'}
                  className="text-xs font-medium"
                >
                  {overallScore >= 80 ? 'Excellente visibilité' : overallScore >= 50 ? 'Maturité intermédiaire' : 'Optimisation requise'}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                <span>
                  Audit pour <strong className="text-foreground">{domain}</strong>
                </span>
                <InfoTooltip
                  title="Score d'Actionnabilité Unifié"
                  description="Modèle canonique Virail 2026 : Être trouvé (40%) • Être compris (30%) • Être actionnable (30%). Évalue votre visibilité générative multi-LLM, structure sémantique et réactivité machine-to-machine."
                />
              </div>
            </div>
          </div>

          {/* Quick Actions & Potentiel */}
          <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/70 bg-muted/30 text-xs">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="font-semibold text-foreground">Potentiel : +{potentialGain} pts</span>
              <span className="text-muted-foreground">• Grade A possible</span>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/ameliorer')}
              className="h-8 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Appliquer</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMethodologyOpen(true)}
              className="h-8 text-xs font-medium cursor-pointer border-border"
            >
              <BookOpen className="w-3.5 h-3.5 mr-1" />
              <span>Méthode</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* ─── Control Bar for the 3 Level Cards ─────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <span>Paliers d'Actionnabilité</span>
        </h3>
      </div>

      {/* ─── The 3 Canonical Pillars Cards (Neutres, Épurées & Compactes) ───── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Niveau 1 : Être trouvé & cité */}
        <div
          onClick={() => setSelectedLevelForModal(1)}
          className="rounded-xl border border-border/70 bg-card p-3.5 sm:p-4 hover:bg-muted/20 hover:border-border transition-colors cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-muted text-foreground flex items-center justify-center shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-foreground tracking-tight truncate">
                Être trouvé & cité
              </h4>
              <span className="text-xs text-muted-foreground font-mono">
                Niveau 1 (40%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold font-mono text-foreground">
              {level1?.score ?? 68}/100
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Niveau 2 : Être compris & choisi */}
        <div
          onClick={() => setSelectedLevelForModal(2)}
          className="rounded-xl border border-border/70 bg-card p-3.5 sm:p-4 hover:bg-muted/20 hover:border-border transition-colors cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-muted text-foreground flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-foreground tracking-tight truncate">
                Être compris & choisi
              </h4>
              <span className="text-xs text-muted-foreground font-mono">
                Niveau 2 (30%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold font-mono text-foreground">
              {level2?.score ?? 54}/100
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Niveau 3 : Être actionnable (M2M) */}
        <div
          onClick={() => setSelectedLevelForModal(3)}
          className="rounded-xl border border-border/70 bg-card p-3.5 sm:p-4 hover:bg-muted/20 hover:border-border transition-colors cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-muted text-foreground flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-foreground tracking-tight truncate">
                Être actionnable (M2M)
              </h4>
              <span className="text-xs text-muted-foreground font-mono">
                Niveau 3 (30%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold font-mono text-foreground">
              {level3?.score ?? 15}/100
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>

      {/* ─── Plan de Remédiation Prioritaire (Épuré en 1 Ligne par Action) ── */}
      <Card className="rounded-2xl border border-border/70 shadow-xs bg-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-foreground">
              {fixesCount} Correctifs Prioritaires pour le Grade A (91/100)
            </h3>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/ameliorer')}
            className="text-xs font-semibold gap-1.5 cursor-pointer shadow-xs h-8"
          >
            <span>Générer le patch unifié (.patch)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="space-y-2">
          {(unified?.topFixes && unified.topFixes.length > 0
            ? unified.topFixes
            : [
                {
                  id: 'fix_llms_txt',
                  title: 'Déployer un fichier /llms.txt à la racine du domaine',
                  impact: 'high',
                  effort: 'low',
                  category: 'Agent-Readiness',
                },
                {
                  id: 'fix_schema_org',
                  title: 'Injecter le balisage Schema.org JSON-LD (Product & FAQPage)',
                  impact: 'high',
                  effort: 'low',
                  category: 'Sémantique',
                },
                {
                  id: 'fix_openapi',
                  title: 'Exposer le contrat machine OpenAPI 3.1 (/openapi.json)',
                  impact: 'medium',
                  effort: 'medium',
                  category: 'M2M & API',
                },
              ]
          ).map((fix, idx) => (
            <div
              key={fix.id || idx}
              onClick={() => navigate('/ameliorer')}
              className="p-3 px-3.5 rounded-xl border border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-6 h-6 rounded-md bg-muted text-foreground font-semibold flex items-center justify-center text-xs shrink-0 border border-border/80">
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-semibold text-foreground truncate">{fix.title}</h4>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-normal ${
                        fix.impact === 'high' || (fix as any).impact === 'critical'
                          ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                          : 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10'
                      }`}
                    >
                      Impact {fix.impact === 'high' || (fix as any).impact === 'critical' ? 'Fort (+15 pts)' : 'Moyen (+8 pts)'}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      Effort {fix.effort === 'low' ? 'Faible (5-10 min)' : 'Moyen'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground shrink-0 self-end sm:self-auto">
                <span>Voir le code</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ─── Modale Interactive d'Inspection Détaillée des Paliers ───────── */}
      <ActionabilityLevelDetailModal
        isOpen={selectedLevelForModal !== null}
        onClose={() => setSelectedLevelForModal(null)}
        initialLevel={selectedLevelForModal || 1}
        unified={unified}
        domain={domain}
      />

      {/* Methodology Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
};
