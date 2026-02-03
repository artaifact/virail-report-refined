import React from 'react';
import { Clock, X } from 'lucide-react';

interface RateLimitBannerProps {
  isVisible: boolean;
  retryAfter: number;
  message?: string;
  onClose?: () => void;
}

export const RateLimitBanner: React.FC<RateLimitBannerProps> = ({
  isVisible,
  retryAfter,
  message = 'Trop de requêtes',
  onClose,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white px-4 py-3 shadow-lg z-50 animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 animate-pulse" />
          <div>
            <p className="font-semibold">{message}</p>
            <p className="text-sm opacity-90">
              Réessayez dans <span className="font-mono font-bold">{retryAfter}</span> seconde{retryAfter > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-amber-600 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default RateLimitBanner;
