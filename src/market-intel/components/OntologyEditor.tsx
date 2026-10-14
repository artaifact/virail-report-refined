import { useRouter, miFetch } from "../compat";
import { useMemo, useState } from "react";
import type { MarketOntology } from "../lib/api";

type Row = { key: string; synonyms: string };

const parseSynonyms = (s: string) => s.split(/[\s,]+/).map((w) => w.trim().toLowerCase()).filter(Boolean);

// Édite l'ontologie d'un market. Enregistrer crée une nouvelle version : tout l'historique est
// reclassé immédiatement, sans émettre d'événement.
export default function OntologyEditor({ data }: { data: MarketOntology }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(data.objects.map((o) => ({ key: o.key, synonyms: o.synonyms.join(", ") })));
  const [note, setNote] = useState("");
  // objets génériques : « RECORD » → « CONTACT, COMPANY, DEAL »
  const [generic, setGeneric] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(data.generic ?? {}).map(([k, v]) => [k, v.join(", ")])),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const usage = useMemo(() => Object.fromEntries(data.objects.map((o) => [o.key, o.capabilities])), [data.objects]);
  const assigned = useMemo(
    () => new Set(rows.flatMap((r) => [r.key.toLowerCase(), ...parseSynonyms(r.synonyms)])),
    [rows],
  );
  const genericPayload = () =>
    Object.fromEntries(
      Object.entries(generic)
        .filter(([k]) => rows.some((r) => r.key === k))
        .map(([k, v]) => [k, v.split(/[\s,]+/).map((x) => x.trim().toUpperCase()).filter(Boolean)]),
    );
  const dirty =
    JSON.stringify(rows.map((r) => [r.key, parseSynonyms(r.synonyms)])) !==
      JSON.stringify(data.objects.map((o) => [o.key, o.synonyms])) ||
    JSON.stringify(genericPayload()) !== JSON.stringify(data.generic ?? {});

  const setRow = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const addSynonym = (noun: string, key: string) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, synonyms: [...parseSynonyms(r.synonyms), noun].join(", ") } : r)));

  async function save() {
    setSaving(true);
    setStatus(null);
    const objects = Object.fromEntries(rows.filter((r) => r.key.trim()).map((r) => [r.key.trim().toUpperCase(), parseSynonyms(r.synonyms)]));
    const res = await miFetch(`/markets/${data.market.id}/ontology`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ objects, note: note || null, generic: genericPayload() }),
    });
    setSaving(false);
    if (res.ok) {
      const { id } = await res.json();
      setNote("");
      setStatus(`Version ${id} enregistrée. Les tableaux et les notes sont recalculés.`);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      setStatus(`Erreur : ${body.detail}`);
    }
  }

  return (
    <div className="grid grid-2" style={{ alignItems: "start" }}>
      <section className="card">
        <div className="spread">
          <h2>Sujets suivis</h2>
          <button className="btn small" onClick={() => setRows((rs) => [...rs, { key: "", synonyms: "" }])}>
            + Sujet
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Sujet</th>
              <th>Mots qui le désignent dans les outils</th>
              <th className="num">Actions</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ width: 150 }}>
                  <input value={r.key} onChange={(e) => setRow(i, { key: e.target.value.toUpperCase() })} placeholder="OBJET" className="mono" />
                </td>
                <td>
                  <input value={r.synonyms} onChange={(e) => setRow(i, { synonyms: e.target.value })} placeholder="synonyme, autre" />
                </td>
                <td className="num muted">{usage[r.key] ?? "—"}</td>
                <td>
                  <button className="btn small" title="Retirer l'objet" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {Object.keys(generic).length > 0 && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
            <h3>Outils génériques</h3>
            {Object.entries(generic).map(([k, v]) => (
              <label key={k} style={{ fontWeight: 400 }}>
                Un outil qui agit sur « {k} » compte aussi pour ces sujets :
                <input value={v} onChange={(e) => setGeneric((g) => ({ ...g, [k]: e.target.value }))} className="mono" placeholder="CONTACT, COMPANY, DEAL" />
              </label>
            ))}
          </div>
        )}
        <div className="row" style={{ marginTop: 12 }}>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note de version (optionnel)" style={{ flex: 1, width: "auto" }} />
          <button className="btn primary" disabled={!dirty || saving} onClick={save}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
        {status && <p className={status.startsWith("Erreur") ? "notice" : "muted"} style={{ fontSize: 13 }}>{status}</p>}
      </section>

      <section className="card">
        <h2>Mots pas encore compris</h2>
        <p className="muted" style={{ fontSize: 12, marginTop: -6 }}>
          Mots trouvés dans les outils des acteurs de ce marché qui ne correspondent à aucun sujet. Rattachez-les à un sujet existant
          ou créez-en un : les tableaux seront recalculés immédiatement.
        </p>
        {data.unmapped_nouns.length === 0 ? (
          <p className="empty">Tout est classé.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Mot</th>
                <th className="num">Acteurs</th>
                <th>Exemples d'outils</th>
                <th>Rattacher à</th>
              </tr>
            </thead>
            <tbody>
              {data.unmapped_nouns.map((n) => (
                <tr key={n.noun}>
                  <td><code>{n.noun}</code></td>
                  <td className="num" title={n.companies.join(", ")}>{n.companies.length}</td>
                  <td className="muted mono" style={{ fontSize: 11 }}>{n.examples.slice(0, 2).join(" · ")}</td>
                  <td>
                    {assigned.has(n.noun) ? (
                      <span className="badge high">ajouté</span>
                    ) : (
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "__new__") setRows((rs) => [...rs, { key: n.noun.toUpperCase(), synonyms: "" }]);
                          else if (v) addSynonym(n.noun, v);
                        }}
                      >
                        <option value="">—</option>
                        <option value="__new__">+ nouveau sujet {n.noun.toUpperCase()}</option>
                        {rows.filter((r) => r.key).map((r) => (
                          <option key={r.key} value={r.key}>{r.key}</option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="muted" style={{ fontSize: 12 }}>
          {data.unmapped_without_verb} outil(s) dont l'action n'est pas reconnue (ex. <code>whoami</code>) sont ignorés.
        </p>
      </section>
    </div>
  );
}
