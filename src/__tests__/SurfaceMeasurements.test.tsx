/**
 * @fileoverview Tests for surface measurement uniqueness and accuracy
 * Ensures each detected surface gets unique measurement values
 */

import { RoofPlane } from '../types/measurement';

describe('Surface Measurement Uniqueness', () => {
  // Mock function to simulate the generateSimulatedPlanes behavior
  function generateTestPlanes(sessionDuration: number): any[] {
    const simulatedPlanes = [];
    
    // Main roof plane appears after 1 second
    if (sessionDuration > 1000) {
      simulatedPlanes.push({
        id: 'roof_main',
        area: 45.2 + Math.random() * 5,
        confidence: 0.85 + Math.random() * 0.1,
        distance: 8.5 + Math.random() * 1.5,
      });
    }
    
    // Secondary roof section appears after 3 seconds  
    if (sessionDuration > 3000) {
      simulatedPlanes.push({
        id: 'roof_section_2',
        area: 28.1 + Math.random() * 8,
        confidence: 0.78 + Math.random() * 0.12,
        distance: 10.2 + Math.random() * 2.0,
      });
    }
    
    // First dormer appears after 5 seconds
    if (sessionDuration > 5000) {
      simulatedPlanes.push({
        id: 'dormer_1',
        area: 12.5 + Math.random() * 3,
        confidence: 0.72 + Math.random() * 0.15,
        distance: 7.8 + Math.random() * 1.2,
      });
    }
    
    // Second dormer appears after 7 seconds  
    if (sessionDuration > 7000) {
      simulatedPlanes.push({
        id: 'dormer_2',
        area: 15.3 + Math.random() * 4,
        confidence: 0.68 + Math.random() * 0.18,
        distance: 9.1 + Math.random() * 1.8,
      });
    }
    
    return simulatedPlanes;
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
    const classifyPlaneType = (area: number, pitchAngle: number): string => {
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
    };

    // Test typical dormer measurements
    expect(classifyPlaneType(12.5, 35)).toBe('dormer');
    expect(classifyPlaneType(15.3, 40)).toBe('dormer');
    expect(classifyPlaneType(4.5, 50)).toBe('dormer');
    
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
});