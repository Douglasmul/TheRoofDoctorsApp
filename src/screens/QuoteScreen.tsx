/**
 * @fileoverview Quote Screen - Complete quote management system
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  BackHandler,
} from 'react-native';
import { 
  useNavigation, 
  useRoute, 
  RouteProp, 
  useFocusEffect 
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { Quote, QuoteFormStep, QuoteFormState } from '../types/quote';
import { QuoteService } from '../services/QuoteService';
import { FormButton } from '../components/FormComponents';
import { theme } from '../theme/theme';

// Import step components (we'll create these next)
import CustomerForm from '../components/quote/CustomerForm';
import PropertyForm from '../components/quote/PropertyForm';
import MaterialsForm from '../components/quote/MaterialsForm';
import MeasurementsForm from '../components/quote/MeasurementsForm';
import QuoteReview from '../components/quote/QuoteReview';
import QuoteFinalize from '../components/quote/QuoteFinalize';

type QuoteScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Quote'>;
type QuoteScreenRouteProp = RouteProp<RootStackParamList, 'Quote'>;

interface Props {
  navigation: QuoteScreenNavigationProp;
  route: QuoteScreenRouteProp;
}

/**
 * Main Quote Screen component
 */
export default function QuoteScreen() {
  const navigation = useNavigation<QuoteScreenNavigationProp>();
  const route = useRoute<QuoteScreenRouteProp>();
  const { measurement, quoteId } = route.params || {};

  const [quoteService] = useState(() => new QuoteService());
  const [formState, setFormState] = useState<QuoteFormState>({
    currentStep: 'customer',
    errors: {},
    isSaving: false,
    isSubmitting: false,
    quote: {},
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Step configuration
  const steps: QuoteFormStep[] = ['customer', 'property', 'materials', 'measurements', 'review', 'finalize'];
  const currentStepIndex = steps.indexOf(formState.currentStep);

  /**
   * Initialize quote data
   */
  useEffect(() => {
    initializeQuote();
  }, []);

  /**
   * Handle measurement data returned from manual measurement
   */
  useEffect(() => {
    const { savedFromMeasurement } = route.params || {};
    if (savedFromMeasurement && measurement) {
      // Update the quote with the measurement data
      updateQuote({
        measurement,
        isManualMeasurement: true,
      });
      
      // Navigate to measurements step to show the results
      setFormState(prev => ({
        ...prev,
        currentStep: 'measurements',
      }));
    }
  }, [route.params?.savedFromMeasurement, measurement]);

  /**
   * Handle back button
   */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (hasUnsavedChanges) {
          Alert.alert(
            'Unsaved Changes',
            'You have unsaved changes. Do you want to save as draft before leaving?',
            [
              { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
              { text: 'Save Draft', onPress: () => handleSaveDraft(true) },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [hasUnsavedChanges])
  );

  /**
   * Initialize quote data based on route params
   */
  const initializeQuote = async () => {
    try {
      let quote: Quote | Partial<Quote>;

      if (quoteId) {
        // Load existing quote
        const existingQuote = await quoteService.getQuoteById(quoteId);
        if (existingQuote) {
          quote = existingQuote;
        } else {
          Alert.alert('Error', 'Quote not found');
          navigation.goBack();
          return;
        }
      } else if (measurement) {
        // Create new quote from measurement
        quote = await quoteService.createQuoteFromMeasurement(measurement);
      } else {
        // Check for draft quote
        const draftQuote = await quoteService.loadDraftQuote();
        if (draftQuote) {
          quote = draftQuote;
        } else {
          quote = quoteService.createBlankQuote();
        }
      }

      setFormState(prev => ({
        ...prev,
        quote,
      }));
    } catch (error) {
      console.error('Error initializing quote:', error);
      Alert.alert('Error', 'Failed to initialize quote');
      navigation.goBack();
    }
  };

  /**
   * Update quote data
   */
  const updateQuote = (updates: Partial<Quote>) => {
    setFormState(prev => ({
      ...prev,
      quote: { ...prev.quote, ...updates },
    }));
    setHasUnsavedChanges(true);
  };

  /**
   * Update form errors
   */
  const updateErrors = (errors: Record<string, string>) => {
    setFormState(prev => ({
      ...prev,
      errors,
    }));
  };

  /**
   * Go to next step
   */
  const goToNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextStep = steps[currentStepIndex + 1];
      setFormState(prev => ({
        ...prev,
        currentStep: nextStep,
        errors: {},
      }));
    }
  };

  /**
   * Go to previous step
   */
  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      const prevStep = steps[currentStepIndex - 1];
      setFormState(prev => ({
        ...prev,
        currentStep: prevStep,
        errors: {},
      }));
    }
  };

  /**
   * Save as draft
   */
  const handleSaveDraft = async (exitAfter = false) => {
    try {
      setFormState(prev => ({ ...prev, isSaving: true }));
      await quoteService.saveDraftQuote(formState.quote);
      setHasUnsavedChanges(false);
      
      if (exitAfter) {
        navigation.goBack();
      } else {
        Alert.alert('Success', 'Quote saved as draft');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      Alert.alert('Error', 'Failed to save draft');
    } finally {
      setFormState(prev => ({ ...prev, isSaving: false }));
    }
  };

  /**
   * Render current step component
   */
  const renderCurrentStep = () => {
    const commonProps = {
      quote: formState.quote,
      errors: formState.errors,
      onUpdateQuote: updateQuote,
      onUpdateErrors: updateErrors,
    };

    switch (formState.currentStep) {
      case 'customer':
        return <CustomerForm {...commonProps} />;
      case 'property':
        return <PropertyForm {...commonProps} />;
      case 'materials':
        return <MaterialsForm {...commonProps} />;
      case 'measurements':
        return <MeasurementsForm {...commonProps} />;
      case 'review':
        return <QuoteReview {...commonProps} />;
      case 'finalize':
        return <QuoteFinalize {...commonProps} />;
      default:
        return <CustomerForm {...commonProps} />;
    }
  };

  /**
   * Get step title
   */
  const getStepTitle = () => {
    switch (formState.currentStep) {
      case 'customer':
        return 'Customer Information';
      case 'property':
        return 'Property Details';
      case 'materials':
        return 'Material Preferences';
      case 'measurements':
        return 'Measurements & Calculations';
      case 'review':
        return 'Quote Review';
      case 'finalize':
        return 'Finalize Quote';
      default:
        return 'Quote';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{getStepTitle()}</Text>
        <Text style={styles.headerSubtitle}>
          Step {currentStepIndex + 1} of {steps.length}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${((currentStepIndex + 1) / steps.length) * 100}%` }
            ]} 
          />
        </View>
      </View>

      {/* Form Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <View style={styles.navigationButtons}>
          {currentStepIndex > 0 && (
            <FormButton
              title="Previous"
              onPress={goToPreviousStep}
              variant="outline"
              style={styles.navigationButton}
            />
          )}
          
          <FormButton
            title="Save Draft"
            onPress={() => handleSaveDraft()}
            variant="secondary"
            style={styles.navigationButton}
            loading={formState.isSaving}
          />

          {currentStepIndex < steps.length - 1 ? (
            <FormButton
              title="Next"
              onPress={goToNextStep}
              style={styles.navigationButton}
            />
          ) : (
            <FormButton
              title="Complete Quote"
              onPress={() => {
                // This will be handled by the QuoteFinalize component
                console.log('Complete quote');
              }}
              style={styles.navigationButton}
              loading={formState.isSubmitting}
            />
          )}
        </View>
      </View>
    </View>
  );
}

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.text + '20',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.text + '20',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  navigationContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.text + '20',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navigationButton: {
    flex: 1,
  },
});