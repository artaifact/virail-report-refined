// Sujet × acteur → 5 créneaux (Trouver, Lire, Créer, Modifier, Supprimer), meilleure preuve par créneau.
import { SLOTS, type SlotState, slotOf, stronger } from "../components/ActionGauge";
import type { Matrix, MatrixCell } from "./api";
import { CHANNEL_INFO } from "./labels";

function stateOf(c: MatrixCell): SlotState {
  if (!CHANNEL_INFO[c.channel_type]?.agent) return "api";
  if (c.inferred) return "inferred";
  return c.level === "OBSERVED" ? "on" : "declared";
}

export type Grid = Map<string, Map<string, SlotState[]>>;

export function buildGrid(m: Matrix): { grid: Grid; objects: string[] } {
  const generic = new Set(Object.keys(m.generic ?? {}));
  const grid: Grid = new Map();
  for (const r of m.rows) {
    if (generic.has(r.object)) continue; // déjà déplié sur les sujets couverts
    const slot = slotOf(r.verb);
    if (slot < 0) continue;
    for (const [company, cells] of Object.entries(r.cells)) {
      const byCompany = grid.get(r.object) ?? new Map<string, SlotState[]>();
      const states = byCompany.get(company) ?? SLOTS.map(() => "none" as SlotState);
      for (const c of cells) states[slot] = stronger(states[slot], stateOf(c));
      byCompany.set(company, states);
      grid.set(r.object, byCompany);
    }
  }
  // les sujets les plus répandus d'abord : on lit d'abord ce qui compare le plus d'acteurs
  const objects = [...grid.keys()].sort((a, b) => grid.get(b)!.size - grid.get(a)!.size);
  return { grid, objects };
}
