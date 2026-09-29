// Couche « ludique » : humeurs et badges. Tout est dérivé des données réelles,
// rien n'est décoratif : chaque badge correspond à un critère de la note.
import type { Readiness, Trend } from "./api";
import { OBJECT_FR } from "./labels";

/** Tonalité d'un événement : un point coloré suffit à dire « gagné », « perdu » ou « changé ». */
export const EVENT_TONE: Record<string, "up" | "down" | "neutral"> = {
  CHANNEL_DETECTED: "up", CAPABILITY_ADDED: "up", CHANNEL_REMOVED: "down", CAPABILITY_REMOVED: "down",
};
export const eventTone = (type: string) => EVENT_TONE[type] ?? "neutral";

const AGENT_READY = ["MCP", "CONNECTOR_CLAUDE", "APP_CHATGPT", "AGENT_CARD", "COMMERCE_PROTOCOL"];

export type Mood = { label: string; tone: "hot" | "up" | "calm" | "cold" | "closed" };

/** Humeur d'un acteur : en tête, accélère, calme, endormi, fermé aux agents. */
export function mood(r: Readiness, rank: number, trend?: Trend): Mood {
  if (!r.agent_channels.some((t) => AGENT_READY.includes(t))) return { label: "Fermé aux agents", tone: "closed" };
  if (rank === 1) return { label: "En tête", tone: "hot" };
  const last = r.details?.latest_change?.date;
  const days = last ? (Date.now() - Date.parse(last)) / 864e5 : Infinity;
  if ((trend?.delta ?? 0) > 0 || days < 90) return { label: "Accélère", tone: "up" };
  if (days > 180) return { label: "Rien depuis 6 mois", tone: "cold" };
  return { label: "Stable", tone: "calm" };
}

export type Badge = { key: string; label: string; help: string; earned: boolean };

/** Badges « débloqués » : chacun correspond à un critère vérifiable de la note. */
export function badges(r: Readiness): Badge[] {
  const has = (t: string) => r.agent_channels.includes(t);
  const slots = r.details?.slots ?? [];
  const writes = slots.filter((s) => Number(s.split(":")[1]) >= 2).length;
  const subjects = new Set(slots.map((s) => s.split(":")[0])).size;
  return [
    { key: "mcp", label: "Serveur MCP", help: "Un point d'accès standard pour tous les agents IA.", earned: has("MCP") },
    { key: "claude", label: "Sur Claude", help: "Installable en un clic dans Claude.", earned: has("CONNECTOR_CLAUDE") },
    { key: "chatgpt", label: "Sur ChatGPT", help: "Disponible comme app dans ChatGPT.", earned: has("APP_CHATGPT") },
    { key: "write", label: "Agit vraiment", help: "Un agent peut créer ou modifier des données, pas seulement les lire.", earned: writes >= 3 },
    { key: "wide", label: "Couteau suisse", help: "Un agent peut agir sur au moins 5 sujets différents.", earned: subjects >= 5 },
    { key: "readable", label: "Lisible par les IA", help: "Publie un guide pour les IA (llms.txt), une carte d'agent ou une API documentée.", earned: (r.components.structured ?? 0) > 0 },
    { key: "fresh", label: "Nouveauté récente", help: "A lancé ou mis à jour un accès pour agents ces 90 derniers jours.", earned: (r.components.freshness ?? 0) > 0 },
  ];
}

const SLOT_VERB = ["trouver", "lire", "créer", "modifier", "supprimer"];
const OBJECT_SHORT: Record<string, string> = {
  CONTACT: "contacts", COMPANY: "entreprises", DEAL: "opportunités", PIPELINE: "pipelines", TASK: "tâches",
  NOTE: "notes", EMAIL: "emails", MEETING: "rendez-vous", REPORT: "rapports", SMS: "SMS", MESSAGE: "conversations",
  USER: "utilisateurs", QUOTE: "devis", INVOICE: "factures", PRODUCT: "produits", TICKET: "tickets",
};

const shortObject = (obj: string) => OBJECT_SHORT[obj] ?? OBJECT_FR[obj]?.toLowerCase() ?? obj.toLowerCase();

/** Ce qu'un agent peut faire, regroupé par sujet, les sujets les plus complets d'abord. Les sujets aux mêmes
 *  actions partagent une phrase : « tout faire sur les comptes et les factures ; lire des litiges ». */
export function abilities(slots: string[], maxObjects = 2): string {
  const verbs = new Map<string, Set<number>>();
  for (const s of slots) {
    const [obj, i] = s.split(":");
    verbs.set(obj, (verbs.get(obj) ?? new Set()).add(Number(i)));
  }
  const score = (v: Set<number>) => [...v].filter((i) => i >= 2).length * 10 + v.size;
  const top = [...verbs.entries()].sort((a, b) => score(b[1]) - score(a[1])).slice(0, maxObjects);
  const groups = new Map<string, string[]>();
  for (const [obj, v] of top) {
    const key = [...v].sort((a, b) => a - b).join(",");
    groups.set(key, [...(groups.get(key) ?? []), shortObject(obj)]);
  }
  const and = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} et ${xs[xs.length - 1]}` : xs[0]);
  return [...groups.entries()].map(([key, objs]) => {
    const v = key.split(",").map(Number);
    if (v.length === SLOT_VERB.length) return `tout faire sur ${and(objs.map((o) => `les ${o}`))}`;
    return `${and(v.map((i) => SLOT_VERB[i]))} ${and(objs.map((o) => `des ${o}`))}`;
  }).join(" ; ");
}

/** « CONTACT:2 » → phrases courtes, les actions d'écriture d'abord : « créer des opportunités ». */
export function highlights(slots: string[], max = 3): string[] {
  const sorted = [...slots].sort((a, b) => Number(b.split(":")[1] >= "2") - Number(a.split(":")[1] >= "2"));
  const out: string[] = [];
  for (const s of sorted) {
    const [obj, i] = s.split(":");
    const phrase = `${SLOT_VERB[Number(i)]} des ${shortObject(obj)}`;
    if (!out.includes(phrase)) out.push(phrase);
    if (out.length >= max) break;
  }
  return out;
}

export const levelTone = (label: string) => (label === "High" ? "good" : label === "Medium" ? "mid" : "low");
