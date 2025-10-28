/**
 * Types pour la gestion administrative des utilisateurs
 */

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
  last_login?: string;
  total_reports?: number;
  total_analyses?: number;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface AdminUserStats {
  total_users: number;
  active_users: number;
  admin_users: number;
  verified_users: number;
  new_users_this_month: number;
  total_reports: number;
  total_analyses: number;
}

export interface AdminUserSearchParams {
  query: string;
  page?: number;
  per_page?: number;
  is_active?: boolean;
  is_admin?: boolean;
  is_verified?: boolean;
}

export interface AdminUserFilters {
  is_active?: boolean;
  is_admin?: boolean;
  is_verified?: boolean;
  created_after?: string;
  created_before?: string;
}

/**
 * Types pour la gestion administrative des messages de contact/support
 */
export interface AdminMessage {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  subject: string;
  message: string;
  status?: 'new' | 'unread' | 'read' | 'replied' | 'archived';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  admin_response?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface AdminMessagesResponse {
  messages: AdminMessage[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface AdminMessagesStats {
  total_messages: number;
  unread_messages: number;
  replied_messages: number;
  high_priority_messages?: number;
}

export interface AdminMessagesQuery {
  page?: number;
  per_page?: number;
  status?: string;
  priority?: string;
}

export interface AdminMessagesSearchQuery {
  query?: string;
  email?: string;
  status?: string;
  priority?: string;
  page?: number;
  per_page?: number;
}

export interface AdminMessageUpdateRequest {
  status?: 'new' | 'unread' | 'read' | 'replied' | 'archived';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  admin_response?: string;
  tags?: string[];
}

/**
 * Types pour la gestion administrative des abonnements
 */
export interface AdminSubscription {
  id: number;
  user_id: number;
  plan_id: string;
  status: 'active' | 'inactive' | 'cancelled' | 'pending' | 'expired';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  created_at?: string;
  updated_at?: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
  plan?: {
    id: string;
    name: string;
    price: number;
    interval: 'month' | 'year';
  };
}

export interface AdminSubscriptionsResponse {
  subscriptions: AdminSubscription[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface AdminSubscriptionsStats {
  total_subscriptions: number;
  active_subscriptions: number;
  expired_subscriptions: number;
  cancelled_subscriptions: number;
  pending_subscriptions?: number;
  total_revenue?: number;
}

export interface AdminSubscriptionsQuery {
  page?: number;
  per_page?: number;
  status?: string;
  plan_id?: string;
}