import { CollectButton } from "../components/Actions";
import { Logo, ScoreRing } from "../components/Fun";
import MarketNav from "../components/MarketNav";
import { api, type Overview } from "../lib/api";
import { describeEvent, eventDate } from "../lib/format";
import { BuzzChip, buzzReason, trendText } from "../components/Buzz";
import { HeatBadge, Sparkline } from "../components/Pulse";
import { abilities, badges, levelTone, mood } from "../lib/fun";
import { Link, useLoader, useParams } from "../compat";
import { guard } from "../views";

const MEDALS = ["🥇", "🥈", "🥉"];
const SHOWN = 9; // au-delà, la suite du classement est repliée : on lit d'abord la tête

export default function MarketOverview() {
  const { id } = useParams() as { id: string };
  const state = useLoader(() => api<Overview>(`/markets/${id}/overview`), [id]);
  const blocked = guard(state);
  if (blocked) return blocked;
  const o = state.data!;
  const ranked = o.companies;
  const me = ranked.find((c) => c.role === "me");
  const leader = ranked[0];
  const podium = ranked.slice(0, 3);
  // après le podium : les acteurs ouverts en lignes, les fermés regroupés sur une ligne
  const open = ranked.slice(3).filter((c) => mood(c.readiness, 0).tone !== "closed");
  const closed = ranked.slice(3).filter((c) => mood(c.readiness, 0).tone === "closed");
  const myMissing = me ? badges(me.readiness).filter((b) => !b.earned) : [];
  const logoOf = new Map(ranked.map((c) => [c.id, c.domain]));
  const second = ranked[1];
  const riser = [...ranked].filter((c) => (c.trend?.delta ?? 0) > 0).sort((a, b) => (b.trend!.delta ?? 0) - (a.trend!.delta ?? 0))[0];
  const closedAll = ranked.filter((c) => mood(c.readiness, 0).tone === "closed").length;
  // qui fait parler : viraux d'abord, puis les plus fortes hausses d'attention (bad buzz à part, jamais en tête)
  const talked = ranked.filter((c) => c.buzz?.measured && (c.buzz.viral.length || c.buzz.bad_buzz.length || (c.buzz.trend ?? 0) >= 15))
    .sort((a, b) => Number(!a.buzz!.viral.length) - Number(!b.buzz!.viral.length) || Number(!!a.buzz!.bad_buzz.length) - Number(!!b.buzz!.bad_buzz.length)
      || (b.buzz!.trend ?? 0) - (a.buzz!.trend ?? 0)).slice(0, 4);
  const tag = (c: (typeof ranked)[number]) =>
    c.role === "me" ? <> <span className="you">vous</span></> : c.followed ? <> <span className="followed-tag">★ suivi</span></> : null;
  const row = (c: (typeof ranked)[number]) => {
    const rank = ranked.indexOf(c) + 1;
    const can = abilities(c.readiness.details?.slots ?? [], 2);
    return (
      <li key={c.id} className={c.role === "me" || c.followed ? "me" : ""}>
        <Link href={`/companies/${c.id}?market=${id}`}>
          <span className="pos">{rank}</span>
          <Logo name={c.name} domain={c.domain} size={32} />
          <span className="who">
            <span className="name">{c.name}{tag(c)} <BuzzChip buzz={c.buzz} onlyNotable /></span>
            {can && <span className="meta">peut {can}</span>}
          </span>
          {c.trend?.delta ? (
            <span className={`trend ${c.trend.delta > 0 ? "up" : "down"}`} title={c.trend.reasons.join("\n")}>
              {c.trend.delta > 0 ? "▲ +" : "▼ "}{c.trend.delta}
            </span>
          ) : <span />}
          <ScoreRing score={c.readiness.score} tone={levelTone(c.readiness.label)} size={44} />
        </Link>
      </li>
    );
  };

  const share = o.counters.companies_tracked ? Math.round((100 * o.counters.agent_enabled) / o.counters.companies_tracked) : 0;
  const gap = leader && second ? leader.readiness.score - second.readiness.score : 0;
  // la personne à la une : vous si vous êtes du marché, sinon le meneur
  const star = me ?? leader;
  const starRank = star ? ranked.indexOf(star) + 1 : 0;

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Marché suivi</span>
          <div className="ov-title">
            <h1>{o.market.name}</h1>
            <HeatBadge m={o.pulse} />
          </div>
        </div>
        <MarketNav marketId={id} current="" />
      </div>

      {/* Niveau 1 : le podium */}
      <section className="section ov-podium">
        <div className="section-head">
          <h2>Classement</h2>
          <span className="meta">note sur 100</span>
        </div>
        <div className="podium">
          {[podium[1], podium[0], podium[2]].filter(Boolean).map((c) => {
            const rank = ranked.indexOf(c) + 1;
            return (
              <Link key={c.id} href={`/companies/${c.id}?market=${id}`} className={`step ${rank === 1 ? "first" : ""} ${c.role === "me" || c.followed ? "me" : ""}`}>
                <span className="medal" aria-label={`${rank}e`}>{MEDALS[rank - 1]}</span>
                <Logo name={c.name} domain={c.domain} size={rank === 1 ? 48 : 40} />
                <span className="name">{c.name}{tag(c)}</span>
                <ScoreRing score={c.readiness.score} tone={levelTone(c.readiness.label)} size={rank === 1 ? 72 : 60} />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Niveau 2 : ce qu'il faut en retenir, en plus discret : l'écart en tête et l'état du marché */}
      <section className="ov-hero">
        {star ? (
          <div className="ov-star">
            <span className="insight-k">{me ? (starRank === 1 ? "Vous menez ce marché" : "Votre place") : "En tête du marché"}</span>
            <div className="ov-star-id">
              <Logo name={star.name} domain={star.domain} size={36} />
              <div>
                <Link href={`/companies/${star.id}?market=${id}`} className="ov-star-name">{star.name}{tag(star)}</Link>
                <span className="ov-star-score">
                  {me && starRank > 1 ? <>{starRank}<sup>e</sup> · {star.readiness.score}/100, à {leader.readiness.score - star.readiness.score} points de {leader.name}</>
                    : <>{star.readiness.score}/100{second ? <>, {gap} point{gap > 1 ? "s" : ""} devant {second.name}</> : null}</>}
                </span>
              </div>
            </div>
            {me && starRank > 1 && myMissing.length > 0 ? (
              <p className="ov-star-why">Pour monter : {myMissing.map((b) => b.label.toLowerCase()).join(", ")}.</p>
            ) : (star.readiness.details?.slots ?? []).length > 0 && (
              <p className="ov-star-why">Un agent peut {abilities(star.readiness.details?.slots ?? [])}.</p>
            )}
            {me && starRank > 1 ? (
              <Link href={`/markets/${id}/duel?a=${me.id}&b=${leader.id}`} className="btn primary">Comparer avec {leader.name}</Link>
            ) : second && (
              <Link href={`/markets/${id}/duel?a=${star.id}&b=${second.id}`} className="more">Comparer avec {second.name} →</Link>
            )}
          </div>
        ) : <p className="meta">Pas encore de note : première collecte en attente.</p>}

        <dl className="ov-figs">
          <div>
            <dt>Utilisables par un agent</dt>
            <dd><strong>{share}&nbsp;%</strong> <span className="meta">{o.counters.agent_enabled} sur {o.counters.companies_tracked}</span></dd>
            <span className="gauge mk-bar"><span style={{ width: `${share}%` }} /></span>
          </div>
          <div>
            <dt>Maturité du marché</dt>
            <dd>
              <strong>{o.pulse.maturity}</strong><span className="meta">/100</span>
              {o.pulse.momentum ? <span className={`trend ${o.pulse.momentum > 0 ? "up" : "down"}`}>{o.pulse.momentum > 0 ? "▲ +" : "▼ "}{o.pulse.momentum}</span> : null}
              <Sparkline series={o.pulse.series} />
            </dd>
            <span className="meta">moyenne des 5 meilleurs</span>
          </div>
          {o.buzz.trend !== null && (
            <div>
              <dt>Buzz du marché</dt>
              <dd>
                <strong>{trendText(o.buzz.trend)}</strong>
                <span className="meta">sur 30 jours</span>
              </dd>
              <span className="meta">
                {o.buzz.rising} acteur{o.buzz.rising > 1 ? "s" : ""} en nette hausse{o.buzz.viral ? ` · ${o.buzz.viral} viral${o.buzz.viral > 1 ? "s" : ""}` : ""}
              </span>
            </div>
          )}
          <div>
            <dt>Places à prendre</dt>
            <dd><strong>{closedAll}</strong> <span className="meta">acteur{closedAll > 1 ? "s" : ""} encore fermé{closedAll > 1 ? "s" : ""} aux agents</span></dd>
          </div>
        </dl>
      </section>

      <div className="main-aside">
        {/* Niveau 3 : la suite du classement */}
        <section className="section">
          <h2>Suite du classement</h2>

          {open.length > 0 && <ol className="board" start={4}>{open.slice(0, SHOWN).map(row)}</ol>}
          {open.length > SHOWN && (
            <details className="fold">
              <summary>Voir les {open.length - SHOWN} autres acteurs ouverts aux agents</summary>
              <ol className="board" start={4 + SHOWN} style={{ marginTop: 12 }}>{open.slice(SHOWN).map(row)}</ol>
            </details>
          )}

          {closed.length > 0 && (
            <p className="closed-line">
              <span className="mood mood-closed">Fermés aux agents</span>
              {closed.slice(0, 12).map((c, i) => (
                <span key={c.id}>
                  <Link href={`/companies/${c.id}?market=${id}`}>{c.name}</Link>{i < Math.min(closed.length, 12) - 1 ? ", " : ""}
                </span>
              ))}
              {closed.length > 12 && <span className="meta">et {closed.length - 12} autres</span>}
            </p>
          )}
        </section>

        {/* à côté : ce qui bouge */}
        <aside className="section">
          {talked.length > 0 && (
            <>
              <h2>Qui fait parler</h2>
              <ul className="news">
                {talked.map((c) => (
                  <li key={c.id}>
                    <Logo name={c.name} domain={c.domain} size={28} />
                    <span>
                      <Link href={`/companies/${c.id}?market=${id}`}><strong>{c.name}</strong></Link> <BuzzChip buzz={c.buzz} />
                      {buzzReason(c.buzz!) && <span className="meta" style={{ display: "block" }}>{buzzReason(c.buzz!)}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <h2>Ce qui bouge</h2>
          {riser ? (
            <div className="ov-move">
              <Logo name={riser.name} domain={riser.domain} size={32} />
              <p><strong>{riser.name}</strong> gagne <span className="trend up">▲ +{riser.trend!.delta}</span>
                {riser.trend!.reasons[0] ? <span className="meta" style={{ display: "block" }}>{riser.trend!.reasons[0]}</span> : null}</p>
            </div>
          ) : null}
          {o.activity.length === 0 ? (
            <p className="quiet-note">Rien de neuf depuis le premier relevé.</p>
          ) : (
            <ul className="news">
              {o.activity.slice(0, 5).map((e) => (
                <li key={e.id}>
                  <Logo name={e.company} domain={logoOf.get(e.company_id)} size={28} />
                  <span>
                    <strong>{e.company}</strong> {describeEvent(e)}
                    <span className="meta" style={{ display: "block" }}>{eventDate(e)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href={`/markets/${id}/activity`} className="more">Toutes les nouveautés →</Link>
          <CollectButton marketId={id} />
        </aside>
      </div>
    </main>
  );
}
