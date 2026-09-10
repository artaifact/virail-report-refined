import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { AuthService } from '@/services/authService';
import { apiService } from '@/services/apiService';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Analyses } from '@/pages/Analyses';
import { AuthProvider } from '@/contexts/AuthContext';
import { SelectedReportProvider } from '@/contexts/SelectedReportContext';

// Mock dependencies
const mockNavigate = jest.fn();

jest.mock('@/services/authService');
jest.mock('@/services/apiService');
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));
jest.mock('@/hooks/useReports', () => ({
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
  getLatestReportId: () => null,
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;
const mockApiService = apiService as jest.Mocked<typeof apiService>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <SelectedReportProvider>
        <AuthProvider>
          {component}
        </AuthProvider>
      </SelectedReportProvider>
    </BrowserRouter>
  );
};

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.isAuthenticated.mockReturnValue(false);
    mockAuthService.getUser.mockReturnValue(null);
    mockApiService.getMeBearer.mockResolvedValue(null as any);
  });

  describe('Login Flow', () => {
    it('should complete login form submission', async () => {
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

      mockAuthService.login.mockResolvedValue(mockResponse as any);

      renderWithRouter(<Login />);

      // Wait for auth initialization to finish loading
      const submitButton = await screen.findByRole('button', { name: /se connecter/i });
      expect(submitButton).toBeEnabled();

      const usernameInput = screen.getByPlaceholderText("Votre nom d'utilisateur");
      const passwordInput = screen.getByPlaceholderText('••••••••');
      
      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');

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
      
      mockAuthService.login.mockRejectedValue(new Error('Identifiants invalides'));

      renderWithRouter(<Login />);

      const submitButton = await screen.findByRole('button', { name: /se connecter/i });
      expect(submitButton).toBeEnabled();

      const usernameInput = screen.getByPlaceholderText("Votre nom d'utilisateur");
      const passwordInput = screen.getByPlaceholderText('••••••••');
      
      await user.type(usernameInput, 'invaliduser');
      await user.type(passwordInput, 'wrongpassword');

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalledWith({
          username: 'invaliduser',
          password: 'wrongpassword',
        });
      });
    });

    it('should validate required fields on submit', async () => {
      const user = userEvent.setup();

      renderWithRouter(<Login />);

      const submitButton = await screen.findByRole('button', { name: /se connecter/i });
      expect(submitButton).toBeEnabled();

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Nom d'utilisateur requis")).toBeInTheDocument();
        expect(screen.getByText('Mot de passe requis')).toBeInTheDocument();
      });
    });
  });

  describe('Registration Flow', () => {
    it('should validate password confirmation match', async () => {
      const user = userEvent.setup();

      renderWithRouter(<Register />);

      const submitButton = await screen.findByRole('button', { name: /créer mon compte/i });

      const usernameInput = screen.getByPlaceholderText("Votre nom d'utilisateur");
      const emailInput = screen.getByPlaceholderText('vous@entreprise.com');
      const passwordInput = screen.getByPlaceholderText('Votre mot de passe');
      const confirmPasswordInput = screen.getByPlaceholderText('••••••••');
      const termsCheckbox = screen.getByRole('checkbox');
      
      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'Password123!@#');
      await user.type(confirmPasswordInput, 'DifferentPassword!@#');
      await user.click(termsCheckbox);

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/les mots de passe ne correspondent pas/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();

      renderWithRouter(<Register />);

      const submitButton = await screen.findByRole('button', { name: /créer mon compte/i });

      const usernameInput = screen.getByPlaceholderText("Votre nom d'utilisateur");
      const emailInput = screen.getByPlaceholderText('vous@entreprise.com');
      const passwordInput = screen.getByPlaceholderText('Votre mot de passe');
      const confirmPasswordInput = screen.getByPlaceholderText('••••••••');
      const termsCheckbox = screen.getByRole('checkbox');
      
      await user.type(usernameInput, 'newuser');
      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'Password123!@#');
      await user.type(confirmPasswordInput, 'Password123!@#');
      await user.click(termsCheckbox);

      fireEvent.submit(submitButton.closest('form')!);

      await waitFor(() => {
        expect(screen.getByText(/veuillez entrer une adresse email valide/i)).toBeInTheDocument();
      });
    });
  });

  describe('Protected Route Access', () => {
    it('should redirect to login when not authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      renderWithRouter(<Analyses />);

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('should allow access when authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getUser.mockReturnValue({
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
      });

      renderWithRouter(<Analyses />);

      expect(screen.getAllByText('Analyses GEO').length).toBeGreaterThan(0);
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

      mockAuthService.init();
      mockAuthService.isAuthenticated();

      expect(mockAuthService.init).toHaveBeenCalled();
      expect(mockAuthService.isAuthenticated).toHaveBeenCalled();
    });

    it('should handle corrupted session data', () => {
      mockAuthService.init.mockImplementation(() => {
        mockAuthService.clearAll();
      });

      mockAuthService.init();

      expect(mockAuthService.clearAll).toHaveBeenCalled();
    });
  });
});
