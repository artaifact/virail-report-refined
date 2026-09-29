import MarketNav from "../components/MarketNav";
import ReviewQueue from "../components/ReviewQueue";
import { api, type ReviewState } from "../lib/api";
import { pct } from "../lib/format";
import { capabilityFr } from "../lib/labels";
import { useLoader, useParams } from "../compat";
import { guard } from "../views";

export default function QualityPage() {
  const { id } = useParams() as { id: string };
  const state = useLoader(() => api<ReviewState>(`/markets/${id}/review?n=12`), [id]);
  const blocked = guard(state);
  if (blocked) return blocked;
  const r = state.data!;
  const s = r.stats;
  const enough = s.judged >= s.min_sample;
  const verdict = !s.judged
    ? "Pas encore mesurée"
    : !enough
      ? "Estimation provisoire"
      : s.ci[0] >= s.target
        ? "Objectif atteint"
        : s.precision >= s.target
          ? "Proche de l'objectif"
          : "Sous l'objectif";

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Fiabilité</span>
          <h1>Peut-on se fier au classement ?</h1>
          <p className="subtitle">
            Vérifiez quelques outils à la main : chaque réponse mesure la précision et corrige le classement, partout dans l'application.
          </p>
        </div>
        <MarketNav marketId={id} current="/quality" />
      </div>

      <section className="headline">
        <p className="answer">
          {s.judged ? (
            <>Précision mesurée : <em>{pct(s.precision)}</em> sur {s.judged} vérifications. {verdict}.</>
          ) : (
            <>La précision n'a pas encore été mesurée. Il faut environ {s.min_sample} vérifications pour conclure.</>
          )}
        </p>
        <div className="kpis">
          <div className="kpi">
            <span className="v">{s.judged ? pct(s.precision) : "—"}</span>
            <span className="l">précision (objectif {pct(s.target)})</span>
          </div>
          <div className="kpi">
            <span className="v">{s.judged ? `${pct(s.ci[0])}–${pct(s.ci[1])}` : "—"}</span>
            <span className="l">marge d'incertitude</span>
          </div>
          <div className="kpi">
            <span className="v">{s.judged}<small>/{s.min_sample}</small></span>
            <span className="l">vérifications pour conclure</span>
          </div>
          <div className="kpi">
            <span className="v">{s.missed}</span>
            <span className="l">vraies actions que l'outil avait ratées</span>
          </div>
        </div>
      </section>

      <div className="main-aside">
        <section className="section">
          <div className="section-head">
            <h2>À vérifier</h2>
            <span className="meta">{s.remaining} outils non vérifiés</span>
          </div>
          <p className="quiet-note">
            Lisez le nom de l'outil (et sa source si besoin), puis dites si l'action comprise est la bonne. Un outil qui gère un
            réglage (un modèle, un statut) n'est pas une action métier.
          </p>
          <ReviewQueue items={r.queue} marketId={id} objects={r.objects} />
        </section>
        <aside className="section">
          <h2>Dernières vérifications</h2>
          {r.recent.length === 0 ? (
            <p className="empty">Aucune pour l'instant.</p>
          ) : (
            <ul className="feed compact-feed">
              {r.recent.map((x) => (
                <li key={`${x.company}-${x.raw_label}`}>
                  <span className="what">
                    <code>{x.raw_label}</code> <span className="meta">· {x.company}</span>
                    <br />
                    {x.verdict === "correct" ? (
                      <span className="level high">✓ juste</span>
                    ) : (
                      <span className="level low">
                        ✗ corrigé en {x.corrected ? capabilityFr(x.corrected) : "« pas une action »"}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </main>
  );
}
