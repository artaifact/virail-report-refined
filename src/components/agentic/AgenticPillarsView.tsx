import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { AgenticPillar } from '@/services/agenticService';
import { AgenticPillarDetailModal, PILLAR_DEFINITIONS } from './AgenticPillarDetailModal';

interface AgenticPillarsViewProps {
  pillars: Record<string, AgenticPillar | undefined>;
  onNavigateToRemediation?: (filename?: string) => void;
}

export const AgenticPillarsView: React.FC<AgenticPillarsViewProps> = ({
  pillars,
  onNavigateToRemediation,
}) => {
  const [selectedPillarKey, setSelectedPillarKey] = useState<string>('crawl_doc');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const openPillarModal = (key: string) => {
    setSelectedPillarKey(key);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-3 font-sans">
      {/* ─── The 5 Pillars Cards Grid (Clean & Glanceable) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(PILLAR_DEFINITIONS).map(([key, config]) => {
          const pillar = pillars[key] || { score: 0, max: 20, checks: [] };
          const Icon = config.icon;
          const pct = Math.min(100, Math.round((pillar.score / (pillar.max || 1)) * 100));

          // Categorize checks
          const checks = pillar.checks || [];
          const okChecks = checks.filter(
            (c) => c.startsWith('✅') || c.includes('[OK]') || c.startsWith('+')
          );
          const warnChecks = checks.filter((c) => c.startsWith('⚠️') || c.includes('[WARN]'));
          const failChecks = checks.filter((c) => !okChecks.includes(c) && !warnChecks.includes(c));

          let progressColor = 'bg-rose-500';

          if (pct >= 70) {
            progressColor = 'bg-emerald-500';
          } else if (pct >= 35) {
            progressColor = 'bg-amber-500';
          }

          const cleanTitle = config.title.replace(/^\d+\.\s*/, '');

          return (
            <Card
              key={key}
              onClick={() => openPillarModal(key)}
              className="group rounded-xl border border-border bg-card shadow-xs flex flex-col justify-between p-3.5 sm:p-4 transition-all hover:border-primary/50 hover:shadow-md cursor-pointer gap-3"
            >
              {/* Header: Icon, Clean Title & Chevron */}
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs sm:text-[13px] font-semibold text-foreground tracking-tight truncate group-hover:text-primary transition-colors">
                    {cleanTitle}
                  </h4>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${progressColor} transition-all duration-500 ease-out`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* ─── Detailed Inspection Modal ────────────────────────────────────── */}
      <AgenticPillarDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        selectedPillarKey={selectedPillarKey}
        onSelectPillar={setSelectedPillarKey}
        pillars={pillars}
        onNavigateToRemediation={onNavigateToRemediation}
      />
    </div>
  );
};
