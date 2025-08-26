/**
 * @fileoverview Test to verify the AuthContext .contains error fix
 * Tests that the AuthContext properly handles undefined/invalid expiresAt values
 * to prevent Samsung S25 Ultra crashes.
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { authService } from '../services/AuthService';
import * as SecureStore from 'expo-secure-store';

// Mock dependencies
jest.mock('../services/AuthService');
jest.mock('expo-secure-store');
jest.mock('../components/auth/AuthLoadingScreen', () => 'AuthLoadingScreen');

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('AuthContext Samsung S25 Ultra Fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSecureStore.getItemAsync.mockResolvedValue(null);
    mockSecureStore.setItemAsync.mockResolvedValue();
    mockSecureStore.deleteItemAsync.mockResolvedValue();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('should handle undefined expiresAt without throwing .contains error', async () => {
    const mockResponse = {
      user: { id: '1', email: 'test@example.com', isEmailVerified: true },
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresAt: undefined // This would cause the original .contains error
    };

    mockAuthService.login.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password' });
    });

    // Should not throw and should store tokens with a default expiration
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('token_expiration', expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/));
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle null expiresAt without throwing .contains error', async () => {
    const mockResponse = {
      user: { id: '1', email: 'test@example.com', isEmailVerified: true },
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresAt: null // This would cause the original .contains error
    };

    mockAuthService.signup.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signup({ 
        email: 'test@example.com', 
        password: 'password',
        confirmPassword: 'password',
        firstName: 'Test',
        lastName: 'User',
        agreeToTerms: true,
        agreeToPrivacy: true
      });
    });

    // Should not throw and should store tokens with a default expiration
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('token_expiration', expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/));
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle invalid date string in expiresAt without throwing .contains error', async () => {
    const mockResponse = {
      user: { id: '1', email: 'test@example.com', isEmailVerified: true },
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresAt: 'invalid-date-string' // This would cause the original .contains error
    };

    mockSecureStore.getItemAsync.mockResolvedValue('refresh-token');
    mockAuthService.refreshToken.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.refreshAuthToken();
    });

    // Should not throw and should store tokens with a default expiration
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('token_expiration', expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/));
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should properly handle valid Date object in expiresAt', async () => {
    const validDate = new Date('2025-12-31T23:59:59Z');
    const mockResponse = {
      user: { id: '1', email: 'test@example.com', isEmailVerified: true },
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresAt: validDate
    };

    mockAuthService.login.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password' });
    });

    // Should use the provided date
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('token_expiration', validDate.toISOString());
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should properly handle valid date string in expiresAt', async () => {
    const validDateString = '2025-12-31T23:59:59Z';
    const mockResponse = {
      user: { id: '1', email: 'test@example.com', isEmailVerified: true },
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresAt: validDateString
    };

    mockAuthService.login.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password' });
    });

    // Should parse and use the provided date string
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('token_expiration', new Date(validDateString).toISOString());
    expect(result.current.isAuthenticated).toBe(true);
  });
});