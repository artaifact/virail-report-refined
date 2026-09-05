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
    return new URL(url).hostname.replace(/^www\./, '');
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
 * Construit les SVG de jauge circulaire pour le PDF
 */
function renderCircularGaugeSvg(value: number, label: string, color: string, total: number = 100, isScore: boolean = false): string {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, isScore ? value : (value / Math.max(1, total)) * 100));
  const offset = circ - (pct / 100) * circ;

  return `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 140px;">
      <svg viewBox="0 0 100 100" style="width: 100px; height: 100px;">
        <circle cx="50" cy="50" r="${r}" fill="none" stroke="#F1F5F9" stroke-width="10" />
        <circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="10"
          stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round"
          transform="rotate(-90 50 50)" />
        <text x="50" y="47" text-anchor="middle" style="font-size: 20px; font-weight: 800; fill: #0F172A; font-family: Inter, system-ui, sans-serif;">
          ${value}
        </text>
        <text x="50" y="62" text-anchor="middle" style="font-size: 8px; font-weight: 600; fill: #64748B; font-family: Inter, system-ui, sans-serif;">
          ${isScore ? '/ 100' : 'citations'}
        </text>
      </svg>
      <div style="font-size: 11px; font-weight: 700; color: #334155; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">
        ${label}
      </div>
    </div>
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
      // Fallback si l'appel échoue
    }
  }

  // 2. Score GEO et Citations
  const targetGeoScore = extractTargetGeoScore(reportData) ?? 0;
  const geoColor = targetGeoScore >= 75 ? '#10B981' : targetGeoScore >= 50 ? '#6366F1' : '#F59E0B';
  const geoStatus = targetGeoScore >= 75 ? 'Excellent' : targetGeoScore >= 50 ? 'Bon' : 'À améliorer';

  let totalCitations = reportData?.analyse_citation?.total_citations || 0;
  if (!totalCitations && reportData?.analyses?.length) {
    totalCitations = reportData.analyses.reduce((sum, a) => {
      const geo = a.modules?.audit_geo;
      return sum + Number(geo?.citations || geo?.mentions || 0);
    }, 0);
  }

  // 3. Modèles d'IA & Répartition
  const citationsByModel = (reportData?.analyse_citation?.citations_by_model || {}) as Record<string, number>;
  const modelEntries = Object.entries(citationsByModel)
    .map(([model, count]) => ({
      name: model,
      count: Number(count) || 0,
      pct: totalCitations > 0 ? Math.round(((Number(count) || 0) / totalCitations) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // 4. Sources / Domaines cités
  const frequentlyMentioned = reportData?.analyse_citation?.competitors_frequently_mentioned || [];
  const sourcesList = Array.isArray(frequentlyMentioned) ? frequentlyMentioned.slice(0, 10) : [];

  // 5. Piliers GEO & Recommandations (Améliorer)
  const categories = [
    { key: 'html_semantique', label: 'Structure HTML & Sémantique', description: 'Balisage hiérarchique, balises sémantiques et clarté du code.' },
    { key: 'donnees_structurees', label: 'Données Structurées (Schema.org)', description: 'JSON-LD, balises Schema.org et données typées exploitables par les LLM.' },
    { key: 'accessibilite_crawlers', label: 'Accessibilité Crawlers IA', description: 'Robots.txt, directives LLM, vitesse de réponse et sitemaps.' },
    { key: 'optimisation_contenu', label: 'Qualité du Contenu', description: 'Densité informationnelle, richesse contextuelle et réponses directes.' },
    { key: 'metadonnees_techniques', label: 'Métadonnées & Directives', description: 'Balises meta description, Open Graph et llms.txt.' },
    { key: 'conformite_standards', label: 'Conformité Standards Web', description: 'Accessibilité W3C, performance web et compatibilité multi-moteur.' },
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

  // 6. Données concurrentielles (/competition)
  const competitorsList = compData?.consolidated_competitors || [];
  const targetRank = compData?.your_position?.rank || 1;
  const totalCompetitors = competitorsList.length;

  // 7. Construction du gabarit HTML haute résolution pour l'impression A4
  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport GEO Complet — ${domain}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
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
      font-size: 12px;
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

    .header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #E2E8F0;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }

    .brand-title {
      font-size: 18px;
      font-weight: 800;
      color: #0F172A;
      letter-spacing: -0.02em;
    }

    .brand-sub {
      font-size: 10px;
      color: #64748B;
      font-weight: 500;
      margin-top: 2px;
    }

    .badge-report {
      background: #EEF2FF;
      color: #4F46E5;
      font-weight: 700;
      font-size: 10px;
      padding: 4px 10px;
      border-radius: 9999px;
      border: 1px solid #C7D2FE;
    }

    /* Section Cards */
    .section-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 16px;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #0F172A;
      margin: 0 0 12px 0;
      display: flex;
      align-items: center;
      gap: 8px;
      border-left: 4px solid #6366F1;
      padding-left: 8px;
    }

    /* KPI Highlights */
    .kpi-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .kpi-box {
      flex: 1;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 12px 14px;
      text-align: center;
    }

    .kpi-val {
      font-size: 22px;
      font-weight: 800;
      color: #0F172A;
      line-height: 1.2;
    }

    .kpi-label {
      font-size: 10px;
      font-weight: 600;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-top: 4px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-top: 8px;
    }

    th {
      background: #F8FAFC;
      color: #475569;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border-bottom: 1.5px solid #E2E8F0;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.05em;
    }

    td {
      padding: 8px 10px;
      border-bottom: 1px solid #F1F5F9;
      color: #1E293B;
    }

    tr:last-child td {
      border-bottom: none;
    }

    .progress-bar-bg {
      background: #F1F5F9;
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
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 9px;
      font-weight: 700;
    }

    .pill-green { background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; }
    .pill-blue { background: #EEF2FF; color: #4F46E5; border: 1px solid #C7D2FE; }
    .pill-amber { background: #FFFBEB; color: #D97706; border: 1px solid #FDE68A; }

    .footer-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #E2E8F0;
      padding-top: 8px;
      font-size: 9px;
      color: #94A3B8;
    }
  </style>
</head>
<body>

  <!-- PAGE 1 : EN-TÊTE & SECTION INFOS DÉTAILLÉES -->
  <div class="page">
    <div class="header-bar">
      <div>
        <div class="brand-title">Rapport d'Audit GEO & Benchmark IA</div>
        <div class="brand-sub">Analyse du domaine : <strong>${domain}</strong> | URL : ${targetUrl}</div>
      </div>
      <div style="text-align: right;">
        <span class="badge-report">Rapport Officiel</span>
        <div class="brand-sub" style="margin-top: 4px;">Édité le ${updateDate}</div>
      </div>
    </div>

    <!-- Synthèse Visuelle des Scores (Gauges identiques au Dashboard) -->
    <div class="section-card" style="display: flex; align-items: center; justify-content: space-around; padding: 20px;">
      ${renderCircularGaugeSvg(totalCitations, 'Citations Totales', '#6366F1', 100, false)}
      ${renderCircularGaugeSvg(targetGeoScore, 'Score GEO Cible', geoColor, 100, true)}
      <div style="max-width: 240px;">
        <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase;">Évaluation globale</div>
        <div style="font-size: 18px; font-weight: 800; color: #0F172A; margin: 4px 0;">Niveau ${geoStatus}</div>
        <p style="font-size: 11px; color: #475569; margin: 0;">
          Votre site comptabilise <strong>${totalCitations} citations</strong> actives réparties sur les principaux moteurs de recherche IA génératifs.
        </p>
      </div>
    </div>

    <!-- SECTION INFOS DÉTAILLÉES : Répartition par Modèle IA -->
    ${includeCitations ? `
    <div class="section-card">
      <div class="section-title">1. Répartition des Citations par Modèle d'IA</div>
      <table>
        <thead>
          <tr>
            <th style="width: 30%;">Moteur d'IA</th>
            <th style="width: 25%;">Part de visibilité</th>
            <th style="width: 25%;">Progression</th>
            <th style="width: 20%; text-align: right;">Citations</th>
          </tr>
        </thead>
        <tbody>
          ${modelEntries.length > 0 ? modelEntries.map(m => `
            <tr>
              <td><strong>${m.name}</strong></td>
              <td>${m.pct}%</td>
              <td>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: ${m.pct}%; background: #6366F1;"></div>
                </div>
              </td>
              <td style="text-align: right; font-weight: 700;">${m.count}</td>
            </tr>
          `).join('') : `
            <tr><td colspan="4" style="text-align: center; color: #94A3B8;">Aucune citation détaillée enregistrée.</td></tr>
          `}
        </tbody>
      </table>
    </div>

    <!-- Domaines et Sources les plus cités -->
    <div class="section-card">
      <div class="section-title">2. Domaines & Sources Référentes Cités</div>
      <p style="font-size: 10px; color: #64748B; margin: -4px 0 8px 0;">
        Sources tierces les plus souvent mentionnées par les IA lorsqu'elles répondent sur vos thématiques.
      </p>
      <table>
        <thead>
          <tr>
            <th>Domaine / Source</th>
            <th>Type</th>
            <th style="text-align: right;">Mentions détectées</th>
          </tr>
        </thead>
        <tbody>
          ${sourcesList.length > 0 ? sourcesList.map((s: any) => `
            <tr>
              <td><strong>${cleanDomain(s.url || s.name || s.domain)}</strong></td>
              <td><span class="status-pill pill-blue">Source d'autorité</span></td>
              <td style="text-align: right; font-weight: 700;">${s.count || s.mentions || 1}</td>
            </tr>
          `).join('') : `
            <tr>
              <td><strong>${domain}</strong> (Site officiel)</td>
              <td><span class="status-pill pill-green">Domaine Cible</span></td>
              <td style="text-align: right; font-weight: 700;">${totalCitations}</td>
            </tr>
          `}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="footer-bar">
      <span>Rapport GEO & Veille Concurrentielle — ${domain}</span>
      <span>Page 1 / 2</span>
    </div>
  </div>

  <!-- PAGE 2 : SECTION AMÉLIORER & VEILLE CONCURRENTIELLE -->
  <div class="page">
    <div class="header-bar">
      <div>
        <div class="brand-title">Optimisation & Positionnement Concurrentiel</div>
        <div class="brand-sub">Domaine : <strong>${domain}</strong></div>
      </div>
      <div>
        <span class="badge-report">Plan d'Actions & Concurrence</span>
      </div>
    </div>

    <!-- SECTION AMÉLIORER : Audit des 6 Piliers Techniques -->
    ${includeRecommendations ? `
    <div class="section-card">
      <div class="section-title">3. Audit des Piliers GEO & Recommandations Techniques</div>
      <table>
        <thead>
          <tr>
            <th style="width: 35%;">Pilier d'optimisation</th>
            <th style="width: 40%;">Description</th>
            <th style="width: 15%;">Score</th>
            <th style="width: 10%; text-align: right;">Statut</th>
          </tr>
        </thead>
        <tbody>
          ${pillarsScores.map(p => {
            const pStatus = p.score >= 75 ? 'pill-green' : p.score >= 50 ? 'pill-blue' : 'pill-amber';
            const pLabel = p.score >= 75 ? 'Optimal' : p.score >= 50 ? 'Bon' : 'À revoir';
            return `
              <tr>
                <td><strong>${p.label}</strong></td>
                <td style="font-size: 10px; color: #64748B;">${p.description}</td>
                <td>
                  <div style="font-weight: 700; margin-bottom: 2px;">${p.score}/100</div>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${p.score}%; background: ${p.score >= 75 ? '#10B981' : p.score >= 50 ? '#6366F1' : '#F59E0B'};"></div>
                  </div>
                </td>
                <td style="text-align: right;"><span class="status-pill ${pStatus}">${pLabel}</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      ${planActionItems.length > 0 ? `
        <div style="margin-top: 12px; padding: 10px 12px; background: #F8FAFC; border-radius: 8px; border: 1px dashed #CBD5E1;">
          <div style="font-size: 10px; font-weight: 700; color: #334155; text-transform: uppercase; margin-bottom: 6px;">Actions prioritaires recommandées :</div>
          <ul style="margin: 0; padding-left: 18px; font-size: 10px; color: #475569;">
            ${planActionItems.slice(0, 4).map(action => `<li style="margin-bottom: 3px;">${action}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
    ` : ''}

    <!-- SECTION CONCURRENCE (/competition) -->
    ${includeCompetition ? `
    <div class="section-card">
      <div class="section-title">4. Benchmark & Veille Concurrentielle (/competition)</div>
      
      <div class="kpi-row">
        <div class="kpi-box">
          <div class="kpi-val">#${targetRank}</div>
          <div class="kpi-label">Rang sur votre marché</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-val">${totalCompetitors}</div>
          <div class="kpi-label">Concurrents détectés</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-val">${targetGeoScore}%</div>
          <div class="kpi-label">Score GEO Relatif</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 8%;">Rang</th>
            <th style="width: 35%;">Site / Concurrent</th>
            <th style="width: 25%;">Domaine</th>
            <th style="width: 17%;">Consensus IA</th>
            <th style="width: 15%; text-align: right;">Score GEO</th>
          </tr>
        </thead>
        <tbody>
          <!-- Votre site en première ligne mise en avant -->
          <tr style="background: #F0FDF4; font-weight: 600;">
            <td><strong>#${targetRank}</strong></td>
            <td><strong>${domain} (Votre site)</strong></td>
            <td style="color: #059669;">${cleanDomain(targetUrl)}</td>
            <td><span class="status-pill pill-green">Référencé</span></td>
            <td style="text-align: right; color: #059669; font-weight: 800;">${targetGeoScore}/100</td>
          </tr>
          ${competitorsList.slice(0, 6).map((c: any, idx: number) => {
            const cScore = Math.round(Number(c.average_score || c.score || 0) * (Number(c.average_score || c.score || 0) <= 1 ? 100 : 1));
            return `
              <tr>
                <td>#${c.global_rank || idx + 2}</td>
                <td><strong>${c.name}</strong></td>
                <td style="color: #64748B;">${cleanDomain(c.primary_url || c.url)}</td>
                <td>${c.models_count ? `${c.models_count} modèles` : 'Actif'}</td>
                <td style="text-align: right; font-weight: 700;">${cScore}/100</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="footer-bar">
      <span>Rapport GEO & Veille Concurrentielle — ${domain}</span>
      <span>Page 2 / 2</span>
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
