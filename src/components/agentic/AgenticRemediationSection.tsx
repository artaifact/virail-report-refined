import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Cpu,
  FileCode2,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { FullReportData } from '@/lib/api';
import { getLatestAgenticAudit, runAgenticScan, AgenticScanResult } from '@/services/agenticService';
import { AgenticRemediationViewer } from './AgenticRemediationViewer';

interface AgenticRemediationSectionProps {
  reportData: FullReportData | null;
}

export const AgenticRemediationSection: React.FC<AgenticRemediationSectionProps> = ({ reportData }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [auditData, setAuditData] = useState<AgenticScanResult | null>(null);

  const reportUrl = useMemo(() => {
    return (
      (reportData as any)?.report?.url ||
      (reportData as any)?.llmo_report?.url ||
      (reportData as any)?.url ||
      (reportData as any)?.analyse_citation?.client_site_url ||
      ''
    );
  }, [reportData]);

  const brandName = useMemo(() => {
    if (!reportUrl) return 'Votre Plateforme';
    try {
      const h = new URL(reportUrl).hostname.replace('www.', '');
      return h.split('.')[0].toUpperCase();
    } catch {
      return 'Votre Plateforme';
    }
  }, [reportUrl]);

  const loadPack = async (forceFresh: boolean = false) => {
    if (!reportUrl) return;
    setLoading(true);

    try {
      if (!forceFresh) {
        // 1. Vérifier si présent dans reportData
        const existingScan = (reportData as any)?.agentic_scan || (reportData as any)?.agentic_readiness;
        if (existingScan?.remediation_pack && Object.keys(existingScan.remediation_pack.files || {}).length > 0) {
          setAuditData(existingScan);
          setLoading(false);
          return;
        }

        // 2. Vérifier si présent en BDD
        const cached = await getLatestAgenticAudit(reportUrl);
        if (cached && cached.remediation_pack && Object.keys(cached.remediation_pack.files || {}).length > 0) {
          setAuditData(cached);
          setLoading(false);
          return;
        }
      }

      // 3. Sinon lancer le scan avec génération du pack
      const reportId = (reportData as any)?.report?.id || (reportData as any)?.llmo_report?.id;
      const fresh = await runAgenticScan(reportUrl, true, brandName, reportId);
      setAuditData(fresh);
    } catch (err) {
      console.warn('[AgenticRemediationSection] Failed to load pack:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportUrl) {
      loadPack(false);
    }
  }, [reportUrl]);

  const pack = auditData?.remediation_pack;
  const score = auditData?.score ?? 42;

  return (
    <div className="space-y-6 font-sans">
      {/* Banner Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/40 text-xs font-semibold text-[#1A3AFF] dark:text-blue-400">
              <Cpu className="w-3.5 h-3.5" />
              <span>Protocoles Machine-to-Machine (M2M) & Remédiation</span>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              Score M2M : {score}/100
            </Badge>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Pack de Fichiers d'Éligibilité Agentique — {brandName}
          </h3>

          <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 max-w-3xl font-normal leading-relaxed">
            Spécifications techniques complètes prêtes au déploiement (OpenAPI 3.1, A2A Agent Card, ARD Discovery, pricing JSON, middleware x402 et Skill Markdown) pour éliminer le risque de disqualification silencieuse face aux agents autonomes.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadPack(true)}
            disabled={loading}
            className="h-8 text-xs gap-1.5 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            <span>Régénérer</span>
          </Button>

          <Button
            size="sm"
            onClick={() => navigate('/agentic')}
            className="h-8 text-xs font-semibold rounded-lg bg-[#1A3AFF] hover:bg-[#1530D9] text-white gap-1.5 shadow-xs"
          >
            <span>Cockpit Complet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Guide des 4 protocoles majeurs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>OpenAPI 3.1</span>
          </div>
          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-normal leading-snug">
            Contrat d'API standardisé pour permettre aux agents d'exécuter des requêtes sur vos endpoints.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Protocole A2A</span>
          </div>
          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-normal leading-snug">
            Fichier <code>agent.json</code> définissant les capacités et le profil de votre agent auprès des autres flottes.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>Manifeste ARD</span>
          </div>
          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-normal leading-snug">
            Découverte des ressources machine (<code>agentic-resources.json</code>) pour indexation instantanée.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Règlement x402</span>
          </div>
          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-normal leading-snug">
            Middleware Next.js pour négocier des micro-paiements en USDC Base ou via Stripe SPT.
          </p>
        </div>
      </div>

      {/* Visualiseur de code à onglets */}
      {loading ? (
        <div className="p-12 text-center space-y-3 bg-white dark:bg-slate-900 border border-slate-200/80 rounded-2xl">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#1A3AFF]" />
          <p className="text-xs text-slate-500">Génération et formatage des spécifications machine...</p>
        </div>
      ) : (
        <AgenticRemediationViewer remediationPack={pack} />
      )}
    </div>
  );
};
