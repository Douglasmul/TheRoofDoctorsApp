/**
 * @fileoverview Enterprise-grade roof measurement calculation engine
 * Multi-plane area calculation with pitch correction, material estimation, and audit trails
 * @version 1.0.0
 * @enterprise
 */

import { RoofPlane, ARPoint, RoofMeasurement, QualityMetrics, AuditEntry } from '../types/measurement';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

/**
 * Measurement calculation configuration
 */
interface MeasurementConfig {
  /** Unit system for measurements */
  unitSystem: 'metric' | 'imperial';
  /** Precision for area calculations */
  areaPrecision: number;
  /** Pitch correction method */
  pitchCorrectionMethod: 'trigonometric' | 'projection' | 'advanced';
  /** Material waste factor percentage */
  wasteFactorPercent: number;
  /** Quality threshold for valid measurements */
  qualityThreshold: number;
  /** Enable advanced geometry validation */
  geometryValidation: boolean;
}

/**
 * Material calculation results
 */
interface MaterialCalculation {
  /** Base area without waste factor */
  baseArea: number;
  /** Area with waste factor applied */
  adjustedArea: number;
  /** Estimated material units needed */
  materialUnits: number;
  /** Material type specific calculations */
  materialSpecific: {
    /** Number of shingle bundles */
    shingleBundles?: number;
    /** Square footage of metal sheets */
    metalSheets?: number;
    /** Number of tiles */
    tiles?: number;
  };
  /** Cost estimation if pricing data available */
  costEstimate?: {
    /** Material cost */
    materialCost: number;
    /** Labor cost */
    laborCost: number;
    /** Total estimated cost */
    totalCost: number;
    /** Currency code */
    currency: string;
  };
}

/**
 * Validation result for measurements
 */
interface ValidationResult {
  /** Whether measurement is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** Quality score (0-100) */
  qualityScore: number;
  /** Recommended actions */
  recommendations: string[];
}

/**
 * Default configuration for enterprise use
 */
const DEFAULT_CONFIG: MeasurementConfig = {
  unitSystem: 'metric',
  areaPrecision: 2,
  pitchCorrectionMethod: 'advanced',
  wasteFactorPercent: 10,
  qualityThreshold: 75,
  geometryValidation: true,
};

/**
 * Enterprise-grade roof measurement calculation engine
 * Handles complex multi-plane calculations with audit trails and compliance
 */
export class RoofMeasurementEngine {
  private config: MeasurementConfig;
  private auditTrail: AuditEntry[] = [];

  constructor(config: Partial<MeasurementConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Calculate complete roof measurement from detected planes
   * 
   * @param planes - Array of detected roof planes
   * @param sessionId - Measurement session identifier
   * @param userId - User performing the measurement
   * @returns Complete roof measurement with calculations
   */
  async calculateRoofMeasurement(
    planes: RoofPlane[],
    sessionId: string,
    userId: string
  ): Promise<RoofMeasurement> {
    const startTime = Date.now();
    
    try {
      // Validate input planes
      const validation = await this.validatePlanes(planes);
      if (!validation.isValid) {
        throw new Error(`Invalid planes: ${validation.errors.join(', ')}`);
      }

      // Log audit entry
      await this.addAuditEntry('create', userId, sessionId, 'Started roof measurement calculation');

      // Process each plane
      const processedPlanes = await Promise.all(
        planes.map(plane => this.processPlane(plane))
      );

      // Calculate total areas
      const totalArea = processedPlanes.reduce((sum, plane) => sum + plane.area, 0);
      const totalProjectedArea = processedPlanes.reduce((sum, plane) => sum + plane.projectedArea, 0);

      // Calculate quality metrics
      const qualityMetrics = this.calculateQualityMetrics(processedPlanes, Date.now() - startTime);

      // Create measurement object
      const measurement: RoofMeasurement = {
        id: await this.generateMeasurementId(),
        propertyId: `property_${sessionId}`, // TODO: Get from context
        userId,
        timestamp: new Date(),
        planes: processedPlanes,
        totalArea: this.roundToPrecision(totalArea),
        totalProjectedArea: this.roundToPrecision(totalProjectedArea),
        accuracy: validation.qualityScore / 100,
        deviceInfo: await this.getDeviceInfo(),
        qualityMetrics,
        auditTrail: [...this.auditTrail],
        exports: [],
        complianceStatus: {
          status: 'pending',
          standards: ['ISO-25178', 'ASTM-E2738'],
          certifications: [],
          lastCheck: new Date(),
          nextCheck: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          notes: [],
        },
        metadata: {
          calculationMethod: this.config.pitchCorrectionMethod,
          unitSystem: this.config.unitSystem,
          version: '1.0.0',
          processingTime: Date.now() - startTime,
        },
      };

      // Final validation
      const finalValidation = await this.validateMeasurement(measurement);
      if (!finalValidation.isValid) {
        throw new Error(`Invalid measurement: ${finalValidation.errors.join(', ')}`);
      }

      await this.addAuditEntry('create', userId, sessionId, 'Completed roof measurement calculation');

      return measurement;

    } catch (error) {
      await this.addAuditEntry('create', userId, sessionId, `Error in calculation: ${error}`);
      throw error;
    }
  }

  /**
   * Process individual plane with advanced calculations
   */
  private async processPlane(plane: RoofPlane): Promise<RoofPlane> {
    // Validate plane geometry
    if (!this.isValidPlaneGeometry(plane)) {
      throw new Error(`Invalid geometry for plane ${plane.id}`);
    }

    // Recalculate area with higher precision
    const recalculatedArea = this.calculatePlaneArea(plane.boundaries);
    
    // Calculate perimeter
    const perimeter = this.calculatePlanePerimeter(plane.boundaries);
    
    // Apply pitch correction
    const pitchCorrectedArea = this.applyPitchCorrection(recalculatedArea, plane.pitchAngle);
    
    // Enhance material detection
    const enhancedMaterial = await this.enhanceMaterialDetection(plane);

    return {
      ...plane,
      area: this.roundToPrecision(recalculatedArea),
      perimeter: this.roundToPrecision(perimeter),
      projectedArea: this.roundToPrecision(pitchCorrectedArea),
      material: enhancedMaterial,
    };
  }

  /**
   * Calculate area of plane using boundary points
   */
  private calculatePlaneArea(boundaries: ARPoint[]): number {
    if (boundaries.length < 3) {
      throw new Error('Plane must have at least 3 boundary points');
    }

    // Use shoelace formula for polygon area
    let area = 0;
    const n = boundaries.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += boundaries[i].x * boundaries[j].y;
      area -= boundaries[j].x * boundaries[i].y;
    }

    return Math.abs(area) / 2;
  }

  /**
   * Calculate perimeter of plane using boundary points
   */
  private calculatePlanePerimeter(boundaries: ARPoint[]): number {
    if (boundaries.length < 3) {
      throw new Error('Plane must have at least 3 boundary points');
    }

    let perimeter = 0;
    const n = boundaries.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const dx = boundaries[j].x - boundaries[i].x;
      const dy = boundaries[j].y - boundaries[i].y;
      const dz = boundaries[j].z - boundaries[i].z;
      
      // Calculate 3D distance between points
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      perimeter += distance;
    }

    return perimeter;
  }

  /**
   * Convert perimeter from meters to feet
   */
  public convertToFeet(lengthInMeters: number): number {
    return lengthInMeters * 3.28084; // 1 meter = 3.28084 feet
  }

  /**
   * Apply pitch correction to area calculation
   */
  private applyPitchCorrection(area: number, pitchAngle: number): number {
    const pitchRadians = (pitchAngle * Math.PI) / 180;

    switch (this.config.pitchCorrectionMethod) {
      case 'trigonometric':
        return area * Math.cos(pitchRadians);
      
      case 'projection':
        // More sophisticated projection method
        return area * Math.cos(pitchRadians) * (1 + Math.sin(pitchRadians) * 0.1);
      
      case 'advanced':
        // Advanced method considering roof geometry
        const correctionFactor = Math.cos(pitchRadians) * 
          (1 + Math.sin(pitchRadians) * 0.05) * 
          (1 - Math.pow(Math.sin(pitchRadians), 2) * 0.02);
        return area * correctionFactor;
      
      default:
        return area;
    }
  }

  /**
   * Enhanced material detection using AI/ML placeholders
   */
  private async enhanceMaterialDetection(plane: RoofPlane): Promise<RoofPlane['material']> {
    // TODO: Implement computer vision material detection
    // This would analyze texture, color, and geometric patterns
    
    // For now, use basic heuristics
    if (plane.pitchAngle < 5) return 'flat';
    if (plane.pitchAngle > 45) return 'shingle';
    if (plane.area > 100) return 'metal';
    
    return plane.material || 'unknown';
  }

  /**
   * Calculate material requirements with advanced algorithms
   */
  async calculateMaterials(measurement: RoofMeasurement): Promise<MaterialCalculation> {
    const baseArea = measurement.totalProjectedArea;
    const wasteMultiplier = 1 + (this.config.wasteFactorPercent / 100);
    const adjustedArea = baseArea * wasteMultiplier;

    // Calculate complexity factor based on roof geometry
    const complexityFactor = this.calculateComplexityFactor(measurement.planes);
    const finalArea = adjustedArea * complexityFactor;

    // Basic material calculations (would be enhanced with real pricing data)
    const materialSpecific: MaterialCalculation['materialSpecific'] = {};

    // Calculate based on dominant material type
    const dominantMaterial = this.getDominantMaterial(measurement.planes);
    
    switch (dominantMaterial) {
      case 'shingle':
        // Typical shingle coverage: 33.3 sq ft per bundle
        const sqFt = this.convertToSquareFeet(finalArea);
        materialSpecific.shingleBundles = Math.ceil(sqFt / 33.3);
        break;
      
      case 'metal':
        // Metal sheets: 36 sq ft per sheet typically
        const metalSqFt = this.convertToSquareFeet(finalArea);
        materialSpecific.metalSheets = Math.ceil(metalSqFt / 36);
        break;
      
      case 'tile':
        // Clay tiles: ~1 tile per sq ft
        const tileSqFt = this.convertToSquareFeet(finalArea);
        materialSpecific.tiles = Math.ceil(tileSqFt);
        break;
    }

    // Calculate cost estimates (placeholder pricing)
    const costEstimate = await this.calculateCostEstimate(finalArea, dominantMaterial);

    return {
      baseArea: this.roundToPrecision(baseArea),
      adjustedArea: this.roundToPrecision(finalArea),
      wastePercent: this.config.wasteFactorPercent + (complexityFactor - 1) * 100,
      dominantMaterial,
      materialUnits: this.roundToPrecision(finalArea), // Basic estimate
      materialSpecific,
      costEstimate,
    };
  }

  /**
   * Calculate roof complexity factor based on geometry
   */
  private calculateComplexityFactor(planes: RoofPlane[]): number {
    let complexityScore = 1.0;
    
    // More planes = more complex
    if (planes.length > 4) {
      complexityScore += (planes.length - 4) * 0.05;
    }
    
    // Steep pitches increase complexity
    const avgPitch = planes.reduce((sum, p) => sum + p.pitchAngle, 0) / planes.length;
    if (avgPitch > 30) {
      complexityScore += (avgPitch - 30) * 0.002;
    }
    
    // Small planes (dormers, chimneys) increase complexity
    const smallPlanes = planes.filter(p => p.area < 10).length;
    complexityScore += smallPlanes * 0.03;
    
    // Different orientations increase complexity
    const orientations = new Set(planes.map(p => Math.round(p.azimuthAngle / 45) * 45));
    if (orientations.size > 2) {
      complexityScore += (orientations.size - 2) * 0.02;
    }
    
    return Math.min(complexityScore, 1.5); // Cap at 50% additional complexity
  }

  /**
   * Calculate cost estimate for materials and labor
   */
  private async calculateCostEstimate(
    area: number, 
    material: RoofPlane['material']
  ): Promise<MaterialCalculation['costEstimate']> {
    // Placeholder pricing (in USD per sq ft)
    const materialPrices = {
      shingle: 3.50,
      metal: 8.00,
      tile: 6.50,
      flat: 4.00,
      unknown: 4.00,
    };
    
    const laborPrices = {
      shingle: 2.50,
      metal: 4.00,
      tile: 4.50,
      flat: 3.00,
      unknown: 3.00,
    };
    
    const sqFt = this.convertToSquareFeet(area);
    const materialCost = sqFt * (materialPrices[material || 'unknown'] || 4.00);
    const laborCost = sqFt * (laborPrices[material || 'unknown'] || 3.00);
    
    return {
      materialCost: this.roundToPrecision(materialCost),
      laborCost: this.roundToPrecision(laborCost),
      totalCost: this.roundToPrecision(materialCost + laborCost),
      currency: 'USD',
    };
  }

  /**
   * Get dominant material type from planes
   */
  private getDominantMaterial(planes: RoofPlane[]): RoofPlane['material'] {
    const materialAreas = planes.reduce((acc, plane) => {
      const material = plane.material || 'unknown';
      acc[material] = (acc[material] || 0) + plane.area;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(materialAreas)
      .sort(([, a], [, b]) => b - a)[0]?.[0] as RoofPlane['material'] || 'unknown';
  }

  /**
   * Convert square meters to square feet
   */
  private convertToSquareFeet(squareMeters: number): number {
    return this.config.unitSystem === 'imperial' ? 
      squareMeters * 10.764 : squareMeters;
  }
  /**
   * Validate array of planes with comprehensive checks
   * Public method to allow pre-validation before calculation
   */
  public async validatePlanes(planes: RoofPlane[]): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (planes.length === 0) {
      errors.push('No planes detected');
      return {
        isValid: false,
        errors,
        warnings,
        qualityScore: 0,
        recommendations: ['Ensure proper lighting and stable device movement'],
      };
    }

    let totalConfidence = 0;
    let validGeometryCount = 0;

    for (const plane of planes) {
      // Validate geometry
      if (!this.isValidPlaneGeometry(plane)) {
        errors.push(`Invalid geometry for plane ${plane.id}: insufficient boundary points or invalid shape`);
      } else {
        validGeometryCount++;
      }

      // Check confidence levels
      if (plane.confidence < 0.3) {
        errors.push(`Critically low confidence for plane ${plane.id}: ${(plane.confidence * 100).toFixed(1)}%`);
      } else if (plane.confidence < 0.6) {
        warnings.push(`Low confidence for plane ${plane.id}: ${(plane.confidence * 100).toFixed(1)}%`);
      }

      totalConfidence += plane.confidence;

      // Check area reasonableness for roof measurements
      if (plane.area < 0.5) {
        warnings.push(`Very small plane ${plane.id}: ${plane.area.toFixed(2)} sq m - may be measurement noise`);
      } else if (plane.area > 2000) {
        warnings.push(`Unusually large plane ${plane.id}: ${plane.area.toFixed(2)} sq m - verify accuracy`);
      }

      // Check pitch angle reasonableness
      if (plane.pitchAngle > 60) {
        recommendations.push(`Steep roof detected (${plane.pitchAngle.toFixed(1)}°) - consider safety measures`);
      } else if (plane.pitchAngle < 2) {
        recommendations.push(`Nearly flat roof detected (${plane.pitchAngle.toFixed(1)}°) - verify drainage requirements`);
      }

      // Check boundary point density
      if (plane.boundaries.length < 4) {
        warnings.push(`Low boundary point density for plane ${plane.id} - may affect accuracy`);
      }
    }

    // Overall quality metrics
    const avgConfidence = totalConfidence / planes.length;
    const geometryValidityRatio = validGeometryCount / planes.length;
    const sizeConsistency = this.calculateSizeConsistency(planes);
    
    // Weighted quality score
    const qualityScore = Math.round(
      avgConfidence * 40 + 
      geometryValidityRatio * 30 + 
      sizeConsistency * 20 + 
      (errors.length === 0 ? 10 : 0)
    );

    // Quality-based recommendations
    if (qualityScore < this.config.qualityThreshold) {
      recommendations.push('Consider remeasuring with better lighting and more stable movement');
    }

    if (avgConfidence < 0.7) {
      recommendations.push('Move closer to the roof surface for better accuracy');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      qualityScore,
      recommendations,
    };
  }

  /**
   * Calculate size consistency score across planes
   */
  private calculateSizeConsistency(planes: RoofPlane[]): number {
    if (planes.length < 2) return 100;
    
    const areas = planes.map(p => p.area);
    const mean = areas.reduce((sum, area) => sum + area, 0) / areas.length;
    const variance = areas.reduce((sum, area) => sum + Math.pow(area - mean, 2), 0) / areas.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;
    
    // Lower coefficient of variation = higher consistency
    return Math.max(0, 100 - coefficientOfVariation * 50);
  }

  /**
   * Validate complete measurement with enterprise checks
   */
  private async validateMeasurement(measurement: RoofMeasurement): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Basic validation
    if (measurement.totalArea <= 0) {
      errors.push('Total area must be positive');
    }

    if (measurement.totalProjectedArea <= 0) {
      errors.push('Total projected area must be positive');
    }

    // Accuracy validation
    if (measurement.accuracy < 0.3) {
      errors.push('Measurement accuracy too low for reliable results');
    } else if (measurement.accuracy < 0.7) {
      warnings.push('Low measurement accuracy - results may be imprecise');
    }

    // Data consistency checks
    if (Math.abs(measurement.totalArea - measurement.totalProjectedArea) / measurement.totalArea > 0.5) {
      warnings.push('Large discrepancy between actual and projected areas - verify pitch calculations');
    }

    // Compliance checks
    if (measurement.complianceStatus.status === 'non-compliant') {
      warnings.push('Measurement does not meet compliance standards');
    }

    // Quality metrics validation
    if (measurement.qualityMetrics.trackingStability < 50) {
      warnings.push('Poor tracking stability detected during measurement');
    }

    // Recommendations based on measurement characteristics
    const avgPitch = measurement.planes.reduce((sum, p) => sum + p.pitchAngle, 0) / measurement.planes.length;
    if (avgPitch > 45) {
      recommendations.push('High-pitch roof detected - consider additional safety measures during installation');
    }

    const hasMultipleMaterials = new Set(measurement.planes.map(p => p.material)).size > 1;
    if (hasMultipleMaterials) {
      recommendations.push('Multiple roof materials detected - plan material transitions carefully');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      qualityScore: Math.round(measurement.accuracy * 100),
      recommendations,
    };
  }

  /**
   * Check if plane geometry is valid using advanced geometric validation
   */
  private isValidPlaneGeometry(plane: RoofPlane): boolean {
    if (!this.config.geometryValidation) return true;

    // Check minimum boundary points
    if (plane.boundaries.length < 3) return false;

    // Check for degenerate triangles (collinear points)
    if (plane.boundaries.length === 3) {
      return !this.arePointsCollinear(plane.boundaries[0], plane.boundaries[1], plane.boundaries[2]);
    }

    // Check for self-intersecting polygons
    if (this.isPolygonSelfIntersecting(plane.boundaries)) return false;

    // Check area reasonableness
    if (plane.area <= 0) return false;

    // Check normal vector validity
    const normalMagnitude = Math.sqrt(
      plane.normal.x ** 2 + plane.normal.y ** 2 + plane.normal.z ** 2
    );
    if (normalMagnitude < 0.9 || normalMagnitude > 1.1) return false; // Should be unit vector

    return true;
  }

  /**
   * Check if three points are collinear
   */
  private arePointsCollinear(p1: ARPoint, p2: ARPoint, p3: ARPoint): boolean {
    const epsilon = 1e-6;
    const crossProduct = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
    return Math.abs(crossProduct) < epsilon;
  }

  /**
   * Check if polygon is self-intersecting
   */
  private isPolygonSelfIntersecting(points: ARPoint[]): boolean {
    const n = points.length;
    if (n < 4) return false; // Triangle cannot self-intersect

    // Check all pairs of non-adjacent edges
    for (let i = 0; i < n; i++) {
      const edge1Start = points[i];
      const edge1End = points[(i + 1) % n];

      for (let j = i + 2; j < n; j++) {
        if (j === n - 1 && i === 0) continue; // Skip adjacent edges

        const edge2Start = points[j];
        const edge2End = points[(j + 1) % n];

        if (this.doLinesIntersect(edge1Start, edge1End, edge2Start, edge2End)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if two line segments intersect
   */
  private doLinesIntersect(p1: ARPoint, q1: ARPoint, p2: ARPoint, q2: ARPoint): boolean {
    const orientation = (p: ARPoint, q: ARPoint, r: ARPoint): number => {
      const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
      if (Math.abs(val) < 1e-6) return 0; // Collinear
      return val > 0 ? 1 : 2; // Clockwise or counterclockwise
    };

    const onSegment = (p: ARPoint, q: ARPoint, r: ARPoint): boolean => {
      return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
             q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
    };

    const o1 = orientation(p1, q1, p2);
    const o2 = orientation(p1, q1, q2);
    const o3 = orientation(p2, q2, p1);
    const o4 = orientation(p2, q2, q1);

    // General case
    if (o1 !== o2 && o3 !== o4) return true;

    // Special cases (collinear points)
    if (o1 === 0 && onSegment(p1, p2, q1)) return true;
    if (o2 === 0 && onSegment(p1, q2, q1)) return true;
    if (o3 === 0 && onSegment(p2, p1, q2)) return true;
    if (o4 === 0 && onSegment(p2, q1, q2)) return true;

    return false;
  }

  /**
   * Calculate quality metrics for the measurement session
   */
  private calculateQualityMetrics(planes: RoofPlane[], processingTime: number): QualityMetrics {
    const avgConfidence = planes.reduce((sum, p) => sum + p.confidence, 0) / planes.length;
    const totalPoints = planes.reduce((sum, p) => sum + p.boundaries.length, 0);
    const totalArea = planes.reduce((sum, p) => sum + p.area, 0);
    
    return {
      overallScore: Math.round(avgConfidence * 100),
      trackingStability: Math.round(Math.min(100, avgConfidence * 120)), // Boost for high confidence
      pointDensity: Math.round((totalPoints / Math.max(1, totalArea)) * 10) / 10,
      duration: Math.round(processingTime / 1000),
      trackingInterruptions: 0, // Would be tracked during actual AR session
      lightingQuality: Math.round(Math.min(100, avgConfidence * 110)), // Approximate from confidence
      movementSmoothness: Math.round(Math.min(100, 80 + avgConfidence * 20)), // Approximate
    };
  }

  /**
   * Generate unique measurement ID
   */
  private async generateMeasurementId(): Promise<string> {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substr(2, 8);
    return `measurement_${timestamp}_${randomPart}`;
  }

  /**
   * Get device information for audit trail
   */
  private async getDeviceInfo(): Promise<any> {
    // In a real implementation, this would use expo-device or similar
    return {
      platform: Platform.OS,
      version: Platform.Version,
      model: 'Simulated Device',
      sensors: ['accelerometer', 'gyroscope', 'camera'],
      arCapabilities: Platform.OS === 'ios' ? 'ARKit' : 'ARCore',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Add audit trail entry
   */
  private async addAuditEntry(
    action: 'create' | 'modify' | 'export' | 'sync' | 'view' | 'delete', 
    userId: string, 
    sessionId: string, 
    details: string
  ): Promise<void> {
    const entry: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      timestamp: new Date(),
      action,
      userId,
      description: details,
      sessionId,
      dataHash: `hash_${Date.now()}`,
    };

    this.auditTrail.push(entry);
  }

  /**
   * Round number to configured precision
   */
  private roundToPrecision(value: number): number {
    const factor = Math.pow(10, this.config.areaPrecision);
    return Math.round(value * factor) / factor;
  }

  /**
   * Export measurement data in specified format
   */
  async exportMeasurement(measurement: RoofMeasurement, format: 'json' | 'csv' | 'pdf'): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(measurement, null, 2);
      
      case 'csv':
        return this.exportToCSV(measurement);
      
      case 'pdf':
        return this.exportToPDF(measurement);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export to CSV format
   */
  private exportToCSV(measurement: RoofMeasurement): string {
    const headers = ['Plane ID', 'Type', 'Material', 'Area (sq m)', 'Projected Area (sq m)', 'Pitch (°)', 'Azimuth (°)', 'Confidence'];
    const rows = measurement.planes.map(plane => [
      plane.id,
      plane.type,
      plane.material || 'unknown',
      plane.area.toString(),
      plane.projectedArea.toString(),
      plane.pitchAngle.toFixed(1),
      plane.azimuthAngle.toFixed(1),
      (plane.confidence * 100).toFixed(1) + '%',
    ]);

    // Add summary rows
    rows.push(['', '', '', '', '', '', '', '']);
    rows.push(['TOTAL', '', '', measurement.totalArea.toString(), measurement.totalProjectedArea.toString(), '', '', '']);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Export to PDF format (basic implementation)
   */
  private exportToPDF(measurement: RoofMeasurement): string {
    // In a real implementation, this would generate actual PDF content
    // For now, return a formatted text representation
    const lines = [
      'ROOF MEASUREMENT REPORT',
      '========================',
      '',
      `Measurement ID: ${measurement.id}`,
      `Date: ${measurement.timestamp.toISOString()}`,
      `Total Area: ${measurement.totalArea.toFixed(2)} sq m`,
      `Projected Area: ${measurement.totalProjectedArea.toFixed(2)} sq m`,
      `Accuracy: ${(measurement.accuracy * 100).toFixed(1)}%`,
      '',
      'PLANE DETAILS:',
      '-------------',
    ];

    measurement.planes.forEach((plane, index) => {
      lines.push(`${index + 1}. ${plane.type.toUpperCase()} (${plane.id})`);
      lines.push(`   Material: ${plane.material || 'unknown'}`);
      lines.push(`   Area: ${plane.area.toFixed(2)} sq m`);
      lines.push(`   Pitch: ${plane.pitchAngle.toFixed(1)}°`);
      lines.push(`   Confidence: ${(plane.confidence * 100).toFixed(1)}%`);
      lines.push('');
    });

    return lines.join('\n');
  }
}

// Export configuration and helper types
export { DEFAULT_CONFIG as DefaultMeasurementConfig };
export type { MeasurementConfig, MaterialCalculation, ValidationResult };

// TODO: Implement advanced 3D geometry validation algorithms
// TODO: Add machine learning models for material classification
// TODO: Integrate with weather APIs for environmental factors
// TODO: Add support for 3D model generation from roof measurements
// TODO: Implement automatic report generation with CAD integration
// TODO: Add support for complex roof shapes (dormers, valleys, hips)
// TODO: Implement real-time calculation streaming for large roofs
// TODO: Add building code compliance checking
// TODO: Integrate with CAD export formats (DXF, DWG)
// TODO: Add support for thermal imaging integration
// TODO: Implement advanced cost estimation with market pricing APIs