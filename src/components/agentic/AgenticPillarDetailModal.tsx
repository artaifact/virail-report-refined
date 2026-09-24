import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Code2,
  ShoppingCart,
  CreditCard,
  Network,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Info,
  Copy,
  Check,
} from 'lucide-react';
import { AgenticPillar } from '@/services/agenticService';

interface PillarConfigItem {
  id: string;
  title: string;
  shortTitle: string;
  desc: string;
  longDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  agentImpact: string;
  remediationSnippet?: {
    filename: string;
    description: string;
    code: string;
  };
}

export const PILLAR_DEFINITIONS: Record<string, PillarConfigItem> = {
  crawl_doc: {
    id: 'crawl_doc',
    title: '1. Ingestion & Documentation Machine',
    shortTitle: 'Ingestion & Docs',
    desc: '/llms.txt, route miroir .md, négociation Accept: text/markdown',
    longDesc:
      'Garantit que les modèles de langage et agents autonomes peuvent extraire la substantifique moelle de vos contenus sans saturer leur contexte en balisage HTML superflu.',
    icon: FileText,
    agentImpact:
      "Sans route /llms.txt ni documentation Markdown native, les agents d'IA (Claude Code, Cursor, Perplexity) consomment 10x plus de tokens pour parser le DOM et risquent d'abandonner l'analyse au profit d'un concurrent plus lisible.",
    remediationSnippet: {
      filename: '/llms.txt',
      description: 'Fichier standardisé à placer à la racine de votre domaine web.',
      code: `# Nom de votre Produit / Entreprise\n\n> Résumé concis en une phrase de ce que fait votre plateforme.\n\n## Documentation Clé\n- [Guide d'accès API](/api/docs.md): Référence complète des endpoints\n- [Grille Tarifaire](/api/pricing.json): Quotas, plans et prix machine\n- [Spécification OpenAPI](/openapi.json): Contrat d'interface typé\n\n## Directives Agents IA\n- Utilisez toujours les données structurées JSON exposées sur nos endpoints dédiés.\n- En-tête recommandé : 'Accept: text/markdown; charset=utf-8'`,
    },
  },
  json_interfaces: {
    id: 'json_interfaces',
    title: '2. Contrats & Interfaces de Données',
    shortTitle: 'Interfaces & API',
    desc: 'OpenAPI 3.1 publique typée, grille tarifaire /api/pricing.json',
    longDesc:
      'Met à disposition des agents des interfaces structurées et strictement typées pour qu’ils puissent exécuter des requêtes et interagir avec votre service de manière déterministe.',
    icon: Code2,
    agentImpact:
      "Les agents ont besoin de connaître exactement les paramètres d'entrée, les types et les schémas de retour. Une API sans spécification OpenAPI 3.1 accessible empêche l'agent de générer des appels de fonction fiables (Function Calling).",
    remediationSnippet: {
      filename: '/openapi.json',
      description: 'Contrat OpenAPI 3.1 minimum requis pour le function calling des agents.',
      code: `{\n  "openapi": "3.1.0",\n  "info": {\n    "title": "API Publique Agent-Ready",\n    "version": "1.0.0",\n    "description": "Interface typée pour consommation programmatique par agents autonomes"\n  },\n  "paths": {\n    "/api/pricing": {\n      "get": {\n        "summary": "Obtenir la grille tarifaire en temps réel",\n        "responses": {\n          "200": {\n            "description": "Succès",\n            "content": { "application/json": {} }\n          }\n        }\n      }\n    }\n  }\n}`,
    },
  },
  merchant_schema: {
    id: 'merchant_schema',
    title: '3. Achetabilité Sémantique',
    shortTitle: 'Sémantique Marchande',
    desc: 'Schema.org Product & Offer (JSON-LD) avec prix et devise',
    longDesc:
      "Balisage structuré JSON-LD explicite permettant aux agents d'achat autonomes d'extraire les prix, la disponibilité et les conditions sans ambiguïté.",
    icon: ShoppingCart,
    agentImpact:
      "Si le prix ou les conditions d'achat sont enfouis dans du texte non structuré ou rendus en JavaScript côté client, l'agent acheteur disqualifie votre offre lors de son comparatif automatisé.",
    remediationSnippet: {
      filename: 'schema-product.jsonld',
      description: 'Balisage JSON-LD à insérer dans le header HTML de vos pages produits.',
      code: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org/",\n  "@type": "Product",\n  "name": "Votre Service / Produit",\n  "description": "Description pour agents d'achat autonomes",\n  "offers": {\n    "@type": "Offer",\n    "price": "29.00",\n    "priceCurrency": "EUR",\n    "availability": "https://schema.org/InStock",\n    "url": "https://votre-domaine.com/pricing"\n  }\n}\n</script>`,
    },
  },
  m2m_settlement: {
    id: 'm2m_settlement',
    title: '4. Règlement M2M (Protocole x402)',
    shortTitle: 'Paiement M2M x402',
    desc: 'Handshake HTTP 402, rails de micro-paiement Base USDC (EIP-3009)',
    longDesc:
      'Permet à un agent autonome de payer instantanément pour une ressource ou une transaction sans passer par une carte bancaire humaine ou un formulaire 3D-Secure.',
    icon: CreditCard,
    agentImpact:
      "Les agents autonomes disposent de portefeuilles décentralisés ou de mandats de paiement programmatiques. Sans support du handshake HTTP 402 ou de token machine, toute transaction automatisée échoue immédiatement.",
    remediationSnippet: {
      filename: 'x402-manifest.json',
      description: 'Déclaration du protocole de règlement machine x402.',
      code: `{\n  "version": "1.0",\n  "protocol": "x402",\n  "payment_rails": [\n    {\n      "network": "base-mainnet",\n      "token": "USDC",\n      "scheme": "EIP-3009",\n      "destination": "0xYourCorporateWalletAddress"\n    }\n  ],\n  "endpoints": {\n    "challenge": "/api/v1/m2m-challenge",\n    "verify": "/api/v1/m2m-verify"\n  }\n}`,
    },
  },
  distribution_channels: {
    id: 'distribution_channels',
    title: '5. Canaux de Distribution',
    shortTitle: 'Canaux Décentralisés',
    desc: "Indexation sur les 8 registres et protocoles d'agents",
    longDesc:
      "Présence sur l'ensemble des protocoles de découverte machine (Anthropic MCP, Google A2A, ARD DNS, SKILL.md) pour être indexé dans les contextes d'agents.",
    icon: Network,
    agentImpact:
      "Si votre service n'est présent sur aucun registre agentique, il n'apparaît jamais dans les outils disponibles des développeurs et des utilisateurs utilisant Claude Code, Cursor ou ChatGPT Operator.",
    remediationSnippet: {
      filename: '/.well-known/agentic-resources.json',
      description: 'Manifeste ARD Discovery pour la découverte inter-agents.',
      code: `{\n  "schema_version": "2026.1",\n  "discovery": {\n    "llms_txt": "https://votre-domaine.com/llms.txt",\n    "openapi": "https://votre-domaine.com/openapi.json",\n    "agent_card": "https://votre-domaine.com/.well-known/agent.json"\n  }\n}`,
    },
  },
};

interface AgenticPillarDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPillarKey: string;
  onSelectPillar: (key: string) => void;
  pillars: Record<string, AgenticPillar | undefined>;
  onNavigateToRemediation?: (filename?: string) => void;
}

export const AgenticPillarDetailModal: React.FC<AgenticPillarDetailModalProps> = ({
  isOpen,
  onClose,
  selectedPillarKey,
  onSelectPillar,
  pillars,
  onNavigateToRemediation,
}) => {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [showSnippet, setShowSnippet] = useState(false);

  const pillarKeys = Object.keys(PILLAR_DEFINITIONS);
  const currentKey = PILLAR_DEFINITIONS[selectedPillarKey] ? selectedPillarKey : pillarKeys[0];
  const config = PILLAR_DEFINITIONS[currentKey];
  const pillar = pillars[currentKey] || { score: 0, max: 20, checks: [] };

  const currentIndex = pillarKeys.indexOf(currentKey);
  const prevKey = currentIndex > 0 ? pillarKeys[currentIndex - 1] : null;
  const nextKey = currentIndex < pillarKeys.length - 1 ? pillarKeys[currentIndex + 1] : null;

  const pct = Math.min(100, Math.round((pillar.score / (pillar.max || 1)) * 100));

  // Categorize checks
  const checks = pillar.checks || [];
  const okChecks = checks.filter(
    (c) => c.startsWith('✅') || c.includes('[OK]') || c.startsWith('+')
  );
  const warnChecks = checks.filter((c) => c.startsWith('⚠️') || c.includes('[WARN]'));
  const failChecks = checks.filter((c) => !okChecks.includes(c) && !warnChecks.includes(c));

  let statusBadgeText = 'Non Conforme';
  let statusBadgeVariant: 'destructive' | 'secondary' | 'default' = 'destructive';
  let progressColor = 'bg-rose-500';

  if (pct >= 70) {
    statusBadgeText = 'Conforme';
    statusBadgeVariant = 'default';
    progressColor = 'bg-emerald-500';
  } else if (pct >= 35) {
    statusBadgeText = 'Partiel';
    statusBadgeVariant = 'secondary';
    progressColor = 'bg-amber-500';
  }

  const Icon = config.icon;

  const handleCopySnippet = () => {
    if (config.remediationSnippet?.code) {
      navigator.clipboard.writeText(config.remediationSnippet.code);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-card text-foreground border border-border shadow-xl">
        {/* Navigation Tabs between 5 Pillars */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mr-8 sm:mr-10 border-b border-border/70 scrollbar-none">
          {pillarKeys.map((key) => {
            const pConf = PILLAR_DEFINITIONS[key];
            const pData = pillars[key] || { score: 0, max: 20 };
            const isSelected = key === currentKey;
            const pPct = Math.round((pData.score / (pData.max || 1)) * 100);

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onSelectPillar(key);
                  setShowSnippet(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>{pConf.shortTitle}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isSelected
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : pPct >= 70
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : pPct >= 35
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {pData.score}/{pData.max}
                </span>
              </button>
            );
          })}
        </div>

        {/* Modal Header */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <DialogTitle className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                  {config.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {config.desc}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border">
                {pillar.score} / {pillar.max} pts
              </span>
              <Badge variant={statusBadgeVariant} className="text-[10px] px-2 py-0.5">
                {statusBadgeText}
              </Badge>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${progressColor} transition-all duration-500`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Breakdown of Checks */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              Critères vérifiés ({checks.length})
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {okChecks.length} validé{okChecks.length > 1 ? 's' : ''}
              </span>
              {failChecks.length > 0 && (
                <span className="text-rose-600 dark:text-rose-400 font-medium">
                  {failChecks.length} bloquant{failChecks.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            {checks.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-3 text-center">
                Aucun critère disponible.
              </p>
            ) : (
              checks.map((chk, i) => {
                const isOk = chk.startsWith('✅') || chk.includes('[OK]') || chk.startsWith('+');
                const isWarn = chk.startsWith('⚠️') || chk.includes('[WARN]');
                const cleanText = chk.replace(/^([✅❌⚠️]|\[OK\]|\[FAIL\]|\[WARN\])\s*/gu, '').trim();

                return (
                  <div
                    key={i}
                    className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                      isOk
                        ? 'bg-emerald-500/5 border-emerald-500/15'
                        : isWarn
                        ? 'bg-amber-500/5 border-amber-500/15'
                        : 'bg-rose-500/5 border-rose-500/15'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isOk ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : isWarn ? (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      )}
                      <span
                        className={`truncate font-medium ${
                          isOk
                            ? 'text-foreground'
                            : isWarn
                            ? 'text-amber-800 dark:text-amber-300'
                            : 'text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {cleanText}
                      </span>
                    </div>

                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                        isOk
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : isWarn
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isOk ? 'VALIDÉ' : isWarn ? 'ATTENTION' : 'BLOQUANT'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Collapsible Code Remediation Snippet */}
        {config.remediationSnippet && (
          <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowSnippet(!showSnippet)}
                className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>
                  {showSnippet ? 'Masquer le code' : `Voir le template (${config.remediationSnippet.filename})`}
                </span>
              </button>

              {showSnippet && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopySnippet}
                  className="h-6 px-2 text-[11px] gap-1 cursor-pointer"
                >
                  {copiedSnippet ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedSnippet ? 'Copié' : 'Copier'}</span>
                </Button>
              )}
            </div>

            {showSnippet && (
              <pre className="p-2.5 rounded-lg bg-[#0b0f17] text-slate-200 font-mono text-[11px] overflow-x-auto max-h-36 whitespace-pre-wrap leading-relaxed">
                <code>{config.remediationSnippet.code}</code>
              </pre>
            )}
          </div>
        )}

        {/* Modal Footer with Previous / Next navigation and subtle Fermer button */}
        <div className="flex items-center justify-between pt-2 border-t border-border/80 text-xs">
          <div className="flex items-center gap-1">
            {prevKey && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onSelectPillar(prevKey);
                  setShowSnippet(false);
                }}
                className="h-7 text-xs gap-1 cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Pilier précédent</span>
              </Button>
            )}
            {nextKey && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onSelectPillar(nextKey);
                  setShowSnippet(false);
                }}
                className="h-7 text-xs gap-1 cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <span>Pilier suivant</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
