import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Competition } from '../Competition';
import { useCompetitiveAnalysis } from '@/hooks/useCompetitiveAnalysis';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
jest.mock('@/hooks/useCompetitiveAnalysis');
jest.mock('@/hooks/use-toast');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock icons
jest.mock('lucide-react', () => ({
  Trophy: () => <div data-testid="trophy-icon">Trophy</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Loader2: () => <div data-testid="loader-icon">Loader2</div>,
  RefreshCw: () => <div data-testid="refresh-icon">RefreshCw</div>,
  Trash2: () => <div data-testid="trash-icon">Trash2</div>,
  ExternalLink: () => <div data-testid="external-link-icon">ExternalLink</div>,
  ArrowLeft: () => <div data-testid="arrow-left-icon">ArrowLeft</div>,
  BarChart3: () => <div data-testid="bar-chart-icon">BarChart3</div>,
  Target: () => <div data-testid="target-icon">Target</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp</div>,
  Brain: () => <div data-testid="brain-icon">Brain</div>,
  AlertCircle: () => <div data-testid="alert-circle-icon">AlertCircle</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
}));

const mockUseCompetitiveAnalysis = useCompetitiveAnalysis as jest.MockedFunction<typeof useCompetitiveAnalysis>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Competition', () => {
  const mockCompetitiveAnalysis = {
    isAnalyzing: false,
    hasAnalysis: false,
    currentAnalysis: null,
    savedAnalyses: [],
    error: null,
    progress: 0,
    startAnalysis: jest.fn(),
    loadAnalysis: jest.fn(),
    deleteAnalysis: jest.fn(),
    clearError: jest.fn(),
    refreshAnalyses: jest.fn(),
    updateProgress: jest.fn(),
    usageInfo: { used: 1, limit: 10, remaining: 9 },
  };

  const mockToast = {
    toast: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCompetitiveAnalysis.mockReturnValue(mockCompetitiveAnalysis);
    mockUseToast.mockReturnValue(mockToast);
  });

  it('should render page title and breadcrumb', () => {
    renderWithRouter(<Competition />);

    expect(screen.getByText('Analyse Concurrentielle GEO')).toBeInTheDocument();
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
    expect(screen.getByText('Analyse Concurrentielle GEO')).toBeInTheDocument();
  });

  it('should render new analysis button', () => {
    renderWithRouter(<Competition />);

    const newAnalysisButton = screen.getByText('Nouvelle Analyse');
    expect(newAnalysisButton).toBeInTheDocument();
  });

  it('should open new analysis dialog when button is clicked', () => {
    renderWithRouter(<Competition />);

    const newAnalysisButton = screen.getByText('Nouvelle Analyse');
    fireEvent.click(newAnalysisButton);

    expect(screen.getByText('Lancer une analyse concurrentielle')).toBeInTheDocument();
  });

  it('should handle URL input and start analysis', async () => {
    const mockStartAnalysis = jest.fn().mockResolvedValue();
    mockUseCompetitiveAnalysis.mockReturnValue({
      ...mockCompetitiveAnalysis,
      startAnalysis: mockStartAnalysis,
    });

    renderWithRouter(<Competition />);

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
      expect(mockStartAnalysis).toHaveBeenCalledWith('https://example.com');
    });
  });

  it('should add https:// prefix to URLs without protocol', async () => {
    const mockStartAnalysis = jest.fn().mockResolvedValue();
    mockUseCompetitiveAnalysis.mockReturnValue({
      ...mockCompetitiveAnalysis,
      startAnalysis: mockStartAnalysis,
    });

    renderWithRouter(<Competition />);

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
      expect(mockStartAnalysis).toHaveBeenCalledWith('https://example.com');
    });
  });

  it('should show loading state during analysis', () => {
    mockUseCompetitiveAnalysis.mockReturnValue({
      ...mockCompetitiveAnalysis,
      isAnalyzing: true,
      progress: 50,
    });

    renderWithRouter(<Competition />);

    expect(screen.getByText('Analyse en cours...')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should show error message when analysis fails', () => {
    mockUseCompetitiveAnalysis.mockReturnValue({
      ...mockCompetitiveAnalysis,
      error: 'Analysis failed',
    });

    renderWithRouter(<Competition />);

    expect(screen.getByText('Analysis failed')).toBeInTheDocument();
  });

  it('should clear error when clear button is clicked', () => {
    const mockClearError = jest.fn();
    mockUseCompetitiveAnalysis.mockReturnValue({
      ...mockCompetitiveAnalysis,
      error: 'Analysis failed',
      clearError: mockClearError,
    });

    renderWithRouter(<Competition />);

    const clearButton = screen.getByText('Effacer');
    fireEvent.click(clearButton);

    expect(mockClearError).toHaveBeenCalled();
  });

  it('should display saved analyses', () => {
    const mockSavedAnalyses = [
      {
        id: '1',
        timestamp: '2025-01-01T00:00:00Z',
        userSite: {
          url: 'https://example.com',
          domain: 'example.com',
          report: { total_score: 85 },
        },
        competitors: [
          {
            url: 'https://competitor1.com',
            domain: 'competitor1.com',
            report: { total_score: 80 },
          },
        ],
        summary: {
          userRank: 1,
          totalAnalyzed: 2,
          strengthsVsCompetitors: ['Strength 1'],
          weaknessesVsCompetitors: ['Weakness 1'],
          opportunitiesIdentified: ['Opportunity 1'],
        },
      },
    ];

    mockUseCompetitiveAnalysis.mockReturnValue({
      ...mockCompetitiveAnalysis,
      savedAnalyses: mockSavedAnalyses,
    });

    renderWithRouter(<Competition />);

    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('1er sur 2')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('should load analysis when analysis card is clicked', async () => {
    const mockLoadAnalysis = jest.fn().mockResolvedValue();
    const mockSavedAnalyses = [
      {
        id: '1',
        timestamp: '2025-01-01T00:00:00Z',
        userSite: {
          url: 'https://example.com',
          domain: 'example.com',
          report: { total_score: 85 },
        },
        competitors: [],
        summary: {
          userRank: 1,
          totalAnalyzed: 1,
          strengthsVsCompetitors: [],
          weaknessesVsCompetitors: [],
          opportunitiesIdentified: [],
        },
      },
    ];

    mockUseCompetitiveAnalysis.mockReturnValue({
      ...mockCompetitiveAnalysis,
      savedAnalyses: mockSavedAnalyses,
      loadAnalysis: mockLoadAnalysis,
    });

    renderWithRouter(<Competition />);

    const analysisCard = screen.getByText('example.com');
    fireEvent.click(analysisCard);

    await waitFor(() => {
      expect(mockLoadAnalysis).toHaveBeenCalledWith('1');
    });
  });

  it('should delete analysis when delete button is clicked', async () => {
    const mockDeleteAnalysis = jest.fn().mockResolvedValue();
    const mockSavedAnalyses = [
      {
        id: '1',
        timestamp: '2025-01-01T00:00:00Z',
        userSite: {
          url: 'https://example.com',
          domain: 'example.com',
          report: { total_score: 85 },
        },
        competitors: [],
        summary: {
          userRank: 1,
          totalAnalyzed: 1,
          strengthsVsCompetitors: [],
          weaknessesVsCompetitors: [],
          opportunitiesIdentified: [],
        },
      },
    ];

    mockUseCompetitiveAnalysis.mockReturnValue({
      ...mockCompetitiveAnalysis,
      savedAnalyses: mockSavedAnalyses,
      deleteAnalysis: mockDeleteAnalysis,
    });

    renderWithRouter(<Competition />);

    const deleteButton = screen.getByTestId('trash-icon');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteAnalysis).toHaveBeenCalledWith('1');
    });
  });

  it('should display current analysis results', () => {
    const mockCurrentAnalysis = {
      id: '1',
      timestamp: '2025-01-01T00:00:00Z',
      userSite: {
        url: 'https://example.com',
        domain: 'example.com',
        report: { total_score: 85 },
      },
      competitors: [
        {
          url: 'https://competitor1.com',
          domain: 'competitor1.com',
          report: { total_score: 80 },
        },
        {
          url: 'https://competitor2.com',
          domain: 'competitor2.com',
          report: { total_score: 75 },
        },
      ],
      summary: {
        userRank: 1,
        totalAnalyzed: 3,
        strengthsVsCompetitors: ['Strength 1', 'Strength 2'],
        weaknessesVsCompetitors: ['Weakness 1'],
        opportunitiesIdentified: ['Opportunity 1', 'Opportunity 2'],
      },
    };

    mockUseCompetitiveAnalysis.mockReturnValue({
      ...mockCompetitiveAnalysis,
      hasAnalysis: true,
      currentAnalysis: mockCurrentAnalysis,
    });

    renderWithRouter(<Competition />);

    expect(screen.getByText('Résultats de l\'analyse')).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('competitor1.com')).toBeInTheDocument();
    expect(screen.getByText('competitor2.com')).toBeInTheDocument();
    expect(screen.getByText('1er sur 3')).toBeInTheDocument();
  });

  it('should show empty state when no saved analyses', () => {
    renderWithRouter(<Competition />);

    expect(screen.getByText('Aucune analyse sauvegardée')).toBeInTheDocument();
  });

  it('should display usage information', () => {
    renderWithRouter(<Competition />);

    expect(screen.getByText('Analyses utilisées: 1/10')).toBeInTheDocument();
    expect(screen.getByText('Restantes: 9')).toBeInTheDocument();
  });

  it('should refresh analyses when refresh button is clicked', () => {
    const mockRefreshAnalyses = jest.fn();
    mockUseCompetitiveAnalysis.mockReturnValue({
      ...mockCompetitiveAnalysis,
      refreshAnalyses: mockRefreshAnalyses,
    });

    renderWithRouter(<Competition />);

    const refreshButton = screen.getByTestId('refresh-icon');
    fireEvent.click(refreshButton);

    expect(mockRefreshAnalyses).toHaveBeenCalled();
  });

  it('should handle tab switching', () => {
    renderWithRouter(<Competition />);

    const resultsTab = screen.getByText('Résultats');
    fireEvent.click(resultsTab);

    expect(resultsTab).toHaveAttribute('data-state', 'active');
  });

  it('should show please wait message during analysis', () => {
    mockUseCompetitiveAnalysis.mockReturnValue({
      ...mockCompetitiveAnalysis,
      isAnalyzing: true,
    });

    renderWithRouter(<Competition />);

    expect(screen.getByText('Veuillez patienter, votre analyse sera prête dans quelques instants...')).toBeInTheDocument();
  });

  it('should handle URL blur event for prefix addition', () => {
    renderWithRouter(<Competition />);

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

  it('should show success message after analysis completion', async () => {
    const mockStartAnalysis = jest.fn().mockResolvedValue();
    mockUseCompetitiveAnalysis.mockReturnValue({
      ...mockCompetitiveAnalysis,
      startAnalysis: mockStartAnalysis,
    });

    renderWithRouter(<Competition />);

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
        title: 'Analyse lancée',
        description: 'Votre analyse concurrentielle a été lancée avec succès',
      });
    });
  });

  it('should handle analysis with competitors', () => {
    const mockCurrentAnalysis = {
      id: '1',
      timestamp: '2025-01-01T00:00:00Z',
      userSite: {
        url: 'https://example.com',
        domain: 'example.com',
        report: { total_score: 85 },
      },
      competitors: [
        {
          url: 'https://competitor1.com',
          domain: 'competitor1.com',
          report: { total_score: 80 },
        },
      ],
      summary: {
        userRank: 1,
        totalAnalyzed: 2,
        strengthsVsCompetitors: ['Strength 1'],
        weaknessesVsCompetitors: ['Weakness 1'],
        opportunitiesIdentified: ['Opportunity 1'],
      },
    };

    mockUseCompetitiveAnalysis.mockReturnValue({
      ...mockCompetitiveAnalysis,
      hasAnalysis: true,
      currentAnalysis: mockCurrentAnalysis,
    });

    renderWithRouter(<Competition />);

    expect(screen.getByText('Forces par rapport aux concurrents')).toBeInTheDocument();
    expect(screen.getByText('Faiblesses par rapport aux concurrents')).toBeInTheDocument();
    expect(screen.getByText('Opportunités identifiées')).toBeInTheDocument();
  });

  it('should display analysis date and time', () => {
    const mockCurrentAnalysis = {
      id: '1',
      timestamp: '2025-01-01T12:00:00Z',
      userSite: {
        url: 'https://example.com',
        domain: 'example.com',
        report: { total_score: 85 },
      },
      competitors: [],
      summary: {
        userRank: 1,
        totalAnalyzed: 1,
        strengthsVsCompetitors: [],
        weaknessesVsCompetitors: [],
        opportunitiesIdentified: [],
      },
    };

    mockUseCompetitiveAnalysis.mockReturnValue({
      ...mockCompetitiveAnalysis,
      hasAnalysis: true,
      currentAnalysis: mockCurrentAnalysis,
    });

    renderWithRouter(<Competition />);

    expect(screen.getByText(/01\/01\/2025/)).toBeInTheDocument();
  });
});
