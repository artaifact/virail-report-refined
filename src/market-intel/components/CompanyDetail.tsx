import { Link, useLoader } from "../compat";
import { AttentionPanel } from "./Buzz";
import { ActionGauge, actionWords, confidence, SLOTS, type SlotState, slotOf, stronger } from "./ActionGauge";
import { RateBar } from "./Charts";
import EvidenceLink from "./Evidence";
import { ViewerActions } from "./Actions";
import ChannelOverride from "./ChannelOverride";
import EventFeed from "./EventFeed";
import { HowToRead, Tip } from "./Help";
import IdentityForm from "./IdentityForm";
import { DataFlag, ScoreOrReview } from "./DataFlag";
import { BadgeShelf, Logo, ScoreRing } from "./Fun";
import { api, type CanDo, type Channel, type CompanyProfile } from "../lib/api";
import { badges, levelTone } from "../lib/fun";
import { date, pct } from "../lib/format";
import { CHANNEL_INFO, channelName, COMPONENT_INFO, LEVEL_INFO, levelName, objectFr, PROVIDER_FR, READINESS_FR } from "../lib/labels";

const ACCESS = ["MCP", "CONNECTOR_CLAUDE", "APP_CHATGPT", "AUTOMATION", "AGENT_CARD", "API"];

function strips(items: CanDo[], api = false): Map<string, SlotState[]> {
  const out = new Map<string, SlotState[]>();
  for (const o of items) {
    const states = out.get(o.object) ?? SLOTS.map(() => "none" as SlotState);
    for (const v of o.verbs) {
      const i = slotOf(v.verb);
      if (i < 0) continue;
      const st: SlotState = api ? "api" : v.inferred ? "inferred" : v.level === "OBSERVED" ? "on" : "declared";
      states[i] = stronger(states[i], st);
    }
    out.set(o.object, states);
  }
  return out;
}

/** Fiche d'un acteur. `embedded` : affichée dans le panneau latéral de l'espace de travail (sans marges de page,
 *  avec des liens de comparaison qui restent dans l'espace de travail). */
export function CompanyDetail({ id, market, embedded = false }: { id: string; market?: string; embedded?: boolean }) {
  const state = useLoader(
    () => api<CompanyProfile>(`/companies/${id}${market ? `?market=${encodeURIComponent(market)}` : ""}`),
    [id, market]
  );
  if (state.loading) {
    return (
      <div className="mi-fade" style={{ display: "flex", flexDirection: "column", gap: 16, padding: embedded ? "16px 20px" : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="mi-shimmer" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            <div className="mi-shimmer" style={{ height: 22, width: "65%", borderRadius: 6 }} />
            <div className="mi-shimmer" style={{ height: 14, width: "40%", borderRadius: 4 }} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="card mi-shimmer" style={{ height: 60, borderRadius: 8 }} />
          <div className="card mi-shimmer" style={{ height: 60, borderRadius: 8 }} />
        </div>
        <div className="card mi-shimmer" style={{ height: 120, borderRadius: 10 }} />
        <div className="card mi-shimmer" style={{ height: 180, borderRadius: 10 }} />
      </div>
    );
  }
  if (state.error || !state.data) return <div className="meta" style={{ padding: 20 }}>Données indisponibles</div>;
  const p = state.data;
  const r = p.readiness;
  const active = p.channels.filter((c) => c.status === "active");
  const official = active.filter((c) => c.provenance === "official" && c.in_scope !== false);
  const community = active.filter((c) => c.provenance === "community" && c.in_scope !== false);
  const otherProducts = active.filter((c) => c.in_scope === false);
  // aucune action identifiée ne veut pas dire aucun accès : on dit lequel des deux, et pourquoi
  const AGENT_DOORS = ["MCP", "CONNECTOR_CLAUDE", "APP_CHATGPT", "AGENT_CARD", "COMMERCE_PROTOCOL"];
  const doors = [...new Set(official.filter((c) => AGENT_DOORS.includes(c.type)).map((c) => channelName(c.type)))];
  const locked = official.some((c) => c.type === "MCP" && c.probe_status === "auth_required");
  const viaZapier = official.some((c) => c.type === "AUTOMATION");
  const noActions = doors.length
    ? `${p.company.name} est accessible aux agents (${doors.join(", ")}), mais ses actions ne sont pas publiées`
      + (locked ? " : son serveur MCP exige une connexion au compte pour les lister." : " : aucun outil précis n'est décrit.")
      + " On sait qu'un agent peut y entrer, pas encore ce qu'il peut y faire."
    : viaZapier
      ? `Aucun accès direct pour un agent : ${p.company.name} n'est joignable que par Zapier.`
      : `Aucun accès pour un agent repéré chez ${p.company.name}.`;
  const history = (p.score_history ?? []).filter((h) => h.complete);
  const removed = p.channels.filter((c) => c.status !== "active");
  const agent = strips(p.can_do?.agent ?? []);
  const apiOnly = strips((p.can_do?.api ?? []).filter((o) => !agent.has(o.object)), true);
  const rows = [...agent.entries(), ...apiOnly.entries()];
  const hasAgent = agent.size > 0;

  return (
    <div className={embedded ? "embed" : "page"}>
      {!embedded && <span className="eyebrow"><Link href={`/?m=${p.market.id}`}>← {p.market.name}</Link></span>}
      <section className="card co-head">
        <Logo name={p.company.name} domain={p.company.domain} size={56} />
        <div className="co-id">
          <h1 className="co-name">{p.company.name}</h1>
          <span className="co-desc">
            {p.company.description}
            {p.company.website && <> · <a href={p.company.website} target="_blank" rel="noreferrer">{p.company.domain}</a></>}
          </span>
        </div>
        {r && (
          <div className="co-score">
            <ScoreOrReview score={r.score} tone={levelTone(r.label)} size={92} data={p.data} />
            <DataFlag data={p.data} />
            <span className={`co-level ${r.label === "High" ? "up" : r.label === "Medium" ? "mid" : "low"}`}>
              {READINESS_FR[r.label]}
            </span>
          </div>
        )}
        <div className="co-foot">
          {r && (() => {
            const all = badges(r);
            const earned = all.filter((b) => b.earned);
            const todo = all.filter((b) => !b.earned);
            return (
              <div className="co-badges">
                {/* jauge de progression : lisible d'un coup d'œil, le détail des badges obtenus est replié */}
                <span className="co-meter" role="img" aria-label={`${earned.length} badges sur ${all.length}`}>
                  {all.map((b) => <i key={b.key} className={b.earned ? "on" : ""} title={b.label} />)}
                </span>
                {todo.length > 0 && (
                  <span className="co-todo" title={todo.map((b) => b.help).join(" ")}>
                    À débloquer : <strong>{todo.map((b) => b.label.toLowerCase()).join(", ")}</strong>
                  </span>
                )}
                <details className="co-earned">
                  <summary>{earned.length}/{all.length} badges</summary>
                  <BadgeShelf items={earned} mode="list" />
                </details>
              </div>
            );
          })()}
          <ViewerActions companyId={p.company.id} followed={p.viewer.followed} mine={p.viewer.mine} />
        </div>
      </section>

      {/* 1. La réponse : ce qu'un agent peut faire, sujet par sujet */}
      <section className="section">
        <div className="section-head">
          <h2>Ce qu'un agent IA peut faire chez {p.company.name}</h2>
        </div>
        {rows.length === 0 ? (
          <p className="quiet-note">{noActions}</p>
        ) : (
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <table className="companies-actions">
              <tbody>
                {rows.map(([obj, states]) => (
                  <tr key={obj}>
                    <td style={{ width: 180, fontWeight: 600 }}>{objectFr(obj)}</td>
                    <td style={{ width: 140 }}><ActionGauge states={states} label={objectFr(obj)} /></td>
                    <td>
                      {actionWords(states, apiOnly.has(obj))}
                      {confidence(states) && <span className="meta"> · {confidence(states)}</span>}
                      {apiOnly.has(obj) && <span className="meta"> · développeurs seulement</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!hasAgent && <p className="meta" style={{ margin: 0 }}>Ces actions ne sont accessibles qu'aux développeurs, par l'API.</p>}
            {r?.details?.universal?.length ? (
              <p className="meta" style={{ margin: 0 }}>
                Accès universel : l'agent dispose d'outils qui appellent toute l'API ({r.details.universal.join(", ")}).
                Chaque opération documentée compte donc comme probable.
              </p>
            ) : null}
          </div>
        )}
      </section>

      {/* 2. Par où */}
      <section className="section">
        <h2>Par où un agent peut entrer</h2>
        <div className="access">
          {ACCESS.map((t) => {
            const has = official.some((c) => c.type === t);
            const third = !has && community.some((c) => c.type === t);
            return (
              <span key={t} className={has ? "on" : third ? "third" : "off"} title={CHANNEL_INFO[t].help}>
                {has ? "✓" : third ? "~" : "✕"} {channelName(t)}{third && " (tiers)"}
              </span>
            );
          })}
        </div>
        {ACCESS.some((t) => !official.some((c) => c.type === t) && community.some((c) => c.type === t)) && (
          <span className="meta">« ~ » : seulement proposé par des développeurs indépendants.</span>
        )}
      </section>

      {/* Publicité : ce que l'acteur paie pour se faire voir, à part de la note */}
      {p.marketing && (() => {
        const m = p.marketing;
        const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 100) / 10} k` : String(n));
        const rows = [
          m.google_ads && {
            key: "google", label: "Google", ads: m.google_ads, href: m.sources.google_ads,
            what: `annonces qui pointent vers ${p.company.domain}`,
          },
          m.meta_ads && {
            key: "meta", label: "Meta (Facebook, Instagram)", ads: m.meta_ads, href: m.sources.meta_ads,
            what: `annonces actives qui mentionnent ${p.company.domain}`,
          },
        ].filter(Boolean) as { key: string; label: string; ads: NonNullable<typeof m.google_ads>; href?: string; what: string }[];
        return (
          <section className="section">
            <div className="section-head">
              <h2>Publicité</h2>
              <span className="meta">bibliothèques publiques des régies · hors note</span>
            </div>
            <div className="card ads-card">
              {rows.map(({ key, label, ads, href, what }) => {
                const first = ads.history[0];
                const delta = ads.history.length > 1 ? ads.count - first.count : null;
                return (
                  <div key={key} className="ads-row">
                    <span className="ads-src">{label}</span>
                    <div className="ads-fig">
                      <strong>{ads.approx ? "≈ " : ""}{fmt(ads.count)}</strong>
                      <span className="meta">{what}</span>
                      {delta !== null && delta !== 0 && (
                        <span className={`trend ${delta > 0 ? "up" : "down"}`}>{delta > 0 ? "▲ +" : "▼ "}{fmt(Math.abs(delta))} depuis le {first.day}</span>
                      )}
                    </div>
                    <p className="meta" style={{ margin: 0 }}>
                      {ads.own_advertiser
                        ? <>Annonceur au nom de l&apos;éditeur : <strong>oui</strong>.</>
                        : <>Aucun annonceur au nom de l&apos;éditeur parmi les premiers : surtout des affiliés, revendeurs ou agences.</>}
                      {ads.advertisers.length > 0 && <> Principaux annonceurs : {ads.advertisers.join(" · ")}</>}
                      {href && <> <a href={href} target="_blank" rel="noreferrer" className="more">Voir les annonces →</a></>}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* 3. Fait-il parler de lui ? Succès mesurable faute de chiffres financiers, à part de la note */}
      {p.attention && (
        <section className="section">
          <div className="section-head">
            <h2>Fait-il parler de lui ?</h2>
            <span className="meta">audience et adoption, hors note</span>
          </div>
          <AttentionPanel a={p.attention} name={p.company.name} />
        </section>
      )}

      {/* 4. Pourquoi cette note, et la visibilité */}
      <div className="grid grid-2">
        {r && (
          <section className="section">
            <h2>Pourquoi {r.score}/100 ?</h2>
            <table>
              <tbody>
                {Object.entries(r.components).filter(([k]) => r.weights[k] > 0).map(([k, v]) => (
                  <tr key={k}>
                    <td>{COMPONENT_INFO[k].name}<Tip text={COMPONENT_INFO[k].help} /></td>
                    <td style={{ width: "45%" }}>
                      <span className="scorebar"><span style={{ width: `${(v / r.weights[k]) * 100}%` }} /></span>
                    </td>
                    <td className="num meta">{Math.round(v)} / {r.weights[k]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
        <section className="section" style={{ gap: 28 }}>
          <div className="section" style={{ gap: 8 }}>
            <h2>Évolution de la note</h2>
            {history.length <= 1 ? (
              <p className="meta" style={{ margin: 0 }}>
                Premier relevé le {history[0]?.day ?? "—"}. Les variations et leurs raisons apparaîtront aux prochaines collectes.
              </p>
            ) : (
              <ul className="feed compact-feed">
                {history.slice(0, 6).map((h) => (
                  <li key={h.day}>
                    <span className="what">
                      <strong>{h.score}</strong>{" "}
                      {h.delta !== null && h.delta !== 0 && (
                        <span className={`trend ${h.delta > 0 ? "up" : "down"}`}>{h.delta > 0 ? "▲ +" : "▼ "}{h.delta}</span>
                      )}
                      {h.reasons.length > 0 && <ul className="reason-list">{h.reasons.map((x) => <li key={x}>{x}</li>)}</ul>}
                    </span>
                    <span className="when">{h.day}</span>
                  </li>
                ))}
              </ul>
            )}
            {p.score_method && <span className="meta">Méthode de calcul {p.score_method.version}<Tip text={p.score_method.note} /></span>}
          </div>
          <div className="section" style={{ gap: 8 }}>
            <h2>Les IA le recommandent-elles ?</h2>
            {p.visibility_meta.providers.length === 0 ? (
              <p className="quiet-note">Pas encore mesuré : il faut brancher l'accès à ChatGPT, Gemini, Claude ou Perplexity.</p>
            ) : (
              <table>
                <tbody>
                  {Object.entries(p.visibility.per_model).map(([model, v]) => (
                    <tr key={model}>
                      <td>{PROVIDER_FR[model] ?? model}</td>
                      <td style={{ width: "45%" }}><RateBar value={v.recommendation} ci={v.ci} /></td>
                      <td className="num">{pct(v.recommendation)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {/* 4. Historique, puis le détail replié */}
      <section className="section">
        <h2>Historique</h2>
        <EventFeed events={p.events.filter((e) => !e.baseline).slice(0, 20)} marketId={p.market.id} showCompany={false} />
      </section>

      <div className="section" style={{ gap: 12 }}>
        <details className="fold card">
          <summary>
            Détails techniques <span className="meta">— {official.length} accès officiels, {community.length} de tiers{otherProducts.length ? `, ${otherProducts.length} d'autres produits` : ""}, avec raisons et corrections</span>
          </summary>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
            <HowToRead title="Que signifient « vérifié » et « annoncé » ?">
              {Object.values(LEVEL_INFO).map((l) => <p key={l.name}><strong>{l.name}</strong> : {l.help}</p>)}
            </HowToRead>
            <div className="grid grid-2">{official.map((c) => <ChannelCard key={c.id} c={c} />)}</div>
            {community.length > 0 && (
              <table>
                <thead>
                  <tr><th>Publié par un tiers</th><th>Type</th><th>Pourquoi « tiers »</th><th /></tr>
                </thead>
                <tbody>
                  {community.map((c) => (
                    <tr key={c.id}>
                      <td>{c.url ? <a href={c.url} target="_blank" rel="noreferrer">{c.name}</a> : c.name}</td>
                      <td>{channelName(c.type)}</td>
                      <td className="meta">{c.provenance_reason}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <EvidenceLink id={c.evidence_id} label="source" />{" "}
                        <ChannelOverride id={c.id} provenance={c.provenance} inScope={c.in_scope !== false}
                          overridden={!!c.provenance_overridden || c.scope_reason === "corrigé à la main"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {otherProducts.length > 0 && (
              <div className="section" style={{ gap: 10 }}>
                <h3 style={{ margin: 0 }}>Autres produits de l'éditeur, non comptés ({otherProducts.length})</h3>
                <div className="grid grid-2 out-of-scope">{otherProducts.map((c) => <ChannelCard key={c.id} c={c} />)}</div>
              </div>
            )}
            {removed.length > 0 && <div className="grid grid-2">{removed.map((c) => <ChannelCard key={c.id} c={c} />)}</div>}
          </div>
        </details>
        <IdentityForm companyId={p.company.id} identity={p.identity} />
      </div>
    </div>
  );
}

function ChannelCard({ c }: { c: Channel }) {
  const caps = [
    ...new Map(
      c.capabilities.filter((x) => x.status === "active").map((x) => [x.key === "UNMAPPED" ? x.raw_label : x.key, x]),
    ).values(),
  ];
  return (
    <div className={`channel ${c.status === "removed" ? "removed" : ""}`}>
      <div className="spread">
        <strong>{c.name}</strong>
        <span className="row">
          <span className="badge">{channelName(c.type)}</span>
          <span className={`badge lvl-${c.level}`}>{levelName(c.level)}</span>
        </span>
      </div>
      <div className="muted" style={{ fontSize: 12 }}>
        {c.url && <a href={c.url} target="_blank" rel="noreferrer" style={{ wordBreak: "break-all" }}>{c.url}</a>}
        <br />
        {c.version && <>version {c.version} · </>}repéré le {date(c.first_seen)} · revu le {date(c.last_seen)}
        {c.probe_status === "auth_required" && " · connexion éditeur nécessaire pour lire ses outils"}
        {" · "}<EvidenceLink id={c.evidence_id} label="source" />
      </div>
      <div className="meta">
        {c.provenance === "official" ? "Officiel" : "Tiers"} : {c.provenance_reason}
        {c.provenance_overridden && " (corrigé à la main)"}
        {c.scope_reason && c.scope_reason !== "acteur mono-produit" && <> · Périmètre : {c.scope_reason}</>}
      </div>
      <ChannelOverride id={c.id} provenance={c.provenance} inScope={c.in_scope !== false}
        overridden={!!c.provenance_overridden || c.scope_reason === "corrigé à la main"} />
      {caps.length > 0 && (
        <div className="cap-list">
          {caps.map((x) => (
            <span key={x.raw_label} className={`badge lvl-${x.level}`} title={`${x.raw_label} (${x.key})`}>
              <EvidenceLink id={x.evidence_id} label={x.raw_label} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
