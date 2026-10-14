/** Tableau de qualité des données d'un marché : trois mesures, le verdict du maillon le plus faible, les écarts. */
import type { QualityCard as Card } from "../lib/api";

const KIND: Record<string, string> = {
  official_mcp: "serveur MCP officiel", chatgpt_app: "app ChatGPT", claude_connector: "connecteur Claude", in_top3: "dans le top 3",
};
const pc = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)} %`);
const tone = (v: number | null, target: number) => (v === null ? "" : v >= target ? "good" : v >= 0.8 ? "mid" : "low");

export function QualityBadge({ verdict }: { verdict: Card["verdict"] }) {
  const k = verdict === "fiable" ? "good" : verdict === "fragile" ? "low" : verdict === "à consolider" ? "mid" : "none";
  return <span className={`q-badge q-${k}`}>{verdict}</span>;
}

export default function QualityCard({ q }: { q: Card }) {
  const cells = [
    { label: "Relevés complets", v: q.completeness, help: "toutes les sources de l'acteur ont répondu" },
    { label: "Actions connues", v: q.actions_known, help: "parmi les acteurs utilisables par un agent" },
    { label: "Vérité terrain", v: q.golden, help: q.golden_facts ? `${q.golden_facts} faits vérifiés à la source` : "aucun fait vérifié pour ce marché" },
  ];
  return (
    <section className="card q-card">
      <div className="q-head">
        <h2>Qualité des données</h2>
        <QualityBadge verdict={q.verdict} />
        <span className="meta">objectif : {pc(q.target)} sur chaque mesure · le verdict suit la plus faible</span>
      </div>
      <div className="q-cells">
        {cells.map((c) => (
          <div key={c.label} className={`q-cell ${tone(c.v, q.target)}`}>
            <strong>{pc(c.v)}</strong>
            <span>{c.label}</span>
            <small className="meta">{c.help}</small>
          </div>
        ))}
      </div>
      {q.golden_wrong.length > 0 && (
        <div className="q-wrong">
          <h3>Écarts avec la vérité terrain</h3>
          <ul>
            {q.golden_wrong.map((w) => (
              <li key={`${w.company}-${w.kind}`}>
                <strong>{w.company}</strong> : {KIND[w.kind] ?? w.kind} — {w.expected ? "vrai à la source, manqué par nos relevés" : "faux à la source, affirmé par nos relevés"}
                {" "}<a href={w.source} target="_blank" rel="noreferrer">source</a>{w.note ? <span className="meta"> · {w.note}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(q.incomplete.length > 0 || q.without_actions.length > 0) && (
        <details className="fold">
          <summary>Détail : {q.incomplete.length} relevé{q.incomplete.length > 1 ? "s" : ""} incomplet{q.incomplete.length > 1 ? "s" : ""},
            {" "}{q.without_actions.length} acteur{q.without_actions.length > 1 ? "s" : ""} sans action connue</summary>
          {q.incomplete.length > 0 && <p className="meta">Incomplets : {q.incomplete.join(", ")}</p>}
          {q.without_actions.length > 0 && <p className="meta">Sans action connue : {q.without_actions.join(", ")}</p>}
        </details>
      )}
    </section>
  );
}
