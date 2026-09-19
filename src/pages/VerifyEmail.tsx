import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthService } from '@/services/authService';
import { CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-between">
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md mx-auto">
            <Card className="rounded-2xl shadow-xl border-border bg-card">
              <CardContent className="p-6 sm:p-8 text-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-6" />
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-2">
                  Vérification en cours...
                </h1>
                <p className="text-sm text-muted-foreground">
                  Veuillez patienter pendant que nous activons votre compte.
                </p>
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

  if (status === 'success') {
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
                  Email vérifié !
                </h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Votre adresse email a été confirmée avec succès. Vous pouvez maintenant vous connecter.
                </p>

                <Button
                  onClick={() => navigate('/login')}
                  className="w-full h-11"
                >
                  Retour à la connexion
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

  // Erreur
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
                {errorMessage}
              </p>

              <Button
                onClick={() => navigate('/login')}
                className="w-full h-11"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la connexion
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
};

export default VerifyEmail;
