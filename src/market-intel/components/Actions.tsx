import { useRouter, miFetch } from "../compat";
import { useState } from "react";

async function post(path: string, body: unknown) {
  const res = await miFetch(`${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await errorText(res));
  return res.json();
}

/** Message lisible d'une erreur d'API (le champ `detail` de FastAPI), sinon le statut. */
async function errorText(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return typeof body.detail === "string" ? body.detail : `Erreur ${res.status}`;
  } catch {
    return `Erreur ${res.status}`;
  }
}

export function CollectButton({ marketId }: { marketId: string }) {
  const [state, setState] = useState<"idle" | "sent" | "error">("idle");
  return (
    <button
      className="btn link"
      style={{ alignSelf: "flex-start", fontSize: 13 }}
      disabled={state === "sent"}
      onClick={async () => {
        try {
          await post(`/markets/${marketId}/collect`, {});
          setState("sent");
        } catch {
          setState("error");
        }
      }}
    >
      {state === "sent" ? "Mise à jour lancée : rechargez dans quelques minutes" : state === "error" ? "Échec, réessayer" : "↻ Mettre à jour les données"}
    </button>
  );
}

export function CandidateActions({ marketId, companyId, status = "pending" }: {
  marketId: string; companyId: string; status?: "pending" | "auto_added" | "auto_rejected";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const act = async (action: "add" | "watch" | "ignore") => {
    setBusy(true);
    setFailed(false);
    try {
      await post(`/markets/${marketId}/candidates/${companyId}`, { action });
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  const retry = failed ? <span className="meta"> échec, réessayez</span> : null;
  // décision automatique : une seule action, la correction
  if (status === "auto_added") {
    return <span className="row"><button className="btn small" disabled={busy} onClick={() => act("ignore")}>Retirer</button>{retry}</span>;
  }
  if (status === "auto_rejected") {
    return <span className="row"><button className="btn small" disabled={busy} onClick={() => act("add")}>Ajouter quand même</button>{retry}</span>;
  }
  return (
    <span className="row">
      <button className="btn small primary" disabled={busy} onClick={() => act("add")}>Ajouter</button>
      <button className="btn small" disabled={busy} onClick={() => act("watch")}>Surveiller</button>
      <button className="btn small" disabled={busy} onClick={() => act("ignore")}>Ignorer</button>
      {retry}
    </span>
  );
}

export function CreateMarketForm({ templates }: { templates: { id: string; name: string; objects: Record<string, string[]> }[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="stacked"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        try {
          const { id } = await post("/markets", {
            name: f.get("name"),
            competitors: String(f.get("competitors") ?? "").split(/[\n,]/).map((s) => s.trim()).filter(Boolean),
            ontology_template: f.get("template"),
          });
          router.push(`/markets/${id}`);
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }}
    >
      <label>
        Nom du marché
        <input name="name" placeholder="ex. Logiciels de comptabilité pour PME" required />
      </label>
      <label>
        Type de marché (définit les sujets suivis : contacts, commandes, réservations…)
        <select name="template" defaultValue="generic">
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Acteurs à inclure d'office (facultatif : les autres sont trouvés automatiquement)
        <textarea name="competitors" rows={4} placeholder={"Qonto\nIndy\nTiime"} />
      </label>
      {error && <p className="notice">{error}</p>}
      <button className="btn primary" type="submit">Suivre ce marché</button>
      <p className="muted" style={{ margin: 0, fontSize: 12 }}>
        Pour de meilleurs résultats, complétez ensuite le site web de chaque acteur dans sa fiche (Réglages avancés).
      </p>
    </form>
  );
}

/** Suivre un acteur (intérêt personnel sans faire partie du marché) ou le déclarer comme son entreprise. */
export function ViewerActions({ companyId, followed, mine }: { companyId: string; followed: boolean; mine: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const run = async (fn: () => Promise<Response | unknown>) => {
    setBusy(true);
    setFailed(false);
    try {
      const res = await fn();
      if (res instanceof Response && !res.ok) throw new Error(String(res.status));
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <span className="row">
      <button className={`btn small ${followed ? "on-follow" : ""}`} disabled={busy} aria-pressed={followed}
        onClick={() => run(() => post(`/profile/follow/${companyId}`, { follow: !followed }))}>
        {followed ? "★ Suivi" : "☆ Suivre"}
      </button>
      <button className="btn small link" disabled={busy}
        onClick={() => run(() => miFetch(`/profile`, { method: "PUT", headers: { "content-type": "application/json" },
          body: JSON.stringify({ my_company_id: mine ? null : companyId }) }))}>
        {mine ? "Ce n'est plus mon entreprise" : "C'est mon entreprise"}
      </button>
      {failed && <span className="meta">échec, réessayez</span>}
    </span>
  );
}
