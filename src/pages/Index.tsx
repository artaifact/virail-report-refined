import React, { useState, useEffect, useMemo } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import './Index.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Info, ChevronRight, ExternalLink, CheckCircle2, AlertCircle, AlertTriangle, Clock, Target, TrendingUp, CheckCircle, Circle, PlayCircle, Pause, RotateCcw, Sparkles, Wand2, Zap, Award, MessageSquare, MoreVertical, X, Check, Download, Lock, FileText, ListChecks, ArrowUpRight, Shield, Code, Globe, Copy, FileCode, Loader2, Layers, Play, XCircle } from 'lucide-react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useReport, useReports, getLatestReportId } from '@/hooks/useReports';
import { useSelectedReport } from '@/contexts/SelectedReportContext';
import { AuthService } from '@/services/authService';
import type { FullReportData, ReportResponse, BulkJobProgress, BulkPageResult, BulkResultsResponse, BulkJobSummary } from '@/lib/api';
import { startBulkOptimization, getBulkProgress, getBulkPages, getBulkResults, cancelBulkJob, fetchPageOptimization, listBulkJobs } from '@/lib/api';
import { cn } from '@/lib/utils';
import { listCompetitorAnalyses, getCompetitorAnalysisById, getCompetitorAnalysisFromReport, extractDomain, CompetitorAnalysisResponse, mapApiResponseToCompetitorAnalysisResponse, mapAnalyseConcurrentielleV1ToResponse } from '@/services/competitorAnalysisService';
import { modelLogos } from '@/components/ModelLogosCarousel';
import { usePayment } from '@/hooks/usePayment';
import { ScoreCard } from '@/components/dashboard/ScoreCard';
import { HtmlDiffViewer } from '@/components/optimizer/HtmlDiffViewer';
import { SchemaPreview } from '@/components/optimizer/SchemaPreview';
import { SimulationTab } from '@/components/optimizer/SimulationTab';
import { NewAnalysisModal } from '@/components/NewAnalysisModal';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { HELP } from '@/lib/help-content';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// === CONSTANTES ===
/**
 * Récupère le logo d'un modèle avec une recherche par mot-clé
 */
const getModelLogo = (modelName: string): string | null => {
  if (!modelName) return null;
  const name = modelName.toLowerCase();
  
  for (const [key, path] of Object.entries(modelLogos)) {
    if (name.includes(key)) return path;
  }
  return null;
};

// === SOUS-COMPOSANTS ===


/**
 * Graphique circulaire SVG affichant les citations
 * Design multicolore avec segments orange, vert et accents colorés
 */
const MODEL_COLORS: Record<string, string> = {
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
const MODEL_COLORS_FALLBACK = ['#B5A8D8', '#DBA8C4', '#8DD0C4', '#E0C68A', '#A5A7E0', '#8BC5E0'];

/**
 * Extrait le score target_geo_score depuis les différentes structures possibles du rapport
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

  // 2. Dans analyse_concurrentielle_v3 ou competitor_analysis ou analyse_concurrentielle_v1
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

  // 3. Mapping via mapAnalyseConcurrentielleV1ToResponse si analyse_concurrentielle_v1 ou competitor_analysis existe
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

  // 4. Score produit analysé (report.score_produit_analyse)
  const scoreProduit = raw.report?.score_produit_analyse ?? raw.score_produit_analyse;
  if (scoreProduit !== undefined && scoreProduit !== null) {
    const num = Number(scoreProduit);
    if (!isNaN(num)) return num > 0 && num <= 1 ? Math.round(num * 100) : Math.round(num);
  }

  // 5. Moyenne depuis les modules d'analyses (audit_geo.score_global_geo)
  if (Array.isArray(raw.analyses) && raw.analyses.length > 0) {
    const geoScores = raw.analyses
      .map((a: any) => a.modules?.audit_geo?.score_global_geo)
      .filter((s: any) => typeof s === 'number' && !isNaN(s));
    if (geoScores.length > 0) {
      const avg = geoScores.reduce((sum: number, val: number) => sum + val, 0) / geoScores.length;
      return avg > 0 && avg <= 1 ? Math.round(avg * 100) : Math.round(avg);
    }
  }

  // 6. Crawl optimizer overall score
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

function CitationsChart({ reportData, targetGeoScore }: { reportData: FullReportData | null; targetGeoScore?: number | null }) {
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);
  const [isScoreGeoHovered, setIsScoreGeoHovered] = useState(false);
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

  // Regrouper par nom commercial et trier par citations desc
  const grouped = useMemo(() => {
    const map: Record<string, number> = {};
    Object.entries(citationsByModel).forEach(([raw, count]) => {
      const name = getModelLogo(raw) ? raw : raw;
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

  const hoveredData = hoveredModel ? activeModels.find(m => m.name === hoveredModel) : null;

  // Recalculate colors for legend (need to mirror segment logic)
  let legendFallbackIdx = 0;
  const modelColors = hasModels ? activeModels.map((model) => ({
    name: model.name,
    count: model.count,
    color: MODEL_COLORS[model.name] || MODEL_COLORS_FALLBACK[legendFallbackIdx++ % MODEL_COLORS_FALLBACK.length],
    pct: totalCitations > 0 ? Math.round((model.count / totalCitations) * 100) : 0,
  })) : [];

  // Configuration du graphique Score GEO (même dimension que Citations totales)
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

  return (
    <div className="citations-chart">
      {/* Conteneur des deux graphiques côte à côte de même dimension et arrondi */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 md:gap-16 w-full mb-3">
        {/* 1. Graphique circulaire : Citations totales */}
        <div className="relative w-full max-w-[200px] sm:max-w-[240px] mx-auto">
          <svg viewBox="0 0 280 280" className="w-full h-auto mx-auto">
            {/* Background circle - même épaisseur 32 que les segments */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth="32" />

            {/* Model segments */}
            {hasModels && activeModels.map((model, i) => {
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
                  fill="none" stroke={color} strokeWidth="32" strokeLinecap="butt"
                  opacity={hoveredModel && !isHovered ? 0.35 : 1}
                  style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                  onMouseEnter={() => setHoveredModel(model.name)}
                  onMouseLeave={() => setHoveredModel(null)}
                />
              );
            })}

            {/* Si pas de modèles, cercle gris */}
            {!hasModels && totalCitations > 0 && (
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="#CBD5E1" strokeWidth="32" opacity={0.5} />
            )}

            {/* Center text: nombre ou info modèle survolé */}
            {hoveredData ? (
              <>
                <text x={cx} y={cy + 2} textAnchor="middle" style={{ fontSize: '28px', fontWeight: 700, fill: '#0F172A', fontFamily: 'Inter, sans-serif' }}>
                  {hoveredData.count}
                </text>
                <text x={cx} y={cy + 24} textAnchor="middle" style={{ fontSize: '11px', fontWeight: 500, fill: '#64748B', fontFamily: 'Inter, sans-serif' }}>
                  {hoveredData.name}
                </text>
              </>
            ) : (
              <>
                <text x={cx} y={cy + 8} textAnchor="middle" style={{ fontSize: '42px', fontWeight: 700, fill: '#0F172A', fontFamily: 'Inter, sans-serif' }}>
                  {totalCitations}
                </text>
                <text x={cx} y={cy + 32} textAnchor="middle" style={{ fontSize: '13px', fontWeight: 500, fill: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                  Citations totales
                </text>
              </>
            )}
          </svg>
        </div>

        {/* 2. Graphique circulaire : Score GEO (même dimension et même arrondi exact) */}
        {normalizedGeoScore !== null && (
          <div className="relative w-full max-w-[200px] sm:max-w-[240px] mx-auto">
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

              {/* Background circle - même dimension exacte cx, cy, r et strokeWidth=32 */}
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth="32" />

              {/* Progress ring - même épaisseur 32 et même rayon r=95 */}
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

              {/* Center text : même style typographique que citations totales */}
              {isScoreGeoHovered ? (
                <>
                  <text x={cx} y={cy + 2} textAnchor="middle" style={{ fontSize: '28px', fontWeight: 700, fill: '#0F172A', fontFamily: 'Inter, sans-serif' }}>
                    {normalizedGeoScore}/100
                  </text>
                  <text x={cx} y={cy + 24} textAnchor="middle" style={{ fontSize: '11px', fontWeight: 600, fill: geoStrokeColor, fontFamily: 'Inter, sans-serif' }}>
                    {geoStatusLabel}
                  </text>
                </>
              ) : (
                <>
                  <text x={cx} y={cy + 8} textAnchor="middle" style={{ fontSize: '42px', fontWeight: 700, fill: '#0F172A', fontFamily: 'Inter, sans-serif' }}>
                    {normalizedGeoScore}
                  </text>
                  <text x={cx} y={cy + 32} textAnchor="middle" style={{ fontSize: '13px', fontWeight: 500, fill: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                    Score GEO
                  </text>
                </>
              )}
            </svg>
          </div>
        )}
      </div>

      {/* Légende des couleurs par modèle */}
      {modelColors.length > 0 && (() => {
        const half = Math.ceil(modelColors.length / 2);
        const rows = [modelColors.slice(0, half), modelColors.slice(half)].filter(r => r.length > 0);
        const renderItem = (m: typeof modelColors[0]) => (
          <button
            key={m.name}
            type="button"
            className="flex items-center gap-1.5 text-xs transition-opacity"
            style={{ opacity: hoveredModel && hoveredModel !== m.name ? 0.35 : 1 }}
            onMouseEnter={() => setHoveredModel(m.name)}
            onMouseLeave={() => setHoveredModel(null)}
          >
            {getModelLogo(m.name) ? (
              <img
                src={getModelLogo(m.name)!}
                alt={m.name}
                className="w-4 h-4 object-contain flex-shrink-0 rounded-sm"
              />
            ) : (
              <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
            )}
            <span className="text-slate-600 font-medium">{m.name}</span>
            <span className="text-slate-400">{m.pct}%</span>
          </button>
        );
        return (
          <>
            {/* Mobile : 2 items par ligne */}
            <div className="sm:hidden grid grid-cols-2 gap-x-4 gap-y-2 mt-1 px-2 w-full">
              {modelColors.map(renderItem)}
            </div>
            {/* Desktop : layout en 2 lignes inchangé */}
            <div className="hidden sm:flex flex-col items-center gap-y-2 mt-1 px-2">
              {rows.map((row, i) => (
                <div key={i} className="flex justify-center gap-x-3">
                  {row.map(renderItem)}
                </div>
              ))}
            </div>
          </>
        );
      })()}
    </div>
  );
}

/**
 * Boutons de navigation entre les deux vues principales
 * Gère les états actif/inactif avec styles différenciés
 */
function NavigationButtons({ activeView, onViewChange }: { activeView: string, onViewChange: (view: string) => void }) {
  const handleViewChange = (view: string) => {
    onViewChange(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="navigation-buttons">
      <button
        className={`nav-btn ${activeView === 'details' ? 'nav-btn-primary' : ''}`}
        onClick={() => handleViewChange('details')}
      >
        Infos détaillées
      </button>

      <button
        onClick={() => handleViewChange('ameliorer')}
        className={`nav-btn ${activeView === 'ameliorer' ? 'nav-btn-primary' : ''}`}
      >
        Améliorer
      </button>
    </div>
  );
}

/**
 * Section haute du dashboard - Fixe
 * Contient le graphique de citations, le carrousel de logos et les boutons de navigation
 */
function TopSection({ activeView, onViewChange, reportData, reports, onOpenReportsModal }: { activeView: string, onViewChange: (view: string) => void, reportData: FullReportData | null, reports: ReportResponse[], onOpenReportsModal: () => void }) {
  const domainName = useMemo(() => {
    const url = (reportData as any)?.report?.url || (reportData as any)?.llmo_report?.url;
    if (!url) return null;
    try { return new URL(url).hostname.replace('www.', ''); } catch { return null; }
  }, [reportData]);

  const lastUpdate = useMemo(() => {
    const d = (reportData as any)?.report?.updated_at || (reportData as any)?.report?.created_at;
    if (!d) return null;
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return null;
    return parsed.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [reportData]);

  // Récupération synchrone ou asynchrone du score target_geo_score
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

    return () => { isMounted = false; };
  }, [reportData]);

  const targetGeoScore = asyncGeoScore ?? extractTargetGeoScore(reportData);

  return (
    <div className="top-section relative">
      <div className="px-1 mb-2">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight truncate">
          {domainName ? `Tableau de bord — ${domainName}` : 'Tableau de bord'}
        </h1>
        {lastUpdate && (
          <p className="text-xs text-slate-400 mt-0.5">Dernière mise à jour : {lastUpdate}</p>
        )}
      </div>
      <CitationsChart reportData={reportData} targetGeoScore={targetGeoScore} />
      <NavigationButtons activeView={activeView} onViewChange={onViewChange} />
    </div>
  );
}

/**
 * Tableau des recommandations SEO avec barres de progression
 */
function RecommendationsTable({ reportData }: { reportData: FullReportData | null }) {
  const [selectedRec, setSelectedRec] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPdf = async () => {
    const reportId = reportData?.report?.id;
    if (!reportId) return;
    setPdfLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://api.viraill.com' : 'http://localhost:8000');
      const response = await AuthService.makeAuthenticatedRequest(
        `${apiBase}/llmo/reports/${reportId}/download?format=pdf`,
        { method: 'GET' }
      );
      if (!response.ok) throw new Error('Erreur lors du téléchargement');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-geo-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
    } finally {
      setPdfLoading(false);
    }
  };

  // Extraire les scores GEO moyens par catégorie depuis toutes les analyses
  const getGeoScores = () => {
    if (!reportData?.analyses || reportData.analyses.length === 0) return [];

    const categories = [
      { key: 'html_semantique', label: 'Structure HTML', description: 'Qualité du balisage HTML et hiérarchie sémantique' },
      { key: 'donnees_structurees', label: 'Données structurées', description: 'Schema.org, JSON-LD et métadonnées enrichies' },
      { key: 'accessibilite_crawlers', label: 'Accessibilité IA', description: 'Compatibilité avec les crawlers et bots IA' },
      { key: 'optimisation_contenu', label: 'Qualité du contenu', description: 'Pertinence, richesse et structure du contenu' },
      { key: 'metadonnees_techniques', label: 'Métadonnées', description: 'Balises meta, Open Graph et directives LLM' },
      { key: 'conformite_standards', label: 'Standards web', description: 'Conformité aux standards et bonnes pratiques' },
    ];

    // Extraire le score: supporte audit_geo[key] (number) ou audit_geo[key].score (object)
    const getScore = (audit: any, key: string): number | null => {
      const val = audit?.[key];
      if (typeof val === 'number') return val;
      if (typeof val === 'object' && val !== null && typeof val.score === 'number') return val.score;
      return null;
    };

    return categories.map(cat => {
      const scores = reportData.analyses
        .map((a: any) => getScore(a.modules?.audit_geo, cat.key))
        .filter((s: any): s is number => typeof s === 'number' && s > 0);
      const avg = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
      return {
        element: cat.label,
        description: cat.description,
        score: avg,
        modelScores: reportData.analyses
          .filter((a: any) => getScore(a.modules?.audit_geo, cat.key) !== null)
          .map((a: any) => ({ model: a.llm_name, score: Math.round(getScore(a.modules.audit_geo, cat.key) || 0) })),
      };
    }).filter(c => c.score > 0);
  };

  // Extraire le plan d'action depuis audit_geo (supporte string[] et object[])
  const getPlanAction = () => {
    if (!reportData?.analyses || reportData.analyses.length === 0) return [];
    for (const analysis of reportData.analyses) {
      if (analysis.modules?.audit_geo?.plan_action_geo && Array.isArray(analysis.modules.audit_geo.plan_action_geo)) {
        return analysis.modules.audit_geo.plan_action_geo.map((item: any) => {
          if (typeof item === 'string') return item;
          return item.action || String(item);
        });
      }
    }
    return [];
  };

  const geoScores = getGeoScores();
  const planAction = getPlanAction();

  if (geoScores.length === 0) {
    return (
      <div className="recommendations-table" style={{ boxShadow: 'none', border: '1px solid #F1F5F9', padding: '24px', borderRadius: '16px' }}>
        <div style={{ textAlign: 'center', color: '#64748B', padding: '40px' }}>
          Aucune donnée GEO disponible pour ce rapport.
        </div>
      </div>
    );
  }

  const recommendations = geoScores;

  const handleRowClick = (rec: any) => {
    setSelectedRec(rec);
    setIsDialogOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    if (!priority) return '#6B7280';
    const p = priority.toLowerCase();
    if (p.includes('critique') || p.includes('haute') || p.includes('high')) return '#EF4444';
    if (p.includes('moyenne') || p.includes('medium')) return '#F97316';
    if (p.includes('basse') || p.includes('low')) return '#10B981';
    return '#6B7280';
  };

  // Données du Guide d'implémentation - Package d'Optimisation GEO (même source que ImplementationGuide)
  const getGuideData = () => {
    type GuideFile = { label: string; content: string; filename: string; type: string };
    const emptyResult = { scoreActuel: 58, scoreCible: 83, guide: null as any, files: [] as GuideFile[] };
    if (!reportData?.analyses || reportData.analyses.length === 0) return emptyResult;

    const auditGeoData = reportData.analyses.find((analysis: any) =>
      analysis.modules?.audit_geo?.package_optimisation_geo
    )?.modules?.audit_geo;
    const pkg = auditGeoData?.package_optimisation_geo;
    if (!pkg) return { ...emptyResult, scoreActuel: auditGeoData?.score_global_geo ?? 58 };

    const guide = pkg.implementation_guide || null;
    const tf = pkg.technical_files as Record<string, { content: string; filename: string; description: string }> | undefined;

    // Construire la liste des fichiers depuis technical_files (prioritaire) ou anciens champs plats
    const files: GuideFile[] = [];
    const techFilesDefs = [
      { key: 'schema_org_json', label: 'Schema.org JSON-LD', type: 'application/json' },
      { key: 'llms_txt', label: 'LLMs.txt', type: 'text/plain' },
      { key: 'robots_txt', label: 'Robots.txt', type: 'text/plain' },
      { key: 'meta_tags', label: 'Meta Tags HTML', type: 'text/html' },
      { key: 'open_graph', label: 'Open Graph Tags', type: 'text/html' },
    ];
    techFilesDefs.forEach(def => {
      const entry = tf?.[def.key];
      if (entry?.content) {
        files.push({ label: def.label, content: entry.content, filename: entry.filename, type: def.type });
      }
    });

    // Fallback: anciens champs plats si technical_files absent
    if (files.length === 0) {
      const flatDefs = [
        { key: 'llms_txt_content', label: 'llms.txt', filename: 'llms.txt', type: 'text/plain' },
        { key: 'robots_txt_content', label: 'robots.txt', filename: 'robots.txt', type: 'text/plain' },
        { key: 'meta_tags_snippet', label: 'Meta Tags', filename: 'meta-tags.html', type: 'text/html' },
        { key: 'open_graph_tags', label: 'Open Graph', filename: 'open-graph.html', type: 'text/html' },
      ];
      flatDefs.forEach(def => {
        if (pkg[def.key]) files.push({ label: def.label, content: pkg[def.key], filename: def.filename, type: def.type });
      });
    }

    return {
      scoreActuel: guide?.score_geo_actuel ?? auditGeoData?.score_global_geo ?? 58,
      scoreCible: guide?.score_geo_cible ?? pkg.package_metadata?.estimated_improvement?.score_estime ?? 83,
      guide,
      files,
    };
  };
  const guideData = getGuideData();

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Progression du Guide (même clé localStorage que ImplementationGuide)
  const guideStorageKey = reportData?.report?.id != null ? `implementation-guide-progress-${reportData.report.id}` : 'implementation-guide-progress-default';
  const [guideStepProgress, setGuideStepProgress] = useState<Record<string, { status: string; progress: number; checkedActions?: Record<number, boolean> }>>(() => {
    try {
      const saved = localStorage.getItem(guideStorageKey);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    if (isDialogOpen) {
      try {
        const saved = localStorage.getItem(guideStorageKey);
        if (saved) setGuideStepProgress(JSON.parse(saved));
      } catch { /* ignore */ }
    }
  }, [isDialogOpen, guideStorageKey]);

  const getGuideStepStatus = (stepId: string) => guideStepProgress[stepId] || { status: 'Non commencé', progress: 0 };
  const updateGuideStepStatus = (stepId: string, status: string) => {
    const progressMap: Record<string, number> = { 'Non commencé': 0, 'En cours': 50, 'Terminé': 100 };
    const next = { ...guideStepProgress, [stepId]: { ...getGuideStepStatus(stepId), status, progress: progressMap[status] ?? 0 } };
    setGuideStepProgress(next);
    try { localStorage.setItem(guideStorageKey, JSON.stringify(next)); } catch { /* ignore */ }
  };
  const toggleGuideAction = (stepId: string, actionIndex: number) => {
    const current = getGuideStepStatus(stepId);
    const checked = { ...(current.checkedActions || {}), [actionIndex]: !(current.checkedActions || {})[actionIndex] };
    const total = Object.keys(checked).length;
    const done = Object.values(checked).filter(Boolean).length;
    let status = current.status;
    if (done === total && total > 0) status = 'Terminé';
    else if (done > 0 && current.status === 'Non commencé') status = 'En cours';
    const progress = total > 0 ? Math.round((done / total) * 100) : (status === 'Terminé' ? 100 : status === 'En cours' ? 50 : 0);
    const next = { ...guideStepProgress, [stepId]: { ...current, checkedActions: checked, status, progress } };
    setGuideStepProgress(next);
    try { localStorage.setItem(guideStorageKey, JSON.stringify(next)); } catch { /* ignore */ }
  };
  const guideEtapes: any[] = guideData.guide?.etapes_implementation ? Object.values(guideData.guide.etapes_implementation) : [];
  const guideTotalSteps = guideEtapes.length;
  const guideGlobalProgress = (() => {
    if (guideTotalSteps === 0) return 0;
    const sum = guideEtapes.reduce((acc: number, etape: any, idx: number) => {
      const stepId = `etape-${idx}-${etape.titre || `step-${idx}`}`;
      return acc + getGuideStepStatus(stepId).progress;
    }, 0);
    return Math.round(sum / guideTotalSteps);
  })();
  const guideCompletedSteps = Object.values(guideStepProgress).filter(s => s.status === 'Terminé').length;
  const guideInProgressSteps = Object.values(guideStepProgress).filter(s => s.status === 'En cours').length;

  return (
    <>
      <div className="recommendations-table border border-slate-100 rounded-2xl p-4 md:p-6 shadow-none">
        
        {/* Desktop: table layout */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-separate" style={{ borderSpacing: '0' }}>
            <thead>
              <tr>
                <th className="pb-4 uppercase text-xs text-slate-400 font-semibold tracking-wider text-left border-b border-slate-100">
                  <div className="flex items-center gap-1.5">CATÉGORIE<InfoTooltip {...HELP.scoreGEO} side="right" /></div>
                </th>
                <th className="pb-4 uppercase text-xs text-slate-400 font-semibold tracking-wider text-left border-b border-slate-100">DESCRIPTION</th>
                <th className="pb-4 uppercase text-xs text-slate-400 font-semibold tracking-wider text-left border-b border-slate-100 w-[35%]">SCORE</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((rec, index) => (
                <tr
                  key={index}
                  onClick={() => handleRowClick(rec)}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                >
                  <td className={`py-5 text-[15px] text-slate-700 font-medium ${index === recommendations.length - 1 ? '' : 'border-b border-slate-100'}`}>
                    <div className="flex items-center gap-2">
                      {rec.element}
                      <Info size={14} className="text-slate-400" />
                    </div>
                  </td>
                  <td className={`py-5 text-sm text-slate-500 ${index === recommendations.length - 1 ? '' : 'border-b border-slate-100'}`}>
                    {rec.description}
                  </td>
                  <td className={`py-5 ${index === recommendations.length - 1 ? '' : 'border-b border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${rec.score}%`,
                            backgroundColor: rec.score >= 70 ? '#10B981' : rec.score >= 40 ? '#F97316' : '#EF4444',
                          }}
                        />
                      </div>
                      <span
                        className="text-sm font-bold min-w-[40px]"
                        style={{ color: rec.score >= 70 ? '#10B981' : rec.score >= 40 ? '#F97316' : '#EF4444' }}
                      >{rec.score}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: card layout */}
        <div className="md:hidden flex flex-col gap-3">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              onClick={() => handleRowClick(rec)}
              className="cursor-pointer p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-slate-700">{rec.element}</span>
                <Info size={14} className="text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 mb-3">{rec.description}</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${rec.score}%`,
                      backgroundColor: rec.score >= 70 ? '#10B981' : rec.score >= 40 ? '#F97316' : '#EF4444',
                    }}
                  />
                </div>
                <span
                  className="text-sm font-bold"
                  style={{ color: rec.score >= 70 ? '#10B981' : rec.score >= 40 ? '#F97316' : '#EF4444' }}
                >{rec.score}%</span>
              </div>
            </div>
          ))}
        </div>
        
      </div>

      {/* Bouton Rapport PDF */}
      {reportData?.report?.id && (
        <div
          onClick={(e) => { e.stopPropagation(); handleDownloadPdf(); }}
          className={`mt-3 px-4 py-3 md:px-6 md:py-4 border border-slate-100 rounded-2xl flex justify-between items-center transition-colors hover:bg-slate-50 ${pdfLoading ? 'cursor-wait opacity-60' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-3">
            <Download size={18} className="text-slate-800" />
            <div>
              <span className="text-sm font-semibold text-slate-900">Rapport PDF</span>
              <span className="text-xs text-slate-500 ml-2 hidden sm:inline">Télécharger le rapport complet</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pdfLoading ? (
              <span className="text-[13px] text-slate-500">Téléchargement...</span>
            ) : (
              <span className="text-[13px] font-semibold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">PDF</span>
            )}
          </div>
        </div>
      )}

      {/* Modal de détails avec Guide d'Implémentation intégré */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
          {selectedRec && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <DialogHeader>
                <DialogTitle style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
                  {selectedRec.element}
                </DialogTitle>
                <DialogDescription style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
                  {selectedRec.description}
                </DialogDescription>
              </DialogHeader>

              {/* Score moyen */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#F8FAFC', borderRadius: '12px' }}>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A' }}>{selectedRec.score}<span style={{ fontSize: '18px', color: '#94A3B8' }}>%</span></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '6px' }}>Score moyen tous modèles</div>
                  <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '999px' }}>
                    <div style={{ width: `${selectedRec.score}%`, height: '100%', background: '#1E293B', borderRadius: '999px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              </div>

              {/* Scores par modèle */}
              {selectedRec.modelScores && selectedRec.modelScores.length > 0 && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score par modèle</div>
                  <div className="flex flex-col gap-2.5">
                    {selectedRec.modelScores.map((ms: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="flex items-center gap-2 min-w-[100px] sm:min-w-[160px] shrink-0">
                          {getModelLogo(ms.model) ? (
                            <img src={getModelLogo(ms.model)!} alt={ms.model} className="w-4 h-4 object-contain" />
                          ) : null}
                          <span className="text-[13px] text-slate-700 font-medium truncate">{ms.model}</span>
                        </div>
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
                          <div className="h-full bg-slate-800 rounded-full transition-all duration-500" style={{ width: `${ms.score}%` }} />
                        </div>
                        <span className="text-[13px] font-bold text-slate-900 min-w-[40px] text-right">{ms.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plan d'action lié */}
              {planAction.length > 0 && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan d'action</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {planAction.filter((a: string) => a.toLowerCase().includes(selectedRec.element.toLowerCase().split(' ')[0]) || a.toLowerCase().includes(selectedRec.element.toLowerCase().split(' ').pop()!)).slice(0, 4).map((action: string, idx: number) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                        <ChevronRight size={14} style={{ color: '#94A3B8', marginTop: '2px', flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>{action}</span>
                      </div>
                    ))}
                    {planAction.filter((a: string) => a.toLowerCase().includes(selectedRec.element.toLowerCase().split(' ')[0]) || a.toLowerCase().includes(selectedRec.element.toLowerCase().split(' ').pop()!)).length === 0 && (
                      <div style={{ fontSize: '13px', color: '#94A3B8', fontStyle: 'italic' }}>
                        Aucune action spécifique trouvée pour cette catégorie.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Guide d'Implémentation intégré */}
              {guideEtapes.length > 0 && (
                <div>
                  <div style={{
                    background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '12px',
                    border: '1px solid #C7D2FE',
                    textAlign: 'center',
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#4338CA' }}>
                      Implémentation automatique bientôt disponible
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '13px', fontWeight: 400, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Guide d'Implémentation</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '60px', height: '4px', background: '#F1F5F9', borderRadius: '999px' }}>
                        <div style={{ width: `${guideGlobalProgress}%`, height: '100%', background: '#1E293B', borderRadius: '999px', transition: 'width 0.5s ease' }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>{guideGlobalProgress}%</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {guideEtapes.map((etape: any, idx: number) => {
                      const stepId = `etape-${idx}-${etape.titre || `step-${idx}`}`;
                      const stepStatus = getGuideStepStatus(stepId);
                      const actions: string[] = etape.actions || [];
                      const checkedCount = Object.values(stepStatus.checkedActions || {}).filter(Boolean).length;
                      const isExpanded = !!expandedSteps[stepId];
                      const allDone = actions.length > 0 && checkedCount === actions.length;

                      return (
                        <div key={idx} style={{ borderRadius: '10px', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
                          <div
                            onClick={() => setExpandedSteps(prev => ({ ...prev, [stepId]: !prev[stepId] }))}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', cursor: 'pointer', background: isExpanded ? '#FFFFFF' : '#F8FAFC', transition: 'background 0.2s ease' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                              {allDone ? (
                                <CheckCircle2 size={14} style={{ color: '#10B981', flexShrink: 0 }} />
                              ) : checkedCount > 0 ? (
                                <Clock size={14} style={{ color: '#F97316', flexShrink: 0 }} />
                              ) : (
                                <Circle size={14} style={{ color: '#CBD5E1', flexShrink: 0 }} />
                              )}
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{etape.titre || `Étape ${idx + 1}`}</span>
                              {etape.priorite && (
                                <span style={{ fontSize: '10px', fontWeight: 600, color: getPriorityColor(etape.priorite), background: '#F1F5F9', padding: '2px 6px', borderRadius: '999px' }}>
                                  {etape.priorite}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {etape.duree_estimee && (
                                <span style={{ fontSize: '11px', color: '#94A3B8' }}>{etape.duree_estimee}</span>
                              )}
                              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>{checkedCount}/{actions.length}</span>
                              <ChevronRight size={12} style={{ color: '#94A3B8', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                            </div>
                          </div>

                          {isExpanded && (
                            <div style={{ padding: '0 14px 14px', borderTop: '1px solid #F1F5F9' }}>
                              {etape.description && (
                                <p style={{ fontSize: '12px', color: '#64748B', margin: '10px 0 8px', lineHeight: '1.5' }}>{etape.description}</p>
                              )}
                              {actions.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                  {actions.map((action: string, aIdx: number) => {
                                    const isChecked = !!(stepStatus.checkedActions || {})[aIdx];
                                    return (
                                      <label key={aIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', background: isChecked ? '#F0FDF4' : '#F8FAFC', transition: 'background 0.2s ease' }}>
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => toggleGuideAction(stepId, aIdx)}
                                          style={{ marginTop: '2px', accentColor: '#1E293B' }}
                                        />
                                        <span style={{ fontSize: '12px', color: isChecked ? '#94A3B8' : '#475569', textDecoration: isChecked ? 'line-through' : 'none', lineHeight: '1.5' }}>
                                          {action}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                              {etape.verification && etape.verification.length > 0 && (
                                <div style={{ marginTop: '10px' }}>
                                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vérification</span>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                                    {etape.verification.map((v: string, vIdx: number) => (
                                      <div key={vIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px', color: '#64748B' }}>
                                        <ChevronRight size={10} style={{ color: '#CBD5E1', marginTop: '2px', flexShrink: 0 }} />
                                        <span>{v}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Fichiers téléchargeables */}
                  {guideData.files && guideData.files.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fichiers</div>
                      <div style={{ display: 'grid', gap: '6px' }} className="grid-cols-1 sm:grid-cols-2">
                        {guideData.files.map((file, fIdx) => (
                          <div
                            key={fIdx}
                            onClick={() => downloadFile(file.content, file.filename, file.type)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.2s ease' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#F1F5F9'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#F8FAFC'}
                          >
                            <Download size={12} style={{ color: '#64748B', flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>{file.label}</div>
                              <div style={{ fontSize: '10px', color: '#94A3B8' }}>{file.filename}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Composant Accordéon réutilisable
 */
function AccordionItem({ id, title, isOpen, onToggle, children }: { id: string, title: string, isOpen: boolean, onToggle: (id: string) => void, children?: React.ReactNode }) {
  return (
    <div 
      className={`accordion-item ${isOpen ? 'accordion-open' : ''}`} 
      style={{ 
        border: `1px solid ${isOpen ? '#CBD5F5' : '#E2E8F0'}`, 
        borderRadius: '10px', 
        background: isOpen ? '#FFFFFF' : '#F7F9FC',
        overflow: 'hidden'
      }}
    >
      <button
        className="accordion-header"
        onClick={() => onToggle(id)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          background: isOpen ? '#FFFFFF' : '#F7F9FC',
          border: 'none',
          outline: 'none',
          cursor: 'pointer',
          transition: 'background 0.2s ease'
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937', textAlign: 'left' }}>{title}</span>
        <span className="accordion-icon" style={{ fontSize: '12px', color: '#94A3B8', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>▼</span>
      </button>
      
      {isOpen && children && (
        <div 
          className="accordion-content" 
          style={{ 
            padding: '0 20px 20px 20px', 
            background: '#FFFFFF', 
            borderTop: '1px solid #E2E8F0' 
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Composant de carte d'étape dynamique et interactive
 */
function DynamicStepCard({ 
  etape, 
  idx, 
  stepId, 
  stepStatus, 
  updateStepStatus, 
  toggleAction, 
  updateStepNotes, 
  getPriorityColor 
}: { 
  etape: any; 
  idx: number; 
  stepId: string; 
  stepStatus: any; 
  updateStepStatus: (stepId: string, status: string) => void;
  toggleAction: (stepId: string, actionIndex: number, totalActionsCount: number) => void;
  updateStepNotes: (stepId: string, notes: string) => void;
  getPriorityColor: (priority: string) => string;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [notesInput, setNotesInput] = useState(stepStatus.notes || '');
  const [isCelebrating, setIsCelebrating] = useState(false);

  // Animation de célébration quand une étape est terminée
  useEffect(() => {
    if (stepStatus.progress === 100 && stepStatus.status === 'Terminé') {
      setIsCelebrating(true);
      const timer = setTimeout(() => setIsCelebrating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [stepStatus.progress, stepStatus.status]);

  const progressColor = stepStatus.progress === 100 ? '#10B981' : stepStatus.progress >= 50 ? '#F97316' : '#EF4444';
  const StatusIcon = stepStatus.status === 'Terminé' ? CheckCircle : stepStatus.status === 'En cours' ? PlayCircle : Circle;
  
  // Calculer le nombre d'actions cochées
  const checkedActions = stepStatus.checkedActions || {};
  const totalActions = etape.actions?.length || 0;
  const completedActions = Object.values(checkedActions).filter(Boolean).length;
  const actionsProgress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  return (
    <div 
      style={{ 
        padding: '12px 14px', 
        background: '#FFFFFF',
        borderRadius: '6px', 
        border: '1px solid #E2E8F0',
        boxShadow: isExpanded ? '0 1px 3px rgba(0,0,0,0.04)' : '0 1px 2px rgba(0,0,0,0.02)',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Effet de confettis pour la célébration */}
      {isCelebrating && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 10,
          background: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
          animation: 'pulse 0.6s ease-out'
        }} />
      )}

      {/* En-tête de l'étape avec badge de numéro */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          {/* Badge numéro avec icône de statut */}
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: '#E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748B',
            fontWeight: 600,
            fontSize: '12px',
            flexShrink: 0,
            transition: 'all 0.2s ease',
            position: 'relative'
          }}>
            {stepStatus.status === 'Terminé' ? (
              <CheckCircle size={14} style={{ color: '#64748B' }} />
            ) : (
              <span>{idx + 1}</span>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#1E293B', margin: 0 }}>
                {etape.titre || `Étape ${idx + 1}`}
              </h4>
            </div>
            {stepStatus.startedAt && (
              <div style={{ fontSize: '14px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Clock size={14} />
                Commencé le {new Date(stepStatus.startedAt).toLocaleDateString('fr-FR')}
                {stepStatus.completedAt && (
                  <> • Terminé le {new Date(stepStatus.completedAt).toLocaleDateString('fr-FR')}</>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {etape.priorite && (
            <span style={{ 
              padding: '3px 8px', 
              borderRadius: '4px', 
              fontSize: '10px', 
              fontWeight: 500,
              background: `${getPriorityColor(etape.priorite)}15`,
              color: getPriorityColor(etape.priorite)
            }}>
              {etape.priorite}
            </span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: '4px',
              borderRadius: '4px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: '#94A3B8'
            }}
          >
            <ChevronRight size={14} style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Description */}
          <p style={{ fontSize: '16px', color: '#475569', marginBottom: '16px', lineHeight: '1.7' }}>
            {etape.description || ''}
          </p>
          
          {/* Contrôles de statut avec animations */}
          <div style={{ marginBottom: '12px' }}>
            {/* Boutons rapides de statut - À droite, petits et groupés */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStepStatus(stepId, 'Non commencé')}
                style={{ 
                  height: '32px',
                  padding: '0 14px',
                  fontSize: '14px',
                  background: 'transparent',
                  color: stepStatus.status === 'Non commencé' ? '#1E293B' : '#64748B',
                  borderColor: '#E2E8F0',
                  borderWidth: '1px',
                  opacity: stepStatus.status === 'Non commencé' ? 1 : 0.6
                }}
              >
                <RotateCcw size={14} style={{ marginRight: '6px' }} />
                Non commencé
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStepStatus(stepId, 'En cours')}
                style={{ 
                  height: '30px',
                  padding: '0 12px',
                  fontSize: '13px',
                  background: 'transparent',
                  color: stepStatus.status === 'En cours' ? '#1E293B' : '#64748B',
                  borderColor: '#E2E8F0',
                  borderWidth: '1px',
                  opacity: stepStatus.status === 'En cours' ? 1 : 0.6
                }}
              >
                <PlayCircle size={14} style={{ marginRight: '6px' }} />
                En cours
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStepStatus(stepId, 'Terminé')}
                style={{ 
                  height: '30px',
                  padding: '0 12px',
                  fontSize: '13px',
                  background: 'transparent',
                  color: stepStatus.status === 'Terminé' ? '#1E293B' : '#64748B',
                  borderColor: '#E2E8F0',
                  borderWidth: '1px',
                  opacity: stepStatus.status === 'Terminé' ? 1 : 0.6
                }}
              >
                <CheckCircle size={14} style={{ marginRight: '6px' }} />
                Terminé
              </Button>
            </div>
          </div>

          {/* Checklist interactive des actions */}
          {etape.actions && etape.actions.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Target size={16} style={{ color: '#475569' }} />
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#1E293B' }}>
                    Actions ({completedActions}/{totalActions})
                  </span>
                </div>
                {actionsProgress > 0 && (
                  <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>
                    {actionsProgress}%
                  </span>
                )}
              </div>
              <div style={{ 
                padding: '8px', 
                background: '#F8FAFC', 
                borderRadius: '6px', 
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                {etape.actions.map((action: string, aIdx: number) => {
                  const isChecked = checkedActions[aIdx] || false;
                  return (
                    <label
                      key={aIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'start',
                        gap: '8px',
                        padding: '6px 8px',
                        background: isChecked ? '#F8FAFC' : '#FFFFFF',
                        borderRadius: '4px',
                        border: `1px solid #E2E8F0`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textDecoration: isChecked ? 'line-through' : 'none',
                        opacity: isChecked ? 0.7 : 1
                      }}
                    >
                      <div style={{ marginTop: '2px', flexShrink: 0 }}>
                        {isChecked ? (
                          <CheckCircle size={16} style={{ color: '#475569' }} />
                        ) : (
                          <Circle size={16} style={{ color: '#CBD5E1' }} />
                        )}
                      </div>
                      <span 
                        style={{ 
                          fontSize: '15px', 
                          color: isChecked ? '#64748B' : '#475569', 
                          lineHeight: '1.6',
                          flex: 1,
                          userSelect: 'none'
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          toggleAction(stepId, aIdx, totalActions);
                        }}
                      >
                        {action}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Impact GEO */}
          {etape.impact_geo && (
            <div style={{ marginBottom: '12px', padding: '10px 12px', background: '#EFF6FF', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <TrendingUp size={16} style={{ color: '#475569' }} />
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B' }}>Impact GEO</div>
              </div>
              <div style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
                {etape.impact_geo}
              </div>
            </div>
          )}

          {/* Notes et commentaires */}
          <div style={{ marginBottom: '12px' }}>
            <button
              onClick={() => setShowNotes(!showNotes)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                background: showNotes ? '#EFF6FF' : '#F8FAFC',
                border: `1px solid ${showNotes ? '#BFDBFE' : '#E2E8F0'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.2s ease'
              }}
            >
              <MessageSquare size={16} style={{ color: '#64748B' }} />
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B' }}>
                {stepStatus.notes ? 'Modifier notes' : 'Ajouter notes'}
              </span>
            </button>
            {showNotes && (
              <div style={{ marginTop: '8px', padding: '8px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  onBlur={() => updateStepNotes(stepId, notesInput)}
                  placeholder="Notes..."
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #CBD5E1',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    background: '#FFFFFF'
                  }}
                />
                {stepStatus.notes && (
                  <div style={{ marginTop: '6px', fontSize: '14px', color: '#64748B', display: 'flex', justifyContent: 'flex-end' }}>
                    <span>✓ Sauvegardé</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Outils recommandés */}
          {etape.outils_recommandes && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ExternalLink size={16} />
                Outils recommandés
              </div>
              {Array.isArray(etape.outils_recommandes) ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {etape.outils_recommandes.map((outil: string, oIdx: number) => (
                    <span 
                      key={oIdx}
                      style={{ 
                        padding: '8px 12px',
                        background: '#F1F5F9',
                        color: '#475569',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: 500,
                        border: '1px solid #E2E8F0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Sparkles size={14} />
                      {outil}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
                  {etape.outils_recommandes}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Guide d'implémentation avec système d'accordéons
 * Affiche le score actuel vs cible et les sections repliables
 */
function ImplementationGuide({ reportData }: { reportData: FullReportData | null }) {
  const [openAccordion, setOpenAccordion] = useState<string | null>('monitoring');
  
  // Clé unique pour le localStorage basée sur l'ID du rapport
  const storageKey = reportData?.report?.id 
    ? `implementation-guide-progress-${reportData.report.id}` 
    : 'implementation-guide-progress-default';
  
  // Initialiser l'état depuis localStorage avec plus de données
  const [stepProgress, setStepProgress] = useState<Record<string, { 
    status: string; 
    progress: number;
    checkedActions?: Record<number, boolean>;
    notes?: string;
    startedAt?: string;
    completedAt?: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Fonction pour mettre à jour le statut d'une étape
  const updateStepStatus = (stepId: string, status: string) => {
    const progressMap: Record<string, number> = {
      'Non commencé': 0,
      'En cours': 50,
      'Terminé': 100
    };
    
    const currentStep: { status?: string; progress?: number; checkedActions?: Record<number, boolean>; notes?: string; startedAt?: string; completedAt?: string } = stepProgress[stepId] || {};
    const now = new Date().toISOString();
    
    const newProgress = {
      ...stepProgress,
      [stepId]: {
        ...currentStep,
        status,
        progress: progressMap[status] || 0,
        startedAt: status !== 'Non commencé' && !currentStep.startedAt ? now : (currentStep.startedAt || undefined),
        completedAt: status === 'Terminé' ? now : (currentStep.completedAt || undefined)
      }
    };
    
    setStepProgress(newProgress);
    
    // Sauvegarder dans localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(newProgress));
    } catch (error) {
    }
  };

  // Fonction pour obtenir le statut d'une étape
  const getStepStatus = (stepId: string): { 
    status: string; 
    progress: number;
    checkedActions?: Record<number, boolean>;
    notes?: string;
    startedAt?: string;
    completedAt?: string;
  } => {
    return stepProgress[stepId] || { status: 'Non commencé', progress: 0 };
  };

  // Fonction pour cocher/décocher une action
  const toggleAction = (stepId: string, actionIndex: number) => {
    const currentStep = getStepStatus(stepId);
    const checkedActions = currentStep.checkedActions || {};
    const newCheckedActions = {
      ...checkedActions,
      [actionIndex]: !checkedActions[actionIndex]
    };
    
    // Calculer la progression basée sur les actions cochées
    const totalActions = Object.keys(newCheckedActions).length;
    const completedActions = Object.values(newCheckedActions).filter(Boolean).length;
    const actionProgress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : currentStep.progress;
    
    // Si toutes les actions sont cochées, mettre le statut à "Terminé"
    let newStatus = currentStep.status;
    if (completedActions === totalActions && totalActions > 0) {
      newStatus = 'Terminé';
    } else if (completedActions > 0 && currentStep.status === 'Non commencé') {
      newStatus = 'En cours';
    }
    
    const progressMap: Record<string, number> = {
      'Non commencé': 0,
      'En cours': Math.max(50, actionProgress),
      'Terminé': 100
    };
    
    const newProgress = {
      ...stepProgress,
      [stepId]: {
        ...currentStep,
        checkedActions: newCheckedActions,
        status: newStatus,
        progress: progressMap[newStatus] || actionProgress
      }
    };
    
    setStepProgress(newProgress);
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(newProgress));
    } catch (error) {
    }
  };

  // Fonction pour ajouter/modifier des notes
  const updateStepNotes = (stepId: string, notes: string) => {
    const currentStep = getStepStatus(stepId);
    const newProgress = {
      ...stepProgress,
      [stepId]: {
        ...currentStep,
        notes
      }
    };
    
    setStepProgress(newProgress);
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(newProgress));
    } catch (error) {
    }
  };

  // Calculer la progression globale
  const calculateGlobalProgress = () => {
    const steps = Object.values(stepProgress);
    if (steps.length === 0) return 0;
    const totalProgress = steps.reduce((sum, step) => sum + step.progress, 0);
    return Math.round(totalProgress / steps.length);
  };

  // Extraire les données du guide depuis l'API
  const getGuideData = () => {
    if (!reportData?.analyses || reportData.analyses.length === 0) {
      return {
        scoreActuel: 58,
        scoreCible: 83,
        guide: null
      };
    }

    const auditGeoData = reportData.analyses.find(analysis => 
      analysis.modules?.audit_geo?.package_optimisation_geo?.implementation_guide
    )?.modules?.audit_geo;

    if (!auditGeoData?.package_optimisation_geo?.implementation_guide) {
      return {
        scoreActuel: auditGeoData?.score_global_geo || 58,
        scoreCible: auditGeoData?.package_optimisation_geo?.package_metadata?.estimated_improvement?.score_estime || 83,
        guide: null
      };
    }

    const guide = auditGeoData.package_optimisation_geo.implementation_guide;
    return {
      scoreActuel: guide.score_geo_actuel || auditGeoData.score_global_geo || 58,
      scoreCible: guide.score_geo_cible || 83,
      guide
    };
  };

  const guideData = getGuideData();

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  // Fonction pour obtenir la couleur de la priorité (cohérente avec RecommendationsTable)
  const getPriorityColor = (priority: string) => {
    if (!priority) return '#6B7280';
    const priorityLower = priority.toLowerCase();
    // Vérifier les variantes possibles de "Haute"
    if (priorityLower.includes('haute') || priorityLower.includes('high') || priorityLower === 'haute') return '#EF4444';
    // Vérifier les variantes possibles de "Moyenne"
    if (priorityLower.includes('moyenne') || priorityLower.includes('medium') || priorityLower.includes('moyen') || priorityLower === 'moyenne') return '#F97316';
    // Vérifier les variantes possibles de "Basse"
    if (priorityLower.includes('basse') || priorityLower.includes('low') || priorityLower === 'basse') return '#10B981';
    return '#6B7280';
  };

  // Fonction pour télécharger le contenu
  const downloadContent = (content: any, filename: string, type: string) => {
    if (!content) return;
    const blob = new Blob([typeof content === 'object' ? JSON.stringify(content, null, 2) : content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const globalProgress = calculateGlobalProgress();
  const totalSteps = guideData.guide?.etapes_implementation ? Object.keys(guideData.guide.etapes_implementation).length : 4;
  const completedSteps = Object.values(stepProgress).filter(s => s.status === 'Terminé').length;
  const inProgressSteps = Object.values(stepProgress).filter(s => s.status === 'En cours').length;

  return (
    <div className="implementation-guide" style={{ boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '8px', background: '#FFFFFF' }}>
      {/* En-tête avec scores et progression globale */}
      <div className="guide-header" style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
            {guideData.guide?.titre || 'Guide d\'Implémentation - Package d\'Optimisation GEO'}
          </h2>

        </div>

        {/* Barre de progression globale dynamique */}
        <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B' }}>Progression</span>
            </div>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>{globalProgress}%</span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '6px', 
            backgroundColor: '#E2E8F0', 
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '8px'
          }}>
            <div style={{ 
              width: `${globalProgress}%`, 
              height: '100%', 
              background: `linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)`,
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: '10px'
            }} />
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#64748B' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={14} style={{ color: '#10B981' }} />
              <span><strong style={{ color: '#1E293B' }}>{completedSteps}</strong> terminée{completedSteps > 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PlayCircle size={14} style={{ color: '#F97316' }} />
              <span><strong style={{ color: '#1E293B' }}>{inProgressSteps}</strong> en cours</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Circle size={14} style={{ color: '#CBD5E1' }} />
              <span><strong style={{ color: '#1E293B' }}>{totalSteps - completedSteps - inProgressSteps}</strong> à faire</span>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Accordéons */}
        <AccordionItem
          id="etapes"
          title={`Étapes d'implémentation (${guideData.guide?.etapes_implementation ? Object.keys(guideData.guide.etapes_implementation).length : 4})`}
          isOpen={openAccordion === 'etapes'}
          onToggle={toggleAccordion}
        >
          <div style={{ padding: '20px 4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {guideData.guide?.etapes_implementation ? Object.values(guideData.guide.etapes_implementation).map((etape: any, idx: number) => {
                const stepId = `etape-${idx}-${etape.titre || `step-${idx}`}`;
                const stepStatus = getStepStatus(stepId);
                
                return (
                  <DynamicStepCard
                    key={idx}
                    etape={etape}
                    idx={idx}
                    stepId={stepId}
                    stepStatus={stepStatus}
                    updateStepStatus={updateStepStatus}
                    toggleAction={toggleAction}
                    updateStepNotes={updateStepNotes}
                    getPriorityColor={getPriorityColor}
                  />
                );
              }) : (
                [
                  { 
                    step: '1. Préparation et audit', 
                    description: 'Analyser l\'état actuel de votre site, identifier les pages prioritaires et préparer les ressources nécessaires.',
                    duration: '2-3 heures',
                    deliverables: ['Rapport d\'audit', 'Liste des pages prioritaires', 'Plan d\'action']
                  },
                  { 
                    step: '2. Implémentation technique', 
                    description: 'Mettre en place les schémas structurés, optimiser les métadonnées et améliorer la structure HTML.',
                    duration: '4-6 heures',
                    deliverables: ['Schémas JSON-LD', 'Métadonnées optimisées', 'Structure HTML améliorée']
                  },
                  { 
                    step: '3. Tests et validation', 
                    description: 'Valider toutes les implémentations avec les outils de Google et vérifier la conformité.',
                    duration: '1-2 heures',
                    deliverables: ['Rapport de validation', 'Corrections si nécessaire']
                  },
                  { 
                    step: '4. Déploiement et suivi', 
                    description: 'Mettre en production les changements et configurer le monitoring de performance.',
                    duration: '1 heure',
                    deliverables: ['Déploiement validé', 'Dashboard de monitoring configuré']
                  }
                ].map((item, idx) => {
                  const stepId = `etape-default-${idx}-${item.step}`;
                  const stepStatus = getStepStatus(stepId);
                  const progressColor = stepStatus.progress === 100 ? '#10B981' : stepStatus.progress === 50 ? '#F97316' : '#EF4444';
                  
                  return (
                  <div key={idx} style={{ padding: '20px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A' }}>{item.step}</h4>
                      <span style={{ fontSize: '14px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={16} />
                        {item.duration}
                      </span>
                    </div>
                    <p style={{ fontSize: '16px', color: '#475569', marginBottom: '16px', lineHeight: '1.7' }}>
                      {item.description}
                    </p>
                    
                    {/* Select de statut et barre de progression */}
                    <div style={{ marginBottom: '16px', padding: '16px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                          Statut de l'étape :
                        </label>
                        <select
                          value={stepStatus.status}
                          onChange={(e) => updateStepStatus(stepId, e.target.value)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '14px',
                            color: '#334155',
                            backgroundColor: '#FFFFFF',
                            cursor: 'pointer',
                            minWidth: '160px'
                          }}
                        >
                          <option value="Non commencé">Non commencé</option>
                          <option value="En cours">En cours</option>
                          <option value="Terminé">Terminé</option>
                        </select>
                      </div>
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Progression</span>
                          <span style={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>{stepStatus.progress}%</span>
                        </div>
                        <div style={{ 
                          width: '100%', 
                          height: '8px', 
                          backgroundColor: '#E2E8F0', 
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${stepStatus.progress}%`, 
                            height: '100%', 
                            backgroundColor: progressColor,
                            transition: 'width 0.3s ease, background-color 0.3s ease',
                            borderRadius: '4px'
                          }} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#64748B', marginBottom: '10px' }}>Livrables :</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {item.deliverables.map((deliverable, dIdx) => (
                          <span key={dIdx} style={{ 
                            padding: '6px 12px', 
                            background: '#EFF6FF', 
                            color: '#3B82F6', 
                            borderRadius: '6px', 
                            fontSize: '14px',
                            fontWeight: 500
                          }}>
                            {deliverable}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </div>
        </AccordionItem>
        
        <AccordionItem
          id="fichiers"
          title="Fichiers Fournis"
          isOpen={openAccordion === 'fichiers'}
          onToggle={toggleAccordion}
        >
          <div style={{ padding: '20px 4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(() => {
                // 1. Collecter les fichiers API
                const apiFiles: any[] = [];
                reportData?.analyses?.forEach((analysis, idx) => {
                  const geoData = analysis.modules?.audit_geo;
                  if (!geoData) return;
                  
                  const modelName = analysis.llm_name || `Modèle ${idx + 1}`;
                  
                  const downloadables = [
                    { key: 'schema_org_json', label: 'Schema.org JSON', type: 'application/json', ext: 'json', desc: 'Données structurées Schema.org générées par l\'IA' },
                    { key: 'llms_txt_content', label: 'LLMs.txt', type: 'text/plain', ext: 'txt', desc: 'Fichier de configuration standardisé pour les agents IA' },
                    { key: 'robots_txt_content', label: 'Robots.txt', type: 'text/plain', ext: 'txt', desc: 'Règles d\'indexation optimisées pour les crawlers IA' },
                    { key: 'meta_tags_snippet', label: 'Meta Tags HTML', type: 'text/html', ext: 'html', desc: 'Snippet HTML de métadonnées à insérer dans le <head>' },
                    { key: 'open_graph_tags', label: 'Open Graph Tags', type: 'text/html', ext: 'html', desc: 'Balises Open Graph pour l\'affichage social et IA' }
                  ];

                  downloadables.forEach(item => {
                    if (geoData[item.key]) {
                      apiFiles.push({
                        name: item.label,
                        type: item.ext.toUpperCase(),
                        model: modelName,
                        description: item.desc,
                        content: geoData[item.key],
                        mime: item.type,
                        filename: `${item.key}_${modelName.replace(/\s+/g, '_')}.${item.ext}`
                      });
                    }
                  });
                });

                // 2. Collecter les fichiers statiques du guide (en filtrant les en-têtes de modèles)
                const staticFiles = guideData.guide?.fichiers_fournis 
                  ? Object.entries(guideData.guide.fichiers_fournis)
                      .filter(([key]) => !key.toLowerCase().includes('ressources_générées') && !key.toLowerCase().includes('ressources générées'))
                      .map(([key, file]: [string, any]) => ({
                        name: key.replace(/_/g, '-'),
                        type: file.localisation?.split('.').pop()?.toUpperCase() || 'FILE',
                        description: file.description || '',
                        isStatic: true
                      }))
                  : (apiFiles.length === 0 ? [
                      { name: 'schema-faq.json', type: 'JSON', description: 'Schéma FAQ structuré pour les pages principales', isStatic: true },
                      { name: 'metadata-template.html', type: 'HTML', description: 'Template de métadonnées Open Graph et Twitter Cards', isStatic: true },
                      { name: 'sitemap-optimized.xml', type: 'XML', description: 'Sitemap XML optimisé avec priorités et fréquences', isStatic: true },
                      { name: 'robots-optimized.txt', type: 'TXT', description: 'Fichier robots.txt optimisé pour le crawling IA', isStatic: true },
                      { name: 'implementation-guide.pdf', type: 'PDF', description: 'Guide complet d\'implémentation avec exemples', isStatic: true }
                    ] : []);

                // 3. Fusionner et afficher
                const allFiles = [...apiFiles, ...staticFiles];

                if (allFiles.length === 0) {
                  return <div style={{ textAlign: 'center', padding: '20px', color: '#64748B', fontSize: '16px' }}>Aucun fichier disponible pour le moment.</div>;
                }

                return allFiles.map((file, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '14px 16px',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                      cursor: file.content ? 'pointer' : 'default'
                    }}
                    onClick={() => {
                      if (file.content) {
                        downloadContent(file.content, file.filename, file.mime);
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3B82F6';
                      e.currentTarget.style.background = '#F8FAFC';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.background = '#FFFFFF';
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '17px', fontWeight: 600, color: '#0F172A' }}>{file.name}</span>
                        {file.model && (
                          <span style={{ 
                            padding: '4px 10px', 
                            background: '#F0F9FF', 
                            color: '#0284C7', 
                            borderRadius: '4px', 
                            fontSize: '12px', 
                            fontWeight: 600,
                            border: '1px solid #BAE6FD'
                          }}>
                            {file.model}
                          </span>
                        )}
                        <span style={{ 
                          padding: '4px 10px', 
                          background: '#EFF6FF', 
                          color: '#3B82F6', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          fontWeight: 600
                        }}>
                          {file.type}
                        </span>
                      </div>
                      <div style={{ fontSize: '15px', color: '#64748B' }}>{file.description}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {file.content && (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          color: '#3B82F6', 
                          fontSize: '14px', 
                          fontWeight: 600 
                        }}>
                          <ExternalLink size={16} />
                          Télécharger
                        </div>
                      )}
                     
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </AccordionItem>
        
        <AccordionItem
          id="monitoring"
          title="Monitoring Performance"
          isOpen={openAccordion === 'monitoring'}
          onToggle={toggleAccordion}
        >
          <div style={{ padding: '20px 4px' }}>
            <div className="monitoring-section" style={{ marginBottom: '24px' }}>
              <h4 className="section-subtitle" style={{ color: '#2563EB', fontSize: '16px', fontWeight: 600, marginBottom: '14px' }}>KPI à Suivre</h4>
              <ul className="kpi-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Score de visibilité dans les moteurs génératifs', 'Taux d\'indexation par les crawlers IA', 'Qualité des données structurées', 'Performance d\'accessibilité', 'Score de conformité GEO'].map((item, i) => (
                  <li
                    key={i}
                    onClick={() => {
                      // Handler pour le clic - peut être étendu plus tard
                    }}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      fontSize: '16px', 
                      color: '#334155', 
                      lineHeight: '1.6',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F1F5F9';
                      e.currentTarget.style.color = '#2563EB';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#334155';
                    }}
                  >
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563EB' }}></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="monitoring-section" style={{ marginBottom: '28px' }}>
              <h4 className="section-subtitle" style={{ color: '#2563EB', fontSize: '16px', fontWeight: 600, marginBottom: '14px' }}>Outils Monitoring</h4>
              <ul className="tools-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Google Search Console', 'Bing Webmaster Tools', 'Schema.org Validator', 'Lighthouse Performance'].map((item, i) => (
                  <li
                    key={i}
                    onClick={() => {
                      // Handler pour le clic - peut être étendu plus tard
                    }}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      fontSize: '16px', 
                      color: '#334155', 
                      lineHeight: '1.6',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F1F5F9';
                      e.currentTarget.style.color = '#2563EB';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#334155';
                    }}
                  >
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563EB' }}></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="monitoring-frequency" style={{ background: '#F8FAFC', padding: '16px 20px', borderRadius: '8px', fontSize: '15px', color: '#64748B', lineHeight: '1.6' }}>
              <strong style={{ color: '#0F172A', marginRight: '6px', fontSize: '16px' }}>Fréquence:</strong> Hebdomadaire les 4 premières semaines, puis mensuel
            </div>
          </div>
        </AccordionItem>
        
        <AccordionItem
          id="support"
          title="Support & Contact"
          isOpen={openAccordion === 'support'}
          onToggle={toggleAccordion}
        >
          <div style={{ padding: '20px 4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#2563EB', marginBottom: '14px' }}>Support technique</h4>
                <p style={{ fontSize: '16px', color: '#475569', marginBottom: '18px', lineHeight: '1.7' }}>
                  Notre équipe est disponible pour vous accompagner dans l'implémentation de ces optimisations. 
                  Nous offrons un support prioritaire pendant les 30 premiers jours suivant l'achat.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: '#334155' }}>
                   
                    {/* <span>Support par email : <strong>support@solocal.com</strong></span> */}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: '#334155' }}>
                    <CheckCircle2 size={18} style={{ color: '#10B981' }} />
                    <span>Réponse sous 24h en jours ouvrés</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: '#334155' }}>
                    <CheckCircle2 size={18} style={{ color: '#10B981' }} />
                    <span>Assistance téléphonique pour les clients Premium</span>
                  </div>
                </div>
              </div>
              
              <div style={{ padding: '18px', background: '#F0F7FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <AlertCircle size={22} style={{ color: '#3B82F6', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#1E40AF', marginBottom: '6px' }}>
                      Besoin d'aide immédiate ?
                    </div>
                    <div style={{ fontSize: '15px', color: '#1E3A8A', lineHeight: '1.6' }}>
                      Consultez notre centre d'aide avec plus de 50 articles et tutoriels vidéo pour vous guider pas à pas.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AccordionItem>
      </div>
    </div>
  );
}

/**
 * Vue "Infos détaillées"
 * Affiche le tableau de recommandations
 */
/**
 * Section Audit GEO - Affiche le score global, les sous-scores, le résumé et le plan d'action
 * Avec sélecteur de modèle, inspiré du style CompetitorAnalysis
 */
const PREFERRED_MODEL_KEY = 'preferred-ai-model';

function AuditGeoSection({ reportData }: { reportData: FullReportData | null }) {
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    try { return localStorage.getItem(PREFERRED_MODEL_KEY) || ''; } catch { return ''; }
  });

  const handleSetSelectedModel = (model: string) => {
    setSelectedModel(model);
    try { localStorage.setItem(PREFERRED_MODEL_KEY, model); } catch {}
  };

  // Modèles disponibles (ceux qui ont un audit_geo)
  const availableModels = useMemo(() => {
    if (!reportData?.analyses) return [];
    return reportData.analyses
      .filter((a) => a.modules?.audit_geo?.score_global_geo !== undefined)
      .map((a) => a.llm_name || 'Modèle inconnu');
  }, [reportData?.analyses]);

  // Sélectionner le modèle persisté ou le premier par défaut
  useEffect(() => {
    if (availableModels.length === 0) return;
    if (!selectedModel || !availableModels.includes(selectedModel)) {
      handleSetSelectedModel(availableModels[0]);
    }
  }, [availableModels]);

  if (!reportData?.analyses || availableModels.length === 0) {
    return null;
  }

  // Données du modèle sélectionné
  const currentAnalysis = reportData.analyses.find(
    (a) => (a.llm_name || 'Modèle inconnu') === selectedModel && a.modules?.audit_geo
  );
  const auditGeo = currentAnalysis?.modules?.audit_geo;

  if (!auditGeo) return null;

  const scoreGlobal = Math.round(auditGeo.score_global_geo ?? 0);
  const resumeExecutif = auditGeo.resume_executif_geo || '';
  const rawPlan = Array.isArray(auditGeo.plan_action_geo) ? auditGeo.plan_action_geo : [];
  // Normaliser: supporter string[] ou object[]
  const planAction = rawPlan.map((item: any) => {
    if (typeof item === 'string') return { action: item, categorie: '', priorite: 'moyenne', impact: '', effort: 'moyen' };
    return item as { action: string; categorie: string; priorite: string; impact: string; effort: string };
  });

  const getPriorityBadge = (p: string) => {
    const pr = (p || '').toLowerCase();
    if (pr === 'haute') return { bg: '#FEE2E2', color: '#DC2626', label: 'Haute' };
    if (pr === 'moyenne') return { bg: '#FEF3C7', color: '#D97706', label: 'Moyenne' };
    return { bg: '#D1FAE5', color: '#059669', label: 'Basse' };
  };

  const getEffortBadge = (e: string) => {
    const ef = (e || '').toLowerCase();
    if (ef === 'faible') return { bg: '#D1FAE5', color: '#059669', label: 'Faible' };
    if (ef === 'moyen') return { bg: '#FEF3C7', color: '#D97706', label: 'Moyen' };
    return { bg: '#FEE2E2', color: '#DC2626', label: 'Élevé' };
  };

  return (
    <div className="recommendations-table" style={{ boxShadow: 'none', border: '1px solid #F1F5F9', padding: '24px', borderRadius: '16px' }}>
      {/* Header avec sélecteur de modèle - style CompetitorAnalysis */}
      <div className="card-header-with-selector">
        <h3 className="text-xl font-bold text-slate-900">Audit GEO</h3>
        <div className="model-selector">
          <span className="selector-label">Modèle:</span>
          <Select value={selectedModel} onValueChange={handleSetSelectedModel}>
            <SelectTrigger className="w-[200px] h-9 bg-white border-slate-200">
              <SelectValue placeholder="Choisir un modèle" />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((model) => (
                <SelectItem key={model} value={model}>
                  <div className="flex items-center gap-2">
                    {getModelLogo(model) ? (
                      <img src={getModelLogo(model)!} alt={model} className="w-5 h-5 object-contain" />
                    ) : (
                      <Zap size={16} className="text-blue-500" />
                    )}
                    <span>{model}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>


      {/* Plan d'action GEO du modèle sélectionné */}
      {planAction.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>Plan d'action</span>
            <span style={{
              padding: '2px 8px',
              background: '#EFF6FF',
              color: '#3B82F6',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 600
            }}>
              {planAction.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {planAction.map((item: any, idx: number) => {
              const priority = getPriorityBadge(item.priorite);
              const effort = getEffortBadge(item.effort);
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: 0, fontWeight: 500 }}>
                      {item.action}
                    </p>
                    {item.impact && (
                      <p style={{ fontSize: '12px', color: '#64748B', margin: 0, marginTop: '4px', lineHeight: '1.4' }}>
                        {item.impact}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <span style={{
                      padding: '2px 7px', borderRadius: '6px', fontSize: '10px', fontWeight: 600,
                      background: priority.bg, color: priority.color
                    }}>{priority.label}</span>
                    <span style={{
                      padding: '2px 7px', borderRadius: '6px', fontSize: '10px', fontWeight: 600,
                      background: effort.bg, color: effort.color
                    }}>{effort.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function InfosDetailleesView({ reportData }: { reportData: FullReportData | null }) {
  const [activeOptTab, setActiveOptTab] = useState<'overview' | 'schemas' | 'meta' | 'llms' | 'robots' | 'htmldiff' | 'simulation'>('overview');
  const [copied, setCopied] = useState<string | null>(null);

  // === BULK OPTIMIZATION STATE ===
  const [bulkMaxPages, setBulkMaxPages] = useState<number>(100);
  const [bulkConcurrency, setBulkConcurrency] = useState<number>(3);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkJobId, setBulkJobId] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<BulkJobProgress | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkPages, setBulkPages] = useState<BulkPageResult[]>([]);
  const [bulkResults, setBulkResults] = useState<BulkResultsResponse | null>(null);
  const [bulkPagesLoading, setBulkPagesLoading] = useState(false);
  const [selectedPageUrl, setSelectedPageUrl] = useState<string | null>(null);
  const [selectedPageRaw, setSelectedPageRaw] = useState<any | null>(null);
  const [selectedPageLoading, setSelectedPageLoading] = useState(false);
  const [pageDetailCopied, setPageDetailCopied] = useState<string | null>(null);
  const [bulkJobsHistory, setBulkJobsHistory] = useState<BulkJobSummary[]>([]);
  const [bulkJobsLoaded, setBulkJobsLoaded] = useState(false);

  // Domaine du site analysé (URL du rapport)
  const reportUrl = reportData?.report?.url || '';
  let reportDomain = reportUrl;
  try { reportDomain = new URL(reportUrl).origin; } catch {}

  let reportDomainHostname = '';
  try {
    reportDomainHostname = reportDomain ? new URL(reportDomain).hostname : '';
  } catch {
    reportDomainHostname = '';
  }

  const reportId = reportData?.report?.id;

  // Charger l'historique des jobs au montage et restaurer le dernier directement
  useEffect(() => {
    let cancelled = false;
    const loadJobs = async () => {
      const jobs = await listBulkJobs();
      if (cancelled) return;
      setBulkJobsHistory(jobs);
      setBulkJobsLoaded(true);

      if (jobs.length > 0 && !bulkJobId) {
        const latest = jobs[0];
        setBulkJobId(latest.job_id);

        if (latest.status === 'completed' || latest.status === 'failed') {
          // Job terminé → charger les pages directement
          setBulkPagesLoading(true);
          const pagesRes = await getBulkPages(latest.job_id, { per_page: 200, sort: 'score_desc' });
          if (cancelled) return;
          if (pagesRes?.pages) setBulkPages(pagesRes.pages);
          setBulkPagesLoading(false);
        } else {
          // Job en cours → lancer le polling
          setBulkLoading(true);
        }
      }
    };
    loadJobs();
    return () => { cancelled = true; };
  }, []);

  // Polling uniquement si le job est en cours
  useEffect(() => {
    if (!bulkJobId || !bulkLoading) return;
    let cancelled = false;
    const poll = async () => {
      const progress = await getBulkProgress(bulkJobId);
      if (cancelled) return;
      if (progress) {
        setBulkProgress(progress);
        if (progress.pages && progress.pages.length > 0) {
          setBulkPages(progress.pages);
        }
        if (progress.status === 'completed' || progress.status === 'failed' || progress.status === 'cancelled') {
          setBulkLoading(false);
          // Job vient de terminer → charger les pages
          const pagesRes = await getBulkPages(bulkJobId, { per_page: 200, sort: 'score_desc' });
          if (!cancelled && pagesRes?.pages) setBulkPages(pagesRes.pages);
          return;
        }
      }
      setTimeout(poll, 3000);
    };
    poll();
    return () => { cancelled = true; };
  }, [bulkJobId, bulkLoading]);

  const handleStartBulk = async () => {
    if (!reportId || !reportDomain) return;
    setBulkLoading(true);
    setBulkError(null);
    setBulkProgress(null);
    try {
      const result = await startBulkOptimization({
        domain_url: reportDomain,
        llmo_report_id: Number(reportId),
        max_pages: bulkMaxPages,
        concurrency: bulkConcurrency,
      });
      if (result?.job_id) {
        setBulkJobId(result.job_id);
        // Rafraîchir l'historique
        listBulkJobs().then(jobs => setBulkJobsHistory(jobs));
      } else {
        setBulkError('Impossible de lancer le job.');
        setBulkLoading(false);
      }
    } catch (err: any) {
      setBulkError(err?.message || 'Erreur lors du lancement.');
      setBulkLoading(false);
    }
  };

  const handleCancelBulk = async () => {
    if (!bulkJobId) return;
    await cancelBulkJob(bulkJobId);
    setBulkLoading(false);
    setBulkJobId(null);
    setBulkProgress(null);
    // Rafraîchir l'historique
    listBulkJobs().then(jobs => setBulkJobsHistory(jobs));
  };

  const handleLoadJob = async (job: BulkJobSummary) => {
    // Si on reclique sur le job déjà sélectionné → déselectionner
    if (bulkJobId === job.job_id) {
      setBulkJobId(null);
      setBulkProgress(null);
      setBulkPages([]);
      setBulkResults(null);
      setBulkError(null);
      setBulkLoading(false);
      return;
    }
    setBulkJobId(job.job_id);
    setBulkProgress(null);
    setBulkPages([]);
    setBulkResults(null);
    setBulkError(null);
    if (job.status === 'completed' || job.status === 'failed') {
      setBulkLoading(false);
      setBulkPagesLoading(true);
      const pagesRes = await getBulkPages(job.job_id, { per_page: 200, sort: 'score_desc' });
      if (pagesRes?.pages) setBulkPages(pagesRes.pages);
      setBulkPagesLoading(false);
    } else {
      setBulkLoading(true);
    }
  };

  const handlePageClick = async (pageUrl: string) => {
    setSelectedPageUrl(pageUrl);
    setSelectedPageRaw(null);
    setSelectedPageLoading(true);
    const data = await fetchPageOptimization(pageUrl);
    setSelectedPageRaw(data);
    setSelectedPageLoading(false);
  };

  const handlePageDetailCopy = (content: string, key: string) => {
    navigator.clipboard.writeText(content);
    setPageDetailCopied(key);
    setTimeout(() => setPageDetailCopied(null), 2000);
  };

  // Source prioritaire : crawl_optimizer de l'API
  // Structure API : { analyze: { score, recommendations, ... }, optimize: { llms_txt, robots_txt, schemas, html, ... }, simulate: { comparison, crawler_perspective, llm_analysis, ... } }
  const co = reportData?.crawl_optimizer as any;

  // Sous-objets principaux
  const coAnalyze = co?.analyze;
  const coOptimize = co?.optimize;
  const coSimulate = co?.simulate;

  // Fallback : package_optimisation_geo des analyses
  const auditGeoData = reportData?.analyses?.find((a: any) =>
    a.modules?.audit_geo?.package_optimisation_geo
  )?.modules?.audit_geo;
  const pkg = auditGeoData?.package_optimisation_geo;
  const tf = pkg?.technical_files as Record<string, { content: string; filename: string; description: string }> | undefined;

  // Score global : analyze > simulate.comparison.optimized > simulate.comparison.original > flat > audit_geo
  const scoreGlobal =
    coAnalyze?.score?.overall ??
    coSimulate?.comparison?.optimized_score?.overall ??
    coSimulate?.comparison?.original_score?.overall ??
    co?.score?.overall ??
    Math.round(auditGeoData?.score_global_geo ?? 0);

  // Scores détaillés
  const coBreakdown =
    coAnalyze?.score?.breakdown ??
    coSimulate?.comparison?.optimized_score?.breakdown ??
    coSimulate?.comparison?.original_score?.breakdown ??
    co?.score?.breakdown;
  const crawlOptimizerScores = coBreakdown ? [
    { key: 'structured_data', label: 'Données structurées', icon: Code, color: '#6366F1', score: Math.round(coBreakdown.structured_data ?? 0) },
    { key: 'semantic_html', label: 'HTML sémantique', icon: FileCode, color: '#8B5CF6', score: Math.round(coBreakdown.semantic_html ?? 0) },
    { key: 'entity_coverage', label: 'Couverture entités', icon: Globe, color: '#06B6D4', score: Math.round(coBreakdown.entity_coverage ?? 0) },
    { key: 'content_clarity', label: 'Clarté contenu', icon: FileText, color: '#F59E0B', score: Math.round(coBreakdown.content_clarity ?? 0) },
    { key: 'meta_completeness', label: 'Métadonnées', icon: Globe, color: '#10B981', score: Math.round(coBreakdown.meta_completeness ?? 0) },
  ].filter(c => c.score > 0) : null;

  // Fallback : scores depuis audit_geo
  const getScore = (audit: any, key: string): number | null => {
    const val = audit?.[key];
    if (typeof val === 'number') return val;
    if (typeof val === 'object' && val !== null && typeof val.score === 'number') return val.score;
    return null;
  };
  const auditGeoScores = [
    { key: 'donnees_structurees', label: 'Données structurées', icon: Code, color: '#6366F1' },
    { key: 'html_semantique', label: 'HTML sémantique', icon: FileCode, color: '#8B5CF6' },
    { key: 'accessibilite_crawlers', label: 'Accessibilité', icon: Globe, color: '#06B6D4' },
    { key: 'optimisation_contenu', label: 'Contenu', icon: FileText, color: '#F59E0B' },
    { key: 'metadonnees_techniques', label: 'Métadonnées', icon: Globe, color: '#10B981' },
    { key: 'conformite_standards', label: 'Standards', icon: Shield, color: '#EC4899' },
  ].map(cat => {
    const allScores = (reportData?.analyses || [])
      .map((a: any) => getScore(a.modules?.audit_geo, cat.key))
      .filter((s: any): s is number => typeof s === 'number' && s > 0);
    return { ...cat, score: allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0 };
  }).filter(c => c.score > 0);

  // Utiliser crawl_optimizer en priorité, sinon audit_geo
  const scores = crawlOptimizerScores || auditGeoScores;

  // Supprimer les emojis d'un texte
  const stripEmojis = (text: string) => text.replace(/\p{Emoji}/gu, (m) => /^[0-9#*]$/.test(m) ? m : '').replace(/ {2,}/g, ' ').replace(/^ +| +$/gm, '').trim();

  // Extraire les balises meta depuis le HTML optimise
  const extractMetaFromHtml = (html: string): { metaTags: string; openGraph: string } => {
    if (!html) return { metaTags: '', openGraph: '' };
    const metaLines: string[] = [];
    const ogLines: string[] = [];
    // Extraire toutes les balises <meta>, <title>, <link rel="canonical">
    const tagRegex = /<(meta|title|link)\b[^>]*\/?>/gi;
    let match;
    while ((match = tagRegex.exec(html)) !== null) {
      const tag = match[0];
      const tagLower = tag.toLowerCase();
      // Filtrer : ne garder que les link canonical
      if (match[1].toLowerCase() === 'link' && !tagLower.includes('canonical')) continue;
      // Séparer OG / Twitter des meta standards
      if (tagLower.includes('property="og:') || tagLower.includes("property='og:") ||
          tagLower.includes('name="twitter:') || tagLower.includes("name='twitter:")) {
        ogLines.push(tag);
      } else {
        metaLines.push(tag);
      }
    }
    // Extraire le contenu de <title>...</title>
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      metaLines.unshift(`<title>${titleMatch[1].trim()}</title>`);
    }
    return {
      metaTags: metaLines.join('\n'),
      openGraph: ogLines.join('\n'),
    };
  };

  // Fichiers : optimize > simulate.generated_files > technical_files
  const schemaContent = coOptimize?.schemas
    ? JSON.stringify(coOptimize.schemas, null, 2)
    : (tf?.schema_org_json?.content || '');
  const llmsContent = stripEmojis(coOptimize?.llms_txt || coSimulate?.generated_files?.llms_txt || tf?.llms_txt?.content || '');
  const llmsFullContent = stripEmojis(coOptimize?.llms_full_txt || coSimulate?.generated_files?.llms_full_txt || '');
  const robotsContent = stripEmojis(coOptimize?.robots_txt || coSimulate?.generated_files?.robots_txt || tf?.robots_txt?.content || '');
  const optimizedHtmlContent = coOptimize?.html || '';
  const extractedMeta = extractMetaFromHtml(optimizedHtmlContent);
  const metaTagsContent = stripEmojis(extractedMeta.metaTags || tf?.meta_tags?.content || '');
  const openGraphContent = stripEmojis(extractedMeta.openGraph || tf?.open_graph?.content || '');

  // Données enrichies
  const coRecommendations = coAnalyze?.recommendations || co?.recommendations || [];
  const coSchemasAdded = coOptimize?.metadata?.schemas_added || coSimulate?.comparison?.schemas_diff?.added || [];
  const coEnrichments = coOptimize?.metadata?.enrichments_applied
    || (coSimulate?.comparison?.enrichments_diff?.map((e: any) => e.description || e.type) ?? [])
    || [];
  const coMissingSchemas = coAnalyze?.missing_schemas || [];
  const coEntityCoverage = coAnalyze?.entity_coverage || {};
  const coPlatform = coAnalyze?.platform || coOptimize?.metadata?.platform || co?.platform || '';
  const coCrawlerPerspective = coSimulate?.crawler_perspective;
  const coOriginalScore = coSimulate?.comparison?.original_score;
  const coOptimizedScore = coSimulate?.comparison?.optimized_score;
  const coScoreDelta = coSimulate?.comparison?.score_delta;
  const coLlmAnalysis = coSimulate?.llm_analysis;
  const coRobotsAnalyze = co?.robots_analyze;
  const coStructuredDataCoverage = coAnalyze?.structured_data_coverage;

  // Plan d'action depuis audit_geo
  const planAction: string[] = (() => {
    if (!reportData?.analyses || reportData.analyses.length === 0) return [];
    for (const analysis of reportData.analyses) {
      if (analysis.modules?.audit_geo?.plan_action_geo && Array.isArray(analysis.modules.audit_geo.plan_action_geo)) {
        return analysis.modules.audit_geo.plan_action_geo.map((item: any) => {
          if (typeof item === 'string') return item;
          return item.action || String(item);
        });
      }
    }
    return [];
  })();

  // Déterminer si on a du contenu à afficher
  const hasAnyFileContent = !!(schemaContent || llmsContent || robotsContent || metaTagsContent || openGraphContent);
  const hasAnyData = scores.length > 0 || hasAnyFileContent || planAction.length > 0 || coRecommendations.length > 0;

  const handleCopy = (content: string, key: string) => {
    navigator.clipboard.writeText(content);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const fileTabsMeta: Record<string, { icon: any; badge: string }> = {
    schemas:  { icon: Code, badge: 'JSON-LD' },
    meta:     { icon: Globe, badge: 'HTML' },
    llms:     { icon: FileText, badge: 'TXT' },
    robots:   { icon: Shield, badge: 'TXT' },
    htmldiff: { icon: FileCode, badge: 'HTML' },
  };

  const hasSimulationData = !!(co || scores.length > 0 || coSchemasAdded.length > 0 || coEnrichments.length > 0 || coRecommendations.length > 0);

  const tabs = [
    { id: 'overview' as const, label: 'Vue d\'ensemble', tooltip: HELP.overviewTab },
    { id: 'schemas' as const, label: 'Schémas JSON-LD', has: !!schemaContent, tooltip: HELP.jsonLdSchemas },
    { id: 'meta' as const, label: 'Balises Meta & Enrichissements', has: !!(metaTagsContent || openGraphContent || coEnrichments.length > 0), tooltip: HELP.metaTags },
    { id: 'llms' as const, label: 'llms.txt', has: !!(llmsContent || llmsFullContent), tooltip: HELP.llmsTxt },
    { id: 'robots' as const, label: 'robots.txt', has: !!robotsContent, tooltip: HELP.robotsTxt },
    { id: 'htmldiff' as const, label: 'Comparaison HTML', has: !!optimizedHtmlContent, tooltip: HELP.htmlDiff },
    { id: 'simulation' as const, label: 'Simulation', has: hasSimulationData, tooltip: HELP.aiSimulation, beta: true },
  ];

  // Composant réutilisable : carte fichier technique
  const FileCard = ({ title, description, content, copyKey, filename, fileType }: {
    title: string; description: string; content: string; copyKey: string; filename: string; fileType: string;
  }) => {
    const meta = fileTabsMeta[activeOptTab] || fileTabsMeta.schemas;
    const Icon = meta.icon;
    return (
      <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E8ECF1', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={14} style={{ color: '#64748B' }} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{title}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>{description}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => handleCopy(content, copyKey)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '7px',
                border: '1px solid #EEEDF5', cursor: 'pointer', fontSize: '11px', fontWeight: 500, transition: 'all 0.2s',
                background: copied === copyKey ? '#F1F5F9' : '#FFFFFF', color: copied === copyKey ? '#334155' : '#64748B',
              }}
            >
              {copied === copyKey ? <><Check size={11} /> Copie</> : <><Copy size={11} /> Copier</>}
            </button>
            <button
              onClick={() => downloadFile(content, filename, fileType)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '7px',
                border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                background: '#334155', color: '#FFFFFF', transition: 'all 0.2s',
              }}
            >
              <Download size={11} /> Télécharger
            </button>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '8px', right: '12px', padding: '2px 8px', borderRadius: '5px', background: '#F1F5F9', fontSize: '10px', fontWeight: 600, color: '#64748B', letterSpacing: '0.5px' }}>
            {meta.badge}
          </div>
          <pre style={{
            padding: '16px 20px', margin: 0, fontSize: '12px', fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            color: '#334155', overflowX: 'auto', maxHeight: '500px', background: '#FAFAFC', lineHeight: '1.6',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {(() => {
              const raw = fileType === 'application/json'
                ? (() => { try { return JSON.stringify(JSON.parse(content), null, 2); } catch { return content; } })()
                : content;
              if (fileType !== 'text/html') return raw;
              // Coloration syntaxique HTML basique
              const parts: React.ReactNode[] = [];
              const regex = /(<!--[\s\S]*?-->)|(<\/?[a-zA-Z][a-zA-Z0-9-]*)((?:\s+[a-zA-Z:_][\w:.-]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*))?)*)\s*(\/?>)/g;
              let lastIndex = 0;
              let m;
              while ((m = regex.exec(raw)) !== null) {
                if (m.index > lastIndex) parts.push(raw.slice(lastIndex, m.index));
                if (m[1]) {
                  // Commentaire
                  parts.push(<span key={m.index} style={{ color: '#94A3B8', fontStyle: 'italic' }}>{m[1]}</span>);
                } else {
                  // Tag
                  const tagParts: React.ReactNode[] = [];
                  tagParts.push(<span key={`t${m.index}`} style={{ color: '#0F172A', fontWeight: 500 }}>{m[2]}</span>);
                  // Attributs
                  if (m[3]) {
                    const attrRegex = /(\s+)([a-zA-Z:_][\w:.-]*)(\s*=\s*)?("[^"]*"|'[^']*'|[^\s>]*)?/g;
                    let am;
                    while ((am = attrRegex.exec(m[3])) !== null) {
                      tagParts.push(am[1]); // espace
                      tagParts.push(<span key={`a${m.index}-${am.index}`} style={{ color: '#64748B' }}>{am[2]}</span>);
                      if (am[3]) tagParts.push(am[3]); // =
                      if (am[4]) tagParts.push(<span key={`v${m.index}-${am.index}`} style={{ color: '#0369A1' }}>{am[4]}</span>);
                    }
                  }
                  tagParts.push(<span key={`c${m.index}`} style={{ color: '#0F172A', fontWeight: 500 }}>{m[4]}</span>);
                  parts.push(<span key={m.index}>{tagParts}</span>);
                }
                lastIndex = m.index + m[0].length;
              }
              if (lastIndex < raw.length) parts.push(raw.slice(lastIndex));
              return parts;
            })()}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="view-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ═══ NAVIGATION ═══ */}
      <div className="flex gap-1 p-1 bg-slate-50 rounded-xl border border-[#EEEDF5] overflow-x-auto scrollbar-none">
        {tabs.map(tab => {
          const isActive = activeOptTab === tab.id;
          const hasContent = tab.id === 'overview' || tab.has;
          return (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => hasContent && setActiveOptTab(tab.id)}
                  className="shrink-0 px-3 sm:px-3.5 py-2 text-xs sm:text-[12.5px] rounded-[9px] transition-all whitespace-nowrap"
                  style={{
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#0F172A' : hasContent ? '#64748B' : '#CBD5E1',
                    background: isActive ? '#FFFFFF' : 'transparent',
                    border: isActive ? '1px solid #E2E8F0' : '1px solid transparent',
                    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                    cursor: hasContent ? 'pointer' : 'default',
                  }}
                >
                  {tab.label}
                  {(tab as any).beta && (
                    <span
                      className="inline-block ml-1.5 align-middle"
                      style={{
                        fontSize: '9px', fontWeight: 700, letterSpacing: '0.6px',
                        padding: '1px 5px', borderRadius: '4px',
                        background: isActive ? '#EDE9FE' : '#F5F3FF',
                        color: '#7C3AED',
                        textTransform: 'uppercase',
                      }}
                    >
                      Beta
                    </span>
                  )}
                  {tab.id !== 'overview' && tab.has && (
                    <span className="inline-block w-[5px] h-[5px] rounded-full ml-1.5 align-middle"
                      style={{ background: isActive ? '#0F172A' : '#CBD5E1' }}
                    />
                  )}
                </button>
              </TooltipTrigger>
              {tab.tooltip && (
                <TooltipContent side="bottom" sideOffset={8} className="max-w-[280px] p-0 overflow-hidden rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgba(15,23,42,0.12)] bg-white font-sans">
                  <div className="px-4 pt-4 pb-2">
                    <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#1A3AFF]">{tab.tooltip.title}</p>
                  </div>
                  <div className="px-4 pb-4">
                    <p className="text-[13px] leading-relaxed text-slate-500">{tab.tooltip.description}</p>
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </div>

      {/* ═══ CONTENU DES ONGLETS ═══ */}
      {activeOptTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Score global + sous-scores */}
          {scores.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-3 items-start">
              {/* Score global a gauche */}
              <ScoreCard
                title="Score Global"
                score={scoreGlobal}
                description={`${scores.length} catégorie${scores.length > 1 ? 's' : ''}`}
              />
              {/* Sous-scores a droite */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {scores.map(cat => (
                    <ScoreCard
                      key={cat.key}
                      title={cat.label}
                      score={cat.score}
                      compact
                    />
                ))}
              </div>
            </div>
          )}

          {/* Infos plateforme + enrichissements */}
          {co && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]" style={{ gap: '10px' }}>
              {coPlatform && (
                <div style={{ padding: '14px 16px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8ECF1' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Plateforme</div>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '6px', background: '#F1F5F9', fontSize: '13px', fontWeight: 600, color: '#334155', textTransform: 'capitalize' }}>{coPlatform}</span>
                </div>
              )}
              {coSchemasAdded.length > 0 && (
                <div style={{ padding: '14px 16px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8ECF1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Schémas ajoutés</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>{coSchemasAdded.length}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B' }}>{coSchemasAdded.join(' | ')}</span>
                </div>
              )}
              {coEnrichments.length > 0 && (
                <div style={{ padding: '14px 16px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8ECF1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Enrichissements</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>{coEnrichments.length}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B' }}>{coEnrichments.map((e: string) => e.replace(/_/g, ' ')).join(' | ')}</span>
                </div>
              )}
            </div>
          )}

          {/* Recommandations */}
          {coRecommendations.length > 0 && (
            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E8ECF1', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Recommandations</span>
              </div>
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {coRecommendations.map((rec: any, i: number) => {
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
            </div>
          )}

          {/* Plan d'action */}
          {planAction.length > 0 && (
            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E8ECF1', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Plan d'action</span>
              </div>
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {planAction.map((action, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px',
                    padding: '10px 14px', borderRadius: '10px', background: '#FAFAFC',
                  }}>
                    <span style={{
                      width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                      background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 700, color: '#64748B',
                    }}>{i + 1}</span>
                    <span style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ OPTIMISATION BULK DU SITE ═══ */}
          {reportId && reportDomain && (
            <div style={{ background: 'linear-gradient(135deg, #F5F3FF 0%, #EEF2FF 50%, #F0F9FF 100%)', borderRadius: '14px', border: '1.5px solid #C7D2FE', overflow: 'hidden', boxShadow: '0 4px 16px rgba(99, 102, 241, 0.1)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #DDD6FE', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={20} style={{ color: '#334155' }} />
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#312E81' }}>Optimiser le site complet</div>
                  <div style={{ fontSize: '13px', color: '#6366F1', fontWeight: 500 }}>Optimiser toutes les pages de votre site</div>
                  {reportDomainHostname && (
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                      Domaine crawlé : <span style={{ fontWeight: 600, color: '#334155' }}>{reportDomainHostname}</span>
                      <span style={{ marginLeft: '6px', fontSize: '11px', color: '#94A3B8' }}>(celui du rapport)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dernière analyse */}
              {bulkJobsHistory.length > 0 && (() => {
                const job = bulkJobsHistory[0];
                const isActive = bulkJobId === job.job_id;
                const statusIcon = job.status === 'completed' ? <CheckCircle size={12} style={{ color: '#16A34A' }} />
                  : job.status === 'failed' || job.status === 'cancelled' ? <XCircle size={12} style={{ color: '#DC2626' }} />
                  : <Loader2 size={12} className="animate-spin" style={{ color: '#6366F1' }} />;
                let domain = job.domain_url;
                try { domain = new URL(job.domain_url).hostname; } catch {}
                const date = job.started_at ? new Date(job.started_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
                return (
                  <div style={{ padding: '10px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                      onClick={() => handleLoadJob(job)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '6px 14px', borderRadius: '8px',
                        border: isActive ? '1.5px solid #6366F1' : '1px solid #E2E8F0',
                        background: isActive ? '#EEF2FF' : '#FFFFFF',
                        cursor: 'pointer', transition: 'all 0.15s',
                        fontSize: '12px', color: isActive ? '#4338CA' : '#64748B', fontWeight: isActive ? 600 : 500,
                      }}
                    >
                      {statusIcon}
                      <span>{domain}</span>
                      <span style={{ color: '#CBD5E1' }}>|</span>
                      <span>{job.pages_completed}/{job.pages_total}</span>
                      {job.avg_score != null && (
                        <span style={{ fontWeight: 700, color: job.avg_score >= 70 ? '#16A34A' : job.avg_score >= 50 ? '#D97706' : '#DC2626' }}>{Math.round(job.avg_score)}</span>
                      )}
                      {date && <span style={{ color: '#94A3B8', fontSize: '11px' }}>{date}</span>}
                    </button>
                    {bulkJobId && (
                      <button
                        onClick={() => { setBulkJobId(null); setBulkProgress(null); setBulkPages([]); setBulkResults(null); setBulkError(null); setBulkLoading(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '6px 12px', borderRadius: '8px',
                          border: '1px dashed #CBD5E1', background: '#FFFFFF',
                          cursor: 'pointer', fontSize: '11px', color: '#64748B', fontWeight: 500,
                        }}
                      >
                        <Sparkles size={11} /> Nouveau
                      </button>
                    )}
                  </div>
                );
              })()}

              <div style={{ padding: '16px 20px' }}>
                {!bulkJobId && !bulkProgress && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '0 0 auto' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px' }}>
                        Nombre de pages
                      </label>
                      <select
                        value={bulkMaxPages}
                        onChange={(e) => setBulkMaxPages(Number(e.target.value))}
                        disabled={bulkLoading}
                        style={{
                          padding: '8px 32px 8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          background: '#F8FAFC',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#334155',
                          cursor: 'pointer',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 10px center',
                        }}
                      >
                        <option value={10}>10 pages</option>
                        <option value={50}>50 pages</option>
                        <option value={100}>100 pages</option>
                        <option value={250}>250 pages</option>
                        <option value={500}>500 pages</option>
                        <option value={1000}>1 000 pages</option>
                        <option value={2500}>2 500 pages</option>
                        <option value={5000}>5 000 pages</option>
                      </select>
                    </div>

                    <div style={{ flex: '0 0 auto' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px' }}>
                        Requêtes parallèles
                      </label>
                      <select
                        value={bulkConcurrency}
                        onChange={(e) => setBulkConcurrency(Number(e.target.value))}
                        disabled={bulkLoading}
                        style={{
                          padding: '8px 32px 8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          background: '#F8FAFC',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#334155',
                          cursor: 'pointer',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 10px center',
                        }}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <option key={n} value={n}>{n} {n === 1 ? 'page' : 'pages'} en parallele</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ flex: '1 1 auto' }} />

                    <button
                      onClick={handleStartBulk}
                      disabled={bulkLoading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '9px 18px', borderRadius: '8px',
                        border: '1px solid #E2E8F0', background: '#FFFFFF',
                        color: bulkLoading ? '#94A3B8' : '#334155', fontSize: '13px', fontWeight: 600,
                        cursor: bulkLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {bulkLoading ? (
                        <><Loader2 size={14} className="animate-spin" /> Lancement...</>
                      ) : (
                        <><Play size={14} /> Lancer l'optimisation</>
                      )}
                    </button>
                  </div>
                )}

                {bulkError && (
                  <div style={{ marginTop: '10px', padding: '10px 14px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={14} style={{ color: '#DC2626', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#B91C1C' }}>{bulkError}</span>
                  </div>
                )}

                {bulkProgress && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Status + Cancel */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {bulkProgress.status === 'completed' ? (
                          <CheckCircle size={16} style={{ color: '#16A34A' }} />
                        ) : bulkProgress.status === 'failed' || bulkProgress.status === 'cancelled' ? (
                          <XCircle size={16} style={{ color: '#DC2626' }} />
                        ) : (
                          <Loader2 size={16} className="animate-spin" style={{ color: '#6366F1' }} />
                        )}
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', textTransform: 'capitalize' }}>
                          {bulkProgress.status === 'discovering' ? 'Decouverte des pages...' :
                           bulkProgress.status === 'processing' ? 'Optimisation en cours...' :
                           bulkProgress.status === 'completed' ? 'Termine' :
                           bulkProgress.status === 'failed' ? 'Echoue' :
                           bulkProgress.status === 'cancelled' ? 'Annule' : bulkProgress.status}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                          Phase: {bulkProgress.phase}
                        </span>
                      </div>
                      {(bulkProgress.status === 'discovering' || bulkProgress.status === 'processing') && (
                        <button
                          onClick={handleCancelBulk}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '5px 12px', borderRadius: '6px',
                            border: '1px solid #FECACA', background: '#FEF2F2',
                            color: '#DC2626', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          <X size={12} /> Annuler
                        </button>
                      )}
                    </div>

                    {/* Progress bar */}
                    {bulkProgress.processing.total > 0 && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', color: '#64748B' }}>
                            {bulkProgress.processing.completed}/{bulkProgress.processing.total} pages
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                            {Math.round((bulkProgress.processing.completed / bulkProgress.processing.total) * 100)}%
                          </span>
                        </div>
                        <div style={{ height: '6px', borderRadius: '3px', background: '#F1F5F9', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: '3px',
                            background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                            width: `${(bulkProgress.processing.completed / bulkProgress.processing.total) * 100}%`,
                            transition: 'width 0.5s ease',
                          }} />
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" style={{ gap: '8px' }}>
                      {bulkProgress.discovery.urls_found > 0 && (
                        <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#F8FAFC', textAlign: 'center' }}>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: '#334155' }}>{bulkProgress.discovery.urls_found}</div>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>URLs trouvees</div>
                        </div>
                      )}
                      {bulkProgress.processing.completed > 0 && (
                        <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#F0FDF4', textAlign: 'center' }}>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: '#16A34A' }}>{bulkProgress.processing.completed}</div>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>Optimisees</div>
                        </div>
                      )}
                      {bulkProgress.processing.failed > 0 && (
                        <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#FEF2F2', textAlign: 'center' }}>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: '#DC2626' }}>{bulkProgress.processing.failed}</div>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>Echouees</div>
                        </div>
                      )}
                      {bulkProgress.avg_score != null && (
                        <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#EEF2FF', textAlign: 'center' }}>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: '#6366F1' }}>{Math.round(bulkProgress.avg_score)}</div>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>Score moyen</div>
                        </div>
                      )}
                      {bulkProgress.elapsed_seconds > 0 && (
                        <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#F8FAFC', textAlign: 'center' }}>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: '#334155' }}>
                            {bulkProgress.elapsed_seconds < 60 ? `${Math.round(bulkProgress.elapsed_seconds)}s` : `${Math.floor(bulkProgress.elapsed_seconds / 60)}m${Math.round(bulkProgress.elapsed_seconds % 60)}s`}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>Duree</div>
                        </div>
                      )}
                    </div>

                    {/* Langues détectées */}
                    {bulkProgress.languages && bulkProgress.languages.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>Langues:</span>
                        {bulkProgress.languages.map(lang => (
                          <span key={lang} style={{ padding: '2px 8px', borderRadius: '4px', background: '#F1F5F9', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>{lang}</span>
                        ))}
                      </div>
                    )}


                    {/* Types de pages */}
                    {bulkResults?.page_types && Object.keys(bulkResults.page_types).length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>Types:</span>
                        {Object.entries(bulkResults.page_types).map(([type, count]) => (
                          <span key={type} style={{ padding: '2px 8px', borderRadius: '4px', background: '#EEF2FF', fontSize: '11px', fontWeight: 600, color: '#6366F1', textTransform: 'capitalize' }}>
                            {type} ({count})
                          </span>
                        ))}
                      </div>
                    )}


                    {/* Langues détectées (depuis results) */}
                    {bulkResults?.summary?.languages && bulkResults.summary.languages.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>Langues:</span>
                        {bulkResults.summary.languages.map(lang => (
                          <span key={lang} style={{ padding: '2px 8px', borderRadius: '4px', background: '#F1F5F9', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>{lang}</span>
                        ))}
                      </div>
                    )}

                    {/* Bouton relancer si terminé/annulé */}
                    {(bulkProgress.status === 'completed' || bulkProgress.status === 'failed' || bulkProgress.status === 'cancelled') && (
                      <button
                        onClick={() => { setBulkJobId(null); setBulkProgress(null); setBulkError(null); setBulkPages([]); setBulkResults(null); }}
                        style={{
                          alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '7px 14px', borderRadius: '7px',
                          border: '1px solid #E2E8F0', background: '#FFFFFF',
                          color: '#334155', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                        }}
                      >
                        <RotateCcw size={12} /> Nouvelle optimisation
                      </button>
                    )}
                  </div>
                )}

                {/* Détail des pages — en dehors du bloc bulkProgress */}
                {bulkPagesLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', justifyContent: 'center', color: '#64748B' }}>
                    <Loader2 size={14} className="animate-spin" />
                    <span style={{ fontSize: '13px' }}>Chargement des pages...</span>
                  </div>
                )}
                {!bulkPagesLoading && bulkPages.length > 0 && (
                  <div style={{ background: '#FAFAFC', borderRadius: '10px', border: '1px solid #E8ECF1', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #E8ECF1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Détail des pages ({bulkPages.length})</span>
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {bulkPages.map((page, idx) => {
                        const statusColor = page.status === 'completed' ? '#16A34A' : page.status === 'failed' ? '#DC2626' : page.status === 'processing' ? '#F59E0B' : '#94A3B8';
                        const statusBg = page.status === 'completed' ? '#F0FDF4' : page.status === 'failed' ? '#FEF2F2' : page.status === 'processing' ? '#FFFBEB' : '#F8FAFC';
                        let shortUrl = page.url;
                        try { shortUrl = new URL(page.url).pathname; } catch {}
                        if (shortUrl === '/') shortUrl = '/  (accueil)';
                        return (
                          <div key={idx} onClick={() => page.status === 'completed' && handlePageClick(page.url)} style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 16px',
                            borderBottom: idx < bulkPages.length - 1 ? '1px solid #F1F5F9' : 'none',
                            background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFC',
                            cursor: page.status === 'completed' ? 'pointer' : 'default',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => { if (page.status === 'completed') e.currentTarget.style.background = '#EEF2FF'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? '#FFFFFF' : '#FAFAFC'; }}
                          >
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '12.5px', fontWeight: 500, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={page.url}>
                                {shortUrl}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                                {page.language && <span style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase' }}>{page.language}</span>}
                                {page.page_type && <span style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'capitalize' }}>{page.page_type}</span>}
                                {page.schemas_added && page.schemas_added.length > 0 && (
                                  <span style={{ fontSize: '10px', color: '#94A3B8' }}>{page.schemas_added.length} schema{page.schemas_added.length > 1 ? 's' : ''}</span>
                                )}
                                {page.processing_time_ms != null && (
                                  <span style={{ fontSize: '10px', color: '#94A3B8' }}>{page.processing_time_ms < 1000 ? `${page.processing_time_ms}ms` : `${(page.processing_time_ms / 1000).toFixed(1)}s`}</span>
                                )}
                                {page.error_message && (
                                  <span style={{ fontSize: '10px', color: '#DC2626' }} title={page.error_message}>Erreur</span>
                                )}
                              </div>
                            </div>
                            {page.score != null ? (
                              <div style={{
                                padding: '4px 10px', borderRadius: '6px', background: statusBg,
                                fontSize: '13px', fontWeight: 700,
                                color: page.score >= 80 ? '#16A34A' : page.score >= 60 ? '#F59E0B' : page.score >= 40 ? '#D97706' : '#DC2626',
                                minWidth: '44px', textAlign: 'center',
                              }}>
                                {Math.round(page.score)}
                              </div>
                            ) : (
                              <div style={{ padding: '4px 10px', borderRadius: '6px', background: '#F8FAFC', fontSize: '12px', color: '#CBD5E1', minWidth: '44px', textAlign: 'center' }}>
                                {page.status === 'processing' ? '...' : '-'}
                              </div>
                            )}
                            {page.status === 'completed' && (
                              <ChevronRight size={14} style={{ color: '#94A3B8', flexShrink: 0 }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fichiers techniques disponibles */}
          {scores.length === 0 && !co && hasAnyFileContent && (
            <div style={{ padding: '16px 20px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>Fichiers techniques disponibles</div>
              <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: '1.5' }}>
                Consultez les onglets ci-dessus pour acceder aux fichiers Schema.org, llms.txt, robots.txt et meta tags.
              </p>
            </div>
          )}

          {/* Aucune donnee */}
          {!hasAnyData && (
            <div style={{ textAlign: 'center', padding: '40px 24px', color: '#94A3B8' }}>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#64748B', marginBottom: '4px' }}>Aucune donnee d'optimisation disponible</div>
              <div style={{ fontSize: '13px' }}>Les donnees seront disponibles une fois l'analyse terminee.</div>
            </div>
          )}
        </div>
      )}

      {activeOptTab === 'simulation' && (
        <SimulationTab
          crawlScore={coBreakdown ? { overall: scoreGlobal, breakdown: coBreakdown } : (scoreGlobal > 0 ? { overall: scoreGlobal } : undefined)}
          platform={coPlatform}
          schemasAdded={coSchemasAdded}
          enrichments={coEnrichments}
          existingSchemas={coAnalyze?.existing_schemas || []}
          missingSchemas={coMissingSchemas}
          recommendations={coRecommendations}
          entityCoverage={coEntityCoverage}
          structuredDataCoverage={coStructuredDataCoverage}
          auditGeoData={auditGeoData}
          crawlerPerspective={coCrawlerPerspective}
          llmAnalysis={coLlmAnalysis}
          originalScore={coOriginalScore}
          optimizedScore={coOptimizedScore}
          scoreDelta={coScoreDelta}
        />
      )}

      {activeOptTab === 'schemas' && schemaContent && (() => {
        // Parser les schemas pour le SchemaPreview
        let parsedSchemas: any[] = [];
        try {
          const parsed = JSON.parse(schemaContent);
          if (Array.isArray(parsed)) {
            parsedSchemas = parsed;
          } else if (parsed['@graph']) {
            parsedSchemas = parsed['@graph'];
          } else {
            parsedSchemas = [parsed];
          }
        } catch {
          parsedSchemas = [];
        }

        return parsedSchemas.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <SchemaPreview schemas={parsedSchemas} title="Schema.org JSON-LD" />
            <FileCard
              title="Telecharger le Schema.org complet"
              description="Données structurées pour améliorer la compréhension de votre site par les crawlers IA"
              content={schemaContent}
              copyKey="schema"
              filename={tf?.schema_org_json?.filename || 'schema.json'}
              fileType="application/json"
            />
          </div>
        ) : (
          <FileCard
            title="Schema.org JSON-LD"
            description="Données structurées pour améliorer la compréhension de votre site par les robots d'indexation"
            content={schemaContent}
            copyKey="schema"
            filename={tf?.schema_org_json?.filename || 'schema.json'}
            fileType="application/json"
          />
        );
      })()}

      {activeOptTab === 'meta' && (metaTagsContent || openGraphContent || coEnrichments.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Enrichissements appliques */}
          {coEnrichments.length > 0 && (
            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E8ECF1', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Enrichissements appliques</span>
                <span style={{ marginLeft: '8px', fontSize: '11px', color: '#94A3B8' }}>{coEnrichments.length} modification{coEnrichments.length > 1 ? 's' : ''}</span>
              </div>
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {coEnrichments.map((enrichment: string, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: '#FAFAFC' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#94A3B8', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#334155' }}>{enrichment.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {metaTagsContent && (
            <FileCard
              title="Meta Tags HTML"
              description="Balises meta optimisées : canonical, robots, language"
              content={metaTagsContent}
              copyKey="meta"
              filename={tf?.meta_tags?.filename || 'meta-tags.html'}
              fileType="text/html"
            />
          )}
          {openGraphContent && (
            <FileCard
              title="Open Graph Tags"
              description="Balises de partage social et compatibilité IA"
              content={openGraphContent}
              copyKey="og"
              filename={tf?.open_graph?.filename || 'open-graph.html'}
              fileType="text/html"
            />
          )}
        </div>
      )}

      {activeOptTab === 'llms' && (llmsContent || llmsFullContent) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {llmsContent && (
            <FileCard
              title="llms.txt"
              description="Version courte pour les LLMs"
              content={llmsContent}
              copyKey="llms"
              filename={tf?.llms_txt?.filename || 'llms.txt'}
              fileType="text/plain"
            />
          )}
          {llmsFullContent && (
            <FileCard
              title="llms-full.txt"
              description="Version complete avec tout le contexte du site"
              content={llmsFullContent}
              copyKey="llmsfull"
              filename="llms-full.txt"
              fileType="text/plain"
            />
          )}
        </div>
      )}

      {activeOptTab === 'robots' && robotsContent && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Analyse robots.txt existant */}
          {coRobotsAnalyze && (
            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E8ECF1', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Analyse du robots.txt actuel</span>
                <span style={{ fontSize: '20px', fontWeight: 700, color: '#334155' }}>{coRobotsAnalyze.score}/100</span>
              </div>
              {coRobotsAnalyze.issues?.length > 0 && (
                <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {coRobotsAnalyze.issues.map((issue: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', borderRadius: '8px', background: '#FAFAFC' }}>
                      {issue.type === 'warning' ? <AlertTriangle size={12} style={{ color: '#94A3B8', flexShrink: 0 }} /> : <Info size={12} style={{ color: '#94A3B8', flexShrink: 0 }} />}
                      <span style={{ fontSize: '12px', color: '#334155' }}>{issue.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <FileCard
            title="robots.txt optimise"
            description="Allow explicites pour GPTBot, ClaudeBot, PerplexityBot et autres crawlers IA"
            content={robotsContent}
            copyKey="robots"
            filename={tf?.robots_txt?.filename || 'robots.txt'}
            fileType="text/plain"
          />
        </div>
      )}

      {activeOptTab === 'htmldiff' && optimizedHtmlContent && (() => {
        const originalHtml = (reportData?.analyses || []).reduce((html: string, a: any) => {
          if (html) return html;
          return a.modules?.audit_geo?.original_html || a.modules?.audit_geo?.html_original || '';
        }, '');
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {originalHtml ? (
              <HtmlDiffViewer original={originalHtml} optimized={optimizedHtmlContent} />
            ) : (
              <FileCard
                title="HTML Optimise"
                description="Version optimisee de votre page avec schemas et balises enrichies"
                content={optimizedHtmlContent}
                copyKey="htmlview"
                filename="optimized.html"
                fileType="text/html"
              />
            )}
          </div>
        );
      })()}

      {/* ═══ MODAL DETAIL PAGE ═══ */}
      <Dialog open={!!selectedPageUrl} onOpenChange={(open) => { if (!open) { setSelectedPageUrl(null); setSelectedPageRaw(null); } }}>
        <DialogContent style={{ maxWidth: 'min(1400px, calc(100vw - 300px))', width: 'calc(100vw - 300px)', maxHeight: 'calc(100vh - 40px)', height: 'calc(100vh - 40px)', borderRadius: '12px', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', marginLeft: 'auto', marginRight: '20px' }}>
          <DialogHeader style={{ padding: '20px 24px 12px', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
            <DialogTitle style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
              Detail de la page
            </DialogTitle>
            <DialogDescription style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', wordBreak: 'break-all' }}>
              {selectedPageUrl}
            </DialogDescription>
          </DialogHeader>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 24px' }}>
            {selectedPageLoading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '40px 0', color: '#64748B' }}>
                <Loader2 size={18} className="animate-spin" />
                <span style={{ fontSize: '14px' }}>Chargement des donnees...</span>
              </div>
            )}

            {!selectedPageLoading && !selectedPageRaw && selectedPageUrl && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
                <AlertCircle size={24} style={{ margin: '0 auto 8px', color: '#DC2626' }} />
                <div style={{ fontSize: '13px' }}>Impossible de charger les donnees de cette page.</div>
              </div>
            )}

            {selectedPageRaw && (() => {
              // Normaliser: l'API peut renvoyer FullOptimizeResponse ou CrawlOptimizerResult
              const raw = selectedPageRaw as any;
              const pgScore = raw.metadata?.score || raw.score || null;
              const pgOverall = pgScore?.overall ?? null;
              const pgBreakdown = pgScore?.breakdown || null;
              const pgPlatform = raw.metadata?.platform || raw.platform || '';
              const pgSchemasAdded: string[] = raw.metadata?.schemas_added || raw.schemas_added || [];
              const pgEnrichments: string[] = raw.metadata?.enrichments_applied || raw.enrichments_applied || [];
              const pgSchemas: any[] = raw.schemas || [];
              const pgLlmsTxt: string = raw.llms_txt || '';
              const pgLlmsFullTxt: string = raw.llms_full_txt || '';
              const pgRobotsTxt: string = raw.robots_txt || '';
              const pgRecommendations: Array<{ message: string; details?: string; priority: 'high' | 'medium' | 'low' }> = raw.recommendations || [];
              const pgHtml: string = raw.html || '';
              const pgProcessingTime: number | null = raw.metadata?.processing_time_ms || raw.processing_time_ms || null;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Score + infos */}
                  {pgOverall != null && (
                    <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3 items-start">
                      <div style={{ padding: '16px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E8ECF1', textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: pgOverall >= 80 ? '#16A34A' : pgOverall >= 60 ? '#F59E0B' : '#DC2626' }}>
                          {Math.round(pgOverall)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Score</div>
                      </div>
                      {pgBreakdown && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {Object.entries(pgBreakdown).map(([key, val]) => (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '11px', color: '#64748B', flex: '0 0 140px', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                              <div style={{ flex: 1, height: '5px', borderRadius: '3px', background: '#F1F5F9', overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: '3px', background: (val as number) >= 80 ? '#16A34A' : (val as number) >= 60 ? '#F59E0B' : '#DC2626', width: `${val}%` }} />
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155', width: '28px', textAlign: 'right' }}>{Math.round(val as number)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Badges plateforme / schemas / enrichissements / temps */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {pgPlatform && (
                      <span style={{ padding: '3px 10px', borderRadius: '6px', background: '#F1F5F9', fontSize: '12px', fontWeight: 600, color: '#334155', textTransform: 'capitalize' }}>{pgPlatform}</span>
                    )}
                    {pgSchemasAdded.length > 0 && (
                      <span style={{ padding: '3px 10px', borderRadius: '6px', background: '#EEF2FF', fontSize: '12px', fontWeight: 600, color: '#6366F1' }}>
                        {pgSchemasAdded.length} schema{pgSchemasAdded.length > 1 ? 's' : ''}: {pgSchemasAdded.join(', ')}
                      </span>
                    )}
                    {pgEnrichments.length > 0 && (
                      <span style={{ padding: '3px 10px', borderRadius: '6px', background: '#F0FDF4', fontSize: '12px', fontWeight: 600, color: '#16A34A' }}>
                        {pgEnrichments.length} enrichissement{pgEnrichments.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {pgProcessingTime != null && (
                      <span style={{ padding: '3px 10px', borderRadius: '6px', background: '#F8FAFC', fontSize: '12px', color: '#64748B' }}>
                        {pgProcessingTime < 1000 ? `${pgProcessingTime}ms` : `${(pgProcessingTime / 1000).toFixed(1)}s`}
                      </span>
                    )}
                  </div>

                  {/* Schema.org JSON-LD — coloration syntaxique */}
                  {pgSchemas.length > 0 && (() => {
                    const jsonStr = JSON.stringify(pgSchemas, null, 2);
                    // Coloration syntaxique JSON
                    const colorizeJson = (raw: string): React.ReactNode[] => {
                      const parts: React.ReactNode[] = [];
                      const regex = /("(?:\\.|[^"\\])*")\s*(:)?|(\b(?:true|false|null)\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
                      let lastIndex = 0;
                      let m;
                      while ((m = regex.exec(raw)) !== null) {
                        if (m.index > lastIndex) parts.push(<span key={`p${lastIndex}`} style={{ color: '#64748B' }}>{raw.slice(lastIndex, m.index)}</span>);
                        if (m[1]) {
                          if (m[2]) {
                            // clé JSON
                            parts.push(<span key={`k${m.index}`} style={{ color: '#6366F1', fontWeight: 500 }}>{m[1]}</span>);
                            parts.push(<span key={`c${m.index}`} style={{ color: '#64748B' }}>{m[2]}</span>);
                          } else {
                            // valeur string
                            parts.push(<span key={`s${m.index}`} style={{ color: '#16A34A' }}>{m[1]}</span>);
                          }
                        } else if (m[3]) {
                          parts.push(<span key={`b${m.index}`} style={{ color: '#D97706', fontWeight: 600 }}>{m[3]}</span>);
                        } else if (m[4]) {
                          parts.push(<span key={`n${m.index}`} style={{ color: '#0EA5E9', fontWeight: 600 }}>{m[4]}</span>);
                        }
                        lastIndex = m.index + m[0].length;
                      }
                      if (lastIndex < raw.length) parts.push(<span key={`e${lastIndex}`} style={{ color: '#64748B' }}>{raw.slice(lastIndex)}</span>);
                      return parts;
                    };

                    return (
                      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8ECF1', overflow: 'hidden' }}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Code size={14} style={{ color: '#6366F1' }} />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Schema.org JSON-LD</span>
                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>({pgSchemas.length} schema{pgSchemas.length > 1 ? 's' : ''})</span>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handlePageDetailCopy(jsonStr, 'schemas')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #EEEDF5', background: pageDetailCopied === 'schemas' ? '#F1F5F9' : '#fff', fontSize: '11px', fontWeight: 500, color: '#64748B', cursor: 'pointer' }}>
                              {pageDetailCopied === 'schemas' ? <><Check size={10} /> Copie</> : <><Copy size={10} /> Copier</>}
                            </button>
                            <button onClick={() => downloadFile(jsonStr, 'schema.json', 'application/json')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#334155', color: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                              <Download size={10} /> .json
                            </button>
                          </div>
                        </div>
                        <pre className="max-w-full" style={{
                          padding: '14px 16px', margin: 0, fontSize: '11.5px',
                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                          background: '#FAFAFC', overflow: 'auto',
                          maxHeight: '400px', lineHeight: '1.6', whiteSpace: 'pre', tabSize: 2,
                        }}>
                          {colorizeJson(jsonStr)}
                        </pre>
                      </div>
                    );
                  })()}

                  {/* llms.txt + llms-full.txt cote a cote */}
                  {(pgLlmsTxt || pgLlmsFullTxt) && (
                    <div className={`grid gap-3 ${pgLlmsTxt && pgLlmsFullTxt ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                      {pgLlmsTxt && (
                        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8ECF1', overflow: 'hidden' }}>
                          <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FileText size={14} style={{ color: '#64748B' }} />
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>llms.txt</span>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => handlePageDetailCopy(pgLlmsTxt, 'llms')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #EEEDF5', background: pageDetailCopied === 'llms' ? '#F1F5F9' : '#fff', fontSize: '11px', fontWeight: 500, color: '#64748B', cursor: 'pointer' }}>
                                {pageDetailCopied === 'llms' ? <><Check size={10} /> Copie</> : <><Copy size={10} /> Copier</>}
                              </button>
                              <button onClick={() => downloadFile(pgLlmsTxt, 'llms.txt', 'text/plain')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#334155', color: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                                <Download size={10} /> .txt
                              </button>
                            </div>
                          </div>
                          <pre style={{ padding: '14px 16px', margin: 0, fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#334155', background: '#FAFAFC', overflow: 'auto', maxHeight: '250px', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {pgLlmsTxt}
                          </pre>
                        </div>
                      )}
                      {pgLlmsFullTxt && (
                        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8ECF1', overflow: 'hidden' }}>
                          <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FileText size={14} style={{ color: '#64748B' }} />
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>llms-full.txt</span>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => handlePageDetailCopy(pgLlmsFullTxt, 'llmsfull')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #EEEDF5', background: pageDetailCopied === 'llmsfull' ? '#F1F5F9' : '#fff', fontSize: '11px', fontWeight: 500, color: '#64748B', cursor: 'pointer' }}>
                                {pageDetailCopied === 'llmsfull' ? <><Check size={10} /> Copie</> : <><Copy size={10} /> Copier</>}
                              </button>
                              <button onClick={() => downloadFile(pgLlmsFullTxt, 'llms-full.txt', 'text/plain')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#334155', color: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                                <Download size={10} /> .txt
                              </button>
                            </div>
                          </div>
                          <pre style={{ padding: '14px 16px', margin: 0, fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#334155', background: '#FAFAFC', overflow: 'auto', maxHeight: '250px', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {pgLlmsFullTxt}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* robots.txt */}
                  {pgRobotsTxt && (
                    <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8ECF1', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Shield size={14} style={{ color: '#64748B' }} />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>robots.txt</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handlePageDetailCopy(pgRobotsTxt, 'robots')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #EEEDF5', background: pageDetailCopied === 'robots' ? '#F1F5F9' : '#fff', fontSize: '11px', fontWeight: 500, color: '#64748B', cursor: 'pointer' }}>
                            {pageDetailCopied === 'robots' ? <><Check size={10} /> Copie</> : <><Copy size={10} /> Copier</>}
                          </button>
                          <button onClick={() => downloadFile(pgRobotsTxt, 'robots.txt', 'text/plain')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#334155', color: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                            <Download size={10} /> .txt
                          </button>
                        </div>
                      </div>
                      <pre style={{ padding: '14px 16px', margin: 0, fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#334155', background: '#FAFAFC', overflow: 'auto', maxHeight: '200px', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {pgRobotsTxt}
                      </pre>
                    </div>
                  )}

                  {/* Recommandations */}
                  {pgRecommendations.length > 0 && (
                    <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8ECF1', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>Recommandations</span>
                      </div>
                      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {pgRecommendations.map((rec, i) => {
                          const pColor = rec.priority === 'high' ? '#B91C1C' : rec.priority === 'medium' ? '#C2410C' : '#15803D';
                          const pBg = rec.priority === 'high' ? '#FEF2F2' : rec.priority === 'medium' ? '#FFF7ED' : '#F0FDF4';
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 10px', borderRadius: '8px', background: '#FAFAFC' }}>
                              <span style={{ flexShrink: 0, padding: '1px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, color: pColor, background: pBg, textTransform: 'uppercase' }}>
                                {rec.priority === 'high' ? 'Haute' : rec.priority === 'medium' ? 'Moy.' : 'Basse'}
                              </span>
                              <div>
                                <div style={{ fontSize: '12px', color: '#1E293B', lineHeight: '1.4' }}>{rec.message}</div>
                                {rec.details && <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{rec.details}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* HTML optimise */}
                  {pgHtml && (() => {
                    // Indenter le HTML pour lisibilite
                    const formatHtml = (html: string): string => {
                      let formatted = '';
                      let indent = 0;
                      const lines = html
                        .replace(/>\s*</g, '>\n<')
                        .replace(/(<(meta|link|br|hr|img|input)[^>]*\/?>)/gi, '\n$1\n')
                        .split('\n')
                        .map(l => l.trim())
                        .filter(Boolean);
                      for (const line of lines) {
                        const isClosing = /^<\//.test(line);
                        const isSelfClosing = /\/>$/.test(line) || /^<(meta|link|br|hr|img|input|!DOCTYPE)\b/i.test(line);
                        if (isClosing) indent = Math.max(0, indent - 1);
                        formatted += '  '.repeat(indent) + line + '\n';
                        if (!isClosing && !isSelfClosing && /^<[a-zA-Z]/.test(line) && !/<\/[^>]+>$/.test(line)) indent++;
                      }
                      return formatted.trim();
                    };
                    const prettyHtml = formatHtml(pgHtml);

                    // Coloration syntaxique HTML
                    const colorize = (raw: string): React.ReactNode[] => {
                      const parts: React.ReactNode[] = [];
                      const regex = /(<!--[\s\S]*?-->)|(<\/?[a-zA-Z][a-zA-Z0-9-]*)((?:\s+[a-zA-Z:_][\w:.-]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*))?)*)\s*(\/?>)/g;
                      let lastIndex = 0;
                      let m;
                      while ((m = regex.exec(raw)) !== null) {
                        if (m.index > lastIndex) parts.push(raw.slice(lastIndex, m.index));
                        if (m[1]) {
                          parts.push(<span key={m.index} style={{ color: '#94A3B8', fontStyle: 'italic' }}>{m[1]}</span>);
                        } else {
                          const tagParts: React.ReactNode[] = [];
                          tagParts.push(<span key={`t${m.index}`} style={{ color: '#6366F1', fontWeight: 500 }}>{m[2]}</span>);
                          if (m[3]) {
                            const attrRegex = /(\s+)([a-zA-Z:_][\w:.-]*)(\s*=\s*)?("[^"]*"|'[^']*'|[^\s>]*)?/g;
                            let am;
                            while ((am = attrRegex.exec(m[3])) !== null) {
                              tagParts.push(am[1]);
                              tagParts.push(<span key={`a${m.index}-${am.index}`} style={{ color: '#D97706' }}>{am[2]}</span>);
                              if (am[3]) tagParts.push(<span key={`eq${m.index}-${am.index}`} style={{ color: '#64748B' }}>{am[3]}</span>);
                              if (am[4]) tagParts.push(<span key={`v${m.index}-${am.index}`} style={{ color: '#16A34A' }}>{am[4]}</span>);
                            }
                          }
                          tagParts.push(<span key={`c${m.index}`} style={{ color: '#6366F1', fontWeight: 500 }}>{m[4]}</span>);
                          parts.push(<span key={m.index}>{tagParts}</span>);
                        }
                        lastIndex = m.index + m[0].length;
                      }
                      if (lastIndex < raw.length) parts.push(raw.slice(lastIndex));
                      return parts;
                    };

                    return (
                      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E8ECF1', overflow: 'hidden' }}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileCode size={14} style={{ color: '#64748B' }} />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>HTML optimise</span>
                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>({prettyHtml.split('\n').length} lignes)</span>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handlePageDetailCopy(prettyHtml, 'html')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #EEEDF5', background: pageDetailCopied === 'html' ? '#F1F5F9' : '#fff', fontSize: '11px', fontWeight: 500, color: '#64748B', cursor: 'pointer' }}>
                              {pageDetailCopied === 'html' ? <><Check size={10} /> Copie</> : <><Copy size={10} /> Copier</>}
                            </button>
                            <button onClick={() => downloadFile(prettyHtml, 'optimized.html', 'text/html')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#334155', color: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                              <Download size={10} /> .html
                            </button>
                          </div>
                        </div>
                        <pre className="max-w-full" style={{
                          padding: '14px 16px', margin: 0, fontSize: '11.5px',
                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                          color: '#334155', background: '#FAFAFC', overflow: 'auto',
                          maxHeight: '60vh', lineHeight: '1.6', whiteSpace: 'pre', tabSize: 2,
                        }}>
                          {colorize(prettyHtml)}
                        </pre>
                      </div>
                    );
                  })()}
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}


/**
 * Graphique linéaire d'évolution du Score GEO
 */
// Mapper les noms techniques API vers des noms commerciaux (marque uniquement)
const getCommercialModelName = (apiName: string): string => {
  const n = apiName.toLowerCase().trim();
  if (n.includes('sonar')) return 'Perplexity';
  if (n.includes('claude')) return 'Claude';
  if (n.startsWith('gpt') || n === 'chatgpt') return 'ChatGPT';
  if (n.includes('gemini') || n === 'ai overview' || n === 'ai-overview') return 'Gemini';
  if (n.includes('mistral') || n.includes('mixtral')) return 'Mistral';
  if (n.includes('deepseek')) return 'DeepSeek';
  if (n.includes('llama')) return 'Meta AI';
  if (n.includes('qwen')) return 'Qwen';
  if (n.includes('grok')) return 'Grok';
  return apiName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

function exportToCsv(filename: string, rows: string[][]): void {
  const csvContent = rows.map(r =>
    r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function GeoScoreChart({ reportData }: { reportData: FullReportData | null }) {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortCol, setSortCol] = useState<'name' | 'citations'>('citations');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (col: 'name' | 'citations') => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir(col === 'citations' ? 'desc' : 'asc'); }
  };
  // TODO: Évolution citations - décommenter quand l'API renvoie evolution_citations
  // const [viewMode, setViewMode] = useState<'table' | 'evolution'>('table');
  // const evoData = (reportData?.evolution_citations as EvolutionCitations | null);
  // const evoLoading = false;

  // Extraire les données depuis l'API, regroupées par nom commercial
  const getDataFromAPI = () => {
    // Collecter toutes les citations brutes par modèle API
    const rawEntries: Array<{ apiName: string; citations: number; lastUpdate: string; details: string }> = [];
    const apiSeen = new Set<string>();

    // Source principale : citations_by_model
    if (reportData?.analyse_citation?.citations_by_model) {
      Object.entries(reportData.analyse_citation.citations_by_model).forEach(([modelName, citations]) => {
        if (!modelName) return;
        apiSeen.add(modelName.toLowerCase());
        const matchingAnalysis = reportData.analyses?.find(
          a => a.llm_name?.toLowerCase() === modelName.toLowerCase()
        );
        rawEntries.push({
          apiName: modelName,
          citations: citations as number,
          lastUpdate: matchingAnalysis?.created_at || new Date().toISOString(),
          details: matchingAnalysis?.modules?.audit_geo?.resume_executif_geo || 'Données de citation disponibles',
        });
      });
    }

    // Source secondaire : detailed_results
    if (reportData?.analyse_citation?.detailed_results && Array.isArray(reportData.analyse_citation.detailed_results)) {
      const citationsFromDetails: Record<string, number> = {};
      reportData.analyse_citation.detailed_results.forEach((r: any) => {
        const model = r.llm_model || '';
        if (!model) return;
        if (!citationsFromDetails[model]) citationsFromDetails[model] = 0;
        if (r.citation_detected) {
          citationsFromDetails[model] += (r.mentions || 1);
        }
      });
      Object.entries(citationsFromDetails).forEach(([modelName, citations]) => {
        if (!apiSeen.has(modelName.toLowerCase())) {
          rawEntries.push({ apiName: modelName, citations, lastUpdate: new Date().toISOString(), details: 'Données de citation disponibles' });
        }
      });
    }

    // Regrouper par nom commercial (ex: sonar + sonar-pro → Perplexity)
    const grouped: Record<string, { displayName: string; citations: number; lastUpdate: string; details: string; rawModel: string }> = {};
    rawEntries.forEach(entry => {
      const displayName = getCommercialModelName(entry.apiName);
      if (grouped[displayName]) {
        grouped[displayName].citations += entry.citations;
      } else {
        grouped[displayName] = {
          displayName,
          citations: entry.citations,
          lastUpdate: entry.lastUpdate,
          details: entry.details,
          rawModel: entry.apiName,
        };
      }
    });

    // Compléter avec les modèles attendus non présents dans les données
    // (non analysés lors de cette exécution spécifique)
    const DEFAULT_EXPECTED_MODELS: { apiName: string; rawModel: string }[] = [
      { apiName: 'gpt-4o',          rawModel: 'gpt-4o' },
      { apiName: 'claude-4-sonnet', rawModel: 'claude-4-sonnet' },
      { apiName: 'gemini-2.5-pro',  rawModel: 'gemini-2.5-pro' },
      { apiName: 'mistral-large',   rawModel: 'mistral-large' },
      { apiName: 'sonar-pro',       rawModel: 'sonar-pro' },
      { apiName: 'deepseek-chat',   rawModel: 'deepseek-chat' },
      { apiName: 'qwen-2.5-72b',    rawModel: 'qwen-2.5-72b' },
      { apiName: 'llama-3.1-70b',   rawModel: 'llama-3.1-70b' },
      { apiName: 'grok-4',          rawModel: 'grok-4' },
    ];
    DEFAULT_EXPECTED_MODELS.forEach(({ apiName, rawModel }) => {
      const displayName = getCommercialModelName(apiName);
      if (!grouped[displayName]) {
        grouped[displayName] = {
          displayName,
          citations: -1, // -1 = non analysé (différent de 0 = analysé mais non cité)
          lastUpdate: new Date().toISOString(),
          details: 'Modèle non analysé lors de cette exécution.',
          rawModel,
        };
      }
    });

    return Object.values(grouped).sort((a, b) => {
      // Les modèles non analysés (-1) vont en bas
      if (a.citations === -1 && b.citations !== -1) return 1;
      if (b.citations === -1 && a.citations !== -1) return -1;
      return b.citations - a.citations;
    });
  };

  const rawData = getDataFromAPI();
  const data = [...rawData].sort((a, b) => {
    if (sortCol === 'name') {
      const cmp = a.displayName.localeCompare(b.displayName, 'fr');
      return sortDir === 'asc' ? cmp : -cmp;
    }
    return sortDir === 'asc' ? a.citations - b.citations : b.citations - a.citations;
  });

  if (data.length === 0) {
    return (
      <div className="chart-card chart-card-wide" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Citations par modèle</h3>
            <InfoTooltip {...HELP.citationsParModele} side="bottom" />
          </div>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
          Aucune donnée d'analyse disponible pour ce rapport.
        </div>
      </div>
    );
  }

  // Vérifier si toutes les citations sont à 0 (données API) — exclure les "non analysés" (-1)
  const analyzedData = data.filter(item => item.citations !== -1);
  const allCitationsZero = analyzedData.length > 0 && analyzedData.every(item => item.citations === 0);
  const isApiData = analyzedData.length > 0;

  // Calculer le total des citations (exclure les -1)
  const totalCitations = analyzedData.reduce((sum, item) => sum + item.citations, 0);

  const handleExportCsv = () => {
    const rows: string[][] = [['Modèle', 'Citations']];
    data.forEach(item => rows.push([item.displayName, String(item.citations)]));
    exportToCsv('citations-par-modele.csv', rows);
  };

  return (
    <div className="chart-card chart-card-wide" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Citations par modèle</h3>
          <InfoTooltip {...HELP.citationsParModele} side="bottom" />
        </div>
        {data.length > 0 && (
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 transition-colors bg-white"
          >
            <Download size={13} />
            CSV
          </button>
        )}
      </div>

      {allCitationsZero && isApiData && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '16px', 
          background: '#FEE2E2', 
          borderRadius: '12px', 
          border: '1px solid #FCA5A5',
          display: 'flex',
          alignItems: 'start',
          gap: '12px'
        }}>
          <AlertCircle size={20} style={{ color: '#EF4444', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#991B1B', marginBottom: '4px' }}>
               Aucune citation détectée 
            </div>
            <div style={{ fontSize: '13px', color: '#7F1D1D', lineHeight: '1.5' }}>
              Votre site n'est <strong>absolument pas cité</strong> dans les réponses dans les moteurs génératifs. 
              Vous perdez actuellement des opportunités de visibilité face à vos concurrents. 
              <strong>Agissez immédiatement</strong> en consultant les recommandations GEO pour éviter de prendre encore plus de retard dans les moteurs génératifs.
            </div>
          </div>
        </div>
      )}
      
      {totalCitations === 1 && isApiData && (
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          background: '#FFF7ED',
          borderRadius: '12px',
          border: '1px solid #FED7AA',
          display: 'flex',
          alignItems: 'start',
          gap: '12px'
        }}>
          <AlertCircle size={20} style={{ color: '#F97316', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#9A3412', marginBottom: '4px' }}>
              Visibilité très faible
            </div>
            <div style={{ fontSize: '13px', color: '#7C2D12', lineHeight: '1.5' }}>
              Votre site n'est cité qu'<strong>1 seule fois</strong> dans les moteurs génératifs.
              C'est insuffisant pour garantir une visibilité durable. <strong>Consultez les recommandations GEO</strong> pour améliorer votre présence.
            </div>
          </div>
        </div>
      )}

      {totalCitations >= 2 && totalCitations <= 4 && isApiData && (
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          background: '#FFF7ED',
          borderRadius: '12px',
          border: '1px solid #FED7AA',
          display: 'flex',
          alignItems: 'start',
          gap: '12px'
        }}>
          <AlertCircle size={20} style={{ color: '#F97316', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#9A3412', marginBottom: '4px' }}>
              Visibilité à améliorer
            </div>
            <div style={{ fontSize: '13px', color: '#7C2D12', lineHeight: '1.5' }}>
              Votre site est cité <strong>{totalCitations} fois</strong> dans les moteurs génératifs.
              C'est un début mais votre visibilité reste limitée. Continuez à optimiser votre contenu en suivant les recommandations GEO.
            </div>
          </div>
        </div>
      )}

      {totalCitations >= 5 && isApiData && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '16px', 
          background: '#F0FDF4', 
          borderRadius: '12px', 
          border: '1px solid #86EFAC',
          display: 'flex',
          alignItems: 'start',
          gap: '12px'
        }}>
          <CheckCircle2 size={20} style={{ color: '#10B981', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#166534', marginBottom: '4px' }}>
              Excellent ! Vous êtes bien cité
            </div>
            <div style={{ fontSize: '13px', color: '#14532D', lineHeight: '1.5' }}>
              Votre site est cité <strong>{totalCitations} fois</strong> dans les moteurs génératifs. 
              Félicitations ! Vous avez une bonne visibilité. Continuez sur cette lancée pour maintenir et améliorer votre positionnement.
            </div>
          </div>
        </div>
      )}
      
      <div className="w-full overflow-x-auto">
        <table className="domains-table">
          <thead>
            <tr>
              <th>
                <button type="button" onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-slate-700 transition-colors font-semibold">
                  Modèle {sortCol === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : <span className="text-slate-300">↕</span>}
                </button>
              </th>
              <th>
                <button type="button" onClick={() => toggleSort('citations')} className="flex items-center gap-1 hover:text-slate-700 transition-colors font-semibold">
                  Citations {sortCol === 'citations' ? (sortDir === 'asc' ? '↑' : '↓') : <span className="text-slate-300">↕</span>}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={index}
                onClick={() => {
                  setSelectedModel(item.displayName);
                  setIsModalOpen(true);
                }}
                style={{ cursor: 'pointer' }}
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getModelLogo(item.rawModel) ? (
                      <img src={getModelLogo(item.rawModel)!} alt="" className="w-5 h-5 object-contain" />
                    ) : (
                      <Zap size={14} className="text-blue-500" />
                    )}
                    <span className="font-medium">{item.displayName}</span>
                    <ChevronRight size={14} style={{ color: '#94A3B8' }} />
                  </div>
                </td>
               
                <td>
                  {item.citations === -1 ? (
                    <span style={{ fontSize: '13px', color: '#94A3B8', fontStyle: 'italic' }}>
                      Non analysé
                    </span>
                  ) : item.citations === 0 && isApiData ? (
                    <span style={{ fontSize: '13px', color: '#F59E0B', fontStyle: 'italic' }}>
                      Non cité
                    </span>
                  ) : item.citations >= 5 ? (
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#10B981' }}>{item.citations}</span>
                  ) : item.citations === 1 ? (
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#F97316' }}>{item.citations}</span>
                  ) : (
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>{item.citations}</span>
                  )}
                </td>
              
  
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal d'analyse détaillée */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedModel && (() => {
            const selected = data.find(d => d.displayName === selectedModel);
            const citations = selected?.citations ?? 0;

            const alertConfig = citations === -1
              ? { bg: '#F1F5F9', border: '#CBD5E1', iconColor: '#94A3B8', titleColor: '#475569', textColor: '#64748B', title: 'Non analysé', message: `${selectedModel} n'a pas été inclus dans cette analyse. Il sera pris en compte lors de la prochaine exécution.` }
              : citations === 0
              ? { bg: '#FEE2E2', border: '#FCA5A5', iconColor: '#EF4444', titleColor: '#991B1B', textColor: '#7F1D1D', title: 'Aucune citation', message: `Votre site n'est pas du tout cité par ${selectedModel}. Ce moteur génératif ne vous mentionne dans aucune de ses réponses. Consultez les recommandations GEO pour y remédier.` }
              : citations <= 5
              ? { bg: '#FFF7ED', border: '#FED7AA', iconColor: '#F97316', titleColor: '#9A3412', textColor: '#7C2D12', title: 'Visibilité insuffisante', message: `Votre site n'est cité que ${citations} fois par ${selectedModel}. C'est insuffisant pour garantir une visibilité durable sur ce moteur. Optimisez votre contenu en suivant les recommandations GEO.` }
              : { bg: '#F0FDF4', border: '#86EFAC', iconColor: '#10B981', titleColor: '#166534', textColor: '#14532D', title: 'Bonne visibilité', message: `Votre site est cité ${citations} fois par ${selectedModel}. Vous bénéficiez d'une bonne visibilité sur ce moteur génératif. Continuez sur cette lancée !` };

            return (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2" style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
                  {selected && getModelLogo(selected.rawModel) && (
                    <img src={getModelLogo(selected.rawModel)!} alt="" className="w-6 h-6 object-contain" />
                  )}
                  Analyse détaillée - {selectedModel}
                </DialogTitle>
                <DialogDescription style={{ fontSize: '14px', color: '#64748B', marginTop: '8px' }}>
                  Informations détaillées sur les citations et la visibilité
                </DialogDescription>
              </DialogHeader>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                {/* Alerte contextuelle */}
                <div style={{
                  padding: '16px',
                  background: alertConfig.bg,
                  borderRadius: '12px',
                  border: `1px solid ${alertConfig.border}`,
                  display: 'flex',
                  alignItems: 'start',
                  gap: '12px'
                }}>
                  {citations >= 6
                    ? <CheckCircle2 size={20} style={{ color: alertConfig.iconColor, flexShrink: 0, marginTop: '2px' }} />
                    : <AlertCircle size={20} style={{ color: alertConfig.iconColor, flexShrink: 0, marginTop: '2px' }} />
                  }
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: alertConfig.titleColor, marginBottom: '4px' }}>
                      {alertConfig.title}
                    </div>
                    <div style={{ fontSize: '13px', color: alertConfig.textColor, lineHeight: '1.5' }}>
                      {alertConfig.message}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#64748B', marginBottom: '8px' }}>Analyse</div>
                  <div style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
                    {selected?.details}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-xs text-slate-500 mb-2">Citations</div>
                    <div className="text-lg font-bold text-slate-900">
                      {selected?.citations || 0}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-xs text-slate-500 mb-2">Dernière mise à jour</div>
                    <div className="text-sm font-semibold text-slate-900">
                      {(() => {
                        const dateStr = selected?.lastUpdate;
                        if (!dateStr) return 'N/A';
                        try {
                          const date = new Date(dateStr);
                          return date.toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'long', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          });
                        } catch { return dateStr; }
                      })()}
                    </div>
                  </div>
                </div>

                {/* Requêtes détaillées depuis detailed_results */}
                {(() => {
                  const detailed = reportData?.analyse_citation?.detailed_results;
                  if (!detailed || !Array.isArray(detailed)) return null;

                  // Filtrer les résultats pour ce modèle
                  const modelResults = detailed.filter((r: any) => {
                    const name = (r.llm_model || '').toLowerCase();
                    const sel = selectedModel.toLowerCase();
                    return name.includes(sel) || sel.includes(name.split('-')[0]);
                  });

                  if (modelResults.length === 0) return null;

                  const cited = modelResults.filter((r: any) => r.citation_detected);
                  const notCited = modelResults.filter((r: any) => !r.citation_detected);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
                        Requêtes testées ({modelResults.length})
                      </div>

                      {cited.length > 0 && (
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#059669', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            ✓ Cité ({cited.length})
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {cited.slice(0, 5).map((r: any, i: number) => (
                              <div key={i} style={{ padding: '10px 12px', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                                {r.query && (
                                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#166534', marginBottom: r.response_excerpt ? '6px' : 0 }}>
                                    « {r.query} »
                                  </div>
                                )}
                                {r.response_excerpt && (
                                  <div style={{ fontSize: '12px', color: '#4B5563', lineHeight: '1.5', borderTop: '1px solid #BBF7D0', paddingTop: '6px' }}>
                                    {r.response_excerpt.length > 200 ? r.response_excerpt.substring(0, 200) + '…' : r.response_excerpt}
                                  </div>
                                )}
                              </div>
                            ))}
                            {cited.length > 5 && (
                              <div style={{ fontSize: '12px', color: '#6B7280', textAlign: 'center' }}>
                                +{cited.length - 5} autres requêtes avec citation
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {notCited.length > 0 && (
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            ✗ Non cité ({notCited.length})
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {notCited.slice(0, 3).map((r: any, i: number) => (
                              <div key={i} style={{ padding: '8px 12px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                                <div style={{ fontSize: '13px', color: '#6B7280' }}>
                                  « {r.query || 'Requête non disponible'} »
                                </div>
                              </div>
                            ))}
                            {notCited.length > 3 && (
                              <div style={{ fontSize: '12px', color: '#6B7280', textAlign: 'center' }}>
                                +{notCited.length - 3} autres requêtes sans citation
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Analyse concurrentielle avec Top 5 et sélecteur de modèle
 */
function CompetitorAnalysis({ reportData }: { reportData: FullReportData | null }) {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorAnalysisResponse | null>(null);
  const [loadingCompetitors, setLoadingCompetitors] = useState(false);

  // Extraire les modèles disponibles depuis l'API de manière mémorisée
  const availableModels = useMemo(() => {
    return reportData?.analyses?.map(a => a.llm_name).filter(Boolean) || [];
  }, [reportData?.analyses]);
  
  // Charger l'analyse concurrentielle
  useEffect(() => {
    const loadCompetitorAnalysis = async () => {
      if (!reportData) return;

      // SOURCE 1 (PRIORITAIRE): analyse_concurrentielle_v3
      // Géré directement dans getCompetitorsFromAPI et le select source_models

      // SOURCE 2: analyse_concurrentielle_v1 ou competitor_analysis ou competitors
      const competitorData = reportData.analyse_concurrentielle_v1 || reportData.competitor_analysis || (reportData as any).competitors;

      if (competitorData) {
        let mappedAnalysis: CompetitorAnalysisResponse;

        if (reportData.analyse_concurrentielle_v1) {
          const reportId = reportData.report?.id || (reportData as any).llmo_report?.id || 0;
          mappedAnalysis = mapAnalyseConcurrentielleV1ToResponse(reportId, reportData.analyse_concurrentielle_v1);
        } else {
          mappedAnalysis = mapApiResponseToCompetitorAnalysisResponse(competitorData);
        }

        setCompetitorAnalysis(mappedAnalysis);

        if (!selectedModel) {
          const firstRaw = mappedAnalysis.models_analysis?.[0]?.model_info?.display_name ||
                            mappedAnalysis.models_analysis?.[0]?.model_info?.model_name || '';
          if (firstRaw) {
            setSelectedModel(getCommercialModelName(firstRaw));
          }
        }
        return;
      }

      // SOURCE 3: Recherche par URL si non présent dans le rapport (fallback)
      const reportUrlValue = reportData.report?.url || (reportData as any)?.llmo_report?.url;
      if (!reportUrlValue) return;

      try {
        setLoadingCompetitors(true);
        const analyses = await listCompetitorAnalyses();

        const reportUrl = reportUrlValue.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '');
        const reportDomain = extractDomain(reportUrlValue).toLowerCase();

        const matchingAnalysis = analyses.find(analysis => {
          const analysisUrl = (analysis.url || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '');
          const analysisDomain = extractDomain(analysis.url || '').toLowerCase();

          return (
            reportUrl === analysisUrl ||
            analysisUrl.includes(reportUrl) ||
            reportUrl.includes(analysisUrl) ||
            reportDomain === analysisDomain
          );
        });

        if (matchingAnalysis) {
          const fullAnalysis = await getCompetitorAnalysisById(matchingAnalysis.analysis_id);
          setCompetitorAnalysis(fullAnalysis);

          if (!selectedModel && fullAnalysis.models_analysis && fullAnalysis.models_analysis.length > 0) {
            const firstRaw = fullAnalysis.models_analysis[0].model_info?.display_name ||
                              fullAnalysis.models_analysis[0].model_info?.model_name || '';
            if (firstRaw) {
              setSelectedModel(getCommercialModelName(firstRaw));
            }
          }
        }
      } catch (error) {
      } finally {
        setLoadingCompetitors(false);
      }
    };

    loadCompetitorAnalysis();
  }, [reportData]);

  // Mettre à jour le modèle sélectionné uniquement si nécessaire (modèle plus présent)
  useEffect(() => {
    // Noms commerciaux dédupliqués
    const seen = new Set<string>();
    const commercialNames = (competitorAnalysis?.models_analysis
      ?.filter(m => m.competitors && m.competitors.length >= 2)
      .map(m => getCommercialModelName(m.model_info?.display_name || m.model_info?.model_name || ''))
      .filter(Boolean) || []).filter(name => {
        if (seen.has(name)) return false;
        seen.add(name);
        return true;
      });

    if (commercialNames.length > 0) {
      if (!selectedModel) {
        setSelectedModel(commercialNames[0]);
      } else if (!commercialNames.includes(selectedModel)) {
        setSelectedModel(commercialNames[0]);
      }
    }
  }, [competitorAnalysis]); // Ne pas mettre selectedModel ici pour éviter les boucles de reset

  // Détecter v3
  const v3Data = reportData?.analyse_concurrentielle_v3;
  const isV3 = v3Data && v3Data.consolidated_competitors && v3Data.consolidated_competitors.length > 0;

  // Extraire les modèles source uniques depuis v3, dédupliqués par nom commercial
  const v3Models = useMemo(() => {
    if (!isV3) return [];
    const commercialSeen = new Set<string>();
    const models: { raw: string; commercial: string }[] = [];
    v3Data!.consolidated_competitors.forEach(c => {
      c.source_models?.forEach(m => {
        const commercial = getCommercialModelName(m);
        if (!commercialSeen.has(commercial)) {
          commercialSeen.add(commercial);
          models.push({ raw: m, commercial });
        }
      });
    });
    return models.sort((a, b) => a.commercial.localeCompare(b.commercial));
  }, [v3Data, isV3]);

  // Initialiser le modèle sélectionné pour v3 : premier modèle par défaut
  useEffect(() => {
    if (isV3 && v3Models.length > 0 && !selectedModel) {
      setSelectedModel(v3Models[0].commercial);
    }
  }, [isV3, v3Models]);

  // Extraire les concurrents depuis les données de l'API, filtrés par modèle sélectionné
  const getCompetitorsFromAPI = () => {
    // V3 : filtrer par source_models (comparaison par nom commercial)
    if (isV3) {
      // Exclure le site client de la liste des concurrents
      const clientUrl = reportData?.report?.url || (reportData as any)?.llmo_report?.url || '';
      const clientDomain = clientUrl ? extractDomain(clientUrl).toLowerCase().replace('www.', '') : '';
      // Extraire le nom de base sans TLD (ex: "amundi.fr" -> "amundi")
      const clientBase = clientDomain.split('.')[0];

      let filtered = v3Data!.consolidated_competitors.filter(c => {
        const compDomain = extractDomain(c.primary_url).toLowerCase().replace('www.', '');
        const compBase = compDomain.split('.')[0];
        const compName = (c.name || '').toLowerCase();
        // Exclure si même domaine, même base, ou nom contient le client
        return !clientBase || (compDomain !== clientDomain && compBase !== clientBase && !compName.includes(clientBase));
      });
      if (selectedModel && selectedModel !== 'all') {
        filtered = filtered.filter(c =>
          c.source_models?.some(m => getCommercialModelName(m) === selectedModel)
        );
      }
      return filtered.slice(0, 5).map(c => ({
        name: c.name,
        domain: extractDomain(c.primary_url),
        faviconUrl: c.favicon_url,
        score: Math.round(c.average_score * 100),
        globalRank: c.global_rank,
        sourceModels: c.source_models,
      }));
    }

    if (!competitorAnalysis) return [];

    // Priorité à models_analysis pour filtrer par modèle sélectionné
    if (competitorAnalysis.models_analysis && selectedModel) {
      const matchingAnalyses = competitorAnalysis.models_analysis.filter(m => {
        const rawName = m.model_info?.display_name || m.model_info?.model_name || '';
        return getCommercialModelName(rawName) === selectedModel;
      });

      const allCompetitors: any[] = [];
      const seenDomains = new Set<string>();
      matchingAnalyses.forEach(analysis => {
        (analysis.competitors || []).forEach((comp: any) => {
          const domain = extractDomain(comp.url);
          if (!seenDomains.has(domain)) {
            seenDomains.add(domain);
            allCompetitors.push(comp);
          }
        });
      });

      if (allCompetitors.length > 0) {
        return allCompetitors
          .sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0))
          .slice(0, 5)
          .map((comp) => ({
            name: comp.name,
            domain: extractDomain(comp.url),
            score: Math.round(comp.similarity_score * 100),
          }));
      }
    }

    // Fallback consolidated_competitors
    if (competitorAnalysis.consolidated_competitors && competitorAnalysis.consolidated_competitors.length > 0) {
      return competitorAnalysis.consolidated_competitors
        .slice(0, 5)
        .map((comp) => ({
          name: comp.name,
          domain: extractDomain(comp.primary_url),
          score: Math.round(comp.average_score * 100),
          globalRank: comp.global_rank,
        }));
    }

    return [];
  };

  const competitors = getCompetitorsFromAPI();

  // Modèles pour le select (v1/fallback)
  const competitorModels = useMemo(() => {
    if (isV3) return [];
    const raw = competitorAnalysis?.models_analysis
      ?.filter(m => m.competitors && m.competitors.length >= 2)
      .map(m => m.model_info?.display_name || m.model_info?.model_name || '')
      .filter(Boolean) || [];
    const seen = new Set<string>();
    return raw.map(m => getCommercialModelName(m)).filter(name => {
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  }, [competitorAnalysis, isV3]);

  // Liste des modèles pour le select
  const selectModels = isV3 ? v3Models.map(m => m.commercial) : competitorModels;

  return (
    <div className="chart-card competitor-card">
      <div className="card-header-with-selector flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Analyse concurrentielle</h3>
          <InfoTooltip {...HELP.analyseConcurrentielle} side="bottom" />
        </div>
        <div className="model-selector">
          <span className="selector-label">Modèle:</span>
          <Select
            value={selectedModel}
            onValueChange={setSelectedModel}
            disabled={loadingCompetitors || selectModels.length === 0}
          >
            <SelectTrigger className="w-full sm:w-[200px] h-9 bg-white border-slate-200">
              <SelectValue placeholder="Choisir un modèle" />
            </SelectTrigger>
            <SelectContent>
              {selectModels.map(modelName => (
                <SelectItem key={modelName} value={modelName}>
                  <div className="flex items-center gap-2">
                    {getModelLogo(modelName) ? (
                      <img src={getModelLogo(modelName)!} alt={modelName} className="w-5 h-5 object-contain" />
                    ) : (
                      <Zap size={16} className="text-blue-500" />
                    )}
                    <span>{modelName}</span>
                  </div>
                </SelectItem>
              ))}
              {selectModels.length === 0 && (
                <SelectItem value="none" disabled>Aucun modèle disponible</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="competitors-list">
        {loadingCompetitors ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            Chargement de l'analyse concurrentielle...
          </div>
        ) : competitors.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            Aucune analyse concurrentielle disponible pour ce modèle.
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="subtitle-section">
                Top {competitors.length} Concurrents{selectedModel && selectedModel !== 'all' ? ` - ${getCommercialModelName(selectedModel)}` : ''}
              </div>
            </div>

            {competitors.map((competitor, index) => (
              <div
                key={index}
                className="competitor-item"
                style={{ cursor: 'default' }}
              >
                <img
                  src={(competitor as any).faviconUrl || `https://www.google.com/s2/favicons?domain=${competitor.domain}&sz=32`}
                  alt={competitor.domain}
                  width={20} height={20}
                  style={{ borderRadius: '4px', flexShrink: 0 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="competitor-info" style={{ flex: 1 }}>
                  <div className="competitor-name">{competitor.name}</div>
                  <div className="competitor-domain">{competitor.domain}</div>
                </div>
              </div>
            ))}

          </>
        )}
      </div>
    </div>
  );
}

/**
 * Tableau des domaines avec badges de type
 */
function DomainsTable({ reportData }: { reportData: FullReportData | null }) {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [domainModalOpen, setDomainModalOpen] = useState(false);

  // Calculer le total des citations depuis l'API
  const getTotalCitationsFromAPI = () => {
    // Utiliser les données de citation explicites si disponibles (6 dans votre JSON)
    if (reportData?.analyse_citation?.total_citations !== undefined) {
      return reportData.analyse_citation.total_citations;
    }

    if (!reportData?.analyses || reportData.analyses.length === 0) {
      return 0;
    }
    
    return reportData.analyses.reduce((sum, analysis) => {
      const geoData = analysis.modules?.audit_geo;
      const citations = geoData?.citations || geoData?.mentions || 0;
      return sum + Number(citations);
    }, 0);
  };

  const totalCitationsFromAPI = getTotalCitationsFromAPI();
  const hasApiData = reportData?.analyses && reportData.analyses.length > 0;
  
  // Extraire les domaines cités depuis l'analyse de citation (sources réelles)
  const getDomainsFromAPI = () => {
    // Récupérer l'URL du client depuis report ou llmo_report
    const clientUrl = (reportData as any)?.report?.url || (reportData as any)?.llmo_report?.url || '';
    const clientSiteName = reportData?.analyse_citation?.client_site_name || '';

    // PRIORITÉ 1 : utiliser competitors_frequently_mentioned (calculé côté backend avec filtre domaine exact)
    const cfm = reportData?.analyse_citation?.competitors_frequently_mentioned;
    if (cfm && Array.isArray(cfm) && cfm.length > 0) {
      return cfm.map((item: any) => {
        const domain = extractDomain(item.url || '');
        const isClientSite = clientUrl
          ? domain.includes(extractDomain(clientUrl))
          : clientSiteName
            ? domain.toLowerCase().includes(clientSiteName.toLowerCase())
            : false;
        return {
          icon: item.favicon_url || `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
          domain,
          used: `${Math.round(item.percentage ?? 0)} %`,
          citations: String(item.count ?? 0),
          type: isClientSite ? 'you' : 'corporate',
          label: isClientSite ? 'Votre Site' : 'Source',
          pages: 1,
          lastSeen: new Date().toLocaleDateString('fr-FR'),
          description: isClientSite
            ? `Votre site a été cité ${item.count} fois dans les réponses des modèles d'IA.`
            : `Source citée ${item.count} fois.`,
          highlight: isClientSite,
          models: [],
          sourceDetails: [{ url: item.url, title: item.name || domain }],
        };
      });
    }

    // Si on a des detailed_results, les utiliser
    if (reportData?.analyse_citation?.detailed_results && Array.isArray(reportData.analyse_citation.detailed_results)) {
      const sourcesMap: Record<string, any> = {};
      const totalCalls = reportData.analyse_citation.total_llm_calls || 1;

      // Parcourir tous les résultats détaillés pour extraire les sources
      reportData.analyse_citation.detailed_results.forEach((result: any) => {
        if (result.sources && Array.isArray(result.sources)) {
          result.sources.forEach((source: any) => {
            // Ignorer les sources sans URL valide
            if (!source.url || source.url === null) return;

            try {
              const domain = extractDomain(source.url);
              if (!domain) return;

              // Vérifier si c'est le site client
              const isClientSite = clientUrl ? domain.includes(extractDomain(clientUrl)) :
                                   clientSiteName ? domain.toLowerCase().includes(clientSiteName.toLowerCase()) : false;

              if (!sourcesMap[domain]) {
                sourcesMap[domain] = {
                  domain: domain,
                  title: source.title || domain,
                  mentions: 0,
                  urls: new Set(),
                  isClient: isClientSite,
                  models: new Set()
                };
              }
              sourcesMap[domain].mentions += 1;
              sourcesMap[domain].urls.add(source.url);
              if (result.llm_model) sourcesMap[domain].models.add(result.llm_model);
            } catch (e) {
              // Ignorer les URLs invalides
            }
          });
        }
      });

      // Si aucune source avec URL n'a été trouvée, retourner un tableau vide pour passer au fallback
      if (Object.keys(sourcesMap).length === 0) {
        return [];
      }

      return Object.values(sourcesMap).map((s: any) => ({
        icon: `https://www.google.com/s2/favicons?domain=${s.domain}&sz=32`,
        domain: s.domain,
        used: `${Math.round((s.mentions / totalCalls) * 100)} %`,
        citations: s.mentions.toString(),
        type: s.isClient ? 'you' : 'corporate',
        label: s.isClient ? 'Votre Site' : 'Source',
        pages: s.urls.size,
        lastSeen: new Date().toLocaleDateString('fr-FR'),
        description: s.isClient
          ? `Votre site a été cité ${s.mentions} fois dans les réponses des modèles d'IA.`
          : `Source externe citée ${s.mentions} fois.`,
        highlight: s.isClient,
        models: Array.from(s.models || []),
        sourceDetails: Array.from(s.urls).map(url => {
          // Retrouver le titre pour cette URL
          let title = s.title;
          reportData.analyse_citation.detailed_results.forEach((res: any) => {
            const match = res.sources?.find((src: any) => src.url === url);
            if (match && match.title) title = match.title;
          });
          return { url, title };
        })
      })).sort((a: any, b: any) => parseFloat(b.citations) - parseFloat(a.citations));
    }

    // Fallback: utiliser citations_by_model pour générer les domaines par modèle
    if (reportData?.analyse_citation?.citations_by_model) {
      const citationsByModel = reportData.analyse_citation.citations_by_model as Record<string, number>;
      const totalCitations = reportData.analyse_citation.total_citations || 0;
      const clientUrlFallback = (reportData as any)?.report?.url || (reportData as any)?.llmo_report?.url || reportData.analyse_citation?.client_site_url || '';
      const clientDomain = clientUrlFallback ? extractDomain(clientUrlFallback) : (reportData.analyse_citation?.client_site_name || '');

      // Créer une entrée pour le domaine client s'il y a des citations
      const domains: any[] = [];

      // Calculer le nombre de modèles qui ont cité le contenu
      const modelsThatCited = Object.values(citationsByModel).filter(count => count > 0).length;
      const totalModels = Object.keys(citationsByModel).length;
      const usedPercentage = totalModels > 0 ? Math.round((modelsThatCited / totalModels) * 100) : 0;

      if (totalCitations > 0 && clientDomain) {
        domains.push({
          icon: `https://www.google.com/s2/favicons?domain=${clientDomain}&sz=32`,
          domain: clientDomain,
          used: `${usedPercentage}%`,
          citations: totalCitations.toString(),
          type: 'you',
          label: 'Votre Site',
          pages: 1,
          lastSeen: new Date().toLocaleDateString('fr-FR'),
          description: `Votre site a été cité ${totalCitations} fois par ${modelsThatCited} modèle(s) d'IA sur ${totalModels}.`,
          highlight: true,
          sourceDetails: [{ url: clientUrlFallback, title: clientDomain }]
        });
      }

      // Ajouter les modèles qui ont cité comme sources
      Object.entries(citationsByModel).forEach(([model, count]) => {
        if (count > 0) {
          const modelUsedPct = totalCitations > 0 ? Math.round((count / totalCitations) * 100) : 0;
          domains.push({
            icon: `https://www.google.com/s2/favicons?domain=${model}&sz=32`,
            domain: model,
            used: `${modelUsedPct}%`,
            citations: count.toString(),
            type: 'model',
            label: 'Modèle IA',
            pages: 1,
            lastSeen: new Date().toLocaleDateString('fr-FR'),
            description: `${model} a cité votre contenu ${count} fois.`,
            highlight: false,
            sourceDetails: []
          });
        }
      });

      return domains.sort((a: any, b: any) => parseFloat(b.citations) - parseFloat(a.citations));
    }

    return [];
  };

  const domains = getDomainsFromAPI();

  if (domains.length === 0) {
    return (
      <div id="domaines-les-plus-cites" className="domains-table-card" style={{ border: '1px solid #E2E8F0', borderRadius: '16px', padding: '0', overflow: 'hidden', background: '#FFFFFF', scrollMarginTop: '80px' }}>
        <div style={{ padding: '20px 26px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Domaines les plus cités</h3>
            <InfoTooltip {...HELP.domainesLesPlusCites} />
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', margin: 0 }}>Sources citées</p>
        </div>
        <div style={{ padding: '40px 26px', textAlign: 'center', background: '#FFFFFF' }}>
          Aucune source citée détectée pour ce rapport.
        </div>
      </div>
    );
  }

  return (
    <div id="domaines-les-plus-cites" className="domains-table-card" style={{ border: '1px solid #E2E8F0', borderRadius: '16px', padding: '0', overflow: 'hidden', background: '#FFFFFF', scrollMarginTop: '80px' }}>
      <div style={{ padding: '20px 26px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Domaines les plus cités</h3>
          <InfoTooltip {...HELP.domainesLesPlusCites} />
        </div>
        <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', margin: 0 }}>Sources citées</p>
      </div>
      
      {/* Message si aucune citation trouvée dans l'API */}
      {hasApiData && totalCitationsFromAPI === 0 ? (
        <div style={{ 
          padding: '40px 26px', 
          textAlign: 'center',
          background: '#FFFFFF'
        }}>
          <div style={{ 
            padding: '24px', 
            background: '#FEE2E2', 
            borderRadius: '12px', 
            border: '1px solid #FCA5A5',
            display: 'flex',
            alignItems: 'start',
            gap: '16px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <AlertCircle size={24} style={{ color: '#EF4444', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#991B1B', marginBottom: '8px' }}>
                Aucune citation trouvée
              </div>
              <div style={{ fontSize: '14px', color: '#7F1D1D', lineHeight: '1.6' }}>
                Il n'y a pas de citation trouvée car vous n'êtes pas cité dans les moteurs génératifs. 
                Consultez les recommandations pour améliorer votre visibilité et augmenter vos chances d'être cité par les IA.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-1">
          <table className="domains-table w-full border-separate" style={{ borderSpacing: 0, minWidth: '600px' }}>
            <thead>
              <tr className="text-left text-xs uppercase text-slate-400 font-semibold tracking-wider bg-slate-50">
                <th className="py-3 px-4 md:px-6 border-b border-slate-200">Domaine</th>
                <th className="py-3 px-4 md:px-6 border-b border-slate-200">Utilisé</th>
                <th className="py-3 px-4 md:px-6 border-b border-slate-200">Pages</th>
                <th className="py-3 px-4 md:px-6 border-b border-slate-200">Citations moy.</th>
                <th className="py-3 px-4 md:px-6 border-b border-slate-200 text-right">Type</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((domain, index) => (
                <tr 
                  key={index} 
                  className={domain.highlight ? 'table-row-highlight' : ''} 
                  onClick={() => {
                    setSelectedDomain(domain.domain);
                    setDomainModalOpen(true);
                  }}
                  style={{ 
                    background: domain.highlight ? '#E8F4FF' : '#FFFFFF',
                    borderBottom: index === domains.length - 1 ? 'none' : '1px solid #F1F5F9',
                    transition: 'background 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!domain.highlight) e.currentTarget.style.background = '#F8FAFC';
                  }}
                  onMouseLeave={(e) => {
                    if (!domain.highlight) e.currentTarget.style.background = '#FFFFFF';
                  }}
                >
                  <td className="py-4 px-4 md:px-6">
                    <div className="domain-cell flex items-center gap-3 text-sm md:text-[15px] text-slate-900" style={{ fontWeight: domain.highlight ? 600 : 500 }}>
                      <img src={domain.icon} alt={domain.domain} width={20} height={20} className="rounded flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[120px] sm:max-w-none">{domain.domain}</span>
                        {selectedDomain === domain.domain && <ChevronRight size={14} className="text-blue-500" />}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 md:px-6 text-sm text-slate-600 font-semibold">{domain.used}</td>
                  <td className="py-4 px-4 md:px-6 text-sm text-slate-600">{domain.pages}</td>
                  <td className="py-4 px-4 md:px-6 text-sm text-slate-600 font-semibold">{domain.citations}</td>
                  <td className="py-4 px-4 md:px-6 text-right">
                    <span className={`badge badge-${domain.type}`} style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', padding: '4px 12px', background: domain.type === 'you' ? 'rgba(74, 222, 128, 0.15)' : domain.type === 'model' ? 'rgba(99, 102, 241, 0.15)' : undefined }}>
                      {domain.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* Modal Informations détaillées - ouvert au clic sur une source (domaine) */}
          <Dialog open={domainModalOpen} onOpenChange={(open) => {
            setDomainModalOpen(open);
            if (!open) setSelectedDomain(null);
          }}>
            <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0" hideCloseButton>
              {selectedDomain && (() => {
                const dom = domains.find(d => d.domain === selectedDomain);
                if (!dom) return null;
                return (
                  <>
                    <div className="flex-shrink-0 flex items-start justify-between gap-4 p-6 pb-0">
                      <DialogHeader className="flex-1 space-y-1.5 pr-8">
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                          Informations détaillées - {dom.domain}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500">
                          Source citée dans les réponses des modèles d'IA
                        </DialogDescription>
                      </DialogHeader>
                      <DialogClose asChild>
                        <button
                          type="button"
                          className="absolute right-4 top-4 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                          aria-label="Fermer"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </DialogClose>
                    </div>
                    <div
                      className="flex-1 overflow-y-auto min-h-0 px-6 py-4"
                      style={{ maxHeight: 'calc(90vh - 120px)' }}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="text-sm text-slate-600 leading-relaxed">
                          {dom.description}
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500">
                          <span>Pages citées : <strong className="text-slate-900">{dom.pages}</strong></span>
                          <span>Citations moy. : <strong className="text-slate-900">{dom.citations}</strong></span>
                          <span>Dernière vue : <strong className="text-slate-900">{dom.lastSeen}</strong></span>
                          <span>Utilisé : <strong className="text-slate-900">{dom.used}</strong></span>
                        </div>
                        {dom.models && dom.models.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs font-semibold text-slate-500 mb-2">Cité par</div>
                            <div className="flex flex-wrap gap-2">
                              {dom.models.map((model: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                                  {getModelLogo(model) ? (
                                    <img src={getModelLogo(model)!} alt={model} className="w-4 h-4 object-contain" />
                                  ) : null}
                                  <span className="text-sm text-slate-700 font-medium">{model}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {dom.sourceDetails && dom.sourceDetails.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs font-semibold text-slate-500 mb-2">URLs sources identifiées</div>
                            <div className="flex flex-col gap-2">
                              {dom.sourceDetails.map((src: any, idx: number) => (
                                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                  <div className="text-sm font-semibold text-slate-900 mb-1">{src.title}</div>
                                  <a
                                    href={src.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs text-blue-600 no-underline inline-flex items-center gap-1.5 hover:underline"
                                  >
                                    {src.url} <ExternalLink size={12} />
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

/**
 * Vue "Améliorer"
 * Affiche les analyses, graphiques et tableaux de performance
 */
/**
 * Résumé du Plan d'Action GEO dans la vue d'ensemble
 * Affiche les actions prioritaires avec leur catégorie, priorité et effort
 */
function PlanActionGeoOverview({ reportData }: { reportData: FullReportData | null }) {
  if (!reportData?.analyses || reportData.analyses.length === 0) return null;

  // Chercher l'analyse avec le plan d'action GEO le plus complet
  const analysisWithGeoPlan = reportData.analyses
    .filter(a => a.modules?.audit_geo?.plan_action_geo && Array.isArray(a.modules.audit_geo.plan_action_geo) && a.modules.audit_geo.plan_action_geo.length > 0)
    .sort((a, b) => (b.modules?.audit_geo?.plan_action_geo?.length || 0) - (a.modules?.audit_geo?.plan_action_geo?.length || 0))[0];

  if (!analysisWithGeoPlan) return null;

  const auditGeo = analysisWithGeoPlan.modules.audit_geo;
  const rawPlan = auditGeo.plan_action_geo || [];
  const scoreGlobal = Math.round(auditGeo.score_global_geo ?? 0);

  // Normaliser les items (supporter string[] ou object[])
  const planItems = rawPlan.map((item: any) => {
    if (typeof item === 'string') {
      return { action: item, categorie: '', priorite: 'moyenne', impact: '', effort: 'moyen' };
    }
    return item as { action: string; categorie: string; priorite: string; impact: string; effort: string };
  });

  if (planItems.length === 0) return null;

  const highPriority = planItems.filter((i: any) => i.priorite?.toLowerCase() === 'haute').length;
  const medPriority = planItems.filter((i: any) => i.priorite?.toLowerCase() === 'moyenne').length;
  const lowPriority = planItems.filter((i: any) => i.priorite?.toLowerCase() === 'basse').length;

  const getPriorityStyle = (p: string) => {
    const pr = (p || '').toLowerCase();
    if (pr === 'haute') return { bg: '#FEE2E2', color: '#DC2626', label: 'Haute' };
    if (pr === 'moyenne') return { bg: '#FEF3C7', color: '#D97706', label: 'Moyenne' };
    return { bg: '#D1FAE5', color: '#059669', label: 'Basse' };
  };

  const getEffortStyle = (e: string) => {
    const ef = (e || '').toLowerCase();
    if (ef === 'faible') return { bg: '#D1FAE5', color: '#059669', label: 'Faible' };
    if (ef === 'moyen') return { bg: '#FEF3C7', color: '#D97706', label: 'Moyen' };
    return { bg: '#FEE2E2', color: '#DC2626', label: 'Élevé' };
  };

  const getCategoryIcon = (cat: string) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('structur')) return '-';
    if (c.includes('crawl') || c.includes('accessib')) return '-';
    if (c.includes('html') || c.includes('semantique')) return '-';
    if (c.includes('meta') || c.includes('technique')) return '-';
    if (c.includes('contenu') || c.includes('optimisation')) return '-';
    if (c.includes('conform') || c.includes('standard')) return '-';
    return '-';
  };

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '16px',
      border: '1px solid #E2E8F0',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid #F1F5F9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ListChecks size={20} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Plan d'action GEO
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0, marginTop: '2px' }}>
              {planItems.length} actions identifiées pour améliorer votre visibilité IA
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Score GEO badge */}
          <div style={{
            padding: '6px 14px',
            borderRadius: '20px',
            background: scoreGlobal >= 70 ? '#D1FAE5' : scoreGlobal >= 40 ? '#FEF3C7' : '#FEE2E2',
            color: scoreGlobal >= 70 ? '#059669' : scoreGlobal >= 40 ? '#D97706' : '#DC2626',
            fontSize: '14px',
            fontWeight: 700
          }}>
            Score GEO: {scoreGlobal}/100
          </div>
        </div>
      </div>

      {/* Résumé des priorités */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1px',
        background: '#F1F5F9',
        borderBottom: '1px solid #F1F5F9'
      }}>
        <div style={{ background: '#FFF', padding: '14px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#DC2626' }}>{highPriority}</div>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Priorité haute</div>
        </div>
        <div style={{ background: '#FFF', padding: '14px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#D97706' }}>{medPriority}</div>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Priorité moyenne</div>
        </div>
        <div style={{ background: '#FFF', padding: '14px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#059669' }}>{lowPriority}</div>
          <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Priorité basse</div>
        </div>
      </div>

      {/* Liste des actions */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {planItems.map((item: any, idx: number) => {
          const priority = getPriorityStyle(item.priorite);
          const effort = getEffortStyle(item.effort);
          return (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              background: '#FAFBFC',
              transition: 'all 0.2s ease'
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FAFBFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
            >
              {/* Numéro */}
              <div style={{
                minWidth: '28px', height: '28px', borderRadius: '8px',
                background: priority.bg, color: priority.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700, flexShrink: 0
              }}>
                {idx + 1}
              </div>

              {/* Contenu */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  {item.categorie && (
                    <span style={{ fontSize: '12px' }}>{getCategoryIcon(item.categorie)}</span>
                  )}
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', margin: 0, lineHeight: '1.4' }}>
                    {item.action}
                  </p>
                </div>
                {item.impact && (
                  <p style={{ fontSize: '12px', color: '#64748B', margin: 0, marginTop: '4px', lineHeight: '1.4' }}>
                    {item.impact}
                  </p>
                )}
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'flex-start' }}>
                <span style={{
                  padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                  background: priority.bg, color: priority.color
                }}>
                  {priority.label}
                </span>
                <span style={{
                  padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                  background: effort.bg, color: effort.color
                }}>
                  {effort.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AmeliorerView({ reportData }: { reportData: FullReportData | null }) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const sections = [
    { id: 'section-citations', label: 'Citations' },
    { id: 'section-concurrents', label: 'Concurrents' },
    { id: 'section-sources', label: 'Sources' },
  ];

  return (
    <div className="view-content">
      {/* Barre de navigation intra-page */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-slate-100 -mx-4 px-4 mb-4">
        <div className="flex gap-1 overflow-x-auto py-2 scrollbar-none">
          {sections.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollTo(s.id)}
              className="flex-shrink-0 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section avec les deux graphiques côte à côte */}
      <div id="section-citations" className="analytics-section scroll-mt-12">
        <GeoScoreChart reportData={reportData} />
        <div id="section-concurrents" className="scroll-mt-12">
          <CompetitorAnalysis reportData={reportData} />
        </div>
      </div>

      {/* Tableau des domaines */}
      <div id="section-sources" className="scroll-mt-12">
        <DomainsTable reportData={reportData} />
      </div>
    </div>
  );
}

// === COMPOSANT PRINCIPAL ===

/**
 * Composant principal du Dashboard GEO Solocal
 * Gère l'état global et la navigation entre les vues
 */
const Index = () => {
  usePageTitle('Tableau de bord');
  const [activeView, setActiveView] = useState('details');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isNewAnalysisModalOpen, setIsNewAnalysisModalOpen] = useState(false);
  const { subscription } = usePayment();
  const isStarter = subscription?.plan?.id === 'solo';

  // Récupérer le reportId depuis le state de navigation (prioritaire) ou les paramètres d'URL
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const explicitReportId = location.state?.selectedReportId || searchParams.get('reportId');

  // Récupérer la liste des rapports pour le fallback si aucun ID n'est fourni
  const { reports, loading: reportsLoading } = useReports();

  // Déterminer l'ID final à utiliser : sélection manuelle > URL explicite > rapport le plus récent
  const reportId = selectedReportId || explicitReportId || getLatestReportId(reports);

  const { setSelectedReportId: setGlobalSelectedReportId } = useSelectedReport();
  useEffect(() => {
    setGlobalSelectedReportId(reportId);
  }, [reportId, setGlobalSelectedReportId]);

  const handleSelectReport = (id: string) => {
    setSelectedReportId(id);
    setIsReportsModalOpen(false);
    setSearchParams({ reportId: id });
  };
  
  
  // Charger les données du rapport depuis l'API
  const { report: reportData, loading: reportLoading, error } = useReport(reportId);
  
  const loading = reportsLoading || reportLoading;

  // Empty state — aucun rapport
  if (!reportsLoading && reports.length === 0) {
    return (
      <div className="ux-dashboard-body">
        <div className="dashboard-container ux-dashboard">
          <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center w-full max-w-3xl mx-auto">
            {/* Illustration */}
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto shadow-inner">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="22" cy="22" r="14" stroke="#6366F1" strokeWidth="3" fill="none" />
                  <path d="M32 32L40 40" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" />
                  <path d="M18 22h8M22 18v8" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Titre */}
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Bienvenue sur Viraill
            </h1>
            <p className="text-slate-500 text-sm max-w-lg mb-8 leading-relaxed">
              Vous n'avez pas encore d'analyse. Lancez votre première analyse GEO pour découvrir comment votre site est perçu par les IA génératives.
            </p>

            {/* CTA principal */}
            <Button
              onClick={() => setIsNewAnalysisModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-200 gap-2 h-auto"
            >
             
              Lancer ma première analyse
            </Button>

            {/* Steps indicatifs */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
              {[
                { step: '1', title: 'Entrez votre URL', desc: 'Le domaine de votre site à analyser' },
                { step: '2', title: 'Analyse en cours', desc: 'Nos IA testent votre visibilité GEO' },
                { step: '3', title: 'Vos résultats', desc: 'Score, citations et recommandations' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">Étape {step}</p>
                  <p className="text-sm font-semibold text-slate-800">{title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <NewAnalysisModal open={isNewAnalysisModalOpen} onOpenChange={setIsNewAnalysisModalOpen} />
      </div>
    );
  }

  return (
    <div className="ux-dashboard-body">
      <div className="dashboard-container ux-dashboard">
        {/* Section haute avec le graphique de citations */}
        <TopSection
          activeView={activeView}
          onViewChange={setActiveView}
          reportData={reportData}
          reports={reports}
          onOpenReportsModal={() => setIsReportsModalOpen(true)}
        />
        
        {/* Section basse avec contenu dynamique */}
        <div className="bottom-section">
          {loading && reportId ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
              Chargement des données...
            </div>
          ) : error && reportId ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444' }}>
              <div style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>
                Erreur lors du chargement
              </div>
              <div style={{ fontSize: '13px', color: '#64748B', marginTop: '12px' }}>
                Vérifiez que le reportId est correct dans l'URL (ex: ?reportId=1)
              </div>
            </div>
          ) : (
            <>
              {/* Vue Infos détaillées - Affiche le contenu d'Améliorer */}
              {activeView === 'details' && <AmeliorerView reportData={reportData} />}
              
              {/* Vue Améliorer - Affiche le contenu d'Infos détaillées */}
              {activeView === 'ameliorer' && (
                isStarter ? (
                  <div style={{ position: 'relative' }}>
                    <div style={{ filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none' }}>
                      <InfosDetailleesView reportData={reportData} />
                    </div>
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(255,255,255,0.4)', zIndex: 10, borderRadius: '16px'
                    }}>
                      <Lock size={32} style={{ color: '#6366F1', marginBottom: 12 }} />
                      <p style={{ fontSize: '16px', fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>
                        Contenu réservé aux plans supérieurs
                      </p>
                      <p style={{ fontSize: '13px', color: '#64748B' }}>
                        Passez à un plan supérieur pour voir améliorer
                      </p>
                    </div>
                  </div>
                ) : (
                  <InfosDetailleesView reportData={reportData} />
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de sélection de rapport */}
      <Dialog open={isReportsModalOpen} onOpenChange={setIsReportsModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[520px] rounded-2xl p-0 overflow-hidden">
          <DialogHeader style={{ padding: '20px 24px 12px', borderBottom: '1px solid #F1F5F9' }}>
            <DialogTitle style={{ fontSize: '16px', fontWeight: 600, color: '#1E293B' }}>
              Mes analyses
            </DialogTitle>
            <DialogDescription style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
              Sélectionnez un rapport pour afficher ses résultats
            </DialogDescription>
          </DialogHeader>
          <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px' }}>
            {reports.map((r) => {
              const isActive = String(r.id) === String(reportId);
              let domain = r.url;
              try { domain = new URL(r.url).hostname; } catch {}
              const date = new Date(r.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
              return (
                <button
                  key={r.id}
                  onClick={() => handleSelectReport(r.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: isActive ? '2px solid #6366F1' : '1px solid transparent',
                    background: isActive ? '#EEF2FF' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                    marginBottom: '4px',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: isActive ? '#6366F1' : '#F1F5F9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <FileText size={16} style={{ color: isActive ? '#fff' : '#64748B' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {domain}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{date}</span>
                      <span style={{
                        padding: '1px 6px', borderRadius: '6px', fontSize: '11px', fontWeight: 500,
                        background: r.status === 'completed' ? '#DCFCE7' : r.status === 'processing' ? '#FEF3C7' : '#FEE2E2',
                        color: r.status === 'completed' ? '#16A34A' : r.status === 'processing' ? '#D97706' : '#DC2626',
                      }}>
                        {r.status === 'completed' ? 'Terminé' : r.status === 'processing' ? 'En cours' : 'Erreur'}
                      </span>
                    </div>
                  </div>
                  {r.metadata?.score != null && (
                    <div style={{
                      fontSize: '14px', fontWeight: 700, color: '#6366F1', flexShrink: 0,
                    }}>
                      {Math.round(r.metadata.score)}/100
                    </div>
                  )}
                  {isActive && (
                    <CheckCircle size={18} style={{ color: '#6366F1', flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <NewAnalysisModal open={isNewAnalysisModalOpen} onOpenChange={setIsNewAnalysisModalOpen} />
    </div>
  );
};

export default Index;
