import React, { useEffect, useState, useRef } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthService } from '@/services/authService';

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
      // Pas de session_id → rien à vérifier
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
    <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {status === 'polling' && (
          <div className="bg-white rounded-2xl p-10 shadow-lg border border-slate-100">
            <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mx-auto mb-6" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Activation en cours...
            </h1>
            <p className="text-sm text-gray-500 mb-4">
              Votre paiement est en cours de traitement.
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${(attempt / MAX_ATTEMPTS) * 100}%` }}
              />
            </div>
          </div>
        )}

        {status === 'active' && (
          <div className="bg-white rounded-2xl p-10 shadow-lg border border-slate-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Paiement réussi
            </h1>
            <p className="text-sm text-gray-500">
              Votre abonnement est actif. Redirection...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white rounded-2xl p-10 shadow-lg border border-slate-100">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Paiement en cours de traitement
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              L'activation peut prendre quelques instants.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/')}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Accéder au dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Rafraîchir la page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
