import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, UserPlus, Sparkles, Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { GoogleButton } from '@/components/ui/GoogleButton';
import { useAuthContext } from '@/contexts/AuthContext';
import { RegisterRequest } from '@/types/auth';

const registerSchema = z.object({
  email: z.string().email('Email non valide'),
  username: z.string().min(2, 'Le nom d\'utilisateur doit contenir au moins 2 caractères'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string().min(1, 'Veuillez confirmer votre mot de passe'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type RegisterFormData = RegisterRequest & { confirmPassword: string };

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, isLoading } = useAuthContext();
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

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      
      // Petit délai pour permettre à l'état d'authentification de se propager
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    } catch (error) {
      // L'erreur est déjà gérée dans le hook useAuth
    }
  };

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
            <h2 className="text-3xl font-bold text-foreground mb-2">Rejoignez-nous !</h2>
            <p className="text-muted-foreground">Créez votre compte et découvrez nos analyses IA</p>
          </div>

          <Card className="shadow-sm border border-border bg-card">
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-medium">Email</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                            <Input
                              placeholder="votre@email.com"
                              className="pl-12 py-3 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all durée-200 bg-card text-foreground"
                              {...field}
                            />
                          </div>
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
                        <FormLabel className="text-foreground font-medium">Nom d'utilisateur</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                            <Input
                              placeholder="Votre nom d'utilisateur"
                              className="pl-12 py-3 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all durée-200 bg-card text-foreground"
                              {...field}
                            />
                          </div>
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
                        <FormLabel className="text-foreground font-medium">Mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Minimum 6 caractères"
                              className="pl-12 pr-12 py-3 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-card text-foreground"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
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
                        <FormLabel className="text-foreground font-medium">Confirmer le mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                            <Input
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Confirmez votre mot de passe"
                              className="pl-12 pr-12 py-3 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-card text-foreground"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 font-medium transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Création du compte...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Créer mon compte
                      </div>
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Ou</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <GoogleButton isLoading={isLoading} />
              </div>

              <div className="mt-8 text-center">
                <p className="text-muted-foreground">
                  Déjà un compte ?{' '}
                  <Link
                    to="/login"
                    className="text-foreground hover:text-foreground font-medium hover:underline transition-colors"
                  >
                    Se connecter
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 Virail Studio. Tous droits réservés.</p>
          </div>
        </div>
      </div>

      {/* Section droite - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-card p-12 flex-col justify-between relative overflow-hidden border-l border-border">
        <div className="absolute inset-0 bg-muted/20"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <img 
              src="/LOGO BLEU FOND TRANSPARENT (1).png" 
              alt="BPC Logo" 
              className="h-12 w-auto"
            />
            <h1 className="text-2xl font-bold text-foreground">Virail Studio</h1>
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4 leading-tight">
            Commencez votre
            <br />
            analyse dès aujourd'hui
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Rejoignez des milliers d'entreprises qui utilisent notre plateforme pour optimiser leur stratégie concurrentielle.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4 text-foreground/90">
            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
            <span>Accès gratuit à votre première analyse</span>
          </div>
          <div className="flex items-center gap-4 text-foreground/90">
            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>Tableaux de bord personnalisés</span>
          </div>
          <div className="flex items-center gap-4 text-foreground/90">
            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
              <Shield className="w-4 w-4" />
            </div>
            <span>Vos données sont protégées et sécurisées</span>
          </div>
        </div>
      </div>
    </div>
  );
}