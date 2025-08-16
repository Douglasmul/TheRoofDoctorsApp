/**
 * @fileoverview React hook for real-time pitch calculation using device sensors
 * Enterprise-grade sensor fusion with calibration and accuracy tracking
 * @version 1.0.0
 * @enterprise
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { DeviceMotion } from 'expo-sensors';
import { DeviceInfo } from '../types/measurement';

/**
 * Pitch sensor configuration
 */
interface PitchSensorConfig {
  /** Update frequency in Hz */
  updateInterval: number;
  /** Sensor fusion algorithm */
  fusionMethod: 'complementary' | 'kalman' | 'madgwick';
  /** Low-pass filter alpha (0-1) */
  filterAlpha: number;
  /** Calibration period in seconds */
  calibrationPeriod: number;
  /** Auto-calibration enabled */
  autoCalibration: boolean;
  /** Accuracy threshold for measurements */
  accuracyThreshold: number;
}

/**
 * Pitch measurement data
 */
interface PitchMeasurement {
  /** Pitch angle in degrees (-90 to 90) */
  pitch: number;
  /** Roll angle in degrees (-180 to 180) */
  roll: number;
  /** Yaw/heading angle in degrees (0-360) */
  yaw: number;
  /** Confidence in measurement (0-1) */
  confidence: number;
  /** Sensor accuracy level */
  accuracy: 'low' | 'medium' | 'high';
  /** Timestamp of measurement */
  timestamp: Date;
  /** Raw sensor data */
  rawData: {
    accelerometer: { x: number; y: number; z: number };
    gyroscope: { x: number; y: number; z: number };
    magnetometer?: { x: number; y: number; z: number };
  };
}

/**
 * Sensor calibration state
 */
interface CalibrationState {
  /** Whether calibration is in progress */
  isCalibrating: boolean;
  /** Calibration progress (0-1) */
  progress: number;
  /** Calibration quality score */
  quality: number;
  /** Calibration offset values */
  offsets: {
    pitch: number;
    roll: number;
    yaw: number;
  };
  /** Calibration timestamp */
  timestamp: Date;
}

/**
 * Pitch sensor state
 */
interface PitchSensorState {
  /** Current pitch measurement */
  measurement: PitchMeasurement | null;
  /** Sensor availability */
  isAvailable: boolean;
  /** Sensor is actively measuring */
  isActive: boolean;
  /** Calibration state */
  calibration: CalibrationState;
  /** Device information */
  deviceInfo: Partial<DeviceInfo>;
  /** Last error */
  error: string | null;
  /** Measurement history for averaging */
  history: PitchMeasurement[];
}

/**
 * Default configuration for roof measurement
 */
const DEFAULT_CONFIG: PitchSensorConfig = {
  updateInterval: 50, // 20 Hz
  fusionMethod: 'complementary',
  filterAlpha: 0.8,
  calibrationPeriod: 5, // 5 seconds
  autoCalibration: true,
  accuracyThreshold: 0.5, // 0.5 degree accuracy
};

/**
 * Hook for real-time pitch measurement with enterprise features
 * 
 * @param config - Configuration options for pitch sensor
 * @returns Pitch sensor state and control functions
 * 
 * @example
 * ```tsx
 * const {
 *   measurement,
 *   isActive,
 *   startMeasuring,
 *   stopMeasuring,
 *   calibrate
 * } = usePitchSensor({
 *   updateInterval: 100,
 *   fusionMethod: 'kalman'
 * });
 * ```
 */
export function usePitchSensor(
  config: Partial<PitchSensorConfig> = {}
): {
  /** Current sensor state */
  state: PitchSensorState;
  /** Start pitch measurement */
  startMeasuring: () => Promise<void>;
  /** Stop pitch measurement */
  stopMeasuring: () => void;
  /** Calibrate sensors */
  calibrate: () => Promise<void>;
  /** Reset calibration */
  resetCalibration: () => void;
  /** Get averaged pitch over time window */
  getAveragePitch: (windowMs: number) => number | null;
  /** Get pitch stability score */
  getStabilityScore: () => number;
  /** Export calibration data */
  exportCalibration: () => string;
  /** Import calibration data */
  importCalibration: (data: string) => boolean;
} {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);
  const calibrationDataRef = useRef<PitchMeasurement[]>([]);
  const filterStateRef = useRef({ pitch: 0, roll: 0, yaw: 0 });

  const [state, setState] = useState<PitchSensorState>({
    measurement: null,
    isAvailable: false,
    isActive: false,
    calibration: {
      isCalibrating: false,
      progress: 0,
      quality: 0,
      offsets: { pitch: 0, roll: 0, yaw: 0 },
      timestamp: new Date(),
    },
    deviceInfo: {},
    error: null,
    history: [],
  });

  /**
   * Check sensor availability
   */
  const checkSensorAvailability = useCallback(async (): Promise<boolean> => {
    try {
      const available = await DeviceMotion.isAvailableAsync();
      setState(prev => ({ 
        ...prev, 
        isAvailable: available,
        deviceInfo: {
          ...prev.deviceInfo,
          sensorCalibration: available ? 'good' : 'poor'
        }
      }));
      return available;
    } catch (error) {
      console.error('Error checking sensor availability:', error);
      setState(prev => ({ 
        ...prev, 
        error: `Sensor check failed: ${error}`,
        isAvailable: false
      }));
      return false;
    }
  }, []);

  /**
   * Process raw sensor data into pitch measurement
   */
  const processSensorData = useCallback((data: any): PitchMeasurement => {
    const { acceleration, rotation } = data;
    
    // Extract accelerometer data (gravity vector)
    const ax = acceleration?.x || 0;
    const ay = acceleration?.y || 0;
    const az = acceleration?.z || 0;
    
    // Extract gyroscope data (angular velocity)
    const gx = rotation?.alpha || 0; // Roll rate
    const gy = rotation?.beta || 0;  // Pitch rate  
    const gz = rotation?.gamma || 0; // Yaw rate

    // Calculate pitch from accelerometer (gravity vector)
    let accelPitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az)) * (180 / Math.PI);
    
    // Calculate roll from accelerometer
    let accelRoll = Math.atan2(ay, az) * (180 / Math.PI);
    
    // Apply sensor fusion based on configuration
    let fusedPitch = accelPitch;
    let fusedRoll = accelRoll;
    let fusedYaw = 0; // TODO: Integrate magnetometer for yaw

    switch (mergedConfig.fusionMethod) {
      case 'complementary':
        // Complementary filter: 98% gyro, 2% accel
        const dt = mergedConfig.updateInterval / 1000;
        fusedPitch = 0.98 * (filterStateRef.current.pitch + gy * dt) + 0.02 * accelPitch;
        fusedRoll = 0.98 * (filterStateRef.current.roll + gx * dt) + 0.02 * accelRoll;
        break;
        
      case 'kalman':
        // TODO: Implement Kalman filter
        fusedPitch = accelPitch; // Placeholder
        fusedRoll = accelRoll;
        break;
        
      case 'madgwick':
        // TODO: Implement Madgwick filter
        fusedPitch = accelPitch; // Placeholder
        fusedRoll = accelRoll;
        break;
    }

    // Apply low-pass filter
    const alpha = mergedConfig.filterAlpha;
    fusedPitch = alpha * fusedPitch + (1 - alpha) * filterStateRef.current.pitch;
    fusedRoll = alpha * fusedRoll + (1 - alpha) * filterStateRef.current.roll;

    // Update filter state
    filterStateRef.current = { pitch: fusedPitch, roll: fusedRoll, yaw: fusedYaw };

    // Apply calibration offsets
    const calibratedPitch = fusedPitch - state.calibration.offsets.pitch;
    const calibratedRoll = fusedRoll - state.calibration.offsets.roll;
    const calibratedYaw = fusedYaw - state.calibration.offsets.yaw;

    // Calculate confidence based on sensor stability
    const confidence = calculateConfidence(ax, ay, az, gx, gy, gz);
    
    // Determine accuracy level
    const accuracy = confidence > 0.8 ? 'high' : confidence > 0.5 ? 'medium' : 'low';

    return {
      pitch: calibratedPitch,
      roll: calibratedRoll,
      yaw: calibratedYaw,
      confidence,
      accuracy,
      timestamp: new Date(),
      rawData: {
        accelerometer: { x: ax, y: ay, z: az },
        gyroscope: { x: gx, y: gy, z: gz },
      },
    };
  }, [mergedConfig, state.calibration.offsets]);

  /**
   * Calculate measurement confidence based on sensor stability
   */
  const calculateConfidence = useCallback((
    ax: number, ay: number, az: number,
    gx: number, gy: number, gz: number
  ): number => {
    // Calculate total acceleration magnitude
    const totalAccel = Math.sqrt(ax * ax + ay * ay + az * az);
    
    // Check if close to 1g (gravity only, no external acceleration)
    const gravityVariance = Math.abs(totalAccel - 9.81) / 9.81;
    
    // Calculate gyroscope stability (less movement = higher confidence)
    const gyroMagnitude = Math.sqrt(gx * gx + gy * gy + gz * gz);
    
    // Combine factors into confidence score
    const gravityFactor = Math.max(0, 1 - gravityVariance * 2);
    const stabilityFactor = Math.max(0, 1 - gyroMagnitude / 10);
    
    return (gravityFactor * 0.7 + stabilityFactor * 0.3);
  }, []);

  /**
   * Start pitch measurement
   */
  const startMeasuring = useCallback(async () => {
    try {
      const isAvailable = await checkSensorAvailability();
      if (!isAvailable) {
        throw new Error('Device motion sensors are not available');
      }

      // Set update interval
      DeviceMotion.setUpdateInterval(mergedConfig.updateInterval);

      // Start listening to sensor data
      subscriptionRef.current = DeviceMotion.addListener((data) => {
        const measurement = processSensorData(data);
        
        setState(prev => {
          const newHistory = [...prev.history, measurement].slice(-100); // Keep last 100 measurements
          
          return {
            ...prev,
            measurement,
            history: newHistory,
            isActive: true,
            error: null,
          };
        });
      });

      setState(prev => ({ ...prev, isActive: true }));

      // Auto-calibrate if enabled
      if (mergedConfig.autoCalibration) {
        setTimeout(() => {
          calibrate();
        }, 1000); // Wait 1 second before auto-calibration
      }

    } catch (error) {
      console.error('Error starting pitch measurement:', error);
      setState(prev => ({ 
        ...prev, 
        error: `Measurement failed: ${error}`,
        isActive: false 
      }));
    }
  }, [checkSensorAvailability, mergedConfig, processSensorData]);

  /**
   * Stop pitch measurement
   */
  const stopMeasuring = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }

    setState(prev => ({ ...prev, isActive: false }));
  }, []);

  /**
   * Calibrate sensors
   */
  const calibrate = useCallback(async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      setState(prev => ({
        ...prev,
        calibration: {
          ...prev.calibration,
          isCalibrating: true,
          progress: 0,
        }
      }));

      calibrationDataRef.current = [];
      const startTime = Date.now();
      const duration = mergedConfig.calibrationPeriod * 1000;

      const calibrationInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        setState(prev => {
          // Collect current measurement for calibration
          if (prev.measurement) {
            calibrationDataRef.current.push(prev.measurement);
          }

          return {
            ...prev,
            calibration: {
              ...prev.calibration,
              progress,
            }
          };
        });

        if (progress >= 1) {
          clearInterval(calibrationInterval);

          // Calculate calibration offsets (average of collected data)
          const avgPitch = calibrationDataRef.current.reduce((sum, m) => sum + m.pitch, 0) / calibrationDataRef.current.length;
          const avgRoll = calibrationDataRef.current.reduce((sum, m) => sum + m.roll, 0) / calibrationDataRef.current.length;
          const avgYaw = calibrationDataRef.current.reduce((sum, m) => sum + m.yaw, 0) / calibrationDataRef.current.length;

          // Calculate calibration quality
          const pitchVariance = calibrationDataRef.current.reduce((sum, m) => sum + Math.pow(m.pitch - avgPitch, 2), 0) / calibrationDataRef.current.length;
          const quality = Math.max(0, 1 - Math.sqrt(pitchVariance) / 10);

          setState(prev => ({
            ...prev,
            calibration: {
              isCalibrating: false,
              progress: 1,
              quality,
              offsets: {
                pitch: avgPitch,
                roll: avgRoll,
                yaw: avgYaw,
              },
              timestamp: new Date(),
            }
          }));

          resolve();
        }
      }, 100);

      // Timeout after calibration period + 1 second
      setTimeout(() => {
        clearInterval(calibrationInterval);
        reject(new Error('Calibration timeout'));
      }, duration + 1000);
    });
  }, [mergedConfig.calibrationPeriod]);

  /**
   * Reset calibration
   */
  const resetCalibration = useCallback(() => {
    setState(prev => ({
      ...prev,
      calibration: {
        isCalibrating: false,
        progress: 0,
        quality: 0,
        offsets: { pitch: 0, roll: 0, yaw: 0 },
        timestamp: new Date(),
      }
    }));
  }, []);

  /**
   * Get averaged pitch over time window
   */
  const getAveragePitch = useCallback((windowMs: number): number | null => {
    const cutoffTime = Date.now() - windowMs;
    const recentMeasurements = state.history.filter(m => m.timestamp.getTime() > cutoffTime);
    
    if (recentMeasurements.length === 0) return null;
    
    return recentMeasurements.reduce((sum, m) => sum + m.pitch, 0) / recentMeasurements.length;
  }, [state.history]);

  /**
   * Get pitch stability score
   */
  const getStabilityScore = useCallback((): number => {
    if (state.history.length < 10) return 0;
    
    const recentMeasurements = state.history.slice(-20); // Last 20 measurements
    const pitches = recentMeasurements.map(m => m.pitch);
    const mean = pitches.reduce((sum, p) => sum + p, 0) / pitches.length;
    const variance = pitches.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / pitches.length;
    
    // Lower variance = higher stability
    return Math.max(0, 1 - Math.sqrt(variance) / 10);
  }, [state.history]);

  /**
   * Export calibration data
   */
  const exportCalibration = useCallback((): string => {
    return JSON.stringify({
      offsets: state.calibration.offsets,
      quality: state.calibration.quality,
      timestamp: state.calibration.timestamp,
      deviceInfo: state.deviceInfo,
    });
  }, [state.calibration, state.deviceInfo]);

  /**
   * Import calibration data
   */
  const importCalibration = useCallback((data: string): boolean => {
    try {
      const parsed = JSON.parse(data);
      setState(prev => ({
        ...prev,
        calibration: {
          ...prev.calibration,
          offsets: parsed.offsets,
          quality: parsed.quality,
          timestamp: new Date(parsed.timestamp),
        }
      }));
      return true;
    } catch (error) {
      console.error('Error importing calibration:', error);
      return false;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMeasuring();
    };
  }, [stopMeasuring]);

  // Check sensor availability on mount
  useEffect(() => {
    checkSensorAvailability();
  }, [checkSensorAvailability]);

  return {
    state,
    startMeasuring,
    stopMeasuring,
    calibrate,
    resetCalibration,
    getAveragePitch,
    getStabilityScore,
    exportCalibration,
    importCalibration,
  };
}

// TODO: Integrate with magnetometer for accurate yaw/heading
// TODO: Implement advanced Kalman filter for sensor fusion
// TODO: Add temperature compensation for sensor drift
// TODO: Implement adaptive calibration based on usage patterns
// TODO: Add support for external IMU devices
// TODO: Implement real-time sensor health monitoring
// TODO: Add machine learning for automatic calibration optimization
// TODO: Integrate with AR world tracking for enhanced accuracy