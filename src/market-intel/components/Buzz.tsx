/** Tendance et viralité : l'attention que suscite un acteur, lue à part de la note sur 100. */
import type { Attention, Buzz, BuzzSpike, MarketBuzz } from "../lib/api";

const compact = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });
export const fmt = (n: number) => compact.format(n);

/** « +34 % », « −12 % », « stable » sous 5 % : un bruit de quelques pour cent n'est pas une tendance. */
export function trendText(t: number | null | undefined): string | null {
  if (t === null || t === undefined) return null;
  if (Math.abs(t) < 5) return "stable";
  return `${t > 0 ? "+" : "−"}${Math.abs(t)} %`;
}

const spikeWhy = (s: BuzzSpike) => (s.story ? `${s.why} : « ${s.story.title} »` : s.why);

/** Pastille d'un acteur : viral (pour de bonnes raisons), bad buzz, ou sa tendance sur 30 jours. */
export function BuzzChip({ buzz, onlyNotable = false }: { buzz?: Buzz | null; onlyNotable?: boolean }) {
  if (!buzz || !buzz.measured) return null;
  if (buzz.viral.length) {
    return <span className="buzz buzz-viral" title={buzz.viral.map(spikeWhy).join("\n")}>Viral</span>;
  }
  if (buzz.bad_buzz.length) {
    return <span className="buzz buzz-bad" title={buzz.bad_buzz.map(spikeWhy).join("\n")}>Bad buzz</span>;
  }
  const t = trendText(buzz.trend);
  if (!t || (onlyNotable && Math.abs(buzz.trend ?? 0) < 15)) return null;
  const tone = t === "stable" ? "flat" : (buzz.trend ?? 0) > 0 ? "up" : "down";
  return (
    <span className={`buzz buzz-${tone}`} title={buzz.driver_label ? `Porté par : ${buzz.driver_label.toLowerCase()} (30 derniers jours)` : undefined}>
      Buzz {tone === "up" ? "▲ " : tone === "down" ? "▼ " : ""}{t}
    </span>
  );
}

/** Pastille d'un marché : tendance médiane de ses acteurs. */
export function MarketBuzzChip({ buzz }: { buzz?: MarketBuzz }) {
  if (!buzz || buzz.trend === null) return null;
  const t = trendText(buzz.trend)!;
  const tone = t === "stable" ? "flat" : buzz.trend > 0 ? "up" : "down";
  const why = [`tendance médiane de ${buzz.measured} acteur${buzz.measured > 1 ? "s" : ""} mesuré${buzz.measured > 1 ? "s" : ""}`,
    buzz.rising ? `${buzz.rising} en nette hausse` : null, buzz.viral ? `${buzz.viral} viral${buzz.viral > 1 ? "s" : ""}` : null]
    .filter(Boolean).join(" · ");
  return <span className={`buzz buzz-${tone}`} title={why}>Buzz {tone === "up" ? "▲ " : tone === "down" ? "▼ " : ""}{t}</span>;
}

/** Une ligne « pourquoi on en parle » : l'article à la une, sinon le signal qui porte la hausse. */
export function buzzReason(b: Buzz): string | null {
  const spike = b.viral[0] ?? b.bad_buzz[0];
  if (spike) return spike.story ? `« ${spike.story.title} »` : spike.why;
  return b.driver_label ? `porté par : ${b.driver_label.toLowerCase()}` : null;
}

/** Courbe hebdomadaire d'un signal sur un an. Survol : la valeur de chaque semaine ; points : les articles marquants. */
function WeekLine({ points, label, marks }: { points: { week: string; value: number }[]; label: string; marks: Set<string> }) {
  const W = 260, H = 64, P = 4;
  if (points.length < 2) return null;
  const max = Math.max(...points.map((p) => p.value), 1);
  const x = (i: number) => P + (i / (points.length - 1)) * (W - 2 * P);
  const y = (v: number) => H - P - (v / max) * (H - 2 * P);
  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ");
  const area = `${x(0)},${H - P} ${line} ${x(points.length - 1)},${H - P}`;
  const weekLabel = (w: string) => new Date(w).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="attn-line" role="img"
      aria-label={`${label} par semaine, du ${weekLabel(points[0].week)} au ${weekLabel(points[points.length - 1].week)}`}>
      <polygon points={area} className="attn-area" />
      <polyline points={line} fill="none" />
      {points.map((p, i) => (
        <g key={p.week}>
          {marks.has(p.week) && <circle cx={x(i)} cy={y(p.value)} r="4" className="attn-mark" />}
          <rect x={x(i) - (W / points.length) / 2} y={0} width={W / points.length} height={H} fill="transparent">
            <title>{`Semaine du ${weekLabel(p.week)} : ${fmt(p.value)}`}</title>
          </rect>
        </g>
      ))}
    </svg>
  );
}

const weekOf = (day: string) => {
  const d = new Date(day);
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
};

/** Panneau de la fiche acteur : tendance, un petit graphique par signal, moments forts et sources. */
export function AttentionPanel({ a, name }: { a: Attention; name: string }) {
  const order = ["wiki_views", "hn_points", "news_articles", "gh_stars", "npm_downloads", "pypi_downloads"];
  const signals = order.filter((s) => a.signals[s] && a.weekly[s]?.length);
  // les semaines ne commencent pas toutes un lundi : on rattache chaque article à la semaine affichée qui le contient
  const weeks = (a.weekly.hn_points ?? []).map((w) => w.week);
  const markWeeks = new Set(a.peaks.map((p) => weeks.filter((w) => w <= p.day).pop() ?? weekOf(p.day)));
  const t = trendText(a.trend);
  const building = a.signals.gh_stars && !(a.weekly.gh_stars?.length > 4);
  return (
    <div className="attn">
      <div className="attn-head">
        <div>
          <span className="insight-k">Tendance sur 30 jours</span>
          <strong className="attn-trend">{t ?? "pas encore mesurable"}</strong>
          {a.driver_label && t && t !== "stable" && <span className="meta">porté par : {a.driver_label.toLowerCase()}</span>}
        </div>
        {a.notoriety !== null && (
          <div>
            <span className="insight-k">Notoriété dans le marché</span>
            <strong className="attn-trend">{a.notoriety}<span className="meta">/100</span></strong>
            <span className="meta">rang moyen de ses audiences</span>
          </div>
        )}
        <div className="attn-chips"><BuzzChip buzz={a} /></div>
      </div>

      {[...a.viral, ...a.bad_buzz].map((v) => (
        <p key={`${v.signal}-${v.day}`} className={`attn-spike ${v.tone === "bad" ? "bad" : ""}`}>
          <strong>{v.tone === "bad" ? "Bad buzz" : "Viral"}</strong> le {new Date(v.day).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} : {v.why}
          {v.story && <> — <a href={v.story.hn ?? v.story.url ?? "#"} target="_blank" rel="noreferrer">« {v.story.title} »</a></>}
        </p>
      ))}

      {signals.length > 0 ? (
        <div className="attn-grid">
          {signals.map((s) => {
            const st = a.signals[s];
            const g = st.enough ? trendText(st.growth === null ? null : Math.round(st.growth * 100)) : null;
            return (
              <div key={s} className="attn-cell">
                <div className="attn-cell-head">
                  <span className="meta">{st.label}</span>
                  {g && <span className={`trend ${g === "stable" ? "" : (st.growth ?? 0) > 0 ? "up" : "down"}`}>{g}</span>}
                </div>
                <strong>{fmt(st.recent)} <span className="meta">sur 30 j</span></strong>
                <WeekLine points={a.weekly[s]} label={st.label} marks={s === "hn_points" ? markWeeks : new Set()} />
                {!st.enough && <span className="meta">volume trop faible pour conclure</span>}
              </div>
            );
          })}
        </div>
      ) : <p className="quiet-note">Aucune audience publique repérée pour {name} : ni article Wikipédia, ni paquet, ni article sur Hacker News.</p>}

      {building && <p className="meta" style={{ margin: 0 }}>Étoiles GitHub : GitHub ne publie plus leur date, la courbe se construit jour après jour depuis le premier relevé.</p>}

      {a.peaks.length > 0 && (
        <div className="section" style={{ gap: 8 }}>
          <h3 className="attn-h3">Moments forts de l'année</h3>
          <ul className="news">
            {a.peaks.map((p) => (
              <li key={p.day + p.title}>
                <span className={`dot dot-${p.tone === "bad" ? "down" : "up"}`} aria-hidden="true" />
                <span>
                  <a href={p.hn ?? p.url ?? "#"} target="_blank" rel="noreferrer"><strong>{p.title}</strong></a>
                  <span className="meta" style={{ display: "block" }}>
                    {new Date(p.day).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · {p.points} votes sur Hacker News{p.tone === "bad" ? " · bad buzz" : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {a.sources.length > 0 && (
        <details className="fold">
          <summary>D'où viennent ces chiffres</summary>
          <p className="meta" style={{ margin: "8px 0" }}>
            Comptes rattachés à {name} par son site officiel. Tendance : les 30 derniers jours comparés à la moyenne des 3 mois
            précédents. Rien de tout cela n'entre dans la note sur 100.
          </p>
          <ul className="attn-sources">
            {a.sources.map((s) => (
              <li key={s.url}><span className="meta">{a.signals[s.signal]?.label ?? s.signal}</span> <a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
