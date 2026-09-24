import React from 'react';
import { ActionabilityLevelDetailModal } from './ActionabilityLevelDetailModal';
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
}) => {
  return (
    <ActionabilityLevelDetailModal
      isOpen={isOpen}
      onClose={onClose}
      initialLevel={1}
      unified={unified}
      domain={domain}
    />
  );
};
