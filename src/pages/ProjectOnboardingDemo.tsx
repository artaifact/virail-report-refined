import { useState } from 'react';
import { ProjectOnboarding } from '@/components/ProjectOnboarding';
import { Button } from '@/components/ui/button';

export default function ProjectOnboardingDemo() {
  const [isOpen, setIsOpen] = useState(true);

  const handleComplete = (data: any) => {
    console.log('Onboarding terminé:', data);
    setIsOpen(false);
    alert('Onboarding terminé! Vérifiez la console pour voir les données.');
  };

  return (
    <div>
      {!isOpen && (
        <div className="flex items-center justify-center min-h-screen">
          <Button onClick={() => setIsOpen(true)}>
            Ouvrir l'onboarding
          </Button>
        </div>
      )}
      <ProjectOnboarding
        open={isOpen}
        onComplete={handleComplete}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}

