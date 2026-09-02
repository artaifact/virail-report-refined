import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, CheckCircle, Clock } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthContext } from '@/contexts/AuthContext';
import { RegisterRequest } from '@/types/auth';
import { PasswordInput } from '@/components/PasswordInput';
import { RateLimitBanner } from '@/components/RateLimitBanner';
import { useRateLimit } from '@/hooks/useRateLimit';
import { PasswordValidationResult } from '@/utils/passwordValidation';

const registerSchema = z.object({
  email: z.string().email('Veuillez entrer une adresse email valide (ex: nom@domaine.com)'),
  username: z.string().min(2, 'Le nom d\'utilisateur doit contenir au moins 2 caractères'),
  password: z.string().min(12, 'Le mot de passe doit contenir au moins 12 caractères'),
  confirmPassword: z.string().min(1, 'Veuillez confirmer votre mot de passe'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type RegisterFormData = RegisterRequest & { confirmPassword: string };

export default function Register() {
  usePageTitle('Inscription');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationResult | null>(null);
  const { register: registerUser, isLoading } = useAuthContext();
  const { rateLimitState, handleRateLimitError, isRateLimited } = useRateLimit();
  const navigate = useNavigate();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handlePasswordValidationChange = useCallback((result: PasswordValidationResult) => {
    setPasswordValidation(result);
  }, []);

  // Compte à rebours pour redirection automatique
  useEffect(() => {
    if (showSuccessMessage && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showSuccessMessage && countdown === 0) {
      navigate('/login', { replace: true });
    }
  }, [countdown, showSuccessMessage, navigate]);

  const onSubmit = async (data: RegisterFormData) => {
    // Vérifier la validation du mot de passe
    if (passwordValidation && !passwordValidation.isValid) {
      return;
    }

    try {
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);

      // Afficher le message de succès
      setShowSuccessMessage(true);
      setCountdown(5);

      // Réinitialiser le formulaire
      form.reset();
    } catch (error) {
      // Gérer le rate limiting
      if (!handleRateLimitError(error)) {
        // L'erreur est déjà gérée dans le hook useAuth
      }
      setShowSuccessMessage(false);
    }
  };

  return (
    <>
      <RateLimitBanner
        isVisible={isRateLimited}
        retryAfter={rateLimitState.retryAfter}
        message={rateLimitState.message}
      />

      <div className="min-h-screen bg-[#f7f8fc] flex flex-col">
        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center py-16 px-4">
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-100">
              {showSuccessMessage ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-semibold text-[#1b1b1f] mb-4">Compte créé avec succès</h2>
                  <p className="text-sm text-[#6e6e73] mb-4">Vérifiez votre email et cliquez sur le lien pour activer votre compte.</p>
                  <div className="mt-2 p-4 bg-[#f7f8fc] rounded-lg">
                    <div className="flex items-center justify-center gap-2 text-[#6e6e73]">
                      <Clock className="h-4 w-4" />
                      <p className="text-sm">
                        Redirection vers la page de connexion dans {countdown} seconde{countdown > 1 ? 's' : ''}...
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/login', { replace: true })}
                    className="mt-4 bg-[#9cb5ff] hover:bg-[#8ca5ef] text-white px-6 py-3 rounded-[10px] text-[15px] md:text-[16px] font-semibold transition-colors shadow-md hover:shadow-lg"
                  >
                    Aller à la page de connexion maintenant
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* En-tête */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl md:text-4xl font-semibold text-[#1b1b1f] mb-3">
                    Créer un compte
                  </h1>
                  <p className="text-[15px] md:text-[16px] text-[#6e6e73]">
                    Commencez votre optimisation IA-first dès aujourd&apos;hui
                  </p>
                </div>

                {/* Formulaire */}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="block text-[11px] uppercase tracking-wide font-bold text-[#1b1b1f] mb-2 ml-1">
                            Email
                          </FormLabel>
                          <FormControl>
                            <input
                              type="email"
                              placeholder="vous@entreprise.com"
                              className="w-full bg-[#f7f8fc] rounded-xl px-4 py-3.5 text-sm md:text-[15px] text-[#1b1b1f] placeholder:text-slate-300 border border-transparent focus:bg-white focus:border-[#9cb5ff] focus:ring-0 outline-none transition-all"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="block text-[11px] uppercase tracking-wide font-bold text-[#1b1b1f] mb-2 ml-1">
                            Nom d'utilisateur
                          </FormLabel>
                          <FormControl>
                            <input
                              type="text"
                              placeholder="Votre nom d'utilisateur"
                              className="w-full bg-[#f7f8fc] rounded-xl px-4 py-3.5 text-sm md:text-[15px] text-[#1b1b1f] placeholder:text-slate-300 border border-transparent focus:bg-white focus:border-[#9cb5ff] focus:ring-0 outline-none transition-all"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <PasswordInput
                              value={field.value}
                              onChange={field.onChange}
                              username={form.watch('username')}
                              email={form.watch('email')}
                              onValidationChange={handlePasswordValidationChange}
                              disabled={isLoading || isRateLimited}
                              simpleMode={true}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="block text-[11px] uppercase tracking-wide font-bold text-[#1b1b1f] mb-2 ml-1">
                            Confirmer le mot de passe
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="w-full bg-[#f7f8fc] rounded-xl px-4 py-3.5 pr-12 text-sm md:text-[15px] text-[#1b1b1f] placeholder:text-slate-300 border border-transparent focus:bg-white focus:border-[#9cb5ff] focus:ring-0 outline-none transition-all"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-3 flex items-center text-[11px] text-[#6e6e73] hover:text-[#1b1b1f] transition-colors"
                              >
                                {showConfirmPassword ? 'Masquer' : 'Afficher'}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="w-4 h-4 mt-1 rounded border-slate-300 text-[#9cb5ff] focus:ring-[#9cb5ff]"
                        required
                      />
                      <span className="text-[#6e6e73] text-[13px] md:text-sm">
                        J&apos;accepte les{' '}
                        <Link
                          to="/terms"
                          className="text-[#9cb5ff] hover:text-[#8ca5ef] font-medium"
                        >
                          conditions générales
                        </Link>{' '}
                        et la{' '}
                        <Link
                          to="/privacy"
                          className="text-[#9cb5ff] hover:text-[#8ca5ef] font-medium"
                        >
                          politique de confidentialité
                        </Link>
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || isRateLimited || (passwordValidation && !passwordValidation.isValid)}
                      className="w-full bg-[#9cb5ff] hover:bg-[#8ca5ef] text-white py-3.5 rounded-[10px] text-[15px] md:text-[16px] font-semibold transition-colors shadow-md hover:shadow-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Création du compte...
                        </div>
                      ) : isRateLimited ? (
                        `Attendez ${rateLimitState.retryAfter}s`
                      ) : (
                        'Créer mon compte'
                      )}
                    </button>
                  </form>
                </Form>

                {/* Lien vers login */}
                <div className="mt-6 text-center">
                  <p className="text-sm md:text-[15px] text-[#6e6e73]">
                    Déjà un compte ?{' '}
                    <Link
                      to="/login"
                      className="text-[#9cb5ff] hover:text-[#8ca5ef] font-semibold transition-colors"
                    >
                      Se connecter
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

        {/* Footer */}
        <footer className="w-full px-6 py-4 text-center">
          <p className="text-sm text-[#6e6e73]">© 2025 Virail. Tous droits réservés.</p>
        </footer>
      </div>
    </>
  );
}
