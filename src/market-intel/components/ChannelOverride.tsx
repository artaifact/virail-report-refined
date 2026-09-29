import { useRouter, miFetch } from "../compat";
import { useState } from "react";

// Corrections manuelles d'un accès : officiel ou tiers, compté ou non pour le produit suivi.
export default function ChannelOverride({ id, provenance, inScope, overridden }: {
  id: number; provenance: string; inScope: boolean; overridden: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function patch(body: Record<string, string>) {
    setBusy(true);
    await miFetch(`/channels/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    router.refresh();
  }
  return (
    <span className="row" style={{ gap: 10, fontSize: 12 }}>
      <button className="btn link" style={{ fontSize: 12 }} disabled={busy}
        onClick={() => patch({ provenance: provenance === "official" ? "community" : "official" })}>
        {provenance === "official" ? "C'est un tiers" : "C'est officiel"}
      </button>
      <button className="btn link" style={{ fontSize: 12 }} disabled={busy} onClick={() => patch({ scope: inScope ? "out" : "in" })}>
        {inScope ? "Autre produit : ne pas compter" : "Compter pour ce produit"}
      </button>
      {overridden && (
        <button className="btn link" style={{ fontSize: 12, color: "var(--muted)" }} disabled={busy} onClick={() => patch({ provenance: "", scope: "" })}>
          annuler mes corrections
        </button>
      )}
    </span>
  );
}
