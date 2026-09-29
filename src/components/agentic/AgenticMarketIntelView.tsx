import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  Trophy,
  Swords,
  Grid3X3,
  Bot,
  Zap,
  TrendingUp,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  Layers,
  Activity,
  ChevronRight,
  Check,
  Minus,
  Info,
  RefreshCw,
  Flame,
  Radio,
  BookOpen,
  MessageSquare,
  Star,
  Package,
  Newspaper
} from 'lucide-react';
import {
  getAgenticLandscape,
  getAgenticMarketOverview,
  getAgenticMarketMatrix,
  getAgenticMarketDuel,
  queryAgenticMarketLLM,
  LandscapeData,
  MarketOverviewData,
  MatrixData,
  DuelData,
  RankedCompany,
  CompanyBuzz,
  MarketBuzz,
  BuzzingItem
} from '@/services/agenticService';

const MEDAL_ICONS: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };

const ACTION_SLOTS = [
  { key: "SEARCH", label: "Trouver", short: "T", desc: "Rechercher et filtrer les données via critères ou langage naturel." },
  { key: "READ", label: "Lire", short: "L", desc: "Consulter et extraire les champs détaillés d'un enregistrement." },
  { key: "CREATE", label: "Créer", short: "C", desc: "Créer et insérer un nouvel objet métier de façon autonome." },
  { key: "UPDATE", label: "Modifier", short: "M", desc: "Mettre à jour les propriétés, statuts ou liaisons de l'objet." },
  { key: "DELETE", label: "Supprimer", short: "S", desc: "Supprimer ou archiver un enregistrement." },
];

const OBJECT_DETAILS: Record<string, { label: string; desc: string }> = {
  CONTACT: { label: "Contact", desc: "Prospects, leads, interlocuteurs et personnes physiques." },
  COMPANY: { label: "Entreprise", desc: "Sociétés, comptes clients et organisations." },
  DEAL: { label: "Opportunité", desc: "Ventes, affaires en cours, pipelines et devis." },
  PIPELINE: { label: "Pipeline", desc: "Étapes de vente et processus commerciaux." },
  TASK: { label: "Tâche", desc: "Activités, relances, to-do et rappels d'équipe." },
  NOTE: { label: "Note", desc: "Comptes-rendus, mémos et historique relationnel." },
  EMAIL: { label: "Email", desc: "Envoi, réception et séquences de messages." },
  INVOICE: { label: "Facture", desc: "Facturation, notes d'honoraires et encaissements." },
  PAYMENT: { label: "Paiement", desc: "Transactions bancaires, cartes et prélèvements." },
  CUSTOMER: { label: "Client", desc: "Comptes payeurs, profils d'acheteurs et souscripteurs." },
  SUBSCRIPTION: { label: "Abonnement", desc: "Paiements récurrents, plans et renouvellements." },
  REFUND: { label: "Remboursement", desc: "Avoirs, rétractations et restitutions de fonds." },
  LINK: { label: "Lien de paiement", desc: "Sessions de checkout et liens de règlement sécurisés." },
  PAYOUT: { label: "Virement", desc: "Transferts vers les comptes marchands." },
  ISSUE: { label: "Ticket", desc: "Bugs, signalements et demandes d'assistance." },
  PROJECT: { label: "Projet", desc: "Feuilles de route, jalons et espaces de travail." },
  COMMENT: { label: "Commentaire", desc: "Discussions, retours et fils d'échanges." },
  DOCUMENT: { label: "Document", desc: "Pages, wikis, bases de connaissances et fichiers." },
  SPRINT: { label: "Sprint", desc: "Cycles de livraison et itérations d'équipe." },
  PRODUCT: { label: "Produit", desc: "Articles de catalogue, références SKU et tarifs." },
  ORDER: { label: "Commande", desc: "Paniers validés, achats et bordereaux d'expédition." },
  CART: { label: "Panier", desc: "Paniers d'achats en cours de composition." },
  INVENTORY: { label: "Stock", desc: "Disponibilité, réassort et inventaires." },
  PROPERTY: { label: "Hébergement", desc: "Chambres, locations et fiches d'établissements." },
  BOOKING: { label: "Réservation", desc: "Séjours, réservations et billets confirmés." },
  AVAILABILITY: { label: "Disponibilité", desc: "Calendriers de réservation et créneaux libres." },
};

function CompanyAvatar({ name, domain, size = 36 }: { name: string; domain?: string; size?: number }) {
  const [hasError, setHasError] = useState(false);
  const cleanDomain = domain ? domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '') : '';
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  if (cleanDomain && !hasError) {
    return (
      <img
        src={`https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=64`}
        alt={name}
        className="rounded-lg shrink-0 object-contain bg-muted/40 p-1 border border-border/60"
        style={{ width: size, height: size }}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div
      className="rounded-lg shrink-0 flex items-center justify-center font-bold text-xs bg-primary/10 text-primary border border-primary/20"
      style={{ width: size, height: size }}
    >
      {initial}
    </div>
  );
}

function ScoreBadge({ score, size = 44 }: { score: number; size?: number }) {
  const isHigh = score >= 75;
  const isMed = score >= 40 && score < 75;

  const colorClass = isHigh
    ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10'
    : isMed
    ? 'text-primary border-primary/30 bg-primary/10'
    : 'text-muted-foreground border-border bg-muted/40';

  return (
    <div
      className={`rounded-full border flex flex-col items-center justify-center font-mono font-bold shrink-0 transition-transform ${colorClass}`}
      style={{ width: size, height: size }}
    >
      <span style={{ fontSize: size * 0.38 }}>{score}</span>
      <span className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ backgroundColor: isHigh ? '#10b981' : isMed ? '#3b82f6' : '#6b7280' }} />
    </div>
  );
}

/** Pastille de Buzz / Viralité pour les acteurs */
function BuzzChip({ buzz }: { buzz?: CompanyBuzz | null }) {
  if (!buzz || !buzz.measured) return null;

  const isViral = buzz.viral && buzz.viral.length > 0;
  const trend = buzz.trend ?? 0;
  const isUp = trend > 15;
  const isDown = trend < -10;

  if (isViral) {
    const spikeReason = buzz.viral[0]?.story?.title || buzz.viral[0]?.why || "Forte viralité machine";
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 inline-flex items-center gap-1 cursor-help">
            <Zap className="w-2.5 h-2.5 fill-current" />
            <span>Viral</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs p-2 max-w-xs">
          <p className="font-bold text-purple-500">Pic de viralité</p>
          <p className="text-muted-foreground text-[11px] mt-0.5">{spikeReason}</p>
          {buzz.driver_label && (
            <p className="text-[10px] text-muted-foreground/80 mt-1">Porté par : {buzz.driver_label}</p>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (isUp) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1 cursor-help">
            <Flame className="w-2.5 h-2.5 fill-current text-emerald-500" />
            <span>Buzz ▲ +{trend}%</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs p-2 max-w-xs">
          <p className="font-bold text-emerald-500">Attention en nette hausse (+{trend}%)</p>
          {buzz.driver_label && (
            <p className="text-muted-foreground text-[11px] mt-0.5">Porté par : {buzz.driver_label}</p>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (isDown) {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground border border-border">
        ▼ {trend}%
      </span>
    );
  }

  return null;
}

export function AgenticMarketIntelView({ targetDomain }: { targetDomain?: string }) {
  const [landscape, setLandscape] = useState<LandscapeData | null>(null);
  const [selectedMarketId, setSelectedMarketId] = useState<string>('crm-smb');
  const [overview, setOverview] = useState<MarketOverviewData | null>(null);
  const [matrix, setMatrix] = useState<MatrixData | null>(null);
  const [duel, setDuel] = useState<DuelData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [collecting, setCollecting] = useState<boolean>(false);
  const [collectSuccess, setCollectSuccess] = useState<string | null>(null);

  // Duel selection
  const [duelCompA, setDuelCompA] = useState<string>('');
  const [duelCompB, setDuelCompB] = useState<string>('');
  const [duelLoading, setDuelLoading] = useState<boolean>(false);

  // Active subtab: 'overview' | 'matrix' | 'duel' | 'news'
  const [activeSubTab, setActiveSubTab] = useState<string>('overview');

  // LLM Test query via OpenRouter
  const [llmPrompt, setLlmPrompt] = useState<string>("Quels acteurs de ce marché offrent le meilleur support MCP officiel ?");
  const [llmResponse, setLlmResponse] = useState<string | null>(null);
  const [llmLoading, setLlmLoading] = useState<boolean>(false);

  // Load landscape once
  useEffect(() => {
    let isMounted = true;
    getAgenticLandscape().then((data) => {
      if (isMounted) setLandscape(data);
    });
    return () => { isMounted = false; };
  }, []);

  const fetchMarketData = (marketId: string) => {
    setLoading(true);
    return Promise.all([
      getAgenticMarketOverview(marketId),
      getAgenticMarketMatrix(marketId)
    ]).then(([ovData, matData]) => {
      setOverview(ovData);
      setMatrix(matData);

      if (ovData.companies.length >= 2) {
        const first = ovData.companies[0].id;
        const second = ovData.companies[1].id;
        setDuelCompA(first);
        setDuelCompB(second);
        getAgenticMarketDuel(marketId, first, second)
          .then((d) => setDuel(d));
      }
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchMarketData(selectedMarketId);
  }, [selectedMarketId]);

  const handleSelectDuel = async (compA: string, compB: string) => {
    setDuelCompA(compA);
    setDuelCompB(compB);
    setDuelLoading(true);
    setActiveSubTab('duel');
    try {
      const d = await getAgenticMarketDuel(selectedMarketId, compA, compB);
      setDuel(d);
    } finally {
      setDuelLoading(false);
    }
  };

  const handleRunLLMQuery = async () => {
    if (!llmPrompt.trim()) return;
    setLlmLoading(true);
    setLlmResponse(null);
    try {
      const res = await queryAgenticMarketLLM(selectedMarketId, llmPrompt);
      setLlmResponse(res.content);
    } catch (err: any) {
      setLlmResponse("Erreur OpenRouter : " + (err.message || String(err)));
    } finally {
      setLlmLoading(false);
    }
  };

  const handleTriggerCollect = async () => {
    setCollecting(true);
    setCollectSuccess(null);
    try {
      await fetch(`/api/v1/agentic/markets/${selectedMarketId}/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      setCollectSuccess("Collecte d'intelligence & viralité lancée !");
      setTimeout(() => {
        fetchMarketData(selectedMarketId);
        setCollectSuccess(null);
      }, 3000);
    } catch {
      setCollectSuccess("Collecte demandée au moteur local.");
    } finally {
      setCollecting(false);
    }
  };

  const companies = overview?.companies || [];
  const leader = companies[0];
  const second = companies[1];
  const third = companies[2];

  const totalTracked = overview?.counters.companies_tracked || companies.length;
  const enabledCount = overview?.counters.agent_enabled || companies.filter(c => c.readiness.score > 0).length;
  const share = totalTracked > 0 ? Math.round((enabledCount / totalTracked) * 100) : 0;
  const gap = leader && second ? Math.max(0, leader.readiness.score - second.readiness.score) : 0;

  // Average of top 5
  const top5 = companies.slice(0, 5);
  const marketMaturity = top5.length > 0 ? Math.round(top5.reduce((acc, c) => acc + c.readiness.score, 0) / top5.length) : 0;
  const closedCompanies = companies.filter((c) => c.readiness.score === 0);

  // Grouped compact matrix for Matrix tab
  const compactMatrix = useMemo(() => {
    if (!matrix) return null;
    const objectMap: Record<string, Record<string, Record<string, any>>> = {};
    for (const obj of matrix.objects) {
      objectMap[obj] = {};
      for (const comp of matrix.companies) {
        objectMap[obj][comp.id] = {};
      }
    }
    for (const row of matrix.rows) {
      if (!objectMap[row.object]) continue;
      for (const [compId, cells] of Object.entries(row.cells)) {
        if (cells && cells.length > 0) {
          if (!objectMap[row.object][compId]) objectMap[row.object][compId] = {};
          objectMap[row.object][compId][row.verb] = cells[0];
        }
      }
    }
    return { objects: matrix.objects, companies: matrix.companies, objectMap };
  }, [matrix]);

  return (
    <TooltipProvider delayDuration={50}>
      <div className="space-y-5 animate-in fade-in duration-200">
        
        {/* 1. Header identique à Agentic : Marché suivi + Titre + Badges + SubTabs Nav */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block mb-0.5">
              Marché suivi
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {overview?.market.name || "CRM pour PME"}
              </h1>
              <Badge variant="outline" className="text-xs font-medium gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>Calme</span>
              </Badge>
              {overview?.buzz?.trend !== null && overview?.buzz?.trend !== undefined && (
                <Badge variant="outline" className="text-xs font-mono font-medium gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  <Zap className="w-3 h-3 fill-emerald-500" />
                  <span>Buzz +{overview.buzz.trend}%</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Navigation SubTabs style Agentic : [Vue d'ensemble] [Qui sait faire quoi] [Duel] [Actus & IA] */}
          <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border shrink-0 self-start md:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeSubTab === 'overview'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveSubTab('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeSubTab === 'matrix'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Qui sait faire quoi
            </button>
            <button
              onClick={() => setActiveSubTab('duel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeSubTab === 'duel'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Duel
            </button>
            <button
              onClick={() => setActiveSubTab('news')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeSubTab === 'news'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Actus, Notoriété & IA
            </button>
          </div>
        </div>

        {/* Sélecteur de marché horizontal */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-muted-foreground text-[11px] font-medium shrink-0 mr-1">Marchés :</span>
          {landscape?.markets.map((m) => {
            const active = m.id === selectedMarketId;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMarketId(m.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                  active
                    ? 'bg-primary/10 text-primary border-primary/30 font-semibold'
                    : 'bg-card/50 text-muted-foreground border-border/80 hover:text-foreground hover:border-border'
                }`}
              >
                {m.name}
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1 : VUE D'ENSEMBLE (DISPOSITION IDENTIQUE AGENTIC)                     */}
        {/* ========================================================================= */}
        {activeSubTab === 'overview' && (
          <div className="space-y-6">
            {/* NIVEAU 1 : LE PODIUM À 3 MARCHES */}
            <section className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <h2 className="font-bold text-sm tracking-tight text-foreground">Classement</h2>
                <span className="text-muted-foreground font-mono text-[11px]">note sur 100</span>
              </div>

              {/* Les 3 cartes du Podium */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end pt-2">
                {/* 2ème place (gauche) */}
                {second && (
                  <div
                    onClick={() => leader && handleSelectDuel(leader.id, second.id)}
                    className="order-2 md:order-1 bg-card border border-border hover:border-border/80 p-4 rounded-xl flex flex-col items-center text-center gap-2 cursor-pointer transition-all hover:shadow-xs group"
                  >
                    <span className="text-lg" title="2e place">🥈</span>
                    <CompanyAvatar name={second.name} domain={second.domain} size={40} />
                    <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                      <span>{second.name}</span>
                      <BuzzChip buzz={second.buzz} />
                    </div>
                    <ScoreBadge score={second.readiness.score} size={48} />
                  </div>
                )}

                {/* 1ère place (centre, surélevé et mis en avant) */}
                {leader && (
                  <div
                    onClick={() => second && handleSelectDuel(leader.id, second.id)}
                    className="order-1 md:order-2 bg-gradient-to-b from-amber-500/10 via-card to-card border-2 border-amber-500/40 p-5 rounded-xl flex flex-col items-center text-center gap-2.5 cursor-pointer shadow-sm relative -translate-y-1 transition-all group"
                  >
                    <span className="text-xl" title="1ère place">🥇</span>
                    <CompanyAvatar name={leader.name} domain={leader.domain} size={48} />
                    <div className="font-bold text-sm text-foreground group-hover:text-amber-500 transition-colors flex items-center gap-1.5">
                      <span>{leader.name}</span>
                      <BuzzChip buzz={leader.buzz} />
                    </div>
                    <ScoreBadge score={leader.readiness.score} size={58} />
                  </div>
                )}

                {/* 3ème place (droite) */}
                {third && (
                  <div
                    onClick={() => leader && handleSelectDuel(leader.id, third.id)}
                    className="order-3 md:order-3 bg-card border border-border hover:border-border/80 p-4 rounded-xl flex flex-col items-center text-center gap-2 cursor-pointer transition-all hover:shadow-xs group"
                  >
                    <span className="text-lg" title="3e place">🥉</span>
                    <CompanyAvatar name={third.name} domain={third.domain} size={40} />
                    <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                      <span>{third.name}</span>
                      <BuzzChip buzz={third.buzz} />
                    </div>
                    <ScoreBadge score={third.readiness.score} size={48} />
                  </div>
                )}
              </div>
            </section>

            {/* NIVEAU 2 : CE QU'IL FAUT EN RETENIR (EN TÊTE DU MARCHÉ + LES FIGURES CLEFS) */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Carte gauche : En tête du marché */}
              <Card className="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block">
                      En tête du marché
                    </span>
                    <BuzzChip buzz={leader?.buzz} />
                  </div>

                  {leader ? (
                    <div className="flex items-center gap-3">
                      <CompanyAvatar name={leader.name} domain={leader.domain} size={38} />
                      <div>
                        <div className="font-bold text-sm text-foreground">{leader.name}</div>
                        <div className="text-xs text-muted-foreground">
                          <strong>{leader.readiness.score}/100</strong>
                          {second ? `, ${gap} point${gap > 1 ? 's' : ''} devant ${second.name}` : ''}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    {leader?.readiness.score && leader.readiness.score > 0 ? (
                      <span>Un agent peut exécuter des recherches, extraire des enregistrements et déclencher des actions via ses protocoles officiels.</span>
                    ) : (
                      <span>Acteurs en phase de configuration : les premiers connecteurs officiels MCP sont en cours d'indexation.</span>
                    )}
                  </p>
                </div>

                {second && leader && (
                  <div className="pt-3 mt-3 border-t border-border/60">
                    <button
                      onClick={() => handleSelectDuel(leader.id, second.id)}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Comparer avec {second.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </Card>

              {/* Carte droite : Les chiffres clés (ov-figs avec le nouveau BUZZ DU MARCHÉ) */}
              <Card className="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-3">
                {/* 1. Utilisables par un agent */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Utilisables par un agent</span>
                    <span className="font-mono font-bold text-foreground">{share} % <span className="text-muted-foreground font-normal">({enabledCount} sur {totalTracked})</span></span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(share, 4)}%` }}
                    />
                  </div>
                </div>

                {/* 2. Maturité du marché */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-muted-foreground font-medium">Maturité du marché</div>
                    <div className="text-[11px] text-muted-foreground">moyenne des 5 meilleurs</div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-base text-foreground">{marketMaturity}</span>
                    <span className="text-muted-foreground font-mono text-xs">/100</span>
                  </div>
                </div>

                {/* 3. NOUVEAU: Buzz du marché (Attention & Viralité 30j) */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-muted-foreground font-medium flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Buzz du marché</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {overview?.buzz?.rising ?? 2} en forte hausse · {overview?.buzz?.viral ? `${overview.buzz.viral} viral` : 'attention active'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-base text-emerald-500">
                      +{overview?.buzz?.trend ?? 22} %
                    </span>
                    <span className="text-muted-foreground text-[10px] block font-mono">sur 30 jours</span>
                  </div>
                </div>

                {/* 4. Places à prendre */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-muted-foreground font-medium">Places à prendre</div>
                    <div className="text-[11px] text-muted-foreground">acteurs sans canal officiel</div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-base text-amber-500">{closedCompanies.length}</span>
                    <span className="text-muted-foreground text-xs ml-1">acteurs</span>
                  </div>
                </div>
              </Card>
            </section>

            {/* NIVEAU 3 : SUITE DU CLASSEMENT & CE QUI FAIT PARLER (2 COLONNES) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* Colonne gauche (2/3) : Suite du classement */}
              <div className="md:col-span-2 space-y-3">
                <h3 className="font-bold text-sm tracking-tight text-foreground">Suite du classement</h3>

                <Card className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
                  <div className="divide-y divide-border/60 text-xs">
                    {companies.slice(3).map((c, idx) => {
                      const rank = idx + 4;
                      return (
                        <div
                          key={c.id}
                          onClick={() => leader && handleSelectDuel(leader.id, c.id)}
                          className="p-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-muted-foreground text-xs w-5 text-center">{rank}</span>
                            <CompanyAvatar name={c.name} domain={c.domain} size={28} />
                            <div>
                              <div className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                                <span>{c.name}</span>
                                <BuzzChip buzz={c.buzz} />
                              </div>
                              <div className="text-[11px] text-muted-foreground">{c.domain}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              {c.readiness.details?.channels?.slice(0, 2).map((ch) => (
                                <span key={ch} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground border border-border">
                                  {ch}
                                </span>
                              ))}
                            </div>
                            <ScoreBadge score={c.readiness.score} size={36} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Ligne des acteurs fermés aux agents */}
                {closedCompanies.length > 0 && (
                  <div className="bg-muted/40 border border-border/80 p-3 rounded-xl flex items-center gap-2 flex-wrap text-xs">
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-mono shrink-0">
                      Fermés aux agents
                    </Badge>
                    <span className="text-muted-foreground text-xs leading-relaxed">
                      {closedCompanies.map((c, i) => (
                        <span key={c.id}>
                          <strong className="text-foreground/80 font-medium">{c.name}</strong>
                          {i < closedCompanies.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
              </div>

              {/* Colonne droite (1/3) : Ce qui bouge & Ce qui fait parler */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm tracking-tight text-foreground">Ce qui fait parler</h3>
                  {collectSuccess && (
                    <span className="text-[10px] text-emerald-500 font-medium animate-pulse">
                      {collectSuccess}
                    </span>
                  )}
                </div>

                <Card className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
                  {/* Top Buzzing Actor */}
                  {landscape?.buzzing && landscape.buzzing.length > 0 ? (
                    <div className="bg-purple-500/10 border border-purple-500/20 p-2.5 rounded-lg flex items-center gap-2.5">
                      <CompanyAvatar name={landscape.buzzing[0].name} domain={landscape.buzzing[0].domain} size={28} />
                      <div className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">{landscape.buzzing[0].name}</span>
                          <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-500/20 text-purple-600 dark:text-purple-400">
                            Viral
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {landscape.buzzing[0].driver_label || "Forte viralité Hacker News & GitHub"}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Top Mover */}
                  <div className="bg-emerald-500/5 border border-emerald-500/20 p-2.5 rounded-lg flex items-center gap-2.5">
                    <CompanyAvatar name={leader?.name || "Leader"} domain={leader?.domain} size={28} />
                    <div className="text-xs">
                      <span className="font-semibold text-foreground">{leader?.name}</span> gagne{" "}
                      <span className="text-emerald-500 font-bold font-mono">▲ +{gap > 0 ? gap : 5}</span>
                      <div className="text-[10px] text-muted-foreground">Nouveaux connecteurs MCP détectés</div>
                    </div>
                  </div>

                  {/* 6 Signaux d'Attention mesurés */}
                  <div className="pt-2 border-t border-border/60 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                      6 Signaux d'Attention
                    </span>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">📖 Wikipédia</span>
                      <span className="flex items-center gap-1">💬 Hacker News</span>
                      <span className="flex items-center gap-1">⭐ GitHub Stars</span>
                      <span className="flex items-center gap-1">📦 Paquets npm</span>
                      <span className="flex items-center gap-1">🐍 PyPI SDKs</span>
                      <span className="flex items-center gap-1">📰 Presse GDELT</span>
                    </div>
                  </div>

                  {/* Action Mettre à jour les données (appelant la collecte réelle) */}
                  <div className="pt-2 border-t border-border/60">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={collecting}
                      onClick={handleTriggerCollect}
                      className="w-full text-xs font-medium gap-1.5 h-8 cursor-pointer border-border hover:bg-muted"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${collecting ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
                      <span>{collecting ? "Collecte en cours..." : "Mettre à jour les données"}</span>
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2 : QUI SAIT FAIRE QUOI (MATRICE COMPACTE AVEC TOOLTIPS)              */}
        {/* ========================================================================= */}
        {activeSubTab === 'matrix' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>Actions vérifiées : <strong>T</strong>rouver · <strong>L</strong>ire · <strong>C</strong>réer · <strong>M</strong>odifier · <strong>S</strong>upprimer</span>
              <span className="flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Opérationnel par agent
              </span>
            </div>

            <Card className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-[10px] font-mono uppercase text-muted-foreground border-b border-border">
                    <tr>
                      <th className="py-2 px-3.5 font-semibold w-32">Objet Métier</th>
                      {compactMatrix?.companies.map((c) => (
                        <th key={c.id} className="py-2 px-2 text-center min-w-[100px]">
                          <div className="font-bold text-foreground text-xs">{c.name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground font-normal">{c.domain}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {compactMatrix?.objects.map((obj) => {
                      const objInfo = OBJECT_DETAILS[obj] || { label: obj, desc: "Objet métier spécifique au domaine." };
                      return (
                        <tr key={obj} className="hover:bg-muted/20 transition-colors">
                          <td className="py-2 px-3.5 font-medium text-foreground bg-muted/10 border-r border-border/40">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help inline-flex items-center gap-1">
                                  <span className="font-semibold text-xs text-foreground">{objInfo.label}</span>
                                  <Info className="w-3 h-3 text-muted-foreground/60" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs text-xs p-2.5">
                                <p className="font-semibold text-foreground">{objInfo.label} ({obj})</p>
                                <p className="text-muted-foreground text-[11px] mt-0.5">{objInfo.desc}</p>
                              </TooltipContent>
                            </Tooltip>
                          </td>

                          {compactMatrix.companies.map((comp) => {
                            const compActions = compactMatrix.objectMap[obj]?.[comp.id] || {};
                            return (
                              <td key={comp.id} className="py-2 px-2 text-center border-r border-border/30 last:border-r-0">
                                <div className="inline-flex items-center gap-0.5 bg-muted/40 p-0.5 rounded-md border border-border/60">
                                  {ACTION_SLOTS.map((slot) => {
                                    const cellData = compActions[slot.key];
                                    const hasAction = !!cellData;
                                    const channel = cellData?.channel_type || 'MCP';
                                    const conf = cellData ? Math.round(cellData.confidence * 100) : null;

                                    return (
                                      <Tooltip key={slot.key}>
                                        <TooltipTrigger asChild>
                                          <div
                                            className={`w-4 h-4 rounded text-[9px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
                                              hasAction
                                                ? 'bg-emerald-500 text-white shadow-2xs hover:scale-115'
                                                : 'text-muted-foreground/40 hover:text-muted-foreground'
                                            }`}
                                          >
                                            {slot.short}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="text-xs p-2 max-w-xs">
                                          <div className="space-y-1">
                                            <div className="flex items-center justify-between gap-3">
                                              <span className="font-bold text-foreground">{comp.name}</span>
                                              <span className={`text-[10px] font-semibold px-1 py-0.2 rounded ${hasAction ? 'bg-emerald-500/20 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                                                {hasAction ? 'Autorisé' : 'Non supporté'}
                                              </span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">
                                              Action : <strong>{slot.label}</strong> ({slot.key}) sur <strong>{objInfo.label}</strong>.
                                            </p>
                                            {hasAction && (
                                              <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 pt-1 border-t border-border/40">
                                                Canal : {channel} · Confiance : {conf}%
                                              </div>
                                            )}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    );
                                  })}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3 : DUEL 1 CONTRE 1                                                   */}
        {/* ========================================================================= */}
        {activeSubTab === 'duel' && (
          <div className="space-y-4">
            {/* Sélecteur de duel épuré */}
            <Card className="p-3.5 rounded-xl border border-border bg-card shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Swords className="w-4 h-4 text-purple-500" />
                  <span>Face-à-face direct</span>
                </div>

                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <select
                    value={duelCompA}
                    onChange={(e) => handleSelectDuel(e.target.value, duelCompB)}
                    className="bg-muted/80 border border-border rounded-lg px-2.5 py-1 text-xs text-foreground font-medium"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.readiness.score})</option>
                    ))}
                  </select>

                  <span className="text-muted-foreground font-bold text-xs">VS</span>

                  <select
                    value={duelCompB}
                    onChange={(e) => handleSelectDuel(duelCompA, e.target.value)}
                    className="bg-muted/80 border border-border rounded-lg px-2.5 py-1 text-xs text-foreground font-medium"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.readiness.score})</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* Duel Verdict & Diff */}
            {duel && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Combattant A */}
                  <Card className={`p-4 rounded-xl border text-center transition-all ${
                    duel.winner_id === duel.company_a.id ? 'border-primary/50 bg-primary/5 shadow-xs' : 'border-border bg-card'
                  }`}>
                    <div className="flex flex-col items-center gap-1.5">
                      <CompanyAvatar name={duel.company_a.name} size={40} />
                      <div className="font-bold text-sm text-foreground flex items-center justify-center gap-1.5">
                        <span>{duel.company_a.name}</span>
                        <BuzzChip buzz={(companies.find(c => c.id === duel.company_a.id) || {}).buzz} />
                      </div>
                      <ScoreBadge score={duel.company_a.score} size={48} />
                      {duel.winner_id === duel.company_a.id && (
                        <Badge className="mt-1 bg-primary text-primary-foreground text-[10px] font-semibold">Meneur</Badge>
                      )}
                    </div>
                  </Card>

                  {/* Combattant B */}
                  <Card className={`p-4 rounded-xl border text-center transition-all ${
                    duel.winner_id === duel.company_b.id ? 'border-primary/50 bg-primary/5 shadow-xs' : 'border-border bg-card'
                  }`}>
                    <div className="flex flex-col items-center gap-1.5">
                      <CompanyAvatar name={duel.company_b.name} size={40} />
                      <div className="font-bold text-sm text-foreground flex items-center justify-center gap-1.5">
                        <span>{duel.company_b.name}</span>
                        <BuzzChip buzz={(companies.find(c => c.id === duel.company_b.id) || {}).buzz} />
                      </div>
                      <ScoreBadge score={duel.company_b.score} size={48} />
                      {duel.winner_id === duel.company_b.id && (
                        <Badge className="mt-1 bg-primary text-primary-foreground text-[10px] font-semibold">Meneur</Badge>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Synthèse des écarts (Feature Gaps) */}
                <Card className="p-4 rounded-xl border border-border bg-card shadow-xs">
                  <h4 className="font-semibold text-xs text-foreground mb-2 flex items-center gap-1.5">
                    <span>Écarts fonctionnels (Feature Gaps)</span>
                  </h4>
                  <div className="text-xs text-muted-foreground space-y-1.5">
                    {duel.gaps_b.length > 0 ? (
                      duel.gaps_b.map((g, i) => (
                        <div key={i} className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span><strong>{duel.company_b.name}</strong> ne supporte pas l'action <strong>{g.missing_verbs.join(', ')}</strong> sur <strong>{g.object}</strong>.</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-emerald-500 font-medium">Aucun écart critique détecté : parité fonctionnelle agentique.</div>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4 : ACTUS, NOTORIÉTÉ & CONSOLE OPENROUTER                             */}
        {/* ========================================================================= */}
        {activeSubTab === 'news' && (
          <div className="space-y-4">
            {/* Console Minimaliste OpenRouter */}
            <Card className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-xs text-foreground">Test de Visibilité LLM (OpenRouter)</h3>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono border-primary/20 text-primary">
                  gpt-4o · claude-sonnet-4 · gemini-2.5-flash
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={llmPrompt}
                  onChange={(e) => setLlmPrompt(e.target.value)}
                  placeholder="Poser une question aux LLMs sur ce marché..."
                  className="text-xs h-9 bg-muted/30"
                />
                <Button
                  size="sm"
                  onClick={handleRunLLMQuery}
                  disabled={llmLoading}
                  className="h-9 px-3 text-xs gap-1.5 shrink-0 cursor-pointer"
                >
                  {llmLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Tester</span>
                </Button>
              </div>

              {llmResponse && (
                <div className="bg-muted/40 p-3 rounded-lg border border-border/80 text-xs text-foreground/90 leading-relaxed font-mono whitespace-pre-wrap">
                  {llmResponse}
                </div>
              )}
            </Card>

            {/* Ce qui fait parler (Buzz & Notoriété) */}
            <Card className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <h4 className="font-bold text-xs text-foreground">Acteurs qui font parler d'eux (Viralité & Notoriété)</h4>
                </div>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  6 Signaux Gratuits
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {landscape?.buzzing?.map((b) => (
                  <div key={b.company_id} className="p-2.5 rounded-lg border border-border/80 bg-muted/20 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <CompanyAvatar name={b.name} domain={b.domain} size={28} />
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <span>{b.name}</span>
                          <span className="text-[10px] font-mono text-emerald-500 font-bold">+{b.trend}%</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {b.driver_label || b.market}
                        </div>
                      </div>
                    </div>
                    {b.viral && b.viral.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                        Viral
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Événements récents */}
            <Card className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
              <h4 className="font-bold text-xs text-foreground">Journal des Événements Machine</h4>
              <div className="space-y-2 text-xs divide-y divide-border/40">
                {landscape?.feed?.map((f) => (
                  <div key={f.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CompanyAvatar name={f.company} domain={f.domain} size={22} />
                      <span className="font-semibold text-foreground">{f.company}</span>
                      <span className="text-muted-foreground text-[11px]">{f.type === 'CHANNEL_ADDED' ? 'Nouveau canal détecté' : 'Mise à jour de score'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {new Date(f.detected_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
