/**
 * Contrats canoniques Viraill pour le moteur d'actionnabilité
 * Ces interfaces constituent la couche d'isolation (Anti-Corruption Layer)
 * et ne doivent dépendre d'aucune structure tierce (Ora, Googlebot, etc.).
 */

export type JourneyVerdict = 'satisfied' | 'partial' | 'unsatisfied' | 'not_gradable';

export interface AgentTask {
  intentId: 'discover' | 'compare' | 'pricing' | 'integrate' | 'action' | string;
  targetUrl: string;
  expectedGoal?: string;
  harness?: string;
  model?: string;
}

export interface JourneyStep {
  stepIndex: number;
  action: string;
  target?: string;
  reasoning?: string;
  toolCall?: {
    name: string;
    arguments?: Record<string, any>;
  };
  durationMs?: number;
  status: 'success' | 'failed' | 'in_progress';
}

export interface JourneyResult {
  provider: 'ora' | 'viraill' | 'browser-agent' | 'deterministic';
  success: boolean;
  verdict: JourneyVerdict;
  stepsCount: number | null;
  durationMs?: number;
  summary: string | null;
  observations: string[];
  trajectory?: JourneyStep[];
  cached: boolean;
  contractVersion: string;
  rawPayload?: unknown;
}

export interface AgenticAuditFix {
  id: string;
  title: string;
  description?: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  category?: string;
  codeSnippet?: string;
}

export interface AgenticAudit {
  provider: 'ora' | 'viraill' | 'deterministic';
  score: number;
  grade: string;
  fixes: AgenticAuditFix[];
  summary: string | null;
  cached: boolean;
  freshnessSeconds: number;
  contractVersion: string;
  pillars?: {
    discovery?: { score: number; max: number };
    access?: { score: number; max: number };
    usability?: { score: number; max: number };
    payments?: { score: number; max: number };
  };
  rawPayload?: unknown;
}
