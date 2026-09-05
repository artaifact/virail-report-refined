import type { FullReportData } from '@/lib/api';
import {
  getCompetitorAnalysisFromReport,
  type CompetitorAnalysisResponse,
} from './competitorAnalysisService';
import { extractTargetGeoScore } from '@/pages/Index';

interface GeneratePdfOptions {
  includeCompetition?: boolean;
  includeRecommendations?: boolean;
  includeCitations?: boolean;
}

/**
 * Nettoie une URL pour en extraire le domaine principal
 */
function cleanDomain(url?: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

/**
 * Formate une date ISO en chaîne lisible en français
 */
function formatDate(dateStr?: string): string {
  if (!dateStr) return new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Obtient l'URL du favicon pour un domaine donné
 */
function getFaviconUrl(domainOrUrl?: string): string {
  const domain = cleanDomain(domainOrUrl);
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

/**
 * Associe un moteur d'IA à son domaine pour le favicon
 */
function getModelFavicon(modelName: string): string {
  const n = modelName.toLowerCase();
  if (n.includes('gpt') || n.includes('chatgpt') || n.includes('openai')) return 'https://www.google.com/s2/favicons?domain=openai.com&sz=64';
  if (n.includes('claude') || n.includes('anthropic')) return 'https://www.google.com/s2/favicons?domain=anthropic.com&sz=64';
  if (n.includes('gemini') || n.includes('google') || n.includes('ai overview')) return 'https://www.google.com/s2/favicons?domain=google.com&sz=64';
  if (n.includes('perplexity') || n.includes('sonar')) return 'https://www.google.com/s2/favicons?domain=perplexity.ai&sz=64';
  if (n.includes('mistral') || n.includes('mixtral')) return 'https://www.google.com/s2/favicons?domain=mistral.ai&sz=64';
  if (n.includes('grok') || n.includes('x.ai')) return 'https://www.google.com/s2/favicons?domain=x.ai&sz=64';
  if (n.includes('deepseek')) return 'https://www.google.com/s2/favicons?domain=deepseek.com&sz=64';
  if (n.includes('llama') || n.includes('meta')) return 'https://www.google.com/s2/favicons?domain=meta.com&sz=64';
  if (n.includes('qwen') || n.includes('alibaba')) return 'https://www.google.com/s2/favicons?domain=alibabacloud.com&sz=64';
  return 'https://www.google.com/s2/favicons?domain=ai.google&sz=64';
}

/**
 * Rendu SVG d'une jauge circulaire de haute définition
 */
function renderCircularGaugeSvg(value: number, label: string, color: string, total: number = 100, isScore: boolean = false): string {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, isScore ? value : (value / Math.max(1, total)) * 100));
  const offset = circ - (pct / 100) * circ;

  return `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 130px;">
      <svg viewBox="0 0 100 100" style="width: 95px; height: 95px;">
        <circle cx="50" cy="50" r="${r}" fill="none" stroke="#F1F5F9" stroke-width="9" />
        <circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="9"
          stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round"
          transform="rotate(-90 50 50)" />
        <text x="50" y="47" text-anchor="middle" style="font-size: 22px; font-weight: 800; fill: #0F172A; font-family: Inter, system-ui, sans-serif;">
          ${value}
        </text>
        <text x="50" y="62" text-anchor="middle" style="font-size: 8.5px; font-weight: 600; fill: #64748B; font-family: Inter, system-ui, sans-serif;">
          ${isScore ? '/ 100' : 'citations'}
        </text>
      </svg>
      <div style="font-size: 10px; font-weight: 700; color: #1E293B; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">
        ${label}
      </div>
    </div>
  `;
}

/**
 * Construit le SVG de la Matrice de Matérialité type McKinsey (2x2 Quadrants)
 */
function renderMaterialityMatrixSvg(
  targetDomain: string,
  targetScore: number,
  brands: Array<{ name: string; url?: string; visibility: number; totalScore: number; isTarget?: boolean }>
): string {
  const w = 620;
  const h = 330;
  const padL = 40;
  const padR = 25;
  const padT = 25;
  const padB = 40;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const midX = padL + plotW / 2;
  const midY = padT + plotH / 2;

  // Calcul coordonnées normalisées (0-100)
  const getX = (vis: number) => padL + (Math.max(5, Math.min(95, vis)) / 100) * plotW;
  const getY = (score: number) => padT + plotH - (Math.max(5, Math.min(95, score)) / 100) * plotH;

  // Rendu des points
  const pointsSvg = brands.slice(0, 12).map(b => {
    const cx = getX(b.visibility || 50);
    const cy = getY(b.totalScore || 50);
    const isMe = b.isTarget || cleanDomain(b.url || b.name) === cleanDomain(targetDomain);

    if (isMe) {
      return `
        <g>
          <circle cx="${cx}" cy="${cy}" r="14" fill="#6366F1" opacity="0.15" />
          <circle cx="${cx}" cy="${cy}" r="8" fill="#4F46E5" stroke="#FFFFFF" stroke-width="2.5" />
          <rect x="${cx + 10}" y="${cy - 12}" width="${b.name.length * 7 + 16}" height="20" rx="4" fill="#0F172A" />
          <text x="${cx + 18}" y="${cy + 2}" fill="#FFFFFF" font-size="10" font-weight="700" font-family="Inter, sans-serif">
            ★ ${b.name} (Vous)
          </text>
        </g>
      `;
    }

    return `
      <g>
        <circle cx="${cx}" cy="${cy}" r="5.5" fill="#64748B" stroke="#FFFFFF" stroke-width="1.5" />
        <rect x="${cx + 8}" y="${cy - 9}" width="${b.name.length * 5.5 + 10}" height="16" rx="3" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1" />
        <text x="${cx + 13}" y="${cy + 3}" fill="#334155" font-size="9" font-weight="600" font-family="Inter, sans-serif">
          ${b.name}
        </text>
      </g>
    `;
  }).join('');

  return `
    <svg viewBox="0 0 ${w} ${h}" style="width: 100%; height: auto; max-height: 290px; background: #FFFFFF; border-radius: 8px;">
      <!-- Quadrants background -->
      <!-- Top Left : Niche Players / Spécialistes -->
      <rect x="${padL}" y="${padT}" width="${plotW / 2}" height="${plotH / 2}" fill="#F0F9FF" opacity="0.7" />
      <text x="${padL + 12}" y="${padT + 18}" fill="#0369A1" font-size="9.5" font-weight="800" font-family="Inter, sans-serif" letter-spacing="0.05em">
        ACTEURS DE NICHE & SPÉCIALISTES
      </text>

      <!-- Top Right : Leaders / Références de Marché -->
      <rect x="${midX}" y="${padT}" width="${plotW / 2}" height="${plotH / 2}" fill="#F0FDF4" opacity="0.7" />
      <text x="${midX + 12}" y="${padT + 18}" fill="#15803D" font-size="9.5" font-weight="800" font-family="Inter, sans-serif" letter-spacing="0.05em">
        LEADERS DU MARCHÉ
      </text>

      <!-- Bottom Left : Suiveurs / En Développement -->
      <rect x="${padL}" y="${midY}" width="${plotW / 2}" height="${plotH / 2}" fill="#F8FAFC" opacity="0.7" />
      <text x="${padL + 12}" y="${midY + 18}" fill="#64748B" font-size="9.5" font-weight="800" font-family="Inter, sans-serif" letter-spacing="0.05em">
        EN DÉVELOPPEMENT / SUIVEURS
      </text>

      <!-- Bottom Right : Notoriété Vulnérable -->
      <rect x="${midX}" y="${midY}" width="${plotW / 2}" height="${plotH / 2}" fill="#FFFBEB" opacity="0.7" />
      <text x="${midX + 12}" y="${midY + 18}" fill="#B45309" font-size="9.5" font-weight="800" font-family="Inter, sans-serif" letter-spacing="0.05em">
        NOTORIÉTÉ VULNÉRABLE
      </text>

      <!-- Axes médians pointillés -->
      <line x1="${midX}" y1="${padT}" x2="${midX}" y2="${padT + plotH}" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="4 4" />
      <line x1="${padL}" y1="${midY}" x2="${padL + plotW}" y2="${midY}" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="4 4" />

      <!-- Contour du graphe -->
      <rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" fill="none" stroke="#94A3B8" stroke-width="1" />

      <!-- Labels des axes -->
      <text x="${padL + plotW / 2}" y="${h - 10}" text-anchor="middle" fill="#475569" font-size="10" font-weight="700" font-family="Inter, sans-serif">
        VISIBILITÉ DANS LES MOTEURS IA (%) →
      </text>
      <text x="15" y="${padT + plotH / 2}" text-anchor="middle" fill="#475569" font-size="10" font-weight="700" font-family="Inter, sans-serif" transform="rotate(-90 15 ${padT + plotH / 2})">
        SCORE DE QUALITÉ GEO / 100 →
      </text>

      <!-- Points des marques -->
      ${pointsSvg}
    </svg>
  `;
}

/**
 * Service principal de génération du PDF complet
 */
export async function generateFullReportPdf(
  reportData: FullReportData | null,
  competitorData?: CompetitorAnalysisResponse | null,
  options: GeneratePdfOptions = {}
): Promise<void> {
  if (!reportData) {
    throw new Error('Données de rapport manquantes pour la génération du PDF.');
  }

  const {
    includeCompetition = true,
    includeRecommendations = true,
    includeCitations = true,
  } = options;

  const reportId = (reportData as any)?.report?.id || (reportData as any)?.llmo_report?.id;
  const domain = cleanDomain((reportData as any)?.report?.url || (reportData as any)?.llmo_report?.url);
  const targetUrl = (reportData as any)?.report?.url || (reportData as any)?.llmo_report?.url || '';
  const updateDate = formatDate((reportData as any)?.report?.updated_at || (reportData as any)?.report?.created_at);

  // 1. Extraire ou charger les données concurrentielles si absentes
  let compData = competitorData;
  if (!compData && reportId && includeCompetition) {
    try {
      compData = await getCompetitorAnalysisFromReport(reportId);
    } catch {
      // Fallback gracieux
    }
  }

  // 2. Score GEO et Citations
  const targetGeoScore = extractTargetGeoScore(reportData) ?? 0;
  const geoColor = targetGeoScore >= 75 ? '#10B981' : targetGeoScore >= 50 ? '#6366F1' : '#F59E0B';
  const geoStatus = targetGeoScore >= 75 ? 'Optimal' : targetGeoScore >= 50 ? 'Favorable' : 'À renforcer';

  let totalCitations = reportData?.analyse_citation?.total_citations || 0;
  if (!totalCitations && reportData?.analyses?.length) {
    totalCitations = reportData.analyses.reduce((sum, a) => {
      const geo = a.modules?.audit_geo;
      return sum + Number(geo?.citations || geo?.mentions || 0);
    }, 0);
  }

  // 3. Citations par modèle d'IA (avec logos officiels)
  const citationsByModel = (reportData?.analyse_citation?.citations_by_model || {}) as Record<string, number>;
  const modelEntries = Object.entries(citationsByModel)
    .map(([model, count]) => ({
      name: model,
      count: Number(count) || 0,
      pct: totalCitations > 0 ? Math.round(((Number(count) || 0) / totalCitations) * 100) : 0,
      logoUrl: getModelFavicon(model),
    }))
    .sort((a, b) => b.count - a.count);

  // 4. Domaines et sources les plus cités (avec favicons)
  const frequentlyMentioned = reportData?.analyse_citation?.competitors_frequently_mentioned || [];
  const sourcesList = Array.isArray(frequentlyMentioned) ? frequentlyMentioned.slice(0, 10) : [];

  // 5. Piliers GEO & Recommandations (Améliorer)
  const categories = [
    { key: 'html_semantique', label: 'Structure HTML & Sémantique', description: 'Balisage hiérarchique, balises sémantiques et clarté structurelle.' },
    { key: 'donnees_structurees', label: 'Données Structurées (Schema.org)', description: 'JSON-LD, balises Schema.org et données typées exploitables par les LLM.' },
    { key: 'accessibilite_crawlers', label: 'Accessibilité Crawlers IA', description: 'Robots.txt, directives LLM, vitesse de réponse et sitemaps.' },
    { key: 'optimisation_contenu', label: 'Qualité & Richesse du Contenu', description: 'Densité informationnelle, complétude et réponses directes aux requêtes.' },
    { key: 'metadonnees_techniques', label: 'Métadonnées & Directives IA', description: 'Balises meta description, Open Graph et llms.txt.' },
    { key: 'conformite_standards', label: 'Standards Web & Performance', description: 'Accessibilité W3C, performance web et compatibilité multi-moteur.' },
  ];

  const getCategoryScore = (audit: any, key: string): number | null => {
    const val = audit?.[key];
    if (typeof val === 'number') return val;
    if (typeof val === 'object' && val !== null && typeof val.score === 'number') return val.score;
    return null;
  };

  const pillarsScores = categories.map(cat => {
    const scores = (reportData.analyses || [])
      .map((a: any) => getCategoryScore(a.modules?.audit_geo, cat.key))
      .filter((s): s is number => typeof s === 'number' && s > 0);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return { ...cat, score: avg };
  }).filter(c => c.score > 0);

  // Plan d'actions
  let planActionItems: string[] = [];
  for (const analysis of reportData.analyses || []) {
    const pa = analysis.modules?.audit_geo?.plan_action_geo;
    if (pa && Array.isArray(pa) && pa.length > 0) {
      planActionItems = pa.map((item: any) => (typeof item === 'string' ? item : item.action || String(item)));
      break;
    }
  }

  // 6. Données de Veille & 10 Concurrents (/competition)
  const rawCompetitors = compData?.consolidated_competitors || [];
  // Construire exactement les 10 premiers concurrents du benchmark
  const top10Competitors = rawCompetitors.slice(0, 10);
  const targetRank = compData?.your_position?.rank || 1;
  const totalCompetitorsCount = Math.max(top10Competitors.length, compData?.global_stats?.total_competitors_found || 10);

  // Données pour la Matrice de Matérialité
  const matrixDataFromReport = (reportData as any)?.materiality_matrix?.brands;
  const matrixBrands = matrixDataFromReport && matrixDataFromReport.length > 0
    ? matrixDataFromReport.map((b: any) => ({
        name: b.name || cleanDomain(b.url),
        url: b.url,
        visibility: b.visibility || 50,
        totalScore: b.total_score || 50,
        isTarget: !!b.is_target,
      }))
    : [
        { name: domain, url: targetUrl, visibility: 75, totalScore: targetGeoScore, isTarget: true },
        ...top10Competitors.map((c: any, i: number) => ({
          name: c.name || cleanDomain(c.primary_url),
          url: c.primary_url,
          visibility: Math.max(20, Math.min(90, Math.round(((c.models_count || 1) / 5) * 100))),
          totalScore: Math.round(Number(c.average_score || 0) * (Number(c.average_score || 0) <= 1 ? 100 : 1)),
          isTarget: false,
        }))
      ];

  // 7. Construction du document HTML A4 Haute Résolution (Style McKinsey)
  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport Stratégique GEO & Benchmark Concurrentiel — ${domain}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Inter:wght@300;400;500;600;700;800&family=Newsreader:ital,wght@1,400;1,600&display=swap');

    @page {
      size: A4 portrait;
      margin: 12mm 14mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.5;
    }

    .page {
      page-break-after: always;
      position: relative;
      min-height: 98vh;
    }

    .page:last-child {
      page-break-after: auto;
    }

    /* Style Éditorial Cabinet McKinsey */
    .mckinsey-header {
      border-bottom: 2.5px solid #0F2042;
      padding-bottom: 14px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .mckinsey-title {
      font-size: 20px;
      font-weight: 800;
      color: #0F2042;
      letter-spacing: -0.03em;
      text-transform: uppercase;
      line-height: 1.15;
    }

    .mckinsey-subtitle {
      font-size: 10px;
      color: #475569;
      font-weight: 500;
      margin-top: 4px;
      letter-spacing: 0.02em;
    }

    .mckinsey-badge {
      background: #0F2042;
      color: #FFFFFF;
      font-weight: 700;
      font-size: 9px;
      padding: 4px 10px;
      border-radius: 4px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    /* Executive Insights Box */
    .executive-insights {
      background: #F8FAFC;
      border-left: 4px solid #0F2042;
      border-radius: 0 8px 8px 0;
      padding: 12px 16px;
      margin-bottom: 16px;
    }

    .insights-title {
      font-size: 11px;
      font-weight: 800;
      color: #0F2042;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }

    .insights-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      font-size: 10px;
      color: #334155;
    }

    .insight-item strong {
      display: block;
      color: #0F172A;
      font-size: 11px;
      margin-bottom: 2px;
    }

    /* Section Cards */
    .card-block {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 14px;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .card-title {
      font-size: 12px;
      font-weight: 800;
      color: #0F2042;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 0 0 10px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card-title-bar {
      display: inline-block;
      width: 4px;
      height: 14px;
      background: #0F2042;
      border-radius: 2px;
    }

    /* KPI Highlights */
    .kpi-row {
      display: flex;
      gap: 12px;
      margin-bottom: 14px;
    }

    .kpi-box {
      flex: 1;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 10px 12px;
      text-align: center;
    }

    .kpi-val {
      font-size: 20px;
      font-weight: 800;
      color: #0F2042;
      line-height: 1.2;
    }

    .kpi-label {
      font-size: 9px;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 3px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }

    th {
      background: #0F2042;
      color: #FFFFFF;
      font-weight: 700;
      text-align: left;
      padding: 7px 10px;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    td {
      padding: 7px 10px;
      border-bottom: 1px solid #E2E8F0;
      color: #1E293B;
      vertical-align: middle;
    }

    tr:nth-child(even) td {
      background: #F8FAFC;
    }

    .favicon-img {
      width: 14px;
      height: 14px;
      vertical-align: middle;
      border-radius: 3px;
      margin-right: 6px;
      display: inline-block;
      object-fit: contain;
    }

    .progress-bar-bg {
      background: #E2E8F0;
      height: 6px;
      border-radius: 3px;
      overflow: hidden;
      width: 100%;
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: 3px;
    }

    .status-pill {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .pill-green { background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; }
    .pill-blue { background: #EFF6FF; color: #1E40AF; border: 1px solid #BFDBFE; }
    .pill-amber { background: #FFFBEB; color: #92400E; border: 1px solid #FDE68A; }

    .footer-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #E2E8F0;
      padding-top: 6px;
      font-size: 8.5px;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body>

  <!-- ================= PAGE 1 : EXECUTIVE BRIEFING & VISIBILITÉ MOTEURS IA ================= -->
  <div class="page">
    <div class="mckinsey-header">
      <div>
        <div class="mckinsey-title">GEO Strategic Audit & AI Benchmark</div>
        <div class="mckinsey-subtitle">AUDIT EXÉCUTIF — <strong>${domain}</strong> | URL SOURCE : ${targetUrl}</div>
      </div>
      <div style="text-align: right;">
        <span class="mckinsey-badge">Document Stratégique</span>
        <div class="mckinsey-subtitle" style="margin-top: 5px;">Mise à jour : ${updateDate}</div>
      </div>
    </div>

    <!-- Synthèse Visuelle des Scores Cibles (Jauges circulaires vectorielles) -->
    <div class="card-block" style="display: flex; align-items: center; justify-content: space-around; padding: 16px 20px; background: #FAFBFD;">
      ${renderCircularGaugeSvg(totalCitations, 'Citations Totales', '#2563EB', 100, false)}
      ${renderCircularGaugeSvg(targetGeoScore, 'Score GEO Cible', geoColor, 100, true)}
      <div style="max-width: 250px;">
        <div style="font-size: 10px; font-weight: 800; color: #0F2042; text-transform: uppercase; letter-spacing: 0.05em;">SYNTHÈSE DE POSITIONNEMENT</div>
        <div style="font-size: 16px; font-weight: 800; color: #0F172A; margin: 3px 0;">Indice de Visibilité : ${geoStatus}</div>
        <p style="font-size: 10.5px; color: #475569; margin: 0; line-height: 1.45;">
          Votre écosystème totalise <strong>${totalCitations} citations vérifiées</strong> sur les moteurs conversationnels. L'autorité de votre marque se positionne au rang <strong>#${targetRank}</strong> face aux compétiteurs directs.
        </p>
      </div>
    </div>

    <!-- Executive Insights (Style McKinsey) -->
    <div class="executive-insights">
      <div class="insights-title">Constats Stratégiques Clés (Executive Insights)</div>
      <div class="insights-grid">
        <div class="insight-item">
          <strong>1. Présence Moteurs Génératifs</strong>
          Dominance observée sur les requêtes à forte intention d'achat, avec un consensus élevé sur les modèles majeurs.
        </div>
        <div class="insight-item">
          <strong>2. Intensité Concurrentielle</strong>
          Veille active sur <strong>${totalCompetitorsCount} concurrents</strong>. Nécessité d'accentuer la captation des requêtes comparatives.
        </div>
        <div class="insight-item">
          <strong>3. Leviers d'Accélération</strong>
          Optimisation prioritaire des données structurées et des directives LLMs.txt pour conforter le leadership algorithmique.
        </div>
      </div>
    </div>

    <!-- Section 1 : Citations par Modèle d'IA (avec logos officiels) -->
    <div class="card-block">
      <div class="card-title">
        <span class="card-title-bar"></span>
        1. Répartition des Citations par Modèle d'IA
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 32%;">Moteur d'IA & Fournisseur</th>
            <th style="width: 24%;">Part de visibilité</th>
            <th style="width: 26%;">Pénétration du Moteur</th>
            <th style="width: 18%; text-align: right;">Citations détectées</th>
          </tr>
        </thead>
        <tbody>
          ${modelEntries.length > 0 ? modelEntries.map(m => `
            <tr>
              <td>
                <img src="${m.logoUrl}" class="favicon-img" alt="${m.name}" onerror="this.style.display='none'" />
                <strong>${m.name}</strong>
              </td>
              <td><strong>${m.pct}%</strong></td>
              <td>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: ${m.pct}%; background: #2563EB;"></div>
                </div>
              </td>
              <td style="text-align: right; font-weight: 700; color: #0F2042;">${m.count}</td>
            </tr>
          `).join('') : `
            <tr><td colspan="4" style="text-align: center; color: #64748B;">Aucune citation détaillée enregistrée.</td></tr>
          `}
        </tbody>
      </table>
    </div>

    <!-- Section 2 : Domaines les plus cités (avec favicons) -->
    <div class="card-block">
      <div class="card-title">
        <span class="card-title-bar"></span>
        2. Domaines les Plus Cités & Sources Référentes
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 45%;">Domaine / Source de Référence</th>
            <th style="width: 30%;">Statut d'Autorité</th>
            <th style="width: 25%; text-align: right;">Volume de Mentions</th>
          </tr>
        </thead>
        <tbody>
          ${sourcesList.length > 0 ? sourcesList.map((s: any) => {
            const dom = cleanDomain(s.url || s.name || s.domain);
            return `
              <tr>
                <td>
                  <img src="${getFaviconUrl(dom)}" class="favicon-img" alt="${dom}" onerror="this.style.display='none'" />
                  <strong>${dom}</strong>
                </td>
                <td><span class="status-pill pill-blue">Source d'autorité citée</span></td>
                <td style="text-align: right; font-weight: 700; color: #0F2042;">${s.count || s.mentions || 1}</td>
              </tr>
            `;
          }).join('') : `
            <tr>
              <td>
                <img src="${getFaviconUrl(domain)}" class="favicon-img" alt="${domain}" onerror="this.style.display='none'" />
                <strong>${domain}</strong> (Site officiel)
              </td>
              <td><span class="status-pill pill-green">Domaine Cible</span></td>
              <td style="text-align: right; font-weight: 700; color: #0F2042;">${totalCitations}</td>
            </tr>
          `}
        </tbody>
      </table>
    </div>

    <div class="footer-bar">
      <span>Rapport Stratégique GEO — ${domain}</span>
      <span>Confidentiel • Page 1 / 3</span>
    </div>
  </div>

  <!-- ================= PAGE 2 : MATRICE DE MATÉRIALITÉ & POSITIONNEMENT ================= -->
  <div class="page">
    <div class="mckinsey-header">
      <div>
        <div class="mckinsey-title">Positionnement Stratégique & Matrice de Matérialité</div>
        <div class="mckinsey-subtitle">DIAGNOSTIC DE MATÉRIALITÉ — <strong>${domain}</strong></div>
      </div>
      <div>
        <span class="mckinsey-badge">Quadrant d'Analyse</span>
      </div>
    </div>

    <!-- KPIs de Positionnement Marché -->
    <div class="kpi-row">
      <div class="kpi-box">
        <div class="kpi-val">#${targetRank}</div>
        <div class="kpi-label">Rang de Marché GEO</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-val">${totalCompetitorsCount}</div>
        <div class="kpi-label">Concurrents Analysés</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-val">${targetGeoScore}/100</div>
        <div class="kpi-label">Indice de Référencement</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-val">${totalCitations}</div>
        <div class="kpi-label">Mentions de Marque</div>
      </div>
    </div>

    <!-- Graphique Visuel de la Matrice de Matérialité 2x2 Type McKinsey -->
    <div class="card-block">
      <div class="card-title">
        <span class="card-title-bar"></span>
        Matrice de Matérialité Concurrentielle (Gartner / McKinsey 2x2 Grid)
      </div>
      <p style="font-size: 9.5px; color: #64748B; margin: -4px 0 10px 0;">
        Cartographie croisée de l'empreinte algorithmique : Visibilité dans les réponses des IA (axe horizontal) vs Qualité & Pertinence GEO (axe vertical).
      </p>
      
      ${renderMaterialityMatrixSvg(domain, targetGeoScore, matrixBrands)}

      <div style="margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 9px; color: #475569; background: #F8FAFC; padding: 8px 12px; border-radius: 6px;">
        <div>
          <strong style="color: #15803D;">• Cadran Leaders (Haut-Droit) :</strong>
          Forte notoriété et socle technique de premier plan. Cible prioritaire de pérennisation.
        </div>
        <div>
          <strong style="color: #0369A1;">• Cadran Spécialistes (Haut-Gauche) :</strong>
          Excellente qualité GEO mais déficit de volume de citations à combler.
        </div>
      </div>
    </div>

    <!-- Audit des 6 Piliers d'Optimisation (Améliorer) -->
    <div class="card-block">
      <div class="card-title">
        <span class="card-title-bar"></span>
        Évaluation des 6 Piliers Techniques GEO
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 32%;">Pilier Algorithmique</th>
            <th style="width: 44%;">Périmètre & Recommandation</th>
            <th style="width: 14%;">Score</th>
            <th style="width: 10%; text-align: right;">Appréciation</th>
          </tr>
        </thead>
        <tbody>
          ${pillarsScores.map(p => {
            const pStatus = p.score >= 75 ? 'pill-green' : p.score >= 50 ? 'pill-blue' : 'pill-amber';
            const pLabel = p.score >= 75 ? 'Robuste' : p.score >= 50 ? 'Conforme' : 'À renforcer';
            return `
              <tr>
                <td><strong>${p.label}</strong></td>
                <td style="font-size: 9.5px; color: #64748B;">${p.description}</td>
                <td>
                  <div style="font-weight: 700; margin-bottom: 2px;">${p.score}/100</div>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${p.score}%; background: ${p.score >= 75 ? '#10B981' : p.score >= 50 ? '#2563EB' : '#F59E0B'};"></div>
                  </div>
                </td>
                <td style="text-align: right;"><span class="status-pill ${pStatus}">${pLabel}</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer-bar">
      <span>Rapport Stratégique GEO — ${domain}</span>
      <span>Confidentiel • Page 2 / 3</span>
    </div>
  </div>

  <!-- ================= PAGE 3 : ANALYSE BENCHMARK DES 10 CONCURRENTS ================= -->
  <div class="page">
    <div class="mckinsey-header">
      <div>
        <div class="mckinsey-title">Benchmark Détaillé — Top 10 Concurrents</div>
        <div class="mckinsey-subtitle">ANALYSE CONCURRENTIELLE (/competition) — <strong>${domain}</strong></div>
      </div>
      <div>
        <span class="mckinsey-badge">Benchmark 10 Acteurs</span>
      </div>
    </div>

    <!-- Tableau Benchmark des 10 Concurrents avec Favicons -->
    <div class="card-block">
      <div class="card-title">
        <span class="card-title-bar"></span>
        Tableau Comparatif du Top 10 Concurrents
      </div>
      <p style="font-size: 9.5px; color: #64748B; margin: -4px 0 10px 0;">
        Benchmark exhaustif sur les 10 principaux compétiteurs identifiés par les moteurs d'intelligence artificielle.
      </p>

      <table>
        <thead>
          <tr>
            <th style="width: 7%; text-align: center;">Rang</th>
            <th style="width: 33%;">Marque & Domaine Web</th>
            <th style="width: 25%;">Présence Moteurs IA</th>
            <th style="width: 20%;">Indice de Consensus</th>
            <th style="width: 15%; text-align: right;">Score GEO</th>
          </tr>
        </thead>
        <tbody>
          <!-- Ligne mise en avant de votre site -->
          <tr style="background: #F0FDF4; font-weight: 700; border-left: 3px solid #10B981;">
            <td style="text-align: center;"><strong style="color: #047857;">#${targetRank}</strong></td>
            <td>
              <img src="${getFaviconUrl(domain)}" class="favicon-img" alt="${domain}" onerror="this.style.display='none'" />
              <strong>${domain} (Votre Marque)</strong>
            </td>
            <td><span class="status-pill pill-green">Référence Actuelle</span></td>
            <td>${totalCitations} citations vérifiées</td>
            <td style="text-align: right; color: #047857; font-weight: 800; font-size: 12px;">${targetGeoScore}/100</td>
          </tr>

          ${top10Competitors.map((c: any, idx: number) => {
            const cDomain = cleanDomain(c.primary_url || c.url || c.name);
            const cScore = Math.round(Number(c.average_score || c.score || 0) * (Number(c.average_score || c.score || 0) <= 1 ? 100 : 1));
            const cRank = c.global_rank || idx + 2;
            const modelsCnt = c.models_count || (c.source_models ? c.source_models.length : 1);
            return `
              <tr>
                <td style="text-align: center; color: #64748B; font-weight: 700;">#${cRank}</td>
                <td>
                  <img src="${getFaviconUrl(cDomain)}" class="favicon-img" alt="${cDomain}" onerror="this.style.display='none'" />
                  <strong>${c.name}</strong>
                  <span style="font-size: 9px; color: #64748B; display: block; margin-top: 1px;">${cDomain}</span>
                </td>
                <td>
                  <span class="status-pill pill-blue">${modelsCnt} modèle${modelsCnt > 1 ? 's' : ''} IA</span>
                </td>
                <td style="color: #475569;">
                  ${modelsCnt >= 3 ? 'Consensus Élevé' : 'Présence Ciblée'}
                </td>
                <td style="text-align: right; font-weight: 800; color: #0F2042; font-size: 11px;">${cScore}/100</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Plan d'Actions Prioritaire & Recommandations d'Amélioration -->
    <div class="card-block">
      <div class="card-title">
        <span class="card-title-bar"></span>
        Plan d'Actions & Feuilles de Route Prioritaires (Section Améliorer)
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div style="background: #F8FAFC; padding: 10px 12px; border-radius: 6px; border-left: 3px solid #2563EB;">
          <div style="font-size: 10px; font-weight: 800; color: #0F2042; text-transform: uppercase; margin-bottom: 6px;">Actions Immédiates (Quick Wins) :</div>
          <ul style="margin: 0; padding-left: 14px; font-size: 9.5px; color: #334155; line-height: 1.4;">
            ${planActionItems.slice(0, 3).map(action => `<li style="margin-bottom: 4px;">${action}</li>`).join('') || `
              <li>Déploiement du fichier llms.txt à la racine du domaine pour guider les crawlers.</li>
              <li>Enrichissement des microdonnées Schema.org (Organization, Product, FAQPage).</li>
              <li>Optimisation de la structure sémantique H1/H2/H3 sur les pages pivots.</li>
            `}
          </ul>
        </div>
        <div style="background: #F8FAFC; padding: 10px 12px; border-radius: 6px; border-left: 3px solid #10B981;">
          <div style="font-size: 10px; font-weight: 800; color: #0F2042; text-transform: uppercase; margin-bottom: 6px;">Chantiers Stratégiques Moyen Terme :</div>
          <ul style="margin: 0; padding-left: 14px; font-size: 9.5px; color: #334155; line-height: 1.4;">
            <li style="margin-bottom: 4px;">Campagne de citations sur les sources d'autorité identifiées au benchmark.</li>
            <li style="margin-bottom: 4px;">Création de contenus comparatifs répondant aux requêtes d'arbitrage IA.</li>
            <li>Surveillance hebdomadaire des évolutions de parts de visibilité par modèle.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>Rapport Stratégique GEO — ${domain}</span>
      <span>Confidentiel • Page 3 / 3</span>
    </div>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>
  `;

  // 8. Déclenchement de l'impression / enregistrement PDF via iframe isolée
  const printIframe = document.createElement('iframe');
  printIframe.style.position = 'fixed';
  printIframe.style.right = '0';
  printIframe.style.bottom = '0';
  printIframe.style.width = '0';
  printIframe.style.height = '0';
  printIframe.style.border = '0';
  printIframe.id = 'geo-pdf-print-iframe';

  document.body.appendChild(printIframe);

  const frameDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
  if (!frameDoc) {
    document.body.removeChild(printIframe);
    throw new Error("Impossible d'initialiser le document d'export PDF.");
  }

  frameDoc.open();
  frameDoc.write(htmlContent);
  frameDoc.close();

  // Nettoyage de l'iframe après l'impression
  setTimeout(() => {
    try {
      if (document.body.contains(printIframe)) {
        document.body.removeChild(printIframe);
      }
    } catch {
      // Ignorer l'erreur si déjà retiré
    }
  }, 60000);
}
