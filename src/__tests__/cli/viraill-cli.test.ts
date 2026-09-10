import { runCli } from '../../../scripts/viraill-cli';

describe('Viraill CLI', () => {
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('prints usage and returns 1 when no URL is provided', async () => {
    const code = await runCli([]);
    expect(code).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Usage: viraill audit'));
  });

  it('runs audit and outputs JSON when --json flag is passed', async () => {
    const code = await runCli(['audit', 'https://tally.so', '--json']);
    expect(code).toBe(0);
    expect(logSpy).toHaveBeenCalled();
    const output = JSON.parse(logSpy.mock.calls[0][0]);
    expect(output.targetDomain).toBe('tally.so');
    expect(output.overallScore).toBeGreaterThan(0);
  });

  it('enforces min-score gate and returns 1 if score < minScore', async () => {
    const code = await runCli(['audit', 'https://tally.so', '--min-score', '99']);
    expect(code).toBe(1);
  });

  it('returns 0 when score >= minScore', async () => {
    const code = await runCli(['audit', 'https://tally.so', '--min-score', '40']);
    expect(code).toBe(0);
  });
});
