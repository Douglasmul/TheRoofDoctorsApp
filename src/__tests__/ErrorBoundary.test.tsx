/**
 * @fileoverview Test ErrorBoundary component with enhanced logging
 */

import React from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Mock React Native Text component
jest.mock('react-native', () => ({
  Text: ({ children }: { children: React.ReactNode }) => children,
  View: ({ children }: { children: React.ReactNode }) => children,
  StyleSheet: {
    create: (styles: any) => styles,
  },
}));

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error for ErrorBoundary');
  }
  return 'No error';
};

// Component that throws a "contains" related error
const ThrowContainsError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Cannot read property contains of undefined');
  }
  return 'No contains error';
};

describe('ErrorBoundary', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on console.error
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error
    consoleSpy.mockRestore();
  });

  it('should enhance error logging with detailed information', () => {
    // Create a simple test by manually calling componentDidCatch
    const errorBoundary = new ErrorBoundary({ children: 'test' });
    const testError = new Error('Test error for ErrorBoundary');
    const errorInfo = { componentStack: 'Test component stack' };

    // Call componentDidCatch directly
    errorBoundary.componentDidCatch(testError, errorInfo);

    // Verify that enhanced logging occurred
    expect(consoleSpy).toHaveBeenCalledWith('=== ErrorBoundary caught error ===');
    expect(consoleSpy).toHaveBeenCalledWith('Error:', testError);
    expect(consoleSpy).toHaveBeenCalledWith('Error message:', 'Test error for ErrorBoundary');
    expect(consoleSpy).toHaveBeenCalledWith('Component stack:', 'Test component stack');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Props at error time:',
      expect.objectContaining({
        childrenType: 'string',
        hasChildren: true,
        childrenCount: 1,
      })
    );
  });

  it('should detect and log contains-related errors', () => {
    const errorBoundary = new ErrorBoundary({ children: 'test' });
    const containsError = new Error('Cannot read property contains of undefined');
    const errorInfo = { componentStack: 'Test component stack' };

    // Call componentDidCatch directly
    errorBoundary.componentDidCatch(containsError, errorInfo);

    // Verify that contains-specific logging occurred
    expect(consoleSpy).toHaveBeenCalledWith(
      '⚠️  CONTAINS ERROR DETECTED - This may be the wrapper ordering issue'
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Current error context:',
      expect.objectContaining({
        message: 'Cannot read property contains of undefined',
      })
    );
  });

  it('should update state correctly when getDerivedStateFromError is called', () => {
    const testError = new Error('Test error');
    const newState = ErrorBoundary.getDerivedStateFromError(testError);

    expect(newState).toEqual({
      hasError: true,
      error: testError,
    });
  });
});