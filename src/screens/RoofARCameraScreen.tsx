/**
 * @fileoverview Enterprise AR Camera Screen for roof measurement
 * Features: AR plane detection, point marking, real-time guidance, accessibility
 * @version 1.0.0
 * @enterprise
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useARPlaneDetection } from '../hooks/useARPlaneDetection';
import { usePitchSensor } from '../hooks/usePitchSensor';
import { RoofMeasurementEngine } from '../services/RoofMeasurementEngine';
import { RoofPlane, ARPoint, QualityMetrics } from '../types/measurement';

/**
 * AR Camera configuration
 */
interface ARCameraConfig {
  /** Enable voice guidance */
  voiceGuidance: boolean;
  /** Enable haptic feedback */
  hapticFeedback: boolean;
  /** Enable high precision mode */
  highPrecisionMode: boolean;
  /** Measurement units */
  units: 'metric' | 'imperial';
  /** Quality threshold for auto-capture */
  autoCapture: boolean;
  /** Guidance language */
  language: 'en' | 'es';
}

/**
 * Measurement state for the session
 */
interface MeasurementSession {
  /** Session ID */
  id: string;
  /** Start timestamp */
  startTime: Date;
  /** Detected points */
  points: ARPoint[];
  /** Current measurement state */
  state: 'initializing' | 'detecting' | 'measuring' | 'complete';
  /** Quality metrics */
  quality: QualityMetrics;
}

/**
 * Quality Indicator Component
 */
interface QualityIndicatorProps {
  label: string;
  status: string;
  score: number;
}

const QualityIndicator: React.FC<QualityIndicatorProps> = ({ label, status, score }) => {
  const getStatusColor = (status: string, score: number) => {
    if (status === 'normal' || status === 'good' || score > 75) return '#4CAF50';
    if (status === 'limited' || status === 'poor' || score > 50) return '#FF9800';
    return '#F44336';
  };

  return (
    <View style={styles.qualityIndicatorContainer}>
      <View style={[
        styles.qualityDot,
        { backgroundColor: getStatusColor(status, score) }
      ]} />
      <Text style={styles.qualityText}>{label}</Text>
      <Text style={styles.qualityScore}>{score}%</Text>
    </View>
  );
};

/**
 * Plane Visualization Component
 */
interface PlaneVisualizationProps {
  plane: RoofPlane;
  index: number;
  units: string;
  onPlaneSelect: () => void;
}

const PlaneVisualization: React.FC<PlaneVisualizationProps> = ({ 
  plane, 
  index, 
  units, 
  onPlaneSelect 
}) => {
  const getPlaneTypeColor = (type: RoofPlane['type']) => {
    const colors = {
      primary: '#4CAF50',
      secondary: '#2196F3',
      dormer: '#FF9800',
      chimney: '#9C27B0',
      other: '#607D8B',
    };
    return colors[type] || colors.other;
  };

  return (
    <TouchableOpacity 
      style={[
        styles.planeOverlay,
        { 
          backgroundColor: `${getPlaneTypeColor(plane.type)}CC`,
          top: 200 + index * 60,
          borderLeftColor: getPlaneTypeColor(plane.type),
        }
      ]}
      onPress={onPlaneSelect}
      accessibilityLabel={`${plane.type} surface ${index + 1}`}
      accessibilityHint={`Area: ${plane.area.toFixed(2)} ${units === 'metric' ? 'square meters' : 'square feet'}`}
    >
      <Text style={styles.planeInfo}>
        {plane.type.charAt(0).toUpperCase() + plane.type.slice(1)} #{index + 1}
      </Text>
      <Text style={styles.planeDetails}>
        {plane.area.toFixed(2)} {units === 'metric' ? 'm²' : 'ft²'}
      </Text>
      <Text style={styles.planeDetails}>
        Pitch: {plane.pitchAngle.toFixed(1)}°
      </Text>
      {plane.material && plane.material !== 'unknown' && (
        <Text style={styles.planeDetails}>
          {plane.material}
        </Text>
      )}
    </TouchableOpacity>
  );
};

/**
 * Default AR camera configuration
 */
const DEFAULT_CONFIG: ARCameraConfig = {
  voiceGuidance: true,
  hapticFeedback: true,
  highPrecisionMode: true,
  units: 'metric',
  autoCapture: false,
  language: 'en',
};

/**
 * Enterprise AR Camera Screen for roof measurement
 * 
 * Features:
 * - Real-time AR plane detection
 * - Point marking with confidence visualization
 * - Real-time pitch measurement display
 * - Voice guidance and accessibility support
 * - Quality monitoring and feedback
 * - Enterprise audit logging
 * 
 * @returns JSX.Element - AR camera interface
 */
export default function RoofARCameraScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [config] = useState<ARCameraConfig>(DEFAULT_CONFIG);
  
  // Camera and permissions
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  
  // Measurement state
  const [session, setSession] = useState<MeasurementSession>({
    id: `session_${Date.now()}`,
    startTime: new Date(),
    points: [],
    state: 'initializing',
    quality: {
      overallScore: 0,
      trackingStability: 0,
      pointDensity: 0,
      duration: 0,
      trackingInterruptions: 0,
      lightingQuality: 0,
      movementSmoothness: 0,
    },
  });

  // Hooks for AR and sensors
  const arPlaneDetection = useARPlaneDetection({
    minPlaneArea: 1.0,
    sensitivity: config.highPrecisionMode ? 'high' : 'medium',
    minConfidence: 0.7,
  });

  const pitchSensor = usePitchSensor({
    updateInterval: config.highPrecisionMode ? 50 : 100,
    fusionMethod: 'complementary',
    autoCalibration: true,
  });

  // Measurement engine
  const measurementEngine = useRef(new RoofMeasurementEngine({
    unitSystem: config.units,
    areaPrecision: config.highPrecisionMode ? 3 : 2,
    pitchCorrectionMethod: 'advanced',
    geometryValidation: true,
  }));

  /**
   * Announce message to accessibility users
   * Stable callback with no dependencies - defined early to avoid declaration order issues
   */
  const announceToAccessibility = useCallback((message: string) => {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(message);
    }
    // TODO: Add TTS for Android using expo-speech
  }, []);

  // UI state
  const [showInstructions, setShowInstructions] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPlanes, setCapturedPlanes] = useState<RoofPlane[]>([]);

  /**
   * Get step-by-step instructions based on current state
   */
  const getStepInstruction = useCallback((state: string, planeCount: number): string => {
    switch (state) {
      case 'initializing':
        return 'Initializing AR system... Please wait';
      case 'detecting':
        return 'Point camera at roof surface to detect planes';
      case 'measuring':
        if (planeCount === 0) {
          return 'Move closer to roof surface and tap to mark first corner';
        } else if (planeCount < 3) {
          return `${planeCount} surface(s) detected. Continue mapping the roof`;
        } else {
          return 'Good progress! Continue or tap Complete when finished';
        }
      case 'complete':
        return 'Measurement complete! Review your results';
      default:
        return 'Point camera at roof and follow on-screen guidance';
    }
  }, []);

  /**
   * Get status text with better formatting
   */
  const getStatusText = useCallback((state: string): string => {
    const statusMap = {
      'initializing': 'Starting Up',
      'detecting': 'Scanning',
      'measuring': 'Measuring',
      'complete': 'Complete',
    };
    return statusMap[state as keyof typeof statusMap] || 'Ready';
  }, []);

  /**
   * Get status color based on state
   */
  const getStatusColor = useCallback((state: string) => {
    const colorMap = {
      'initializing': { color: '#FF9800' },
      'detecting': { color: '#2196F3' },
      'measuring': { color: '#4CAF50' },
      'complete': { color: '#8BC34A' },
    };
    return colorMap[state as keyof typeof colorMap] || { color: '#9E9E9E' };
  }, []);

  /**
   * Calculate measurement progress
   */
  const getProgress = useCallback((): number => {
    const baseProgress = {
      'initializing': 10,
      'detecting': 25,
      'measuring': 50,
      'complete': 100,
    };
    
    const stateProgress = baseProgress[session.state as keyof typeof baseProgress] || 0;
    const planeProgress = Math.min(40, capturedPlanes.length * 10);
    
    return Math.min(100, stateProgress + planeProgress);
  }, [session.state, capturedPlanes.length]);

  /**
   * Get accuracy color based on level
   */
  const getAccuracyColor = useCallback((accuracy: string) => {
    const colorMap = {
      'high': { color: '#4CAF50' },
      'medium': { color: '#FF9800' },
      'low': { color: '#F44336' },
    };
    return colorMap[accuracy as keyof typeof colorMap] || { color: '#9E9E9E' };
  }, []);

  /**
   * Handle plane selection for editing
   */
  const handlePlaneSelect = useCallback((planeId: string) => {
    // TODO: Implement plane editing functionality
    console.log('Selected plane:', planeId);
    
    if (config.voiceGuidance) {
      const plane = capturedPlanes.find(p => p.id === planeId);
      if (plane) {
        announceToAccessibility(`Selected ${plane.type} surface with area ${plane.area.toFixed(1)} square ${config.units === 'metric' ? 'meters' : 'feet'}`);
      }
    }
  }, [capturedPlanes, config.voiceGuidance, config.units, announceToAccessibility]);

  /**
   * Enhanced camera ready handler with voice guidance
   */
  const onCameraReady = useCallback(() => {
    setCameraReady(true);
    console.log('Camera ready for AR measurement');
    
    // Initialize AR session
    initializeARSession();
    
    if (config.voiceGuidance) {
      announceToAccessibility('Camera ready. Point device at roof surface to begin measurement.');
    }
    
    if (config.hapticFeedback) {
      Vibration.vibrate(50);
    }
  }, [initializeARSession, config.voiceGuidance, config.hapticFeedback, announceToAccessibility]);

  /**
   * Request camera permissions  
   * Dependencies: stable requestPermission callback
   */
  const requestPermissions = useCallback(async () => {
    try {
      const result = await requestPermission();
      if (!result?.granted) {
        Alert.alert(
          'Camera Permission Required',
          'This app needs camera access to measure roofs using AR technology.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', style: 'default', onPress: () => {} }, // TODO: Open settings
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
    }
  }, [requestPermission]);

  /**
   * Initialize AR session
   * Dependencies: specific methods instead of entire hook objects to avoid instability
   */
  const initializeARSession = useCallback(async () => {
    try {
      console.log('[AR Camera] Initializing AR session...');
      setSession(prev => ({ ...prev, state: 'detecting' }));
      
      // Start AR plane detection
      await arPlaneDetection.startDetection();
      
      // Start pitch sensor
      await pitchSensor.startMeasuring();
      
      console.log('[AR Camera] AR session initialized successfully, now in detecting state');
      
      // Announce to accessibility users
      if (config.voiceGuidance) {
        announceToAccessibility('AR measurement initialized. Point camera at roof surface.');
      }

      // Haptic feedback
      if (config.hapticFeedback) {
        Vibration.vibrate(100);
      }

    } catch (error) {
      console.error('Error initializing AR session:', error);
      Alert.alert('AR Error', 'Failed to initialize AR measurement system.', [
        { text: 'OK', style: 'default' }
      ]);
    }
  }, [arPlaneDetection.startDetection, pitchSensor.startMeasuring, config.voiceGuidance, config.hapticFeedback, announceToAccessibility]);

  /**
   * Handle plane detection updates
   * Dependencies: only arPlaneDetection.state.planes to avoid infinite render cycle
   * capturedPlanes.length is not included since this effect updates capturedPlanes
   */
  useEffect(() => {
    if (arPlaneDetection.state.planes.length > 0) {
      const newPlanes = arPlaneDetection.state.planes;
      console.log(`[AR Camera] Detected ${newPlanes.length} planes, transitioning to measuring state`);
      
      setCapturedPlanes(prevPlanes => {
        // Voice guidance for new plane
        if (config.voiceGuidance && newPlanes.length > prevPlanes.length) {
          const newPlaneCount = newPlanes.length - prevPlanes.length;
          announceToAccessibility(`${newPlaneCount} new roof surface${newPlaneCount > 1 ? 's' : ''} detected.`);
        }

        // Haptic feedback for new plane
        if (config.hapticFeedback && newPlanes.length > prevPlanes.length) {
          Vibration.vibrate([50, 50, 50]);
        }
        
        return newPlanes;
      });
      
      // Update session state
      setSession(prev => ({
        ...prev,
        state: 'measuring',
        quality: arPlaneDetection.state.qualityMetrics,
      }));
    }
  }, [arPlaneDetection.state.planes, config.voiceGuidance, config.hapticFeedback, announceToAccessibility]);

  /**
   * Handle point capture
   * Dependencies: stable callback references to avoid recreation on every render
   */
  const capturePoint = useCallback(async (x: number, y: number) => {
    if (!cameraReady || session.state !== 'measuring') return;

    try {
      setIsCapturing(true);

      // Get current pitch measurement
      const currentPitch = pitchSensor.state.measurement;
      if (!currentPitch) {
        Alert.alert('Sensor Error', 'Unable to get device orientation. Please ensure device is stable.', [
          { text: 'OK', style: 'default' }
        ]);
        return;
      }

      // Create AR point
      const point: ARPoint = {
        x: x, // Convert screen coordinates to world coordinates
        y: y,
        z: 0, // TODO: Calculate from AR depth
        confidence: currentPitch.confidence,
        timestamp: new Date(),
        sensorAccuracy: currentPitch.accuracy,
      };

      // Add point to session
      setSession(prev => ({
        ...prev,
        points: [...prev.points, point],
      }));

      // Voice guidance
      if (config.voiceGuidance) {
        announceToAccessibility(`Point captured. ${session.points.length + 1} points total.`);
      }

      // Haptic feedback
      if (config.hapticFeedback) {
        Vibration.vibrate(100);
      }

    } catch (error) {
      console.error('Error capturing point:', error);
      Alert.alert('Capture Error', 'Failed to capture measurement point.', [
        { text: 'OK', style: 'default' }
      ]);
    } finally {
      setIsCapturing(false);
    }
  }, [cameraReady, session.state, session.points.length, pitchSensor.state.measurement, config.voiceGuidance, config.hapticFeedback, announceToAccessibility]);

  /**
   * Complete measurement session
   * Dependencies: specific values and stable methods instead of unstable objects
   */
  const completeMeasurement = useCallback(async () => {
    if (capturedPlanes.length === 0) {
      Alert.alert('No Measurements', 'Please capture at least one roof surface before completing.', [
        { text: 'OK', style: 'default' }
      ]);
      return;
    }

    try {
      setSession(prev => ({ ...prev, state: 'complete' }));

      // Stop AR detection
      arPlaneDetection.stopDetection();
      pitchSensor.stopMeasuring();

      // Calculate final measurement
      const measurement = await measurementEngine.current.calculateRoofMeasurement(
        capturedPlanes,
        session.id,
        'current_user' // TODO: Get from auth context
      );

      // Navigate to review screen with measurement data
      navigation.navigate('MeasurementReview', { measurement });

      // Voice guidance
      if (config.voiceGuidance) {
        announceToAccessibility('Measurement complete. Navigating to review screen.');
      }

    } catch (error) {
      console.error('Error completing measurement:', error);
      Alert.alert('Calculation Error', 'Failed to calculate roof measurements.', [
        { text: 'OK', style: 'default' }
      ]);
    }
  }, [capturedPlanes, session.id, arPlaneDetection.stopDetection, pitchSensor.stopMeasuring, navigation, config.voiceGuidance, announceToAccessibility]);

  /**
   * Reset measurement session
   * Dependencies: specific methods instead of entire hook objects
   */
  const resetMeasurement = useCallback(() => {
    Alert.alert(
      'Reset Measurement',
      'Are you sure you want to start over? All captured data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            arPlaneDetection.resetPlanes();
            setCapturedPlanes([]);
            setSession(prev => ({
              ...prev,
              points: [],
              state: 'detecting',
            }));
            
            if (config.voiceGuidance) {
              announceToAccessibility('Measurement reset. Ready to start new measurement.');
            }
          },
        },
      ]
    );
  }, [arPlaneDetection.resetPlanes, config.voiceGuidance, announceToAccessibility]);

  /**
   * Handle screen tap for point capture
   */
  const onScreenTap = useCallback((event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    capturePoint(locationX, locationY);
  }, [capturePoint]);

  // Request permissions on mount - runs only once when permission status changes
  useEffect(() => {
    if (!permission?.granted) {
      requestPermissions();
    }
  }, [permission?.granted, requestPermissions]);

  // Cleanup on unmount - using specific method references instead of entire hook objects
  useEffect(() => {
    return () => {
      arPlaneDetection.stopDetection();
      pitchSensor.stopMeasuring();
    };
  }, [arPlaneDetection.stopDetection, pitchSensor.stopMeasuring]);

  // Permission states
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>No access to camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Request Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* AR Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onCameraReady={onCameraReady}
          onTouchEnd={onScreenTap}
        />
        
        {/* Advanced AR Overlay */}
        <View style={styles.overlay}>
          {/* Dynamic Instructions */}
          {showInstructions && (
            <View style={styles.instructions}>
              <Text style={styles.instructionText}>
                {getStepInstruction(session.state, capturedPlanes.length)}
              </Text>
              <TouchableOpacity 
                style={styles.dismissButton}
                onPress={() => setShowInstructions(false)}
                accessibilityLabel="Dismiss instructions"
              >
                <Text style={styles.dismissButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Enhanced Status Display */}
          <View style={styles.statusOverlay}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status: </Text>
              <Text style={[styles.statusValue, getStatusColor(session.state)]}>
                {getStatusText(session.state)}
              </Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Progress: </Text>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${getProgress()}%` }]} />
                <Text style={styles.progressText}>{getProgress()}%</Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Surfaces: </Text>
              <Text style={styles.statusValue}>{capturedPlanes.length}</Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Points: </Text>
              <Text style={styles.statusValue}>{session.points.length}</Text>
            </View>
            
            {/* Real-time Pitch Display */}
            {pitchSensor.state.measurement && (
              <View style={styles.pitchDisplay}>
                <Text style={styles.pitchText}>
                  Pitch: {pitchSensor.state.measurement.pitch.toFixed(1)}°
                </Text>
                <Text style={[styles.confidenceText, getAccuracyColor(pitchSensor.state.measurement.accuracy)]}>
                  Accuracy: {pitchSensor.state.measurement.accuracy}
                </Text>
              </View>
            )}

            {/* Enhanced Quality Indicators */}
            <View style={styles.qualityIndicators}>
              <QualityIndicator 
                label="AR Tracking"
                status={arPlaneDetection.state.trackingState}
                score={arPlaneDetection.state.qualityMetrics.trackingStability}
              />
              <QualityIndicator 
                label="Lighting"
                status={arPlaneDetection.state.qualityMetrics.lightingQuality > 60 ? 'good' : 'poor'}
                score={arPlaneDetection.state.qualityMetrics.lightingQuality}
              />
              <QualityIndicator 
                label="Stability"
                status={arPlaneDetection.state.qualityMetrics.movementSmoothness > 70 ? 'good' : 'poor'}
                score={arPlaneDetection.state.qualityMetrics.movementSmoothness}
              />
            </View>
          </View>

          {/* Real-time Plane Visualizations */}
          {capturedPlanes.map((plane, index) => (
            <PlaneVisualization 
              key={plane.id}
              plane={plane}
              index={index}
              units={config.units}
              onPlaneSelect={() => handlePlaneSelect(plane.id)}
            />
          ))}

          {/* Crosshair for targeting */}
          <View style={styles.crosshair}>
            <View style={styles.crosshairHorizontal} />
            <View style={styles.crosshairVertical} />
          </View>

          {/* Live measurement feedback */}
          {isCapturing && (
            <View style={styles.captureOverlay}>
              <Text style={styles.captureText}>Capturing...</Text>
              <View style={styles.captureProgress}>
                <View style={[styles.captureProgressBar, { width: '60%' }]} />
              </View>
            </View>
          )}

          {/* Error/Warning Messages */}
          {arPlaneDetection.state.error && (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorText}>{arPlaneDetection.state.error}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <TouchableOpacity
          style={[styles.controlButton, styles.resetButton]}
          onPress={resetMeasurement}
          accessibilityLabel="Reset measurement"
          accessibilityHint="Clears all captured measurements and starts over"
        >
          <Text style={styles.controlButtonText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.captureButton, isCapturing && styles.captureButtonActive]}
          onPress={() => {/* Manual capture mode */}}
          disabled={isCapturing}
          accessibilityLabel="Capture mode"
          accessibilityHint="Enables manual point capture mode"
        >
          <Text style={styles.controlButtonText}>
            {isCapturing ? 'Capturing...' : 'Capture'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.completeButton]}
          onPress={completeMeasurement}
          disabled={capturedPlanes.length === 0}
          accessibilityLabel="Complete measurement"
          accessibilityHint="Finishes measurement and calculates results"
        >
          <Text style={styles.controlButtonText}>Complete</Text>
        </TouchableOpacity>
      </View>

      {/* Accessibility Announcements */}
      <Text
        style={styles.accessibilityAnnouncement}
        accessibilityLiveRegion="polite"
        accessible={false}
      >
        {session.state === 'measuring' && capturedPlanes.length > 0 
          ? `${capturedPlanes.length} roof surfaces detected`
          : 'Point camera at roof to begin measurement'
        }
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  instructions: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    flex: 1,
  },
  dismissButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  dismissButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusOverlay: {
    position: 'absolute',
    top: 120,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
  },
  statusLabel: {
    color: 'white',
    fontSize: 14,
    marginBottom: 2,
  },
  pitchDisplay: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    paddingTop: 8,
  },
  pitchText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confidenceText: {
    color: '#FFF',
    fontSize: 12,
  },
  qualityIndicators: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginTop: 5,
  },
  qualityIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  qualityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  qualityText: {
    color: 'white',
    fontSize: 12,
    flex: 1,
  },
  qualityScore: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  statusLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusValue: {
    color: 'white',
    fontSize: 12,
  },
  progressContainer: {
    flex: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    marginLeft: 8,
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  progressText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: 'white',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 16,
  },
  planeOverlay: {
    position: 'absolute',
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  planeInfo: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  planeDetails: {
    color: '#666',
    fontSize: 12,
    marginBottom: 1,
  },
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 40,
    height: 40,
    marginTop: -20,
    marginLeft: -20,
  },
  crosshairHorizontal: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginTop: -1,
  },
  crosshairVertical: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginLeft: -1,
  },
  captureOverlay: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    marginTop: -40,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  captureText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  captureProgress: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  captureProgressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  controlPanel: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  controlButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#FF5722',
  },
  captureButton: {
    backgroundColor: '#2196F3',
  },
  captureButtonActive: {
    backgroundColor: '#FF9800',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  accessibilityAnnouncement: {
    position: 'absolute',
    opacity: 0,
    height: 0,
  },
});

// TODO: Integrate with GLView for 3D plane visualization
// TODO: Add real-time material detection overlay
// TODO: Implement advanced gesture controls for precise point placement
// TODO: Add support for measurement templates and presets
// TODO: Integrate with external laser measurement devices
// TODO: Add real-time collaboration features for team measurements
// TODO: Implement automated roof edge detection using computer vision
// TODO: Add support for complex roof geometry (valleys, hips, dormers)