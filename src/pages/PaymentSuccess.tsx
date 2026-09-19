import React, { useEffect, useState, useRef } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { CheckCircle, Loader2, RefreshCw, LayoutDashboard } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthService } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const MAX_ATTEMPTS = 15;

const PaymentSuccess: React.FC = () => {
  usePageTitle('Paiement réussi');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'polling' | 'active' | 'error'>('polling');
  const [attempt, setAttempt] = useState(0);
  const cancelledRef = useRef(false);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    cancelledRef.current = false;

    if (!sessionId) {
      setStatus('error');
      return;
    }

    checkCheckoutSession(sessionId);
    return () => { cancelledRef.current = true; };
  }, [sessionId]);

  const checkCheckoutSession = async (sid: string) => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      if (cancelledRef.current) return;

      try {
        const res = await AuthService.makeAuthenticatedRequest(
          `${apiBase}/api/v1/subscriptions/checkout-session/${sid}`,
          { method: 'GET' }
        );

        if (res.ok) {
          const data = await res.json();

          if (data.onboarding_completed) {
            if (cancelledRef.current) return;
            setStatus('active');
            try {
              localStorage.removeItem('pending_subscription_id');
              localStorage.removeItem('pending_plan_id');
            } catch {}
            setTimeout(() => {
              if (!cancelledRef.current) navigate('/');
            }, 2000);
            return;
          }
        }
      } catch {
        // Erreur réseau, on réessaie
      }

      if (cancelledRef.current) return;
      setAttempt(i + 1);
      await new Promise(r => setTimeout(r, 2000));
    }

    if (!cancelledRef.current) setStatus('error');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {status === 'polling' && (
          <Card className="rounded-2xl shadow-lg border-border">
            <CardContent className="p-8 sm:p-10">
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-6" />
              <h1 className="text-xl font-bold tracking-tight text-foreground mb-2">
                Activation en cours...
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                Votre paiement est en cours de traitement.
              </p>
              <Progress
                value={(attempt / MAX_ATTEMPTS) * 100}
                className="h-2"
              />
            </CardContent>
          </Card>
        )}

        {status === 'active' && (
          <Card className="rounded-2xl shadow-lg border-border">
            <CardContent className="p-8 sm:p-10">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
                Paiement réussi
              </h1>
              <p className="text-sm text-muted-foreground">
                Votre abonnement est actif. Redirection vers votre tableau de bord...
              </p>
            </CardContent>
          </Card>
        )}

        {status === 'error' && (
          <Card className="rounded-2xl shadow-lg border-border">
            <CardContent className="p-8 sm:p-10">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground mb-2">
                Paiement en cours de traitement
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                L'activation peut prendre quelques instants.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Accéder au dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rafraîchir la page
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
