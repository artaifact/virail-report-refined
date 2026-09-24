import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { AgenticChannelDetailModal, CHANNELS_FULL_CONFIG } from './AgenticChannelDetailModal';

interface AgenticChannelsMatrixProps {
  channelAudit: Record<string, boolean>;
}

export const AgenticChannelsMatrix: React.FC<AgenticChannelsMatrixProps> = ({ channelAudit }) => {
  const [selectedChannelId, setSelectedChannelId] = useState<string>('1_agent_skills');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleOpenChannel = (id: string) => {
    setSelectedChannelId(id);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-3 font-sans">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-sans">
        {Object.entries(CHANNELS_FULL_CONFIG).map(([id, ch]) => {
          const isActive = Boolean(channelAudit[id]);
          const Icon = ch.icon;

          return (
            <Card
              key={id}
              onClick={() => handleOpenChannel(id)}
              className={`group rounded-xl border p-3 transition-all duration-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-primary/50 hover:shadow-md ${
                isActive
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-border bg-card'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 group-hover:scale-105 transition-transform" />
                </div>
                <span className="text-xs font-semibold text-foreground truncate tracking-tight group-hover:text-primary transition-colors">
                  {ch.name}
                </span>
              </div>

              {isActive ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                  ACTIF
                </span>
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              )}
            </Card>
          );
        })}
      </div>

      {/* ─── Channel Detail Modal ────────────────────────────────────── */}
      <AgenticChannelDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedChannelId={selectedChannelId}
        onSelectChannel={setSelectedChannelId}
        channelAudit={channelAudit}
      />
    </div>
  );
};
