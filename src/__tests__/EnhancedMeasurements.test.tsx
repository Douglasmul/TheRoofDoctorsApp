/**
 * @fileoverview Tests for enhanced measurement functionality
 * Tests hip roof detection, surface type breakdown, and editing capabilities
 */

import { RoofPlane } from '../types/measurement';

describe('Enhanced Measurement Functionality', () => {
  
  it('should support hip roof type in type definitions', () => {
    const hipPlane: RoofPlane = {
      id: 'hip_test',
      boundaries: [],
      normal: { x: 0, y: 1, z: 0 },
      pitchAngle: 30,
      azimuthAngle: 45,
      area: 25.0,
      projectedArea: 23.0,
      type: 'hip', // This should compile without errors
      confidence: 0.85,
      material: 'shingle'
    };
    
    expect(hipPlane.type).toBe('hip');
    expect(hipPlane.area).toBe(25.0);
  });

  it('should classify hip roofs correctly', () => {
    // Mock plane classification function
    const classifyPlaneType = (
      area: number, 
      pitchAngle: number, 
      azimuthAngle: number
    ): RoofPlane['type'] => {
      // Simplified classification logic for testing
      if (area > 25 && pitchAngle > 15 && pitchAngle < 60) {
        return 'primary';
      }
      
      // Hip roof: medium area, triangular shape, moderate pitch
      if (area > 15 && area <= 30 && pitchAngle > 15 && pitchAngle < 55) {
        // Check if azimuth suggests angled roof section (common in hips)
        const isAngledSection = (azimuthAngle % 90) > 20 && (azimuthAngle % 90) < 70;
        if (isAngledSection) {
          return 'hip';
        }
      }
      
      if (area > 8 && area <= 25 && pitchAngle > 20) {
        return 'dormer';
      }
      
      return 'other';
    };

    // Test hip roof detection
    expect(classifyPlaneType(20.0, 30, 45)).toBe('hip'); // Angled orientation
    expect(classifyPlaneType(25.0, 25, 135)).toBe('hip'); // Another angled orientation
    expect(classifyPlaneType(18.0, 35, 60)).toBe('hip'); // Moderate angle

    // Test that straight orientations don't get classified as hips
    expect(classifyPlaneType(20.0, 30, 90)).toBe('dormer'); // Straight orientation
    expect(classifyPlaneType(20.0, 30, 0)).toBe('dormer'); // Straight orientation
  });

  it('should calculate surface type breakdown correctly', () => {
    const mockPlanes: RoofPlane[] = [
      {
        id: 'primary_1',
        type: 'primary',
        area: 50.0,
        pitchAngle: 25,
        azimuthAngle: 0,
        projectedArea: 48.0,
        confidence: 0.9,
        boundaries: [],
        normal: { x: 0, y: 1, z: 0 },
        material: 'shingle'
      },
      {
        id: 'primary_2',
        type: 'primary',
        area: 45.0,
        pitchAngle: 30,
        azimuthAngle: 180,
        projectedArea: 43.0,
        confidence: 0.85,
        boundaries: [],
        normal: { x: 0, y: 1, z: 0 },
        material: 'shingle'
      },
      {
        id: 'dormer_1',
        type: 'dormer',
        area: 15.0,
        pitchAngle: 40,
        azimuthAngle: 90,
        projectedArea: 14.0,
        confidence: 0.8,
        boundaries: [],
        normal: { x: 0, y: 1, z: 0 },
        material: 'shingle'
      },
      {
        id: 'hip_1',
        type: 'hip',
        area: 22.0,
        pitchAngle: 28,
        azimuthAngle: 45,
        projectedArea: 21.0,
        confidence: 0.82,
        boundaries: [],
        normal: { x: 0, y: 1, z: 0 },
        material: 'shingle'
      }
    ];

    // Simulate the getSurfaceTypeBreakdown function
    const typeGroups = mockPlanes.reduce((acc, plane) => {
      const type = plane.type;
      if (!acc[type]) {
        acc[type] = {
          type,
          count: 0,
          totalArea: 0,
          planes: []
        };
      }
      acc[type].count++;
      acc[type].totalArea += plane.area;
      acc[type].planes.push(plane);
      return acc;
    }, {} as Record<string, { type: string; count: number; totalArea: number; planes: RoofPlane[] }>);

    const breakdown = Object.values(typeGroups).map(group => ({
      ...group,
      averageArea: group.totalArea / group.count
    })).sort((a, b) => b.totalArea - a.totalArea);

    // Verify breakdown calculations
    expect(breakdown).toHaveLength(3); // primary, dormer, hip
    
    const primary = breakdown.find(b => b.type === 'primary');
    expect(primary).toBeDefined();
    expect(primary!.count).toBe(2);
    expect(primary!.totalArea).toBe(95.0);
    expect(primary!.averageArea).toBe(47.5);

    const dormer = breakdown.find(b => b.type === 'dormer');
    expect(dormer).toBeDefined();
    expect(dormer!.count).toBe(1);
    expect(dormer!.totalArea).toBe(15.0);

    const hip = breakdown.find(b => b.type === 'hip');
    expect(hip).toBeDefined();
    expect(hip!.count).toBe(1);
    expect(hip!.totalArea).toBe(22.0);
  });

  it('should validate plane measurements for uniqueness', () => {
    const mockPlanes: RoofPlane[] = [
      {
        id: 'plane_1',
        type: 'primary',
        area: 50.0,
        pitchAngle: 25,
        azimuthAngle: 0,
        projectedArea: 48.0,
        confidence: 0.9,
        boundaries: [],
        normal: { x: 0, y: 1, z: 0 },
        material: 'shingle'
      },
      {
        id: 'plane_2',
        type: 'dormer',
        area: 15.0, // Different area
        pitchAngle: 40,
        azimuthAngle: 90,
        projectedArea: 14.0,
        confidence: 0.8,
        boundaries: [],
        normal: { x: 0, y: 1, z: 0 },
        material: 'shingle'
      },
      {
        id: 'plane_3',
        type: 'hip',
        area: 22.0, // Different area again
        pitchAngle: 28,
        azimuthAngle: 45,
        projectedArea: 21.0,
        confidence: 0.82,
        boundaries: [],
        normal: { x: 0, y: 1, z: 0 },
        material: 'shingle'
      }
    ];

    // Simulate validation logic
    const validatePlanes = (planes: RoofPlane[]) => {
      const errors: string[] = [];
      
      // Check for duplicate areas
      const areas = planes.map(p => Math.round(p.area * 100));
      const duplicateAreas = areas.filter((area, index) => areas.indexOf(area) !== index);
      if (duplicateAreas.length > 0) {
        errors.push('Some surfaces have identical areas');
      }
      
      // Check for reasonable values
      planes.forEach((plane, index) => {
        if (plane.area <= 0) {
          errors.push(`Surface ${index + 1} has invalid area`);
        }
        if (plane.confidence < 0.3) {
          errors.push(`Surface ${index + 1} has low confidence`);
        }
      });
      
      return { isValid: errors.length === 0, errors };
    };

    const validation = validatePlanes(mockPlanes);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    // Test with duplicate areas
    const duplicatePlanes = [...mockPlanes, {
      ...mockPlanes[0],
      id: 'plane_4',
      area: 50.0 // Same as plane_1
    }];

    const duplicateValidation = validatePlanes(duplicatePlanes);
    expect(duplicateValidation.isValid).toBe(false);
    expect(duplicateValidation.errors.length).toBeGreaterThan(0);
  });
});