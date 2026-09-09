import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Sparkles, Bot, ShieldCheck, ExternalLink } from 'lucide-react';
import { runAgenticScan, AgenticScanResult } from '@/services/agenticService';
import { AgenticScoreGauge } from './AgenticScoreGauge';
import { AgenticPillarsView } from './AgenticPillarsView';
import { AgenticChannelsMatrix } from './AgenticChannelsMatrix';
import { AgenticRemediationViewer } from './AgenticRemediationViewer';

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
      setError(err.message || 'Impossible de compléter le scan agentique.');
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
    <div className="space-y-6 pt-2">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Audit d'Éligibilité Machine & Protocoles Agentiques (M2M)
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Vérifiez si <strong>{targetUrl}</strong> est achetable, découvrable et recommandé par les flottes d'agents autonomes (Claude Code, Cursor, Perplexity, agents d'achats).
          </p>
        </div>

        <Button
          size="sm"
          onClick={executeScan}
          disabled={loading}
          className="gap-2 bg-primary text-primary-foreground shadow-sm hover:opacity-95 flex-shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {loading ? 'Analyse en cours...' : 'Relancer l\'audit'}
        </Button>
      </div>

      {/* Loading state */}
      {loading && !result && (
        <div className="py-16 text-center space-y-3 border rounded-2xl bg-card/40 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm font-medium text-foreground">Sondage des 5 piliers & des 8 canaux agentiques en cours...</p>
          <p className="text-xs text-muted-foreground">Test de /llms.txt, spécification OpenAPI 3.1, balises JSON-LD et protocole x402.</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={executeScan}>Réessayer</Button>
        </div>
      )}

      {/* Results content */}
      {result && (
        <div className="space-y-6">
          {/* Gauge Summary */}
          <AgenticScoreGauge score={result.score} targetUrl={result.target_url} />

          {/* 5 Pillars */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Diagnostic des 5 Piliers d'Éligibilité Machine
            </h3>
            <AgenticPillarsView pillars={result.pillars} />
          </div>

          {/* 8 Channels Matrix */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Présence sur les 8 Canaux de Distribution Agentique
            </h3>
            <AgenticChannelsMatrix channelAudit={result.channel_audit} />
          </div>

          {/* Remediation Pack */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Pack de Remédiation Clé en Main (Prêt au Déploiement)
              </h3>
            </div>
            <AgenticRemediationViewer remediationPack={result.remediation_pack} />
          </div>
        </div>
      )}
    </div>
  );
};
