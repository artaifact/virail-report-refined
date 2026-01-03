export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface User {
  id: string | number;
  email: string;
  username: string;
  avatar_url?: string;
  is_admin?: boolean;
  onboarding_completed?: boolean;
  onboarding_completed_at?: string | null;
  onboarding_skipped?: boolean;
  onboarding_data?: {
    steps_completed: string[];
    current_step: number;
    started_at?: string;
    time_spent_seconds: number;
    skipped_steps: string[];
  } | null;
  onboarding_version?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
} 