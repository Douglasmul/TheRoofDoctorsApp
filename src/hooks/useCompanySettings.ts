/**
 * @fileoverview React hook for company settings
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  CompanySettings, 
  CompanySettingsState, 
  companySettingsService 
} from '../services/CompanySettingsService';

/**
 * Hook for managing company settings
 */
export function useCompanySettings(): CompanySettingsState & {
  updateSettings: (updates: Partial<CompanySettings>) => Promise<boolean>;
  resetSettings: () => Promise<boolean>;
  hasCustomName: () => boolean;
  hasCustomLogo: () => boolean;
  getEffectiveName: (defaultName: string) => string;
  getEffectiveLogoUri: () => string | null;
} {
  const [settings, setSettings] = useState<CompanySettings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Load initial settings
  useEffect(() => {
    const initializeSettings = async () => {
      setIsLoading(true);
      try {
        await companySettingsService.initialize();
        setSettings(companySettingsService.getSettings());
      } catch (error) {
        console.error('Failed to initialize company settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSettings();
  }, []);

  // Subscribe to settings changes
  useEffect(() => {
    const unsubscribe = companySettingsService.subscribe(() => {
      setSettings(companySettingsService.getSettings());
      setHasChanges(false);
    });

    return unsubscribe;
  }, []);

  const updateSettings = useCallback(async (updates: Partial<CompanySettings>) => {
    setHasChanges(true);
    const success = await companySettingsService.updateSettings(updates);
    if (success) {
      setHasChanges(false);
    }
    return success;
  }, []);

  const resetSettings = useCallback(async () => {
    setHasChanges(true);
    const success = await companySettingsService.resetSettings();
    if (success) {
      setHasChanges(false);
    }
    return success;
  }, []);

  const hasCustomName = useCallback(() => {
    return companySettingsService.hasCustomName();
  }, [settings]);

  const hasCustomLogo = useCallback(() => {
    return companySettingsService.hasCustomLogo();
  }, [settings]);

  const getEffectiveName = useCallback((defaultName: string) => {
    return companySettingsService.getEffectiveName(defaultName);
  }, [settings]);

  const getEffectiveLogoUri = useCallback(() => {
    return companySettingsService.getEffectiveLogoUri();
  }, [settings]);

  return {
    settings,
    isLoading,
    hasChanges,
    updateSettings,
    resetSettings,
    hasCustomName,
    hasCustomLogo,
    getEffectiveName,
    getEffectiveLogoUri,
  };
}