"use client";

import { useRouter } from "../../compat";
import { useState } from "react";

/** Suivre l'éditeur d'un plugin : il devient un acteur du marché, avec sa note dès la première collecte. */
export default function FollowButton({ entryId, marketId }: { entryId: number; marketId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  return (
    <button
      type="button"
      className="btn small follow-btn"
      disabled={state === "busy" || state === "done"}
      title="Ajouter cet éditeur au marché : il sera collecté et noté comme les autres acteurs"
      onClick={async () => {
        setState("busy");
        try {
          const res = await fetch(`/api/catalog/entries/${entryId}/follow`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ market_id: marketId }),
          });
          if (!res.ok) throw new Error(String(res.status));
          setState("done");
          router.refresh();
        } catch {
          setState("error");
        }
      }}
    >
      {state === "busy" ? "…" : state === "done" ? "✓ Suivi" : state === "error" ? "Échec, réessayer" : "+ Suivre"}
    </button>
  );
}
