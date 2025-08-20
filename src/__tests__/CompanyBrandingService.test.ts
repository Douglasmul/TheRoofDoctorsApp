/**
 * @fileoverview Tests for CompanyBrandingService
 * @version 1.0.0
 */

import { CompanyBrandingService } from '../services/CompanyBrandingService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

describe('CompanyBrandingService', () => {
  let service: CompanyBrandingService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    service = CompanyBrandingService.getInstance();
  });

  describe('Company Name Management', () => {
    it('should update company name', async () => {
      const testName = 'Custom Roofing Co.';
      
      await service.updateCompanyName(testName);
      
      const settings = service.getSettings();
      expect(settings.customName).toBe(testName);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should clear company name when empty string provided', async () => {
      await service.updateCompanyName('');
      
      const settings = service.getSettings();
      expect(settings.customName).toBeUndefined();
    });
  });

  describe('Logo Management', () => {
    it('should update company logo', async () => {
      const testUri = 'file://path/to/logo.png';
      
      await service.updateCompanyLogo(testUri);
      
      const settings = service.getSettings();
      expect(settings.customLogoUri).toBe(testUri);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should clear logo when empty string provided', async () => {
      await service.updateCompanyLogo('');
      
      const settings = service.getSettings();
      expect(settings.customLogoUri).toBeUndefined();
    });
  });

  describe('Company Info Generation', () => {
    it('should return default company info when no custom settings', () => {
      const companyInfo = service.getCompanyInfo();
      
      expect(companyInfo.name).toBe('The Roof Doctors');
      expect(companyInfo.hasCustomBranding).toBe(false);
      expect(companyInfo.logoUri).toBeUndefined();
    });

    it('should return custom company info when custom settings exist', async () => {
      await service.updateCompanyName('Custom Roofing Co.');
      await service.updateCompanyLogo('file://logo.png');
      
      const companyInfo = service.getCompanyInfo();
      
      expect(companyInfo.name).toBe('Custom Roofing Co.');
      expect(companyInfo.hasCustomBranding).toBe(true);
      expect(companyInfo.logoUri).toBe('file://logo.png');
      expect(companyInfo.copyright).toContain('Custom Roofing Co.');
    });
  });

  describe('Clear Branding', () => {
    it('should clear all custom branding', async () => {
      // Set some custom branding first
      await service.updateCompanyName('Custom Company');
      await service.updateCompanyLogo('file://logo.png');
      
      // Clear branding
      await service.clearBranding();
      
      const settings = service.getSettings();
      const companyInfo = service.getCompanyInfo();
      
      expect(settings.customName).toBeUndefined();
      expect(settings.customLogoUri).toBeUndefined();
      expect(companyInfo.hasCustomBranding).toBe(false);
      expect(companyInfo.name).toBe('The Roof Doctors');
    });
  });

  describe('Listeners', () => {
    it('should notify listeners on settings change', async () => {
      const listener = jest.fn();
      
      service.addListener(listener);
      await service.updateCompanyName('Test Company');
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          customName: 'Test Company'
        })
      );
    });

    it('should allow unsubscribing listeners', async () => {
      const listener = jest.fn();
      
      const unsubscribe = service.addListener(listener);
      unsubscribe();
      
      await service.updateCompanyName('Test Company');
      
      expect(listener).not.toHaveBeenCalled();
    });
  });
});