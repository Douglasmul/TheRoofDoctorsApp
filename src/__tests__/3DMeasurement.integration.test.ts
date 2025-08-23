/**
 * @fileoverview Integration test for 3D Measurement implementation
 * Tests basic functionality without requiring WebGL context
 */

import { measurement3DDataService } from '../services/Measurement3DDataService';
import { RoofPlane, ARPoint } from '../types/measurement.d';

describe('3D Measurement Integration', () => {
  beforeEach(() => {
    // Clean up any existing sessions
    measurement3DDataService.getAllSessions().forEach(session => {
      measurement3DDataService.deleteSession(session.id);
    });
  });

  describe('Session Management', () => {
    it('should create a new 3D measurement session', () => {
      const sessionId = 'test-session-1';
      const session = measurement3DDataService.createSession(sessionId);
      
      expect(session).toBeDefined();
      expect(session.id).toBe(sessionId);
      expect(session.vertices.size).toBe(0);
      expect(session.edges.size).toBe(0);
      expect(session.faces.size).toBe(0);
      expect(session.totalArea).toBe(0);
      expect(session.metadata.isValid).toBe(false);
    });

    it('should retrieve an existing session', () => {
      const sessionId = 'test-session-2';
      measurement3DDataService.createSession(sessionId);
      
      const retrieved = measurement3DDataService.getSession(sessionId);
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(sessionId);
    });

    it('should delete a session', () => {
      const sessionId = 'test-session-3';
      measurement3DDataService.createSession(sessionId);
      
      expect(measurement3DDataService.getSession(sessionId)).toBeDefined();
      
      const deleted = measurement3DDataService.deleteSession(sessionId);
      expect(deleted).toBe(true);
      expect(measurement3DDataService.getSession(sessionId)).toBeUndefined();
    });
  });

  describe('2D to 3D Conversion', () => {
    it('should convert roof planes to 3D geometry', () => {
      const sessionId = 'conversion-test';
      measurement3DDataService.createSession(sessionId);

      // Create a simple rectangular roof plane
      const roofPlanes: RoofPlane[] = [{
        id: 'test-plane',
        boundaries: [
          { x: 0, y: 0, z: 0, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
          { x: 10, y: 0, z: 0, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
          { x: 10, y: 15, z: 2, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
          { x: 0, y: 15, z: 2, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
        ],
        normal: { x: 0, y: -0.13, z: 0.99 },
        pitchAngle: 7.5,
        azimuthAngle: 0,
        area: 152.75,
        perimeter: 50,
        projectedArea: 150,
        type: 'primary',
        confidence: 0.85,
        material: 'shingle',
      }];

      const success = measurement3DDataService.convertRoofPlanesTo3D(sessionId, roofPlanes);
      expect(success).toBe(true);

      const session = measurement3DDataService.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session!.vertices.size).toBe(4); // 4 vertices for rectangle
      expect(session!.edges.size).toBe(4); // 4 edges for rectangle
      expect(session!.faces.size).toBe(1); // 1 face
      expect(session!.totalArea).toBe(152.75);
      expect(session!.metadata.isValid).toBe(true);
    });

    it('should convert 3D session back to roof measurement', () => {
      const sessionId = 'conversion-back-test';
      measurement3DDataService.createSession(sessionId);

      // Create test data
      const roofPlanes: RoofPlane[] = [{
        id: 'test-plane-back',
        boundaries: [
          { x: 0, y: 0, z: 0, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
          { x: 8, y: 0, z: 0, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
          { x: 8, y: 12, z: 1.5, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
          { x: 0, y: 12, z: 1.5, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
        ],
        normal: { x: 0, y: -0.124, z: 0.992 },
        pitchAngle: 7.1,
        azimuthAngle: 0,
        area: 97.2,
        perimeter: 40,
        projectedArea: 96,
        type: 'primary',
        confidence: 0.88,
        material: 'metal',
      }];

      measurement3DDataService.convertRoofPlanesTo3D(sessionId, roofPlanes);

      const baseData = {
        id: 'test-measurement',
        propertyId: 'test-property',
        userId: 'test-user',
        timestamp: new Date(),
      };

      const measurement = measurement3DDataService.convertToRoofMeasurement(sessionId, baseData);
      
      expect(measurement).toBeDefined();
      expect(measurement!.id).toBe('test-measurement');
      expect(measurement!.planes.length).toBe(1);
      expect(measurement!.planes[0].area).toBe(97.2);
      expect(measurement!.planes[0].material).toBe('metal');
      expect(measurement!.totalArea).toBe(97.2);
    });
  });

  describe('Geometry Validation', () => {
    it('should validate basic geometry constraints', () => {
      const sessionId = 'validation-test';
      const session = measurement3DDataService.createSession(sessionId);

      // Session should be invalid initially (no geometry)
      expect(session.metadata.isValid).toBe(false);

      // Add some test geometry
      const roofPlanes: RoofPlane[] = [{
        id: 'valid-plane',
        boundaries: [
          { x: 0, y: 0, z: 0, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
          { x: 5, y: 0, z: 0, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
          { x: 2.5, y: 4, z: 1, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
        ],
        normal: { x: 0, y: -0.243, z: 0.97 },
        pitchAngle: 14,
        azimuthAngle: 0,
        area: 10,
        perimeter: 13.4,
        projectedArea: 9.7,
        type: 'primary',
        confidence: 0.8,
        material: 'tile',
      }];

      measurement3DDataService.convertRoofPlanesTo3D(sessionId, roofPlanes);
      
      const updatedSession = measurement3DDataService.getSession(sessionId);
      expect(updatedSession!.metadata.isValid).toBe(true);
      expect(updatedSession!.metadata.vertexCount).toBe(3);
      expect(updatedSession!.metadata.faceCount).toBe(1);
    });

    it('should calculate complexity score', () => {
      const sessionId = 'complexity-test';
      measurement3DDataService.createSession(sessionId);

      // Simple triangle
      const simpleRoof: RoofPlane[] = [{
        id: 'simple-plane',
        boundaries: [
          { x: 0, y: 0, z: 0, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
          { x: 3, y: 0, z: 0, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
          { x: 1.5, y: 2, z: 0.5, confidence: 0.9, timestamp: new Date(), sensorAccuracy: 'high' },
        ],
        normal: { x: 0, y: -0.243, z: 0.97 },
        pitchAngle: 14,
        azimuthAngle: 0,
        area: 3,
        perimeter: 8.2,
        projectedArea: 2.9,
        type: 'primary',
        confidence: 0.8,
        material: 'shingle',
      }];

      measurement3DDataService.convertRoofPlanesTo3D(sessionId, simpleRoof);
      
      const session = measurement3DDataService.getSession(sessionId);
      expect(session!.metadata.complexityScore).toBeGreaterThan(0);
      expect(session!.metadata.complexityScore).toBeLessThan(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid session IDs gracefully', () => {
      expect(measurement3DDataService.getSession('non-existent')).toBeUndefined();
      expect(measurement3DDataService.deleteSession('non-existent')).toBe(false);
      
      const invalidConversion = measurement3DDataService.convertToRoofMeasurement('non-existent', {});
      expect(invalidConversion).toBeNull();
    });

    it('should handle empty roof planes array', () => {
      const sessionId = 'empty-test';
      measurement3DDataService.createSession(sessionId);
      
      const success = measurement3DDataService.convertRoofPlanesTo3D(sessionId, []);
      expect(success).toBe(true);
      
      const session = measurement3DDataService.getSession(sessionId);
      expect(session!.vertices.size).toBe(0);
      expect(session!.faces.size).toBe(0);
      expect(session!.totalArea).toBe(0);
    });
  });
});

// Test helper functions
export function createTestARPoint(x: number, y: number, z: number): ARPoint {
  return {
    x,
    y,
    z,
    confidence: 0.9,
    timestamp: new Date(),
    sensorAccuracy: 'high',
  };
}

export function createTestRoofPlane(id: string, width: number, height: number): RoofPlane {
  return {
    id,
    boundaries: [
      createTestARPoint(0, 0, 0),
      createTestARPoint(width, 0, 0),
      createTestARPoint(width, height, 1),
      createTestARPoint(0, height, 1),
    ],
    normal: { x: 0, y: -0.083, z: 0.997 },
    pitchAngle: 4.75,
    azimuthAngle: 0,
    area: width * height + 2, // Approximate area accounting for slope
    perimeter: 2 * (width + height + 0.1), // Approximate perimeter
    projectedArea: width * height,
    type: 'primary',
    confidence: 0.85,
    material: 'shingle',
  };
}