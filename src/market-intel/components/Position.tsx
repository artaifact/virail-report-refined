/** Pastille de position d'un marché, et « Où se lancer » : mini-carte demande × occupation,
 *  marchés cibles en tuiles avec métriques précises, et catégories repliables en badges. */
import { Link } from "../compat";
import { POSITION_LABEL, type Position, type PositionKey } from "../lib/position";

export function PositionBadge({ p }: { p: Position }) {
  return (
    <span className={`pos-badge pos-${p.key}`} title={[p.advice, ...p.criteria].join(" ")}>
      {p.label}
    </span>
  );
}

type Item = { id: string; name: string; p: Position };

const trendTxt = (t: number | null) => (t === null ? "—" : `${t > 0 ? "+" : t < 0 ? "−" : ""}${Math.abs(t)} %`);

/** Une tuile par marché où agir : carte élégante, 3 compteurs clairs et conseil. */
function Tile({ it, primary }: { it: Item; primary: boolean }) {
  const s = it.p.stats;
  return (
    <Link href={`/?m=${it.id}`} scroll={false} className={`pos-tile ${primary ? "primary" : ""} pos-tile-${it.p.key}`}>
      <div className="pos-tile-head">
        <strong className="pos-tile-title">{it.name}</strong>
        <PositionBadge p={it.p} />
      </div>

      <div className="pos-tile-metrics">
        <div className="pos-metric">
          <span className="pos-metric-val pos-metric-up">{trendTxt(s.trend)}</span>
          <span className="pos-metric-lbl">Demande</span>
        </div>
        <div className="pos-metric-sep" />
        <div className="pos-metric">
          <span className="pos-metric-val">{s.apps ?? "—"}</span>
          <span className="pos-metric-lbl">Apps store</span>
        </div>
        <div className="pos-metric-sep" />
        <div className="pos-metric">
          <span className="pos-metric-val">{s.share} %</span>
          <span className="pos-metric-lbl">Utilisables</span>
        </div>
      </div>

      <p className="pos-tile-advice">{it.p.advice}</p>
    </Link>
  );
}

/** Le reste des marchés : badges cliquables et groupés de manière élégante. */
function Rest({ k, items }: { k: PositionKey; items: Item[] }) {
  if (!items.length) return null;
  const SHOWN = 6;
  const link = (it: Item) => (
    <Link key={it.id} href={`/?m=${it.id}`} scroll={false} className="market-chip" title={it.p.criteria.join(" ")}>
      {it.name}
    </Link>
  );
  return (
    <div className="pos-rest-row">
      <div className="pos-rest-label">
        <span className={`pos-dot pos-${k}`} aria-hidden="true" />
        <strong className="pos-rest-cat">{POSITION_LABEL(k)}</strong>
        <span className="pos-rest-badge">{items.length}</span>
      </div>
      <div className="pos-rest-chips">
        {items.slice(0, SHOWN).map(link)}
        {items.length > SHOWN && (
          <details className="pos-more">
            <summary className="pos-more-btn">+{items.length - SHOWN} autres</summary>
            <span className="pos-more-content">{items.slice(SHOWN).map(link)}</span>
          </details>
        )}
      </div>
    </div>
  );
}

export function PositionGrid({ items }: { items: Item[] }) {
  const of = (...keys: PositionKey[]) => items.filter((i) => keys.includes(i.p.key));
  const act = [...of("closing"), ...of("window")];
  const race = of("race");
  const count = (...keys: PositionKey[]) => of(...keys).length;

  const cells: { k: PositionKey; n: number; hot?: boolean }[] = [
    { k: "window", n: count("closing", "window"), hot: true },
    { k: "race", n: count("race") },
    { k: "fallow", n: count("fallow") },
    { k: "settled", n: count("settled") },
  ];

  return (
    <div className="pos-layout">
      <div className="pos-mini-wrap">
        <div className="pos-mini" aria-label="Répartition des marchés : demande et place disponible">
          <span />
          <span className="pos-mini-axis">Place libre</span>
          <span className="pos-mini-axis">Place prise</span>
          <span className="pos-mini-axis v">Demande ↑</span>
          {cells.slice(0, 2).map((c) => (
            <span key={c.k} className={`pos-mini-cell pos-${c.k} ${c.n ? "" : "empty"}`} title={POSITION_LABEL(c.k)}>
              <b>{c.n}</b>
              <small>{POSITION_LABEL(c.k)}</small>
            </span>
          ))}
          <span className="pos-mini-axis v">Stable / ↓</span>
          {cells.slice(2).map((c) => (
            <span key={c.k} className={`pos-mini-cell pos-${c.k} ${c.n ? "" : "empty"}`} title={POSITION_LABEL(c.k)}>
              <b>{c.n}</b>
              <small>{POSITION_LABEL(c.k)}</small>
            </span>
          ))}
        </div>
      </div>

      <div className="pos-focus">
        {act.length || race.length ? (
          <>
            {act.map((it) => <Tile key={it.id} it={it} primary />)}
            {race.map((it) => <Tile key={it.id} it={it} primary={false} />)}
          </>
        ) : (
          <p className="quiet-note">Aucun marché où la demande monte ce mois-ci.</p>
        )}
      </div>

      <div className="pos-rest">
        <Rest k="fallow" items={of("fallow")} />
        <Rest k="settled" items={of("settled")} />
        <Rest k="unknown" items={of("unknown")} />
      </div>
    </div>
  );
}
