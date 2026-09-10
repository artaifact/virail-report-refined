import { ActionabilityEngine } from '../ActionabilityEngine';
import { DeterministicProvider } from '../providers/DeterministicProvider';

describe('ActionabilityEngine (Anti-Corruption Layer)', () => {
  let engine: ActionabilityEngine;

  beforeEach(() => {
    engine = new ActionabilityEngine();
  });

  it('initializes with default providers registered', () => {
    expect(engine.getProvider('ora')).toBeDefined();
    expect(engine.getProvider('viraill')).toBeDefined();
    expect(engine.getProvider('deterministic')).toBeDefined();
  });

  it('falls back to deterministic provider when network is absent', async () => {
    const audit = await engine.runAudit('https://tally.so', 'deterministic');

    expect(audit).toBeDefined();
    expect(audit.provider).toBe('deterministic');
    expect(audit.score).toBeGreaterThan(0);
    expect(audit.contractVersion).toBe('2026.1');
    expect(audit.fixes.length).toBeGreaterThan(0);
  });

  it('runs journeys and extracts observations cleanly', async () => {
    const journey = await engine.runJourney(
      {
        intentId: 'discover',
        targetUrl: 'https://tally.so',
      },
      'deterministic'
    );

    expect(journey).toBeDefined();
    expect(journey.verdict).toBe('satisfied');
    expect(journey.success).toBe(true);
    expect(journey.trajectory && journey.trajectory.length).toBeGreaterThan(0);
  });

  it('computes unified score with 3-tier model output', async () => {
    const unified = await engine.getUnifiedScore({
      targetDomain: 'tally.so',
      geoScore: 85,
      totalCitations: 71,
      modelsCount: 9,
      schemaScore: 80,
      hasLlmsTxt: true,
      hasOpenApi: true,
    });

    expect(unified.overallScore).toBeGreaterThan(0);
    expect(unified.levels.found_and_cited.score).toBe(85);
    expect(unified.levels.found_and_cited.weight).toBe(0.40);
    expect(unified.levels.understood_and_preferred.weight).toBe(0.30);
    expect(unified.levels.actionable_and_transacting.weight).toBe(0.30);
  });
});
