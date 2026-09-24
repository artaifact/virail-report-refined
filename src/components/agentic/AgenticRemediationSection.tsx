import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import {
  Cpu,
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

interface ProtocolCardConfig {
  id: string;
  name: string;
  dotColor: string;
  fileTarget: string;
  description: string;
  activeBorder: string;
  activeBg: string;
}

const PROTOCOL_CARDS: ProtocolCardConfig[] = [
  {
    id: 'openapi',
    name: 'OpenAPI 3.1',
    dotColor: 'bg-blue-500',
    fileTarget: 'openapi.json',
    description: "Contrat d'API standardisé pour l'exécution d'actions machine.",
    activeBorder: 'border-blue-500/50',
    activeBg: 'bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-blue-500/20',
  },
  {
    id: 'a2a',
    name: 'Protocole A2A',
    dotColor: 'bg-emerald-500',
    fileTarget: 'agent.json',
    description: "Carte d'identité et profil de capacités inter-agents.",
    activeBorder: 'border-emerald-500/50',
    activeBg: 'bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-500/20',
  },
  {
    id: 'ard',
    name: 'Manifeste ARD',
    dotColor: 'bg-indigo-500',
    fileTarget: 'agentic-resources.json',
    description: 'Découverte et indexation instantanée des ressources.',
    activeBorder: 'border-indigo-500/50',
    activeBg: 'bg-indigo-50/50 dark:bg-indigo-950/20 ring-1 ring-indigo-500/20',
  },
  {
    id: 'x402',
    name: 'Règlement x402',
    dotColor: 'bg-amber-500',
    fileTarget: 'pricing.json',
    description: 'Barème tarifaire et micro-paiements pour requêtes autonomes.',
    activeBorder: 'border-amber-500/50',
    activeBg: 'bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-500/20',
  },
];

export const AgenticRemediationSection: React.FC<AgenticRemediationSectionProps> = ({ reportData }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [auditData, setAuditData] = useState<AgenticScanResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>('openapi.json');

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

  // Initialisation du premier fichier disponible si non défini
  useEffect(() => {
    if (pack?.files) {
      const keys = Object.keys(pack.files);
      if (keys.length > 0 && !keys.includes(selectedFile)) {
        const found = keys.find((k) => k.includes('openapi')) || keys[0];
        setSelectedFile(found);
      }
    }
  }, [pack]);

  const handleProtocolCardClick = (card: ProtocolCardConfig) => {
    if (!pack?.files) {
      setSelectedFile(card.fileTarget);
      return;
    }
    const fileKeys = Object.keys(pack.files);
    const match = fileKeys.find(
      (k) =>
        k.toLowerCase() === card.fileTarget.toLowerCase() ||
        k.toLowerCase().endsWith('/' + card.fileTarget.toLowerCase()) ||
        k.toLowerCase().includes(card.fileTarget.toLowerCase())
    );
    setSelectedFile(match || card.fileTarget);
  };

  const isProtocolActive = (card: ProtocolCardConfig) => {
    if (!selectedFile) return false;
    const s = selectedFile.toLowerCase();
    const t = card.fileTarget.toLowerCase();
    return s.includes(t) || t.includes(s);
  };

  return (
    <div className="space-y-5 font-sans animate-in fade-in duration-200">
      {/* ═══ Header Épuré ═══ */}
      <Card className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Cpu className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base font-semibold text-foreground tracking-tight">
                  Pack d'Éligibilité Agentique (M2M) — {brandName}
                </h3>
                <Badge
                  variant="outline"
                  className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
                    score < 40
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50'
                      : score < 70
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
                  }`}
                >
                  Score M2M : {score}/100
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Spécifications machine prêtes au déploiement pour l'indexation et les requêtes autonomes.</span>
                <InfoTooltip
                  title="Éligibilité Machine-to-Machine"
                  description="Spécifications normalisées (OpenAPI 3.1, A2A Agent Card, ARD Discovery, pricing JSON et skill.md) pour permettre aux agents autonomes (OpenAI Operator, Claude Computer Use, Perplexity) d'interagir directement avec vos endpoints sans blocage."
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadPack(true)}
              disabled={loading}
              className="h-8 text-xs gap-1.5 rounded-lg border-border font-medium"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>Régénérer</span>
            </Button>

            <Button
              size="sm"
              onClick={() => navigate('/agentic')}
              className="h-8 text-xs font-semibold rounded-lg gap-1.5 shadow-xs"
            >
              <span>Cockpit Complet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* ═══ 4 Protocoles Interactifs (Quick Jump) ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PROTOCOL_CARDS.map((card) => {
          const active = isProtocolActive(card);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleProtocolCardClick(card)}
              className={`group text-left p-3.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                active
                  ? `${card.activeBorder} ${card.activeBg} shadow-xs`
                  : 'bg-card border-border/70 hover:border-border hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${card.dotColor}`} />
                  <span>{card.name}</span>
                </div>
                <code className="text-[10.5px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground group-hover:text-foreground">
                  {card.fileTarget}
                </code>
              </div>
              <p className="text-[11.5px] text-muted-foreground font-normal leading-relaxed">
                {card.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* ═══ Visualiseur & Studio de Remédiation ═══ */}
      {loading ? (
        <Card className="p-12 text-center space-y-3 rounded-2xl border border-border/70 bg-card">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
          <p className="text-xs text-muted-foreground">Génération et formatage des spécifications machine...</p>
        </Card>
      ) : (
        <AgenticRemediationViewer
          remediationPack={pack}
          activeFile={selectedFile}
          onActiveFileChange={setSelectedFile}
          brandName={brandName}
        />
      )}
    </div>
  );
};
