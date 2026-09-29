// Types et accès à l'API du moteur (voir compat.tsx pour le préfixe et l'authentification par cookie).

import { miFetch, NotFoundError } from "../compat";


export type Level = "OBSERVED" | "DECLARED" | "ESTIMATED";

export interface MarketSummary {
  id: string;
  name: string;
  my_company: string | null;
  companies_tracked: number;
  agent_enabled: number;
  candidates: number;
  last_run_at: string | null;
}

/** Pic d'attention : à la une de Hacker News, ou pic de pages vues rattaché à l'article du moment. */
export interface BuzzSpike {
  signal: string;
  day: string;
  why: string;
  tone?: "good" | "bad";
  story?: { title: string; points: number; url?: string | null; hn?: string };
}

/** Tendance d'attention d'un acteur (à part de la note sur 100). */
export interface Buzz {
  trend: number | null;
  driver: string | null;
  driver_label: string | null;
  viral: BuzzSpike[];
  bad_buzz: BuzzSpike[];
  notoriety: number | null;
  measured: boolean;
}

export interface MarketBuzz {
  trend: number | null;
  measured: number;
  rising: number;
  viral: number;
}

export interface LandscapeMarket {
  buzz: MarketBuzz;
  id: string;
  name: string;
  template: string | null;
  me: { name: string; rank: number; score: number } | null;
  followed: { id: string; name: string; rank: number; score: number }[];
  tracked: number;
  agent_enabled: number;
  maturity: number;
  series: { day: string; value: number }[];
  momentum: number | null;
  events_30d: number;
  new_actors_30d: number;
  heat: number;
  top: { id: string; name: string; domain: string | null; score: number; me: boolean }[];
}

export interface Landscape {
  totals: { markets: number; companies: number; agent_enabled: number; tracked: number; events_30d: number };
  markets: LandscapeMarket[];
  movers: { company_id: string; name: string; domain: string | null; market_id: string; market: string; from: number; to: number; delta: number }[];
  feed: (MarketEvent & { market_id: string; market: string; domain: string | null })[];
  buzzing: (Buzz & { company_id: string; name: string; domain: string | null; market_id: string; market: string })[];
  score_method: string;
}

export interface Readiness {
  score: number;
  label: "High" | "Medium" | "Low";
  components: Record<string, number>;
  weights: Record<string, number>;
  agent_channels: string[];
  capability_count: number;
  method?: string;
  details?: { slots: string[]; slot_total: number; channel_types: string[]; universal?: string[]; latest_change: { date: string; what: string } | null };
}

export interface Trend {
  delta: number | null;
  reasons: string[];
  day: string | null;
  incomplete_today: boolean;
}

export interface ScorePoint {
  day: string;
  score: number;
  complete: boolean;
  method: string;
  delta: number | null;
  reasons: string[];
}

export interface ModelVisibility {
  n: number;
  recommendation: number;
  ci: [number, number];
  mention: number;
  citation: number;
}

export interface Visibility {
  recommendation: number;
  ci: [number, number];
  per_model: Record<string, ModelVisibility>;
  avg_position: number | null;
  share_of_voice: number;
}

export interface VisibilityMeta {
  providers: string[];
  runs: Record<string, number>;
  window_days: number;
}

export interface MarketEvent {
  id: number;
  company_id: string;
  company: string;
  type: string;
  subject: Record<string, string | number | boolean | null>;
  level: Level;
  confidence: number;
  evidence_ids: number[];
  detected_at: string;
  baseline: boolean;
}

export interface Overview {
  market: { id: string; name: string };
  pulse: { events_30d: number; momentum: number | null; maturity: number; series: { day: string; value: number }[] };
  buzz: MarketBuzz;
  counters: {
    companies_tracked: number;
    agent_enabled: number;
    visible_in_llms: number;
    added_capabilities_30d: number;
    new_entrants_30d: number;
  };
  companies: { id: string; name: string; role: string; followed?: boolean; domain?: string | null; readiness: Readiness; visibility: Visibility; trend?: Trend; buzz?: Buzz }[];
  score_method?: { version: string; note: string };
  visibility_meta: VisibilityMeta;
  activity: MarketEvent[];
  movers: Record<string, { company_id: string; name: string; score: number; events: number }[]>;
}

export interface MatrixCell {
  channel_type: string;
  channel_name: string;
  provenance: "official" | "community";
  level: Level;
  raw_label: string;
  evidence_id: number | null;
  first_seen: string;
  inferred?: boolean;
}

export interface Matrix {
  ontology: string;
  generic?: Record<string, string[]>;
  companies: { id: string; name: string; role: string; followed?: boolean }[];
  rows: { key: string; verb: string; object: string; family: string; cells: Record<string, MatrixCell[]> }[];
  unmapped: Record<string, number>;
}

export interface OntologyTemplate {
  id: string;
  name: string;
  objects: Record<string, string[]>;
}

export interface MarketOntology {
  market: { id: string; name: string };
  current: { id: string; version: number; template: string; note: string | null; created_at: string };
  objects: { key: string; synonyms: string[]; capabilities: number }[];
  generic: Record<string, string[]>;
  unmapped_nouns: { noun: string; count: number; companies: string[]; examples: string[] }[];
  unmapped_without_verb: number;
  mapped: number;
  total: number;
  versions: { id: string; version: number; note: string | null; objects: number; created_at: string }[];
}

export interface Candidate {
  company_id: string;
  name: string;
  domain: string | null;
  description: string | null;
  discovered_via: string | null;
  status: "pending" | "auto_added" | "auto_rejected";
  added_at: string;
}

export interface ChannelCapability {
  key: string;
  raw_label: string;
  status: string;
  level: Level;
  confidence: number;
  first_seen: string;
  last_seen: string;
  evidence_id: number | null;
}

export interface Channel {
  id: number;
  type: string;
  name: string;
  url: string | null;
  version: string | null;
  provenance: "official" | "community";
  status: string;
  probe_status: string | null;
  level: Level;
  first_seen: string;
  last_seen: string;
  evidence_id: number | null;
  capabilities: ChannelCapability[];
  provenance_reason?: string;
  provenance_overridden?: boolean;
  in_scope?: boolean;
  scope_reason?: string;
}

export interface Identity {
  domain: string | null;
  description: string | null;
  github_orgs: string[];
  mcp_namespaces: string[];
  match_patterns: string[];
  product_patterns: string[];
  docs_urls: { url: string; channel: string; name?: string; endpoint?: string }[];
  openapi_url: string | null;
  zapier_slug: string | null;
  claude_connector_slug: string | null;
  aliases: string[];
}

export interface CanDo {
  object: string;
  verbs: { verb: string; level: Level; inferred: boolean; channel: string; tool: string }[];
}

export interface Attention extends Buzz {
  signals: Record<string, { recent: number; prior: number; growth: number | null; enough: boolean; label: string }>;
  weekly: Record<string, { week: string; value: number }[]>;
  peaks: { day: string; title: string; points: number; url?: string | null; hn?: string; tone: "good" | "bad" }[];
  sources: { signal: string; label: string; url: string }[];
  measured_at: string;
}

export interface CompanyProfile {
  attention: Attention | null;
  viewer: { followed: boolean; mine: boolean };
  company: { id: string; name: string; domain: string | null; description: string | null; website: string | null };
  market: { id: string; name: string };
  identity: Identity;
  can_do: Record<"agent" | "api", CanDo[]>;
  readiness: Readiness | null;
  last_change: MarketEvent | null;
  visibility: Visibility;
  visibility_meta: VisibilityMeta;
  channels: Channel[];
  events: MarketEvent[];
  score_history?: ScorePoint[];
  score_method?: { version: string; note: string };
}

export interface ReviewItem {
  company_id: string;
  company: string;
  raw_label: string;
  channel: string;
  predicted: string | null;
  expanded: string[];
  evidence_id: number | null;
}

export interface ReviewState {
  stats: { reviewed: number; judged: number; correct: number; precision: number; ci: [number, number]; missed: number;
    unmapped_reviewed: number; remaining: number; target: number; min_sample: number };
  queue: ReviewItem[];
  objects: string[];
  recent: { company: string; raw_label: string; predicted: string | null; verdict: string; corrected: string | null }[];
}

export interface Health {
  llm_providers: string[];
  llm_extraction: boolean;
  github_token: boolean;
  firecrawl: boolean;
  web_search: string | null;
}

export async function api<T>(path: string): Promise<T> {
  const res = await miFetch(path);
  if (res.status === 404) {
    // « Not Found » nu = route absente (backend pas à jour) ; un autre message = marché ou acteur inconnu
    const detail = await res.json().then((b) => b?.detail, () => null);
    if (detail && detail !== "Not Found") throw new NotFoundError();
    throw new Error("le module Market Intelligence n'est pas disponible sur ce backend (404) : mettez-le à jour et redémarrez-le");
  }
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}
