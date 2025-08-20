/**
 * @fileoverview Calibration Screen for professional measurement accuracy
 * Provides guided calibration workflow with reference objects
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import Svg, { Rect, Line, Circle, Text as SvgText } from 'react-native-svg';
import { calibrationService, CalibrationResult } from '../services/CalibrationService';
import { tutorialService } from '../services/TutorialService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CalibrationPoint {
  x: number;
  y: number;
  id: string;
}

interface ReferenceObject {
  id: string;
  name: string;
  size: string;
  description: string;
}

export default function CalibrationScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const navigation = useNavigation();
  
  // Calibration state
  const [selectedReference, setSelectedReference] = useState<ReferenceObject | null>(null);
  const [calibrationPoints, setCalibrationPoints] = useState<CalibrationPoint[]>([]);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationResult, setCalibrationResult] = useState<CalibrationResult | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // UI state
  const [currentStep, setCurrentStep] = useState<'select_reference' | 'position_object' | 'mark_points' | 'review'>('select_reference');
  const overlayOpacity = useRef(new Animated.Value(0.8)).current;

  // Reference objects
  const referenceObjects: ReferenceObject[] = [
    {
      id: 'business_card',
      name: 'Business Card',
      size: '3.5" × 2" (89mm × 51mm)',
      description: 'Standard business card - most accurate for close measurements',
    },
    {
      id: 'credit_card',
      name: 'Credit Card',
      size: '85.6mm × 53.9mm',
      description: 'Standard credit/debit card - good general purpose reference',
    },
    {
      id: 'us_quarter',
      name: 'US Quarter',
      size: '24.3mm diameter',
      description: 'US coin - good for small object calibration',
    },
    {
      id: 'iphone_14',
      name: 'iPhone 14',
      size: '71.5mm × 146.8mm',
      description: 'iPhone 14 - convenient if you have one available',
    },
    {
      id: 'ruler_inch',
      name: '1 Inch Ruler',
      size: '25.4mm',
      description: 'Use a ruler or measuring tape - most accurate option',
    },
  ];

  useEffect(() => {
    initializeCalibration();
  }, []);

  const initializeCalibration = async () => {
    await calibrationService.initialize();
    
    // Check if user wants tutorial
    const userProgress = tutorialService.getUserProgress();
    if (!userProgress.tutorialsCompleted.includes('calibration_tutorial')) {
      setShowTutorial(true);
    }
  };

  const startTutorial = async () => {
    setShowTutorial(false);
    await tutorialService.startTutorial('calibration_tutorial');
    // Tutorial overlay would be implemented here
  };

  const selectReference = (reference: ReferenceObject) => {
    setSelectedReference(reference);
    setCurrentStep('position_object');
    setCalibrationPoints([]);
  };

  const resetCalibration = () => {
    setCalibrationPoints([]);
    setCalibrationResult(null);
    setCurrentStep('select_reference');
    setSelectedReference(null);
  };

  const addCalibrationPoint = (event: any) => {
    if (currentStep !== 'mark_points' || calibrationPoints.length >= 2) return;

    const { locationX, locationY } = event.nativeEvent;
    const newPoint: CalibrationPoint = {
      x: locationX,
      y: locationY,
      id: `point_${Date.now()}`,
    };

    const newPoints = [...calibrationPoints, newPoint];
    setCalibrationPoints(newPoints);

    if (newPoints.length === 2) {
      performCalibration(newPoints);
    }
  };

  const performCalibration = async (points: CalibrationPoint[]) => {
    if (points.length !== 2 || !selectedReference) return;

    setIsCalibrating(true);

    try {
      const pixelWidth = Math.abs(points[1].x - points[0].x);
      const pixelHeight = Math.abs(points[1].y - points[0].y);

      const result = await calibrationService.calibrateWithReference(
        selectedReference.id,
        { width: pixelWidth, height: pixelHeight }
      );

      setCalibrationResult(result);
      setCurrentStep('review');

      if (result.isValid) {
        Alert.alert(
          'Calibration Successful!',
          `Quality Score: ${(result.qualityScore * 100).toFixed(1)}%\n\nYour measurements will now be accurate to real-world scale.`,
          [{ text: 'OK', onPress: () => {} }]
        );
      } else {
        Alert.alert(
          'Calibration Failed',
          `Please try again:\n\n${result.errors.join('\n')}`,
          [
            { text: 'Retry', onPress: () => setCurrentStep('mark_points') },
            { text: 'Change Reference', onPress: resetCalibration },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Calibration Error', 'Please try again with better lighting and steadier hands.');
    } finally {
      setIsCalibrating(false);
    }
  };

  const completeCalibration = () => {
    if (calibrationResult?.isValid) {
      navigation.goBack();
    }
  };

  const renderReferenceSelection = () => (
    <ScrollView style={styles.referenceContainer}>
      <Text style={styles.stepTitle}>Choose Reference Object</Text>
      <Text style={styles.stepDescription}>
        Select an object you have available to calibrate measurements. 
        For best accuracy, choose an object similar in size to what you'll be measuring.
      </Text>
      
      {referenceObjects.map((ref) => (
        <TouchableOpacity
          key={ref.id}
          style={[
            styles.referenceOption,
            selectedReference?.id === ref.id && styles.referenceOptionSelected,
          ]}
          onPress={() => selectReference(ref)}
        >
          <Text style={styles.referenceName}>{ref.name}</Text>
          <Text style={styles.referenceSize}>{ref.size}</Text>
          <Text style={styles.referenceDescription}>{ref.description}</Text>
        </TouchableOpacity>
      ))}
      
      {showTutorial && (
        <TouchableOpacity style={styles.tutorialButton} onPress={startTutorial}>
          <Text style={styles.tutorialButtonText}>📚 Show Calibration Tutorial</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderPositionInstructions = () => (
    <View style={styles.instructionsContainer}>
      <Text style={styles.stepTitle}>Position Reference Object</Text>
      <Text style={styles.stepDescription}>
        Place your {selectedReference?.name} flat on a surface within the camera view. 
        Ensure good lighting and minimal shadows.
      </Text>
      
      <TouchableOpacity
        style={styles.proceedButton}
        onPress={() => setCurrentStep('mark_points')}
      >
        <Text style={styles.proceedButtonText}>Object Positioned ✓</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMarkingInstructions = () => (
    <View style={styles.markingContainer}>
      <Text style={styles.markingTitle}>
        Mark {selectedReference?.name} Corners
      </Text>
      <Text style={styles.markingDescription}>
        Tap precisely on two opposite corners of the {selectedReference?.name}
      </Text>
      <Text style={styles.markingProgress}>
        Points marked: {calibrationPoints.length}/2
      </Text>
    </View>
  );

  const renderCalibrationOverlay = () => (
    <Svg width={screenWidth} height={screenHeight} style={styles.overlay}>
      {/* Grid for reference */}
      {Array.from({ length: 20 }, (_, i) => (
        <Line
          key={`grid-v-${i}`}
          x1={(i * screenWidth) / 20}
          y1={0}
          x2={(i * screenWidth) / 20}
          y2={screenHeight}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1}
        />
      ))}
      {Array.from({ length: 30 }, (_, i) => (
        <Line
          key={`grid-h-${i}`}
          x1={0}
          y1={(i * screenHeight) / 30}
          x2={screenWidth}
          y2={(i * screenHeight) / 30}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={1}
        />
      ))}

      {/* Calibration points */}
      {calibrationPoints.map((point, index) => (
        <Circle
          key={point.id}
          cx={point.x}
          cy={point.y}
          r={10}
          fill="#00ff00"
          stroke="#ffffff"
          strokeWidth={2}
        />
      ))}

      {/* Connection line between points */}
      {calibrationPoints.length === 2 && (
        <Line
          x1={calibrationPoints[0].x}
          y1={calibrationPoints[0].y}
          x2={calibrationPoints[1].x}
          y2={calibrationPoints[1].y}
          stroke="#00ff00"
          strokeWidth={3}
          strokeDasharray="5,5"
        />
      )}

      {/* Reference object outline hint */}
      {currentStep === 'mark_points' && calibrationPoints.length === 0 && (
        <Rect
          x={screenWidth * 0.3}
          y={screenHeight * 0.4}
          width={screenWidth * 0.4}
          height={screenHeight * 0.2}
          fill="none"
          stroke="rgba(255,255,0,0.6)"
          strokeWidth={2}
          strokeDasharray="10,5"
        />
      )}
    </Svg>
  );

  const renderReviewResult = () => (
    <View style={styles.reviewContainer}>
      <Text style={styles.reviewTitle}>Calibration Result</Text>
      
      {calibrationResult && (
        <>
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Quality Score</Text>
            <Text style={[
              styles.resultValue,
              { color: calibrationResult.qualityScore > 0.8 ? '#4CAF50' : 
                       calibrationResult.qualityScore > 0.6 ? '#FF9800' : '#F44336' }
            ]}>
              {(calibrationResult.qualityScore * 100).toFixed(1)}%
            </Text>
          </View>
          
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Scale Factor</Text>
            <Text style={styles.resultValue}>
              {calibrationResult.pixelsPerMeter.toFixed(2)} px/m
            </Text>
          </View>
          
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Reference Used</Text>
            <Text style={styles.resultValue}>{selectedReference?.name}</Text>
          </View>

          {calibrationResult.errors.length > 0 && (
            <View style={styles.errorsContainer}>
              <Text style={styles.errorsTitle}>Issues Found:</Text>
              {calibrationResult.errors.map((error, index) => (
                <Text key={index} style={styles.errorText}>• {error}</Text>
              ))}
            </View>
          )}
        </>
      )}
      
      <View style={styles.reviewActions}>
        <TouchableOpacity style={styles.retryButton} onPress={resetCalibration}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        
        {calibrationResult?.isValid && (
          <TouchableOpacity style={styles.completeButton} onPress={completeCalibration}>
            <Text style={styles.completeButtonText}>Use Calibration</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>Camera permission required for calibration</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera view for positioning and marking steps */}
      {(currentStep === 'position_object' || currentStep === 'mark_points') && (
        <>
          <CameraView
            style={styles.camera}
            facing="back"
            onTouchEnd={currentStep === 'mark_points' ? addCalibrationPoint : undefined}
          />
          {renderCalibrationOverlay()}
        </>
      )}

      {/* Step-specific UI */}
      <View style={styles.uiContainer}>
        {currentStep === 'select_reference' && renderReferenceSelection()}
        {currentStep === 'position_object' && renderPositionInstructions()}
        {currentStep === 'mark_points' && renderMarkingInstructions()}
        {currentStep === 'review' && renderReviewResult()}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Measurement Calibration</Text>
      </View>

      {/* Loading indicator */}
      {isCalibrating && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Calculating calibration...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  uiContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    maxHeight: screenHeight * 0.6,
  },
  referenceContainer: {
    padding: 20,
  },
  stepTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  stepDescription: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  referenceOption: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  referenceOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76,175,80,0.2)',
  },
  referenceName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  referenceSize: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  referenceDescription: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 16,
  },
  tutorialButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    alignItems: 'center',
  },
  tutorialButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  proceedButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 30,
    paddingVertical: 15,
    marginTop: 20,
  },
  proceedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  markingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  markingTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  markingDescription: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  markingProgress: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewContainer: {
    padding: 20,
  },
  reviewTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  resultCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  resultLabel: {
    color: '#ccc',
    fontSize: 14,
  },
  resultValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorsContainer: {
    backgroundColor: 'rgba(244,67,54,0.2)',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  errorsTitle: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginBottom: 4,
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  retryButton: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flex: 0.45,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flex: 0.45,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});