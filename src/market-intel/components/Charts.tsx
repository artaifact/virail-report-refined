import type { Readiness } from "../lib/api";
import { pct } from "../lib/format";
import { COMPONENT_INFO } from "../lib/labels";

const COMPONENT_COLORS: Record<string, string> = {
  distribution: "#3553d6",
  coverage: "#1f8a4c",
  depth: "#7a4fd0",
  transaction: "#c2410c",
  structured: "#0e7490",
  freshness: "#b26b00",
};

export const COMPONENT_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(COMPONENT_INFO).map(([k, v]) => [k, v.name]),
);

// Barre de recommandation + intervalle de Wilson à 95 %
export function RateBar({ value, ci }: { value: number; ci: [number, number] }) {
  return (
    <div className="bar" title={`${pct(value)} (marge d'incertitude : ${pct(ci[0])} à ${pct(ci[1])})`}>
      <div className="fill" style={{ width: `${value * 100}%` }} />
      <div className="ci" style={{ left: `${ci[0] * 100}%`, width: `${Math.max(0.5, (ci[1] - ci[0]) * 100)}%` }} />
    </div>
  );
}

// Score toujours affiché avec ses composantes (spec V2)
export function ScoreStack({ readiness }: { readiness: Readiness }) {
  return (
    <div className="stack" title={Object.entries(readiness.components).filter(([k]) => readiness.weights[k] > 0).map(([k, v]) => `${COMPONENT_LABELS[k]} : ${v} / ${readiness.weights[k]}`).join("\n")}>
      {Object.entries(readiness.components).map(([k, v]) =>
        v > 0 ? <span key={k} style={{ width: `${v}%`, background: COMPONENT_COLORS[k] }} /> : null,
      )}
    </div>
  );
}

export function ScoreLegend() {
  return (
    <div className="row muted" style={{ fontSize: 12 }}>
      {Object.entries(COMPONENT_LABELS).map(([k, label]) => (
        <span key={k} className="row" style={{ gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: COMPONENT_COLORS[k], display: "inline-block" }} />
          {label}
        </span>
      ))}
    </div>
  );
}
