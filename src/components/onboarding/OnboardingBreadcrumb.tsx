import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface OnboardingBreadcrumbProps {
  currentStep: number;
  stepsCompleted: string[];
  onNavigate?: (stepNumber: number) => void;
}

const STEPS = [
  { id: 'setup', label: 'Compte', number: 1 },
  { id: 'project', label: 'Projet', number: 2 },
  { id: 'topics', label: 'Type', number: 3 },
  { id: 'results', label: 'Résultats', number: 4 },
  { id: 'plan', label: 'Plan', number: 5 },
] as const;

export function OnboardingBreadcrumb({ 
  currentStep, 
  stepsCompleted,
  onNavigate 
}: OnboardingBreadcrumbProps) {
  const isStepCompleted = (stepId: string) => stepsCompleted.includes(stepId);
  const isStepAccessible = (stepNumber: number) => {
    // L'étape actuelle et les étapes complétées sont accessibles
    return stepNumber <= currentStep || isStepCompleted(STEPS[stepNumber - 1]?.id);
  };

  return (
    <div className="border-b border-border bg-background/80 backdrop-blur-sm px-6 py-4">
      <div className="flex items-center gap-3 text-sm">
        {STEPS.map((step, index) => {
          const isCompleted = isStepCompleted(step.id);
          const isCurrent = currentStep === step.number;
          const isAccessible = isStepAccessible(step.number);
          const canNavigate = isCompleted && onNavigate;

          return (
            <div key={step.id} className="flex items-center gap-3">
              <button
                onClick={() => canNavigate && onNavigate(step.number)}
                disabled={!canNavigate}
                className={cn(
                  'font-medium transition-colors flex items-center gap-2',
                  isCurrent
                    ? 'font-semibold text-meetmind-primary'
                    : isCompleted
                    ? 'text-muted-foreground hover:text-foreground'
                    : 'text-muted-foreground/40',
                  canNavigate && 'cursor-pointer hover:underline',
                  !canNavigate && 'cursor-default'
                )}
              >
                {isCompleted && !isCurrent && (
                  <Check className="h-4 w-4 text-meetmind-primary" />
                )}
                {step.label}
              </button>
              {index < STEPS.length - 1 && (
                <span className="text-muted-foreground/30">•</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

