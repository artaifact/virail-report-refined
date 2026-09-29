// Vocabulaire affiché : tout terme technique a son équivalent en français courant.
// Les clés techniques (CREATE_DEAL, OBSERVED…) restent visibles en info-bulle et dans la vue détaillée.

export const VERB_FR: Record<string, string> = {
  SEARCH: "Rechercher",
  RECOMMEND: "Recommander",
  COMPARE: "Comparer",
  READ: "Consulter",
  LIST: "Lister",
  EXPORT: "Exporter",
  MONITOR: "Suivre",
  CREATE: "Créer",
  UPDATE: "Modifier",
  DELETE: "Supprimer",
  SUBMIT: "Soumettre",
  SEND: "Envoyer",
  CALL: "Appeler",
  CHECK_PRICE: "Vérifier un prix",
  CHECK_AVAILABILITY: "Vérifier une disponibilité",
  ADD_TO_CART: "Ajouter au panier",
  CHECKOUT: "Commander",
  PAY: "Payer",
  REFUND: "Rembourser",
  BOOK: "Réserver",
  MODIFY: "Modifier une réservation",
  CANCEL: "Annuler",
};

export const OBJECT_FR: Record<string, string> = {
  CONTACT: "Contacts",
  COMPANY: "Entreprises",
  DEAL: "Opportunités",
  PIPELINE: "Pipelines de vente",
  TASK: "Tâches",
  NOTE: "Notes",
  EMAIL: "Emails",
  MEETING: "Rendez-vous",
  QUOTE: "Devis",
  INVOICE: "Factures",
  PRODUCT: "Produits",
  TICKET: "Tickets",
  REPORT: "Rapports",
  SMS: "SMS",
  MESSAGE: "Conversations",
  RECORD: "Fiches (tous types)",
  USER: "Utilisateurs",
  CART: "Paniers",
  ORDER: "Commandes",
  CUSTOMER: "Clients",
  PAYMENT: "Paiements",
  REFUND: "Remboursements",
  SHIPMENT: "Livraisons",
  INVENTORY: "Stocks",
  DISCOUNT: "Promotions",
  RETURN: "Retours",
  REVIEW: "Avis",
  PRICE: "Prix",
  PROPERTY: "Hébergements",
  ROOM: "Chambres",
  FLIGHT: "Vols",
  AVAILABILITY: "Disponibilités",
  BOOKING: "Réservations",
  GUEST: "Voyageurs",
  BILL: "Factures fournisseurs",
  EXPENSE: "Dépenses",
  TRANSACTION: "Transactions",
  ACCOUNT: "Comptes",
  SUPPLIER: "Fournisseurs",
  TAX: "Taxes",
  DOCUMENT: "Documents",
  EVENT: "Événements",
  PROJECT: "Projets",
  BOARD: "Tableaux",
  // marchés de contrôle : e-commerce, compta, gestion de projet, paiement, création
  STORE: "Boutiques",
  CREDIT: "Avoirs",
  ITEM: "Articles",
  EMPLOYEE: "Salariés et paie",
  ISSUE: "Tickets",
  COMMENT: "Commentaires",
  DATABASE: "Bases de données",
  SPRINT: "Sprints",
  TEAM: "Équipes et espaces",
  PORTFOLIO: "Portefeuilles de projets",
  TIME: "Temps passé",
  FILE: "Fichiers",
  SUBSCRIPTION: "Abonnements",
  PAYOUT: "Virements sortants",
  DISPUTE: "Litiges",
  LINK: "Liens de paiement",
  MANDATE: "Mandats de prélèvement",
  BALANCE: "Solde",
  TERMINAL: "Terminaux de paiement",
  DESIGN: "Designs",
  VIDEO: "Vidéos",
  IMAGE: "Images",
  AUDIO: "Audio",
  ASSET: "Médias",
  CAPTION: "Sous-titres",
  BRAND: "Charte graphique",
  JOB: "Rendus en cours",
};

export const objectFr = (key: string) => OBJECT_FR[key] ?? key.charAt(0) + key.slice(1).toLowerCase();
export const verbFr = (key: string) => VERB_FR[key] ?? key;

/** « CREATE_DEAL » → « Créer · Opportunités » */
export function capabilityFr(key: string) {
  if (key === "UNMAPPED") return "Non classé";
  const i = key.lastIndexOf("_");
  return `${verbFr(key.slice(0, i))} · ${objectFr(key.slice(i + 1))}`;
}

export const CHANNEL_INFO: Record<string, { name: string; short: string; help: string; agent: boolean }> = {
  MCP: {
    name: "Serveur MCP",
    short: "MCP",
    help: "Point d'accès standard qui permet à n'importe quel agent IA de lire et d'agir dans l'outil.",
    agent: true,
  },
  CONNECTOR_CLAUDE: {
    name: "Connecteur Claude",
    short: "Claude",
    help: "L'outil s'installe en un clic dans Claude, qui peut alors agir dedans.",
    agent: true,
  },
  APP_CHATGPT: {
    name: "App ChatGPT",
    short: "ChatGPT",
    help: "L'outil est disponible comme app dans ChatGPT.",
    agent: true,
  },
  AUTOMATION: {
    name: "Zapier",
    short: "Zapier",
    help: "Accès indirect par des automatisations Zapier. Utile, mais moins direct qu'un canal agent.",
    agent: true,
  },
  AGENT_CARD: {
    name: "Carte d'agent",
    short: "Carte",
    help: "Fiche technique standard (A2A) qui présente l'outil à d'autres agents.",
    agent: true,
  },
  COMMERCE_PROTOCOL: { name: "Commerce agentique", short: "Commerce", help: "Paiement ou commande par un agent.", agent: true },
  API: {
    name: "API",
    short: "API",
    help: "Accès pour développeurs : un agent ne peut l'utiliser que si quelqu'un a écrit une intégration.",
    agent: false,
  },
  SDK: { name: "Kit développeur", short: "SDK", help: "Bibliothèque de code pour les développeurs.", agent: false },
  LLMS_TXT: { name: "Fichier llms.txt", short: "llms.txt", help: "Fichier qui guide les IA sur le site de l'éditeur.", agent: false },
  OPENAPI: { name: "API documentée", short: "OpenAPI", help: "Documentation d'API publique, lisible par les machines.", agent: false },
};
export const channelName = (t: string) => CHANNEL_INFO[t]?.name ?? t;

export const LEVEL_INFO: Record<string, { name: string; help: string }> = {
  OBSERVED: { name: "Vérifié", help: "Constaté directement : annuaire officiel, liste d'outils du serveur, spec d'API." },
  DECLARED: { name: "Annoncé", help: "Affirmé par l'éditeur dans sa documentation, pas encore vérifié directement." },
  ESTIMATED: { name: "Estimé", help: "Déduit ou estimé, à confirmer." },
};
export const levelName = (l: string) => LEVEL_INFO[l]?.name ?? l;

export const READINESS_FR: Record<string, string> = { High: "Avancé", Medium: "Intermédiaire", Low: "En retard" };

export const COMPONENT_INFO: Record<string, { name: string; help: string }> = {
  distribution: { name: "Présence", help: "Est-il accessible aux agents par des canaux officiels (serveur MCP, Claude, ChatGPT…) ?" },
  coverage: { name: "Étendue", help: "Part des actions possibles dans ce marché qu'un agent peut faire chez lui." },
  depth: { name: "Actions concrètes", help: "Part des actions qui modifient des données (créer, modifier…) et pas seulement de lecture." },
  structured: { name: "Lisibilité", help: "Est-il facile à comprendre pour une IA (llms.txt, API documentée, carte d'agent) ?" },
  transaction: { name: "Paiement", help: "Un agent peut-il commander ou payer ?" },
  freshness: { name: "Nouveautés", help: "A-t-il lancé ou mis à jour un canal agent ces 90 derniers jours ?" },
};

export const PROVIDER_FR: Record<string, string> = { chatgpt: "ChatGPT", gemini: "Gemini", claude: "Claude", perplexity: "Perplexity" };
