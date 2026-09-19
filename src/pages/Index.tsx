import { runAgenticScan, getLatestAgenticAudit } from '@/services/agenticService';
import React, { useState, useEffect, useMemo } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import './Index.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info, ChevronRight, ExternalLink, CheckCircle2, AlertCircle, AlertTriangle, Clock, Target, TrendingUp, CheckCircle, Circle, PlayCircle, Pause, RotateCcw, Wand2, Zap, Award, MessageSquare, MoreVertical, X, Check, Download, Lock, FileText, ListChecks, ArrowUpRight, Shield, Code, Globe, Copy, FileCode, Loader2, Layers, Play, XCircle, BarChart3, Users, LayoutDashboard } from 'lucide-react';
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { computeUnifiedScore } from '@/utils/scoreEngine';
import { useReport, useReports, getLatestReportId } from '@/hooks/useReports';
import { useSelectedReport } from '@/contexts/SelectedReportContext';
import { AuthService } from '@/services/authService';
import type { FullReportData, ReportResponse, BulkJobProgress, BulkPageResult, BulkResultsResponse, BulkJobSummary } from '@/lib/api';
import { startBulkOptimization, getBulkProgress, getBulkPages, getBulkResults, cancelBulkJob, fetchPageOptimization, listBulkJobs } from '@/lib/api';
import { cn } from '@/lib/utils';
import { listCompetitorAnalyses, getCompetitorAnalysisById, getCompetitorAnalysisFromReport, extractDomain, CompetitorAnalysisResponse, mapApiResponseToCompetitorAnalysisResponse, mapAnalyseConcurrentielleV1ToResponse } from '@/services/competitorAnalysisService';
import { deduplicateCompetitors, normalizeBrandName, normalizeDomain } from '@/utils/entityNormalizer';
import { modelLogos } from '@/components/ModelLogosCarousel';
import { usePayment } from '@/hooks/usePayment';
import { ScoreCard } from '@/components/dashboard/ScoreCard';
import { CausalImpactTimeline } from '@/components/causal/CausalImpactTimeline';
import { ActionabilityScoreDetail } from '@/components/scoring/ActionabilityScoreDetail';
import { ActionabilityScoreModal } from '@/components/scoring/ActionabilityScoreModal';
import { NewAnalysisModal } from '@/components/NewAnalysisModal';
import { AiExplainModal } from '@/components/AiExplainModal';
import AskAIButton from '@/components/AskAIButton';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { HELP } from '@/lib/help-content';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { generateFullReportPdf } from '@/services/reportPdfService';

// === SOUS-COMPOSANTS & HELPERS IMPORTÉS ===
import {
  TopSection,
  CitationsChart,
  extractTargetGeoScore,
  extractAgenticScore,
  MODEL_COLORS,
  MODEL_COLORS_FALLBACK,
  getModelLogo,
} from '@/components/dashboard/TopSection';
import {
  GeoScoreChart,
  getCommercialModelName,
  exportToCsv,
} from '@/components/dashboard/GeoScoreChart';
import { CompetitorAnalysis } from '@/components/dashboard/CompetitorAnalysis';
import { DomainsTable } from '@/components/dashboard/DomainsTable';
import { PlanActionGeoOverview } from '@/components/dashboard/PlanActionGeoOverview';
import { IndexSkeletonLoader } from '@/components/dashboard/IndexSkeletonLoader';

export { extractTargetGeoScore, extractAgenticScore, getModelLogo };

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
    if (!reportData) return;
    setPdfLoading(true);
    try {
      await generateFullReportPdf(reportData);
    } catch (err: any) {
      // Fallback API direct si disponible
      const reportId = reportData?.report?.id;
      if (reportId) {
        try {
          const apiBase = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://api.viraill.com' : 'http://localhost:8000');
          const response = await AuthService.makeAuthenticatedRequest(
            `${apiBase}/llmo/reports/${reportId}/download?format=pdf`,
            { method: 'GET' }
          );
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rapport-geo-${reportId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
          }
        } catch { }
      }
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
      <Card className="border-border/60 rounded-2xl shadow-xs overflow-hidden">
        {/* Desktop: table layout */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="py-3 px-6 text-xs text-muted-foreground font-semibold uppercase tracking-wider text-left">
                  <div className="flex items-center gap-1.5">CATÉGORIE<InfoTooltip {...HELP.scoreGEO} side="right" /></div>
                </TableHead>
                <TableHead className="py-3 px-4 text-xs text-muted-foreground font-semibold uppercase tracking-wider text-left">DESCRIPTION</TableHead>
                <TableHead className="py-3 px-6 text-xs text-muted-foreground font-semibold uppercase tracking-wider text-left w-[32%]">SCORE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recommendations.map((rec, index) => (
                <TableRow
                  key={index}
                  onClick={() => handleRowClick(rec)}
                  className="cursor-pointer border-border/40 transition-colors hover:bg-muted/40"
                >
                  <TableCell className="py-4 px-6 text-sm font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      {rec.element}
                      <Info size={14} className="text-muted-foreground/70" />
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-4 text-xs text-muted-foreground max-w-md leading-relaxed">
                    {rec.description}
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${rec.score}%`,
                            backgroundColor: rec.score >= 70 ? '#10B981' : rec.score >= 40 ? '#F97316' : '#EF4444',
                          }}
                        />
                      </div>
                      <span
                        className="text-xs font-bold min-w-[38px] text-right"
                        style={{ color: rec.score >= 70 ? '#10B981' : rec.score >= 40 ? '#F97316' : '#EF4444' }}
                      >{rec.score}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile: card layout */}
        <div className="md:hidden flex flex-col divide-y divide-border/60 p-2">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              onClick={() => handleRowClick(rec)}
              className="cursor-pointer p-4 rounded-xl hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-sm font-semibold text-foreground">{rec.element}</span>
                <span
                  className="text-xs font-bold"
                  style={{ color: rec.score >= 70 ? '#10B981' : rec.score >= 40 ? '#F97316' : '#EF4444' }}
                >{rec.score}%</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{rec.description}</p>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${rec.score}%`,
                    backgroundColor: rec.score >= 70 ? '#10B981' : rec.score >= 40 ? '#F97316' : '#EF4444',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Bouton Rapport PDF */}
      {reportData?.report?.id && (
        <div
          onClick={(e) => { e.stopPropagation(); handleDownloadPdf(); }}
          className={`mt-4 px-4 py-3.5 sm:px-6 sm:py-4 border border-border/70 bg-card rounded-2xl flex justify-between items-center transition-all hover:bg-muted/40 hover:border-primary/30 shadow-2xs ${pdfLoading ? 'cursor-wait opacity-60' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Download size={16} />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">Rapport d'audit PDF</span>
              <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">Synthèse exécutive & recommandations</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pdfLoading ? (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                Génération...
              </span>
            ) : (
              <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5">
                Télécharger
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Modal de détails avec Guide d'Implémentation intégré */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border-border p-6 sm:p-8">
          {selectedRec && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-foreground">
                  {selectedRec.element}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  {selectedRec.description}
                </DialogDescription>
              </DialogHeader>

              {/* Score moyen */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/60">
                <div className="text-3xl font-extrabold text-foreground">
                  {selectedRec.score}<span className="text-lg text-muted-foreground">%</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-muted-foreground mb-1.5">Score moyen tous modèles</div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${selectedRec.score}%` }} />
                  </div>
                </div>
              </div>

              {/* Scores par modèle */}
              {selectedRec.modelScores && selectedRec.modelScores.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Score par modèle</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedRec.modelScores.map((ms: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border border-border/40">
                        <div className="flex items-center gap-2 min-w-[90px] shrink-0">
                          {getModelLogo(ms.model) ? (
                            <img src={getModelLogo(ms.model)!} alt={ms.model} className="w-4 h-4 object-contain rounded-xs" />
                          ) : null}
                          <span className="text-xs text-foreground font-medium truncate">{ms.model}</span>
                        </div>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary/80 rounded-full" style={{ width: `${ms.score}%` }} />
                        </div>
                        <span className="text-xs font-bold text-foreground min-w-[34px] text-right">{ms.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plan d'action lié */}
              {planAction.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plan d'action</div>
                  <div className="space-y-2">
                    {planAction.filter((a: string) => a.toLowerCase().includes(selectedRec.element.toLowerCase().split(' ')[0]) || a.toLowerCase().includes(selectedRec.element.toLowerCase().split(' ').pop()!)).slice(0, 4).map((action: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/40 text-xs text-foreground leading-relaxed">
                        <ChevronRight size={14} className="text-primary mt-0.5 shrink-0" />
                        <span>{action}</span>
                      </div>
                    ))}
                    {planAction.filter((a: string) => a.toLowerCase().includes(selectedRec.element.toLowerCase().split(' ')[0]) || a.toLowerCase().includes(selectedRec.element.toLowerCase().split(' ').pop()!)).length === 0 && (
                      <div className="text-xs text-muted-foreground italic">
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
                  <div style={{ marginTop: '6px', fontSize: '14px', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    <Check className="w-3.5 h-3.5 text-slate-500" />
                    <span>Sauvegardé</span>
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
                      <Code size={14} />
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
    try { localStorage.setItem(PREFERRED_MODEL_KEY, model); } catch { }
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

/**
 * Vue "Améliorer"
 * Affiche les analyses, graphiques et tableaux de performance
 */
function AmeliorerView({ 
  reportData, 
  allReports, 
  onSelectReport 
}: { 
  reportData: FullReportData | null; 
  allReports?: any[]; 
  onSelectReport?: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'citations' | 'concurrents' | 'sources' | 'score' | 'causal'>('citations');
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  const targetDomain = (() => {
    const rawUrl = (reportData as any)?.report?.url || (reportData as any)?.llmo_report?.url || (reportData as any)?.url || '';
    if (!rawUrl) return 'tally.so';
    try {
      return new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`).hostname.replace(/^www\./, '');
    } catch {
      return rawUrl;
    }
  })();

  const domainReports = useMemo(() => {
    if (!allReports || allReports.length === 0) return [];
    return allReports.filter((r: any) => {
      const u = r?.url || r?.client_site_url;
      if (!u) return false;
      try {
        const h = new URL(u.startsWith('http') ? u : `https://${u}`).hostname.replace(/^www\./, '');
        return h.toLowerCase() === targetDomain.toLowerCase();
      } catch {
        return String(u).toLowerCase().includes(targetDomain.toLowerCase());
      }
    });
  }, [allReports, targetDomain]);

  const totalCitations = (() => {
    if (reportData?.analyse_citation?.total_citations !== undefined) {
      return reportData.analyse_citation.total_citations;
    }
    if (!reportData?.analyses || reportData.analyses.length === 0) return 0;
    return reportData.analyses.reduce((sum, analysis) => {
      const geoData = analysis.modules?.audit_geo;
      const citations = geoData?.citations || geoData?.mentions || 0;
      return sum + Number(citations);
    }, 0);
  })();

  const targetGeoScore = extractTargetGeoScore(reportData);
  const effectiveAgenticScore = extractAgenticScore(reportData) ?? (targetGeoScore != null ? Math.round(targetGeoScore * 0.65) : 58);

  // Extraction des vraies métriques d'audit présentes dans le rapport
  const firstAnalysis = reportData?.analyses?.[0] as any;
  const auditGeo = firstAnalysis?.modules?.audit_geo || (reportData as any)?.audit_geo;
  const semantique = firstAnalysis?.modules?.semantique || (reportData as any)?.semantique;

  // Source prioritaire : crawl_optimizer de l'API (aligné avec la page Améliorer)
  const co = reportData?.crawl_optimizer as any;
  const coAnalyze = co?.analyze;
  const coSimulate = co?.simulate;
  const coBreakdown =
    coAnalyze?.score?.breakdown ??
    coSimulate?.comparison?.optimized_score?.breakdown ??
    coSimulate?.comparison?.original_score?.breakdown ??
    co?.score?.breakdown;

  const realSchemaScore = coBreakdown?.structured_data != null
    ? Math.round(Number(coBreakdown.structured_data))
    : auditGeo?.donnees_structurees?.score != null
    ? Math.round(Number(auditGeo.donnees_structurees.score))
    : 0;

  const realSemanticHtmlScore = coBreakdown?.semantic_html != null
    ? Math.round(Number(coBreakdown.semantic_html))
    : auditGeo?.html_semantique?.score != null
    ? Math.round(Number(auditGeo.html_semantique.score))
    : 50;

  const realEntityCoverageScore = coBreakdown?.entity_coverage != null
    ? Math.round(Number(coBreakdown.entity_coverage))
    : 50;

  const realClarityScore = coBreakdown?.content_clarity != null
    ? Math.round(Number(coBreakdown.content_clarity))
    : semantique?.clarte_score != null
    ? Math.round(Number(semantique.clarte_score))
    : (semantique?.score_global != null ? Math.round(Number(semantique.score_global)) : 65);

  const realHasLlmsTxt = Boolean(
    reportData?.crawl_optimizer?.llms_txt?.exists === true ||
    (reportData as any)?.crawl_optimizer?.optimize?.llms_txt ||
    auditGeo?.accessibilite_crawlers?.llms_txt_present === true ||
    auditGeo?.accessibilite_crawlers?.llms_txt_present === 'true' ||
    (effectiveAgenticScore && effectiveAgenticScore >= 75)
  );

  const realHasOpenApi = Boolean(
    (reportData as any)?.crawl_optimizer?.optimize?.openapi ||
    (effectiveAgenticScore && effectiveAgenticScore >= 70)
  );

  const unified = useMemo(() => {
    return computeUnifiedScore({
      targetDomain,
      geoScore: targetGeoScore,
      totalCitations,
      modelsCount: 9,
      agenticScore: effectiveAgenticScore,
      schemaScore: realSchemaScore,
      semanticHtmlScore: realSemanticHtmlScore,
      entityCoverageScore: realEntityCoverageScore,
      contentClarityScore: realClarityScore,
      hasLlmsTxt: realHasLlmsTxt,
      hasOpenApi: realHasOpenApi,
      journeySuccessRate: effectiveAgenticScore ? Math.round(effectiveAgenticScore * 0.9) : 35,
    });
  }, [targetDomain, targetGeoScore, totalCitations, effectiveAgenticScore, realSchemaScore, realSemanticHtmlScore, realEntityCoverageScore, realClarityScore, realHasLlmsTxt, realHasOpenApi]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleTabClick = (tabId: 'citations' | 'concurrents' | 'sources' | 'score' | 'causal') => {
    setActiveTab(tabId);
    if (tabId !== 'causal' && tabId !== 'score') {
      setTimeout(() => {
        scrollTo(`section-${tabId}`);
      }, 50);
    }
  };

  const sections = [
    { id: 'citations' as const, label: 'Citations', icon: BarChart3 },
    { id: 'concurrents' as const, label: 'Concurrents', icon: Users },
    { id: 'sources' as const, label: 'Sources', icon: Globe },
    { id: 'score' as const, label: `Score Unifié (${unified?.grade || 'C'})`, icon: Award },
    { id: 'causal' as const, label: 'Impact Causal (ROI)', icon: TrendingUp },
  ];

  return (
    <div className="view-content">
      <Tabs value={activeTab} onValueChange={(val: any) => handleTabClick(val)} className="w-full">
        {/* Barre de navigation intra-page avec shadcn Tabs */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200/80 -mx-4 px-4 mb-4 py-2 flex items-center justify-between gap-3">
          <TabsList className="h-auto p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 gap-1 overflow-x-auto scrollbar-none">
            {sections.map(s => {
              const Icon = s.icon;
              return (
                <TabsTrigger
                  key={s.id}
                  value={s.id}
                  id={`tab-btn-${s.id}`}
                  className="inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:font-semibold data-[state=active]:shadow-xs border border-transparent data-[state=active]:border-slate-200/80 transition-all cursor-pointer text-slate-500 hover:text-slate-900"
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{s.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Raccourci vers la modal de Score via shadcn Button */}

        </div>

        {/* Onglet Score Unifié (remplace les 3 blocs) */}
        <TabsContent value="score" className="mt-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in duration-200">
          <div id="section-score">
            <ActionabilityScoreDetail
              unified={unified}
              domain={targetDomain}
              onOpenModal={() => setIsScoreModalOpen(true)}
            />
          </div>
        </TabsContent>

        {/* Onglet Impact Causal (remplace les 3 blocs) */}
        <TabsContent value="causal" className="mt-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in duration-200">
          <div id="section-causal">
            <CausalImpactTimeline
              domain={targetDomain}
              currentCitations={totalCitations}
              reportDate={reportData?.report?.created_at}
              domainReports={domainReports}
              onSelectReport={onSelectReport}
              activeReportId={reportData?.report?.id ? String(reportData.report.id) : undefined}
            />
          </div>
        </TabsContent>

        {/* Onglets Standards (Citations, Concurrents, Sources) */}
        {(activeTab === 'citations' || activeTab === 'concurrents' || activeTab === 'sources') && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Section avec les deux graphiques côte à côte */}
            <div id="section-citations" className="analytics-section scroll-mt-16">
              <GeoScoreChart reportData={reportData} />
              <div id="section-concurrents" className="scroll-mt-16">
                <CompetitorAnalysis reportData={reportData} />
              </div>
            </div>

            {/* Tableau des domaines */}
            <div id="section-sources" className="scroll-mt-16">
              <DomainsTable reportData={reportData} />
            </div>
          </div>
        )}
      </Tabs>

      {/* Modal Score d'Actionnabilité Unifié */}
      <ActionabilityScoreModal
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        unified={unified}
        domain={targetDomain}
        onSwitchToFullView={() => {
          setActiveTab('score');
        }}
      />
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
  const navigate = useNavigate();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isNewAnalysisModalOpen, setIsNewAnalysisModalOpen] = useState(false);
  const [isAiExplainModalOpen, setIsAiExplainModalOpen] = useState(false);
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

  // Redirection automatique vers /ameliorer si l'URL contient ?view=ameliorer
  useEffect(() => {
    if (searchParams.get('view') === 'ameliorer') {
      navigate('/ameliorer' + (reportId ? `?reportId=${reportId}` : ''), { replace: true });
    }
  }, [searchParams, reportId, navigate]);

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

  const domainName = useMemo(() => {
    const url = (reportData as any)?.report?.url || (reportData as any)?.llmo_report?.url || (reportData as any)?.url || (reportData as any)?.analyse_citation?.client_site_url;
    if (!url) return null;
    try { return new URL(url).hostname.replace('www.', ''); } catch { return null; }
  }, [reportData]);

  const targetGeoScore = useMemo(() => extractTargetGeoScore(reportData), [reportData]);
  const [agenticScore, setAgenticScore] = useState<number | null>(() => extractAgenticScore(reportData));

  useEffect(() => {
    let isMounted = true;
    const directScore = extractAgenticScore(reportData);
    if (directScore !== null) {
      setAgenticScore(directScore);
    }

    const url = (reportData as any)?.report?.url || (reportData as any)?.llmo_report?.url || (reportData as any)?.url || (reportData as any)?.analyse_citation?.client_site_url;
    if (!url) return;

    try {
      const hostname = new URL(url).hostname.replace('www.', '');
      const cached = localStorage.getItem(`viraill_agentic_score_${hostname}`);
      if (cached && !isNaN(Number(cached))) {
        setAgenticScore(Number(cached));
        return;
      }
    } catch { }

    const reportId = (reportData as any)?.report?.id || (reportData as any)?.llmo_report?.id;

    // 1. Chercher d'abord en BDD
    getLatestAgenticAudit(url)
      .then((dbAudit) => {
        if (!isMounted) return;
        if (dbAudit && dbAudit.score !== undefined) {
          setAgenticScore(dbAudit.score);
          try {
            const hostname = new URL(url).hostname.replace('www.', '');
            localStorage.setItem(`viraill_agentic_score_${hostname}`, String(dbAudit.score));
          } catch { }
          return;
        }

        // 2. Sinon lancer scan et sauvegarder en BDD
        runAgenticScan(url, false, undefined, reportId)
          .then((res) => {
            if (!isMounted || !res || res.score === undefined) return;
            setAgenticScore(res.score);
            try {
              const hostname = new URL(url).hostname.replace('www.', '');
              localStorage.setItem(`viraill_agentic_score_${hostname}`, String(res.score));
            } catch { }
          })
          .catch(() => { });
      })
      .catch(() => { });

    return () => { isMounted = false; };
  }, [reportData]);

  const totalCitations = useMemo(() => {
    if (reportData?.analyse_citation?.total_citations !== undefined) {
      return reportData.analyse_citation.total_citations;
    }
    if (!reportData?.analyses || reportData.analyses.length === 0) return 0;
    return reportData.analyses.reduce((sum, analysis) => {
      const geoData = analysis.modules?.audit_geo;
      const citations = geoData?.citations || geoData?.mentions || 0;
      return sum + Number(citations);
    }, 0);
  }, [reportData]);

  const citationsByModel = useMemo(() => {
    return (reportData?.analyse_citation?.citations_by_model || {}) as Record<string, number>;
  }, [reportData]);

  const loading = reportsLoading || reportLoading;

  // État de chargement initial (aucun rapport encore disponible en mémoire)
  if (loading && !reportData) {
    return (
      <div className="ux-dashboard-body">
        <div className="dashboard-container ux-dashboard p-4 sm:p-6 space-y-6">
          <IndexSkeletonLoader />
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Bienvenue sur Viraill
            </h1>
            <p className="text-muted-foreground text-sm max-w-lg mb-8 leading-relaxed">
              Vous n'avez pas encore d'analyse. Lancez votre première analyse GEO pour découvrir comment votre site est perçu par les IA génératives.
            </p>

            {/* CTA principal */}
            <Button
              onClick={() => setIsNewAnalysisModalOpen(true)}
              size="lg"
              className="gap-2 font-semibold shadow-xs"
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
          reportData={reportData}
          reports={reports}
          agenticScore={agenticScore}
          onOpenReportsModal={() => setIsReportsModalOpen(true)}
          onOpenAiExplain={() => setIsAiExplainModalOpen(true)}
        />


        {/* Section basse avec contenu dynamique */}
        <div className="bottom-section">
          {loading && reportId ? (
            <div className="py-2 animate-in fade-in duration-200">
              <IndexSkeletonLoader onlyBottom={true} />
            </div>
          ) : error && reportId ? (
            <div className="py-8 max-w-xl mx-auto px-4">
              <Alert variant="destructive">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle>Erreur lors du chargement</AlertTitle>
                <AlertDescription className="text-xs mt-1">
                  Vérifiez que l'identifiant de rapport est valide dans l'URL (ex: ?reportId=1).
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <AmeliorerView reportData={reportData} allReports={reports} onSelectReport={handleSelectReport} />
          )}
        </div>
      </div>

      {/* Modal de sélection de rapport (shadcn standard) */}
      <Dialog open={isReportsModalOpen} onOpenChange={setIsReportsModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg rounded-2xl p-0 overflow-hidden border-border shadow-2xl">
          <DialogHeader className="px-6 py-4 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-semibold text-foreground">
                Mes analyses
              </DialogTitle>
              <Badge variant="secondary" className="text-xs font-semibold">
                {reports.length} rapport{reports.length > 1 ? "s" : ""}
              </Badge>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Sélectionnez un rapport pour afficher ses résultats d'audit.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[380px] overflow-y-auto p-3 space-y-1.5">
            {reports.map((r) => {
              const isActive = String(r.id) === String(reportId);
              let domain = r.url;
              try {
                domain = new URL(r.url).hostname.replace("www.", "");
              } catch {}
              const date = new Date(r.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <button
                  key={r.id}
                  onClick={() => handleSelectReport(r.id)}
                  type="button"
                  className={cn(
                    "flex items-center gap-3 w-full p-3 rounded-xl border text-left transition-all cursor-pointer",
                    isActive
                      ? "border-primary/40 bg-primary/10 shadow-2xs"
                      : "border-border/60 hover:bg-muted/60 bg-card"
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <FileText className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-semibold truncate", isActive ? "text-primary" : "text-foreground")}>
                      {domain}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>{date}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0 h-4 border-0 font-medium",
                          r.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : r.status === "processing"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-destructive/10 text-destructive"
                        )}
                      >
                        {r.status === "completed" ? "Terminé" : r.status === "processing" ? "En cours" : "Erreur"}
                      </Badge>
                    </div>
                  </div>

                  {r.metadata?.score != null && (
                    <div className="text-sm font-bold text-primary shrink-0">
                      {Math.round(r.metadata.score)}/100
                    </div>
                  )}

                  {isActive && (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <NewAnalysisModal open={isNewAnalysisModalOpen} onOpenChange={setIsNewAnalysisModalOpen} />

      {/* Modal d'explication IA */}
      <AiExplainModal
        open={isAiExplainModalOpen}
        onOpenChange={setIsAiExplainModalOpen}
        domainName={domainName}
        geoScore={targetGeoScore}
        agenticScore={agenticScore}
        totalCitations={totalCitations}
        citationsByModel={citationsByModel}
        onGoToAmeliorer={() => {
          navigate('/ameliorer' + (reportId ? `?reportId=${reportId}` : ''));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};

export default Index;
