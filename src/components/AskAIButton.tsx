import React, { useState, useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Sparkles,
  ChevronDown,
  Copy,
  Check,
  FileText,
  ExternalLink,
  Cpu,
  Bot,
  Search,
} from 'lucide-react';
import styles from '../App.module.css';

/**
 * AskAIButton — pattern "LLM landing" (type Apify Store).
 * Bouton discret dans le header : ouvre un dropdown permettant à un visiteur
 * de se faire expliquer la page par une IA, de copier la page en Markdown pour LLM,
 * ou de récupérer la config MCP.
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

  const recLines = recommendations.length > 0
    ? recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')
    : `- Maintenir et enrichir les contenus sources à haute valeur ajoutée.`;

  const compLines = competitors.length > 0
    ? competitors.map((c) => `- ${c}`).join('\n')
    : `- Analyse concurrentielle en cours.`;

  return `# Rapport d'Audit GEO (Generative Engine Optimization) — ${domain || 'Site Web'}
*Date d'audit : ${date}*

---

## 1. Synthèse Globale
- **Score GEO Global** : ${geoScore} / 100
- **Total Citations IA** : ${totalCitations}
- **URL analysée** : ${url || 'N/A'}

---

## 2. Citations par Moteur LLM
${modelLines || '- Aucune citation spécifique détectée.'}

---

## 3. Recommandations Stratégiques Prioritaires
${recLines}

---

## 4. Concurrents Fréquemment Cités
${compLines}

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

  // URL pour les LLMs : on pointe vers /llms-full.txt
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
    <div className={`${styles.askAiWrapper} ${className}`.trim()}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Se faire expliquer cette page par une IA"
            className={`${styles.askAiButton} ${size === 'sm' ? styles.askAiButtonSm : ''}`}
          >
            <span className={styles.askAiIconBadge}>
              <Sparkles size={size === 'sm' ? 11 : 13} strokeWidth={2.2} />
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
                  <Sparkles size={13} strokeWidth={2} />
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
          <div className={styles.askAiMenuHeader}>Ouvrir dans un chatbot</div>

          {CHAT_TARGETS.map((t) => {
            const Icon = t.id === 'perplexity' ? Search : Bot;
            return (
              <DropdownMenuItem key={t.id} asChild className={styles.askAiItem}>
                <a
                  href={t.url(targetContent, defaultPrompt)}
                  target="_blank"
                  rel="noopener"
                >
                  <div className={styles.askAiItemIcon}>
                    <Icon size={13} strokeWidth={2} />
                  </div>
                  <div className={styles.askAiItemText}>
                    <span className={styles.askAiItemTitle}>
                      {t.label}
                      <ExternalLink size={11} className="text-slate-400 ml-auto" />
                    </span>
                    <span className={styles.askAiItemSub}>{t.sub}</span>
                  </div>
                </a>
              </DropdownMenuItem>
            );
          })}

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
