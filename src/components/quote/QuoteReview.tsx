/**
 * @fileoverview Quote Review component for quote system
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Quote, QuoteLineItem, QuoteAddOn } from '../../types/quote';
import { FormSection, FormField } from '../FormComponents';
import { QuoteService } from '../../services/QuoteService';
import { theme } from '../../theme/theme';

interface Props {
  quote: Partial<Quote>;
  errors: Record<string, string>;
  onUpdateQuote: (updates: Partial<Quote>) => void;
  onUpdateErrors: (errors: Record<string, string>) => void;
}

/**
 * Quote review and summary component
 */
export default function QuoteReview({ quote, errors, onUpdateQuote, onUpdateErrors }: Props) {
  const [quoteService] = useState(() => new QuoteService());

  /**
   * Calculate and update totals when quote changes
   */
  useEffect(() => {
    const totals = quoteService.calculateTotals(quote);
    onUpdateQuote(totals);
  }, [quote.lineItems, quote.addOns]);

  /**
   * Toggle add-on selection
   */
  const toggleAddOn = (addOnId: string) => {
    const updatedAddOns = (quote.addOns || []).map(addOn => 
      addOn.id === addOnId 
        ? { ...addOn, selected: !addOn.selected }
        : addOn
    );
    onUpdateQuote({ addOns: updatedAddOns });
  };

  /**
   * Update quote notes
   */
  const updateNotes = (field: 'notes' | 'internalNotes', value: string) => {
    onUpdateQuote({ [field]: value });
  };

  /**
   * Render customer information summary
   */
  const renderCustomerSummary = () => {
    const customer = quote.customer;
    if (!customer) return null;

    return (
      <FormSection title="Customer Information">
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            {customer.firstName} {customer.lastName}
          </Text>
          <Text style={styles.summaryText}>{customer.email}</Text>
          <Text style={styles.summaryText}>{customer.phone}</Text>
          <Text style={styles.summarySubtext}>
            Preferred contact: {customer.preferredContact}
          </Text>
        </View>
      </FormSection>
    );
  };

  /**
   * Render property information summary
   */
  const renderPropertySummary = () => {
    const property = quote.property;
    if (!property) return null;

    return (
      <FormSection title="Property Information">
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>{property.address}</Text>
          <Text style={styles.summaryText}>
            {property.city}, {property.state} {property.zipCode}
          </Text>
          <Text style={styles.summarySubtext}>
            {property.propertyType} • {property.stories} stor{property.stories === 1 ? 'y' : 'ies'}
          </Text>
          {property.yearBuilt && (
            <Text style={styles.summarySubtext}>Built: {property.yearBuilt}</Text>
          )}
          {property.roofAge && (
            <Text style={styles.summarySubtext}>Roof age: {property.roofAge} years</Text>
          )}
        </View>
      </FormSection>
    );
  };

  /**
   * Render material preferences summary
   */
  const renderMaterialSummary = () => {
    const materials = quote.materialPreferences;
    if (!materials) return null;

    return (
      <FormSection title="Material Preferences">
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            {materials.materialType.charAt(0).toUpperCase() + materials.materialType.slice(1)} Roofing
          </Text>
          {materials.materialBrand && (
            <Text style={styles.summarySubtext}>Brand: {materials.materialBrand}</Text>
          )}
          {materials.color && (
            <Text style={styles.summarySubtext}>Color: {materials.color}</Text>
          )}
          <Text style={styles.summarySubtext}>
            Warranty: {materials.warrantyYears} years
          </Text>
          {materials.features && materials.features.length > 0 && (
            <Text style={styles.summarySubtext}>
              Features: {materials.features.join(', ')}
            </Text>
          )}
        </View>
      </FormSection>
    );
  };

  /**
   * Render line items
   */
  const renderLineItems = () => {
    const lineItems = quote.lineItems || [];

    if (lineItems.length === 0) {
      return (
        <View style={styles.noItemsContainer}>
          <Text style={styles.noItemsText}>No line items available</Text>
        </View>
      );
    }

    return (
      <View style={styles.lineItemsContainer}>
        {lineItems.map((item, index) => (
          <View key={item.id || index} style={styles.lineItem}>
            <View style={styles.lineItemHeader}>
              <Text style={styles.lineItemDescription}>{item.description}</Text>
              <Text style={styles.lineItemTotal}>${item.totalPrice.toFixed(2)}</Text>
            </View>
            <View style={styles.lineItemDetails}>
              <Text style={styles.lineItemQuantity}>
                {item.quantity} {item.unit} × ${item.unitPrice.toFixed(2)}
              </Text>
              <Text style={styles.lineItemCategory}>{item.category}</Text>
            </View>
            {item.notes && (
              <Text style={styles.lineItemNotes}>{item.notes}</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  /**
   * Render add-ons
   */
  const renderAddOns = () => {
    const addOns = quote.addOns || [];

    return (
      <View style={styles.addOnsContainer}>
        <Text style={styles.addOnsTitle}>Optional Add-ons</Text>
        {addOns.map((addOn) => (
          <TouchableOpacity
            key={addOn.id}
            style={[
              styles.addOnItem,
              addOn.selected && styles.addOnItemSelected,
            ]}
            onPress={() => toggleAddOn(addOn.id)}
          >
            <View style={styles.addOnContent}>
              <View style={styles.addOnHeader}>
                <Text style={styles.addOnName}>{addOn.name}</Text>
                <Text style={styles.addOnPrice}>${addOn.price.toFixed(2)}</Text>
              </View>
              <Text style={styles.addOnDescription}>{addOn.description}</Text>
            </View>
            <View style={[
              styles.addOnCheckbox,
              addOn.selected && styles.addOnCheckboxSelected,
            ]}>
              {addOn.selected && <Text style={styles.addOnCheckmark}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  /**
   * Render quote totals
   */
  const renderTotals = () => {
    return (
      <View style={styles.totalsContainer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>${(quote.subtotal || 0).toFixed(2)}</Text>
        </View>
        {(quote.addOnsTotal || 0) > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Add-ons:</Text>
            <Text style={styles.totalValue}>${(quote.addOnsTotal || 0).toFixed(2)}</Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax:</Text>
          <Text style={styles.totalValue}>${(quote.tax || 0).toFixed(2)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotalRow]}>
          <Text style={styles.grandTotalLabel}>Total:</Text>
          <Text style={styles.grandTotalValue}>${(quote.total || 0).toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderCustomerSummary()}
      {renderPropertySummary()}
      {renderMaterialSummary()}
      
      <FormSection title="Quote Details">
        {renderLineItems()}
        {renderAddOns()}
        {renderTotals()}
      </FormSection>

      <FormSection title="Quote Notes">
        <FormField
          label="Customer Notes"
          value={quote.notes || ''}
          onChangeText={(value) => updateNotes('notes', value)}
          placeholder="Notes for the customer..."
          multiline
          error={errors.notes}
        />
        <FormField
          label="Internal Notes"
          value={quote.internalNotes || ''}
          onChangeText={(value) => updateNotes('internalNotes', value)}
          placeholder="Internal notes (not shown to customer)..."
          multiline
          error={errors.internalNotes}
        />
      </FormSection>
    </ScrollView>
  );
}

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.text + '20',
  },
  summaryText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 14,
    color: theme.colors.text + 'CC',
  },
  lineItemsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.text + '20',
  },
  noItemsContainer: {
    backgroundColor: theme.colors.text + '10',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  noItemsText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  lineItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.text + '20',
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  lineItemDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    marginRight: 8,
  },
  lineItemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  lineItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineItemQuantity: {
    fontSize: 14,
    color: theme.colors.text + 'CC',
  },
  lineItemCategory: {
    fontSize: 12,
    color: theme.colors.accent,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  lineItemNotes: {
    fontSize: 14,
    color: theme.colors.text + 'CC',
    fontStyle: 'italic',
    marginTop: 8,
  },
  addOnsContainer: {
    marginTop: 16,
  },
  addOnsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  addOnItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.text + '20',
  },
  addOnItemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  addOnContent: {
    flex: 1,
  },
  addOnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addOnName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  addOnPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  addOnDescription: {
    fontSize: 14,
    color: theme.colors.text + 'CC',
  },
  addOnCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.text + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  addOnCheckboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  addOnCheckmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.colors.text + '20',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.text + '20',
    marginTop: 8,
    paddingTop: 16,
  },
  grandTotalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});