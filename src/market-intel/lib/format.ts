import type { MarketEvent } from "./api";
import { capabilityFr, channelName } from "./labels";

export const pct = (x: number, digits = 0) => `${(x * 100).toFixed(digits)} %`;

export function date(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function dateTime(iso: string) {
  const d = new Date(iso);
  const thisYear = d.getUTCFullYear() === new Date().getUTCFullYear();
  return d.toLocaleString("fr-FR", thisYear
    ? { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }
    : { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

// date d'un événement : au mois près quand la source ne donne que le mois (« Added February 2026 »)
export function eventDate(e: MarketEvent) {
  if (e.subject.date_precision === "month") {
    return new Date(e.detected_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
  }
  return dateTime(e.detected_at);
}

export const PROVIDER_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
  perplexity: "Perplexity",
};

export const CHANNEL_LABELS: Record<string, string> = {
  MCP: "MCP",
  APP_CHATGPT: "App ChatGPT",
  CONNECTOR_CLAUDE: "Connecteur Claude",
  AUTOMATION: "Zapier",
  AGENT_CARD: "Agent card",
  COMMERCE_PROTOCOL: "Commerce",
  API: "API",
  SDK: "SDK",
  LLMS_TXT: "llms.txt",
  OPENAPI: "OpenAPI",
};

// libellés courts pour les cellules de la Capability Matrix
export const CHANNEL_SHORT: Record<string, string> = {
  MCP: "MCP",
  APP_CHATGPT: "ChatGPT",
  CONNECTOR_CLAUDE: "Claude",
  AUTOMATION: "Zapier",
  AGENT_CARD: "A2A",
  COMMERCE_PROTOCOL: "Commerce",
  API: "API",
  SDK: "SDK",
};

export const EVENT_LABELS: Record<string, string> = {
  CHANNEL_DETECTED: "Nouvel accès",
  CHANNEL_VERSION_CHANGED: "Mise à jour",
  CHANNEL_REMOVED: "Accès retiré",
  CAPABILITY_ADDED: "Nouvelle action",
  CAPABILITY_REMOVED: "Action retirée",
  VISIBILITY_SHIFT: "Recommandations IA",
  NEW_COMPANY_CANDIDATE: "Nouvel acteur",
};

// « Serveur MCP » → « serveur MCP » (on ne met en minuscule que la première lettre)
const lcFirst = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

// Phrase courte, sans jargon : « a rejoint l'annuaire des connecteurs Claude »
export function describeEvent(e: MarketEvent): string {
  const s = e.subject;
  const ch = String(s.channel ?? "");
  const byThirdParty = s.provenance === "community";
  const name = String(s.name ?? "").replace(/^.+? — /, "");
  const version = s.version ? ` (version ${s.version})` : "";
  switch (e.type) {
    case "CHANNEL_DETECTED":
      if (byThirdParty) return `un ${lcFirst(channelName(ch))} publié par un tiers est apparu : ${name}`;
      if (ch === "CONNECTOR_CLAUDE") return "a rejoint l'annuaire des connecteurs Claude";
      if (ch === "APP_CHATGPT") return "a une app dans ChatGPT";
      if (ch === "MCP") return `a publié un serveur MCP${version}`;
      return `nouveau canal : ${channelName(ch)}`;
    case "CHANNEL_VERSION_CHANGED":
      return `a mis à jour son ${lcFirst(channelName(ch))} (${s.previous_version ?? "?"} → ${s.version})`;
    case "CHANNEL_REMOVED":
      return `a retiré son ${lcFirst(channelName(ch))}${byThirdParty ? " (tiers)" : ""}`;
    case "CAPABILITY_ADDED":
      return `un agent peut désormais : ${s.capability === "UNMAPPED" ? s.raw_label : capabilityFr(String(s.capability)).toLowerCase()} (via ${channelName(ch)})`;
    case "CAPABILITY_REMOVED":
      return `un agent ne peut plus : ${s.capability === "UNMAPPED" ? s.raw_label : capabilityFr(String(s.capability)).toLowerCase()} (via ${channelName(ch)})`;
    case "VISIBILITY_SHIFT":
      return `les IA le recommandent ${Number(s.to) > Number(s.from) ? "plus" : "moins"} souvent (${pct(Number(s.from))} → ${pct(Number(s.to))})`;
    case "NEW_COMPANY_CANDIDATE":
      return `nouvel acteur repéré (${s.via})`;
    default:
      return e.type;
  }
}
