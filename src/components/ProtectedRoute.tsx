import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { AuthService } from '@/services/authService';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const location = useLocation();

  console.log('🔐 ProtectedRoute - État actuel:', {
    isLoading,
    isAuthenticated,
    user: user?.username || 'aucun',
    currentPath: location.pathname
  });

  if (isLoading) {
    console.log('⏳ ProtectedRoute - Chargement en cours...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🚫 ProtectedRoute - Non authentifié, redirection vers /login');
    // Rediriger vers la page de connexion avec l'URL de redirection
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('✅ ProtectedRoute - Authentifié, accès autorisé');
  return <>{children}</>;
} 

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Détection admin robuste: localStorage (AuthService) puis contexte
  const localUser = (AuthService.getUser && AuthService.getUser()) as any;
  const isAdmin = (localUser?.is_admin || localUser?.isAdmin) ?? ((user as any)?.is_admin || (user as any)?.isAdmin);
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}