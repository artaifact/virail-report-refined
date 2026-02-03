/**
 * Configuration des secteurs d'activité et leurs thématiques associées
 * pour l'onboarding
 */

export interface Topic {
  id: string;
  label: string;
}

export interface Sector {
  id: string;
  label: string;
  icon: string;
  topics: Topic[];
}

export const SECTORS: Sector[] = [
  {
    id: 'saas',
    label: 'SaaS / Logiciel',
    icon: '💻',
    topics: [
      { id: 'features', label: 'Fonctionnalités produit' },
      { id: 'pricing', label: 'Tarifs et plans' },
      { id: 'integrations', label: 'Intégrations' },
      { id: 'security', label: 'Sécurité & Conformité' },
      { id: 'competitors', label: 'Comparaison concurrents' },
      { id: 'usecases', label: 'Cas d\'usage' },
      { id: 'support', label: 'Support client' },
      { id: 'api', label: 'API & Développeurs' },
    ],
  },
  {
    id: 'ecommerce',
    label: 'E-commerce / Retail',
    icon: '🛒',
    topics: [
      { id: 'products', label: 'Produits et catalogue' },
      { id: 'delivery', label: 'Livraison et retours' },
      { id: 'payment', label: 'Moyens de paiement' },
      { id: 'customer_service', label: 'Service client' },
      { id: 'reviews', label: 'Avis et témoignages' },
      { id: 'promotions', label: 'Promotions et offres' },
      { id: 'loyalty', label: 'Programme fidélité' },
      { id: 'competitors', label: 'Comparaison concurrents' },
    ],
  },
  {
    id: 'travel',
    label: 'Voyage / Tourisme',
    icon: '✈️',
    topics: [
      { id: 'destinations', label: 'Destinations' },
      { id: 'booking', label: 'Réservations' },
      { id: 'pricing', label: 'Tarifs et offres' },
      { id: 'reviews', label: 'Avis voyageurs' },
      { id: 'customer_service', label: 'Service client' },
      { id: 'competitors', label: 'Comparaison concurrents' },
      { id: 'experiences', label: 'Expériences et activités' },
      { id: 'transport', label: 'Transport et mobilité' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance / Banque / Assurance',
    icon: '🏦',
    topics: [
      { id: 'products', label: 'Produits financiers' },
      { id: 'pricing', label: 'Tarifs et frais' },
      { id: 'security', label: 'Sécurité et garanties' },
      { id: 'customer_service', label: 'Service client' },
      { id: 'mobile_app', label: 'Application mobile' },
      { id: 'competitors', label: 'Comparaison concurrents' },
      { id: 'regulations', label: 'Réglementation' },
      { id: 'reviews', label: 'Avis clients' },
    ],
  },
  {
    id: 'health',
    label: 'Santé / Médical',
    icon: '🏥',
    topics: [
      { id: 'services', label: 'Services et soins' },
      { id: 'professionals', label: 'Professionnels de santé' },
      { id: 'booking', label: 'Prise de rendez-vous' },
      { id: 'pricing', label: 'Tarifs et remboursements' },
      { id: 'reviews', label: 'Avis patients' },
      { id: 'locations', label: 'Localisations' },
      { id: 'specialties', label: 'Spécialités' },
      { id: 'emergency', label: 'Urgences' },
    ],
  },
  {
    id: 'realestate',
    label: 'Immobilier',
    icon: '🏠',
    topics: [
      { id: 'listings', label: 'Annonces et biens' },
      { id: 'pricing', label: 'Prix et estimations' },
      { id: 'locations', label: 'Localisations' },
      { id: 'services', label: 'Services (gestion, syndic)' },
      { id: 'financing', label: 'Financement et crédit' },
      { id: 'reviews', label: 'Avis clients' },
      { id: 'agents', label: 'Agents et agences' },
      { id: 'competitors', label: 'Comparaison concurrents' },
    ],
  },
  {
    id: 'education',
    label: 'Éducation / Formation',
    icon: '🎓',
    topics: [
      { id: 'courses', label: 'Formations et cours' },
      { id: 'pricing', label: 'Tarifs et financement' },
      { id: 'certifications', label: 'Certifications et diplômes' },
      { id: 'reviews', label: 'Avis étudiants' },
      { id: 'teachers', label: 'Formateurs et enseignants' },
      { id: 'methodology', label: 'Méthodologie pédagogique' },
      { id: 'results', label: 'Résultats et débouchés' },
      { id: 'competitors', label: 'Comparaison concurrents' },
    ],
  },
  {
    id: 'food',
    label: 'Restauration / Food',
    icon: '🍽️',
    topics: [
      { id: 'menu', label: 'Menu et carte' },
      { id: 'pricing', label: 'Prix' },
      { id: 'delivery', label: 'Livraison et click & collect' },
      { id: 'reviews', label: 'Avis clients' },
      { id: 'locations', label: 'Localisations' },
      { id: 'booking', label: 'Réservation' },
      { id: 'ambiance', label: 'Ambiance et concept' },
      { id: 'events', label: 'Événements et privatisation' },
    ],
  },
  {
    id: 'b2b_services',
    label: 'Services B2B',
    icon: '🤝',
    topics: [
      { id: 'services', label: 'Services proposés' },
      { id: 'expertise', label: 'Expertise et méthodologie' },
      { id: 'pricing', label: 'Tarifs et devis' },
      { id: 'references', label: 'Références clients' },
      { id: 'case_studies', label: 'Études de cas' },
      { id: 'team', label: 'Équipe et experts' },
      { id: 'competitors', label: 'Comparaison concurrents' },
      { id: 'certifications', label: 'Certifications et agréments' },
    ],
  },
  {
    id: 'other',
    label: 'Autre',
    icon: '📦',
    topics: [
      { id: 'products_services', label: 'Produits / Services' },
      { id: 'pricing', label: 'Tarifs' },
      { id: 'quality', label: 'Qualité et garanties' },
      { id: 'customer_service', label: 'Service client' },
      { id: 'reviews', label: 'Avis clients' },
      { id: 'competitors', label: 'Comparaison concurrents' },
      { id: 'locations', label: 'Localisations' },
      { id: 'about', label: 'À propos / Valeurs' },
    ],
  },
];

/**
 * Récupère un secteur par son ID
 */
export function getSectorById(sectorId: string): Sector | undefined {
  return SECTORS.find((s) => s.id === sectorId);
}

/**
 * Récupère les thématiques d'un secteur
 */
export function getTopicsBySector(sectorId: string): Topic[] {
  const sector = getSectorById(sectorId);
  return sector?.topics || SECTORS.find((s) => s.id === 'other')?.topics || [];
}
