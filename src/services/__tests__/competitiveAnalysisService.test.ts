import { competitiveAnalysisService } from '../competitiveAnalysisService';

// Mock dependencies
jest.mock('@/services/authService');
jest.mock('@/services/apiService');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = jest.fn();

describe('competitiveAnalysisService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
  });

  describe('getSavedAnalyses', () => {
    it('should return empty array when no saved analyses', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = competitiveAnalysisService.getSavedAnalyses();

      expect(result).toEqual([]);
    });

    it('should return saved analyses from localStorage', () => {
      const savedAnalyses = [
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
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedAnalyses));

      const result = competitiveAnalysisService.getSavedAnalyses();

      expect(result).toEqual(savedAnalyses);
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = competitiveAnalysisService.getSavedAnalyses();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Erreur lors de la récupération'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('saveAnalysis', () => {
    it('should save analysis to localStorage', () => {
      const analysis = {
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

      competitiveAnalysisService.saveAnalysis(analysis);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'competitive_analyses',
        JSON.stringify([analysis])
      );
    });

    it('should append to existing analyses', () => {
      const existingAnalyses = [
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
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingAnalyses));

      const newAnalysis = {
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
      };

      competitiveAnalysisService.saveAnalysis(newAnalysis);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'competitive_analyses',
        JSON.stringify([...existingAnalyses, newAnalysis])
      );
    });

    it('should handle localStorage error', () => {
      const analysis = {
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

      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      competitiveAnalysisService.saveAnalysis(analysis);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Erreur lors de la sauvegarde'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('deleteAnalysis', () => {
    it('should delete analysis from localStorage', () => {
      const analyses = [
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
      localStorageMock.getItem.mockReturnValue(JSON.stringify(analyses));

      competitiveAnalysisService.deleteAnalysis('1');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'competitive_analyses',
        JSON.stringify([analyses[1]])
      );
    });

    it('should handle analysis not found', () => {
      const analyses = [
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
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(analyses));

      competitiveAnalysisService.deleteAnalysis('nonexistent');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'competitive_analyses',
        JSON.stringify(analyses)
      );
    });
  });

  describe('runCompetitiveAnalysis', () => {
    it('should run competitive analysis successfully', async () => {
      const mockApiResponse = {
        id: 'analysis_123',
        url: 'https://example.com',
        competitors: [
          {
            url: 'https://competitor1.com',
            domain: 'competitor1.com',
            score: 80,
            mentions: 25,
          },
        ],
        status: 'completed',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        mini_llm_results: {
          summary: 'Analysis summary',
          insights: ['Insight 1', 'Insight 2'],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const result = await competitiveAnalysisService.runCompetitiveAnalysis(
        'https://example.com'
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: 'analysis_123',
          userSite: expect.objectContaining({
            url: 'https://example.com',
            domain: 'example.com',
          }),
          competitors: expect.arrayContaining([
            expect.objectContaining({
              url: 'https://competitor1.com',
              domain: 'competitor1.com',
            }),
          ]),
          summary: expect.objectContaining({
            userRank: expect.any(Number),
            totalAnalyzed: expect.any(Number),
          }),
        })
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/competitors/analyze'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });

    it('should handle API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid URL' }),
      });

      await expect(
        competitiveAnalysisService.runCompetitiveAnalysis('invalid-url')
      ).rejects.toThrow('Invalid URL');
    });

    it('should handle network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        competitiveAnalysisService.runCompetitiveAnalysis('https://example.com')
      ).rejects.toThrow('Network error');
    });

    it('should return minimal result for pending analysis', async () => {
      const mockApiResponse = {
        id: 'analysis_123',
        url: 'https://example.com',
        competitors: [],
        status: 'processing',
        created_at: '2025-01-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const result = await competitiveAnalysisService.runCompetitiveAnalysis(
        'https://example.com'
      );

      expect(result.summary.strengthsVsCompetitors).toContain('Analyse en cours...');
      expect(result.summary.weaknessesVsCompetitors).toContain('Analyse en cours...');
      expect(result.summary.opportunitiesIdentified).toContain('Analyse en cours...');
    });
  });

  describe('getCompetitiveAnalysisById', () => {
    it('should get analysis by ID from API', async () => {
      const mockApiResponse = {
        id: 'analysis_123',
        url: 'https://example.com',
        competitors: [
          {
            url: 'https://competitor1.com',
            domain: 'competitor1.com',
            score: 80,
            mentions: 25,
          },
        ],
        status: 'completed',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        mini_llm_results: {
          summary: 'Analysis summary',
          insights: ['Insight 1', 'Insight 2'],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const result = await competitiveAnalysisService.getCompetitiveAnalysisById(
        'analysis_123'
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: 'analysis_123',
          userSite: expect.objectContaining({
            url: 'https://example.com',
            domain: 'example.com',
          }),
        })
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/competitors/analyses/analysis_123'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
    });

    it('should retry on missing mini_llm_results', async () => {
      const mockApiResponse1 = {
        id: 'analysis_123',
        url: 'https://example.com',
        competitors: [],
        status: 'processing',
        created_at: '2025-01-01T00:00:00Z',
      };

      const mockApiResponse2 = {
        id: 'analysis_123',
        url: 'https://example.com',
        competitors: [],
        status: 'completed',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        mini_llm_results: {
          summary: 'Analysis summary',
          insights: ['Insight 1'],
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse2,
        });

      // Mock setTimeout to resolve immediately
      jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
        callback();
        return {} as NodeJS.Timeout;
      });

      const result = await competitiveAnalysisService.getCompetitiveAnalysisById(
        'analysis_123'
      );

      expect(result).toBeDefined();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Analysis not found' }),
      });

      await expect(
        competitiveAnalysisService.getCompetitiveAnalysisById('nonexistent')
      ).rejects.toThrow('Analysis not found');
    });
  });

  describe('clearAllAnalyses', () => {
    it('should clear all analyses from localStorage', () => {
      competitiveAnalysisService.clearAllAnalyses();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('competitive_analyses');
    });

    it('should handle localStorage error', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      competitiveAnalysisService.clearAllAnalyses();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Erreur lors de la suppression'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('mapApiDataToResult', () => {
    it('should map API data to result format', () => {
      const apiData = {
        id: 'analysis_123',
        url: 'https://example.com',
        competitors: [
          {
            url: 'https://competitor1.com',
            domain: 'competitor1.com',
            score: 80,
            mentions: 25,
          },
          {
            url: 'https://competitor2.com',
            domain: 'competitor2.com',
            score: 75,
            mentions: 20,
          },
        ],
        status: 'completed',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        mini_llm_results: {
          summary: 'Analysis summary',
          insights: ['Insight 1', 'Insight 2'],
        },
      };

      const result = competitiveAnalysisService['mapApiDataToResult'](apiData);

      expect(result).toEqual({
        id: 'analysis_123',
        timestamp: '2025-01-01T00:00:00Z',
        userSite: {
          url: 'https://example.com',
          domain: 'example.com',
          report: expect.objectContaining({
            url: 'https://example.com',
            total_score: expect.any(Number),
            grade: expect.any(String),
          }),
        },
        competitors: expect.arrayContaining([
          expect.objectContaining({
            url: 'https://competitor1.com',
            domain: 'competitor1.com',
            report: expect.objectContaining({
              url: 'https://competitor1.com',
              total_score: 80,
            }),
          }),
          expect.objectContaining({
            url: 'https://competitor2.com',
            domain: 'competitor2.com',
            report: expect.objectContaining({
              url: 'https://competitor2.com',
              total_score: 75,
            }),
          }),
        ]),
        summary: expect.objectContaining({
          userRank: expect.any(Number),
          totalAnalyzed: 3, // user + 2 competitors
          strengthsVsCompetitors: expect.any(Array),
          weaknessesVsCompetitors: expect.any(Array),
          opportunitiesIdentified: expect.any(Array),
        }),
      });
    });

    it('should handle missing mini_llm_results', () => {
      const apiData = {
        id: 'analysis_123',
        url: 'https://example.com',
        competitors: [],
        status: 'processing',
        created_at: '2025-01-01T00:00:00Z',
      };

      const result = competitiveAnalysisService['mapApiDataToResult'](apiData);

      expect(result.summary.strengthsVsCompetitors).toContain('Analyse en cours...');
      expect(result.summary.weaknessesVsCompetitors).toContain('Analyse en cours...');
      expect(result.summary.opportunitiesIdentified).toContain('Analyse en cours...');
    });
  });

  describe('generateMockReport', () => {
    it('should generate mock report for URL', () => {
      const report = competitiveAnalysisService['generateMockReport']('https://example.com');

      expect(report).toEqual({
        url: 'https://example.com',
        total_score: expect.any(Number),
        grade: expect.stringMatching(/^[A-F]$/),
        credibility_authority: expect.objectContaining({
          score: expect.any(Number),
          details: expect.objectContaining({
            sources_verifiables: expect.any(Number),
            certifications: expect.any(Number),
            avis_clients: expect.any(Number),
            historique_marque: expect.any(Number),
          }),
        }),
        structure_readability: expect.objectContaining({
          score: expect.any(Number),
          details: expect.objectContaining({
            hierarchie: expect.any(Number),
            formatage: expect.any(Number),
            lisibilite: expect.any(Number),
            longueur_optimale: expect.any(Number),
            multimedia: expect.any(Number),
          }),
        }),
        contextual_relevance: expect.objectContaining({
          score: expect.any(Number),
          details: expect.objectContaining({
            reponse_intention: expect.any(Number),
            personnalisation: expect.any(Number),
            actualite: expect.any(Number),
            langue_naturelle: expect.any(Number),
            localisation: expect.any(Number),
          }),
        }),
        technical_compatibility: expect.objectContaining({
          score: expect.any(Number),
          details: expect.objectContaining({
            donnees_structurees: expect.any(Number),
            meta_donnees: expect.any(Number),
            performances: expect.any(Number),
            compatibilite_mobile: expect.any(Number),
            securite: expect.any(Number),
          }),
        }),
        primary_recommendations: expect.any(Array),
      });

      // Verify scores are within valid ranges
      expect(report.total_score).toBeGreaterThanOrEqual(0);
      expect(report.total_score).toBeLessThanOrEqual(100);
      expect(report.credibility_authority.score).toBeGreaterThanOrEqual(0);
      expect(report.credibility_authority.score).toBeLessThanOrEqual(100);
      expect(report.structure_readability.score).toBeGreaterThanOrEqual(0);
      expect(report.structure_readability.score).toBeLessThanOrEqual(100);
      expect(report.contextual_relevance.score).toBeGreaterThanOrEqual(0);
      expect(report.contextual_relevance.score).toBeLessThanOrEqual(100);
      expect(report.technical_compatibility.score).toBeGreaterThanOrEqual(0);
      expect(report.technical_compatibility.score).toBeLessThanOrEqual(100);
    });

    it('should generate consistent scores for same URL', () => {
      const report1 = competitiveAnalysisService['generateMockReport']('https://example.com');
      const report2 = competitiveAnalysisService['generateMockReport']('https://example.com');

      expect(report1.total_score).toBe(report2.total_score);
      expect(report1.grade).toBe(report2.grade);
    });

    it('should generate different scores for different URLs', () => {
      const report1 = competitiveAnalysisService['generateMockReport']('https://example1.com');
      const report2 = competitiveAnalysisService['generateMockReport']('https://example2.com');

      // They might be the same due to simple hash, but structure should be identical
      expect(report1).toEqual(expect.objectContaining({
        url: 'https://example1.com',
        total_score: expect.any(Number),
        grade: expect.any(String),
      }));
      expect(report2).toEqual(expect.objectContaining({
        url: 'https://example2.com',
        total_score: expect.any(Number),
        grade: expect.any(String),
      }));
    });
  });
});
