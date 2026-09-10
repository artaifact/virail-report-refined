import { AgenticAuditProvider } from './AgenticAuditProvider';
import { AgenticAudit, AgentTask, JourneyResult } from '../types';
import { normalizeDomain, extractBaseBrand } from '@/utils/entityNormalizer';

/**
 * Provider Déterministe : Fournit un audit instantané et des parcours simulés
 * sans dépendance externe ni risque de rate-limiting.
 */
export class DeterministicProvider implements AgenticAuditProvider {
  name = 'deterministic';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async audit(target: string): Promise<AgenticAudit> {
    const domain = normalizeDomain(target);
    const brand = extractBaseBrand(domain).toUpperCase() || 'TARGET';

    return {
      provider: 'deterministic',
      score: 48,
      grade: 'C',
      contractVersion: '2026.1',
      freshnessSeconds: 0,
      cached: false,
      summary: `Évaluation structurelle locale pour ${brand}. Les protocoles de découverte de base sont détectés mais les points de terminaison d'actions machine nécessitent un contrat standardisé.`,
      pillars: {
        discovery: { score: 14, max: 25 },
        access: { score: 18, max: 25 },
        usability: { score: 16, max: 25 },
        payments: { score: 0, max: 25 },
      },
      fixes: [
        {
          id: 'det_llms',
          title: 'Déployer un fichier /llms.txt standardisé',
          description: 'Aiguillage direct pour agents autonomes.',
          impact: 'high',
          category: 'Discovery',
        },
        {
          id: 'det_openapi',
          title: 'Formaliser OpenAPI 3.1 (/openapi.json)',
          description: 'Exposition des points d’accès API pour outillage agentique.',
          impact: 'high',
          category: 'Access',
        },
        {
          id: 'det_x402',
          title: 'Activer le protocole de paiement autonome (x402)',
          description: 'Permet les transactions payantes programmatiques sans friction de carte bancaire.',
          impact: 'medium',
          category: 'Payments',
        },
      ],
    };
  }

  async runJourney(task: AgentTask): Promise<JourneyResult> {
    const isDiscover = task.intentId === 'discover' || task.intentId === 'compare';

    return {
      provider: 'deterministic',
      success: isDiscover,
      verdict: isDiscover ? 'satisfied' : 'partial',
      stepsCount: 8,
      durationMs: 1420,
      cached: false,
      contractVersion: '2026.1',
      summary: isDiscover
        ? `L'agent a exploré la page d'accueil de ${task.targetUrl} et identifié la proposition de valeur principale.`
        : `L'agent a tenté d'exécuter l'intention "${task.intentId}" mais s'est heurté à l'absence de formulaires ou de points d'API machine standardisés.`,
      observations: [
        'Navigation HTTP 200 fluide sur les pages principales.',
        'Absence de balisage sémantique explicite sur les formulaires d’action.',
        'Recommandation : exposer un serveur MCP ou un contrat OpenAPI.',
      ],
      trajectory: [
        { stepIndex: 1, action: 'Initialisation de l\'agent', status: 'success', reasoning: 'Prise en compte de l’intention' },
        { stepIndex: 2, action: `Récupération de ${task.targetUrl}`, status: 'success', reasoning: 'Lecture du document HTML' },
        { stepIndex: 3, action: 'Recherche de /llms.txt', status: 'failed', reasoning: 'Fichier non trouvé (404)' },
        { stepIndex: 4, action: 'Extraction des entités sémantiques', status: 'success', reasoning: 'Analyse du contenu visible' },
        { stepIndex: 5, action: 'Évaluation de l\'accomplissement', status: isDiscover ? 'success' : 'failed', reasoning: 'Vérification des critères de satisfaction' },
      ],
    };
  }
}
