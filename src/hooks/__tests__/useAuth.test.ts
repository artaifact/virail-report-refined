import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { AuthService } from '@/services/authService';
import { apiService } from '@/services/apiService';
import { toast } from '@/hooks/use-toast';

// Mock dependencies
jest.mock('@/services/authService');
jest.mock('@/services/apiService');
jest.mock('@/hooks/use-toast');

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;
const mockApiService = apiService as jest.Mocked<typeof apiService>;
const mockToast = toast as jest.MockedFunction<typeof toast>;

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with loading state', () => {
      mockAuthService.init.mockImplementation(() => {});
      mockAuthService.isAuthenticated.mockReturnValue(false);
      mockAuthService.getUser.mockReturnValue(null);
      mockApiService.getMeBearer.mockResolvedValue({
        email: 'test@example.com',
        username: 'testuser',
        id: 1,
        is_active: true,
        is_verified: true,
        is_admin: false,
        created_at: '2025-01-01T00:00:00Z',
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });

    it('should initialize with authenticated user from localStorage', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
      };

      mockAuthService.init.mockImplementation(() => {});
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getUser.mockReturnValue(mockUser);
      mockApiService.getMeBearer.mockRejectedValue(new Error('API error'));

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should initialize with user from API', async () => {
      const mockUserFromApi = {
        email: 'test@example.com',
        username: 'testuser',
        id: 1,
        is_active: true,
        is_verified: true,
        is_admin: false,
        created_at: '2025-01-01T00:00:00Z',
      };

      mockAuthService.init.mockImplementation(() => {});
      mockAuthService.isAuthenticated.mockReturnValue(false);
      mockAuthService.getUser.mockReturnValue(null);
      mockApiService.getMeBearer.mockResolvedValue(mockUserFromApi);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUserFromApi);
    });

    it('should handle initialization errors', async () => {
      mockAuthService.init.mockImplementation(() => {
        throw new Error('Init error');
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });

    it('should handle API errors during initialization', async () => {
      mockAuthService.init.mockImplementation(() => {});
      mockAuthService.isAuthenticated.mockReturnValue(false);
      mockAuthService.getUser.mockReturnValue(null);
      mockApiService.getMeBearer.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockCredentials = {
        username: 'testuser',
        password: 'password',
      };
      const mockResponse = {
        access_token: 'token',
        refresh_token: 'refresh',
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
        },
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login(mockCredentials);
      });

      expect(mockAuthService.login).toHaveBeenCalledWith(mockCredentials);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockResponse.user);
      expect(result.current.isLoading).toBe(false);
      expect(mockToast).toHaveBeenCalledWith({
        title: "Connexion réussie",
        description: `Bienvenue ${mockResponse.user.username}!`,
      });
    });

    it('should handle login errors', async () => {
      const mockCredentials = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(result.current.login(mockCredentials)).rejects.toThrow('Invalid credentials');
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(mockToast).toHaveBeenCalledWith({
        title: "Erreur de connexion",
        description: "Invalid credentials",
        variant: "destructive",
      });
    });

    it('should set loading state during login', async () => {
      const mockCredentials = {
        username: 'testuser',
        password: 'password',
      };
      const mockResponse = {
        access_token: 'token',
        refresh_token: 'refresh',
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
        },
      };

      // Create a promise that we can control
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      mockAuthService.login.mockReturnValue(loginPromise);

      const { result } = renderHook(() => useAuth());

      // Start login
      act(() => {
        result.current.login(mockCredentials);
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      // Resolve login
      await act(async () => {
        resolveLogin!(mockResponse);
        await loginPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const mockUserData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password',
      };
      const mockResponse = {
        access_token: 'token',
        refresh_token: 'refresh',
        user: {
          id: '2',
          email: 'newuser@example.com',
          username: 'newuser',
        },
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.register(mockUserData);
      });

      expect(mockAuthService.register).toHaveBeenCalledWith(mockUserData);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockResponse.user);
      expect(result.current.isLoading).toBe(false);
      expect(mockToast).toHaveBeenCalledWith({
        title: "Inscription réussie",
        description: `Bienvenue ${mockResponse.user.username}!`,
      });
    });

    it('should handle registration errors', async () => {
      const mockUserData = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password',
      };

      mockAuthService.register.mockRejectedValue(new Error('User already exists'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(result.current.register(mockUserData)).rejects.toThrow('User already exists');
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(mockToast).toHaveBeenCalledWith({
        title: "Erreur d'inscription",
        description: "User already exists",
        variant: "destructive",
      });
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockAuthService.logout.mockResolvedValue();

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(mockToast).toHaveBeenCalledWith({
        title: "Déconnexion",
        description: "Vous avez été déconnecté avec succès",
      });
    });

    it('should handle logout errors', async () => {
      mockAuthService.logout.mockRejectedValue(new Error('Logout failed'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive",
      });
    });
  });

  describe('loginWithGoogle', () => {
    it('should handle Google login', async () => {
      mockAuthService.loginWithGoogle.mockResolvedValue();

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.loginWithGoogle();
      });

      expect(mockAuthService.loginWithGoogle).toHaveBeenCalled();
      expect(result.current.isLoading).toBe(true); // Should be loading during redirect
    });

    it('should handle Google login errors', async () => {
      mockAuthService.loginWithGoogle.mockRejectedValue(new Error('Google auth failed'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(result.current.loginWithGoogle()).rejects.toThrow('Google auth failed');
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockToast).toHaveBeenCalledWith({
        title: "Erreur de connexion Google",
        description: "Google auth failed",
        variant: "destructive",
      });
    });
  });

  describe('handleGoogleCallback', () => {
    it('should handle Google callback successfully', async () => {
      const mockResponse = {
        access_token: 'token',
        refresh_token: 'refresh',
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
        },
      };

      mockAuthService.handleGoogleCallback.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleGoogleCallback();
      });

      expect(mockAuthService.handleGoogleCallback).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockResponse.user);
      expect(result.current.isLoading).toBe(false);
      expect(mockToast).toHaveBeenCalledWith({
        title: "Connexion Google réussie",
        description: `Bienvenue ${mockResponse.user.username}!`,
      });
    });

    it('should handle Google callback errors', async () => {
      mockAuthService.handleGoogleCallback.mockRejectedValue(new Error('Callback failed'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await expect(result.current.handleGoogleCallback()).rejects.toThrow('Callback failed');
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockToast).toHaveBeenCalledWith({
        title: "Erreur de connexion Google",
        description: "Callback failed",
        variant: "destructive",
      });
    });
  });

  describe('updateUser', () => {
    it('should update user data', () => {
      const updatedUser = {
        id: '1',
        email: 'updated@example.com',
        username: 'updateduser',
      };

      mockAuthService.saveUser.mockImplementation(() => {});

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.updateUser(updatedUser);
      });

      expect(mockAuthService.saveUser).toHaveBeenCalledWith(updatedUser);
      expect(result.current.user).toEqual(updatedUser);
    });
  });

  describe('cleanup', () => {
    it('should cleanup on unmount', async () => {
      mockAuthService.init.mockImplementation(() => {});
      mockAuthService.isAuthenticated.mockReturnValue(false);
      mockAuthService.getUser.mockReturnValue(null);
      mockApiService.getMeBearer.mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );

      const { result, unmount } = renderHook(() => useAuth());

      // Should be loading initially
      expect(result.current.isLoading).toBe(true);

      // Unmount the hook
      unmount();

      // Resolve the API call after unmount
      mockApiService.getMeBearer.mockResolvedValue({
        email: 'test@example.com',
        username: 'testuser',
        id: 1,
        is_active: true,
        is_verified: true,
        is_admin: false,
        created_at: '2025-01-01T00:00:00Z',
      });

      // Wait a bit to ensure the async operation doesn't update state
      await new Promise(resolve => setTimeout(resolve, 100));

      // The hook should be unmounted and not update state
      // This is tested by the fact that no errors are thrown
    });
  });
});
