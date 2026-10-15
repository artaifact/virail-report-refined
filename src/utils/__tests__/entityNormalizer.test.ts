import {
  normalizeDomain,
  extractBaseBrand,
  normalizeBrandName,
  deduplicateCompetitors,
} from '@/utils/entityNormalizer';

describe('entityNormalizer', () => {
  describe('normalizeDomain', () => {
    it('normalizes URLs with protocols, www, subpaths, and query params', () => {
      expect(normalizeDomain('https://www.jotform.com/pricing?ref=test')).toBe('jotform.com');
      expect(normalizeDomain('http://tally.so/#section')).toBe('tally.so');
      expect(normalizeDomain('WWW.GOOGLE.COM/')).toBe('google.com');
    });

    it('handles empty or null values', () => {
      expect(normalizeDomain('')).toBe('');
      expect(normalizeDomain(null as any)).toBe('');
      expect(normalizeDomain(undefined)).toBe('');
    });
  });

  describe('normalizeBrandName', () => {
    it('removes parenthesized domains like Jotform (Jotform.com)', () => {
      expect(normalizeBrandName('Jotform (Jotform.com)')).toBe('Jotform');
      expect(normalizeBrandName('Typeform (www.typeform.com)')).toBe('Typeform');
    });

    it('removes raw TLDs and corporate suffixes', () => {
      expect(normalizeBrandName('Typeform.com')).toBe('Typeform');
      expect(normalizeBrandName('Google Inc.')).toBe('Google');
      expect(normalizeBrandName('Stripe LLC')).toBe('Stripe');
    });

    it('capitalizes all uppercase or all lowercase names properly', () => {
      expect(normalizeBrandName('MISTRAL')).toBe('Mistral');
      expect(normalizeBrandName('anthropic')).toBe('Anthropic');
    });
  });

  describe('deduplicateCompetitors', () => {
    it('merges duplicate competitors like Jotform and Jotform (Jotform.com)', () => {
      const rawCompetitors = [
        {
          name: 'Jotform',
          primary_url: 'https://jotform.com',
          score: 85,
          source_models: ['ChatGPT'],
        },
        {
          name: 'Jotform (Jotform.com)',
          primary_url: 'https://www.jotform.com/pricing',
          score: 82,
          source_models: ['Claude'],
        },
        {
          name: 'Typeform',
          primary_url: 'https://typeform.com',
          score: 90,
          source_models: ['Perplexity'],
        },
      ];

      const deduplicated = deduplicateCompetitors(rawCompetitors, 'https://tally.so');

      expect(deduplicated).toHaveLength(2);
      const jotform = deduplicated.find(c => c.name === 'Jotform');
      expect(jotform).toBeDefined();
      expect(jotform?.score).toBe(85);
      expect(jotform?.source_models).toContain('ChatGPT');
      expect(jotform?.source_models).toContain('Claude');
    });

    it('excludes the client domain from competitor list', () => {
      const competitors = [
        { name: 'Tally', primary_url: 'https://tally.so', score: 95 },
        { name: 'Typeform', primary_url: 'https://typeform.com', score: 88 },
      ];

      const result = deduplicateCompetitors(competitors, 'https://tally.so');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Typeform');
    });
  });
});

describe('recette de production : concurrents de revolut.com', () => {
  const raw = [
    { name: 'Revolut (si le site est en cours de maintenance, mais concurrent indirect à lui-même)', score: 50 },
    { name: 'PayPal (pour les transferts internationaux)', url: 'https://www.paypal.com', score: 70 },
    { name: 'paypal', url: 'paypal.com', score: 60 },
    { name: 'https://www.wise.com', score: 65 },
    { name: 'TransferWise', url: 'https://transferwise.com', score: 40 },
    { name: 'Curve', url: 'https://www.curve.com', score: 30 },
    { name: 'Curve', url: 'https://curve.group', score: 20 },
  ];
  const result = deduplicateCompetitors(raw, 'https://www.revolut.com');
  const names = result.map((c) => c.name).sort();

  it('le site n’apparaît pas dans sa propre liste, même avec un commentaire du LLM', () => {
    expect(names.some((n) => /revolut/i.test(n || ''))).toBe(false);
  });
  it('commentaires, URL brutes et doublons de casse ou de domaine disparaissent', () => {
    expect(names).toEqual(['Curve', 'PayPal', 'Wise']);
  });
});
