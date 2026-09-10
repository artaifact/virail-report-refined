import { AgenticAudit, AgentTask, JourneyResult } from '../types';

/**
 * Interface abstraite d'un fournisseur d'audit agentique et de parcours
 */
export interface AgenticAuditProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  audit(target: string): Promise<AgenticAudit>;
  runJourney(task: AgentTask): Promise<JourneyResult>;
}
