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
      
      const [accessToken, refreshToken] = await Promise.all([
        SecureStore.getItemAsync('auth_token'),
        SecureStore.getItemAsync('refresh_token'),
      ]);

      if (accessToken && refreshToken) {
        // Validate token and get user info
        const user = await authService.validateToken(accessToken);
        if (user) {
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user, accessToken, refreshToken },
          });
        } else {
          // Token is invalid, try to refresh
          await refreshAuthToken();
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      await clearStoredAuth();
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearStoredAuth = async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync('auth_token'),
        SecureStore.deleteItemAsync('refresh_token'),
        SecureStore.deleteItemAsync('token_expiration'),
      ]);
    } catch (error) {
      console.error('Error clearing stored auth:', error);
    }
  };

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await authService.login(credentials);
      
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
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshToken(refreshToken);
      
      // Store new tokens
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
      console.error('Error refreshing token:', error);
      await clearStoredAuth();
      dispatch({ type: 'LOGOUT' });
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
      {state.isLoading ? <AuthLoadingScreen /> : children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}