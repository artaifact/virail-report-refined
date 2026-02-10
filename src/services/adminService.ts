import { AdminUser, AdminUsersResponse, AdminUserStats, AdminUserSearchParams, AdminUserFilters, AdminMessage, AdminMessagesResponse, AdminMessagesQuery, AdminMessagesStats, AdminMessagesSearchQuery, AdminMessageUpdateRequest, AdminSubscription, AdminSubscriptionsResponse, AdminSubscriptionsStats, AdminSubscriptionsQuery } from '@/types/admin';
import { AuthService } from './authService';
import { apiService } from './apiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.viraill.com';

/**
 * Service pour la gestion administrative des utilisateurs
 * Tous les endpoints nécessitent une authentification admin
 */
export class AdminService {
  /**
   * Vérifie si l'utilisateur actuel est admin
   * Utilise une requête directe vers l'API au lieu des données localStorage
   */
  private static async verifyAdminAccess(): Promise<void> {
    try {
      // Récupérer les données utilisateur fraîches depuis l'API
      const response = await fetch(`${API_BASE_URL}/auth/me-bearer`, {
        method: 'GET',
        credentials: 'include',
        // Ne pas envoyer Content-Type pour GET
      });

      if (!response.ok) {
        throw new Error('Authentification requise');
      }

      const userProfile = await response.json();
      
      if (!userProfile.is_admin) {
        throw new Error('Accès refusé: privilèges administrateur requis');
      }
      
      if (!userProfile.is_active) {
        throw new Error('Accès refusé: compte utilisateur inactif');
      }

    } catch (error) {
      throw new Error('Authentification admin requise');
    }
  }

  /**
   * Effectue une requête authentifiée avec vérification admin
   * Utilise la même approche que apiService pour les cookies
   */
  private static async makeAdminRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    await this.verifyAdminAccess();
    
    // Utiliser la même approche que apiService pour les cookies
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include', // Important pour les cookies JWT
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Accès refusé: privilèges administrateur requis');
      }
      if (response.status === 401) {
        throw new Error('Authentification requise');
      }
      if (response.status === 422) {
        // Récupérer les détails de l'erreur 422
        try {
          const errorData = await response.json();
          throw new Error(`Erreur de validation: ${errorData.detail || 'Paramètres invalides'}`);
        } catch (parseError) {
          throw new Error('Erreur de validation: paramètres invalides');
        }
      }
      throw new Error(`Erreur API: ${response.status}`);
    }

    return response.json();
  }

  /**
   * GET /admin/users - Liste des utilisateurs avec pagination et filtres
   */
  static async getUsers(
    page: number = 1,
    perPage: number = 20,
    filters?: AdminUserFilters
  ): Promise<AdminUsersResponse> {
    try {
     //console.log('📄 Récupération de la liste des utilisateurs...');
      
      const searchParams = new URLSearchParams();
      
      // Paramètres selon l'API réelle
      searchParams.append('limit', perPage.toString());
      
      // Gestion de la pagination avec offset
      if (page > 1) {
        searchParams.append('offset', ((page - 1) * perPage).toString());
      }

      // Ajouter les filtres si fournis
      if (filters) {
        if (filters.is_active !== undefined) {
          searchParams.append('is_active', filters.is_active.toString());
        }
        if (filters.is_admin !== undefined) {
          searchParams.append('is_admin', filters.is_admin.toString());
        }
        if (filters.is_verified !== undefined) {
          searchParams.append('is_verified', filters.is_verified.toString());
        }
        if (filters.approval_status) {
          searchParams.append('approval_status', filters.approval_status);
        }
        if (filters.created_after) {
          searchParams.append('created_after', filters.created_after);
        }
        if (filters.created_before) {
          searchParams.append('created_before', filters.created_before);
        }
      }


      const data = await this.makeAdminRequest<any>(`/admin/users?${searchParams.toString()}`);
      
     //console.log('✅ Utilisateurs récupérés:', data);
      
      // Adapter le format de réponse de l'API au format attendu par le composant
      const adaptedData: AdminUsersResponse = {
        users: data.users || [],
        total: data.total || 0,
        page: data.page || 1,
        per_page: data.limit || 20,
        total_pages: Math.ceil((data.total || 0) / (data.limit || 20))
      };
      
      return adaptedData;
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /admin/users/pending - Liste des utilisateurs en attente d'approbation
   */
  static async getPendingUsers(
    page: number = 1,
    perPage: number = 20
  ): Promise<AdminUsersResponse> {
    try {
     //console.log('📄 Récupération des utilisateurs en attente...', { page, perPage });
      
      const searchParams = new URLSearchParams();
      searchParams.append('limit', perPage.toString());
      
      if (page > 1) {
        searchParams.append('offset', ((page - 1) * perPage).toString());
      }

      const endpoint = `/admin/users/pending?${searchParams.toString()}`;
     //console.log('🔗 Appel API:', `${API_BASE_URL}${endpoint}`);
      
      const data = await this.makeAdminRequest<any>(endpoint);
      
     //console.log('✅ Réponse API reçue:', data);
      
      // Gérer différentes structures de réponse possibles
      let users: AdminUser[] = [];
      let total = 0;
      let limit = perPage;
      
      // Si la réponse est directement un tableau
      if (Array.isArray(data)) {
        users = data;
        total = data.length;
      }
      // Si la réponse a une structure { users: [...], total: ... }
      else if (data.users && Array.isArray(data.users)) {
        users = data.users;
        total = data.total || data.count || data.total_count || data.users.length;
        limit = data.limit || data.per_page || perPage;
      }
      // Si la réponse a une structure { items: [...] } ou autre
      else if (data.items && Array.isArray(data.items)) {
        users = data.items;
        total = data.total || data.count || data.total_count || data.items.length;
        limit = data.limit || data.per_page || perPage;
      }
      // Si la réponse a une structure { data: [...] }
      else if (data.data && Array.isArray(data.data)) {
        users = data.data;
        total = data.total || data.count || data.total_count || data.data.length;
        limit = data.limit || data.per_page || perPage;
      }
      
      const adaptedData: AdminUsersResponse = {
        users: users,
        total: total,
        page: data.page || page,
        per_page: limit,
        total_pages: Math.ceil(total / limit)
      };
      
     //console.log('✅ Données adaptées:', adaptedData);
      
      return adaptedData;
    } catch (error) {
      throw error;
    }
  }

  /**
   * PUT /admin/users/{user_id}/approve - Approuver ou rejeter un utilisateur
   */
  static async approveUser(
    userId: number,
    approved: boolean,
    notes?: string
  ): Promise<AdminUser> {
    try {
     //console.log(`📝 ${approved ? 'Approbation' : 'Rejet'} de l'utilisateur ${userId}...`);
      
      const requestBody: any = {
        action: approved ? 'approve' : 'reject'
      };
      
      if (notes && notes.trim()) {
        requestBody.notes = notes.trim();
      }

     //console.log('📤 Body de la requête:', requestBody);

      const data = await this.makeAdminRequest<AdminUser>(
        `/admin/users/${userId}/approve`,
        {
          method: 'PUT',
          body: JSON.stringify(requestBody)
        }
      );
      
     //console.log(`✅ Utilisateur ${approved ? 'approuvé' : 'rejeté'} avec succès:`, data);
      
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * POST /auth/create-admin - Créer un compte administrateur
   */
  static async createAdmin(adminData: {
    email: string;
    username: string;
    password: string;
  }): Promise<{ success: boolean; message: string; user?: AdminUser }> {
    try {
     //console.log('🔧 Création d\'un compte administrateur...');
      
      const response = await fetch(`${API_BASE_URL}/auth/create-admin`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création du compte admin');
      }

      const data = await response.json();
     //console.log('✅ Compte admin créé avec succès:', data);
      
      return {
        success: true,
        message: 'Compte administrateur créé avec succès',
        user: data.user
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la création du compte admin'
      };
    }
  }

  /**
   * GET /admin/messages - Liste paginée des messages avec filtres optionnels
   * Compatible Postman: page, per_page, status, priority
   */
  static async getMessages(params: AdminMessagesQuery = {}): Promise<AdminMessagesResponse> {
    try {
      const { page = 1, per_page = 20, status, priority } = params;

      const search = new URLSearchParams();
      search.append('page', String(page));
      search.append('per_page', String(per_page));
      if (status) search.append('status', status);
      if (priority) search.append('priority', priority);

      const data = await this.makeAdminRequest<any>(`/admin/messages/?${search.toString()}`);

      const adapted: AdminMessagesResponse = {
        messages: data.messages || [],
        total: data.total || 0,
        page: data.page || page,
        per_page: data.per_page || per_page,
        total_pages: data.total_pages || Math.max(1, Math.ceil((data.total || 0) / (data.per_page || per_page)))
      };
      return adapted;
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /admin/messages/{id} - Récupère un message par ID
   */
  static async getMessageById(messageId: number | string): Promise<AdminMessage> {
    try {
      const data = await this.makeAdminRequest<AdminMessage>(`/admin/messages/${messageId}`);
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * PUT /admin/messages/{id} - Met à jour un message (statut, priorité, réponse, tags)
   */
  static async updateMessage(messageId: number | string, payload: AdminMessageUpdateRequest): Promise<AdminMessage> {
    try {
      const data = await this.makeAdminRequest<AdminMessage>(`/admin/messages/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * DELETE /admin/messages/{id} - Supprime un message
   */
  static async deleteMessage(messageId: number | string): Promise<{ success: boolean; message: string }> {
    try {
     //console.log(`🗑️ Suppression du message ${messageId}...`);
      
      await this.makeAdminRequest(`/admin/messages/${messageId}`, {
        method: 'DELETE'
      });
      
     //console.log(`✅ Message ${messageId} supprimé avec succès`);
      
      return {
        success: true,
        message: 'Message supprimé avec succès'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la suppression du message'
      };
    }
  }

  /**
   * GET /admin/messages/stats/overview - Statistiques globales de messages
   */
  static async getMessagesStats(): Promise<AdminMessagesStats> {
    try {
      const data = await this.makeAdminRequest<AdminMessagesStats>(`/admin/messages/stats/overview`);
      return {
        total_messages: data.total_messages || 0,
        unread_messages: data.unread_messages || 0,
        replied_messages: data.replied_messages || 0,
        high_priority_messages: (data as any).high_priority_messages || 0,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /admin/messages/search - Recherche textuelle/filtrée dans les messages
   * Compatible Postman: query, email, status, priority, page, per_page
   */
  static async searchMessages(query: AdminMessagesSearchQuery): Promise<AdminMessagesResponse> {
    try {
      const { query: q, email, status, priority, page = 1, per_page = 10 } = query;
      const search = new URLSearchParams();
      if (q) search.append('query', q);
      if (email) search.append('email', email);
      if (status) search.append('status', status);
      if (priority) search.append('priority', priority);
      search.append('page', String(page));
      search.append('per_page', String(per_page));

      const data = await this.makeAdminRequest<any>(`/admin/messages/search/?${search.toString()}`);
      const adapted: AdminMessagesResponse = {
        messages: data.messages || [],
        total: data.total || 0,
        page: data.page || page,
        per_page: data.per_page || per_page,
        total_pages: data.total_pages || Math.max(1, Math.ceil((data.total || 0) / (data.per_page || per_page)))
      };
      return adapted;
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /admin/users/{id} - Utilisateur spécifique
   */
  static async getUserById(userId: number): Promise<AdminUser> {
    try {
     //console.log(`📄 Récupération de l'utilisateur ${userId}...`);
      
      const data = await this.makeAdminRequest<AdminUser>(`/admin/users/${userId}`);
      
     //console.log('✅ Utilisateur récupéré:', data);
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /admin/users/stats - Statistiques globales des utilisateurs
   */
  static async getUserStats(): Promise<AdminUserStats> {
    try {
     //console.log('📄 Récupération des statistiques utilisateurs...');
      
      const data = await this.makeAdminRequest<any>('/admin/users/stats');
      
     //console.log('✅ Statistiques récupérées:', data);
      
      // Adapter le format de réponse de l'API au format attendu par le composant
      const adaptedData: AdminUserStats = {
        total_users: data.total_users || 0,
        active_users: data.active_users || 0,
        admin_users: data.admin_users || 0,
        verified_users: data.verified_users || 0,
        new_users_this_month: data.created_this_month || 0,
        total_reports: 0, // Pas disponible dans l'API actuelle
        total_analyses: 0  // Pas disponible dans l'API actuelle
      };
      
      return adaptedData;
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /admin/users/search - Recherche d'utilisateurs par email/username
   */
  static async searchUsers(searchParams: AdminUserSearchParams): Promise<AdminUsersResponse> {
    try {
     //console.log('📄 Recherche d\'utilisateurs...', searchParams);
      
      const urlParams = new URLSearchParams();
      
      // Paramètres selon l'API réelle (comme dans Postman)
      urlParams.append('q', searchParams.query);
      urlParams.append('limit', (searchParams.per_page || 20).toString());
      
      // Ajouter la page si nécessaire
      if (searchParams.page && searchParams.page > 1) {
        urlParams.append('offset', ((searchParams.page - 1) * (searchParams.per_page || 20)).toString());
      }

      // Ajouter les filtres de recherche seulement s'ils sont définis
      if (searchParams.is_active !== undefined && searchParams.is_active !== null) {
        urlParams.append('is_active', searchParams.is_active.toString());
      }
      if (searchParams.is_admin !== undefined && searchParams.is_admin !== null) {
        urlParams.append('is_admin', searchParams.is_admin.toString());
      }
      if (searchParams.is_verified !== undefined && searchParams.is_verified !== null) {
        urlParams.append('is_verified', searchParams.is_verified.toString());
      }


      const data = await this.makeAdminRequest<any>(`/admin/users/search?${urlParams.toString()}`);
      
     //console.log('✅ Résultats de recherche:', data);
      
      // Adapter le format de réponse de l'API au format attendu par le composant
      const adaptedData: AdminUsersResponse = {
        users: Array.isArray(data) ? data : (data.users || []),
        total: Array.isArray(data) ? data.length : (data.total || 0),
        page: searchParams.page || 1,
        per_page: searchParams.per_page || 20,
        total_pages: Array.isArray(data) ? 1 : Math.ceil((data.total || 0) / (searchParams.per_page || 20))
      };
      
      return adaptedData;
    } catch (error) {
      throw error;
    }
  }

  /**
   * PUT /auth/disable-user/{user_id} - Désactiver un utilisateur
   */
  static async disableUser(userId: number): Promise<{ success: boolean; message: string }> {
    try {
     //console.log(`📄 Désactivation de l'utilisateur ${userId}...`);
      
      const data = await this.makeAdminRequest<{ success: boolean; message: string }>(`/auth/disable-user/${userId}`, {
        method: 'PUT',
      });
      
     //console.log('✅ Utilisateur désactivé:', data);
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * PUT /auth/enable-user/{user_id} - Réactiver un utilisateur
   */
  static async enableUser(userId: number): Promise<{ success: boolean; message: string }> {
    try {
     //console.log(`📄 Réactivation de l'utilisateur ${userId}...`);
      
      const data = await this.makeAdminRequest<{ success: boolean; message: string }>(`/auth/enable-user/${userId}`, {
        method: 'PUT',
      });
      
     //console.log('✅ Utilisateur réactivé:', data);
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * DELETE /auth/delete-user/{user_id} - Supprimer un utilisateur
   */
  static async deleteUser(userId: number): Promise<{ success: boolean; message: string }> {
    try {
     //console.log(`📄 Suppression de l'utilisateur ${userId}...`);
      
      const data = await this.makeAdminRequest<{ success: boolean; message: string }>(`/auth/delete-user/${userId}`, {
        method: 'DELETE',
      });
      
     //console.log('✅ Utilisateur supprimé:', data);
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Vérifie si l'utilisateur actuel a les privilèges admin
   * Utilise la même approche que la waitlist - test simple avec une requête
   */
  static async checkAdminPrivileges(): Promise<boolean> {
    try {
      // Test simple avec une requête vers l'API admin (sans vérification préalable)
      const response = await fetch(`${API_BASE_URL}/admin/users/stats`, {
        method: 'GET',
        credentials: 'include', // Important pour les cookies JWT
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return true;
      } else if (response.status === 403) {
        return false; // Pas admin
      } else if (response.status === 401) {
        return false; // Pas authentifié
      } else {
        return false; // Autre erreur
      }
    } catch (error) {
      return false;
    }
  }

  // ===== GESTION DES ABONNEMENTS =====

  /**
   * GET /admin/subscriptions/ - Liste des abonnements avec pagination et filtres
   */
  static async getSubscriptions(params: AdminSubscriptionsQuery = {}): Promise<AdminSubscriptionsResponse> {
    try {
      const { page = 1, per_page = 20, status, plan_id } = params;

      const search = new URLSearchParams();
      search.append('page', String(page));
      search.append('per_page', String(per_page));
      if (status) search.append('status', status);
      if (plan_id) search.append('plan_id', plan_id);

      const data = await this.makeAdminRequest<any>(`/admin/subscriptions/?${search.toString()}`);

      // Adapter chaque abonnement au format attendu
      const adaptedSubscriptions = (data.subscriptions || []).map((sub: any) => ({
        id: sub.id,
        user_id: sub.user_id,
        plan_id: sub.plan_id,
        status: sub.status,
        start_date: sub.start_date,
        end_date: sub.end_date,
        auto_renew: sub.auto_renew,
        created_at: sub.created_at,
        updated_at: sub.updated_at,
        user: {
          id: sub.user_id,
          username: sub.user_username || '-',
          email: sub.user_email || '-'
        },
        plan: {
          id: sub.plan_id,
          name: sub.plan_name || sub.plan_id,
          price: sub.plan_price || 0,
          interval: 'month' as const
        }
      }));

      const adapted: AdminSubscriptionsResponse = {
        subscriptions: adaptedSubscriptions,
        total: data.total || 0,
        page: data.page || page,
        per_page: data.per_page || per_page,
        total_pages: data.total_pages || Math.max(1, Math.ceil((data.total || 0) / (data.per_page || per_page)))
      };
      return adapted;
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /admin/subscriptions/{id} - Récupère un abonnement par ID
   */
  static async getSubscriptionById(subscriptionId: number | string): Promise<AdminSubscription> {
    try {
      const data = await this.makeAdminRequest<any>(`/admin/subscriptions/${subscriptionId}`);
      
      // Adapter le format de l'API au format attendu
      const adapted: AdminSubscription = {
        id: data.id,
        user_id: data.user_id,
        plan_id: data.plan_id,
        status: data.status,
        start_date: data.start_date,
        end_date: data.end_date,
        auto_renew: data.auto_renew,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user: {
          id: data.user_id,
          username: data.user_username || '-',
          email: data.user_email || '-'
        },
        plan: {
          id: data.plan_id,
          name: data.plan_name || data.plan_id,
          price: data.plan_price || 0,
          interval: 'month' // Par défaut, peut être amélioré si l'API renvoie cette info
        }
      };
      
      return adapted;
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /admin/subscriptions/stats - Statistiques des abonnements
   */
  static async getSubscriptionsStats(): Promise<AdminSubscriptionsStats> {
    try {
      const data = await this.makeAdminRequest<AdminSubscriptionsStats>(`/admin/subscriptions/stats`);
      return {
        total_subscriptions: data.total_subscriptions || 0,
        active_subscriptions: data.active_subscriptions || 0,
        expired_subscriptions: data.expired_subscriptions || 0,
        cancelled_subscriptions: data.cancelled_subscriptions || 0,
        pending_subscriptions: data.pending_subscriptions || 0,
        total_revenue: data.total_revenue || 0,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * PUT /admin/subscriptions/{id}/force-activate - Activer un abonnement de force
   */
  static async forceActivateSubscription(subscriptionId: number | string): Promise<{ success: boolean; message: string }> {
    try {
     //console.log(`⚡ Activation forcée de l'abonnement ${subscriptionId}...`);
      
      await this.makeAdminRequest(`/admin/subscriptions/${subscriptionId}/force-activate`, {
        method: 'PUT'
      });
      
     //console.log(`✅ Abonnement ${subscriptionId} activé avec succès`);
      
      return {
        success: true,
        message: 'Abonnement activé avec succès'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de l\'activation'
      };
    }
  }

  /**
   * PUT /admin/subscriptions/{id}/force-cancel - Annuler un abonnement de force
   */
  static async forceCancelSubscription(subscriptionId: number | string): Promise<{ success: boolean; message: string }> {
    try {
     //console.log(`⚡ Annulation forcée de l'abonnement ${subscriptionId}...`);
      
      await this.makeAdminRequest(`/admin/subscriptions/${subscriptionId}/force-cancel`, {
        method: 'PUT'
      });
      
     //console.log(`✅ Abonnement ${subscriptionId} annulé avec succès`);
      
      return {
        success: true,
        message: 'Abonnement annulé avec succès'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de l\'annulation'
      };
    }
  }

  /**
   * PUT /admin/subscriptions/{id}/extend - Étendre la durée d'un abonnement
   */
  static async extendSubscription(subscriptionId: number | string, days: number): Promise<{ success: boolean; message: string }> {
    try {
     //console.log(`⏰ Extension de l'abonnement ${subscriptionId} de ${days} jours...`);
      
      await this.makeAdminRequest(`/admin/subscriptions/${subscriptionId}/extend`, {
        method: 'PUT',
        body: JSON.stringify({ days })
      });
      
     //console.log(`✅ Abonnement ${subscriptionId} étendu avec succès`);
      
      return {
        success: true,
        message: `Abonnement étendu de ${days} jours`
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de l\'extension'
      };
    }
  }

  /**
   * POST /admin/subscriptions/{user_id}/create - Créer un abonnement pour un utilisateur
   */
  static async createSubscriptionForUser(
    userId: number | string,
    data: { plan_id: string; auto_renew?: boolean; duration_months?: number }
  ): Promise<{ success: boolean; message: string; subscription?: AdminSubscription }> {
    try {
     //console.log(`⚡ Création d'un abonnement pour l'utilisateur ${userId}...`);
      
      const response = await this.makeAdminRequest<AdminSubscription>(`/admin/subscriptions/${userId}/create`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
     //console.log(`✅ Abonnement créé avec succès pour l'utilisateur ${userId}`);
      
      return {
        success: true,
        message: 'Abonnement créé avec succès',
        subscription: response
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la création'
      };
    }
  }

  // ===== GESTION AVANCÉE DES UTILISATEURS =====

  /**
   * PUT /admin/users/{id} - Modifier un utilisateur
   */
  static async updateUser(
    userId: number | string,
    data: { username?: string; email?: string; is_active?: boolean; is_verified?: boolean; is_admin?: boolean }
  ): Promise<{ success: boolean; message: string; user?: AdminUser }> {
    try {
     //console.log(`⚡ Modification de l'utilisateur ${userId}...`);
      
      const response = await this.makeAdminRequest<AdminUser>(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
     //console.log(`✅ Utilisateur ${userId} modifié avec succès`);
      
      return {
        success: true,
        message: 'Utilisateur modifié avec succès',
        user: response
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la modification'
      };
    }
  }


  /**
   * PUT /admin/users/{id}/activate - Activer ou désactiver un utilisateur
   */
  static async toggleUserActivation(userId: number | string, isActive: boolean): Promise<{ success: boolean; message: string }> {
    try {
     //console.log(`${isActive ? '✅' : '❌'} ${isActive ? 'Activation' : 'Désactivation'} de l'utilisateur ${userId}...`);
      
      await this.makeAdminRequest(`/admin/users/${userId}/activate`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: isActive })
      });
      
     //console.log(`✅ Utilisateur ${userId} ${isActive ? 'activé' : 'désactivé'} avec succès`);
      
      return {
        success: true,
        message: `Utilisateur ${isActive ? 'activé' : 'désactivé'} avec succès`
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la modification'
      };
    }
  }

  /**
   * PUT /admin/users/{id}/reset-password - Réinitialiser le mot de passe d'un utilisateur
   */
  static async resetUserPassword(userId: number | string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
     //console.log(`🔑 Réinitialisation du mot de passe de l'utilisateur ${userId}...`);
      
      await this.makeAdminRequest(`/admin/users/${userId}/reset-password`, {
        method: 'PUT',
        body: JSON.stringify({ new_password: newPassword })
      });
      
     //console.log(`✅ Mot de passe de l'utilisateur ${userId} réinitialisé avec succès`);
      
      return {
        success: true,
        message: 'Mot de passe réinitialisé avec succès'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la réinitialisation'
      };
    }
  }

  /**
   * PUT /admin/users/{id}/demote - Retirer les droits administrateur d'un utilisateur
   */
  static async demoteUser(userId: number | string): Promise<{ success: boolean; message: string }> {
    try {
     //console.log(`👤 Retrait des droits admin de l'utilisateur ${userId}...`);
      
      await this.makeAdminRequest(`/admin/users/${userId}/demote`, {
        method: 'PUT'
      });
      
     //console.log(`✅ Droits admin retirés pour l'utilisateur ${userId}`);
      
      return {
        success: true,
        message: 'Droits administrateur retirés avec succès'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors du retrait des droits'
      };
    }
  }
}
