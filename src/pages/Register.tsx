import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

      <div className="min-h-screen bg-background flex flex-col justify-between">
        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md mx-auto">
            <Card className="rounded-2xl shadow-xl border-border bg-card">
              <CardContent className="p-6 sm:p-8">
                {showSuccessMessage ? (
                  <div className="space-y-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-full mb-2">
                      <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Compte créé avec succès</h2>
                    <p className="text-sm text-muted-foreground">Vérifiez votre email et cliquez sur le lien pour activer votre compte.</p>
                    <div className="p-3 bg-muted/50 rounded-lg border border-border">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
                        <Clock className="h-4 w-4" />
                        <span>
                          Redirection vers la connexion dans {countdown} seconde{countdown > 1 ? 's' : ''}...
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate('/login', { replace: true })}
                      className="w-full h-11"
                    >
                      Aller à la page de connexion maintenant
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* En-tête */}
                    <div className="text-center mb-8">
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
                        Créer un compte
                      </h1>
                      <p className="text-sm text-muted-foreground">
                        Commencez votre optimisation IA-first dès aujourd&apos;hui
                      </p>
                    </div>

                    {/* Formulaire */}
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-semibold text-foreground">
                                Email
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="vous@entreprise.com"
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
                              <FormLabel className="text-xs font-semibold text-foreground">
                                Confirmer le mot de passe
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="h-11 pr-10"
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-1 h-full px-2.5 text-muted-foreground hover:text-foreground"
                                  >
                                    {showConfirmPassword ? (
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

                        <div className="flex items-start gap-2 text-xs pt-1">
                          <input
                            type="checkbox"
                            className="w-4 h-4 mt-0.5 rounded border-input text-primary focus:ring-primary"
                            required
                          />
                          <span className="text-muted-foreground">
                            J&apos;accepte les{' '}
                            <Link
                              to="/terms"
                              className="text-primary hover:underline font-medium"
                            >
                              conditions générales
                            </Link>{' '}
                            et la{' '}
                            <Link
                              to="/privacy"
                              className="text-primary hover:underline font-medium"
                            >
                              politique de confidentialité
                            </Link>
                          </span>
                        </div>

                        <Button
                          type="submit"
                          disabled={isLoading || isRateLimited || (passwordValidation ? !passwordValidation.isValid : false)}
                          className="w-full h-11 text-sm font-semibold mt-4"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Création du compte...
                            </>
                          ) : isRateLimited ? (
                            `Attendez ${rateLimitState.retryAfter}s`
                          ) : (
                            'Créer mon compte'
                          )}
                        </Button>
                      </form>
                    </Form>

                    {/* Lien vers login */}
                    <div className="mt-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        Déjà un compte ?{' '}
                        <Link
                          to="/login"
                          className="text-primary hover:underline font-semibold"
                        >
                          Se connecter
                        </Link>
                      </p>
                    </div>
                  </>
                )}
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

export { Register };
