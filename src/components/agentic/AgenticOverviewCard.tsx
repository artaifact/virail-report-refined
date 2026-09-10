import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Cpu,
  FileText,
  Code2,
  ShoppingBag,
  CreditCard,
  Share2,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { FullReportData } from '@/lib/api';
import { getLatestAgenticAudit, AgenticPillar } from '@/services/agenticService';
import { extractAgenticScore } from '@/pages/Index';

interface AgenticOverviewCardProps {
  reportData: FullReportData | null;
  agenticScore?: number | null;
}

export const AgenticOverviewCard: React.FC<AgenticOverviewCardProps> = ({
  reportData,
  agenticScore: propScore,
}) => {
  const navigate = useNavigate();
  const [asyncAudit, setAsyncAudit] = useState<any | null>(null);

  const directScore = extractAgenticScore(reportData);
  const effectiveScore = propScore ?? directScore ?? asyncAudit?.score ?? 42;
  const normalizedScore = Math.max(0, Math.min(100, Math.round(effectiveScore)));

  // Récupérer l'URL cible
  const targetUrl = useMemo(() => {
    return (
      (reportData as any)?.report?.url ||
      (reportData as any)?.llmo_report?.url ||
      (reportData as any)?.url ||
      (reportData as any)?.analyse_citation?.client_site_url ||
      ''
    );
  }, [reportData]);

  // Charger les données de piliers depuis le rapport ou la BDD
  useEffect(() => {
    let isMounted = true;
    const scanData = (reportData as any)?.agentic_scan || (reportData as any)?.agentic_readiness;
    if (scanData?.pillars) {
      setAsyncAudit(scanData);
      return;
    }

    if (targetUrl) {
      getLatestAgenticAudit(targetUrl)
        .then((data) => {
          if (isMounted && data) {
            setAsyncAudit(data);
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [reportData, targetUrl]);

  // Données des 5 piliers
  const pillars = useMemo(() => {
    const rawPillars =
      asyncAudit?.pillars ||
      (reportData as any)?.agentic_scan?.pillars ||
      (reportData as any)?.agentic_readiness?.pillars;

    if (rawPillars && Object.keys(rawPillars).length > 0) {
      return {
        crawl_doc: rawPillars.crawl_doc || { score: 12, max: 20 },
        json_interfaces: rawPillars.json_interfaces || { score: 15, max: 20 },
        merchant_schema: rawPillars.merchant_schema || { score: 10, max: 20 },
        m2m_settlement: rawPillars.m2m_settlement || { score: 0, max: 25 },
        distribution_channels: rawPillars.distribution_channels || { score: 5, max: 15 },
      };
    }

    // Fallback équilibré selon le score global
    const ratio = normalizedScore / 100;
    return {
      crawl_doc: { score: Math.round(ratio * 20), max: 20 },
      json_interfaces: { score: Math.round(ratio * 20), max: 20 },
      merchant_schema: { score: Math.round(ratio * 20), max: 20 },
      m2m_settlement: { score: normalizedScore >= 80 ? 20 : 0, max: 25 },
      distribution_channels: { score: Math.round(ratio * 15), max: 15 },
    };
  }, [asyncAudit, reportData, normalizedScore]);

  // Statut visuel
  let statusLabel = 'Non Conforme (Disqualification)';
  let statusBadgeVariant = 'destructive' as const;
  let statusBg = 'rgba(244, 63, 94, 0.1)';
  let statusColor = '#e11d48';

  if (normalizedScore >= 80) {
    statusLabel = 'Agentic Native (M2M Ready)';
    statusBadgeVariant = 'default' as const;
    statusBg = 'rgba(16, 185, 129, 0.1)';
    statusColor = '#059669';
  } else if (normalizedScore >= 50) {
    statusLabel = 'Agent-Friendly (Partiel)';
    statusBadgeVariant = 'secondary' as const;
    statusBg = 'rgba(245, 158, 11, 0.1)';
    statusColor = '#d97706';
  }

  const pillarItems = [
    {
      id: 'crawl_doc',
      name: 'Ingestion & Docs IA',
      sub: '/llms.txt & robots.txt',
      icon: FileText,
      data: pillars.crawl_doc,
    },
    {
      id: 'json_interfaces',
      name: 'Interfaces Données',
      sub: 'OpenAPI 3.1 & REST',
      icon: Code2,
      data: pillars.json_interfaces,
    },
    {
      id: 'merchant_schema',
      name: 'Achetabilité Machine',
      sub: 'Schema.org Prix/Offre',
      icon: ShoppingBag,
      data: pillars.merchant_schema,
    },
    {
      id: 'm2m_settlement',
      name: 'Règlement M2M',
      sub: 'x402 Base USDC & SPT',
      icon: CreditCard,
      data: pillars.m2m_settlement,
    },
    {
      id: 'distribution_channels',
      name: 'Distribution Agents',
      sub: 'A2A, ARD & MCP Registry',
      icon: Share2,
      data: pillars.distribution_channels,
    },
  ];

  return (
    <Card className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden font-sans mb-5">
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Header Carte KPI */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-[#1A3AFF] dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Éligibilité Agentique & Commerce Machine (M2M)
                </h3>
                <Badge
                  variant={statusBadgeVariant}
                  className="px-2 py-0.5 text-[11px] font-semibold rounded-md border"
                  style={{
                    backgroundColor: statusBg,
                    color: statusColor,
                    borderColor: statusColor + '40',
                  }}
                >
                  {statusLabel}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Capacité de vos services à être découverts, recommandés et achetés de manière autonome par les flottes d'agents IA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight" style={{ color: statusColor }}>
                {normalizedScore}
              </span>
              <span className="text-xs font-semibold text-slate-400 font-mono">/100</span>
            </div>

            <Button
              size="sm"
              onClick={() => navigate('/agentic')}
              className="h-8 text-xs font-semibold rounded-lg bg-[#1A3AFF] hover:bg-[#1530D9] text-white gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <span>Cockpit Agentique</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Les 5 Mini-Barres de Progression */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {pillarItems.map((item) => {
            const Icon = item.icon;
            const score = item.data?.score ?? 0;
            const max = item.data?.max ?? 20;
            const pct = Math.min(100, Math.max(0, Math.round((score / max) * 100)));

            const barColor =
              pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500';
            const textColor =
              pct >= 70 ? 'text-emerald-700 dark:text-emerald-400' : pct >= 40 ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400';

            return (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between gap-2.5 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Icon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                  <span className={`text-xs font-mono font-bold ${textColor} flex-shrink-0`}>
                    {score}/{max}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[10.5px] text-slate-400 dark:text-slate-500 font-mono truncate">
                    {item.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
