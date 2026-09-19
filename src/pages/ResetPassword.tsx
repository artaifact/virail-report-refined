import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useToast } from '@/hooks/use-toast';
import { AuthService } from '@/services/authService';
import { ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md mx-auto">
            <Card className="rounded-2xl shadow-xl border-border bg-card">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
                  Mot de passe réinitialisé !
                </h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.
                </p>

                <Button
                  onClick={() => navigate('/login')}
                  className="w-full h-11"
                >
                  Se connecter
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>

        <footer className="w-full px-6 py-4 text-center">
          <p className="text-xs text-muted-foreground">© 2025 Viraill. Tous droits réservés.</p>
        </footer>
      </div>
    );
  }

  // Token invalide
  if (!token) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md mx-auto">
            <Card className="rounded-2xl shadow-xl border-border bg-card">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
                  Lien invalide
                </h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Ce lien de réinitialisation est invalide ou a expiré.
                </p>

                <Button
                  onClick={() => navigate('/forgot-password')}
                  className="w-full h-11"
                >
                  Demander un nouveau lien
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>

        <footer className="w-full px-6 py-4 text-center">
          <p className="text-xs text-muted-foreground">© 2025 Viraill. Tous droits réservés.</p>
        </footer>
      </div>
    );
  }

  // Formulaire
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md mx-auto">
          <Card className="rounded-2xl shadow-xl border-border bg-card">
            <CardContent className="p-6 sm:p-8">
              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
                  Nouveau mot de passe
                </h1>
                <p className="text-sm text-muted-foreground">
                  Entrez votre nouveau mot de passe ci-dessous.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-semibold text-foreground">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Votre nouveau mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-1 h-full px-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  {password && (
                    <div className="space-y-1 text-xs mt-2">
                      {passwordValidation.errors.map((criterion, index) => (
                        <div
                          key={index}
                          className={`flex items-center text-xs ${criterion.condition ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${criterion.condition ? 'bg-emerald-500' : 'bg-destructive'}`} />
                          {criterion.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirmez votre mot de passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-1 h-full px-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  {confirmPassword && (
                    <div className={`text-xs flex items-center mt-2 ${passwordsMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-2 ${passwordsMatch ? 'bg-emerald-500' : 'bg-destructive'}`} />
                      {passwordsMatch ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p className="font-medium">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || !passwordValidation.isValid || !passwordsMatch}
                  className="w-full h-11 font-semibold mt-4"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Réinitialisation en cours...
                    </>
                  ) : (
                    'Réinitialiser le mot de passe'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm text-primary hover:underline font-medium"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Retour à la connexion
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="w-full px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground">© 2025 Viraill. Tous droits réservés.</p>
      </footer>
    </div>
  );
};

export default ResetPassword;
