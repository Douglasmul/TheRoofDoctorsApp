/**
 * @fileoverview Company Branding Hook
 * React hook for accessing and managing company branding settings
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { 
  companyBrandingService, 
  CompanyBrandingSettings, 
  CompanyInfo 
} from '../services/CompanyBrandingService';

export interface UseCompanyBrandingReturn {
  /** Current company info (merged custom + default) */
  companyInfo: CompanyInfo;
  /** Current branding settings */
  settings: CompanyBrandingSettings;
  /** Whether custom branding is active */
  hasCustomBranding: boolean;
  /** Update company name */
  updateCompanyName: (name: string) => Promise<void>;
  /** Update company logo */
  updateCompanyLogo: (logoUri: string) => Promise<void>;
  /** Clear all custom branding */
  clearBranding: () => Promise<void>;
  /** Loading state */
  isLoading: boolean;
}

/**
 * Hook for managing company branding
 */
export function useCompanyBranding(): UseCompanyBrandingReturn {
  const [settings, setSettings] = useState<CompanyBrandingSettings>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize service and load settings
    const initializeService = async () => {
      try {
        await companyBrandingService.initialize();
        setSettings(companyBrandingService.getSettings());
      } catch (error) {
        console.warn('Failed to initialize company branding:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();

    // Subscribe to settings changes
    const unsubscribe = companyBrandingService.addListener((newSettings) => {
      setSettings(newSettings);
    });

    return unsubscribe;
  }, []);

  const companyInfo = useMemo(() => companyBrandingService.getCompanyInfo(), [settings]);

  const updateCompanyName = async (name: string): Promise<void> => {
    await companyBrandingService.updateCompanyName(name);
  };

  const updateCompanyLogo = async (logoUri: string): Promise<void> => {
    await companyBrandingService.updateCompanyLogo(logoUri);
  };

  const clearBranding = async (): Promise<void> => {
    await companyBrandingService.clearBranding();
  };

  return {
    companyInfo,
    settings,
    hasCustomBranding: companyInfo.hasCustomBranding,
    updateCompanyName,
    updateCompanyLogo,
    clearBranding,
    isLoading,
  };
}