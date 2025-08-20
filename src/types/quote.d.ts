/**
 * @fileoverview Type definitions for quote system
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import { RoofMeasurement, MaterialCalculation } from './measurement';

/**
 * Customer information for quotes
 */
export interface CustomerInfo {
  /** Customer first name */
  firstName: string;
  /** Customer last name */
  lastName: string;
  /** Customer email address */
  email: string;
  /** Customer phone number */
  phone: string;
  /** Customer preferred contact method */
  preferredContact: 'email' | 'phone' | 'text';
}

/**
 * Property information for quotes
 */
export interface PropertyInfo {
  /** Street address */
  address: string;
  /** City */
  city: string;
  /** State/Province */
  state: string;
  /** ZIP/Postal code */
  zipCode: string;
  /** Property type */
  propertyType: 'residential' | 'commercial' | 'industrial';
  /** Number of stories */
  stories: number;
  /** Year built (optional) */
  yearBuilt?: number;
  /** Current roof age (optional) */
  roofAge?: number;
}

/**
 * Material preferences and options
 */
export interface MaterialPreferences {
  /** Preferred material type */
  materialType: 'shingle' | 'metal' | 'tile' | 'flat';
  /** Specific material brand/model */
  materialBrand?: string;
  /** Color preference */
  color?: string;
  /** Warranty period desired */
  warrantyYears: number;
  /** Additional features */
  features: string[];
}

/**
 * Quote line item for itemized cost breakdown
 */
export interface QuoteLineItem {
  /** Item ID */
  id: string;
  /** Item description */
  description: string;
  /** Quantity */
  quantity: number;
  /** Unit of measurement */
  unit: string;
  /** Unit price */
  unitPrice: number;
  /** Total price for this line item */
  totalPrice: number;
  /** Item category */
  category: 'material' | 'labor' | 'equipment' | 'permit' | 'other';
  /** Optional notes */
  notes?: string;
}

/**
 * Quote add-on options
 */
export interface QuoteAddOn {
  /** Add-on ID */
  id: string;
  /** Add-on name */
  name: string;
  /** Add-on description */
  description: string;
  /** Add-on price */
  price: number;
  /** Whether this add-on is selected */
  selected: boolean;
  /** Category */
  category: 'gutter' | 'insulation' | 'ventilation' | 'solar' | 'other';
}

/**
 * Complete quote data structure
 */
export interface Quote {
  /** Unique quote ID */
  id: string;
  /** Quote number for customer reference */
  quoteNumber: string;
  /** Quote creation timestamp */
  createdAt: Date;
  /** Last updated timestamp */
  updatedAt: Date;
  /** Quote status */
  status: 'draft' | 'pending' | 'sent' | 'accepted' | 'rejected' | 'expired';
  /** Quote expiration date */
  expiresAt: Date;
  
  /** Customer information */
  customer: CustomerInfo;
  /** Property information */
  property: PropertyInfo;
  /** Material preferences */
  materialPreferences: MaterialPreferences;
  
  /** Associated measurement data */
  measurement?: RoofMeasurement;
  /** Material calculation results */
  materialCalculation?: MaterialCalculation;
  /** Whether this is a manual measurement */
  isManualMeasurement?: boolean;
  /** Measurement validation results */
  measurementValidation?: any;
  
  /** Itemized cost breakdown */
  lineItems: QuoteLineItem[];
  /** Available add-ons */
  addOns: QuoteAddOn[];
  
  /** Subtotal before tax and add-ons */
  subtotal: number;
  /** Selected add-ons total */
  addOnsTotal: number;
  /** Tax amount */
  tax: number;
  /** Final total amount */
  total: number;
  /** Currency */
  currency: string;
  
  /** Quote notes for customer */
  notes?: string;
  /** Internal notes (not shown to customer) */
  internalNotes?: string;
  
  /** Terms and conditions */
  terms: string;
  /** Payment terms */
  paymentTerms: string;
  
  /** Quote created by user ID */
  createdBy: string;
  /** Quote last modified by user ID */
  lastModifiedBy: string;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Quote validation result
 */
export interface QuoteValidationResult {
  /** Whether the quote is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** Missing required fields */
  missingFields: string[];
}

/**
 * Quote export options
 */
export interface QuoteExportOptions {
  /** Export format */
  format: 'pdf' | 'email' | 'print';
  /** Include measurement details */
  includeMeasurements: boolean;
  /** Include photos */
  includePhotos: boolean;
  /** Include terms and conditions */
  includeTerms: boolean;
  /** Customer email for direct sending */
  customerEmail?: string;
}

/**
 * Quote form step identifier
 */
export type QuoteFormStep = 'customer' | 'property' | 'materials' | 'measurements' | 'review' | 'finalize';

/**
 * Quote form state
 */
export interface QuoteFormState {
  /** Current step */
  currentStep: QuoteFormStep;
  /** Form validation errors by field */
  errors: Record<string, string>;
  /** Whether form is being saved */
  isSaving: boolean;
  /** Whether form is being submitted */
  isSubmitting: boolean;
  /** Draft quote data */
  quote: Partial<Quote>;
}