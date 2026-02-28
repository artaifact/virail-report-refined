import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuthContext } from '@/contexts/AuthContext';
import { LoginRequest } from '@/types/auth';
import { RateLimitBanner } from '@/components/RateLimitBanner';
import { useRateLimit } from '@/hooks/useRateLimit';

const loginSchema = z.object({
  username: z.string().min(1, 'Nom d\'utilisateur requis'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export default function Login() {
  usePageTitle('Connexion');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthContext();
  const { rateLimitState, handleRateLimitError, isRateLimited } = useRateLimit();
  const navigate = useNavigate();
  const location = useLocation();

  // Récupérer l'URL de redirection depuis l'état de location
  const from = location.state?.from?.pathname || '/';

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginRequest) => {
    try {
      await login(data);

      // Petit délai pour permettre à l'état d'authentification de se propager
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    } catch (error) {
      // Gérer le rate limiting
      if (!handleRateLimitError(error)) {
        // L'erreur est déjà gérée dans le hook useAuth
      }
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
              {/* En-tête */}
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-semibold text-[#1b1b1f] mb-3">
                  Se connecter
                </h1>
                <p className="text-[15px] md:text-[16px] text-[#6e6e73]">
                  Accédez à votre tableau de bord Virail
                </p>
              </div>

              {/* Formulaire */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                            disabled={isRateLimited}
                            className="w-full bg-[#f7f8fc] rounded-xl px-4 py-3.5 text-sm md:text-[15px] text-[#1b1b1f] placeholder:text-slate-300 border border-transparent focus:bg-white focus:border-[#9cb5ff] focus:ring-0 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <FormLabel className="block text-[11px] uppercase tracking-wide font-bold text-[#1b1b1f] mb-2 ml-1">
                          Mot de passe
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              disabled={isRateLimited}
                              className="w-full bg-[#f7f8fc] rounded-xl px-4 py-3.5 pr-12 text-sm md:text-[15px] text-[#1b1b1f] placeholder:text-slate-300 border border-transparent focus:bg-white focus:border-[#9cb5ff] focus:ring-0 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-3 flex items-center text-[11px] text-[#6e6e73] hover:text-[#1b1b1f] transition-colors"
                            >
                              {showPassword ? 'Masquer' : 'Afficher'}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between text-sm mt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-[#9cb5ff] focus:ring-[#9cb5ff]"
                      />
                      <span className="text-[#6e6e73] text-[13px] md:text-sm">
                        Se souvenir de moi
                      </span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[13px] md:text-sm text-[#9cb5ff] hover:text-[#8ca5ef] transition-colors font-medium"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || isRateLimited}
                    className="w-full bg-[#9cb5ff] hover:bg-[#8ca5ef] text-white py-3.5 rounded-[10px] text-[15px] md:text-[16px] font-semibold transition-colors shadow-md hover:shadow-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Connexion en cours...
                      </div>
                    ) : isRateLimited ? (
                      `Attendez ${rateLimitState.retryAfter}s`
                    ) : (
                      'Se connecter'
                    )}
                  </button>
                </form>
              </Form>

              {/* Lien vers register */}
              <div className="mt-6 text-center">
                <p className="text-sm md:text-[15px] text-[#6e6e73]">
                  Pas encore de compte ?{' '}
                  <Link
                    to="/register"
                    className="text-[#9cb5ff] hover:text-[#8ca5ef] font-semibold transition-colors"
                  >
                    S&apos;inscrire
                  </Link>
                </p>
              </div>
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
