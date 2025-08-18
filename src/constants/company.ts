/**
 * @fileoverview Company and legal constants
 * Centralized company information for consistent usage across the app
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

/**
 * Company information and contact details
 */
export const COMPANY_INFO = {
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
  supportInfo: `For technical support, please contact ${COMPANY_INFO.legal.supportEmail} or call ${COMPANY_INFO.legal.phone}.`,
} as const;

export default COMPANY_INFO;