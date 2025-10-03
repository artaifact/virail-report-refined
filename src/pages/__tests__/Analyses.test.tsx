import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Analyses } from '../Analyses';
import { useReports, useReport } from '@/hooks/useReports';
import { useToast } from '@/hooks/use-toast';
import { AuthService } from '@/services/authService';

// Mock dependencies
jest.mock('@/hooks/useReports');
jest.mock('@/hooks/use-toast');
jest.mock('@/services/authService');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock icons
jest.mock('lucide-react', () => ({
  BarChart3: () => <div data-testid="bar-chart-icon">BarChart</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  FileText: () => <div data-testid="file-text-icon">FileText</div>,
  ChevronRight: () => <div data-testid="chevron-right-icon">ChevronRight</div>,
  ArrowLeft: () => <div data-testid="arrow-left-icon">ArrowLeft</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  RefreshCw: () => <div data-testid="refresh-icon">RefreshCw</div>,
  Loader2: () => <div data-testid="loader-icon">Loader2</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles</div>,
  Target: () => <div data-testid="target-icon">Target</div>,
  Star: () => <div data-testid="star-icon">Star</div>,
  Brain: () => <div data-testid="brain-icon">Brain</div>,
}));

const mockUseReports = useReports as jest.MockedFunction<typeof useReports>;
const mockUseReport = useReport as jest.MockedFunction<typeof useReport>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Analyses', () => {
  const mockReports = [
    {
      id: '1',
      url: 'https://example.com',
      domain: 'example.com',
      score: 85,
      status: 'completed',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      id: '2',
      url: 'https://test.com',
      domain: 'test.com',
      score: 75,
      status: 'completed',
      created_at: '2025-01-02T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
    },
  ];

  const mockToast = {
    toast: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseReports.mockReturnValue({
      reports: mockReports,
      loading: false,
      error: null,
      createAnalysis: jest.fn(),
      refreshReports: jest.fn(),
    });

    mockUseReport.mockReturnValue({
      report: null,
      loading: false,
      error: null,
    });

    mockUseToast.mockReturnValue(mockToast);
    mockAuthService.isAuthenticated.mockReturnValue(true);
  });

  it('should render page title and breadcrumb', () => {
    renderWithRouter(<Analyses />);

    expect(screen.getByText('Analyses GEO')).toBeInTheDocument();
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
    expect(screen.getByText('Analyses GEO')).toBeInTheDocument();
  });

  it('should display metrics cards', () => {
    renderWithRouter(<Analyses />);

    expect(screen.getByText('Sites Analysés')).toBeInTheDocument();
    expect(screen.getByText('Score Moyen')).toBeInTheDocument();
    expect(screen.getByText('Analyses Total')).toBeInTheDocument();
    expect(screen.getByText('Temps Moyen')).toBeInTheDocument();
  });

  it('should calculate and display average score', () => {
    renderWithRouter(<Analyses />);

    const averageScore = Math.round((85 + 75) / 2);
    expect(screen.getByText(`${averageScore}%`)).toBeInTheDocument();
  });

  it('should calculate and display unique sites count', () => {
    renderWithRouter(<Analyses />);

    expect(screen.getByText('2')).toBeInTheDocument(); // 2 unique domains
  });

  it('should render new analysis button', () => {
    renderWithRouter(<Analyses />);

    const newAnalysisButton = screen.getByText('Nouvelle Analyse');
    expect(newAnalysisButton).toBeInTheDocument();
  });

  it('should open new analysis dialog when button is clicked', () => {
    renderWithRouter(<Analyses />);

    const newAnalysisButton = screen.getByText('Nouvelle Analyse');
    fireEvent.click(newAnalysisButton);

    expect(screen.getByText('Lancer une nouvelle analyse')).toBeInTheDocument();
  });

  it('should handle URL input and validation', async () => {
    const mockCreateAnalysis = jest.fn().mockResolvedValue({
      id: '3',
      url: 'https://new-site.com',
      status: 'processing',
    });

    mockUseReports.mockReturnValue({
      reports: mockReports,
      loading: false,
      error: null,
      createAnalysis: mockCreateAnalysis,
      refreshReports: jest.fn(),
    });

    renderWithRouter(<Analyses />);

    // Open dialog
    const newAnalysisButton = screen.getByText('Nouvelle Analyse');
    fireEvent.click(newAnalysisButton);

    // Enter URL
    const urlInput = screen.getByPlaceholderText('https://example.com');
    fireEvent.change(urlInput, { target: { value: 'new-site.com' } });

    // Start analysis
    const startButton = screen.getByText('Lancer l\'analyse');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockCreateAnalysis).toHaveBeenCalledWith('https://new-site.com');
    });
  });

  it('should add https:// prefix to URLs without protocol', async () => {
    const mockCreateAnalysis = jest.fn().mockResolvedValue({
      id: '3',
      url: 'https://example.com',
      status: 'processing',
    });

    mockUseReports.mockReturnValue({
      reports: mockReports,
      loading: false,
      error: null,
      createAnalysis: mockCreateAnalysis,
      refreshReports: jest.fn(),
    });

    renderWithRouter(<Analyses />);

    // Open dialog
    const newAnalysisButton = screen.getByText('Nouvelle Analyse');
    fireEvent.click(newAnalysisButton);

    // Enter URL without protocol
    const urlInput = screen.getByPlaceholderText('https://example.com');
    fireEvent.change(urlInput, { target: { value: 'example.com' } });

    // Start analysis
    const startButton = screen.getByText('Lancer l\'analyse');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockCreateAnalysis).toHaveBeenCalledWith('https://example.com');
    });
  });

  it('should not add https:// prefix to URLs that already have protocol', async () => {
    const mockCreateAnalysis = jest.fn().mockResolvedValue({
      id: '3',
      url: 'https://example.com',
      status: 'processing',
    });

    mockUseReports.mockReturnValue({
      reports: mockReports,
      loading: false,
      error: null,
      createAnalysis: mockCreateAnalysis,
      refreshReports: jest.fn(),
    });

    renderWithRouter(<Analyses />);

    // Open dialog
    const newAnalysisButton = screen.getByText('Nouvelle Analyse');
    fireEvent.click(newAnalysisButton);

    // Enter URL with http protocol
    const urlInput = screen.getByPlaceholderText('https://example.com');
    fireEvent.change(urlInput, { target: { value: 'http://example.com' } });

    // Start analysis
    const startButton = screen.getByText('Lancer l\'analyse');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockCreateAnalysis).toHaveBeenCalledWith('http://example.com');
    });
  });

  it('should show loading state during analysis', async () => {
    let resolveAnalysis: (value: any) => void;
    const analysisPromise = new Promise((resolve) => {
      resolveAnalysis = resolve;
    });

    const mockCreateAnalysis = jest.fn().mockReturnValue(analysisPromise);

    mockUseReports.mockReturnValue({
      reports: mockReports,
      loading: false,
      error: null,
      createAnalysis: mockCreateAnalysis,
      refreshReports: jest.fn(),
    });

    renderWithRouter(<Analyses />);

    // Open dialog
    const newAnalysisButton = screen.getByText('Nouvelle Analyse');
    fireEvent.click(newAnalysisButton);

    // Enter URL
    const urlInput = screen.getByPlaceholderText('https://example.com');
    fireEvent.change(urlInput, { target: { value: 'example.com' } });

    // Start analysis
    const startButton = screen.getByText('Lancer l\'analyse');
    fireEvent.click(startButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Analyse en cours...')).toBeInTheDocument();
    });

    // Resolve analysis
    await act(async () => {
      resolveAnalysis!({
        id: '3',
        url: 'https://example.com',
        status: 'processing',
      });
      await analysisPromise;
    });
  });

  it('should handle analysis errors', async () => {
    const mockCreateAnalysis = jest.fn().mockRejectedValue(new Error('Analysis failed'));

    mockUseReports.mockReturnValue({
      reports: mockReports,
      loading: false,
      error: null,
      createAnalysis: mockCreateAnalysis,
      refreshReports: jest.fn(),
    });

    renderWithRouter(<Analyses />);

    // Open dialog
    const newAnalysisButton = screen.getByText('Nouvelle Analyse');
    fireEvent.click(newAnalysisButton);

    // Enter URL
    const urlInput = screen.getByPlaceholderText('https://example.com');
    fireEvent.change(urlInput, { target: { value: 'example.com' } });

    // Start analysis
    const startButton = screen.getByText('Lancer l\'analyse');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: 'Erreur',
        description: 'Analysis failed',
        variant: 'destructive',
      });
    });
  });

  it('should display reports in tabs', () => {
    renderWithRouter(<Analyses />);

    expect(screen.getByText('Rapports récents')).toBeInTheDocument();
    expect(screen.getByText('Analyses sauvegardées')).toBeInTheDocument();
  });

  it('should show empty state when no reports', () => {
    mockUseReports.mockReturnValue({
      reports: [],
      loading: false,
      error: null,
      createAnalysis: jest.fn(),
      refreshReports: jest.fn(),
    });

    renderWithRouter(<Analyses />);

    expect(screen.getByText('Aucune analyse trouvée')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUseReports.mockReturnValue({
      reports: [],
      loading: true,
      error: null,
      createAnalysis: jest.fn(),
      refreshReports: jest.fn(),
    });

    renderWithRouter(<Analyses />);

    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  it('should show error state', () => {
    mockUseReports.mockReturnValue({
      reports: [],
      loading: false,
      error: 'Failed to load reports',
      createAnalysis: jest.fn(),
      refreshReports: jest.fn(),
    });

    renderWithRouter(<Analyses />);

    expect(screen.getByText('Erreur lors du chargement des rapports')).toBeInTheDocument();
  });

  it('should handle checkbox for optimization inclusion', () => {
    renderWithRouter(<Analyses />);

    // Open dialog
    const newAnalysisButton = screen.getByText('Nouvelle Analyse');
    fireEvent.click(newAnalysisButton);

    const checkbox = screen.getByRole('checkbox', { name: /Inclure l'optimisation/i });
    expect(checkbox).toBeChecked(); // Should be checked by default

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('should render optimized analysis section', () => {
    renderWithRouter(<Analyses />);

    expect(screen.getByText('Optimisation de Site')).toBeInTheDocument();
    expect(screen.getByText('Nouvelle Optimisation')).toBeInTheDocument();
  });

  it('should open optimized analysis dialog', () => {
    renderWithRouter(<Analyses />);

    const optimizedButton = screen.getByText('Nouvelle Optimisation');
    fireEvent.click(optimizedButton);

    expect(screen.getByText('Lancer une optimisation de site')).toBeInTheDocument();
  });

  it('should redirect to login if not authenticated', () => {
    mockAuthService.isAuthenticated.mockReturnValue(false);

    const mockNavigate = jest.fn();
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));

    renderWithRouter(<Analyses />);

    // Should redirect to login
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should display correct icons for metrics', () => {
    renderWithRouter(<Analyses />);

    expect(screen.getByTestId('bar-chart-icon')).toBeInTheDocument();
    expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument();
    expect(screen.getByTestId('users-icon')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
  });

  it('should handle refresh reports', () => {
    const mockRefreshReports = jest.fn();
    mockUseReports.mockReturnValue({
      reports: mockReports,
      loading: false,
      error: null,
      createAnalysis: jest.fn(),
      refreshReports: mockRefreshReports,
    });

    renderWithRouter(<Analyses />);

    const refreshButton = screen.getByTestId('refresh-icon');
    fireEvent.click(refreshButton);

    expect(mockRefreshReports).toHaveBeenCalled();
  });

  it('should calculate metrics correctly with empty reports', () => {
    mockUseReports.mockReturnValue({
      reports: [],
      loading: false,
      error: null,
      createAnalysis: jest.fn(),
      refreshReports: jest.fn(),
    });

    renderWithRouter(<Analyses />);

    expect(screen.getByText('0')).toBeInTheDocument(); // Sites count
    expect(screen.getByText('0%')).toBeInTheDocument(); // Average score
  });

  it('should handle URL blur event for prefix addition', () => {
    renderWithRouter(<Analyses />);

    // Open dialog
    const newAnalysisButton = screen.getByText('Nouvelle Analyse');
    fireEvent.click(newAnalysisButton);

    // Enter URL without protocol
    const urlInput = screen.getByPlaceholderText('https://example.com');
    fireEvent.change(urlInput, { target: { value: 'example.com' } });
    fireEvent.blur(urlInput);

    // URL should have https:// prefix added
    expect(urlInput).toHaveValue('https://example.com');
  });

  it('should not modify URL if it already has protocol on blur', () => {
    renderWithRouter(<Analyses />);

    // Open dialog
    const newAnalysisButton = screen.getByText('Nouvelle Analyse');
    fireEvent.click(newAnalysisButton);

    // Enter URL with protocol
    const urlInput = screen.getByPlaceholderText('https://example.com');
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.blur(urlInput);

    // URL should remain unchanged
    expect(urlInput).toHaveValue('https://example.com');
  });
});
