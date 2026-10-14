import { useRouter, miFetch } from "../compat";
import { useState } from "react";
import type { ReviewItem } from "../lib/api";
import { capabilityFr, channelName, objectFr, VERB_FR } from "../lib/labels";
import EvidenceLink from "./Evidence";

const VERBS = Object.keys(VERB_FR); // tous les verbes du modèle : réserver, payer, annuler… se corrigent aussi

// Relecture d'un classement : « Juste » ou « Faux » (+ la bonne action, ou « pas une action métier »).
function ReviewCard({ item, marketId, objects, onDone }: {
  item: ReviewItem; marketId: string; objects: string[]; onDone: () => void;
}) {
  const [fixing, setFixing] = useState(false);
  const [verb, setVerb] = useState("READ");
  const [obj, setObj] = useState(objects[0] ?? "");
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function send(verdict: "correct" | "wrong", corrected: string | null) {
    setBusy(true);
    setError(null);
    try {
      const res = await miFetch(`/markets/${marketId}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ company_id: item.company_id, raw_label: item.raw_label, verdict, corrected_key: corrected }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.detail === "string" ? body.detail : `Erreur ${res.status}`);
      }
      onDone(); // seulement si le serveur a enregistré la réponse
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  const predicted = item.predicted
    ? item.expanded.length > 1
      ? `${item.expanded.map(capabilityFr).join(" ; ")}`
      : capabilityFr(item.predicted)
    : "rien (non compris)";

  return (
    <div className="review-card">
      <div className="spread" style={{ alignItems: "flex-start" }}>
        <div>
          <code style={{ fontSize: 14 }}>{item.raw_label}</code>
          <div className="meta">{item.company} · {channelName(item.channel)} · <EvidenceLink id={item.evidence_id} label="source" /></div>
        </div>
      </div>
      <div className="review-q">
        <span className="muted">Compris comme :</span> <strong>{predicted}</strong>
      </div>
      {error && <p className="notice">Réponse non enregistrée : {error}</p>}
      {!fixing ? (
        <div className="row">
          <button className="btn small primary" disabled={busy} onClick={() => send("correct", null)}>
            {item.predicted ? "✓ Juste" : "✓ Juste, ce n'est pas une action"}
          </button>
          <button className="btn small" disabled={busy} onClick={() => setFixing(true)}>✗ Faux</button>
        </div>
      ) : (
        <div className="row">
          <span className="muted">La bonne action :</span>
          <select className="inline" value={verb} onChange={(e) => setVerb(e.target.value)}>
            {VERBS.map((v) => <option key={v} value={v}>{VERB_FR[v]}</option>)}
          </select>
          <select className="inline" value={obj} onChange={(e) => setObj(e.target.value)}>
            {objects.map((o) => <option key={o} value={o}>{objectFr(o)}</option>)}
          </select>
          <button className="btn small primary" disabled={busy} onClick={() => send("wrong", `${verb}_${obj}`)}>Enregistrer</button>
          <button className="btn small" disabled={busy} onClick={() => send("wrong", null)}>Ce n'est pas une action métier</button>
          <button className="btn link" onClick={() => setFixing(false)}>annuler</button>
        </div>
      )}
    </div>
  );
}

export default function ReviewQueue({ items, marketId, objects }: { items: ReviewItem[]; marketId: string; objects: string[] }) {
  const router = useRouter();
  const [done, setDone] = useState<Set<string>>(new Set());
  const left = items.filter((i) => !done.has(`${i.company_id}|${i.raw_label}`));
  if (!left.length) {
    return (
      <div className="row">
        <span className="muted">Série terminée.</span>
        <button className="btn small primary" onClick={() => { setDone(new Set()); router.refresh(); }}>Série suivante</button>
      </div>
    );
  }
  return (
    <div className="review-list">
      {left.map((i) => (
        <ReviewCard key={`${i.company_id}|${i.raw_label}`} item={i} marketId={marketId} objects={objects}
          onDone={() => {
            setDone((d) => new Set(d).add(`${i.company_id}|${i.raw_label}`));
            if (left.length === 1) router.refresh();
          }} />
      ))}
    </div>
  );
}
