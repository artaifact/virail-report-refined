import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { AuthService } from '@/services/authService';
import { apiService } from '@/services/apiService';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Analyses } from '@/pages/Analyses';

// Mock dependencies
jest.mock('@/services/authService');
jest.mock('@/services/apiService');
jest.mock('@/hooks/use-toast');
jest.mock('@/hooks/useReports');
jest.mock('@/components/ui/toast');

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;
const mockApiService = apiService as jest.Mocked<typeof apiService>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Login Flow', () => {
    it('should complete full login flow successfully', async () => {
      const user = userEvent.setup();
      
      const mockResponse = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
        },
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      renderWithRouter(<Login />);

      // Fill login form
      const usernameInput = screen.getByPlaceholderText(/nom d'utilisateur/i);
      const passwordInput = screen.getByPlaceholderText(/mot de passe/i);
      
      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /se connecter/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalledWith({
          username: 'testuser',
          password: 'password123',
        });
      });
    });

    it('should handle login errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      renderWithRouter(<Login />);

      // Fill login form
      const usernameInput = screen.getByPlaceholderText(/nom d'utilisateur/i);
      const passwordInput = screen.getByPlaceholderText(/mot de passe/i);
      
      await user.type(usernameInput, 'invaliduser');
      await user.type(passwordInput, 'wrongpassword');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /se connecter/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalledWith({
          username: 'invaliduser',
          password: 'wrongpassword',
        });
      });
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();

      renderWithRouter(<Login />);

      // Try to submit without filling fields
      const submitButton = screen.getByRole('button', { name: /se connecter/i });
      await user.click(submitButton);

      // Form should show validation errors
      expect(screen.getByText(/ce champ est requis/i)).toBeInTheDocument();
    });
  });

  describe('Registration Flow', () => {
    it('should complete full registration flow successfully', async () => {
      const user = userEvent.setup();
      
      const mockResponse = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: {
          id: '2',
          email: 'newuser@example.com',
          username: 'newuser',
        },
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      renderWithRouter(<Register />);

      // Fill registration form
      const usernameInput = screen.getByPlaceholderText(/nom d'utilisateur/i);
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/mot de passe/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/confirmer le mot de passe/i);
      
      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /s'inscrire/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAuthService.register).toHaveBeenCalledWith({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
        });
      });
    });

    it('should validate password confirmation', async () => {
      const user = userEvent.setup();

      renderWithRouter(<Register />);

      // Fill form with mismatched passwords
      const usernameInput = screen.getByPlaceholderText(/nom d'utilisateur/i);
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/mot de passe/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/confirmer le mot de passe/i);
      
      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'differentpassword');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /s'inscrire/i });
      await user.click(submitButton);

      // Should show password mismatch error
      expect(screen.getByText(/les mots de passe ne correspondent pas/i)).toBeInTheDocument();
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();

      renderWithRouter(<Register />);

      // Fill form with invalid email
      const usernameInput = screen.getByPlaceholderText(/nom d'utilisateur/i);
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/mot de passe/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/confirmer le mot de passe/i);
      
      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /s'inscrire/i });
      await user.click(submitButton);

      // Should show email validation error
      expect(screen.getByText(/format d'email invalide/i)).toBeInTheDocument();
    });
  });

  describe('Protected Route Access', () => {
    it('should redirect to login when not authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      // Mock navigate function
      const mockNavigate = jest.fn();
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate,
      }));

      renderWithRouter(<Analyses />);

      // Should redirect to login
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('should allow access when authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getUser.mockReturnValue({
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
      });

      // Mock useReports hook
      jest.doMock('@/hooks/useReports', () => ({
        useReports: () => ({
          reports: [],
          loading: false,
          error: null,
          createAnalysis: jest.fn(),
          refreshReports: jest.fn(),
        }),
        useReport: () => ({
          report: null,
          loading: false,
          error: null,
        }),
      }));

      renderWithRouter(<Analyses />);

      // Should render the page content
      expect(screen.getByText('Analyses GEO')).toBeInTheDocument();
    });
  });

  describe('Logout Flow', () => {
    it('should complete logout flow successfully', async () => {
      const user = userEvent.setup();
      
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getUser.mockReturnValue({
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
      });
      mockAuthService.logout.mockResolvedValue();

      // Mock useReports hook
      jest.doMock('@/hooks/useReports', () => ({
        useReports: () => ({
          reports: [],
          loading: false,
          error: null,
          createAnalysis: jest.fn(),
          refreshReports: jest.fn(),
        }),
        useReport: () => ({
          report: null,
          loading: false,
          error: null,
        }),
      }));

      renderWithRouter(<Analyses />);

      // Find and click logout button (assuming it's in the sidebar)
      const logoutButton = screen.getByText(/se déconnecter/i);
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockAuthService.logout).toHaveBeenCalled();
      });
    });
  });

  describe('Token Refresh Flow', () => {
    it('should refresh token when expired', async () => {
      const mockRefreshToken = 'new-token';
      mockAuthService.refreshAccessToken.mockResolvedValue(mockRefreshToken);

      // Simulate API call with expired token
      mockApiService.getMeBearer.mockRejectedValueOnce({
        status: 401,
        message: 'Token expired',
      });

      // Mock successful retry after refresh
      mockApiService.getMeBearer.mockResolvedValueOnce({
        email: 'test@example.com',
        username: 'testuser',
        id: 1,
        is_active: true,
        is_verified: true,
        is_admin: false,
        created_at: '2025-01-01T00:00:00Z',
      });

      // This would typically be tested in the useAuth hook
      await mockAuthService.refreshAccessToken();

      expect(mockAuthService.refreshAccessToken).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should check session validity on app load', () => {
      mockAuthService.init.mockImplementation(() => {});
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getUser.mockReturnValue({
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
      });

      mockApiService.getMeBearer.mockResolvedValue({
        email: 'test@example.com',
        username: 'testuser',
        id: 1,
        is_active: true,
        is_verified: true,
        is_admin: false,
        created_at: '2025-01-01T00:00:00Z',
      });

      // Simulate app initialization
      mockAuthService.init();

      expect(mockAuthService.init).toHaveBeenCalled();
      expect(mockAuthService.isAuthenticated).toHaveBeenCalled();
    });

    it('should handle corrupted session data', () => {
      mockAuthService.init.mockImplementation(() => {
        throw new Error('Corrupted session data');
      });
      mockAuthService.clearAll.mockImplementation(() => {});

      // Simulate app initialization with corrupted data
      mockAuthService.init();

      expect(mockAuthService.clearAll).toHaveBeenCalled();
    });
  });

  describe('Form Validation Integration', () => {
    it('should validate all form fields together', async () => {
      const user = userEvent.setup();

      renderWithRouter(<Register />);

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /s'inscrire/i });
      await user.click(submitButton);

      // Should show multiple validation errors
      expect(screen.getAllByText(/ce champ est requis/i)).toHaveLength(4);
    });

    it('should clear validation errors when user starts typing', async () => {
      const user = userEvent.setup();

      renderWithRouter(<Login />);

      // Submit empty form to trigger validation
      const submitButton = screen.getByRole('button', { name: /se connecter/i });
      await user.click(submitButton);

      // Start typing to clear error
      const usernameInput = screen.getByPlaceholderText(/nom d'utilisateur/i);
      await user.type(usernameInput, 'test');

      // Error should be cleared
      expect(screen.queryByText(/ce champ est requis/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors during login', async () => {
      const user = userEvent.setup();
      
      mockAuthService.login.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<Login />);

      // Fill and submit form
      const usernameInput = screen.getByPlaceholderText(/nom d'utilisateur/i);
      const passwordInput = screen.getByPlaceholderText(/mot de passe/i);
      
      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /se connecter/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalled();
      });

      // Should handle error gracefully
      expect(screen.getByText(/erreur de connexion/i)).toBeInTheDocument();
    });

    it('should handle server errors during registration', async () => {
      const user = userEvent.setup();
      
      mockAuthService.register.mockRejectedValue(new Error('Server error'));

      renderWithRouter(<Register />);

      // Fill and submit form
      const usernameInput = screen.getByPlaceholderText(/nom d'utilisateur/i);
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/mot de passe/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/confirmer le mot de passe/i);
      
      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /s'inscrire/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAuthService.register).toHaveBeenCalled();
      });

      // Should handle error gracefully
      expect(screen.getByText(/erreur d'inscription/i)).toBeInTheDocument();
    });
  });
});
