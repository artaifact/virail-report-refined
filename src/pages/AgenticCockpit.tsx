import React, { useState, useEffect } from 'react';
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
  Workflow,
  Play,
  Scale,
  Plug,
  Zap,
} from 'lucide-react';
import {
  runAgenticScan,
  getLatestAgenticAudit,
  getX402Manifest,
  AgenticScanResult,
} from '@/services/agenticService';
import { actionabilityEngine } from '@/services/actionability/ActionabilityEngine';
import { JourneyResult } from '@/services/actionability/types';
import { JourneyReplay } from '@/components/journey/JourneyReplay';
import { AgenticScoreGauge } from '@/components/agentic/AgenticScoreGauge';
import { AgenticPillarsView } from '@/components/agentic/AgenticPillarsView';
import { AgenticChannelsMatrix } from '@/components/agentic/AgenticChannelsMatrix';
import { AgenticRemediationViewer } from '@/components/agentic/AgenticRemediationViewer';
import { AgenticSkeletonLoader } from '@/components/agentic/AgenticSkeletonLoader';

const PRESETS = [
  { name: 'Stripe', url: 'https://stripe.com' },
  { name: 'Tally', url: 'https://tally.so' },
  { name: 'Resend', url: 'https://resend.com' },
  { name: 'Cloudflare', url: 'https://cloudflare.com' },
  { name: 'Shopify', url: 'https://shopify.com' },
];

const CURATED_INTENTS = [
  { id: 'discover', label: 'Découverte & Positionnement', icon: Search, desc: "L'agent analyse l'offre principale et la clarté du positionnement." },
  { id: 'compare', label: 'Comparaison Concurrentielle', icon: Scale, desc: "L'agent compare les fonctionnalités clés et la proposition vs alternatives." },
  { id: 'pricing', label: 'Grille Tarifaire & Transparence', icon: CreditCard, desc: "L'agent tente d'extraire la grille de prix, quotas et conditions d'usage." },
  { id: 'integrate', label: 'Documentation & API / MCP', icon: Plug, desc: "L'agent recherche les points de terminaison machine (/llms.txt, OpenAPI, MCP)." },
  { id: 'action', label: 'Parcours de Conversion M2M', icon: Zap, desc: "L'agent simule une souscription ou une transaction programmatique." },
];

export default function AgenticCockpit() {
  const [url, setUrl] = useState<string>('https://tally.so');
  const [remediate, setRemediate] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AgenticScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Agent Journeys live testing
  const [selectedIntent, setSelectedIntent] = useState<string>('discover');
  const [journeyLoading, setJourneyLoading] = useState<boolean>(false);
  const [journeyResult, setJourneyResult] = useState<JourneyResult | null>(null);

  // x402 live test
  const [x402Loading, setX402Loading] = useState<boolean>(false);
  const [x402Output, setX402Output] = useState<string | null>(null);

  // Restauration automatique de l'analyse au chargement ou après actualisation (F5)
  useEffect(() => {
    let isMounted = true;
    const lastUrl = localStorage.getItem('viraill_last_agentic_url') || url;

    if (lastUrl) {
      setUrl(lastUrl);
      setLoading(true);

      getLatestAgenticAudit(lastUrl)
        .then((cached) => {
          if (isMounted && cached && cached.score !== undefined) {
            setResult(cached);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleScan = async (e?: React.FormEvent, overrideUrl?: string) => {
    if (e) e.preventDefault();
    const targetUrl = (overrideUrl || url).trim();
    if (!targetUrl) return;

    setUrl(targetUrl);
    setLoading(true);
    setError(null);

    try {
      localStorage.setItem('viraill_last_agentic_url', targetUrl);
      const data = await runAgenticScan(targetUrl, remediate);
      setResult(data);
      setJourneyResult(null);

      if (data && data.score !== undefined) {
        try {
          const domain = new URL(targetUrl).hostname.replace('www.', '');
          localStorage.setItem(`viraill_agentic_score_${domain}`, String(data.score));
          localStorage.setItem(`viraill_agentic_score_${targetUrl}`, String(data.score));
        } catch {}
      }
    } catch (err: any) {
      console.error('[AgenticCockpit] Scan error:', err);
      setError(err.message || "Erreur lors de l'exécution de l'audit agentique.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunJourney = async (intentId?: string) => {
    const intent = intentId || selectedIntent;
    setSelectedIntent(intent);
    setJourneyLoading(true);
    try {
      const res = await actionabilityEngine.runJourney({
        intentId: intent,
        targetUrl: url,
      });
      setJourneyResult(res);
    } catch (err: any) {
      console.error('[AgenticCockpit] Journey error:', err);
    } finally {
      setJourneyLoading(false);
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
    <div className="dashboard-container ux-dashboard font-sans" style={{ minHeight: '100vh', padding: '24px 20px' }}>
      <div className="space-y-6">
        {/* Top Banner */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted border border-border text-xs font-semibold text-foreground">
              <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Audit d'Éligibilité Machine & Protocoles Agentiques (M2M)</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Cockpit d'Éligibilité & Distribution <span className="text-foreground">Agentique</span>
            </h1>

            <p className="text-xs sm:text-[13.5px] text-muted-foreground leading-relaxed font-normal">
              Auditez la découvrabilité et l'achetabilité machine de votre plateforme face aux agents autonomes (Claude Code, Cursor, Perplexity, agents d'achat).
              Détectez les risques de <strong className="font-semibold text-foreground">disqualification silencieuse</strong> sur les 5 piliers et générez le pack de remédiation technique instantané.
            </p>
          </div>
        </div>

        {/* Control Card */}
        <Card className="rounded-xl border border-border bg-card shadow-sm">
          <CardContent className="p-4 sm:p-5 space-y-3.5">
            <form onSubmit={(e) => handleScan(e)} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Entrez l'URL à auditer (ex: https://tally.so)"
                  required
                  className="pl-10 h-11 text-xs sm:text-sm font-mono bg-muted/40 border-border rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-11 px-6 rounded-xl font-semibold text-xs sm:text-[13px] bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all gap-2 flex-shrink-0 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                {loading ? 'Audit en cours...' : "Lancer l'audit agentique"}
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
                    onClick={() => {
                      setUrl(p.url);
                      handleScan(undefined, p.url);
                    }}
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
        {loading && <AgenticSkeletonLoader />}

        {/* Results View */}
        {result && !loading && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Gauge Summary */}
            <AgenticScoreGauge
              score={result.score}
              targetUrl={result.target_url}
              auditId={result.audit_id}
              savedInDb={Boolean(result.saved_in_db || result.audit_id)}
              createdAt={result.created_at}
            />

            {/* 5 Pillars */}
            <div className="space-y-3">
              <h3 className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
                <Layers className="w-4 h-4 text-muted-foreground" />
                Diagnostic Opérationnel sur les 5 Piliers d'Éligibilité
              </h3>
              <AgenticPillarsView pillars={result.pillars} />
            </div>

            {/* 8 Channels Matrix */}
            <div className="space-y-3">
              <h3 className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
                <Cpu className="w-4 h-4 text-muted-foreground" />
                Matrice de Présence sur les 8 Canaux de Distribution Agentique
              </h3>
              <AgenticChannelsMatrix channelAudit={result.channel_audit} />
            </div>

            {/* Agent Journey Replay Section */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
                    <Workflow className="w-4 h-4 text-muted-foreground" />
                    Banc d'Essai de Parcours Réels d'Agents (Agent Journey Replay)
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Simulez et rejouez le raisonnement étape par étape d'un agent autonome face à 5 intentions critiques.
                  </p>
                </div>
                {journeyResult && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRunJourney(selectedIntent)}
                    disabled={journeyLoading}
                    className="h-8 px-3 text-xs gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    {journeyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    Rejouer ce parcours
                  </Button>
                )}
              </div>

              {/* 5 Curated Intent Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                {CURATED_INTENTS.map((intent) => {
                  const isSelected = selectedIntent === intent.id;
                  return (
                    <button
                      key={intent.id}
                      type="button"
                      onClick={() => setSelectedIntent(intent.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-slate-900 dark:border-slate-100 bg-muted/40 shadow-xs ring-1 ring-slate-900/10 dark:ring-slate-100/10'
                          : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <div className={`p-1.5 rounded-lg border text-muted-foreground ${isSelected ? 'bg-background border-border' : 'bg-muted/50 border-border/50'}`}>
                          {<intent.icon className="w-4 h-4" />}
                        </div>
                        {isSelected && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider bg-primary text-primary-foreground">
                            Actif
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {intent.label}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {intent.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Journey Loading / Results */}
              {journeyLoading ? (
                <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-muted text-foreground animate-pulse mx-auto">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Simulation du parcours agentique en cours...
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      Intention : {CURATED_INTENTS.find(i => i.id === selectedIntent)?.label}
                    </div>
                  </div>
                </Card>
              ) : journeyResult ? (
                <JourneyReplay
                  journey={journeyResult}
                  targetDomain={new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '')}
                  intentTitle={CURATED_INTENTS.find(i => i.id === selectedIntent)?.label}
                />
              ) : (
                <Card className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-6 text-center">
                  <div className="max-w-md mx-auto space-y-2">
                    <Workflow className="w-6 h-6 text-muted-foreground mx-auto opacity-80" />
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Visualisez en direct les étapes de raisonnement des agents
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Sélectionnez l'une des 5 intentions ci-dessus pour observer le cheminement de l'agent, ses appels d'outils et les points de friction éventuels.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleRunJourney(selectedIntent)}
                      className="mt-2 h-8 px-4 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                    >
                      <Play className="w-3 h-3 mr-1.5" /> Lancer le parcours "{CURATED_INTENTS.find(i => i.id === selectedIntent)?.label}"
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* Remediation Pack */}
            <div className="space-y-3">
              <h3 className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
                <FileCode2 className="w-4 h-4 text-muted-foreground" />
                Pack de Remédiation Technique Clé en Main
              </h3>
              <AgenticRemediationViewer remediationPack={result.remediation_pack} />
            </div>

            {/* x402 Playground */}
            <Card className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                <div>
                  <h4 className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
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
    </div>
  );
}
