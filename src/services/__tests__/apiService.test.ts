import { apiService } from '../apiService';

// Mock fetch
global.fetch = jest.fn();

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('request method', () => {
    it('should make successful request', async () => {
      const mockResponse = { data: 'test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService['request']('/test');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle request timeout', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AbortError')), 100);
        })
      );

      await expect(apiService['request']('/test')).rejects.toThrow('Délai d\'attente dépassé');
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
        json: async () => ({ detail: { message: 'Invalid request' } }),
      });

      await expect(apiService['request']('/test')).rejects.toThrow('Invalid request');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(apiService['request']('/test')).rejects.toThrow('Network error');
    });
  });

  describe('Authentication methods', () => {
    it('should register user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password',
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await apiService.register(userData);

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(userData),
        })
      );
    });

    it('should login user', async () => {
      const credentials = {
        username: 'testuser',
        password: 'password',
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await apiService.login(credentials);

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(credentials),
        })
      );
    });

    it('should get user profile', async () => {
      const userProfile = {
        email: 'test@example.com',
        username: 'testuser',
        id: 1,
        is_active: true,
        is_verified: true,
        is_admin: false,
        created_at: '2025-01-01T00:00:00Z',
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => userProfile,
      });

      const result = await apiService.getMeBearer();

      expect(result).toEqual(userProfile);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/me-bearer'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should logout user', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await apiService.logout();

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('Plans and subscriptions', () => {
    it('should get plans', async () => {
      const plans = [
        {
          id: 'basic',
          name: 'Basic',
          price: 29,
          currency: 'EUR',
          interval: 'month' as const,
          max_analyses: 10,
          max_reports: 5,
          max_competitor_analyses: 3,
          max_optimizations: 2,
          features: ['Feature 1'],
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ plans }),
      });

      const result = await apiService.getPlans();

      expect(result).toEqual({ plans });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/plans/'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should get current subscription', async () => {
      const subscription = {
        id: 'sub_123',
        user_id: 'user_123',
        plan_id: 'basic',
        status: 'active' as const,
        start_date: '2025-01-01T00:00:00Z',
        end_date: '2025-02-01T00:00:00Z',
        auto_renew: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        plan: {
          id: 'basic',
          name: 'Basic',
          price: 29,
          currency: 'EUR',
          interval: 'month' as const,
          max_analyses: 10,
          max_reports: 5,
          max_competitor_analyses: 3,
          max_optimizations: 2,
          features: ['Feature 1'],
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscription, usage: null }),
      });

      const result = await apiService.getCurrentSubscription();

      expect(result).toEqual({ subscription, usage: null });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/subscriptions/current'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should create subscription', async () => {
      const subscriptionData = {
        plan_id: 'basic',
        auto_renew: true,
        payment_method: {
          type: 'card' as const,
          card_number: '4242424242424242',
          exp_month: '12',
          exp_year: '2030',
          cvc: '123',
          name: 'Test User',
        },
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscription: { id: 'sub_123' } }),
      });

      const result = await apiService.createSubscription(subscriptionData);

      expect(result).toEqual({ subscription: { id: 'sub_123' } });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/subscriptions/'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(subscriptionData),
        })
      );
    });

    it('should cancel subscription', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscription: { id: 'sub_123', status: 'cancelled' } }),
      });

      const result = await apiService.cancelSubscription('sub_123');

      expect(result).toEqual({ subscription: { id: 'sub_123', status: 'cancelled' } });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/subscriptions/sub_123/cancel'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ cancel_at_period_end: true }),
        })
      );
    });
  });

  describe('Usage and quotas', () => {
    it('should get usage limits', async () => {
      const usageLimits = {
        can_use_analysis: {
          allowed: true,
          used: 5,
          limit: 10,
          remaining: 5,
        },
        can_use_report: {
          allowed: true,
          used: 2,
          limit: 5,
          remaining: 3,
        },
        can_use_competitor_analysis: {
          allowed: true,
          used: 1,
          limit: 3,
          remaining: 2,
        },
        can_use_optimize: {
          allowed: true,
          used: 0,
          limit: 2,
          remaining: 2,
        },
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => usageLimits,
      });

      const result = await apiService.getUsageLimits();

      expect(result).toEqual(usageLimits);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/usage/limits'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should increment usage', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          new_usage: {
            analyses_used: 6,
            reports_used: 2,
            competitor_analyses_used: 1,
            optimizations_used: 0,
          },
        }),
      });

      const result = await apiService.incrementUsage('analysis');

      expect(result).toEqual({
        new_usage: {
          analyses_used: 6,
          reports_used: 2,
          competitor_analyses_used: 1,
          optimizations_used: 0,
        },
      });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/usage/increment'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ feature_type: 'analysis' }),
        })
      );
    });

    it('should get usage history', async () => {
      const history = [
        {
          month: '2025-01',
          analyses_used: 5,
          reports_used: 2,
          competitor_analyses_used: 1,
          optimizations_used: 0,
        },
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ history }),
      });

      const result = await apiService.getUsageHistory(6);

      expect(result).toEqual({ history });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/usage/history?months=6'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('Analysis methods', () => {
    it('should analyze website', async () => {
      const analysis = {
        id: 'analysis_123',
        status: 'processing',
        url: 'https://example.com',
        created_at: '2025-01-01T00:00:00Z',
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => analysis,
      });

      const result = await apiService.analyzeWebsite('https://example.com');

      expect(result).toEqual(analysis);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analyze'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            url: 'https://example.com',
            output_name: expect.stringContaining('analysis_'),
          }),
        })
      );
    });

    it('should handle analyze website errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ detail: { message: 'Unprocessable Entity' } }),
      });

      await expect(apiService.analyzeWebsite('https://invalid.com')).rejects.toThrow(
        'Impossible d\'analyser https://invalid.com. Le contenu du site pose problème.'
      );
    });

    it('should analyze competitors', async () => {
      const competitorAnalysis = {
        id: 'comp_analysis_123',
        status: 'processing',
        url: 'https://example.com',
        competitors: [],
        created_at: '2025-01-01T00:00:00Z',
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => competitorAnalysis,
      });

      const result = await apiService.analyzeCompetitors('https://example.com');

      expect(result).toEqual(competitorAnalysis);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v3/competitors/analyze'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            url: 'https://example.com',
            min_score: 0.3,
            min_mentions: 1,
          }),
        })
      );
    });

    it('should optimize website', async () => {
      const optimization = {
        id: 'opt_123',
        status: 'processing',
        url: 'https://example.com',
        optimizations: [],
        created_at: '2025-01-01T00:00:00Z',
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => optimization,
      });

      const result = await apiService.optimizeWebsite('https://example.com');

      expect(result).toEqual(optimization);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/optimize'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ url: 'https://example.com' }),
        })
      );
    });
  });

  describe('Reports and analyses', () => {
    it('should list reports', async () => {
      const reports = [
        {
          id: 'report_123',
          url: 'https://example.com',
          status: 'completed',
          created_at: '2025-01-01T00:00:00Z',
          duration: 30,
          metadata: {},
        },
      ];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => reports,
      });

      const result = await apiService.listReports();

      expect(result).toEqual(reports);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/reports/'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should get specific report', async () => {
      const report = {
        id: 'report_123',
        url: 'https://example.com',
        status: 'completed',
        data: {},
        metadata: {},
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => report,
      });

      const result = await apiService.getReport('report_123');

      expect(result).toEqual(report);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/reports/report_123'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should check analysis status', async () => {
      const status = {
        id: 'analysis_123',
        status: 'processing',
        progress: 50,
        estimated_completion: '2025-01-01T01:00:00Z',
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => status,
      });

      const result = await apiService.checkAnalysisStatus('analysis_123');

      expect(result).toEqual(status);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/analyses/analysis_123/status'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('Health check', () => {
    it('should perform health check', async () => {
      const health = {
        status: 'healthy',
        version: '1.0.0',
        timestamp: '2025-01-01T00:00:00Z',
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => health,
      });

      const result = await apiService.healthCheck();

      expect(result).toEqual(health);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('Get current user', () => {
    it('should get current user', async () => {
      const user = {
        id: 'user_123',
        username: 'testuser',
        email: 'test@example.com',
        created_at: '2025-01-01T00:00:00Z',
        last_login: '2025-01-01T00:00:00Z',
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => user,
      });

      const result = await apiService.getCurrentUser();

      expect(result).toEqual(user);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/users/me'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });
});
