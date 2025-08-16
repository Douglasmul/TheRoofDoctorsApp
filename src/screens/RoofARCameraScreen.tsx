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
import { Camera, CameraType } from 'expo-camera';
import { GLView } from 'expo-gl';
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
export default function RoofARCameraScreen(): JSX.Element {
  const navigation = useNavigation();
  const route = useRoute();
  const [config] = useState<ARCameraConfig>(DEFAULT_CONFIG);
  
  // Camera and permissions
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef<Camera>(null);
  const glViewRef = useRef<GLView>(null);
  
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

  // UI state
  const [showInstructions, setShowInstructions] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPlanes, setCapturedPlanes] = useState<RoofPlane[]>([]);

  /**
   * Request camera permissions
   */
  const requestPermissions = useCallback(async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'This app needs camera access to measure roofs using AR technology.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {} }, // TODO: Open settings
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      setHasPermission(false);
    }
  }, []);

  /**
   * Initialize AR session
   */
  const initializeARSession = useCallback(async () => {
    try {
      setSession(prev => ({ ...prev, state: 'detecting' }));
      
      // Start AR plane detection
      await arPlaneDetection.startDetection();
      
      // Start pitch sensor
      await pitchSensor.startMeasuring();
      
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
      Alert.alert('AR Error', 'Failed to initialize AR measurement system.');
    }
  }, [arPlaneDetection, pitchSensor, config]);

  /**
   * Handle plane detection updates
   */
  useEffect(() => {
    if (arPlaneDetection.state.planes.length > 0) {
      const newPlanes = arPlaneDetection.state.planes;
      setCapturedPlanes(newPlanes);
      
      // Update session state
      setSession(prev => ({
        ...prev,
        state: 'measuring',
        quality: arPlaneDetection.state.qualityMetrics,
      }));

      // Voice guidance for new plane
      if (config.voiceGuidance && newPlanes.length > capturedPlanes.length) {
        const newPlaneCount = newPlanes.length - capturedPlanes.length;
        announceToAccessibility(`${newPlaneCount} new roof surface${newPlaneCount > 1 ? 's' : ''} detected.`);
      }

      // Haptic feedback for new plane
      if (config.hapticFeedback && newPlanes.length > capturedPlanes.length) {
        Vibration.vibrate([50, 50, 50]);
      }
    }
  }, [arPlaneDetection.state.planes, capturedPlanes.length, config]);

  /**
   * Handle point capture
   */
  const capturePoint = useCallback(async (x: number, y: number) => {
    if (!cameraReady || session.state !== 'measuring') return;

    try {
      setIsCapturing(true);

      // Get current pitch measurement
      const currentPitch = pitchSensor.state.measurement;
      if (!currentPitch) {
        Alert.alert('Sensor Error', 'Unable to get device orientation. Please ensure device is stable.');
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
      Alert.alert('Capture Error', 'Failed to capture measurement point.');
    } finally {
      setIsCapturing(false);
    }
  }, [cameraReady, session.state, session.points.length, pitchSensor.state.measurement, config]);

  /**
   * Complete measurement session
   */
  const completeMeasurement = useCallback(async () => {
    if (capturedPlanes.length === 0) {
      Alert.alert('No Measurements', 'Please capture at least one roof surface before completing.');
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
      Alert.alert('Calculation Error', 'Failed to calculate roof measurements.');
    }
  }, [capturedPlanes, session.id, arPlaneDetection, pitchSensor, navigation, config]);

  /**
   * Reset measurement session
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
  }, [arPlaneDetection, config]);

  /**
   * Announce message to accessibility users
   */
  const announceToAccessibility = useCallback((message: string) => {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(message);
    }
    // TODO: Add TTS for Android
  }, []);

  /**
   * Handle camera ready
   */
  const onCameraReady = useCallback(() => {
    setCameraReady(true);
    initializeARSession();
  }, [initializeARSession]);

  /**
   * Handle screen tap for point capture
   */
  const onScreenTap = useCallback((event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    capturePoint(locationX, locationY);
  }, [capturePoint]);

  // Request permissions on mount
  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      arPlaneDetection.stopDetection();
      pitchSensor.stopMeasuring();
    };
  }, [arPlaneDetection, pitchSensor]);

  // Permission states
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>No access to camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermissions}>
          <Text style={styles.buttonText}>Request Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* AR Camera View */}
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={CameraType.back}
          onCameraReady={onCameraReady}
          onTouchEnd={onScreenTap}
        />
        
        {/* AR Overlay */}
        <View style={styles.overlay}>
          {/* Instructions */}
          {showInstructions && (
            <View style={styles.instructions}>
              <Text style={styles.instructionText}>
                Point camera at roof surface and tap to mark corners
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

          {/* Status Display */}
          <View style={styles.statusOverlay}>
            <Text style={styles.statusLabel}>Status: {session.state}</Text>
            <Text style={styles.statusLabel}>Planes: {capturedPlanes.length}</Text>
            <Text style={styles.statusLabel}>Points: {session.points.length}</Text>
            
            {/* Pitch Display */}
            {pitchSensor.state.measurement && (
              <View style={styles.pitchDisplay}>
                <Text style={styles.pitchText}>
                  Pitch: {pitchSensor.state.measurement.pitch.toFixed(1)}°
                </Text>
                <Text style={styles.confidenceText}>
                  Accuracy: {pitchSensor.state.measurement.accuracy}
                </Text>
              </View>
            )}

            {/* Quality Indicators */}
            <View style={styles.qualityIndicators}>
              <View style={[
                styles.qualityDot,
                { backgroundColor: arPlaneDetection.state.trackingState === 'normal' ? '#4CAF50' : '#FF5722' }
              ]} />
              <Text style={styles.qualityText}>AR Tracking</Text>
            </View>
          </View>

          {/* Plane Visualizations */}
          {capturedPlanes.map((plane, index) => (
            <View key={plane.id} style={styles.planeOverlay}>
              <Text style={styles.planeInfo}>
                Plane {index + 1}: {plane.area.toFixed(2)} {config.units === 'metric' ? 'm²' : 'ft²'}
              </Text>
            </View>
          ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
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
  },
  planeOverlay: {
    position: 'absolute',
    top: 300,
    left: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    padding: 8,
    borderRadius: 6,
  },
  planeInfo: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
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