/**
 * Utilitaire de normalisation canonique d'entités, domaines et marques.
 * Permet d'éliminer les doublons concurrents (ex: "Jotform" vs "Jotform (Jotform.com)")
 * et de garantir l'étanchéité et la cohérence des classements.
 */

/**
 * Nettoie et normalise une URL ou un domaine pour obtenir un domaine canonique
 * ex: "https://www.jotform.com/pricing?ref=1" -> "jotform.com"
 * ex: "blog.amundi.fr" -> "amundi.fr"
 */
export function normalizeDomain(rawUrlOrDomain: string | null | undefined): string {
  if (!rawUrlOrDomain) return '';

  let cleaned = rawUrlOrDomain.trim().toLowerCase();

  // Supprimer protocole
  cleaned = cleaned.replace(/^https?:\/\//i, '');

  // Supprimer chemin, port, query params
  cleaned = cleaned.split('/')[0].split('?')[0].split('#')[0].split(':')[0];

  // Supprimer www.
  cleaned = cleaned.replace(/^www\./i, '');

  return cleaned.trim();
}

/**
 * Extrait le nom de base d'un domaine sans TLD
 * ex: "jotform.com" -> "jotform"
 * ex: "amundi.co.uk" -> "amundi"
 */
export function extractBaseBrand(domain: string): string {
  const norm = normalizeDomain(domain);
  if (!norm) return '';

  // Supprimer les suffixes de second niveau courants
  const withoutMultiTld = norm.replace(/\.(co\.uk|com\.fr|org\.uk|gouv\.fr)$/i, '');
  const parts = withoutMultiTld.split('.');

  // Prendre la partie principale avant le TLD
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  return parts[0];
}

/**
 * Normalise un nom de marque pour l'affichage
 * ex: "Jotform (Jotform.com)" -> "Jotform"
 * ex: "typeform.com" -> "Typeform"
 * ex: "GOOGLE INC." -> "Google"
 */
export function normalizeBrandName(rawName: string | null | undefined, domainHint?: string): string {
  if (!rawName && !domainHint) return '';

  let name = (rawName || '').trim();

  if (!name && domainHint) {
    const base = extractBaseBrand(domainHint);
    return base ? base.charAt(0).toUpperCase() + base.slice(1) : domainHint;
  }

  // 1. Supprimer les parenthèses contenant un domaine ou une URL : "Jotform (Jotform.com)" -> "Jotform"
  name = name.replace(/\s*\([^)]*\.[a-z]{2,}[^)]*\)/gi, '');

  // 2. Supprimer les extensions de domaine directes dans le nom : "Typeform.com" -> "Typeform"
  name = name.replace(/\.(com|org|net|io|fr|ai|co|app|so|dev|eu|de|uk)$/i, '');

  // 3. Supprimer les désignations légales superflues
  name = name.replace(/\s+(inc|llc|ltd|sas|sarl|corp|corporation)\.?$/i, '');

  // 4. Nettoyer les espaces multiples
  name = name.replace(/\s+/g, ' ').trim();

  // 5. Casing intelligent si tout en majuscules ou tout en minuscules
  if (name.length > 2 && (name === name.toUpperCase() || name === name.toLowerCase())) {
    name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }

  return name || (domainHint ? extractBaseBrand(domainHint) : '');
}

export interface CompetitorLike {
  name?: string;
  domain?: string;
  url?: string;
  primary_url?: string;
  score?: number;
  average_score?: number;
  similarity_score?: number;
  gap_vs_you?: number;
  global_rank?: number;
  source_models?: string[];
  sourceModels?: string[];
  faviconUrl?: string;
  favicon_url?: string;
  [key: string]: any;
}

/**
 * Déduplique et consolide une liste de concurrents selon leur domaine canonique et leur nom de marque
 */
export function deduplicateCompetitors<T extends CompetitorLike>(
  competitors: T[],
  clientDomainOrUrl?: string
): T[] {
  if (!Array.isArray(competitors) || competitors.length === 0) {
    return [];
  }

  const clientNormalizedDomain = normalizeDomain(clientDomainOrUrl);
  const clientBase = clientNormalizedDomain ? extractBaseBrand(clientNormalizedDomain) : '';

  const groups = new Map<string, T[]>();

  for (const comp of competitors) {
    const rawUrl = comp.primary_url || comp.url || comp.domain || '';
    const normDomain = normalizeDomain(rawUrl);
    const brandName = normalizeBrandName(comp.name, normDomain);
    const baseBrand = normDomain ? extractBaseBrand(normDomain) : brandName.toLowerCase();

    // Exclure si c'est le domaine du client lui-même
    if (clientNormalizedDomain) {
      if (normDomain && (normDomain === clientNormalizedDomain || normDomain.includes(clientNormalizedDomain))) {
        continue;
      }
      if (clientBase && baseBrand && baseBrand === clientBase) {
        continue;
      }
    }

    // Clé de regroupement : priorité au domaine canonique, sinon nom de marque normalisé
    const groupKey = normDomain || baseBrand || brandName.toLowerCase();
    if (!groupKey) continue;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(comp);
  }

  const result: T[] = [];

  for (const [, items] of groups.entries()) {
    if (items.length === 1) {
      const item = { ...items[0] };
      item.name = normalizeBrandName(item.name, item.domain || item.primary_url || item.url);
      result.push(item);
      continue;
    }

    // Fusionner les doublons (ex: "Jotform" et "Jotform (Jotform.com)")
    // Choisir le nom le plus propre
    let bestName = items[0].name || '';
    for (const it of items) {
      const cleaned = normalizeBrandName(it.name, it.domain || it.primary_url || it.url);
      if (cleaned && (!bestName || cleaned.length <= bestName.length)) {
        bestName = cleaned;
      }
    }

    // Fusionner les modèles sources
    const mergedModelsSet = new Set<string>();
    items.forEach(it => {
      (it.source_models || it.sourceModels || []).forEach(m => mergedModelsSet.add(m));
    });
    const mergedModels = Array.from(mergedModelsSet);

    // Calculer le meilleur score ou score moyen
    const maxScore = Math.max(
      ...items.map(it => it.score ?? (it.average_score != null ? Math.round(it.average_score * 100) : 0))
    );
    const maxAvgScore = Math.max(
      ...items.map(it => it.average_score ?? (it.score != null ? it.score / 100 : 0))
    );

    const primaryItem = items[0];
    const consolidated: T = {
      ...primaryItem,
      name: bestName || normalizeBrandName(primaryItem.name),
      score: maxScore,
      average_score: maxAvgScore,
      source_models: mergedModels.length > 0 ? mergedModels : primaryItem.source_models,
      sourceModels: mergedModels.length > 0 ? mergedModels : primaryItem.sourceModels,
    };

    result.push(consolidated);
  }

  return result;
}
