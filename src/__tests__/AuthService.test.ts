/**
 * @fileoverview Authentication Service tests
 * @version 1.0.0
 */

import { authService } from '../services/AuthService';

describe('AuthService', () => {
  describe('Password Strength Validation', () => {
    it('should validate password strength correctly', () => {
      const weakPassword = authService.validatePasswordStrength('weak');
      expect(weakPassword.score).toBeLessThan(2);
      expect(weakPassword.feedback.length).toBeGreaterThan(0);

      const strongPassword = authService.validatePasswordStrength('StrongPassword123!');
      expect(strongPassword.score).toBeGreaterThanOrEqual(3);
      expect(strongPassword.requirements.minLength).toBe(true);
      expect(strongPassword.requirements.hasUppercase).toBe(true);
      expect(strongPassword.requirements.hasLowercase).toBe(true);
      expect(strongPassword.requirements.hasNumbers).toBe(true);
      expect(strongPassword.requirements.hasSpecialChars).toBe(true);
    });

    it('should detect common passwords', () => {
      const result = authService.validatePasswordStrength('password123');
      expect(result.score).toBeLessThan(3);
    });
  });

  describe('Social Login Providers', () => {
    it('should return available social providers', () => {
      const providers = authService.getSocialProviders();
      expect(providers).toHaveLength(3);
      expect(providers.map(p => p.id)).toEqual(['google', 'apple', 'facebook']);
    });
  });

  describe('Security Settings', () => {
    it('should return security configuration', () => {
      const settings = authService.getSecuritySettings();
      expect(settings.maxLoginAttempts).toBeGreaterThan(0);
      expect(settings.passwordMinLength).toBeGreaterThan(0);
      expect(settings.passwordRequirements).toBeDefined();
    });
  });
});