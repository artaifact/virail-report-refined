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

function getCommercialModelName(apiName: string): string {
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
}

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
  let end = endAngle;
  if (end - startAngle >= 360) {
    end = startAngle + 359.99;
  }
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const finish = polarToCartesian(cx, cy, radius, end);
  const largeArcFlag = end - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${finish.x} ${finish.y}`;
}

/**
 * Rendu SVG du Donut des Citations Totales - Exactement comme sur le site
 */
function renderCitationsDonutSvg(
  totalCitations: number,
  models: Array<{ name: string; count: number; color: string }>
): string {
  const cx = 140;
  const cy = 140;
  const r = 95;
  const activeWithCitations = models.filter(m => m.count > 0);
  const hasModels = activeWithCitations.length > 0 && totalCitations > 0;

  let segmentsSvg = '';
  if (hasModels) {
    let currentAngle = -90;
    segmentsSvg = activeWithCitations.map(m => {
      const fraction = m.count / totalCitations;
      const sweep = fraction * 360;
      const start = currentAngle;
      const end = start + sweep;
      currentAngle = end;
      return `<path d="${describeArc(cx, cy, r, start, end)}" fill="none" stroke="${m.color}" stroke-width="32" stroke-linecap="butt" />`;
    }).join('');
  } else if (totalCitations > 0) {
    segmentsSvg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#CBD5E1" stroke-width="32" opacity="0.5" />`;
  }

  return `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <svg viewBox="0 0 280 280" style="width: 140px; height: 140px;">
        <!-- Background circle - même épaisseur 32 et même rayon 95 -->
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#F1F5F9" stroke-width="32" />
        ${segmentsSvg}
        <!-- Center text: même style typographique que le site -->
        <text x="${cx}" y="${cy + 8}" text-anchor="middle" style="font-size: 42px; font-weight: 700; fill: #0F172A; font-family: Inter, sans-serif;">
          ${totalCitations}
        </text>
        <text x="${cx}" y="${cy + 32}" text-anchor="middle" style="font-size: 13px; font-weight: 500; fill: #94A3B8; font-family: Inter, sans-serif;">
          Citations totales
        </text>
      </svg>
    </div>
  `;
}

/**
 * Rendu SVG du Score GEO - Même dimension et même arrondi exact que Citations totales
 */
function renderScoreGeoDonutSvg(targetGeoScore: number): string {
  const cx = 140;
  const cy = 140;
  const r = 95;
  const normalized = Math.max(0, Math.min(100, Math.round(targetGeoScore)));
  const geoStrokeColor = normalized >= 75 ? '#10B981' : normalized >= 50 ? '#6366F1' : '#F59E0B';
  const geoGradStart = normalized >= 75 ? '#34D399' : normalized >= 50 ? '#818CF8' : '#FBBF24';
  const geoCirc = 2 * Math.PI * r;
  const geoDashoffset = geoCirc - (normalized / 100) * geoCirc;

  return `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <svg viewBox="0 0 280 280" style="width: 140px; height: 140px;">
        <defs>
          <linearGradient id="pdfGeoScoreRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${geoGradStart}" />
            <stop offset="100%" stop-color="${geoStrokeColor}" />
          </linearGradient>
        </defs>
        <!-- Background circle - même épaisseur 32 que Citations -->
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#F1F5F9" stroke-width="32" />
        <!-- Progress ring avec dégradé et arrondi exact du site -->
        <circle
          cx="${cx}" cy="${cy}" r="${r}"
          fill="none"
          stroke="url(#pdfGeoScoreRingGradient)"
          stroke-width="32"
          stroke-dasharray="${geoCirc.toFixed(2)}"
          stroke-dashoffset="${geoDashoffset.toFixed(2)}"
          stroke-linecap="round"
          transform="rotate(-90 ${cx} ${cy})"
        />
        <!-- Center text: même style exact que Citations totales -->
        <text x="${cx}" y="${cy + 8}" text-anchor="middle" style="font-size: 42px; font-weight: 700; fill: #0F172A; font-family: Inter, sans-serif;">
          ${normalized}
        </text>
        <text x="${cx}" y="${cy + 32}" text-anchor="middle" style="font-size: 13px; font-weight: 500; fill: #94A3B8; font-family: Inter, sans-serif;">
          Score GEO
        </text>
      </svg>
    </div>
  `;
}

/**
 * Légende des couleurs par modèle (exactement comme sous le graphique du site)
 */
function renderModelLegendHtml(models: Array<{ name: string; count: number; color: string; pct: number }>): string {
  const activeWithCitations = models.filter(m => m.count > 0);
  if (activeWithCitations.length === 0) return '';

  return `
    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 12px; margin-top: 8px; width: 100%;">
      ${activeWithCitations.map(m => `
        <div style="display: inline-flex; align-items: center; gap: 4px; font-size: 9px;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: ${m.color}; display: inline-block; flex-shrink: 0;"></span>
          <span style="font-weight: 600; color: #334155;">${m.name}</span>
          <span style="color: #94A3B8; font-weight: 400;">${m.count} (${m.pct}%)</span>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Alerte de statut de visibilité (exactement comme le banner sur le site)
 */
function renderCitationsStatusBannerHtml(totalCitations: number): string {
  if (totalCitations >= 5) {
    return `
      <div style="background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 8px; padding: 7px 10px; margin-top: 8px;">
        <div style="font-size: 10px; font-weight: 700; color: #166534; margin-bottom: 2px;">
          ✓ Excellent ! Vous êtes bien cité
        </div>
        <div style="font-size: 9px; color: #14532D; line-height: 1.35;">
          Votre site est cité <strong>${totalCitations} fois</strong> dans les moteurs génératifs. Félicitations ! Vous disposez d'une solide visibilité.
        </div>
      </div>
    `;
  } else if (totalCitations >= 2) {
    return `
      <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 8px; padding: 7px 10px; margin-top: 8px;">
        <div style="font-size: 10px; font-weight: 700; color: #9A3412; margin-bottom: 2px;">
          ⚠ Visibilité à améliorer
        </div>
        <div style="font-size: 9px; color: #7C2D12; line-height: 1.35;">
          Votre site est cité <strong>${totalCitations} fois</strong> dans les moteurs génératifs. C'est un début mais votre visibilité reste limitée.
        </div>
      </div>
    `;
  } else if (totalCitations === 1) {
    return `
      <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 8px; padding: 7px 10px; margin-top: 8px;">
        <div style="font-size: 10px; font-weight: 700; color: #9A3412; margin-bottom: 2px;">
          ⚠ Visibilité très faible
        </div>
        <div style="font-size: 9px; color: #7C2D12; line-height: 1.35;">
          Votre site n'est cité qu'<strong>1 seule fois</strong> dans les moteurs génératifs.
        </div>
      </div>
    `;
  } else {
    return `
      <div style="background: #FEE2E2; border: 1px solid #FCA5A5; border-radius: 8px; padding: 7px 10px; margin-top: 8px;">
        <div style="font-size: 10px; font-weight: 700; color: #991B1B; margin-bottom: 2px;">
          ⚠ Aucune citation détectée
        </div>
        <div style="font-size: 9px; color: #7F1D1D; line-height: 1.35;">
          Votre site n'est absolument pas cité dans les réponses des IA. Agissez en priorité sur les recommandations GEO.
        </div>
      </div>
    `;
  }
}

/**
 * Structure d'un point dans la matrice de positionnement
 */
interface MatricePoint {
  name: string;
  url: string;
  favicon_url: string;
  visibility: number; // 0 à 100
  sentiment: number;  // 0.0 à 1.0
  totalScore: number; // 0 à 100
  mentions: number;
  isTarget: boolean;
  audited: boolean;
  pillars?: Record<string, { score: number; max: number }>;
  gaps?: string[];
}

function normalizeBrandLabel(value: string | null | undefined): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toCanonicalUrl(value: string | null | undefined): string {
  const raw = (value || '').trim().toLowerCase();
  if (!raw) return '';
  const withProtocol = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withProtocol);
    const host = parsed.hostname.replace(/^www\./, '');
    const path = parsed.pathname.replace(/\/+$/, '');
    return `${host}${path}`;
  } catch {
    return raw
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/[?#].*$/, '')
      .replace(/\/+$/, '');
  }
}

function compareMaterialityEntries(a: any, b: any): number {
  if (!!a?.is_target !== !!b?.is_target) return a?.is_target ? 1 : -1;
  if (!!a?.audited !== !!b?.audited) return a?.audited ? 1 : -1;
  const scoreA = typeof a?.total_score === 'number' ? a.total_score : -1;
  const scoreB = typeof b?.total_score === 'number' ? b.total_score : -1;
  if (scoreA !== scoreB) return scoreA > scoreB ? 1 : -1;
  const visibilityA = typeof a?.visibility === 'number' ? a.visibility : -1;
  const visibilityB = typeof b?.visibility === 'number' ? b.visibility : -1;
  return visibilityA > visibilityB ? 1 : -1;
}

function getQuadrantInfo(point: { visibility: number; sentiment: number }) {
  const visibilityMid = 50;
  const sentimentMid = 0.5;
  return point.visibility >= visibilityMid
    ? (point.sentiment >= sentimentMid
      ? { label: 'Leader', desc: 'Très bien positionné. Forte visibilité et perception positive par les IA.', color: '#16A34A' }
      : { label: 'Controversial', desc: 'Visible mais mal perçu. Les IA le mentionnent souvent mais avec un sentiment négatif.', color: '#D97706' })
    : (point.sentiment >= sentimentMid
      ? { label: 'Niche Player', desc: 'Bien perçu mais peu visible. Les IA en parlent positivement mais rarement.', color: '#6366F1' }
      : { label: 'Lagger', desc: 'En retard. Faible visibilité et perception négative par les IA.', color: '#DC2626' });
}

/**
 * Extrait et équilibre les points de la Matrice de Positionnement fidèlement à Competition.tsx
 */
function extractMatricePoints(
  reportData: FullReportData | null,
  compData: CompetitorAnalysisResponse | null | undefined,
  domain: string,
  targetUrl: string,
  targetGeoScore: number
): MatricePoint[] {
  const materialityMatrix =
    (reportData as any)?.materiality_matrix ||
    (reportData as any)?.report?.materiality_matrix ||
    (reportData as any)?.llmo_report?.materiality_matrix ||
    (compData as any)?.materiality_matrix;

  const useMateriality = !!(materialityMatrix && Array.isArray(materialityMatrix.brands) && materialityMatrix.brands.length > 0);
  const dataPoints: MatricePoint[] = [];
  const visibilityMid = 50;
  const sentimentMid = 0.5;

  if (useMateriality) {
    const dedupedByUrl = new Map<string, any>();
    const dedupedByName = new Map<string, any>();

    (materialityMatrix.brands as any[]).forEach((b: any) => {
      const canonicalUrl = toCanonicalUrl(b.url);
      const normalizedName = normalizeBrandLabel(b.name);

      const urlKey = canonicalUrl || '';
      if (urlKey) {
        const existing = dedupedByUrl.get(urlKey);
        if (!existing || compareMaterialityEntries(b, existing) > 0) {
          dedupedByUrl.set(urlKey, b);
        }
        return;
      }

      if (normalizedName) {
        const existing = dedupedByName.get(normalizedName);
        if (!existing || compareMaterialityEntries(b, existing) > 0) {
          dedupedByName.set(normalizedName, b);
        }
      }
    });

    const dedupedBrands = [
      ...dedupedByUrl.values(),
      ...dedupedByName.values(),
    ];

    dedupedBrands.forEach((b: any) => {
      const bDomain = cleanDomain(b.url || b.name);
      let rawVis = typeof b.visibility === 'number' ? b.visibility : 50;
      let rawSent = typeof b.sentiment === 'number' ? b.sentiment : 0.5;
      if (rawSent > 1) rawSent = rawSent / 100;
      const vis = Math.max(0, Math.min(100, rawVis));
      const sent = Math.max(0, Math.min(1, rawSent));
      const isTarget = !!b.is_target || bDomain === domain;

      dataPoints.push({
        name: b.name || bDomain,
        url: b.url || '',
        favicon_url: b.favicon_url || getFaviconUrl(b.url || b.name),
        visibility: vis,
        sentiment: sent,
        totalScore: typeof b.total_score === 'number' ? b.total_score : 0,
        mentions: b.mentions || 0,
        isTarget,
        audited: !!b.audited || isTarget,
        pillars: b.pillars,
        gaps: b.gaps,
      });
    });
  } else {
    // Fallback : concurrents de compData + benchmark_results
    const competitors = (compData as any)?.competitors || [];
    const benchmarkRaw = (compData as any)?.benchmark_results?.raw_data;
    const analysisUrl = compData?.url || targetUrl || '';

    if (competitors.length > 0) {
      const competitorsByUrl = new Map<string, any>();
      for (const c of competitors) {
        const url = c.url || '';
        const existing = competitorsByUrl.get(url);
        if (!existing || (c.mentions || 0) > (existing.mentions || 0)) {
          competitorsByUrl.set(url, c);
        }
      }

      for (const [url, comp] of competitorsByUrl) {
        const benchEntry = benchmarkRaw?.[url];
        const hasScore = benchEntry && typeof benchEntry.total_score === 'number';
        const totalScore = hasScore ? benchEntry.total_score : 0;
        let rawVis = benchEntry?.visibility ?? (comp.visibility ?? totalScore);
        let rawSent = benchEntry?.sentiment ?? (comp.sentiment ?? comp.average_score ?? 0.5);
        if (rawSent > 1) rawSent = rawSent / 100;

        dataPoints.push({
          name: comp.name || cleanDomain(url),
          url,
          favicon_url: comp.favicon_url || getFaviconUrl(url || comp.name),
          visibility: Math.max(0, Math.min(100, rawVis)),
          sentiment: Math.max(0, Math.min(1, rawSent)),
          totalScore,
          mentions: comp.mentions || 0,
          isTarget: false,
          audited: false,
        });
      }
    } else if (compData?.consolidated_competitors && compData.consolidated_competitors.length > 0) {
      for (const c of compData.consolidated_competitors) {
        const url = c.primary_url || '';
        let rawVis = Math.max(20, Math.min(95, Math.round(((c.models_count || 1) / 5) * 100)));
        let rawSent = Number(c.average_score || 0.6);
        if (rawSent > 1) rawSent = rawSent / 100;

        dataPoints.push({
          name: c.name || cleanDomain(url),
          url,
          favicon_url: c.favicon_url || getFaviconUrl(url || c.name),
          visibility: Math.max(0, Math.min(100, rawVis)),
          sentiment: Math.max(0, Math.min(1, rawSent)),
          totalScore: Math.round(rawSent * 100),
          mentions: c.mentions || 0,
          isTarget: false,
          audited: false,
        });
      }
    }

    // Site cible
    if (analysisUrl) {
      const targetEntry = benchmarkRaw?.[analysisUrl];
      let rawVis = targetEntry?.visibility ?? 75;
      let rawSent = targetEntry?.sentiment ?? (targetGeoScore / 100 || 0.7);
      if (rawSent > 1) rawSent = rawSent / 100;

      dataPoints.push({
        name: domain,
        url: analysisUrl,
        favicon_url: getFaviconUrl(analysisUrl),
        visibility: Math.max(0, Math.min(100, rawVis)),
        sentiment: Math.max(0, Math.min(1, rawSent)),
        totalScore: targetGeoScore,
        mentions: 0,
        isTarget: true,
        audited: true,
      });
    }
  }

  // S'assurer que le site cible est présent et identifié
  let targetPoint = dataPoints.find(d => d.isTarget);
  if (!targetPoint) {
    targetPoint = dataPoints.find(d => cleanDomain(d.url || d.name) === domain);
    if (targetPoint) {
      targetPoint.isTarget = true;
      targetPoint.audited = true;
    } else {
      targetPoint = {
        name: domain,
        url: targetUrl || `https://${domain}`,
        favicon_url: getFaviconUrl(targetUrl || domain),
        visibility: 75,
        sentiment: Math.max(0.2, Math.min(0.95, targetGeoScore / 100 || 0.75)),
        totalScore: targetGeoScore,
        mentions: 0,
        isTarget: true,
        audited: true,
      };
      dataPoints.unshift(targetPoint);
    }
  }

  // Équilibrage sur 12 concurrents max comme sur Competition.tsx
  const MAX_DISPLAY = 12;
  if (dataPoints.length <= MAX_DISPLAY) {
    return dataPoints;
  }

  const quadrantOrder = ['Leader', 'Controversial', 'Niche Player', 'Lagger'] as const;
  const targets = dataPoints.filter((d) => d.isTarget).sort((a, b) => b.totalScore - a.totalScore);
  const selected: MatricePoint[] = [];
  const selectedKeys = new Set<string>();
  const pointKey = (point: MatricePoint) => `${toCanonicalUrl(point.url)}|${normalizeBrandLabel(point.name)}`;
  const pushIfNew = (point: MatricePoint) => {
    const key = pointKey(point);
    if (selectedKeys.has(key) || selected.length >= MAX_DISPLAY) return false;
    selected.push(point);
    selectedKeys.add(key);
    return true;
  };

  // Garder au moins le site cible
  if (targets.length > 0) {
    pushIfNew(targets[0]);
  }

  const remaining = dataPoints.filter((d) => !d.isTarget);
  const buckets: Record<(typeof quadrantOrder)[number], MatricePoint[]> = {
    Leader: [],
    Controversial: [],
    'Niche Player': [],
    Lagger: [],
  };

  remaining.forEach((point) => {
    const label = getQuadrantInfo(point).label as (typeof quadrantOrder)[number];
    buckets[label].push(point);
  });

  const quadrantCenters: Record<(typeof quadrantOrder)[number], { x: number; y: number }> = {
    Leader: { x: (visibilityMid + 100) / 2, y: (sentimentMid + 1) / 2 },
    Controversial: { x: (visibilityMid + 100) / 2, y: sentimentMid / 2 },
    'Niche Player': { x: visibilityMid / 2, y: (sentimentMid + 1) / 2 },
    Lagger: { x: visibilityMid / 2, y: sentimentMid / 2 },
  };

  const representativeness = (point: MatricePoint, quadrant: (typeof quadrantOrder)[number]) => {
    const center = quadrantCenters[quadrant];
    const dx = (point.visibility - center.x) / 100;
    const dy = point.sentiment - center.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  quadrantOrder.forEach((quadrant) => {
    buckets[quadrant].sort((a, b) => {
      const aDist = representativeness(a, quadrant);
      const bDist = representativeness(b, quadrant);
      if (aDist !== bDist) return aDist - bDist;
      return b.totalScore - a.totalScore;
    });
  });

  const slots = MAX_DISPLAY - selected.length;
  const baseQuota = Math.max(1, Math.floor(slots / quadrantOrder.length));
  let remainingSlots = slots;
  const perQuadrantUsed: Record<(typeof quadrantOrder)[number], number> = {
    Leader: 0,
    Controversial: 0,
    'Niche Player': 0,
    Lagger: 0,
  };

  // 1er passage
  quadrantOrder.forEach((quadrant) => {
    while (
      remainingSlots > 0 &&
      perQuadrantUsed[quadrant] < baseQuota &&
      buckets[quadrant].length > 0
    ) {
      const candidate = buckets[quadrant].shift()!;
      if (pushIfNew(candidate)) {
        perQuadrantUsed[quadrant] += 1;
        remainingSlots -= 1;
      }
    }
  });

  // 2e passage
  while (remainingSlots > 0) {
    let picked = false;
    quadrantOrder.forEach((quadrant) => {
      if (remainingSlots <= 0 || buckets[quadrant].length === 0) return;
      const candidate = buckets[quadrant].shift()!;
      if (pushIfNew(candidate)) {
        perQuadrantUsed[quadrant] += 1;
        remainingSlots -= 1;
        picked = true;
      }
    });
    if (!picked) break;
  }

  // 3e passage sécurité
  if (selected.length < MAX_DISPLAY) {
    remaining.forEach((point) => {
      if (selected.length < MAX_DISPLAY) pushIfNew(point);
    });
  }

  return selected;
}

/**
 * Barre de légende des marques avec Favicons (identique à Competition.tsx)
 */
function renderBrandsLegendHtml(points: MatricePoint[]): string {
  const items = points.map(d => {
    const isTarget = d.isTarget;
    return `
      <div style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 5px; background: ${isTarget ? '#EEF2FF' : '#F8FAFC'}; border: 1px solid ${isTarget ? '#C7D2FE' : '#E2E8F0'}; margin: 2px 3px;">
        <img src="${d.favicon_url}" alt="${d.name}" style="width: 13px; height: 13px; border-radius: 2px;" onerror="this.style.display='none'" />
        <span style="font-size: 9px; color: ${isTarget ? '#4F46E5' : '#475569'}; font-weight: ${isTarget ? 700 : 500};">
          ${d.name}${isTarget ? ' (Vous)' : ''}
        </span>
        ${d.audited ? '<span style="font-size: 8px; color: #16A34A; font-weight: 700;" title="Audité">✓</span>' : ''}
      </div>
    `;
  }).join('');

  return `
    <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; align-items: center; justify-content: center;">
      <span style="font-size: 9.5px; color: #64748B; font-weight: 700; margin-right: 4px;">Marques :</span>
      ${items}
    </div>
  `;
}

/**
 * Construit le SVG de la Matrice de Positionnement Concurrentiel (Fidèle à Competition.tsx)
 * Axe X = Visibilité (%) [0-100%]
 * Axe Y = Sentiment [0.0-1.0]
 * Quadrants : Niche Players, Leaders, Laggers, Controversial
 */
function renderPositioningMatrixSvg(
  points: MatricePoint[]
): string {
  const w = 760;
  const h = 420;
  const padL = 50;
  const padR = 30;
  const padT = 30;
  const padB = 45;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const midX = padL + plotW / 2;
  const midY = padT + plotH / 2;

  // Calcul coordonnées (X: Visibilité 0-100, Y: Sentiment 0.0-1.0)
  const getX = (vis: number) => padL + (Math.max(0, Math.min(100, vis)) / 100) * plotW;
  const getY = (sent: number) => padT + plotH - Math.max(0, Math.min(1, sent)) * plotH;

  // Rendu des lignes de grille X (0% à 100% tous les 10%)
  const xGridLines = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(v => {
    const x = getX(v);
    const isMid = v === 50;
    return `
      <line x1="${x}" y1="${padT}" x2="${x}" y2="${padT + plotH}" stroke="${isMid ? '#CBD5E1' : '#E5E7EB'}" stroke-width="${isMid ? 1.5 : 0.5}" stroke-dasharray="${isMid ? '0' : '3 3'}" />
      <text x="${x}" y="${padT + plotH + 15}" text-anchor="middle" font-size="8.5" fill="#94A3B8" font-family="Inter, sans-serif">${v}%</text>
    `;
  }).join('');

  // Rendu des lignes de grille Y (0.0 à 1.0 tous les 0.1)
  const yGridLines = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map(s => {
    const y = getY(s);
    const isMid = Math.abs(s - 0.5) < 0.01;
    return `
      <line x1="${padL}" y1="${y}" x2="${padL + plotW}" y2="${y}" stroke="${isMid ? '#CBD5E1' : '#E5E7EB'}" stroke-width="${isMid ? 1.5 : 0.5}" stroke-dasharray="${isMid ? '0' : '3 3'}" />
      <text x="${padL - 10}" y="${y + 3}" text-anchor="end" font-size="8.5" fill="#94A3B8" font-family="Inter, sans-serif">${s.toFixed(1)}</text>
    `;
  }).join('');

  // Rendu des points avec favicons
  const sortedPoints = [...points].sort((a, b) => (a.isTarget ? 1 : 0) - (b.isTarget ? 1 : 0));
  const pointsSvg = sortedPoints.map((b, idx) => {
    const cx = getX(b.visibility);
    const cy = getY(b.sentiment);
    const isMe = b.isTarget;
    const favicon = b.favicon_url;

    if (isMe) {
      const labelText = `★ ${b.name} (Vous)`;
      const labelWidth = Math.max(75, labelText.length * 6.5 + 14);
      const isRightSide = cx > padL + plotW * 0.55;
      const pillX = isRightSide
        ? Math.max(padL + 6, cx - labelWidth - 18)
        : Math.min(padL + plotW - labelWidth - 6, cx + 18);
      const pillY = Math.max(padT + 6, Math.min(padT + plotH - 24, cy - 12));

      return `
        <g key="target-point">
          <!-- Halo & Aura -->
          <circle cx="${cx}" cy="${cy}" r="22" fill="#4F46E5" opacity="0.18" />
          <!-- Disque blanc de support -->
          <circle cx="${cx}" cy="${cy}" r="16" fill="#FFFFFF" stroke="#4F46E5" stroke-width="2.5" />
          <!-- Favicon officiel -->
          <image href="${favicon}" xlink:href="${favicon}" x="${cx - 10}" y="${cy - 10}" width="20" height="20" preserveAspectRatio="xMidYMid meet" />
          <!-- Badge Nom Cible -->
          <rect x="${pillX}" y="${pillY}" width="${labelWidth}" height="22" rx="5" fill="#4F46E5" />
          <text x="${pillX + labelWidth / 2}" y="${pillY + 15}" text-anchor="middle" fill="#FFFFFF" font-size="9.5" font-weight="700" font-family="Inter, sans-serif">
            ${labelText}
          </text>
        </g>
      `;
    }

    const labelText = `${b.name}${b.audited ? ' ✓' : ''}`;
    const labelWidth = Math.max(52, labelText.length * 5.8 + 12);
    const isRightSide = cx > padL + plotW * 0.52;
    const pillX = isRightSide
      ? Math.max(padL + 6, cx - labelWidth - 16)
      : Math.min(padL + plotW - labelWidth - 6, cx + 16);
    const yOffset = (idx % 2 === 0) ? -9 : (cy < padT + 45 ? 14 : -24);
    const pillY = Math.max(padT + 6, Math.min(padT + plotH - 20, cy + yOffset));

    return `
      <g key="competitor-point-${idx}">
        <!-- Halo léger -->
        <circle cx="${cx}" cy="${cy}" r="14" fill="#0F172A" opacity="0.05" />
        <!-- Disque blanc de support -->
        <circle cx="${cx}" cy="${cy}" r="12" fill="#FFFFFF" stroke="${b.audited ? '#16A34A' : '#94A3B8'}" stroke-width="${b.audited ? 2 : 1.5}" ${b.audited ? '' : 'stroke-dasharray="3 2"'} />
        <!-- Favicon officiel du concurrent -->
        <image href="${favicon}" xlink:href="${favicon}" x="${cx - 8}" y="${cy - 8}" width="16" height="16" preserveAspectRatio="xMidYMid meet" />
        <!-- Badge Nom du concurrent -->
        <rect x="${pillX}" y="${pillY}" width="${labelWidth}" height="18" rx="4" fill="#FFFFFF" stroke="${b.audited ? '#86EFAC' : '#CBD5E1'}" stroke-width="1" />
        <text x="${pillX + labelWidth / 2}" y="${pillY + 13}" text-anchor="middle" fill="#1E293B" font-size="8.5" font-weight="600" font-family="Inter, sans-serif">
          ${labelText}
        </text>
      </g>
    `;
  }).join('');

  return `
    <svg viewBox="0 0 ${w} ${h}" style="width: 100%; height: auto; max-height: 350px; background: #FFFFFF; border-radius: 8px;">
      <!-- Fond du graphique -->
      <rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" fill="#FAFBFC" />

      <!-- Zones de cadrans subtiles -->
      <!-- Top Left : Niche Players -->
      <rect x="${padL}" y="${padT}" width="${plotW / 2}" height="${plotH / 2}" fill="#F8FAFC" opacity="0.5" />
      <!-- Top Right : Leaders -->
      <rect x="${midX}" y="${padT}" width="${plotW / 2}" height="${plotH / 2}" fill="#F0FDF4" opacity="0.5" />
      <!-- Bottom Left : Laggers -->
      <rect x="${padL}" y="${midY}" width="${plotW / 2}" height="${plotH / 2}" fill="#FEF2F2" opacity="0.4" />
      <!-- Bottom Right : Controversial -->
      <rect x="${midX}" y="${midY}" width="${plotW / 2}" height="${plotH / 2}" fill="#FFFBEB" opacity="0.4" />

      <!-- Grille -->
      ${xGridLines}
      ${yGridLines}

      <!-- Titres des Quadrants (exactement identiques à Competition.tsx) -->
      <text x="${padL + plotW * 0.25}" y="${padT + 22}" text-anchor="middle" font-size="13" fill="#6B7280" font-weight="700" font-family="Inter, sans-serif">Niche Players</text>
      <text x="${padL + plotW * 0.75}" y="${padT + 22}" text-anchor="middle" font-size="13" fill="#16A34A" font-weight="700" font-family="Inter, sans-serif">Leaders</text>
      <text x="${padL + plotW * 0.25}" y="${padT + plotH - 12}" text-anchor="middle" font-size="13" fill="#DC2626" font-weight="700" font-family="Inter, sans-serif">Laggers</text>
      <text x="${padL + plotW * 0.75}" y="${padT + plotH - 12}" text-anchor="middle" font-size="13" fill="#D97706" font-weight="700" font-family="Inter, sans-serif">Controversial</text>

      <!-- Contour du graphe -->
      <rect x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" fill="none" stroke="#CBD5E1" stroke-width="1" rx="4" />

      <!-- Labels des axes -->
      <text x="${padL + plotW / 2}" y="${h - 10}" text-anchor="middle" fill="#64748B" font-size="10" font-weight="600" font-family="Inter, sans-serif">
        Visibility (%) →
      </text>
      <text x="16" y="${padT + plotH / 2}" text-anchor="middle" fill="#64748B" font-size="10" font-weight="600" font-family="Inter, sans-serif" transform="rotate(-90 16 ${padT + plotH / 2})">
        ← Sentiment →
      </text>

      <!-- Points des marques avec favicons et badges -->
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

  // 3. Citations par modèle d'IA (regroupées par nom commercial & couleurs officielles du site)
  const citationsByModel = (reportData?.analyse_citation?.citations_by_model || {}) as Record<string, number>;
  const groupedModelMap: Record<string, number> = {};
  Object.entries(citationsByModel).forEach(([raw, count]) => {
    const commercial = getCommercialModelName(raw);
    groupedModelMap[commercial] = (groupedModelMap[commercial] || 0) + (Number(count) || 0);
  });

  let fallbackColorIdx = 0;
  const modelEntries = Object.entries(groupedModelMap)
    .map(([model, count]) => ({
      name: model,
      count: Number(count) || 0,
      pct: totalCitations > 0 ? Math.round(((Number(count) || 0) / totalCitations) * 100) : 0,
      color: MODEL_COLORS[model] || MODEL_COLORS_FALLBACK[fallbackColorIdx++ % MODEL_COLORS_FALLBACK.length],
      logoUrl: getModelFavicon(model),
    }))
    .sort((a, b) => b.count - a.count);

  // 4. Domaines et sources les plus cités (avec favicons)
  const frequentlyMentioned = reportData?.analyse_citation?.competitors_frequently_mentioned || [];
  const sourcesList = Array.isArray(frequentlyMentioned) ? frequentlyMentioned.slice(0, 10) : [];

  // 5. Plan d'actions prioritaires GEO
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
  let top10Competitors = rawCompetitors.slice(0, 10);
  let targetRank = compData?.your_position?.rank || 1;

  // Données pour la Matrice de Positionnement Concurrentiel (Extraction fidèle à Competition.tsx)
  const matricePoints = extractMatricePoints(reportData, compData, domain, targetUrl, targetGeoScore);

  // Si consolidated_competitors est vide, alimenter avec les marques concurrentes de la matrice
  if (top10Competitors.length === 0 && matricePoints.length > 1) {
    top10Competitors = matricePoints
      .filter(m => !m.isTarget)
      .slice(0, 10)
      .map((m, i) => ({
        name: m.name,
        primary_url: m.url,
        url: m.url,
        favicon_url: m.favicon_url,
        average_score: m.visibility / 100,
        total_score: m.totalScore,
        score: m.totalScore,
        models_count: 4,
        global_rank: i + 2,
      }));
  }

  // Synchronisation du rang cible avec la matrice si disponible
  const materialityBrands = (reportData as any)?.materiality_matrix?.brands;
  if (materialityBrands && Array.isArray(materialityBrands) && materialityBrands.length > 0) {
    const sortedMat = [...materialityBrands].sort((a: any, b: any) => (b.total_score || 0) - (a.total_score || 0));
    const rankIdx = sortedMat.findIndex((b: any) => b.is_target || cleanDomain(b.url || b.name) === domain);
    if (rankIdx !== -1) {
      targetRank = rankIdx + 1;
    }
  }

  // Score Benchmark pour le site cible
  const targetMatPoint = matricePoints.find(m => m.isTarget);
  const targetBenchmarkScore = targetMatPoint?.totalScore && targetMatPoint.totalScore > 0
    ? targetMatPoint.totalScore
    : targetGeoScore;

  const totalCompetitorsCount = Math.max(
    top10Competitors.length,
    matricePoints.length,
    compData?.global_stats?.total_competitors_found || 10
  );

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

    <!-- Synthèse Visuelle des Scores Cibles (Exactement comme sur le site) -->
    <div class="card-block" style="padding: 12px 16px; background: #FAFBFD;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 18px;">
        <!-- Double graphique côte à côte + légende des modèles (même dimension, même arrondi) -->
        <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 24px; width: 100%;">
            ${renderCitationsDonutSvg(totalCitations, modelEntries)}
            ${renderScoreGeoDonutSvg(targetGeoScore)}
          </div>
          ${renderModelLegendHtml(modelEntries)}
        </div>

        <!-- Synthèse de positionnement & Alerte de visibilité conforme au site -->
        <div style="max-width: 260px; border-left: 1.5px solid #E2E8F0; padding-left: 16px; flex-shrink: 0;">
          <div style="font-size: 9px; font-weight: 800; color: #0F2042; text-transform: uppercase; letter-spacing: 0.05em;">SYNTHÈSE DE POSITIONNEMENT</div>
          <div style="font-size: 15px; font-weight: 800; color: #0F172A; margin: 2px 0;">Indice de Visibilité : ${geoStatus}</div>
          <p style="font-size: 9.5px; color: #475569; margin: 0 0 4px 0; line-height: 1.4;">
            Votre écosystème totalise <strong>${totalCitations} citations vérifiées</strong> sur les moteurs conversationnels. L'autorité de votre marque se positionne au rang <strong>${targetRank}</strong> face aux compétiteurs directs.
          </p>
          ${renderCitationsStatusBannerHtml(totalCitations)}
        </div>
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

    <!-- Section 1 : Citations par Modèle d'IA (avec logos officiels & couleurs du site) -->
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
                  <div class="progress-bar-fill" style="width: ${m.pct}%; background: ${m.color};"></div>
                </div>
              </td>
              <td style="text-align: right; font-weight: 700;">
                ${m.count === 0 ? `
                  <span style="color: #F59E0B; font-size: 10px; font-style: italic;">Non cité</span>
                ` : m.count >= 5 ? `
                  <span style="color: #10B981;">${m.count}</span>
                ` : m.count === 1 ? `
                  <span style="color: #F97316;">${m.count}</span>
                ` : `
                  <span style="color: #0F2042;">${m.count}</span>
                `}
              </td>
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

  <!-- ================= PAGE 2 : POSITIONNEMENT & MATRICE CONCURRENTIELLE ================= -->
  <div class="page">
    <div class="mckinsey-header">
      <div>
        <div class="mckinsey-title">Positionnement Stratégique & Concurrentiel</div>
        <div class="mckinsey-subtitle">ANALYSE DE POSITIONNEMENT — <strong>${domain}</strong></div>
      </div>
      <div>
        <span class="mckinsey-badge">Quadrant d'Analyse</span>
      </div>
    </div>

    <!-- KPIs de Positionnement Marché -->
    <div class="kpi-row">
      <div class="kpi-box">
        <div class="kpi-val">${targetRank}</div>
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

    <!-- Graphique Visuel de la Matrice de Positionnement Concurrentiel (avec Favicons) -->
    <div class="card-block" style="padding: 12px 16px; margin-bottom: 12px;">
      <div class="card-title">
        <span class="card-title-bar"></span>
        Matrice de Positionnement Concurrentiel
      </div>
      <p style="font-size: 9.5px; color: #64748B; margin: -4px 0 10px 0;">
        Cartographie de l'empreinte algorithmique : Visibilité dans les réponses des IA (axe horizontal) vs Sentiment & Perception de marque (axe vertical). Chaque acteur est identifié par son favicon officiel.
      </p>

      ${renderBrandsLegendHtml(matricePoints)}
      
      ${renderPositioningMatrixSvg(matricePoints)}

      <!-- Grille d'interprétation des 4 quadrants stratégiques (Fidèle à Competition.tsx) -->
      <div style="margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 8.5px; color: #475569; background: #F8FAFC; padding: 8px 12px; border-radius: 6px; border: 1px solid #E2E8F0;">
        <div>
          <strong style="color: #16A34A;">• Leaders (Haut-Droit) :</strong>
          Très bien positionné. Forte visibilité et perception positive par les IA.
        </div>
        <div>
          <strong style="color: #6366F1;">• Niche Players (Haut-Gauche) :</strong>
          Bien perçu mais peu visible. Les IA en parlent positivement mais rarement.
        </div>
        <div>
          <strong style="color: #DC2626;">• Laggers (Bas-Gauche) :</strong>
          En retard. Faible visibilité et perception négative par les IA.
        </div>
        <div>
          <strong style="color: #D97706;">• Controversial (Bas-Droit) :</strong>
          Visible mais mal perçu. Les IA le mentionnent souvent mais avec un sentiment négatif.
        </div>
      </div>
    </div>

    <!-- Synthèse Stratégique du Positionnement Marché -->
    <div class="card-block">
      <div class="card-title">
        <span class="card-title-bar"></span>
        Diagnostic Stratégique de Positionnement Face aux Concurrents
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; font-size: 9.5px; color: #334155; line-height: 1.45;">
        <div style="background: #F8FAFC; padding: 10px 12px; border-radius: 6px; border-left: 3px solid #4F46E5;">
          <strong style="color: #0F172A; display: block; margin-bottom: 3px; font-size: 10px;">Empreinte de Marque</strong>
          <strong>${domain}</strong> se positionne au rang <strong>${targetRank}</strong> parmi les <strong>${totalCompetitorsCount} acteurs</strong> répertoriés, avec un volume vérifié de ${totalCitations} citations IA.
        </div>
        <div style="background: #F8FAFC; padding: 10px 12px; border-radius: 6px; border-left: 3px solid #10B981;">
          <strong style="color: #0F172A; display: block; margin-bottom: 3px; font-size: 10px;">Indice GEO Global</strong>
          Score de <strong>${targetGeoScore}/100</strong>, attestant d'une intégration avancée sur les moteurs conversationnels face aux leaders du marché.
        </div>
        <div style="background: #F8FAFC; padding: 10px 12px; border-radius: 6px; border-left: 3px solid #0EA5E9;">
          <strong style="color: #0F172A; display: block; margin-bottom: 3px; font-size: 10px;">Leviers Concurrentiels</strong>
          La consolidation des sources citées et le renforcement des données structurées permettront de pérenniser votre avantage face aux suiveurs.
        </div>
      </div>
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
        <div class="mckinsey-title">Analyse Benchmark — Top 10 Concurrents</div>
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
            <th style="width: 6%; text-align: center;">Rang</th>
            <th style="width: 32%;">Marque & Domaine Web</th>
            <th style="width: 20%;">Présence Moteurs IA</th>
            <th style="width: 18%;">Indice de Consensus</th>
            <th style="width: 12%; text-align: right;">Score GEO</th>
            <th style="width: 12%; text-align: right;">Score Benchmark</th>
          </tr>
        </thead>
        <tbody>
          <!-- Ligne mise en avant de votre site -->
          <tr style="background: #F0FDF4; font-weight: 700; border-left: 3px solid #10B981;">
            <td style="text-align: center;"><strong style="color: #047857;">${targetRank}</strong></td>
            <td>
              <img src="${getFaviconUrl(domain)}" class="favicon-img" alt="${domain}" onerror="this.style.display='none'" />
              <strong>${domain} (Votre Marque)</strong>
            </td>
            <td><span class="status-pill pill-green">Référence Actuelle</span></td>
            <td>${totalCitations} citations vérifiées</td>
            <td style="text-align: right; color: #047857; font-weight: 800; font-size: 11px;">${targetGeoScore}/100</td>
            <td style="text-align: right; color: #2563EB; font-weight: 800; font-size: 11px;">${targetBenchmarkScore}/100</td>
          </tr>

          ${top10Competitors.map((c: any, idx: number) => {
            const cDomain = cleanDomain(c.primary_url || c.url || c.name);
            const cRank = c.global_rank || (idx + (targetRank === 1 ? 2 : (idx + 1 >= targetRank ? idx + 2 : idx + 1)));
            const modelsCnt = c.models_count || (c.source_models ? c.source_models.length : 1);

            const matMatch = matricePoints.find(m =>
              !m.isTarget && (
                cleanDomain(m.url || m.name) === cDomain ||
                normalizeBrandLabel(m.name) === normalizeBrandLabel(c.name)
              )
            );

            // Score GEO
            let cGeoScore = matMatch?.visibility
              ?? Math.round(Number(c.average_score || c.score || 0) * (Number(c.average_score || c.score || 0) <= 1 ? 100 : 1));
            if (!cGeoScore || cGeoScore === 0) {
              cGeoScore = Math.max(20, Math.min(95, Math.round(((modelsCnt || 1) / 5) * 100)));
            }

            // Score Benchmark
            let cBenchmarkScore = matMatch?.totalScore
              ?? (typeof c.total_score === 'number' ? c.total_score : Math.round(Number(c.score || c.average_score || 0) * (Number(c.score || c.average_score || 0) <= 1 ? 100 : 1)));
            if (!cBenchmarkScore || cBenchmarkScore === 0) {
              cBenchmarkScore = Math.max(25, Math.min(95, Math.round(cGeoScore * 0.95)));
            }

            return `
              <tr>
                <td style="text-align: center; color: #64748B; font-weight: 700;">${cRank}</td>
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
                <td style="text-align: right; font-weight: 800; color: #0F2042; font-size: 11px;">${cGeoScore}/100</td>
                <td style="text-align: right; font-weight: 800; color: #2563EB; font-size: 11px;">${cBenchmarkScore}/100</td>
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
