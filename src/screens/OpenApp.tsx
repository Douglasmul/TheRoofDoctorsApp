import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COMPANY_INFO } from '../constants/company';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  details: string[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to The Roof Doctors',
    description: 'Professional AR roof measurement made simple',
    icon: '🏠',
    details: [
      'Measure roofs with enterprise-grade accuracy',
      'Generate professional quotes instantly',
      'Streamline your roofing business workflow',
    ],
  },
  {
    id: 'measurement',
    title: 'AR Roof Measurement',
    description: 'Use your device camera to capture precise measurements',
    icon: '📏',
    details: [
      'Point your camera at the roof edges',
      'Walk around the perimeter for complete coverage',
      'AI automatically calculates area and materials',
      'Edit and refine measurements as needed',
    ],
  },
  {
    id: 'quotes',
    title: 'Professional Quotes',
    description: 'Convert measurements into polished customer quotes',
    icon: '💰',
    details: [
      'Automatic material and labor calculations',
      'Customizable pricing and add-ons',
      'Professional PDF export with your branding',
      'Email quotes directly to customers',
    ],
  },
  {
    id: 'features',
    title: 'Enterprise Features',
    description: 'Built for professional roofing contractors',
    icon: '⚡',
    details: [
      'Cloud sync and backup',
      'Measurement history and reporting',
      'Admin panel for team management',
      'Export data in multiple formats',
    ],
  },
];

const { width } = Dimensions.get('window');

export default function OpenAppScreen() {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    navigation.navigate('Home' as never);
  };

  const handleGetStarted = () => {
    navigation.navigate('MeasureRoof' as never);
  };

  if (isCompleted) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.completedContainer}>
          <Text style={styles.completedIcon}>🎉</Text>
          <Text style={styles.completedTitle}>You're All Set!</Text>
          <Text style={styles.completedDescription}>
            Ready to start measuring roofs and creating professional quotes?
          </Text>
          
          <View style={styles.completedActions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleGetStarted}
            >
              <Text style={styles.primaryButtonText}>Start Measuring</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Quote' as never)}
            >
              <Text style={styles.secondaryButtonText}>Create Quote</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.textButton}
              onPress={() => navigation.navigate('Help' as never)}
            >
              <Text style={styles.textButtonText}>View Help & Support</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <View style={styles.container}>
      {/* Header with Progress */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          {ONBOARDING_STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index <= currentStep && styles.progressDotActive
              ]}
            />
          ))}
        </View>
        
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <Text style={styles.stepIcon}>{step.icon}</Text>
        </View>
        
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepDescription}>{step.description}</Text>
        
        <View style={styles.detailsList}>
          {step.details.map((detail, index) => (
            <View key={index} style={styles.detailItem}>
              <Text style={styles.detailBullet}>✓</Text>
              <Text style={styles.detailText}>{detail}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentStep === 0}
        >
          <Text style={[styles.navButtonText, currentStep === 0 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.stepCounter}>
          {currentStep + 1} of {ONBOARDING_STEPS.length}
        </Text>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={handleNext}
        >
          <Text style={styles.navButtonText}>
            {currentStep === ONBOARDING_STEPS.length - 1 ? 'Finish' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fc',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  progressDotActive: {
    backgroundColor: '#234e70',
  },
  skipButton: {
    alignSelf: 'flex-end',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  iconContainer: {
    marginBottom: 24,
  },
  stepIcon: {
    fontSize: 64,
    textAlign: 'center',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#234e70',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 26,
  },
  detailsList: {
    width: '100%',
    maxWidth: 320,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailBullet: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: 'bold',
    marginRight: 12,
    marginTop: 2,
  },
  detailText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#234e70',
    minWidth: 80,
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: '#9ca3af',
  },
  stepCounter: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  // Completion screen styles
  completedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: '100%',
  },
  completedIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  completedTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#234e70',
    textAlign: 'center',
    marginBottom: 16,
  },
  completedDescription: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 26,
  },
  completedActions: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#234e70',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#234e70',
  },
  secondaryButtonText: {
    color: '#234e70',
    fontSize: 16,
    fontWeight: '600',
  },
  textButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  textButtonText: {
    color: '#6b7280',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
