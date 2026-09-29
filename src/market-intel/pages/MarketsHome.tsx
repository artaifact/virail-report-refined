import { Link, useLoader } from "../compat";
import { guard } from "../views";
import { CreateMarketForm } from "../components/Actions";
import { Logo } from "../components/Fun";
import { BuzzChip, buzzReason, MarketBuzzChip } from "../components/Buzz";
import { HeatBadge, heatOf, Sparkline } from "../components/Pulse";
import { api, type Health, type Landscape, type LandscapeMarket, type OntologyTemplate } from "../lib/api";
import { describeEvent, eventDate, PROVIDER_LABELS } from "../lib/format";
import { eventTone } from "../lib/fun";


/** Une carte = une question : qui mène ce marché, et à quel point est-il prêt pour les agents ?
 *  Niveau 1 : le marché et son meneur. Niveau 2 : la part d'acteurs utilisables. Niveau 3 : une ligne de contexte. */
function MarketCard({ m }: { m: LandscapeMarket }) {
  const leader = m.top[0];
  const share = m.tracked ? Math.round((100 * m.agent_enabled) / m.tracked) : 0;
  // contexte : votre place si vous êtes du marché, sinon celle des acteurs que vous suivez, sinon l'écart en tête
  const second = m.top[1];
  const context = [
    m.me && (m.me.rank === 1 ? `vous (${m.me.name}) êtes en tête` : `vous (${m.me.name}) : ${m.me.rank}e`),
    !m.me && m.followed.length > 0 && m.followed.slice(0, 2).map((f) => `★ ${f.name} : ${f.rank === 1 ? "1er" : `${f.rank}e`}`).join(", "),
    !m.me && !m.followed.length && leader && second &&
      `${second.name} à ${leader.score - second.score} point${leader.score - second.score > 1 ? "s" : ""} de ${leader.name}`,
    m.events_30d > 0 && `${m.events_30d} nouveauté${m.events_30d > 1 ? "s" : ""} ce mois`,
  ].filter(Boolean);
  return (
    <Link href={`/markets/${m.id}`} className="mk-card">
      <div className="mk-top">
        <strong className="mk-name">{m.name}</strong>
        <span className="mk-badges">
          <MarketBuzzChip buzz={m.buzz} />
          <HeatBadge m={m} />
        </span>
      </div>

      {leader ? (
        <div className="mk-leader">
          <Logo name={leader.name} domain={leader.domain} size={40} />
          <span className="mk-lead-text">
            <strong>{leader.name}</strong>
            <span className="meta">mène avec {leader.score}/100</span>
          </span>
          {m.top.length > 1 && (
            <span className="mk-stack" title={`Puis ${m.top.slice(1).map((t) => `${t.name} (${t.score})`).join(", ")}`}>
              {m.top.slice(1).map((t) => <Logo key={t.id} name={t.name} domain={t.domain} size={26} />)}
            </span>
          )}
        </div>
      ) : <p className="meta" style={{ margin: 0 }}>Pas encore de note : première collecte en attente.</p>}

      <div className="mk-adopt">
        <div className="mk-adopt-head">
          <span><strong className="mk-pct">{share}&nbsp;%</strong> <span className="meta">des acteurs utilisables par un agent</span></span>
          {m.series.length >= 2 && <Sparkline series={m.series} />}
        </div>
        <span className="gauge mk-bar"><span style={{ width: `${share}%` }} /></span>
      </div>

      {context.length > 0 && <p className="mk-context">{context.join(" · ")}</p>}
    </Link>
  );
}

export default function MarketsHome() {
  const state = useLoader(async () => {
    const [land, health, templates] = await Promise.all([
      api<Landscape>("/landscape"),
      api<Health>("/health"),
      api<OntologyTemplate[]>("/ontology-templates"),
    ]);
    return { land, health, templates };
  }, []);
  const blocked = guard(state);
  if (blocked) return blocked;
  const { land, health, templates } = state.data!;
  // le bandeau n'apparaît que s'il a quelque chose à dire : au moins un marché vraiment chaud
  const hot = land.markets.some((m) => heatOf(m).tone === "hot") ? land.markets.filter((m) => heatOf(m).tone !== "calm").slice(0, 3) : [];
  const t = land.totals;
  const missing = [
    !health.llm_providers.length && "accès aux IA",
    !health.github_token && "token GitHub",
    !health.web_search && "recherche web",
  ].filter(Boolean);

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Veille agents IA</span>
          <h1>Vos marchés face aux agents IA</h1>
          <p className="subtitle">Qui ChatGPT, Claude et les autres assistants peuvent utiliser, pour quoi faire, et quels marchés bougent.</p>
        </div>
      </div>

      <div className="facts-strip">
        <div><strong>{t.markets}</strong><span>marchés suivis</span></div>
        <div><strong>{t.tracked}</strong><span>acteurs analysés</span></div>
        <div><strong>{t.tracked ? Math.round((100 * t.agent_enabled) / t.tracked) : 0}&nbsp;%</strong><span>utilisables par un agent</span></div>
        <div><strong>{t.events_30d}</strong><span>nouveautés ce mois</span></div>
      </div>

      {hot.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Les marchés qui bougent</h2>
            <span className="meta">nouveautés des éditeurs ce mois et progression des notes</span>
          </div>
          <div className="hot-row">
            {hot.map((m, i) => (
              <Link key={m.id} href={`/markets/${m.id}`} className={`hot-card ${i === 0 ? "first" : ""}`}>
                <span className="meta">{i === 0 ? "Le plus actif" : `${i + 1}e`}</span>
                <strong className="hot-name">{m.name}</strong>
                <span className="heat-bar"><span style={{ width: `${m.heat}%` }} /></span>
                <span className="meta">
                  {m.events_30d} nouveauté{m.events_30d > 1 ? "s" : ""} ce mois
                  {m.momentum ? ` · maturité ${m.momentum > 0 ? "+" : ""}${m.momentum}` : ""}
                  {m.top[0] ? ` · ${m.top[0].name} en tête` : ""}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="main-aside">
        <section className="section">
          <div className="section-head">
            <h2>Tous les marchés</h2>
            <span className="meta">du plus actif au plus calme</span>
          </div>
          <div className="mk-grid">
            {land.markets.map((m) => <MarketCard key={m.id} m={m} />)}
          </div>
        </section>

        <aside className="section" style={{ gap: 28 }}>
          {land.buzzing.length > 0 && (
            <div className="section">
              <h2>Ce qui fait parler</h2>
              <ul className="news">
                {land.buzzing.slice(0, 6).map((b) => (
                  <li key={b.company_id}>
                    <Logo name={b.name} domain={b.domain} size={28} />
                    <span>
                      <Link href={`/companies/${b.company_id}?market=${b.market_id}`}><strong>{b.name}</strong></Link>{" "}
                      <BuzzChip buzz={b} />
                      <span className="meta" style={{ display: "block" }}>{b.market}{buzzReason(b) ? ` · ${buzzReason(b)}` : ""}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="section">
            <h2>Ce qui monte</h2>
            {land.movers.length ? (
              <ul className="news">
                {land.movers.slice(0, 6).map((x) => (
                  <li key={`${x.market_id}-${x.company_id}`}>
                    <Logo name={x.name} domain={x.domain} size={28} />
                    <span>
                      <Link href={`/companies/${x.company_id}?market=${x.market_id}`}><strong>{x.name}</strong></Link>{" "}
                      <span className={`trend ${x.delta > 0 ? "up" : "down"}`}>{x.delta > 0 ? "▲ +" : "▼ "}{x.delta}</span>
                      <span className="meta" style={{ display: "block" }}>{x.market} · {x.from} → {x.to}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="quiet-note">Les progressions apparaîtront dès le prochain relevé quotidien : on ne compare que des notes calculées de la même façon.</p>
            )}
          </div>

          <div className="section">
            <h2>Dernières nouveautés</h2>
            {land.feed.length ? (
              <ul className="news">
                {land.feed.slice(0, 6).map((e) => (
                  <li key={e.id}>
                    <Logo name={e.company} domain={e.domain} size={28} />
                    <span>
                      <span className={`dot dot-${eventTone(e.type)}`} aria-hidden="true" />
                      <strong>{e.company}</strong> {describeEvent(e)}
                      <span className="meta" style={{ display: "block" }}>{e.market} · {eventDate(e)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : <p className="quiet-note">Rien de neuf ce mois-ci.</p>}
          </div>
        </aside>
      </div>

      <details className="fold card">
        <summary>Suivre un nouveau marché</summary>
        <div style={{ marginTop: 14 }}><CreateMarketForm templates={templates} /></div>
      </details>

      <p className="meta" style={{ margin: 0 }}>
        Relevé chaque jour : annuaires ChatGPT et Claude, serveurs MCP, documentations, API publiques, réponses des IA.
        {missing.length > 0 && <> Sources non branchées : {missing.join(", ")}.</>}
        {health.llm_providers.length > 0 && <> IA interrogées : {health.llm_providers.map((p) => PROVIDER_LABELS[p] ?? p).join(", ")}.</>}{" "}
        <Link href="/aide" style={{ color: "var(--accent-ink)" }}>Lexique et méthode →</Link>
      </p>
    </main>
  );
}
