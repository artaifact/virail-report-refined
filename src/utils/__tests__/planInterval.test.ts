import { intervalLabel } from '../planInterval';

describe('intervalLabel', () => {
  it('« mois » stocké en base reste mensuel (avant : « 2 990 €/an » dans Paramètres)', () => {
    expect(intervalLabel('mois')).toBe('mois');
    expect(intervalLabel('month')).toBe('mois');
    expect(intervalLabel(undefined)).toBe('mois');
  });
  it('annuel', () => {
    expect(intervalLabel('year')).toBe('an');
    expect(intervalLabel('an')).toBe('an');
  });
});
