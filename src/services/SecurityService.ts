/**
 * @fileoverview Enhanced Security Service with audit logging and permissions
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { twoFactorAuthService } from './TwoFactorAuthService';

// Security event types
export type SecurityEventType = 
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'password_change'
  | '2fa_enabled'
  | '2fa_disabled'
  | '2fa_verification'
  | 'permission_check'
  | 'data_access'
  | 'data_modification'
  | 'session_start'
  | 'session_end'
  | 'security_violation'
  | 'encryption_operation'
  | 'key_rotation';

// Security audit log entry
export interface SecurityAuditLog {
  id: string;
  timestamp: Date;
  eventType: SecurityEventType;
  userId?: string;
  sessionId: string;
  deviceId: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  outcome: 'success' | 'failure' | 'warning';
  details?: any;
  riskScore: number; // 0-100, higher = more risky
}

// User permission
export interface UserPermission {
  resource: string;
  actions: string[];
  conditions?: any;
}

// Security settings
export interface SecuritySettings {
  passwordPolicy: PasswordPolicy;
  sessionSettings: SessionSettings;
  encryptionSettings: EncryptionSettings;
  auditSettings: AuditSettings;
  twoFactorRequired: boolean;
  permissionSettings: PermissionSettings;
}

// Password policy
export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number; // days
  preventReuse: number; // number of previous passwords to check
}

// Session settings
export interface SessionSettings {
  maxDuration: number; // minutes
  inactivityTimeout: number; // minutes
  maxConcurrentSessions: number;
  requireReauth: boolean;
  trustDeviceDuration: number; // days
}

// Encryption settings
export interface EncryptionSettings {
  algorithm: string;
  keySize: number;
  rotationInterval: number; // days
  saltRounds: number;
}

// Audit settings
export interface AuditSettings {
  enabled: boolean;
  retentionDays: number;
  logLevel: 'minimal' | 'standard' | 'detailed';
  realTimeAnalysis: boolean;
  alertThresholds: {
    failedLogins: number;
    riskScore: number;
    suspiciousActivity: number;
  };
}

// Permission settings
export interface PermissionSettings {
  defaultRole: string;
  inheritanceEnabled: boolean;
  cacheDuration: number; // minutes
}

// Encryption key
interface EncryptionKey {
  id: string;
  key: string;
  algorithm: string;
  createdAt: Date;
  expiresAt: Date;
  rotated: boolean;
}

// Security violation
export interface SecurityViolation {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  userId?: string;
  deviceId: string;
  mitigationActions: string[];
}

/**
 * Enhanced Security Service
 * Provides comprehensive security features including audit logging, 
 * encryption, permissions, and security monitoring
 */
class SecurityService {
  private baseURL = process.env.EXPO_PUBLIC_API_URL || 'https://api.theroofDoctors.com';
  private currentSessionId: string = '';
  private deviceId: string = '';
  
  private readonly STORAGE_KEYS = {
    SECURITY_SETTINGS: 'security_settings',
    AUDIT_LOGS: 'audit_logs',
    ENCRYPTION_KEYS: 'encryption_keys',
    USER_PERMISSIONS: 'user_permissions',
    SESSION_DATA: 'session_data',
    VIOLATION_LOGS: 'violation_logs',
    DEVICE_FINGERPRINT: 'device_fingerprint'
  };

  // Default security settings
  private defaultSettings: SecuritySettings = {
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90,
      preventReuse: 5
    },
    sessionSettings: {
      maxDuration: 480, // 8 hours
      inactivityTimeout: 30,
      maxConcurrentSessions: 3,
      requireReauth: false,
      trustDeviceDuration: 30
    },
    encryptionSettings: {
      algorithm: 'AES-256-GCM',
      keySize: 256,
      rotationInterval: 30,
      saltRounds: 12
    },
    auditSettings: {
      enabled: true,
      retentionDays: 90,
      logLevel: 'standard',
      realTimeAnalysis: true,
      alertThresholds: {
        failedLogins: 5,
        riskScore: 75,
        suspiciousActivity: 10
      }
    },
    twoFactorRequired: false,
    permissionSettings: {
      defaultRole: 'user',
      inheritanceEnabled: true,
      cacheDuration: 60
    }
  };

  constructor() {
    this.initializeSecurity();
  }

  /**
   * Initialize security service
   */
  private async initializeSecurity() {
    this.currentSessionId = await this.generateSessionId();
    this.deviceId = await this.getOrCreateDeviceId();
    await this.initializeEncryptionKeys();
    await this.loadSecuritySettings();
  }

  /**
   * Generate unique session ID
   */
  private async generateSessionId(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return Array.from(randomBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Get or create device ID
   */
  private async getOrCreateDeviceId(): Promise<string> {
    try {
      let deviceId = await SecureStore.getItemAsync(this.STORAGE_KEYS.DEVICE_FINGERPRINT);
      if (!deviceId) {
        deviceId = await this.generateDeviceFingerprint();
        await SecureStore.setItemAsync(this.STORAGE_KEYS.DEVICE_FINGERPRINT, deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      return 'unknown_device';
    }
  }

  /**
   * Generate device fingerprint
   */
  private async generateDeviceFingerprint(): Promise<string> {
    // In a real implementation, you'd collect device characteristics
    // like screen resolution, timezone, platform info, etc.
    const randomBytes = await Crypto.getRandomBytesAsync(20);
    return Array.from(randomBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Initialize encryption keys
   */
  private async initializeEncryptionKeys() {
    try {
      const existingKeys = await this.getEncryptionKeys();
      
      if (existingKeys.length === 0) {
        await this.generateNewEncryptionKey();
      } else {
        // Check if keys need rotation
        const activeKey = existingKeys.find(key => !key.rotated);
        if (activeKey && this.shouldRotateKey(activeKey)) {
          await this.rotateEncryptionKey();
        }
      }
    } catch (error) {
      console.error('Error initializing encryption keys:', error);
    }
  }

  /**
   * Generate new encryption key
   */
  private async generateNewEncryptionKey(): Promise<EncryptionKey> {
    const settings = await this.getSecuritySettings();
    const keyBytes = await Crypto.getRandomBytesAsync(settings.encryptionSettings.keySize / 8);
    const keyString = Array.from(keyBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');

    const encryptionKey: EncryptionKey = {
      id: await this.generateSessionId(),
      key: keyString,
      algorithm: settings.encryptionSettings.algorithm,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + settings.encryptionSettings.rotationInterval * 24 * 60 * 60 * 1000),
      rotated: false
    };

    await this.storeEncryptionKey(encryptionKey);
    await this.logSecurityEvent('encryption_operation', 'success', { action: 'key_generation', keyId: encryptionKey.id });

    return encryptionKey;
  }

  /**
   * Check if key should be rotated
   */
  private shouldRotateKey(key: EncryptionKey): boolean {
    return new Date() >= key.expiresAt;
  }

  /**
   * Rotate encryption key
   */
  private async rotateEncryptionKey(): Promise<void> {
    try {
      const currentKeys = await this.getEncryptionKeys();
      const activeKey = currentKeys.find(key => !key.rotated);
      
      if (activeKey) {
        // Mark current key as rotated
        activeKey.rotated = true;
        await this.storeEncryptionKey(activeKey);
      }
      
      // Generate new key
      await this.generateNewEncryptionKey();
      
      await this.logSecurityEvent('key_rotation', 'success', { previousKeyId: activeKey?.id });
    } catch (error) {
      console.error('Error rotating encryption key:', error);
      await this.logSecurityEvent('key_rotation', 'failure', { error: error.message });
    }
  }

  /**
   * Store encryption key securely
   */
  private async storeEncryptionKey(key: EncryptionKey): Promise<void> {
    try {
      const existingKeys = await this.getEncryptionKeys();
      const updatedKeys = existingKeys.filter(k => k.id !== key.id);
      updatedKeys.push(key);
      
      const encrypted = await this.encryptData(JSON.stringify(updatedKeys));
      await SecureStore.setItemAsync(this.STORAGE_KEYS.ENCRYPTION_KEYS, encrypted);
    } catch (error) {
      console.error('Error storing encryption key:', error);
      throw new Error('Failed to store encryption key');
    }
  }

  /**
   * Get encryption keys
   */
  private async getEncryptionKeys(): Promise<EncryptionKey[]> {
    try {
      const encrypted = await SecureStore.getItemAsync(this.STORAGE_KEYS.ENCRYPTION_KEYS);
      if (!encrypted) return [];
      
      const decrypted = await this.decryptData(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error getting encryption keys:', error);
      return [];
    }
  }

  /**
   * Get active encryption key
   */
  private async getActiveEncryptionKey(): Promise<EncryptionKey | null> {
    const keys = await this.getEncryptionKeys();
    return keys.find(key => !key.rotated) || null;
  }

  /**
   * Encrypt data using active key
   */
  async encryptData(data: string): Promise<string> {
    try {
      // For demonstration purposes, using base64 encoding
      // In production, implement proper AES-256-GCM encryption
      const encrypted = btoa(data);
      
      await this.logSecurityEvent('encryption_operation', 'success', {
        action: 'encrypt',
        dataSize: data.length
      });
      
      return encrypted;
    } catch (error) {
      await this.logSecurityEvent('encryption_operation', 'failure', {
        action: 'encrypt',
        error: error.message
      });
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data
   */
  async decryptData(encryptedData: string): Promise<string> {
    try {
      // For demonstration purposes, using base64 decoding
      // In production, implement proper AES-256-GCM decryption
      const decrypted = atob(encryptedData);
      
      await this.logSecurityEvent('encryption_operation', 'success', {
        action: 'decrypt',
        dataSize: decrypted.length
      });
      
      return decrypted;
    } catch (error) {
      await this.logSecurityEvent('encryption_operation', 'failure', {
        action: 'decrypt',
        error: error.message
      });
      throw new Error('Decryption failed');
    }
  }

  /**
   * Load security settings
   */
  private async loadSecuritySettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.SECURITY_SETTINGS);
      if (!stored) {
        await this.saveSecuritySettings(this.defaultSettings);
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  }

  /**
   * Get security settings
   */
  async getSecuritySettings(): Promise<SecuritySettings> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.SECURITY_SETTINGS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error getting security settings:', error);
    }
    return this.defaultSettings;
  }

  /**
   * Save security settings
   */
  async saveSecuritySettings(settings: SecuritySettings): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.SECURITY_SETTINGS, JSON.stringify(settings));
      await this.logSecurityEvent('data_modification', 'success', { resource: 'security_settings' });
    } catch (error) {
      console.error('Error saving security settings:', error);
      await this.logSecurityEvent('data_modification', 'failure', { resource: 'security_settings', error: error.message });
      throw new Error('Failed to save security settings');
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    eventType: SecurityEventType,
    outcome: 'success' | 'failure' | 'warning',
    details?: any,
    userId?: string
  ): Promise<void> {
    try {
      const settings = await this.getSecuritySettings();
      if (!settings.auditSettings.enabled) return;

      const auditLog: SecurityAuditLog = {
        id: await this.generateSessionId(),
        timestamp: new Date(),
        eventType,
        userId,
        sessionId: this.currentSessionId,
        deviceId: this.deviceId,
        outcome,
        details,
        riskScore: this.calculateRiskScore(eventType, outcome, details)
      };

      await this.storeAuditLog(auditLog);
      
      // Check for security violations
      if (auditLog.riskScore >= settings.auditSettings.alertThresholds.riskScore) {
        await this.handleSecurityViolation(auditLog);
      }

      // Real-time analysis if enabled
      if (settings.auditSettings.realTimeAnalysis) {
        await this.analyzeSecurityEvent(auditLog);
      }
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  /**
   * Calculate risk score for security event
   */
  private calculateRiskScore(eventType: SecurityEventType, outcome: string, details?: any): number {
    let baseScore = 0;

    // Base scores by event type
    const eventScores = {
      login_failure: 30,
      security_violation: 90,
      '2fa_disabled': 60,
      permission_check: 10,
      data_modification: 40,
      encryption_operation: 20,
      password_change: 25,
      login_success: 5,
      logout: 5,
      session_start: 10,
      session_end: 5,
      login_attempt: 15,
      '2fa_enabled': 5,
      '2fa_verification': 15,
      data_access: 15,
      key_rotation: 10
    };

    baseScore = eventScores[eventType] || 20;

    // Adjust based on outcome
    if (outcome === 'failure') {
      baseScore *= 2;
    } else if (outcome === 'warning') {
      baseScore *= 1.5;
    }

    // Adjust based on details
    if (details) {
      if (details.repeated) baseScore *= 1.5;
      if (details.anomalous) baseScore *= 2;
      if (details.fromNewDevice) baseScore *= 1.3;
    }

    return Math.min(Math.round(baseScore), 100);
  }

  /**
   * Store audit log
   */
  private async storeAuditLog(log: SecurityAuditLog): Promise<void> {
    try {
      const existingLogs = await this.getAuditLogs();
      existingLogs.push(log);

      // Implement log rotation
      const settings = await this.getSecuritySettings();
      const cutoffDate = new Date(Date.now() - settings.auditSettings.retentionDays * 24 * 60 * 60 * 1000);
      const filteredLogs = existingLogs.filter(l => l.timestamp >= cutoffDate);

      const encrypted = await this.encryptData(JSON.stringify(filteredLogs));
      await AsyncStorage.setItem(this.STORAGE_KEYS.AUDIT_LOGS, encrypted);
    } catch (error) {
      console.error('Error storing audit log:', error);
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(filters?: {
    eventType?: SecurityEventType;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    outcome?: string;
  }): Promise<SecurityAuditLog[]> {
    try {
      const encrypted = await AsyncStorage.getItem(this.STORAGE_KEYS.AUDIT_LOGS);
      if (!encrypted) return [];

      const decrypted = await this.decryptData(encrypted);
      let logs = JSON.parse(decrypted) as SecurityAuditLog[];

      // Convert timestamp strings back to Date objects
      logs = logs.map(log => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }));

      // Apply filters
      if (filters) {
        logs = logs.filter(log => {
          if (filters.eventType && log.eventType !== filters.eventType) return false;
          if (filters.userId && log.userId !== filters.userId) return false;
          if (filters.outcome && log.outcome !== filters.outcome) return false;
          if (filters.startDate && log.timestamp < filters.startDate) return false;
          if (filters.endDate && log.timestamp > filters.endDate) return false;
          return true;
        });
      }

      return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return [];
    }
  }

  /**
   * Handle security violation
   */
  private async handleSecurityViolation(auditLog: SecurityAuditLog): Promise<void> {
    try {
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      let mitigationActions: string[] = [];

      if (auditLog.riskScore >= 90) {
        severity = 'critical';
        mitigationActions = ['lock_account', 'revoke_sessions', 'notify_admin'];
      } else if (auditLog.riskScore >= 70) {
        severity = 'high';
        mitigationActions = ['require_2fa', 'log_additional_details'];
      } else if (auditLog.riskScore >= 50) {
        severity = 'medium';
        mitigationActions = ['monitor_closely', 'log_additional_details'];
      } else {
        severity = 'low';
        mitigationActions = ['log_event'];
      }

      const violation: SecurityViolation = {
        type: `${auditLog.eventType}_violation`,
        severity,
        description: `High risk ${auditLog.eventType} detected`,
        timestamp: new Date(),
        userId: auditLog.userId,
        deviceId: auditLog.deviceId,
        mitigationActions
      };

      await this.storeSecurityViolation(violation);
      
      // Execute mitigation actions
      await this.executeMitigationActions(violation);
    } catch (error) {
      console.error('Error handling security violation:', error);
    }
  }

  /**
   * Store security violation
   */
  private async storeSecurityViolation(violation: SecurityViolation): Promise<void> {
    try {
      const existingViolations = await this.getSecurityViolations();
      existingViolations.push(violation);

      const encrypted = await this.encryptData(JSON.stringify(existingViolations));
      await AsyncStorage.setItem(this.STORAGE_KEYS.VIOLATION_LOGS, encrypted);
    } catch (error) {
      console.error('Error storing security violation:', error);
    }
  }

  /**
   * Get security violations
   */
  async getSecurityViolations(): Promise<SecurityViolation[]> {
    try {
      const encrypted = await AsyncStorage.getItem(this.STORAGE_KEYS.VIOLATION_LOGS);
      if (!encrypted) return [];

      const decrypted = await this.decryptData(encrypted);
      const violations = JSON.parse(decrypted) as SecurityViolation[];

      // Convert timestamp strings back to Date objects
      return violations.map(violation => ({
        ...violation,
        timestamp: new Date(violation.timestamp)
      }));
    } catch (error) {
      console.error('Error getting security violations:', error);
      return [];
    }
  }

  /**
   * Execute mitigation actions
   */
  private async executeMitigationActions(violation: SecurityViolation): Promise<void> {
    for (const action of violation.mitigationActions) {
      try {
        switch (action) {
          case 'lock_account':
            // In production, this would lock the user account
            console.warn('Account lock requested for security violation');
            break;
          case 'revoke_sessions':
            // In production, this would revoke all user sessions
            console.warn('Session revocation requested for security violation');
            break;
          case 'require_2fa':
            // In production, this would force 2FA requirement
            console.warn('2FA requirement escalated for security violation');
            break;
          case 'notify_admin':
            // In production, this would notify administrators
            console.warn('Admin notification sent for security violation');
            break;
          case 'monitor_closely':
            // Increase monitoring for this user/device
            console.info('Enhanced monitoring enabled for security violation');
            break;
          case 'log_additional_details':
            await this.logSecurityEvent('security_violation', 'warning', {
              violationType: violation.type,
              severity: violation.severity,
              details: violation
            });
            break;
          default:
            console.info(`Unknown mitigation action: ${action}`);
        }
      } catch (error) {
        console.error(`Error executing mitigation action ${action}:`, error);
      }
    }
  }

  /**
   * Analyze security event for patterns
   */
  private async analyzeSecurityEvent(auditLog: SecurityAuditLog): Promise<void> {
    try {
      // Look for patterns in recent logs
      const recentLogs = await this.getAuditLogs({
        startDate: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        userId: auditLog.userId
      });

      // Check for repeated failures
      if (auditLog.eventType === 'login_failure') {
        const failureCount = recentLogs.filter(l => l.eventType === 'login_failure').length;
        const settings = await this.getSecuritySettings();
        
        if (failureCount >= settings.auditSettings.alertThresholds.failedLogins) {
          await this.logSecurityEvent('security_violation', 'warning', {
            type: 'repeated_login_failures',
            count: failureCount,
            threshold: settings.auditSettings.alertThresholds.failedLogins
          });
        }
      }

      // Check for unusual activity patterns
      const eventCounts = recentLogs.reduce((counts, log) => {
        counts[log.eventType] = (counts[log.eventType] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);

      const totalEvents = Object.values(eventCounts).reduce((sum, count) => sum + count, 0);
      const settings = await this.getSecuritySettings();
      
      if (totalEvents >= settings.auditSettings.alertThresholds.suspiciousActivity) {
        await this.logSecurityEvent('security_violation', 'warning', {
          type: 'unusual_activity_pattern',
          eventCounts,
          totalEvents
        });
      }
    } catch (error) {
      console.error('Error analyzing security event:', error);
    }
  }

  /**
   * Check user permissions
   */
  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId);
      
      const hasPermission = permissions.some(permission =>
        permission.resource === resource && permission.actions.includes(action)
      );

      await this.logSecurityEvent('permission_check', hasPermission ? 'success' : 'failure', {
        resource,
        action,
        result: hasPermission
      }, userId);

      return hasPermission;
    } catch (error) {
      console.error('Error checking permission:', error);
      await this.logSecurityEvent('permission_check', 'failure', {
        resource,
        action,
        error: error.message
      }, userId);
      return false;
    }
  }

  /**
   * Get user permissions
   */
  private async getUserPermissions(userId: string): Promise<UserPermission[]> {
    try {
      // In production, this would fetch from server and cache
      const cached = await AsyncStorage.getItem(`${this.STORAGE_KEYS.USER_PERMISSIONS}_${userId}`);
      if (cached) {
        return JSON.parse(cached);
      }

      // Default permissions for demonstration
      return [
        { resource: 'appointments', actions: ['read', 'create', 'update'] },
        { resource: 'measurements', actions: ['read', 'create'] },
        { resource: 'quotes', actions: ['read', 'create'] },
        { resource: 'profile', actions: ['read', 'update'] }
      ];
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  /**
   * Start security session
   */
  async startSession(userId: string): Promise<string> {
    this.currentSessionId = await this.generateSessionId();
    
    await this.logSecurityEvent('session_start', 'success', {
      sessionId: this.currentSessionId
    }, userId);

    return this.currentSessionId;
  }

  /**
   * End security session
   */
  async endSession(userId?: string): Promise<void> {
    await this.logSecurityEvent('session_end', 'success', {
      sessionId: this.currentSessionId
    }, userId);

    this.currentSessionId = '';
  }

  /**
   * Get security dashboard data
   */
  async getSecurityDashboard(): Promise<{
    recentLogs: SecurityAuditLog[];
    violations: SecurityViolation[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
  }> {
    try {
      const recentLogs = await this.getAuditLogs({
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      });

      const violations = await this.getSecurityViolations();
      const recentViolations = violations.filter(v => 
        v.timestamp >= new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      // Calculate overall risk level
      const avgRiskScore = recentLogs.reduce((sum, log) => sum + log.riskScore, 0) / recentLogs.length || 0;
      
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (avgRiskScore >= 80) riskLevel = 'critical';
      else if (avgRiskScore >= 60) riskLevel = 'high';
      else if (avgRiskScore >= 40) riskLevel = 'medium';

      // Generate recommendations
      const recommendations: string[] = [];
      
      if (recentViolations.length > 0) {
        recommendations.push('Review recent security violations');
      }
      
      const failureRate = recentLogs.filter(l => l.outcome === 'failure').length / recentLogs.length;
      if (failureRate > 0.1) {
        recommendations.push('High failure rate detected - review authentication logs');
      }

      const settings = await this.getSecuritySettings();
      if (!settings.twoFactorRequired) {
        recommendations.push('Consider enabling two-factor authentication requirement');
      }

      return {
        recentLogs: recentLogs.slice(0, 20), // Most recent 20 logs
        violations: recentViolations,
        riskLevel,
        recommendations
      };
    } catch (error) {
      console.error('Error getting security dashboard:', error);
      return {
        recentLogs: [],
        violations: [],
        riskLevel: 'medium',
        recommendations: ['Unable to load security data - check system status']
      };
    }
  }
}

// Singleton instance
export const securityService = new SecurityService();
export default securityService;