"use client";

import { useRouter } from "../compat";
import { useState } from "react";

export type GoldenItem = {
  company_id: string; company: string; kind: string; claim: boolean; question: string; evidence: string; evidence_is_search: boolean;
};

/** Étendre la vérité terrain : la plateforme affirme, une personne vérifie à la source et répond Vrai ou Faux. */
function GoldenCard({ item, marketId, onDone }: { item: GoldenItem; marketId: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(isTrue: boolean) {
    setBusy(true);
    setError(null);
    try {
      // « vrai à la source » : l'affirmation de la plateforme est juste si elle disait oui, fausse si elle disait non
      const res = await fetch(`/api/markets/${marketId}/golden`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ company_id: item.company_id, kind: item.kind, claim: item.claim, verdict: isTrue === item.claim,
          source: item.evidence_is_search ? null : item.evidence }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <div className="review-card">
      <strong>{item.question}</strong>
      <div className="meta">
        Nos relevés disent : <strong>{item.claim ? "oui" : "non"}</strong> ·{" "}
        <a href={item.evidence} target="_blank" rel="noreferrer">{item.evidence_is_search ? "chercher la preuve" : "voir la preuve"}</a>
      </div>
      {error && <p className="notice">Réponse non enregistrée : {error}</p>}
      <div className="review-actions">
        <button className="btn" disabled={busy} onClick={() => send(true)}>Oui, c&apos;est vrai à la source</button>
        <button className="btn" disabled={busy} onClick={() => send(false)}>Non, c&apos;est faux</button>
      </div>
    </div>
  );
}

export default function GoldenQueue({ items, marketId, facts }: { items: GoldenItem[]; marketId: string; facts: number }) {
  const router = useRouter();
  const [left, setLeft] = useState(items);
  return (
    <section className="section">
      <div className="section-head">
        <h2>Étendre la vérité terrain</h2>
        <span className="meta">{facts} fait{facts > 1 ? "s" : ""} vérifié{facts > 1 ? "s" : ""} pour ce marché · chaque réponse mesure la fiabilité réelle</span>
      </div>
      {left.length ? left.map((it) => (
        <GoldenCard key={`${it.company_id}-${it.kind}`} item={it} marketId={marketId}
          onDone={() => { setLeft((xs) => xs.filter((x) => x !== it)); router.refresh(); }} />
      )) : <p className="quiet-note">Plus rien à valider pour l&apos;instant.</p>}
    </section>
  );
}
