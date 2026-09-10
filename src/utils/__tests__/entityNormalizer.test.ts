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
