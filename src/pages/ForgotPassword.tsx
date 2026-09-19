import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AuthService } from '@/services/authService';
import { ArrowLeft, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

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
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md mx-auto">
            <Card className="rounded-2xl shadow-xl border-border bg-card">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
                  Email envoyé !
                </h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Nous avons envoyé un lien de réinitialisation à votre adresse email.
                </p>

                <Alert className="mb-6 text-left border-border">
                  <Mail className="h-4 w-4" />
                  <AlertDescription className="text-xs text-muted-foreground">
                    Vérifiez votre boîte de réception et votre dossier spam. Le lien de réinitialisation expire dans 1 heure.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button
                    onClick={() => navigate('/login')}
                    className="w-full h-11"
                  >
                    Retour à la connexion
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEmailSent(false);
                      setEmail('');
                    }}
                    className="w-full h-11"
                  >
                    Envoyer un nouvel email
                  </Button>
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
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md mx-auto">
          <Card className="rounded-2xl shadow-xl border-border bg-card">
            <CardContent className="p-6 sm:p-8">
              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
                  Mot de passe oublié ?
                </h1>
                <p className="text-sm text-muted-foreground">
                  Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-foreground">
                    Adresse email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p className="font-medium">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full h-11 font-semibold mt-4"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    'Envoyer le lien de réinitialisation'
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

export default ForgotPassword;
