/**
 * @fileoverview Comprehensive tests for RoofMeasurementEngine
 */

import { RoofMeasurementEngine } from '../services/RoofMeasurementEngine';
import { RoofPlane, ARPoint, RoofMeasurement } from '../types/measurement';

describe('RoofMeasurementEngine', () => {
  let engine: RoofMeasurementEngine;
  
  beforeEach(() => {
    engine = new RoofMeasurementEngine({
      unitSystem: 'metric',
      areaPrecision: 2,
      pitchCorrectionMethod: 'advanced',
      wasteFactorPercent: 10,
      qualityThreshold: 75,
      geometryValidation: true,
    });
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultEngine = new RoofMeasurementEngine();
      expect(defaultEngine).toBeDefined();
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        unitSystem: 'imperial' as const,
        areaPrecision: 3,
        pitchCorrectionMethod: 'trigonometric' as const,
      };
      
      const customEngine = new RoofMeasurementEngine(customConfig);
      expect(customEngine).toBeDefined();
    });
  });

  describe('Roof Measurement Calculation', () => {
    it('should calculate roof measurement from valid planes', async () => {
      const planes = createMockPlanes();
      const sessionId = 'test-session-123';
      const userId = 'test-user-456';

      const measurement = await engine.calculateRoofMeasurement(planes, sessionId, userId);

      expect(measurement).toBeDefined();
      expect(measurement.id).toBeDefined();
      expect(measurement.userId).toBe(userId);
      expect(measurement.planes).toHaveLength(2);
      expect(measurement.totalArea).toBeGreaterThan(0);
      expect(measurement.totalProjectedArea).toBeGreaterThan(0);
      expect(measurement.accuracy).toBeGreaterThanOrEqual(0);
      expect(measurement.accuracy).toBeLessThanOrEqual(1);
    });

    it('should handle empty plane array', async () => {
      const planes: RoofPlane[] = [];
      const sessionId = 'test-session-123';
      const userId = 'test-user-456';

      await expect(
        engine.calculateRoofMeasurement(planes, sessionId, userId)
      ).rejects.toThrow('Invalid planes');
    });

    it('should include audit trail entries', async () => {
      const planes = createMockPlanes();
      const sessionId = 'test-session-123';
      const userId = 'test-user-456';

      const measurement = await engine.calculateRoofMeasurement(planes, sessionId, userId);

      expect(measurement.auditTrail).toBeDefined();
      expect(measurement.auditTrail.length).toBeGreaterThan(0);
      expect(measurement.auditTrail[0].action).toBe('create');
      expect(measurement.auditTrail[0].userId).toBe(userId);
    });
  });

  describe('Material Calculation', () => {
    it('should calculate materials for shingle roof', async () => {
      const measurement = await createMockMeasurement('shingle');
      const materials = await engine.calculateMaterials(measurement);

      expect(materials).toBeDefined();
      expect(materials.totalArea).toBeGreaterThan(0);
      expect(materials.dominantMaterial).toBe('shingle');
      expect(materials.materialSpecific.shingleBundles).toBeGreaterThan(0);
      expect(materials.costEstimate).toBeDefined();
      expect(materials.costEstimate!.totalCost).toBeGreaterThan(0);
    });

    it('should calculate materials for metal roof', async () => {
      const measurement = await createMockMeasurement('metal');
      const materials = await engine.calculateMaterials(measurement);

      expect(materials.dominantMaterial).toBe('metal');
      expect(materials.materialSpecific.metalSheets).toBeGreaterThan(0);
    });

    it('should calculate materials for tile roof', async () => {
      const measurement = await createMockMeasurement('tile');
      const materials = await engine.calculateMaterials(measurement);

      expect(materials.dominantMaterial).toBe('tile');
      expect(materials.materialSpecific.tiles).toBeGreaterThan(0);
    });

    it('should apply complexity factor for complex roofs', async () => {
      const complexPlanes = [
        createMockPlane('plane-1', 'primary', 'shingle', 10, 30, 0),
        createMockPlane('plane-2', 'secondary', 'shingle', 5, 45, 90),
        createMockPlane('plane-3', 'dormer', 'shingle', 2, 60, 180),
        createMockPlane('plane-4', 'chimney', 'shingle', 1, 80, 270),
        createMockPlane('plane-5', 'other', 'shingle', 3, 35, 45),
      ];
      
      const measurement = createMockMeasurementFromPlanes(complexPlanes);
      const materials = await engine.calculateMaterials(measurement);

      // Complex roof should have higher waste percentage
      expect(materials.wastePercent).toBeGreaterThan(10);
    });
  });

  describe('Export Functionality', () => {
    it('should export measurement as JSON', async () => {
      const measurement = await createMockMeasurement('shingle');
      const exported = await engine.exportMeasurement(measurement, 'json');

      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(parsed).toHaveProperty('id');
      expect(parsed).toHaveProperty('planes');
    });

    it('should export measurement as CSV', async () => {
      const measurement = await createMockMeasurement('shingle');
      const exported = await engine.exportMeasurement(measurement, 'csv');

      expect(typeof exported).toBe('string');
      expect(exported).toContain('Plane ID');
      expect(exported).toContain('Type');
      expect(exported).toContain('Material');
      expect(exported.split('\n').length).toBeGreaterThan(2); // Header + data rows
    });

    it('should export measurement as PDF', async () => {
      const measurement = await createMockMeasurement('shingle');
      const exported = await engine.exportMeasurement(measurement, 'pdf');

      expect(typeof exported).toBe('string');
      expect(exported).toContain('PROFESSIONAL ROOF MEASUREMENT REPORT');
      expect(exported).toContain('MEASUREMENT OVERVIEW');
      expect(exported).toContain('ROOF SURFACE DETAILS');
    });

    it('should handle unsupported export format', async () => {
      const measurement = await createMockMeasurement('shingle');

      await expect(
        engine.exportMeasurement(measurement, 'unsupported' as any)
      ).rejects.toThrow('Unsupported export format');
    });
  });

  describe('Geometric Validation', () => {
    it('should validate valid plane geometry', () => {
      const validPlane = createMockPlane('valid', 'primary', 'shingle', 25, 30, 180);
      const isValid = (engine as any).isValidPlaneGeometry(validPlane);
      expect(isValid).toBe(true);
    });

    it('should reject planes with insufficient boundaries', () => {
      const invalidPlane = createMockPlane('invalid', 'primary', 'shingle', 25, 30, 180);
      invalidPlane.boundaries = invalidPlane.boundaries.slice(0, 2); // Only 2 points
      
      const isValid = (engine as any).isValidPlaneGeometry(invalidPlane);
      expect(isValid).toBe(false);
    });

    it('should reject self-intersecting polygons', () => {
      const selfIntersectingPlane = createMockPlane('invalid', 'primary', 'shingle', 25, 30, 180);
      // Create self-intersecting boundary (bow-tie shape)
      selfIntersectingPlane.boundaries = [
        { x: 0, y: 0, z: 0, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
        { x: 2, y: 0, z: 2, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
        { x: 2, y: 0, z: 0, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
        { x: 0, y: 0, z: 2, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
      ];
      
      const isValid = (engine as any).isValidPlaneGeometry(selfIntersectingPlane);
      expect(isValid).toBe(false);
    });

    it('should detect collinear points', () => {
      const areCollinear = (engine as any).arePointsCollinear(
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 }
      );
      expect(areCollinear).toBe(true);

      const areNotCollinear = (engine as any).arePointsCollinear(
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 }
      );
      expect(areNotCollinear).toBe(false);
    });

    it('should detect line intersections', () => {
      const doIntersect = (engine as any).doLinesIntersect(
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: 1, y: -1, z: 0 },
        { x: 1, y: 1, z: 0 }
      );
      expect(doIntersect).toBe(true);

      const doNotIntersect = (engine as any).doLinesIntersect(
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: 3, y: 0, z: 0 }
      );
      expect(doNotIntersect).toBe(false);
    });
  });

  describe('Pitch Correction', () => {
    it('should apply trigonometric pitch correction', () => {
      const testEngine = new RoofMeasurementEngine({
        pitchCorrectionMethod: 'trigonometric',
      });
      
      const correctedArea = (testEngine as any).applyPitchCorrection(100, 30);
      // cos(30°) ≈ 0.866
      expect(correctedArea).toBeCloseTo(86.6, 1);
    });

    it('should apply advanced pitch correction', () => {
      const correctedArea = (engine as any).applyPitchCorrection(100, 30);
      // Advanced method should be close to but not exactly trigonometric
      expect(correctedArea).toBeGreaterThan(85);
      expect(correctedArea).toBeLessThan(90);
    });

    it('should handle zero pitch angle', () => {
      const correctedArea = (engine as any).applyPitchCorrection(100, 0);
      expect(correctedArea).toBeCloseTo(100, 1);
    });
  });

  describe('Quality Metrics', () => {
    it('should calculate quality metrics', () => {
      const planes = createMockPlanes();
      const processingTime = 5000; // 5 seconds
      
      const qualityMetrics = (engine as any).calculateQualityMetrics(planes, processingTime);
      
      expect(qualityMetrics.overallScore).toBeGreaterThanOrEqual(0);
      expect(qualityMetrics.overallScore).toBeLessThanOrEqual(100);
      expect(qualityMetrics.duration).toBe(5);
      expect(qualityMetrics.pointDensity).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid measurement data', async () => {
      const invalidPlanes = [
        {
          ...createMockPlane('invalid', 'primary', 'shingle', 0, 30, 180),
          area: -10, // Invalid negative area
        }
      ];

      await expect(
        engine.calculateRoofMeasurement(invalidPlanes, 'session', 'user')
      ).rejects.toThrow();
    });

    it('should handle material calculation errors gracefully', async () => {
      const measurement = await createMockMeasurement('shingle');
      measurement.totalProjectedArea = 0; // Invalid area
      
      const materials = await engine.calculateMaterials(measurement);
      expect(materials.totalArea).toBe(0);
    });
  });
});

/**
 * Helper functions for creating mock data
 */

function createMockPlanes(): RoofPlane[] {
  return [
    createMockPlane('plane-1', 'primary', 'shingle', 50, 30, 180),
    createMockPlane('plane-2', 'secondary', 'shingle', 25, 35, 90),
  ];
}

function createMockPlane(
  id: string,
  type: RoofPlane['type'],
  material: RoofPlane['material'],
  area: number,
  pitchAngle: number,
  azimuthAngle: number
): RoofPlane {
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
    pitchAngle,
    azimuthAngle,
    area,
    projectedArea: area * Math.cos(pitchAngle * Math.PI / 180),
    type,
    confidence: 0.9,
    material,
  };
}

async function createMockMeasurement(dominantMaterial: RoofPlane['material']): Promise<RoofMeasurement> {
  const planes = [
    createMockPlane('plane-1', 'primary', dominantMaterial, 50, 30, 180),
    createMockPlane('plane-2', 'secondary', dominantMaterial, 25, 35, 90),
  ];
  
  return createMockMeasurementFromPlanes(planes);
}

function createMockMeasurementFromPlanes(planes: RoofPlane[]): RoofMeasurement {
  const totalArea = planes.reduce((sum, plane) => sum + plane.area, 0);
  const totalProjectedArea = planes.reduce((sum, plane) => sum + plane.projectedArea, 0);
  
  return {
    id: 'test-measurement-123',
    propertyId: 'test-property-456',
    userId: 'test-user-789',
    timestamp: new Date(),
    planes,
    totalArea,
    totalProjectedArea,
    accuracy: 0.85,
    deviceInfo: {
      platform: 'ios',
      version: '15.0',
      model: 'iPhone 13 Pro',
      sensors: ['accelerometer', 'gyroscope', 'camera'],
      arCapabilities: 'ARKit',
      timestamp: new Date().toISOString(),
    },
    qualityMetrics: {
      overallScore: 85,
      trackingStability: 90,
      pointDensity: 5.2,
      duration: 30,
      trackingInterruptions: 0,
      lightingQuality: 80,
      movementSmoothness: 75,
    },
    auditTrail: [
      {
        id: 'audit-1',
        timestamp: new Date(),
        action: 'create',
        userId: 'test-user-789',
        sessionId: 'test-session-123',
        details: 'Measurement created',
        metadata: {
          platform: 'ios',
          version: '1.0.0',
        },
      },
    ],
    exports: [],
    complianceStatus: {
      status: 'compliant',
      standards: ['ISO-25178', 'ASTM-E2738'],
      certifications: [],
      lastCheck: new Date(),
      nextCheck: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: [],
    },
    metadata: {
      calculationMethod: 'advanced',
      unitSystem: 'metric',
      version: '1.0.0',
      processingTime: 5000,
    },
  };
}