/**
 * @fileoverview Security context for managing security state and operations
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  SecuritySettings,
  SecurityAuditLog,
  SecurityViolation,
  SecurityEventType
} from '../services/SecurityService';
import {
  TwoFactorSettings,
  TwoFactorMethod,
  TwoFactorSetupRequest,
  TwoFactorSetupResponse,
  TwoFactorVerificationRequest
} from '../services/TwoFactorAuthService';
import { securityService } from '../services/SecurityService';
import { twoFactorAuthService } from '../services/TwoFactorAuthService';

// Security state interface
interface SecurityState {
  securitySettings: SecuritySettings | null;
  twoFactorSettings: TwoFactorSettings | null;
  auditLogs: SecurityAuditLog[];
  violations: SecurityViolation[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  deviceTrusted: boolean;
  securityDashboard: {
    loaded: boolean;
    lastUpdated: Date | null;
  };
}

// Security actions
type SecurityAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SECURITY_SETTINGS'; payload: SecuritySettings }
  | { type: 'SET_TWO_FACTOR_SETTINGS'; payload: TwoFactorSettings }
  | { type: 'SET_AUDIT_LOGS'; payload: SecurityAuditLog[] }
  | { type: 'SET_VIOLATIONS'; payload: SecurityViolation[] }
  | { type: 'SET_RISK_LEVEL'; payload: 'low' | 'medium' | 'high' | 'critical' }
  | { type: 'SET_RECOMMENDATIONS'; payload: string[] }
  | { type: 'SET_SESSION_ID'; payload: string | null }
  | { type: 'SET_DEVICE_TRUSTED'; payload: boolean }
  | { type: 'SET_DASHBOARD_DATA'; payload: { 
      auditLogs: SecurityAuditLog[];
      violations: SecurityViolation[];
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
      recommendations: string[];
    }}
  | { type: 'ADD_AUDIT_LOG'; payload: SecurityAuditLog }
  | { type: 'ADD_VIOLATION'; payload: SecurityViolation };

// Initial state
const initialState: SecurityState = {
  securitySettings: null,
  twoFactorSettings: null,
  auditLogs: [],
  violations: [],
  riskLevel: 'low',
  recommendations: [],
  isLoading: false,
  error: null,
  sessionId: null,
  deviceTrusted: false,
  securityDashboard: {
    loaded: false,
    lastUpdated: null
  }
};

// Security reducer
function securityReducer(state: SecurityState, action: SecurityAction): SecurityState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_SECURITY_SETTINGS':
      return { ...state, securitySettings: action.payload, error: null };
    case 'SET_TWO_FACTOR_SETTINGS':
      return { ...state, twoFactorSettings: action.payload, error: null };
    case 'SET_AUDIT_LOGS':
      return { ...state, auditLogs: action.payload, error: null };
    case 'SET_VIOLATIONS':
      return { ...state, violations: action.payload, error: null };
    case 'SET_RISK_LEVEL':
      return { ...state, riskLevel: action.payload };
    case 'SET_RECOMMENDATIONS':
      return { ...state, recommendations: action.payload };
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload };
    case 'SET_DEVICE_TRUSTED':
      return { ...state, deviceTrusted: action.payload };
    case 'SET_DASHBOARD_DATA':
      return {
        ...state,
        auditLogs: action.payload.auditLogs,
        violations: action.payload.violations,
        riskLevel: action.payload.riskLevel,
        recommendations: action.payload.recommendations,
        securityDashboard: {
          loaded: true,
          lastUpdated: new Date()
        },
        error: null
      };
    case 'ADD_AUDIT_LOG':
      return {
        ...state,
        auditLogs: [action.payload, ...state.auditLogs.slice(0, 99)] // Keep last 100 logs
      };
    case 'ADD_VIOLATION':
      return {
        ...state,
        violations: [action.payload, ...state.violations]
      };
    default:
      return state;
  }
}

// Security context interface
interface SecurityContextType extends SecurityState {
  // Security settings
  loadSecuritySettings: () => Promise<void>;
  updateSecuritySettings: (settings: SecuritySettings) => Promise<void>;
  
  // Two-factor authentication
  loadTwoFactorSettings: () => Promise<void>;
  setupTwoFactor: (request: TwoFactorSetupRequest) => Promise<TwoFactorSetupResponse>;
  verifyTwoFactorSetup: (method: TwoFactorMethod, code: string, setupToken: string) => Promise<void>;
  verifyTwoFactor: (request: TwoFactorVerificationRequest) => Promise<{ success: boolean; trustToken?: string }>;
  disableTwoFactor: (verificationCode: string) => Promise<void>;
  regenerateBackupCodes: (verificationCode: string) => Promise<string[]>;
  
  // Audit and monitoring
  loadAuditLogs: (filters?: any) => Promise<void>;
  loadSecurityViolations: () => Promise<void>;
  logSecurityEvent: (eventType: SecurityEventType, outcome: 'success' | 'failure' | 'warning', details?: any) => Promise<void>;
  
  // Security operations
  checkPermission: (resource: string, action: string) => Promise<boolean>;
  startSession: (userId: string) => Promise<void>;
  endSession: () => Promise<void>;
  checkDeviceTrust: () => Promise<void>;
  
  // Dashboard
  loadSecurityDashboard: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  
  // Utility
  clearError: () => void;
  encryptData: (data: string) => Promise<string>;
  decryptData: (encryptedData: string) => Promise<string>;
}

// Create context
const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

// Security provider component
export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(securityReducer, initialState);

  // Initialize security on mount
  useEffect(() => {
    initializeSecurity();
  }, []);

  // Auto-refresh dashboard every 5 minutes
  useEffect(() => {
    if (state.securityDashboard.loaded) {
      const interval = setInterval(() => {
        refreshDashboard();
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [state.securityDashboard.loaded]);

  const initializeSecurity = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      await Promise.all([
        loadSecuritySettings(),
        loadTwoFactorSettings(),
        checkDeviceTrust(),
        loadSecurityDashboard()
      ]);
    } catch (error) {
      console.error('Error initializing security:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to initialize security' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadSecuritySettings = useCallback(async (): Promise<void> => {
    try {
      const settings = await securityService.getSecuritySettings();
      dispatch({ type: 'SET_SECURITY_SETTINGS', payload: settings });
    } catch (error) {
      console.error('Error loading security settings:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to load security settings' 
      });
    }
  }, []);

  const updateSecuritySettings = useCallback(async (settings: SecuritySettings): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await securityService.saveSecuritySettings(settings);
      dispatch({ type: 'SET_SECURITY_SETTINGS', payload: settings });
    } catch (error) {
      console.error('Error updating security settings:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to update security settings' 
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadTwoFactorSettings = useCallback(async (): Promise<void> => {
    try {
      const settings = await twoFactorAuthService.getTwoFactorSettings();
      dispatch({ type: 'SET_TWO_FACTOR_SETTINGS', payload: settings });
    } catch (error) {
      console.error('Error loading 2FA settings:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to load 2FA settings' 
      });
    }
  }, []);

  const setupTwoFactor = useCallback(async (request: TwoFactorSetupRequest): Promise<TwoFactorSetupResponse> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await twoFactorAuthService.setupTwoFactor(request);
      await logSecurityEvent('2fa_enabled', 'success', { method: request.method });
      return response;
    } catch (error) {
      await logSecurityEvent('2fa_enabled', 'failure', { method: request.method, error: error.message });
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to setup 2FA' 
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const verifyTwoFactorSetup = useCallback(async (
    method: TwoFactorMethod, 
    code: string, 
    setupToken: string
  ): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const settings = await twoFactorAuthService.verifySetup(method, code, setupToken);
      dispatch({ type: 'SET_TWO_FACTOR_SETTINGS', payload: settings });
      await logSecurityEvent('2fa_enabled', 'success', { method, verified: true });
    } catch (error) {
      await logSecurityEvent('2fa_enabled', 'failure', { method, verified: false, error: error.message });
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to verify 2FA setup' 
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const verifyTwoFactor = useCallback(async (
    request: TwoFactorVerificationRequest
  ): Promise<{ success: boolean; trustToken?: string }> => {
    try {
      const result = await twoFactorAuthService.verifyTwoFactor(request);
      await logSecurityEvent('2fa_verification', result.success ? 'success' : 'failure', {
        method: request.method,
        trustDevice: request.trustDevice
      });
      return result;
    } catch (error) {
      await logSecurityEvent('2fa_verification', 'failure', {
        method: request.method,
        error: error.message
      });
      throw error;
    }
  }, []);

  const disableTwoFactor = useCallback(async (verificationCode: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await twoFactorAuthService.disableTwoFactor(verificationCode);
      await loadTwoFactorSettings();
      await logSecurityEvent('2fa_disabled', 'success');
    } catch (error) {
      await logSecurityEvent('2fa_disabled', 'failure', { error: error.message });
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to disable 2FA' 
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const regenerateBackupCodes = useCallback(async (verificationCode: string): Promise<string[]> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const codes = await twoFactorAuthService.regenerateBackupCodes(verificationCode);
      await loadTwoFactorSettings();
      await logSecurityEvent('data_modification', 'success', { resource: 'backup_codes' });
      return codes;
    } catch (error) {
      await logSecurityEvent('data_modification', 'failure', { 
        resource: 'backup_codes', 
        error: error.message 
      });
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to regenerate backup codes' 
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadAuditLogs = useCallback(async (filters?: any): Promise<void> => {
    try {
      const logs = await securityService.getAuditLogs(filters);
      dispatch({ type: 'SET_AUDIT_LOGS', payload: logs });
    } catch (error) {
      console.error('Error loading audit logs:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to load audit logs' 
      });
    }
  }, []);

  const loadSecurityViolations = useCallback(async (): Promise<void> => {
    try {
      const violations = await securityService.getSecurityViolations();
      dispatch({ type: 'SET_VIOLATIONS', payload: violations });
    } catch (error) {
      console.error('Error loading security violations:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to load security violations' 
      });
    }
  }, []);

  const logSecurityEvent = useCallback(async (
    eventType: SecurityEventType,
    outcome: 'success' | 'failure' | 'warning',
    details?: any
  ): Promise<void> => {
    try {
      await securityService.logSecurityEvent(eventType, outcome, details, 'current_user');
      
      // If this is a high-risk event, refresh the dashboard
      if (outcome === 'failure' || eventType === 'security_violation') {
        setTimeout(() => refreshDashboard(), 1000);
      }
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }, []);

  const checkPermission = useCallback(async (resource: string, action: string): Promise<boolean> => {
    try {
      return await securityService.checkPermission('current_user', resource, action);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }, []);

  const startSession = useCallback(async (userId: string): Promise<void> => {
    try {
      const sessionId = await securityService.startSession(userId);
      dispatch({ type: 'SET_SESSION_ID', payload: sessionId });
    } catch (error) {
      console.error('Error starting session:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to start session' 
      });
    }
  }, []);

  const endSession = useCallback(async (): Promise<void> => {
    try {
      await securityService.endSession('current_user');
      dispatch({ type: 'SET_SESSION_ID', payload: null });
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }, []);

  const checkDeviceTrust = useCallback(async (): Promise<void> => {
    try {
      const trusted = await twoFactorAuthService.isDeviceTrusted();
      dispatch({ type: 'SET_DEVICE_TRUSTED', payload: trusted });
    } catch (error) {
      console.error('Error checking device trust:', error);
      dispatch({ type: 'SET_DEVICE_TRUSTED', payload: false });
    }
  }, []);

  const loadSecurityDashboard = useCallback(async (): Promise<void> => {
    try {
      const dashboard = await securityService.getSecurityDashboard();
      dispatch({ type: 'SET_DASHBOARD_DATA', payload: dashboard });
    } catch (error) {
      console.error('Error loading security dashboard:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to load security dashboard' 
      });
    }
  }, []);

  const refreshDashboard = useCallback(async (): Promise<void> => {
    try {
      if (!state.isLoading) {
        await loadSecurityDashboard();
      }
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    }
  }, [state.isLoading, loadSecurityDashboard]);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const encryptData = useCallback(async (data: string): Promise<string> => {
    try {
      return await securityService.encryptData(data);
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw error;
    }
  }, []);

  const decryptData = useCallback(async (encryptedData: string): Promise<string> => {
    try {
      return await securityService.decryptData(encryptedData);
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw error;
    }
  }, []);

  const value: SecurityContextType = {
    ...state,
    loadSecuritySettings,
    updateSecuritySettings,
    loadTwoFactorSettings,
    setupTwoFactor,
    verifyTwoFactorSetup,
    verifyTwoFactor,
    disableTwoFactor,
    regenerateBackupCodes,
    loadAuditLogs,
    loadSecurityViolations,
    logSecurityEvent,
    checkPermission,
    startSession,
    endSession,
    checkDeviceTrust,
    loadSecurityDashboard,
    refreshDashboard,
    clearError,
    encryptData,
    decryptData
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

// Hook to use security context
export function useSecurity(): SecurityContextType {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}

export default SecurityContext;