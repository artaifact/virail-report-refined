import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Cpu, Layers, FileCode2 } from 'lucide-react';
import { runAgenticScan, AgenticScanResult } from '@/services/agenticService';
import { AgenticScoreGauge } from './AgenticScoreGauge';
import { AgenticPillarsView } from './AgenticPillarsView';
import { AgenticChannelsMatrix } from './AgenticChannelsMatrix';
import { AgenticRemediationViewer } from './AgenticRemediationViewer';
import { AgenticSkeletonLoader } from './AgenticSkeletonLoader';

interface AgenticTabContentProps {
  reportUrl?: string;
}

export const AgenticTabContent: React.FC<AgenticTabContentProps> = ({ reportUrl }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AgenticScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const targetUrl = reportUrl || 'https://stripe.com';

  const executeScan = async () => {
    if (!targetUrl) return;
    setLoading(true);
    setError(null);

    try {
      const data = await runAgenticScan(targetUrl, true);
      setResult(data);
    } catch (err: any) {
      console.error('[AgenticTabContent] Error:', err);
      setError(err.message || "Impossible de compléter l'audit agentique.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportUrl) {
      executeScan();
    }
  }, [reportUrl]);

  return (
    <div className="space-y-6 pt-1 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#1A3AFF]" />
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              Audit d'Éligibilité Machine & Protocoles Agentiques (M2M)
            </h3>
          </div>
          <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-1 max-w-2xl font-normal leading-relaxed">
            Vérification de la conformité de <span className="font-medium text-slate-700 dark:text-slate-300">{targetUrl}</span> face aux agents autonomes (Claude Code, Cursor, Perplexity, agents d'achats).
          </p>
        </div>

        <Button
          size="sm"
          onClick={executeScan}
          disabled={loading}
          className="gap-2 rounded-xl px-4 py-2 text-xs font-semibold bg-[#1A3AFF] hover:bg-[#1530D9] text-white shadow-sm transition-all h-auto flex-shrink-0 cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {loading ? 'Analyse en cours...' : 'Relancer l\'audit'}
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={executeScan}
            className="rounded-lg h-7 text-xs border border-rose-200 text-rose-700 bg-white hover:bg-rose-50"
          >
            Réessayer
          </Button>
        </div>
      )}

      {/* Skeleton Loading State */}
      {loading && (
        <AgenticSkeletonLoader />
      )}

      {/* Results content */}
      {!loading && result && (
        <div className="space-y-6">
          {/* Gauge Summary */}
          <AgenticScoreGauge score={result.score} targetUrl={result.target_url} />

          {/* 5 Pillars */}
          <div className="space-y-3">
            <h4 className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
              <Layers className="w-4 h-4 text-[#1A3AFF]" />
              Diagnostic des 5 Piliers d'Éligibilité Machine
            </h4>
            <AgenticPillarsView pillars={result.pillars} />
          </div>

          {/* 8 Channels Matrix */}
          <div className="space-y-3">
            <h4 className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
              <Cpu className="w-4 h-4 text-[#1A3AFF]" />
              Présence sur les 8 Canaux de Distribution Agentique
            </h4>
            <AgenticChannelsMatrix channelAudit={result.channel_audit} />
          </div>

          {/* Remediation Pack */}
          <div className="space-y-3">
            <h4 className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
              <FileCode2 className="w-4 h-4 text-[#1A3AFF]" />
              Pack de Remédiation Technique (Prêt au Déploiement)
            </h4>
            <AgenticRemediationViewer remediationPack={result.remediation_pack} />
          </div>
        </div>
      )}
    </div>
  );
};
