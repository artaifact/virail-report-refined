import { ReactNode } from "react";
import { Link, useLoader, useSearchParams } from "../compat";
import { guard, NotFoundView, ErrorView, MarketContentSkeleton, LandscapeSkeleton } from "../views";
import { Landscape } from "../components/Landscape";
import { trendText } from "../components/Buzz";
import { heatOf } from "../components/Pulse";
import { PlaceBadge } from "../components/StorePlace";
import { PositionBadge } from "../components/Position";
import { positionOf } from "../lib/position";
import Board from "../components/workspace/Board";
import Drawer from "../components/workspace/Drawer";
import Rail, { type RailMarket } from "../components/workspace/Rail";
import Side from "../components/workspace/Side";
import {
  api,
  type CatalogCoverageRow,
  type Landscape as LandscapeData,
  type MarketCatalog,
  type MarketEvent,
  type MarketOntology,
  type Matrix,
  type Overview,
} from "../lib/api";
import { buildGrid } from "../lib/grid";
import { familyOf } from "../lib/families";
import { mood } from "../lib/fun";
import { objectFr } from "../lib/labels";

export default function MarketsHome() {
  const searchParams = useSearchParams();
  const m = searchParams.get("m") || undefined;
  const c = searchParams.get("c") || undefined;
  const vs = searchParams.get("vs") || undefined;
  const all = searchParams.get("all") || undefined;

  // 1. Charger la liste des marchés pour le rail gauche (mis en cache globalement)
  const railState = useLoader(async () => {
    const land = await api<LandscapeData>("/landscape");
    const rail: RailMarket[] = land.markets.map((item) => ({
      id: item.id,
      name: item.name,
      family: familyOf(item.id, item.name),
      events: item.events_30d,
      tone: heatOf(item).tone === "hot" ? "hot" : heatOf(item).tone === "warm" ? "warm" : "calm",
    }));
    return { land, rail };
  }, [], "rail");

  // 2. Charger le contenu principal (marché spécifique ou vue d'ensemble)
  const contentState = useLoader(async () => {
    if (!m) {
      const [land, cov] = await Promise.all([
        api<LandscapeData>("/landscape"),
        api<{ markets: CatalogCoverageRow[] }>("/catalog/coverage").catch(() => ({ markets: [] as CatalogCoverageRow[] })),
      ]);
      return { type: "landscape" as const, land, cov: cov.markets };
    } else {
      const [o, matrix, onto, events, plugins, place] = await Promise.all([
        api<Overview>(`/markets/${m}/overview`),
        api<Matrix>(`/markets/${m}/matrix?provenance=official&include_api=false`),
        api<MarketOntology>(`/markets/${m}/ontology`),
        api<MarketEvent[]>(`/markets/${m}/events?include_baseline=false&limit=8`),
        api<MarketCatalog>(`/markets/${m}/catalog`).catch(() => ({ total: 0, tracked: 0, by_store: {}, entries: [] }) as MarketCatalog),
        api<{ markets: CatalogCoverageRow[] }>(`/catalog/coverage?market=${encodeURIComponent(m)}`)
          .then((r) => r.markets[0])
          .catch(() => undefined),
      ]);
      return { type: "market" as const, o, matrix, onto, events, plugins, place };
    }
  }, [m], `content:${m || "landscape"}`);

  // Initial load : tant que le rail n'est pas prêt, on affiche le skeleton complet
  const railBlocked = guard(railState, "ws");
  if (railBlocked) return railBlocked;

  const { rail } = railState.data!;

  // Si le contenu principal est en train de charger (changement de marché) :
  // On conserve le rail interactif et on affiche le skeleton dans le corps principal !
  if (!contentState.data) {
    if (contentState.notFound) return <NotFoundView />;
    if (contentState.error) return <ErrorView error={contentState.error} />;
    return (
      <div className="ws">
        <Rail markets={rail} current={m} drawerOpen={!!c} />
        <main className="ws-main">
          {m ? <MarketContentSkeleton /> : <LandscapeSkeleton />}
        </main>
      </div>
    );
  }

  const content = contentState.data;

  return (
    <div className="ws mi-fade">
      <Rail markets={rail} current={m} drawerOpen={!!c} />
      <main className="ws-main">
        {content.type === "landscape" ? (
          <Landscape land={content.land} coverage={content.cov} />
        ) : (
          <MarketContent
            id={m!}
            sp={{ m, c, vs, all }}
            o={content.o}
            matrix={content.matrix}
            onto={content.onto}
            events={content.events}
            plugins={content.plugins}
            place={content.place}
          />
        )}
      </main>
    </div>
  );
}

function MarketContent({
  id,
  sp,
  o,
  matrix,
  onto,
  events,
  plugins,
  place,
}: {
  id: string;
  sp: { m?: string; c?: string; vs?: string; all?: string };
  o: Overview;
  matrix: Matrix;
  onto: MarketOntology;
  events: MarketEvent[];
  plugins: MarketCatalog;
  place?: CatalogCoverageRow;
}) {
  const { grid, objects } = buildGrid(matrix);
  const ranked = o.companies;
  const share = o.counters.companies_tracked ? Math.round((100 * o.counters.agent_enabled) / o.counters.companies_tracked) : 0;
  const closedAll = ranked.filter((c) => mood(c.readiness, 0).tone === "closed").length;
  const me = ranked.find((c) => c.role === "me");

  const has = (obj: string, cid: string) => (grid.get(obj)?.get(cid) ?? []).some((s) => s !== "none");
  const active = ranked.filter((c) => objects.some((obj) => has(obj, c.id)));
  const exclusive = objects.map((obj) => ({ obj, who: active.filter((c) => has(obj, c.id)) })).filter((x) => x.who.length === 1);
  const generic = new Set(Object.keys(onto.generic ?? {}));
  const virgin = onto.objects.map((x) => x.key).filter((k) => !generic.has(k) && !grid.has(k));
  const myMissing = me ? objects.filter((obj) => !has(obj, me.id) && active.some((c) => has(obj, c.id))) : [];

  const tags = (keys: string[]) => (
    <span className="brief-tags">{keys.map((k) => <span key={k}>{objectFr(k).toLowerCase()}</span>)}</span>
  );
  const insights: { tone: "warn" | "info" | "quiet"; k: string; text: ReactNode }[] = [];
  const position = positionOf({
    buzz: o.buzz,
    events30d: o.pulse.events_30d,
    tracked: o.counters.companies_tracked,
    agentEnabled: o.counters.agent_enabled,
    place,
  });

  if (position.key !== "unknown") {
    insights.push({
      tone: position.key === "closing" || position.key === "window" ? "warn" : "info",
      k: "Position",
      text: <><strong>{position.label}</strong> : {position.advice.charAt(0).toLowerCase() + position.advice.slice(1)}</>,
    });
  }
  if (me && myMissing.length) {
    insights.push({
      tone: "warn",
      k: "Vos manques",
      text: <><strong>{me.name}</strong> n&apos;ouvre rien aux agents sur {tags(myMissing.slice(0, 4))} alors qu&apos;un concurrent le fait.</>,
    });
  } else if (!me && exclusive.length) {
    insights.push({
      tone: "warn",
      k: "Avance exclusive",
      text: <>{exclusive.slice(0, 3).map((x, i) => (
        <span key={x.obj} className="brief-pair">{i > 0 && " · "}<strong>{x.who[0].name}</strong> seul connu sur {tags([x.obj])}</span>
      ))}</>,
    });
  }
  if (virgin.length) {
    insights.push({
      tone: "info",
      k: "Place à prendre",
      text: <>Aucune action connue pour un agent, chez aucun acteur : {tags(virgin.slice(0, 4))}</>,
    });
  }
  if (place?.measured && place.place) {
    const absent = place.leaders_absent ?? [];
    const stores = Object.entries(place.apps_by_store ?? {}).map(([s, n]) => `${s === "chatgpt" ? "ChatGPT" : s === "claude" ? "Claude" : s} ${n}`).join(", ");
    insights.push({
      tone: place.place.key === "libre" ? "info" : "quiet",
      k: "Dans les stores",
      text: <>
        <PlaceBadge row={place} /> <strong>{place.apps}</strong> app{(place.apps ?? 0) > 1 ? "s" : ""} ChatGPT ou Claude servent ce marché{stores ? ` (${stores})` : ""}
        {absent.length > 0
          ? <> ; meneurs encore absents : {absent.slice(0, 3).map((l, i) => <span key={l.id}>{i > 0 && ", "}<strong>{l.name}</strong></span>)}.</>
          : <> ; tous les meneurs y sont.</>}
      </>,
    });
  }
  if (closedAll) {
    insights.push({
      tone: "quiet",
      k: "Fermés aux agents",
      text: <><strong>{closedAll}</strong> acteur{closedAll > 1 ? "s" : ""} sur {ranked.length} sans accès repéré pour un agent.</>,
    });
  }

  const link = (patch: Record<string, string | undefined>) => {
    const next: Record<string, string | undefined> = { m: id, c: sp.c, vs: sp.vs, all: sp.all, ...patch };
    return `/?${new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][])}`;
  };
  const allHref = link({ all: sp.all === "1" ? undefined : "1" });
  const momentum = o.pulse.momentum;

  return (
    <>
      <header className="landscape-header">
        <div className="landscape-title-area">
          <div className="market-eyebrow-row">
            <span className="landscape-eyebrow">Marché · {familyOf(id, o.market.name)}</span>
            <Link href={`/markets/${id}/settings`} className="market-gear-btn" title="Fiabilité, vocabulaire, acteurs suivis">
              ⚙ Réglages
            </Link>
          </div>
          <div className="market-title-wrap">
            <h1 className="landscape-h1">{o.market.name}</h1>
            <PositionBadge p={position} />
          </div>
        </div>

        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-label">Utilisables par un agent</span>
            <div className="kpi-val kpi-accent">{share} %</div>
            <div className="kpi-progress">
              <div className="kpi-progress-bar" style={{ width: `${share}%` }} />
            </div>
            <span className="kpi-sub">{o.counters.agent_enabled} sur {o.counters.companies_tracked} acteurs</span>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Maturité du marché</span>
            <div className="kpi-val">{o.pulse.maturity} <span className="kpi-denom">/100</span></div>
            <span className="kpi-sub">
              {momentum ? (
                <span className={`trend ${momentum > 0 ? "up" : "down"}`}>
                  {momentum > 0 ? "▲ +" : "▼ "}{momentum} momentum
                </span>
              ) : "Indice de maturité"}
            </span>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Attention / Buzz (30j)</span>
            <div className="kpi-val kpi-good">
              {o.buzz.trend !== null ? trendText(o.buzz.trend) : "Stable"}
            </div>
            <span className="kpi-sub">{o.buzz.measured ? "Activité mesurée" : "Faible volume"}</span>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Acteurs suivis</span>
            <div className="kpi-val">{o.counters.companies_tracked}</div>
            <span className="kpi-sub">{ranked.length} répertoriés</span>
          </div>
        </div>
      </header>

      {insights.length > 0 && (
        <section className="ws-card ws-brief-card" aria-label="À retenir">
          <div className="ws-brief-head">
            <div className="ws-brief-title-wrap">
              <span className="ws-brief-icon">⚡</span>
              <h2 className="ws-brief-title">À retenir</h2>
            </div>
            <span className="meta">Synthèse stratégique & opportunités agentiques</span>
          </div>
          <div className="ws-brief-rows">
            {insights.slice(0, 5).map((i) => (
              <div key={i.k} className={`ws-brief-row ${i.tone}`}>
                <span className={`ws-brief-pill ${i.tone}`}>{i.k}</span>
                <div className="ws-brief-desc">{i.text}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="ws-grid">
        <Board o={o} grid={grid} objects={objects} marketId={id} selected={sp.c} all={sp.all === "1"} allHref={allHref} plugins={plugins} />
        <Side o={o} events={events} marketId={id} />
      </div>

      {sp.c && ranked.some((co) => co.id === sp.c) && (
        <Drawer o={o} marketId={id} company={sp.c} rival={sp.vs && ranked.some((co) => co.id === sp.vs) ? sp.vs : undefined} />
      )}
    </>
  );
}
