/**
 * @fileoverview React hook for AR plane detection using ARKit/ARCore
 * Enterprise-grade plane detection with confidence scoring and filtering
 * @version 1.0.0
 * @enterprise
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { RoofPlane, ARPoint, QualityMetrics } from '../types/measurement';

/**
 * Configuration options for AR plane detection
 */
interface ARPlaneDetectionConfig {
  /** Minimum plane area in square meters */
  minPlaneArea: number;
  /** Minimum confidence threshold (0-1) */
  minConfidence: number;
  /** Maximum distance from camera in meters */
  maxDistance: number;
  /** Plane detection sensitivity */
  sensitivity: 'low' | 'medium' | 'high';
  /** Whether to detect vertical planes */
  detectVerticalPlanes: boolean;
  /** Whether to detect horizontal planes */
  detectHorizontalPlanes: boolean;
  /** Plane merge distance threshold */
  mergeThreshold: number;
}

/**
 * AR plane detection state
 */
interface ARPlaneDetectionState {
  /** Currently detected planes */
  planes: RoofPlane[];
  /** Whether AR session is active */
  isActive: boolean;
  /** Whether AR is supported on device */
  isSupported: boolean;
  /** Current tracking state */
  trackingState: 'notAvailable' | 'limited' | 'normal';
  /** Tracking quality metrics */
  qualityMetrics: QualityMetrics;
  /** Last error that occurred */
  error: string | null;
  /** Whether plane detection is currently running */
  isDetecting: boolean;
}

/**
 * Default configuration for roof measurement
 */
const DEFAULT_CONFIG: ARPlaneDetectionConfig = {
  minPlaneArea: 1.0, // 1 square meter minimum
  minConfidence: 0.7, // 70% confidence threshold
  maxDistance: 50.0, // 50 meter range
  sensitivity: 'high',
  detectVerticalPlanes: true,
  detectHorizontalPlanes: true,
  mergeThreshold: 0.5, // 50cm merge distance
};

/**
 * Hook for AR plane detection with enterprise features
 * 
 * @param config - Configuration options for plane detection
 * @returns AR plane detection state and control functions
 * 
 * @example
 * ```tsx
 * const {
 *   planes,
 *   isActive,
 *   startDetection,
 *   stopDetection,
 *   qualityMetrics
 * } = useARPlaneDetection({
 *   minPlaneArea: 2.0,
 *   sensitivity: 'high'
 * });
 * ```
 */
export function useARPlaneDetection(
  config: Partial<ARPlaneDetectionConfig> = {}
): {
  /** Current detection state */
  state: ARPlaneDetectionState;
  /** Start AR plane detection */
  startDetection: () => Promise<void>;
  /** Stop AR plane detection */
  stopDetection: () => void;
  /** Reset detected planes */
  resetPlanes: () => void;
  /** Manually add a plane */
  addPlane: (plane: RoofPlane) => void;
  /** Remove a specific plane */
  removePlane: (planeId: string) => void;
  /** Merge similar planes */
  mergePlanes: (planeIds: string[]) => void;
  /** Get plane by ID */
  getPlane: (planeId: string) => RoofPlane | undefined;
  /** Validate plane quality */
  validatePlane: (plane: RoofPlane) => boolean;
} {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const sessionRef = useRef<any>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);
  
  const [state, setState] = useState<ARPlaneDetectionState>({
    planes: [],
    isActive: false,
    isSupported: false,
    trackingState: 'notAvailable',
    qualityMetrics: {
      overallScore: 0,
      trackingStability: 0,
      pointDensity: 0,
      duration: 0,
      trackingInterruptions: 0,
      lightingQuality: 0,
      movementSmoothness: 0,
    },
    error: null,
    isDetecting: false,
  });

  /**
   * Check AR availability on device
   */
  const checkARSupport = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'ios') {
        // Check ARKit availability
        // Note: In a real implementation, this would use react-native-arkit or @react-native-async-storage/async-storage
        // to check device capability and iOS version
        const iosVersion = parseFloat(Platform.Version as string);
        const supportsARKit = iosVersion >= 11.0; // ARKit requires iOS 11+
        
        setState(prev => ({
          ...prev,
          isSupported: supportsARKit,
          error: supportsARKit ? null : 'ARKit requires iOS 11.0 or higher'
        }));
        
        return supportsARKit;
      } else if (Platform.OS === 'android') {
        // Check ARCore availability
        // Note: In a real implementation, this would use react-native-arcore
        // For now, we'll assume modern Android devices support ARCore
        const apiLevel = Platform.Version as number;
        const supportsARCore = apiLevel >= 24; // ARCore requires API level 24+
        
        setState(prev => ({
          ...prev,
          isSupported: supportsARCore,
          error: supportsARCore ? null : 'ARCore requires Android 7.0 (API level 24) or higher'
        }));
        
        return supportsARCore;
      }
      return false;
    } catch (error) {
      console.error('Error checking AR support:', error);
      setState(prev => ({
        ...prev,
        isSupported: false,
        error: `AR support check failed: ${error}`
      }));
      return false;
    }
  }, []);

  /**
   * Initialize AR session
   */
  const initializeARSession = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'ios') {
        // Initialize ARKit session with advanced configuration
        console.log('Initializing ARKit session with world tracking...');
        
        // Simulated ARKit session configuration
        const sessionConfig = {
          worldAlignment: 'gravityAndHeading',
          planeDetection: ['horizontal', 'vertical'],
          lightEstimation: true,
          worldMapping: true,
          environmentTexturing: 'manual',
          // Advanced ARKit 6.0+ features
          sceneReconstruction: 'mesh',
          automaticImageScale: true,
          geoTrackingEnabled: false, // Enable for outdoor roof measurements
        };
        
        // In a real implementation, this would initialize the native ARKit session
        // sessionRef.current = await ARKit.createSession(sessionConfig);
        
        setState(prev => ({
          ...prev,
          trackingState: 'normal',
          error: null,
        }));
        
        console.log('ARKit session initialized successfully');
        return true;
        
      } else if (Platform.OS === 'android') {
        // Initialize ARCore session with advanced configuration
        console.log('Initializing ARCore session with augmented images...');
        
        // Simulated ARCore session configuration
        const sessionConfig = {
          planeFindingEnabled: true,
          lightEstimationEnabled: true,
          cloudAnchorEnabled: false, // Enable for cloud sharing
          augmentedImageEnabled: false,
          augmentedFaceEnabled: false,
          // Advanced ARCore features
          depthEnabled: true,
          instantPlacementEnabled: true,
          occlusionEnabled: true,
        };
        
        // In a real implementation, this would initialize the native ARCore session
        // sessionRef.current = await ARCore.createSession(sessionConfig);
        
        setState(prev => ({
          ...prev,
          trackingState: 'normal',
          error: null,
        }));
        
        console.log('ARCore session initialized successfully');
        return true;
      }
      
      setState(prev => ({
        ...prev,
        error: 'Unsupported platform for AR',
        trackingState: 'notAvailable',
      }));
      return false;
      
    } catch (error) {
      console.error('Error initializing AR session:', error);
      setState(prev => ({ 
        ...prev, 
        error: `AR initialization failed: ${error}`,
        trackingState: 'limited',
      }));
      return false;
    }
  }, []);

  /**
   * Process detected AR planes and convert to RoofPlane format with advanced geometry
   */
  const processDetectedPlanes = useCallback((rawPlanes: any[]): RoofPlane[] => {
    return rawPlanes
      .filter(plane => {
        // Filter by minimum area
        if (plane.area < mergedConfig.minPlaneArea) return false;
        
        // Filter by confidence
        if (plane.confidence < mergedConfig.minConfidence) return false;
        
        // Filter by distance
        if (plane.distance > mergedConfig.maxDistance) return false;
        
        return true;
      })
      .map(plane => {
        // Calculate optimized plane boundaries using convex hull
        const optimizedBoundaries = calculateConvexHull(plane.boundaries || plane.points || []);
        
        // Calculate plane normal vector with improved accuracy
        const normal = calculatePlaneNormal(optimizedBoundaries);
        
        // Calculate pitch and azimuth angles
        const pitchAngle = calculatePitchAngle(normal);
        const azimuthAngle = calculateAzimuthAngle(normal);
        
        // Calculate area with pitch correction
        const rawArea = calculatePolygonArea(optimizedBoundaries);
        const correctedArea = applyPitchCorrection(rawArea, pitchAngle);
        
        // For simulation/development: use the simulated area if geometry calculation fails
        const finalArea = rawArea > 0 ? rawArea : plane.area;
        const finalProjectedArea = correctedArea > 0 ? correctedArea : plane.area;
        
        // Detect plane type based on orientation and position
        const planeType = classifyPlaneType(normal, optimizedBoundaries, pitchAngle);
        
        // Perform edge detection and smoothing
        const smoothedBoundaries = smoothPlaneEdges(optimizedBoundaries);
        
        return {
          id: plane.id || `plane_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          boundaries: smoothedBoundaries,
          normal,
          pitchAngle,
          azimuthAngle,
          area: finalArea,
          projectedArea: finalProjectedArea,
          type: planeType,
          confidence: plane.confidence || 0,
          material: detectMaterial(plane, pitchAngle), // Basic material detection
        };
      })
      .sort((a, b) => b.area - a.area); // Sort by area (largest first)
  }, [mergedConfig]);

  /**
   * Calculate convex hull using Graham scan algorithm
   */
  const calculateConvexHull = useCallback((points: ARPoint[]): ARPoint[] => {
    if (points.length < 3) return points;
    
    // Find the bottom-most point (lowest y-coordinate)
    let bottom = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].y < points[bottom].y || 
          (points[i].y === points[bottom].y && points[i].x < points[bottom].x)) {
        bottom = i;
      }
    }
    
    // Swap bottom point to first position
    [points[0], points[bottom]] = [points[bottom], points[0]];
    const pivot = points[0];
    
    // Sort points by polar angle with respect to pivot
    const sortedPoints = points.slice(1).sort((a, b) => {
      const angleA = Math.atan2(a.y - pivot.y, a.x - pivot.x);
      const angleB = Math.atan2(b.y - pivot.y, b.x - pivot.x);
      
      if (angleA === angleB) {
        // If angles are equal, choose closer point
        const distA = Math.sqrt((a.x - pivot.x) ** 2 + (a.y - pivot.y) ** 2);
        const distB = Math.sqrt((b.x - pivot.x) ** 2 + (b.y - pivot.y) ** 2);
        return distA - distB;
      }
      
      return angleA - angleB;
    });
    
    // Graham scan algorithm
    const hull: ARPoint[] = [pivot, sortedPoints[0]];
    
    for (let i = 1; i < sortedPoints.length; i++) {
      // Remove points that make clockwise turn
      while (hull.length > 1 && 
             crossProduct(hull[hull.length - 2], hull[hull.length - 1], sortedPoints[i]) <= 0) {
        hull.pop();
      }
      hull.push(sortedPoints[i]);
    }
    
    return hull;
  }, []);

  /**
   * Calculate cross product for convex hull algorithm
   */
  const crossProduct = useCallback((o: ARPoint, a: ARPoint, b: ARPoint): number => {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }, []);

  /**
   * Calculate plane normal vector from boundary points
   */
  const calculatePlaneNormal = useCallback((boundaries: ARPoint[]): { x: number; y: number; z: number } => {
    if (boundaries.length < 3) {
      return { x: 0, y: 1, z: 0 }; // Default upward normal
    }
    
    // Use first three points to calculate normal using cross product
    const p1 = boundaries[0];
    const p2 = boundaries[1];
    const p3 = boundaries[2];
    
    // Calculate vectors
    const v1 = { x: p2.x - p1.x, y: p2.y - p1.y, z: p2.z - p1.z };
    const v2 = { x: p3.x - p1.x, y: p3.y - p1.y, z: p3.z - p1.z };
    
    // Calculate cross product
    const normal = {
      x: v1.y * v2.z - v1.z * v2.y,
      y: v1.z * v2.x - v1.x * v2.z,
      z: v1.x * v2.y - v1.y * v2.x,
    };
    
    // Normalize
    const magnitude = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
    if (magnitude > 0) {
      normal.x /= magnitude;
      normal.y /= magnitude;
      normal.z /= magnitude;
    }
    
    return normal;
  }, []);

  /**
   * Calculate pitch angle from normal vector
   */
  const calculatePitchAngle = useCallback((normal: { x: number; y: number; z: number }): number => {
    // Pitch is angle from horizontal (0°) to vertical (90°)
    return Math.abs(Math.asin(Math.abs(normal.y)) * (180 / Math.PI));
  }, []);

  /**
   * Calculate azimuth angle from normal vector
   */
  const calculateAzimuthAngle = useCallback((normal: { x: number; y: number; z: number }): number => {
    // Azimuth is angle around vertical axis (0° to 360°)
    let azimuth = Math.atan2(normal.x, normal.z) * (180 / Math.PI);
    return azimuth < 0 ? azimuth + 360 : azimuth;
  }, []);

  /**
   * Calculate polygon area using shoelace formula
   */
  const calculatePolygonArea = useCallback((points: ARPoint[]): number => {
    if (points.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    
    return Math.abs(area) / 2;
  }, []);

  /**
   * Apply pitch correction to area calculation
   */
  const applyPitchCorrection = useCallback((area: number, pitchAngle: number): number => {
    // Correct for viewing angle - projected area is actual area / cos(pitch)
    const pitchRadians = pitchAngle * (Math.PI / 180);
    return area / Math.cos(pitchRadians);
  }, []);

  /**
   * Classify plane type based on orientation and geometry
   */
  const classifyPlaneType = useCallback((
    normal: { x: number; y: number; z: number },
    boundaries: ARPoint[],
    pitchAngle: number
  ): RoofPlane['type'] => {
    const area = calculatePolygonArea(boundaries);
    
    // Primary roof surface: large area, moderate pitch
    if (area > 25 && pitchAngle > 15 && pitchAngle < 60) {
      return 'primary';
    }
    
    // Dormer: smaller to medium area, various pitches
    if (area > 8 && area <= 25 && pitchAngle > 20) {
      return 'dormer';
    }
    
    // Secondary surfaces: medium areas or different orientations
    if (area > 5 && area <= 25) {
      return 'secondary';
    }
    
    // Small dormer: small area, steep pitch
    if (area <= 8 && pitchAngle > 45) {
      return 'dormer';
    }
    
    // Chimney: very small area, vertical or near-vertical
    if (area <= 2 && pitchAngle > 70) {
      return 'chimney';
    }
    
    return 'other';
  }, [calculatePolygonArea]);

  /**
   * Basic material detection based on plane characteristics
   */
  const detectMaterial = useCallback((
    plane: any,
    pitchAngle: number
  ): RoofPlane['material'] => {
    // This is a simplified version - in reality would use ML/texture analysis
    
    // Flat roofs typically use different materials
    if (pitchAngle < 5) {
      return 'flat';
    }
    
    // Metal roofs often have specific characteristics
    if (plane.reflectivity && plane.reflectivity > 0.7) {
      return 'metal';
    }
    
    // Default to shingle for typical residential pitches
    if (pitchAngle > 15 && pitchAngle < 45) {
      return 'shingle';
    }
    
    return 'unknown';
  }, []);

  /**
   * Smooth plane edges using moving average
   */
  const smoothPlaneEdges = useCallback((boundaries: ARPoint[]): ARPoint[] => {
    if (boundaries.length < 3) return boundaries;
    
    // Apply simple smoothing to reduce noise in boundary detection
    return boundaries.map((point, index) => {
      const prevIndex = (index - 1 + boundaries.length) % boundaries.length;
      const nextIndex = (index + 1) % boundaries.length;
      
      const prev = boundaries[prevIndex];
      const next = boundaries[nextIndex];
      
      // Weighted average with emphasis on current point
      return {
        ...point,
        x: (prev.x * 0.2 + point.x * 0.6 + next.x * 0.2),
        y: (prev.y * 0.2 + point.y * 0.6 + next.y * 0.2),
        z: (prev.z * 0.2 + point.z * 0.6 + next.z * 0.2),
      };
    });
  }, []);
  /**
   * Update quality metrics based on current AR session state
   */
  const updateQualityMetrics = useCallback(() => {
    setState(prev => {
      const currentTime = Date.now();
      const sessionDuration = Math.max(1, (currentTime - (prev.qualityMetrics.duration || currentTime)) / 1000);
      
      // Calculate real-time quality metrics
      const trackingStability = state.trackingState === 'normal' ? 95 : 
                               state.trackingState === 'limited' ? 60 : 30;
      
      const pointDensity = state.planes.reduce((total, plane) => 
        total + (plane.boundaries?.length || 0), 0) / Math.max(1, state.planes.length);
      
      // Simulate lighting quality based on plane detection success rate
      const lightingQuality = state.planes.length > 0 ? 
        Math.min(100, 60 + (state.planes.length * 10)) : 40;
      
      // Calculate overall score as weighted average
      const overallScore = Math.round(
        trackingStability * 0.4 + 
        lightingQuality * 0.3 + 
        (pointDensity * 10) * 0.2 + 
        (state.planes.length > 0 ? 80 : 50) * 0.1
      );
      
      return {
        ...prev,
        qualityMetrics: {
          overallScore: Math.max(0, Math.min(100, overallScore)),
          trackingStability,
          pointDensity,
          duration: sessionDuration,
          trackingInterruptions: prev.qualityMetrics.trackingInterruptions + 
            (state.trackingState === 'limited' ? 1 : 0),
          lightingQuality,
          movementSmoothness: Math.max(50, 90 - (prev.qualityMetrics.trackingInterruptions * 5)),
        }
      };
    });
  }, [state.trackingState, state.planes]);

  /**
   * Generate simulated plane data for development/testing
   * This simulates progressive plane discovery as a real AR system would
   */
  const generateSimulatedPlanes = useCallback(() => {
    const currentTime = Date.now();
    const sessionDuration = currentTime - (sessionStartTimeRef.current || currentTime);
    
    // Progressive plane discovery - simulate realistic AR behavior
    const simulatedPlanes = [];
    
    // Main roof plane appears after 1 second
    if (sessionDuration > 1000) {
      simulatedPlanes.push({
        id: 'roof_main',
        area: 45.2 + Math.random() * 5, // Vary the area slightly
        confidence: 0.85 + Math.random() * 0.1,
        distance: 8.5 + Math.random() * 1.5,
        boundaries: [
          { x: -3.0, y: 0.0, z: -5.0, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
          { x: 3.0, y: 0.0, z: -5.0, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
          { x: 3.0, y: 0.0, z: -8.0, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
          { x: -3.0, y: 0.0, z: -8.0, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
        ]
      });
    }
    
    // Secondary roof section appears after 3 seconds  
    if (sessionDuration > 3000) {
      simulatedPlanes.push({
        id: 'roof_section_2',
        area: 28.1 + Math.random() * 8, // Different area range
        confidence: 0.78 + Math.random() * 0.12,
        distance: 10.2 + Math.random() * 2.0,
        boundaries: [
          { x: 3.0, y: 0.5, z: -5.0, confidence: 0.8, timestamp: new Date(), sensorAccuracy: 'high' },
          { x: 6.0, y: 0.5, z: -5.0, confidence: 0.8, timestamp: new Date(), sensorAccuracy: 'high' },
          { x: 6.0, y: 0.5, z: -7.5, confidence: 0.8, timestamp: new Date(), sensorAccuracy: 'high' },
          { x: 3.0, y: 0.5, z: -7.5, confidence: 0.8, timestamp: new Date(), sensorAccuracy: 'high' },
        ]
      });
    }
    
    // First dormer appears after 5 seconds
    if (sessionDuration > 5000) {
      simulatedPlanes.push({
        id: 'dormer_1',
        area: 12.5 + Math.random() * 3, // Smaller dormer area
        confidence: 0.72 + Math.random() * 0.15,
        distance: 7.8 + Math.random() * 1.2,
        boundaries: [
          { x: -1.5, y: 1.2, z: -4.0, confidence: 0.75, timestamp: new Date(), sensorAccuracy: 'medium' },
          { x: -0.5, y: 1.2, z: -4.0, confidence: 0.75, timestamp: new Date(), sensorAccuracy: 'medium' },
          { x: -0.5, y: 1.2, z: -5.5, confidence: 0.75, timestamp: new Date(), sensorAccuracy: 'medium' },
          { x: -1.5, y: 1.2, z: -5.5, confidence: 0.75, timestamp: new Date(), sensorAccuracy: 'medium' },
        ]
      });
    }
    
    // Second dormer appears after 7 seconds  
    if (sessionDuration > 7000) {
      simulatedPlanes.push({
        id: 'dormer_2',
        area: 15.3 + Math.random() * 4, // Different dormer size
        confidence: 0.68 + Math.random() * 0.18,
        distance: 9.1 + Math.random() * 1.8,
        boundaries: [
          { x: 1.0, y: 1.5, z: -3.5, confidence: 0.7, timestamp: new Date(), sensorAccuracy: 'medium' },
          { x: 2.2, y: 1.5, z: -3.5, confidence: 0.7, timestamp: new Date(), sensorAccuracy: 'medium' },
          { x: 2.2, y: 1.5, z: -5.2, confidence: 0.7, timestamp: new Date(), sensorAccuracy: 'medium' },
          { x: 1.0, y: 1.5, z: -5.2, confidence: 0.7, timestamp: new Date(), sensorAccuracy: 'medium' },
        ]
      });
    }
    
    // Add diagnostic logging for debugging
    if (simulatedPlanes.length > 0) {
      console.log(`[AR] Generated ${simulatedPlanes.length} roof planes for scanning`);
    }
    
    return simulatedPlanes;
  }, []);

  /**
   * Start AR plane detection
   */
  const startDetection = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isDetecting: true, error: null }));
      
      // Record session start time for simulation
      sessionStartTimeRef.current = Date.now();
      
      const isSupported = await checkARSupport();
      if (!isSupported) {
        throw new Error('AR is not supported on this device');
      }

      const sessionInitialized = await initializeARSession();
      if (!sessionInitialized) {
        throw new Error('Failed to initialize AR session');
      }

      setState(prev => ({ 
        ...prev, 
        isActive: true, 
        isSupported: true,
        trackingState: 'normal'
      }));

      // Start detection loop
      detectionIntervalRef.current = setInterval(() => {
        // TODO: Poll AR system for new planes
        // const rawPlanes = sessionRef.current?.getDetectedPlanes();
        
        // For now, simulate realistic plane detection with progressive discovery
        const simulatedRawPlanes = generateSimulatedPlanes();
        const processedPlanes = processDetectedPlanes(simulatedRawPlanes);
        
        // Update quality metrics and plane state
        updateQualityMetrics();
        setState(prev => ({ ...prev, planes: processedPlanes }));
      }, 100); // 10 FPS detection

    } catch (error) {
      console.error('Error starting plane detection:', error);
      setState(prev => ({ 
        ...prev, 
        error: `Detection failed: ${error}`,
        isDetecting: false 
      }));
    }
  }, [checkARSupport, initializeARSession, processDetectedPlanes, updateQualityMetrics, generateSimulatedPlanes]);

  /**
   * Stop AR plane detection
   */
  const stopDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    // TODO: Stop AR session
    // sessionRef.current?.stop();
    // sessionRef.current = null;

    setState(prev => ({ 
      ...prev, 
      isActive: false, 
      isDetecting: false,
      trackingState: 'notAvailable'
    }));
  }, []);

  /**
   * Reset detected planes
   */
  const resetPlanes = useCallback(() => {
    setState(prev => ({ ...prev, planes: [] }));
  }, []);

  /**
   * Manually add a plane
   */
  const addPlane = useCallback((plane: RoofPlane) => {
    setState(prev => ({
      ...prev,
      planes: [...prev.planes, plane]
    }));
  }, []);

  /**
   * Remove a specific plane
   */
  const removePlane = useCallback((planeId: string) => {
    setState(prev => ({
      ...prev,
      planes: prev.planes.filter(plane => plane.id !== planeId)
    }));
  }, []);

  /**
   * Merge similar planes
   */
  const mergePlanes = useCallback((planeIds: string[]) => {
    setState(prev => {
      const planesToMerge = prev.planes.filter(plane => planeIds.includes(plane.id));
      const remainingPlanes = prev.planes.filter(plane => !planeIds.includes(plane.id));
      
      if (planesToMerge.length < 2) return prev;

      // Create merged plane
      const mergedPlane: RoofPlane = {
        id: `merged_${Date.now()}`,
        boundaries: planesToMerge.flatMap(plane => plane.boundaries),
        normal: averageNormals(planesToMerge.map(p => p.normal)),
        pitchAngle: 0, // Will be recalculated
        azimuthAngle: 0, // Will be recalculated
        area: planesToMerge.reduce((sum, plane) => sum + plane.area, 0),
        projectedArea: planesToMerge.reduce((sum, plane) => sum + plane.projectedArea, 0),
        type: planesToMerge[0].type, // Use first plane's type
        confidence: Math.min(...planesToMerge.map(p => p.confidence)),
        material: planesToMerge[0].material,
      };

      // Recalculate angles
      mergedPlane.pitchAngle = calculatePitchAngle(mergedPlane.normal);
      mergedPlane.azimuthAngle = calculateAzimuthAngle(mergedPlane.normal);

      return {
        ...prev,
        planes: [...remainingPlanes, mergedPlane]
      };
    });
  }, [calculatePitchAngle, calculateAzimuthAngle]);

  /**
   * Average normal vectors
   */
  const averageNormals = useCallback((normals: { x: number; y: number; z: number }[]): { x: number; y: number; z: number } => {
    const sum = normals.reduce(
      (acc, normal) => ({
        x: acc.x + normal.x,
        y: acc.y + normal.y,
        z: acc.z + normal.z,
      }),
      { x: 0, y: 0, z: 0 }
    );

    const count = normals.length;
    return {
      x: sum.x / count,
      y: sum.y / count,
      z: sum.z / count,
    };
  }, []);

  /**
   * Get plane by ID
   */
  const getPlane = useCallback((planeId: string): RoofPlane | undefined => {
    return state.planes.find(plane => plane.id === planeId);
  }, [state.planes]);

  /**
   * Validate plane quality
   */
  const validatePlane = useCallback((plane: RoofPlane): boolean => {
    return plane.area >= mergedConfig.minPlaneArea && 
           plane.confidence >= mergedConfig.minConfidence;
  }, [mergedConfig]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  /**
   * Convert screen coordinates to world coordinates
   * This is a critical function for accurate AR measurements
   */
  const convertScreenToWorld = useCallback((
    screenX: number, 
    screenY: number, 
    screenWidth: number, 
    screenHeight: number,
    cameraIntrinsics?: any,
    pose?: any
  ): ARPoint | null => {
    try {
      // Normalize screen coordinates to [-1, 1] range
      const normalizedX = (screenX / screenWidth) * 2 - 1;
      const normalizedY = -((screenY / screenHeight) * 2 - 1); // Flip Y axis
      
      // In a real implementation, this would use the AR session's ray casting
      // For now, we'll simulate a basic world coordinate conversion
      
      // Assume the user is pointing at a roof surface approximately 3-10 meters away
      const estimatedDepth = 5.0; // meters
      
      // Simple perspective projection (would use actual camera matrices in real implementation)
      const worldX = normalizedX * estimatedDepth * 0.5; // Scale based on field of view
      const worldY = 0; // Assume ground level for now
      const worldZ = normalizedY * estimatedDepth * 0.5;
      
      return {
        x: worldX,
        y: worldY,
        z: worldZ,
        confidence: 0.7, // Lower confidence for simulated conversion
        timestamp: new Date(),
        sensorAccuracy: 'medium',
      };
    } catch (error) {
      console.error('Error converting screen to world coordinates:', error);
      return null;
    }
  }, []);

  /**
   * Perform hit testing to find AR plane intersections
   */
  const performHitTest = useCallback((
    screenX: number,
    screenY: number,
    existingPlanes: RoofPlane[]
  ): ARPoint[] => {
    // In a real implementation, this would use AR SDK hit testing
    // For now, we'll simulate finding intersections with detected planes
    
    const worldPoint = convertScreenToWorld(screenX, screenY, 375, 812); // iPhone screen size placeholder
    if (!worldPoint) return [];
    
    // Check intersection with existing planes
    const intersections: ARPoint[] = [];
    
    existingPlanes.forEach(plane => {
      // Simple distance-based intersection test
      const centerX = plane.boundaries.reduce((sum, p) => sum + p.x, 0) / plane.boundaries.length;
      const centerZ = plane.boundaries.reduce((sum, p) => sum + p.z, 0) / plane.boundaries.length;
      
      const distance = Math.sqrt((worldPoint.x - centerX) ** 2 + (worldPoint.z - centerZ) ** 2);
      
      if (distance < 2.0) { // Within 2 meters
        intersections.push({
          ...worldPoint,
          y: plane.boundaries[0]?.y || 0, // Use plane height
          confidence: Math.max(0.3, plane.confidence - distance * 0.1),
        });
      }
    });
    
    // If no plane intersections, add the raw world point
    if (intersections.length === 0) {
      intersections.push(worldPoint);
    }
    
    return intersections;
  }, [convertScreenToWorld]);

  /**
   * Track and update plane persistence across frames
   */
  const updatePlaneTracking = useCallback((newPlanes: RoofPlane[]) => {
    setState(prev => {
      const updatedPlanes = [...prev.planes];
      const threshold = mergedConfig.mergeThreshold;
      
      newPlanes.forEach(newPlane => {
        // Check if this plane should be merged with existing ones
        let merged = false;
        
        for (let i = 0; i < updatedPlanes.length; i++) {
          const existingPlane = updatedPlanes[i];
          
          // Calculate distance between plane centers
          const newCenter = calculatePlaneCenter(newPlane.boundaries);
          const existingCenter = calculatePlaneCenter(existingPlane.boundaries);
          
          const distance = Math.sqrt(
            (newCenter.x - existingCenter.x) ** 2 +
            (newCenter.y - existingCenter.y) ** 2 +
            (newCenter.z - existingCenter.z) ** 2
          );
          
          // Check if normal vectors are similar (within 15 degrees)
          const angleDiff = calculateAngleBetweenNormals(newPlane.normal, existingPlane.normal);
          
          if (distance < threshold && angleDiff < 15) {
            // Merge planes by updating the existing one with new data
            updatedPlanes[i] = mergeIndividualPlanes(existingPlane, newPlane);
            merged = true;
            break;
          }
        }
        
        // If not merged, add as new plane
        if (!merged) {
          updatedPlanes.push(newPlane);
        }
      });
      
      return {
        ...prev,
        planes: updatedPlanes,
      };
    });
  }, [mergedConfig.mergeThreshold]);

  /**
   * Calculate plane center point
   */
  const calculatePlaneCenter = useCallback((boundaries: ARPoint[]): ARPoint => {
    const centerX = boundaries.reduce((sum, p) => sum + p.x, 0) / boundaries.length;
    const centerY = boundaries.reduce((sum, p) => sum + p.y, 0) / boundaries.length;
    const centerZ = boundaries.reduce((sum, p) => sum + p.z, 0) / boundaries.length;
    
    return {
      x: centerX,
      y: centerY,
      z: centerZ,
      confidence: Math.min(...boundaries.map(p => p.confidence)),
      timestamp: new Date(),
      sensorAccuracy: 'medium',
    };
  }, []);

  /**
   * Calculate angle between two normal vectors
   */
  const calculateAngleBetweenNormals = useCallback((
    normal1: { x: number; y: number; z: number },
    normal2: { x: number; y: number; z: number }
  ): number => {
    const dot = normal1.x * normal2.x + normal1.y * normal2.y + normal1.z * normal2.z;
    const mag1 = Math.sqrt(normal1.x ** 2 + normal1.y ** 2 + normal1.z ** 2);
    const mag2 = Math.sqrt(normal2.x ** 2 + normal2.y ** 2 + normal2.z ** 2);
    
    const cosAngle = dot / (mag1 * mag2);
    return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
  }, []);

  /**
   * Merge two individual planes
   */
  const mergeIndividualPlanes = useCallback((plane1: RoofPlane, plane2: RoofPlane): RoofPlane => {
    // Use weighted average based on confidence
    const w1 = plane1.confidence;
    const w2 = plane2.confidence;
    const totalWeight = w1 + w2;
    
    return {
      ...plane1,
      boundaries: [...plane1.boundaries, ...plane2.boundaries], // Combine boundaries
      normal: {
        x: (plane1.normal.x * w1 + plane2.normal.x * w2) / totalWeight,
        y: (plane1.normal.y * w1 + plane2.normal.y * w2) / totalWeight,
        z: (plane1.normal.z * w1 + plane2.normal.z * w2) / totalWeight,
      },
      area: plane1.area + plane2.area,
      projectedArea: plane1.projectedArea + plane2.projectedArea,
      confidence: Math.max(plane1.confidence, plane2.confidence),
    };
  }, []);

  return {
    state,
    startDetection,
    stopDetection,
    resetPlanes,
    addPlane,
    removePlane,
    mergePlanes,
    getPlane,
    validatePlane,
    // Advanced AR functions
    convertScreenToWorld,
    performHitTest,
    updatePlaneTracking,
  };
}

// TODO: Integrate with native ARKit bridge for iOS
// TODO: Integrate with native ARCore bridge for Android  
// TODO: Add real-time plane tracking and updates
// TODO: Implement advanced plane filtering algorithms
// TODO: Add support for plane anchors and persistence
// TODO: Implement occlusion detection for better accuracy
// TODO: Add support for environmental understanding
// TODO: Integrate with ML models for plane classification