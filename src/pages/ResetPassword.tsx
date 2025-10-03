import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AuthService } from '@/services/authService';
import { ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle, Mail, Lock } from 'lucide-react';

const ResetPassword: React.FC = () => {
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
    console.log('🔍 Token extrait de l\'URL:', tokenParam);
    console.log('🔍 URL complète:', window.location.href);
    console.log('🔍 Search params:', Object.fromEntries(searchParams.entries()));
    
    if (!tokenParam) {
      setError('Token de réinitialisation manquant ou invalide');
      return;
    }
    setToken(tokenParam);
  }, [searchParams]);

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      errors: [
        { condition: password.length >= minLength, message: `Au moins ${minLength} caractères` },
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
      console.log('🔄 Tentative de réinitialisation avec token:', token);
      console.log('🔄 Nouveau mot de passe:', password);
      
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

  if (isSuccess) {
    return (
      <div className="min-h-screen flex">
        {/* Section gauche - Formulaire */}
        <div className="flex-1 flex items-center justify-center p-8 bg-neutral-50">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                <img 
                  src="/LOGO BLEU FOND TRANSPARENT (1).png" 
                  alt="BPC Logo" 
                  className="h-12 w-auto"
                />
                <h1 className="text-2xl font-bold text-gray-900">Virail Studio</h1>
              </div>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Mot de passe réinitialisé !</h2>
              <p className="text-gray-600">Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.</p>
            </div>

            <Card className="shadow-sm border border-neutral-200 bg-white">
              <CardContent className="p-8">
                <Button 
                  onClick={() => navigate('/login')} 
                  className="w-full bg-neutral-800 hover:bg-neutral-900 text-white py-3 font-medium transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Se connecter
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section droite - Informations */}
        <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-neutral-800 to-neutral-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-800/90 to-neutral-900/90" />
          <div className="relative z-10 flex flex-col justify-center p-12 text-white">
            <div className="mb-8">
              <h3 className="text-4xl font-bold mb-4">Réinitialisation réussie</h3>
              <p className="text-xl text-white/90 leading-relaxed">
                Félicitations ! Votre mot de passe a été mis à jour avec succès. 
                Vous pouvez maintenant accéder à toutes vos analyses en toute sécurité.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 text-white/90">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span>Mot de passe sécurisé mis à jour</span>
              </div>
              <div className="flex items-center gap-4 text-white/90">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <span>Accès immédiat à vos analyses</span>
              </div>
              <div className="flex items-center gap-4 text-white/90">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                <span>Retour à votre tableau de bord</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex">
        {/* Section gauche - Formulaire */}
        <div className="flex-1 flex items-center justify-center p-8 bg-neutral-50">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                <img 
                  src="/LOGO BLEU FOND TRANSPARENT (1).png" 
                  alt="BPC Logo" 
                  className="h-12 w-auto"
                />
                <h1 className="text-2xl font-bold text-gray-900">Virail Studio</h1>
              </div>
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Lien invalide</h2>
              <p className="text-gray-600">Ce lien de réinitialisation est invalide ou a expiré.</p>
            </div>

            <Card className="shadow-sm border border-neutral-200 bg-white">
              <CardContent className="p-8">
                <Button 
                  onClick={() => navigate('/forgot-password')} 
                  className="w-full bg-neutral-800 hover:bg-neutral-900 text-white py-3 font-medium transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Demander un nouveau lien
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section droite - Informations */}
        <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-neutral-800 to-neutral-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-800/90 to-neutral-900/90" />
          <div className="relative z-10 flex flex-col justify-center p-12 text-white">
            <div className="mb-8">
              <h3 className="text-4xl font-bold mb-4">Lien expiré</h3>
              <p className="text-xl text-white/90 leading-relaxed">
                Ce lien de réinitialisation n'est plus valide. 
                Demandez un nouveau lien pour réinitialiser votre mot de passe.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 text-white/90">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <span>Lien de sécurité expiré</span>
              </div>
              <div className="flex items-center gap-4 text-white/90">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <span>Nouveau lien par email</span>
              </div>
              <div className="flex items-center gap-4 text-white/90">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                <span>Processus sécurisé et rapide</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Section gauche - Formulaire */}
      <div className="flex-1 flex items-center justify-center p-8 bg-neutral-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
              <img 
                src="/LOGO BLEU FOND TRANSPARENT (1).png" 
                alt="BPC Logo" 
                className="h-12 w-auto"
              />
              <h1 className="text-2xl font-bold text-gray-900">Virail Studio</h1>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Nouveau mot de passe</h2>
            <p className="text-gray-600">Entrez votre nouveau mot de passe ci-dessous.</p>
          </div>

          <Card className="shadow-sm border border-neutral-200 bg-white">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">Nouveau mot de passe</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-neutral-700 transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Votre nouveau mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-12 pr-12 py-3 border-gray-200 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/20 transition-all duration-200 bg-white/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-neutral-700 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {/* Critères de validation du mot de passe */}
                  {password && (
                    <div className="space-y-1 text-xs">
                      {passwordValidation.errors.map((criterion, index) => (
                        <div 
                          key={index}
                          className={`flex items-center ${
                            criterion.condition ? 'text-green-600' : 'text-red-500'
                          }`}
                        >
                          <div className={`w-1 h-1 rounded-full mr-2 ${
                            criterion.condition ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          {criterion.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirmer le mot de passe</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-neutral-700 transition-colors" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirmez votre mot de passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-12 pr-12 py-3 border-gray-200 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/20 transition-all duration-200 bg-white/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-neutral-700 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {/* Indicateur de correspondance des mots de passe */}
                  {confirmPassword && (
                    <div className={`text-xs flex items-center ${
                      passwordsMatch ? 'text-green-600' : 'text-red-500'
                    }`}>
                      <div className={`w-1 h-1 rounded-full mr-2 ${
                        passwordsMatch ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      {passwordsMatch ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}
                    </div>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-neutral-800 hover:bg-neutral-900 text-white py-3 font-medium transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg"
                  disabled={isLoading || !passwordValidation.isValid || !passwordsMatch}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Réinitialisation en cours...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Réinitialiser le mot de passe
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link 
                  to="/login" 
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 transition-colors"
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
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-neutral-800 to-neutral-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800/90 to-neutral-900/90" />
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="mb-8">
            <h3 className="text-4xl font-bold mb-4">Sécurité renforcée</h3>
            <p className="text-xl text-white/90 leading-relaxed">
              Créez un mot de passe robuste pour protéger votre compte. 
              Utilisez une combinaison de lettres, chiffres et caractères spéciaux.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 text-white/90">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <span>Mot de passe sécurisé requis</span>
            </div>
            <div className="flex items-center gap-4 text-white/90">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
              <span>Validation en temps réel</span>
            </div>
            <div className="flex items-center gap-4 text-white/90">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
              <span>Confirmation de sécurité</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
