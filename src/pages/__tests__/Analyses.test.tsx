import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Analyses } from '../Analyses';
import { useReports, useReport } from '@/hooks/useReports';
import { useToast } from '@/hooks/use-toast';
import { AuthService } from '@/services/authService';
import { SelectedReportProvider } from '@/contexts/SelectedReportContext';

// Mock dependencies
const mockNavigate = jest.fn();

jest.mock('@/hooks/useReports');
jest.mock('@/hooks/use-toast');
jest.mock('@/services/authService');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockUseReports = useReports as jest.MockedFunction<typeof useReports>;
const mockUseReport = useReport as jest.MockedFunction<typeof useReport>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <SelectedReportProvider>
        {component}
      </SelectedReportProvider>
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
      metadata: { score: 85 },
      score_produit_analyse: 85,
      status: 'completed',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      id: '2',
      url: 'https://test.com',
      domain: 'test.com',
      score: 75,
      metadata: { score: 75 },
      score_produit_analyse: 75,
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

  it('should render page title and description', () => {
    renderWithRouter(<Analyses />);

    expect(screen.getAllByText('Analyses GEO').length).toBeGreaterThan(0);
    expect(screen.getByText(/Analysez et optimisez vos contenus/i)).toBeInTheDocument();
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

    expect(screen.getByText('2 analyses totales')).toBeInTheDocument();
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

    expect(screen.getByText('Nouvelle Analyse GEO')).toBeInTheDocument();
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
      expect(mockCreateAnalysis).toHaveBeenCalledWith('https://new-site.com', true);
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
      expect(mockCreateAnalysis).toHaveBeenCalledWith('https://example.com', true);
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
      expect(mockCreateAnalysis).toHaveBeenCalledWith('http://example.com', true);
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
      expect(screen.getAllByText('Analyse en cours...').length).toBeGreaterThan(0);
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
      expect(mockToast.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Erreur',
          description: 'Analysis failed',
          variant: 'destructive',
        })
      );
    });
  });

  it('should display reports in list card', () => {
    renderWithRouter(<Analyses />);

    expect(screen.getByText('Rapports Récents')).toBeInTheDocument();
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

    expect(screen.getByText('Aucun rapport disponible')).toBeInTheDocument();
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

    expect(screen.getByText('Chargement des rapports...')).toBeInTheDocument();
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

    expect(screen.getByText('Erreur de chargement')).toBeInTheDocument();
    expect(screen.getByText('Failed to load reports')).toBeInTheDocument();
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

  it('should open optimized analysis dialog from report action', () => {
    renderWithRouter(<Analyses />);

    const optimizeButtons = screen.getAllByText('Optimiser');
    fireEvent.click(optimizeButtons[0]);

    expect(screen.getByText('Analyse Optimisée')).toBeInTheDocument();
  });

  it('should redirect to login if not authenticated', () => {
    mockAuthService.isAuthenticated.mockReturnValue(false);

    renderWithRouter(<Analyses />);

    // Should redirect to login
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should display correct icons for metrics', () => {
    renderWithRouter(<Analyses />);

    expect(screen.getByTestId('barchart3-icon')).toBeInTheDocument();
    expect(screen.getByTestId('trendingup-icon')).toBeInTheDocument();
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

    const refreshButton = screen.getByText('Actualiser');
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

    expect(screen.getByText('Aucun site analysé')).toBeInTheDocument(); // Sites count description
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
