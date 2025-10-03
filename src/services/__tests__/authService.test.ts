import { AuthService } from '../authService';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = jest.fn();

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
    localStorageMock.clear.mockImplementation(() => {});
  });

  describe('init', () => {
    it('should initialize and clean corrupted data', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      AuthService.init();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('corrompues détectées'),
        expect.any(Error)
      );
      expect(localStorageMock.removeItem).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should initialize successfully with valid data', () => {
      const validUser = { id: '1', email: 'test@example.com', username: 'test' };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(validUser));

      AuthService.init();

      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('clearAll', () => {
    it('should clear all tokens and user data', () => {
      AuthService.clearAll();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const credentials = { username: 'testuser', password: 'password' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
        }),
      });

      const result = await AuthService.login(credentials);

      expect(result).toEqual({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: {
          id: 'testuser',
          email: 'testuser@example.com',
          username: 'testuser',
        },
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'mock-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'mock-refresh');
    });

    it('should handle login error', async () => {
      const credentials = { username: 'testuser', password: 'wrong' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid credentials' }),
      });

      await expect(AuthService.login(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('should switch to bearer mode on CORS error', async () => {
      const credentials = { username: 'testuser', password: 'password' };
      
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Credential is not supported'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'mock-token',
            refresh_token: 'mock-refresh',
          }),
        });

      const result = await AuthService.login(credentials);

      expect(result.access_token).toBe('mock-token');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password',
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
        }),
      });

      const result = await AuthService.register(userData);

      expect(result).toEqual({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: {
          id: 'newuser',
          email: 'newuser@example.com',
          username: 'newuser',
        },
      });
    });

    it('should handle registration error', async () => {
      const userData = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password',
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'User already exists' }),
      });

      await expect(AuthService.register(userData)).rejects.toThrow('User already exists');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Logged out successfully' }),
      });

      await AuthService.logout();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });

    it('should clear local data even if server logout fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Server error'));

      await AuthService.logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('saveTokens', () => {
    it('should save tokens in bearer mode', () => {
      // Force bearer mode
      AuthService.forceAuthMode('bearer');

      AuthService.saveTokens('access-token', 'refresh-token');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-token');
    });

    it('should not save httponly-cookie tokens', () => {
      AuthService.forceAuthMode('bearer');

      AuthService.saveTokens('httponly-cookie', 'httponly-cookie');

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('getAccessToken', () => {
    it('should return access token from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('mock-access-token');

      const token = AuthService.getAccessToken();

      expect(token).toBe('mock-access-token');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('access_token');
    });

    it('should return null if no token', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const token = AuthService.getAccessToken();

      expect(token).toBeNull();
    });

    it('should return null on error', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const token = AuthService.getAccessToken();

      expect(token).toBeNull();
    });
  });

  describe('saveUser', () => {
    it('should save user to localStorage', () => {
      const user = { id: '1', email: 'test@example.com', username: 'test' };

      AuthService.saveUser(user);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(user)
      );
    });
  });

  describe('getUser', () => {
    it('should return user from localStorage', () => {
      const user = { id: '1', email: 'test@example.com', username: 'test' };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(user));

      const result = AuthService.getUser();

      expect(result).toEqual(user);
    });

    it('should return null if no user data', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = AuthService.getUser();

      expect(result).toBeNull();
    });

    it('should clear corrupted data and return null', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = AuthService.getUser();

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('corrompues'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if user exists in cookies mode', () => {
      AuthService.forceAuthMode('cookies');
      const user = { id: '1', email: 'test@example.com', username: 'test' };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(user));

      const isAuth = AuthService.isAuthenticated();

      expect(isAuth).toBe(true);
    });

    it('should return true if user and token exist in bearer mode', () => {
      AuthService.forceAuthMode('bearer');
      const user = { id: '1', email: 'test@example.com', username: 'test' };
      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify(user)) // getUser call
        .mockReturnValueOnce('valid-token'); // getAccessToken call

      const isAuth = AuthService.isAuthenticated();

      expect(isAuth).toBe(true);
    });

    it('should return false if no user', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const isAuth = AuthService.isAuthenticated();

      expect(isAuth).toBe(false);
    });

    it('should return false if no token in bearer mode', () => {
      AuthService.forceAuthMode('bearer');
      const user = { id: '1', email: 'test@example.com', username: 'test' };
      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify(user)) // getUser call
        .mockReturnValueOnce(null); // getAccessToken call

      const isAuth = AuthService.isAuthenticated();

      expect(isAuth).toBe(false);
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh token in cookies mode', async () => {
      AuthService.forceAuthMode('cookies');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
        }),
      });

      const result = await AuthService.refreshAccessToken();

      expect(result).toBe('new-access-token');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });

    it('should refresh token in bearer mode', async () => {
      AuthService.forceAuthMode('bearer');
      localStorageMock.getItem.mockReturnValue('valid-refresh-token');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
        }),
      });

      const result = await AuthService.refreshAccessToken();

      expect(result).toBe('new-access-token');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refresh_token: 'valid-refresh-token' }),
        })
      );
    });

    it('should logout on refresh failure', async () => {
      AuthService.forceAuthMode('cookies');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await AuthService.refreshAccessToken();

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });

    it('should logout if no refresh token in bearer mode', async () => {
      AuthService.forceAuthMode('bearer');
      localStorageMock.getItem.mockReturnValue(null);

      const result = await AuthService.refreshAccessToken();

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });

  describe('makeAuthenticatedRequest', () => {
    it('should make request with cookies', async () => {
      AuthService.forceAuthMode('cookies');
      const user = { id: '1', email: 'test@example.com', username: 'test' };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(user));
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const response = await AuthService.makeAuthenticatedRequest('/api/test');

      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });

    it('should make request with bearer token', async () => {
      AuthService.forceAuthMode('bearer');
      const user = { id: '1', email: 'test@example.com', username: 'test' };
      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify(user)) // getUser call
        .mockReturnValueOnce('valid-token'); // getAccessToken call
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const response = await AuthService.makeAuthenticatedRequest('/api/test');

      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token',
          }),
        })
      );
    });

    it('should throw error if not authenticated', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      await expect(
        AuthService.makeAuthenticatedRequest('/api/test')
      ).rejects.toThrow('Utilisateur non authentifié');
    });

    it('should refresh token on 401 and retry', async () => {
      AuthService.forceAuthMode('bearer');
      const user = { id: '1', email: 'test@example.com', username: 'test' };
      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify(user)) // getUser call
        .mockReturnValueOnce('expired-token'); // getAccessToken call
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'new-token',
            refresh_token: 'new-refresh',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
        });

      const response = await AuthService.makeAuthenticatedRequest('/api/test');

      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('testBackendAuth', () => {
    it('should test cookies auth successfully', async () => {
      AuthService.forceAuthMode('cookies');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: 'test' }),
      });

      const result = await AuthService.testBackendAuth();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/me'),
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });

    it('should test bearer auth successfully', async () => {
      AuthService.forceAuthMode('bearer');
      localStorageMock.getItem.mockReturnValue('valid-token');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: 'test' }),
      });

      const result = await AuthService.testBackendAuth();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token',
          }),
        })
      );
    });

    it('should return false on auth failure', async () => {
      AuthService.forceAuthMode('bearer');
      localStorageMock.getItem.mockReturnValue('invalid-token');
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await AuthService.testBackendAuth();

      expect(result).toBe(false);
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile from localStorage', async () => {
      const user = { id: '1', email: 'test@example.com', username: 'test' };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(user));

      const profile = await AuthService.getUserProfile();

      expect(profile).toEqual({
        email: 'test@example.com',
        username: 'test',
        id: 1,
        is_active: true,
        is_verified: true,
        is_admin: false,
        created_at: expect.any(String),
      });
    });

    it('should throw error if no user data', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      await expect(AuthService.getUserProfile()).rejects.toThrow(
        'Données utilisateur non trouvées'
      );
    });
  });

  describe('forgotPassword', () => {
    it('should send forgot password request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Email sent' }),
      });

      const result = await AuthService.forgotPassword('test@example.com');

      expect(result).toEqual({
        success: true,
        message: 'Email sent',
      });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/forgot-password'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ email: 'test@example.com' }),
        })
      );
    });

    it('should handle forgot password error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'User not found' }),
      });

      const result = await AuthService.forgotPassword('nonexistent@example.com');

      expect(result).toEqual({
        success: false,
        message: 'User not found',
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Password reset successful' }),
      });

      const result = await AuthService.resetPassword('token123', 'newpassword');

      expect(result).toEqual({
        success: true,
        message: 'Password reset successful',
      });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/reset-password'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({
            token: 'token123',
            new_password: 'newpassword',
          }),
        })
      );
    });

    it('should handle reset password error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid token' }),
      });

      const result = await AuthService.resetPassword('invalid-token', 'newpassword');

      expect(result).toEqual({
        success: false,
        message: 'Invalid token',
      });
    });
  });
});
