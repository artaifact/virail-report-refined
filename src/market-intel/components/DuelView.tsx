import { Link, useLoader, NotFoundError } from "../compat";
import { notFound } from "../compat";
import { Fragment, Suspense } from "react";
import { ActionGauge, countActions, GaugeLegend, SLOTS, type SlotState, slotOf, stronger } from "./ActionGauge";
import { Logo, ScoreRing } from "./Fun";
import FilterSelect from "./FilterSelect";
import MarketNav from "./MarketNav";
import { api, type CanDo, type CompanyProfile, type Overview } from "../lib/api";
import { levelTone } from "../lib/fun";
import { objectFr } from "../lib/labels";

function strips(items: CanDo[]): Map<string, SlotState[]> {
  const out = new Map<string, SlotState[]>();
  for (const o of items) {
    const states = out.get(o.object) ?? SLOTS.map(() => "none" as SlotState);
    for (const v of o.verbs) {
      const i = slotOf(v.verb);
      if (i >= 0) states[i] = stronger(states[i], v.inferred ? "inferred" : v.level === "OBSERVED" ? "on" : "declared");
    }
    out.set(o.object, states);
  }
  return out;
}
const count = countActions;

/** Duel de deux acteurs. `hrefFor(a, b)` fabrique les liens de changement d'adversaire : dans l'espace de travail
 *  ils restent dans le panneau latéral. */
export async function DuelView({ id, a, b, embedded = false, hrefFor }: {
  id: string; a?: string; b?: string; embedded?: boolean; hrefFor?: (a: string, b: string) => string;
}) {
  const sp = { a, b };
  const link = hrefFor ?? ((x: string, y: string) => `/markets/${id}/duel?a=${x}&b=${y}`);
  const o = await api<Overview>(`/markets/${id}/overview`);
  const ranked = o.companies;
  if (ranked.length < 2) notFound(); // un duel demande deux acteurs
  const me = ranked.find((c) => c.role === "me") ?? ranked[0];
  const aId = sp.a ?? me.id;
  const bId = sp.b ?? (ranked.find((c) => c.id !== aId)?.id ?? aId);
  if (!ranked.some((c) => c.id === aId) || !ranked.some((c) => c.id === bId)) notFound();
  const [pa, pb] = await Promise.all([
    api<CompanyProfile>(`/companies/${aId}?market=${id}`),
    api<CompanyProfile>(`/companies/${bId}?market=${id}`),
  ]);
  const A = ranked.find((c) => c.id === aId)!;
  const B = ranked.find((c) => c.id === bId)!;
  const sa = strips(pa.can_do.agent);
  const sb = strips(pb.can_do.agent);
  const subjects = [...new Set([...sa.keys(), ...sb.keys()])].sort((x, y) =>
    Math.max(count(sb.get(y)), count(sa.get(y))) - Math.max(count(sb.get(x)), count(sa.get(x))));
  const winsA = subjects.filter((s) => count(sa.get(s)) > count(sb.get(s))).length;
  const winsB = subjects.filter((s) => count(sb.get(s)) > count(sa.get(s))).length;
  // ce que B sait faire et pas A, regroupé par sujet : « notes (créer, modifier) »
  const gaps: { subject: string; verbs: string[] }[] = [];
  for (const s of subjects) {
    const a = sa.get(s), b = sb.get(s);
    const verbs = (b ?? []).flatMap((st, i) => (st !== "none" && (!a || a[i] === "none") ? [SLOTS[i].label.toLowerCase()] : []));
    if (verbs.length) gaps.push({ subject: objectFr(s).toLowerCase(), verbs });
  }
  const winner = A.readiness.score === B.readiness.score ? null : A.readiness.score > B.readiness.score ? A.id : B.id;
  const pick = (side: "a" | "b") => ranked.map((c) => ({ c, href: link(side === "a" ? c.id : aId, side === "b" ? c.id : bId) }));

  return (
    <div className={embedded ? "embed" : "page"}>
      <div className="page-head">
        <div>
          <span className="eyebrow">Duel</span>
          {embedded ? <h2 style={{ font: "700 22px/1.2 var(--display)" }}>{A.name} contre {B.name}</h2> : <h1>{A.name} contre {B.name}</h1>}
          <p className="subtitle">Qui un agent IA peut-il le mieux utiliser ? Sujet par sujet, action par action.</p>
        </div>
        {!embedded && <MarketNav marketId={id} current="/duel" />}
      </div>

      <div className="duel-head">
        {[A, B].map((c, i) => (
          <Fragment key={c.id}>
            {i === 1 && <span className="vs">VS</span>}
            <div className={`duel-side ${winner === c.id ? "win" : ""}`}>
              <Logo name={c.name} domain={c.domain} size={48} />
              <strong style={{ font: "700 18px/1.2 var(--display)" }}>{c.name}</strong>
              <ScoreRing score={c.readiness.score} tone={levelTone(c.readiness.label)} size={80} />
              <span className="meta">
                {winner === c.id ? <strong className="win-k">meilleure note · </strong> : null}
                devant sur {i === 0 ? winsA : winsB} sujet{(i === 0 ? winsA : winsB) > 1 ? "s" : ""}
              </span>
            </div>
          </Fragment>
        ))}
      </div>

      {!embedded && (
        <div className="filters">
          <span className="meta">Comparer avec :</span>
          {pick("b").filter(({ c }) => c.id !== aId).slice(0, 6).map(({ c, href }) => (
            <Link key={c.id} href={href} className={c.id === bId ? "on" : ""}>{c.name}</Link>
          ))}
          {ranked.length > 7 && (
            <Suspense>
              <FilterSelect name="b" label="ou" options={ranked.filter((c) => c.id !== aId).map((c) => ({ value: c.id, label: c.name }))} />
            </Suspense>
          )}
        </div>
      )}

      {gaps.length > 0 && (
        <div className="insight warn">
          <span className="insight-k">Ce que {B.name} permet et pas {A.name}</span>
          <p>
            {gaps.map((g, i) => (
              <Fragment key={g.subject}>
                <strong>{g.subject}</strong> <span className="muted">({g.verbs.length === 5 ? "tout" : g.verbs.join(", ")})</span>{i < gaps.length - 1 ? " · " : ""}
              </Fragment>
            ))}
          </p>
        </div>
      )}

      <GaugeLegend />

      <section className="card">
        <div className="duel-row" style={{ paddingTop: 0 }}>
          <span className="l meta">{A.name}</span>
          <span className="subject meta">Sujet</span>
          <span className="r meta">{B.name}</span>
        </div>
        <div className="duel-rows">
          {subjects.map((s) => {
            return (
              <div key={s} className="duel-row">
                <span className="l">
                  {sa.get(s) ? <ActionGauge states={sa.get(s)!} label={A.name} /> : <span className="meta">—</span>}
                </span>
                <span className="subject">{objectFr(s)}</span>
                <span className="r">
                  {sb.get(s) ? <ActionGauge states={sb.get(s)!} label={B.name} /> : <span className="meta">—</span>}
                </span>
              </div>
            );
          })}
        </div>

      </section>
    </div>
  );
}
