/**
 * @fileoverview Enterprise features integration test
 * Tests the new enterprise-level functionality added to the app
 */

import { QuoteService } from '../services/QuoteService';
import { COMPANY_INFO } from '../constants/company';
import { colors, fontSize, spacing } from '../utils/responsive';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Enterprise Features', () => {
  describe('Quote Export Functionality', () => {
    let quoteService: QuoteService;
    let mockQuote: any;

    beforeEach(() => {
      quoteService = new QuoteService();
      
      // Create a minimal valid quote object
      mockQuote = {
        id: 'quote-123',
        quoteNumber: 'Q-2025-001',
        createdAt: new Date('2025-01-01'),
        expiresAt: new Date('2025-01-31'),
        status: 'draft',
        customer: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '555-0123',
          preferredContact: 'email',
        },
        property: {
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          propertyType: 'residential',
          stories: 1,
        },
        materialPreferences: {
          materialType: 'shingle',
          warrantyYears: 25,
          features: ['energy-efficient'],
        },
        lineItems: [
          {
            id: 'item-1',
            description: 'Asphalt Shingles',
            quantity: 20,
            unit: 'bundles',
            unitPrice: 45,
            totalPrice: 900,
            category: 'material',
          },
        ],
        addOns: [
          {
            id: 'addon-1',
            name: 'Gutter Cleaning',
            description: 'Clean and inspect gutters',
            price: 200,
            selected: true,
            category: 'maintenance',
          },
        ],
        subtotal: 900,
        addOnsTotal: 200,
        tax: 77,
        total: 1177,
        currency: 'USD',
        terms: 'Standard terms and conditions',
        paymentTerms: 'Payment due on completion',
        createdBy: 'test-user',
        lastModifiedBy: 'test-user',
        updatedAt: new Date('2025-01-01'),
      };
    });

    test('should export quote as PDF text format', async () => {
      const pdfContent = await quoteService.exportQuote(mockQuote, 'pdf');
      
      expect(pdfContent).toContain('PROFESSIONAL QUOTE');
      expect(pdfContent).toContain(mockQuote.quoteNumber);
      expect(pdfContent).toContain(COMPANY_INFO.name);
      expect(pdfContent).toContain(mockQuote.customer.firstName);
      expect(pdfContent).toContain(mockQuote.customer.lastName);
      expect(pdfContent).toContain('$1,177.00');
    });

    test('should export quote as CSV format', async () => {
      const csvContent = await quoteService.exportQuote(mockQuote, 'csv');
      
      expect(csvContent).toContain('Quote Number');
      expect(csvContent).toContain(mockQuote.quoteNumber);
      expect(csvContent).toContain('Customer Information');
      expect(csvContent).toContain('Line Items');
      expect(csvContent).toContain('Asphalt Shingles');
    });

    test('should export quote as JSON format', async () => {
      const jsonContent = await quoteService.exportQuote(mockQuote, 'json');
      const parsedData = JSON.parse(jsonContent);
      
      expect(parsedData.quote.id).toBe(mockQuote.id);
      expect(parsedData.quote.quoteNumber).toBe(mockQuote.quoteNumber);
      expect(parsedData.metadata.company).toBe(COMPANY_INFO.name);
      expect(parsedData.metadata.format).toBe('json');
    });

    test('should get quote status workflow states', () => {
      const statuses = quoteService.getQuoteStatuses();
      
      expect(statuses).toHaveLength(6);
      expect(statuses[0]).toEqual({
        value: 'draft',
        label: 'Draft',
        color: '#6b7280',
      });
      expect(statuses.find(s => s.value === 'accepted')).toBeTruthy();
    });

    test('should update quote status', () => {
      const updatedQuote = quoteService.updateQuoteStatus(mockQuote, 'sent');
      
      expect(updatedQuote.status).toBe('sent');
      expect(updatedQuote.updatedAt).toBeInstanceOf(Date);
      expect(updatedQuote.lastModifiedBy).toBe('current-user');
    });
  });

  describe('Responsive Design Utilities', () => {
    test('should provide consistent color palette', () => {
      expect(colors.primary).toBe('#234e70');
      expect(colors.success).toBe('#22c55e');
      expect(colors.error).toBe('#ef4444');
      expect(colors.background).toBe('#f6f8fc');
    });

    test('should provide responsive font sizes', () => {
      expect(fontSize.base).toBeGreaterThan(0);
      expect(fontSize.lg).toBeGreaterThan(fontSize.base);
      expect(fontSize['2xl']).toBeGreaterThan(fontSize.xl);
    });

    test('should provide consistent spacing values', () => {
      expect(spacing.sm).toBeGreaterThan(0);
      expect(spacing.md).toBeGreaterThan(spacing.sm);
      expect(spacing.lg).toBeGreaterThan(spacing.md);
      expect(spacing.xl).toBeGreaterThan(spacing.lg);
    });
  });

  describe('Company Constants', () => {
    test('should have complete company information', () => {
      expect(COMPANY_INFO.name).toBe('The Roof Doctors');
      expect(COMPANY_INFO.legal.supportEmail).toContain('@');
      expect(COMPANY_INFO.legal.phone).toContain('ROOF');
      expect(COMPANY_INFO.app.version).toBe('1.0.0');
    });

    test('should have legal contact information', () => {
      expect(COMPANY_INFO.legal.address.street).toBeTruthy();
      expect(COMPANY_INFO.legal.address.city).toBeTruthy();
      expect(COMPANY_INFO.legal.address.state).toBeTruthy();
      expect(COMPANY_INFO.legal.address.zipCode).toBeTruthy();
    });
  });
});