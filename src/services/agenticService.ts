/**
 * Service API pour le module d'Agentic Readiness & M2M Commerce
 * Audite l'éligibilité machine sur les 5 piliers et les 8 canaux décentralisés.
 */

import { apiService } from './apiService';

export interface AgenticPillar {
  score: number;
  max: number;
  checks: string[];
}

export interface AgenticRemediationPack {
  brand: string;
  ready: boolean;
  files: Record<string, string>;
}

export interface AgenticScanResult {
  status: string;
  target_url: string;
  score: number;
  scan_data?: any;
  pillars: {
    crawl_doc?: AgenticPillar;
    json_interfaces?: AgenticPillar;
    merchant_schema?: AgenticPillar;
    m2m_settlement?: AgenticPillar;
    distribution_channels?: AgenticPillar;
    [key: string]: AgenticPillar | undefined;
  };
  channel_audit: Record<string, boolean>;
  recommendations: string[];
  markdown_report: string;
  remediation_pack?: AgenticRemediationPack;
}

const FALLBACK_FLY_API = 'https://viraill-core-api.fly.dev';

export async function runAgenticScan(
  url: string,
  remediate: boolean = true,
  name?: string
): Promise<AgenticScanResult> {
  const payload = { url, remediate, name };

  // 1. Essayer d'abord l'API locale / proxifiée (virail_ranking)
  try {
    const res = await apiService.request<AgenticScanResult>('/api/v1/agentic/scan', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res && (res.score !== undefined || res.pillars)) {
      return res;
    }
  } catch (err: any) {
    console.warn('[AgenticService] Local virail_ranking endpoint unreachable, fallbacking to Fly.io engine...', err);
  }

  // 2. Fallback résilient sur l'API cloud de production
  const response = await fetch(`${FALLBACK_FLY_API}/v1/agentic/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Erreur lors du scan agentique (${response.status}: ${response.statusText})`);
  }

  const raw = await response.json();
  return {
    status: 'success',
    target_url: url,
    score: raw.score ?? raw.scan_data?.score ?? 0,
    pillars: raw.scan_data?.pillars ?? raw.pillars ?? {},
    channel_audit: raw.scan_data?.channel_audit ?? raw.channel_audit ?? {},
    recommendations: raw.scan_data?.recommendations ?? raw.recommendations ?? [],
    markdown_report: raw.markdown_report ?? '',
    remediation_pack: raw.remediation_pack ?? {
      brand: name || new URL(url).hostname,
      ready: true,
      files: {},
    },
  };
}

export async function getX402Manifest(): Promise<any> {
  try {
    return await apiService.request('/api/v1/agentic/x402-manifest');
  } catch (_) {
    const res = await fetch(`${FALLBACK_FLY_API}/.well-known/x402.json`);
    return await res.json();
  }
}
