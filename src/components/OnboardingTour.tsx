import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import '@/styles/onboarding-tour.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOnboarding } from '@/hooks/useOnboarding';

interface OnboardingTourProps {
  enabled: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

/**
 * Composant qui gère le tour guidé interactif avec Driver.js
 * Remplace ou complémente l'onboarding modal pour un tour plus interactif
 */
export function OnboardingTour({ enabled, onComplete, onSkip }: OnboardingTourProps) {
  const driverObjRef = useRef<any>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { status, completeStep, completeOnboarding, skipOnboarding } = useOnboarding();

  useEffect(() => {
    if (!enabled) return;

    // Fonction helper pour retirer la classe welcome
    const removeWelcomeClass = () => {
      const selectors = [
        '.driver-popover',
        '.driverjs-theme',
        '[class*="driver-popover"]'
      ];
      selectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          element.classList.remove('driver-popover-welcome');
        }
      });
    };

      // Fonction pour démarrer le tour
      const startTour = () => {
      // Vérifier que tous les éléments existent avant de démarrer
      const verifySteps = () => {
        const requiredElements = [
          '[data-sidebar="sidebar"]',
          '[data-onboarding="menu-item-analyses-geo"]',
          '[data-onboarding="menu-item-analyse-concurrentielle"]',
          '[data-onboarding="menu-item-sites-optimisation"]',
          '[data-onboarding="menu-item-plans-tarifs"]',
          '[data-onboarding="menu-item-profile"]',
          '[data-onboarding="menu-item-aide"]',
          '[data-onboarding="quick-actions"]',
          '[data-onboarding="new-analysis-btn"]',
          '[data-onboarding="competitor-analysis-btn"]'
        ];
        
        const missingElements: string[] = [];
        requiredElements.forEach(selector => {
          const element = document.querySelector(selector);
          if (!element) {
            missingElements.push(selector);
          }
        });
        
        if (missingElements.length > 0) {
          console.warn('OnboardingTour: Éléments manquants:', missingElements);
        }
        
        return missingElements.length === 0;
      };

      // Définir les steps avant de créer le driver pour pouvoir les référencer
      const stepsDefinition = [
        // Étape 1: Bienvenue (centré sur la page)
        {
          element: 'body',
          popover: {
            title: '👋 Bienvenue chez Virail !',
            description: 'Virail est votre plateforme d\'analyse et d\'optimisation GEO (Generative Engine Optimization).\n\nVirail se spécialise dans le GEO pour optimiser votre site pour les moteurs génératifs et les LLM.\n\n✨ Avec Virail, vous pouvez :\n\n• Analyser votre site avec des audits GEO complets\n  (technique, textuel, performance)\n\n• Identifier et analyser vos concurrents\n  avec des scores de similarité\n\n• Obtenir des recommandations d\'optimisation\n  personnalisées générées par LLM\n\n• Améliorer votre visibilité dans les résultats\n  des moteurs génératifs (ChatGPT, Perplexity, etc.)\n\n👉 Prenez votre temps pour lire, puis cliquez sur "Suivant" quand vous êtes prêt !',
            side: 'left' as const,
            align: 'center' as const,
          },
          onHighlightStarted: () => {
            // Ajouter la classe spéciale pour la première étape (bienvenue)
            // Utiliser plusieurs tentatives car le DOM peut ne pas être prêt immédiatement
            const addWelcomeClass = () => {
              const popover = document.querySelector('.driver-popover') || 
                             document.querySelector('.driverjs-theme') ||
                             document.querySelector('[class*="driver-popover"]');
              if (popover) {
                popover.classList.add('driver-popover-welcome');
                // S'assurer qu'aucun timeout automatique ne ferme le popover
                // Le tour attendra indéfiniment jusqu'à ce que l'utilisateur clique
                return true;
              }
              return false;
            };
            
            // Essayer immédiatement
            if (!addWelcomeClass()) {
              // Réessayer après un court délai
              setTimeout(() => {
                if (!addWelcomeClass()) {
                  setTimeout(addWelcomeClass, 100);
                }
              }, 50);
            }
          },
        },
        // Étape 2: Sidebar (menu de navigation)
        {
          element: '[data-sidebar="sidebar"]',
          popover: {
            title: 'Votre menu de navigation',
            description: 'Utilisez le menu latéral pour accéder aux différentes fonctionnalités de Virail.\n\nDécouvrons chaque élément du menu ensemble !',
            side: 'right' as const,
            align: 'start' as const,
          },
          onHighlightStarted: () => {
            // S'assurer qu'on est sur la page d'accueil pour voir la sidebar
            // Ne naviguer que si nécessaire pour éviter les re-renders
            if (location.pathname !== '/') {
              // Utiliser un délai pour éviter les conflits avec Driver.js
              setTimeout(() => {
                navigate('/', { replace: true });
              }, 100);
            }
            // Retirer la classe welcome
            setTimeout(removeWelcomeClass, 50);
          },
        },
        // Étape 3: Analyses GEO
        {
          element: '[data-onboarding="menu-item-analyses-geo"]',
          popover: {
            title: 'Analyses GEO',
            description: 'Accédez à toutes vos analyses GEO (Generative Engine Optimization).\n\nVous pouvez :\n• Consulter vos analyses existantes\n• Voir les résultats de vos audits\n  (technique, textuel, performance)\n• Accéder aux recommandations LLM\n  personnalisées\n• Suivre l\'évolution de vos optimisations\n\nLes analyses GEO vous aident à optimiser votre site pour les moteurs génératifs comme ChatGPT, Perplexity, etc.',
            side: 'right' as const,
            align: 'start' as const,
          },
          onHighlightStarted: () => {
            // Vérifier que l'élément existe et est visible
            const element = document.querySelector('[data-onboarding="menu-item-analyses-geo"]');
            if (!element) {
              console.warn('OnboardingTour: Élément menu-item-analyses-geo non trouvé');
            }
            // S'assurer qu'on est sur la page d'accueil
            if (location.pathname !== '/') {
              setTimeout(() => {
                navigate('/', { replace: true });
              }, 100);
            }
            // Retirer la classe welcome
            setTimeout(removeWelcomeClass, 50);
          },
        },
        // Étape 4: Analyse concurrentielle
        {
          element: '[data-onboarding="menu-item-analyse-concurrentielle"]',
          popover: {
            title: 'Analyse concurrentielle',
            description: 'Identifiez et analysez vos concurrents dans les résultats des moteurs génératifs.\n\nFonctionnalités :\n• Identification automatique de vos concurrents\n• Scores de similarité et positionnement\n• Analyses LLM détaillées de vos concurrents\n• Comparaison de stratégies GEO\n\nComprenez votre positionnement et optimisez votre stratégie pour surpasser vos concurrents.',
            side: 'right' as const,
            align: 'start' as const,
          },
          onHighlightStarted: () => {
            // S'assurer qu'on est sur la page d'accueil
            if (location.pathname !== '/') {
              setTimeout(() => {
                navigate('/', { replace: true });
              }, 100);
            }
            // Retirer la classe welcome
            setTimeout(removeWelcomeClass, 50);
          },
        },
        // Étape 5: Sites pour optimisation
        {
          element: '[data-onboarding="menu-item-sites-optimisation"]',
          popover: {
            title: 'Sites pour optimisation',
            description: 'Gérez vos sites et suivez vos optimisations textuelles pour les LLM.\n\nVous pouvez :\n• Ajouter et gérer vos sites web\n• Suivre les optimisations textuelles appliquées\n• Consulter l\'historique des modifications\n• Monitorer l\'impact de vos optimisations\n\n💡 Centralisez la gestion de tous vos sites et leurs optimisations GEO.',
            side: 'right' as const,
            align: 'start' as const,
          },
          onHighlightStarted: () => {
            // S'assurer qu'on est sur la page d'accueil
            if (location.pathname !== '/') {
              setTimeout(() => {
                navigate('/', { replace: true });
              }, 100);
            }
            // Retirer la classe welcome
            setTimeout(removeWelcomeClass, 50);
          },
        },
        // Étape 6: Plans & Tarifs
        {
          element: '[data-onboarding="menu-item-plans-tarifs"]',
          popover: {
            title: 'Plans & Tarifs',
            description: 'Consultez vos quotas d\'analyses et gérez votre abonnement.\n\nInformations disponibles :\n• Votre plan actuel et ses fonctionnalités\n• Vos quotas d\'analyses restantes\n• Historique de vos paiements\n• Options de mise à niveau\n\nGérez votre abonnement et suivez votre consommation d\'analyses.',
            side: 'right' as const,
            align: 'start' as const,
          },
          onHighlightStarted: () => {
            // S'assurer qu'on est sur la page d'accueil
            if (location.pathname !== '/') {
              setTimeout(() => {
                navigate('/', { replace: true });
              }, 100);
            }
            // Retirer la classe welcome
            setTimeout(removeWelcomeClass, 50);
          },
        },
        // Étape 7: Profile
        {
          element: '[data-onboarding="menu-item-profile"]',
          popover: {
            title: 'Profile',
            description: 'Gérez vos paramètres et préférences personnelles.\n\nVous pouvez :\n• Modifier vos informations personnelles\n• Changer votre mot de passe\n• Configurer vos préférences\n• Gérer vos notifications\n\nPersonnalisez votre expérience sur Virail selon vos besoins.',
            side: 'right' as const,
            align: 'start' as const,
          },
          onHighlightStarted: () => {
            // S'assurer qu'on est sur la page d'accueil
            if (location.pathname !== '/') {
              setTimeout(() => {
                navigate('/', { replace: true });
              }, 100);
            }
            // Retirer la classe welcome
            setTimeout(removeWelcomeClass, 50);
          },
        },
        // Étape 8: Aide
        {
          element: '[data-onboarding="menu-item-aide"]',
          popover: {
            title: 'Aide',
            description: 'Accédez à l\'aide et au support.\n\nRessources disponibles :\n• Documentation complète\n• FAQ et guides\n• Support technique\n• Tutoriels et exemples\n\nBesoin d\'aide ? Consultez notre documentation ou contactez notre support.',
            side: 'right' as const,
            align: 'start' as const,
          },
          onHighlightStarted: () => {
            // S'assurer qu'on est sur la page d'accueil
            if (location.pathname !== '/') {
              setTimeout(() => {
                navigate('/', { replace: true });
              }, 100);
            }
            // Retirer la classe welcome
            setTimeout(removeWelcomeClass, 50);
          },
        },
        // Étape 9: Tableau de bord - Actions rapides
        {
          element: '[data-onboarding="quick-actions"]',
          popover: {
            title: 'Votre tableau de bord',
            description: 'Votre tableau de bord est votre centre de contrôle.\n\nIci, vous pouvez :\n• Voir vos analyses récentes\n• Consulter vos statistiques\n• Accéder aux actions rapides\n• Suivre vos optimisations\n\n👉 Commençons par créer votre première analyse !',
            side: 'bottom' as const,
            align: 'start' as const,
          },
          onHighlightStarted: () => {
            // S'assurer qu'on est sur la page d'accueil
            if (location.pathname !== '/') {
              setTimeout(() => {
                navigate('/', { replace: true });
              }, 100);
            }
            // Retirer la classe welcome
            setTimeout(removeWelcomeClass, 50);
          },
        },
        // Étape 10: Bouton Analyser un nouveau site
        {
          element: '[data-onboarding="new-analysis-btn"]',
          popover: {
            title: 'Lancer une analyse GEO',
            description: 'Cliquez ici pour créer votre première analyse GEO (Generative Engine Optimization).\n\nPour lancer une analyse GEO :\n1️⃣ Entrez l\'URL de votre site web\n2️⃣ Activez l\'optimisation automatique pour obtenir des recommandations LLM personnalisées\n3️⃣ Cliquez sur "Lancer l\'analyse"\n4️⃣ Consultez les résultats : audit technique, analyse textuelle, plan d\'action GEO, et recommandations d\'optimisation\n\n💡 Astuce : L\'optimisation automatique utilise des LLM pour générer des recommandations spécifiques à votre site et améliorer votre visibilité dans les moteurs génératifs (ChatGPT, Perplexity, etc.).',
            side: 'top' as const,
            align: 'start' as const,
          },
          onHighlightStarted: () => {
            // S'assurer qu'on est sur la page d'accueil
            if (location.pathname !== '/') {
              setTimeout(() => {
                navigate('/', { replace: true });
              }, 100);
            }
            // Retirer la classe welcome
            setTimeout(removeWelcomeClass, 50);
          },
        },
        // Étape 11: Bouton Analyse concurrentielle
        {
          element: '[data-onboarding="competitor-analysis-btn"]',
          popover: {
            title: 'Lancer une analyse concurrentielle',
            description: 'Identifiez et analysez vos concurrents pour améliorer votre positionnement dans les moteurs génératifs.\n\nPour lancer une analyse concurrentielle :\n1️⃣ Entrez l\'URL de votre site\n2️⃣ Configurez les paramètres (score minimum, nombre de mentions)\n3️⃣ Cliquez sur "Lancer l\'analyse"\n4️⃣ Consultez les résultats : liste de concurrents, scores de similarité, analyses LLM détaillées\n\n💡 Astuce : Cette analyse utilise l\'IA pour identifier vos concurrents et analyser leurs forces et faiblesses dans les résultats des moteurs génératifs, vous aidant à comprendre votre positionnement et à optimiser votre stratégie GEO.',
            side: 'top' as const,
            align: 'start' as const,
          },
          onHighlightStarted: () => {
            // S'assurer qu'on est sur la page d'accueil
            if (location.pathname !== '/') {
              setTimeout(() => {
                navigate('/', { replace: true });
              }, 100);
            }
            // Retirer la classe welcome
            setTimeout(removeWelcomeClass, 50);
          },
        },
        ];

      // Initialiser Driver.js avec configuration personnalisée
      const driverObj = driver({
        showProgress: true,
        showButtons: ['next', 'previous', 'close'],
        allowClose: true,
        overlayColor: '#000000',
        overlayOpacity: 0.75,
        stagePadding: 4,
        stageRadius: 8,
        popoverClass: 'driverjs-theme',
        popoverOffset: 10,
        // Désactiver le passage automatique - l'utilisateur doit cliquer sur "Suivant"
        allowKeyboardControl: false, // Désactiver la navigation clavier pour éviter l'avance automatique
        animate: true,
        smoothScroll: true, // Activer le scroll pour s'assurer que les éléments sont visibles
        disableActiveInteraction: false, // Permettre l'interaction avec les éléments actifs
        // IMPORTANT: S'assurer qu'il n'y a pas de timeout automatique
        steps: stepsDefinition,
        // Ne pas utiliser de callbacks globaux qui pourraient interférer avec ceux des étapes
        // Les callbacks sont définis dans chaque étape individuellement
        onDestroyStarted: (element, step, options) => {
          // Quand l'utilisateur ferme le tour explicitement (bouton fermer)
          console.log('OnboardingTour: Tour fermé par l\'utilisateur', { element, step, options });
          // S'assurer que c'est bien une action utilisateur et pas une fermeture automatique
          if (onSkip) {
            onSkip();
          }
        },
        onDestroyed: (element, step, options) => {
          // Tour terminé (seulement si l'utilisateur a cliqué sur "Suivant" jusqu'à la fin)
          console.log('OnboardingTour: Tour terminé', { element, step, options });
          // Vérifier que le tour s'est bien terminé naturellement (dernière étape)
          if (onComplete) {
            onComplete();
          }
        },
        // Callback pour empêcher la fermeture automatique lors d'un clic en dehors
        onDeselected: (element, step, options) => {
          // Ne rien faire - empêcher toute action automatique lors de la désélection
          console.log('OnboardingTour: Élément désélectionné', { element, step, options });
        },
      });

      driverObjRef.current = driverObj;

      // Vérifier les éléments avant de démarrer
      if (!verifySteps()) {
        console.warn('OnboardingTour: Certains éléments sont manquants, le tour peut avoir des problèmes');
        // Attendre un peu plus pour que les éléments se chargent
        setTimeout(() => {
          // Vérifier à nouveau que l'onboarding est toujours activé
          if (!enabled) {
            console.log('OnboardingTour: Tour désactivé avant le démarrage après vérification');
            return;
          }
          if (verifySteps()) {
            console.log('OnboardingTour: Démarrage du tour après vérification des éléments');
            driverObj.drive();
          } else {
            console.error('OnboardingTour: Impossible de démarrer le tour, éléments manquants');
            // Démarrer quand même - Driver.js gérera les éléments manquants
            driverObj.drive();
          }
        }, 500);
      } else {
        // Démarrer le tour - l'utilisateur devra cliquer sur "Suivant" pour passer à l'étape suivante
        console.log('OnboardingTour: Démarrage du tour - le tour attendra un clic utilisateur à chaque étape');
        driverObj.drive();
        
        // Protection supplémentaire : vérifier que le tour est toujours actif après le démarrage
        setTimeout(() => {
          if (driverObjRef.current && enabled) {
            // Le tour est actif et attend un clic utilisateur
            console.log('OnboardingTour: Tour actif et en attente d\'interaction utilisateur');
          }
        }, 1000);
      }
    };

    // Vérifier que les éléments du DOM sont présents avant de démarrer
    const checkElements = () => {
      const sidebar = document.querySelector('[data-sidebar="sidebar"]');
      const quickActions = document.querySelector('[data-onboarding="quick-actions"]');
      // Si les éléments ne sont pas encore présents, attendre un peu plus
      if (!sidebar || !quickActions) {
        return false;
      }
      return true;
    };

    // Attendre que les éléments soient rendus dans le DOM + laisser le temps à l'utilisateur de voir la page
    // Délai de 10 secondes pour que l'utilisateur ait le temps de voir la page avant le tour
    const timer = setTimeout(() => {
      // Vérifier que l'onboarding est toujours activé avant de démarrer
      if (!enabled) {
        console.log('OnboardingTour: Tour désactivé avant le démarrage');
        return;
      }

      // Vérifier les éléments avant de démarrer
      if (!checkElements()) {
        // Réessayer après 2 secondes supplémentaires
        retryTimerRef.current = setTimeout(() => {
          if (!enabled) {
            console.log('OnboardingTour: Tour désactivé pendant la vérification');
            return;
          }
          if (!checkElements()) {
            console.warn('OnboardingTour: Some elements not found, starting anyway');
          }
          startTour();
          retryTimerRef.current = null;
        }, 2000);
        return;
      }

      startTour();
    }, 10000); // Attendre 10 secondes pour que l'utilisateur ait le temps de voir la page avant le tour

    // Cleanup
    return () => {
      clearTimeout(timer);
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (driverObjRef.current) {
        driverObjRef.current.destroy();
      }
    };
  }, [enabled, navigate, location.pathname, onComplete, onSkip]);

  return null; // Ce composant ne rend rien visuellement
}

