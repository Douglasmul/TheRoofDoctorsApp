/**
 * @fileoverview Quote System Integration Tests
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import { QuoteService } from '../services/QuoteService';
import { Quote, CustomerInfo, PropertyInfo, MaterialPreferences } from '../types/quote';
import { RoofMeasurement } from '../types/measurement';

describe('Quote System Integration', () => {
  let quoteService: QuoteService;

  beforeEach(() => {
    quoteService = new QuoteService();
  });

  describe('Quote Creation', () => {
    it('should create a blank quote with default values', () => {
      const quote = quoteService.createBlankQuote();
      
      expect(quote.id).toBeDefined();
      expect(quote.quoteNumber).toBeDefined();
      expect(quote.status).toBe('draft');
      expect(quote.customer.firstName).toBe('');
      expect(quote.property.propertyType).toBe('residential');
      expect(quote.materialPreferences.materialType).toBe('shingle');
      expect(quote.total).toBe(0);
    });

    it('should create quote from measurement data', async () => {
      const mockMeasurement: RoofMeasurement = {
        id: 'test-measurement',
        propertyId: 'test-property',
        userId: 'test-user',
        timestamp: new Date(),
        planes: [{
          id: 'plane-1',
          type: 'primary',
          area: 1000,
          pitch: 6,
          pitchAngle: 26.57,
          azimuthAngle: 180,
          material: 'shingle',
          boundaries: [
            { x: 0, y: 0, z: 0, confidence: 0.95 },
            { x: 20, y: 0, z: 0, confidence: 0.95 },
            { x: 20, y: 25, z: 5, confidence: 0.95 },
            { x: 0, y: 25, z: 5, confidence: 0.95 },
          ],
          normal: { x: 0, y: 0.447, z: 0.894 },
          center: { x: 10, y: 12.5, z: 2.5, confidence: 0.95 },
          metadata: {}
        }],
        totalArea: 1000,
        totalProjectedArea: 894,
        accuracy: 0.95,
        deviceInfo: {
          id: 'test-device',
          model: 'iPhone 14 Pro',
          osVersion: '16.0',
          appVersion: '1.0.0',
        },
        qualityMetrics: {
          trackingStability: 0.95,
          lightingConditions: 0.85,
          surfaceTexture: 0.9,
          motionBlur: 0.1,
          overallScore: 0.9,
        },
        auditTrail: [],
        exports: [],
        complianceStatus: {
          status: 'compliant',
          checks: [],
          lastValidated: new Date(),
        },
        metadata: {}
      };

      const quote = await quoteService.createQuoteFromMeasurement(mockMeasurement);
      
      expect(quote.measurement).toEqual(mockMeasurement);
      expect(quote.materialCalculation).toBeDefined();
      expect(quote.lineItems.length).toBeGreaterThan(0);
      expect(quote.subtotal).toBeGreaterThan(0);
    });
  });

  describe('Quote Validation', () => {
    it('should validate complete quote data', () => {
      const completeQuote: Partial<Quote> = {
        customer: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '555-123-4567',
          preferredContact: 'email',
        },
        property: {
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          propertyType: 'residential',
          stories: 2,
        },
        lineItems: [{
          id: 'item-1',
          description: 'Asphalt Shingles',
          quantity: 30,
          unit: 'bundles',
          unitPrice: 45,
          totalPrice: 1350,
          category: 'material',
        }],
        total: 1500,
      };

      const validation = quoteService.validateQuote(completeQuote);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should identify missing required fields', () => {
      const incompleteQuote: Partial<Quote> = {
        customer: {
          firstName: '',
          lastName: 'Doe',
          email: 'invalid-email',
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
        lineItems: [],
        total: 0,
      };

      const validation = quoteService.validateQuote(incompleteQuote);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.missingFields).toContain('customer.firstName');
      expect(validation.missingFields).toContain('property.address');
    });
  });

  describe('Quote Calculations', () => {
    it('should calculate totals correctly', () => {
      const quote: Partial<Quote> = {
        lineItems: [
          {
            id: 'item-1',
            description: 'Shingles',
            quantity: 30,
            unit: 'bundles',
            unitPrice: 45,
            totalPrice: 1350,
            category: 'material',
          },
          {
            id: 'item-2',
            description: 'Labor',
            quantity: 1,
            unit: 'project',
            unitPrice: 2000,
            totalPrice: 2000,
            category: 'labor',
          },
        ],
        addOns: [
          {
            id: 'addon-1',
            name: 'Gutter Cleaning',
            description: 'Clean gutters',
            price: 250,
            selected: true,
            category: 'gutter',
          },
          {
            id: 'addon-2',
            name: 'Ventilation',
            description: 'Improve ventilation',
            price: 800,
            selected: false,
            category: 'ventilation',
          },
        ],
      };

      const totals = quoteService.calculateTotals(quote);
      
      expect(totals.subtotal).toBe(3350); // 1350 + 2000
      expect(totals.addOnsTotal).toBe(250); // Only selected add-on
      expect(totals.tax).toBe(288); // (3350 + 250) * 0.08
      expect(totals.total).toBe(3888); // 3350 + 250 + 288
    });
  });

  describe('Email Validation', () => {
    it('should validate email formats correctly', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'firstname+lastname@company.org',
      ];

      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user name@domain.com',
      ];

      validEmails.forEach(email => {
        const quote = { customer: { email } as CustomerInfo };
        const validation = quoteService.validateQuote(quote);
        expect(validation.errors.some(e => e.includes('email'))).toBe(false);
      });

      invalidEmails.forEach(email => {
        const quote = { customer: { email } as CustomerInfo };
        const validation = quoteService.validateQuote(quote);
        expect(validation.errors.some(e => e.includes('email'))).toBe(true);
      });
    });
  });
});