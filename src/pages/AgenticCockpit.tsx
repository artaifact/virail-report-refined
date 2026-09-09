import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Zap,
  Search,
  Loader2,
  Sparkles,
  Bot,
  ShieldAlert,
  Coins,
  ArrowRight,
  Terminal,
} from 'lucide-react';
import { runAgenticScan, getX402Manifest, AgenticScanResult } from '@/services/agenticService';
import { AgenticScoreGauge } from '@/components/agentic/AgenticScoreGauge';
import { AgenticPillarsView } from '@/components/agentic/AgenticPillarsView';
import { AgenticChannelsMatrix } from '@/components/agentic/AgenticChannelsMatrix';
import { AgenticRemediationViewer } from '@/components/agentic/AgenticRemediationViewer';

const PRESETS = [
  { name: 'Stripe', url: 'https://stripe.com' },
  { name: 'OpenAI', url: 'https://openai.com' },
  { name: 'Anthropic', url: 'https://anthropic.com' },
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'Viraill Core', url: 'https://viraill-core-api.fly.dev' },
];

export default function AgenticCockpit() {
  const [url, setUrl] = useState<string>('https://stripe.com');
  const [remediate, setRemediate] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AgenticScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // x402 simulator state
  const [x402Output, setX402Output] = useState<string | null>(null);
  const [x402Loading, setX402Loading] = useState<boolean>(false);

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
      setError(err.message || 'Erreur lors du scan agentique.');
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
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-background to-secondary/10 border border-border p-8">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-xs font-bold text-primary">
            <Bot className="w-3.5 h-3.5" />
            <span>AGENTIC COMMERCE & MACHINE READINESS // ENGINE V4.1</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Cockpit d'Éligibilité & Distribution <span className="text-primary">Agentique</span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Auditez n'importe quel site face aux agents autonomes (Claude Code, Cursor, Perplexity, agents d'achat).
            Détectez les risques de <strong>disqualification silencieuse</strong> sur les 5 piliers et générez le pack de remédiation technique instantané.
          </p>
        </div>
      </div>

      {/* Control Card */}
      <Card className="border border-border/80 bg-card shadow-sm">
        <CardContent className="p-6 space-y-4">
          <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Entrez l'URL à auditer (ex: https://votre-saas.com)"
                required
                className="pl-10 h-12 text-sm font-mono bg-background border-border"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-12 px-7 font-bold text-sm bg-primary text-primary-foreground shadow-md hover:opacity-95 gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {loading ? 'Audit en cours...' : 'Lancer l\'audit agentique'}
            </Button>
          </form>

          {/* Quick Presets & Remediate Switch */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Exemples rapides :</span>
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setUrl(p.url)}
                  className="px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all font-medium text-[11px]"
                >
                  {p.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              <Switch
                id="toggle-remediate"
                checked={remediate}
                onCheckedChange={setRemediate}
              />
              <Label htmlFor="toggle-remediate" className="text-xs text-muted-foreground cursor-pointer">
                Générer le Pack de Remédiation
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error display */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={() => handleScan()}>Réessayer</Button>
        </div>
      )}

      {/* Loading Radar */}
      {loading && (
        <Card className="border border-border/80 bg-card/60 p-8 text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Radar Multi-Probes en cours d'exécution...</h3>
            <p className="text-xs text-muted-foreground">
              Vérification de /llms.txt, spécification OpenAPI 3.1, balises JSON-LD et challenge x402 Base USDC.
            </p>
          </div>
        </Card>
      )}

      {/* Results View */}
      {result && !loading && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Gauge Summary */}
          <AgenticScoreGauge score={result.score} targetUrl={result.target_url} />

          {/* 5 Pillars */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                Diagnostic Opérationnel sur les 5 Piliers d'Éligibilité
              </h2>
            </div>
            <AgenticPillarsView pillars={result.pillars} />
          </div>

          {/* 8 Channels Matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                Matrice de Présence sur les 8 Canaux de Distribution Agentique
              </h2>
            </div>
            <AgenticChannelsMatrix channelAudit={result.channel_audit} />
          </div>

          {/* Remediation Pack */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Pack de Remédiation Technique Clé en Main
              </h2>
            </div>
            <AgenticRemediationViewer remediationPack={result.remediation_pack} />
          </div>

          {/* x402 Playground */}
          <Card className="border border-border/80 bg-card shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Coins className="w-4 h-4 text-primary" />
                  Banc d'Essai du Handshake x402 (Micro-Paiements Machine Base USDC)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Visualisez comment un agent autonome reçoit le challenge HTTP 402 et exécute son paiement M2M.
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleTestX402}
                disabled={x402Loading}
                className="gap-2 text-xs"
              >
                {x402Loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Coins className="w-3.5 h-3.5" />}
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
