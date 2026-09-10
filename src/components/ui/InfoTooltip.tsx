import React from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  title: string;
  description: string;
  className?: string;
  /** Côté d'affichage du popover (défaut : top) */
  side?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * Icône d'aide avec tooltip contextuel.
 * Usage : <InfoTooltip {...HELP.coherence} />
 */
export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  title,
  description,
  className,
  side = 'top',
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-center text-slate-400 hover:text-[#1A3AFF] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3AFF] focus-visible:ring-offset-1 rounded-full shrink-0',
            className
          )}
          aria-label={`En savoir plus : ${title}`}
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={8}
        className="max-w-[280px] p-0 overflow-hidden rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgba(15,23,42,0.12)] bg-white font-sans"
      >
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#1A3AFF]">
            {title}
          </p>
        </div>
        <div className="px-4 pb-4">
          <p className="text-[13px] leading-relaxed text-slate-500">{description}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
