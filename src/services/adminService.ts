import { AdminUser, AdminUsersResponse, AdminUserStats, AdminUserSearchParams, AdminUserFilters, AdminMessage, AdminMessagesResponse, AdminMessagesQuery, AdminMessagesStats, AdminMessagesSearchQuery, AdminMessageUpdateRequest } from '@/types/admin';
import { AuthService } from './authService';
import { apiService } from './apiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.virail.studio';

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
        headers: {
          'Content-Type': 'application/json',
        },
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
      console.error('❌ Vérification admin échouée:', error);
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
          console.error('❌ Détails erreur 422:', errorData);
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
      console.log('📄 Récupération de la liste des utilisateurs...');
      
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
        if (filters.created_after) {
          searchParams.append('created_after', filters.created_after);
        }
        if (filters.created_before) {
          searchParams.append('created_before', filters.created_before);
        }
      }


      const data = await this.makeAdminRequest<any>(`/admin/users?${searchParams.toString()}`);
      
      console.log('✅ Utilisateurs récupérés:', data);
      
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
      console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
      throw error;
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
      console.error('❌ Erreur lors de la récupération des messages:', error);
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
      console.error(`❌ Erreur lors de la récupération du message ${messageId}:`, error);
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
      console.error(`❌ Erreur lors de la mise à jour du message ${messageId}:`, error);
      throw error;
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
      console.error('❌ Erreur lors de la récupération des stats messages:', error);
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
      console.error('❌ Erreur lors de la recherche de messages:', error);
      throw error;
    }
  }

  /**
   * GET /admin/users/{id} - Utilisateur spécifique
   */
  static async getUserById(userId: number): Promise<AdminUser> {
    try {
      console.log(`📄 Récupération de l'utilisateur ${userId}...`);
      
      const data = await this.makeAdminRequest<AdminUser>(`/admin/users/${userId}`);
      
      console.log('✅ Utilisateur récupéré:', data);
      return data;
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération de l'utilisateur ${userId}:`, error);
      throw error;
    }
  }

  /**
   * GET /admin/users/stats - Statistiques globales des utilisateurs
   */
  static async getUserStats(): Promise<AdminUserStats> {
    try {
      console.log('📄 Récupération des statistiques utilisateurs...');
      
      const data = await this.makeAdminRequest<any>('/admin/users/stats');
      
      console.log('✅ Statistiques récupérées:', data);
      
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
      console.error('❌ Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * GET /admin/users/search - Recherche d'utilisateurs par email/username
   */
  static async searchUsers(searchParams: AdminUserSearchParams): Promise<AdminUsersResponse> {
    try {
      console.log('📄 Recherche d\'utilisateurs...', searchParams);
      
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
      
      console.log('✅ Résultats de recherche:', data);
      
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
      console.error('❌ Erreur lors de la recherche d\'utilisateurs:', error);
      throw error;
    }
  }

  /**
   * PUT /auth/disable-user/{user_id} - Désactiver un utilisateur
   */
  static async disableUser(userId: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📄 Désactivation de l'utilisateur ${userId}...`);
      
      const data = await this.makeAdminRequest<{ success: boolean; message: string }>(`/auth/disable-user/${userId}`, {
        method: 'PUT',
      });
      
      console.log('✅ Utilisateur désactivé:', data);
      return data;
    } catch (error) {
      console.error(`❌ Erreur lors de la désactivation de l'utilisateur ${userId}:`, error);
      throw error;
    }
  }

  /**
   * PUT /auth/enable-user/{user_id} - Réactiver un utilisateur
   */
  static async enableUser(userId: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📄 Réactivation de l'utilisateur ${userId}...`);
      
      const data = await this.makeAdminRequest<{ success: boolean; message: string }>(`/auth/enable-user/${userId}`, {
        method: 'PUT',
      });
      
      console.log('✅ Utilisateur réactivé:', data);
      return data;
    } catch (error) {
      console.error(`❌ Erreur lors de la réactivation de l'utilisateur ${userId}:`, error);
      throw error;
    }
  }

  /**
   * DELETE /auth/delete-user/{user_id} - Supprimer un utilisateur
   */
  static async deleteUser(userId: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📄 Suppression de l'utilisateur ${userId}...`);
      
      const data = await this.makeAdminRequest<{ success: boolean; message: string }>(`/auth/delete-user/${userId}`, {
        method: 'DELETE',
      });
      
      console.log('✅ Utilisateur supprimé:', data);
      return data;
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression de l'utilisateur ${userId}:`, error);
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
      console.warn('⚠️ Vérification des privilèges admin échouée:', error);
      return false;
    }
  }
}
