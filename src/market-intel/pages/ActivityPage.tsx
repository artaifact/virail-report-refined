import { Suspense } from "react";
import EventFeed from "../components/EventFeed";
import FilterSelect from "../components/FilterSelect";
import MarketNav from "../components/MarketNav";
import { api, type MarketEvent, type Overview } from "../lib/api";
import { EVENT_LABELS } from "../lib/format";
import { levelName } from "../lib/labels";
import { useLoader, useParams, useSearchParams } from "../compat";
import { guard } from "../views";

type Search = { company?: string; type?: string; level?: string; baseline?: string };

export default function ActivityPage() {
  const { id } = useParams() as { id: string };
  const query = useSearchParams();
  const sp: Search = Object.fromEntries(query.entries());
  const qs = new URLSearchParams({ include_baseline: sp.baseline === "1" ? "true" : "false", limit: "300" });
  for (const k of ["company", "type", "level"] as const) if (sp[k]) qs.set(k, sp[k]!);
  const state = useLoader(async () => {
    const [events, overview] = await Promise.all([
      api<MarketEvent[]>(`/markets/${id}/events?${qs}`),
      api<Overview>(`/markets/${id}/overview`),
    ]);
    return { events, overview };
  }, [id, qs.toString()]);
  const blocked = guard(state);
  if (blocked) return blocked;
  const { events, overview } = state.data!;

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Actus</span>
          <h1>Ce qui a bougé</h1>
          <p className="subtitle">Chaque nouveauté repérée chez les acteurs du marché, datée, avec sa source.</p>
        </div>
        <MarketNav marketId={id} current="/activity" />
      </div>

      <div className="toolbar">
        <Suspense>
          <FilterSelect name="company" label="Acteur" options={[{ value: "", label: "Tous" }, ...overview.companies.map((c) => ({ value: c.id, label: c.name }))]} />
          <FilterSelect name="type" label="Type" options={[{ value: "", label: "Tous" }, ...Object.entries(EVENT_LABELS).map(([v, l]) => ({ value: v, label: l }))]} />
          <FilterSelect name="level" label="Fiabilité" options={[{ value: "", label: "Toutes" }, ...["OBSERVED", "DECLARED", "ESTIMATED"].map((l) => ({ value: l, label: levelName(l) }))]} />
          <FilterSelect name="baseline" label="Premier relevé" options={[{ value: "", label: "Masqué" }, { value: "1", label: "Affiché" }]} />
        </Suspense>
        <span className="meta" style={{ marginLeft: "auto" }}>{events.length} événement{events.length > 1 ? "s" : ""}</span>
      </div>

      <section className="card">
        <EventFeed events={events} marketId={id} />
      </section>
    </main>
  );
}
