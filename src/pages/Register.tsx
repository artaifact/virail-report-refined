import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, CheckCircle, Clock } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [countdown, setCountdown] = useState(5);
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
    try {
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      
      // Afficher le message de succès
      setShowSuccessMessage(true);
      setCountdown(5);
      
      // Réinitialiser le formulaire
      form.reset();
    } catch (error) {
      // L'erreur est déjà gérée dans le hook useAuth
      setShowSuccessMessage(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex flex-col">
      {/* Header - Logo en haut */}
      <header className="w-full px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <img 
            src="/LOGO BLEU FOND TRANSPARENT (1).png" 
            alt="Virail Logo" 
            className="h-12 w-auto"
          />
        </div>
      </header>

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
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-blue-900">
                      <p className="font-medium mb-2">Votre compte est en attente d'approbation par un administrateur.</p>
                      <p className="text-sm">Vous recevrez un email lorsque votre compte sera approuvé.</p>
                    </AlertDescription>
                  </Alert>
                  <div className="mt-6 p-4 bg-[#f7f8fc] rounded-lg">
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
                          <FormLabel className="block text-[11px] uppercase tracking-wide font-bold text-[#1b1b1f] mb-2 ml-1">
                            Mot de passe
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="w-full bg-[#f7f8fc] rounded-xl px-4 py-3.5 pr-12 text-sm md:text-[15px] text-[#1b1b1f] placeholder:text-slate-300 border border-transparent focus:bg-white focus:border-[#9cb5ff] focus:ring-0 outline-none transition-all"
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
                      disabled={isLoading}
                      className="w-full bg-[#9cb5ff] hover:bg-[#8ca5ef] text-white py-3.5 rounded-[10px] text-[15px] md:text-[16px] font-semibold transition-colors shadow-md hover:shadow-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Création du compte...
                        </div>
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
  );
}
