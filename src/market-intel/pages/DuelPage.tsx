import { Fragment, Suspense } from "react";
import { ActionGauge, countActions, GaugeLegend, SLOTS, type SlotState, slotOf, stronger } from "../components/ActionGauge";
import { Logo, ScoreRing } from "../components/Fun";
import FilterSelect from "../components/FilterSelect";
import MarketNav from "../components/MarketNav";
import { api, type CanDo, type CompanyProfile, type Overview } from "../lib/api";
import { levelTone } from "../lib/fun";
import { objectFr } from "../lib/labels";
import { Link, useLoader, useParams, useSearchParams, notFound } from "../compat";
import { guard } from "../views";

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

export default function DuelPage() {
  const { id } = useParams() as { id: string };
  const query = useSearchParams();
  const sp = { a: query.get("a") ?? undefined, b: query.get("b") ?? undefined };
  const state = useLoader(async () => {
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
    return { o, pa, pb, aId, bId };
  }, [id, sp.a, sp.b]);
  const blocked = guard(state);
  if (blocked) return blocked;
  const { o, pa, pb, aId, bId } = state.data!;
  const ranked = o.companies;
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
  const pick = (side: "a" | "b") => ranked.map((c) => ({ c, href: `/markets/${id}/duel?a=${side === "a" ? c.id : aId}&b=${side === "b" ? c.id : bId}` }));

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Duel</span>
          <h1>{A.name} contre {B.name}</h1>
          <p className="subtitle">Qui un agent IA peut-il le mieux utiliser ? Sujet par sujet, action par action.</p>
        </div>
        <MarketNav marketId={id} current="/duel" />
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

      {/* les 6 premiers en raccourcis, tous les autres dans une liste : la ligne reste lisible à 50 acteurs */}
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
    </main>
  );
}
