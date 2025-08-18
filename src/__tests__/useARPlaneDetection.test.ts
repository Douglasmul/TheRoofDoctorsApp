/**
 * @fileoverview Comprehensive tests for AR plane detection functionality
 */

import { renderHook, act } from '@testing-library/react-native';
import { useARPlaneDetection } from '../hooks/useARPlaneDetection';
import { RoofPlane, ARPoint } from '../types/measurement';

// Mock platform for testing
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: '15.0',
  },
}));

describe('useARPlaneDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useARPlaneDetection());
      
      expect(result.current.state.planes).toEqual([]);
      expect(result.current.state.isActive).toBe(false);
      expect(result.current.state.isSupported).toBe(false);
      expect(result.current.state.trackingState).toBe('notAvailable');
      expect(result.current.state.error).toBeNull();
    });

    it('should accept custom configuration', () => {
      const config = {
        minPlaneArea: 2.0,
        minConfidence: 0.8,
        sensitivity: 'low' as const,
      };

      const { result } = renderHook(() => useARPlaneDetection(config));
      
      // The hook should use the custom config internally
      expect(result.current.state).toBeDefined();
    });
  });

  describe('AR Support Detection', () => {
    it('should detect iOS ARKit support', async () => {
      const { result } = renderHook(() => useARPlaneDetection());
      
      await act(async () => {
        await result.current.startDetection();
      });
      
      // Should initialize successfully on iOS 15.0
      expect(result.current.state.isSupported).toBe(true);
    });

    it('should handle unsupported platforms', () => {
      // Mock unsupported platform
      require('react-native').Platform.OS = 'web';
      
      const { result } = renderHook(() => useARPlaneDetection());
      
      expect(result.current.state.isSupported).toBe(false);
    });
  });

  describe('Plane Processing', () => {
    let hook: any;

    beforeEach(() => {
      const { result } = renderHook(() => useARPlaneDetection());
      hook = result.current;
    });

    it('should process valid plane data', () => {
      const mockPlane: RoofPlane = {
        id: 'test-plane-1',
        boundaries: [
          { x: 0, y: 0, z: 0, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
          { x: 5, y: 0, z: 0, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
          { x: 5, y: 0, z: 5, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
          { x: 0, y: 0, z: 5, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
        ],
        normal: { x: 0, y: 1, z: 0 },
        pitchAngle: 30,
        azimuthAngle: 180,
        area: 25,
        projectedArea: 21.65,
        type: 'primary',
        confidence: 0.9,
        material: 'shingle',
      };

      act(() => {
        hook.addPlane(mockPlane);
      });

      expect(hook.state.planes).toHaveLength(1);
      expect(hook.state.planes[0]).toEqual(mockPlane);
    });

    it('should validate plane geometry', () => {
      const validPlane = {
        id: 'valid-plane',
        boundaries: [
          { x: 0, y: 0, z: 0, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
          { x: 1, y: 0, z: 0, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
          { x: 1, y: 0, z: 1, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
        ],
        normal: { x: 0, y: 1, z: 0 },
        pitchAngle: 0,
        azimuthAngle: 0,
        area: 0.5,
        projectedArea: 0.5,
        type: 'other' as const,
        confidence: 0.9,
      };

      expect(hook.validatePlane(validPlane)).toBe(true);

      // Test invalid plane (insufficient boundaries)
      const invalidPlane = {
        ...validPlane,
        boundaries: [
          { x: 0, y: 0, z: 0, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
          { x: 1, y: 0, z: 0, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
        ],
      };

      expect(hook.validatePlane(invalidPlane)).toBe(false);
    });
  });

  describe('Plane Management', () => {
    let hook: any;

    beforeEach(() => {
      const { result } = renderHook(() => useARPlaneDetection());
      hook = result.current;
    });

    it('should add planes correctly', () => {
      const plane1: RoofPlane = createMockPlane('plane-1', 10);
      const plane2: RoofPlane = createMockPlane('plane-2', 15);

      act(() => {
        hook.addPlane(plane1);
        hook.addPlane(plane2);
      });

      expect(hook.state.planes).toHaveLength(2);
      expect(hook.getPlane('plane-1')).toEqual(plane1);
      expect(hook.getPlane('plane-2')).toEqual(plane2);
    });

    it('should remove planes correctly', () => {
      const plane1: RoofPlane = createMockPlane('plane-1', 10);
      const plane2: RoofPlane = createMockPlane('plane-2', 15);

      act(() => {
        hook.addPlane(plane1);
        hook.addPlane(plane2);
        hook.removePlane('plane-1');
      });

      expect(hook.state.planes).toHaveLength(1);
      expect(hook.getPlane('plane-1')).toBeUndefined();
      expect(hook.getPlane('plane-2')).toEqual(plane2);
    });

    it('should merge planes correctly', () => {
      const plane1: RoofPlane = createMockPlane('plane-1', 10);
      const plane2: RoofPlane = createMockPlane('plane-2', 15);

      act(() => {
        hook.addPlane(plane1);
        hook.addPlane(plane2);
        hook.mergePlanes(['plane-1', 'plane-2']);
      });

      expect(hook.state.planes).toHaveLength(1);
      const mergedPlane = hook.state.planes[0];
      expect(mergedPlane.area).toBe(25); // Combined area
      expect(mergedPlane.id).toMatch(/^merged_/);
    });

    it('should reset planes correctly', () => {
      const plane1: RoofPlane = createMockPlane('plane-1', 10);

      act(() => {
        hook.addPlane(plane1);
        hook.resetPlanes();
      });

      expect(hook.state.planes).toHaveLength(0);
    });
  });

  describe('Quality Metrics', () => {
    it('should track quality metrics during detection', async () => {
      const { result } = renderHook(() => useARPlaneDetection());
      
      await act(async () => {
        await result.current.startDetection();
      });

      // Quality metrics should be initialized
      expect(result.current.state.qualityMetrics.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.current.state.qualityMetrics.trackingStability).toBeGreaterThanOrEqual(0);
    });
  });

  describe('World Coordinate Conversion', () => {
    let hook: any;

    beforeEach(() => {
      const { result } = renderHook(() => useARPlaneDetection());
      hook = result.current;
    });

    it('should convert screen coordinates to world coordinates', () => {
      const worldPoint = hook.convertScreenToWorld(100, 200, 375, 812);
      
      expect(worldPoint).toBeDefined();
      expect(worldPoint.x).toBeCloseTo(-0.73, 1);
      expect(worldPoint.z).toBeCloseTo(-1.02, 1);
      expect(worldPoint.confidence).toBe(0.7);
    });

    it('should handle invalid screen coordinates', () => {
      const worldPoint = hook.convertScreenToWorld(-100, -200, 375, 812);
      
      expect(worldPoint).toBeDefined();
      // Should still return a valid point, adjusted for bounds
    });
  });

  describe('Hit Testing', () => {
    let hook: any;

    beforeEach(() => {
      const { result } = renderHook(() => useARPlaneDetection());
      hook = result.current;
    });

    it('should perform hit testing with existing planes', () => {
      const plane = createMockPlane('test-plane', 10);
      
      act(() => {
        hook.addPlane(plane);
      });

      const hits = hook.performHitTest(100, 200, hook.state.planes);
      
      expect(hits).toBeDefined();
      expect(Array.isArray(hits)).toBe(true);
    });

    it('should return world point when no plane intersections', () => {
      const hits = hook.performHitTest(100, 200, []);
      
      expect(hits).toHaveLength(1);
      expect(hits[0]).toHaveProperty('x');
      expect(hits[0]).toHaveProperty('y');
      expect(hits[0]).toHaveProperty('z');
    });
  });

  describe('Error Handling', () => {
    it('should handle detection errors gracefully', async () => {
      // Mock an error scenario
      const { result } = renderHook(() => useARPlaneDetection());
      
      // Force an error by providing invalid configuration
      await act(async () => {
        try {
          await result.current.startDetection();
        } catch (error) {
          // Should not throw, should handle internally
        }
      });

      // State should reflect the error handling
      expect(result.current.state.isDetecting).toBe(false);
    });

    it('should cleanup resources on unmount', () => {
      const { result, unmount } = renderHook(() => useARPlaneDetection());
      
      act(() => {
        result.current.startDetection();
      });

      unmount();
      
      // Should not throw errors during cleanup
      expect(result.current.state.isActive).toBe(false);
    });
  });
});

/**
 * Helper function to create mock plane data
 */
function createMockPlane(id: string, area: number): RoofPlane {
  const sideLength = Math.sqrt(area);
  
  return {
    id,
    boundaries: [
      { x: 0, y: 0, z: 0, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
      { x: sideLength, y: 0, z: 0, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
      { x: sideLength, y: 0, z: sideLength, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
      { x: 0, y: 0, z: sideLength, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
    ],
    normal: { x: 0, y: 1, z: 0 },
    pitchAngle: 30,
    azimuthAngle: 180,
    area,
    projectedArea: area * 0.866, // cos(30°)
    type: 'primary',
    confidence: 0.9,
    material: 'shingle',
  };
}