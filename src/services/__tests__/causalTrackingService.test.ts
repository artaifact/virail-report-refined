import { computeCausalLift, detectProactiveAlerts } from '../causalTrackingService';

describe('causalTrackingService', () => {
  it('correctly computes causal lift and narrative', () => {
    const opt = {
      id: 'opt_1',
      domain: 'tally.so',
      deployedAt: '2026-08-01T00:00:00.000Z',
      category: 'schema' as const,
      title: 'Déploiement Schema Product & Organization',
      details: 'Enrichissement JSON-LD',
    };

    const before = {
      date: '2026-08-01T00:00:00.000Z',
      totalCitations: 50,
      shareOfVoicePct: 15.0,
      journeySuccessRatePct: 40.0,
      modelsCitingCount: 5,
    };

    const after = {
      date: '2026-09-01T00:00:00.000Z',
      totalCitations: 72,
      shareOfVoicePct: 21.5,
      journeySuccessRatePct: 65.0,
      modelsCitingCount: 8,
    };

    const analysis = computeCausalLift(opt, before, after);

    expect(analysis.causalVerdict).toBe('proven_positive');
    expect(analysis.deltas.citationsLift).toBe(22);
    expect(analysis.deltas.shareOfVoiceLiftPct).toBe(6.5);
    expect(analysis.narrativeExplanation).toContain('progression de +22 citations');
  });

  it('detects proactive alerts when citations drop sharply or new competitor appears', () => {
    const history = [
      { date: '2026-08-15', totalCitations: 100, shareOfVoicePct: 20, journeySuccessRatePct: 50, modelsCitingCount: 8 },
      { date: '2026-09-01', totalCitations: 60, shareOfVoicePct: 12, journeySuccessRatePct: 50, modelsCitingCount: 6 },
    ];

    const alerts = detectProactiveAlerts('tally.so', history, ['Typeform', 'Paperform'], ['Typeform']);

    expect(alerts.some(a => a.type === 'citation_drop')).toBe(true);
    expect(alerts.some(a => a.type === 'new_competitor' && a.title.includes('Paperform'))).toBe(true);
  });
});
