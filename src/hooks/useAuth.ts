/**
 * @fileoverview Authentication hooks and route guards
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to require authentication for a route
 * Redirects to login if user is not authenticated
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigation.navigate('Login' as never);
    }
  }, [isAuthenticated, isLoading, navigation]);

  return { isAuthenticated, isLoading };
}

/**
 * Hook to require email verification
 * Redirects to email verification if user email is not verified
 */
export function useRequireEmailVerification() {
  const { isAuthenticated, isEmailVerified, user, isLoading } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isEmailVerified && user?.email) {
      navigation.navigate('EmailVerification' as never, { email: user.email });
    }
  }, [isAuthenticated, isEmailVerified, user?.email, isLoading, navigation]);

  return { isAuthenticated, isEmailVerified, isLoading };
}

/**
 * Hook to redirect authenticated users away from auth screens
 * Redirects to home if user is already authenticated
 */
export function useRedirectAuthenticated() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigation.navigate('Home' as never);
    }
  }, [isAuthenticated, isLoading, navigation]);

  return { isAuthenticated, isLoading };
}

/**
 * Hook to check user permissions
 */
export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  const isContractor = (): boolean => {
    return hasRole('contractor');
  };

  return {
    hasPermission,
    hasRole,
    isAdmin,
    isContractor,
    permissions: user?.permissions || [],
    role: user?.role,
  };
}

/**
 * Hook for admin-only routes
 */
export function useRequireAdmin() {
  const { isAdmin } = usePermissions();
  const { isAuthenticated, isLoading } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin()) {
      // Redirect non-admin users to home
      navigation.navigate('Home' as never);
    } else if (!isLoading && !isAuthenticated) {
      // Redirect unauthenticated users to login
      navigation.navigate('Login' as never);
    }
  }, [isAuthenticated, isLoading, isAdmin, navigation]);

  return { isAuthenticated, isAdmin: isAdmin(), isLoading };
}