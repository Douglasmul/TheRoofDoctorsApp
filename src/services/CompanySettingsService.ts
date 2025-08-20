/**
 * @fileoverview Company Settings Service
 * Handles persistence and management of customizable company information
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CompanySettings {
  /** Custom company name */
  name?: string;
  
  /** Custom company logo URI */
  logoUri?: string;
  
  /** Logo source type */
  logoSource?: 'gallery' | 'camera' | 'default';
  
  /** When settings were last updated */
  updatedAt?: Date;
}

export interface CompanySettingsState {
  settings: CompanySettings;
  isLoading: boolean;
  hasChanges: boolean;
}

/**
 * Company Settings Service Class
 */
export class CompanySettingsService {
  private static readonly STORAGE_KEY = 'company_settings';
  private static instance: CompanySettingsService | null = null;
  
  private settings: CompanySettings = {};
  private listeners: Array<() => void> = [];

  /**
   * Singleton instance access
   */
  static getInstance(): CompanySettingsService {
    if (!CompanySettingsService.instance) {
      CompanySettingsService.instance = new CompanySettingsService();
    }
    return CompanySettingsService.instance;
  }

  /**
   * Initialize the service and load saved settings
   */
  async initialize(): Promise<void> {
    await this.loadSettings();
  }

  /**
   * Get current company settings
   */
  getSettings(): CompanySettings {
    return { ...this.settings };
  }

  /**
   * Update company settings
   */
  async updateSettings(updates: Partial<CompanySettings>): Promise<boolean> {
    try {
      this.settings = {
        ...this.settings,
        ...updates,
        updatedAt: new Date(),
      };

      await this.saveSettings();
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to update company settings:', error);
      return false;
    }
  }

  /**
   * Reset to default settings
   */
  async resetSettings(): Promise<boolean> {
    try {
      this.settings = {};
      await this.saveSettings();
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to reset company settings:', error);
      return false;
    }
  }

  /**
   * Subscribe to settings changes
   */
  subscribe(listener: () => void): () => void {
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
   * Check if custom company name is set
   */
  hasCustomName(): boolean {
    return !!(this.settings.name && this.settings.name.trim());
  }

  /**
   * Check if custom logo is set
   */
  hasCustomLogo(): boolean {
    return !!(this.settings.logoUri && this.settings.logoUri.trim());
  }

  /**
   * Get effective company name (custom or default)
   */
  getEffectiveName(defaultName: string): string {
    return this.hasCustomName() ? this.settings.name! : defaultName;
  }

  /**
   * Get effective logo URI (custom or null for default)
   */
  getEffectiveLogoUri(): string | null {
    return this.hasCustomLogo() ? this.settings.logoUri! : null;
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(CompanySettingsService.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Convert updatedAt back to Date object
        if (parsed.updatedAt) {
          parsed.updatedAt = new Date(parsed.updatedAt);
        }
        this.settings = parsed;
      }
    } catch (error) {
      console.warn('Failed to load company settings:', error);
      this.settings = {};
    }
  }

  /**
   * Save settings to storage
   */
  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        CompanySettingsService.STORAGE_KEY,
        JSON.stringify(this.settings)
      );
    } catch (error) {
      console.error('Failed to save company settings:', error);
      throw error;
    }
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in company settings listener:', error);
      }
    });
  }
}

/**
 * Default service instance
 */
export const companySettingsService = CompanySettingsService.getInstance();