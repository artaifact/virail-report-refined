import { LoginRequest, RegisterRequest, AuthResponse, User } from '@/types/auth';

// Configuration dynamique de l'URL de base selon l'environnement
// En production, utilise toujours VITE_API_BASE_URL ou l'URL de production par défaut
// Ne jamais utiliser localhost en production
const getApiBaseUrl = () => {
  // Si VITE_API_BASE_URL est défini, l'utiliser en priorité
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // Sinon, utiliser le mode pour déterminer l'URL par défaut
  const mode = import.meta.env.MODE || import.meta.env.NODE_ENV || 'development';
  if (mode === 'production' || import.meta.env.PROD) {
    return 'https://api.viraill.com';
  }
  // Mode développement par défaut
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';


const DEV_MODE = process.env.NODE_ENV === 'development';
const USE_CREDENTIALS = true;

// Autoriser le pilotage par env: VITE_AUTH_MODE=cookies|bearer|auto
const ENV_AUTH_MODE = (import.meta.env?.VITE_AUTH_MODE as 'cookies' | 'bearer' | 'auto' | undefined);
let AUTH_MODE: 'cookies' | 'bearer' | 'auto' = ENV_AUTH_MODE && ['cookies','bearer','auto'].includes(ENV_AUTH_MODE)
  ? ENV_AUTH_MODE
  : 'cookies';


let CORS_CREDENTIALS_SUPPORTED: boolean | null = null;

// In-memory token storage (not accessible via XSS unlike localStorage)
let _inMemoryAccessToken: string | null = null;
let _inMemoryRefreshToken: string | null = null;

export class AuthService {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_KEY = 'user';

  static init(): void {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      if (userStr && userStr.trim() !== '') {
        JSON.parse(userStr);
      }
      const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      if (token) _inMemoryAccessToken = token;
      const refToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      if (refToken) _inMemoryRefreshToken = refToken;
    } catch (error) {
      console.warn("Données d'authentification corrompues détectées, nettoyage...", error);
      this.clearAll();
    }
  }

  static clearAll(): void {
    this.clearTokens();
    this.clearUser();
  }

  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    if (process.env.NODE_ENV !== 'test') {
      await this.detectCorsSupport();
    }
    
    try {
      const response = await this.makeLoginRequest(credentials);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la connexion');
      }

      const data = await response.json();

      // Construire un user minimal
      const user: User = {
        id: String(credentials.username),
        email: credentials.username + '@example.com',
        username: credentials.username
      };
      
      // En mode Bearer, utiliser le token de la réponse
      const accessToken = data.access_token || data.token || 'httponly-cookie';
      const refreshToken = data.refresh_token || 'httponly-cookie';
      
      // Si on a un access_token JWT lisible, tenter d'extraire is_admin
      if (accessToken && accessToken !== 'httponly-cookie') {
        const payload = AuthService.decodeJwtPayload(accessToken);
        if (payload) {
          const isAdminFromJwt = Boolean(
            payload.is_admin || payload.isAdmin || (Array.isArray(payload.roles) && payload.roles.includes('admin'))
          );
          (user as any).is_admin = isAdminFromJwt;
        }
      }

      const authResponse: AuthResponse = {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: user
      };
      
      this.saveTokens(authResponse.access_token, authResponse.refresh_token);
      this.saveUser(authResponse.user);

      if (process.env.NODE_ENV !== 'test') {
        // Tentative d'enrichissement immédiat depuis /auth/me-bearer (repli /auth/me) pour récupérer is_admin en prod
        try {
          let meResp = await fetch(`${API_BASE_URL}/auth/me-bearer`, {
            method: 'GET',
            credentials: 'include',
            // Ne pas envoyer Content-Type pour GET
          });
          if (!meResp.ok) {
            // Repli cookies natifs
            meResp = await fetch(`${API_BASE_URL}/auth/me`, {
              method: 'GET',
              credentials: 'include',
              // Ne pas envoyer Content-Type pour GET
            });
          }
          if (meResp.ok) {
            const meData = await meResp.json().catch(() => null);
            if (meData && (typeof meData.is_admin !== 'undefined' || typeof meData.isAdmin !== 'undefined')) {
              const mergedUser = { ...authResponse.user, ...meData } as User & { is_admin?: boolean };
              this.saveUser(mergedUser as any);
            }
          }
        } catch {}
      }
      
      return authResponse;
    } catch (error) {
      if (error.message.includes('Credential is not supported') && AUTH_MODE === 'cookies') {
        AUTH_MODE = 'bearer';
        CORS_CREDENTIALS_SUPPORTED = false;
        return this.login(credentials);
      }
      throw error;
    }
  }

  /**
   * Décoder de façon sûre le payload d'un JWT (base64url) sans vérifier la signature
   */
  private static decodeJwtPayload(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64 = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      const json = decodeURIComponent(atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private static async makeLoginRequest(credentials: LoginRequest): Promise<Response> {
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    };

    if (AUTH_MODE === 'cookies') {
      requestOptions.credentials = 'include';
    }

    return fetch(`${API_BASE_URL}/auth/login`, requestOptions);
  }

  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const msg = error.detail || error.message || error.error || 'Erreur lors de l\'inscription';
      // Si detail est un tableau (FastAPI validation), formater
      const message = Array.isArray(msg)
        ? msg.map((e: any) => e.msg || e).join(', ')
        : typeof msg === 'object' ? JSON.stringify(msg) : msg;
      throw new Error(message);
    }

    const data = await response.json();
    
    const user: User = {
      id: String(userData.username),
      email: userData.email,
      username: userData.username
    };
    
    const authResponse: AuthResponse = {
      access_token: data.access_token || 'httponly-cookie',
      refresh_token: data.refresh_token || 'httponly-cookie',
      user: user
    };
    
    this.saveTokens(authResponse.access_token, authResponse.refresh_token);
    this.saveUser(authResponse.user);
    
    return authResponse;
  }

  static async loginWithGoogle(): Promise<void> {
    try {
      // Appel à l'endpoint pour obtenir l'URL de redirection Google
      const response = await fetch(`${API_BASE_URL}/auth/google/login`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'initialisation de la connexion Google');
      }

      const data = await response.json();
      
      const redirectUrl = data.redirect_url || data.auth_url;
      if (redirectUrl) {
        // Valider que l'URL de redirection pointe bien vers Google OAuth
        try {
          const url = new URL(redirectUrl);
          if (!url.hostname.endsWith('google.com') && !url.hostname.endsWith('googleapis.com')) {
            throw new Error('URL de redirection OAuth non autorisée');
          }
          window.location.href = redirectUrl;
        } catch (redirectError) {
          if (redirectError instanceof TypeError) {
            throw new Error('URL de redirection OAuth invalide');
          }
          throw redirectError;
        }
      } else {
        throw new Error('URL d\'authentification Google non reçue');
      }
    } catch (error) {
      throw error;
    }
  }

  static async handleGoogleCallback(): Promise<AuthResponse> {
    try {
      // Vérifier le statut de l'authentification Google
      const statusResponse = await fetch(`${API_BASE_URL}/auth/google/status`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!statusResponse.ok) {
        const error = await statusResponse.json();
        throw new Error(error.message || 'Erreur lors de la vérification du statut Google');
      }

      const statusData = await statusResponse.json();
      
      if (statusData.authenticated && statusData.user) {
        const user: User = {
          id: String(statusData.user.id || statusData.user.username),
          email: statusData.user.email,
          username: statusData.user.username || statusData.user.email.split('@')[0]
        };
        
        const authResponse: AuthResponse = {
          access_token: 'httponly-cookie',
          refresh_token: 'httponly-cookie',
          user: user
        };
        
        this.saveUser(authResponse.user);
        
        return authResponse;
      } else {
        throw new Error('Authentification Google échouée');
      }
    } catch (error) {
      throw error;
    }
  }

  static async logout(): Promise<void> {
    try {
      // Appel à l'endpoint de déconnexion du serveur
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      // Continuer avec le nettoyage local même en cas d'erreur serveur
    }

    // Nettoyer les données locales dans tous les cas
    this.clearTokens();
    this.clearUser();
  }

  static saveTokens(accessToken: string, refreshToken: string): void {
    try {
      if (accessToken && accessToken !== 'httponly-cookie') {
        _inMemoryAccessToken = accessToken;
        try {
          localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
        } catch {}
      }

      if (refreshToken && refreshToken !== 'httponly-cookie') {
        _inMemoryRefreshToken = refreshToken;
        try {
          localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
        } catch {}
      }
    } catch (error) {
      // Erreur silencieuse lors de la sauvegarde
    }
  }

  static getAccessToken(): string | null {
    try {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY) || _inMemoryAccessToken;
    } catch (error) {
      return null;
    }
  }

  static getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY) || _inMemoryRefreshToken;
    } catch (error) {
      return null;
    }
  }

  static clearTokens(): void {
    try {
      // Nettoyer les tokens en mémoire
      _inMemoryAccessToken = null;
      _inMemoryRefreshToken = null;
      // Nettoyer aussi localStorage au cas où d'anciens tokens y seraient stockés
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      // Erreur silencieuse
    }
  }

  static saveUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static getUser(): User | null {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      if (!userStr || userStr.trim() === '') {
        return null;
      }
      return JSON.parse(userStr);
    } catch (error) {
      console.warn("Données utilisateur corrompues détectées, nettoyage...", error);
      this.clearUser();
      return null;
    }
  }

  static clearUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  static isAuthenticated(): boolean {
    try {
      const user = this.getUser();

      // En mode Cookies (HttpOnly), la présence de l'utilisateur suffit
      if (AUTH_MODE === 'cookies') {
        return !!user;
      }

      // En mode Bearer, un token doit être présent et valide côté client
      const accessToken = this.getAccessToken();
      const hasToken = accessToken !== null && accessToken !== 'httponly-cookie';

      return !!(user && hasToken);
    } catch (error) {
      return false;
    }
  }

  static async refreshAccessToken(): Promise<string | null> {
    try {
      
      const requestOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (AUTH_MODE === 'cookies') {
        requestOptions.credentials = 'include';
      } else if (AUTH_MODE === 'bearer') {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken || refreshToken === 'httponly-cookie') {
          this.logout();
          return null;
        }
        requestOptions.body = JSON.stringify({ refresh_token: refreshToken });
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, requestOptions);


      if (!response.ok) {
        if (response.status === 404) {
        } else if (response.status === 401) {
        } else {
        }
        
        try {
          const errorData = await response.text();
        } catch (e) {
        }
        
        this.logout();
        return null;
      }

      const data = await response.json();
      
      if (data.access_token) {
        this.saveTokens(data.access_token, data.refresh_token || 'httponly-cookie');
        return data.access_token;
      } else {
        this.logout();
        return null;
      }
    } catch (error) {
      this.logout();
      return null;
    }
  }

  static async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const user = this.getUser();
    const accessToken = this.getAccessToken();

    const isAuth = (AUTH_MODE === 'cookies')
      ? !!user
      : !!(user && accessToken && accessToken !== 'httponly-cookie');

    if (!isAuth) {
      throw new Error('Utilisateur non authentifié');
    }

    if (AUTH_MODE === 'auto') {
      await this.detectCorsSupport();
    }

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
      },
    };

    if (AUTH_MODE === 'cookies') {
      requestOptions.credentials = 'include';
    } else if (AUTH_MODE === 'bearer') {
      if (accessToken && accessToken !== 'httponly-cookie') {
        requestOptions.headers = {
          ...requestOptions.headers,
          'Authorization': `Bearer ${accessToken}`,
        };
      }
    }

    try {
      const response = await fetch(url, requestOptions);

      if (response.status === 401) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          if (AUTH_MODE === 'bearer' && refreshed !== 'httponly-cookie') {
            requestOptions.headers = {
              ...requestOptions.headers,
              'Authorization': `Bearer ${refreshed}`,
            };
          }
          return fetch(url, requestOptions);
        }
        
        this.logout();
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
          window.location.href = '/login';
        }
        throw new Error('Session expirée, veuillez vous reconnecter');
      }

      return response;
    } catch (error) {
      if (error.message.includes('Credential is not supported') && AUTH_MODE === 'cookies') {
        AUTH_MODE = 'bearer';
        CORS_CREDENTIALS_SUPPORTED = false;
        
        return this.makeAuthenticatedRequest(url, options);
      }
      throw error;
    }
  }

  static async testBackendAuth(): Promise<boolean> {
    try {
      
      if (AUTH_MODE === 'auto') {
        await this.detectCorsSupport();
      }
      
      if (AUTH_MODE === 'cookies') {
        try {
          const cookieResponse = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            credentials: 'include',
          });

          if (cookieResponse.ok) {
            const userData = await cookieResponse.json();
            return true;
          } else {
            const errorText = await cookieResponse.text();
          }
        } catch (error) {
          if (error.message.includes('Credential is not supported')) {
            AUTH_MODE = 'bearer';
            CORS_CREDENTIALS_SUPPORTED = false;
            return this.testBackendAuth();
          }
        }
      }

      if (AUTH_MODE === 'bearer') {
        const accessToken = this.getAccessToken();
        if (!accessToken || accessToken === 'httponly-cookie') {
          return false;
        }

        try {
          const bearerResponse = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (bearerResponse.ok) {
            const userData = await bearerResponse.json();
            return true;
          } else {
            const errorText = await bearerResponse.text();
          }
        } catch (error) {
        }
      }

      
      return false;
    } catch (error) {
      return false;
    }
  }

  static forceAuthMode(mode: 'cookies' | 'bearer'): void {
    AUTH_MODE = mode;
    CORS_CREDENTIALS_SUPPORTED = mode === 'cookies';
  }

  static getAuthMode(): string {
    return `Mode: ${AUTH_MODE}, CORS: ${CORS_CREDENTIALS_SUPPORTED}`;
  }

  static async testAnalyzeEndpoint(testUrl: string = 'https://example.com'): Promise<boolean> {
    try {
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: testUrl }),
      });

      
      if (response.ok) {
        return true;
      } else {
        const errorText = await response.text();
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  static async testLLMOReportsEndpoint(): Promise<boolean> {
    try {
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/llmo/reports`, {
        method: 'GET',
      });

      
      if (response.ok) {
        const data = await response.json();
        if (data.reports && data.reports.length > 0) {
        }
        return true;
      } else {
        const errorText = await response.text();
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Récupérer les sessions actives de l'utilisateur
   */
  static async getSessions(): Promise<Array<{
    id?: string | number;
    ip?: string;
    user_agent?: string;
    created_at?: string;
    last_active_at?: string;
    current?: boolean;
    location?: string;
  }>> {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/auth/sessions`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erreur inconnue');
        throw new Error(errorText);
      }

      const data = await response.json();
      // Supporter plusieurs formats: { sessions: [...] } ou directement [...]
      const rawSessions = Array.isArray(data) ? data : (data.sessions || []);
      // Normaliser les champs attendus par le front
      const sessions = rawSessions.map((s: any) => ({
        id: s.id || s.session_id || s.sid || undefined,
        session_id: s.session_id || s.id || undefined,
        device_name: s.device_name || s.device || undefined,
        ip: s.ip || s.ip_address || undefined,
        user_agent: s.user_agent || s.ua || undefined,
        created_at: s.created_at || s.createdAt || undefined,
        last_active_at: s.last_seen_at || s.last_active_at || s.lastSeenAt || undefined,
        revoked_at: s.revoked_at || s.revokedAt || undefined,
        current: Boolean(s.current),
        location: s.location || undefined,
      }));
      return sessions;
    } catch (error) {
      return [];
    }
  }

  static async testLogoutEndpoint(): Promise<boolean> {
    try {
      
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      
      if (response.ok) {
        const data = await response.json().catch(() => null);
        return true;
      } else {
        const errorText = await response.text();
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  private static async detectCorsSupport(): Promise<boolean> {
    if (CORS_CREDENTIALS_SUPPORTED !== null) {
      return CORS_CREDENTIALS_SUPPORTED;
    }

    try {
      
      const response = await fetch(`${API_BASE_URL}/docs`, {
        method: 'GET',
        credentials: 'include',
      });
      
      CORS_CREDENTIALS_SUPPORTED = true;
      AUTH_MODE = 'cookies';
      return true;
    } catch (error) {
      if (error.message.includes('Credential is not supported')) {
        CORS_CREDENTIALS_SUPPORTED = false;
        AUTH_MODE = 'bearer';
        return false;
      }
      
      CORS_CREDENTIALS_SUPPORTED = true;
      AUTH_MODE = 'cookies';
      return true;
    }
  }

  /**
   * Récupère le token d'accès depuis les cookies
   */
  private static getAccessTokenFromCookies(): string | null {
    try {
      const cookies = document.cookie.split(';');
      
      // Essayer différents noms possibles pour le token
      const possibleTokenNames = ['access_token', 'token', 'jwt', 'auth_token', 'bearer_token'];
      
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        
        if (possibleTokenNames.includes(name)) {
          return value || null;
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Récupère les données du profil utilisateur depuis le localStorage
   */
  static async getUserProfile(): Promise<{
    email: string;
    username: string;
    id: number;
    is_active: boolean;
    is_verified: boolean;
    is_admin: boolean;
    created_at: string;
  }> {
    try {
      
      const userData = this.getUser();
      if (!userData) {
        throw new Error('Données utilisateur non trouvées dans localStorage');
      }


      // Mapper les données du localStorage vers le format attendu
      const userProfile = {
        email: userData.email || 'Non défini',
        username: userData.username || 'Non défini',
        id: Number(userData.id) || 0,
        is_active: true, // Par défaut si authentifié
        is_verified: true, // Par défaut si authentifié
        is_admin: userData.is_admin || false,
        created_at: (userData as any).created_at || new Date().toISOString()
      };

      
      return userProfile;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Vérifier l'email avec le token reçu par email
   */
  static async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      return { success: true, message: data.message || 'Email vérifié avec succès' };
    }

    const errorMsg =
      (typeof data.detail === 'string' ? data.detail : null) ||
      data.message ||
      `Lien invalide ou expiré (${response.status})`;
    throw new Error(errorMsg);
  }

  /**
   * Demander la réinitialisation du mot de passe
   */
  static async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, message: data.message || 'Email envoyé avec succès' };
      } else {
        const errorMsg =
          (typeof data.detail === 'string' ? data.detail : null) ||
          data.detail?.message ||
          data.message ||
          (Array.isArray(data.detail) ? data.detail.map((d: any) => d.msg || d.message).join(', ') : null) ||
          `Erreur lors de l'envoi de l'email (${response.status})`;
        return { success: false, message: errorMsg };
      }
    } catch (error) {
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  /**
   * Réinitialiser le mot de passe avec un token
   */
  static async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      
      const requestBody = { 
        token, 
        new_password: newPassword 
      };
      
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      if (response.ok) {
        return { success: true, message: data.message || 'Mot de passe réinitialisé avec succès' };
      } else {
        // Extraire le message d'erreur du backend (FastAPI: detail peut être string ou objet)
        const errorMsg =
          (typeof data.detail === 'string' ? data.detail : null) ||
          data.detail?.message ||
          data.message ||
          (Array.isArray(data.detail) ? data.detail.map((d: any) => d.msg || d.message).join(', ') : null) ||
          `Erreur lors de la réinitialisation (${response.status})`;
        return { success: false, message: errorMsg };
      }
    } catch (error) {
      return { success: false, message: 'Erreur de connexion' };
    }
  }
}

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).debugAuth = {
    clearAll: () => AuthService.clearAll(),
    getAccessToken: () => AuthService.getAccessToken(),
    getRefreshToken: () => AuthService.getRefreshToken(),
    getUser: () => AuthService.getUser(),
    testBackendAuth: () => AuthService.testBackendAuth(),
    testAnalyzeEndpoint: (url?: string) => AuthService.testAnalyzeEndpoint(url),
    isAuthenticated: () => AuthService.isAuthenticated(),
    forceAuthMode: (mode: 'cookies' | 'bearer') => AuthService.forceAuthMode(mode),
    getAuthMode: () => AuthService.getAuthMode(),
    testLLMOReportsEndpoint: () => AuthService.testLLMOReportsEndpoint(),
    testLogoutEndpoint: () => AuthService.testLogoutEndpoint(),
    getUserProfile: () => AuthService.getUserProfile(),
    testAuthEndpoint: async () => {
      
      try {
        const response = await fetch('http://localhost:8000/auth/me', {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
        } else {
          const errorData = await response.json().catch(() => null);
        }
      } catch (error) {
      }
    },
    getAccessTokenFromCookies: () => {
      const cookies = document.cookie.split(';');
      const possibleTokenNames = ['access_token', 'token', 'jwt', 'auth_token', 'bearer_token'];
      
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        
        if (possibleTokenNames.includes(name)) {
          return value;
        }
      }
      return null;
    },
    getAllCookies: () => {
      const cookies = document.cookie.split(';');
      const cookieObj = {};
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        cookieObj[name] = value;
      }
      return cookieObj;
    },
  };
 
} 