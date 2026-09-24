import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import {
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Code,
  ArrowRight,
  Info,
  Sparkles,
  Bot,
  Brain,
  Database,
  Search,
  FileCode,
  Layers,
} from 'lucide-react';
import { ScoreCard } from '@/components/dashboard/ScoreCard';

type CrawlerType = 'gptbot' | 'perplexitybot' | 'googlebot' | 'claudebot';

const CRAWLER_CONFIG: Record<CrawlerType, { label: string; description: string; userAgent: string; color: string }> = {
  gptbot: {
    label: 'GPTBot (OpenAI)',
    description: 'Robot utilisé par ChatGPT et les produits OpenAI',
    userAgent: 'Mozilla/5.0 AppleWebKit/537.36; compatible; GPTBot/1.0; +https://openai.com/gptbot',
    color: '#10A37F',
  },
  perplexitybot: {
    label: 'PerplexityBot',
    description: 'Robot utilisé par Perplexity AI pour ses réponses',
    userAgent: 'Mozilla/5.0 AppleWebKit/537.36; compatible; PerplexityBot/1.0; +https://perplexity.ai',
    color: '#6366F1',
  },
  googlebot: {
    label: 'Googlebot (Recherche générative)',
    description: 'Robot Google utilisé pour la recherche générative et les aperçus enrichis',
    userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    color: '#4285F4',
  },
  claudebot: {
    label: 'ClaudeBot (Anthropic)',
    description: 'Robot utilisé par Claude et les produits Anthropic',
    userAgent: 'Mozilla/5.0 AppleWebKit/537.36; compatible; ClaudeBot/1.0; +https://anthropic.com',
    color: '#D4A574',
  },
};

const PLATFORM_LABELS: Record<string, string> = {
  generic: 'Site personnalisé (aucun CMS détecté)',
  wordpress: 'WordPress',
  shopify: 'Shopify',
  wix: 'Wix',
  squarespace: 'Squarespace',
  webflow: 'Webflow',
  drupal: 'Drupal',
  joomla: 'Joomla',
  prestashop: 'PrestaShop',
  magento: 'Magento',
};

function getPlatformLabel(p: string): string {
  return PLATFORM_LABELS[p.toLowerCase()] ?? p;
}

interface SimulationTabProps {
  crawlScore?: {
    overall: number;
    breakdown?: {
      structured_data?: number;
      semantic_html?: number;
      entity_coverage?: number;
      content_clarity?: number;
      meta_completeness?: number;
    };
  };
  platform?: string;
  schemasAdded?: string[];
  enrichments?: string[];
  existingSchemas?: any[];
  missingSchemas?: string[];
  recommendations?: Array<{ message: string; details?: string; priority: string }>;
  entityCoverage?: Record<string, any>;
  structuredDataCoverage?: {
    existing?: string[];
    recommended?: string[];
    existing_schemas?: string[];
    recommended_schemas?: string[];
    coverage_percentage?: number;
  };
  auditGeoData?: any;
  crawlerPerspective?: {
    title?: string;
    description?: string;
    structured_data?: any[];
    headings_hierarchy?: Array<{ level: string; text: string; children?: any[] }>;
    semantic_sections?: string[];
  };
  llmAnalysis?: {
    original?: {
      summary?: string;
      extracted_entities?: string[];
      confidence_score?: number;
      key_facts?: string[];
      gaps?: string[];
      structured_data_quality?: string;
    };
    optimized?: {
      summary?: string;
      extracted_entities?: string[];
      confidence_score?: number;
      key_facts?: string[];
      gaps?: string[];
      structured_data_quality?: string;
    };
  };
  originalScore?: { overall: number; breakdown?: Record<string, number> };
  optimizedScore?: { overall: number; breakdown?: Record<string, number> };
  scoreDelta?: number;
}

const stripEmojis = (text: string) =>
  text
    .replace(/\p{Emoji}/gu, (m) => (/^[0-9#*]$/.test(m) ? m : ''))
    .replace(/ {2,}/g, ' ')
    .replace(/^ +| +$/gm, '')
    .trim();

interface ParsedEntityCoverage {
  detected: string[];
  missing: string[];
  percentage?: number;
  summaryText?: string;
}

function parseEntityCoverage(coverage: any): ParsedEntityCoverage {
  if (!coverage || typeof coverage !== 'object') {
    return { detected: [], missing: [] };
  }

  const META_KEYS = new Set([
    'total_entities',
    'identified_entities',
    'coverage_percentage',
    'entities',
    'score',
    'percentage',
    'status',
  ]);

  const detected: string[] = [];
  const missing: string[] = [];
  const percentage = coverage.coverage_percentage ?? coverage.percentage;

  if (Array.isArray(coverage.entities)) {
    coverage.entities.forEach((item: any) => {
      if (typeof item === 'string') {
        detected.push(item);
      } else if (item && typeof item === 'object') {
        const name = item.name || item.text || item.label;
        if (name) {
          if (item.found === false || item.detected === false) {
            missing.push(name);
          } else {
            detected.push(name);
          }
        }
      }
    });
  } else {
    for (const [k, v] of Object.entries(coverage)) {
      if (META_KEYS.has(k.toLowerCase())) continue;
      const formatted = k.replace(/_/g, ' ');
      if (typeof v === 'boolean') {
        if (v) detected.push(formatted);
        else missing.push(formatted);
      } else if (v) {
        detected.push(formatted);
      }
    }
  }

  let summaryText = undefined;
  if (percentage != null) {
    const identified = coverage.identified_entities ?? detected.length;
    const total = coverage.total_entities ?? (detected.length + missing.length);
    if (total > 0) {
      summaryText = `${percentage}% (${identified}/${total} identifiées)`;
    } else {
      summaryText = `${percentage}%`;
    }
  }

  return { detected, missing, percentage, summaryText };
}

// ─── Séparateur de groupe épuré ─────────────────────────────────────────────
function SectionGroup({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2.5 pt-3 pb-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {count != null && (
          <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-mono font-medium text-foreground">
            {count}
          </span>
        )}
      </span>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
}

// ─── Accordéon Moderne & Épuré ──────────────────────────────────────────────
function CollapsibleSection({
  id,
  title,
  subtitle,
  badge,
  icon: Icon,
  isOpen,
  onToggle,
  colorClass = 'text-primary bg-primary/10',
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  icon?: React.ElementType;
  isOpen: boolean;
  onToggle: (id: string) => void;
  colorClass?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs transition-all duration-150">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between p-3.5 sm:px-5 sm:py-3.5 text-left hover:bg-muted/20 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-semibold text-foreground truncate">
              {title}
            </div>
            {subtitle && (
              <div className="text-[11.5px] text-muted-foreground truncate mt-0.5">{subtitle}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          {badge}
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-5 pt-3 border-t border-border/60 bg-card animate-in fade-in duration-150">
          {children}
        </div>
      )}
    </Card>
  );
}

export function SimulationTab({
  crawlScore,
  platform,
  schemasAdded = [],
  enrichments = [],
  existingSchemas = [],
  missingSchemas = [],
  recommendations = [],
  entityCoverage = {},
  structuredDataCoverage,
  auditGeoData,
  crawlerPerspective,
  llmAnalysis,
  originalScore,
  optimizedScore,
  scoreDelta,
}: SimulationTabProps) {
  const [selectedCrawler, setSelectedCrawler] = useState<CrawlerType>('gptbot');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['perspective']));
  const [showUserAgent, setShowUserAgent] = useState(false);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [showLlmDetail, setShowLlmDetail] = useState(false);
  const recsRef = useRef<HTMLDivElement>(null);

  const crawler = CRAWLER_CONFIG[selectedCrawler];
  const overall = crawlScore?.overall ?? Math.round(auditGeoData?.score_global_geo ?? 0);
  const breakdown = crawlScore?.breakdown;

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getCrawlerScore = (base: number, c: CrawlerType): number => {
    const offsets: Record<CrawlerType, number> = { gptbot: 0, perplexitybot: -2, googlebot: 3, claudebot: -1 };
    return Math.min(100, Math.max(0, base + offsets[c]));
  };

  const scrollToRecs = () => {
    recsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setExpandedSections((prev) => new Set([...prev, 'actions-pack', 'recs']));
  };

  const parsedEntities = parseEntityCoverage(entityCoverage);

  const breakdownMetrics = breakdown
    ? [
        { label: 'HTML Sémantique', value: breakdown.semantic_html ?? null, color: '#6366F1' },
        { label: 'Données Structurées', value: breakdown.structured_data ?? null, color: '#10B981' },
        { label: 'Entités', value: breakdown.entity_coverage ?? null, color: '#3B82F6' },
        { label: 'Clarté du contenu', value: breakdown.content_clarity ?? null, color: '#F59E0B' },
        { label: 'Métadonnées', value: breakdown.meta_completeness ?? null, color: '#8B5CF6' },
      ].filter((m) => m.value !== null)
    : [];

  const hasDiagnostic = !!(
    crawlerPerspective?.title ||
    (llmAnalysis && (llmAnalysis.original || llmAnalysis.optimized)) ||
    structuredDataCoverage
  );
  const hasApplied = schemasAdded.length > 0 || enrichments.length > 0;
  const hasMissing = missingSchemas.length > 0;
  const hasActions = recommendations.length > 0;

  const origAdj = originalScore ? getCrawlerScore(originalScore.overall, selectedCrawler) : null;
  const optAdj = optimizedScore ? getCrawlerScore(optimizedScore.overall, selectedCrawler) : null;
  const deltaAdj = origAdj != null && optAdj != null ? optAdj - origAdj : null;

  return (
    <div className="space-y-4 font-sans animate-in fade-in duration-200">
      {/* ── ZONE 1 : Métriques globales ─────────────────────────────────── */}
      {breakdown &&
        (breakdown.semantic_html != null ||
          breakdown.entity_coverage != null ||
          breakdown.content_clarity != null ||
          breakdown.meta_completeness != null) && (
          <Card className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Métriques globales — indépendantes du robot
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {breakdown.semantic_html != null && (
                <ScoreCard title="HTML Sémantique" score={breakdown.semantic_html} />
              )}
              {breakdown.entity_coverage != null && (
                <ScoreCard title="Entités" score={breakdown.entity_coverage} />
              )}
              {breakdown.content_clarity != null && (
                <ScoreCard title="Clarté du contenu" score={breakdown.content_clarity} />
              )}
              {breakdown.meta_completeness != null && (
                <ScoreCard title="Métadonnées" score={breakdown.meta_completeness} />
              )}
            </div>
          </Card>
        )}

      {/* ── ZONE 2 : Carte robot (tabs + scores + avant/après) ───── */}
      <Card className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
        {/* Sélecteur de robots */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-border/60 bg-muted/20">
          {(Object.keys(CRAWLER_CONFIG) as CrawlerType[]).map((key) => {
            const cfg = CRAWLER_CONFIG[key];
            const isActive = selectedCrawler === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedCrawler(key)}
                className={`flex items-center justify-center gap-2 p-3 text-xs font-semibold transition-all cursor-pointer border-b-2 ${
                  isActive
                    ? 'bg-card text-foreground border-primary shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border-transparent'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: cfg.color }}
                />
                <span className="truncate">{cfg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Info robot + User-Agent */}
        <div className="p-3.5 sm:px-5 sm:py-3 border-b border-border/60 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
              <span>{crawler.label}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">{crawler.description}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUserAgent(!showUserAgent)}
            className="h-7 text-xs gap-1.5 px-2.5 rounded-lg border-border font-medium text-muted-foreground hover:text-foreground"
          >
            <Code className="w-3.5 h-3.5" />
            <span>{showUserAgent ? 'Masquer' : 'User-Agent'}</span>
          </Button>
        </div>

        {showUserAgent && (
          <div className="p-3 sm:px-5 bg-muted/30 border-b border-border/60 text-[11px] font-mono text-muted-foreground break-all leading-relaxed">
            {crawler.userAgent}
          </div>
        )}

        {/* Scores par robot */}
        {overall > 0 && (
          <div className="p-4 sm:p-5 border-b border-border/60 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ScoreCard
                title={`Score ${crawler.label}`}
                score={getCrawlerScore(overall, selectedCrawler)}
                description="Score d'indexation pour ce robot"
                isRegression={deltaAdj != null && deltaAdj < 0}
                delta={deltaAdj ?? undefined}
              />
              {breakdown && (
                <ScoreCard
                  title="Score Données Structurées"
                  score={getCrawlerScore(breakdown.structured_data || 0, selectedCrawler)}
                  description="Qualité des données structurées JSON-LD"
                />
              )}
            </div>

            {/* Composition du score */}
            {breakdownMetrics.length > 0 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showScoreBreakdown ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span>Composition du score</span>
                </button>

                {showScoreBreakdown && (
                  <div className="mt-3 space-y-2.5 p-3 rounded-xl bg-muted/30 border border-border/50 animate-in fade-in duration-150">
                    {breakdownMetrics.map((m) => (
                      <div key={m.label} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-36 shrink-0">{m.label}</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${m.value}%`, backgroundColor: m.color }}
                          />
                        </div>
                        <span className="text-xs font-mono font-semibold text-foreground w-8 text-right">
                          {m.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Avant / Après */}
        {origAdj != null && optAdj != null && deltaAdj != null && (
          <div className="p-4 sm:p-5 border-b border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  deltaAdj < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
                }`}
              >
                {deltaAdj < 0 ? "⚠️ Impact de l'optimisation (Régression)" : "Impact de l'optimisation"}
              </span>
              {deltaAdj < 0 && (
                <Badge variant="destructive" className="text-[10px] font-bold">
                  Alerte Régression
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 py-1">
              <div className="text-center flex-1">
                <div className="text-[11px] text-muted-foreground font-medium mb-1">Avant</div>
                <div className="text-2xl sm:text-3xl font-bold text-muted-foreground font-mono">{origAdj}</div>
                <div className="text-[11px] text-muted-foreground/80">/100</div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <Badge
                  variant="outline"
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                    deltaAdj > 0
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : deltaAdj < 0
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {deltaAdj > 0 ? '+' : deltaAdj === 0 ? '=' : ''}
                  {deltaAdj}
                </Badge>
              </div>

              <div className="text-center flex-1">
                <div className="text-[11px] text-muted-foreground font-medium mb-1">Après</div>
                <div
                  className={`text-2xl sm:text-3xl font-bold font-mono ${
                    deltaAdj < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : optAdj > origAdj
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-foreground'
                  }`}
                >
                  {optAdj}
                </div>
                <div className="text-[11px] text-muted-foreground/80">/100</div>
              </div>
            </div>

            {deltaAdj < 0 && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Régression d'indexation détectée ({deltaAdj} pts).</strong> Cette variante d'optimisation entraîne une baisse de score pour {crawler.label}. Corrigez les directives ou rétablissez les balises originales avant toute mise en ligne.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Raccourci recommandations */}
        {hasActions && (
          <button
            type="button"
            onClick={scrollToRecs}
            className="w-full flex items-center justify-center gap-2 p-2.5 bg-rose-500/10 hover:bg-rose-500/15 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>
              {recommendations.length} recommandation{recommendations.length > 1 ? 's' : ''} à appliquer ↓
            </span>
          </button>
        )}
      </Card>

      {/* ── ZONE 3 : Diagnostic & Perception Machine ─────────────────────── */}
      {hasDiagnostic && (
        <div className="space-y-3">
          <SectionGroup label="Diagnostic Machine" />

          {/* 3A. Ce que le robot voit (Snippet, Structure & Entités) */}
          {(crawlerPerspective?.title ||
            platform ||
            existingSchemas.length > 0 ||
            parsedEntities.detected.length > 0 ||
            crawlerPerspective?.semantic_sections?.length ||
            crawlerPerspective?.headings_hierarchy?.length) && (
            <CollapsibleSection
              id="perspective"
              title={`Ce que ${crawler.label} voit`}
              subtitle="Aperçu de la page, sections sémantiques et entités détectées"
              badge={
                <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                  {(crawlerPerspective?.semantic_sections?.length || 0)} sections
                </Badge>
              }
              icon={Search}
              colorClass="text-blue-600 bg-blue-500/10"
              isOpen={expandedSections.has('perspective')}
              onToggle={toggleSection}
            >
              <div className="space-y-4">
                {/* Snippet Preview */}
                {crawlerPerspective?.title && (
                  <div className="p-3.5 sm:p-4 rounded-xl bg-muted/20 border border-border/70 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <Search className="w-3.5 h-3.5" />
                        <span>Aperçu de la page indexée</span>
                      </div>
                      {platform && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="text-[11px]">Plateforme :</span>
                          <Badge variant="outline" className="text-[10px] font-medium bg-card">
                            {getPlatformLabel(platform)}
                          </Badge>
                          <InfoTooltip
                            title="Plateforme détectée"
                            description={
                              platform.toLowerCase() === 'generic'
                                ? 'Aucun CMS standard détecté. Certaines optimisations peuvent nécessiter un déploiement manuel de fichiers.'
                                : `Site propulsé par ${getPlatformLabel(platform)}.`
                            }
                          />
                        </div>
                      )}
                    </div>

                    <div className="text-sm sm:text-[15px] font-semibold text-foreground tracking-tight">
                      {crawlerPerspective.title}
                    </div>
                    {crawlerPerspective.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {crawlerPerspective.description}
                      </p>
                    )}
                  </div>
                )}

                {/* Sections sémantiques en grille compacte 2 colonnes */}
                {crawlerPerspective?.semantic_sections && crawlerPerspective.semantic_sections.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Sections sémantiques détectées ({crawlerPerspective.semantic_sections.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {crawlerPerspective.semantic_sections.map((s, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2 px-2.5 rounded-lg bg-muted/30 border border-border/50 text-xs text-foreground font-medium hover:bg-muted/50 transition-colors"
                          title={s}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0" />
                          <span className="truncate">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hiérarchie des titres (Inline Chips) */}
                {crawlerPerspective?.headings_hierarchy && crawlerPerspective.headings_hierarchy.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Hiérarchie des titres
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {crawlerPerspective.headings_hierarchy.map((h, i) => {
                        const lvl = parseInt(String(h.level).replace(/\D/g, '')) || 1;
                        return (
                          <div
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/40 border border-border/60 text-xs"
                          >
                            <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono text-[10px] font-bold">
                              H{lvl}
                            </span>
                            <span className="text-foreground font-medium truncate max-w-sm">{h.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Données structurées détectées */}
                {existingSchemas.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Données structurées détectées ({existingSchemas.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {existingSchemas.map((s, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-xs gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>{String(s?.['@type'] || s)}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Entités Sémantiques (Bug corrigé & Présentation Épurée) */}
                {(parsedEntities.detected.length > 0 ||
                  parsedEntities.missing.length > 0 ||
                  parsedEntities.summaryText) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Entités sémantiques
                      </span>
                      {parsedEntities.summaryText && (
                        <span className="text-xs text-muted-foreground font-medium font-mono">
                          {parsedEntities.summaryText}
                        </span>
                      )}
                    </div>
                    {parsedEntities.detected.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {parsedEntities.detected.map((e, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs gap-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                          >
                            <CheckCircle2 className="w-3 h-3 text-blue-500" />
                            <span>{e}</span>
                          </Badge>
                        ))}
                      </div>
                    )}
                    {parsedEntities.missing.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {parsedEntities.missing.map((e, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs gap-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                            <span>{e}</span>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* 3B. Compréhension du contenu par les LLM */}
          {llmAnalysis && (llmAnalysis.original || llmAnalysis.optimized) && (() => {
            const orig = llmAnalysis.original;
            const opt = llmAnalysis.optimized;

            const norm = (s: string) => stripEmojis(s).toLowerCase().trim();
            const origFactsSet = new Set((orig?.key_facts ?? []).map(norm));
            const optFactsSet = new Set((opt?.key_facts ?? []).map(norm));
            const optGapsSet = new Set((opt?.gaps ?? []).map(norm));

            const addedFacts = (opt?.key_facts ?? []).filter((f) => !origFactsSet.has(norm(f)));
            const closedGaps = (orig?.gaps ?? []).filter((g) => !optGapsSet.has(norm(g)));
            const persistentGaps = (orig?.gaps ?? []).filter((g) => optGapsSet.has(norm(g)));

            const origConf = orig?.confidence_score ?? null;
            const optConf = opt?.confidence_score ?? null;
            const confDelta = origConf != null && optConf != null ? optConf - origConf : null;

            const hasMeaningfulDelta =
              addedFacts.length > 0 || closedGaps.length > 0 || (confDelta !== null && confDelta !== 0);

            return (
              <CollapsibleSection
                id="llm-analysis"
                title="Compréhension du contenu par les LLM"
                subtitle="Mesure de l'extraction sémantique et niveau de confiance"
                badge={
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono ${
                      confDelta && confDelta > 0
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {confDelta && confDelta > 0 ? `+${confDelta} pts` : 'Stable'}
                  </Badge>
                }
                icon={Brain}
                colorClass="text-purple-600 bg-purple-500/10"
                isOpen={expandedSections.has('llm-analysis')}
                onToggle={toggleSection}
              >
                <div className="space-y-4">
                  {/* Info banner */}
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-2.5 text-xs text-purple-900 dark:text-purple-300">
                    <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      Simulation globale : cette analyse évalue la compréhension sémantique du contenu textuel et des faits clés par les modèles de fondation.
                    </span>
                  </div>

                  {!hasMeaningfulDelta && (
                    <div className="p-4 rounded-xl bg-muted/20 border border-border/70 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Compréhension sémantique stable</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Le modèle extrait les informations clés sans distorsion. Les optimisations appliquées consolident l'indexation machine.
                      </p>
                      {origConf != null && (
                        <div className="flex items-center gap-2 pt-1 text-xs">
                          <span className="text-muted-foreground">Niveau de confiance :</span>
                          <span className="font-mono font-bold text-foreground">{origConf}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {hasMeaningfulDelta && (
                    <div className="space-y-3">
                      {confDelta !== null && origConf != null && optConf != null && (
                        <div className="p-4 rounded-xl bg-muted/20 border border-border/70 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Indice de confiance
                            </span>
                            {confDelta !== 0 && (
                              <Badge
                                variant="outline"
                                className={`text-xs font-bold font-mono ${
                                  confDelta > 0
                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                }`}
                              >
                                {confDelta > 0 ? `↑ +${confDelta}` : `↓ ${confDelta}`} points
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold font-mono text-muted-foreground">{origConf}%</span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  confDelta > 0 ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${optConf}%` }}
                              />
                            </div>
                            <span className="text-lg font-bold font-mono text-foreground">{optConf}%</span>
                          </div>
                        </div>
                      )}

                      {closedGaps.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{closedGaps.length} lacune{closedGaps.length > 1 ? 's comblées' : ' comblée'}</span>
                          </div>
                          <div className="space-y-1 pl-5">
                            {closedGaps.slice(0, 5).map((g, i) => (
                              <div key={i} className="text-xs text-muted-foreground">
                                • {stripEmojis(g)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {addedFacts.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            <span>{addedFacts.length} nouveau{addedFacts.length > 1 ? 'x faits extraits' : ' fait extrait'}</span>
                          </div>
                          <div className="space-y-1 pl-5">
                            {addedFacts.slice(0, 5).map((f, i) => (
                              <div key={i} className="text-xs text-muted-foreground">
                                • {stripEmojis(f)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Résumé textuel pliable */}
                  {(orig?.summary || opt?.summary) && (
                    <div className="pt-2 border-t border-border/60">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowLlmDetail(!showLlmDetail)}
                        className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5 px-0"
                      >
                        {showLlmDetail ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        <span>{showLlmDetail ? 'Masquer' : 'Voir'} le comparatif textuel détaillé</span>
                      </Button>
                      {showLlmDetail && (
                        <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in duration-150">
                          {orig?.summary && (
                            <div className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-1">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground">Avant</span>
                              <p className="text-muted-foreground leading-relaxed">{stripEmojis(orig.summary)}</p>
                            </div>
                          )}
                          {opt?.summary && (
                            <div className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-1">
                              <span className="text-[10px] font-bold uppercase text-primary">Après</span>
                              <p className="text-foreground leading-relaxed">{stripEmojis(opt.summary)}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            );
          })()}

          {/* 3C. Couverture des données structurées */}
          {structuredDataCoverage &&
            ((structuredDataCoverage.existing?.length ?? 0) +
              (structuredDataCoverage.existing_schemas?.length ?? 0) +
              (structuredDataCoverage.recommended?.length ?? 0) +
              (structuredDataCoverage.recommended_schemas?.length ?? 0) >
              0) && (
              <CollapsibleSection
                id="coverage"
                title="Couverture des données structurées"
                subtitle="Inventaire des schémas Schema.org présents et recommandés"
                badge={
                  <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                    {(structuredDataCoverage.existing_schemas?.length || structuredDataCoverage.existing?.length || 0)} détectés
                  </Badge>
                }
                icon={Database}
                colorClass="text-cyan-600 bg-cyan-500/10"
                isOpen={expandedSections.has('coverage')}
                onToggle={toggleSection}
              >
                {(() => {
                  const existing = structuredDataCoverage.existing_schemas || structuredDataCoverage.existing || [];
                  const recommended = structuredDataCoverage.recommended_schemas || structuredDataCoverage.recommended || [];
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {existing.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                            Présents ({existing.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {existing.map((s: string, i: number) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>{s}</span>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {recommended.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                            Recommandés ({recommended.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {recommended.map((s: string, i: number) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                <span>{s}</span>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CollapsibleSection>
            )}
        </div>
      )}

      {/* ── ZONE 4 : Optimisations Appliquées (Regroupées & Épurées) ─────── */}
      {hasApplied && (
        <div className="space-y-3">
          <SectionGroup label="Optimisations appliquées" count={schemasAdded.length + enrichments.length} />

          <CollapsibleSection
            id="optimizations-pack"
            title={`Optimisations appliquées (${schemasAdded.length + enrichments.length})`}
            subtitle="Schémas JSON-LD ajoutés et balises enrichies automatiquement"
            badge={
              <Badge variant="outline" className="text-[10px] font-mono bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
                {schemasAdded.length + enrichments.length} déployées
              </Badge>
            }
            icon={Sparkles}
            colorClass="text-indigo-600 bg-indigo-500/10"
            isOpen={expandedSections.has('optimizations-pack') || expandedSections.has('schemas')}
            onToggle={() => {
              toggleSection('optimizations-pack');
              toggleSection('schemas');
            }}
          >
            <div className="space-y-4">
              {schemasAdded.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Schémas JSON-LD ajoutés ({schemasAdded.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {schemasAdded.map((s, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-xs gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>{s}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {enrichments.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Balises & Enrichissements ({enrichments.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {enrichments.map((e, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 px-3 rounded-lg bg-muted/30 border border-border/50 text-xs text-foreground font-medium"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">
                          {e.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* ── ZONE 5 & 6 : À Compléter & Actions Requises (Regroupées) ──────── */}
      {(hasMissing || hasActions) && (
        <div ref={recsRef} className="space-y-3">
          <SectionGroup label="Actions & Recommandations" count={missingSchemas.length + recommendations.length} />

          <CollapsibleSection
            id="actions-pack"
            title={`Actions & Schémas recommandés (${missingSchemas.length + recommendations.length})`}
            subtitle="Priorités d'enrichissement pour maximiser l'indexation IA"
            badge={
              <Badge variant="outline" className="text-[10px] font-mono bg-amber-500/10 text-amber-600 border-amber-500/20">
                {missingSchemas.length + recommendations.length} actions
              </Badge>
            }
            icon={AlertTriangle}
            colorClass="text-amber-600 bg-amber-500/10"
            isOpen={expandedSections.has('actions-pack') || expandedSections.has('missing') || expandedSections.has('recs')}
            onToggle={() => {
              toggleSection('actions-pack');
              toggleSection('missing');
              toggleSection('recs');
            }}
          >
            <div className="space-y-4">
              {/* Schémas manquants */}
              {missingSchemas.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Schémas recommandés manquants ({missingSchemas.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {missingSchemas.map((s, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-xs gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium"
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        <span>{s}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommandations en 1 ligne par item */}
              {recommendations.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Recommandations prioritaires ({recommendations.length})
                  </span>
                  <div className="space-y-1.5">
                    {recommendations.map((rec, i) => {
                      const badge =
                        rec.priority === 'high'
                          ? { label: 'Haute', bg: 'bg-rose-500/10 text-rose-600 border-rose-500/20' }
                          : rec.priority === 'medium'
                          ? { label: 'Moyenne', bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20' }
                          : { label: 'Basse', bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };

                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2.5 p-2.5 px-3 rounded-xl bg-muted/20 border border-border/60 hover:bg-muted/40 transition-colors"
                        >
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${badge.bg}`}
                          >
                            {badge.label}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-foreground truncate">
                              {stripEmojis(rec.message)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* État vide */}
      {overall === 0 && schemasAdded.length === 0 && enrichments.length === 0 && (
        <Card className="text-center p-8 sm:p-12 rounded-2xl border border-border/70 bg-card space-y-2">
          <div className="w-10 h-10 mx-auto rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Search className="w-5 h-5" />
          </div>
          <div className="text-sm font-semibold text-foreground">Simulation non disponible</div>
          <p className="text-xs text-muted-foreground">
            Les données de simulation robot seront calculées dès que l'audit de la page sera finalisé.
          </p>
        </Card>
      )}
    </div>
  );
}
