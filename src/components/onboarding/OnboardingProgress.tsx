import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="px-6 py-3 bg-muted/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">
          Étape {currentStep} sur {totalSteps}
        </span>
        <span className="text-sm text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-meetmind-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

