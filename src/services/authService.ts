import { LoginRequest, RegisterRequest, AuthResponse, User } from '@/types/auth';

// Configuration dynamique de l'URL de base selon l'environnement
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000' : 'https://api.viraill.com');
const isDevelopment = import.meta.env.DEV;


const DEV_MODE = process.env.NODE_ENV === 'development';
const USE_CREDENTIALS = true;

// Autoriser le pilotage par env: VITE_AUTH_MODE=cookies|bearer|auto
const ENV_AUTH_MODE = (import.meta.env?.VITE_AUTH_MODE as 'cookies' | 'bearer' | 'auto' | undefined);
let AUTH_MODE: 'cookies' | 'bearer' | 'auto' = ENV_AUTH_MODE && ['cookies','bearer','auto'].includes(ENV_AUTH_MODE)
  ? ENV_AUTH_MODE
  : 'cookies';


let CORS_CREDENTIALS_SUPPORTED: boolean | null = null;

export class AuthService {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_KEY = 'user';

  static init(): void {
    try {
      const user = this.getUser();
    } catch (error) {
      this.clearAll();
    }
  }

  static clearAll(): void {
    this.clearTokens();
    this.clearUser();
  }

  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    await this.detectCorsSupport();
    
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
          try {
           //console.log('[AuthService] JWT payload is_admin:', isAdminFromJwt, payload)
          } catch {}
        }
      }

      const authResponse: AuthResponse = {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: user
      };
      
      this.saveTokens(authResponse.access_token, authResponse.refresh_token);
      this.saveUser(authResponse.user);

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
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de l\'inscription');
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
        // Redirection vers Google OAuth
        try {
          window.location.href = redirectUrl;
        } catch (redirectError) {
          // Alternative: ouvrir dans une nouvelle fenêtre
          window.open(redirectUrl, '_self');
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
      if (AUTH_MODE === 'bearer') {
        // Mode Bearer : sauvegarder dans localStorage
        if (accessToken && accessToken !== 'httponly-cookie') {
          localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
        }
        
        if (refreshToken && refreshToken !== 'httponly-cookie') {
          localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
        }
      }
    } catch (error) {
      // Erreur silencieuse lors de la sauvegarde
    }
  }

  static getAccessToken(): string | null {
    try {
      // En mode Bearer, lire depuis localStorage
      const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      return token;
    } catch (error) {
      return null;
    }
  }

  static getRefreshToken(): string | null {
    try {
      // En mode Bearer, lire depuis localStorage
      const token = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      return token;
    } catch (error) {
      return null;
    }
  }

  static clearTokens(): void {
    try {
      // Nettoyer localStorage
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
      //  ////console.log(`🔄 Tentative de rafraîchissement en mode: ${AUTH_MODE}...`);
      
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
          //  ////console.log('❌ Pas de refresh token disponible pour mode Bearer');
          this.logout();
          return null;
        }
        requestOptions.body = JSON.stringify({ refresh_token: refreshToken });
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, requestOptions);

      //  ////console.log('🔍 Réponse refresh status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          //  ////console.log('❌ Endpoint /auth/refresh non trouvé (404)');
        } else if (response.status === 401) {
          //  ////console.log('❌ Refresh token invalide ou expiré (401)');
        } else {
          //  ////console.log('❌ Échec du rafraîchissement du token:', response.status, response.statusText);
        }
        
        try {
          const errorData = await response.text();
          //  ////console.log('🔍 Détails erreur refresh:', errorData);
        } catch (e) {
          //  ////console.log('🔍 Impossible de lire les détails de l\'erreur');
        }
        
        this.logout();
        return null;
      }

      const data = await response.json();
      //  ////console.log('🔄 Réponse rafraîchissement:', data);
      
      if (data.access_token) {
        this.saveTokens(data.access_token, data.refresh_token || 'httponly-cookie');
        //  ////console.log(`✅ Token rafraîchi avec succès en mode: ${AUTH_MODE}`);
        return data.access_token;
      } else {
        //  ////console.log('❌ Pas de nouveau access_token dans la réponse');
        this.logout();
        return null;
      }
    } catch (error) {
      // console.error('🔄 Erreur lors du rafraîchissement:', error);
      this.logout();
      return null;
    }
  }

  static async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.isAuthenticated()) {
      //  ////console.log('❌ Utilisateur non authentifié');
      throw new Error('Utilisateur non authentifié');
    }

    if (AUTH_MODE === 'auto') {
      await this.detectCorsSupport();
    }

    //  ////console.log(`🔄 Requête API en mode: ${AUTH_MODE}`);

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
      },
    };

    if (AUTH_MODE === 'cookies') {
      requestOptions.credentials = 'include';
      //  ////console.log('🍪 Mode cookies : credentials include activé');
    } else if (AUTH_MODE === 'bearer') {
      const accessToken = this.getAccessToken();
      if (accessToken && accessToken !== 'httponly-cookie') {
        requestOptions.headers = {
          ...requestOptions.headers,
          'Authorization': `Bearer ${accessToken}`,
        };
        //  ////console.log('🔑 Token Bearer ajouté à la requête');
      } else {
        // console.warn('⚠️ Pas de token Bearer disponible');
      }
    }

    try {
      const response = await fetch(url, requestOptions);

      if (response.status === 401) {
        //  ////console.log('🔄 Session expirée, tentative de rafraîchissement...');
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
        
        //  ////console.log('❌ Impossible de rafraîchir le token, déconnexion...');
        this.logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Session expirée, veuillez vous reconnecter');
      }

      return response;
    } catch (error) {
      if (error.message.includes('Credential is not supported') && AUTH_MODE === 'cookies') {
        //  ////console.log('🔄 Erreur CORS sur requête API, basculement en mode Bearer...');
        AUTH_MODE = 'bearer';
        CORS_CREDENTIALS_SUPPORTED = false;
        
        return this.makeAuthenticatedRequest(url, options);
      }
      throw error;
    }
  }

  static async testBackendAuth(): Promise<boolean> {
    try {
      //  ////console.log(`🔍 Test de l\'authentification en mode: ${AUTH_MODE}`);
      
      if (AUTH_MODE === 'auto') {
        await this.detectCorsSupport();
      }
      
      if (AUTH_MODE === 'cookies') {
        //  ////console.log('🍪 Test: Authentification avec cookies HttpOnly...');
        try {
          const cookieResponse = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            credentials: 'include',
          });

           ////console.log('🔍 Test cookies - Status:', cookieResponse.status);
          if (cookieResponse.ok) {
            const userData = await cookieResponse.json();
            //  ////console.log('✅ Authentification par cookies HttpOnly réussie:', userData);
            return true;
          } else {
            const errorText = await cookieResponse.text();
            //  ////console.log('❌ Erreur authentification cookies:', errorText);
          }
        } catch (error) {
          if (error.message.includes('Credential is not supported')) {
            //  ////console.log('🔄 CORS avec credentials non supporté, basculement Bearer...');
            AUTH_MODE = 'bearer';
            CORS_CREDENTIALS_SUPPORTED = false;
            return this.testBackendAuth();
          }
          //  ////console.log('❌ Test cookies HttpOnly échoué:', error.message);
        }
      }

      if (AUTH_MODE === 'bearer') {
        //  ////console.log('🔑 Test: Authentification avec Bearer token...');
        const accessToken = this.getAccessToken();
        if (!accessToken || accessToken === 'httponly-cookie') {
          //  ////console.log('❌ Pas de token d\'accès disponible pour mode Bearer');
          return false;
        }

        try {
          const bearerResponse = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          //  ////console.log('🔍 Test Bearer - Status:', bearerResponse.status);
          if (bearerResponse.ok) {
            const userData = await bearerResponse.json();
            //  ////console.log('✅ Authentification par Bearer token réussie:', userData);
            return true;
          } else {
            const errorText = await bearerResponse.text();
            //  ////console.log('❌ Erreur authentification Bearer:', errorText);
          }
        } catch (error) {
          //  ////console.log('❌ Test Bearer token échoué:', error.message);
        }
      }

      //  ////console.log('❌ Échec du test d\'authentification');
       ////console.log('💡 BACKEND CONFIG: Pour les cookies HttpOnly, configurez CORS avec:');
       ////console.log('   - allow_origins=["http://localhost:5173"]');
       ////console.log('   - allow_credentials=True');
       ////console.log('💡 OU supportez les Bearer tokens dans votre backend');
      
      return false;
    } catch (error) {
      // console.error('❌ Erreur lors du test d\'authentification:', error);
      return false;
    }
  }

  static forceAuthMode(mode: 'cookies' | 'bearer'): void {
    AUTH_MODE = mode;
    CORS_CREDENTIALS_SUPPORTED = mode === 'cookies';
    //  ////console.log(`🔧 Mode d'authentification forcé: ${mode}`);
  }

  static getAuthMode(): string {
    return `Mode: ${AUTH_MODE}, CORS: ${CORS_CREDENTIALS_SUPPORTED}`;
  }

  static async testAnalyzeEndpoint(testUrl: string = 'https://example.com'): Promise<boolean> {
    try {
      //  ////console.log('🧪 Test de l\'endpoint /analyze...');
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: testUrl }),
      });

      //  ////console.log('🔍 Test /analyze - Status:', response.status);
      
      if (response.ok) {
         ////console.log('✅ Endpoint /analyze accessible');
        return true;
      } else {
        const errorText = await response.text();
        //  ////console.log('❌ Erreur /analyze:', errorText);
        return false;
      }
    } catch (error) {
      // console.error('❌ Erreur lors du test /analyze:', error.message);
      return false;
    }
  }

  static async testLLMOReportsEndpoint(): Promise<boolean> {
    try {
      //  ////console.log('🧪 Test de l\'endpoint /llmo/reports...');
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/llmo/reports`, {
        method: 'GET',
      });

      //  ////console.log('🔍 Test /llmo/reports - Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        //  ////console.log('✅ Endpoint /llmo/reports accessible:', data);
         ////console.log(`👤 Nombre de rapports trouvés: ${data.total}`);
        if (data.reports && data.reports.length > 0) {
          //  ////console.log('📄 Premier rapport:', data.reports[0]);
        }
        return true;
      } else {
        const errorText = await response.text();
        //  ////console.log('❌ Erreur /llmo/reports:', errorText);
        return false;
      }
    } catch (error) {
      // console.error('❌ Erreur lors du test /llmo/reports:', error.message);
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
        last_active_at: s.last_active_at || s.last_seen_at || s.lastSeenAt || undefined,
        revoked_at: s.revoked_at || s.revokedAt || undefined,
        current: Boolean(s.current),
        location: s.location || undefined,
      }));
      return sessions;
    } catch (error) {
      // console.error('❌ Erreur lors de la récupération des sessions:', error);
      return [];
    }
  }

  static async testLogoutEndpoint(): Promise<boolean> {
    try {
      //  ////console.log('🧪 Test de l\'endpoint /auth/logout...');
      
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      //  ////console.log('🔍 Test /auth/logout - Status:', response.status);
      
      if (response.ok) {
        const data = await response.json().catch(() => null);
        //  ////console.log('✅ Endpoint /auth/logout accessible:', data || 'Pas de contenu');
        return true;
      } else {
        const errorText = await response.text();
        //  ////console.log('❌ Erreur /auth/logout:', errorText);
        return false;
      }
    } catch (error) {
      // console.error('❌ Erreur lors du test /auth/logout:', error.message);
      return false;
    }
  }

  private static async detectCorsSupport(): Promise<boolean> {
    if (CORS_CREDENTIALS_SUPPORTED !== null) {
      return CORS_CREDENTIALS_SUPPORTED;
    }

    try {
       ////console.log('🔍 Détection du support CORS avec credentials...');
      
      const response = await fetch(`${API_BASE_URL}/docs`, {
        method: 'GET',
        credentials: 'include',
      });
      
      CORS_CREDENTIALS_SUPPORTED = true;
       ////console.log('✅ CORS avec credentials supporté');
      AUTH_MODE = 'cookies';
      return true;
    } catch (error) {
      if (error.message.includes('Credential is not supported')) {
        //  ////console.log('❌ CORS avec credentials NON supporté - utilisation Bearer token');
        CORS_CREDENTIALS_SUPPORTED = false;
        AUTH_MODE = 'bearer';
        return false;
      }
      
      //  ////console.log('⚠️ Erreur lors de la détection CORS, mode cookies par défaut');
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
      //  ////console.log('🍪 Tous les cookies disponibles:', cookies);
      
      // Essayer différents noms possibles pour le token
      const possibleTokenNames = ['access_token', 'token', 'jwt', 'auth_token', 'bearer_token'];
      
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        //  ////console.log(`🍪 Cookie trouvé: ${name} = ${value ? 'PRÉSENT' : 'VIDE'}`);
        
        if (possibleTokenNames.includes(name)) {
          //  ////console.log(`🍪 Token trouvé dans les cookies (${name}):`, value ? 'PRÉSENT' : 'ABSENT');
          return value || null;
        }
      }
      
      //  ////console.log('🍪 Aucun token trouvé dans les cookies avec les noms:', possibleTokenNames);
      return null;
    } catch (error) {
      // console.error('❌ Erreur lors de la lecture des cookies:', error);
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
      //  ////console.log('🔍 Récupération du profil utilisateur depuis localStorage...');
      
      const userData = this.getUser();
      if (!userData) {
        throw new Error('Données utilisateur non trouvées dans localStorage');
      }

      //  ////console.log('✅ Données utilisateur récupérées depuis localStorage:', userData);

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

      //  ////console.log('✅ Profil utilisateur formaté:', userProfile);
      
      return userProfile;
    } catch (error) {
      // console.error('❌ Erreur lors de la récupération du profil:', error);
      throw error;
    }
  }

  /**
   * Demander la réinitialisation du mot de passe
   */
  static async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      //  ////console.log('🔄 Demande de réinitialisation du mot de passe pour:', email);
      
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
        //  ////console.log('✅ Email de réinitialisation envoyé');
        return { success: true, message: data.message || 'Email envoyé avec succès' };
      } else {
        // console.error('❌ Erreur lors de l\'envoi de l\'email:', data.message);
        return { success: false, message: data.message || 'Erreur lors de l\'envoi de l\'email' };
      }
    } catch (error) {
      // console.error('❌ Erreur lors de la demande de réinitialisation:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }

  /**
   * Réinitialiser le mot de passe avec un token
   */
  static async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      //  ////console.log('🔄 Réinitialisation du mot de passe avec token:', token);
      //  ////console.log('🔄 Nouveau mot de passe:', newPassword);
      
      const requestBody = { 
        token, 
        new_password: newPassword 
      };
      //  ////console.log('🔄 Corps de la requête:', requestBody);
      
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
        //  ////console.log('✅ Mot de passe réinitialisé avec succès');
        return { success: true, message: data.message || 'Mot de passe réinitialisé avec succès' };
      } else {
        // console.error('❌ Erreur lors de la réinitialisation:', data.message);
        return { success: false, message: data.message || 'Erreur lors de la réinitialisation' };
      }
    } catch (error) {
      // console.error('❌ Erreur lors de la réinitialisation du mot de passe:', error);
      return { success: false, message: 'Erreur de connexion' };
    }
  }
}

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
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
       ////console.log('🧪 Test de l\'endpoint /auth/me...');
      
      try {
        const response = await fetch('http://localhost:8000/auth/me', {
          method: 'GET',
          credentials: 'include',
        });
        //  ////console.log('📡 /auth/me:', response.status, response.statusText);
        if (response.ok) {
          const data = await response.json();
           ////console.log('✅ /auth/me data:', data);
        } else {
          const errorData = await response.json().catch(() => null);
          //  ////console.log('❌ Erreur:', errorData);
        }
      } catch (error) {
        //  ////console.log('❌ /auth/me error:', error);
      }
    },
    getAccessTokenFromCookies: () => {
      const cookies = document.cookie.split(';');
      //  ////console.log('🍪 Tous les cookies disponibles:', cookies);
      const possibleTokenNames = ['access_token', 'token', 'jwt', 'auth_token', 'bearer_token'];
      
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        //  ////console.log(`🍪 Cookie: ${name} = ${value ? 'PRÉSENT' : 'VIDE'}`);
        
        if (possibleTokenNames.includes(name)) {
           ////console.log(`🍪 Token trouvé (${name}):`, value);
          return value;
        }
      }
      //  ////console.log('🍪 Aucun token trouvé avec les noms:', possibleTokenNames);
      return null;
    },
    getAllCookies: () => {
      const cookies = document.cookie.split(';');
       ////console.log('🍪 Tous les cookies:', cookies);
      const cookieObj = {};
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        cookieObj[name] = value;
      }
       ////console.log('🍪 Objet cookies:', cookieObj);
      return cookieObj;
    },
  };
 
} 