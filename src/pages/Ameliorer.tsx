import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import './Index.css';
import { Button } from '@/components/ui/button';
import {
  Wand2,
  Cpu,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Plus,
  Download,
  Lock,
  FileText,
  ArrowUpRight,
  Shield,
  Code,
  Globe,
  Copy,
  FileCode,
  Loader2,
  Layers,
  Play,
  XCircle,
  Check,
  ChevronRight,
  Info,
  CheckCircle,
  X,
  FileDiff,
  GitPullRequest,
} from 'lucide-react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useReport, useReports, getLatestReportId } from '@/hooks/useReports';
import { useSelectedReport } from '@/contexts/SelectedReportContext';
import { usePayment } from '@/hooks/usePayment';
import { ScoreCard } from '@/components/dashboard/ScoreCard';
import { HtmlDiffViewer } from '@/components/optimizer/HtmlDiffViewer';
import { SchemaPreview } from '@/components/optimizer/SchemaPreview';
import { sanitizeRobotsTxt } from '@/utils/robotsValidator';
import { normalizeDomain } from '@/utils/entityNormalizer';
import { SimulationTab } from '@/components/optimizer/SimulationTab';
import { AgenticRemediationSection } from '@/components/agentic/AgenticRemediationSection';
import { generateFullRemediationPatch, createPullRequestPayload } from '@/services/remediationPatchService';
import { HELP } from '@/lib/help-content';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import type {
  FullReportData,
  BulkJobProgress,
  BulkPageResult,
  BulkResultsResponse,
  BulkJobSummary,
} from '@/lib/api';
import {
  startBulkOptimization,
  getBulkProgress,
  getBulkPages,
  getBulkResults,
  cancelBulkJob,
  fetchPageOptimization,
  listBulkJobs,
} from '@/lib/api';

function InfosDetailleesView({ reportData }: { reportData: FullReportData | null }) {
  const [activeOptTab, setActiveOptTab] = useState<'overview' | 'schemas' | 'meta' | 'llms' | 'robots' | 'htmldiff' | 'simulation' | 'agentic'>('overview');
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

  // Charger l'historique des jobs au montage et restaurer le dernier uniquement s'il correspond au domaine courant
  useEffect(() => {
    let cancelled = false;
    // Réinitialiser les états du job bulk si le rapport change
    setBulkJobId(null);
    setBulkPages([]);
    setBulkProgress(null);
    setBulkLoading(false);

    const loadJobs = async () => {
      const jobs = await listBulkJobs();
      if (cancelled) return;

      const currentNormDomain = normalizeDomain(reportDomainHostname || reportDomain);
      // Étanchéité absolue : filtrer strictement pour ne conserver que les jobs du domaine courant
      const domainJobs = currentNormDomain
        ? jobs.filter(j => {
            const jobNormDomain = normalizeDomain(j.domain_url);
            return jobNormDomain === currentNormDomain || jobNormDomain.endsWith(`.${currentNormDomain}`);
          })
        : [];

      setBulkJobsHistory(domainJobs);
      setBulkJobsLoaded(true);

      if (domainJobs.length > 0) {
        const latest = domainJobs[0];
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
  }, [reportId, reportDomainHostname]);

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
        // Rafraîchir l'historique filtré par domaine
        const currentNormDomain = normalizeDomain(reportDomainHostname || reportDomain);
        listBulkJobs().then(jobs => {
          const domainJobs = currentNormDomain
            ? jobs.filter(j => {
                const jobNormDomain = normalizeDomain(j.domain_url);
                return jobNormDomain === currentNormDomain || jobNormDomain.endsWith(`.${currentNormDomain}`);
              })
            : [];
          setBulkJobsHistory(domainJobs);
        });
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
    // Rafraîchir l'historique filtré par domaine
    const currentNormDomain = normalizeDomain(reportDomainHostname || reportDomain);
    listBulkJobs().then(jobs => {
      const domainJobs = currentNormDomain
        ? jobs.filter(j => {
            const jobNormDomain = normalizeDomain(j.domain_url);
            return jobNormDomain === currentNormDomain || jobNormDomain.endsWith(`.${currentNormDomain}`);
          })
        : [];
      setBulkJobsHistory(domainJobs);
    });
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

  // Plateforme et métadonnées d'optimisation
  const coPlatform = coAnalyze?.platform || coOptimize?.metadata?.platform || co?.platform || '';

  // Fichiers : optimize > simulate.generated_files > technical_files
  const schemaContent = coOptimize?.schemas
    ? JSON.stringify(coOptimize.schemas, null, 2)
    : (tf?.schema_org_json?.content || '');
  const llmsContent = stripEmojis(coOptimize?.llms_txt || coSimulate?.generated_files?.llms_txt || tf?.llms_txt?.content || '');
  const llmsFullContent = stripEmojis(coOptimize?.llms_full_txt || coSimulate?.generated_files?.llms_full_txt || '');
  const rawRobotsContent = stripEmojis(coOptimize?.robots_txt || coSimulate?.generated_files?.robots_txt || tf?.robots_txt?.content || '');
  const targetSiteUrl = reportData?.report?.url || (reportData as any)?.llmo_report?.url || '';
  const robotsSanitization = useMemo(() => sanitizeRobotsTxt(rawRobotsContent, coPlatform, targetSiteUrl), [rawRobotsContent, coPlatform, targetSiteUrl]);
  const robotsContent = robotsSanitization.sanitizedContent;
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

  const getRemediationChanges = () => {
    const changes: { path: string; originalContent: string; newContent: string }[] = [];
    if (robotsContent) {
      changes.push({
        path: 'public/robots.txt',
        originalContent: '',
        newContent: robotsContent,
      });
    }
    if (llmsContent) {
      changes.push({
        path: 'public/llms.txt',
        originalContent: '',
        newContent: llmsContent,
      });
    }
    if (llmsFullContent) {
      changes.push({
        path: 'public/llms-full.txt',
        originalContent: '',
        newContent: llmsFullContent,
      });
    }
    if (schemaContent) {
      changes.push({
        path: 'public/schemas/structured-data.jsonld',
        originalContent: '',
        newContent: schemaContent,
      });
    }
    return changes;
  };

  const handleDownloadGitPatch = () => {
    const changes = getRemediationChanges();
    if (changes.length === 0) return;
    const patch = generateFullRemediationPatch(domainName || 'target-site', changes);
    downloadFile(patch, `${domainName || 'viraill'}-remediation.patch`, 'text/x-diff');
  };

  const handleCopyPRPayload = () => {
    const changes = getRemediationChanges();
    if (changes.length === 0) return;
    const pr = createPullRequestPayload(domainName || 'target-site', changes);
    navigator.clipboard.writeText(pr.body);
    setCopied('pr_payload');
    setTimeout(() => setCopied(null), 2500);
  };

  const fileTabsMeta: Record<string, { icon: any; badge: string }> = {
    schemas:  { icon: Code, badge: 'JSON-LD' },
    meta:     { icon: Globe, badge: 'HTML' },
    llms:     { icon: FileText, badge: 'TXT' },
    robots:   { icon: Shield, badge: 'TXT' },
    htmldiff: { icon: FileCode, badge: 'HTML' },
    agentic:  { icon: Cpu, badge: 'M2M' },
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
    { id: 'agentic' as const, label: 'Protocoles Agentiques (M2M)', has: true, tooltip: "Spécifications OpenAPI 3.1, A2A, ARD, x402 et pack de remédiation machine" },
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
                  {tab.id === 'agentic' && (
                    <Cpu size={13} style={{ display: 'inline-block', marginRight: '6px', verticalAlign: '-1px', color: isActive ? '#1A3AFF' : '#64748B' }} />
                  )}
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
                        <Plus size={11} /> Nouveau
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
          {robotsSanitization.warnings.length > 0 && (
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={16} style={{ color: '#16A34A', flexShrink: 0 }} />
              <div style={{ fontSize: '12px', color: '#166534', lineHeight: '1.4' }}>
                <strong>Adaptation contextuelle :</strong> {robotsSanitization.warnings.join(' ')}
              </div>
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

      {/* ═══ ONGLET PROTOCOLES AGENTIQUES (M2M) ═══ */}
      {activeOptTab === 'agentic' && (
        <AgenticRemediationSection reportData={reportData} />
      )}

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

                  {/* Export Développeur & Intégration CI/CD */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    padding: '14px 18px',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    color: '#0F172A',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A3AFF' }}>
                        <FileDiff size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>Export Développeur & Intégration CI/CD</span>
                          <span style={{ fontSize: '10px', padding: '1.5px 6px', borderRadius: '4px', background: '#EEF2FF', color: '#1A3AFF', fontWeight: 700, border: '1px solid #C7D2FE' }}>.PATCH</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          Appliquez instantanément toutes les modifications avec <code style={{ color: '#1A3AFF', fontFamily: 'monospace', background: '#F1F5F9', padding: '1px 4px', borderRadius: '4px' }}>git apply</code> ou ouvrez une Pull Request.
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleCopyPRPayload}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 13px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          background: copied === 'pr_payload' ? '#F0FDF4' : '#FFFFFF',
                          color: copied === 'pr_payload' ? '#16A34A' : '#334155',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {copied === 'pr_payload' ? <Check size={13} /> : <GitPullRequest size={13} />}
                        <span>{copied === 'pr_payload' ? 'PR Copiée !' : 'Copier Description PR'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadGitPatch}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 15px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#1A3AFF',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(26, 58, 255, 0.2)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Download size={13} />
                        <span>Télécharger .patch</span>
                      </button>
                    </div>
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


export default function Ameliorer() {
  usePageTitle('Améliorer — Optimisation GEO & Technique');
  const [searchParams] = useSearchParams();
  const reportIdParam = searchParams.get('reportId');
  const { reports, loading: reportsLoading } = useReports();
  const { selectedReportId } = useSelectedReport();
  const effectiveReportId = reportIdParam
    ? parseInt(reportIdParam, 10)
    : (selectedReportId || (reports && reports.length > 0 ? getLatestReportId(reports) : null));
  const { report: reportData, loading: reportLoading } = useReport(effectiveReportId);
  const { plan } = usePayment();
  const isStarter = plan === 'starter';

  const domainName = useMemo(() => {
    if (!reportData?.report?.url) return null;
    try {
      const url = new URL(reportData.report.url);
      return url.hostname.replace('www.', '');
    } catch {
      return null;
    }
  }, [reportData]);

  return (
    <div className="dashboard-container ux-dashboard font-sans" style={{ minHeight: '100vh', padding: '24px 20px' }}>
      {/* Top Banner */}
      <div className="top-section relative mb-6 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200/60 text-xs font-semibold text-indigo-700 mb-2">
              <Wand2 className="w-3.5 h-3.5" />
              <span>OPTIMISATION TECHNIQUE & CONTENUS MACHINE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Améliorer votre visibilité IA — <span className="text-[#1A3AFF]">{domainName || 'Rapport'}</span>
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-500 mt-1 font-normal">
              Schémas JSON-LD, balises meta, documentation llms.txt, robots.txt et simulations d'agents pour maximiser vos citations.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {reportLoading ? (
        <div className="p-16 text-center space-y-3 bg-white border border-slate-200/80 rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#1A3AFF]" />
          <p className="text-sm font-medium text-slate-700">Chargement des données d'optimisation...</p>
        </div>
      ) : !reportData ? (
        <div className="p-16 text-center space-y-3 bg-white border border-slate-200/80 rounded-2xl">
          <p className="text-sm font-medium text-slate-700">Aucun rapport sélectionné.</p>
          <p className="text-xs text-slate-400">Veuillez sélectionner un rapport dans le tableau de bord.</p>
        </div>
      ) : isStarter ? (
        <div style={{ position: 'relative' }}>
          <div style={{ filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none' }}>
            <InfosDetailleesView reportData={reportData} />
          </div>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.4)', zIndex: 10, borderRadius: '16px'
          }}>
            <div style={{
              background: '#FFFFFF', padding: '32px', borderRadius: '16px',
              boxShadow: '0 20px 40px -8px rgba(0,0,0,0.12)', textAlign: 'center', maxWidth: '420px',
              border: '1px solid #E2E8F0'
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px', background: '#FEF3C7',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                color: '#D97706'
              }}>
                <Lock size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>
                Fonctionnalité Pro
              </h3>
              <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.5', marginBottom: '20px' }}>
                L'analyse technique détaillée (schémas JSON-LD, balises meta, llms.txt, robots.txt) est réservée aux plans Pro et Entreprise.
              </p>
              <a
                href="/pricing"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '10px', background: '#1A3AFF',
                  color: '#FFFFFF', fontSize: '14px', fontWeight: 600, textDecoration: 'none'
                }}
              >
                Passer au plan Pro
                <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        </div>
      ) : (
        <InfosDetailleesView reportData={reportData} />
      )}
    </div>
  );
}
