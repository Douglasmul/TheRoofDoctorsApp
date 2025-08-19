/**
 * @fileoverview Materials Form component for quote system
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Quote, MaterialPreferences } from '../../types/quote';
import { FormField, FormPicker, FormSection } from '../FormComponents';
import { theme } from '../../theme/theme';

interface Props {
  quote: Partial<Quote>;
  errors: Record<string, string>;
  onUpdateQuote: (updates: Partial<Quote>) => void;
  onUpdateErrors: (errors: Record<string, string>) => void;
}

/**
 * Material preferences form component
 */
export default function MaterialsForm({ quote, errors, onUpdateQuote, onUpdateErrors }: Props) {
  const materialPreferences = quote.materialPreferences || {
    materialType: 'shingle',
    materialBrand: '',
    color: '',
    warrantyYears: 25,
    features: [],
  };

  /**
   * Update material preferences field
   */
  const updateMaterialField = <K extends keyof MaterialPreferences>(
    field: K,
    value: MaterialPreferences[K]
  ) => {
    const updatedPreferences = { ...materialPreferences, [field]: value };
    onUpdateQuote({ materialPreferences: updatedPreferences });
    
    // Clear error for this field
    if (errors[`materialPreferences.${field}`]) {
      const newErrors = { ...errors };
      delete newErrors[`materialPreferences.${field}`];
      onUpdateErrors(newErrors);
    }
  };

  /**
   * Toggle feature selection
   */
  const toggleFeature = (feature: string) => {
    const currentFeatures = materialPreferences.features || [];
    const updatedFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter(f => f !== feature)
      : [...currentFeatures, feature];
    
    updateMaterialField('features', updatedFeatures);
  };

  const materialTypeOptions = [
    { label: 'Asphalt Shingles', value: 'shingle' },
    { label: 'Metal Roofing', value: 'metal' },
    { label: 'Clay/Concrete Tiles', value: 'tile' },
    { label: 'Flat/Built-up Roofing', value: 'flat' },
  ];

  const warrantyOptions = [
    { label: '10 Years', value: '10' },
    { label: '15 Years', value: '15' },
    { label: '20 Years', value: '20' },
    { label: '25 Years', value: '25' },
    { label: '30 Years', value: '30' },
    { label: 'Lifetime', value: '50' },
  ];

  const getShingleBrands = () => [
    { label: 'GAF', value: 'gaf' },
    { label: 'Owens Corning', value: 'owens-corning' },
    { label: 'CertainTeed', value: 'certainteed' },
    { label: 'IKO', value: 'iko' },
    { label: 'Atlas', value: 'atlas' },
    { label: 'Other', value: 'other' },
  ];

  const getMetalBrands = () => [
    { label: 'ATAS International', value: 'atas' },
    { label: 'DECRA Metal Roofing', value: 'decra' },
    { label: 'Metal Sales', value: 'metal-sales' },
    { label: 'Englert', value: 'englert' },
    { label: 'MBCI', value: 'mbci' },
    { label: 'Other', value: 'other' },
  ];

  const getTileBrands = () => [
    { label: 'Eagle Roofing Products', value: 'eagle' },
    { label: 'Boral', value: 'boral' },
    { label: 'DECRA Villa Tile', value: 'decra-villa' },
    { label: 'Entegra', value: 'entegra' },
    { label: 'Hanson Roof Tile', value: 'hanson' },
    { label: 'Other', value: 'other' },
  ];

  const getFlatBrands = () => [
    { label: 'GAF', value: 'gaf-commercial' },
    { label: 'Firestone', value: 'firestone' },
    { label: 'Carlisle SynTec', value: 'carlisle' },
    { label: 'Johns Manville', value: 'johns-manville' },
    { label: 'Sika Sarnafil', value: 'sika' },
    { label: 'Other', value: 'other' },
  ];

  const getBrandOptions = () => {
    switch (materialPreferences.materialType) {
      case 'metal':
        return getMetalBrands();
      case 'tile':
        return getTileBrands();
      case 'flat':
        return getFlatBrands();
      default:
        return getShingleBrands();
    }
  };

  const availableFeatures = [
    'Impact Resistant',
    'Energy Efficient',
    'Algae Resistant',
    'Fire Resistant',
    'Wind Resistant',
    'Cool Roof Technology',
    'Solar Ready',
    'Premium Warranty',
  ];

  const getColorOptions = () => {
    switch (materialPreferences.materialType) {
      case 'metal':
        return ['Charcoal Gray', 'Galvalume', 'Copper', 'Forest Green', 'Burgundy', 'Custom Color'];
      case 'tile':
        return ['Terracotta', 'Mission Red', 'Charcoal', 'Antique Bronze', 'Slate Gray', 'Custom Color'];
      case 'flat':
        return ['White', 'Light Gray', 'Tan', 'Green', 'Custom Color'];
      default:
        return ['Charcoal', 'Weathered Wood', 'Oyster Gray', 'Slate', 'Aged Copper', 'Custom Color'];
    }
  };

  return (
    <View style={styles.container}>
      <FormSection title="Material Selection">
        <FormPicker
          label="Roofing Material Type"
          value={materialPreferences.materialType}
          onValueChange={(value) => updateMaterialField('materialType', value as MaterialPreferences['materialType'])}
          options={materialTypeOptions}
          error={errors['materialPreferences.materialType']}
          required
        />

        <FormPicker
          label="Preferred Brand"
          value={materialPreferences.materialBrand || ''}
          onValueChange={(value) => updateMaterialField('materialBrand', value)}
          options={getBrandOptions()}
          error={errors['materialPreferences.materialBrand']}
        />

        <FormPicker
          label="Color Preference"
          value={materialPreferences.color || ''}
          onValueChange={(value) => updateMaterialField('color', value)}
          options={getColorOptions().map(color => ({ label: color, value: color.toLowerCase().replace(/\s+/g, '-') }))}
          error={errors['materialPreferences.color']}
        />

        <FormPicker
          label="Warranty Period"
          value={materialPreferences.warrantyYears.toString()}
          onValueChange={(value) => updateMaterialField('warrantyYears', parseInt(value))}
          options={warrantyOptions}
          error={errors['materialPreferences.warrantyYears']}
          required
        />
      </FormSection>

      <FormSection title="Additional Features">
        <Text style={styles.featuresDescription}>
          Select any additional features you'd like to include:
        </Text>
        <View style={styles.featuresGrid}>
          {availableFeatures.map((feature) => {
            const isSelected = materialPreferences.features?.includes(feature) || false;
            return (
              <TouchableOpacity
                key={feature}
                style={[
                  styles.featureChip,
                  isSelected && styles.featureChipSelected,
                ]}
                onPress={() => toggleFeature(feature)}
              >
                <Text
                  style={[
                    styles.featureChipText,
                    isSelected && styles.featureChipTextSelected,
                  ]}
                >
                  {feature}
                </Text>
              </TouchableOpacity>
            );
          })}
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
  featuresDescription: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'white',
  },
  featureChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  featureChipText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  featureChipTextSelected: {
    color: 'white',
  },
});