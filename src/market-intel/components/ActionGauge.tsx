// Jauge d'actions : combien des 5 actions de base (trouver, lire, créer, modifier, supprimer)
// un agent peut faire sur un sujet. Lisible d'un coup d'œil ; le détail est en mots au survol et sur la fiche.

export const SLOTS = [
  { key: "find", label: "Trouver", verbs: ["SEARCH", "LIST", "RECOMMEND", "COMPARE", "MONITOR"] },
  { key: "read", label: "Lire", verbs: ["READ", "EXPORT", "CHECK_PRICE", "CHECK_AVAILABILITY"] },
  { key: "create", label: "Créer", verbs: ["CREATE", "SEND", "SUBMIT", "ADD_TO_CART", "BOOK", "CHECKOUT", "PAY"] },
  { key: "update", label: "Modifier", verbs: ["UPDATE", "MODIFY", "REFUND"] },
  { key: "delete", label: "Supprimer", verbs: ["DELETE", "CANCEL"] },
] as const;

export type SlotState = "on" | "declared" | "inferred" | "api" | "none";

// meilleur état d'une action : vérifié > annoncé > probable > API seule
const STRENGTH: Record<SlotState, number> = { on: 4, declared: 3, inferred: 2, api: 1, none: 0 };
export const stronger = (a: SlotState, b: SlotState) => (STRENGTH[b] > STRENGTH[a] ? b : a);

export function slotOf(verb: string) {
  return SLOTS.findIndex((s) => (s.verbs as readonly string[]).includes(verb));
}

const usable = (s: SlotState) => s !== "none" && s !== "api";
export const countActions = (states?: SlotState[]) => (states ?? []).filter(usable).length;

/** « trouver, lire, créer » : les actions possibles, en mots. */
export function actionWords(states: SlotState[], api = false) {
  return SLOTS.filter((_, i) => (api ? states[i] !== "none" : usable(states[i]))).map((s) => s.label.toLowerCase()).join(", ");
}

/** Niveau de preuve le plus faible parmi les actions possibles : ce qu'on peut affirmer pour toute la ligne. */
export function confidence(states: SlotState[]): string | null {
  const yes = states.filter(usable);
  if (!yes.length) return null;
  if (yes.includes("inferred")) return "probable";
  if (yes.includes("declared")) return "annoncé par l'éditeur";
  return null;
}

const tone = (n: number) => (n >= 4 ? "good" : n >= 2 ? "mid" : "low");

export function ActionGauge({ states, label }: { states: SlotState[]; label?: string }) {
  const n = countActions(states);
  const apiOnly = n === 0 && states.some((s) => s === "api");
  const words = actionWords(states, apiOnly);
  const title = `${label ? label + " : " : ""}${apiOnly ? "développeurs seulement (API) : " : ""}${words || "rien"}`;
  return (
    <span className="gauge-wrap" title={title} role="img" aria-label={title}>
      <span className={`gauge g-${apiOnly ? "api" : tone(n)}`}>
        <span style={{ width: `${((apiOnly ? SLOTS.length : n) / SLOTS.length) * 100}%` }} />
      </span>
    </span>
  );
}

/** Une ligne d'explication, sous le titre du tableau. */
export function GaugeLegend({ champion = false }: { champion?: boolean }) {
  return (
    <p className="gauge-legend">
      <span className="gauge g-good"><span style={{ width: "80%" }} /></span>
      Combien des 5 actions de base un agent peut faire : trouver, lire, créer, modifier, supprimer.
      {champion && <><span className="ld-best" /> le plus complet sur le sujet.</>}
    </p>
  );
}
