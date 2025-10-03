import { renderHook, act, waitFor } from '@testing-library/react';
import { useCompetitiveAnalysis } from '../useCompetitiveAnalysis';
import { runCompetitiveAnalysis, getCompetitiveAnalyses, getCompetitiveAnalysisById, deleteCompetitiveAnalysis } from '@/services/competitiveAnalysisService';
import { usePayment } from '@/hooks/usePayment';
import { AuthService } from '@/services/authService';

// Mock dependencies
jest.mock('@/services/competitiveAnalysisService');
jest.mock('@/hooks/usePayment');
jest.mock('@/services/authService');

const mockRunCompetitiveAnalysis = runCompetitiveAnalysis as jest.MockedFunction<typeof runCompetitiveAnalysis>;
const mockGetCompetitiveAnalyses = getCompetitiveAnalyses as jest.MockedFunction<typeof getCompetitiveAnalyses>;
const mockGetCompetitiveAnalysisById = getCompetitiveAnalysisById as jest.MockedFunction<typeof getCompetitiveAnalysisById>;
const mockDeleteCompetitiveAnalysis = deleteCompetitiveAnalysis as jest.MockedFunction<typeof deleteCompetitiveAnalysis>;
const mockUsePayment = usePayment as jest.MockedFunction<typeof usePayment>;
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('useCompetitiveAnalysis', () => {
  const mockPaymentContext = {
    canUseFeature: jest.fn().mockReturnValue(true),
    getFeatureLimits: jest.fn().mockReturnValue({ used: 1, limit: 10, remaining: 9 }),
    usageLimits: {
      can_use_competitor_analysis: {
        allowed: true,
        used: 1,
        limit: 10,
        remaining: 9,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePayment.mockReturnValue(mockPaymentContext);
    
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      mockGetCompetitiveAnalyses.mockResolvedValue([]);

      const { result } = renderHook(() => useCompetitiveAnalysis());

      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.hasAnalysis).toBe(false);
      expect(result.current.currentAnalysis).toBe(null);
      expect(result.current.savedAnalyses).toEqual([]);
      expect(result.current.error).toBe(null);
      expect(result.current.progress).toBe(0);
    });

    it('should load saved analyses on mount', async () => {
      const mockAnalyses = [
        {
          id: '1',
          timestamp: '2025-01-01T00:00:00Z',
          userSite: { url: 'https://example.com', domain: 'example.com' },
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
      mockGetCompetitiveAnalyses.mockResolvedValue(mockAnalyses);

      const { result } = renderHook(() => useCompetitiveAnalysis());

      await waitFor(() => {
        expect(result.current.savedAnalyses).toEqual(mockAnalyses);
      });

      expect(mockGetCompetitiveAnalyses).toHaveBeenCalledTimes(1);
    });

    it('should handle error when loading saved analyses', async () => {
      mockGetCompetitiveAnalyses.mockRejectedValue(new Error('Load error'));

      const { result } = renderHook(() => useCompetitiveAnalysis());

      await waitFor(() => {
        expect(result.current.savedAnalyses).toEqual([]);
      });

      expect(console.error).toHaveBeenCalledWith(
        'Erreur lors du chargement des analyses sauvegardées:',
        expect.any(Error)
      );
    });
  });

  describe('startAnalysis', () => {
    it('should start analysis successfully', async () => {
      const mockAnalysis = {
        id: 'analysis_123',
        timestamp: '2025-01-01T00:00:00Z',
        userSite: { url: 'https://example.com', domain: 'example.com' },
        competitors: [],
        summary: {
          userRank: 1,
          totalAnalyzed: 1,
          strengthsVsCompetitors: [],
          weaknessesVsCompetitors: [],
          opportunitiesIdentified: [],
        },
      };

      mockRunCompetitiveAnalysis.mockResolvedValue(mockAnalysis);
      mockGetCompetitiveAnalyses.mockResolvedValue([mockAnalysis]);

      const { result } = renderHook(() => useCompetitiveAnalysis());

      await act(async () => {
        await result.current.startAnalysis('https://example.com');
      });

      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.hasAnalysis).toBe(true);
      expect(result.current.currentAnalysis).toEqual(mockAnalysis);
      expect(result.current.error).toBe(null);
      expect(mockRunCompetitiveAnalysis).toHaveBeenCalledWith('https://example.com');
    });

    it('should handle quota exceeded', async () => {
      mockPaymentContext.canUseFeature.mockReturnValue(false);

      const { result } = renderHook(() => useCompetitiveAnalysis());

      await act(async () => {
        await result.current.startAnalysis('https://example.com');
      });

      expect(result.current.error).toBe('Quota d\'analyses concurrentielles dépassé');
      expect(result.current.isAnalyzing).toBe(false);
      expect(mockRunCompetitiveAnalysis).not.toHaveBeenCalled();
    });

    it('should handle analysis errors', async () => {
      mockRunCompetitiveAnalysis.mockRejectedValue(new Error('Analysis failed'));

      const { result } = renderHook(() => useCompetitiveAnalysis());

      await act(async () => {
        await result.current.startAnalysis('https://example.com');
      });

      expect(result.current.error).toBe('Analysis failed');
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.hasAnalysis).toBe(false);
    });

    it('should set loading state during analysis', async () => {
      let resolveAnalysis: (value: any) => void;
      const analysisPromise = new Promise((resolve) => {
        resolveAnalysis = resolve;
      });
      mockRunCompetitiveAnalysis.mockReturnValue(analysisPromise);

      const { result } = renderHook(() => useCompetitiveAnalysis());

      // Start analysis
      act(() => {
        result.current.startAnalysis('https://example.com');
      });

      // Should be analyzing
      expect(result.current.isAnalyzing).toBe(true);

      // Resolve analysis
      const mockAnalysis = {
        id: 'analysis_123',
        timestamp: '2025-01-01T00:00:00Z',
        userSite: { url: 'https://example.com', domain: 'example.com' },
        competitors: [],
        summary: {
          userRank: 1,
          totalAnalyzed: 1,
          strengthsVsCompetitors: [],
          weaknessesVsCompetitors: [],
          opportunitiesIdentified: [],
        },
      };

      await act(async () => {
        resolveAnalysis!(mockAnalysis);
        await analysisPromise;
      });

      expect(result.current.isAnalyzing).toBe(false);
    });

    it('should update progress during analysis', async () => {
      let resolveAnalysis: (value: any) => void;
      const analysisPromise = new Promise((resolve) => {
        resolveAnalysis = resolve;
      });
      mockRunCompetitiveAnalysis.mockReturnValue(analysisPromise);

      const { result } = renderHook(() => useCompetitiveAnalysis());

      // Start analysis
      act(() => {
        result.current.startAnalysis('https://example.com');
      });

      // Simulate progress updates
      act(() => {
        result.current.updateProgress(50);
      });

      expect(result.current.progress).toBe(50);

      // Complete analysis
      const mockAnalysis = {
        id: 'analysis_123',
        timestamp: '2025-01-01T00:00:00Z',
        userSite: { url: 'https://example.com', domain: 'example.com' },
        competitors: [],
        summary: {
          userRank: 1,
          totalAnalyzed: 1,
          strengthsVsCompetitors: [],
          weaknessesVsCompetitors: [],
          opportunitiesIdentified: [],
        },
      };

      await act(async () => {
        resolveAnalysis!(mockAnalysis);
        await analysisPromise;
      });

      expect(result.current.progress).toBe(100);
    });

    it('should check authentication before starting analysis', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      const { result } = renderHook(() => useCompetitiveAnalysis());

      await act(async () => {
        await result.current.startAnalysis('https://example.com');
      });

      expect(result.current.error).toBe('Vous devez être connecté pour lancer une analyse');
      expect(mockRunCompetitiveAnalysis).not.toHaveBeenCalled();
    });
  });

  describe('loadAnalysis', () => {
    it('should load analysis by ID successfully', async () => {
      const mockAnalysis = {
        id: 'analysis_123',
        timestamp: '2025-01-01T00:00:00Z',
        userSite: { url: 'https://example.com', domain: 'example.com' },
        competitors: [],
        summary: {
          userRank: 1,
          totalAnalyzed: 1,
          strengthsVsCompetitors: [],
          weaknessesVsCompetitors: [],
          opportunitiesIdentified: [],
        },
      };

      mockGetCompetitiveAnalysisById.mockResolvedValue(mockAnalysis);

      const { result } = renderHook(() => useCompetitiveAnalysis());

      await act(async () => {
        await result.current.loadAnalysis('analysis_123');
      });

      expect(result.current.currentAnalysis).toEqual(mockAnalysis);
      expect(result.current.hasAnalysis).toBe(true);
      expect(result.current.error).toBe(null);
      expect(mockGetCompetitiveAnalysisById).toHaveBeenCalledWith('analysis_123');
    });

    it('should handle error when loading analysis', async () => {
      mockGetCompetitiveAnalysisById.mockRejectedValue(new Error('Analysis not found'));

      const { result } = renderHook(() => useCompetitiveAnalysis());

      await act(async () => {
        await result.current.loadAnalysis('nonexistent');
      });

      expect(result.current.error).toBe('Analysis not found');
      expect(result.current.currentAnalysis).toBe(null);
      expect(result.current.hasAnalysis).toBe(false);
    });
  });

  describe('deleteAnalysis', () => {
    it('should delete analysis successfully', async () => {
      const mockAnalyses = [
        {
          id: '1',
          timestamp: '2025-01-01T00:00:00Z',
          userSite: { url: 'https://example1.com', domain: 'example1.com' },
          competitors: [],
          summary: {
            userRank: 1,
            totalAnalyzed: 1,
            strengthsVsCompetitors: [],
            weaknessesVsCompetitors: [],
            opportunitiesIdentified: [],
          },
        },
        {
          id: '2',
          timestamp: '2025-01-02T00:00:00Z',
          userSite: { url: 'https://example2.com', domain: 'example2.com' },
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

      mockDeleteCompetitiveAnalysis.mockResolvedValue();
      mockGetCompetitiveAnalyses.mockResolvedValue([mockAnalyses[1]]);

      const { result } = renderHook(() => useCompetitiveAnalysis());

      // Set initial state with analyses
      act(() => {
        result.current['setState'](prev => ({
          ...prev,
          savedAnalyses: mockAnalyses,
        }));
      });

      await act(async () => {
        await result.current.deleteAnalysis('1');
      });

      expect(mockDeleteCompetitiveAnalysis).toHaveBeenCalledWith('1');
      expect(result.current.savedAnalyses).toEqual([mockAnalyses[1]]);
    });

    it('should handle error when deleting analysis', async () => {
      mockDeleteCompetitiveAnalysis.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useCompetitiveAnalysis());

      await act(async () => {
        await result.current.deleteAnalysis('1');
      });

      expect(console.error).toHaveBeenCalledWith(
        'Erreur lors de la suppression de l\'analyse:',
        expect.any(Error)
      );
    });

    it('should clear current analysis if it matches deleted analysis', async () => {
      const mockAnalysis = {
        id: '1',
        timestamp: '2025-01-01T00:00:00Z',
        userSite: { url: 'https://example.com', domain: 'example.com' },
        competitors: [],
        summary: {
          userRank: 1,
          totalAnalyzed: 1,
          strengthsVsCompetitors: [],
          weaknessesVsCompetitors: [],
          opportunitiesIdentified: [],
        },
      };

      mockDeleteCompetitiveAnalysis.mockResolvedValue();
      mockGetCompetitiveAnalyses.mockResolvedValue([]);

      const { result } = renderHook(() => useCompetitiveAnalysis());

      // Set current analysis
      act(() => {
        result.current['setState'](prev => ({
          ...prev,
          currentAnalysis: mockAnalysis,
          hasAnalysis: true,
        }));
      });

      await act(async () => {
        await result.current.deleteAnalysis('1');
      });

      expect(result.current.currentAnalysis).toBe(null);
      expect(result.current.hasAnalysis).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useCompetitiveAnalysis());

      // Set an error
      act(() => {
        result.current['setState'](prev => ({
          ...prev,
          error: 'Some error',
        }));
      });

      expect(result.current.error).toBe('Some error');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('refreshAnalyses', () => {
    it('should refresh saved analyses', async () => {
      const mockAnalyses = [
        {
          id: '1',
          timestamp: '2025-01-01T00:00:00Z',
          userSite: { url: 'https://example.com', domain: 'example.com' },
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

      mockGetCompetitiveAnalyses.mockResolvedValue(mockAnalyses);

      const { result } = renderHook(() => useCompetitiveAnalysis());

      await act(async () => {
        await result.current.refreshAnalyses();
      });

      expect(result.current.savedAnalyses).toEqual(mockAnalyses);
      expect(mockGetCompetitiveAnalyses).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
    });
  });

  describe('updateProgress', () => {
    it('should update progress', () => {
      const { result } = renderHook(() => useCompetitiveAnalysis());

      act(() => {
        result.current.updateProgress(75);
      });

      expect(result.current.progress).toBe(75);
    });

    it('should clamp progress between 0 and 100', () => {
      const { result } = renderHook(() => useCompetitiveAnalysis());

      act(() => {
        result.current.updateProgress(-10);
      });
      expect(result.current.progress).toBe(0);

      act(() => {
        result.current.updateProgress(150);
      });
      expect(result.current.progress).toBe(100);
    });
  });

  describe('payment integration', () => {
    it('should check feature limits before starting analysis', async () => {
      mockPaymentContext.canUseFeature.mockReturnValue(false);
      mockPaymentContext.getFeatureLimits.mockReturnValue({ used: 10, limit: 10, remaining: 0 });

      const { result } = renderHook(() => useCompetitiveAnalysis());

      await act(async () => {
        await result.current.startAnalysis('https://example.com');
      });

      expect(mockPaymentContext.canUseFeature).toHaveBeenCalledWith('competitor_analysis');
      expect(result.current.error).toBe('Quota d\'analyses concurrentielles dépassé');
    });

    it('should show usage information', () => {
      const { result } = renderHook(() => useCompetitiveAnalysis());

      expect(result.current.usageInfo).toEqual({
        used: 1,
        limit: 10,
        remaining: 9,
      });
    });
  });
});
