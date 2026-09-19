import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, ChevronRight, Calendar, Sparkles } from 'lucide-react';
import AskAIButton from '@/components/AskAIButton';
import { modelLogos } from '@/components/ModelLogosCarousel';
import type { FullReportData, ReportResponse } from '@/lib/api';
import { getCompetitorAnalysisFromReport, mapAnalyseConcurrentielleV1ToResponse } from '@/services/competitorAnalysisService';
import { generateFullReportPdf } from '@/services/reportPdfService';

// Couleurs par modèle d'IA
export const MODEL_COLORS: Record<string, string> = {
  'ChatGPT': '#86CEAC',
  'Perplexity': '#8ECFD9',
  'Gemini': '#93B5E1',
  'Claude': '#E0C08A',
  'Mistral': '#F0B88A',
  'DeepSeek': '#A5A7E0',
  'Meta AI': '#88B5E8',
  'Qwen': '#B8A3DB',
  'Grok': '#E8A0A0',
};

export const MODEL_COLORS_FALLBACK = ['#B5A8D8', '#DBA8C4', '#8DD0C4', '#E0C68A', '#A5A7E0', '#8BC5E0'];

export const getModelLogo = (modelName: string): string | null => {
  if (!modelName) return null;
  const name = modelName.toLowerCase();
  for (const [key, path] of Object.entries(modelLogos)) {
    if (name.includes(key)) return path;
  }
  return null;
};

/**
 * Extrait le score target_geo_score depuis les différentes structures du rapport
 */
export const extractTargetGeoScore = (reportData: FullReportData | null): number | null => {
  if (!reportData) return null;
  const raw = reportData as any;

  // 1. Directement sur root ou report
  const directCandidates = [
    raw.target_geo_score,
    raw.report?.target_geo_score,
    raw.llmo_report?.target_geo_score,
    raw.metadata?.target_geo_score,
    raw.report?.metadata?.target_geo_score,
    raw.target_positioning?.target_geo_score,
    raw.report?.target_positioning?.target_geo_score,
  ];
  for (const c of directCandidates) {
    if (c !== undefined && c !== null && c !== '') {
      const num = Number(c);
      if (!isNaN(num)) return num > 0 && num <= 1 ? Math.round(num * 100) : Math.round(num);
    }
  }

  // 2. Dans analyses concurrentielles
  const compCandidates = [
    raw.analyse_concurrentielle_v3?.target_positioning?.target_geo_score,
    raw.analyse_concurrentielle_v3?.target_geo_score,
    raw.competitor_analysis?.target_positioning?.target_geo_score,
    raw.competitor_analysis?.target_geo_score,
    raw.analyse_concurrentielle_v1?.target_positioning?.target_geo_score,
    raw.analyse_concurrentielle_v1?.target_geo_score,
  ];
  for (const c of compCandidates) {
    if (c !== undefined && c !== null && c !== '') {
      const num = Number(c);
      if (!isNaN(num)) return num > 0 && num <= 1 ? Math.round(num * 100) : Math.round(num);
    }
  }

  // 3. Mapping via mapAnalyseConcurrentielleV1ToResponse
  const compData = raw.analyse_concurrentielle_v1 || raw.competitor_analysis;
  if (compData) {
    try {
      const mapped = mapAnalyseConcurrentielleV1ToResponse(raw.report?.id || 0, compData);
      const score = mapped?.target_positioning?.target_geo_score;
      if (score !== undefined && score !== null && score !== '') {
        const num = Number(score);
        if (!isNaN(num)) return num > 0 && num <= 1 ? Math.round(num * 100) : Math.round(num);
      }
    } catch {}
  }

  // 4. Score produit analysé
  const scoreProduit = raw.report?.score_produit_analyse ?? raw.score_produit_analyse;
  if (scoreProduit !== undefined && scoreProduit !== null) {
    const num = Number(scoreProduit);
    if (!isNaN(num)) return num > 0 && num <= 1 ? Math.round(num * 100) : Math.round(num);
  }

  // 5. Moyenne depuis les modules d'analyses
  if (Array.isArray(raw.analyses) && raw.analyses.length > 0) {
    const geoScores = raw.analyses
      .map((a: any) => a.modules?.audit_geo?.score_global_geo)
      .filter((s: any) => typeof s === 'number' && !isNaN(s));
    if (geoScores.length > 0) {
      const avg = geoScores.reduce((sum: number, val: number) => sum + val, 0) / geoScores.length;
      return avg > 0 && avg <= 1 ? Math.round(avg * 100) : Math.round(avg);
    }
  }

  // 6. Crawl optimizer
  const crawlOptScore = raw.crawl_optimizer?.score?.overall ?? (raw as any)?.crawl_optimizer?.analyze?.score?.overall;
  if (crawlOptScore !== undefined && crawlOptScore !== null) {
    const num = Number(crawlOptScore);
    if (!isNaN(num)) return num > 0 && num <= 1 ? Math.round(num * 100) : Math.round(num);
  }

  // 7. Metadata score
  if (raw.report?.metadata?.score !== undefined && raw.report?.metadata?.score !== null) {
    const num = Number(raw.report.metadata.score);
    if (!isNaN(num)) return num > 0 && num <= 1 ? Math.round(num * 100) : Math.round(num);
  }

  return null;
};

/**
 * Extrait le score d'éligibilité agentique
 */
export const extractAgenticScore = (reportData: FullReportData | null): number | null => {
  if (!reportData) return null;
  const raw = reportData as any;

  const directCandidates = [
    raw.agentic_score,
    raw.report?.agentic_score,
    raw.metadata?.agentic_score,
    raw.report?.metadata?.agentic_score,
    raw.agentic_readiness?.score,
    raw.report?.agentic_readiness?.score,
    raw.scan_data?.score,
    raw.llmo_report?.agentic_score,
    raw.agentic_scan?.score,
  ];
  for (const c of directCandidates) {
    if (c !== undefined && c !== null && c !== '') {
      const num = Number(c);
      if (!isNaN(num)) return Math.max(0, Math.min(100, Math.round(num)));
    }
  }

  try {
    const url = raw.report?.url || raw.llmo_report?.url || raw.url || raw.analyse_citation?.client_site_url;
    if (url) {
      const hostname = new URL(url).hostname.replace('www.', '');
      const cached = localStorage.getItem(`viraill_agentic_score_${hostname}`) ||
        localStorage.getItem(`viraill_agentic_score_${url}`);
      if (cached) {
        const num = Number(cached);
        if (!isNaN(num)) return Math.max(0, Math.min(100, Math.round(num)));
      }
    }
  } catch {}

  const geoScore = extractTargetGeoScore(reportData) ?? 50;
  let estimated = Math.round(geoScore * 0.55);
  if (raw.crawl_optimizer?.llms_txt?.exists) estimated += 15;
  if (raw.crawl_optimizer?.robots_txt?.exists) estimated += 10;
  if (raw.crawl_optimizer?.schemas && raw.crawl_optimizer.schemas.length > 0) estimated += 10;
  return Math.max(15, Math.min(95, estimated));
};

interface CitationsChartProps {
  reportData: FullReportData | null;
  targetGeoScore?: number | null;
  agenticScore?: number | null;
}

export function CitationsChart({ reportData, targetGeoScore, agenticScore }: CitationsChartProps) {
  const navigate = useNavigate();
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);
  const [isScoreGeoHovered, setIsScoreGeoHovered] = useState(false);
  const [isScoreAgenticHovered, setIsScoreAgenticHovered] = useState(false);
  const [isWheelHovered, setIsWheelHovered] = useState(false);

  const getTotalCitations = () => {
    if (reportData?.analyse_citation?.total_citations !== undefined) {
      return reportData.analyse_citation.total_citations;
    }
    if (!reportData?.analyses || reportData.analyses.length === 0) return 0;
    const totalFromApi = reportData.analyses.reduce((sum, analysis) => {
      const geoData = analysis.modules?.audit_geo;
      const citations = geoData?.citations || geoData?.mentions || 0;
      return sum + Number(citations);
    }, 0);
    return totalFromApi > 0 ? totalFromApi : 0;
  };

  const totalCitations = getTotalCitations();
  const citationsByModel = (reportData?.analyse_citation?.citations_by_model || {}) as Record<string, number>;

  // Regrouper par nom commercial
  const grouped = useMemo(() => {
    const map: Record<string, number> = {};
    Object.entries(citationsByModel).forEach(([raw, count]) => {
      const commercial = (() => {
        const n = raw.toLowerCase().trim();
        if (n.includes('sonar')) return 'Perplexity';
        if (n.includes('claude')) return 'Claude';
        if (n.startsWith('gpt') || n === 'chatgpt') return 'ChatGPT';
        if (n.includes('gemini') || n === 'ai overview' || n === 'ai-overview') return 'Gemini';
        if (n.includes('mistral') || n.includes('mixtral')) return 'Mistral';
        if (n.includes('deepseek')) return 'DeepSeek';
        if (n.includes('llama')) return 'Meta AI';
        if (n.includes('qwen')) return 'Qwen';
        if (n.includes('grok')) return 'Grok';
        return raw;
      })();
      map[commercial] = (map[commercial] || 0) + (count as number);
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [citationsByModel]);

  const cx = 140, cy = 140, r = 95;
  const totalSweep = 360;

  const polarToCartesian = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const describeArc = (start: number, end: number, arcR: number) => {
    if (end - start >= 360) end = start + 359.99;
    const s = polarToCartesian(start, arcR);
    const e = polarToCartesian(end, arcR);
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${arcR} ${arcR} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const hasModels = grouped.length > 0 && totalCitations > 0;
  const activeModels = grouped.filter(m => m.count > 0);
  let fallbackIdx = 0;
  let currentAngle = -90;

  let legendFallbackIdx = 0;
  const modelColors = hasModels ? activeModels.map((model) => ({
    name: model.name,
    count: model.count,
    color: MODEL_COLORS[model.name] || MODEL_COLORS_FALLBACK[legendFallbackIdx++ % MODEL_COLORS_FALLBACK.length],
    pct: totalCitations > 0 ? Math.round((model.count / totalCitations) * 100) : 0,
  })) : [];

  const hoveredData = hoveredModel ? modelColors.find(m => m.name === hoveredModel) : null;

  const handleCitationsWheel = (e: React.WheelEvent) => {
    if (modelColors.length === 0) return;
    const currentIndex = modelColors.findIndex(m => m.name === hoveredModel);
    const direction = e.deltaY > 0 ? 1 : -1;
    let nextIndex = currentIndex === -1 ? 0 : currentIndex + direction;
    if (nextIndex < 0) nextIndex = modelColors.length - 1;
    if (nextIndex >= modelColors.length) nextIndex = 0;
    setHoveredModel(modelColors[nextIndex].name);
  };

  // Score GEO
  const normalizedGeoScore = targetGeoScore != null ? Math.max(0, Math.min(100, Math.round(targetGeoScore))) : null;
  const geoStrokeColor = normalizedGeoScore != null
    ? (normalizedGeoScore >= 75 ? '#10B981' : normalizedGeoScore >= 50 ? '#6366F1' : '#F59E0B')
    : '#10B981';
  const geoGradStart = normalizedGeoScore != null
    ? (normalizedGeoScore >= 75 ? '#34D399' : normalizedGeoScore >= 50 ? '#818CF8' : '#FBBF24')
    : '#34D399';
  const geoCirc = 2 * Math.PI * r;
  const geoDashoffset = normalizedGeoScore != null ? geoCirc - (normalizedGeoScore / 100) * geoCirc : 0;
  const geoStatusLabel = normalizedGeoScore != null
    ? (normalizedGeoScore >= 75 ? 'Visibilité optimale' : normalizedGeoScore >= 50 ? 'Bonne visibilité' : 'À améliorer')
    : '';

  // Score Agentique
  const effectiveAgenticScore = agenticScore ?? extractAgenticScore(reportData) ?? (normalizedGeoScore != null ? Math.round(normalizedGeoScore * 0.65) : 58);
  const normalizedAgenticScore = Math.max(0, Math.min(100, Math.round(effectiveAgenticScore)));
  const agenticStrokeColor = normalizedAgenticScore >= 80 ? '#10B981' : normalizedAgenticScore >= 50 ? '#6366F1' : '#F43F5E';
  const agenticGradStart = normalizedAgenticScore >= 80 ? '#34D399' : normalizedAgenticScore >= 50 ? '#818CF8' : '#FB7185';
  const agenticCirc = 2 * Math.PI * r;
  const agenticDashoffset = agenticCirc - (normalizedAgenticScore / 100) * agenticCirc;
  const agenticStatusLabel = normalizedAgenticScore >= 80 ? 'Agentic Native' : normalizedAgenticScore >= 50 ? 'Agent-Friendly' : 'Non Conforme (M2M)';

  return (
    <Card className="border-border/60 shadow-xs bg-card/60 backdrop-blur-xs overflow-visible">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col xl:flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-12 w-full">
          {/* 1. Roue Citations totales */}
          <HoverCard openDelay={100} closeDelay={150}>
            <HoverCardTrigger asChild>
              <div
                className="relative w-[180px] sm:w-[200px] shrink-0 mx-auto group cursor-pointer"
                onMouseEnter={() => {
                  setIsWheelHovered(true);
                  if (!hoveredModel && activeModels.length > 0) {
                    setHoveredModel(activeModels[0].name);
                  }
                }}
                onMouseLeave={() => {
                  setIsWheelHovered(false);
                  setHoveredModel(null);
                }}
                onWheel={handleCitationsWheel}
              >
                <svg viewBox="0 0 280 280" className="w-full h-auto mx-auto cursor-pointer">
                  <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" className="text-muted/40" strokeWidth="32" />
                  {hasModels && activeModels.map((model) => {
                    const fraction = model.count / totalCitations;
                    const segSweep = fraction * totalSweep;
                    const segStart = currentAngle;
                    const segEnd = segStart + segSweep;
                    currentAngle = segEnd;
                    const color = MODEL_COLORS[model.name] || MODEL_COLORS_FALLBACK[fallbackIdx++ % MODEL_COLORS_FALLBACK.length];
                    const isHovered = hoveredModel === model.name;
                    return (
                      <path
                        key={model.name}
                        d={describeArc(segStart, segEnd, r)}
                        fill="none"
                        stroke={color}
                        strokeWidth="32"
                        strokeLinecap="butt"
                        opacity={hoveredModel && !isHovered ? 0.35 : 1}
                        style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                        onMouseEnter={() => setHoveredModel(model.name)}
                      />
                    );
                  })}
                  {!hasModels && totalCitations > 0 && (
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" className="text-muted-foreground/30" strokeWidth="32" />
                  )}
                  {hoveredData ? (
                    <>
                      <text x={cx} y={cy - 4} textAnchor="middle" className="text-4xl font-bold fill-foreground font-sans">
                        {hoveredData.pct}%
                      </text>
                      <text x={cx} y={cy + 18} textAnchor="middle" className="text-sm font-semibold fill-foreground font-sans">
                        {hoveredData.name}
                      </text>
                      <text x={cx} y={cy + 34} textAnchor="middle" className="text-xs font-medium fill-muted-foreground font-sans">
                        {hoveredData.count} citation{hoveredData.count > 1 ? 's' : ''}
                      </text>
                    </>
                  ) : (
                    <>
                      <text x={cx} y={cy + 8} textAnchor="middle" className="text-4xl sm:text-5xl font-extrabold fill-foreground font-sans">
                        {totalCitations}
                      </text>
                      <text x={cx} y={cy + 32} textAnchor="middle" className="text-xs sm:text-sm font-medium fill-muted-foreground font-sans">
                        Citations totales
                      </text>
                    </>
                  )}
                </svg>

                {modelColors.length > 0 && (
                  <div className="text-center mt-1.5">
                    <span className="text-[11px] font-semibold text-primary/80 group-hover:text-primary transition-colors inline-flex items-center gap-0.5">
                      <span>{modelColors.length} modèles testés</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                )}
              </div>
            </HoverCardTrigger>

            {modelColors.length > 0 && (
              <HoverCardContent
                side="bottom"
                align="center"
                sideOffset={10}
                className="w-56 p-2.5 rounded-xl bg-popover/98 backdrop-blur-md border border-border shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-150"
              >
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 pb-1 mb-1 border-b border-border/50 flex items-center justify-between">
                  <span>Part de voix par modèle</span>
                  <Badge variant="outline" className="text-[9px] font-mono">{totalCitations} cit.</Badge>
                </div>
                <div className="space-y-0.5 max-h-56 overflow-y-auto pr-0.5">
                  {modelColors.map((m) => {
                    const isThisHovered = hoveredModel === m.name;
                    return (
                      <button
                        key={m.name}
                        type="button"
                        className={`w-full flex items-center justify-between gap-2 text-xs py-1 px-1.5 rounded-md text-left cursor-pointer transition-colors ${
                          isThisHovered ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted text-foreground'
                        }`}
                        onMouseEnter={() => setHoveredModel(m.name)}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {getModelLogo(m.name) ? (
                            <img
                              src={getModelLogo(m.name)!}
                              alt={m.name}
                              className="w-3.5 h-3.5 object-contain shrink-0 rounded-sm"
                            />
                          ) : (
                            <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                          )}
                          <span className="font-medium text-[11px] truncate max-w-[90px]">{m.name}</span>
                        </div>
                        <span className="text-[11px] shrink-0 font-semibold font-mono">
                          {m.pct}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </HoverCardContent>
            )}
          </HoverCard>

          {/* 2. Roue Score GEO */}
          {normalizedGeoScore !== null && (
            <div className="relative w-[180px] sm:w-[200px] shrink-0 mx-auto">
              <svg
                viewBox="0 0 280 280"
                className="w-full h-auto mx-auto cursor-pointer"
                onMouseEnter={() => setIsScoreGeoHovered(true)}
                onMouseLeave={() => setIsScoreGeoHovered(false)}
              >
                <defs>
                  <linearGradient id="geoScoreRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={geoGradStart} />
                    <stop offset="100%" stopColor={geoStrokeColor} />
                  </linearGradient>
                </defs>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" className="text-muted/40" strokeWidth="32" />
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke="url(#geoScoreRingGradient)"
                  strokeWidth="32"
                  strokeDasharray={geoCirc}
                  strokeDashoffset={geoDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${cx} ${cy})`}
                  style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }}
                />
                {isScoreGeoHovered ? (
                  <>
                    <text x={cx} y={cy + 2} textAnchor="middle" className="text-3xl font-bold fill-foreground font-sans">
                      {normalizedGeoScore}/100
                    </text>
                    <text x={cx} y={cy + 24} textAnchor="middle" style={{ fill: geoStrokeColor }} className="text-xs font-semibold font-sans">
                      {geoStatusLabel}
                    </text>
                  </>
                ) : (
                  <>
                    <text x={cx} y={cy + 8} textAnchor="middle" className="text-4xl sm:text-5xl font-extrabold fill-foreground font-sans">
                      {normalizedGeoScore}
                    </text>
                    <text x={cx} y={cy + 32} textAnchor="middle" className="text-xs sm:text-sm font-medium fill-muted-foreground font-sans">
                      Score GEO
                    </text>
                  </>
                )}
              </svg>
            </div>
          )}

          {/* 3. Roue Score Agentique */}
          <div className="relative w-[180px] sm:w-[200px] shrink-0 mx-auto group">
            <svg
              viewBox="0 0 280 280"
              className="w-full h-auto mx-auto cursor-pointer transition-transform duration-200 group-hover:scale-[1.02]"
              onClick={() => navigate('/agentic')}
              onMouseEnter={() => setIsScoreAgenticHovered(true)}
              onMouseLeave={() => setIsScoreAgenticHovered(false)}
            >
              <defs>
                <linearGradient id="agenticScoreRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={agenticGradStart} />
                  <stop offset="100%" stopColor={agenticStrokeColor} />
                </linearGradient>
              </defs>
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" className="text-muted/40" strokeWidth="32" />
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="url(#agenticScoreRingGradient)"
                strokeWidth="32"
                strokeDasharray={agenticCirc}
                strokeDashoffset={agenticDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${cx} ${cy})`}
                style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }}
              />
              {isScoreAgenticHovered ? (
                <>
                  <text x={cx} y={cy + 2} textAnchor="middle" className="text-3xl font-bold fill-foreground font-sans">
                    {normalizedAgenticScore}/100
                  </text>
                  <text x={cx} y={cy + 24} textAnchor="middle" style={{ fill: agenticStrokeColor }} className="text-xs font-semibold font-sans">
                    {agenticStatusLabel}
                  </text>
                </>
              ) : (
                <>
                  <text x={cx} y={cy + 8} textAnchor="middle" className="text-4xl sm:text-5xl font-extrabold fill-foreground font-sans">
                    {normalizedAgenticScore}
                  </text>
                  <text x={cx} y={cy + 32} textAnchor="middle" className="text-xs sm:text-sm font-medium fill-muted-foreground font-sans">
                    Score Agentique
                  </text>
                </>
              )}
            </svg>
            <div className="text-center mt-1.5">
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate('/agentic')}
                className="text-[11px] font-semibold text-primary h-auto p-0 gap-0.5 hover:no-underline hover:text-primary/80"
              >
                <span>Éligibilité M2M</span>
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TopSectionProps {
  reportData: FullReportData | null;
  reports: ReportResponse[];
  onOpenReportsModal: () => void;
  onOpenAiExplain?: () => void;
  agenticScore?: number | null;
}

export function TopSection({
  reportData,
  reports: _reports,
  onOpenReportsModal: _onOpenReportsModal,
  onOpenAiExplain,
  agenticScore,
}: TopSectionProps) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const { toast } = useToast();

  const domainName = useMemo(() => {
    const url =
      (reportData as any)?.report?.url ||
      (reportData as any)?.llmo_report?.url ||
      (reportData as any)?.url ||
      (reportData as any)?.analyse_citation?.client_site_url;
    if (!url) return null;
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return null;
    }
  }, [reportData]);

  const lastUpdate = useMemo(() => {
    const d = (reportData as any)?.report?.updated_at || (reportData as any)?.report?.created_at;
    if (!d) return null;
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return null;
    return parsed.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [reportData]);

  const [asyncGeoScore, setAsyncGeoScore] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const directScore = extractTargetGeoScore(reportData);
    if (directScore !== null) {
      setAsyncGeoScore(directScore);
      return;
    }

    const reportId = (reportData as any)?.report?.id || (reportData as any)?.llmo_report?.id;
    if (!reportId) return;

    getCompetitorAnalysisFromReport(reportId)
      .then((res) => {
        if (!isMounted || !res) return;
        const s = res.target_positioning?.target_geo_score;
        if (s !== undefined && s !== null) {
          const num = Number(s);
          if (!isNaN(num)) {
            setAsyncGeoScore(num > 0 && num <= 1 ? Math.round(num * 100) : Math.round(num));
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [reportData]);

  const targetGeoScore = asyncGeoScore ?? extractTargetGeoScore(reportData);

  const handleExportPdf = async () => {
    if (!reportData) return;
    setIsExportingPdf(true);
    toast({
      title: 'Génération du PDF en cours',
      description: "Compilation des données de citations, d'optimisations et de veille concurrentielle...",
    });
    try {
      await generateFullReportPdf(reportData);
      toast({
        title: 'Rapport PDF prêt',
        description: "L'aperçu et l'enregistrement PDF haute résolution ont été lancés.",
      });
    } catch (err: any) {
      toast({
        title: "Erreur d'exportation",
        description: err?.message || 'Impossible de générer le document PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-4 mb-6">
      {/* En-tête Hero avec titre, IA button et Export PDF */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-tight">
              {domainName ? `Tableau de bord — ${domainName}` : 'Tableau de bord'}
            </h1>
            <AskAIButton reportData={reportData} size="sm" onOpenAiModal={onOpenAiExplain} className="shrink-0" />
          </div>
          {lastUpdate && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3" />
              <span>Dernière mise à jour : {lastUpdate}</span>
            </div>
          )}
        </div>

        {/* Bouton Télécharger le rapport PDF shadcn */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPdf}
          disabled={isExportingPdf || !reportData}
          className="gap-2 h-9 px-3.5 text-xs font-semibold shadow-2xs border-border/80 self-start sm:self-auto"
        >
          {isExportingPdf ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          ) : (
            <Download className="w-3.5 h-3.5 text-primary" />
          )}
          <span>{isExportingPdf ? 'Génération PDF...' : 'Télécharger le rapport (PDF)'}</span>
        </Button>
      </div>

      {/* Grille des 3 roues de scores */}
      <CitationsChart reportData={reportData} targetGeoScore={targetGeoScore} agenticScore={agenticScore} />
    </div>
  );
}
