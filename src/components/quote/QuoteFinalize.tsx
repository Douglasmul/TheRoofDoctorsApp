/**
 * @fileoverview Quote Finalize component for quote system
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Quote, QuoteValidationResult, QuoteExportOptions } from '../../types/quote';
import { FormSection, FormButton, FormPicker } from '../FormComponents';
import { QuoteService } from '../../services/QuoteService';
import { theme } from '../../theme/theme';

interface Props {
  quote: Partial<Quote>;
  errors: Record<string, string>;
  onUpdateQuote: (updates: Partial<Quote>) => void;
  onUpdateErrors: (errors: Record<string, string>) => void;
}

/**
 * Quote finalization component
 */
export default function QuoteFinalize({ quote, errors, onUpdateQuote, onUpdateErrors }: Props) {
  const navigation = useNavigation();
  const [quoteService] = useState(() => new QuoteService());
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<QuoteValidationResult | null>(null);

  /**
   * Validate quote before finalizing
   */
  const validateQuote = () => {
    const result = quoteService.validateQuote(quote);
    setValidationResult(result);
    return result;
  };

  /**
   * Finalize and save quote
   */
  const finalizeQuote = async () => {
    try {
      setIsProcessing(true);
      
      // Validate quote
      const validation = validateQuote();
      if (!validation.isValid) {
        Alert.alert(
          'Quote Validation Failed',
          'Please correct the following errors:\n\n' + validation.errors.join('\n'),
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      // Update quote status and timestamps
      const finalQuote: Quote = {
        ...quote as Quote,
        status: 'pending',
        updatedAt: new Date(),
      };

      // Save quote
      await quoteService.saveQuote(finalQuote);
      
      // Clear draft
      await quoteService.clearDraftQuote();

      Alert.alert(
        'Quote Finalized',
        'Your quote has been successfully saved and is ready to send to the customer.',
        [
          { text: 'View Quotes', onPress: () => navigation.navigate('Reports' as any) },
          { text: 'Send Quote', onPress: () => handleSendQuote(finalQuote) },
          { text: 'Done', onPress: () => navigation.goBack() },
        ]
      );
    } catch (error) {
      console.error('Error finalizing quote:', error);
      Alert.alert('Error', 'Failed to finalize quote. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Send quote to customer
   */
  const handleSendQuote = async (finalQuote: Quote) => {
    try {
      setIsProcessing(true);
      
      // Generate quote text for sharing
      const quoteText = generateQuoteText(finalQuote);
      
      // Use React Native Share API
      const result = await Share.share({
        message: quoteText,
        title: `Quote ${finalQuote.quoteNumber}`,
      });

      if (result.action === Share.sharedAction) {
        // Update quote status to sent
        const sentQuote = { ...finalQuote, status: 'sent' as const };
        await quoteService.saveQuote(sentQuote);
        
        Alert.alert('Success', 'Quote has been sent to the customer.');
      }
    } catch (error) {
      console.error('Error sending quote:', error);
      Alert.alert('Error', 'Failed to send quote. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Generate quote text for sharing
   */
  const generateQuoteText = (finalQuote: Quote): string => {
    const lines = [
      `ROOFING QUOTE - ${finalQuote.quoteNumber}`,
      `The Roof Doctors`,
      '',
      `Customer: ${finalQuote.customer.firstName} ${finalQuote.customer.lastName}`,
      `Property: ${finalQuote.property.address}`,
      `${finalQuote.property.city}, ${finalQuote.property.state} ${finalQuote.property.zipCode}`,
      '',
      'QUOTE DETAILS:',
      '─'.repeat(40),
    ];

    // Add line items
    finalQuote.lineItems.forEach(item => {
      lines.push(`${item.description}`);
      lines.push(`  ${item.quantity} ${item.unit} × $${item.unitPrice.toFixed(2)} = $${item.totalPrice.toFixed(2)}`);
    });

    // Add selected add-ons
    const selectedAddOns = finalQuote.addOns.filter(addon => addon.selected);
    if (selectedAddOns.length > 0) {
      lines.push('');
      lines.push('ADD-ONS:');
      selectedAddOns.forEach(addon => {
        lines.push(`${addon.name}: $${addon.price.toFixed(2)}`);
      });
    }

    // Add totals
    lines.push('');
    lines.push('─'.repeat(40));
    lines.push(`Subtotal: $${finalQuote.subtotal.toFixed(2)}`);
    if (finalQuote.addOnsTotal > 0) {
      lines.push(`Add-ons: $${finalQuote.addOnsTotal.toFixed(2)}`);
    }
    lines.push(`Tax: $${finalQuote.tax.toFixed(2)}`);
    lines.push(`TOTAL: $${finalQuote.total.toFixed(2)}`);
    lines.push('');

    // Add terms
    if (finalQuote.notes) {
      lines.push('NOTES:');
      lines.push(finalQuote.notes);
      lines.push('');
    }

    lines.push('TERMS:');
    lines.push(finalQuote.terms);
    lines.push('');
    lines.push('PAYMENT TERMS:');
    lines.push(finalQuote.paymentTerms);
    lines.push('');
    lines.push(`Quote expires: ${finalQuote.expiresAt.toLocaleDateString()}`);
    lines.push('');
    lines.push('Thank you for choosing The Roof Doctors!');

    return lines.join('\n');
  };

  /**
   * Save as draft
   */
  const saveDraft = async () => {
    try {
      setIsProcessing(true);
      await quoteService.saveDraftQuote(quote);
      Alert.alert('Success', 'Quote saved as draft.');
    } catch (error) {
      console.error('Error saving draft:', error);
      Alert.alert('Error', 'Failed to save draft.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Render validation results
   */
  const renderValidationResults = () => {
    if (!validationResult) {
      return (
        <FormButton
          title="Validate Quote"
          onPress={validateQuote}
          variant="outline"
          style={styles.validateButton}
        />
      );
    }

    return (
      <View style={styles.validationContainer}>
        <View style={[
          styles.validationHeader,
          validationResult.isValid ? styles.validationSuccess : styles.validationError,
        ]}>
          <Text style={styles.validationTitle}>
            {validationResult.isValid ? '✓ Quote is Valid' : '⚠ Validation Issues'}
          </Text>
        </View>

        {validationResult.errors.length > 0 && (
          <View style={styles.validationSection}>
            <Text style={styles.validationSectionTitle}>Errors:</Text>
            {validationResult.errors.map((error, index) => (
              <Text key={index} style={styles.validationErrorText}>• {error}</Text>
            ))}
          </View>
        )}

        {validationResult.warnings.length > 0 && (
          <View style={styles.validationSection}>
            <Text style={styles.validationSectionTitle}>Warnings:</Text>
            {validationResult.warnings.map((warning, index) => (
              <Text key={index} style={styles.validationWarning}>• {warning}</Text>
            ))}
          </View>
        )}

        <FormButton
          title="Re-validate"
          onPress={validateQuote}
          variant="outline"
          style={styles.revalidateButton}
        />
      </View>
    );
  };

  /**
   * Render quote summary
   */
  const renderQuoteSummary = () => {
    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Quote Number:</Text>
          <Text style={styles.summaryValue}>{quote.quoteNumber || 'TBD'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Customer:</Text>
          <Text style={styles.summaryValue}>
            {quote.customer?.firstName} {quote.customer?.lastName}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Property:</Text>
          <Text style={styles.summaryValue}>{quote.property?.address}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total:</Text>
          <Text style={[styles.summaryValue, styles.totalValue]}>
            ${(quote.total || 0).toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Expires:</Text>
          <Text style={styles.summaryValue}>
            {quote.expiresAt ? new Date(quote.expiresAt).toLocaleDateString() : 'TBD'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FormSection title="Quote Summary">
        {renderQuoteSummary()}
      </FormSection>

      <FormSection title="Validation">
        {renderValidationResults()}
      </FormSection>

      <FormSection title="Finalize Quote">
        <View style={styles.actionsContainer}>
          <FormButton
            title="Save as Draft"
            onPress={saveDraft}
            variant="outline"
            loading={isProcessing}
            style={styles.actionButton}
          />
          
          <FormButton
            title="Finalize Quote"
            onPress={finalizeQuote}
            loading={isProcessing}
            disabled={validationResult ? !validationResult.isValid : false}
            style={styles.actionButton}
          />
        </View>
        
        <Text style={styles.finalizeNote}>
          Once finalized, the quote will be saved and ready to send to the customer.
        </Text>
      </FormSection>
    </View>
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  validateButton: {
    marginBottom: 16,
  },
  validationContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.text + '20',
    overflow: 'hidden',
  },
  validationHeader: {
    padding: 16,
  },
  validationSuccess: {
    backgroundColor: theme.colors.success + '20',
  },
  validationError: {
    backgroundColor: theme.colors.error + '20',
  },
  validationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  validationSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.text + '20',
  },
  validationSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  validationErrorText: {
    fontSize: 14,
    color: theme.colors.error,
    marginBottom: 4,
  },
  validationWarning: {
    fontSize: 14,
    color: theme.colors.warning,
    marginBottom: 4,
  },
  revalidateButton: {
    margin: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
  finalizeNote: {
    fontSize: 14,
    color: theme.colors.text + 'CC',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});