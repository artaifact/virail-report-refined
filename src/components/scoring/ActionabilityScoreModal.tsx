import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ActionabilityScoreDetail } from './ActionabilityScoreDetail';
import { UnifiedActionabilityScore } from '@/types/scoring';

interface ActionabilityScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  unified: UnifiedActionabilityScore | null;
  domain?: string;
  onSwitchToFullView?: () => void;
}

export const ActionabilityScoreModal: React.FC<ActionabilityScoreModalProps> = ({
  isOpen,
  onClose,
  unified,
  domain,
  onSwitchToFullView,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 bg-card">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            <span>Détail du Score d'Actionnabilité Unifié (3 Niveaux)</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Pondération canonique Viraill 2026 : Être trouvé (40%) • Être compris (30%) • Être actionnable (30%).
          </DialogDescription>
        </DialogHeader>

        <ActionabilityScoreDetail
          unified={unified}
          domain={domain}
          isModalView={true}
          onSwitchToFullView={() => {
            onClose();
            if (onSwitchToFullView) {
              onSwitchToFullView();
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
