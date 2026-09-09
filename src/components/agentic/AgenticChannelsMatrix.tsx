import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Terminal, Boxes, Workflow, Globe, Sliders, GitBranch, CreditCard, FileCode } from 'lucide-react';

interface AgenticChannelsMatrixProps {
  channelAudit: Record<string, boolean>;
}

const CHANNELS_DATA = [
  {
    id: '1_agent_skills',
    num: '01',
    name: 'Agent Skills (SKILL.md)',
    desc: 'Package npx skills add ou descripteur SKILL.md pour assistants de code.',
    icon: Terminal,
  },
  {
    id: '2_mcp_registry',
    num: '02',
    name: 'Registres MCP (Anthropic)',
    desc: 'Serveur Model Context Protocol pour Claude Desktop, Cursor et Smithery.',
    icon: Boxes,
  },
  {
    id: '3_a2a_agent_card',
    num: '03',
    name: 'Protocole Google A2A',
    desc: 'Agent Card standardisée sur /.well-known/agent.json pour échanges inter-agents.',
    icon: Workflow,
  },
  {
    id: '4_ard_discovery',
    num: '04',
    name: 'ARD Discovery (DNS IA)',
    desc: 'Déclaration DNS des ressources sur /.well-known/agentic-resources.json.',
    icon: Globe,
  },
  {
    id: '5_prompt_wizard',
    num: '05',
    name: 'Zero-Config Prompts',
    desc: 'Prompts prêts à coller dans Claude Code / Cursor sans documentation.',
    icon: Sliders,
  },
  {
    id: '6_awesome_lists',
    num: '06',
    name: 'Awesome Lists GitHub',
    desc: 'Indexation sur les répertoires GitHub constituant le corpus RAG des LLMs.',
    icon: GitBranch,
  },
  {
    id: '7_bazaar_x402',
    num: '07',
    name: 'Bazaars On-Chain',
    desc: 'Enregistrement sur x402scan et CDP Bazaar pour transactions autonomes USDC.',
    icon: CreditCard,
  },
  {
    id: '8_inrepo_contexts',
    num: '08',
    name: 'In-Repo Rules (.cursorrules)',
    desc: 'Templates AGENTS.md ou .cursorrules documentés pour les projets clients.',
    icon: FileCode,
  },
];

export const AgenticChannelsMatrix: React.FC<AgenticChannelsMatrixProps> = ({ channelAudit }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-sans">
      {CHANNELS_DATA.map((ch) => {
        const isActive = Boolean(channelAudit[ch.id]);
        const Icon = ch.icon;

        return (
          <Card
            key={ch.id}
            className={`rounded-xl border p-3.5 transition-all duration-200 shadow-sm flex flex-col justify-between ${
              isActive
                ? 'border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/40 dark:bg-emerald-950/10'
                : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500 tracking-wider">
                  CANAL {ch.num}
                </span>
                <Badge
                  variant={isActive ? 'default' : 'secondary'}
                  className={`text-[10px] px-2 py-0.5 h-auto font-medium rounded-md flex items-center gap-1 ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700'
                  }`}
                >
                  {isActive ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                  {isActive ? 'ACTIF' : 'INACTIF'}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate tracking-tight">
                  {ch.name}
                </h5>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal font-normal mt-2">
              {ch.desc}
            </p>
          </Card>
        );
      })}
    </div>
  );
};
