import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="px-6 py-3 bg-slate-50/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">
          Étape {currentStep} sur {totalSteps}
        </span>
        <span className="text-sm text-slate-500">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full transition-all"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #3B82F6 0%, #6366F1 100%)'
          }}
        />
      </div>
    </div>
  );
}

