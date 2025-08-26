/**
 * @fileoverview Authentication context and provider
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  AuthState,
  User,
  LoginCredentials,
  SignupCredentials,
  PasswordResetRequest,
  PasswordReset,
  AuthError,
} from '../types/auth';
import { authService } from '../services/AuthService';
import { AuthLoadingScreen } from '../components/auth/AuthLoadingScreen';

// Defensive programming: Add polyfill for 'contains' method if some library expects it
// This prevents "Cannot read property 'contains' of undefined" errors
if (typeof String.prototype.contains === 'undefined') {
  Object.defineProperty(String.prototype, 'contains', {
    value: function(searchString: string, position?: number) {
      return this.includes(searchString, position);
    },
    enumerable: false,
    configurable: true,
    writable: true
  });
}

// Add contains method to Array prototype as well (defensive programming)
if (typeof Array.prototype.contains === 'undefined') {
  Object.defineProperty(Array.prototype, 'contains', {
    value: function(searchElement: any, fromIndex?: number) {
      return this.includes(searchElement, fromIndex);
    },
    enumerable: false,
    configurable: true,
    writable: true
  });
}

// Auth Actions
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_EMAIL_VERIFIED'; payload: boolean };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  accessToken: null,
  refreshToken: null,
  isEmailVerified: false,
};

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isEmailVerified: action.payload.user.isEmailVerified,
        error: null,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
        isEmailVerified: action.payload.isEmailVerified,
      };
    case 'SET_EMAIL_VERIFIED':
      return {
        ...state,
        isEmailVerified: action.payload,
        user: state.user ? { ...state.user, isEmailVerified: action.payload } : null,
      };
    default:
      return state;
  }
}

// Auth context interface
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  forgotPassword: (request: PasswordResetRequest) => Promise<void>;
  resetPassword: (reset: PasswordReset) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshAuthToken: () => Promise<void>;
  clearError: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from stored tokens
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Defensive programming: Add null checks and proper error handling
      let accessToken: string | null = null;
      let refreshToken: string | null = null;
      
      try {
        // Safely get tokens with individual try-catch to isolate SecureStore issues
        accessToken = await SecureStore.getItemAsync('auth_token');
      } catch (error) {
        console.warn('Error getting access token from SecureStore:', error);
        accessToken = null;
      }
      
      try {
        refreshToken = await SecureStore.getItemAsync('refresh_token');
      } catch (error) {
        console.warn('Error getting refresh token from SecureStore:', error);
        refreshToken = null;
      }

      // Ensure we have valid string tokens (not just truthy values)
      if (accessToken && typeof accessToken === 'string' && accessToken.trim() !== '' &&
          refreshToken && typeof refreshToken === 'string' && refreshToken.trim() !== '') {
        
        try {
          // Validate token and get user info with proper error handling
          const user = await authService.validateToken(accessToken);
          if (user && typeof user === 'object' && user.id) {
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: { user, accessToken, refreshToken },
            });
          } else {
            // Token is invalid, try to refresh with defensive programming
            try {
              await refreshAuthToken();
            } catch (refreshError) {
              console.warn('Error refreshing token during initialization:', refreshError);
              // Clear invalid tokens if refresh fails
              await clearStoredAuth();
            }
          }
        } catch (validateError) {
          console.warn('Error validating token during initialization:', validateError);
          // Clear potentially corrupted tokens
          await clearStoredAuth();
        }
      } else {
        // No valid tokens available, ensure clean state
        console.log('No valid stored tokens found, starting with clean auth state');
      }
    } catch (error) {
      console.error('Critical error initializing auth:', error);
      // Ensure we clear any potentially corrupted state
      try {
        await clearStoredAuth();
      } catch (clearError) {
        console.error('Error clearing stored auth after initialization failure:', clearError);
      }
    } finally {
      // Always ensure loading state is cleared, even if there are errors
      try {
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (dispatchError) {
        console.error('Error setting loading state to false:', dispatchError);
        // If dispatch fails, we have a serious problem, but don't throw
      }
    }
  };

  const clearStoredAuth = async () => {
    try {
      // Use individual delete operations with error handling to prevent one failure from stopping others
      const deleteOperations = [
        { key: 'auth_token', operation: () => SecureStore.deleteItemAsync('auth_token') },
        { key: 'refresh_token', operation: () => SecureStore.deleteItemAsync('refresh_token') },
        { key: 'token_expiration', operation: () => SecureStore.deleteItemAsync('token_expiration') },
      ];

      for (const { key, operation } of deleteOperations) {
        try {
          await operation();
        } catch (error) {
          console.warn(`Error clearing stored auth key '${key}':`, error);
          // Continue with other operations even if one fails
        }
      }
    } catch (error) {
      console.error('Error in clearStoredAuth:', error);
      // Don't throw - this is a cleanup operation that should be best-effort
    }
  };

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Validate credentials before sending to service
      if (!credentials || typeof credentials !== 'object') {
        throw new Error('Invalid credentials provided');
      }

      if (!credentials.email || typeof credentials.email !== 'string' || credentials.email.trim() === '') {
        throw new Error('Valid email is required');
      }

      if (!credentials.password || typeof credentials.password !== 'string' || credentials.password.trim() === '') {
        throw new Error('Valid password is required');
      }

      const response = await authService.login(credentials);
      
      // Validate response structure
      if (!response || typeof response !== 'object' || !response.accessToken || !response.refreshToken || !response.user) {
        throw new Error('Invalid response from login service');
      }

      // Store tokens securely with individual error handling
      const storeOperations = [
        { key: 'auth_token', value: response.accessToken },
        { key: 'refresh_token', value: response.refreshToken },
        { key: 'token_expiration', value: response.expiresAt?.toISOString?.() || new Date(Date.now() + 3600000).toISOString() },
      ];

      for (const { key, value } of storeOperations) {
        try {
          if (value && typeof value === 'string') {
            await SecureStore.setItemAsync(key, value);
          }
        } catch (storeError) {
          console.warn(`Error storing ${key} in SecureStore during login:`, storeError);
          // Continue with other operations but log the issue
        }
      }

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        },
      });
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = authError?.message || 'Login failed - please try again';
      
      try {
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
      } catch (dispatchError) {
        console.error('Error setting error state during login:', dispatchError);
      }
      
      throw error;
    } finally {
      try {
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (dispatchError) {
        console.error('Error setting loading state during login:', dispatchError);
      }
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Logout from server
      if (state.accessToken) {
        await authService.logout(state.accessToken);
      }
      
      // Clear stored tokens
      await clearStoredAuth();
      
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Error during logout:', error);
      // Still logout locally even if server logout fails
      await clearStoredAuth();
      dispatch({ type: 'LOGOUT' });
    }
  }, [state.accessToken]);

  const signup = useCallback(async (credentials: SignupCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await authService.signup(credentials);
      
      // Store tokens securely
      await Promise.all([
        SecureStore.setItemAsync('auth_token', response.accessToken),
        SecureStore.setItemAsync('refresh_token', response.refreshToken),
        SecureStore.setItemAsync('token_expiration', response.expiresAt.toISOString()),
      ]);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        },
      });
    } catch (error) {
      const authError = error as AuthError;
      dispatch({ type: 'SET_ERROR', payload: authError.message });
      throw error;
    }
  }, []);

  const forgotPassword = useCallback(async (request: PasswordResetRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      await authService.forgotPassword(request);
    } catch (error) {
      const authError = error as AuthError;
      dispatch({ type: 'SET_ERROR', payload: authError.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const resetPassword = useCallback(async (reset: PasswordReset) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      await authService.resetPassword(reset);
    } catch (error) {
      const authError = error as AuthError;
      dispatch({ type: 'SET_ERROR', payload: authError.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      await authService.verifyEmail(token);
      dispatch({ type: 'SET_EMAIL_VERIFIED', payload: true });
    } catch (error) {
      const authError = error as AuthError;
      dispatch({ type: 'SET_ERROR', payload: authError.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      if (!state.user?.email) {
        throw new Error('No user email available');
      }

      await authService.resendVerificationEmail(state.user.email);
    } catch (error) {
      const authError = error as AuthError;
      dispatch({ type: 'SET_ERROR', payload: authError.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.user?.email]);

  const refreshAuthToken = useCallback(async () => {
    try {
      // Safely get refresh token with null checks
      let refreshToken: string | null = null;
      try {
        refreshToken = await SecureStore.getItemAsync('refresh_token');
      } catch (error) {
        console.warn('Error getting refresh token from SecureStore:', error);
        throw new Error('Failed to retrieve refresh token from secure storage');
      }

      // Validate refresh token exists and is a valid string
      if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim() === '') {
        throw new Error('No valid refresh token available');
      }

      // Attempt to refresh the token with proper error handling
      let response;
      try {
        response = await authService.refreshToken(refreshToken);
      } catch (serviceError) {
        console.warn('Auth service refresh token failed:', serviceError);
        throw new Error('Token refresh failed - please log in again');
      }

      // Validate response structure
      if (!response || typeof response !== 'object' || !response.accessToken || !response.refreshToken || !response.user) {
        throw new Error('Invalid response from token refresh service');
      }
      
      // Store new tokens with individual error handling
      const storeOperations = [
        { key: 'auth_token', value: response.accessToken },
        { key: 'refresh_token', value: response.refreshToken },
        { key: 'token_expiration', value: response.expiresAt?.toISOString?.() || new Date(Date.now() + 3600000).toISOString() },
      ];

      for (const { key, value } of storeOperations) {
        try {
          if (value && typeof value === 'string') {
            await SecureStore.setItemAsync(key, value);
          }
        } catch (storeError) {
          console.warn(`Error storing ${key} in SecureStore:`, storeError);
          // Continue with other operations but log the issue
        }
      }

      // Update auth state with validated data
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        },
      });
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Clear potentially corrupted tokens and logout
      try {
        await clearStoredAuth();
      } catch (clearError) {
        console.error('Error clearing stored auth after refresh failure:', clearError);
      }
      
      try {
        dispatch({ type: 'LOGOUT' });
      } catch (dispatchError) {
        console.error('Error dispatching logout after refresh failure:', dispatchError);
      }
      
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    signup,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    refreshAuthToken,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* 
        Defensive rendering: Ensure state exists and isLoading is a boolean 
        This prevents issues if the reducer state becomes corrupted
      */}
      {(state && typeof state.isLoading === 'boolean' && state.isLoading) ? (
        <AuthLoadingScreen />
      ) : (
        children || null
      )}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  try {
    const context = useContext(AuthContext);
    if (context === undefined) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    
    // Additional validation to ensure context has required properties
    if (!context || typeof context !== 'object') {
      throw new Error('AuthContext is corrupted - invalid context object');
    }

    // Ensure all required methods exist
    const requiredMethods = ['login', 'logout', 'signup', 'forgotPassword', 'resetPassword', 'verifyEmail', 'resendVerificationEmail', 'refreshAuthToken', 'clearError'];
    for (const method of requiredMethods) {
      if (typeof context[method] !== 'function') {
        console.error(`AuthContext method '${method}' is not a function`);
        throw new Error(`AuthContext is corrupted - missing or invalid method: ${method}`);
      }
    }

    return context;
  } catch (error) {
    console.error('Error in useAuth hook:', error);
    throw error;
  }
}