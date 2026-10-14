import { Link, useLoader } from "../compat";
import { CreateMarketForm } from "./Actions";
import { Logo } from "./Fun";
import { PositionBadge, PositionGrid } from "./Position";
import { PLACE_HELP, PlaceBadge } from "./StorePlace";
import { api, type CatalogCoverageRow, type Health, type Landscape as LandscapeData, type OntologyTemplate } from "../lib/api";
import { describeEvent, eventDate, PROVIDER_LABELS } from "../lib/format";
import { eventTone } from "../lib/fun";
import { POSITION_ORDER, positionOf } from "../lib/position";


/** Tous les marchés en une seule table : quel marché regarder d'abord, qui le mène, où le terrain est libre côté
 *  stores. Une ligne par marché, un clic ouvre le marché. */
export function Landscape({ land, coverage }: { land: LandscapeData; coverage: CatalogCoverageRow[] }) {
  const state = useLoader(async () => {
    const [health, templates] = await Promise.all([
      api<Health>("/health").catch(() => ({ status: "ok", llm_providers: [], llm_extraction: false, github_token: false, firecrawl: false, web_search: null } as Health)),
      api<OntologyTemplate[]>("/ontology-templates").catch(() => [] as OntologyTemplate[]),
    ]);
    return { health, templates };
  }, []);

  const { health, templates } = state.data ?? { health: { status: "ok", llm_providers: [], llm_extraction: false, github_token: false, firecrawl: false, web_search: null }, templates: [] };
  const t = land.totals;
  const covOf = new Map(coverage.map((r) => [r.market_id, r]));
  const missing = [
    !health.llm_providers.length && "accès aux IA",
    !health.github_token && "token GitHub",
    !health.web_search && "recherche web",
  ].filter(Boolean);
  const share = t.tracked ? Math.round((100 * t.agent_enabled) / t.tracked) : 0;
  // position de chaque marché : demande (buzz) × occupation (stores, part d'acteurs utilisables), nuancée par l'activité
  const posOf = new Map(land.markets.map((m) => [m.id, positionOf({
    buzz: m.buzz, events30d: m.events_30d, tracked: m.tracked, agentEnabled: m.agent_enabled, place: covOf.get(m.id),
  })]));
  const items = land.markets.map((m) => ({ id: m.id, name: m.name, p: posOf.get(m.id)! }));
  // la table suit le même ordre de lecture que la carte : les fenêtres d'abord
  const rank = (id: string) => POSITION_ORDER.indexOf(posOf.get(id)!.key);
  const markets = [...land.markets].sort((a, b) => rank(a.id) - rank(b.id));

  return (
    <div className="embed">
      <header className="landscape-header">
        <div className="landscape-title-area">
          <span className="landscape-eyebrow">Intelligence Marché & Agents Autonomes</span>
          <h1 className="landscape-h1">Vos marchés face aux agents IA</h1>
          <p className="landscape-desc">
            Cartographie en continu de l'adoption par les agents IA, de la présence dans les stores ChatGPT & Claude, et des fenêtres d'opportunité.
          </p>
        </div>

        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-label">Marchés suivis</span>
            <div className="kpi-val">{t.markets}</div>
            <span className="kpi-sub">38 secteurs d'activité</span>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Acteurs analysés</span>
            <div className="kpi-val">{t.tracked.toLocaleString("fr-FR")}</div>
            <span className="kpi-sub">Éditeurs & services</span>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Utilisables par un agent</span>
            <div className="kpi-val kpi-accent">{share} %</div>
            <div className="kpi-progress">
              <div className="kpi-progress-bar" style={{ width: `${share}%` }} />
            </div>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Nouveautés (30 jours)</span>
            <div className="kpi-val kpi-good">+{t.events_30d}</div>
            <span className="kpi-sub">Mouvements récents</span>
          </div>
        </div>
      </header>

      <section className="ws-card">
        <div className="ws-card-head">
          <h2>Où se lancer</h2>
          <span className="meta">la demande monte-t-elle ? reste-t-il de la place pour les agents ? Survolez un marché pour ses chiffres.</span>
        </div>
        <PositionGrid items={items} />
      </section>

      <div className="ws-grid">
        <section className="ws-card">
          <div className="ws-card-head">
            <h2>Quel marché regarder d&apos;abord</h2>
            <span className="meta" title={PLACE_HELP}>des fenêtres ouvertes aux marchés installés · « stores » : combien d&apos;apps ChatGPT et Claude servent déjà le marché</span>
          </div>
          <div className="board-scroll">
            <table className="board-table markets-table">
              <thead>
                <tr><th>Marché</th><th>En tête</th><th className="c-score">Utilisables</th><th>Position</th><th title={PLACE_HELP}>Place dans les stores</th></tr>
              </thead>
              <tbody>
                {markets.map((m) => {
                  const lead = m.top[0];
                  const cov = covOf.get(m.id);
                  const share = m.tracked ? Math.round((100 * m.agent_enabled) / m.tracked) : 0;
                  return (
                    <tr key={m.id} className="market-table-row">
                      <td>
                        <Link href={`/?m=${m.id}`} scroll={false} className="market-name-link">
                          <strong>{m.name}</strong>
                        </Link>
                      </td>
                      <td>
                        {lead ? (
                          <span className="lead-chip">
                            <Logo name={lead.name} domain={lead.domain} size={20} />
                            <span className="lead-name">{lead.name}</span>
                            <span className="lead-score">{lead.score}</span>
                          </span>
                        ) : <span className="meta">—</span>}
                      </td>
                      <td className="c-score">
                        <div className="share-cell">
                          <span className="share-num">{share} %</span>
                          <div className="share-bar"><span style={{ width: `${share}%` }} /></div>
                        </div>
                      </td>
                      <td><PositionBadge p={posOf.get(m.id)!} /></td>
                      <td>
                        <PlaceBadge row={cov} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="ws-side">
          <section className="ws-card">
            <div className="ws-card-head"><h2>Ce qui bouge</h2></div>
            <ul className="news">
              {land.movers.slice(0, 4).map((x) => (
                <li key={`${x.market_id}-${x.company_id}`}>
                  <Logo name={x.name} domain={x.domain} size={24} />
                  <span>
                    <Link href={`/?m=${x.market_id}&c=${x.company_id}`} scroll={false}><strong>{x.name}</strong></Link>{" "}
                    <span className={`trend ${x.delta > 0 ? "up" : "down"}`}>{x.delta > 0 ? "▲ +" : "▼ "}{x.delta}</span>
                    <span className="meta" style={{ display: "block" }}>{x.market}</span>
                  </span>
                </li>
              ))}
              {land.feed.slice(0, 5).map((e) => (
                <li key={`e${e.id}`}>
                  <Logo name={e.company} domain={e.domain} size={24} />
                  <span>
                    <span className={`dot dot-${eventTone(e.type)}`} aria-hidden="true" />
                    <strong>{e.company}</strong> {describeEvent(e)}
                    <span className="meta" style={{ display: "block" }}>{e.market} · {eventDate(e)}</span>
                  </span>
                </li>
              ))}
              {!land.movers.length && !land.feed.length && <li className="quiet-note">Rien de neuf ce mois-ci.</li>}
            </ul>
          </section>
        </aside>
      </div>

      <details className="fold card">
        <summary>Suivre un nouveau marché</summary>
        <div style={{ marginTop: 14 }}><CreateMarketForm templates={templates} /></div>
      </details>

      <p className="meta" style={{ margin: 0 }}>
        Relevé chaque jour : annuaires ChatGPT et Claude, serveurs MCP, documentations, API publiques, réponses des IA.
        {missing.length > 0 && <> Sources non branchées : {missing.join(", ")}.</>}
        {health.llm_providers.length > 0 && <> IA interrogées : {health.llm_providers.map((p) => PROVIDER_LABELS[p] ?? p).join(", ")}.</>}{" "}
        <Link href="/aide" style={{ color: "var(--accent-ink)" }}>Lexique et méthode →</Link>
      </p>
    </div>
  );
}
