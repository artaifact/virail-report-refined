import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useOnboarding } from '@/hooks/useOnboarding';
import {
  CheckCircle,
  LayoutDashboard,
  Navigation,
  FileText,
  BarChart3,
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Target,
  Globe2,
  Settings,
  TrendingUp,
  Search,
  Users,
} from 'lucide-react';
import { OnboardingStep } from '@/types/onboarding';

interface OnboardingProps {
  open: boolean;
  onClose: () => void;
}

// Définition des étapes de l'onboarding
const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    step_number: 1,
    title: 'Bienvenue sur Viraill ! 🎉',
    description: 'Viraill est votre assistant intelligent pour analyser et optimiser votre présence géographique en ligne.',
    content: `
Découvrez comment :
• Analyser votre site web en profondeur
• Comparer avec vos concurrents
• Obtenir des recommandations personnalisées
• Suivre vos performances

Commençons par un tour rapide de la plateforme !
    `,
  },
  {
    id: 'dashboard',
    step_number: 2,
    title: 'Votre tableau de bord 📊',
    description: 'Votre tableau de bord est votre centre de contrôle.',
    content: `
Ici, vous pouvez :

📈 Voir vos analyses récentes
📊 Consulter vos statistiques
🎯 Accéder aux actions rapides
📋 Suivre vos optimisations

👉 Commençons par créer votre première analyse !
    `,
  },
  {
    id: 'navigation',
    step_number: 3,
    title: 'Naviguer dans Viraill 🧭',
    description: 'Utilisez le menu latéral pour accéder aux différentes fonctionnalités.',
    content: `
📊 Analyses GEO
   Analysez votre site web en profondeur avec des rapports détaillés

🏆 Analyse concurrentielle
   Comparez-vous à vos concurrents et identifiez vos forces et faiblesses

⚙️ Sites pour optimisation
   Gérez vos sites et suivez leurs optimisations

💳 Plans & Tarifs
   Consultez vos limites d'usage et gérez votre abonnement

👤 Profile
   Gérez vos paramètres et préférences
    `,
  },
  {
    id: 'analysis-geo',
    step_number: 4,
    title: 'Lancer une analyse GEO 🌐',
    description: 'Analysez votre site web en profondeur avec des rapports détaillés.',
    content: `
📋 Pour lancer une analyse GEO :

1️⃣ Accédez à "Analyses GEO" depuis le menu
2️⃣ Remplissez les champs requis :
   • URL du site (ex: example.com ou https://example.com)
   • Nom de l'analyse (optionnel, pour l'identifier)
   • Activez l'optimisation automatique (optionnel)
3️⃣ Cliquez sur "Lancer l'analyse"
4️⃣ Patientez quelques instants
5️⃣ Consultez les résultats détaillés :
   • Analyse technique
   • Analyse textuelle
   • Recommandations d'optimisation
   • Métriques de performance

💡 Astuce : L'optimisation automatique génère des recommandations personnalisées pour améliorer votre référencement local.
    `,
  },
  {
    id: 'analysis-competitor',
    step_number: 5,
    title: 'Lancer une analyse concurrentielle 🏆',
    description: 'Comparez-vous à vos concurrents et identifiez vos forces et faiblesses.',
    content: `
📋 Pour lancer une analyse concurrentielle :

1️⃣ Accédez à "Analyse concurrentielle" depuis le menu
2️⃣ Remplissez les champs requis :
   • URL de votre site (ex: example.com)
   • Score minimum (optionnel, défaut: 0.3)
   • Nombre minimum de mentions (optionnel, défaut: 1)
3️⃣ Cliquez sur "Lancer l'analyse"
4️⃣ Patientez quelques instants
5️⃣ Consultez les résultats :
   • Liste de vos concurrents identifiés
   • Scores de similarité
   • Analyse LLMO des concurrents
   • Points forts et faiblesses

💡 Astuce : Cette analyse vous aide à comprendre votre positionnement sur le marché et à identifier les opportunités d'amélioration.
    `,
  },
  {
    id: 'limits',
    step_number: 6,
    title: 'Vos limites d\'usage 📊',
    description: 'Viraill fonctionne avec un système de quotas pour chaque type d\'analyse.',
    content: `
✅ Analyses GEO : X analyses restantes
✅ Analyses concurrentielles : X analyses restantes

💳 Besoin de plus d'analyses ?
Consultez nos plans dans "Plans & Tarifs" pour augmenter vos limites et accéder à des fonctionnalités avancées.

✨ Vous êtes maintenant prêt à utiliser Viraill ! Explorez la plateforme à votre rythme.
    `,
  },
];

export function Onboarding({ open, onClose }: OnboardingProps) {
  const navigate = useNavigate();
  const { status, completeStep, completeOnboarding, skipOnboarding } = useOnboarding();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());
  const [timeSpentTotal, setTimeSpentTotal] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [userSiteUrl, setUserSiteUrl] = useState('');

  // Initialiser l'étape actuelle depuis le statut UNIQUEMENT au premier montage
  // Ne PAS réinitialiser quand le statut change après avoir complété une étape
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Charger l'URL depuis sessionStorage si elle existe (pour la réutiliser)
  useEffect(() => {
    const savedUrl = sessionStorage.getItem('onboarding-site-url');
    if (savedUrl) {
      setUserSiteUrl(savedUrl);
    }
  }, []);
  
  useEffect(() => {
    // Ne s'exécuter qu'une seule fois au montage initial
    if (hasInitialized) return;
    
    if (status) {
      let stepIndex = 0;
      
      // PRIORITÉ 1: Utiliser steps_completed pour déterminer l'étape actuelle
      // Si des étapes sont complétées, on devrait être à l'étape suivante
      if (status.steps_completed && status.steps_completed.length > 0) {
        const lastCompletedStepId = status.steps_completed[status.steps_completed.length - 1];
        const lastCompletedIndex = ONBOARDING_STEPS.findIndex(step => step.id === lastCompletedStepId);
        
        if (lastCompletedIndex !== -1) {
          // Si la dernière étape complétée existe, on devrait être à l'étape suivante
          // Mais seulement si ce n'est pas la dernière étape
          if (lastCompletedIndex < ONBOARDING_STEPS.length - 1) {
            stepIndex = lastCompletedIndex + 1;
          } else {
            // Toutes les étapes sont complétées
            stepIndex = ONBOARDING_STEPS.length - 1;
          }
        } else {
          // Étape complétée non trouvée, utiliser current_step
          stepIndex = Math.max(0, Math.min((status.current_step || 1) - 1, ONBOARDING_STEPS.length - 1));
        }
      } else {
        // Pas d'étapes complétées, utiliser current_step
        stepIndex = Math.max(0, Math.min((status.current_step || 1) - 1, ONBOARDING_STEPS.length - 1));
      }
      
      console.log('Initial step index:', stepIndex, 'from status:', {
        current_step: status.current_step,
        steps_completed: status.steps_completed
      });
      setCurrentStepIndex(stepIndex);
    }
    
    setHasInitialized(true);
  }, [status, hasInitialized]);

  // Réinitialiser le temps au changement d'étape
  useEffect(() => {
    setStepStartTime(Date.now());
  }, [currentStepIndex]);

  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === ONBOARDING_STEPS.length - 1;

  /**
   * Passer à l'étape suivante
   */
  const handleNext = async () => {
    if (!currentStep) return;

    // Pour les étapes d'analyse, vérifier que l'URL est remplie
    if ((currentStep.id === 'analysis-geo' || currentStep.id === 'analysis-competitor') && !userSiteUrl.trim()) {
      return; // Ne pas avancer si l'URL n'est pas remplie
    }

    // Sauvegarder l'URL dans sessionStorage à chaque étape pour la réutiliser
    if (userSiteUrl.trim()) {
      sessionStorage.setItem('onboarding-site-url', userSiteUrl.trim());
    }

    // Calculer le temps passé sur cette étape
    const timeSpent = Math.floor((Date.now() - stepStartTime) / 1000);
    setTimeSpentTotal((prev) => prev + timeSpent);

    try {
      if (isLastStep) {
        // Dernière étape : compléter l'onboarding
        const allStepsCompleted = ONBOARDING_STEPS.map((s) => s.id);
        const totalTime = timeSpentTotal + timeSpent;
        
        if (status) {
          await completeStep(currentStep.id, currentStep.step_number, timeSpent);
          await completeOnboarding(allStepsCompleted, totalTime);
        }
        onClose();
      } else {
        // Enregistrer l'étape complétée
        if (status) {
          // Appeler completeStep et utiliser la réponse pour déterminer l'étape suivante
          // On va passer à l'étape suivante manuellement après avoir complété
          await completeStep(currentStep.id, currentStep.step_number, timeSpent);
        }
        
        // Passer à l'étape suivante (même si l'API a échoué, on continue pour ne pas bloquer)
        const nextIndex = Math.min(currentStepIndex + 1, ONBOARDING_STEPS.length - 1);
        console.log('Moving to next step:', nextIndex, 'from current:', currentStepIndex);
        setCurrentStepIndex(nextIndex);
      }
    } catch (error) {
      console.error('Erreur lors du passage à l\'étape suivante:', error);
      // En cas d'erreur, continuer quand même pour ne pas bloquer l'utilisateur
      if (isLastStep) {
        onClose();
      } else {
        const nextIndex = Math.min(currentStepIndex + 1, ONBOARDING_STEPS.length - 1);
        console.log('Error occurred, moving to next step anyway:', nextIndex);
        setCurrentStepIndex(nextIndex);
      }
    }
  };

  /**
   * Retourner à l'étape précédente
   */
  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  /**
   * Ignorer l'onboarding
   */
  const handleSkip = async () => {
    if (isClosing) return; // Empêcher les clics multiples
    
    setIsClosing(true);
    console.log('handleSkip called');
    try {
      await skipOnboarding('user_choice');
      console.log('skipOnboarding completed, calling onClose');
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'ignorance de l\'onboarding:', error);
      // Fermer quand même le dialog même en cas d'erreur
      console.log('Closing dialog despite error');
      onClose();
    } finally {
      setIsClosing(false);
    }
  };


  // Ne pas afficher si on n'a pas de step actuel
  if (!currentStep) {
    return null;
  }
  
  // Si on n'a pas de statut mais qu'on affiche l'onboarding, utiliser des valeurs par défaut
  const effectiveStatus = status || {
    completed: false,
    current_step: 1,
    steps_completed: [],
    can_skip: true,
    onboarding_version: '1.0',
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        // Ne pas permettre la fermeture automatique - on contrôle via handleSkip
        if (!isOpen && !isClosing) {
          handleSkip();
        }
      }}
    >
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        hideCloseButton={true}
        onInteractOutside={(e) => {
          // Empêcher la fermeture par clic extérieur
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          // Gérer la fermeture par ESC
          e.preventDefault();
          if (!isClosing) {
            handleSkip();
          }
        }}
      >
        {/* Bouton de fermeture personnalisé - UNE SEULE CROIX */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isClosing) {
              handleSkip();
            }
          }}
          disabled={isClosing}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 z-50 h-8 w-8 flex items-center justify-center"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {currentStep.title}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>

        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Étape {currentStepIndex + 1} sur {ONBOARDING_STEPS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Contenu de l'étape */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Icône selon l'étape */}
              <div className="flex justify-center mb-4">
                {currentStep.id === 'welcome' && (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                )}
                {currentStep.id === 'dashboard' && (
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <LayoutDashboard className="h-8 w-8 text-blue-600" />
                  </div>
                )}
                {currentStep.id === 'navigation' && (
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <Navigation className="h-8 w-8 text-green-600" />
                  </div>
                )}
                {currentStep.id === 'analysis-geo' && (
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <Globe2 className="h-8 w-8 text-blue-600" />
                  </div>
                )}
                {currentStep.id === 'analysis-competitor' && (
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                )}
                {currentStep.id === 'limits' && (
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-orange-600" />
                  </div>
                )}
              </div>

              {/* Contenu textuel */}
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground bg-muted/50 p-4 rounded-lg">
                  {currentStep.content}
                </pre>
              </div>

              {/* Actions spécifiques pour certaines étapes */}
              {currentStep.id === 'analysis-geo' && (
                <div className="pt-4 border-t space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="site-url-geo">URL de votre site</Label>
                    <Textarea
                      id="site-url-geo"
                      placeholder="example.com ou https://example.com"
                      value={userSiteUrl}
                      onChange={(e) => {
                        const url = e.target.value;
                        setUserSiteUrl(url);
                        // Sauvegarder l'URL dans sessionStorage à chaque modification
                        if (url.trim()) {
                          sessionStorage.setItem('onboarding-site-url', url.trim());
                        }
                      }}
                      className="w-full min-h-[80px] resize-none"
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground">
                      Cette URL sera utilisée pour l'analyse GEO et l'analyse concurrentielle. L'URL sera automatiquement conservée pour l'étape suivante.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      // Stocker l'URL dans sessionStorage pour l'utiliser sur la page d'analyse
                      if (userSiteUrl.trim()) {
                        sessionStorage.setItem('onboarding-site-url', userSiteUrl.trim());
                      }
                      navigate('/analyses');
                      handleNext();
                    }}
                    className="w-full"
                    size="lg"
                    disabled={!userSiteUrl.trim()}
                  >
                    <Globe2 className="mr-2 h-4 w-4" />
                    Lancer une analyse GEO
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    {userSiteUrl.trim() 
                      ? 'Vous serez redirigé vers la page d\'analyse avec votre URL'
                      : 'Veuillez saisir l\'URL de votre site pour continuer'
                    }
                  </p>
                </div>
              )}

              {currentStep.id === 'analysis-competitor' && (
                <div className="pt-4 border-t space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="site-url-competitor">URL de votre site</Label>
                    <Textarea
                      id="site-url-competitor"
                      placeholder="example.com ou https://example.com"
                      value={userSiteUrl}
                      onChange={(e) => {
                        const url = e.target.value;
                        setUserSiteUrl(url);
                        // Sauvegarder l'URL dans sessionStorage à chaque modification
                        if (url.trim()) {
                          sessionStorage.setItem('onboarding-site-url', url.trim());
                        }
                      }}
                      className="w-full min-h-[80px] resize-none"
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground">
                      {userSiteUrl.trim() 
                        ? 'L\'URL de l\'étape précédente a été conservée. Vous pouvez la modifier si nécessaire.'
                        : 'Cette URL sera utilisée pour identifier vos concurrents. Si vous avez saisi une URL à l\'étape précédente, elle sera automatiquement remplie.'
                      }
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      // Stocker l'URL dans sessionStorage pour l'utiliser sur la page d'analyse concurrentielle
                      if (userSiteUrl.trim()) {
                        sessionStorage.setItem('onboarding-site-url', userSiteUrl.trim());
                      }
                      navigate('/competition');
                      handleNext();
                    }}
                    className="w-full"
                    size="lg"
                    variant="default"
                    disabled={!userSiteUrl.trim()}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Lancer une analyse concurrentielle
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    {userSiteUrl.trim()
                      ? 'Vous serez redirigé vers la page d\'analyse concurrentielle avec votre URL'
                      : 'Veuillez saisir l\'URL de votre site pour continuer'
                    }
                  </p>
                </div>
              )}

              {currentStep.id === 'limits' && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => {
                      navigate('/pricing');
                      handleNext();
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Découvrir les plans
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions de navigation */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex gap-2">
            {!isFirstStep && (
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Précédent
              </Button>
            )}
            <Button variant="ghost" onClick={handleSkip} disabled={isClosing}>
              Passer
            </Button>
          </div>

          <Button 
            onClick={handleNext} 
            size="lg"
            disabled={
              (currentStep.id === 'analysis-geo' || currentStep.id === 'analysis-competitor') 
              && !userSiteUrl.trim()
            }
          >
            {isLastStep ? (
              <>
                Terminer
                <CheckCircle className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Suivant
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

