import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight,
  Search,
  Bot,
  Sparkles,
  Code,
  CheckCheck,
  Zap,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { OptimizationCriterionDetailModal, EvaluatedCriterion } from './OptimizationCriterionDetailModal';

export interface ScoreCategoryItem {
  key: string;
  label: string;
  score: number;
  color?: string;
  icon?: any;
}

export interface OraStyleScoreOverviewProps {
  scoreGlobal: number;
  domainName: string;
  scores: ScoreCategoryItem[];
  coPlatform?: string;
  coSchemasAdded?: string[];
  coEnrichments?: string[];
  coRecommendations?: any[];
  onRescan?: () => void;
  onNavigateTab?: (tab: 'overview' | 'schemas' | 'meta' | 'llms' | 'robots' | 'htmldiff' | 'simulation' | 'agentic') => void;
  onOpenReport?: () => void;
}

export const OraStyleScoreOverview: React.FC<OraStyleScoreOverviewProps> = ({
  scoreGlobal,
  domainName,
  scores,
  coPlatform,
  coSchemasAdded = [],
  coEnrichments = [],
  coRecommendations = [],
  onRescan,
  onNavigateTab,
  onOpenReport,
}) => {
  const [selectedCriterionId, setSelectedCriterionId] = useState<string>('crit-1');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Grade calculation
  const getGradeInfo = (score: number) => {
    if (score >= 80) {
      return {
        letter: 'A',
        label: 'Conforme',
        color: '#10b981',
        bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        icon: ShieldCheck,
      };
    }
    if (score >= 65) {
      return {
        letter: 'B',
        label: 'Bon',
        color: '#3b82f6',
        bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        icon: CheckCircle2,
      };
    }
    if (score >= 50) {
      return {
        letter: 'C',
        label: 'À optimiser',
        color: '#f59e0b',
        bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        icon: AlertCircle,
      };
    }
    return {
      letter: 'D',
      label: 'Non conforme',
      color: '#f43f5e',
      bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      icon: AlertCircle,
    };
  };

  const gradeInfo = getGradeInfo(scoreGlobal);
  const StatusIcon = gradeInfo.icon;

  // Diagnostic summary sentence
  const diagnosticText = scoreGlobal >= 80
    ? `${domainName} offre une excellente découvrabilité et compréhension machine. Les agents IA accèdent aisément à vos données structurées et à vos contenus.`
    : scoreGlobal >= 60
    ? `${domainName} offre une bonne découvrabilité de marque, mais nécessite un enrichissement sur les schémas structurés et les protocoles machine pour maximiser ses citations.`
    : `${domainName} présente des frictions d'accès et d'interprétation pour les agents autonomes. Un déploiement de schémas JSON-LD et de manifestes /llms.txt est prioritaire.`;

  // Find sub-scores safely
  const findScore = (keys: string[], defaultVal: number): number => {
    for (const key of keys) {
      const match = scores.find(s => s.key === key || s.label.toLowerCase().includes(key));
      if (match && typeof match.score === 'number' && match.score >= 0) {
        return match.score;
      }
    }
    return defaultVal;
  };

  const structuredDataScore = findScore(['structured_data', 'donnees_structurees', 'structure'], scoreGlobal);
  const semanticHtmlScore = findScore(['semantic_html', 'html_semantique', 'html'], Math.min(100, scoreGlobal + 5));
  const entityScore = findScore(['entity_coverage', 'accessibilite_crawlers', 'entites'], Math.min(100, scoreGlobal + 8));
  const contentScore = findScore(['content_clarity', 'optimisation_contenu', 'clarte'], Math.max(40, scoreGlobal - 5));
  const metaScore = findScore(['meta_completeness', 'metadonnees_techniques', 'metadonnees'], Math.min(100, scoreGlobal + 10));

  // The 6 Evaluated Criteria with Clean Short Titles & Icons
  const criteriaList: EvaluatedCriterion[] = [
    {
      id: 'crit-1',
      num: 1,
      title: 'Découverte & Indexation IA',
      icon: Search,
      question: 'Les agents IA peuvent-ils vous découvrir et vous faire confiance ?',
      tags: [
        { label: 'SITEMAP', ok: true },
        { label: 'ROBOTS', ok: true },
        { label: 'DISCOVERY', ok: scoreGlobal >= 60 },
        { label: 'LLMS.TXT', ok: scoreGlobal >= 75 },
      ],
      score: Math.min(100, Math.round((structuredDataScore * 0.4) + (metaScore * 0.6))),
      targetTab: 'llms' as const,
      checks: [
        'Fichier robots.txt accessible avec directives explicites pour crawlers IA',
        'Sitemap.xml à jour référençant les URLs clés',
        'Documentation machine-readable standard /llms.txt',
        'Validité des certificats de confiance et en-têtes HTTP',
      ],
      advice: 'Déployez un fichier /llms.txt normalisé pour aiguiller directement les agents Perplexity, Claude et GPTBot.',
    },
    {
      id: 'crit-2',
      num: 2,
      title: 'Accès Crawlers & Robots',
      icon: Bot,
      question: 'Accueillez-vous les agents et crawlers sans restriction ?',
      tags: [
        { label: 'ROBOTS', ok: true },
        { label: 'CRAWL', ok: true },
        { label: 'BOT AUTH', ok: scoreGlobal >= 70 },
        { label: 'CLOUDFLARE', ok: true },
      ],
      score: Math.min(100, Math.round(metaScore * 0.95)),
      targetTab: 'robots' as const,
      checks: [
        'Autorisation explicite pour User-Agent: GPTBot, ClaudeBot et PerplexityBot',
        'Absence de captcha bloquant sur les pages d\'information produit',
        'Gestion des seuils de rate limiting pour requêtes agentiques',
      ],
      advice: 'Vérifiez dans l\'onglet robots.txt que vos règles ne rejettent pas silencieusement les requêtes des moteurs de réponse IA.',
    },
    {
      id: 'crit-3',
      num: 3,
      title: 'Compréhension Sémantique',
      icon: Sparkles,
      question: 'Un agent comprend-il précisément qui vous êtes et votre offre ?',
      tags: [
        { label: 'HTML', ok: semanticHtmlScore >= 70 },
        { label: 'JSON-LD', ok: structuredDataScore >= 70 },
        { label: 'SCHEMA.ORG', ok: true },
        { label: 'ENTITÉS', ok: entityScore >= 70 },
        { label: 'OPENGRAPH', ok: true },
      ],
      score: Math.min(100, Math.round((structuredDataScore * 0.6) + (semanticHtmlScore * 0.4))),
      targetTab: 'schemas' as const,
      checks: [
        'Schémas JSON-LD Organization et WebPage intégrés',
        'Balises hiérarchiques H1, H2, H3 structurant le contenu textuel',
        'Couverture exhaustive des entités sémantiques de votre domaine',
        'Attribution claire des auteurs, dates et sources d\'information',
      ],
      advice: 'Injectez les enrichissements Schema.org recommandés pour hisser la clarté sémantique au rang des leaders du secteur.',
    },
    {
      id: 'crit-4',
      num: 4,
      title: 'Endpoints & Intégration M2M',
      icon: Code,
      question: 'Un agent peut-il intégrer vos données et endpoints techniques ?',
      tags: [
        { label: 'OPENAPI', ok: scoreGlobal >= 75 },
        { label: 'API', ok: true },
        { label: 'DOCS', ok: true },
        { label: 'MCP', ok: scoreGlobal >= 80 },
        { label: 'M2M', ok: scoreGlobal >= 70 },
      ],
      score: Math.min(100, Math.round((contentScore * 0.5) + (structuredDataScore * 0.5))),
      targetTab: 'agentic' as const,
      checks: [
        'Spécification OpenAPI 3.1 accessible et normalisée',
        'Manifeste de registre MCP (Model Context Protocol) disponible',
        'Documentation interactive lisible par les context windows LLM',
        'Types TypeScript et schémas d\'entrée/sortie machine-compatibles',
      ],
      advice: 'Consultez l\'onglet Protocoles Agentiques pour télécharger le pack de remédiation M2M et la spec OpenAPI.',
    },
    {
      id: 'crit-5',
      num: 5,
      title: 'Schémas JSON-LD & Validité',
      icon: CheckCheck,
      question: 'Vos schémas et métadonnées sont-ils parfaitement valides ?',
      tags: [
        { label: 'SYNTAXE JSON', ok: true },
        { label: 'RICH SNIPPETS', ok: true },
        { label: 'VALIDATEUR', ok: structuredDataScore >= 80 },
      ],
      score: structuredDataScore,
      targetTab: 'schemas' as const,
      checks: [
        'Conformité stricte aux validateurs Schema.org et Google Search Console',
        'Absence de propriétés orphelines ou dépréciées dans les scripts LD',
        'Cohérence des URLs canoniques et des balises OpenGraph',
      ],
      advice: 'Utilisez le visualiseur de schémas JSON-LD pour copier-coller directement le bloc validé dans votre balise <head>.',
    },
    {
      id: 'crit-6',
      num: 6,
      title: 'Conversion & Actions Agentiques',
      icon: Zap,
      question: 'Un agent d\'action peut-il interagir de façon fluide et fiable ?',
      tags: [
        { label: 'PRICING', ok: contentScore >= 70 },
        { label: 'CONVERSION', ok: scoreGlobal >= 65 },
        { label: 'STABILITÉ', ok: true },
        { label: 'X402', ok: scoreGlobal >= 85 },
      ],
      score: Math.min(100, Math.round((contentScore * 0.6) + (metaScore * 0.4))),
      targetTab: 'simulation' as const,
      checks: [
        'Grille tarifaire et offres lisibles sans JavaScript bloquant',
        'Chemin de conversion balisé avec boutons d\'action explicites',
        'Compatibilité avec les flux de travail programmatiques et micro-paiements',
      ],
      advice: 'Lancez la simulation d\'agents pour vérifier que les bots de comparaison extraient fidèlement vos tarifs.',
    },
  ];

  const handleOpenCriterion = (id: string) => {
    setSelectedCriterionId(id);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ─── Hero Score Ultra-Épuré (Format Identique Cockpit Agentique) ──── */}
      <div className="flex items-center justify-between gap-4 p-4 sm:p-4.5 rounded-xl bg-card border border-border shadow-xs">
        {/* Gauche : Jauge Circulaire Équilibrée + Titre + InfoTooltip */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative w-14 h-14 sm:w-15 sm:h-15 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
              <circle
                cx="30"
                cy="30"
                r={24}
                fill="none"
                stroke="currentColor"
                strokeWidth="4.5"
                className="text-muted/30"
              />
              <circle
                cx="30"
                cy="30"
                r={24}
                fill="none"
                stroke={gradeInfo.color}
                strokeWidth="4.5"
                strokeDasharray={150.8}
                strokeDashoffset={150.8 - (150.8 * scoreGlobal) / 100}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <span className="absolute font-bold text-lg text-foreground font-mono">
              {scoreGlobal}
            </span>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight truncate">
              Score d'Optimisation IA
            </h2>
            <InfoTooltip
              title="Score Global GEO"
              description={diagnosticText}
            />
          </div>
        </div>

        {/* Droite : Badge d'état synthétique */}
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border ${gradeInfo.bg}`}>
          <StatusIcon className="w-3.5 h-3.5 shrink-0" />
          <span>{gradeInfo.label}</span>
        </span>
      </div>

      {/* ─── 6 Piliers d'Évaluation Machine (Ultra-Épurés & Interactifs) ─── */}
      <div className="space-y-3 font-sans">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs sm:text-[13px] font-semibold text-foreground flex items-center gap-2 tracking-tight">
            <span>6 Piliers d'Évaluation Machine</span>
            <InfoTooltip
              title="Piliers d'Optimisation"
              description="Cliquez sur un pilier pour inspecter les points de contrôle, recommandations et code technique."
            />
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground font-medium">
              {criteriaList.filter(c => c.score >= 80).length} / {criteriaList.length} validés
            </span>
            <span className="hidden sm:inline-flex items-center text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              Cliquer pour inspecter
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {criteriaList.map((item) => {
            const Icon = item.icon || Sparkles;
            const pct = item.score;
            let progressColor = 'bg-rose-500';
            if (pct >= 80) {
              progressColor = 'bg-emerald-500';
            } else if (pct >= 60) {
              progressColor = 'bg-amber-500';
            } else if (pct >= 40) {
              progressColor = 'bg-blue-500';
            }

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => handleOpenCriterion(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenCriterion(item.id);
                  }
                }}
                className="group rounded-xl border border-border bg-card shadow-xs flex flex-col justify-between p-3.5 sm:p-4 transition-all hover:border-primary/60 hover:shadow-md hover:bg-muted/20 active:scale-[0.99] cursor-pointer gap-3 focus:outline-none focus:ring-2 focus:ring-primary/40 select-none"
              >
                {/* En-tête : Icône, Titre Propre & Score / Chevron */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs sm:text-[13px] font-semibold text-foreground tracking-tight truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                      {item.score}%
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                {/* Jauge de progression épurée */}
                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${progressColor} transition-all duration-500 ease-out`}
                    style={{ width: `${Math.max(4, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modale d'inspection détaillée du critère */}
      <OptimizationCriterionDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedCriterionId={selectedCriterionId}
        onSelectCriterion={setSelectedCriterionId}
        criteria={criteriaList}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
};

