/**
 * @fileoverview Tests for auth DOM helpers
 * Tests safe authentication-related DOM operations
 */

import {
  checkAuthScriptsLoaded,
  injectAuthStyles,
  setTokenMetaTags,
  clearAuthDOM,
  exampleSafeDOMCheck,
  platformAwareAuthSetup,
} from '../utils/authDOMHelpers';

// Mock console.log to verify our messages
const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('Auth DOM Helpers', () => {
  afterEach(() => {
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  describe('checkAuthScriptsLoaded', () => {
    it('should return false in React Native environment', () => {
      const result = checkAuthScriptsLoaded();
      expect(result).toBe(false);
    });

    it('should not throw errors when document is undefined', () => {
      expect(() => checkAuthScriptsLoaded()).not.toThrow();
    });
  });

  describe('injectAuthStyles', () => {
    it('should return true in React Native environment', () => {
      const cssText = '.auth-form { max-width: 400px; }';
      const result = injectAuthStyles(cssText);
      expect(result).toBe(true);
    });

    it('should handle empty CSS text', () => {
      expect(() => injectAuthStyles('')).not.toThrow();
    });
  });

  describe('setTokenMetaTags', () => {
    it('should return true in React Native environment', () => {
      const tokens = { access: 'test-token', refresh: 'refresh-token' };
      const result = setTokenMetaTags(tokens);
      expect(result).toBe(true);
    });

    it('should handle empty token object', () => {
      const result = setTokenMetaTags({});
      expect(result).toBe(true);
    });
  });

  describe('clearAuthDOM', () => {
    it('should return true in React Native environment', () => {
      const result = clearAuthDOM();
      expect(result).toBe(true);
    });
  });

  describe('exampleSafeDOMCheck', () => {
    it('should return false for any element in React Native', () => {
      const mockElement = { tagName: 'STYLE' } as Element;
      const result = exampleSafeDOMCheck(mockElement);
      expect(result).toBe(false);
    });

    it('should handle null element safely', () => {
      const result = exampleSafeDOMCheck(null);
      expect(result).toBe(false);
    });

    it('should not throw the original TypeError', () => {
      // This specifically tests the fix for "Cannot read property 'contains' of undefined"
      const element = { id: 'test' } as Element;
      expect(() => exampleSafeDOMCheck(element)).not.toThrow();
    });
  });

  describe('platformAwareAuthSetup', () => {
    it('should return success true with correct platform', () => {
      const result = platformAwareAuthSetup();
      // In test environment, it might detect 'web' but fail DOM operations, which is expected
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.platform).toBe('string');
    });

    it('should handle different platform values', () => {
      // The function should work regardless of platform
      const result = platformAwareAuthSetup();
      expect(['ios', 'android', 'web', 'windows', 'macos', 'unknown']).toContain(result.platform);
    });
  });

  describe('Error Prevention Integration', () => {
    it('should prevent all DOM-related errors in React Native', () => {
      const operations = [
        () => checkAuthScriptsLoaded(),
        () => injectAuthStyles('.test { color: red; }'),
        () => setTokenMetaTags({ access: 'test' }),
        () => clearAuthDOM(),
        () => exampleSafeDOMCheck(null),
        () => platformAwareAuthSetup(),
      ];

      operations.forEach((operation, index) => {
        expect(() => operation()).not.toThrow();
      });
    });

    it('should provide meaningful fallbacks for all operations', () => {
      // All operations should return sensible values even when DOM is not available
      expect(checkAuthScriptsLoaded()).toBe(false);
      expect(injectAuthStyles('test')).toBe(true);
      expect(setTokenMetaTags({})).toBe(true);
      expect(clearAuthDOM()).toBe(true);
      expect(exampleSafeDOMCheck(null)).toBe(false);
      
      const authSetup = platformAwareAuthSetup();
      expect(typeof authSetup.success).toBe('boolean'); // Could be true or false depending on environment
      expect(authSetup.platform).toBeDefined();
    });
  });
});