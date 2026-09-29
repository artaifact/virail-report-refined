import MarketNav from "../components/MarketNav";
import { api, type MarketOntology, type ReviewState } from "../lib/api";
import { pct } from "../lib/format";
import { Link, useLoader, useParams } from "../compat";
import { guard } from "../views";

// Réglages : ce qui sert à fiabiliser les chiffres, rangé à l'écart du quotidien.
export default function SettingsPage() {
  const { id } = useParams() as { id: string };
  const state = useLoader(async () => {
    const [onto, review] = await Promise.all([
      api<MarketOntology>(`/markets/${id}/ontology`),
      api<ReviewState>(`/markets/${id}/review?n=1`),
    ]);
    return { onto, review };
  }, [id]);
  const blocked = guard(state);
  if (blocked) return blocked;
  const { onto, review } = state.data!;
  return (
    <main className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Réglages</span>
          <h1>Rendre les chiffres plus fiables</h1>
          <p className="subtitle">Deux réglages, à faire de temps en temps. Tout le reste se met à jour tout seul.</p>
        </div>
        <MarketNav marketId={id} current="/settings" />
      </div>
      <div className="cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))" }}>
        <Link href={`/markets/${id}/quality`} className="co-card">
          <span className="name">Vérifier le classement</span>
          <span className="muted">
            Dites « juste » ou « faux » sur quelques outils. Chaque réponse améliore les tableaux et mesure leur fiabilité.
          </span>
          <span className="chip-ok" style={{ alignSelf: "flex-start" }}>
            {review.stats.judged ? `Fiabilité ${pct(review.stats.precision)} (${review.stats.judged} vérifs)` : "Pas encore mesurée"}
          </span>
        </Link>
        <Link href={`/markets/${id}/ontology`} className="co-card">
          <span className="name">Vocabulaire du marché</span>
          <span className="muted">
            Les sujets suivis (contacts, opportunités…) et les mots qui les désignent. À ajuster si des outils ne sont pas compris.
          </span>
          <span className="chip-ok" style={{ alignSelf: "flex-start" }}>
            {pct(onto.total ? onto.mapped / onto.total : 0)} des outils compris
          </span>
        </Link>
      </div>
    </main>
  );
}
