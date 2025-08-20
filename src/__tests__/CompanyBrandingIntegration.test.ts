/**
 * @fileoverview Integration test demonstrating company branding functionality
 * @version 1.0.0
 */

import { CompanyBrandingService } from '../services/CompanyBrandingService';
import { COMPANY_INFO } from '../constants/company';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

describe('Company Branding Integration', () => {
  let service: CompanyBrandingService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    service = CompanyBrandingService.getInstance();
  });

  it('should integrate with COMPANY_INFO constants', async () => {
    // Initially should return default company info
    const initialInfo = service.getCompanyInfo();
    expect(initialInfo.name).toBe('The Roof Doctors');
    expect(initialInfo.hasCustomBranding).toBe(false);

    // Update with custom branding
    await service.updateCompanyName('Custom Roofing Inc.');
    await service.updateCompanyLogo('file://logo.png');

    // Should now return custom company info
    const customInfo = service.getCompanyInfo();
    expect(customInfo.name).toBe('Custom Roofing Inc.');
    expect(customInfo.logoUri).toBe('file://logo.png');
    expect(customInfo.hasCustomBranding).toBe(true);
    expect(customInfo.copyright).toContain('Custom Roofing Inc.');

    // Should preserve all other COMPANY_INFO properties
    expect(customInfo.legal.supportEmail).toBe('support@roofdoctors.com');
    expect(customInfo.legal.phone).toBe('+1-800-ROOF-DOC');
    expect(customInfo.api.baseUrl).toBe('https://api.roofdoctors.com');
  });

  it('should handle clearing branding gracefully', async () => {
    // Set custom branding
    await service.updateCompanyName('Test Company');
    await service.updateCompanyLogo('file://test.png');
    
    let info = service.getCompanyInfo();
    expect(info.hasCustomBranding).toBe(true);

    // Clear branding
    await service.clearBranding();
    
    info = service.getCompanyInfo();
    expect(info.hasCustomBranding).toBe(false);
    expect(info.name).toBe('The Roof Doctors');
    expect(info.logoUri).toBeUndefined();
  });

  it('should work with the existing COMPANY_INFO getter structure', () => {
    // This test ensures our service integrates well with the existing COMPANY_INFO
    const info = service.getCompanyInfo();
    
    // Should have all expected properties
    expect(info).toHaveProperty('name');
    expect(info).toHaveProperty('copyright');
    expect(info).toHaveProperty('legal');
    expect(info).toHaveProperty('api');
    expect(info).toHaveProperty('app');
    expect(info).toHaveProperty('hasCustomBranding');
    
    // Legal info should be preserved
    expect(info.legal.termsUrl).toBe('https://roofdoctors.com/terms');
    expect(info.legal.privacyUrl).toBe('https://roofdoctors.com/privacy');
  });
});