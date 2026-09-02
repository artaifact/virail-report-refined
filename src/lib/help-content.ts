/**
 * Centralisation des textes d'aide affichés dans les InfoTooltip
 * Modifier ici pour mettre à jour toutes les explications du produit
 */

export const HELP = {

  // ─── Rapport LLMO global ─────────────────────────────────────────────────

  scoreGlobal: {
    title: `Score Global`,
    description: `Moyenne du score sémantique et du score de recommandation calculés sur l'ensemble des LLMs analysés. Un score élevé signifie que votre contenu est bien compris et souvent recommandé par les IA.`,
  },

  scoreRecommandation: {
    title: `Score de Recommandation`,
    description: `Probabilité (0–100) que le LLM inclue votre site dans une réponse à une requête pertinente. Il est calculé en demandant à chaque modèle d'évaluer explicitement la qualité et la pertinence de votre contenu pour un utilisateur type.`,
  },

  scoreSemantique: {
    title: `Score Sémantique`,
    description: `Moyenne des 6 dimensions sémantiques (cohérence, densité, complexité, clarté, embeddings, tokenisation). Il mesure dans quelle mesure votre contenu est structuré et lisible pour un modèle de langage.`,
  },

  llmsAnalyses: {
    title: `LLMs Analysés`,
    description: `Nombre de modèles de langage distincts ayant évalué votre site lors de cette analyse. Plus ce nombre est élevé, plus les résultats sont représentatifs de l'ensemble de l'écosystème IA.`,
  },

  // ─── Analyse Sémantique ──────────────────────────────────────────────────

  semantique: {
    title: `Analyse Sémantique`,
    description: `Évalue la qualité structurelle et linguistique de votre contenu selon 6 dimensions mesurables par les LLMs. Un contenu bien scoré est mieux compris, mieux mémorisé et plus souvent cité par les IA.`,
  },

  coherence: {
    title: `Cohérence`,
    description: `Mesure la continuité logique entre les phrases et paragraphes. Un texte cohérent suit un fil conducteur clair, ce qui permet au LLM de comprendre et de résumer votre contenu avec précision.`,
  },

  densite: {
    title: `Densité Informationnelle`,
    description: `Ratio entre la quantité d'informations utiles et la longueur totale du texte. Un texte trop dense est difficile à traiter ; trop dilué, il est perçu comme peu informatif par les IA.`,
  },

  complexite: {
    title: `Complexité Syntaxique`,
    description: `Évalue la structure grammaticale de vos phrases (longueur, subordination, ponctuation). Une complexité élevée peut nuire à la compréhension par les LLMs qui préfèrent des structures simples et directes.`,
  },

  clarte: {
    title: `Clarté Conceptuelle`,
    description: `Mesure dans quelle mesure les concepts clés sont définis et expliqués explicitement. Un contenu clair facilite l'extraction d'informations par les IA et augmente la précision des réponses générées.`,
  },

  embeddings: {
    title: `Score Embeddings`,
    description: `Indique à quel point votre contenu est représenté de façon distincte dans l'espace vectoriel des LLMs. Un score élevé signifie que votre contenu est unique et facilement identifiable parmi des millions de documents.`,
  },

  tokenisation: {
    title: `Facilité de Tokenisation`,
    description: `Évalue si le vocabulaire et la ponctuation de votre texte sont bien traités par les tokeniseurs des LLMs. Un score faible peut indiquer l'utilisation de caractères spéciaux, abréviations ou termes rares qui fragmentent le traitement.`,
  },

  // ─── Probabilité de Recommandation ──────────────────────────────────────

  probabiliteRecommandation: {
    title: `Probabilité de Recommandation`,
    description: `Score (0–100) reflétant la probabilité que ce LLM recommande votre site en réponse à une question d'un utilisateur. Chaque modèle est interrogé sur des requêtes représentatives de votre secteur.`,
  },

  elementsQCitables: {
    title: `Éléments Citables`,
    description: `Passages ou arguments de votre contenu que le LLM identifie comme suffisamment précis et sourcés pour être réutilisés dans une réponse. Plus vous en avez, plus votre site est cité directement par les IA.`,
  },

  visibiliteLLM: {
    title: `Visibilité LLM`,
    description: `Évaluation qualitative de la présence de votre marque dans la base de connaissances du modèle. Un site peu connu des LLMs sera moins spontanément recommandé, même si son contenu est de qualité.`,
  },

  // ─── Perception de la Marque ─────────────────────────────────────────────

  perception: {
    title: `Perception de la Marque`,
    description: `Analyse de la façon dont chaque LLM perçoit et décrit votre marque à partir de votre contenu. Révèle le positionnement que les IA transmettent à leurs utilisateurs quand ils posent des questions sur votre domaine.`,
  },

  tonGeneral: {
    title: `Ton Général`,
    description: `Tonalité dominante perçue par le LLM dans votre contenu (professionnel, technique, commercial, informatif, etc.). Le ton influence la confiance accordée par les IA à votre contenu comme source fiable.`,
  },

  styleEcriture: {
    title: `Style d'Écriture`,
    description: `Caractérisation du registre stylistique de votre contenu (expert, vulgarisé, narratif, etc.). Les LLMs associent certains styles à certains types de sources : un style académique augmente la crédibilité perçue.`,
  },

  biaisDetectes: {
    title: `Biais Détectés`,
    description: `Éléments de langage identifiés comme potentiellement orientés (commercial, idéologique, émotionnel). Les LLMs filtrent les sources perçues comme trop biaisées dans leurs recommandations.`,
  },

  lisibilite: {
    title: `Lisibilité`,
    description: `Évaluation de la fluidité de lecture et de la compréhension globale du contenu par le LLM. Un contenu lisible est plus facilement cité et paraphrasé avec précision dans les réponses IA.`,
  },

  // ─── Audience ────────────────────────────────────────────────────────────

  audience: {
    title: `Audience Cible & Segments`,
    description: `Identification par le LLM des profils d'utilisateurs auxquels votre contenu s'adresse implicitement. Ces segments influencent les types de requêtes pour lesquelles votre site sera recommandé.`,
  },

  indicesExplicites: {
    title: `Indices Explicites`,
    description: `Éléments textuels concrets (vocabulaire, exemples, niveaux de détail) qui révèlent directement l'audience visée. Ces indices permettent aux LLMs de cibler leurs recommandations vers les bons utilisateurs.`,
  },

  signauxDistinctifs: {
    title: `Signaux Distinctifs`,
    description: `Caractéristiques uniques de votre audience identifiées par le LLM — niveau d'expertise, contexte professionnel, problèmes spécifiques. Plus ces signaux sont forts, plus les recommandations IA seront précises.`,
  },

  // ─── Compétitif ──────────────────────────────────────────────────────────

  credibiliteAutorite: {
    title: `Crédibilité & Autorité`,
    description: `Évalue la fiabilité perçue de votre contenu : présence d'auteurs identifiés, sources citées, date de mise à jour, expertise démontrée. Les LLMs donnent plus de poids aux sources perçues comme faisant autorité.`,
  },

  structureListabilite: {
    title: `Structure & Lisibilité`,
    description: `Analyse la hiérarchie de l'information (titres, listes, paragraphes courts) et la fluidité de lecture. Un contenu bien structuré est plus facilement indexé et extrait par les modèles IA.`,
  },

  pertinenceContextuelle: {
    title: `Pertinence Contextuelle`,
    description: `Mesure l'adéquation entre votre contenu et les intentions de recherche typiques de votre secteur. Un score élevé signifie que vos pages répondent directement aux questions que posent les utilisateurs aux LLMs.`,
  },

  compatibiliteTechnique: {
    title: `Compatibilité Technique`,
    description: `Évalue les aspects techniques qui facilitent l'indexation par les LLMs : balisage sémantique HTML, données structurées (JSON-LD), vitesse de chargement, accessibilité mobile. Un site techniquement optimisé est mieux traité.`,
  },

  // ─── Dashboard principal ──────────────────────────────────────────────────

  citationsParModele: {
    title: `Citations par modèle`,
    description: `Nombre de fois que votre site a été cité dans les réponses de chaque LLM lors de l'analyse. Un modèle avec 0 citation n'a pas mentionné votre site sur les requêtes testées.`,
  },

  scoreGEO: {
    title: `Score GEO par catégorie`,
    description: `Décomposition de votre score d'optimisation pour les IA (GEO) en catégories techniques et sémantiques. Chaque catégorie représente un levier d'amélioration de votre visibilité dans les réponses des LLMs.`,
  },

  // ─── Dashboard LLMO ───────────────────────────────────────────────────────

  checklistExecutable: {
    title: `Checklist Exécutable`,
    description: `Liste d'actions concrètes et priorisées pour améliorer votre score LLMO. Chaque tâche coche un critère évalué par les LLMs — les compléter fait progresser votre visibilité dans les réponses IA.`,
  },

  schemaOrg: {
    title: `Schema.org`,
    description: `Données structurées balisées selon le vocabulaire Schema.org (JSON-LD). Ces marqueurs permettent aux LLMs d'identifier précisément le type de contenu (article, produit, organisation) et d'augmenter sa pertinence dans les réponses.`,
  },

  htmlSemantique: {
    title: `HTML Sémantique`,
    description: `Utilisation correcte des balises HTML5 sémantiques (<article>, <section>, <nav>, <main>...). Un HTML sémantique aide les LLMs à comprendre la structure et la hiérarchie de l'information dans votre page.`,
  },

  metadonnees: {
    title: `Métadonnées`,
    description: `Balises <title>, <meta description>, Open Graph et Twitter Card. Les LLMs utilisent ces métadonnées pour qualifier votre contenu avant même de l'analyser en profondeur — leur qualité influence directement votre score.`,
  },

  contenu: {
    title: `Contenu`,
    description: `Qualité globale du texte analysé par les LLMs : richesse sémantique, couverture des sujets clés, absence d'ambiguïté. Un contenu de haute qualité est plus souvent cité et recommandé dans les réponses IA.`,
  },

  accessibilite: {
    title: `Accessibilité`,
    description: `Niveau d'accessibilité WCAG du site (attributs alt, contrastes, navigation clavier). Un site accessible est mieux interprété par les parseurs des LLMs et perçu comme plus fiable.`,
  },

  performance: {
    title: `Performance`,
    description: `Vitesse de chargement et Core Web Vitals. Les pages lentes peuvent être partiellement ignorées par les crawlers des LLMs. Une bonne performance garantit que votre contenu est entièrement indexé.`,
  },

  analysesLLM: {
    title: `Analyses détaillées par LLM`,
    description: `Résultats individuels de chaque modèle de langage ayant évalué votre site. Comparer les scores entre LLMs permet d'identifier les modèles qui vous recommandent le plus et d'adapter votre stratégie de contenu en conséquence.`,
  },

  // ─── Page Concurrentielle ─────────────────────────────────────────────────

  positionActuelle: {
    title: `Position actuelle`,
    description: `Votre rang dans le classement LLMO parmi les concurrents analysés sur ce secteur. La position est calculée en agrégeant les scores de crédibilité, structure, pertinence et compatibilité technique évalués par les LLMs.`,
  },

  analyseQualitative: {
    title: `Analyse Qualitative`,
    description: `Synthèse des points forts et axes d'amélioration identifiés par les LLMs lors de l'analyse concurrentielle. Ces éléments qualitatifs complètent les scores numériques pour orienter votre stratégie de contenu.`,
  },

  pointsForts: {
    title: `Points Forts`,
    description: `Avantages compétitifs de votre contenu identifiés par les LLMs par rapport à vos concurrents analysés. Ces éléments constituent votre différenciation — les maintenir et les amplifier renforce votre position dans les réponses IA.`,
  },

  axesDamelioration: {
    title: `Axes d'Amélioration`,
    description: `Lacunes de votre contenu détectées par les LLMs en comparaison avec les meilleurs concurrents. Traiter ces axes en priorité est le levier le plus direct pour progresser dans les classements IA.`,
  },

  matricePositionnement: {
    title: `Matrice de Positionnement`,
    description: `Visualisation bidimensionnelle positionnant votre site et vos concurrents selon leur score LLMO global et leur popularité perçue par les IA. Les sites en haut à droite sont les plus souvent recommandés par les modèles de langage.`,
  },

  analyseConcurrentielle: {
    title: `Analyse Concurrentielle`,
    description: `Comparaison de votre site face à vos principaux concurrents selon les critères évalués par les LLMs (crédibilité, structure, pertinence, technique). Permet d'identifier votre positionnement réel dans votre secteur et les écarts à combler.`,
  },

  scoreGeoGlobal: {
    title: `Score GEO`,
    description: `Score d'optimisation pour les moteurs IA (Generative Engine Optimization), de 0 à 100. Il agrège les 4 dimensions évaluées par les LLMs : crédibilité, structure, pertinence contextuelle et compatibilité technique. Plus il est élevé, plus votre site est cité dans les réponses IA.`,
  },

  analyseBenchmark: {
    title: `Analyse Benchmark`,
    description: `Classement de votre site parmi les concurrents analysés selon deux modes : Score GEO (agrégat des 4 dimensions LLMO) ou Score Benchmark brut (évaluation directe par les LLMs). Identifie votre position réelle dans les réponses IA de votre secteur.`,
  },

  // ─── Onglets Optimiseur ───────────────────────────────────────────────────

  overviewTab: {
    title: `Overview`,
    description: `Synthèse des optimisations générées : score GEO, recommandations prioritaires et aperçu de tous les fichiers produits (Schema.org, llms.txt, meta tags...). Point d'entrée avant de consulter chaque onglet en détail.`,
  },

  jsonLdSchemas: {
    title: `JSON-LD Schemas`,
    description: `Données structurées générées au format JSON-LD selon le vocabulaire Schema.org. À insérer dans le <head> de vos pages pour que les LLMs identifient précisément le type de contenu (article, produit, organisation, FAQ...).`,
  },

  metaTags: {
    title: `Meta Tags & Enrichments`,
    description: `Balises <title>, <meta description>, Open Graph et Twitter Card optimisées pour les LLMs. Ces métadonnées sont les premiers éléments lus par les modèles — leur qualité conditionne directement votre score de pertinence.`,
  },

  llmsTxt: {
    title: `llms.txt`,
    description: `Fichier texte standardisé à publier à la racine de votre domaine (/llms.txt). Il indique aux LLMs quelles pages crawler, le contexte de votre site et vos préférences d'utilisation de contenu par les IA.`,
  },

  robotsTxt: {
    title: `robots.txt`,
    description: `Version optimisée de votre fichier robots.txt intégrant les directives pour les crawlers IA (GPTBot, Claude-Web, Googlebot-Extended...). Contrôle quels modèles peuvent accéder à quelles pages de votre site.`,
  },

  htmlDiff: {
    title: `HTML Diff`,
    description: `Comparaison côte-à-côte de votre HTML original et du HTML optimisé. Visualise exactement les ajouts de balises sémantiques, données structurées et métadonnées recommandés sans toucher à votre code de mise en page.`,
  },

  aiSimulation: {
    title: `AI Simulation`,
    description: `Simulation de la réponse qu'un LLM génèrerait à partir de votre contenu optimisé. Permet de vérifier concrètement comment les IA vont comprendre, résumer et citer votre page après application des optimisations.`,
  },

  domainesLesPlusCites: {
    title: `Domaines les plus cités`,
    description: `Classement des domaines externes les plus souvent cités comme sources par les LLMs lors de l'analyse. Ces sites sont perçus comme des références dans votre secteur — ils constituent vos vrais concurrents dans les réponses IA.`,
  },

} as const;

export type HelpKey = keyof typeof HELP;
