"use client";

import { miFetch, useRouter } from "../../compat";
import { useState } from "react";

/** Suivre l'éditeur d'un plugin : il devient un acteur du marché, avec sa note dès la première collecte. */
export default function FollowButton({ entryId, marketId }: { entryId: number; marketId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [reason, setReason] = useState<string | null>(null);
  return (
    <button
      type="button"
      className="btn small follow-btn"
      disabled={state === "busy" || state === "done"}
      title={reason ?? "Ajouter cet éditeur au marché : il sera collecté et noté comme les autres acteurs"}
      onClick={async () => {
        setState("busy");
        try {
          // miFetch : préfixe /api/v1/market-intelligence de virail et jeton de session (fetch nu visait l'API autonome)
          const res = await miFetch(`/catalog/entries/${entryId}/follow`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ market_id: marketId }),
          });
          if (!res.ok) {
            const detail = await res.json().then((b) => b.detail, () => null);
            throw new Error(typeof detail === "string" ? detail : `Erreur ${res.status}`);
          }
          setState("done");
          router.refresh();
        } catch (e) {
          setReason(e instanceof Error ? e.message : null);  // ex. réservé aux administrateurs
          setState("error");
        }
      }}
    >
      {state === "busy" ? "…" : state === "done" ? "✓ Suivi" : state === "error" ? "Échec, réessayer" : "+ Suivre"}
    </button>
  );
}
