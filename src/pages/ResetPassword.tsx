import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AuthService } from '@/services/authService';
import { ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

const ResetPassword: React.FC = () => {
  usePageTitle('Réinitialiser le mot de passe');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Token de réinitialisation manquant ou invalide');
      return;
    }
    setToken(tokenParam);
  }, [searchParams]);

  const validatePassword = (pwd: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumbers = /\d/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

    return {
      isValid: pwd.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      errors: [
        { condition: pwd.length >= minLength, message: `Au moins ${minLength} caractères` },
        { condition: hasUpperCase, message: 'Au moins une majuscule' },
        { condition: hasLowerCase, message: 'Au moins une minuscule' },
        { condition: hasNumbers, message: 'Au moins un chiffre' },
        { condition: hasSpecialChar, message: 'Au moins un caractère spécial' },
      ]
    };
  };

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!passwordValidation.isValid) {
      setError('Le mot de passe ne respecte pas les critères requis');
      setIsLoading(false);
      return;
    }

    if (!passwordsMatch) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    try {
      const result = await AuthService.resetPassword(token, password);

      if (result.success) {
        setIsSuccess(true);
        toast({
          title: "Mot de passe réinitialisé",
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

  // Succès
  if (isSuccess) {
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
                  Mot de passe réinitialisé !
                </h1>
                <p className="text-[15px] md:text-[16px] text-[#6e6e73]">
                  Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.
                </p>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="w-full bg-[#9cb5ff] hover:bg-[#8ca5ef] text-white py-3.5 rounded-[10px] text-[15px] md:text-[16px] font-semibold transition-colors shadow-md hover:shadow-lg"
              >
                Se connecter
              </button>
            </div>
          </div>
        </main>

        <footer className="w-full px-6 py-4 text-center">
          <p className="text-sm text-[#6e6e73]">© 2025 Virail. Tous droits réservés.</p>
        </footer>
      </div>
    );
  }

  // Token invalide
  if (!token) {
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
                  Ce lien de réinitialisation est invalide ou a expiré.
                </p>
              </div>

              <button
                onClick={() => navigate('/forgot-password')}
                className="w-full bg-[#9cb5ff] hover:bg-[#8ca5ef] text-white py-3.5 rounded-[10px] text-[15px] md:text-[16px] font-semibold transition-colors shadow-md hover:shadow-lg"
              >
                Demander un nouveau lien
              </button>
            </div>
          </div>
        </main>

        <footer className="w-full px-6 py-4 text-center">
          <p className="text-sm text-[#6e6e73]">© 2025 Virail. Tous droits réservés.</p>
        </footer>
      </div>
    );
  }

  // Formulaire
  return (
    <div className="min-h-screen bg-[#f7f8fc] flex flex-col">
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-100">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-semibold text-[#1b1b1f] mb-3">
                Nouveau mot de passe
              </h1>
              <p className="text-[15px] md:text-[16px] text-[#6e6e73]">
                Entrez votre nouveau mot de passe ci-dessous.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-[11px] uppercase tracking-wide font-bold text-[#1b1b1f] mb-2 ml-1">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Votre nouveau mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full bg-[#f7f8fc] rounded-xl px-4 py-3.5 pr-12 text-sm md:text-[15px] text-[#1b1b1f] placeholder:text-slate-300 border border-transparent focus:bg-white focus:border-[#9cb5ff] focus:ring-0 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-[#1b1b1f] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {password && (
                  <div className="space-y-1 text-xs mt-2">
                    {passwordValidation.errors.map((criterion, index) => (
                      <div
                        key={index}
                        className={`flex items-center ${criterion.condition ? 'text-green-600' : 'text-red-500'}`}
                      >
                        <div className={`w-1 h-1 rounded-full mr-2 ${criterion.condition ? 'bg-green-500' : 'bg-red-500'}`} />
                        {criterion.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-[11px] uppercase tracking-wide font-bold text-[#1b1b1f] mb-2 ml-1">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirmez votre mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full bg-[#f7f8fc] rounded-xl px-4 py-3.5 pr-12 text-sm md:text-[15px] text-[#1b1b1f] placeholder:text-slate-300 border border-transparent focus:bg-white focus:border-[#9cb5ff] focus:ring-0 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-[#1b1b1f] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {confirmPassword && (
                  <div className={`text-xs flex items-center mt-2 ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                    <div className={`w-1 h-1 rounded-full mr-2 ${passwordsMatch ? 'bg-green-500' : 'bg-red-500'}`} />
                    {passwordsMatch ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !passwordValidation.isValid || !passwordsMatch}
                className="w-full bg-[#9cb5ff] hover:bg-[#8ca5ef] text-white py-3.5 rounded-[10px] text-[15px] md:text-[16px] font-semibold transition-colors shadow-md hover:shadow-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Réinitialisation en cours...
                  </div>
                ) : (
                  'Réinitialiser le mot de passe'
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

export default ResetPassword;
