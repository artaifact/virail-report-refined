import { AgenticAuditProvider } from './AgenticAuditProvider';
import { AgenticAudit, AgentTask, JourneyResult, JourneyVerdict } from '../types';

/**
 * Adaptateur d'isolation pour Ora (ax@0.7.5).
 * Intègre la couche anti-corruption pour convertir les structures Ora
 * vers les contrats canoniques Viraill sans fuite de dépendance.
 */
export class OraAxProvider implements AgenticAuditProvider {
  name = 'ora';
  private axModule: any = null;

  private async getAxModule(): Promise<any> {
    if (this.axModule) return this.axModule;
    try {
      // Import dynamique de ax si disponible dans l'environnement d'exécution (ex: Node/BFF)
      // Utilisation d'une indirection pour éviter que le bundler Vite ne bloque
      const pkg = 'ax';
      this.axModule = await import(/* @vite-ignore */ pkg);
      return this.axModule;
    } catch {
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    const mod = await this.getAxModule();
    return mod != null && typeof mod.audit === 'function';
  }

  async audit(target: string): Promise<AgenticAudit> {
    const mod = await this.getAxModule();

    // 1. Si le module local est disponible (ex: environnement d'exécution backend ou CLI)
    if (mod && typeof mod.audit === 'function') {
      try {
        const rawOutcome = await mod.audit(target);
        const result = rawOutcome?.result || rawOutcome;
        const verdict = rawOutcome?.verdict || null;

        const score = typeof result.score === 'number' ? result.score : 50;
        const grade = result.grade || 'C';

        const fixes = Array.isArray(result.topFixes)
          ? result.topFixes.map((f: any, idx: number) => ({
              id: f.id || `ora_fix_${idx}`,
              title: f.title || f.name || String(f),
              description: f.description,
              impact: f.impact || 'medium',
              category: f.layer || 'Agentic',
            }))
          : [];

        return {
          provider: 'ora',
          score,
          grade,
          fixes,
          summary: verdict || (typeof result.summary === 'string' ? result.summary : null),
          cached: !!result.cached,
          freshnessSeconds: result.run_age_seconds ?? 0,
          contractVersion: result.contractVersion || 'ax@0.7.5',
          rawPayload: rawOutcome,
        };
      } catch (err) {
        console.warn('[OraAxProvider] Local ax.audit call failed:', err);
      }
    }

    // 2. Tenter l'appel via le proxy API backend Viraill (/api/v1/agentic/ora/audit)
    try {
      const response = await fetch('/api/v1/agentic/ora/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          provider: 'ora',
          score: data.score ?? 50,
          grade: data.grade ?? 'C',
          fixes: data.fixes ?? [],
          summary: data.summary ?? null,
          cached: !!data.cached,
          freshnessSeconds: data.freshnessSeconds ?? 0,
          contractVersion: data.contractVersion ?? 'ora-api-v1',
          rawPayload: data.rawPayload,
        };
      }
    } catch (apiErr) {
      // Ignorer l'erreur réseau et passer au retour sécurisé
    }

    throw new Error('Ora provider is currently unreachable or not configured');
  }

  async runJourney(task: AgentTask): Promise<JourneyResult> {
    const mod = await this.getAxModule();

    if (mod && typeof mod.deepJourney === 'function') {
      try {
        const agentsData = typeof mod.fetchJourneyAgents === 'function' ? await mod.fetchJourneyAgents() : null;
        const defaultAgent = agentsData?.agents?.find((c: any) => c.id === agentsData.defaultId) || agentsData?.agents?.[0];

        const outcome = await mod.deepJourney(task.targetUrl, {
          intentId: task.intentId,
          harness: task.harness || defaultAgent?.harness,
          model: task.model || defaultAgent?.model,
        });

        const detail = outcome?.detail || {};
        const verdictRaw: string = detail.verdict ?? detail.result?.verdict ?? 'not_gradable';
        const verdict: JourneyVerdict =
          verdictRaw === 'satisfied' || verdictRaw === 'partial' || verdictRaw === 'unsatisfied'
            ? verdictRaw
            : 'not_gradable';

        const insight = detail.result?.insight || {};
        const observations: string[] = Array.isArray(insight.key_observations)
          ? insight.key_observations
          : [];

        return {
          provider: 'ora',
          success: verdict === 'satisfied',
          verdict,
          stepsCount: typeof detail.step_count === 'number' ? detail.step_count : null,
          durationMs: detail.duration_ms,
          summary: insight.summary || null,
          observations,
          cached: !!outcome.cached,
          contractVersion: detail.contractVersion || 'ax@0.7.5',
          rawPayload: detail,
        };
      } catch (err) {
        console.warn('[OraAxProvider] Local ax.deepJourney failed:', err);
      }
    }

    // Fallback proxy API backend
    try {
      const response = await fetch('/api/v1/agentic/ora/journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          provider: 'ora',
          success: data.verdict === 'satisfied',
          verdict: data.verdict ?? 'not_gradable',
          stepsCount: data.stepsCount ?? null,
          summary: data.summary ?? null,
          observations: data.observations ?? [],
          cached: !!data.cached,
          contractVersion: data.contractVersion ?? 'ora-api-v1',
          rawPayload: data,
        };
      }
    } catch (_) {}

    throw new Error('Ora Journey execution failed or is unavailable');
  }
}
