import { Link, useLoader } from "../compat";
import { guard } from "../views";
import { QualityBadge } from "../components/QualityCard";
import { api, type QualityCard } from "../lib/api";

const pc = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)} %`);

export default function GlobalQualityPage() {
  const state = useLoader(() => api<{ markets: QualityCard[]; target: number }>("/quality"), []);
  const blocked = guard(state);
  if (blocked) return blocked;

  const { markets, target } = state.data!;
  const count = (v: QualityCard["verdict"]) => markets.filter((m) => m.verdict === v).length;

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Fiabilité</span>
          <h1>Peut-on se fier aux données ?</h1>
          <p className="subtitle">
            Trois mesures par marché : relevés complets, actions connues, exactitude sur des faits vérifiés à la source.
            Objectif {pc(target)} sur chacune ; le verdict suit la plus faible. Un marché sans vérité terrain reste « non vérifié ».
          </p>
        </div>
      </div>
      <p className="ws-verdict">
        <strong>{count("fiable")}</strong> fiables · <strong>{count("à consolider")}</strong> à consolider ·
        <strong> {count("non vérifié")}</strong> non vérifiés · <strong>{count("fragile")}</strong> fragiles
      </p>
      <section className="card">
        <table>
          <thead><tr><th>Marché</th><th>Verdict</th><th>Relevés complets</th><th>Actions connues</th><th>Vérité terrain</th><th>Sur 7 jours</th></tr></thead>
          <tbody>
            {markets.map((m) => (
              <tr key={m.market}>
                <td><Link href={`/markets/${m.market}/quality`}>{m.name}</Link></td>
                <td><QualityBadge verdict={m.verdict} /></td>
                <td>{pc(m.completeness)}</td>
                <td>{pc(m.actions_known)}</td>
                <td>{pc(m.golden)}{m.golden_facts ? <span className="meta"> ({m.golden_facts} faits)</span> : null}</td>
                <td>{m.trend === null || m.trend === undefined ? <span className="meta">après une semaine de mesures</span>
                  : <span className={`trend ${m.trend > 0 ? "up" : m.trend < 0 ? "down" : ""}`}>{m.trend > 0 ? "▲ +" : m.trend < 0 ? "▼ " : ""}{Math.round(m.trend * 100)} pts</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
