import React, { useEffect, useRef, useState, useMemo } from 'react';
import styles from '../App.module.css';

/**
 * AskAIButton — pattern "LLM landing" (type Apify Store).
 * Bouton ✨ dans le header : ouvre un dropdown permettant à un visiteur
 * de se faire expliquer la page par ChatGPT / Claude / Perplexity,
 * de copier la page en Markdown pour LLM, ou de récupérer la config MCP.
 *
 * Prérequis : une version Markdown de la page servie en .md (text/markdown).
 * Les deep-links passent l'URL du .md (pas le HTML) : les chatbots la fetchent
 * telle quelle, sans exécuter de JS.
 */

interface ChatTarget {
  id: string;
  label: string;
  sub: string;
  url: (md: string, prompt: string) => string;
}

const CHAT_TARGETS: ChatTarget[] = [
  {
    id: 'chatgpt',
    label: 'Ouvrir dans ChatGPT',
    sub: 'Demander à ChatGPT à propos de cette page',
    url: (md, prompt) =>
      `https://chatgpt.com/?q=${encodeURIComponent(`${prompt} ${md}`)}`,
  },
  {
    id: 'claude',
    label: 'Ouvrir dans Claude',
    sub: 'Demander à Claude à propos de cette page',
    url: (md, prompt) =>
      `https://claude.ai/new?q=${encodeURIComponent(`${prompt} ${md}`)}`,
  },
  {
    id: 'perplexity',
    label: 'Ouvrir dans Perplexity',
    sub: 'Demander à Perplexity à propos de cette page',
    url: (md, prompt) =>
      `https://www.perplexity.ai/search?q=${encodeURIComponent(`${prompt} ${md}`)}`,
  },
];

/**
 * Génère une version Markdown complète et structurée du rapport d'infos détaillées
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

  const date = reportData?.report?.created_at
    ? new Date(reportData.report.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('fr-FR');

  // Extraction du score GEO
  const raw = reportData;
  const directCandidates = [
    raw.target_geo_score,
    raw.report?.target_geo_score,
    raw.llmo_report?.target_geo_score,
    raw.metadata?.target_geo_score,
    raw.report?.metadata?.target_geo_score,
    raw.target_positioning?.target_geo_score,
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

  // Citations
  const totalCitations = reportData?.analyse_citation?.total_citations ?? 0;
  const citationsByModel = (reportData?.analyse_citation?.citations_by_model || {}) as Record<string, number>;

  // Piliers et recommandations
  const recommendations: string[] = [];
  if (Array.isArray(reportData?.analyses)) {
    reportData.analyses.forEach((a: any) => {
      const recs = a.modules?.audit_geo?.recommandations || a.modules?.audit_geo?.actions_recommandees;
      if (Array.isArray(recs)) {
        recs.forEach((r: any) => {
          const title = typeof r === 'string' ? r : (r.title || r.nom || r.action);
          if (title && !recommendations.includes(title)) recommendations.push(title);
        });
      }
    });
  }

  // Concurrents fréquemment cités
  const competitors: string[] = [];
  const cfm = reportData?.analyse_citation?.competitors_frequently_mentioned;
  if (Array.isArray(cfm)) {
    cfm.forEach((c: any) => {
      const name = typeof c === 'string' ? c : (c.domain || c.name || c.nom);
      if (name && !competitors.includes(name)) competitors.push(name);
    });
  }

  const modelLines = Object.entries(citationsByModel)
    .filter(([_, count]) => Number(count) > 0)
    .map(([model, count]) => `- **${model}** : ${count} citation(s)`)
    .join('\n');

  const recsLines = recommendations.slice(0, 6)
    .map((rec, i) => `${i + 1}. ${rec}`)
    .join('\n');

  const compLines = competitors.slice(0, 5)
    .map((comp) => `- ${comp}`)
    .join('\n');

  return `# Rapport d'Audit GEO & Visibilité IA — ${domain}

## 1. Synthèse Exécutive
- **Domaine audité** : ${url || domain}
- **Score GEO Global** : ${geoScore}/100
- **Volume de Citations Détectées** : ${totalCitations}
- **Date de l'audit** : ${date}

## 2. Citations par Moteur Génératif (LLM)
${modelLines || '- Aucune citation spécifique enregistrée.'}

## 3. Piliers d'Optimisation & Diagnostic Technique
- **Accessibilité Robots LLM** : Vérification des accès crawlers IA (GPTBot, ClaudeBot, PerplexityBot).
- **Balisage Sémantique & JSON-LD** : Présence de balisages Schema.org pour réponses directes.
- **Autorité Thématique & Entités** : Couverture sémantique et fraîcheur de l'information.

${recsLines ? `## 4. Recommandations Prioritaires (Plan d'Actions)\n${recsLines}\n` : ''}
${compLines ? `## 5. Concurrents Directement Cités dans les Moteurs IA\n${compLines}\n` : ''}
---
*Généré par Viraill — Plateforme d'analyse et d'optimisation GEO (Generative Engine Optimization).*
`;
}

interface AskAIButtonProps {
  markdownUrl?: string;
  prompt?: string;
  mcpConfigUrl?: string;
  origin?: string;
  reportData?: any;
}

export default function AskAIButton({
  markdownUrl,
  prompt,
  mcpConfigUrl,
  origin = 'https://viraill.com',
  reportData,
}: AskAIButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Fermer au clic extérieur et à Échap
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // URL pour les LLMs : on pointe vers /llms-full.txt (servi en text/plain, 100% compatible avec tous les crawlers de LLM)
  const md = markdownUrl || `${origin}/llms-full.txt`;

  // Génération dynamique du contenu Markdown du rapport d'infos détaillées
  const detailedMarkdown = useMemo(() => {
    return buildDetailedReportMarkdown(reportData);
  }, [reportData]);

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

  const defaultPrompt =
    prompt ||
    (reportData
      ? "Explique-moi ce rapport d'audit GEO en français, de façon factuelle et structurée. Voici son contenu en Markdown :"
      : "Explique-moi cette page en français, de façon factuelle et structurée. Voici son contenu en Markdown :");
  
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
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1400);
    } catch {
      // Clipboard indisponible : on ouvre au moins le .md ou le blob
      window.open(textBlobUrl || md, '_blank', 'noopener');
    }
  };

  // Pour les chatbots LLM, on transmet le prompt et la référence texte
  const targetContent = detailedMarkdown ? detailedMarkdown.slice(0, 1800) : md;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }} className={styles.askAiWrapper}>
      <button
        type="button"
        aria-label="Se faire expliquer cette page par une IA"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(!open)}
        className={styles.askAiButton}
      >
        <span aria-hidden="true">✨</span>
        <span className={styles.askAiLabel}>Expliquer par l'IA</span>
      </button>

      {open && (
        <div className={styles.askAiMenu} role="menu" aria-label="Expliquer cette page par une IA">
          <button type="button" role="menuitem" className={styles.askAiItem} onClick={copyForAI}>
            <span className={styles.askAiItemTitle}>
              {copied ? '✓ Copié en Markdown' : 'Copier la page pour un LLM'}
            </span>
            <span className={styles.askAiItemSub}>
              {copied ? 'Collez-le directement dans votre IA' : 'Format Markdown optimisé pour contexte IA'}
            </span>
          </button>

          <a
            role="menuitem"
            className={styles.askAiItem}
            href={textBlobUrl || md}
            target="_blank"
            rel="noopener"
          >
            <span className={styles.askAiItemTitle}>Voir la version texte (LLM)</span>
            <span className={styles.askAiItemSub}>Documentation complète /llms-full.txt ↗</span>
          </a>

          {CHAT_TARGETS.map((t) => (
            <a
              key={t.id}
              role="menuitem"
              className={styles.askAiItem}
              href={t.url(targetContent, defaultPrompt)}
              target="_blank"
              rel="noopener"
            >
              <span className={styles.askAiItemTitle}>{t.label}</span>
              <span className={styles.askAiItemSub}>{t.sub} ↗</span>
            </a>
          ))}

          <a role="menuitem" className={styles.askAiItem} href={mcp} target="_blank" rel="noopener">
            <span className={styles.askAiItemTitle}>Connecter via MCP</span>
            <span className={styles.askAiItemSub}>Installer le serveur @crypto-yannso/viraill-mcp ↗</span>
          </a>
        </div>
      )}
    </div>
  );
}
