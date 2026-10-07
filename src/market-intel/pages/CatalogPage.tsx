import { useState } from "react";
import { Link, useLoader, useSearchParams, useRouter } from "../compat";
import { guard } from "../views";
import FilterSelect from "../components/FilterSelect";
import {
  api,
  type CatalogCoverageRow,
  type CatalogEntryRow,
  type CatalogOverview,
} from "../lib/api";

const STORE_LABELS: Record<string, string> = { chatgpt: "ChatGPT", claude: "Claude", muse: "Muse" };
const storeName = (s: string) => STORE_LABELS[s] ?? s;

export default function CatalogPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const store = searchParams.get("store") || undefined;
  const category = searchParams.get("category") || undefined;
  const q = searchParams.get("q") || undefined;
  const linked = searchParams.get("linked") || undefined;

  const [searchQuery, setSearchQuery] = useState(q || "");

  const qs = new URLSearchParams({ limit: "60" });
  if (store) qs.set("store", store);
  if (category) qs.set("category", category);
  if (q) qs.set("q", q);
  if (linked) qs.set("linked", linked === "1" ? "true" : "false");

  const state = useLoader(async () => {
    const [overview, coverage, list] = await Promise.all([
      api<CatalogOverview>("/catalog"),
      api<{ markets: CatalogCoverageRow[] }>("/catalog/coverage"),
      api<{ total: number; entries: CatalogEntryRow[] }>(`/catalog/entries?${qs.toString()}`),
    ]);
    return { overview, coverage, list };
  }, [store, category, q, linked]);

  const blocked = guard(state);
  if (blocked) return blocked;

  const { overview, coverage, list } = state.data!;
  const categories = [...new Set(overview.stores.flatMap((s) => s.categories.map((c) => c.name)))].sort();
  const measured = coverage.markets.filter((m) => m.measured);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      next.set("q", searchQuery.trim());
    } else {
      next.delete("q");
    }
    router.push(`/catalog?${next.toString()}`);
  };

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Catalogues</span>
          <h1>Ce que les agents peuvent installer</h1>
          <p className="subtitle">
            Tous les plugins et connecteurs des annuaires, y compris hors de vos marchés : où le terrain est
            occupé, où il est libre, qui arrive.
          </p>
        </div>
      </div>

      <section className="card">
        <table>
          <thead>
            <tr><th>Annuaire</th><th>Entrées</th><th>Avec URL MCP publique</th><th>Dernier relevé</th></tr>
          </thead>
          <tbody>
            {overview.stores.map((s) => (
              <tr key={s.store}>
                <td><strong>{storeName(s.store)}</strong></td>
                <td>{s.total.toLocaleString("fr-FR")}</td>
                <td>{s.with_mcp_url.toLocaleString("fr-FR")}</td>
                <td className="meta">{s.last_seen ? new Date(s.last_seen).toLocaleDateString("fr-FR") : "—"}</td>
              </tr>
            ))}
            {!overview.stores.length && (
              <tr><td colSpan={4} className="meta">Aucun relevé : lancez <code>collect-catalog</code>.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Marchés suivis : où sont les trous</h2>
        <p className="meta">
          « Plugins voisins » = plugins dont le nom ou l&apos;accroche parle du domaine, d&apos;éditeurs que vous ne suivez
          pas. Peu de voisins et peu d&apos;éditeurs suivis présents : le marché est encore libre côté agents.
          Approximation par mots-clés, à lire comme un ordre de grandeur.
        </p>
        <table>
          <thead>
            <tr><th>Marché</th><th>Suivis présents</th><th>Plugins voisins</th><th>Exemples</th></tr>
          </thead>
          <tbody>
            {measured.map((m) => (
              <tr key={m.market_id}>
                <td><Link href={`/?m=${m.market_id}`}>{m.market}</Link></td>
                <td>{m.tracked_in_catalogs}/{m.tracked}</td>
                <td>
                  <strong>{m.neighbors}</strong>{" "}
                  <span className="meta">
                    {Object.entries(m.neighbors_by_store).map(([s, n]) => `${storeName(s)} ${n}`).join(" · ")}
                  </span>
                </td>
                <td className="meta">{m.sample.map((e) => e.name).join(", ")}</td>
              </tr>
            ))}
            {!measured.length && <tr><td colSpan={4} className="meta">Aucun marché mesurable.</td></tr>}
          </tbody>
        </table>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Explorer</h2>
        <div className="toolbar" style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 14 }}>
          <form onSubmit={handleSearchSubmit} style={{ display: "inline-flex", gap: 6 }}>
            <input
              name="q"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nom, accroche, éditeur"
              className="inline"
              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)" }}
            />
            <button type="submit" className="btn small primary">Chercher</button>
          </form>
          <FilterSelect
            name="store"
            label="Annuaire"
            options={[{ value: "", label: "Tous" }, ...overview.stores.map((s) => ({ value: s.store, label: storeName(s.store) }))]}
          />
          <FilterSelect
            name="category"
            label="Catégorie"
            options={[{ value: "", label: "Toutes" }, ...categories.map((c) => ({ value: c, label: c }))]}
          />
          <FilterSelect
            name="linked"
            label="Éditeur"
            options={[{ value: "", label: "Tous" }, { value: "1", label: "Suivi" }, { value: "0", label: "Non suivi" }]}
          />
          <span className="meta" style={{ marginLeft: "auto" }}>
            {list.total.toLocaleString("fr-FR")} résultat{list.total > 1 ? "s" : ""}
            {list.total > list.entries.length ? ` (${list.entries.length} affichés)` : ""}
          </span>
        </div>
        <table>
          <thead>
            <tr><th>Nom</th><th>Annuaire</th><th>Catégorie</th><th>Éditeur</th><th>Accès</th></tr>
          </thead>
          <tbody>
            {list.entries.map((e) => (
              <tr key={e.id}>
                <td>
                  {e.url ? <a href={e.url} target="_blank" rel="noopener noreferrer"><strong>{e.name}</strong></a> : <strong>{e.name}</strong>}
                  {e.tagline && <div className="meta">{e.tagline}</div>}
                </td>
                <td><span className="badge">{storeName(e.store)}</span></td>
                <td className="meta">{e.category ?? "—"}</td>
                <td className="meta">
                  {e.company_id ? <Link href={`/companies/${e.company_id}`}>{e.developer ?? e.name} ★</Link> : (e.developer ?? "—")}
                </td>
                <td className="meta">
                  {e.tools > 0 ? `${e.tools} outils` : e.capabilities.length ? e.capabilities.join(", ") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Arrivées et départs récents</h2>
        {overview.recent.length ? (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {overview.recent.map((e, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                <strong>{e.name}</strong> {e.type === "CATALOG_ADDED" ? "a rejoint" : "a quitté"} {storeName(e.store)}
                {e.category ? ` (${e.category})` : ""} <span className="meta"> · {new Date(e.at).toLocaleDateString("fr-FR")}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="meta">Rien pour l&apos;instant : le premier relevé sert d&apos;état initial, les nouveautés apparaîtront dès le prochain.</p>
        )}
      </section>
    </main>
  );
}
