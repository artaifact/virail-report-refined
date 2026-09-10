import React, { useState, useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  MessageSquareText,
  ChevronDown,
  Copy,
  Check,
  FileText,
  ExternalLink,
  Cpu,
  Search,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import styles from '../App.module.css';

/**
 * AskAIButton — pattern "LLM landing" (type Apify Store).
 * Bouton discret dans le header : ouvre un dropdown permettant à un visiteur
 * de se faire expliquer la page par une IA, de copier la page en Markdown pour LLM,
 * ou de récupérer la config MCP.
 */

interface ChatTarget {
  id: string;
  name: string;
  label: string;
  sub: string;
  logo: string;
  url: (prompt: string) => string;
}

const CHAT_TARGETS: ChatTarget[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    label: 'Ouvrir dans ChatGPT',
    sub: 'Analyser l\'audit complet dans ChatGPT',
    logo: '/prompt-model-openai-for-light.svg',
    url: (prompt) =>
      `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
  },
  {
    id: 'claude',
    name: 'Claude',
    label: 'Ouvrir dans Claude',
    sub: 'Analyser l\'audit complet dans Claude',
    logo: '/prompt-model-claude.svg',
    url: (prompt) =>
      `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    label: 'Ouvrir dans Perplexity',
    sub: 'Interroger Perplexity sur ce rapport',
    logo: '/prompt-model-perplexity.svg',
    url: (prompt) =>
      `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`,
  },
];

/**
 * Génère une version Markdown complète, structurée et exhaustive du rapport d'audit GEO
 */
export function buildDetailedReportMarkdown(reportData: any): string {
  if (!reportData) {
    return `# Rapport d'Audit GEO Viraill\nAucune donnée de rapport disponible.`;
  }

  const url = reportData?.report?.url || reportData?.llmo_report?.url || '';
  let domain = url;
  try {
    domain = new URL(url).hostname.replace('www.', '');
  } catch {}

  const date = reportData?.report?.updated_at || reportData?.report?.created_at
    ? new Date(reportData?.report?.updated_at || reportData?.report?.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('fr-FR');

  // 1. Extraction du Score GEO Global
  const directCandidates = [
    reportData?.target_geo_score,
    reportData?.report?.target_geo_score,
    reportData?.llmo_report?.target_geo_score,
    reportData?.metadata?.target_geo_score,
    reportData?.report?.metadata?.target_geo_score,
    reportData?.target_positioning?.target_geo_score,
  ];
  let geoScore: number | string = 'N/A';
  for (const c of directCandidates) {
    if (c !== undefined && c !== null && c !== '') {
      const num = Number(c);
      if (!isNaN(num)) {
        geoScore = num > 0 && num <= 1 ? Math.round(num * 100) : Math.round(num);
        break;
      }
    }
  }

  const geoStatus = typeof geoScore === 'number'
    ? (geoScore >= 75 ? 'Optimal (Forte visibilité IA)' : geoScore >= 50 ? 'Favorable (Visibilité modérée)' : 'À renforcer (Sous-cité)')
    : 'En cours';

  // 2. Volume & Répartition des Citations IA
  let totalCitations = reportData?.analyse_citation?.total_citations || 0;
  if (!totalCitations && Array.isArray(reportData?.analyses)) {
    totalCitations = reportData.analyses.reduce((sum: number, a: any) => {
      const geo = a.modules?.audit_geo;
      return sum + Number(geo?.citations || geo?.mentions || 0);
    }, 0);
  }

  const citationsByModel = (reportData?.analyse_citation?.citations_by_model || {}) as Record<string, number>;
  const modelLines = Object.entries(citationsByModel)
    .filter(([_, count]) => Number(count) > 0)
    .map(([model, count]) => {
      const pct = totalCitations > 0 ? Math.round((Number(count) / totalCitations) * 100) : 0;
      return `- **${model}** : ${count} mention(s) (${pct}%)`;
    })
    .join('\n');

  // 3. Modules et Analyses détaillées
  const analyses = Array.isArray(reportData?.analyses) ? reportData.analyses : [];

  let htmlScore: number | null = null;
  let donneesScore: number | null = null;
  let crawlersScore: number | null = null;
  let contenuScore: number | null = null;
  let metaScore: number | null = null;
  let standardsScore: number | null = null;
  let resumeExecutifGeo = '';
  const planActions: string[] = [];
  const recommendations: string[] = [];

  for (const a of analyses) {
    const geo = a.modules?.audit_geo;
    if (geo) {
      if (geo.html_score !== undefined && htmlScore === null) htmlScore = Math.round(geo.html_score);
      if (geo.donnees_score !== undefined && donneesScore === null) donneesScore = Math.round(geo.donnees_score);
      if (geo.crawlers_score !== undefined && crawlersScore === null) crawlersScore = Math.round(geo.crawlers_score);
      if (geo.contenu_score !== undefined && contenuScore === null) contenuScore = Math.round(geo.contenu_score);
      if (geo.meta_score !== undefined && metaScore === null) metaScore = Math.round(geo.meta_score);
      if (geo.standards_score !== undefined && standardsScore === null) standardsScore = Math.round(geo.standards_score);
      if (geo.resume_executif_geo && !resumeExecutifGeo) resumeExecutifGeo = geo.resume_executif_geo;

      if (Array.isArray(geo.plan_action_geo)) {
        geo.plan_action_geo.forEach((item: any) => {
          const act = typeof item === 'string' ? item : (item.action || item.titre);
          if (act && !planActions.includes(act)) planActions.push(act);
        });
      }
      const recs = geo.recommandations || geo.actions_recommandees;
      if (Array.isArray(recs)) {
        recs.forEach((r: any) => {
          const title = typeof r === 'string' ? r : (r.title || r.nom || r.action);
          if (title && !recommendations.includes(title)) recommendations.push(title);
        });
      }
    }
  }

  // 4. Synthèses Qualitatives (Perception, Valeur, Audience)
  let synthesePerception = '';
  let sujetPrincipal = '';
  let tonGeneral = '';
  let styleEcriture = '';
  let biais = '';
  let syntheseValeur = '';
  let descriptionAudience = '';
  const suggestionsRecs: string[] = [];
  let justificationRec = '';

  for (const a of analyses) {
    if (a.modules?.perception) {
      if (!synthesePerception && a.modules.perception.synthese_perception) {
        synthesePerception = a.modules.perception.synthese_perception;
      }
      if (!sujetPrincipal && a.modules.perception.sujet_principal) sujetPrincipal = a.modules.perception.sujet_principal;
      if (!tonGeneral && a.modules.perception.ton_general) tonGeneral = a.modules.perception.ton_general;
      if (!styleEcriture && a.modules.perception.style_d_ecriture) styleEcriture = a.modules.perception.style_d_ecriture;
      if (!biais && a.modules.perception.biais) biais = a.modules.perception.biais;
    }
    if (a.modules?.valeur && !syntheseValeur && a.modules.valeur.synthese_analyse) {
      syntheseValeur = a.modules.valeur.synthese_analyse;
    }
    if (a.modules?.audience && !descriptionAudience && a.modules.audience.description_audience) {
      descriptionAudience = a.modules.audience.description_audience;
    }
    if (a.modules?.recommandation) {
      if (!justificationRec && a.modules.recommandation.justification) justificationRec = a.modules.recommandation.justification;
      if (Array.isArray(a.modules.recommandation.suggestions)) {
        a.modules.recommandation.suggestions.forEach((s: string) => {
          if (s && !suggestionsRecs.includes(s)) suggestionsRecs.push(s);
        });
      }
    }
  }

  // 5. Concurrents & Veille
  const competitors: { name: string; score?: number }[] = [];
  const cfm = reportData?.analyse_citation?.competitors_frequently_mentioned;
  if (Array.isArray(cfm)) {
    cfm.forEach((c: any) => {
      const name = typeof c === 'string' ? c : (c.domain || c.name || c.nom);
      if (name && !competitors.some(x => x.name === name)) {
        competitors.push({ name, score: c.score || c.average_score });
      }
    });
  }
  const rawComp = reportData?.competitor_analysis?.consolidated_competitors || reportData?.competitor_analysis?.top_competitors || reportData?.materiality_matrix?.brands;
  if (Array.isArray(rawComp)) {
    rawComp.forEach((c: any) => {
      const name = c.name || c.domain || c.primary_url;
      if (name && !competitors.some(x => x.name === name)) {
        const sc = c.total_score || c.score || c.average_score;
        competitors.push({ name, score: sc ? Math.round(Number(sc) <= 1 ? Number(sc) * 100 : Number(sc)) : undefined });
      }
    });
  }

  const compLines = competitors.length > 0
    ? competitors.map((c) => `- **${c.name}**${c.score !== undefined ? ` (Score Visibilité : ${c.score}/100)` : ''}`).join('\n')
    : `- Analyse concurrentielle en cours de consolidation.`;

  // Actions combinées
  const allActions = Array.from(new Set([...planActions, ...recommendations, ...suggestionsRecs]));
  const actionsLines = allActions.length > 0
    ? allActions.map((act, i) => `${i + 1}. ${act}`).join('\n')
    : `- Maintenir et enrichir les contenus sources à haute valeur ajoutée.`;

  return `# Rapport d'Audit GEO (Generative Engine Optimization) — ${domain || 'Site Web'}
*URL analysée : ${url || 'N/A'}*  
*Date de l'audit : ${date}*

---

## 1. Synthèse Exécutive & Score GEO Global
- **Score GEO Global** : ${geoScore} / 100 (${geoStatus})
- **Volume Total de Citations IA Détectées** : ${totalCitations} mentions
- **Diagnostic Général** : ${resumeExecutifGeo || 'Audit de visibilité et citabilité sur les moteurs de réponses génératifs.'}

---

## 2. Visibilité et Citations par Moteur d'IA (LLMs)
${modelLines || '- Aucune citation spécifique détectée dans les moteurs interrogés.'}

---

## 3. Diagnostic Technique & Piliers GEO
${crawlersScore !== null ? `- **Accès Robots IA (Crawlers)** : ${crawlersScore}/100 (GPTBot, ClaudeBot, PerplexityBot)` : ''}
${donneesScore !== null ? `- **Données Structurées & Schema.org** : ${donneesScore}/100` : ''}
${htmlScore !== null ? `- **Structure HTML & Balisage Sémantique** : ${htmlScore}/100` : ''}
${contenuScore !== null ? `- **Qualité & Citabilité du Contenu** : ${contenuScore}/100` : ''}
${metaScore !== null ? `- **Métadonnées & Open Graph** : ${metaScore}/100` : ''}
${standardsScore !== null ? `- **Standards & Protocoles** : ${standardsScore}/100` : ''}

${sujetPrincipal || tonGeneral ? `---

## 4. Perception & Caractéristiques du Contenu par l'IA
${sujetPrincipal ? `- **Sujet Principal Détecté** : ${sujetPrincipal}` : ''}
${tonGeneral ? `- **Ton Général** : ${tonGeneral}` : ''}
${styleEcriture ? `- **Style d'Écriture** : ${styleEcriture}` : ''}
${biais ? `- **Biais / Neutralité** : ${biais}` : ''}` : ''}

${synthesePerception ? `---

## 5. Synthèse Approfondie de Perception IA
${synthesePerception}` : ''}

${syntheseValeur ? `---

## 6. Proposition de Valeur & Positionnement Perçu
${syntheseValeur}` : ''}

${descriptionAudience ? `---

## 7. Analyse de l'Audience Cible Perçue
${descriptionAudience}` : ''}

${justificationRec ? `---

## 8. Diagnostic d'Éligibilité aux Réponses IA
${justificationRec}` : ''}

---

## 9. Plan d'Actions & Recommandations Prioritaires
${actionsLines}

---

## 10. Veille Concurrentielle & Marques Fréquemment Citées
${compLines}

---
*Rapport d'audit généré par Viraill — Plateforme d'analyse et d'optimisation GEO (Generative Engine Optimization).*
`;
}

/**
 * Construit un prompt dense et exécutif qui tient dans l'URL du chatbot sans troncature
 */
export function buildChatbotPrompt(reportData: any): string {
  if (!reportData) {
    return "Explique-moi ce rapport d'audit GEO en français, de façon factuelle et structurée.";
  }

  const url = reportData?.report?.url || reportData?.llmo_report?.url || '';
  let domain = url;
  try {
    domain = new URL(url).hostname.replace('www.', '');
  } catch {}

  const directCandidates = [
    reportData?.target_geo_score,
    reportData?.report?.target_geo_score,
    reportData?.llmo_report?.target_geo_score,
    reportData?.metadata?.target_geo_score,
    reportData?.report?.metadata?.target_geo_score,
    reportData?.target_positioning?.target_geo_score,
  ];
  let geoScore: number | string = 'N/A';
  for (const c of directCandidates) {
    if (c !== undefined && c !== null && c !== '') {
      const num = Number(c);
      if (!isNaN(num)) {
        geoScore = num > 0 && num <= 1 ? Math.round(num * 100) : Math.round(num);
        break;
      }
    }
  }

  let totalCitations = reportData?.analyse_citation?.total_citations || 0;
  if (!totalCitations && Array.isArray(reportData?.analyses)) {
    totalCitations = reportData.analyses.reduce((sum: number, a: any) => {
      const geo = a.modules?.audit_geo;
      return sum + Number(geo?.citations || geo?.mentions || 0);
    }, 0);
  }

  const citationsByModel = (reportData?.analyse_citation?.citations_by_model || {}) as Record<string, number>;
  const modelSummary = Object.entries(citationsByModel)
    .filter(([_, count]) => Number(count) > 0)
    .map(([model, count]) => `${model}: ${count}`)
    .join(', ') || 'Aucune citation détectée';

  const analyses = Array.isArray(reportData?.analyses) ? reportData.analyses : [];
  let resumeExecutif = '';
  let crawlersScore = '';
  let donneesScore = '';
  let htmlScore = '';
  let contenuScore = '';
  const topRecs: string[] = [];

  for (const a of analyses) {
    const geo = a.modules?.audit_geo;
    if (geo) {
      if (geo.resume_executif_geo && !resumeExecutif) resumeExecutif = geo.resume_executif_geo;
      if (geo.crawlers_score !== undefined && !crawlersScore) crawlersScore = `${Math.round(geo.crawlers_score)}/100`;
      if (geo.donnees_score !== undefined && !donneesScore) donneesScore = `${Math.round(geo.donnees_score)}/100`;
      if (geo.html_score !== undefined && !htmlScore) htmlScore = `${Math.round(geo.html_score)}/100`;
      if (geo.contenu_score !== undefined && !contenuScore) contenuScore = `${Math.round(geo.contenu_score)}/100`;
      if (Array.isArray(geo.plan_action_geo)) {
        geo.plan_action_geo.slice(0, 4).forEach((item: any) => {
          const act = typeof item === 'string' ? item : (item.action || item.titre);
          if (act && !topRecs.includes(act)) topRecs.push(act);
        });
      }
    }
    if (topRecs.length < 4 && a.modules?.recommandation?.suggestions) {
      a.modules.recommandation.suggestions.slice(0, 4).forEach((s: string) => {
        if (s && !topRecs.includes(s)) topRecs.push(s);
      });
    }
  }

  const cfm = reportData?.analyse_citation?.competitors_frequently_mentioned;
  const topComps: string[] = [];
  if (Array.isArray(cfm)) {
    cfm.slice(0, 5).forEach((c: any) => {
      const name = typeof c === 'string' ? c : (c.domain || c.name || c.nom);
      if (name && !topComps.includes(name)) topComps.push(name);
    });
  }

  const recsText = topRecs.length > 0
    ? topRecs.map((r, i) => `${i + 1}. ${r}`).join('\n')
    : '1. Structurer les données Schema.org\n2. Optimiser l\'accessibilité pour les crawlers LLM\n3. Développer l\'autorité sémantique';

  const compsText = topComps.length > 0 ? topComps.join(', ') : 'En cours d\'analyse';

  const techSnippet = [
    crawlersScore ? `Crawlers: ${crawlersScore}` : '',
    donneesScore ? `Schema.org: ${donneesScore}` : '',
    htmlScore ? `HTML: ${htmlScore}` : '',
    contenuScore ? `Contenu: ${contenuScore}` : '',
  ].filter(Boolean).join(' | ');

  return `Tu es un expert mondial en GEO (Generative Engine Optimization) et en visibilité sur les moteurs de réponses IA (ChatGPT, Perplexity, Claude, Gemini).

Voici l'audit GEO réalisé par Viraill pour le site ${domain} (${url}) :

📊 RÉSULTATS CLÉS :
- Score GEO Global : ${geoScore}/100
- Citations IA détectées : ${totalCitations} mentions (${modelSummary})
${techSnippet ? `- Piliers techniques : ${techSnippet}` : ''}
${resumeExecutif ? `- Diagnostic exécutif : ${resumeExecutif.slice(0, 240)}...` : ''}

🎯 RECOMMANDATIONS PRIORITAIRES :
${recsText}

🏆 CONCURRENTS FRÉQUEMMENT CITÉS :
${compsText}

(Note : L'intégralité du rapport détaillé complet a été copiée dans mon presse-papiers).

MISSION :
Analyse ces résultats d'audit GEO et donne-moi :
1. Les raisons précises pour lesquelles ce site est cité ou ignoré par les LLMs.
2. Un plan d'action opérationnel étape par étape (Quick Wins, balisage Schema.org, contenu haute autorité).
3. Les tactiques pour dépasser les concurrents cités et devenir la source recommandée par défaut.`;
}

interface AskAIButtonProps {
  markdownUrl?: string;
  prompt?: string;
  mcpConfigUrl?: string;
  origin?: string;
  reportData?: any;
  size?: 'default' | 'sm';
  className?: string;
  onOpenAiModal?: () => void;
}

export default function AskAIButton({
  markdownUrl,
  prompt,
  mcpConfigUrl,
  origin = 'https://viraill.com',
  reportData,
  size = 'default',
  className = '',
  onOpenAiModal,
}: AskAIButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // URL pour les LLMs : on pointe vers /llms-full.txt
  const md = markdownUrl || `${origin}/llms-full.txt`;

  // Génération dynamique du contenu Markdown exhaustif du rapport d'audit
  const detailedMarkdown = useMemo(() => {
    return buildDetailedReportMarkdown(reportData);
  }, [reportData]);

  // Génération du prompt exécutif optimisé pour les chatbots
  const chatbotPrompt = useMemo(() => {
    return prompt || buildChatbotPrompt(reportData);
  }, [reportData, prompt]);

  // Création d'un URL Blob pour afficher la version texte complète du rapport en Markdown
  const textBlobUrl = useMemo(() => {
    if (!detailedMarkdown) return md;
    try {
      const blob = new Blob([detailedMarkdown], { type: 'text/markdown;charset=utf-8' });
      return URL.createObjectURL(blob);
    } catch {
      return md;
    }
  }, [detailedMarkdown, md]);

  const mcp = mcpConfigUrl || 'https://github.com/crypto-yannso/viraill-mcp#readme';

  const copyForAI = async () => {
    try {
      let textToCopy = detailedMarkdown;
      if (!textToCopy && md) {
        const res = await fetch(md);
        textToCopy = res.ok ? await res.text() : '';
      }
      await navigator.clipboard.writeText(
        textToCopy || `Source (Markdown) : ${md}`,
      );
      setCopied(true);
      toast({
        title: "Rapport d'audit copié !",
        description: "L'intégralité du rapport GEO a été copiée en Markdown dans votre presse-papiers.",
      });
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1400);
    } catch {
      window.open(textBlobUrl || md, '_blank', 'noopener');
    }
  };

  const handleOpenChat = async (target: typeof CHAT_TARGETS[0]) => {
    try {
      await navigator.clipboard.writeText(detailedMarkdown);
      toast({
        title: `Ouverture de ${target.name}...`,
        description: "L'intégralité du rapport exhaustif a été copiée dans votre presse-papiers (prête à coller avec Cmd+V) !",
      });
    } catch {}

    const chatUrl = target.url(chatbotPrompt);
    window.open(chatUrl, '_blank', 'noopener');
    setOpen(false);
  };

  return (
    <div className={`${styles.askAiWrapper} ${className}`.trim()}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Se faire expliquer cette page par une IA"
            className={`${styles.askAiButton} ${size === 'sm' ? styles.askAiButtonSm : ''}`}
          >
            <span className={styles.askAiIconBadge}>
              <MessageSquareText size={size === 'sm' ? 12 : 14} strokeWidth={2.2} />
            </span>
            <span className={styles.askAiLabel}>Expliquer par l'IA</span>
            <ChevronDown size={11} strokeWidth={2} className={styles.askAiChevron} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className={styles.askAiMenu}
        >
          {onOpenAiModal && (
            <>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  onOpenAiModal();
                }}
                className={`${styles.askAiItem} ${styles.askAiItemFeatured}`}
              >
                <div className={`${styles.askAiItemIcon} ${styles.askAiItemIconPrimary}`}>
                  <MessageSquareText size={13} strokeWidth={2} />
                </div>
                <div className={styles.askAiItemText}>
                  <span className={styles.askAiItemTitle}>
                    Synthèse Exécutive IA
                    <span className={styles.askAiItemBadge}>Instantané</span>
                  </span>
                  <span className={styles.askAiItemSub}>
                    Explication GEO interactive du score et des citations
                  </span>
                </div>
              </DropdownMenuItem>
              <div className={styles.askAiSeparator} />
            </>
          )}

          <div className={styles.askAiMenuHeader}>Export & LLMs externes</div>

          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              copyForAI();
            }}
            className={`${styles.askAiItem} ${copied ? styles.askAiItemCopied : ''}`}
          >
            <div className={styles.askAiItemIcon}>
              {copied ? <Check size={13} strokeWidth={2.2} /> : <Copy size={13} strokeWidth={2} />}
            </div>
            <div className={styles.askAiItemText}>
              <span className={styles.askAiItemTitle}>
                {copied ? 'Copié en Markdown !' : 'Copier le rapport pour un LLM'}
              </span>
              <span className={styles.askAiItemSub}>
                {copied ? 'À coller directement dans votre IA favorite' : 'Markdown optimisé pour contexte prompt'}
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className={styles.askAiItem}>
            <a
              href={textBlobUrl || md}
              target="_blank"
              rel="noopener"
            >
              <div className={styles.askAiItemIcon}>
                <FileText size={13} strokeWidth={2} />
              </div>
              <div className={styles.askAiItemText}>
                <span className={styles.askAiItemTitle}>
                  Version texte brute
                  <ExternalLink size={11} className="text-slate-400 ml-auto" />
                </span>
                <span className={styles.askAiItemSub}>Documentation LLM complète (/llms-full.txt)</span>
              </div>
            </a>
          </DropdownMenuItem>

          <div className={styles.askAiSeparator} />
          <div className="flex items-center justify-between px-2.5 py-1">
            <span className={styles.askAiMenuHeader}>Ouvrir dans un chatbot</span>
            <div className="flex items-center -space-x-1 opacity-80">
              <img src="/prompt-model-openai-for-light.svg" alt="ChatGPT" className="w-3.5 h-3.5 rounded-full bg-slate-100 p-0.5 object-contain" />
              <img src="/prompt-model-claude.svg" alt="Claude" className="w-3.5 h-3.5 rounded-full bg-slate-100 p-0.5 object-contain" />
              <img src="/prompt-model-perplexity.svg" alt="Perplexity" className="w-3.5 h-3.5 rounded-full bg-slate-100 p-0.5 object-contain" />
            </div>
          </div>

          {CHAT_TARGETS.map((t) => (
            <DropdownMenuItem
              key={t.id}
              onSelect={(e) => {
                e.preventDefault();
                handleOpenChat(t);
              }}
              className={styles.askAiItem}
            >
              <div className={styles.askAiItemIcon}>
                <img
                  src={t.logo}
                  alt={t.name}
                  className={styles.askAiLogoImg}
                />
              </div>
              <div className={styles.askAiItemText}>
                <span className={styles.askAiItemTitle}>
                  {t.label}
                  <ExternalLink size={11} className="text-slate-400 ml-auto" />
                </span>
                <span className={styles.askAiItemSub}>{t.sub}</span>
              </div>
            </DropdownMenuItem>
          ))}

          <div className={styles.askAiSeparator} />
          <div className={styles.askAiMenuHeader}>Intégrations</div>

          <DropdownMenuItem asChild className={styles.askAiItem}>
            <a href={mcp} target="_blank" rel="noopener">
              <div className={styles.askAiItemIcon}>
                <Cpu size={13} strokeWidth={2} />
              </div>
              <div className={styles.askAiItemText}>
                <span className={styles.askAiItemTitle}>
                  Connecteur MCP
                  <ExternalLink size={11} className="text-slate-400 ml-auto" />
                </span>
                <span className={styles.askAiItemSub}>Serveur Model Context Protocol Viraill</span>
              </div>
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
