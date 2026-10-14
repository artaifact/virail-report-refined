import MarketNav from "../components/MarketNav";
import OntologyEditor from "../components/OntologyEditor";
import { api, type MarketOntology } from "../lib/api";
import { date, pct } from "../lib/format";
import { useLoader, useParams } from "../compat";
import { guard } from "../views";

export default function OntologyPage() {
  const { id } = useParams() as { id: string };
  const state = useLoader(() => api<MarketOntology>(`/markets/${id}/ontology`), [id]);
  const blocked = guard(state);
  if (blocked) return blocked;
  const o = state.data!;

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>Vocabulaire du marché</h1>
          <p className="subtitle">
            Les sujets qui comptent dans {o.market.name} (contacts, opportunités…) et les mots qui les désignent. C'est ce qui permet
            de traduire les outils techniques des éditeurs en actions compréhensibles.
          </p>
        </div>
        <MarketNav marketId={id} current="/ontology" />
      </div>

      <div className="counters">
        <div className="counter">
          <div className="value mono" style={{ fontSize: 20 }}>{o.current.id}</div>
          <div className="label">version en cours</div>
        </div>
        <div className="counter">
          <div className="value">{o.total ? pct(o.mapped / o.total) : "—"}</div>
          <div className="label">des outils compris ({o.mapped} sur {o.total})</div>
        </div>
        <div className="counter">
          <div className="value">{o.objects.length}</div>
          <div className="label">sujets suivis</div>
        </div>
      </div>

      <OntologyEditor key={o.current.id} data={o} />

      <section className="card">
        <h2>Versions</h2>
        <table>
          <thead>
            <tr><th>Version</th><th>Date</th><th className="num">Sujets</th><th>Note</th></tr>
          </thead>
          <tbody>
            {o.versions.map((v) => (
              <tr key={v.id}>
                <td className="mono">{v.id}{v.id === o.current.id && <span className="badge me" style={{ marginLeft: 6 }}>courante</span>}</td>
                <td className="muted">{date(v.created_at)}</td>
                <td className="num">{v.objects}</td>
                <td className="muted">{v.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>
          Chaque enregistrement crée une version. Modifier le vocabulaire recalcule tout l'historique, sans créer de faux changements.
        </p>
      </section>
    </main>
  );
}
