/**
 * @fileoverview Test for Company Settings Service
 */

import { CompanySettingsService } from '../services/CompanySettingsService';

describe('CompanySettingsService', () => {
  let service: CompanySettingsService;

  beforeEach(() => {
    service = CompanySettingsService.getInstance();
  });

  test('should initialize with empty settings', () => {
    const settings = service.getSettings();
    expect(settings).toEqual({});
  });

  test('should update company name', async () => {
    const success = await service.updateSettings({
      name: 'Test Company'
    });
    
    expect(success).toBe(true);
    expect(service.hasCustomName()).toBe(true);
    expect(service.getEffectiveName('Default')).toBe('Test Company');
  });

  test('should update logo', async () => {
    const success = await service.updateSettings({
      logoUri: 'file://test-logo.png',
      logoSource: 'gallery'
    });
    
    expect(success).toBe(true);
    expect(service.hasCustomLogo()).toBe(true);
    expect(service.getEffectiveLogoUri()).toBe('file://test-logo.png');
  });

  test('should reset settings', async () => {
    // First set some data
    await service.updateSettings({
      name: 'Test Company',
      logoUri: 'file://test-logo.png'
    });
    
    // Then reset
    const success = await service.resetSettings();
    
    expect(success).toBe(true);
    expect(service.hasCustomName()).toBe(false);
    expect(service.hasCustomLogo()).toBe(false);
  });
});