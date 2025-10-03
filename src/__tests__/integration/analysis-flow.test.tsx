import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { AuthService } from '@/services/authService';
import { apiService } from '@/services/apiService';
import { Analyses } from '@/pages/Analyses';
import { Competition } from '@/pages/Competition';
import { useReports } from '@/hooks/useReports';
import { useCompetitiveAnalysis } from '@/hooks/useCompetitiveAnalysis';

// Mock dependencies
jest.mock('@/services/authService');
jest.mock('@/services/apiService');
jest.mock('@/hooks/use-toast');
jest.mock('@/hooks/useReports');
jest.mock('@/hooks/useCompetitiveAnalysis');
jest.mock('@/components/ui/toast');

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;
const mockApiService = apiService as jest.Mocked<typeof apiService>;
const mockUseReports = useReports as jest.MockedFunction<typeof useReports>;
const mockUseCompetitiveAnalysis = useCompetitiveAnalysis as jest.MockedFunction<typeof useCompetitiveAnalysis>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Analysis Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Website Analysis Flow', () => {
    it('should complete full website analysis flow', async () => {
      const user = userEvent.setup();
      
      // Mock authentication
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getUser.mockReturnValue({
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
      });

      // Mock reports hook
      const mockCreateAnalysis = jest.fn().mockResolvedValue({
        id: 'analysis_123',
        url: 'https://example.com',
        status: 'processing',
      });

      const mockRefreshReports = jest.fn();

      mockUseReports.mockReturnValue({
        reports: [],
        loading: false,
        error: null,
        createAnalysis: mockCreateAnalysis,
        refreshReports: mockRefreshReports,
      });

      renderWithRouter(<Analyses />);

      // Open new analysis dialog
      const newAnalysisButton = screen.getByText('Nouvelle Analyse');
      await user.click(newAnalysisButton);

      // Fill URL input
      const urlInput = screen.getByPlaceholderText('https://example.com');
      await user.type(urlInput, 'example.com');

      // Start analysis
      const startButton = screen.getByText('Lancer l\'analyse');
      await user.click(startButton);

      await waitFor(() => {
        expect(mockCreateAnalysis).toHaveBeenCalledWith('https://example.com');
      });
    });

    it('should handle analysis errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockAuthService.isAuthenticated.mockReturnValue(true);

      const mockCreateAnalysis = jest.fn().mockRejectedValue(new Error('Analysis failed'));

      mockUseReports.mockReturnValue({
        reports: [],
        loading: false,
        error: null,
        createAnalysis: mockCreateAnalysis,
        refreshReports: jest.fn(),
      });

      renderWithRouter(<Analyses />);

      // Open new analysis dialog
      const newAnalysisButton = screen.getByText('Nouvelle Analyse');
      await user.click(newAnalysisButton);

      // Fill URL input
      const urlInput = screen.getByPlaceholderText('https://example.com');
      await user.type(urlInput, 'invalid-url');

      // Start analysis
      const startButton = screen.getByText('Lancer l\'analyse');
      await user.click(startButton);

      await waitFor(() => {
        expect(mockCreateAnalysis).toHaveBeenCalled();
      });

      // Should handle error gracefully
      expect(screen.getByText(/erreur/i)).toBeInTheDocument();
    });

    it('should show loading state during analysis', async () => {
      const user = userEvent.setup();
      
      mockAuthService.isAuthenticated.mockReturnValue(true);

      // Create a promise that we can control
      let resolveAnalysis: (value: any) => void;
      const analysisPromise = new Promise((resolve) => {
        resolveAnalysis = resolve;
      });

      const mockCreateAnalysis = jest.fn().mockReturnValue(analysisPromise);

      mockUseReports.mockReturnValue({
        reports: [],
        loading: false,
        error: null,
        createAnalysis: mockCreateAnalysis,
        refreshReports: jest.fn(),
      });

      renderWithRouter(<Analyses />);

      // Open new analysis dialog
      const newAnalysisButton = screen.getByText('Nouvelle Analyse');
      await user.click(newAnalysisButton);

      // Fill URL input
      const urlInput = screen.getByPlaceholderText('https://example.com');
      await user.type(urlInput, 'example.com');

      // Start analysis
      const startButton = screen.getByText('Lancer l\'analyse');
      await user.click(startButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Analyse en cours...')).toBeInTheDocument();
      });

      // Complete analysis
      await act(async () => {
        resolveAnalysis!({
          id: 'analysis_123',
          url: 'https://example.com',
          status: 'completed',
        });
        await analysisPromise;
      });
    });

    it('should validate URL format', async () => {
      const user = userEvent.setup();
      
      mockAuthService.isAuthenticated.mockReturnValue(true);

      mockUseReports.mockReturnValue({
        reports: [],
        loading: false,
        error: null,
        createAnalysis: jest.fn(),
        refreshReports: jest.fn(),
      });

      renderWithRouter(<Analyses />);

      // Open new analysis dialog
      const newAnalysisButton = screen.getByText('Nouvelle Analyse');
      await user.click(newAnalysisButton);

      // Try to submit empty URL
      const startButton = screen.getByText('Lancer l\'analyse');
      await user.click(startButton);

      // Should show validation error
      expect(screen.getByText(/veuillez entrer une URL/i)).toBeInTheDocument();
    });
  });

  describe('Competitive Analysis Flow', () => {
    it('should complete full competitive analysis flow', async () => {
      const user = userEvent.setup();
      
      const mockStartAnalysis = jest.fn().mockResolvedValue({
        id: 'comp_analysis_123',
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
      });

      const mockLoadAnalysis = jest.fn();
      const mockDeleteAnalysis = jest.fn();

      mockUseCompetitiveAnalysis.mockReturnValue({
        isAnalyzing: false,
        hasAnalysis: false,
        currentAnalysis: null,
        savedAnalyses: [],
        error: null,
        progress: 0,
        startAnalysis: mockStartAnalysis,
        loadAnalysis: mockLoadAnalysis,
        deleteAnalysis: mockDeleteAnalysis,
        clearError: jest.fn(),
        refreshAnalyses: jest.fn(),
        updateProgress: jest.fn(),
        usageInfo: { used: 1, limit: 10, remaining: 9 },
      });

      renderWithRouter(<Competition />);

      // Open new analysis dialog
      const newAnalysisButton = screen.getByText('Nouvelle Analyse');
      await user.click(newAnalysisButton);

      // Fill URL input
      const urlInput = screen.getByPlaceholderText('https://example.com');
      await user.type(urlInput, 'example.com');

      // Start analysis
      const startButton = screen.getByText('Lancer l\'analyse');
      await user.click(startButton);

      await waitFor(() => {
        expect(mockStartAnalysis).toHaveBeenCalledWith('https://example.com');
      });
    });

    it('should handle competitive analysis errors', async () => {
      const user = userEvent.setup();
      
      const mockStartAnalysis = jest.fn().mockRejectedValue(new Error('Competitive analysis failed'));

      mockUseCompetitiveAnalysis.mockReturnValue({
        isAnalyzing: false,
        hasAnalysis: false,
        currentAnalysis: null,
        savedAnalyses: [],
        error: 'Competitive analysis failed',
        progress: 0,
        startAnalysis: mockStartAnalysis,
        loadAnalysis: jest.fn(),
        deleteAnalysis: jest.fn(),
        clearError: jest.fn(),
        refreshAnalyses: jest.fn(),
        updateProgress: jest.fn(),
        usageInfo: { used: 1, limit: 10, remaining: 9 },
      });

      renderWithRouter(<Competition />);

      // Should show error message
      expect(screen.getByText('Competitive analysis failed')).toBeInTheDocument();
    });

    it('should show loading state during competitive analysis', async () => {
      const user = userEvent.setup();
      
      mockUseCompetitiveAnalysis.mockReturnValue({
        isAnalyzing: true,
        hasAnalysis: false,
        currentAnalysis: null,
        savedAnalyses: [],
        error: null,
        progress: 50,
        startAnalysis: jest.fn(),
        loadAnalysis: jest.fn(),
        deleteAnalysis: jest.fn(),
        clearError: jest.fn(),
        refreshAnalyses: jest.fn(),
        updateProgress: jest.fn(),
        usageInfo: { used: 1, limit: 10, remaining: 9 },
      });

      renderWithRouter(<Competition />);

      // Should show loading state
      expect(screen.getByText('Analyse en cours...')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should display saved competitive analyses', () => {
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
        isAnalyzing: false,
        hasAnalysis: false,
        currentAnalysis: null,
        savedAnalyses: mockSavedAnalyses,
        error: null,
        progress: 0,
        startAnalysis: jest.fn(),
        loadAnalysis: jest.fn(),
        deleteAnalysis: jest.fn(),
        clearError: jest.fn(),
        refreshAnalyses: jest.fn(),
        updateProgress: jest.fn(),
        usageInfo: { used: 1, limit: 10, remaining: 9 },
      });

      renderWithRouter(<Competition />);

      // Should display saved analysis
      expect(screen.getByText('example.com')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });

  describe('Analysis Results Flow', () => {
    it('should display analysis results correctly', () => {
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

      mockAuthService.isAuthenticated.mockReturnValue(true);

      mockUseReports.mockReturnValue({
        reports: mockReports,
        loading: false,
        error: null,
        createAnalysis: jest.fn(),
        refreshReports: jest.fn(),
      });

      renderWithRouter(<Analyses />);

      // Should display metrics
      expect(screen.getByText('2')).toBeInTheDocument(); // Sites count
      expect(screen.getByText('80%')).toBeInTheDocument(); // Average score
    });

    it('should handle empty results gracefully', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);

      mockUseReports.mockReturnValue({
        reports: [],
        loading: false,
        error: null,
        createAnalysis: jest.fn(),
        refreshReports: jest.fn(),
      });

      renderWithRouter(<Analyses />);

      // Should show empty state
      expect(screen.getByText('Aucune analyse trouvée')).toBeInTheDocument();
    });

    it('should handle loading state', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);

      mockUseReports.mockReturnValue({
        reports: [],
        loading: true,
        error: null,
        createAnalysis: jest.fn(),
        refreshReports: jest.fn(),
      });

      renderWithRouter(<Analyses />);

      // Should show loading state
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('should handle error state', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);

      mockUseReports.mockReturnValue({
        reports: [],
        loading: false,
        error: 'Failed to load reports',
        createAnalysis: jest.fn(),
        refreshReports: jest.fn(),
      });

      renderWithRouter(<Analyses />);

      // Should show error state
      expect(screen.getByText('Erreur lors du chargement des rapports')).toBeInTheDocument();
    });
  });

  describe('URL Validation Flow', () => {
    it('should add https:// prefix automatically', async () => {
      const user = userEvent.setup();
      
      mockAuthService.isAuthenticated.mockReturnValue(true);

      mockUseReports.mockReturnValue({
        reports: [],
        loading: false,
        error: null,
        createAnalysis: jest.fn(),
        refreshReports: jest.fn(),
      });

      renderWithRouter(<Analyses />);

      // Open new analysis dialog
      const newAnalysisButton = screen.getByText('Nouvelle Analyse');
      await user.click(newAnalysisButton);

      // Enter URL without protocol
      const urlInput = screen.getByPlaceholderText('https://example.com');
      await user.type(urlInput, 'example.com');
      
      // Trigger blur event
      fireEvent.blur(urlInput);

      // Should add https:// prefix
      expect(urlInput).toHaveValue('https://example.com');
    });

    it('should not modify URLs that already have protocol', async () => {
      const user = userEvent.setup();
      
      mockAuthService.isAuthenticated.mockReturnValue(true);

      mockUseReports.mockReturnValue({
        reports: [],
        loading: false,
        error: null,
        createAnalysis: jest.fn(),
        refreshReports: jest.fn(),
      });

      renderWithRouter(<Analyses />);

      // Open new analysis dialog
      const newAnalysisButton = screen.getByText('Nouvelle Analyse');
      await user.click(newAnalysisButton);

      // Enter URL with protocol
      const urlInput = screen.getByPlaceholderText('https://example.com');
      await user.type(urlInput, 'https://example.com');
      
      // Trigger blur event
      fireEvent.blur(urlInput);

      // Should remain unchanged
      expect(urlInput).toHaveValue('https://example.com');
    });
  });

  describe('Analysis Progress Flow', () => {
    it('should update progress during analysis', async () => {
      const user = userEvent.setup();
      
      mockAuthService.isAuthenticated.mockReturnValue(true);

      // Mock progress updates
      const mockUpdateProgress = jest.fn();

      mockUseCompetitiveAnalysis.mockReturnValue({
        isAnalyzing: true,
        hasAnalysis: false,
        currentAnalysis: null,
        savedAnalyses: [],
        error: null,
        progress: 25,
        startAnalysis: jest.fn(),
        loadAnalysis: jest.fn(),
        deleteAnalysis: jest.fn(),
        clearError: jest.fn(),
        refreshAnalyses: jest.fn(),
        updateProgress: mockUpdateProgress,
        usageInfo: { used: 1, limit: 10, remaining: 9 },
      });

      renderWithRouter(<Competition />);

      // Should show progress
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('should complete progress when analysis finishes', async () => {
      const user = userEvent.setup();
      
      mockAuthService.isAuthenticated.mockReturnValue(true);

      // Start with analyzing state
      mockUseCompetitiveAnalysis.mockReturnValue({
        isAnalyzing: false,
        hasAnalysis: true,
        currentAnalysis: {
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
        savedAnalyses: [],
        error: null,
        progress: 100,
        startAnalysis: jest.fn(),
        loadAnalysis: jest.fn(),
        deleteAnalysis: jest.fn(),
        clearError: jest.fn(),
        refreshAnalyses: jest.fn(),
        updateProgress: jest.fn(),
        usageInfo: { used: 1, limit: 10, remaining: 9 },
      });

      renderWithRouter(<Competition />);

      // Should show completed analysis
      expect(screen.getByText('Résultats de l\'analyse')).toBeInTheDocument();
      expect(screen.getByText('example.com')).toBeInTheDocument();
    });
  });
});
