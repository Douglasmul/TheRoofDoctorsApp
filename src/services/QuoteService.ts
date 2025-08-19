/**
 * @fileoverview Quote service for managing quote operations
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Quote, 
  QuoteLineItem, 
  QuoteAddOn, 
  QuoteValidationResult, 
  CustomerInfo, 
  PropertyInfo, 
  MaterialPreferences 
} from '../types/quote';
import { RoofMeasurement, MaterialCalculation } from '../types/measurement';
import { RoofMeasurementEngine } from './RoofMeasurementEngine';

/**
 * Quote service for managing quote operations
 */
export class QuoteService {
  private static readonly STORAGE_KEY = 'quotes';
  private static readonly DRAFT_KEY = 'draft_quote';
  private measurementEngine: RoofMeasurementEngine;

  constructor() {
    this.measurementEngine = new RoofMeasurementEngine();
  }

  /**
   * Create a new quote from measurement data
   */
  async createQuoteFromMeasurement(measurement: RoofMeasurement): Promise<Quote> {
    const quoteId = this.generateQuoteId();
    const quoteNumber = this.generateQuoteNumber();
    const now = new Date();
    
    // Calculate materials if not already done
    let materialCalculation: MaterialCalculation;
    try {
      materialCalculation = await this.measurementEngine.calculateMaterials(measurement);
    } catch (error) {
      console.error('Error calculating materials for quote:', error);
      throw new Error('Failed to calculate materials for quote');
    }

    // Generate line items from material calculation
    const lineItems = this.generateLineItemsFromCalculation(materialCalculation);

    const quote: Quote = {
      id: quoteId,
      quoteNumber,
      createdAt: now,
      updatedAt: now,
      status: 'draft',
      expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      
      customer: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        preferredContact: 'email',
      },
      property: {
        address: '',
        city: '',
        state: '',
        zipCode: '',
        propertyType: 'residential',
        stories: 1,
      },
      materialPreferences: {
        materialType: 'shingle',
        warrantyYears: 25,
        features: [],
      },
      
      measurement,
      materialCalculation,
      lineItems,
      addOns: this.getDefaultAddOns(),
      
      subtotal: materialCalculation.costEstimate?.totalCost || 0,
      addOnsTotal: 0,
      tax: 0,
      total: materialCalculation.costEstimate?.totalCost || 0,
      currency: materialCalculation.costEstimate?.currency || 'USD',
      
      terms: this.getDefaultTerms(),
      paymentTerms: this.getDefaultPaymentTerms(),
      
      createdBy: 'current-user', // TODO: Get from auth context
      lastModifiedBy: 'current-user',
    };

    return quote;
  }

  /**
   * Create a blank quote
   */
  createBlankQuote(): Quote {
    const quoteId = this.generateQuoteId();
    const quoteNumber = this.generateQuoteNumber();
    const now = new Date();

    return {
      id: quoteId,
      quoteNumber,
      createdAt: now,
      updatedAt: now,
      status: 'draft',
      expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      
      customer: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        preferredContact: 'email',
      },
      property: {
        address: '',
        city: '',
        state: '',
        zipCode: '',
        propertyType: 'residential',
        stories: 1,
      },
      materialPreferences: {
        materialType: 'shingle',
        warrantyYears: 25,
        features: [],
      },
      
      lineItems: [],
      addOns: this.getDefaultAddOns(),
      
      subtotal: 0,
      addOnsTotal: 0,
      tax: 0,
      total: 0,
      currency: 'USD',
      
      terms: this.getDefaultTerms(),
      paymentTerms: this.getDefaultPaymentTerms(),
      
      createdBy: 'current-user',
      lastModifiedBy: 'current-user',
    };
  }

  /**
   * Save quote to storage
   */
  async saveQuote(quote: Quote): Promise<void> {
    try {
      quote.updatedAt = new Date();
      const quotes = await this.getAllQuotes();
      const existingIndex = quotes.findIndex(q => q.id === quote.id);
      
      if (existingIndex >= 0) {
        quotes[existingIndex] = quote;
      } else {
        quotes.push(quote);
      }
      
      await AsyncStorage.setItem(QuoteService.STORAGE_KEY, JSON.stringify(quotes));
    } catch (error) {
      console.error('Error saving quote:', error);
      throw new Error('Failed to save quote');
    }
  }

  /**
   * Save draft quote
   */
  async saveDraftQuote(quote: Partial<Quote>): Promise<void> {
    try {
      await AsyncStorage.setItem(QuoteService.DRAFT_KEY, JSON.stringify(quote));
    } catch (error) {
      console.error('Error saving draft quote:', error);
      throw new Error('Failed to save draft quote');
    }
  }

  /**
   * Load draft quote
   */
  async loadDraftQuote(): Promise<Partial<Quote> | null> {
    try {
      const draft = await AsyncStorage.getItem(QuoteService.DRAFT_KEY);
      return draft ? JSON.parse(draft) : null;
    } catch (error) {
      console.error('Error loading draft quote:', error);
      return null;
    }
  }

  /**
   * Clear draft quote
   */
  async clearDraftQuote(): Promise<void> {
    try {
      await AsyncStorage.removeItem(QuoteService.DRAFT_KEY);
    } catch (error) {
      console.error('Error clearing draft quote:', error);
    }
  }

  /**
   * Get all quotes
   */
  async getAllQuotes(): Promise<Quote[]> {
    try {
      const quotesJson = await AsyncStorage.getItem(QuoteService.STORAGE_KEY);
      return quotesJson ? JSON.parse(quotesJson) : [];
    } catch (error) {
      console.error('Error loading quotes:', error);
      return [];
    }
  }

  /**
   * Get quote by ID
   */
  async getQuoteById(id: string): Promise<Quote | null> {
    try {
      const quotes = await this.getAllQuotes();
      return quotes.find(q => q.id === id) || null;
    } catch (error) {
      console.error('Error loading quote:', error);
      return null;
    }
  }

  /**
   * Validate quote data
   */
  validateQuote(quote: Partial<Quote>): QuoteValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingFields: string[] = [];

    // Validate customer information
    if (!quote.customer?.firstName?.trim()) {
      missingFields.push('customer.firstName');
      errors.push('Customer first name is required');
    }
    if (!quote.customer?.lastName?.trim()) {
      missingFields.push('customer.lastName');
      errors.push('Customer last name is required');
    }
    if (!quote.customer?.email?.trim()) {
      missingFields.push('customer.email');
      errors.push('Customer email is required');
    } else if (!this.isValidEmail(quote.customer.email)) {
      errors.push('Customer email is not valid');
    }
    if (!quote.customer?.phone?.trim()) {
      missingFields.push('customer.phone');
      errors.push('Customer phone number is required');
    }

    // Validate property information
    if (!quote.property?.address?.trim()) {
      missingFields.push('property.address');
      errors.push('Property address is required');
    }
    if (!quote.property?.city?.trim()) {
      missingFields.push('property.city');
      errors.push('Property city is required');
    }
    if (!quote.property?.state?.trim()) {
      missingFields.push('property.state');
      errors.push('Property state is required');
    }
    if (!quote.property?.zipCode?.trim()) {
      missingFields.push('property.zipCode');
      errors.push('Property ZIP code is required');
    }

    // Validate line items
    if (!quote.lineItems || quote.lineItems.length === 0) {
      errors.push('At least one line item is required');
    }

    // Validate totals
    if (!quote.total || quote.total <= 0) {
      errors.push('Quote total must be greater than zero');
    }

    // Warnings
    if (!quote.measurement) {
      warnings.push('No measurement data associated with this quote');
    }
    if (!quote.notes?.trim()) {
      warnings.push('Consider adding notes for the customer');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingFields,
    };
  }

  /**
   * Calculate quote totals
   */
  calculateTotals(quote: Partial<Quote>): { subtotal: number; addOnsTotal: number; tax: number; total: number } {
    const lineItemsTotal = (quote.lineItems || []).reduce((sum, item) => sum + item.totalPrice, 0);
    const addOnsTotal = (quote.addOns || [])
      .filter(addon => addon.selected)
      .reduce((sum, addon) => sum + addon.price, 0);
    
    const subtotal = lineItemsTotal;
    const taxRate = 0.08; // 8% tax rate - should be configurable
    const tax = (subtotal + addOnsTotal) * taxRate;
    const total = subtotal + addOnsTotal + tax;

    return { subtotal, addOnsTotal, tax, total };
  }

  /**
   * Generate line items from material calculation
   */
  private generateLineItemsFromCalculation(calculation: MaterialCalculation): QuoteLineItem[] {
    const lineItems: QuoteLineItem[] = [];

    // Material line items
    if (calculation.materialSpecific.shingleBundles) {
      lineItems.push({
        id: 'shingle-bundles',
        description: 'Asphalt Shingle Bundles',
        quantity: calculation.materialSpecific.shingleBundles,
        unit: 'bundles',
        unitPrice: 45, // Default price per bundle
        totalPrice: calculation.materialSpecific.shingleBundles * 45,
        category: 'material',
      });
    }

    if (calculation.materialSpecific.metalSheets) {
      lineItems.push({
        id: 'metal-sheets',
        description: 'Metal Roofing Sheets',
        quantity: calculation.materialSpecific.metalSheets,
        unit: 'sheets',
        unitPrice: 85, // Default price per sheet
        totalPrice: calculation.materialSpecific.metalSheets * 85,
        category: 'material',
      });
    }

    if (calculation.materialSpecific.tiles) {
      lineItems.push({
        id: 'roof-tiles',
        description: 'Roof Tiles',
        quantity: calculation.materialSpecific.tiles,
        unit: 'tiles',
        unitPrice: 2.5, // Default price per tile
        totalPrice: calculation.materialSpecific.tiles * 2.5,
        category: 'material',
      });
    }

    // Labor line item
    if (calculation.costEstimate) {
      lineItems.push({
        id: 'labor',
        description: 'Installation Labor',
        quantity: 1,
        unit: 'project',
        unitPrice: calculation.costEstimate.laborCost,
        totalPrice: calculation.costEstimate.laborCost,
        category: 'labor',
      });
    }

    return lineItems;
  }

  /**
   * Get default add-ons
   */
  private getDefaultAddOns(): QuoteAddOn[] {
    return [
      {
        id: 'gutter-cleaning',
        name: 'Gutter Cleaning',
        description: 'Complete gutter cleaning and inspection',
        price: 250,
        selected: false,
        category: 'gutter',
      },
      {
        id: 'ventilation-upgrade',
        name: 'Ventilation Upgrade',
        description: 'Ridge and soffit ventilation improvements',
        price: 800,
        selected: false,
        category: 'ventilation',
      },
      {
        id: 'insulation-inspection',
        name: 'Insulation Inspection',
        description: 'Attic insulation assessment and recommendations',
        price: 150,
        selected: false,
        category: 'insulation',
      },
      {
        id: 'skylight-installation',
        name: 'Skylight Installation',
        description: 'Professional skylight installation (per unit)',
        price: 1200,
        selected: false,
        category: 'other',
      },
    ];
  }

  /**
   * Get default terms and conditions
   */
  private getDefaultTerms(): string {
    return `TERMS AND CONDITIONS:
1. This quote is valid for 30 days from the date of issue.
2. Work will be completed within 5-10 business days of contract signing, weather permitting.
3. All materials include manufacturer warranties.
4. Payment terms: 50% deposit required, balance due upon completion.
5. Permits and inspections are included in the quoted price.
6. Additional work not covered in this quote will be quoted separately.
7. The Roof Doctors is fully licensed and insured.`;
  }

  /**
   * Get default payment terms
   */
  private getDefaultPaymentTerms(): string {
    return '50% deposit required to start work, remaining balance due upon completion. We accept cash, check, and major credit cards.';
  }

  /**
   * Generate unique quote ID
   */
  private generateQuoteId(): string {
    return `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate quote number for customer reference
   */
  private generateQuoteNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `RD${year}${month}${day}-${random}`;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}