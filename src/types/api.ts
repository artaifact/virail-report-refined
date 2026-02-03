// ==================== User ====================
export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at?: string;
  plan_id?: number;
  stripe_customer_id?: string;
  onboarding_completed?: boolean;
  onboarding_data?: {
    steps_completed: string[];
    current_step: number;
    started_at?: string;
    time_spent_seconds: number;
    skipped_steps: string[];
  } | null;
}

// ==================== Sessions ====================
export interface Session {
  session_id: string;
  device_name: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  ip: string;
  user_agent: string;
  created_at: string;
  last_seen_at: string;
  revoked_at?: string;
  is_current?: boolean;
  location?: string;
}

// ==================== Errors ====================
export interface ApiError {
  detail: string | ValidationError[];
  error?: string;
  message?: string;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface RateLimitError {
  error: 'rate_limit_exceeded' | 'too_many_failed_attempts';
  message: string;
  retry_after: number;
}

export interface ApiErrorResponse {
  detail: string | { msg: string; loc: string[] }[];
  error?: string;
  message?: string;
  retry_after?: number;
}

// ==================== Analysis ====================
export interface AnalysisRequest {
  url: string;
  enable_optimization?: boolean;
  include_competitor_analysis?: boolean;
  citation_include_history?: boolean;
  citation_history_limit?: number;
  citation_webhook_url?: string;
  citation_alert_thresholds?: {
    probability_min?: number;
    negative_rate_max?: number;
  };
  citation_use_semantic?: boolean;
  citation_target_description?: string;
}

export interface AnalysisResponse {
  analysis_id: number;
  results: {
    llmo_results?: Record<string, unknown>;
    citation_results?: CitationReport;
    competitor_analysis?: Record<string, unknown>;
  };
  optimization_result?: Record<string, unknown>;
  timestamp: string;
}

// ==================== Citation ====================
export interface CitationReport {
  site_url: string;
  target_brand: string;
  total_queries: number;
  queries_with_citation: number;
  citation_probability: number;
  average_sentiment: number;
  average_rank: number;
  results: CitationResult[];
  query_type_distribution?: Record<string, number>;
  probability_by_query_type?: Record<string, number>;
  overall_multi_source_confidence?: number;
  cache_hit_rate?: number;
  historical_reports?: HistoricalReport[];
  trends?: TrendData;
  alerts?: string[];
}

export interface CitationResult {
  query: string;
  model: string;
  is_cited: boolean;
  sentiment: number;
  rank_among_competitors: number;
  fuzzy_match_score?: number;
  exact_match?: boolean;
  query_type?: string;
  query_intention?: string;
  mention_type?: string;
  prominence_score?: number;
  from_cache?: boolean;
  semantic_similarity?: number;
  semantic_detected?: boolean;
}

export interface HistoricalReport {
  report_id: number;
  created_at: string;
  citation_probability: number;
  queries_analyzed: number;
}

export interface TrendData {
  probability_trend: 'up' | 'down' | 'stable';
  probability_change: number;
  sentiment_trend: 'up' | 'down' | 'stable';
  sentiment_change: number;
}

// ==================== Plans & Subscriptions ====================
export interface Plan {
  id: number;
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: PlanLimits;
}

export interface PlanLimits {
  analyses_per_month: number;
  competitor_analyses: number;
  export_formats: string[];
  api_access: boolean;
}

export interface Subscription {
  id: number;
  user_id: number;
  plan_id: number;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  stripe_subscription_id?: string;
}
