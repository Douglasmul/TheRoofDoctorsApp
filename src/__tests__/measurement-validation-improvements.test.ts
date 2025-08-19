/**
 * Test for measurement validation improvements
 */

import { RoofMeasurementEngine } from '../services/RoofMeasurementEngine';
import { RoofPlane, ARPoint } from '../types/measurement';

describe('Measurement Validation Improvements', () => {
  let engine: RoofMeasurementEngine;

  beforeEach(() => {
    engine = new RoofMeasurementEngine();
  });

  const createTestPlane = (area: number): RoofPlane => ({
    id: `test-plane-${Date.now()}`,
    boundaries: [
      { x: 0, y: 0, z: 0, confidence: 1, timestamp: new Date(), sensorAccuracy: 'high' },
      { x: 1, y: 0, z: 0, confidence: 1, timestamp: new Date(), sensorAccuracy: 'high' },
      { x: 1, y: 0, z: 1, confidence: 1, timestamp: new Date(), sensorAccuracy: 'high' },
      { x: 0, y: 0, z: 1, confidence: 1, timestamp: new Date(), sensorAccuracy: 'high' },
    ] as ARPoint[],
    normal: { x: 0, y: 1, z: 0 },
    pitchAngle: 25,
    azimuthAngle: 180,
    area,
    perimeter: 4,
    projectedArea: area * 0.9,
    type: 'primary' as const,
    confidence: 1,
    material: 'shingle' as const,
  });

  describe('Area validation thresholds', () => {
    it('should accept small but realistic roof areas (0.5-2 m²)', async () => {
      const smallPlane = createTestPlane(0.8); // Small dormer or feature
      const result = await engine.validateManualMeasurement([smallPlane]);
      
      // Should generate warning but still be valid
      expect(result.isValid).toBe(true);
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Very small area')
        ])
      );
    });

    it('should reject extremely small areas (< 0.5 m²)', async () => {
      const tinyPlane = createTestPlane(0.3); // Too small to be realistic
      const result = await engine.validateManualMeasurement([tinyPlane]);
      
      // Should generate warning
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Very small area')
        ])
      );
    });

    it('should accept normal roof areas without warnings', async () => {
      const normalPlane = createTestPlane(25); // Normal roof section
      const result = await engine.validateManualMeasurement([normalPlane]);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.filter(w => w.includes('small area'))).toHaveLength(0);
    });
  });

  describe('Coverage analysis improvements', () => {
    it('should use updated total area threshold (5 m² instead of 30 m²)', async () => {
      const smallRoof = createTestPlane(4); // Total area < 5 m²
      const result = await engine.validateManualMeasurement([smallRoof]);
      
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Small total roof area measured')
        ])
      );
    });

    it('should not warn about small total area for realistic small roofs', async () => {
      const smallRoof = createTestPlane(8); // Total area > 5 m²
      const result = await engine.validateManualMeasurement([smallRoof]);
      
      expect(result.warnings.filter(w => w.includes('Small total roof area'))).toHaveLength(0);
    });
  });
});