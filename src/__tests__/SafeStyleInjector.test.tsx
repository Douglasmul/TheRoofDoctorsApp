/**
 * @fileoverview Tests for SafeStyleInjector component core functionality
 * Tests safe DOM style injection logic without complex React Native setup
 */

import { ProblematicStyleChecker } from '../components/SafeStyleInjector';

// Mock console.log to verify our messages
const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('SafeStyleInjector Core Functionality', () => {
  afterEach(() => {
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  describe('ProblematicStyleChecker', () => {
    it('should safely handle style checking without throwing errors', () => {
      // Create a mock style element
      const mockStyleElement = {
        id: 'test-style',
        textContent: '.test { color: red; }',
        tagName: 'STYLE'
      } as HTMLStyleElement;

      expect(() => {
        ProblematicStyleChecker(mockStyleElement);
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Style is not in head or we are in React Native environment'
      );
    });
  });

  describe('Error Prevention', () => {
    it('should prevent the specific TypeError mentioned in the issue', () => {
      // This test specifically addresses the "Cannot read property 'contains' of undefined" error
      const testScenario = () => {
        // Simulate the conditions that would cause the original error
        const styleElement = {
          id: 'problematic-style',
          textContent: '.problematic { color: red; }'
        } as HTMLStyleElement;

        // This would have thrown "TypeError: Cannot read property 'contains' of undefined"
        // in the original code, but our safe wrapper handles it
        ProblematicStyleChecker(styleElement);
      };

      expect(testScenario).not.toThrow();
    });

    it('should handle various element types safely', () => {
      const elements = [
        null,
        undefined,
        { tagName: 'STYLE' } as HTMLStyleElement,
        { tagName: 'LINK' } as HTMLLinkElement,
      ];

      elements.forEach(element => {
        expect(() => {
          ProblematicStyleChecker(element as HTMLStyleElement);
        }).not.toThrow();
      });
    });
  });
});