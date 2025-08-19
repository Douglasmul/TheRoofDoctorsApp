/**
 * @fileoverview Authentication types and interfaces
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'contractor';
  isEmailVerified: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  profilePicture?: string;
  permissions: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  isEmailVerified: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

export interface SocialLoginProvider {
  id: 'google' | 'apple' | 'facebook';
  name: string;
  icon: string;
  color: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4; // 0=very weak, 4=very strong
  feedback: string[];
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
  };
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

export interface RateLimitInfo {
  remaining: number;
  resetTime: Date;
  isLimited: boolean;
}

export interface SecuritySettings {
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  passwordMinLength: number;
  passwordRequirements: {
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    specialChars: boolean;
  };
  sessionTimeout: number; // in minutes
  requireEmailVerification: boolean;
  enableTwoFactor: boolean;
}