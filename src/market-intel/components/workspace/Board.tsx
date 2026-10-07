import { Link } from "../../compat";
import { ActionGauge, countActions, type SlotState } from "../ActionGauge";
import { BuzzChip } from "../Buzz";
import { DataFlag, ScoreOrReview } from "../DataFlag";
import { Logo, ScoreRing } from "../Fun";
import type { Grid } from "../../lib/grid";
import type { MarketCatalog, Overview } from "../../lib/api";
import FollowButton from "./FollowButton";
import { abilities, levelTone, mood } from "../../lib/fun";
import { objectFr } from "../../lib/labels";

const SHOWN_SUBJECTS = 5;
const SHOWN_ROWS = 12; // on lit d'abord la tête du classement ; la suite est repliée
const ACCESS: { type: string; label: string; store?: string }[] = [
  { type: "MCP", label: "MCP" },
  { type: "CONNECTOR_CLAUDE", label: "Claude", store: "claude" },
  { type: "APP_CHATGPT", label: "ChatGPT", store: "chatgpt" },
];

/** Le classement ET la matrice en un seul tableau : une ligne par acteur, sa note, sa tendance, ce qu'un agent peut
 *  faire sur les sujets les plus répandus, et par où il est joignable. Un clic ouvre sa fiche dans le panneau. */
export default function Board({ o, grid, objects, marketId, selected, all, allHref, plugins }: {
  o: Overview; grid: Grid; objects: string[]; marketId: string; selected?: string; all: boolean; allHref: string;
  plugins: MarketCatalog;
}) {
  // plugins d'un acteur suivi, par annuaire : la colonne « Accès » dit où il est et combien d'outils y sont proposés
  const perCompany = new Map<string, Record<string, number>>();
  for (const e of plugins.entries) {
    if (e.kind !== "tracked" || !e.company_id) continue;
    const by = perCompany.get(e.company_id) ?? {};
    by[e.store] = (by[e.store] ?? 0) + 1;
    perCompany.set(e.company_id, by);
  }
  const neighbors = plugins.entries.filter((e) => e.kind === "neighbor");
  const subjects = all ? objects : objects.slice(0, SHOWN_SUBJECTS);
  const href = (id: string) => `/?m=${marketId}&c=${id}`;
  const open = o.companies.filter((c) => mood(c.readiness, 0).tone !== "closed");
  const closed = o.companies.filter((c) => mood(c.readiness, 0).tone === "closed");
  return (
    <section className="ws-card">
      <div className="ws-card-head">
        <h2>Qui est présent sur ce marché</h2>
        <span className="meta">note sur 100 · jauge : actions possibles pour un agent (trouver, lire, créer, modifier, supprimer)</span>
      </div>
      <div className="board-scroll">
        <table className="board-table">
          <thead>
            <tr>
              <th className="c-rank">#</th>
              <th>Acteur</th>
              <th className="c-score">Note</th>
              {subjects.map((s) => <th key={s} className="c-subject" title={objectFr(s)}><span>{objectFr(s)}</span></th>)}
              <th className="c-access">Accès</th>
            </tr>
          </thead>
          <tbody>
            {open.slice(0, SHOWN_ROWS).map((c, i) => {
              const types = new Set(c.readiness.details?.channel_types ?? []);
              const can = abilities(c.readiness.details?.slots ?? [], 1);
              return (
                <tr key={c.id} className={`${selected === c.id ? "sel" : ""} ${c.role === "me" || c.followed ? "mine" : ""}`}>
                  <td className="c-rank">{i + 1}</td>
                  <td>
                    <Link href={href(c.id)} scroll={false} className="who-link">
                      <Logo name={c.name} domain={c.domain} size={28} />
                      <span className="who">
                        <span className="name">
                          {c.name}
                          {c.role === "me" && <span className="you"> vous</span>}
                          {c.role !== "me" && c.followed && <span className="followed-tag">★</span>}
                          {" "}<BuzzChip buzz={c.buzz} onlyNotable />
                        </span>
                        {can && <span className="meta">peut {can}</span>}
                      </span>
                    </Link>
                  </td>
                  <td className="c-score">
                    <span className="score-cell">
                      <span className="score-cell"><ScoreOrReview score={c.readiness.score} tone={levelTone(c.readiness.label)} size={34} data={c.data} /><DataFlag data={c.data} /></span>
                      {c.trend?.delta ? (
                        <span className={`trend ${c.trend.delta > 0 ? "up" : "down"}`} title={c.trend.reasons.join("\n")}>
                          {c.trend.delta > 0 ? "▲" : "▼"}{Math.abs(c.trend.delta)}
                        </span>
                      ) : null}
                    </span>
                  </td>
                  {subjects.map((s) => {
                    const states: SlotState[] | undefined = grid.get(s)?.get(c.id);
                    return (
                      <td key={s} className="c-subject">
                        {states && countActions(states) + states.filter((x) => x === "api").length > 0
                          ? <ActionGauge states={states} label={`${c.name} · ${objectFr(s)}`} />
                          : <span className="none">·</span>}
                      </td>
                    );
                  })}
                  <td className="c-access">
                    <span className="access-chips">
                      {ACCESS.map((a) => {
                        const n = a.store ? perCompany.get(c.id)?.[a.store] ?? 0 : 0;
                        return (
                          <span key={a.type} className={types.has(a.type) || n > 0 ? "on" : "off"}
                            title={n > 1 ? `${n} plugins ${a.label} de cet acteur` : undefined}>
                            {a.label}{n > 1 ? ` ${n}` : ""}
                          </span>
                        );
                      })}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {open.length > SHOWN_ROWS && (
        <details className="fold">
          <summary>Voir les {open.length - SHOWN_ROWS} autres acteurs ouverts aux agents</summary>
          <ol className="board rest" start={SHOWN_ROWS + 1}>
            {open.slice(SHOWN_ROWS).map((c) => (
              <li key={c.id} className={selected === c.id ? "sel" : ""}>
                <Link href={href(c.id)} scroll={false}>
                  <Logo name={c.name} domain={c.domain} size={24} />
                  <span className="name">{c.name}</span>
                  <span className="meta">{abilities(c.readiness.details?.slots ?? [], 1) ? `peut ${abilities(c.readiness.details?.slots ?? [], 1)}` : ""}</span>
                  <ScoreOrReview score={c.readiness.score} tone={levelTone(c.readiness.label)} size={30} data={c.data} />
                </Link>
              </li>
            ))}
          </ol>
        </details>
      )}
      {neighbors.length > 0 && (
        <details className="fold">
          <summary>
            {neighbors.length} autres plugins du domaine, d&apos;éditeurs que vous ne suivez pas
            <span className="meta"> · {Object.entries(plugins.by_store).map(([st, n]) => `${st === "chatgpt" ? "ChatGPT" : st === "claude" ? "Claude" : st} ${n}`).join(", ")} au total</span>
          </summary>
          <ul className="neighbors">
            {neighbors.slice(0, 15).map((e) => (
              <li key={e.id}>
                <span className="neighbor-text">
                  {e.url ? <a href={e.url} target="_blank" rel="noopener noreferrer"><strong>{e.name}</strong></a> : <strong>{e.name}</strong>}
                  <span className="meta"> {e.store === "chatgpt" ? "ChatGPT" : "Claude"}{e.developer ? ` · ${e.developer}` : ""}{e.tagline ? ` · ${e.tagline}` : ""}</span>
                </span>
                <FollowButton entryId={e.id} marketId={marketId} />
              </li>
            ))}
          </ul>
          {neighbors.length > 15 && <Link href="/catalog" className="more">Les {neighbors.length - 15} autres dans les catalogues →</Link>}
        </details>
      )}
      <div className="ws-card-foot">
        {objects.length > SHOWN_SUBJECTS && (
          <Link href={allHref} scroll={false} className="more">
            {all ? "← Les sujets les plus répandus seulement" : `Voir les ${objects.length - SHOWN_SUBJECTS} autres sujets →`}
          </Link>
        )}
        {closed.length > 0 && (
          <span className="closed-line">
            <span className="mood mood-closed">Fermés aux agents</span>
            {closed.slice(0, 10).map((c, i) => (
              <span key={c.id}><Link href={href(c.id)} scroll={false}>{c.name}</Link>{i < Math.min(closed.length, 10) - 1 ? ", " : ""}</span>
            ))}
            {closed.length > 10 && <span className="meta"> et {closed.length - 10} autres</span>}
          </span>
        )}
      </div>
    </section>
  );
}
