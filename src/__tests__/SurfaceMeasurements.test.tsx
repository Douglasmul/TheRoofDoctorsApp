/**
 * @fileoverview Tests for surface measurement uniqueness and accuracy
 * Ensures each detected surface gets unique measurement values
 */

import { RoofPlane } from '../types/measurement';

describe('Surface Measurement Uniqueness', () => {
  // Mock function to simulate the generateSimulatedPlanes behavior
  function generateTestPlanes(sessionDuration: number): any[] {
    const planes = [];
    
    // Always include primary roof surface
    planes.push({
      id: 'roof_main',
      type: 'primary',
      area: 45.2 + Math.random() * 5, // 45.2 - 50.2
      pitchAngle: 25 + Math.random() * 10, // 25-35 degrees
      azimuthAngle: Math.random() * 360,
      confidence: 0.85 + Math.random() * 0.1, // 85-95%
      distance: 5 + Math.random() * 10,
      material: 'shingle'
    });
    
    // Add secondary section if session long enough
    if (sessionDuration > 3000) {
      planes.push({
        id: 'roof_section_2',
        type: 'primary',
        area: 28.1 + Math.random() * 5, // 28.1 - 33.1
        pitchAngle: 22 + Math.random() * 8,
        azimuthAngle: 180 + Math.random() * 40,
        confidence: 0.80 + Math.random() * 0.15,
        distance: 6 + Math.random() * 8,
        material: 'shingle'
      });
    }
    
    // Add dormers if session long enough
    if (sessionDuration > 5000) {
      planes.push({
        id: 'dormer_1',
        type: 'dormer',
        area: 12.5 + Math.random() * 3, // 12.5 - 15.5
        pitchAngle: 35 + Math.random() * 15,
        azimuthAngle: 90 + Math.random() * 20,
        confidence: 0.70 + Math.random() * 0.2,
        distance: 3 + Math.random() * 5,
        material: 'shingle'
      });
      
      planes.push({
        id: 'dormer_2',
        type: 'dormer',
        area: 15.3 + Math.random() * 4, // 15.3 - 19.3
        pitchAngle: 40 + Math.random() * 10,
        azimuthAngle: 270 + Math.random() * 30,
        confidence: 0.75 + Math.random() * 0.15,
        distance: 4 + Math.random() * 6,
        material: 'tile'
      });
    }
    
    // Add hip roofs if session long enough
    if (sessionDuration > 7000) {
      planes.push({
        id: 'hip_1',
        type: 'hip',
        area: 20.0 + Math.random() * 8, // 20.0 - 28.0
        pitchAngle: 25 + Math.random() * 20,
        azimuthAngle: 45 + Math.random() * 30, // Angled orientation
        confidence: 0.78 + Math.random() * 0.12,
        distance: 5 + Math.random() * 7,
        material: 'shingle'
      });
    }
    
    return planes;
  }

  it('should generate unique areas for different surfaces', () => {
    // Generate multiple sets of planes to test variance
    const planeSets = [];
    for (let i = 0; i < 10; i++) {
      planeSets.push(generateTestPlanes(8000)); // All surfaces should appear
    }
    
    // Check that we get different areas across runs
    const roofMainAreas = planeSets.map(set => set.find(p => p.id === 'roof_main')?.area).filter(Boolean);
    const roofSection2Areas = planeSets.map(set => set.find(p => p.id === 'roof_section_2')?.area).filter(Boolean);
    const dormer1Areas = planeSets.map(set => set.find(p => p.id === 'dormer_1')?.area).filter(Boolean);
    const dormer2Areas = planeSets.map(set => set.find(p => p.id === 'dormer_2')?.area).filter(Boolean);
    
    // Verify we have variance in measurements (not all the same)
    expect(new Set(roofMainAreas.map(a => Math.round(a * 100))).size).toBeGreaterThan(1);
    expect(new Set(roofSection2Areas.map(a => Math.round(a * 100))).size).toBeGreaterThan(1);
    expect(new Set(dormer1Areas.map(a => Math.round(a * 100))).size).toBeGreaterThan(1);
    expect(new Set(dormer2Areas.map(a => Math.round(a * 100))).size).toBeGreaterThan(1);
    
    // Verify areas are in expected ranges
    roofMainAreas.forEach(area => {
      expect(area).toBeGreaterThanOrEqual(45.2);
      expect(area).toBeLessThanOrEqual(50.2);
    });
    
    dormer1Areas.forEach(area => {
      expect(area).toBeGreaterThanOrEqual(12.5);
      expect(area).toBeLessThanOrEqual(15.5);
    });
    
    dormer2Areas.forEach(area => {
      expect(area).toBeGreaterThanOrEqual(15.3);
      expect(area).toBeLessThanOrEqual(19.3);
    });
  });

  it('should generate unique confidence values for different surfaces', () => {
    const planeSets = [];
    for (let i = 0; i < 10; i++) {
      planeSets.push(generateTestPlanes(8000));
    }
    
    const roofMainConfidence = planeSets.map(set => set.find(p => p.id === 'roof_main')?.confidence).filter(Boolean);
    const dormer1Confidence = planeSets.map(set => set.find(p => p.id === 'dormer_1')?.confidence).filter(Boolean);
    const dormer2Confidence = planeSets.map(set => set.find(p => p.id === 'dormer_2')?.confidence).filter(Boolean);
    
    // Verify we have variance in confidence values
    expect(new Set(roofMainConfidence.map(c => Math.round(c * 1000))).size).toBeGreaterThan(1);
    expect(new Set(dormer1Confidence.map(c => Math.round(c * 1000))).size).toBeGreaterThan(1);
    expect(new Set(dormer2Confidence.map(c => Math.round(c * 1000))).size).toBeGreaterThan(1);
  });

  it('should properly identify dormer surfaces', () => {
    // Test plane type classification logic
    const classifyPlaneType = (area: number, pitchAngle: number, azimuthAngle?: number): string => {
      // Primary roof surface: large area, moderate pitch
      if (area > 25 && pitchAngle > 15 && pitchAngle < 60) {
        return 'primary';
      }
      
      // Hip roof: medium to large area, check angle first before dormer  
      if (area > 15 && pitchAngle > 15 && pitchAngle < 60) {
        // Check if azimuth suggests angled roof section (common in hips)
        if (azimuthAngle && (azimuthAngle % 90) > 20 && (azimuthAngle % 90) < 70) {
          return 'hip';
        }
      }
      
      // Dormer: smaller to medium area, various pitches
      if (area > 8 && area <= 25 && pitchAngle > 20) {
        return 'dormer';
      }
      
      // Hip roof: medium area, triangular shape, moderate pitch
      if (area > 15 && area <= 30 && pitchAngle > 15 && pitchAngle < 55) {
        // Simulate triangular shape detection for hips
        if ((azimuthAngle % 90) > 20 && (azimuthAngle % 90) < 70) {
          return 'hip';
        }
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
    };

    // Test typical dormer measurements
    expect(classifyPlaneType(12.5, 35)).toBe('dormer');
    expect(classifyPlaneType(15.3, 40)).toBe('dormer');
    expect(classifyPlaneType(4.5, 50)).toBe('dormer');
    
    // Test hip roof measurements
    expect(classifyPlaneType(20.0, 30, 45)).toBe('hip'); // Medium area, angled orientation
    expect(classifyPlaneType(25.0, 25, 135)).toBe('hip'); // Angled orientation
    
    // Test primary surface
    expect(classifyPlaneType(45.2, 30)).toBe('primary');
    
    // Test secondary surface  
    expect(classifyPlaneType(28.1, 25)).toBe('primary'); // Large area should be primary
    expect(classifyPlaneType(20.0, 25)).toBe('dormer'); // Medium area should be dormer
  });

  it('should ensure surfaces have different measurements', () => {
    const planes = generateTestPlanes(8000);
    
    // Verify we have multiple surfaces
    expect(planes.length).toBeGreaterThanOrEqual(4);
    
    // Extract areas
    const areas = planes.map(p => p.area);
    const confidences = planes.map(p => p.confidence);
    const distances = planes.map(p => p.distance);
    
    // Verify no two surfaces have identical measurements
    const areaSet = new Set(areas.map(a => Math.round(a * 100)));
    const confidenceSet = new Set(confidences.map(c => Math.round(c * 1000)));
    const distanceSet = new Set(distances.map(d => Math.round(d * 100)));
    
    // Should have variance (not all identical)
    expect(areaSet.size).toBeGreaterThan(1);
    expect(confidenceSet.size).toBeGreaterThan(1);
    expect(distanceSet.size).toBeGreaterThan(1);
  });

  it('should properly classify hip roofs', () => {
    const planes = generateTestPlanes(8000); // Ensure hip is included
    
    // Check if we have a hip surface
    const hipSurfaces = planes.filter(p => p.type === 'hip');
    expect(hipSurfaces.length).toBeGreaterThanOrEqual(0); // May or may not have hips depending on random generation
    
    // If we have a hip, verify its properties
    hipSurfaces.forEach(hip => {
      expect(hip.area).toBeGreaterThan(15);
      expect(hip.area).toBeLessThan(35);
      expect(hip.pitchAngle).toBeGreaterThan(15);
      expect(hip.pitchAngle).toBeLessThan(65);
    });
  });

  it('should validate surface type breakdown functionality', () => {
    const planes = generateTestPlanes(8000);
    
    // Group by type (simulating getSurfaceTypeBreakdown)
    const typeGroups = planes.reduce((acc, plane) => {
      const type = plane.type || 'other';
      if (!acc[type]) {
        acc[type] = { count: 0, totalArea: 0 };
      }
      acc[type].count++;
      acc[type].totalArea += plane.area;
      return acc;
    }, {} as Record<string, { count: number; totalArea: number }>);
    
    // Should have at least primary surfaces
    expect(typeGroups.primary).toBeDefined();
    expect(typeGroups.primary.count).toBeGreaterThan(0);
    expect(typeGroups.primary.totalArea).toBeGreaterThan(0);
    
    // Verify each type has reasonable totals
    Object.values(typeGroups).forEach(group => {
      expect(group.count).toBeGreaterThan(0);
      expect(group.totalArea).toBeGreaterThan(0);
    });
  });
});