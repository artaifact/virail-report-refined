import React, { useState } from 'react';
import { Bot, CheckCircle, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { ScoreCard } from '@/components/dashboard/ScoreCard';

// Types crawler
type CrawlerType = 'gptbot' | 'perplexitybot' | 'googlebot' | 'claudebot';

const CRAWLER_CONFIG: Record<CrawlerType, { label: string; description: string; userAgent: string }> = {
  gptbot: {
    label: 'GPTBot (OpenAI)',
    description: 'Crawler utilise par ChatGPT et les produits OpenAI',
    userAgent: 'Mozilla/5.0 AppleWebKit/537.36; compatible; GPTBot/1.0; +https://openai.com/gptbot',
  },
  perplexitybot: {
    label: 'PerplexityBot',
    description: 'Crawler utilise par Perplexity AI pour ses reponses',
    userAgent: 'Mozilla/5.0 AppleWebKit/537.36; compatible; PerplexityBot/1.0; +https://perplexity.ai',
  },
  googlebot: {
    label: 'Googlebot (AI Overview)',
    description: 'Crawler Google utilise pour AI Overview et SGE',
    userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  },
  claudebot: {
    label: 'ClaudeBot (Anthropic)',
    description: 'Crawler utilise par Claude et les produits Anthropic',
    userAgent: 'Mozilla/5.0 AppleWebKit/537.36; compatible; ClaudeBot/1.0; +https://anthropic.com',
  },
};

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
  // Donnees depuis audit_geo
  auditGeoData?: any;
  // Donnees depuis simulate
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

const stripEmojis = (text: string) => text.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{25A0}-\u{25FF}\u{2702}-\u{27B0}\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').replace(/[#*]\uFE0F?\u20E3/g, '').replace(/ {2,}/g, ' ').replace(/^ +| +$/gm, '').trim();

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
  const [expandedSection, setExpandedSection] = useState<string | null>('perspective');

  const crawler = CRAWLER_CONFIG[selectedCrawler];
  const overall = crawlScore?.overall ?? Math.round(auditGeoData?.score_global_geo ?? 0);
  const breakdown = crawlScore?.breakdown;

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  // Simuler le score par crawler (variation realiste basee sur le score global)
  const getCrawlerScore = (base: number, crawler: CrawlerType): number => {
    const offsets: Record<CrawlerType, number> = {
      gptbot: 0,
      perplexitybot: -2,
      googlebot: 3,
      claudebot: -1,
    };
    return Math.min(100, Math.max(0, base + offsets[crawler]));
  };

  // Entites detectees depuis entityCoverage
  const detectedEntities = Object.entries(entityCoverage)
    .filter(([, detected]) => detected)
    .map(([key]) => key.replace(/_/g, ' '));
  const missingEntities = Object.entries(entityCoverage)
    .filter(([, detected]) => !detected)
    .map(([key]) => key.replace(/_/g, ' '));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Selecteur de crawler */}
      <div style={{
        display: 'flex', gap: '8px', flexWrap: 'wrap',
        padding: '12px 16px',
        background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8ECF1',
      }}>
        {(Object.keys(CRAWLER_CONFIG) as CrawlerType[]).map((key) => {
          const cfg = CRAWLER_CONFIG[key];
          const isActive = selectedCrawler === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedCrawler(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 14px', borderRadius: '8px',
                border: isActive ? '2px solid #334155' : '1px solid #E2E8F0',
                background: isActive ? '#F8FAFC' : '#FFFFFF',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#0F172A' : '#64748B',
              }}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Info crawler selectionne */}
      <div style={{
        padding: '12px 16px', borderRadius: '10px',
        background: '#F8FAFC', border: '1px solid #E2E8F0',
      }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{crawler.label}</div>
        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{crawler.description}</div>
        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', fontFamily: 'monospace' }}>
          User-Agent: {crawler.userAgent}
        </div>
      </div>

      {/* Comparaison scores Original vs Optimise */}
      {originalScore && optimizedScore && (() => {
        const origAdj = getCrawlerScore(originalScore.overall, selectedCrawler);
        const optAdj = getCrawlerScore(optimizedScore.overall, selectedCrawler);
        const deltaAdj = optAdj - origAdj;
        return (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'center',
          padding: '16px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8ECF1',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Avant optimisation</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#334155' }}>{origAdj}</div>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>/100</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{
              fontSize: '16px', fontWeight: 700,
              color: deltaAdj > 0 ? '#10B981' : '#334155',
              background: '#F1F5F9',
              padding: '6px 14px', borderRadius: '8px',
            }}>
              {deltaAdj > 0 ? '+' : ''}{deltaAdj}
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>points</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Apres optimisation</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#334155' }}>{optAdj}</div>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>/100</div>
          </div>
        </div>
        );
      })()}

      {/* Scores de crawlabilite */}
      {overall > 0 && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ScoreCard
              title={`Score ${crawler.label}`}
              score={getCrawlerScore(overall, selectedCrawler)}
              description="Score de crawlabilite pour ce crawler"
            />
            {breakdown && (
              <ScoreCard
                title="Score Donnees Structurees"
                score={getCrawlerScore(breakdown.structured_data || 0, selectedCrawler)}
                description="Qualite des schemas JSON-LD"
              />
            )}
          </div>
          {breakdown && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              {breakdown.semantic_html != null && (
                <ScoreCard title="HTML Semantique" score={breakdown.semantic_html} />
              )}
              {breakdown.entity_coverage != null && (
                <ScoreCard title="Entites" score={breakdown.entity_coverage} />
              )}
              {breakdown.content_clarity != null && (
                <ScoreCard title="Clarte Contenu" score={breakdown.content_clarity} />
              )}
              {breakdown.meta_completeness != null && (
                <ScoreCard title="Metadonnees" score={breakdown.meta_completeness} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Section: Perspective du crawler */}
      <CollapsibleSection
        id="perspective"
        title={`Ce que ${crawler.label} voit`}
        isOpen={expandedSection === 'perspective'}
        onToggle={toggleSection}
        color="#64748B"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Titre et description vus par le crawler */}
          {crawlerPerspective?.title && (
            <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{crawlerPerspective.title}</div>
              {crawlerPerspective.description && (
                <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>{crawlerPerspective.description}</div>
              )}
            </div>
          )}

          {/* Plateforme detectee */}
          {platform && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Plateforme detectee :</span>
              <span style={{
                padding: '3px 10px', borderRadius: '6px',
                background: '#F5F3FF', fontSize: '12px', fontWeight: 600,
                color: '#6366F1', textTransform: 'capitalize',
              }}>{platform}</span>
            </div>
          )}

          {/* Sections semantiques */}
          {crawlerPerspective?.semantic_sections && crawlerPerspective.semantic_sections.length > 0 && (
            <div>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
                Sections semantiques detectees ({crawlerPerspective.semantic_sections.length})
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {crawlerPerspective.semantic_sections.map((section, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '6px 12px', borderRadius: '6px', background: '#FAFAFC',
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94A3B8', flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: '#334155' }}>{section}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hierarchie des headings */}
          {crawlerPerspective?.headings_hierarchy && crawlerPerspective.headings_hierarchy.length > 0 && (
            <div>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
                Hierarchie des titres
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {crawlerPerspective.headings_hierarchy.map((heading, i) => {
                  const level = parseInt(String(heading.level).replace(/\D/g, '')) || 1;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      paddingLeft: `${(level - 1) * 16}px`,
                    }}>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, color: '#94A3B8',
                        background: '#F1F5F9', padding: '1px 6px', borderRadius: '4px',
                      }}>H{level}</span>
                      <span style={{ fontSize: '12px', color: '#334155' }}>{heading.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Schemas existants */}
          {existingSchemas.length > 0 && (
            <div>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
                Donnees structurees detectees ({existingSchemas.length})
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {existingSchemas.map((schema, i) => (
                  <span key={i} style={{
                    padding: '4px 10px', borderRadius: '6px',
                    background: '#F0FDF4', border: '1px solid #BBF7D0',
                    fontSize: '12px', fontWeight: 500, color: '#15803D',
                  }}>
                    {String(schema?.['@type'] || schema)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Entites detectees */}
          {detectedEntities.length > 0 && (
            <div>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
                Entites extraites ({detectedEntities.length})
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {detectedEntities.map((entity, i) => (
                  <span key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px', borderRadius: '6px',
                    background: '#EFF6FF', border: '1px solid #BFDBFE',
                    fontSize: '12px', fontWeight: 500, color: '#1D4ED8',
                  }}>
                    <CheckCircle size={12} />
                    {entity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Entites manquantes */}
          {missingEntities.length > 0 && (
            <div>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
                Entites manquantes ({missingEntities.length})
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {missingEntities.map((entity, i) => (
                  <span key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px', borderRadius: '6px',
                    background: '#FEF2F2', border: '1px solid #FECACA',
                    fontSize: '12px', fontWeight: 500, color: '#B91C1C',
                  }}>
                    <AlertTriangle size={12} />
                    {entity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Section: Analyse LLM (Original vs Optimise) */}
      {llmAnalysis && (llmAnalysis.original || llmAnalysis.optimized) && (
        <CollapsibleSection
          id="llm-analysis"
          title="Analyse par le LLM (avant / apres)"
          isOpen={expandedSection === 'llm-analysis'}
          onToggle={toggleSection}
          color="#8B5CF6"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Original */}
            {llmAnalysis.original && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Original</span>
                  {llmAnalysis.original.confidence_score != null && (
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>Confiance: {llmAnalysis.original.confidence_score}%</span>
                  )}
                </div>
                {llmAnalysis.original.summary && (
                  <div style={{ fontSize: '12px', color: '#334155', lineHeight: '1.6', background: '#FEF2F2', padding: '10px 12px', borderRadius: '8px', border: '1px solid #FECACA' }}>
                    {stripEmojis(llmAnalysis.original.summary)}
                  </div>
                )}
                {llmAnalysis.original.key_facts && llmAnalysis.original.key_facts.length > 0 && (
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Faits cles ({llmAnalysis.original.key_facts.length})</span>
                    <ul style={{ margin: '4px 0 0', paddingLeft: '16px', fontSize: '12px', color: '#475569', lineHeight: '1.6' }}>
                      {llmAnalysis.original.key_facts.slice(0, 5).map((fact, i) => <li key={i}>{stripEmojis(fact)}</li>)}
                    </ul>
                  </div>
                )}
                {llmAnalysis.original.gaps && llmAnalysis.original.gaps.length > 0 && (
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#D97706' }}>Lacunes ({llmAnalysis.original.gaps.length})</span>
                    <ul style={{ margin: '4px 0 0', paddingLeft: '16px', fontSize: '12px', color: '#92400E', lineHeight: '1.6' }}>
                      {llmAnalysis.original.gaps.slice(0, 5).map((gap, i) => <li key={i}>{stripEmojis(gap)}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {/* Optimise */}
            {llmAnalysis.optimized && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Optimise</span>
                  {llmAnalysis.optimized.confidence_score != null && (
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>Confiance: {llmAnalysis.optimized.confidence_score}%</span>
                  )}
                </div>
                {llmAnalysis.optimized.summary && (
                  <div style={{ fontSize: '12px', color: '#334155', lineHeight: '1.6', background: '#F0FDF4', padding: '10px 12px', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                    {stripEmojis(llmAnalysis.optimized.summary)}
                  </div>
                )}
                {llmAnalysis.optimized.key_facts && llmAnalysis.optimized.key_facts.length > 0 && (
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>Faits cles ({llmAnalysis.optimized.key_facts.length})</span>
                    <ul style={{ margin: '4px 0 0', paddingLeft: '16px', fontSize: '12px', color: '#475569', lineHeight: '1.6' }}>
                      {llmAnalysis.optimized.key_facts.slice(0, 5).map((fact, i) => <li key={i}>{stripEmojis(fact)}</li>)}
                    </ul>
                  </div>
                )}
                {llmAnalysis.optimized.gaps && llmAnalysis.optimized.gaps.length > 0 && (
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#D97706' }}>Lacunes ({llmAnalysis.optimized.gaps.length})</span>
                    <ul style={{ margin: '4px 0 0', paddingLeft: '16px', fontSize: '12px', color: '#92400E', lineHeight: '1.6' }}>
                      {llmAnalysis.optimized.gaps.slice(0, 5).map((gap, i) => <li key={i}>{stripEmojis(gap)}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Section: Schemas ajoutes par l'optimisation */}
      {schemasAdded.length > 0 && (
        <CollapsibleSection
          id="schemas"
          title={`Schemas ajoutes par l'optimisation (${schemasAdded.length})`}
          isOpen={expandedSection === 'schemas'}
          onToggle={toggleSection}
          color="#6366F1"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {schemasAdded.map((schema, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', borderRadius: '8px',
                background: '#F0FDF4', border: '1px solid #BBF7D0',
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#15803D' }}>{schema}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Section: Enrichissements appliques */}
      {enrichments.length > 0 && (
        <CollapsibleSection
          id="enrichments"
          title={`Enrichissements appliques (${enrichments.length})`}
          isOpen={expandedSection === 'enrichments'}
          onToggle={toggleSection}
          color="#8B5CF6"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {enrichments.map((enrichment, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', borderRadius: '8px',
                background: '#FAFAFC', border: '1px solid #EEEDF5',
              }}>
                <CheckCircle size={14} style={{ color: '#6366F1', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#334155' }}>
                  {enrichment.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Section: Schemas manquants */}
      {missingSchemas.length > 0 && (
        <CollapsibleSection
          id="missing"
          title={`Schemas recommandes manquants (${missingSchemas.length})`}
          isOpen={expandedSection === 'missing'}
          onToggle={toggleSection}
          color="#F59E0B"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {missingSchemas.map((schema, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', borderRadius: '8px',
                background: '#FFFBEB', border: '1px solid #FDE68A',
              }}>
                <AlertTriangle size={14} style={{ color: '#D97706', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#92400E' }}>{schema}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Section: Couverture des donnees structurees */}
      {structuredDataCoverage && ((structuredDataCoverage.existing?.length ?? 0) > 0 || (structuredDataCoverage.recommended?.length ?? 0) > 0 || (structuredDataCoverage.existing_schemas?.length ?? 0) > 0 || (structuredDataCoverage.recommended_schemas?.length ?? 0) > 0) && (
        <CollapsibleSection
          id="coverage"
          title="Couverture des donnees structurees"
          isOpen={expandedSection === 'coverage'}
          onToggle={toggleSection}
          color="#06B6D4"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {(() => {
              const existingList = structuredDataCoverage.existing_schemas || structuredDataCoverage.existing || [];
              const recommendedList = structuredDataCoverage.recommended_schemas || structuredDataCoverage.recommended || [];
              return (
                <>
                  {existingList.length > 0 && (
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#15803D', marginBottom: '8px', display: 'block' }}>
                        Existants ({existingList.length})
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {existingList.map((s: string, i: number) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#15803D' }}>
                            <CheckCircle size={12} /> {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {recommendedList.length > 0 && (
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#D97706', marginBottom: '8px', display: 'block' }}>
                        Recommandes ({recommendedList.length})
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {recommendedList.map((s: string, i: number) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#D97706' }}>
                            <AlertTriangle size={12} /> {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </CollapsibleSection>
      )}

      {/* Section: Recommandations du crawler */}
      {recommendations.length > 0 && (
        <CollapsibleSection
          id="recs"
          title={`Recommandations (${recommendations.length})`}
          isOpen={expandedSection === 'recs'}
          onToggle={toggleSection}
          color="#EF4444"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {recommendations.map((rec, i) => {
              const prioBadge = rec.priority === 'high'
                ? { label: 'Haute', bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' }
                : rec.priority === 'medium'
                ? { label: 'Moyenne', bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' }
                : { label: 'Basse', bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' };
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '12px 14px', borderRadius: '10px', background: '#FAFAFC',
                }}>
                  <span style={{
                    flexShrink: 0, padding: '2px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 600,
                    color: prioBadge.color, background: prioBadge.bg, border: `1px solid ${prioBadge.border}`,
                    textTransform: 'uppercase', letterSpacing: '0.3px',
                  }}>
                    {prioBadge.label}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#1E293B', lineHeight: '1.45' }}>{stripEmojis(rec.message)}</div>
                    {rec.details && <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '3px', lineHeight: '1.45' }}>{stripEmojis(rec.details)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* Message si aucune donnee */}
      {overall === 0 && schemasAdded.length === 0 && enrichments.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '40px 24px',
          background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8ECF1',
        }}>
          <Bot size={40} style={{ color: '#CBD5E1', margin: '0 auto 12px' }} />
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#64748B', marginBottom: '4px' }}>
            Simulation non disponible
          </div>
          <div style={{ fontSize: '13px', color: '#94A3B8' }}>
            Les donnees de simulation seront disponibles une fois l'analyse terminee.
          </div>
        </div>
      )}
    </div>
  );
}

// Composant section collapsible
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
    <div style={{
      background: '#FFFFFF', borderRadius: '12px',
      border: '1px solid #E8ECF1', overflow: 'hidden',
    }}>
      <button
        onClick={() => onToggle(id)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 18px', background: 'transparent', border: 'none',
          cursor: 'pointer', transition: 'background 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '4px', height: '20px', borderRadius: '2px', background: color }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown size={16} style={{ color: '#94A3B8' }} />
        ) : (
          <ChevronRight size={16} style={{ color: '#94A3B8' }} />
        )}
      </button>
      {isOpen && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid #F1F5F9' }}>
          <div style={{ paddingTop: '14px' }}>{children}</div>
        </div>
      )}
    </div>
  );
}
