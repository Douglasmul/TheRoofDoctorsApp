/**
 * @fileoverview Company Branding Service
 * Manages custom company branding settings including name and logo
 * @version 1.0.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { COMPANY_INFO } from '../constants/company';

export interface CompanyBrandingSettings {
  /** Custom company name */
  customName?: string;
  /** Custom logo URI */
  customLogoUri?: string;
  /** When the settings were last updated */
  updatedAt?: Date;
}

export interface CompanyInfo {
  /** Company name (custom or default) */
  name: string;
  /** Logo URI (custom or default) */
  logoUri?: string;
  /** Whether custom branding is active */
  hasCustomBranding: boolean;
  /** Copyright notice */
  copyright: string;
  /** All other company info */
  [key: string]: any;
}

export class CompanyBrandingService {
  private static readonly STORAGE_KEY = '@company_branding_settings';
  private static instance: CompanyBrandingService;
  
  private settings: CompanyBrandingSettings = {};
  private listeners: Array<(settings: CompanyBrandingSettings) => void> = [];

  /**
   * Get singleton instance
   */
  static getInstance(): CompanyBrandingService {
    if (!CompanyBrandingService.instance) {
      CompanyBrandingService.instance = new CompanyBrandingService();
    }
    return CompanyBrandingService.instance;
  }

  /**
   * Initialize the service by loading saved settings
   */
  async initialize(): Promise<void> {
    try {
      await this.loadSettings();
    } catch (error) {
      console.warn('Failed to initialize CompanyBrandingService:', error);
    }
  }

  /**
   * Get current branding settings
   */
  getSettings(): CompanyBrandingSettings {
    return { ...this.settings };
  }

  /**
   * Get merged company info (custom + default)
   */
  getCompanyInfo(): CompanyInfo {
    const hasCustomName = Boolean(this.settings.customName?.trim());
    const hasCustomLogo = Boolean(this.settings.customLogoUri?.trim());
    const hasCustomBranding = hasCustomName || hasCustomLogo;

    const companyName = this.settings.customName?.trim() || COMPANY_INFO.name;
    
    return {
      ...COMPANY_INFO,
      name: companyName,
      logoUri: this.settings.customLogoUri || undefined,
      hasCustomBranding,
      copyright: `© ${new Date().getFullYear()} ${companyName}`,
    };
  }

  /**
   * Update company name
   */
  async updateCompanyName(name: string): Promise<void> {
    const trimmedName = name.trim();
    this.settings = {
      ...this.settings,
      customName: trimmedName || undefined,
      updatedAt: new Date(),
    };
    
    await this.saveSettings();
    this.notifyListeners();
  }

  /**
   * Update company logo
   */
  async updateCompanyLogo(logoUri: string): Promise<void> {
    const trimmedUri = logoUri.trim();
    this.settings = {
      ...this.settings,
      customLogoUri: trimmedUri || undefined,
      updatedAt: new Date(),
    };
    
    await this.saveSettings();
    this.notifyListeners();
  }

  /**
   * Clear all custom branding
   */
  async clearBranding(): Promise<void> {
    this.settings = {
      updatedAt: new Date(),
    };
    
    await this.saveSettings();
    this.notifyListeners();
  }

  /**
   * Add listener for settings changes
   */
  addListener(listener: (settings: CompanyBrandingSettings) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Load settings from AsyncStorage
   */
  private async loadSettings(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(CompanyBrandingService.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.settings = {
          ...parsed,
          updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : undefined,
        };
      }
    } catch (error) {
      console.warn('Failed to load company branding settings:', error);
      this.settings = {};
    }
  }

  /**
   * Save settings to AsyncStorage
   */
  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        CompanyBrandingService.STORAGE_KEY,
        JSON.stringify(this.settings)
      );
    } catch (error) {
      console.warn('Failed to save company branding settings:', error);
    }
  }

  /**
   * Notify all listeners of settings changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getSettings());
      } catch (error) {
        console.warn('Error in branding listener:', error);
      }
    });
  }
}

// Export singleton instance
export const companyBrandingService = CompanyBrandingService.getInstance();