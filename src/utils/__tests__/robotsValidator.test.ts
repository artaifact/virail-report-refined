import { sanitizeRobotsTxt, isEcommerceSite } from '../robotsValidator';

describe('robotsValidator', () => {
  it('detects e-commerce sites based on platform', () => {
    expect(isEcommerceSite('shopify')).toBe(true);
    expect(isEcommerceSite('magento')).toBe(true);
    expect(isEcommerceSite('wordpress')).toBe(false);
    expect(isEcommerceSite('generic')).toBe(false);
  });

  it('strips generic e-commerce disallow rules for SaaS / non-e-commerce sites like Tally', () => {
    const rawRobots = `
User-agent: *
Disallow: /admin/
Disallow: /cart
Disallow: /checkout
Disallow: /orders/

User-agent: GPTBot
Allow: /
`.trim();

    const result = sanitizeRobotsTxt(rawRobots, 'generic', 'https://tally.so');

    expect(result.removedRules).toEqual([
      'Disallow: /cart',
      'Disallow: /checkout',
      'Disallow: /orders/',
    ]);
    expect(result.sanitizedContent).toContain('Disallow: /admin/');
    expect(result.sanitizedContent).toContain('User-agent: GPTBot');
    expect(result.sanitizedContent).not.toContain('/cart');
    expect(result.sanitizedContent).not.toContain('/checkout');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('preserves e-commerce rules for genuine e-commerce platforms like Shopify', () => {
    const rawRobots = `
User-agent: *
Disallow: /cart
Disallow: /checkout
Allow: /
`.trim();

    const result = sanitizeRobotsTxt(rawRobots, 'shopify', 'https://my-store.com');

    expect(result.removedRules).toHaveLength(0);
    expect(result.sanitizedContent).toContain('Disallow: /cart');
    expect(result.sanitizedContent).toContain('Disallow: /checkout');
  });
});
