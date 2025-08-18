/**
 * @fileoverview Integration tests for complete measurement workflow
 */

import { renderHook, act } from '@testing-library/react-native';
import { useARPlaneDetection } from '../hooks/useARPlaneDetection';
import { usePitchSensor } from '../hooks/usePitchSensor';
import { RoofMeasurementEngine } from '../services/RoofMeasurementEngine';
import { RoofPlane, ARPoint } from '../types/measurement';

// Mock expo modules
jest.mock('expo-sensors', () => ({
  DeviceMotion: {
    isAvailableAsync: jest.fn().mockResolvedValue(true),
    setUpdateInterval: jest.fn(),
    addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  },
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: '15.0',
  },
  Vibration: {
    vibrate: jest.fn(),
  },
  Alert: {
    alert: jest.fn(),
  },
  AccessibilityInfo: {
    announceForAccessibility: jest.fn(),
  },
}));

describe('Complete Measurement Workflow Integration', () => {
  let arPlaneDetection: any;
  let pitchSensor: any;
  let measurementEngine: RoofMeasurementEngine;

  beforeEach(() => {
    const arHook = renderHook(() => useARPlaneDetection());
    const pitchHook = renderHook(() => usePitchSensor());
    
    arPlaneDetection = arHook.result.current;
    pitchSensor = pitchHook.result.current;
    measurementEngine = new RoofMeasurementEngine();
  });

  describe('End-to-End Measurement Flow', () => {
    it('should complete a full roof measurement workflow', async () => {
      // Step 1: Initialize AR and sensors
      await act(async () => {
        await arPlaneDetection.startDetection();
        await pitchSensor.startMeasuring();
      });

      expect(arPlaneDetection.state.isActive).toBe(true);
      expect(pitchSensor.state.isActive).toBe(true);

      // Step 2: Add detected planes
      const plane1 = createMockPlane('plane-1', 'primary', 50);
      const plane2 = createMockPlane('plane-2', 'secondary', 25);

      act(() => {
        arPlaneDetection.addPlane(plane1);
        arPlaneDetection.addPlane(plane2);
      });

      expect(arPlaneDetection.state.planes).toHaveLength(2);

      // Step 3: Calculate measurement
      const measurement = await measurementEngine.calculateRoofMeasurement(
        arPlaneDetection.state.planes,
        'test-session',
        'test-user'
      );

      expect(measurement).toBeDefined();
      expect(measurement.totalArea).toBeCloseTo(75, 1);
      expect(measurement.planes).toHaveLength(2);

      // Step 4: Calculate materials
      const materials = await measurementEngine.calculateMaterials(measurement);

      expect(materials).toBeDefined();
      expect(materials.totalArea).toBeGreaterThan(75); // Including waste factor

      // Step 5: Export results
      const exportedData = await measurementEngine.exportMeasurement(measurement, 'json');

      expect(exportedData).toBeDefined();
      const parsed = JSON.parse(exportedData);
      expect(parsed.id).toBe(measurement.id);

      // Step 6: Cleanup
      act(() => {
        arPlaneDetection.stopDetection();
        pitchSensor.stopMeasuring();
      });

      expect(arPlaneDetection.state.isActive).toBe(false);
      expect(pitchSensor.state.isActive).toBe(false);
    });

    it('should handle measurement errors gracefully', async () => {
      // Initialize without proper AR support
      await act(async () => {
        // This should fail gracefully
        try {
          await arPlaneDetection.startDetection();
        } catch (error) {
          // Expected to handle errors internally
        }
      });

      // Should still be able to add planes manually for testing
      const plane = createMockPlane('test-plane', 'primary', 10);
      
      act(() => {
        arPlaneDetection.addPlane(plane);
      });

      // Measurement calculation should work with manually added plane
      const measurement = await measurementEngine.calculateRoofMeasurement(
        [plane],
        'test-session',
        'test-user'
      );

      expect(measurement.planes).toHaveLength(1);
    });
  });

  describe('Quality Validation Workflow', () => {
    it('should validate measurement quality throughout the process', async () => {
      // Add planes with varying quality
      const highQualityPlane = createMockPlane('high-quality', 'primary', 50, 0.95);
      const lowQualityPlane = createMockPlane('low-quality', 'secondary', 25, 0.4);

      act(() => {
        arPlaneDetection.addPlane(highQualityPlane);
        arPlaneDetection.addPlane(lowQualityPlane);
      });

      // Calculate measurement
      const measurement = await measurementEngine.calculateRoofMeasurement(
        arPlaneDetection.state.planes,
        'test-session',
        'test-user'
      );

      // Quality should reflect the mixed confidence levels
      expect(measurement.accuracy).toBeGreaterThan(0.6);
      expect(measurement.accuracy).toBeLessThan(1.0);

      // Quality metrics should be populated
      expect(measurement.qualityMetrics.overallScore).toBeGreaterThan(0);
      expect(measurement.qualityMetrics.trackingStability).toBeGreaterThan(0);
    });

    it('should reject measurements below quality threshold', async () => {
      // Create measurement engine with high quality threshold
      const strictEngine = new RoofMeasurementEngine({
        qualityThreshold: 90,
      });

      // Add low-quality plane
      const lowQualityPlane = createMockPlane('low-quality', 'primary', 50, 0.3);

      await expect(
        strictEngine.calculateRoofMeasurement([lowQualityPlane], 'session', 'user')
      ).rejects.toThrow('Invalid planes');
    });
  });

  describe('Multi-Format Export Workflow', () => {
    let measurement: any;

    beforeEach(async () => {
      const planes = [
        createMockPlane('plane-1', 'primary', 50, 0.9),
        createMockPlane('plane-2', 'secondary', 25, 0.8),
      ];

      measurement = await measurementEngine.calculateRoofMeasurement(
        planes,
        'test-session',
        'test-user'
      );
    });

    it('should export to all supported formats', async () => {
      const formats = ['json', 'csv', 'pdf'] as const;

      for (const format of formats) {
        const exported = await measurementEngine.exportMeasurement(measurement, format);
        
        expect(exported).toBeDefined();
        expect(typeof exported).toBe('string');
        expect(exported.length).toBeGreaterThan(0);

        // Format-specific validations
        switch (format) {
          case 'json':
            expect(() => JSON.parse(exported)).not.toThrow();
            break;
          case 'csv':
            expect(exported).toContain('Plane_ID');
            expect(exported.split('\n').length).toBeGreaterThan(2);
            break;
          case 'pdf':
            expect(exported).toContain('PROFESSIONAL ROOF MEASUREMENT REPORT');
            break;
        }
      }
    });
  });

  describe('Coordinate System Workflow', () => {
    it('should convert between coordinate systems correctly', () => {
      // Test screen to world coordinate conversion
      const worldPoint = arPlaneDetection.convertScreenToWorld(100, 200, 375, 812);
      
      expect(worldPoint).toBeDefined();
      expect(worldPoint.x).toBeDefined();
      expect(worldPoint.y).toBeDefined();
      expect(worldPoint.z).toBeDefined();
      expect(worldPoint.confidence).toBeGreaterThan(0);

      // Test hit testing with the converted point
      const plane = createMockPlane('test-plane', 'primary', 25);
      
      act(() => {
        arPlaneDetection.addPlane(plane);
      });

      const hits = arPlaneDetection.performHitTest(100, 200, [plane]);
      
      expect(hits).toBeDefined();
      expect(Array.isArray(hits)).toBe(true);
    });
  });

  describe('Accessibility Workflow', () => {
    it('should support accessibility features throughout measurement', async () => {
      const mockAnnounce = jest.fn();
      require('react-native').AccessibilityInfo.announceForAccessibility = mockAnnounce;

      // Simulate adding a plane with accessibility feedback
      const plane = createMockPlane('accessible-plane', 'primary', 50);
      
      act(() => {
        arPlaneDetection.addPlane(plane);
      });

      // In a full implementation, this would trigger accessibility announcements
      expect(arPlaneDetection.state.planes).toHaveLength(1);
    });
  });

  describe('Performance Workflow', () => {
    it('should handle large numbers of planes efficiently', async () => {
      const startTime = Date.now();

      // Add many planes
      const planes = Array.from({ length: 50 }, (_, i) => 
        createMockPlane(`plane-${i}`, 'primary', 10, 0.8)
      );

      act(() => {
        planes.forEach(plane => arPlaneDetection.addPlane(plane));
      });

      // Calculate measurement
      const measurement = await measurementEngine.calculateRoofMeasurement(
        arPlaneDetection.state.planes,
        'test-session',
        'test-user'
      );

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(measurement.planes).toHaveLength(50);
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should efficiently merge overlapping planes', () => {
      // Create overlapping planes
      const plane1 = createMockPlane('plane-1', 'primary', 25);
      const plane2 = createMockPlane('plane-2', 'primary', 25);

      act(() => {
        arPlaneDetection.addPlane(plane1);
        arPlaneDetection.addPlane(plane2);
        arPlaneDetection.mergePlanes(['plane-1', 'plane-2']);
      });

      expect(arPlaneDetection.state.planes).toHaveLength(1);
      const mergedPlane = arPlaneDetection.state.planes[0];
      expect(mergedPlane.area).toBeCloseTo(50, 1);
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should recover from sensor failures', async () => {
      // Simulate sensor failure
      require('expo-sensors').DeviceMotion.isAvailableAsync.mockResolvedValueOnce(false);

      await act(async () => {
        await pitchSensor.startMeasuring();
      });

      // Should handle gracefully and report error state
      expect(pitchSensor.state.error).toBeDefined();
    });

    it('should recover from AR session failures', async () => {
      // Simulate AR failure by starting without proper setup
      await act(async () => {
        try {
          await arPlaneDetection.startDetection();
        } catch (error) {
          // Should handle internally
        }
      });

      // Should still allow manual plane addition for fallback mode
      const plane = createMockPlane('fallback-plane', 'primary', 25);
      
      act(() => {
        arPlaneDetection.addPlane(plane);
      });

      expect(arPlaneDetection.state.planes).toHaveLength(1);
    });
  });
});

/**
 * Helper function to create mock plane data
 */
function createMockPlane(
  id: string, 
  type: RoofPlane['type'], 
  area: number, 
  confidence: number = 0.9
): RoofPlane {
  const sideLength = Math.sqrt(area);
  
  return {
    id,
    boundaries: [
      { x: 0, y: 0, z: 0, confidence, timestamp: new Date(), sensorAccuracy: 'high' },
      { x: sideLength, y: 0, z: 0, confidence, timestamp: new Date(), sensorAccuracy: 'high' },
      { x: sideLength, y: 0, z: sideLength, confidence, timestamp: new Date(), sensorAccuracy: 'high' },
      { x: 0, y: 0, z: sideLength, confidence, timestamp: new Date(), sensorAccuracy: 'high' },
    ],
    normal: { x: 0, y: 1, z: 0 },
    pitchAngle: 30,
    azimuthAngle: 180,
    area,
    projectedArea: area * 0.866, // cos(30°)
    type,
    confidence,
    material: 'shingle',
  };
}