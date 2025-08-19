/**
 * @fileoverview Customer Form component for quote system
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Quote, CustomerInfo } from '../../types/quote';
import { FormField, FormPicker, FormSection } from '../FormComponents';

interface Props {
  quote: Partial<Quote>;
  errors: Record<string, string>;
  onUpdateQuote: (updates: Partial<Quote>) => void;
  onUpdateErrors: (errors: Record<string, string>) => void;
}

/**
 * Customer information form component
 */
export default function CustomerForm({ quote, errors, onUpdateQuote, onUpdateErrors }: Props) {
  const customer = quote.customer || {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredContact: 'email',
  };

  /**
   * Update customer field
   */
  const updateCustomerField = <K extends keyof CustomerInfo>(
    field: K,
    value: CustomerInfo[K]
  ) => {
    const updatedCustomer = { ...customer, [field]: value };
    onUpdateQuote({ customer: updatedCustomer });
    
    // Clear error for this field
    if (errors[`customer.${field}`]) {
      const newErrors = { ...errors };
      delete newErrors[`customer.${field}`];
      onUpdateErrors(newErrors);
    }
  };

  /**
   * Validate phone number format
   */
  const validatePhone = (phone: string) => {
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    return phoneRegex.test(phone);
  };

  /**
   * Validate email format
   */
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Handle field blur for validation
   */
  const handleFieldBlur = (field: keyof CustomerInfo) => {
    const value = customer[field];
    const newErrors = { ...errors };

    switch (field) {
      case 'email':
        if (value && !validateEmail(value as string)) {
          newErrors[`customer.${field}`] = 'Please enter a valid email address';
        } else {
          delete newErrors[`customer.${field}`];
        }
        break;
      case 'phone':
        if (value && !validatePhone(value as string)) {
          newErrors[`customer.${field}`] = 'Please enter a valid phone number (e.g., 555-123-4567)';
        } else {
          delete newErrors[`customer.${field}`];
        }
        break;
    }

    onUpdateErrors(newErrors);
  };

  const contactOptions = [
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' },
    { label: 'Text Message', value: 'text' },
  ];

  return (
    <View style={styles.container}>
      <FormSection title="Customer Information">
        <View style={styles.nameRow}>
          <FormField
            label="First Name"
            value={customer.firstName}
            onChangeText={(value) => updateCustomerField('firstName', value)}
            placeholder="Enter first name"
            error={errors['customer.firstName']}
            required
            style={styles.nameField}
            autoCapitalize="words"
          />
          <FormField
            label="Last Name"
            value={customer.lastName}
            onChangeText={(value) => updateCustomerField('lastName', value)}
            placeholder="Enter last name"
            error={errors['customer.lastName']}
            required
            style={styles.nameField}
            autoCapitalize="words"
          />
        </View>

        <FormField
          label="Email Address"
          value={customer.email}
          onChangeText={(value) => updateCustomerField('email', value)}
          placeholder="customer@example.com"
          error={errors['customer.email']}
          required
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <FormField
          label="Phone Number"
          value={customer.phone}
          onChangeText={(value) => updateCustomerField('phone', value)}
          placeholder="(555) 123-4567"
          error={errors['customer.phone']}
          required
          keyboardType="phone-pad"
        />

        <FormPicker
          label="Preferred Contact Method"
          value={customer.preferredContact}
          onValueChange={(value) => updateCustomerField('preferredContact', value as CustomerInfo['preferredContact'])}
          options={contactOptions}
          error={errors['customer.preferredContact']}
          required
        />
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
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameField: {
    flex: 1,
  },
});