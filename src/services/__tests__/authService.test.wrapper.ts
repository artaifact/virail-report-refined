// Wrapper pour AuthService sans import.meta
import { vi } from 'vitest';

// Mock import.meta avant d'importer AuthService
vi.mock('import.meta', () => ({
  env: {
    VITE_API_BASE_URL: 'http://localhost:8000',
    DEV: true,
    MODE: 'test',
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = vi.fn();

// Import AuthService après les mocks
const { AuthService } = await import('../authService');

describe('AuthService - Wrapper Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
  });

  it('should have basic methods', () => {
    expect(typeof AuthService.isAuthenticated).toBe('function');
    expect(typeof AuthService.getUser).toBe('function');
    expect(typeof AuthService.clearAll).toBe('function');
  });

  it('should return false for isAuthenticated when no user', () => {
    AuthService.clearAll();
    expect(AuthService.isAuthenticated()).toBe(false);
  });

  it('should save and retrieve user', () => {
    const mockUser = { id: '1', email: 'test@example.com', username: 'testuser' };
    AuthService.saveUser(mockUser);
    expect(AuthService.getUser()).toEqual(mockUser);
  });

  it('should clear user data', () => {
    const mockUser = { id: '1', email: 'test@example.com', username: 'testuser' };
    AuthService.saveUser(mockUser);
    AuthService.clearAll();
    expect(AuthService.getUser()).toBeNull();
  });
});
