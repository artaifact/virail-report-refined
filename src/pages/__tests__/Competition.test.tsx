import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Competition } from '../Competition';
import { useReports, useReport } from '@/hooks/useReports';
import * as competitorService from '@/services/competitorAnalysisService';
import { TooltipProvider } from '@/components/ui/tooltip';

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

const mockUseReports = useReports as jest.MockedFunction<typeof useReports>;
const mockUseReport = useReport as jest.MockedFunction<typeof useReport>;
const mockGetCompetitorAnalysisFromReport = competitorService.getCompetitorAnalysisFromReport as jest.Mock;
const mockGetCompetitorAnalysisById = competitorService.getCompetitorAnalysisById as jest.Mock;

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

// Mock recharts to prevent rendering issues in JSDOM
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  const React = require('react');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => React.createElement('div', { 'data-testid': 'responsive-container' }, children),
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <TooltipProvider>
        {component}
      </TooltipProvider>
    </BrowserRouter>
  );
};

describe('Competition', () => {
  const mockAnalysisData: any = {
    analysis_id: 1,
    url: 'https://example.com',
    title: 'Analyse Example',
    description: 'Description',
    models_analysis: [],
    consolidated_competitors: [],
    mini_llm_results: [],
    target_positioning: {
      target_site: 'https://example.com',
      rank: 1,
      total_competitors: 3,
      global_score: 85,
    },
    global_stats: {
      total_models_executed: 4,
      total_competitors_found: 3,
      analysis_duration_ms: 1000,
      average_competitors_per_model: 2,
    },
    analysis_metadata: {
      min_score: 0,
      min_mentions: 0,
      models_requested: [],
      include_raw: false,
      include_benchmark: true,
      include_llmo_analysis: true,
      benchmark_competitors_count: 3,
      llmo_analysis_count: 3,
    },
    created_at: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseReports.mockReturnValue({
      reports: [],
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

    mockGetCompetitorAnalysisFromReport.mockResolvedValue(null);
    mockGetCompetitorAnalysisById.mockResolvedValue(null);
  });

  it('should render skeleton and empty state when no analysis is available', () => {
    renderWithRouter(<Competition />);

    expect(screen.getByText('Aucune analyse disponible')).toBeInTheDocument();
  });

  it('should render loading/waiting state when reports are loading', () => {
    mockUseReports.mockReturnValue({
      reports: [],
      loading: true,
      error: null,
      createAnalysis: jest.fn(),
      refreshReports: jest.fn(),
    });

    renderWithRouter(<Competition />);

    expect(screen.getByText('Aucune analyse disponible')).toBeInTheDocument();
  });

  it('should load analysis and render positioning when report is available', async () => {
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
      report: {
        id: '1',
        url: 'https://example.com',
      } as any,
      loading: false,
      error: null,
    });

    mockGetCompetitorAnalysisFromReport.mockResolvedValue(mockAnalysisData);

    renderWithRouter(<Competition />);

    await waitFor(() => {
      expect(mockGetCompetitorAnalysisFromReport).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(screen.getByText('Votre positionnement')).toBeInTheDocument();
    });

    expect(screen.getByText(/Evolution du score GEO sur 1 analyse/i)).toBeInTheDocument();
  });

  it('should fallback to getCompetitorAnalysisById if fromReport returns null', async () => {
    const mockReports = [
      {
        id: '2',
        url: 'https://test.com',
        domain: 'test.com',
        createdAt: '2025-01-02T00:00:00Z',
        metadata: { score: 90 },
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
      report: { id: '2', url: 'https://test.com' } as any,
      loading: false,
      error: null,
    });

    mockGetCompetitorAnalysisFromReport.mockResolvedValue(null);
    mockGetCompetitorAnalysisById.mockResolvedValue({
      ...mockAnalysisData,
      analysis_id: 2,
      url: 'https://test.com',
    });

    renderWithRouter(<Competition />);

    await waitFor(() => {
      expect(mockGetCompetitorAnalysisById).toHaveBeenCalledWith(2);
    });

    await waitFor(() => {
      expect(screen.getByText('Votre positionnement')).toBeInTheDocument();
    });
  });

  it('should render qualitative analysis when v3Data is present', async () => {
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
      report: {
        id: '1',
        url: 'https://example.com',
        analyse_concurrentielle_v3: {
          analyse_qualitative: {
            forces: ['Bonne autorité de domaine'],
            faiblesses: ['Moins de citations IA'],
            opportunités: ['Cibler les requêtes comparatives'],
          },
        },
      } as any,
      loading: false,
      error: null,
    });

    mockGetCompetitorAnalysisFromReport.mockResolvedValue({
      ...mockAnalysisData,
      target_positioning: {
        ...mockAnalysisData.target_positioning,
        competitive_advantages: ['Bonne autorité de domaine'],
        improvement_areas: ['Moins de citations IA'],
      },
    });

    renderWithRouter(<Competition />);

    await waitFor(() => {
      expect(screen.getByText('Analyse qualitative')).toBeInTheDocument();
    });

    expect(screen.getByText('Bonne autorité de domaine')).toBeInTheDocument();
    expect(screen.getByText('Moins de citations IA')).toBeInTheDocument();
  });
});
