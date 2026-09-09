import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Search,
  Loader2,
  Cpu,
  Layers,
  CreditCard,
  FileCode2,
} from 'lucide-react';
import { runAgenticScan, getX402Manifest, AgenticScanResult } from '@/services/agenticService';
import { AgenticScoreGauge } from '@/components/agentic/AgenticScoreGauge';
import { AgenticPillarsView } from '@/components/agentic/AgenticPillarsView';
import { AgenticChannelsMatrix } from '@/components/agentic/AgenticChannelsMatrix';
import { AgenticRemediationViewer } from '@/components/agentic/AgenticRemediationViewer';
import { AgenticSkeletonLoader } from '@/components/agentic/AgenticSkeletonLoader';

const PRESETS = [
  { name: 'Stripe', url: 'https://stripe.com' },
  { name: 'Resend', url: 'https://resend.com' },
  { name: 'Cloudflare', url: 'https://cloudflare.com' },
  { name: 'Shopify', url: 'https://shopify.com' },
];

export default function AgenticCockpit() {
  const [url, setUrl] = useState<string>('https://stripe.com');
  const [remediate, setRemediate] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AgenticScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // x402 live test
  const [x402Loading, setX402Loading] = useState<boolean>(false);
  const [x402Output, setX402Output] = useState<string | null>(null);

  const handleScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await runAgenticScan(url.trim(), remediate);
      setResult(data);
    } catch (err: any) {
      console.error('[AgenticCockpit] Scan error:', err);
      setError(err.message || "Erreur lors de l'exécution de l'audit agentique.");
    } finally {
      setLoading(false);
    }
  };

  const handleTestX402 = async () => {
    setX402Loading(true);
    setX402Output('Connexion aux protocoles de règlement machine x402...');
    try {
      const data = await getX402Manifest();
      setX402Output(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setX402Output(`Erreur handshake x402 : ${err.message}`);
    } finally {
      setX402Loading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl space-y-6 font-sans">
      {/* Top Banner */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/40 text-xs font-semibold text-[#1A3AFF] dark:text-blue-400">
            <Cpu className="w-3.5 h-3.5" />
            <span>Audit d'Éligibilité Machine & Protocoles Agentiques (M2M)</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Cockpit d'Éligibilité & Distribution <span className="text-[#1A3AFF]">Agentique</span>
          </h1>

          <p className="text-xs sm:text-[13.5px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
            Auditez la découvrabilité et l'achetabilité machine de votre plateforme face aux agents autonomes (Claude Code, Cursor, Perplexity, agents d'achat).
            Détectez les risques de <strong className="font-semibold text-slate-700 dark:text-slate-300">disqualification silencieuse</strong> sur les 5 piliers et générez le pack de remédiation technique instantané.
          </p>
        </div>
      </div>

      {/* Control Card */}
      <Card className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardContent className="p-4 sm:p-5 space-y-3.5">
          <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Entrez l'URL à auditer (ex: https://votre-saas.com)"
                required
                className="pl-10 h-11 text-xs sm:text-sm font-mono bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-11 px-6 rounded-xl font-semibold text-xs sm:text-[13px] bg-[#1A3AFF] hover:bg-[#1530D9] text-white shadow-sm transition-all gap-2 flex-shrink-0 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              {loading ? 'Audit en cours...' : 'Lancer l\'audit agentique'}
            </Button>
          </form>

          {/* Quick Presets & Remediate Switch */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 text-xs font-medium">Exemples rapides :</span>
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setUrl(p.url)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-white text-slate-600 hover:text-slate-900 transition-all font-medium text-xs cursor-pointer dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {p.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="toggle-remediate"
                checked={remediate}
                onCheckedChange={setRemediate}
              />
              <Label htmlFor="toggle-remediate" className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer font-normal">
                Générer le Pack de Remédiation
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error display */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleScan()}
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

      {/* Results View */}
      {result && !loading && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Gauge Summary */}
          <AgenticScoreGauge score={result.score} targetUrl={result.target_url} />

          {/* 5 Pillars */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
              <Layers className="w-4 h-4 text-[#1A3AFF]" />
              Diagnostic Opérationnel sur les 5 Piliers d'Éligibilité
            </h3>
            <AgenticPillarsView pillars={result.pillars} />
          </div>

          {/* 8 Channels Matrix */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
              <Cpu className="w-4 h-4 text-[#1A3AFF]" />
              Matrice de Présence sur les 8 Canaux de Distribution Agentique
            </h3>
            <AgenticChannelsMatrix channelAudit={result.channel_audit} />
          </div>

          {/* Remediation Pack */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
              <FileCode2 className="w-4 h-4 text-[#1A3AFF]" />
              Pack de Remédiation Technique Clé en Main
            </h3>
            <AgenticRemediationViewer remediationPack={result.remediation_pack} />
          </div>

          {/* x402 Playground */}
          <Card className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <div>
                <h4 className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
                  <CreditCard className="w-4 h-4 text-[#1A3AFF]" />
                  Banc d'Essai du Handshake x402 (Micro-Paiements Machine Base USDC)
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                  Visualisez comment un agent autonome reçoit le challenge HTTP 402 et exécute son paiement M2M.
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleTestX402}
                disabled={x402Loading}
                className="rounded-lg px-3 py-1.5 text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-all gap-2 h-auto dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {x402Loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                Tester le Handshake Live
              </Button>
            </div>

            {x402Output && (
              <pre className="bg-[#0b0f17] p-4 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto max-h-52 whitespace-pre-wrap">
                <code>{x402Output}</code>
              </pre>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
