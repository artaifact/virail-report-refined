import { AgenticAuditProvider } from './providers/AgenticAuditProvider';
import { OraAxProvider } from './providers/OraAxProvider';
import { ViraillGeoProvider } from './providers/ViraillGeoProvider';
import { DeterministicProvider } from './providers/DeterministicProvider';
import { AgenticAudit, AgentTask, JourneyResult } from './types';
import { computeUnifiedScore } from '@/utils/scoreEngine';
import { UnifiedActionabilityScore } from '@/types/scoring';

export class ActionabilityEngine {
  private providers: Map<string, AgenticAuditProvider> = new Map();
  private defaultProviderOrder: string[] = ['ora', 'viraill', 'deterministic'];

  constructor() {
    this.registerProvider(new OraAxProvider());
    this.registerProvider(new ViraillGeoProvider());
    this.registerProvider(new DeterministicProvider());
  }

  registerProvider(provider: AgenticAuditProvider): void {
    this.providers.set(provider.name, provider);
  }

  getProvider(name: string): AgenticAuditProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Exécute un audit d'actionnabilité avec basculement automatique en cascade
   */
  async runAudit(targetUrl: string, preferredProvider?: string): Promise<AgenticAudit> {
    const order = preferredProvider
      ? [preferredProvider, ...this.defaultProviderOrder.filter(p => p !== preferredProvider)]
      : this.defaultProviderOrder;

    let lastError: Error | null = null;

    for (const providerName of order) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;

      try {
        const available = await provider.isAvailable();
        if (!available && providerName !== 'deterministic') continue;

        const auditResult = await provider.audit(targetUrl);
        return auditResult;
      } catch (err: any) {
        lastError = err;
        console.warn(`[ActionabilityEngine] Provider ${providerName} failed, failing over...`, err?.message);
      }
    }

    // Si tous les providers ont échoué, exécuter le provider déterministe
    const fallback = this.providers.get('deterministic')!;
    return fallback.audit(targetUrl);
  }

  /**
   * Exécute un Agent Journey avec basculement automatique
   */
  async runJourney(task: AgentTask, preferredProvider?: string): Promise<JourneyResult> {
    const order = preferredProvider
      ? [preferredProvider, ...this.defaultProviderOrder.filter(p => p !== preferredProvider)]
      : this.defaultProviderOrder;

    for (const providerName of order) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;

      try {
        const available = await provider.isAvailable();
        if (!available && providerName !== 'deterministic') continue;

        return await provider.runJourney(task);
      } catch (err: any) {
        console.warn(`[ActionabilityEngine] Journey on provider ${providerName} failed:`, err?.message);
      }
    }

    const fallback = this.providers.get('deterministic')!;
    return fallback.runJourney(task);
  }

  /**
   * Combine les données GEO et d'agent-readiness pour produire le score unifié en 3 niveaux
   */
  async getUnifiedScore(params: {
    targetDomain: string;
    geoScore?: number | null;
    totalCitations?: number;
    modelsCount?: number;
    schemaScore?: number | null;
    semanticHtmlScore?: number | null;
    entityCoverageScore?: number | null;
    contentClarityScore?: number | null;
    hasLlmsTxt?: boolean;
    hasOpenApi?: boolean;
    hasAgentCard?: boolean;
    hasX402Payment?: boolean;
  }): Promise<UnifiedActionabilityScore> {
    // Exécute l'audit d'actionnabilité
    const agenticAudit = await this.runAudit(params.targetDomain);

    return computeUnifiedScore({
      ...params,
      agenticScore: agenticAudit.score,
      provider: agenticAudit.provider,
    });
  }
}

export const actionabilityEngine = new ActionabilityEngine();
