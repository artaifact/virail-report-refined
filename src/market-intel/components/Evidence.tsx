import { miFetch } from "../compat";
import { useRef, useState } from "react";

interface EvidenceData {
  id: number;
  source_kind: string;
  url: string;
  excerpt: string;
  content_hash: string;
  collected_at: string;
  collector: string;
}

// Chaque fait affiché ouvre sa preuve brute : source, URL, extrait, hash, date.
export default function EvidenceLink({ id, label = "preuve" }: { id: number | null | undefined; label?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [data, setData] = useState<EvidenceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!id) return null;

  async function open() {
    ref.current?.showModal();
    if (data) return;
    try {
      const res = await miFetch(`/evidence/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(String(e));
    }
  }

  let excerpt = data?.excerpt ?? "";
  try {
    excerpt = JSON.stringify(JSON.parse(excerpt), null, 2);
  } catch {
    /* texte brut */
  }

  return (
    <>
      <button type="button" className="link-btn" onClick={open}>
        {label}
      </button>
      <dialog ref={ref} className="evidence" onClick={(e) => e.target === ref.current && ref.current?.close()}>
        <div className="spread">
          <h2>Preuve #{id}</h2>
          <button type="button" className="btn small" onClick={() => ref.current?.close()}>
            Fermer
          </button>
        </div>
        {error && <p className="notice">{error}</p>}
        {!data && !error && <p className="muted">Chargement…</p>}
        {data && (
          <>
            <p className="muted">
              {data.source_kind} · {data.collector} · {new Date(data.collected_at).toLocaleString("fr-FR")}
              <br />
              <a href={data.url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", wordBreak: "break-all" }}>
                {data.url}
              </a>
            </p>
            <pre>{excerpt}</pre>
            <p className="muted mono">sha256 {data.content_hash.slice(0, 16)}…</p>
          </>
        )}
      </dialog>
    </>
  );
}
