import { AgenticAuditProvider } from './AgenticAuditProvider';
import { AgenticAudit, AgentTask, JourneyResult } from '../types';
import { getLatestAgenticAudit, runAgenticScan } from '@/services/agenticService';
import { calculateGrade } from '@/utils/scoreEngine';

/**
 * Provider interne Viraill : exploite l'infrastructure et la persistance existantes
 * (table PostgreSQL agentic_audits + modules LLMO).
 */
export class ViraillGeoProvider implements AgenticAuditProvider {
  name = 'viraill';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async audit(target: string): Promise<AgenticAudit> {
    // 1. Tenter de récupérer le dernier audit stocké
    let scan = await getLatestAgenticAudit(target);

    // 2. Si aucun audit trouvé, exécuter le scan
    if (!scan) {
      scan = await runAgenticScan(target, true);
    }

    // valeurs absentes = 0, jamais un chiffre inventé (avant : score 42 et piliers 12/15/10 par défaut)
    const score = scan.score ?? 0;
    const grade = calculateGrade(score);

    const fixes = (scan.recommendations || []).map((rec, i) => ({
      id: `viraill_fix_${i}`,
      title: rec,
      impact: (i === 0 ? 'critical' : i <= 2 ? 'high' : 'medium') as 'critical' | 'high' | 'medium',
      category: 'Agent-Readiness',
    }));

    return {
      provider: 'viraill',
      score,
      grade,
      fixes,
      summary: `Score d'éligibilité machine : ${score}/100. Infrastructure auditée sur les protocoles M2M, Schémas et canaux de distribution décentralisés.`,
      cached: false,
      freshnessSeconds: 0,
      contractVersion: 'viraill-m2m-v1',
      pillars: {
        discovery: { score: scan.pillars?.crawl_doc?.score ?? 0, max: scan.pillars?.crawl_doc?.max ?? 20 },
        access: { score: scan.pillars?.json_interfaces?.score ?? 0, max: scan.pillars?.json_interfaces?.max ?? 20 },
        usability: { score: scan.pillars?.merchant_schema?.score ?? 0, max: scan.pillars?.merchant_schema?.max ?? 20 },
        payments: { score: scan.pillars?.m2m_settlement?.score ?? 0, max: scan.pillars?.m2m_settlement?.max ?? 25 },
      },
      rawPayload: scan,
    };
  }

  async runJourney(task: AgentTask): Promise<JourneyResult> {
    // Simulation interne basée sur les checks réels du domaine
    // Aucun agent ne parcourt le site ici : le résultat est déduit de l'audit d'éligibilité. Avant : 12 étapes et
    // 1 850 ms codées en dur, et « frictions techniques » sans cause (recette : échec en 1,9 s, 0 étape).
    const started = Date.now();
    const auditRes = await this.audit(task.targetUrl);
    const score = auditRes.score;
    const isSuccess = score >= 60;
    const causes = auditRes.fixes.slice(0, 3).map((f) => f.title).join(' ; ');

    return {
      provider: 'viraill',
      success: isSuccess,
      verdict: isSuccess ? 'satisfied' : score >= 40 ? 'partial' : 'unsatisfied',
      stepsCount: 0,
      durationMs: Date.now() - started,
      summary: isSuccess
        ? `Estimation d'après l'audit d'éligibilité (${score}/100) : un agent devrait pouvoir mener l'intention "${task.intentId}". Aucun agent n'a parcouru le site.`
        : `Estimation d'après l'audit d'éligibilité (${score}/100) : un agent risque d'échouer sur l'intention "${task.intentId}"${causes ? `. Causes principales : ${causes}` : ''}. Aucun agent n'a parcouru le site.`,
      observations: auditRes.fixes.map(f => f.title),
      cached: false,
      contractVersion: 'viraill-journey-v1',
    };
  }
}
