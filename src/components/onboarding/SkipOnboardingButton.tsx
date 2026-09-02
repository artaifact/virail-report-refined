import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface SkipOnboardingButtonProps {
  onSkip: () => void;
}

export function SkipOnboardingButton({ onSkip }: SkipOnboardingButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="text-slate-500 hover:text-slate-700">
          Passer l'onboarding
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Passer l'onboarding ?</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir passer l'onboarding ? Vous pourrez le compléter plus tard depuis les paramètres.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onSkip} className="bg-slate-900 hover:bg-slate-800">
            Passer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

