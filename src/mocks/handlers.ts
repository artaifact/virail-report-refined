import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth endpoints
  http.post('/api/v1/auth/login', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      user: {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        is_active: true,
        subscription: {
          plan: 'premium',
          status: 'active',
          expires_at: '2025-12-31T23:59:59Z',
        },
      },
    });
  }),

  http.post('/api/v1/auth/register', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      user: {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        is_active: true,
      },
    });
  }),

  http.post('/api/v1/auth/logout', () => {
    return HttpResponse.json({ message: 'Logged out successfully' });
  }),

  // Analysis endpoints
  http.get('/api/v1/analyses', () => {
    return HttpResponse.json({
      analyses: [
        {
          id: '1',
          url: 'https://example.com',
          domain: 'example.com',
          score: 85,
          status: 'completed',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    });
  }),

  http.post('/api/v1/analyses', () => {
    return HttpResponse.json({
      id: '1',
      url: 'https://example.com',
      domain: 'example.com',
      score: 85,
      status: 'processing',
      created_at: '2025-01-01T00:00:00Z',
    });
  }),

  http.get('/api/v1/analyses/:id', () => {
    return HttpResponse.json({
      id: '1',
      url: 'https://example.com',
      domain: 'example.com',
      score: 85,
      status: 'completed',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      report: {
        summary: 'Mock report summary',
        recommendations: ['Mock recommendation 1', 'Mock recommendation 2'],
      },
    });
  }),

  // Competitive analysis endpoints
  http.post('/api/v1/competitors/analyze', () => {
    return HttpResponse.json({
      id: '1',
      url: 'https://example.com',
      competitors: ['https://competitor1.com', 'https://competitor2.com'],
      status: 'processing',
      created_at: '2025-01-01T00:00:00Z',
    });
  }),

  http.get('/api/v1/competitors/analyses/:id', () => {
    return HttpResponse.json({
      id: '1',
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
        summary: 'Mock competitive analysis summary',
        insights: ['Mock insight 1', 'Mock insight 2'],
      },
    });
  }),

  // Site optimization endpoints
  http.post('/api/v1/optimize', () => {
    return HttpResponse.json({
      id: '1',
      url: 'https://example.com',
      status: 'processing',
      created_at: '2025-01-01T00:00:00Z',
    });
  }),

  // Textual optimization endpoints
  http.post('/api/v1/textual-optimize', () => {
    return HttpResponse.json({
      id: '1',
      text: 'Mock text for optimization',
      status: 'processing',
      created_at: '2025-01-01T00:00:00Z',
    });
  }),

  // Payment endpoints
  http.get('/api/v1/payments/plans', () => {
    return HttpResponse.json([
      {
        id: 'basic',
        name: 'Basic',
        price: 29,
        currency: 'EUR',
        features: ['Feature 1', 'Feature 2'],
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 59,
        currency: 'EUR',
        features: ['Feature 1', 'Feature 2', 'Feature 3'],
      },
    ]);
  }),

  http.post('/api/v1/payments/create-subscription', () => {
    return HttpResponse.json({
      subscription_id: 'sub_123',
      client_secret: 'pi_123_secret',
    });
  }),

  // User profile endpoints
  http.get('/api/v1/users/me', () => {
    return HttpResponse.json({
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      is_active: true,
      subscription: {
        plan: 'premium',
        status: 'active',
        expires_at: '2025-12-31T23:59:59Z',
      },
    });
  }),

  http.put('/api/v1/users/me', () => {
    return HttpResponse.json({
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      is_active: true,
    });
  }),
];
