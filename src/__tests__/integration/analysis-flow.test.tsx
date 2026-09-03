import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { AuthService } from '@/services/authService';
import { apiService } from '@/services/apiService';
import { Analyses } from '@/pages/Analyses';
import { Competition } from '@/pages/Competition';
import { useReports, useReport } from '@/hooks/useReports';
import * as competitorService from '@/services/competitorAnalysisService';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SelectedReportProvider } from '@/contexts/SelectedReportContext';

// Mock dependencies
jest.mock('@/services/authService');
jest.mock('@/services/apiService');
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('@/hooks/useReports', () => ({
  ...jest.requireActual('@/hooks/useReports'),
  useReports: jest.fn(),
  useReport: jest.fn(),
}));

jest.mock('@/services/competitorAnalysisService', () => ({
  ...jest.requireActual('@/services/competitorAnalysisService'),
  getCompetitorAnalysisById: jest.fn(),
  getCompetitorAnalysisFromReport: jest.fn(),
  extractDomain: (url: string) => {
    try {
      return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
    } catch {
      return url;
    }
  },
}));

jest.mock('@/hooks/usePayment', () => ({
  usePayment: () => ({
    userPlan: 'pro',
    plans: [],
    loading: false,
    error: null,
    hasActiveSubscription: true,
    checkFeatureAccess: () => true,
    incrementUsage: jest.fn(),
    subscription: { plan: { id: 'pro' } },
  }),
}));

jest.mock('@/contexts/PaymentContext', () => ({
  usePayment: () => ({
    userPlan: 'pro',
    plans: [],
    loading: false,
    error: null,
    hasActiveSubscription: true,
    checkFeatureAccess: () => true,
    incrementUsage: jest.fn(),
    subscription: { plan: { id: 'pro' } },
  }),
  PaymentProvider: ({ children }: any) => children,
}));

jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  const React = require('react');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => React.createElement('div', { 'data-testid': 'responsive-container' }, children),
  };
});

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;
const mockApiService = apiService as jest.Mocked<typeof apiService>;
const mockUseReports = useReports as jest.MockedFunction<typeof useReports>;
const mockUseReport = useReport as jest.MockedFunction<typeof useReport>;
const mockGetCompetitorAnalysisFromReport = competitorService.getCompetitorAnalysisFromReport as jest.Mock;
const mockGetCompetitorAnalysisById = competitorService.getCompetitorAnalysisById as jest.Mock;

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <TooltipProvider>
        <SelectedReportProvider>
          {component}
        </SelectedReportProvider>
      </TooltipProvider>
    </BrowserRouter>
  );
};

describe('Analysis Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.isAuthenticated.mockReturnValue(true);
    mockAuthService.getUser.mockReturnValue({
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
    });

    mockUseReport.mockReturnValue({
      report: null,
      loading: false,
      error: null,
    });

    mockGetCompetitorAnalysisFromReport.mockResolvedValue(null);
    mockGetCompetitorAnalysisById.mockResolvedValue(null);
  });

  describe('Website Analysis Flow', () => {
    it('should complete full website analysis trigger', async () => {
      const user = userEvent.setup();

      const mockCreateAnalysis = jest.fn().mockResolvedValue('analysis_123');
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
        expect(mockCreateAnalysis).toHaveBeenCalledWith('https://example.com', true);
      });
    });

    it('should handle analysis errors gracefully', async () => {
      const user = userEvent.setup();

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
      await user.type(urlInput, 'invalid-url.com');

      // Start analysis
      const startButton = screen.getByText('Lancer l\'analyse');
      await user.click(startButton);

      await waitFor(() => {
        expect(mockCreateAnalysis).toHaveBeenCalled();
      });
    });

    it('should show loading state during analysis', async () => {
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
      fireEvent.click(newAnalysisButton);

      // Fill URL input
      const urlInput = screen.getByPlaceholderText('https://example.com');
      fireEvent.change(urlInput, { target: { value: 'example.com' } });

      // Start analysis
      const startButton = screen.getByText('Lancer l\'analyse');
      fireEvent.click(startButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getAllByText('Analyse en cours...').length).toBeGreaterThan(0);
      });

      // Complete analysis
      await act(async () => {
        resolveAnalysis!('analysis_123');
        await analysisPromise;
      });
    });
  });

  describe('Competitive Analysis Flow', () => {
    it('should show empty skeleton when no competitor analysis is available', () => {
      mockUseReports.mockReturnValue({
        reports: [],
        loading: false,
        error: null,
        createAnalysis: jest.fn(),
        refreshReports: jest.fn(),
      });

      renderWithRouter(<Competition />);

      expect(screen.getByText('Aucune analyse disponible')).toBeInTheDocument();
    });

    it('should load competitor analysis when reports exist', async () => {
      const mockReports = [
        {
          id: '1',
          url: 'https://example.com',
          domain: 'example.com',
          createdAt: '2025-01-01T00:00:00Z',
          metadata: { score: 85 },
          status: 'completed',
        },
      ];

      mockUseReports.mockReturnValue({
        reports: mockReports,
        loading: false,
        error: null,
        createAnalysis: jest.fn(),
        refreshReports: jest.fn(),
      });

      mockUseReport.mockReturnValue({
        report: { id: '1', url: 'https://example.com' } as any,
        loading: false,
        error: null,
      });

      const mockAnalysisData: any = {
        analysis_id: 1,
        url: 'https://example.com',
        title: 'Analyse',
        description: 'Description',
        models_analysis: [],
        consolidated_competitors: [],
        target_positioning: {
          target_site: 'https://example.com',
          rank: 1,
          total_competitors: 2,
          global_score: 85,
        },
        global_stats: {
          total_models_executed: 1,
          total_competitors_found: 1,
          analysis_duration_ms: 500,
          average_competitors_per_model: 1,
        },
        analysis_metadata: {
          min_score: 0,
          min_mentions: 0,
          models_requested: [],
          include_raw: false,
          include_benchmark: true,
          include_llmo_analysis: true,
          benchmark_competitors_count: 1,
          llmo_analysis_count: 1,
        },
        created_at: '2025-01-01T00:00:00Z',
      };

      mockGetCompetitorAnalysisFromReport.mockResolvedValue(mockAnalysisData);

      renderWithRouter(<Competition />);

      await waitFor(() => {
        expect(screen.getByText('Votre positionnement')).toBeInTheDocument();
      });
    });
  });

  describe('Analysis Results Flow', () => {
    it('should display analysis metrics correctly', () => {
      const mockReports = [
        {
          id: '1',
          url: 'https://example.com',
          domain: 'example.com',
          score: 85,
          metadata: { score: 85 },
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
          status: 'completed',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ];

      mockUseReports.mockReturnValue({
        reports: mockReports,
        loading: false,
        error: null,
        createAnalysis: jest.fn(),
        refreshReports: jest.fn(),
      });

      renderWithRouter(<Analyses />);

      // Metrics calculation
      expect(screen.getByText('80%')).toBeInTheDocument(); // Average score (85 + 75) / 2
      expect(screen.getByText('2 analyses totales')).toBeInTheDocument(); // Sites count
    });

    it('should handle empty results gracefully', () => {
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

    it('should handle loading state', () => {
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

    it('should handle error state', () => {
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
  });

  describe('URL Validation Flow', () => {
    it('should add https:// prefix automatically on blur', () => {
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
      fireEvent.click(newAnalysisButton);

      // Fill URL without protocol
      const urlInput = screen.getByPlaceholderText('https://example.com');
      fireEvent.change(urlInput, { target: { value: 'example.com' } });
      fireEvent.blur(urlInput);

      expect(urlInput).toHaveValue('https://example.com');
    });

    it('should not modify URLs that already have protocol', () => {
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
      fireEvent.click(newAnalysisButton);

      // Fill URL with protocol
      const urlInput = screen.getByPlaceholderText('https://example.com');
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      fireEvent.blur(urlInput);

      expect(urlInput).toHaveValue('https://example.com');
    });
  });
});
