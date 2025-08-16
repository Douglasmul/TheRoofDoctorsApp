import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';
import { Text } from 'react-native';

// Component that throws an error
const ThrowErrorComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>No error</Text>;
};

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeTruthy();
  });

  it('renders error UI when there is an error', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Test error')).toBeTruthy();
    expect(screen.getByText('Try Again')).toBeTruthy();

    consoleSpy.mockRestore();
  });

  it('renders custom fallback when provided', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const CustomFallback = ({ error }: { error: Error; retry: () => void }) => (
      <Text>Custom error: {error.message}</Text>
    );

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error: Test error')).toBeTruthy();

    consoleSpy.mockRestore();
  });
});