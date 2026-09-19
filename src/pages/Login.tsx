import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthContext } from '@/contexts/AuthContext';
import { LoginRequest } from '@/types/auth';
import { RateLimitBanner } from '@/components/RateLimitBanner';
import { useRateLimit } from '@/hooks/useRateLimit';
import { Loader2, Eye, EyeOff } from 'lucide-react';

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

      <div className="min-h-screen bg-background flex flex-col justify-between">
        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md mx-auto">
            <Card className="rounded-2xl shadow-xl border-border bg-card">
              <CardContent className="p-6 sm:p-8">
                {/* En-tête */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
                    Se connecter
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Accédez à votre tableau de bord Viraill
                  </p>
                </div>

                {/* Formulaire */}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground">
                            Nom d'utilisateur
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Votre nom d'utilisateur"
                              disabled={isRateLimited}
                              className="h-11"
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
                          <FormLabel className="text-xs font-semibold text-foreground">
                            Mot de passe
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                disabled={isRateLimited}
                                className="h-11 pr-10"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-1 h-full px-2.5 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                        />
                        <span>Se souvenir de moi</span>
                      </label>
                      <Link
                        to="/forgot-password"
                        className="text-primary hover:underline font-medium"
                      >
                        Mot de passe oublié ?
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading || isRateLimited}
                      className="w-full h-11 text-sm font-semibold mt-4"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Connexion en cours...
                        </>
                      ) : isRateLimited ? (
                        `Attendez ${rateLimitState.retryAfter}s`
                      ) : (
                        'Se connecter'
                      )}
                    </Button>
                  </form>
                </Form>

                {/* Lien vers register */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Pas encore de compte ?{' '}
                    <Link
                      to="/register"
                      className="text-primary hover:underline font-semibold"
                    >
                      S&apos;inscrire
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full px-6 py-4 text-center">
          <p className="text-xs text-muted-foreground">© 2025 Viraill. Tous droits réservés.</p>
        </footer>
      </div>
    </>
  );
}

export { Login };
