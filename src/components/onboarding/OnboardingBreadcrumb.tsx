import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface OnboardingBreadcrumbProps {
  currentStep: number;
  stepsCompleted: string[];
  onNavigate?: (stepNumber: number) => void;
}

const STEPS = [
  { id: 'setup', label: 'Configuration', number: 1 },
  { id: 'project', label: 'Projet', number: 2 },
  { id: 'topics', label: 'Sujets', number: 3 },
  { id: 'prompts', label: 'Prompts', number: 4 },
  { id: 'results', label: 'Résultats', number: 5 },
  { id: 'plan', label: 'Plan', number: 6 },
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
    <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm px-6 py-4">
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
                    ? 'font-semibold'
                    : isCompleted
                    ? 'text-slate-500 hover:text-slate-700'
                    : 'text-slate-300',
                  canNavigate && 'cursor-pointer hover:underline',
                  !canNavigate && 'cursor-default'
                )}
                style={isCurrent ? { color: '#3B82F6' } : undefined}
              >
                {isCompleted && !isCurrent && (
                  <Check className="h-4 w-4" style={{ color: '#3B82F6' }} />
                )}
                {step.label}
              </button>
              {index < STEPS.length - 1 && (
                <span className="text-slate-300">•</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

