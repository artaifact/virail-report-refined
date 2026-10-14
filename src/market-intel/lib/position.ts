/** Position d'un marché : la demande (les gens s'y intéressent-ils de plus en plus ?) croisée avec l'occupation
 *  (reste-t-il de la place pour les agents ?), nuancée par l'activité des éditeurs. Chaque verdict garde ses critères
 *  chiffrés, pour être vérifiable. Remplace la « température », qui mesurait l'offre et se confondait avec l'occupation. */
import type { CatalogCoverageRow, MarketBuzz } from "./api";

export type Demand = "rising" | "flat" | "falling" | "unknown";
export type PositionKey = "window" | "closing" | "race" | "fallow" | "settled" | "unknown";

export interface PositionInput {
  buzz?: MarketBuzz;
  events30d: number;
  tracked: number;
  agentEnabled: number;
  place?: CatalogCoverageRow;
}

export interface Position {
  key: PositionKey;
  label: string;
  advice: string;
  demand: Demand;
  lowOccupation: boolean | null;
  moving: boolean;
  criteria: string[];
  /** les chiffres du verdict, pour les afficher sans survol */
  stats: { trend: number | null; measured: number; apps: number | null; share: number; events30d: number; tracked: number };
}

// seuils : une tendance de ±10 % sur 30 jours, 3 acteurs mesurés au moins, 1,5 nouveauté pour 10 acteurs
export const RISING = 10;
export const MIN_MEASURED = 3;
export const MOVING_PER_10 = 1.5;
export const LOW_SHARE = 25;

const LABELS: Record<PositionKey, { label: string; advice: string }> = {
  closing: { label: "Fenêtre qui se referme", advice: "La demande monte, la place est encore libre, et les éditeurs commencent à bouger : c'est maintenant." },
  window: { label: "Fenêtre ouverte", advice: "La demande monte et peu d'offres pour agents existent : c'est le moment de se lancer." },
  race: { label: "Course", advice: "La demande monte mais la place est prise : il faut se différencier, vite." },
  fallow: { label: "Terrain en friche", advice: "Peu d'offres, mais la demande ne monte pas : pari à long terme, ou marché sans demande." },
  settled: { label: "Marché installé", advice: "Place prise et demande stable : on s'y bat sur la qualité, pas sur la présence." },
  unknown: { label: "Demande non mesurée", advice: "Trop peu d'acteurs ont une audience mesurable pour lire la demande." },
};

export function positionOf(i: PositionInput): Position {
  const measured = i.buzz?.measured ?? 0;
  const trend = i.buzz?.trend ?? null;
  const demand: Demand = trend === null || measured < MIN_MEASURED ? "unknown"
    : trend >= RISING ? "rising" : trend <= -RISING ? "falling" : "flat";
  const share = i.tracked ? Math.round((100 * i.agentEnabled) / i.tracked) : 0;
  const placeKey = i.place?.measured ? i.place.place?.key : undefined;
  // peu occupé : parmi les marchés les moins servis dans les stores, ou moyennement servis avec peu d'acteurs utilisables
  const lowOccupation = placeKey === undefined ? null : placeKey === "libre" || (placeKey === "disputee" && share < LOW_SHARE);
  const per10 = i.tracked ? (10 * i.events30d) / i.tracked : 0;
  const moving = per10 >= MOVING_PER_10;

  let key: PositionKey;
  if (demand === "unknown" || lowOccupation === null) key = "unknown";
  else if (demand === "rising") key = lowOccupation ? (moving ? "closing" : "window") : "race";
  else key = lowOccupation ? "fallow" : "settled";

  const criteria = [
    demand === "unknown"
      ? `demande : ${measured} acteur${measured > 1 ? "s" : ""} mesuré${measured > 1 ? "s" : ""}, il en faut ${MIN_MEASURED}`
      : `demande : buzz ${trend! > 0 ? "+" : ""}${trend} % sur 30 jours (médiane de ${measured} acteurs)`,
    lowOccupation === null
      ? "occupation : stores non mesurés"
      : `occupation : ${i.place!.apps ?? 0} apps dans les stores (${i.place!.place!.label.toLowerCase()}), ${share} % d'acteurs utilisables`,
    `activité : ${i.events30d} nouveauté${i.events30d > 1 ? "s" : ""} des éditeurs pour ${i.tracked} acteurs ce mois`,
  ];
  const stats = { trend, measured, apps: i.place?.measured ? (i.place.apps ?? null) : null, share, events30d: i.events30d, tracked: i.tracked };
  return { key, ...LABELS[key], demand, lowOccupation, moving, criteria, stats };
}

export const POSITION_ORDER: PositionKey[] = ["closing", "window", "race", "fallow", "settled", "unknown"];
export const POSITION_LABEL = (k: PositionKey) => LABELS[k].label;
export const POSITION_ADVICE = (k: PositionKey) => LABELS[k].advice;
