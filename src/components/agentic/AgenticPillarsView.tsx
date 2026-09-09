import React from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertCircle, FileText, Code2, ShoppingCart, CreditCard, Network } from 'lucide-react';
import { AgenticPillar } from '@/services/agenticService';

interface AgenticPillarsViewProps {
  pillars: Record<string, AgenticPillar | undefined>;
}

const PILLAR_CONFIG: Record<string, { title: string; desc: string; icon: any }> = {
  crawl_doc: {
    title: "1. Ingestion & Documentation Machine",
    desc: "/llms.txt, route miroir .md, négociation Accept: text/markdown",
    icon: FileText,
  },
  json_interfaces: {
    title: "2. Contrats & Interfaces de Données",
    desc: "OpenAPI 3.1 publique typée, grille tarifaire /api/pricing.json",
    icon: Code2,
  },
  merchant_schema: {
    title: "3. Achetabilité Sémantique",
    desc: "Schema.org Product & Offer (JSON-LD) avec prix et devise",
    icon: ShoppingCart,
  },
  m2m_settlement: {
    title: "4. Règlement M2M (Protocole x402)",
    desc: "Handshake HTTP 402, rails de micro-paiement Base USDC (EIP-3009)",
    icon: CreditCard,
  },
  distribution_channels: {
    title: "5. Canaux de Distribution",
    desc: "Indexation sur les 8 registres et protocoles d'agents",
    icon: Network,
  },
};

export const AgenticPillarsView: React.FC<AgenticPillarsViewProps> = ({ pillars }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
      {Object.entries(PILLAR_CONFIG).map(([key, config]) => {
        const pillar = pillars[key] || { score: 0, max: 20, checks: [] };
        const Icon = config.icon;
        const pct = Math.min(100, Math.round((pillar.score / (pillar.max || 1)) * 100));

        let progressColor = 'bg-rose-500';
        if (pct >= 70) progressColor = 'bg-emerald-500';
        else if (pct >= 40) progressColor = 'bg-amber-500';

        return (
          <Card
            key={key}
            className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between p-4 space-y-3"
          >
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-[#1A3AFF] dark:text-blue-400 flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                      {config.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug font-normal">
                      {config.desc}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex-shrink-0">
                  {pillar.score} / {pillar.max} pts
                </span>
              </div>

              {/* Progress */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full ${progressColor} transition-all duration-700 ease-out`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Checks */}
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-normal pt-1">
              {pillar.checks.map((chk, i) => {
                const isOk = chk.startsWith('✅') || chk.includes('[OK]') || chk.startsWith('+');
                const isWarn = chk.startsWith('⚠️') || chk.includes('[WARN]');
                const cleanText = chk.replace(/^([✅❌⚠️]|\[OK\]|\[FAIL\]|\[WARN\])\s*/gu, '').trim();

                return (
                  <li key={i} className="flex items-start gap-1.5 leading-snug">
                    {isOk ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    ) : isWarn ? (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={isOk ? 'text-slate-900 dark:text-slate-200 font-medium' : ''}>{cleanText}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}
    </div>
  );
};
