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
  Check,
  Copy,
  Terminal,
  Boxes,
  Workflow,
  Globe,
  Sliders,
  GitBranch,
  CreditCard,
  FileCode,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Code,
  Bot,
} from 'lucide-react';

export interface ChannelDetail {
  id: string;
  num: string;
  name: string;
  protocolTitle: string;
  desc: string;
  fullExplanation: string;
  compatibleAgents: string[];
  protocolStandard: string;
  icon: React.ComponentType<{ className?: string }>;
  templateFilename: string;
  templateCode: string;
}

export const CHANNELS_FULL_CONFIG: Record<string, ChannelDetail> = {
  '1_agent_skills': {
    id: '1_agent_skills',
    num: '01',
    name: 'Agent Skills (SKILL.md)',
    protocolTitle: 'Format Universel de Compétences Agentiques',
    desc: 'Package npx skills add ou descripteur SKILL.md pour assistants de code.',
    fullExplanation:
      "Le standard SKILL.md permet d'étendre directement les capacités des assistants développeurs en leur fournissant un manuel d'utilisation concis, les commandes CLI, et les contrats d'API adaptés à leur fenêtre de contexte.",
    compatibleAgents: ['Claude Code', 'Cursor IDE', 'GitHub Copilot Workspace', 'Gemini CLI', 'Windsurf'],
    protocolStandard: 'Antigravity Skills Specification & Markdown Frontmatter v1.0',
    icon: Terminal,
    templateFilename: 'skills/votre-plateforme/SKILL.md',
    templateCode: `---
name: votre-service
description: Intégration officielle pour assistants de code et agents autonomes
version: 1.0.0
---

# Instructions pour les Agents IA
Lorsque le développeur vous demande d'interagir avec notre plateforme :
1. Vérifiez la présence de la variable d'environnement \`VOTRE_SERVICE_API_KEY\`
2. Pour requêter les données en temps réel :
   \`curl -s -H "Authorization: Bearer $VOTRE_SERVICE_API_KEY" https://api.votre-domaine.com/v1/search\`
3. Consultez la documentation machine complète sur \`https://votre-domaine.com/llms.txt\`
`,
  },
  '2_mcp_registry': {
    id: '2_mcp_registry',
    num: '02',
    name: 'Registres MCP (Anthropic)',
    protocolTitle: 'Model Context Protocol (MCP Server)',
    desc: 'Serveur Model Context Protocol pour Claude Desktop, Cursor et Smithery.',
    fullExplanation:
      "Le Model Context Protocol (MCP) est le standard ouvert d'Anthropic pour relier les modèles de langage à des sources de données et outils exécutables via JSON-RPC 2.0.",
    compatibleAgents: ['Claude Desktop', 'Cursor', 'Smithery.ai Registry', 'Zed', 'LangChain MCP Client'],
    protocolStandard: 'Anthropic Model Context Protocol (JSON-RPC 2.0 stdio / SSE)',
    icon: Boxes,
    templateFilename: 'claude_desktop_config.json',
    templateCode: `{
  "mcpServers": {
    "votre-service": {
      "command": "npx",
      "args": ["-y", "@votre-organisation/mcp-server"],
      "env": {
        "SERVICE_API_KEY": "VOTRE_CLE_API"
      }
    }
  }
}`,
  },
  '3_a2a_agent_card': {
    id: '3_a2a_agent_card',
    num: '03',
    name: 'Protocole Google A2A',
    protocolTitle: 'Agent Card Inter-Agents Standardisée',
    desc: 'Agent Card standardisée sur /.well-known/agent.json pour échanges inter-agents.',
    fullExplanation:
      "Le protocole Agent-to-Agent (A2A) permet à deux agents autonomes de se découvrir, d'échanger leurs capacités et de se déléguer des sous-tâches sans intervention humaine.",
    compatibleAgents: ['Google Gemini Agents', 'Orchestrateurs M2M', 'AutoGPT Network', 'CrewAI M2M'],
    protocolStandard: 'A2A Discovery Specification RFC-2026 (/.well-known/agent.json)',
    icon: Workflow,
    templateFilename: '/.well-known/agent.json',
    templateCode: `{
  "$schema": "https://a2a-protocol.org/schemas/v1/agent.json",
  "name": "Service Agentic Endpoint",
  "description": "Agent d'accès automatisé aux services et catalogue",
  "version": "2026.1",
  "endpoints": {
    "tasks": "https://api.votre-domaine.com/m2m/tasks",
    "status": "https://api.votre-domaine.com/m2m/status"
  },
  "capabilities": ["search", "quotation", "instant_checkout"]
}`,
  },
  '4_ard_discovery': {
    id: '4_ard_discovery',
    num: '04',
    name: 'ARD Discovery (DNS IA)',
    protocolTitle: 'Agentic Resource Discovery (ARD via DNS & Well-Known)',
    desc: 'Déclaration DNS des ressources sur /.well-known/agentic-resources.json.',
    fullExplanation:
      'ARD permet aux crawlers d’IA et moteurs de recherche autonomes d’identifier immédiatement où se situent les schémas d’API, la documentation Markdown et les points d’entrée machines.',
    compatibleAgents: ['Perplexity Pro', 'OpenAI Operator', 'Crawlers sémantiques 2026', 'DeepSeek Search'],
    protocolStandard: 'DNS TXT Record & RFC /.well-known/agentic-resources.json',
    icon: Globe,
    templateFilename: '/.well-known/agentic-resources.json',
    templateCode: `{
  "agentic_version": "2026.1",
  "discovery": {
    "llms_txt": "https://votre-domaine.com/llms.txt",
    "openapi": "https://votre-domaine.com/openapi.json",
    "agent_card": "https://votre-domaine.com/.well-known/agent.json",
    "pricing": "https://votre-domaine.com/api/pricing.json"
  }
}`,
  },
  '5_prompt_wizard': {
    id: '5_prompt_wizard',
    num: '05',
    name: 'Zero-Config Prompts',
    protocolTitle: 'Prompts Systèmes Universels Prêts à l’Emploi',
    desc: 'Prompts prêts à coller dans Claude Code / Cursor sans documentation.',
    fullExplanation:
      "Permet aux utilisateurs finaux de brancher instantanément votre plateforme dans leur assistant favori (ChatGPT, Claude, Mistral) sans écrire de code d'intégration.",
    compatibleAgents: ['ChatGPT Custom GPTs', 'Claude Projects', 'Mistral Le Chat', 'Poe Bots'],
    protocolStandard: 'One-Click Prompt Injection & Structured Tool Contract',
    icon: Sliders,
    templateFilename: 'system-prompt.txt',
    templateCode: `Tu es l'agent officiel connecté à [Votre Marque].
Pour toute demande de recherche ou d'achat :
1. Interroge toujours l'API publique en lecture directe :
   GET https://api.votre-domaine.com/v1/search?q={query}
2. Formate toujours les résultats avec les liens profonds fournis et les prix TTC en vigueur.
3. En cas de commande, redirige vers le token d'achat instantané retourné par l'API.`,
  },
  '6_awesome_lists': {
    id: '6_awesome_lists',
    num: '06',
    name: 'Awesome Lists GitHub',
    protocolTitle: 'Indexation dans les Répertoires RAG Open-Source',
    desc: 'Indexation sur les répertoires GitHub constituant le corpus RAG des LLMs.',
    fullExplanation:
      'Les répertoires "Awesome" sur GitHub sont massivement absorbés par les crawlers de pré-entraînement et les bases vectorielles des modèles. Y figurer garantit une mémorisation organique par les IA.',
    compatibleAgents: ['Copilot', 'Cursor Composer', 'DeepSeek Coder', 'Modèles Open-Weights (Llama, Mistral)'],
    protocolStandard: 'GitHub Markdown Curation & Structured Awesome Taxonomies',
    icon: GitBranch,
    templateFilename: 'awesome-entry.md',
    templateCode: `### Outils & Intégrations M2M
- [Votre Service](https://votre-domaine.com) - Plateforme de référence compatible agents M2M avec support natif /llms.txt, spécification OpenAPI 3.1 et serveur MCP.`,
  },
  '7_bazaar_x402': {
    id: '7_bazaar_x402',
    num: '07',
    name: 'Bazaars On-Chain',
    protocolTitle: 'Enregistrement sur x402scan & Coinbase CDP Bazaar',
    desc: 'Enregistrement sur x402scan et CDP Bazaar pour transactions autonomes USDC.',
    fullExplanation:
      "Les répertoires décentralisés d'APIs payables via le protocole HTTP 402 permettent aux agents crypto autonomes de payer à la requête en micro-transactions stables (USDC sur Base).",
    compatibleAgents: ['Coinbase AgentKit', 'x402 Autonomous Bots', 'Farcaster Frames Agents', 'DeFi Arbitrage Bots'],
    protocolStandard: 'HTTP 402 Payment Required & EIP-3009 TransferWithAuthorization',
    icon: CreditCard,
    templateFilename: 'x402-bazaar-config.json',
    templateCode: `{
  "protocol": "x402",
  "network": "base-mainnet",
  "settlement": "USDC",
  "min_payment": "0.005",
  "receiver_wallet": "0xYourWalletAddressHere",
  "status_endpoint": "/api/v1/x402/health"
}`,
  },
  '8_inrepo_contexts': {
    id: '8_inrepo_contexts',
    num: '08',
    name: 'In-Repo Rules (.cursorrules)',
    protocolTitle: 'Templates de Contextes Embarqués (.cursorrules & AGENTS.md)',
    desc: 'Templates AGENTS.md ou .cursorrules documentés pour les projets clients.',
    fullExplanation:
      "En fournissant des fichiers de règles prêts à glisser dans les dépôts de vos clients, vous vous assurez que les assistants de code génèrent toujours un code propre et compatible avec vos dernières APIs.",
    compatibleAgents: ['Cursor', 'Windsurf', 'Claude Code', 'GitHub Copilot Workspace'],
    protocolStandard: '.cursorrules, .rules, and AGENTS.md In-Repo Specifications',
    icon: FileCode,
    templateFilename: '.cursorrules',
    templateCode: `# Instructions pour les assistants de développement
Quand vous travaillez avec l'API [Votre Marque] :
- Ne générez jamais d'URLs d'API obsolètes : utilisez toujours la v1 sur https://api.votre-domaine.com
- Référez-vous au fichier https://votre-domaine.com/llms.txt pour la signature exacte des types
- Respectez les quotas de débit de 100 req/min`,
  },
};

interface AgenticChannelDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedChannelId: string;
  onSelectChannel: (channelId: string) => void;
  channelAudit: Record<string, boolean>;
}

export const AgenticChannelDetailModal: React.FC<AgenticChannelDetailModalProps> = ({
  isOpen,
  onClose,
  selectedChannelId,
  onSelectChannel,
  channelAudit,
}) => {
  const [copied, setCopied] = useState(false);

  const channelKeys = Object.keys(CHANNELS_FULL_CONFIG);
  const currentKey = CHANNELS_FULL_CONFIG[selectedChannelId] ? selectedChannelId : channelKeys[0];
  const channel = CHANNELS_FULL_CONFIG[currentKey];
  const isActive = Boolean(channelAudit[currentKey]);

  const currentIndex = channelKeys.indexOf(currentKey);
  const prevKey = currentIndex > 0 ? channelKeys[currentIndex - 1] : null;
  const nextKey = currentIndex < channelKeys.length - 1 ? channelKeys[currentIndex + 1] : null;

  const Icon = channel.icon;

  const handleCopy = () => {
    navigator.clipboard.writeText(channel.templateCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 bg-card text-foreground border border-border shadow-xl">
        {/* Navigation Tabs for all 8 channels */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mr-8 sm:mr-10 border-b border-border/70 scrollbar-none">
          {channelKeys.map((key) => {
            const ch = CHANNELS_FULL_CONFIG[key];
            const active = Boolean(channelAudit[key]);
            const isSelected = key === currentKey;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectChannel(key)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span className="font-mono text-[10px] opacity-75">{ch.num}</span>
                <span className="truncate max-w-[120px]">{ch.name.split('(')[0]}</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    active ? 'bg-emerald-400' : 'bg-slate-400 opacity-60'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Modal Header */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground font-bold">
                    CANAL {channel.num}
                  </span>
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                    {channel.name}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {channel.protocolTitle}
                </DialogDescription>
              </div>
            </div>

            <Badge
              variant={isActive ? 'default' : 'secondary'}
              className={`text-xs px-2.5 py-1 h-auto font-medium self-start sm:self-center flex items-center gap-1.5 ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-muted text-muted-foreground border border-border'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {isActive ? 'CANAL ACTIF' : 'CANAL INACTIF'}
            </Badge>
          </div>
        </div>

        {/* Explication & Rôle Stratégique */}
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Rôle stratégique pour les agents autonomes</span>
          </h4>
          <p className="text-xs text-foreground/85 leading-relaxed font-normal">
            {channel.fullExplanation}
          </p>
        </div>

        {/* Compatible Agents & Protocol Spec Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-border bg-card p-3 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
              <Bot className="w-3.5 h-3.5 text-primary" />
              <span>Agents & Écosystèmes cibles</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {channel.compatibleAgents.map((agent) => (
                <span
                  key={agent}
                  className="px-2 py-0.5 rounded-md bg-muted text-foreground text-[11px] font-medium border border-border/60"
                >
                  {agent}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
              <Code className="w-3.5 h-3.5 text-primary" />
              <span>Standard & Protocole</span>
            </div>
            <p className="text-[11.5px] text-muted-foreground font-mono leading-snug">
              {channel.protocolStandard}
            </p>
          </div>
        </div>

        {/* Implementation snippet ready to copy */}
        <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">
                Template d'implémentation prêt à déployer
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
                {channel.templateFilename}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-7 text-xs gap-1.5 px-2.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié' : 'Copier le code'}</span>
            </Button>
          </div>

          <pre className="p-3 rounded-lg bg-[#0b0f17] text-slate-200 font-mono text-[11px] overflow-x-auto max-h-52 whitespace-pre-wrap leading-relaxed">
            <code>{channel.templateCode}</code>
          </pre>
        </div>

        {/* Modal Footer with Previous / Next navigation and subtle Fermer button */}
        <div className="flex items-center justify-between pt-3 border-t border-border/80 text-xs">
          <div className="flex items-center gap-2">
            {prevKey && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectChannel(prevKey)}
                className="h-8 text-xs gap-1 cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Canal précédent</span>
              </Button>
            )}
            {nextKey && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectChannel(nextKey)}
                className="h-8 text-xs gap-1 cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <span>Canal suivant</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
