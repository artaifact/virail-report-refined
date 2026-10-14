import { ActionGauge, GaugeLegend, SLOTS, type SlotState, slotOf, stronger } from "../components/ActionGauge";
import EvidenceLink from "../components/Evidence";
import { Logo, ScoreRing } from "../components/Fun";
import MarketNav from "../components/MarketNav";
import { api, type MarketOntology, type Matrix, type MatrixCell, type Overview } from "../lib/api";
import { levelTone } from "../lib/fun";
import { CHANNEL_INFO, objectFr } from "../lib/labels";
import { Link, useLoader, useParams, useSearchParams } from "../compat";
import { guard } from "../views";

const CHAMPION_MIN = 3; // actions sur 5

type Search = { view?: string; api?: string; community?: string; verified?: string };

function stateOf(c: MatrixCell): SlotState {
  if (!CHANNEL_INFO[c.channel_type]?.agent) return "api";
  if (c.inferred) return "inferred";
  return c.level === "OBSERVED" ? "on" : "declared";
}

export default function MatrixPage() {
  const { id } = useParams() as { id: string };
  const query = useSearchParams();
  const sp: Search = Object.fromEntries(query.entries());
  const detail = sp.view === "detail";
  const qs = new URLSearchParams({
    provenance: sp.community === "1" ? "all" : "official",
    include_api: sp.api === "1" ? "true" : "false",
  });
  if (sp.verified === "1") qs.set("level", "OBSERVED");
  const state = useLoader(async () => {
    const [m, o, onto] = await Promise.all([
      api<Matrix>(`/markets/${id}/matrix?${qs}`),
      api<Overview>(`/markets/${id}/overview`),
      api<MarketOntology>(`/markets/${id}/ontology`),
    ]);
    return { m, o, onto };
  }, [id, qs.toString()]);
  const blocked = guard(state);
  if (blocked) return blocked;
  const { m, o, onto } = state.data!;
  const info = new Map(o.companies.map((c) => [c.id, c]));
  const me = o.companies.find((c) => c.role === "me");
  const link = (patch: Partial<Search>) => {
    const next = { ...sp, ...patch };
    const q = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]);
    return `/markets/${id}/matrix?${q}`;
  };
  const toggle = (k: keyof Search, label: string) => (
    <Link className={`toggle ${sp[k] === "1" ? "on" : ""}`} href={link({ [k]: sp[k] === "1" ? undefined : "1" })}>{label}</Link>
  );

  // sujet × acteur → 5 créneaux (Trouver, Lire, Créer, Modifier, Supprimer), meilleure preuve par créneau
  const genericKeys = new Set(Object.keys(m.generic ?? {}));
  const grid = new Map<string, Map<string, SlotState[]>>();
  for (const r of m.rows) {
    if (genericKeys.has(r.object)) continue; // déjà déplié sur les sujets couverts
    const slot = slotOf(r.verb);
    if (slot < 0) continue;
    for (const [company, cells] of Object.entries(r.cells)) {
      const byCompany = grid.get(r.object) ?? new Map<string, SlotState[]>();
      const states = byCompany.get(company) ?? SLOTS.map(() => "none" as SlotState);
      for (const c of cells) states[slot] = stronger(states[slot], stateOf(c));
      byCompany.set(company, states);
      grid.set(r.object, byCompany);
    }
  }
  const coverage = (company: string) => [...grid.values()].filter((b) => b.get(company)?.some((s) => s !== "none")).length;
  const active = m.companies.filter((c) => coverage(c.id) > 0).sort((a, b) => coverage(b.id) - coverage(a.id));
  const inactive = m.companies.filter((c) => coverage(c.id) === 0);
  // les sujets les plus répandus d'abord : on lit d'abord ce qui compare le plus d'acteurs
  const objects = [...grid.keys()].sort((a, b) => grid.get(b)!.size - grid.get(a)!.size);
  const n = (states?: SlotState[]) => (states ?? []).filter((x) => x !== "none").length;
  // champion de chaque sujet : le plus d'actions possibles (ex æquo : tous)
  const champions = new Map(objects.map((obj) => {
    const best = Math.max(...active.map((c) => n(grid.get(obj)?.get(c.id))));
    // pas de trophée pour une « victoire » à 1 ou 2 actions sur 5 : ce ne serait pas un vrai avantage
    const ids = best >= CHAMPION_MIN ? active.filter((c) => n(grid.get(obj)?.get(c.id)) === best).map((c) => c.id) : [];
    return [obj, { best, ids }];
  }));
  // terrain vierge : sujets du vocabulaire qu'aucun acteur ne permet aux agents (hors objets génériques)
  const generic = new Set(Object.keys(onto.generic ?? {}));
  const virgin = onto.objects.map((x) => x.key).filter((k) => !generic.has(k) && !grid.has(k));
  // « comparer » : avec vous si vous êtes du marché, sinon avec le meneur (le meneur, lui, avec le n° 2)
  const duelWith = (cid: string) => {
    const base = me?.id ?? active[0]?.id;
    const other = cid === base ? active[1]?.id : cid;
    return `/markets/${id}/duel?a=${base}&b=${other ?? cid}`;
  };
  // vue observateur : les sujets qu'un seul acteur ouvre aux agents (avance exclusive)
  const exclusive = objects.map((obj) => ({ obj, ids: active.filter((c) => n(grid.get(obj)?.get(c.id))).map((c) => c.id) }))
    .filter((x) => x.ids.length === 1);
  const myMissing = me ? objects.filter((obj) => !n(grid.get(obj)?.get(me.id)) && active.some((c) => n(grid.get(obj)?.get(c.id)))) : [];
  // l'adversaire le plus utile à comparer : celui qui couvre le plus de vos manques
  const rival = me && myMissing.length
    ? [...active].filter((c) => c.id !== me.id)
        .sort((a, b) => myMissing.filter((x) => n(grid.get(x)?.get(b.id))).length - myMissing.filter((x) => n(grid.get(x)?.get(a.id))).length)[0]
    : undefined;

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Capacités</span>
          <h1>Qui sait faire quoi ?</h1>
          <p className="subtitle">Pour chaque sujet, ce qu'un agent IA peut faire chez chaque acteur.</p>
        </div>
        <MarketNav marketId={id} current="/matrix" />
      </div>

      {!detail && objects.length > 0 && (
        <div className="insights">
          {!me && exclusive.length > 0 && (
            <div className="insight warn">
              <span className="insight-k">Avance exclusive</span>
              <p>
                Un seul acteur permet aux agents d'agir sur{" "}
                {exclusive.slice(0, 4).map((x, i) => (
                  <span key={x.obj}>{i > 0 && (i === Math.min(exclusive.length, 4) - 1 ? " et " : ", ")}
                    <strong>{objectFr(x.obj).toLowerCase()}</strong> ({info.get(x.ids[0])?.name})</span>
                ))}
                {exclusive.length > 4 ? ` et ${exclusive.length - 4} autres sujets` : ""}.
              </p>
            </div>
          )}
          {me && (
            <div className={`insight ${myMissing.length ? "warn" : "ok"}`}>
              <span className="insight-k">Vos manques</span>
              {myMissing.length ? (
                <p>
                  Un agent ne peut rien faire chez {me.name} sur <strong>{myMissing.map(objectFr).join(", ").toLowerCase()}</strong>, alors qu'un concurrent le permet.{" "}
                  {rival && (
                    <Link href={`/markets/${id}/duel?a=${me.id}&b=${rival.id}`} className="more">Comparer avec {rival.name} →</Link>
                  )}
                </p>
              ) : <p>Aucun : vous couvrez tout ce que couvrent vos concurrents.</p>}
            </div>
          )}
          {virgin.length > 0 && (
            <div className="insight">
              <span className="insight-k">Personne encore</span>
              <p>Aucun acteur ne permet aux agents d'agir sur <strong>{virgin.map(objectFr).join(", ").toLowerCase()}</strong>. Une place à prendre.</p>
            </div>
          )}
        </div>
      )}

      <div className="controls">
        {detail ? <span /> : <GaugeLegend champion />}
        <div className="toolbar">
          {toggle("api", "Accès développeur")}
          {toggle("community", "Outils de tiers")}
          {toggle("verified", "Vérifié seulement")}
          <Link href={link({ view: detail ? undefined : "detail" })} className="more">
            {detail ? "← Vue simple" : "Vue technique →"}
          </Link>
        </div>
      </div>

      {!detail ? (
        <section className="card matrix-wrap" style={{ padding: "6px 10px" }}>
          {objects.length === 0 ? (
            <p className="empty">Aucune action trouvée avec ces filtres.</p>
          ) : (
            <table className="grid-matrix">
              <thead>
                <tr>
                  <th>Sujet</th>
                  {active.map((c) => {
                    const ci = info.get(c.id);
                    return (
                      <th key={c.id} className={`company ${c.role === "me" || c.followed ? "me-col" : ""}`}>
                        <Link href={`/companies/${c.id}?market=${id}`} className="col-head">
                          <Logo name={c.name} domain={ci?.domain} size={28} />
                          <span>{c.name}</span>
                          {ci && <ScoreRing score={ci.readiness.score} tone={levelTone(ci.readiness.label)} size={34} />}
                        </Link>
                        {c.role === "me" ? <span className="you">vous</span>
                          : c.followed ? <span className="followed-tag">★ suivi</span> : null}
                        {c.role !== "me" && (
                          <Link href={duelWith(c.id)} className="duel-link">comparer</Link>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {objects.map((o) => (
                  <tr key={o}>
                    <td className="obj">{objectFr(o)}</td>
                    {active.map((c) => {
                      const states = grid.get(o)?.get(c.id);
                      const champ = champions.get(o)!.ids.includes(c.id);
                      return (
                        <td key={c.id} className={`cell ${c.role === "me" || c.followed ? "me-col" : ""}`}>
                          {states ? (
                            <span className={`cell-box ${champ ? "best" : ""}`} title={champ ? "Le plus complet sur ce sujet" : undefined}>
                              <ActionGauge states={states} label={`${c.name} · ${objectFr(o)}`} />
                            </span>
                          ) : <span className="none">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : (
        <section className="card matrix-wrap">
          <table className="matrix">
            <thead>
              <tr>
                <th>Action (clé technique)</th>
                {m.companies.map((c) => <th key={c.id} className="company">{c.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {m.rows.map((r) => (
                <tr key={r.key}>
                  <td><code>{r.key}</code></td>
                  {m.companies.map((c) => {
                    const cells = r.cells[c.id];
                    if (!cells?.length) return <td key={c.id} className="cell"><span className="none">·</span></td>;
                    const types = [...new Map(cells.map((x) => [x.channel_type, x])).values()];
                    return (
                      <td key={c.id} className="cell">
                        <span className="row">
                          {types.map((x) => (
                            <span key={x.channel_type} className={`badge ${!CHANNEL_INFO[x.channel_type]?.agent ? "chip-api" : x.provenance === "community" ? "chip-community" : `lvl-${x.level}`}`}
                              title={`${x.channel_name} · ${x.raw_label}${x.inferred ? " · probable" : ""}`}>
                              <EvidenceLink id={x.evidence_id} label={CHANNEL_INFO[x.channel_type]?.short ?? x.channel_type} />
                            </span>
                          ))}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td className="muted">Outils non classés</td>
                {m.companies.map((c) => <td key={c.id} className="cell muted">{m.unmapped[c.id] ?? ""}</td>)}
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {!detail && inactive.length > 0 && (
        <p className="closed-line">
          <span className="mood mood-calm">Aucune action trouvée</span>
          {inactive.map((c) => c.name).join(", ")}
        </p>
      )}
    </main>
  );
}
