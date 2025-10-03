import { useState, useEffect, useCallback } from 'react';
import { AuthService } from '@/services/authService';
import { apiService } from '@/services/apiService';
import { AuthState, LoginRequest, RegisterRequest, User } from '@/types/auth';
import { toast } from '@/hooks/use-toast';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialiser l'état d'authentification
  useEffect(() => {
    let cancelled = false;
    const initAuth = async () => {
      try {
        AuthService.init();
        const isAuthenticatedLocal = AuthService.isAuthenticated();

        // Hydrate depuis /auth/me-bearer si possible
        let userFromApi: any | null = null;
        try {
          userFromApi = await apiService.getMeBearer();
        } catch (e) {
          // silencieux si endpoint non dispo
          userFromApi = null;
        }

        const mergedUser = userFromApi ?? AuthService.getUser();
        const isAuthenticated = !!mergedUser || isAuthenticatedLocal;

        if (!cancelled) {
          setAuthState({
            user: mergedUser,
            isAuthenticated,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'authentification:', error);
        if (!cancelled) {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    };

    initAuth();
    return () => { cancelled = true };
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await AuthService.login(credentials);
      
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });

      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${response.user.username}!`,
      });

      return response;
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      const message = error instanceof Error ? error.message : 'Erreur de connexion';
      toast({
        title: "Erreur de connexion",
        description: message,
        variant: "destructive",
      });
      
      throw error;
    }
  }, []);

  const register = useCallback(async (userData: RegisterRequest) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await AuthService.register(userData);
      
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });

      toast({
        title: "Inscription réussie",
        description: `Bienvenue ${response.user.username}!`,
      });

      return response;
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      const message = error instanceof Error ? error.message : 'Erreur d\'inscription';
      toast({
        title: "Erreur d'inscription",
        description: message,
        variant: "destructive",
      });
      
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AuthService.logout();
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      toast({
        title: "Déconnexion",
        description: "Vous avez été déconnecté avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive",
      });
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      await AuthService.loginWithGoogle();
      // La redirection se fait automatiquement dans AuthService.loginWithGoogle()
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      const message = error instanceof Error ? error.message : 'Erreur de connexion Google';
      toast({
        title: "Erreur de connexion Google",
        description: message,
        variant: "destructive",
      });
      
      throw error;
    }
  }, []);

  const handleGoogleCallback = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await AuthService.handleGoogleCallback();
      
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });

      toast({
        title: "Connexion Google réussie",
        description: `Bienvenue ${response.user.username}!`,
      });

      return response;
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      const message = error instanceof Error ? error.message : 'Erreur de connexion Google';
      toast({
        title: "Erreur de connexion Google",
        description: message,
        variant: "destructive",
      });
      
      throw error;
    }
  }, []);

  const updateUser = useCallback((user: User) => {
    AuthService.saveUser(user);
    setAuthState(prev => ({ ...prev, user }));
  }, []);

  return {
    ...authState,
    login,
    register,
    logout,
    loginWithGoogle,
    handleGoogleCallback,
    updateUser,
  };
} 