import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  Copy,
  Download,
  Archive,
  FileCode2,
  FileCode,
  FileText,
} from 'lucide-react';
import { AgenticRemediationPack } from '@/services/agenticService';

export interface RemediationFileMeta {
  title: string;
  protocol: string;
  protocolColor: string;
  path: string;
  description: string;
  type: 'json' | 'markdown' | 'text';
}

export const REMEDIATION_FILES_META: Record<string, RemediationFileMeta> = {
  'openapi.json': {
    title: 'openapi.json',
    protocol: 'OpenAPI 3.1',
    protocolColor: 'text-blue-600 bg-blue-500/10 border-blue-500/20 dark:text-blue-400',
    path: '/openapi.json',
    description: "Spécification d'API machine pour l'exécution d'actions autonomes.",
    type: 'json',
  },
  'agent.json': {
    title: 'agent.json',
    protocol: 'Protocole A2A',
    protocolColor: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400',
    path: '/.well-known/agent.json',
    description: "Carte d'identité et profil de capacités de votre agent inter-flottes.",
    type: 'json',
  },
  '.well-known/agent.json': {
    title: 'agent.json',
    protocol: 'Protocole A2A',
    protocolColor: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400',
    path: '/.well-known/agent.json',
    description: "Carte d'identité et profil de capacités de votre agent inter-flottes.",
    type: 'json',
  },
  'agentic-resources.json': {
    title: 'agentic-resources.json',
    protocol: 'Manifeste ARD',
    protocolColor: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/20 dark:text-indigo-400',
    path: '/.well-known/agentic-resources.json',
    description: 'Manifeste de découverte rapide pour indexation machine instantanée.',
    type: 'json',
  },
  '.well-known/agentic-resources.json': {
    title: 'agentic-resources.json',
    protocol: 'Manifeste ARD',
    protocolColor: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/20 dark:text-indigo-400',
    path: '/.well-known/agentic-resources.json',
    description: 'Manifeste de découverte rapide pour indexation machine instantanée.',
    type: 'json',
  },
  'pricing.json': {
    title: 'pricing.json',
    protocol: 'Règlement x402',
    protocolColor: 'text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400',
    path: '/pricing.json',
    description: 'Grille tarifaire et micro-paiements M2M (USDC Base / Stripe SPT).',
    type: 'json',
  },
  'llms.txt': {
    title: 'llms.txt',
    protocol: 'Standard LLMs',
    protocolColor: 'text-purple-600 bg-purple-500/10 border-purple-500/20 dark:text-purple-400',
    path: '/llms.txt',
    description: 'Index de navigation et instructions synthétiques pour crawlers LLM.',
    type: 'text',
  },
  'llms-full.txt': {
    title: 'llms-full.txt',
    protocol: 'Standard LLMs',
    protocolColor: 'text-purple-600 bg-purple-500/10 border-purple-500/20 dark:text-purple-400',
    path: '/llms-full.txt',
    description: 'Documentation exhaustive sans perte pour ingestion contextuelle.',
    type: 'text',
  },
  'skill.md': {
    title: 'skill.md',
    protocol: 'Skill Agentique',
    protocolColor: 'text-cyan-600 bg-cyan-500/10 border-cyan-500/20 dark:text-cyan-400',
    path: '/.agents/skills/index.md',
    description: 'Directives contextuelles et guide de procédure pour agents.',
    type: 'markdown',
  },
  'schema_org_product.json': {
    title: 'schema_org_product.json',
    protocol: 'Données Structurées',
    protocolColor: 'text-orange-600 bg-orange-500/10 border-orange-500/20 dark:text-orange-400',
    path: 'application/ld+json',
    description: 'Schéma sémantique structuré Schema.org pour entités et offres.',
    type: 'json',
  },
};

export function getFileMeta(fileKey: string): RemediationFileMeta {
  const normalizedKey = fileKey.replace(/^\.\//, '');
  const basename = normalizedKey.split('/').pop() || normalizedKey;

  if (REMEDIATION_FILES_META[normalizedKey]) {
    return REMEDIATION_FILES_META[normalizedKey];
  }
  if (REMEDIATION_FILES_META[basename]) {
    return REMEDIATION_FILES_META[basename];
  }

  if (basename.endsWith('.json')) {
    return {
      title: basename,
      protocol: 'Schéma Machine',
      protocolColor: 'text-blue-600 bg-blue-500/10 border-blue-500/20 dark:text-blue-400',
      path: `/${basename}`,
      description: 'Spécification machine au format JSON.',
      type: 'json',
    };
  }
  if (basename.endsWith('.md')) {
    return {
      title: basename,
      protocol: 'Guide / Skill',
      protocolColor: 'text-cyan-600 bg-cyan-500/10 border-cyan-500/20 dark:text-cyan-400',
      path: `/${basename}`,
      description: 'Instructions et guidage en Markdown structuré.',
      type: 'markdown',
    };
  }
  return {
    title: basename,
    protocol: 'Fichier Contexte',
    protocolColor: 'text-slate-600 bg-slate-500/10 border-slate-500/20 dark:text-slate-400',
    path: `/${basename}`,
    description: 'Ressource machine pour agents et modèles IA.',
    type: 'text',
  };
}

interface AgenticRemediationViewerProps {
  remediationPack?: AgenticRemediationPack;
  activeFile?: string;
  onActiveFileChange?: (fileKey: string) => void;
  brandName?: string;
}

export const AgenticRemediationViewer: React.FC<AgenticRemediationViewerProps> = ({
  remediationPack,
  activeFile,
  onActiveFileChange,
  brandName = 'plateforme',
}) => {
  const files = remediationPack?.files || {};
  const fileKeys = Object.keys(files);
  const defaultTab = fileKeys.length > 0 ? fileKeys[0] : 'openapi.json';

  const [internalTab, setInternalTab] = useState<string>(defaultTab);
  const [copied, setCopied] = useState<boolean>(false);

  // Sync activeTab avec props ou interne
  const currentTab = useMemo(() => {
    if (activeFile && fileKeys.includes(activeFile)) {
      return activeFile;
    }
    if (activeFile) {
      const match = fileKeys.find(
        (k) => k.endsWith(activeFile) || activeFile.endsWith(k) || k.includes(activeFile)
      );
      if (match) return match;
    }
    return fileKeys.includes(internalTab) ? internalTab : defaultTab;
  }, [activeFile, fileKeys, internalTab, defaultTab]);

  const selectTab = (key: string) => {
    setInternalTab(key);
    onActiveFileChange?.(key);
  };

  const currentContent = files[currentTab] || '// Fichier de remédiation en attente de génération.';
  const currentMeta = getFileMeta(currentTab);

  // Formatage joli si JSON
  const formattedContent = useMemo(() => {
    if (currentMeta.type === 'json') {
      try {
        return JSON.stringify(JSON.parse(currentContent), null, 2);
      } catch {
        return currentContent;
      }
    }
    return currentContent;
  }, [currentContent, currentMeta.type]);

  const lineCount = useMemo(() => {
    return formattedContent.split('\n').length;
  }, [formattedContent]);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = currentTab.split('/').pop() || 'remediation.txt';
    const blob = new Blob([formattedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    const packJson = JSON.stringify(files, null, 2);
    const blob = new Blob([packJson], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agentic-pack-${brandName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (fileKeys.length === 0) {
    return (
      <div className="p-8 text-center text-xs sm:text-sm text-muted-foreground rounded-2xl border border-border/80 bg-muted/20 font-sans">
        Aucun fichier de remédiation généré. Cliquez sur "Régénérer" pour préparer le pack machine.
      </div>
    );
  }

  return (
    <Card className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs font-sans">
      {/* ═══ Tabs Header (Ligne dédiée, noms complets sans coupure) ═══ */}
      <div className="flex items-center gap-1.5 p-2 bg-muted/20 border-b border-border/60 overflow-x-auto no-scrollbar">
        {fileKeys.map((fileKey) => {
          const isSelected = currentTab === fileKey;
          const meta = getFileMeta(fileKey);
          const basename = fileKey.split('/').pop() || fileKey;

          return (
            <button
              key={fileKey}
              type="button"
              onClick={() => selectTab(fileKey)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-card text-foreground font-semibold shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 font-medium'
              }`}
            >
              {meta.type === 'json' ? (
                <FileCode2 className="w-3.5 h-3.5 text-muted-foreground" />
              ) : meta.type === 'markdown' ? (
                <FileCode className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span>{basename}</span>
            </button>
          );
        })}
      </div>

      {/* ═══ Context & Actions Bar ═══ */}
      <div className="p-3 sm:px-4 sm:py-2.5 bg-card border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Metadata */}
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <Badge
            variant="outline"
            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${currentMeta.protocolColor}`}
          >
            {currentMeta.protocol}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <span className="text-[11px] text-muted-foreground/80">Emplacement :</span>
            <code className="px-1.5 py-0.5 rounded bg-muted/60 text-foreground font-medium text-[11px]">
              {currentMeta.path}
            </code>
          </div>
          <span className="text-xs text-muted-foreground hidden xl:inline truncate max-w-md">
            • {currentMeta.description}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="h-7 text-xs gap-1.5 px-2.5 rounded-lg border-border"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copié' : 'Copier'}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleDownload}
            className="h-7 text-xs gap-1.5 px-2.5 rounded-lg font-semibold shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Télécharger</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownloadAll}
            className="h-7 text-xs gap-1.5 px-2.5 rounded-lg text-muted-foreground hover:text-foreground"
            title="Télécharger l'ensemble des fichiers sous forme de pack JSON consolidé"
          >
            <Archive className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pack Complet</span>
          </Button>
        </div>
      </div>

      {/* ═══ Code Viewer Window ═══ */}
      <div className="relative bg-[#0d1117] dark:bg-[#070a0f] p-4 max-h-[480px] overflow-y-auto font-mono text-xs text-slate-200 leading-relaxed">
        <pre className="overflow-x-auto whitespace-pre-wrap break-all select-all font-mono">
          <code>{formattedContent}</code>
        </pre>
      </div>

      {/* ═══ Footer ═══ */}
      <div className="px-4 py-2 bg-muted/20 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
        <span className="truncate max-w-xs">{currentTab}</span>
        <span>
          {lineCount} lignes • {(formattedContent.length / 1024).toFixed(1)} Ko
        </span>
      </div>
    </Card>
  );
};
