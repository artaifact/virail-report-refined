import { AuthService } from '@/services/authService';
import type { Notification } from '@/hooks/useNotificationSocket';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return import.meta.env.DEV ? 'http://localhost:8000' : 'https://api.viraill.com';
};

const API_BASE_URL = getApiBaseUrl();

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

interface NotificationStats {
  total: number;
  unread: number;
  by_type: Record<string, number>;
}

/**
 * Récupère la liste des notifications
 */
export async function getNotifications(
  page = 1,
  perPage = 20,
  unreadOnly = false
): Promise<NotificationsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });
  if (unreadOnly) {
    params.append('unread_only', 'true');
  }

  const response = await AuthService.makeAuthenticatedRequest(
    `${API_BASE_URL}/api/v1/notifications?${params}`,
    { method: 'GET' }
  );

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des notifications');
  }

  return response.json();
}

/**
 * Récupère le nombre de notifications non lues
 */
export async function getUnreadCount(): Promise<{ count: number }> {
  const response = await AuthService.makeAuthenticatedRequest(
    `${API_BASE_URL}/api/v1/notifications/unread-count`,
    { method: 'GET' }
  );

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération du compteur');
  }

  return response.json();
}

/**
 * Récupère les statistiques des notifications
 */
export async function getNotificationStats(): Promise<NotificationStats> {
  const response = await AuthService.makeAuthenticatedRequest(
    `${API_BASE_URL}/api/v1/notifications/stats`,
    { method: 'GET' }
  );

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des statistiques');
  }

  return response.json();
}

/**
 * Marque une notification comme lue
 */
export async function markNotificationAsRead(notificationId: number): Promise<void> {
  const response = await AuthService.makeAuthenticatedRequest(
    `${API_BASE_URL}/api/v1/notifications/${notificationId}/read`,
    { method: 'PUT' }
  );

  if (!response.ok) {
    throw new Error('Erreur lors du marquage de la notification');
  }
}

/**
 * Marque toutes les notifications comme lues
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  const response = await AuthService.makeAuthenticatedRequest(
    `${API_BASE_URL}/api/v1/notifications/read-all`,
    { method: 'PUT' }
  );

  if (!response.ok) {
    throw new Error('Erreur lors du marquage des notifications');
  }
}

/**
 * Archive une notification
 */
export async function archiveNotification(notificationId: number): Promise<void> {
  const response = await AuthService.makeAuthenticatedRequest(
    `${API_BASE_URL}/api/v1/notifications/${notificationId}/archive`,
    { method: 'PUT' }
  );

  if (!response.ok) {
    throw new Error('Erreur lors de l\'archivage de la notification');
  }
}

/**
 * Supprime une notification
 */
export async function deleteNotification(notificationId: number): Promise<void> {
  const response = await AuthService.makeAuthenticatedRequest(
    `${API_BASE_URL}/api/v1/notifications/${notificationId}`,
    { method: 'DELETE' }
  );

  if (!response.ok) {
    throw new Error('Erreur lors de la suppression de la notification');
  }
}
