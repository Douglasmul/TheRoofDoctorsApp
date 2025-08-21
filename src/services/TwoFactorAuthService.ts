/**
 * @fileoverview Two-Factor Authentication Service with multiple methods
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 2FA method types
export type TwoFactorMethod = 'sms' | 'email' | 'totp' | 'backup_codes';

// 2FA status
export type TwoFactorStatus = 'disabled' | 'enabled' | 'pending_setup' | 'pending_verification';

// 2FA verification request
export interface TwoFactorVerificationRequest {
  method: TwoFactorMethod;
  code: string;
  userId: string;
  deviceId?: string;
  trustDevice?: boolean;
}

// 2FA setup request
export interface TwoFactorSetupRequest {
  method: TwoFactorMethod;
  phoneNumber?: string; // For SMS
  email?: string; // For email
  secretKey?: string; // For TOTP apps
}

// 2FA setup response
export interface TwoFactorSetupResponse {
  method: TwoFactorMethod;
  secretKey?: string; // For TOTP setup
  qrCode?: string; // Base64 QR code for TOTP apps
  backupCodes?: string[]; // Recovery codes
  setupToken: string; // Token to verify setup
}

// 2FA settings
export interface TwoFactorSettings {
  isEnabled: boolean;
  primaryMethod: TwoFactorMethod | null;
  enabledMethods: TwoFactorMethod[];
  backupCodesRemaining: number;
  trustedDevices: TrustedDevice[];
  lastUsed?: Date;
}

// Trusted device
export interface TrustedDevice {
  id: string;
  name: string;
  deviceType: string;
  addedAt: Date;
  lastUsedAt: Date;
  isCurrentDevice: boolean;
}

// TOTP configuration
interface TOTPConfig {
  issuer: string;
  algorithm: string;
  digits: number;
  period: number;
}

/**
 * Two-Factor Authentication Service
 * Handles setup, verification, and management of 2FA methods
 */
class TwoFactorAuthService {
  private baseURL = process.env.EXPO_PUBLIC_API_URL || 'https://api.theroofDoctors.com';
  private readonly STORAGE_KEYS = {
    TOTP_SECRET: 'totp_secret',
    BACKUP_CODES: 'backup_codes',
    TRUSTED_DEVICES: 'trusted_devices',
    TWO_FACTOR_SETTINGS: '2fa_settings',
    DEVICE_ID: 'device_id'
  };

  // TOTP configuration
  private totpConfig: TOTPConfig = {
    issuer: 'TheRoofDoctors',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  };

  constructor() {
    this.initializeDeviceId();
  }

  /**
   * Initialize unique device ID
   */
  private async initializeDeviceId(): Promise<string> {
    try {
      let deviceId = await SecureStore.getItemAsync(this.STORAGE_KEYS.DEVICE_ID);
      if (!deviceId) {
        deviceId = await this.generateDeviceId();
        await SecureStore.setItemAsync(this.STORAGE_KEYS.DEVICE_ID, deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('Error initializing device ID:', error);
      return 'unknown_device';
    }
  }

  /**
   * Generate unique device ID
   */
  private async generateDeviceId(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return Array.from(randomBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const authToken = await SecureStore.getItemAsync('auth_token');
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken ? `Bearer ${authToken}` : '',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`2FA API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generate TOTP secret key
   */
  private async generateTOTPSecret(): Promise<string> {
    // Generate a 32-character base32 secret
    const randomBytes = await Crypto.getRandomBytesAsync(20);
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    
    for (let i = 0; i < randomBytes.length; i++) {
      secret += base32Chars[randomBytes[i] % 32];
    }
    
    return secret;
  }

  /**
   * Generate TOTP QR code URL
   */
  private generateTOTPQRCode(secret: string, userEmail: string): string {
    const label = encodeURIComponent(`${this.totpConfig.issuer}:${userEmail}`);
    const issuer = encodeURIComponent(this.totpConfig.issuer);
    
    return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=${this.totpConfig.algorithm}&digits=${this.totpConfig.digits}&period=${this.totpConfig.period}`;
  }

  /**
   * Generate TOTP code for current time
   */
  private async generateTOTPCode(secret: string, timeWindow?: number): Promise<string> {
    const time = Math.floor((timeWindow || Date.now()) / 1000 / this.totpConfig.period);
    
    // Convert time to bytes
    const timeBytes = new Uint8Array(8);
    for (let i = 7; i >= 0; i--) {
      timeBytes[i] = time & 0xff;
      time >> 8;
    }

    // This is a simplified implementation
    // In production, use a proper TOTP library like 'otplib'
    const hash = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA1, timeBytes.buffer);
    const hashArray = new Uint8Array(hash);
    
    const offset = hashArray[hashArray.length - 1] & 0xf;
    const code = (
      ((hashArray[offset] & 0x7f) << 24) |
      ((hashArray[offset + 1] & 0xff) << 16) |
      ((hashArray[offset + 2] & 0xff) << 8) |
      (hashArray[offset + 3] & 0xff)
    ) % Math.pow(10, this.totpConfig.digits);

    return code.toString().padStart(this.totpConfig.digits, '0');
  }

  /**
   * Verify TOTP code
   */
  private async verifyTOTPCode(secret: string, inputCode: string): Promise<boolean> {
    const now = Date.now();
    
    // Check current time window and adjacent windows (±30 seconds)
    for (let window = -1; window <= 1; window++) {
      const timeWindow = now + (window * this.totpConfig.period * 1000);
      const expectedCode = await this.generateTOTPCode(secret, timeWindow);
      
      if (expectedCode === inputCode) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Generate backup codes
   */
  private async generateBackupCodes(count: number = 10): Promise<string[]> {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const randomBytes = await Crypto.getRandomBytesAsync(4);
      const code = Array.from(randomBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Encrypt and store sensitive data
   */
  private async encryptAndStore(key: string, data: any): Promise<void> {
    try {
      const jsonData = JSON.stringify(data);
      // In production, implement proper encryption
      const encrypted = btoa(jsonData);
      await SecureStore.setItemAsync(key, encrypted);
    } catch (error) {
      console.error('Error encrypting and storing data:', error);
      throw new Error('Failed to store encrypted data');
    }
  }

  /**
   * Decrypt and retrieve data
   */
  private async decryptAndRetrieve(key: string): Promise<any> {
    try {
      const encrypted = await SecureStore.getItemAsync(key);
      if (!encrypted) return null;
      
      // In production, implement proper decryption
      const decrypted = atob(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error decrypting data:', error);
      return null;
    }
  }

  // PUBLIC API METHODS

  /**
   * Get current 2FA settings
   */
  async getTwoFactorSettings(): Promise<TwoFactorSettings> {
    try {
      // Try to get from server first
      const settings = await this.apiRequest('/auth/2fa/settings');
      
      // Cache locally
      await AsyncStorage.setItem(this.STORAGE_KEYS.TWO_FACTOR_SETTINGS, JSON.stringify(settings));
      
      return settings;
    } catch (error) {
      console.error('Error fetching 2FA settings:', error);
      
      // Fallback to cached settings
      try {
        const cached = await AsyncStorage.getItem(this.STORAGE_KEYS.TWO_FACTOR_SETTINGS);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        console.error('Error reading cached 2FA settings:', cacheError);
      }
      
      // Return default settings
      return {
        isEnabled: false,
        primaryMethod: null,
        enabledMethods: [],
        backupCodesRemaining: 0,
        trustedDevices: []
      };
    }
  }

  /**
   * Setup 2FA method
   */
  async setupTwoFactor(request: TwoFactorSetupRequest): Promise<TwoFactorSetupResponse> {
    try {
      switch (request.method) {
        case 'totp':
          return await this.setupTOTP();
        case 'sms':
          return await this.setupSMS(request.phoneNumber!);
        case 'email':
          return await this.setupEmail(request.email!);
        default:
          throw new Error(`Unsupported 2FA method: ${request.method}`);
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      throw error;
    }
  }

  /**
   * Setup TOTP (Time-based One-Time Password)
   */
  private async setupTOTP(): Promise<TwoFactorSetupResponse> {
    try {
      const secret = await this.generateTOTPSecret();
      const userEmail = 'user@example.com'; // Get from auth context
      const qrCodeUrl = this.generateTOTPQRCode(secret, userEmail);
      
      // Generate setup token
      const setupToken = await this.generateDeviceId();
      
      // Store temporarily (will be permanent after verification)
      await this.encryptAndStore('temp_totp_secret', { secret, setupToken });
      
      return {
        method: 'totp',
        secretKey: secret,
        qrCode: qrCodeUrl,
        setupToken
      };
    } catch (error) {
      console.error('Error setting up TOTP:', error);
      throw new Error('Failed to setup TOTP');
    }
  }

  /**
   * Setup SMS 2FA
   */
  private async setupSMS(phoneNumber: string): Promise<TwoFactorSetupResponse> {
    try {
      const response = await this.apiRequest('/auth/2fa/setup/sms', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber })
      });
      
      return {
        method: 'sms',
        setupToken: response.setupToken
      };
    } catch (error) {
      console.error('Error setting up SMS 2FA:', error);
      throw new Error('Failed to setup SMS 2FA');
    }
  }

  /**
   * Setup Email 2FA
   */
  private async setupEmail(email: string): Promise<TwoFactorSetupResponse> {
    try {
      const response = await this.apiRequest('/auth/2fa/setup/email', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      
      return {
        method: 'email',
        setupToken: response.setupToken
      };
    } catch (error) {
      console.error('Error setting up Email 2FA:', error);
      throw new Error('Failed to setup Email 2FA');
    }
  }

  /**
   * Verify and complete 2FA setup
   */
  async verifySetup(method: TwoFactorMethod, code: string, setupToken: string): Promise<TwoFactorSettings> {
    try {
      if (method === 'totp') {
        return await this.verifyTOTPSetup(code, setupToken);
      } else {
        // For SMS/Email, verify with server
        const response = await this.apiRequest('/auth/2fa/verify-setup', {
          method: 'POST',
          body: JSON.stringify({ method, code, setupToken })
        });
        
        return response.settings;
      }
    } catch (error) {
      console.error('Error verifying 2FA setup:', error);
      throw new Error('Failed to verify 2FA setup');
    }
  }

  /**
   * Verify TOTP setup
   */
  private async verifyTOTPSetup(code: string, setupToken: string): Promise<TwoFactorSettings> {
    try {
      const tempData = await this.decryptAndRetrieve('temp_totp_secret');
      
      if (!tempData || tempData.setupToken !== setupToken) {
        throw new Error('Invalid setup token');
      }
      
      const isValid = await this.verifyTOTPCode(tempData.secret, code);
      
      if (!isValid) {
        throw new Error('Invalid verification code');
      }
      
      // Setup is valid, make it permanent
      await this.encryptAndStore(this.STORAGE_KEYS.TOTP_SECRET, tempData.secret);
      
      // Generate and store backup codes
      const backupCodes = await this.generateBackupCodes();
      await this.encryptAndStore(this.STORAGE_KEYS.BACKUP_CODES, backupCodes);
      
      // Update settings
      const settings: TwoFactorSettings = {
        isEnabled: true,
        primaryMethod: 'totp',
        enabledMethods: ['totp'],
        backupCodesRemaining: backupCodes.length,
        trustedDevices: []
      };
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.TWO_FACTOR_SETTINGS, JSON.stringify(settings));
      
      // Clean up temporary data
      await SecureStore.deleteItemAsync('temp_totp_secret');
      
      return settings;
    } catch (error) {
      console.error('Error verifying TOTP setup:', error);
      throw error;
    }
  }

  /**
   * Verify 2FA code during authentication
   */
  async verifyTwoFactor(request: TwoFactorVerificationRequest): Promise<{ success: boolean; trustToken?: string }> {
    try {
      if (request.method === 'totp') {
        return await this.verifyTOTPAuth(request);
      } else if (request.method === 'backup_codes') {
        return await this.verifyBackupCode(request);
      } else {
        // For SMS/Email, verify with server
        const response = await this.apiRequest('/auth/2fa/verify', {
          method: 'POST',
          body: JSON.stringify(request)
        });
        
        return response;
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      throw new Error('2FA verification failed');
    }
  }

  /**
   * Verify TOTP during authentication
   */
  private async verifyTOTPAuth(request: TwoFactorVerificationRequest): Promise<{ success: boolean; trustToken?: string }> {
    try {
      const secret = await this.decryptAndRetrieve(this.STORAGE_KEYS.TOTP_SECRET);
      
      if (!secret) {
        throw new Error('TOTP not set up');
      }
      
      const isValid = await this.verifyTOTPCode(secret, request.code);
      
      if (!isValid) {
        return { success: false };
      }
      
      let trustToken;
      if (request.trustDevice) {
        trustToken = await this.addTrustedDevice();
      }
      
      return { success: true, trustToken };
    } catch (error) {
      console.error('Error verifying TOTP auth:', error);
      return { success: false };
    }
  }

  /**
   * Verify backup code
   */
  private async verifyBackupCode(request: TwoFactorVerificationRequest): Promise<{ success: boolean; trustToken?: string }> {
    try {
      const backupCodes = await this.decryptAndRetrieve(this.STORAGE_KEYS.BACKUP_CODES);
      
      if (!backupCodes || !Array.isArray(backupCodes)) {
        throw new Error('No backup codes available');
      }
      
      const codeIndex = backupCodes.indexOf(request.code.toUpperCase());
      
      if (codeIndex === -1) {
        return { success: false };
      }
      
      // Remove used backup code
      backupCodes.splice(codeIndex, 1);
      await this.encryptAndStore(this.STORAGE_KEYS.BACKUP_CODES, backupCodes);
      
      // Update settings
      const settings = await this.getTwoFactorSettings();
      settings.backupCodesRemaining = backupCodes.length;
      await AsyncStorage.setItem(this.STORAGE_KEYS.TWO_FACTOR_SETTINGS, JSON.stringify(settings));
      
      let trustToken;
      if (request.trustDevice) {
        trustToken = await this.addTrustedDevice();
      }
      
      return { success: true, trustToken };
    } catch (error) {
      console.error('Error verifying backup code:', error);
      return { success: false };
    }
  }

  /**
   * Add current device as trusted
   */
  private async addTrustedDevice(): Promise<string> {
    try {
      const deviceId = await this.initializeDeviceId();
      const trustToken = await this.generateDeviceId();
      
      const trustedDevice: TrustedDevice = {
        id: deviceId,
        name: `Device ${deviceId.substring(0, 8)}`,
        deviceType: 'mobile', // Could be detected from Platform.OS
        addedAt: new Date(),
        lastUsedAt: new Date(),
        isCurrentDevice: true
      };
      
      const trustedDevices = await this.decryptAndRetrieve(this.STORAGE_KEYS.TRUSTED_DEVICES) || [];
      trustedDevices.push(trustedDevice);
      
      await this.encryptAndStore(this.STORAGE_KEYS.TRUSTED_DEVICES, trustedDevices);
      
      return trustToken;
    } catch (error) {
      console.error('Error adding trusted device:', error);
      throw new Error('Failed to add trusted device');
    }
  }

  /**
   * Check if current device is trusted
   */
  async isDeviceTrusted(): Promise<boolean> {
    try {
      const deviceId = await this.initializeDeviceId();
      const trustedDevices = await this.decryptAndRetrieve(this.STORAGE_KEYS.TRUSTED_DEVICES) || [];
      
      return trustedDevices.some((device: TrustedDevice) => device.id === deviceId);
    } catch (error) {
      console.error('Error checking device trust:', error);
      return false;
    }
  }

  /**
   * Disable 2FA
   */
  async disableTwoFactor(verificationCode: string): Promise<void> {
    try {
      // Verify current 2FA before disabling
      const verification = await this.verifyTwoFactor({
        method: 'totp', // Use primary method
        code: verificationCode,
        userId: 'current_user' // Get from auth context
      });
      
      if (!verification.success) {
        throw new Error('Invalid verification code');
      }
      
      // Clear all 2FA data
      await Promise.all([
        SecureStore.deleteItemAsync(this.STORAGE_KEYS.TOTP_SECRET),
        SecureStore.deleteItemAsync(this.STORAGE_KEYS.BACKUP_CODES),
        SecureStore.deleteItemAsync(this.STORAGE_KEYS.TRUSTED_DEVICES),
        AsyncStorage.removeItem(this.STORAGE_KEYS.TWO_FACTOR_SETTINGS)
      ]);
      
      // Notify server
      await this.apiRequest('/auth/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ verificationCode })
      });
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      throw new Error('Failed to disable 2FA');
    }
  }

  /**
   * Get new backup codes
   */
  async regenerateBackupCodes(verificationCode: string): Promise<string[]> {
    try {
      // Verify current 2FA before regenerating
      const verification = await this.verifyTwoFactor({
        method: 'totp',
        code: verificationCode,
        userId: 'current_user'
      });
      
      if (!verification.success) {
        throw new Error('Invalid verification code');
      }
      
      const newBackupCodes = await this.generateBackupCodes();
      await this.encryptAndStore(this.STORAGE_KEYS.BACKUP_CODES, newBackupCodes);
      
      // Update settings
      const settings = await this.getTwoFactorSettings();
      settings.backupCodesRemaining = newBackupCodes.length;
      await AsyncStorage.setItem(this.STORAGE_KEYS.TWO_FACTOR_SETTINGS, JSON.stringify(settings));
      
      return newBackupCodes;
    } catch (error) {
      console.error('Error regenerating backup codes:', error);
      throw new Error('Failed to regenerate backup codes');
    }
  }

  /**
   * Remove trusted device
   */
  async removeTrustedDevice(deviceId: string): Promise<void> {
    try {
      const trustedDevices = await this.decryptAndRetrieve(this.STORAGE_KEYS.TRUSTED_DEVICES) || [];
      const updatedDevices = trustedDevices.filter((device: TrustedDevice) => device.id !== deviceId);
      
      await this.encryptAndStore(this.STORAGE_KEYS.TRUSTED_DEVICES, updatedDevices);
    } catch (error) {
      console.error('Error removing trusted device:', error);
      throw new Error('Failed to remove trusted device');
    }
  }
}

// Singleton instance
export const twoFactorAuthService = new TwoFactorAuthService();
export default twoFactorAuthService;