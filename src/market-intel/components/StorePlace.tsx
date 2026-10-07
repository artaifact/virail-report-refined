/** Place dans les stores d'agents (ChatGPT, Claude) : combien d'apps servent déjà un marché, et qui manque. */
import type { CatalogCoverageRow } from "../lib/api";

const STORE = (s: string) => (s === "chatgpt" ? "ChatGPT" : s === "claude" ? "Claude" : s);

/** « 14 apps : 7 d'acteurs suivis, 7 d'autres éditeurs (ChatGPT 6, Claude 1) » */
export function placeDetail(r: CatalogCoverageRow): string {
  const apps = r.apps ?? r.tracked_in_catalogs + r.neighbors;
  const stores = Object.entries(r.apps_by_store ?? {}).sort((a, b) => b[1] - a[1]).map(([s, n]) => `${STORE(s)} ${n}`).join(", ");
  const parts = [`${apps} app${apps > 1 ? "s" : ""} servent ce marché dans les stores${stores ? ` (${stores})` : ""}`,
    `${r.tracked_in_catalogs} des ${r.tracked} acteurs suivis y sont`];
  if (r.leaders_absent?.length) parts.push(`meneurs absents : ${r.leaders_absent.slice(0, 3).map((l) => l.name).join(", ")}`);
  if (r.place_cuts) parts.push(`comparé aux autres marchés : peu occupée jusqu'à ${r.place_cuts[0]} apps, saturée au-delà de ${r.place_cuts[1]}`);
  return parts.join(" · ");
}

/** Pastille libre / disputée / saturée, avec le détail au survol. */
export function PlaceBadge({ row }: { row?: CatalogCoverageRow }) {
  if (!row?.measured || !row.place) return <span className="meta">—</span>;
  const apps = row.apps ?? 0;
  return (
    <span className={`place place-${row.place.key}`} title={placeDetail(row)}>
      {row.place.label} <span className="place-n">{apps}</span>
    </span>
  );
}

export const PLACE_HELP =
  "Place dans les stores d'agents : combien d'apps ChatGPT et de connecteurs Claude servent déjà le marché, " +
  "comparé aux autres marchés suivis. Peu occupée : le tiers des marchés les moins servis. Saturée : le tiers le plus servi.";
