/**
 * @fileoverview Company and legal constants
 * Centralized company information for consistent usage across the app
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import { companySettingsService } from '../services/CompanySettingsService';

/**
 * Default company information and contact details
 */
export const DEFAULT_COMPANY_INFO = {
  /** Company name */
  name: 'The Roof Doctors',
  
  /** Copyright notice */
  copyright: '© 2025 The Roof Doctors',
  
  /** API configuration */
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.roofdoctors.com',
    version: 'v1',
  },
  
  /** Legal and contact information */
  legal: {
    /** Terms of service URL */
    termsUrl: 'https://roofdoctors.com/terms',
    /** Privacy policy URL */
    privacyUrl: 'https://roofdoctors.com/privacy',
    /** Support email */
    supportEmail: 'support@roofdoctors.com',
    /** General contact email */
    contactEmail: 'contact@roofdoctors.com',
    /** Customer service phone */
    phone: '+1-800-ROOF-DOC',
    /** Business address */
    address: {
      street: '123 Roofing Way',
      city: 'Construction City',
      state: 'CA',
      zipCode: '90210',
      country: 'USA',
    },
  },
  
  /** App metadata */
  app: {
    version: '1.0.0',
    name: 'TheRoofDoctorsApp',
    displayName: 'The Roof Doctors',
    description: 'Professional AR roof measurement application',
  },
} as const;

/**
 * Dynamic company information that respects custom settings
 */
export const COMPANY_INFO = {
  ...DEFAULT_COMPANY_INFO,
  
  /** Get effective company name (custom or default) */
  get name() {
    return companySettingsService.getEffectiveName(DEFAULT_COMPANY_INFO.name);
  },
  
  /** Get effective copyright notice with custom name */
  get copyright() {
    const effectiveName = companySettingsService.getEffectiveName(DEFAULT_COMPANY_INFO.name);
    return `© 2025 ${effectiveName}`;
  },
  
  /** Get custom logo URI if available */
  get logoUri() {
    return companySettingsService.getEffectiveLogoUri();
  },
  
  /** Check if custom logo is set */
  get hasCustomLogo() {
    return companySettingsService.hasCustomLogo();
  },
  
  /** Get app display name with custom company name */
  get app() {
    const effectiveName = companySettingsService.getEffectiveName(DEFAULT_COMPANY_INFO.name);
    return {
      ...DEFAULT_COMPANY_INFO.app,
      displayName: effectiveName,
    };
  },
};

/**
 * Legal text constants
 */
export const LEGAL_TEXT = {
  /** Terms of service preview */
  termsPreview: 'Terms of service and privacy policy coming soon!',
  
  /** Privacy notice */
  privacyNotice: 'Your measurement data is processed securely in accordance with our privacy policy.',
  
  /** Data retention notice */
  dataRetention: 'Measurement data is retained for compliance and quality assurance purposes.',
  
  /** Support information */
  supportInfo: `For technical support, please contact ${DEFAULT_COMPANY_INFO.legal.supportEmail} or call ${DEFAULT_COMPANY_INFO.legal.phone}.`,
} as const;

export default COMPANY_INFO;