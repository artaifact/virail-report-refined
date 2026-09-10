import { computeUnifiedScore, calculateGrade } from '../scoreEngine';

describe('scoreEngine (Unified 3-Tier Score)', () => {
  it('correctly calculates letter grades', () => {
    expect(calculateGrade(95)).toBe('A+');
    expect(calculateGrade(85)).toBe('A');
    expect(calculateGrade(70)).toBe('B');
    expect(calculateGrade(55)).toBe('C');
    expect(calculateGrade(40)).toBe('D');
    expect(calculateGrade(20)).toBe('F');
  });

  it('computes weighted score respecting the 40% / 30% / 30% split', () => {
    const result = computeUnifiedScore({
      targetDomain: 'tally.so',
      geoScore: 80, // L1 = 80 * 0.40 = 32
      schemaScore: 90,
      semanticHtmlScore: 90,
      entityCoverageScore: 90,
      contentClarityScore: 90, // L2 = 90 * 0.30 = 27
      agenticScore: 60,
      hasLlmsTxt: true,
      hasOpenApi: true,
      hasAgentCard: true,
      hasX402Payment: false,
    });

    expect(result.targetDomain).toBe('tally.so');
    expect(result.levels.found_and_cited.weight).toBe(0.40);
    expect(result.levels.understood_and_preferred.weight).toBe(0.30);
    expect(result.levels.actionable_and_transacting.weight).toBe(0.30);
    expect(result.overallScore).toBeGreaterThan(65);
    expect(result.methodVersion).toBe('2026.1');
    expect(result.provenance.provider).toBe('hybrid');
  });

  it('generates prioritized recommendations when essentials like llms.txt or schema are missing', () => {
    const result = computeUnifiedScore({
      targetDomain: 'example.com',
      geoScore: 40,
      schemaScore: 30,
      hasLlmsTxt: false,
      hasOpenApi: false,
    });

    expect(result.topFixes.some(f => f.id === 'fix_llms_txt')).toBe(true);
    expect(result.topFixes.some(f => f.id === 'fix_schema_org')).toBe(true);
  });
});
