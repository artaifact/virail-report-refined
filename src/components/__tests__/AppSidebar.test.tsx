import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppSidebar } from '../AppSidebar';
import { SidebarProvider } from '../ui/sidebar';
import { usePayment } from '@/contexts/PaymentContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { AuthService } from '@/services/authService';

// Mock dependencies
jest.mock('@/contexts/PaymentContext');
jest.mock('@/contexts/AuthContext');
jest.mock('@/services/authService');
jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));
jest.mock('@/hooks/useReports', () => ({
  useReports: () => ({ reports: [] }),
  useReport: () => ({ report: null }),
  getLatestReportId: () => null,
}));

const mockUsePayment = usePayment as jest.MockedFunction<typeof usePayment>;
const mockUseAuthContext = useAuthContext as jest.MockedFunction<typeof useAuthContext>;
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

// Mock React Router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}));

// Mock subcomponents
jest.mock('../NewAnalysisModal', () => ({
  NewAnalysisModal: () => null,
}));
jest.mock('../NotificationBell', () => ({
  NotificationBell: () => null,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <SidebarProvider>
        {component}
      </SidebarProvider>
    </BrowserRouter>
  );
};

describe('AppSidebar', () => {
  const mockPaymentContext: any = {
    subscription: {
      plan: 'premium',
      status: 'active',
      expires_at: '2025-12-31T23:59:59Z',
    },
    userPlan: 'pro',
    usage: {
      analyses_used: 5,
      reports_used: 2,
    },
    limits: {
      analyses_limit: 10,
      reports_limit: 5,
    },
    isLoading: false,
    error: null,
    refreshSubscription: jest.fn(),
    refreshUsage: jest.fn(),
  };

  const mockAuthContext: any = {
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
    mockAuthService.getUser.mockReturnValue(mockAuthContext.user);
  });

  it('should render sidebar with navigation items', () => {
    renderWithRouter(<AppSidebar />);

    expect(screen.getByText("Vue d'ensemble")).toBeInTheDocument();
    expect(screen.getByText('Concurrentielle')).toBeInTheDocument();
  });

  it('should render section headers', () => {
    renderWithRouter(<AppSidebar />);

    expect(screen.getByText('Général')).toBeInTheDocument();
    expect(screen.getByText('Paramètres')).toBeInTheDocument();
  });

  it('should render user info in the footer trigger', () => {
    renderWithRouter(<AppSidebar />);

    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should render brand/header info', () => {
    renderWithRouter(<AppSidebar />);

    expect(screen.getByText('Viraill')).toBeInTheDocument();
    expect(screen.getByText('Mes analyses')).toBeInTheDocument();
  });

  it('should render navigation links with correct hrefs', () => {
    renderWithRouter(<AppSidebar />);

    const overviewLink = screen.getByText("Vue d'ensemble").closest('a');
    expect(overviewLink).toHaveAttribute('href', '/');

    const compLink = screen.getByText('Concurrentielle').closest('a');
    expect(compLink).toHaveAttribute('href', '/competition');
  });

  it('should apply correct CSS classes for sidebar', () => {
    renderWithRouter(<AppSidebar />);

    const sidebarContainer = screen.getByText('Général').closest('[data-sidebar="sidebar"]');
    expect(sidebarContainer).toBeInTheDocument();
    expect(sidebarContainer).toHaveClass('bg-sidebar');
  });
});
