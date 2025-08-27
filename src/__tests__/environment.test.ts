/**
 * @fileoverview Tests for environment detection utilities
 * Tests safe DOM access methods for both browser and React Native environments
 */

import {
  isBrowser,
  hasDocumentHead,
  hasMethod,
  safeDocumentHeadContains,
  safeDOMOperation,
} from '../utils/environment';

// Mock DOM for some tests without affecting React Native simulation
const createMockElement = () => ({
  tagName: 'DIV',
  contains: jest.fn(() => false),
});

describe('Environment Detection Utilities', () => {
  describe('isBrowser', () => {
    it('should return false in test environment (simulating React Native)', () => {
      // In Jest/React Native test environment, window and document are mocked
      expect(isBrowser()).toBe(false);
    });
  });

  describe('hasDocumentHead', () => {
    it('should return false when document.head is not available', () => {
      expect(hasDocumentHead()).toBe(false);
    });
  });

  describe('hasMethod', () => {
    it('should detect existing methods', () => {
      const obj = { testMethod: () => {} };
      expect(hasMethod(obj, 'testMethod')).toBe(true);
    });

    it('should return false for non-existent methods', () => {
      const obj = {};
      expect(hasMethod(obj, 'nonExistentMethod')).toBe(false);
    });

    it('should return false for null/undefined objects', () => {
      expect(hasMethod(null, 'anyMethod')).toBe(false);
      expect(hasMethod(undefined, 'anyMethod')).toBe(false);
    });
  });

  describe('safeDocumentHeadContains', () => {
    it('should return false when document.head is not available', () => {
      const mockElement = createMockElement();
      expect(safeDocumentHeadContains(mockElement as any)).toBe(false);
    });

    it('should return false for null element', () => {
      expect(safeDocumentHeadContains(null)).toBe(false);
    });
  });

  describe('safeDOMOperation', () => {
    it('should return fallback value in non-browser environment', () => {
      const operation = () => 'browser-result';
      const fallback = 'fallback-result';
      
      expect(safeDOMOperation(operation, fallback)).toBe(fallback);
    });

    it('should handle operation errors gracefully', () => {
      const throwingOperation = () => {
        throw new Error('DOM operation failed');
      };
      const fallback = 'error-fallback';
      
      expect(safeDOMOperation(throwingOperation, fallback)).toBe(fallback);
    });
  });
});

describe('Real-world usage scenarios', () => {
  it('should prevent document.head.contains errors in React Native', () => {
    // Simulate the actual error scenario mentioned in the issue
    const styleElement = createMockElement();
    
    // This should not throw an error even in React Native environment
    expect(() => {
      const isInHead = safeDocumentHeadContains(styleElement as any);
      expect(isInHead).toBe(false); // Should be false in React Native
    }).not.toThrow();
  });

  it('should provide safe fallbacks for DOM operations', () => {
    const domOperation = () => {
      if (typeof document === 'undefined') {
        throw new Error('document is not defined');
      }
      return 'document title'; // Would be document.title in real scenario
    };

    const result = safeDOMOperation(domOperation, 'Default Title');
    expect(result).toBe('Default Title');
  });

  it('should simulate the specific TypeError scenario from the issue', () => {
    // This simulates the exact error: "Cannot read property 'contains' of undefined"
    const problematicCode = () => {
      // In the real bug, document.head was undefined in React Native
      const head = undefined as any;
      return head.contains(); // This would throw in the original code
    };

    // Our safe wrapper should handle this gracefully
    const safeResult = safeDOMOperation(problematicCode, false);
    expect(safeResult).toBe(false);
  });
});