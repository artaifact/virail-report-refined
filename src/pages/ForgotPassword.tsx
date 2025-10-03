import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AuthService } from '@/services/authService';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

const ForgotPassword: React.FC = () => {
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
      <div className="min-h-screen flex bg-background text-foreground">
        {/* Section gauche - Formulaire */}
        <div className="flex-1 flex items-center justify-center p-8 bg-background">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                <img 
                  src="/LOGO BLEU FOND TRANSPARENT (1).png" 
                  alt="BPC Logo" 
                  className="h-12 w-auto"
                />
                <h1 className="text-2xl font-bold text-foreground">Virail Studio</h1>
              </div>
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Email envoyé !</h2>
              <p className="text-muted-foreground">Nous avons envoyé un lien de réinitialisation à votre adresse email.</p>
            </div>

            <Card className="shadow-sm border border-border bg-card">
              <CardContent className="p-8">
                <Alert className="mb-6">
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Vérifiez votre boîte de réception et votre dossier spam. 
                    Le lien de réinitialisation expire dans 1 heure.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <Button 
                    onClick={() => navigate('/login')} 
                    className="w-full bg-neutral-800 hover:bg-neutral-900 text-foreground py-3 font-medium transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg"
                  >
                    Retour à la connexion
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEmailSent(false);
                      setEmail('');
                    }}
                    className="w-full border-border hover:bg-gray-50"
                  >
                    Envoyer un nouvel email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section droite - Informations */}
        <div className="hidden lg:flex lg:flex-1 bg-card relative overflow-hidden border-l border-border">
          <div className="absolute inset-0 bg-muted/20" />
          <div className="relative z-10 flex flex-col justify-center p-12 text-foreground">
            <div className="mb-8">
              <h3 className="text-4xl font-bold mb-4">Récupération de compte</h3>
              <p className="text-xl text-foreground/90 leading-relaxed">
                Un email de réinitialisation a été envoyé à votre adresse. 
                Suivez les instructions pour créer un nouveau mot de passe sécurisé.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 text-foreground/90">
                <div className="w-8 h-8 bg-card/10 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <span>Vérifiez votre boîte de réception</span>
              </div>
              <div className="flex items-center gap-4 text-foreground/90">
                <div className="w-8 h-8 bg-card/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span>Lien sécurisé et temporaire</span>
              </div>
              <div className="flex items-center gap-4 text-foreground/90">
                <div className="w-8 h-8 bg-card/10 rounded-lg flex items-center justify-center">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                <span>Retour facile à la connexion</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Section gauche - Formulaire */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
              <img 
                src="/LOGO BLEU FOND TRANSPARENT (1).png" 
                alt="BPC Logo" 
                className="h-12 w-auto"
              />
              <h1 className="text-2xl font-bold text-foreground">Virail Studio</h1>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Mot de passe oublié ?</h2>
            <p className="text-muted-foreground">Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.</p>
          </div>

          <Card className="shadow-sm border border-border bg-card">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">Adresse email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-neutral-700 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-12 py-3 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-card/50"
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-neutral-800 hover:bg-neutral-900 text-foreground py-3 font-medium transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg"
                  disabled={isLoading || !email}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Envoi en cours...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Envoyer le lien de réinitialisation
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link 
                  to="/login" 
                  className="inline-flex items-center text-sm text-primary hover:text-primary/90 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Retour à la connexion
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section droite - Informations */}
      <div className="hidden lg:flex lg:flex-1 bg-card relative overflow-hidden border-l border-border">
        <div className="absolute inset-0 bg-muted/20" />
        <div className="relative z-10 flex flex-col justify-center p-12 text-foreground">
          <div className="mb-8">
            <h3 className="text-4xl font-bold mb-4">Récupération sécurisée</h3>
            <p className="text-xl text-foreground/90 leading-relaxed">
              Pas de panique ! Nous vous aidons à récupérer l'accès à votre compte 
              de manière sécurisée et rapide.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 text-foreground/90">
              <div className="w-8 h-8 bg-card/10 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <span>Email de réinitialisation sécurisé</span>
            </div>
            <div className="flex items-center gap-4 text-foreground/90">
              <div className="w-8 h-8 bg-card/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
              <span>Processus simple et rapide</span>
            </div>
            <div className="flex items-center gap-4 text-foreground/90">
              <div className="w-8 h-8 bg-card/10 rounded-lg flex items-center justify-center">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span>Retour immédiat à vos analyses</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
