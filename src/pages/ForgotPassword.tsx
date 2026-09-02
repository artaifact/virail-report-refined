import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AuthService } from '@/services/authService';
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  usePageTitle('Mot de passe oublié');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await AuthService.forgotPassword(email);

      if (result.success) {
        setIsEmailSent(true);
        toast({
          title: "Email envoyé",
          description: result.message,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
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
                  Email envoyé !
                </h1>
                <p className="text-[15px] md:text-[16px] text-[#6e6e73]">
                  Nous avons envoyé un lien de réinitialisation à votre adresse email.
                </p>
              </div>

              <Alert className="mb-6">
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Vérifiez votre boîte de réception et votre dossier spam.
                  Le lien de réinitialisation expire dans 1 heure.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-[#9cb5ff] hover:bg-[#8ca5ef] text-white py-3.5 rounded-[10px] text-[15px] md:text-[16px] font-semibold transition-colors shadow-md hover:shadow-lg"
                >
                  Retour à la connexion
                </button>
                <button
                  onClick={() => {
                    setIsEmailSent(false);
                    setEmail('');
                  }}
                  className="w-full py-3.5 rounded-[10px] text-[15px] md:text-[16px] font-semibold border-2 border-slate-200 text-[#6e6e73] hover:bg-slate-50 transition-colors"
                >
                  Envoyer un nouvel email
                </button>
              </div>
            </div>
          </div>
        </main>

        <footer className="w-full px-6 py-4 text-center">
          <p className="text-sm text-[#6e6e73]">© 2025 Virail. Tous droits réservés.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex flex-col">
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-100">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-semibold text-[#1b1b1f] mb-3">
                Mot de passe oublié ?
              </h1>
              <p className="text-[15px] md:text-[16px] text-[#6e6e73]">
                Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-[11px] uppercase tracking-wide font-bold text-[#1b1b1f] mb-2 ml-1">
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full bg-[#f7f8fc] rounded-xl px-4 py-3.5 text-sm md:text-[15px] text-[#1b1b1f] placeholder:text-slate-300 border border-transparent focus:bg-white focus:border-[#9cb5ff] focus:ring-0 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full bg-[#9cb5ff] hover:bg-[#8ca5ef] text-white py-3.5 rounded-[10px] text-[15px] md:text-[16px] font-semibold transition-colors shadow-md hover:shadow-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Envoi en cours...
                  </div>
                ) : (
                  'Envoyer le lien de réinitialisation'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-[#9cb5ff] hover:text-[#8ca5ef] font-semibold transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Retour à la connexion
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full px-6 py-4 text-center">
        <p className="text-sm text-[#6e6e73]">© 2025 Virail. Tous droits réservés.</p>
      </footer>
    </div>
  );
};

export default ForgotPassword;
