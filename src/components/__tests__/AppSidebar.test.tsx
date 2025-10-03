import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppSidebar } from '../AppSidebar';
import { usePayment } from '@/contexts/PaymentContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { AuthService } from '@/services/authService';

// Mock dependencies
jest.mock('@/contexts/PaymentContext');
jest.mock('@/contexts/AuthContext');
jest.mock('@/services/authService');

const mockUsePayment = usePayment as jest.MockedFunction<typeof usePayment>;
const mockUseAuthContext = useAuthContext as jest.MockedFunction<typeof useAuthContext>;
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

// Mock React Router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    pathname: '/',
  }),
}));

// Mock icons
jest.mock('lucide-react', () => ({
  LayoutDashboard: () => <div data-testid="dashboard-icon">Dashboard</div>,
  LineChart: () => <div data-testid="analyses-icon">Analyses</div>,
  Trophy: () => <div data-testid="trophy-icon">Trophy</div>,
  Globe2: () => <div data-testid="globe-icon">Globe</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  CircleHelp: () => <div data-testid="help-icon">Help</div>,
  Crown: () => <div data-testid="crown-icon">Crown</div>,
  ShieldCheck: () => <div data-testid="shield-icon">Shield</div>,
  UserCog: () => <div data-testid="user-icon">User</div>,
  BadgeDollarSign: () => <div data-testid="dollar-icon">Dollar</div>,
  ChevronRight: () => <div data-testid="chevron-icon">Chevron</div>,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AppSidebar', () => {
  const mockPaymentContext = {
    subscription: {
      plan: 'premium',
      status: 'active',
      expires_at: '2025-12-31T23:59:59Z',
    },
    usage: {
      analyses_used: 5,
      reports_used: 2,
      competitor_analyses_used: 1,
      optimizations_used: 0,
    },
    limits: {
      analyses_limit: 10,
      reports_limit: 5,
      competitor_analyses_limit: 3,
      optimizations_limit: 2,
    },
    isLoading: false,
    error: null,
    refreshSubscription: jest.fn(),
    refreshUsage: jest.fn(),
  };

  const mockAuthContext = {
    user: {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
    },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePayment.mockReturnValue(mockPaymentContext);
    mockUseAuthContext.mockReturnValue(mockAuthContext);
    mockAuthService.logout.mockResolvedValue();
  });

  it('should render sidebar with navigation items', () => {
    renderWithRouter(<AppSidebar />);

    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
    expect(screen.getByText('Analyses GEO')).toBeInTheDocument();
    expect(screen.getByText('Analyse concurrentielle')).toBeInTheDocument();
    expect(screen.getByText('Optimisation de site')).toBeInTheDocument();
    expect(screen.getByText('Optimisation textuelle')).toBeInTheDocument();
  });

  it('should render subscription plan badge', () => {
    renderWithRouter(<AppSidebar />);

    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('should render user info when authenticated', () => {
    renderWithRouter(<AppSidebar />);

    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should handle logout when logout button is clicked', async () => {
    renderWithRouter(<AppSidebar />);

    const logoutButton = screen.getByText('Se déconnecter');
    fireEvent.click(logoutButton);

    expect(mockAuthContext.logout).toHaveBeenCalled();
  });

  it('should display usage information', () => {
    renderWithRouter(<AppSidebar />);

    expect(screen.getByText('Analyses: 5/10')).toBeInTheDocument();
    expect(screen.getByText('Rapports: 2/5')).toBeInTheDocument();
    expect(screen.getByText('Concurrents: 1/3')).toBeInTheDocument();
    expect(screen.getByText('Optimisations: 0/2')).toBeInTheDocument();
  });

  it('should render navigation links with correct hrefs', () => {
    renderWithRouter(<AppSidebar />);

    const dashboardLink = screen.getByText('Tableau de bord').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/');

    const analysesLink = screen.getByText('Analyses GEO').closest('a');
    expect(analysesLink).toHaveAttribute('href', '/analyses');

    const competitionLink = screen.getByText('Analyse concurrentielle').closest('a');
    expect(competitionLink).toHaveAttribute('href', '/competition');
  });

  it('should render icons for navigation items', () => {
    renderWithRouter(<AppSidebar />);

    expect(screen.getByTestId('dashboard-icon')).toBeInTheDocument();
    expect(screen.getByTestId('analyses-icon')).toBeInTheDocument();
    expect(screen.getByTestId('trophy-icon')).toBeInTheDocument();
  });

  it('should render pricing link', () => {
    renderWithRouter(<AppSidebar />);

    const pricingLink = screen.getByText('Plans & Tarifs').closest('a');
    expect(pricingLink).toHaveAttribute('href', '/pricing');
  });

  it('should render profile link', () => {
    renderWithRouter(<AppSidebar />);

    const profileLink = screen.getByText('Profile').closest('a');
    expect(profileLink).toHaveAttribute('href', '/profile');
  });

  it('should render help link', () => {
    renderWithRouter(<AppSidebar />);

    const helpLink = screen.getByText('Aide').closest('a');
    expect(helpLink).toHaveAttribute('href', '/help');
  });

  it('should handle missing subscription data', () => {
    const contextWithoutSubscription = {
      ...mockPaymentContext,
      subscription: null,
    };
    mockUsePayment.mockReturnValue(contextWithoutSubscription);

    renderWithRouter(<AppSidebar />);

    // Should not crash and should render basic navigation
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
  });

  it('should handle missing usage data', () => {
    const contextWithoutUsage = {
      ...mockPaymentContext,
      usage: null,
    };
    mockUsePayment.mockReturnValue(contextWithoutUsage);

    renderWithRouter(<AppSidebar />);

    // Should not crash and should render basic navigation
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    const loadingContext = {
      ...mockPaymentContext,
      isLoading: true,
    };
    mockUsePayment.mockReturnValue(loadingContext);

    renderWithRouter(<AppSidebar />);

    // Should render even when loading
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
  });

  it('should render logo', () => {
    renderWithRouter(<AppSidebar />);

    const logo = screen.getByAltText('Virail Studio');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/LOGO BLEU FOND TRANSPARENT (1).png');
  });

  it('should apply correct CSS classes for dark theme', () => {
    renderWithRouter(<AppSidebar />);

    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('bg-neutral-950');
    expect(sidebar).toHaveClass('shadow-xl');
  });

  it('should render with correct text size classes', () => {
    renderWithRouter(<AppSidebar />);

    const navigationItems = screen.getAllByRole('button');
    navigationItems.forEach(item => {
      if (item.textContent?.includes('Tableau de bord') || 
          item.textContent?.includes('Analyses GEO') ||
          item.textContent?.includes('Analyse concurrentielle')) {
        expect(item).toHaveClass('text-xs');
      }
    });
  });

  it('should handle navigation item clicks', () => {
    renderWithRouter(<AppSidebar />);

    const analysesButton = screen.getByText('Analyses GEO').closest('button');
    if (analysesButton) {
      fireEvent.click(analysesButton);
      // Navigation should work through React Router
    }

    expect(analysesButton).toBeInTheDocument();
  });

  it('should render export link', () => {
    renderWithRouter(<AppSidebar />);

    const exportLink = screen.getByText('Export').closest('a');
    expect(exportLink).toHaveAttribute('href', '/export');
  });

  it('should render admin link for admin users', () => {
    const adminContext = {
      ...mockAuthContext,
      user: {
        ...mockAuthContext.user,
        is_admin: true,
      },
    };
    mockUseAuthContext.mockReturnValue(adminContext);

    renderWithRouter(<AppSidebar />);

    const adminLink = screen.getByText('Administration').closest('a');
    expect(adminLink).toHaveAttribute('href', '/admin');
  });

  it('should not render admin link for non-admin users', () => {
    renderWithRouter(<AppSidebar />);

    expect(screen.queryByText('Administration')).not.toBeInTheDocument();
  });

  it('should handle error state in payment context', () => {
    const errorContext = {
      ...mockPaymentContext,
      error: 'Payment error',
    };
    mockUsePayment.mockReturnValue(errorContext);

    renderWithRouter(<AppSidebar />);

    // Should still render navigation despite error
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
  });

  it('should render usage progress indicators', () => {
    renderWithRouter(<AppSidebar />);

    // Check that usage information is displayed
    expect(screen.getByText(/Analyses: \d+\/\d+/)).toBeInTheDocument();
    expect(screen.getByText(/Rapports: \d+\/\d+/)).toBeInTheDocument();
    expect(screen.getByText(/Concurrents: \d+\/\d+/)).toBeInTheDocument();
    expect(screen.getByText(/Optimisations: \d+\/\d+/)).toBeInTheDocument();
  });

  it('should handle different subscription plans', () => {
    const basicContext = {
      ...mockPaymentContext,
      subscription: {
        ...mockPaymentContext.subscription,
        plan: 'basic',
      },
    };
    mockUsePayment.mockReturnValue(basicContext);

    renderWithRouter(<AppSidebar />);

    expect(screen.getByText('Basic')).toBeInTheDocument();
  });

  it('should handle expired subscription', () => {
    const expiredContext = {
      ...mockPaymentContext,
      subscription: {
        ...mockPaymentContext.subscription,
        status: 'expired',
      },
    };
    mockUsePayment.mockReturnValue(expiredContext);

    renderWithRouter(<AppSidebar />);

    // Should still render but maybe show different styling
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });
});
