import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  Loader2,
  Cpu,
  Layers,
  CreditCard,
  FileCode2,
  Workflow,
  Play,
  BarChart3,
  Plug,
  Zap,
  Database,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { useReports, getLatestReportId } from '@/hooks/useReports';
import { useSelectedReport } from '@/contexts/SelectedReportContext';
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
import { AgenticMethodologyModal } from '@/components/agentic/AgenticMethodologyModal';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const CURATED_INTENTS = [
  { id: 'discover', label: 'Découverte & Positionnement', icon: Search, desc: "L'agent analyse l'offre principale et la clarté du positionnement." },
  { id: 'compare', label: 'Comparaison Concurrentielle', icon: BarChart3, desc: "L'agent compare les fonctionnalités clés et la proposition vs alternatives." },
  { id: 'pricing', label: 'Grille Tarifaire & Transparence', icon: CreditCard, desc: "L'agent tente d'extraire la grille de prix, quotas et conditions d'usage." },
  { id: 'integrate', label: 'Documentation & API / MCP', icon: Plug, desc: "L'agent recherche les points de terminaison machine (/llms.txt, OpenAPI, MCP)." },
  { id: 'action', label: 'Parcours de Conversion M2M', icon: Zap, desc: "L'agent simule une souscription ou une transaction programmatique." },
];

export default function AgenticCockpit() {
  const [searchParams] = useSearchParams();
  const { reports } = useReports();
  const { selectedReportId } = useSelectedReport();

  const [url, setUrl] = useState<string>('https://tally.so');
  const [remediate, setRemediate] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AgenticScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const targetDomain = useMemo(() => {
    if (!url) return '';
    try {
      return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    }
  }, [url]);

  // Agent Journeys live testing
  const [selectedIntent, setSelectedIntent] = useState<string>('discover');
  const [journeyLoading, setJourneyLoading] = useState<boolean>(false);
  const [journeyResult, setJourneyResult] = useState<JourneyResult | null>(null);

  // x402 live test
  const [x402Loading, setX402Loading] = useState<boolean>(false);
  const [x402Output, setX402Output] = useState<string | null>(null);

  // Methodology modal
  const [isMethodologyOpen, setIsMethodologyOpen] = useState<boolean>(false);

  // Résolution automatique de l'URL cible (param URL > rapport actif > dernier rapport > localStorage > fallback)
  useEffect(() => {
    let isMounted = true;
    const urlParam = searchParams.get('url');
    let target = urlParam;

    if (!target && selectedReportId && reports.length > 0) {
      const cur = reports.find((r) => String(r.id) === String(selectedReportId));
      if (cur?.url) target = cur.url;
    }

    if (!target && reports.length > 0) {
      const latestId = getLatestReportId(reports);
      const latestReport = reports.find((r) => String(r.id) === String(latestId));
      if (latestReport?.url) target = latestReport.url;
    }

    if (!target) {
      const stored = localStorage.getItem('viraill_last_agentic_url');
      if (stored) target = stored;
    }

    const finalUrl = (target || url || 'https://tally.so').trim();
    if (finalUrl) {
      setUrl(finalUrl);
      setLoading(true);

      getLatestAgenticAudit(finalUrl)
        .then((cached) => {
          if (isMounted && cached && cached.score !== undefined) {
            setResult(cached);
            setLastLoadedGetTime(new Date().toLocaleTimeString('fr-FR'));
          }
        })
        .catch((err) => {
          console.warn('[AgenticCockpit] GET audit error:', err);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [searchParams, selectedReportId, reports.length]);

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
          const domain = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`).hostname.replace('www.', '');
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
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 w-full max-w-[1700px] mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
          <span>Éligibilité Agentique —</span>
          <span className="text-primary">{targetDomain || 'Cockpit'}</span>
          <InfoTooltip
            title="Cockpit d'Éligibilité Agentique"
            description="Audit de découvrabilité machine et d'éligibilité aux protocoles M2M (Claude Code, Cursor, Perplexity)."
          />
        </h1>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMethodologyOpen(true)}
          className="self-start sm:self-center text-xs font-semibold gap-1.5 h-9 px-3.5 shrink-0 cursor-pointer text-foreground border-border hover:bg-muted rounded-xl shadow-xs"
        >
          <HelpCircle className="w-3.5 h-3.5 text-primary" />
          <span>Barème & Méthodologie</span>
        </Button>
      </div>

      {/* Control Card */}
      <Card className="rounded-xl border border-border bg-card shadow-xs">
        <CardContent className="p-3.5 sm:p-4">
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
              className="h-11 px-6 rounded-xl font-semibold text-xs sm:text-[13px] bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all gap-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              {loading ? 'Audit en cours...' : "Lancer l'audit agentique"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error display */}
      {error && (
        <Alert variant="destructive" className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleScan()}
            className="h-7 text-xs border-destructive/30"
          >
            Réessayer
          </Button>
        </Alert>
      )}

      {/* Skeleton Loading State */}
        {loading && <AgenticSkeletonLoader />}

        {/* Results View organized by Tabs for Cognitive Load Reduction */}
        {result && !loading && (
          <Tabs defaultValue="overview" className="w-full space-y-5 animate-in fade-in duration-300">
            {/* Top Navigation Tabs */}
            <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
              <TabsList className="bg-muted/60 border border-border p-1 h-9 rounded-xl gap-1">
                <TabsTrigger
                  value="overview"
                  className="text-xs font-semibold gap-1.5 rounded-lg px-3 py-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Vue d'ensemble & Diagnostic</span>
                </TabsTrigger>
                <TabsTrigger
                  value="journeys"
                  className="text-xs font-semibold gap-1.5 rounded-lg px-3 py-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all cursor-pointer"
                >
                  <Workflow className="w-3.5 h-3.5" />
                  <span>Banc d'Essai Parcours ({CURATED_INTENTS.length})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="remediation"
                  className="text-xs font-semibold gap-1.5 rounded-lg px-3 py-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all cursor-pointer"
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>Pack Remédiation & x402</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: Overview & Diagnostic */}
            <TabsContent value="overview" className="space-y-6 mt-0">
              {/* Gauge Summary */}
              <AgenticScoreGauge
                score={result.score}
                targetUrl={result.target_url}
                auditId={result.audit_id}
                savedInDb={Boolean(result.saved_in_db || result.audit_id)}
                createdAt={result.created_at}
              />

              {/* 5 Pillars */}
              <div className="space-y-2.5">
                <h3 className="text-xs sm:text-[13px] font-semibold text-foreground flex items-center gap-2 tracking-tight">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <span>5 Piliers d'Éligibilité Machine (M2M)</span>
                </h3>
                <AgenticPillarsView pillars={result.pillars} />
              </div>

              {/* 8 Channels Matrix */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-[13px] font-semibold text-foreground flex items-center gap-2 tracking-tight">
                    <Cpu className="w-4 h-4 text-muted-foreground" />
                    <span>8 Canaux de Distribution Agentique</span>
                  </h3>
                  <span className="text-xs font-mono font-medium text-muted-foreground">
                    {Object.values(result.channel_audit || {}).filter(Boolean).length}/8 activés
                  </span>
                </div>
                <AgenticChannelsMatrix channelAudit={result.channel_audit} />
              </div>
            </TabsContent>

            {/* TAB 2: Agent Journeys Testing */}
            <TabsContent value="journeys" className="space-y-4 mt-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs sm:text-[13px] font-semibold text-foreground flex items-center gap-2 tracking-tight">
                    <Workflow className="w-4 h-4 text-muted-foreground" />
                    <span>Banc d'Essai de Parcours Réels d'Agents (Agent Journey Replay)</span>
                    <InfoTooltip
                      title="Banc d'Essai de Parcours Réels d'Agents"
                      description="Simulez et rejouez le raisonnement étape par étape d'un agent autonome face à 5 intentions critiques."
                    />
                  </h3>
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
                          ? 'border-foreground bg-muted/40 shadow-xs ring-1 ring-foreground/10'
                          : 'border-border bg-card hover:bg-muted/50'
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
                      <div className="text-xs font-semibold text-foreground truncate">
                        {intent.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {intent.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Journey Loading / Results */}
              {journeyLoading ? (
                <Card className="rounded-xl border border-border bg-card p-8 text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-muted text-foreground animate-pulse mx-auto">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-foreground">
                      Simulation du parcours agentique en cours...
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      Intention : {CURATED_INTENTS.find(i => i.id === selectedIntent)?.label}
                    </div>
                  </div>
                </Card>
              ) : journeyResult ? (
                <JourneyReplay
                  journey={journeyResult}
                  targetDomain={(() => {
                    try {
                      return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
                    } catch {
                      return url;
                    }
                  })()}
                  intentTitle={CURATED_INTENTS.find(i => i.id === selectedIntent)?.label}
                />
              ) : (
                <Card className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
                  <div className="max-w-md mx-auto space-y-2">
                    <Workflow className="w-6 h-6 text-muted-foreground mx-auto opacity-80" />
                    <div className="text-xs font-semibold text-foreground">
                      Visualisez en direct les étapes de raisonnement des agents
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
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
            </TabsContent>

            {/* TAB 3: Remediation & x402 Settlement */}
            <TabsContent value="remediation" className="space-y-6 mt-0">
              {/* Remediation Pack */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-[13px] font-semibold text-foreground flex items-center gap-2 tracking-tight">
                    <FileCode2 className="w-4 h-4 text-muted-foreground" />
                    <span>Pack de Remédiation Technique Clé en Main</span>
                    <InfoTooltip
                      title="Pack de Remédiation"
                      description="Fichiers configurés et prêts au déploiement pour votre domaine"
                    />
                  </h3>
                </div>
                <AgenticRemediationViewer remediationPack={result.remediation_pack} />
              </div>

              {/* x402 Playground */}
              <Card className="rounded-xl border border-border bg-card shadow-xs p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                  <div>
                    <h4 className="text-xs sm:text-[13px] font-semibold text-foreground flex items-center gap-2 tracking-tight">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <span>Banc d'Essai du Handshake x402 (Micro-Paiements Machine Base USDC)</span>
                      <InfoTooltip
                        title="Banc d'Essai Handshake x402"
                        description="Simulation du protocole HTTP 402 et exécution de règlement machine autonome."
                      />
                    </h4>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestX402}
                    disabled={x402Loading}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium border border-border bg-card hover:bg-muted text-foreground shadow-xs transition-all gap-2 h-auto"
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
            </TabsContent>
          </Tabs>
        )}

        {/* Global Methodology Modal */}
        <AgenticMethodologyModal
          isOpen={isMethodologyOpen}
          onClose={() => setIsMethodologyOpen(false)}
        />
      </div>
    );
  }
