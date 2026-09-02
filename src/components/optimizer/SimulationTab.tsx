import React, { useState, useRef } from 'react';
import { CheckCircle, AlertTriangle, ChevronDown, ChevronRight, Code, ArrowRight, Info, Sparkles } from 'lucide-react';
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
  entityCoverage?: Record<string, boolean>;
  structuredDataCoverage?: { existing?: string[]; recommended?: string[]; existing_schemas?: string[]; recommended_schemas?: string[]; coverage_percentage?: number };
  auditGeoData?: any;
  crawlerPerspective?: {
    title?: string;
    description?: string;
    structured_data?: any[];
    headings_hierarchy?: Array<{ level: string; text: string; children?: any[] }>;
    semantic_sections?: string[];
  };
  llmAnalysis?: {
    original?: { summary?: string; extracted_entities?: string[]; confidence_score?: number; key_facts?: string[]; gaps?: string[]; structured_data_quality?: string };
    optimized?: { summary?: string; extracted_entities?: string[]; confidence_score?: number; key_facts?: string[]; gaps?: string[]; structured_data_quality?: string };
  };
  originalScore?: { overall: number; breakdown?: Record<string, number> };
  optimizedScore?: { overall: number; breakdown?: Record<string, number> };
  scoreDelta?: number;
}

const stripEmojis = (text: string) =>
  text.replace(/\p{Emoji}/gu, (m) => /^[0-9#*]$/.test(m) ? m : '')
    .replace(/ {2,}/g, ' ').replace(/^ +| +$/gm, '').trim();

// ─── Séparateur de groupe d'accordéons ───────────────────────────────────────
function SectionGroup({ label, color, count }: { label: string; color: string; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 2px 4px' }}>
      <span style={{
        fontSize: '10px', fontWeight: 700, color,
        textTransform: 'uppercase', letterSpacing: '0.9px', whiteSpace: 'nowrap',
      }}>
        {label}{count != null ? ` (${count})` : ''}
      </span>
      <div style={{ flex: 1, height: '1px', background: '#E8ECF1' }} />
    </div>
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
    setExpandedSections(prev => {
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
    setExpandedSections(prev => new Set([...prev, 'recs']));
  };

  const detectedEntities = Object.entries(entityCoverage).filter(([, v]) => v).map(([k]) => k.replace(/_/g, ' '));
  const missingEntities = Object.entries(entityCoverage).filter(([, v]) => !v).map(([k]) => k.replace(/_/g, ' '));

  const breakdownMetrics = breakdown ? [
    { label: 'HTML Sémantique',    value: breakdown.semantic_html    ?? null, color: '#6366F1' },
    { label: 'Données Structurées',value: breakdown.structured_data  ?? null, color: '#10B981' },
    { label: 'Entités',            value: breakdown.entity_coverage  ?? null, color: '#3B82F6' },
    { label: 'Clarté du contenu',  value: breakdown.content_clarity  ?? null, color: '#F59E0B' },
    { label: 'Métadonnées',        value: breakdown.meta_completeness ?? null, color: '#8B5CF6' },
  ].filter(m => m.value !== null) : [];

  // Groupes d'accordéons
  const hasDiagnostic = !!(crawlerPerspective?.title || (llmAnalysis && (llmAnalysis.original || llmAnalysis.optimized)) || structuredDataCoverage);
  const hasApplied    = schemasAdded.length > 0 || enrichments.length > 0;
  const hasMissing    = missingSchemas.length > 0;
  const hasActions    = recommendations.length > 0;

  const origAdj = originalScore ? getCrawlerScore(originalScore.overall, selectedCrawler) : null;
  const optAdj  = optimizedScore ? getCrawlerScore(optimizedScore.overall, selectedCrawler) : null;
  const deltaAdj = (origAdj != null && optAdj != null) ? optAdj - origAdj : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ── ZONE 1 : Métriques globales ─────────────────────────────────── */}
      {breakdown && (breakdown.semantic_html != null || breakdown.entity_coverage != null || breakdown.content_clarity != null || breakdown.meta_completeness != null) && (
        <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Métriques globales — indépendantes du robot
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {breakdown.semantic_html     != null && <ScoreCard title="HTML Sémantique"    score={breakdown.semantic_html} />}
            {breakdown.entity_coverage   != null && <ScoreCard title="Entités"            score={breakdown.entity_coverage} />}
            {breakdown.content_clarity   != null && <ScoreCard title="Clarté du contenu"  score={breakdown.content_clarity} />}
            {breakdown.meta_completeness != null && <ScoreCard title="Métadonnées"         score={breakdown.meta_completeness} />}
          </div>
        </div>
      )}

      {/* ── ZONE 2 : Carte robot (tabs + info + scores + avant/après) ───── */}
      <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E8ECF1', overflow: 'hidden' }}>

        {/* Sélecteur de robots */}
        <div style={{ display: 'flex', borderBottom: '1px solid #F1F5F9' }}>
          {(Object.keys(CRAWLER_CONFIG) as CrawlerType[]).map((key, idx, arr) => {
            const cfg = CRAWLER_CONFIG[key];
            const isActive = selectedCrawler === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedCrawler(key)}
                style={{
                  flex: '1 1 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '11px 10px',
                  borderRadius: 0,
                  border: 'none',
                  borderBottom: isActive ? `2px solid ${cfg.color}` : '2px solid transparent',
                  borderRight: idx < arr.length - 1 ? '1px solid #F1F5F9' : 'none',
                  background: isActive ? '#FAFAFA' : '#FFFFFF',
                  cursor: 'pointer', transition: 'all 0.15s',
                  fontSize: '12px', fontWeight: isActive ? 700 : 500,
                  color: isActive ? cfg.color : '#94A3B8',
                  whiteSpace: 'nowrap', overflow: 'hidden',
                }}
              >
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                  background: isActive ? cfg.color : '#E2E8F0',
                  transition: 'background 0.15s',
                }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{cfg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Info robot + user-agent */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{crawler.label}</div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{crawler.description}</div>
          </div>
          <button
            onClick={() => setShowUserAgent(!showUserAgent)}
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px',
              padding: '4px 10px', borderRadius: '6px',
              border: '1px solid #E2E8F0', background: 'transparent',
              cursor: 'pointer', fontSize: '11px', color: '#94A3B8', fontFamily: 'inherit',
            }}
          >
            <Code size={11} />
            {showUserAgent ? 'Masquer' : 'User-Agent'}
          </button>
        </div>
        {showUserAgent && (
          <div style={{ padding: '8px 16px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9', fontSize: '11px', color: '#64748B', fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: '1.5' }}>
            {crawler.userAgent}
          </div>
        )}

        {/* Scores par robot */}
        {overall > 0 && (
          <div style={{ padding: '14px 16px', borderBottom: breakdownMetrics.length > 0 || deltaAdj != null || hasActions ? '1px solid #F1F5F9' : 'none' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ScoreCard
                title={`Score ${crawler.label}`}
                score={getCrawlerScore(overall, selectedCrawler)}
                description="Score d'indexation pour ce robot"
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
              <div style={{ marginTop: '10px' }}>
                <button
                  onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '11px', fontWeight: 600, color: '#94A3B8', fontFamily: 'inherit', padding: 0,
                  }}
                >
                  {showScoreBreakdown ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  Composition du score
                </button>
                {showScoreBreakdown && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {breakdownMetrics.map((m) => (
                      <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', color: '#64748B', width: '140px', flexShrink: 0 }}>{m.label}</span>
                        <div style={{ flex: 1, height: '5px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: '3px', background: m.color, width: `${m.value}%`, transition: 'width 0.4s ease' }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155', width: '28px', textAlign: 'right' }}>{m.value}</span>
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
          <div style={{ padding: '14px 16px', borderBottom: hasActions ? '1px solid #F1F5F9' : 'none' }}>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
              Impact de l'optimisation
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '10px', color: '#94A3B8', marginBottom: '4px' }}>Avant</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#94A3B8', lineHeight: 1 }}>{origAdj}</div>
                <div style={{ fontSize: '11px', color: '#CBD5E1' }}>/100</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <ArrowRight size={16} style={{ color: '#E2E8F0' }} />
                <span style={{
                  fontSize: '14px', fontWeight: 700,
                  color: deltaAdj > 0 ? '#10B981' : deltaAdj < 0 ? '#EF4444' : '#94A3B8',
                  background: deltaAdj > 0 ? '#F0FDF4' : deltaAdj < 0 ? '#FEF2F2' : '#F8FAFC',
                  padding: '2px 8px', borderRadius: '6px',
                }}>
                  {deltaAdj > 0 ? '+' : deltaAdj === 0 ? '=' : ''}{deltaAdj}
                </span>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '10px', color: '#94A3B8', marginBottom: '4px' }}>Après</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: optAdj > origAdj ? '#10B981' : '#334155', lineHeight: 1 }}>{optAdj}</div>
                <div style={{ fontSize: '11px', color: '#CBD5E1' }}>/100</div>
              </div>
            </div>
          </div>
        )}

        {/* Raccourci recommandations */}
        {hasActions && (
          <button
            onClick={scrollToRecs}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '10px 16px', border: 'none',
              background: '#FEF2F2', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              color: '#B91C1C', fontFamily: 'inherit', transition: 'background 0.15s',
            }}
          >
            <AlertTriangle size={13} />
            {recommendations.length} recommandation{recommendations.length > 1 ? 's' : ''} à appliquer ↓
          </button>
        )}
      </div>

      {/* ── ZONE 3 : Diagnostic ─────────────────────────────────────────── */}
      {hasDiagnostic && (
        <>
          <SectionGroup label="Diagnostic" color="#94A3B8" />

          {(crawlerPerspective?.title || platform || existingSchemas.length > 0 || detectedEntities.length > 0 || missingEntities.length > 0 || crawlerPerspective?.semantic_sections?.length || crawlerPerspective?.headings_hierarchy?.length) && (
            <CollapsibleSection
              id="perspective"
              title={`Ce que ${crawler.label} voit`}
              isOpen={expandedSections.has('perspective')}
              onToggle={toggleSection}
              color="#64748B"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {crawlerPerspective?.title && (
                  <div style={{ padding: '12px 14px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '3px' }}>{crawlerPerspective.title}</div>
                    {crawlerPerspective.description && (
                      <div style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.5' }}>{crawlerPerspective.description}</div>
                    )}
                  </div>
                )}

                {platform && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>Plateforme détectée :</span>
                    <span style={{ padding: '2px 8px', borderRadius: '5px', background: '#F5F3FF', fontSize: '12px', fontWeight: 600, color: '#6366F1' }}>
                      {getPlatformLabel(platform)}
                    </span>
                    {platform.toLowerCase() === 'generic' && (
                      <span style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>
                        Certaines optimisations peuvent nécessiter une intervention manuelle.
                      </span>
                    )}
                  </div>
                )}

                {crawlerPerspective?.semantic_sections && crawlerPerspective.semantic_sections.length > 0 && (
                  <SubSection title={`Sections sémantiques détectées (${crawlerPerspective.semantic_sections.length})`}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {crawlerPerspective.semantic_sections.map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 10px', borderRadius: '5px', background: '#FAFAFC' }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#CBD5E1', flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', color: '#334155' }}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </SubSection>
                )}

                {crawlerPerspective?.headings_hierarchy && crawlerPerspective.headings_hierarchy.length > 0 && (
                  <SubSection title="Hiérarchie des titres">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {crawlerPerspective.headings_hierarchy.map((h, i) => {
                        const lvl = parseInt(String(h.level).replace(/\D/g, '')) || 1;
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: `${(lvl - 1) * 14}px` }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', background: '#F1F5F9', padding: '1px 5px', borderRadius: '3px' }}>H{lvl}</span>
                            <span style={{ fontSize: '12px', color: '#334155' }}>{h.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </SubSection>
                )}

                {existingSchemas.length > 0 && (
                  <SubSection title={`Données structurées détectées (${existingSchemas.length})`}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {existingSchemas.map((s, i) => (
                        <span key={i} style={{ padding: '3px 9px', borderRadius: '5px', background: '#F0FDF4', border: '1px solid #BBF7D0', fontSize: '12px', fontWeight: 500, color: '#15803D' }}>
                          {String(s?.['@type'] || s)}
                        </span>
                      ))}
                    </div>
                  </SubSection>
                )}

                {(detectedEntities.length > 0 || missingEntities.length > 0) && (
                  <SubSection title="Entités">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {detectedEntities.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {detectedEntities.map((e, i) => (
                            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 9px', borderRadius: '5px', background: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: '11px', fontWeight: 500, color: '#1D4ED8' }}>
                              <CheckCircle size={11} /> {e}
                            </span>
                          ))}
                        </div>
                      )}
                      {missingEntities.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {missingEntities.map((e, i) => (
                            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 9px', borderRadius: '5px', background: '#FEF2F2', border: '1px solid #FECACA', fontSize: '11px', fontWeight: 500, color: '#B91C1C' }}>
                              <AlertTriangle size={11} /> {e}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </SubSection>
                )}
              </div>
            </CollapsibleSection>
          )}

          {llmAnalysis && (llmAnalysis.original || llmAnalysis.optimized) && (() => {
            const orig = llmAnalysis.original;
            const opt = llmAnalysis.optimized;

            // Normaliser pour comparaison sémantique
            const norm = (s: string) => stripEmojis(s).toLowerCase().trim();
            const origFactsSet = new Set((orig?.key_facts ?? []).map(norm));
            const origGapsSet = new Set((orig?.gaps ?? []).map(norm));
            const optFactsSet = new Set((opt?.key_facts ?? []).map(norm));
            const optGapsSet = new Set((opt?.gaps ?? []).map(norm));

            const addedFacts = (opt?.key_facts ?? []).filter(f => !origFactsSet.has(norm(f)));
            const closedGaps = (orig?.gaps ?? []).filter(g => !optGapsSet.has(norm(g)));
            const persistentGaps = (orig?.gaps ?? []).filter(g => optGapsSet.has(norm(g)));

            const origConf = orig?.confidence_score ?? null;
            const optConf = opt?.confidence_score ?? null;
            const confDelta = (origConf != null && optConf != null) ? optConf - origConf : null;

            const hasMeaningfulDelta =
              addedFacts.length > 0 ||
              closedGaps.length > 0 ||
              (confDelta !== null && confDelta !== 0);

            return (
              <CollapsibleSection
                id="llm-analysis"
                title="Compréhension du contenu par les LLM"
                isOpen={expandedSections.has('llm-analysis')}
                onToggle={toggleSection}
                color="#8B5CF6"
              >
                {/* Bannière info — clarifier la nature de la simulation */}
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                  padding: '8px 12px', marginBottom: '14px',
                  background: '#F5F3FF', borderRadius: '7px', border: '1px solid #E9D5FF',
                }}>
                  <Info size={13} style={{ color: '#8B5CF6', flexShrink: 0, marginTop: '1px' }} />
                  <span style={{ fontSize: '11px', color: '#6D28D9', lineHeight: '1.5' }}>
                    Simulation identique pour tous les robots — seule l'indexation technique
                    (schémas, robots.txt) varie par bot. Cette analyse mesure la compréhension
                    sémantique du contenu par un LLM générique.
                  </span>
                </div>

                {/* Cas 1 — Aucun changement significatif */}
                {!hasMeaningfulDelta && (
                  <div style={{
                    padding: '14px 16px', borderRadius: '8px',
                    background: '#F8FAFC', border: '1px solid #E2E8F0',
                    display: 'flex', flexDirection: 'column', gap: '8px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={15} style={{ color: '#10B981', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                        Compréhension stable
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: '1.6' }}>
                      Le LLM extrait les mêmes informations avant et après l'optimisation.
                      Les optimisations appliquées améliorent l'indexation technique
                      sans modifier le contenu sémantique perçu.
                    </p>
                    {origConf != null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Niveau de confiance
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>{origConf}%</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Cas 2 — Delta réel : hero confidence + items changés */}
                {hasMeaningfulDelta && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                    {/* Hero confidence delta avec barre visuelle */}
                    {confDelta !== null && origConf != null && optConf != null && (
                      <div style={{
                        padding: '14px 16px', borderRadius: '8px',
                        background: confDelta > 0 ? '#F0FDF4' : confDelta < 0 ? '#FEF2F2' : '#F8FAFC',
                        border: `1px solid ${confDelta > 0 ? '#BBF7D0' : confDelta < 0 ? '#FECACA' : '#E2E8F0'}`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                            Confiance de compréhension
                          </span>
                          {confDelta !== 0 && (
                            <span style={{
                              fontSize: '12px', fontWeight: 700,
                              color: confDelta > 0 ? '#15803D' : '#B91C1C',
                              padding: '2px 8px', borderRadius: '5px',
                              background: confDelta > 0 ? '#DCFCE7' : '#FEE2E2',
                            }}>
                              {confDelta > 0 ? `↑ +${confDelta}` : `↓ ${confDelta}`} points
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span style={{ fontSize: '20px', fontWeight: 700, color: '#94A3B8' }}>{origConf}</span>
                            <span style={{ fontSize: '11px', color: '#CBD5E1' }}>%</span>
                          </div>
                          <div style={{ flex: 1, height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${origConf}%`, background: '#CBD5E1' }} />
                            <div style={{ position: 'absolute', top: 0, left: `${Math.min(origConf, optConf)}%`, height: '100%', width: `${Math.abs(optConf - origConf)}%`, background: confDelta > 0 ? '#10B981' : '#EF4444' }} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span style={{ fontSize: '20px', fontWeight: 700, color: confDelta > 0 ? '#15803D' : '#334155' }}>{optConf}</span>
                            <span style={{ fontSize: '11px', color: '#CBD5E1' }}>%</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lacunes comblées */}
                    {closedGaps.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <CheckCircle size={14} style={{ color: '#10B981', flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#15803D' }}>
                            {closedGaps.length} lacune{closedGaps.length > 1 ? 's comblées' : ' comblée'} par l'optimisation
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '22px' }}>
                          {closedGaps.slice(0, 8).map((g, i) => (
                            <div key={i} style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                              • {stripEmojis(g)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Nouveaux faits clés */}
                    {addedFacts.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <Sparkles size={14} style={{ color: '#8B5CF6', flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#6D28D9' }}>
                            {addedFacts.length} nouveau{addedFacts.length > 1 ? 'x faits extraits' : ' fait extrait'} après optimisation
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '22px' }}>
                          {addedFacts.slice(0, 8).map((f, i) => (
                            <div key={i} style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                              • {stripEmojis(f)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lacunes persistantes — pour transparence */}
                    {persistentGaps.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <AlertTriangle size={14} style={{ color: '#D97706', flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#92400E' }}>
                            {persistentGaps.length} lacune{persistentGaps.length > 1 ? 's persistantes' : ' persistante'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '22px' }}>
                          {persistentGaps.slice(0, 5).map((g, i) => (
                            <div key={i} style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.5' }}>
                              • {stripEmojis(g)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Détail textuel — caché par défaut */}
                {(orig?.summary || opt?.summary) && (
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #F1F5F9' }}>
                    <button
                      onClick={() => setShowLlmDetail(!showLlmDetail)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        fontSize: '11px', fontWeight: 600, color: '#94A3B8', fontFamily: 'inherit',
                      }}
                    >
                      {showLlmDetail ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      {showLlmDetail ? 'Masquer' : 'Voir'} le résumé textuel détaillé
                    </button>
                    {showLlmDetail && (
                      <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {orig?.summary && (
                          <div>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>
                              Avant
                            </span>
                            <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6', background: '#FAFAFA', padding: '9px 11px', borderRadius: '6px', border: '1px solid #F1F5F9' }}>
                              {stripEmojis(orig.summary)}
                            </div>
                          </div>
                        )}
                        {opt?.summary && (
                          <div>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' }}>
                              Après
                            </span>
                            <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6', background: '#FAFAFA', padding: '9px 11px', borderRadius: '6px', border: '1px solid #F1F5F9' }}>
                              {stripEmojis(opt.summary)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CollapsibleSection>
            );
          })()}

          {structuredDataCoverage && ((structuredDataCoverage.existing?.length ?? 0) + (structuredDataCoverage.existing_schemas?.length ?? 0) + (structuredDataCoverage.recommended?.length ?? 0) + (structuredDataCoverage.recommended_schemas?.length ?? 0) > 0) && (
            <CollapsibleSection
              id="coverage"
              title="Couverture des données structurées"
              isOpen={expandedSections.has('coverage')}
              onToggle={toggleSection}
              color="#06B6D4"
            >
              {(() => {
                const existing = structuredDataCoverage.existing_schemas || structuredDataCoverage.existing || [];
                const recommended = structuredDataCoverage.recommended_schemas || structuredDataCoverage.recommended || [];
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    {existing.length > 0 && (
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                          Présents ({existing.length})
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {existing.map((s: string, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#15803D' }}>
                              <CheckCircle size={11} /> {s}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {recommended.length > 0 && (
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                          Recommandés ({recommended.length})
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {recommended.map((s: string, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#D97706' }}>
                              <AlertTriangle size={11} /> {s}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </CollapsibleSection>
          )}
        </>
      )}

      {/* ── ZONE 4 : Optimisations appliquées ───────────────────────────── */}
      {hasApplied && (
        <>
          <SectionGroup label="Optimisations appliquées" color="#6366F1" count={schemasAdded.length + enrichments.length} />

          {schemasAdded.length > 0 && (
            <CollapsibleSection
              id="schemas"
              title={`Schémas ajoutés (${schemasAdded.length})`}
              isOpen={expandedSections.has('schemas')}
              onToggle={toggleSection}
              color="#6366F1"
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {schemasAdded.map((s, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '6px', background: '#F0FDF4', border: '1px solid #BBF7D0', fontSize: '12px', fontWeight: 500, color: '#15803D' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />
                    {s}
                  </span>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {enrichments.length > 0 && (
            <CollapsibleSection
              id="enrichments"
              title={`Enrichissements appliqués (${enrichments.length})`}
              isOpen={expandedSections.has('enrichments')}
              onToggle={toggleSection}
              color="#6366F1"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {enrichments.map((e, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '7px', background: '#FAFAFC', border: '1px solid #EEEDF5' }}>
                    <CheckCircle size={13} style={{ color: '#6366F1', flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: '#334155' }}>
                      {e.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}
        </>
      )}

      {/* ── ZONE 5 : À compléter ────────────────────────────────────────── */}
      {hasMissing && (
        <>
          <SectionGroup label="À compléter" color="#D97706" count={missingSchemas.length} />
          <CollapsibleSection
            id="missing"
            title={`Schémas manquants (${missingSchemas.length})`}
            isOpen={expandedSections.has('missing')}
            onToggle={toggleSection}
            color="#F59E0B"
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {missingSchemas.map((s, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '6px', background: '#FFFBEB', border: '1px solid #FDE68A', fontSize: '12px', color: '#92400E' }}>
                  <AlertTriangle size={11} style={{ color: '#D97706', flexShrink: 0 }} />
                  {s}
                </span>
              ))}
            </div>
          </CollapsibleSection>
        </>
      )}

      {/* ── ZONE 6 : Actions requises ───────────────────────────────────── */}
      {hasActions && (
        <>
          <SectionGroup label="Actions requises" color="#EF4444" count={recommendations.length} />
          <div ref={recsRef}>
            <CollapsibleSection
              id="recs"
              title={`Recommandations (${recommendations.length})`}
              isOpen={expandedSections.has('recs')}
              onToggle={toggleSection}
              color="#EF4444"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {recommendations.map((rec, i) => {
                  const badge =
                    rec.priority === 'high'   ? { label: 'Haute',   bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' } :
                    rec.priority === 'medium' ? { label: 'Moyenne', bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' } :
                                                { label: 'Basse',   bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' };
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '11px 13px', borderRadius: '8px', background: '#FAFAFC' }}>
                      <span style={{
                        flexShrink: 0, padding: '2px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                        color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`,
                        textTransform: 'uppercase', letterSpacing: '0.3px',
                      }}>
                        {badge.label}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E293B', lineHeight: '1.45' }}>{stripEmojis(rec.message)}</div>
                        {rec.details && <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px', lineHeight: '1.45' }}>{stripEmojis(rec.details)}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>
          </div>
        </>
      )}

      {/* État vide */}
      {overall === 0 && schemasAdded.length === 0 && enrichments.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 24px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8ECF1' }}>
          <div style={{ width: 36, height: 36, margin: '0 auto 12px', borderRadius: '50%', background: '#F1F5F9' }} />
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#64748B', marginBottom: '4px' }}>Simulation non disponible</div>
          <div style={{ fontSize: '12px', color: '#94A3B8' }}>Les données seront disponibles une fois l'analyse terminée.</div>
        </div>
      )}
    </div>
  );
}

// ─── Sous-titre interne aux accordéons ───────────────────────────────────────
function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '7px' }}>
        {title}
      </span>
      {children}
    </div>
  );
}

// ─── Accordéon générique ─────────────────────────────────────────────────────
function CollapsibleSection({
  id, title, isOpen, onToggle, color, children,
}: {
  id: string;
  title: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8ECF1', overflow: 'hidden' }}>
      <button
        onClick={() => onToggle(id)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '13px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
          transition: 'background 0.15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{title}</span>
        </div>
        {isOpen
          ? <ChevronDown  size={15} style={{ color: '#CBD5E1', flexShrink: 0 }} />
          : <ChevronRight size={15} style={{ color: '#CBD5E1', flexShrink: 0 }} />}
      </button>
      {isOpen && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #F8FAFC' }}>
          <div style={{ paddingTop: '12px' }}>{children}</div>
        </div>
      )}
    </div>
  );
}
