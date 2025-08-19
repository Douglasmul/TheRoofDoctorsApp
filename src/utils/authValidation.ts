/**
 * @fileoverview Authentication utilities and helpers
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import { PasswordStrength } from '../types/auth';

/**
 * Email validation regex - RFC 5322 compliant
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Phone number validation regex - supports multiple formats
 */
const PHONE_REGEX = /^[\+]?[1-9][\d]{3,15}$/;

/**
 * Strong password requirements
 */
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /\d/,
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/,
};

/**
 * Common weak passwords to check against
 */
const WEAK_PASSWORDS = new Set([
  'password',
  'password123',
  '123456',
  '123456789',
  'qwerty',
  'abc123',
  'password1',
  'admin',
  'letmein',
  'welcome',
  'monkey',
  '1234567890',
  'iloveyou',
  'dragon',
  'pass',
  'master',
  'hello',
  'freedom',
  'whatever',
  'qazwsx',
  'trustno1',
]);

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) {
    return false;
  }
  
  return EMAIL_REGEX.test(trimmed);
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return PHONE_REGEX.test(cleaned);
}

/**
 * Validate password strength with detailed feedback
 */
export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (!password || typeof password !== 'string') {
    return {
      score: 0,
      feedback: ['Password is required'],
      requirements: {
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumbers: false,
        hasSpecialChars: false,
      },
    };
  }

  const requirements = {
    minLength: password.length >= PASSWORD_REQUIREMENTS.minLength,
    hasUppercase: PASSWORD_REQUIREMENTS.hasUppercase.test(password),
    hasLowercase: PASSWORD_REQUIREMENTS.hasLowercase.test(password),
    hasNumbers: PASSWORD_REQUIREMENTS.hasNumber.test(password),
    hasSpecialChars: PASSWORD_REQUIREMENTS.hasSpecialChar.test(password),
  };

  // Check length
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    feedback.push(`Must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  } else if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    feedback.push(`Must be no more than ${PASSWORD_REQUIREMENTS.maxLength} characters long`);
  } else {
    score += 1;
  }

  // Check character requirements
  if (!requirements.hasUppercase) {
    feedback.push('Must include at least one uppercase letter');
  } else {
    score += 1;
  }

  if (!requirements.hasLowercase) {
    feedback.push('Must include at least one lowercase letter');
  } else {
    score += 1;
  }

  if (!requirements.hasNumbers) {
    feedback.push('Must include at least one number');
  } else {
    score += 1;
  }

  if (!requirements.hasSpecialChars) {
    feedback.push('Must include at least one special character (!@#$%^&*(),.?":{}|<>)');
  } else {
    score += 1;
  }

  // Check for common weak passwords
  if (WEAK_PASSWORDS.has(password.toLowerCase())) {
    feedback.push('This password is too common, please choose a stronger one');
    score = Math.max(0, score - 2);
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeating characters more than twice');
    score = Math.max(0, score - 1);
  }

  // Check for sequential characters
  if (hasSequentialChars(password)) {
    feedback.push('Avoid sequential characters (e.g., 123, abc)');
    score = Math.max(0, score - 1);
  }

  // Bonus points for longer passwords
  if (password.length >= 12) {
    score += 1;
  }
  if (password.length >= 16) {
    score += 1;
  }

  // Ensure score is within valid range
  score = Math.max(0, Math.min(4, score)) as 0 | 1 | 2 | 3 | 4;

  // Add positive feedback for strong passwords
  if (score >= 3 && feedback.length === 0) {
    if (score === 4) {
      feedback.push('Excellent! Very strong password');
    } else {
      feedback.push('Good! Strong password');
    }
  }

  return {
    score,
    feedback,
    requirements,
  };
}

/**
 * Check for sequential characters in password
 */
function hasSequentialChars(password: string): boolean {
  const sequences = [
    'abcdefghijklmnopqrstuvwxyz',
    '0123456789',
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm',
  ];

  const lower = password.toLowerCase();
  
  for (const sequence of sequences) {
    for (let i = 0; i <= sequence.length - 3; i++) {
      const subseq = sequence.substring(i, i + 3);
      if (lower.includes(subseq) || lower.includes(subseq.split('').reverse().join(''))) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Validate name (first name, last name)
 */
export function validateName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }
  
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 50) {
    return false;
  }
  
  // Allow letters, spaces, hyphens, apostrophes, and common international characters
  return /^[a-zA-ZÀ-ÿĀ-žА-я\s\-']+$/.test(trimmed);
}

/**
 * Validate required field
 */
export function validateRequired(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  if (typeof value === 'boolean') {
    return value === true;
  }
  
  return true;
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

/**
 * Generate secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure we have at least one character from each required category
  const categories = [
    'abcdefghijklmnopqrstuvwxyz',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    '0123456789',
    '!@#$%^&*',
  ];
  
  // Add one character from each category
  for (const category of categories) {
    const randomIndex = Math.floor(Math.random() * category.length);
    password += category[randomIndex];
  }
  
  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Check if email domain is valid
 */
export function validateEmailDomain(email: string): boolean {
  if (!validateEmail(email)) {
    return false;
  }
  
  const domain = email.split('@')[1];
  if (!domain) {
    return false;
  }
  
  // Check for common typos in popular domains
  const commonDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'aol.com',
  ];
  
  const typos: { [key: string]: string } = {
    'gmail.co': 'gmail.com',
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'yahoo.co': 'yahoo.com',
    'hotmai.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
  };
  
  // Suggest correction for common typos
  if (typos[domain]) {
    return false; // Could be enhanced to return suggestion
  }
  
  return true;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) {
    return '';
  }
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone; // Return original if can't format
}

/**
 * Debounce function for validation
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}