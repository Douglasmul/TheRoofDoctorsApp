/**
 * @fileoverview Authentication service with enterprise security features
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import * as Crypto from 'expo-crypto';
import {
  User,
  LoginCredentials,
  SignupCredentials,
  PasswordResetRequest,
  PasswordReset,
  AuthError,
  RateLimitInfo,
  SecuritySettings,
  SocialLoginProvider,
} from '../types/auth';

// Auth response interface
interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

// Rate limiting storage
interface RateLimitStore {
  [key: string]: {
    attempts: number;
    lastAttempt: Date;
    lockedUntil?: Date;
  };
}

/**
 * Enterprise Authentication Service
 * Provides secure authentication with advanced security features
 */
class AuthService {
  private baseURL = process.env.EXPO_PUBLIC_API_URL || 'https://api.theroofDoctors.com';
  private rateLimitStore: RateLimitStore = {};
  
  // Security configuration
  private securitySettings: SecuritySettings = {
    maxLoginAttempts: 5,
    lockoutDuration: 15, // minutes
    passwordMinLength: 8,
    passwordRequirements: {
      uppercase: true,
      lowercase: true,
      numbers: true,
      specialChars: true,
    },
    sessionTimeout: 60, // minutes
    requireEmailVerification: true,
    enableTwoFactor: false,
  };

  // Social login providers
  private socialProviders: SocialLoginProvider[] = [
    {
      id: 'google',
      name: 'Google',
      icon: 'logo-google',
      color: '#4285F4',
    },
    {
      id: 'apple',
      name: 'Apple',
      icon: 'logo-apple',
      color: '#000000',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: 'logo-facebook',
      color: '#1877F2',
    },
  ];

  /**
   * Check rate limiting for user/IP
   */
  private checkRateLimit(identifier: string): RateLimitInfo {
    const now = new Date();
    const record = this.rateLimitStore[identifier];

    if (!record) {
      return {
        remaining: this.securitySettings.maxLoginAttempts,
        resetTime: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour
        isLimited: false,
      };
    }

    // Check if lockout period has expired
    if (record.lockedUntil && now < record.lockedUntil) {
      return {
        remaining: 0,
        resetTime: record.lockedUntil,
        isLimited: true,
      };
    }

    // Reset if lockout has expired
    if (record.lockedUntil && now >= record.lockedUntil) {
      delete this.rateLimitStore[identifier];
      return {
        remaining: this.securitySettings.maxLoginAttempts,
        resetTime: new Date(now.getTime() + 60 * 60 * 1000),
        isLimited: false,
      };
    }

    const remaining = Math.max(0, this.securitySettings.maxLoginAttempts - record.attempts);
    return {
      remaining,
      resetTime: new Date(record.lastAttempt.getTime() + 60 * 60 * 1000),
      isLimited: remaining === 0,
    };
  }

  /**
   * Record failed attempt
   */
  private recordFailedAttempt(identifier: string): void {
    const now = new Date();
    const record = this.rateLimitStore[identifier] || { attempts: 0, lastAttempt: now };
    
    record.attempts += 1;
    record.lastAttempt = now;

    if (record.attempts >= this.securitySettings.maxLoginAttempts) {
      record.lockedUntil = new Date(now.getTime() + this.securitySettings.lockoutDuration * 60 * 1000);
    }

    this.rateLimitStore[identifier] = record;
  }

  /**
   * Clear failed attempts on successful login
   */
  private clearFailedAttempts(identifier: string): void {
    delete this.rateLimitStore[identifier];
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: any;
      headers?: Record<string, string>;
      accessToken?: string;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, headers = {}, accessToken } = options;
    
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (accessToken) {
      requestHeaders['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.createAuthError(response.status, errorData);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      
      // Network or other errors
      throw this.createAuthError(0, {
        message: 'Network error occurred. Please check your connection.',
        code: 'NETWORK_ERROR',
      });
    }
  }

  /**
   * Create standardized auth error
   */
  private createAuthError(status: number, errorData: any): AuthError {
    const defaultMessages: Record<number, string> = {
      400: 'Invalid request. Please check your input.',
      401: 'Invalid email or password.',
      403: 'Access forbidden.',
      404: 'Service not found.',
      409: 'Email already exists.',
      422: 'Validation error.',
      429: 'Too many attempts. Please try again later.',
      500: 'Server error. Please try again later.',
    };

    return {
      code: errorData.code || `HTTP_${status}`,
      message: errorData.message || defaultMessages[status] || 'An error occurred.',
      field: errorData.field,
      details: errorData.details,
    };
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const identifier = credentials.email.toLowerCase();
    
    // Check rate limiting
    const rateLimit = this.checkRateLimit(identifier);
    if (rateLimit.isLimited) {
      throw this.createAuthError(429, {
        message: `Too many failed attempts. Try again after ${Math.ceil((rateLimit.resetTime.getTime() - Date.now()) / 60000)} minutes.`,
        code: 'RATE_LIMITED',
      });
    }

    try {
      const response = await this.apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: {
          email: credentials.email.toLowerCase(),
          password: credentials.password,
          rememberMe: credentials.rememberMe || false,
        },
      });

      // Clear failed attempts on successful login
      this.clearFailedAttempts(identifier);
      
      return response;
    } catch (error) {
      // Record failed attempt
      this.recordFailedAttempt(identifier);
      throw error;
    }
  }

  /**
   * Sign up new user
   */
  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    // Validate password strength
    const passwordValidation = this.validatePasswordStrength(credentials.password);
    if (passwordValidation.score < 2) {
      throw this.createAuthError(422, {
        message: 'Password does not meet security requirements.',
        code: 'WEAK_PASSWORD',
        field: 'password',
        details: passwordValidation,
      });
    }

    // Validate password confirmation
    if (credentials.password !== credentials.confirmPassword) {
      throw this.createAuthError(422, {
        message: 'Passwords do not match.',
        code: 'PASSWORD_MISMATCH',
        field: 'confirmPassword',
      });
    }

    // Validate terms acceptance
    if (!credentials.agreeToTerms || !credentials.agreeToPrivacy) {
      throw this.createAuthError(422, {
        message: 'You must agree to the terms and privacy policy.',
        code: 'TERMS_NOT_ACCEPTED',
      });
    }

    return await this.apiRequest<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: {
        email: credentials.email.toLowerCase(),
        password: credentials.password,
        firstName: credentials.firstName.trim(),
        lastName: credentials.lastName.trim(),
        agreeToTerms: credentials.agreeToTerms,
        agreeToPrivacy: credentials.agreeToPrivacy,
      },
    });
  }

  /**
   * Logout user
   */
  async logout(accessToken: string): Promise<void> {
    try {
      await this.apiRequest('/auth/logout', {
        method: 'POST',
        accessToken,
      });
    } catch (error) {
      // Log error but don't throw - logout should always succeed locally
      console.error('Server logout failed:', error);
    }
  }

  /**
   * Validate token and get user info
   */
  async validateToken(accessToken: string): Promise<User | null> {
    try {
      const response = await this.apiRequest<{ user: User }>('/auth/validate', {
        method: 'GET',
        accessToken,
      });
      return response.user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return await this.apiRequest<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
  }

  /**
   * Forgot password
   */
  async forgotPassword(request: PasswordResetRequest): Promise<void> {
    await this.apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: { email: request.email.toLowerCase() },
    });
  }

  /**
   * Reset password
   */
  async resetPassword(reset: PasswordReset): Promise<void> {
    // Validate password strength
    const passwordValidation = this.validatePasswordStrength(reset.newPassword);
    if (passwordValidation.score < 2) {
      throw this.createAuthError(422, {
        message: 'Password does not meet security requirements.',
        code: 'WEAK_PASSWORD',
        field: 'newPassword',
        details: passwordValidation,
      });
    }

    // Validate password confirmation
    if (reset.newPassword !== reset.confirmPassword) {
      throw this.createAuthError(422, {
        message: 'Passwords do not match.',
        code: 'PASSWORD_MISMATCH',
        field: 'confirmPassword',
      });
    }

    await this.apiRequest('/auth/reset-password', {
      method: 'POST',
      body: {
        token: reset.token,
        newPassword: reset.newPassword,
      },
    });
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    await this.apiRequest('/auth/verify-email', {
      method: 'POST',
      body: { token },
    });
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<void> {
    await this.apiRequest('/auth/resend-verification', {
      method: 'POST',
      body: { email: email.toLowerCase() },
    });
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string) {
    const { passwordRequirements, passwordMinLength } = this.securitySettings;
    const feedback: string[] = [];
    let score = 0;

    const requirements = {
      minLength: password.length >= passwordMinLength,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    // Check length
    if (!requirements.minLength) {
      feedback.push(`Password must be at least ${passwordMinLength} characters long`);
    } else {
      score += 1;
    }

    // Check character requirements
    if (passwordRequirements.uppercase && !requirements.hasUppercase) {
      feedback.push('Include at least one uppercase letter');
    } else if (requirements.hasUppercase) {
      score += 1;
    }

    if (passwordRequirements.lowercase && !requirements.hasLowercase) {
      feedback.push('Include at least one lowercase letter');
    } else if (requirements.hasLowercase) {
      score += 1;
    }

    if (passwordRequirements.numbers && !requirements.hasNumbers) {
      feedback.push('Include at least one number');
    } else if (requirements.hasNumbers) {
      score += 1;
    }

    if (passwordRequirements.specialChars && !requirements.hasSpecialChars) {
      feedback.push('Include at least one special character');
    } else if (requirements.hasSpecialChars) {
      score += 1;
    }

    // Bonus points for length and complexity
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    return {
      score: Math.min(4, score) as 0 | 1 | 2 | 3 | 4,
      feedback,
      requirements,
    };
  }

  /**
   * Get social login providers
   */
  getSocialProviders(): SocialLoginProvider[] {
    return this.socialProviders;
  }

  /**
   * Get security settings
   */
  getSecuritySettings(): SecuritySettings {
    return { ...this.securitySettings };
  }

  /**
   * Social login (placeholder - would integrate with actual providers)
   */
  async socialLogin(provider: 'google' | 'apple' | 'facebook'): Promise<AuthResponse> {
    // This would integrate with actual social login providers
    // For now, we'll throw an error to indicate it's not implemented
    throw this.createAuthError(501, {
      message: 'Social login not implemented yet',
      code: 'NOT_IMPLEMENTED',
    });
  }
}

// Export singleton instance
export const authService = new AuthService();