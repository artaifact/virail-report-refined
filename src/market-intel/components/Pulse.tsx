/** Pouls d'un marché, lu de la même façon sur l'accueil et sur la vue d'ensemble. */

export interface PulseData {
  events_30d: number;
  momentum: number | null;
  series: { day: string; value: number }[];
}

/** Température : l'activité réelle des éditeurs ce mois-ci (une nouveauté par canal, 3 au plus par acteur)
 *  et la progression de la maturité, en seuils absolus : une seule nouveauté ne rend pas un marché « chaud ». */
export function heatOf(m: Pick<PulseData, "events_30d" | "momentum">) {
  const rise = Math.max(0, m.momentum ?? 0);
  if (m.events_30d >= 5 || rise >= 5) return { label: "Chaud", tone: "hot" };
  if (m.events_30d >= 1 || rise >= 1) return { label: "Tiède", tone: "warm" };
  return { label: "Calme", tone: "calm" };
}

/** Indicateur de température : 3 crans (calme, tiède, chaud) et la raison au survol. */
export function HeatBadge({ m }: { m: Pick<PulseData, "events_30d" | "momentum"> }) {
  const heat = heatOf(m);
  const level = heat.tone === "hot" ? 3 : heat.tone === "warm" ? 2 : 1;
  const why = [
    `${m.events_30d} nouveauté${m.events_30d > 1 ? "s" : ""} des éditeurs ce mois`,
    m.momentum ? `maturité ${m.momentum > 0 ? "+" : ""}${m.momentum}` : null,
  ].filter(Boolean).join(" · ");
  return (
    <span className={`heat heat-${heat.tone}`} title={why}>
      <span className="heat-steps" aria-hidden="true">{[1, 2, 3].map((i) => <i key={i} className={i <= level ? "on" : ""} />)}</span>
      {heat.label}
    </span>
  );
}

/** Courbe de maturité (moyenne des 5 meilleures notes), à méthode constante. */
export function Sparkline({ series }: { series: PulseData["series"] }) {
  if (series.length < 2) return null;
  const W = 96, H = 26, min = Math.min(...series.map((p) => p.value)), max = Math.max(...series.map((p) => p.value));
  const y = (v: number) => (max === min ? H / 2 : H - 3 - ((v - min) / (max - min)) * (H - 6));
  const pts = series.map((p, i) => `${(i / (series.length - 1)) * W},${y(p.value)}`).join(" ");
  const last = series[series.length - 1];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="spark" role="img"
      aria-label={`Maturité de ${series[0].value} à ${last.value} depuis le ${series[0].day}`}>
      <polyline points={pts} fill="none" />
      <circle cx={W} cy={y(last.value)} r="2.5" />
    </svg>
  );
}
