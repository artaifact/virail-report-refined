import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthService } from '@/services/authService';
import { CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

const VerifyEmail: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setErrorMessage('Lien de vérification invalide ou manquant.');
      return;
    }

    AuthService.verifyEmail(token)
      .then(() => {
        setStatus('success');
      })
      .catch((err: Error) => {
        setStatus('error');
        setErrorMessage(err.message || 'Une erreur est survenue lors de la vérification.');
      });
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#f7f8fc] flex flex-col">
        <main className="flex-1 flex items-center justify-center py-16 px-4">
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-100 text-center">
              <Loader2 className="h-12 w-12 text-[#9cb5ff] animate-spin mx-auto mb-6" />
              <h1 className="text-2xl font-semibold text-[#1b1b1f] mb-2">
                Vérification en cours...
              </h1>
              <p className="text-[15px] text-[#6e6e73]">
                Veuillez patienter pendant que nous activons votre compte.
              </p>
            </div>
          </div>
        </main>
        <footer className="w-full px-6 py-4 text-center">
          <p className="text-sm text-[#6e6e73]">© 2025 Viraill. Tous droits réservés.</p>
        </footer>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#f7f8fc] flex flex-col">
        <main className="flex-1 flex items-center justify-center py-16 px-4">
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-100">
              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-3xl md:text-4xl font-semibold text-[#1b1b1f] mb-3">
                  Email vérifié !
                </h1>
                <p className="text-[15px] md:text-[16px] text-[#6e6e73]">
                  Votre adresse email a été confirmée avec succès. Vous pouvez maintenant vous connecter.
                </p>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="w-full bg-[#9cb5ff] hover:bg-[#8ca5ef] text-white py-3.5 rounded-[10px] text-[15px] md:text-[16px] font-semibold transition-colors shadow-md hover:shadow-lg"
              >
                Retour à la connexion
              </button>
            </div>
          </div>
        </main>
        <footer className="w-full px-6 py-4 text-center">
          <p className="text-sm text-[#6e6e73]">© 2025 Viraill. Tous droits réservés.</p>
        </footer>
      </div>
    );
  }

  // Erreur
  return (
    <div className="min-h-screen bg-[#f7f8fc] flex flex-col">
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-100">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold text-[#1b1b1f] mb-3">
                Lien invalide
              </h1>
              <p className="text-[15px] md:text-[16px] text-[#6e6e73]">
                {errorMessage}
              </p>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full bg-[#9cb5ff] hover:bg-[#8ca5ef] text-white py-3.5 rounded-[10px] text-[15px] md:text-[16px] font-semibold transition-colors shadow-md hover:shadow-lg"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour à la connexion
              </span>
            </button>
          </div>
        </div>
      </main>
      <footer className="w-full px-6 py-4 text-center">
        <p className="text-sm text-[#6e6e73]">© 2025 Viraill. Tous droits réservés.</p>
      </footer>
    </div>
  );
};

export default VerifyEmail;
