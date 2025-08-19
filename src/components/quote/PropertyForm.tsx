/**
 * @fileoverview Property Form component for quote system
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Quote, PropertyInfo } from '../../types/quote';
import { FormField, FormPicker, FormSection } from '../FormComponents';

interface Props {
  quote: Partial<Quote>;
  errors: Record<string, string>;
  onUpdateQuote: (updates: Partial<Quote>) => void;
  onUpdateErrors: (errors: Record<string, string>) => void;
}

/**
 * Property information form component
 */
export default function PropertyForm({ quote, errors, onUpdateQuote, onUpdateErrors }: Props) {
  const property = quote.property || {
    address: '',
    city: '',
    state: '',
    zipCode: '',
    propertyType: 'residential',
    stories: 1,
    yearBuilt: undefined,
    roofAge: undefined,
  };

  /**
   * Update property field
   */
  const updatePropertyField = <K extends keyof PropertyInfo>(
    field: K,
    value: PropertyInfo[K]
  ) => {
    const updatedProperty = { ...property, [field]: value };
    onUpdateQuote({ property: updatedProperty });
    
    // Clear error for this field
    if (errors[`property.${field}`]) {
      const newErrors = { ...errors };
      delete newErrors[`property.${field}`];
      onUpdateErrors(newErrors);
    }
  };

  /**
   * Validate ZIP code format
   */
  const validateZipCode = (zipCode: string) => {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zipCode);
  };

  /**
   * Handle field blur for validation
   */
  const handleFieldBlur = (field: keyof PropertyInfo) => {
    const value = property[field];
    const newErrors = { ...errors };

    switch (field) {
      case 'zipCode':
        if (value && !validateZipCode(value as string)) {
          newErrors[`property.${field}`] = 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)';
        } else {
          delete newErrors[`property.${field}`];
        }
        break;
      case 'yearBuilt':
        const currentYear = new Date().getFullYear();
        const year = parseInt(value as string);
        if (value && (isNaN(year) || year < 1800 || year > currentYear)) {
          newErrors[`property.${field}`] = `Please enter a valid year between 1800 and ${currentYear}`;
        } else {
          delete newErrors[`property.${field}`];
        }
        break;
      case 'roofAge':
        const age = parseInt(value as string);
        if (value && (isNaN(age) || age < 0 || age > 100)) {
          newErrors[`property.${field}`] = 'Please enter a valid roof age between 0 and 100 years';
        } else {
          delete newErrors[`property.${field}`];
        }
        break;
    }

    onUpdateErrors(newErrors);
  };

  const propertyTypeOptions = [
    { label: 'Residential', value: 'residential' },
    { label: 'Commercial', value: 'commercial' },
    { label: 'Industrial', value: 'industrial' },
  ];

  const storiesOptions = [
    { label: '1 Story', value: '1' },
    { label: '2 Stories', value: '2' },
    { label: '3 Stories', value: '3' },
    { label: '4+ Stories', value: '4' },
  ];

  return (
    <View style={styles.container}>
      <FormSection title="Property Address">
        <FormField
          label="Street Address"
          value={property.address}
          onChangeText={(value) => updatePropertyField('address', value)}
          placeholder="123 Main Street"
          error={errors['property.address']}
          required
          autoCapitalize="words"
        />

        <View style={styles.locationRow}>
          <FormField
            label="City"
            value={property.city}
            onChangeText={(value) => updatePropertyField('city', value)}
            placeholder="City"
            error={errors['property.city']}
            required
            style={styles.cityField}
            autoCapitalize="words"
          />
          <FormField
            label="State"
            value={property.state}
            onChangeText={(value) => updatePropertyField('state', value)}
            placeholder="CA"
            error={errors['property.state']}
            required
            style={styles.stateField}
            autoCapitalize="characters"
          />
          <FormField
            label="ZIP Code"
            value={property.zipCode}
            onChangeText={(value) => updatePropertyField('zipCode', value)}
            placeholder="12345"
            error={errors['property.zipCode']}
            required
            style={styles.zipField}
            keyboardType="numeric"
          />
        </View>
      </FormSection>

      <FormSection title="Property Details">
        <FormPicker
          label="Property Type"
          value={property.propertyType}
          onValueChange={(value) => updatePropertyField('propertyType', value as PropertyInfo['propertyType'])}
          options={propertyTypeOptions}
          error={errors['property.propertyType']}
          required
        />

        <FormPicker
          label="Number of Stories"
          value={property.stories.toString()}
          onValueChange={(value) => updatePropertyField('stories', parseInt(value))}
          options={storiesOptions}
          error={errors['property.stories']}
          required
        />

        <View style={styles.optionalRow}>
          <FormField
            label="Year Built"
            value={property.yearBuilt?.toString() || ''}
            onChangeText={(value) => updatePropertyField('yearBuilt', value ? parseInt(value) : undefined)}
            placeholder="1995"
            error={errors['property.yearBuilt']}
            style={styles.optionalField}
            keyboardType="numeric"
          />
          <FormField
            label="Current Roof Age (years)"
            value={property.roofAge?.toString() || ''}
            onChangeText={(value) => updatePropertyField('roofAge', value ? parseInt(value) : undefined)}
            placeholder="10"
            error={errors['property.roofAge']}
            style={styles.optionalField}
            keyboardType="numeric"
          />
        </View>
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
  locationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cityField: {
    flex: 2,
  },
  stateField: {
    flex: 1,
  },
  zipField: {
    flex: 1,
  },
  optionalRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionalField: {
    flex: 1,
  },
});