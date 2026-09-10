/**
 * Validateur et assainisseur contextuel de robots.txt.
 * Empêche l'application aveugle de directives e-commerce (/cart, /checkout)
 * sur des sites SaaS ou éditoriaux (ex: Tally.so).
 */

const ECOMMERCE_KEYWORDS = [
  '/cart',
  '/checkout',
  '/products/',
  '/collections/',
  '/orders/',
  '/basket',
  '/panier',
  '/commande',
  '/mon-compte',
  '/my-account',
];

const ECOMMERCE_PLATFORMS = new Set([
  'shopify',
  'prestashop',
  'magento',
  'woocommerce',
  'bigcommerce',
]);

/**
 * Détermine si la plateforme ou le site est de nature e-commerce
 */
export function isEcommerceSite(platform?: string, siteUrl?: string): boolean {
  if (platform && ECOMMERCE_PLATFORMS.has(platform.toLowerCase())) {
    return true;
  }
  if (siteUrl) {
    const urlLower = siteUrl.toLowerCase();
    if (urlLower.includes('shop') || urlLower.includes('store') || urlLower.includes('boutique')) {
      return true;
    }
  }
  return false;
}

export interface RobotsSanitizationResult {
  sanitizedContent: string;
  removedRules: string[];
  isCustomizedForSite: boolean;
  warnings: string[];
}

/**
 * Nettoie et valide un fichier robots.txt pour s'assurer de sa pertinence contextuelle
 */
export function sanitizeRobotsTxt(
  rawContent: string,
  platform?: string,
  siteUrl?: string
): RobotsSanitizationResult {
  if (!rawContent) {
    return {
      sanitizedContent: '',
      removedRules: [],
      isCustomizedForSite: false,
      warnings: [],
    };
  }

  const isEcommerce = isEcommerceSite(platform, siteUrl);
  const removedRules: string[] = [];
  const warnings: string[] = [];

  const lines = rawContent.split('\n');
  const keptLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Si le site n'est PAS un e-commerce, éliminer les règles d'exclusion e-commerce génériques
    if (!isEcommerce) {
      const matchedEcommerce = ECOMMERCE_KEYWORDS.find(keyword =>
        trimmed.toLowerCase().includes(`disallow: ${keyword}`) ||
        trimmed.toLowerCase().includes(`disallow: /${keyword.replace(/^\//, '')}`)
      );

      if (matchedEcommerce) {
        removedRules.push(trimmed);
        continue; // Ne pas inclure cette ligne superflue
      }
    }

    keptLines.push(line);
  }

  if (removedRules.length > 0) {
    warnings.push(
      `${removedRules.length} règle(s) e-commerce générique(s) écartée(s) car le site est identifié comme ${platform || 'SaaS / Contenu'}.`
    );
  }

  // Nettoyer les sauts de lignes multiples successifs
  const sanitizedContent = keptLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();

  return {
    sanitizedContent,
    removedRules,
    isCustomizedForSite: removedRules.length > 0 || isEcommerce,
    warnings,
  };
}
