import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Wrench,
  TrendingUp,
} from 'lucide-react';
import { UnifiedActionabilityScore } from '@/types/scoring';

interface ActionabilityLevelDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLevel?: 1 | 2 | 3;
  unified: UnifiedActionabilityScore | null;
  domain?: string;
}

export const ActionabilityLevelDetailModal: React.FC<ActionabilityLevelDetailModalProps> = ({
  isOpen,
  onClose,
  initialLevel = 1,
  unified,
  domain = 'tally.so',
}) => {
  const navigate = useNavigate();
  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3>(initialLevel);

  useEffect(() => {
    if (initialLevel) {
      setCurrentLevel(initialLevel);
    }
  }, [initialLevel]);

  const level1 = unified?.levels?.found_and_cited;
  const level2 = unified?.levels?.understood_and_preferred;
  const level3 = unified?.levels?.actionable_and_transacting;

  // Calculs métriques Niveau 1
  const l1CitationRate = level1?.metrics?.[0]?.score ?? level1?.score ?? 68;
  const l1SourceAuthority = level1?.metrics?.[1]?.score ?? Math.round(l1CitationRate * 0.9);
  const l1Sentiment = level1?.metrics?.[2]?.score ?? Math.round(l1CitationRate * 1.05);

  // Calculs métriques Niveau 2
  const l2Schema = level2?.metrics?.[0]?.score ?? 0;
  const l2Html = level2?.metrics?.[1]?.score ?? 50;
  const l2Clarity = level2?.metrics?.[3]?.score ?? level2?.metrics?.[2]?.score ?? 50;

  // Calculs métriques Niveau 3
  const l3LlmsTxt = (level3?.metrics?.[0]?.score ?? 0) > 0;
  const l3OpenApi = level3?.metrics?.[1]?.score ?? 20;
  const l3Journeys = level3?.metrics?.[4]?.score ?? 0;

  const levelsConfig = [
    {
      level: 1 as const,
      name: 'Être trouvé & cité',
      shortName: 'Trouvé & Cité',
      weight: '40%',
      score: level1?.score ?? 68,
      icon: Search,
      color: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
      description: 'Part de voix et fréquence de recommandation dans les réponses de ChatGPT, Perplexity, Gemini et Claude.',
      metrics: [
        { label: 'Taux de citation multi-modèles', value: l1CitationRate, status: `${l1CitationRate}%` },
        { label: 'Autorité des domaines sources', value: l1SourceAuthority, status: `${l1SourceAuthority}%` },
        { label: 'Sentiment comparatif vs concurrents', value: l1Sentiment, status: `${l1Sentiment}%` },
      ],
      observation:
        level1?.keyObservations?.[0] ||
        'Présence recensée mais encore devancée par les leaders sur les requêtes à forte intention commerciale.',
      actionText: 'Optimiser le prompt authority & citations',
    },
    {
      level: 2 as const,
      name: 'Être compris & choisi',
      shortName: 'Compris & Choisi',
      weight: '30%',
      score: level2?.score ?? 54,
      icon: Layers,
      color: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
      description: "Lisibilité de l'offre pour les extracteurs IA : balisage Schema.org JSON-LD, sémantique HTML et netteté des entités.",
      metrics: [
        {
          label: 'Données structurées (Schema.org)',
          value: l2Schema,
          status: `${l2Schema}% (${l2Schema >= 70 ? 'Complet' : l2Schema > 0 ? 'Partiel' : 'Absent'})`,
          isWarning: l2Schema < 50,
        },
        { label: 'Structure sémantique HTML (Hn, balises)', value: l2Html, status: `${l2Html}%` },
        { label: 'Clarté factuelle & extraction de tarifs', value: l2Clarity, status: `${l2Clarity}%` },
      ],
      observation:
        level2?.keyObservations?.[0] ||
        (l2Schema === 0
          ? 'Données structurées Schema.org absentes. Risque critique d’hallucination des tarifs et caractéristiques.'
          : "Risque d'hallucination ou de mauvaise interprétation des offres payantes par manque de JSON-LD explicite."),
      actionText: 'Générer les schémas JSON-LD',
    },
    {
      level: 3 as const,
      name: 'Être actionnable (M2M)',
      shortName: 'Actionnable M2M',
      weight: '30%',
      score: level3?.score ?? 15,
      icon: ShieldCheck,
      color: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
      description: "Capacité d'un agent autonome (ChatGPT Operator, Claude Computer Use) à interagir et finaliser des actions.",
      metrics: [
        {
          label: 'Aiguillage /llms.txt',
          value: l3LlmsTxt ? 100 : 0,
          status: l3LlmsTxt ? 'Détecté (100%)' : 'Non détecté (0%)',
          isWarning: !l3LlmsTxt,
        },
        {
          label: "Contrat d'outils (OpenAPI 3.1)",
          value: l3OpenApi,
          status: l3OpenApi >= 80 ? 'Exposé' : l3OpenApi >= 20 ? 'Partiel' : 'Absent',
          isWarning: l3OpenApi < 50,
        },
        { label: 'Validation par Parcours Réels (Journeys)', value: l3Journeys, status: `${l3Journeys}% de succès` },
      ],
      observation:
        level3?.keyObservations?.[0] ||
        "Blocage pour les agents M2M en l'absence de fichier /llms.txt direct et d'OpenAPI structurée.",
      actionText: 'Déployer les protocoles M2M',
    },
  ];

  const activeConfig = levelsConfig.find((l) => l.level === currentLevel) || levelsConfig[0];
  const Icon = activeConfig.icon;

  const handlePrev = () => {
    if (currentLevel > 1) {
      setCurrentLevel((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  const handleNext = () => {
    if (currentLevel < 3) {
      setCurrentLevel((prev) => (prev + 1) as 1 | 2 | 3);
    }
  };

  const handleNavigateAmeliorer = () => {
    onClose();
    navigate('/ameliorer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 bg-card rounded-2xl border border-border/80 shadow-lg font-sans">
        {/* ═══ Header avec Onglets Rapides ═══ */}
        <div className="p-4 sm:px-6 sm:pt-6 sm:pb-3 border-b border-border/60 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                <span>Détail du Palier d'Actionnabilité</span>
                <Badge variant="outline" className="text-xs font-mono font-semibold">
                  {domain}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Pondération canonique Viraill 2026 : Niveau 1 (40%) · Niveau 2 (30%) · Niveau 3 (30%)
              </DialogDescription>
            </div>
          </div>

          {/* Onglets des 3 Niveaux */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/60">
            {levelsConfig.map((lvl) => {
              const isSelected = lvl.level === currentLevel;
              const LvlIcon = lvl.icon;
              return (
                <button
                  key={lvl.level}
                  type="button"
                  onClick={() => setCurrentLevel(lvl.level)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer truncate ${
                    isSelected
                      ? 'bg-card text-foreground shadow-xs border border-border/80'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <LvlIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{lvl.shortName}</span>
                  <span className="text-[10px] font-mono text-muted-foreground ml-0.5">
                    ({lvl.score})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ Corps du Palier ═══ */}
        <div className="p-4 sm:p-6 space-y-5 animate-in fade-in duration-150">
          {/* Hero Banner du Niveau */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/70 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${activeConfig.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
                      Niveau {activeConfig.level} : {activeConfig.name}
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Poids {activeConfig.weight}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {activeConfig.description}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">
                  {activeConfig.score}
                  <span className="text-xs text-muted-foreground font-normal">/100</span>
                </div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Score Palier
                </div>
              </div>
            </div>

            <Progress value={activeConfig.score} className="h-1.5 bg-muted" />
          </div>

          {/* 3 Métriques Granulaires */}
          <div className="space-y-3">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Indicateurs sous-jacents
            </span>
            <div className="space-y-2.5 p-3.5 rounded-xl bg-card border border-border/70">
              {activeConfig.metrics.map((m, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground font-medium">{m.label}</span>
                    <span className={`font-mono font-semibold ${m.isWarning ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
                      {m.status}
                    </span>
                  </div>
                  <Progress value={m.value} className="h-1.5 bg-muted" />
                </div>
              ))}
            </div>
          </div>

          {/* Diagnostic & Observation */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Diagnostic & Recommandation
            </span>
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/70 flex items-start gap-2.5 text-xs text-foreground leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong>Constat clé :</strong> {activeConfig.observation}
              </div>
            </div>
          </div>

          {/* Bouton d'Action Directe vers Améliorer */}
          <Button
            onClick={handleNavigateAmeliorer}
            className="w-full text-xs font-semibold h-9 gap-2 shadow-xs cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>{activeConfig.actionText} dans l'onglet Améliorer</span>
            <ArrowRight className="w-3.5 h-3.5 ml-auto" />
          </Button>
        </div>

        {/* ═══ Footer Séquentiel (Sans bouton fermer redondant) ═══ */}
        <div className="p-3 sm:px-6 border-t border-border/60 bg-muted/10 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentLevel === 1}
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-40"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Précédent</span>
          </Button>

          <span className="text-xs text-muted-foreground font-medium">
            Palier {currentLevel} sur 3
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={currentLevel === 3}
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-40"
          >
            <span>Suivant</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
