/**
 * @fileoverview Authentication utilities tests
 * @version 1.0.0
 */

import {
  validateEmail,
  validatePhone,
  validatePasswordStrength,
  validateName,
  validateRequired,
  sanitizeInput,
  generateSecurePassword,
  formatPhoneNumber,
} from '../utils/authValidation';

describe('Authentication Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'firstname+lastname@company.org',
        'test123@test-domain.com',
        'user+tag@example.io',
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user name@domain.com',
        'user@domain',
        'user..double.dot@domain.com',
        '',
        null,
        undefined,
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email as any)).toBe(false);
      });
    });
  });

  describe('validatePhone', () => {
    it('should validate correct phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '1234567890',
        '+123456789012345',
      ];

      validPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '',
        'abc',
        '123',
        '+',
        null,
        undefined,
      ];

      invalidPhones.forEach(phone => {
        expect(validatePhone(phone as any)).toBe(false);
      });
    });
  });

  describe('validatePasswordStrength', () => {
    it('should return very weak score for empty password', () => {
      const result = validatePasswordStrength('');
      expect(result.score).toBe(0);
      expect(result.feedback).toContain('Password is required');
    });

    it('should return weak score for simple password', () => {
      const result = validatePasswordStrength('simple');
      expect(result.score).toBeLessThan(2);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should return good score for complex password', () => {
      const result = validatePasswordStrength('ComplexPassword123!');
      expect(result.score).toBeGreaterThanOrEqual(3);
      expect(result.requirements.minLength).toBe(true);
      expect(result.requirements.hasUppercase).toBe(true);
      expect(result.requirements.hasLowercase).toBe(true);
      expect(result.requirements.hasNumbers).toBe(true);
      expect(result.requirements.hasSpecialChars).toBe(true);
    });

    it('should detect common weak passwords', () => {
      const result = validatePasswordStrength('password123');
      expect(result.feedback.some(f => f.includes('common'))).toBe(true);
    });

    it('should detect repeated characters', () => {
      const result = validatePasswordStrength('Passssword123!');
      expect(result.feedback.some(f => f.includes('repeating'))).toBe(true);
    });
  });

  describe('validateName', () => {
    it('should validate correct names', () => {
      const validNames = [
        'John',
        'Mary-Jane',
        "O'Connor",
        'José',
        'van der Berg',
      ];

      validNames.forEach(name => {
        expect(validateName(name)).toBe(true);
      });
    });

    it('should reject invalid names', () => {
      const invalidNames = [
        '',
        'John123',
        'Name@domain',
        'a'.repeat(51), // Too long
        null,
        undefined,
      ];

      invalidNames.forEach(name => {
        expect(validateName(name as any)).toBe(false);
      });
    });
  });

  describe('validateRequired', () => {
    it('should validate required fields correctly', () => {
      expect(validateRequired('some value')).toBe(true);
      expect(validateRequired(true)).toBe(true);
      expect(validateRequired(123)).toBe(true);
    });

    it('should reject empty or null values', () => {
      expect(validateRequired('')).toBe(false);
      expect(validateRequired('   ')).toBe(false);
      expect(validateRequired(null)).toBe(false);
      expect(validateRequired(undefined)).toBe(false);
      expect(validateRequired(false)).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize dangerous input', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      expect(sanitizeInput('  test input  ')).toBe('test input');
      expect(sanitizeInput('a'.repeat(1500))).toHaveLength(1000);
    });

    it('should handle null/undefined input', () => {
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate password of correct length', () => {
      const password = generateSecurePassword(12);
      expect(password).toHaveLength(12);
    });

    it('should generate password with required character types', () => {
      const password = generateSecurePassword(16);
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/\d/.test(password)).toBe(true);
      expect(/[!@#$%^&*]/.test(password)).toBe(true);
    });

    it('should generate different passwords each time', () => {
      const password1 = generateSecurePassword(16);
      const password2 = generateSecurePassword(16);
      expect(password1).not.toBe(password2);
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format US phone numbers correctly', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('11234567890')).toBe('+1 (123) 456-7890');
    });

    it('should handle invalid input gracefully', () => {
      expect(formatPhoneNumber('')).toBe('');
      expect(formatPhoneNumber('123')).toBe('123');
      expect(formatPhoneNumber(null as any)).toBe('');
    });
  });
});