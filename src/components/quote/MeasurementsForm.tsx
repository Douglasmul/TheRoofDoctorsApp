/**
 * @fileoverview Measurements Form component for quote system
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Quote } from '../../types/quote';
import { RoofMeasurement, MaterialCalculation } from '../../types/measurement';
import { FormField, FormSection, FormButton } from '../FormComponents';
import { RoofMeasurementEngine } from '../../services/RoofMeasurementEngine';
import { theme } from '../../theme/theme';

interface Props {
  quote: Partial<Quote>;
  errors: Record<string, string>;
  onUpdateQuote: (updates: Partial<Quote>) => void;
  onUpdateErrors: (errors: Record<string, string>) => void;
}

/**
 * Helper function to get user-friendly plane type name
 */
const getPlaneTypeName = (type: string): string => {
  const typeNames: Record<string, string> = {
    primary: 'Main Roof',
    secondary: 'Secondary Roof',
    dormer: 'Dormer',
    hip: 'Hip',
    chimney: 'Chimney',
    other: 'Other',
    custom: 'Custom Shape',
  };
  return typeNames[type] || 'Unknown';
};

/**
 * Helper function to get color for plane type
 */
const getPlaneTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    primary: '#4CAF50',
    secondary: '#2196F3',
    dormer: '#FF9800',
    hip: '#E91E63',
    chimney: '#9C27B0',
    other: '#607D8B',
    custom: '#795548',
  };
  return colors[type] || '#607D8B';
};

/**
 * Measurements and calculations form component
 */
export default function MeasurementsForm({ quote, errors, onUpdateQuote, onUpdateErrors }: Props) {
  const navigation = useNavigation();
  const [isCalculating, setIsCalculating] = useState(false);
  const [measurementEngine] = useState(() => new RoofMeasurementEngine());
  
  const measurement = quote.measurement;
  const materialCalculation = quote.materialCalculation;

  /**
   * Start enhanced manual measurement workflow with quote context
   */
  const startManualMeasurement = () => {
    // Pass quote context to manual measurement
    navigation.navigate('ManualMeasurement', {
      quoteId: quote.id,
      propertyInfo: quote.property,
      returnScreen: 'QuoteScreen',
      mode: 'quote_integration'
    });
  };

  /**
   * Handle measurement data received from manual measurement
   */
  const handleMeasurementDataReceived = (measurementData: any) => {
    try {
      // Update quote with new measurement data
      const updatedQuote: Partial<Quote> = {
        measurement: measurementData.measurement,
        materialCalculation: measurementData.materialCalculation,
        isManualMeasurement: true,
        measurementValidation: measurementData.validationResult,
      };

      onUpdateQuote(updatedQuote);
      
      // Clear measurement-related errors
      const clearedErrors = { ...errors };
      delete clearedErrors.measurement;
      delete clearedErrors.area;
      delete clearedErrors.materials;
      onUpdateErrors(clearedErrors);

      Alert.alert(
        'Measurement Imported Successfully',
        `Total area: ${measurementData.measurement.totalArea.toFixed(2)} m²\nQuality score: ${measurementData.validationResult.qualityScore}/100`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error processing measurement data:', error);
      Alert.alert('Import Error', 'Failed to import measurement data. Please try again.');
    }
  };

  /**
   * Validate measurement completeness for quote
   */
  const validateMeasurementForQuote = () => {
    if (!measurement) {
      return {
        isValid: false,
        message: 'No measurement data available. Please complete a roof measurement first.'
      };
    }

    if (!measurement.planes || measurement.planes.length === 0) {
      return {
        isValid: false,
        message: 'No roof surfaces measured. Please add at least one roof section.'
      };
    }

    if (measurement.totalArea < 10) {
      return {
        isValid: false,
        message: 'Measured area seems too small. Please verify your measurements.'
      };
    }

    const qualityScore = quote.measurementValidation?.qualityScore || 0;
    if (qualityScore < 60) {
      return {
        isValid: false,
        message: `Measurement quality score is low (${qualityScore}/100). Consider remeasuring for better accuracy.`
      };
    }

    return {
      isValid: true,
      message: 'Measurements are ready for quote generation.'
    };
  };

  /**
   * Recalculate materials based on updated preferences
   */
  const recalculateMaterials = async () => {
    if (!measurement) {
      Alert.alert('No Measurement', 'No measurement data available for calculations.');
      return;
    }

    try {
      setIsCalculating(true);
      const newCalculation = await measurementEngine.calculateMaterials(measurement);
      onUpdateQuote({ materialCalculation: newCalculation });
      Alert.alert('Success', 'Material calculations updated successfully.');
    } catch (error) {
      console.error('Error recalculating materials:', error);
      Alert.alert('Calculation Error', 'Failed to recalculate material requirements.');
    } finally {
      setIsCalculating(false);
    }
  };

  /**
   * Render measurement summary
   */
  const renderMeasurementSummary = () => {
    if (!measurement) {
      return (
        <View style={styles.noMeasurementContainer}>
          <Text style={styles.noMeasurementText}>
            No measurement data available. You can still create a quote with manual measurements.
          </Text>
        </View>
      );
    }

    // Calculate total perimeter from all planes
    const totalPerimeter = measurement.planes.reduce((sum, plane) => sum + (plane.perimeter || 0), 0);

    return (
      <View style={styles.measurementSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Roof Area:</Text>
          <Text style={styles.summaryValue}>
            {measurement.totalArea.toFixed(2)} m² ({(measurement.totalArea * 10.764).toFixed(0)} sq ft)
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Projected Area:</Text>
          <Text style={styles.summaryValue}>
            {measurement.totalProjectedArea.toFixed(2)} m² ({(measurement.totalProjectedArea * 10.764).toFixed(0)} sq ft)
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Perimeter:</Text>
          <Text style={styles.summaryValue}>
            {totalPerimeter.toFixed(1)} m ({(totalPerimeter * 3.281).toFixed(0)} ft)
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Number of Surfaces:</Text>
          <Text style={styles.summaryValue}>{measurement.planes.length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Measurement Accuracy:</Text>
          <Text style={styles.summaryValue}>{(measurement.accuracy * 100).toFixed(1)}%</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Measurement Date:</Text>
          <Text style={styles.summaryValue}>
            {new Date(measurement.timestamp).toLocaleDateString()}
          </Text>
        </View>
        
        {/* Measured Parts Summary */}
        <View style={styles.measuredPartsSection}>
          <Text style={styles.sectionSubtitle}>Measured Parts Summary:</Text>
          {measurement.planes.map((plane, index) => {
            const typeName = getPlaneTypeName(plane.type);
            return (
              <View key={plane.id || index} style={styles.measuredPartItem}>
                <View style={[styles.measuredPartIndicator, { backgroundColor: getPlaneTypeColor(plane.type) }]} />
                <View style={styles.measuredPartContent}>
                  <Text style={styles.measuredPartTitle}>
                    {typeName} #{index + 1}
                  </Text>
                  <Text style={styles.measuredPartDetails}>
                    {plane.area.toFixed(2)} m² ({(plane.area * 10.764).toFixed(0)} sq ft)
                    {plane.perimeter && ` • ${plane.perimeter.toFixed(1)}m perimeter`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  /**
   * Render material calculation results
   */
  const renderMaterialCalculation = () => {
    if (!materialCalculation) {
      return (
        <View style={styles.noCalculationContainer}>
          <Text style={styles.noCalculationText}>
            No material calculations available.
          </Text>
          {measurement && (
            <FormButton
              title="Calculate Materials"
              onPress={recalculateMaterials}
              loading={isCalculating}
              style={styles.calculateButton}
            />
          )}
        </View>
      );
    }

    return (
      <View style={styles.calculationResults}>
        {/* Material Quantities */}
        {materialCalculation.materialSpecific.shingleBundles && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shingle Bundles:</Text>
            <Text style={styles.summaryValue}>{materialCalculation.materialSpecific.shingleBundles}</Text>
          </View>
        )}
        {materialCalculation.materialSpecific.metalSheets && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Metal Sheets:</Text>
            <Text style={styles.summaryValue}>{materialCalculation.materialSpecific.metalSheets}</Text>
          </View>
        )}
        {materialCalculation.materialSpecific.tiles && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Roof Tiles:</Text>
            <Text style={styles.summaryValue}>{materialCalculation.materialSpecific.tiles}</Text>
          </View>
        )}

        {/* Cost Estimate */}
        {materialCalculation.costEstimate && (
          <>
            <View style={styles.separator} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Material Cost:</Text>
              <Text style={styles.summaryValue}>
                ${materialCalculation.costEstimate.materialCost.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Labor Cost:</Text>
              <Text style={styles.summaryValue}>
                ${materialCalculation.costEstimate.laborCost.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.totalLabel]}>Total Estimate:</Text>
              <Text style={[styles.summaryValue, styles.totalValue]}>
                ${materialCalculation.costEstimate.totalCost.toFixed(2)}
              </Text>
            </View>
          </>
        )}

        <FormButton
          title="Recalculate Materials"
          onPress={recalculateMaterials}
          loading={isCalculating}
          variant="secondary"
          style={styles.recalculateButton}
        />
      </View>
    );
  };

  /**
   * Manual measurement input for cases without AR data
   */
  const renderManualMeasurements = () => {
    const manualMeasurements = quote.metadata?.manualMeasurements || {
      totalArea: '',
      roofPitch: '',
      notes: '',
    };

    const updateManualMeasurement = (field: string, value: string) => {
      const updatedMeasurements = { ...manualMeasurements, [field]: value };
      onUpdateQuote({
        metadata: {
          ...quote.metadata,
          manualMeasurements: updatedMeasurements,
        },
      });
    };

    return (
      <FormSection title="Manual Measurements">
        <View style={styles.noMeasurementContainer}>
          <Text style={styles.noMeasurementText}>
            No roof measurement data available. Use our manual measurement tool or enter measurements manually.
          </Text>
        </View>
        
        <FormButton
          title="Start Manual Measurement"
          onPress={startManualMeasurement}
          variant="primary"
          style={styles.startMeasurementButton}
        />
        
        <Text style={styles.orDividerText}>Or enter measurements manually:</Text>
        
        <FormField
          label="Total Roof Area (sq ft)"
          value={manualMeasurements.totalArea}
          onChangeText={(value) => updateManualMeasurement('totalArea', value)}
          placeholder="2500"
          keyboardType="numeric"
          error={errors['manualMeasurements.totalArea']}
        />
        <FormField
          label="Average Roof Pitch (degrees)"
          value={manualMeasurements.roofPitch}
          onChangeText={(value) => updateManualMeasurement('roofPitch', value)}
          placeholder="25"
          keyboardType="numeric"
          error={errors['manualMeasurements.roofPitch']}
        />
        <FormField
          label="Measurement Notes"
          value={manualMeasurements.notes}
          onChangeText={(value) => updateManualMeasurement('notes', value)}
          placeholder="Additional measurement details..."
          multiline
          error={errors['manualMeasurements.notes']}
        />
      </FormSection>
    );
  };

  return (
    <View style={styles.container}>
      <FormSection title="Roof Measurements">
        {renderMeasurementSummary()}
      </FormSection>

      {measurement ? (
        <FormSection title="Material Calculations">
          {renderMaterialCalculation()}
        </FormSection>
      ) : (
        renderManualMeasurements()
      )}
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
  measurementSummary: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.text + '20',
  },
  noMeasurementContainer: {
    backgroundColor: theme.colors.warning + '20',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  noMeasurementText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
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
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  totalLabel: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.text + '20',
    marginVertical: 8,
  },
  calculationResults: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.text + '20',
  },
  noCalculationContainer: {
    backgroundColor: theme.colors.text + '10',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  noCalculationText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  calculateButton: {
    marginTop: 8,
  },
  recalculateButton: {
    marginTop: 16,
  },
  startMeasurementButton: {
    marginVertical: 16,
    backgroundColor: theme.colors.primary,
  },
  orDividerText: {
    fontSize: 14,
    color: theme.colors.text + '80',
    textAlign: 'center',
    marginVertical: 12,
    fontStyle: 'italic',
  },
  // Measured parts styles
  measuredPartsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.text + '20',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  measuredPartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  measuredPartIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  measuredPartContent: {
    flex: 1,
  },
  measuredPartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  measuredPartDetails: {
    fontSize: 12,
    color: theme.colors.text + '80',
    marginTop: 2,
  },
});