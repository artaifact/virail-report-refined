import React from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
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
    <TooltipProvider delayDuration={200}>
      <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'inline-flex items-center justify-center text-muted-foreground hover:text-primary transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-full shrink-0',
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
        className="max-w-[280px] p-3 rounded-xl border border-border shadow-lg bg-popover text-popover-foreground font-sans z-50"
      >
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-primary">
            {title}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
