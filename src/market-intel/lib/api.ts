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
  companies: { id: string; name: string; role: string; followed?: boolean; domain?: string | null; readiness: Readiness; visibility: Visibility; trend?: Trend; buzz?: Buzz; data?: DataState }[];
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

/** Fiabilité d'une note : relevé incomplet (provisoire), données contradictoires (en vérification). */
export interface DataState {
  complete: boolean | null;
  under_review: string[];
}

export interface CompanyProfile {
  data?: DataState;
  attention: Attention | null;
  marketing: Marketing | null;
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

const apiCache = new Map<string, { data: unknown; ts: number }>();
const inFlightRequests = new Map<string, Promise<unknown>>();
const API_CACHE_TTL = 90_000; // 90 secondes de cache en mémoire

export function clearApiCache(): void {
  apiCache.clear();
  inFlightRequests.clear();
}

export async function api<T>(path: string, options?: { forceRefresh?: boolean }): Promise<T> {
  const now = Date.now();
  if (!options?.forceRefresh) {
    const cached = apiCache.get(path);
    if (cached && now - cached.ts < API_CACHE_TTL) {
      return cached.data as T;
    }
    const inFlight = inFlightRequests.get(path);
    if (inFlight) {
      return inFlight as Promise<T>;
    }
  }

  const promise = (async () => {
    try {
      const res = await miFetch(path);
      if (res.status === 404) throw new NotFoundError();
      if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
      const data = (await res.json()) as T;
      apiCache.set(path, { data, ts: Date.now() });
      return data;
    } finally {
      inFlightRequests.delete(path);
    }
  })();

  inFlightRequests.set(path, promise);
  return promise;
}

export const apiCached = api;


/** Catalogues d'agents : plugins ChatGPT et connecteurs Claude, même hors des marchés suivis. */
export interface CatalogStore {
  store: string;
  total: number;
  with_mcp_url: number;
  last_seen: string | null;
  categories: { name: string; count: number }[];
}

export interface CatalogEvent {
  type: "CATALOG_ADDED" | "CATALOG_REMOVED";
  at: string;
  store: string;
  name: string;
  category: string | null;
}

export interface CatalogOverview {
  stores: CatalogStore[];
  recent: CatalogEvent[];
}

export interface CatalogEntryRow {
  id: number;
  store: string;
  name: string;
  tagline: string | null;
  developer: string | null;
  category: string | null;
  url: string | null;
  website: string | null;
  mcp_url: string | null;
  capabilities: string[];
  tools: number;
  skills: number;
  company_id: string | null;
  added: string | null;
  first_seen: string;
}

export interface CatalogCoverageRow {
  market_id: string;
  market: string;
  measured: boolean;
  tracked: number;
  tracked_in_catalogs: number;
  tracked_by_store: Record<string, number>;
  neighbors: number;
  neighbors_by_store: Record<string, number>;
  sample: { store: string; name: string; developer: string | null }[];
  /** apps qui servent le marché dans les stores d'agents (acteurs suivis compris), et le niveau qui en découle */
  apps?: number;
  apps_by_store?: Record<string, number>;
  place?: { key: "libre" | "disputee" | "saturee"; label: string };
  place_cuts?: [number, number];
  method?: "ia" | "mots-clés";
  leaders_absent?: { id: string; name: string; domain: string | null; score: number }[];
  leaders_present?: { id: string; name: string; domain: string | null; score: number }[];
}



/** Plugins et connecteurs d'un marché : ceux des acteurs suivis, puis leurs voisins dans les annuaires. */
export interface MarketCatalogEntry {
  id: number;
  kind: "tracked" | "neighbor";
  store: string;
  name: string;
  tagline: string | null;
  developer: string | null;
  category: string | null;
  url: string | null;
  tools: number;
  mcp_url: string | null;
  company_id: string | null;
  company: string | null;
  added: string | null;
}

export interface MarketCatalog {
  total: number;
  tracked: number;
  by_store: Record<string, number>;
  entries: MarketCatalogEntry[];
}

/** Un relevé publicitaire d'une régie, avec son historique (un point par relevé). */
export interface AdsReading {
  day: string;
  count: number;
  approx: boolean;
  advertisers: string[];
  own_advertiser: boolean;
  landing_match?: number | null;
  history: { day: string; count: number }[];
}

/** Effort publicitaire d'un acteur : annonces qui pointent vers son domaine (Google Ads Transparency) ou qui le
 *  mentionnent (bibliothèque publicitaire Meta). Une régie sans relevé est absente. */
export interface Marketing {
  google_ads?: AdsReading;
  meta_ads?: AdsReading;
  sources: { google_ads?: string; meta_ads?: string };
}

/** Qualité des données d'un marché : le maillon le plus faible décide du verdict. */
export interface QualityCard {
  market: string;
  name: string;
  tracked: number;
  completeness: number | null;
  actions_known: number | null;
  golden: number | null;
  golden_facts: number;
  golden_wrong: { company: string; kind: string; expected: boolean; observed: boolean; source: string; note: string }[];
  incomplete: string[];
  without_actions: string[];
  weakest: number | null;
  verdict: "fiable" | "à consolider" | "non vérifié" | "fragile" | "non mesuré";
  target: number;
  /** évolution du maillon le plus faible sur 7 jours (null tant qu'il n'y a pas une semaine de mesures) */
  trend?: number | null;
}
