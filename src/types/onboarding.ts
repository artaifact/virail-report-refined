/**
 * Types pour le système d'onboarding
 */

export interface OnboardingStep {
  id: string;
  step_number: number;
  title: string;
  description: string;
  content?: string;
  target?: string; // Selector CSS pour tooltip
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface OnboardingStatus {
  completed: boolean;
  current_step: number;
  steps_completed: string[];
  can_skip: boolean;
  onboarding_version: string;
}

export interface OnboardingData {
  steps_completed: string[];
  current_step: number;
  started_at?: string;
  time_spent_seconds: number;
  skipped_steps: string[];
}

export interface CompleteStepRequest {
  step_id: string;
  step_number: number;
  time_spent_seconds: number;
}

export interface CompleteStepResponse {
  success: boolean;
  current_step: number;
  steps_completed: string[];
}

export interface CompleteOnboardingRequest {
  skipped: boolean;
  time_spent_seconds: number;
  steps_completed: string[];
}

export interface CompleteOnboardingResponse {
  success: boolean;
  onboarding_completed: boolean;
  completed_at: string;
}

export interface SkipOnboardingRequest {
  reason: 'user_choice' | 'timeout' | 'error';
}

export interface SkipOnboardingResponse {
  success: boolean;
  onboarding_skipped: boolean;
}

