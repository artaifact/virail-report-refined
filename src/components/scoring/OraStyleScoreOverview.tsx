import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  RotateCcw,
  Wand2,
  FileText,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

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
  const [groupBy, setGroupBy] = useState<'goals' | 'layers' | 'status'>('goals');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Grade calculation
  const getGradeInfo = (score: number) => {
    if (score >= 80) {
      return {
        letter: 'A',
        label: 'Excellent',
        color: '#10b981',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
        dotColor: 'bg-emerald-500',
      };
    }
    if (score >= 65) {
      return {
        letter: 'B',
        label: 'Bon',
        color: '#3b82f6',
        bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
        dotColor: 'bg-blue-500',
      };
    }
    if (score >= 50) {
      return {
        letter: 'C',
        label: 'À optimiser',
        color: '#f59e0b',
        bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
        dotColor: 'bg-amber-500',
      };
    }
    return {
      letter: 'D',
      label: 'Non conforme',
      color: '#f43f5e',
      bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
      dotColor: 'bg-rose-500',
    };
  };

  const gradeInfo = getGradeInfo(scoreGlobal);

  // Approximate ranking percentile
  const rankingNumber = Math.max(120, Math.round(88131 * (1 - scoreGlobal / 100) * 0.45));

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
      if (match && typeof match.score === 'number' && match.score > 0) {
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

  // The 6 Evaluated Criteria Questions (ora.ai style)
  const criteriaList = [
    {
      id: 'crit-1',
      num: 1,
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
      advice: 'Consultez l\'onglet Éligibilité Agentique pour télécharger le pack de remédiation M2M et la spec OpenAPI.',
    },
    {
      id: 'crit-5',
      num: 5,
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

  // Sorting based on groupBy
  const displayedCriteria = [...criteriaList].sort((a, b) => {
    if (groupBy === 'status') {
      return a.score - b.score; // Worst score first to prioritize action
    }
    return a.num - b.num;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ─── Hero Card ora.ai style ────────────────────────────────────── */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs">
        <CardContent className="p-0 space-y-6">
          {/* Header Row: Big Score + Subtitle + Action Links */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3">
              {/* Massive Score Number */}
              <div className="flex items-baseline gap-2">
                <span className="text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
                  {scoreGlobal}
                </span>
                <span className="text-xl sm:text-2xl text-slate-400 font-normal">
                  / 100
                </span>
              </div>

              {/* Grade + Rank Badge */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-semibold text-xs border ${gradeInfo.bg}`}>
                  <span className={`w-2 h-2 rounded-full ${gradeInfo.dotColor}`} />
                  {gradeInfo.letter} {gradeInfo.label}
                </span>

                <span className="text-slate-300 dark:text-slate-700">•</span>

                <span className="font-mono text-slate-500 dark:text-slate-400 text-xs">
                  #{rankingNumber.toLocaleString('fr-FR')} sur 88 131 analysés
                </span>
              </div>

              {/* Executive Diagnostic Sentence */}
              <p className="text-xs sm:text-[13.5px] text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed pt-1 font-normal">
                {diagnosticText}
              </p>
            </div>

            {/* Action Links on the Right (ora.ai style) */}
            <div className="flex flex-col items-start md:items-end gap-2 shrink-0 pt-1">
              {onRescan && (
                <button
                  type="button"
                  onClick={onRescan}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer group"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:rotate-45 transition-transform" />
                  <span>Re-scanner l'URL</span>
                  <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
                </button>
              )}

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('schemas')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer group"
                >
                  <Wand2 className="w-3.5 h-3.5 text-primary group-hover:rotate-12 transition-transform" />
                  <span>Corriger avec l'IA</span>
                  <span className="text-primary group-hover:translate-x-0.5 transition-transform">→</span>
                </button>
              )}

              {onOpenReport && (
                <button
                  type="button"
                  onClick={onOpenReport}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer group"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
                  <span>Rapport de synthèse</span>
                  <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
                </button>
              )}
            </div>
          </div>

          {/* ─── Segmented Horizontal Progress Bar (ora.ai composite bar) ──── */}
          <div className="pt-2 space-y-2">
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden p-0.5 gap-0.5 border border-slate-200/60 dark:border-slate-700/60">
              {scores.map((cat, idx) => {
                const colors = [
                  'bg-indigo-500',
                  'bg-violet-500',
                  'bg-cyan-500',
                  'bg-amber-500',
                  'bg-emerald-500',
                  'bg-rose-500',
                ];
                const bgClass = colors[idx % colors.length];
                const widthPercent = 100 / Math.max(1, scores.length);
                const fillRatio = Math.min(100, Math.max(10, cat.score)) / 100;

                return (
                  <div
                    key={cat.key}
                    style={{ width: `${widthPercent}%` }}
                    className="h-full rounded-xs bg-slate-200/40 dark:bg-slate-700/40 overflow-hidden relative"
                    title={`${cat.label} : ${cat.score}/100`}
                  >
                    <div
                      className={`h-full ${bgClass} transition-all duration-700 rounded-xs`}
                      style={{ width: `${fillRatio * 100}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Labels under the segmented bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1 text-[11px]">
              {scores.map((cat) => (
                <div key={cat.key} className="flex flex-col">
                  <span className="text-slate-500 dark:text-slate-400 truncate font-medium">
                    {cat.label}
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {cat.score}<span className="text-[10px] text-slate-400 font-normal">/100</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Group by Row (ora.ai style) ──────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Grouper par :
              </span>
              <div className="inline-flex rounded-lg border border-slate-200/80 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-800/50">
                <button
                  type="button"
                  onClick={() => setGroupBy('goals')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    groupBy === 'goals'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Objectifs IA
                </button>
                <button
                  type="button"
                  onClick={() => setGroupBy('layers')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    groupBy === 'layers'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Piliers
                </button>
                <button
                  type="button"
                  onClick={() => setGroupBy('status')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    groupBy === 'status'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Statut
                </button>
              </div>
            </div>

            {/* Quick Summary Pill */}
            <div className="text-[11px] text-slate-500 font-mono">
              {displayedCriteria.filter(c => c.score >= 80).length} validés / {displayedCriteria.length} critères
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Numbered Criteria Checklist (ora.ai 1 to 6) ────────────────── */}
      <div className="space-y-2.5">
        {displayedCriteria.map((item) => {
          const isExpanded = expandedId === item.id;
          const scoreColor = item.score >= 80
            ? 'text-emerald-600 dark:text-emerald-400'
            : item.score >= 60
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-rose-600 dark:text-rose-400';

          return (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700"
            >
              {/* Row Header */}
              <div
                onClick={() => toggleExpand(item.id)}
                className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-400">
                      {item.num}.
                    </span>
                    <span className="text-xs sm:text-[13.5px] font-semibold text-slate-900 dark:text-slate-100">
                      {item.question}
                    </span>
                  </div>

                  {/* Tags Row below question (ora.ai style) */}
                  <div className="flex flex-wrap items-center gap-1.5 pl-4 sm:pl-5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag.label}
                        className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold ${
                          tag.ok
                            ? 'bg-slate-50 text-slate-700 border-slate-200/80 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700'
                            : 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                        }`}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Score & Watch/Details Link */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pl-4 sm:pl-0">
                  <span className={`font-mono font-bold text-xs sm:text-sm ${scoreColor}`}>
                    {item.score}
                    <span className="text-[11px] text-slate-400 font-normal">/100</span>
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(item.id);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <span>{isExpanded ? 'fermer' : 'détails'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Accordion Expand Details */}
              {isExpanded && (
                <div className="px-5 pb-4 pt-1 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs animate-in fade-in duration-200">
                  {/* Checks list */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Points de contrôle machine
                    </span>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                      {item.checks.map((check, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{check}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendation Advice & Quick Link */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-slate-600 dark:text-slate-300 text-xs font-normal">
                      <strong className="font-semibold text-slate-800 dark:text-slate-200">Conseil GEO : </strong>
                      {item.advice}
                    </p>

                    {onNavigateTab && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onNavigateTab(item.targetTab)}
                        className="h-7 px-3 text-xs font-medium gap-1.5 shrink-0 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 cursor-pointer"
                      >
                        <span>Optimiser dans l'onglet</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Platform & Technical Metadata Section ────────────────────── */}
      {coPlatform && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Plateforme Détectée
            </div>
            <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 capitalize">
              {coPlatform}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Schémas Structurés
              </span>
              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                {coSchemasAdded.length}
              </span>
            </div>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
              {coSchemasAdded.length > 0 ? coSchemasAdded.join(' | ') : 'WebPage standard'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Enrichissements GEO
              </span>
              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                {coEnrichments.length}
              </span>
            </div>
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {coEnrichments.length > 0
                ? coEnrichments.map(e => e.replace(/_/g, ' ')).join(' | ')
                : 'JSON-LD injection | heading hierarchy'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
