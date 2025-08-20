/**
 * @fileoverview Calibration Service for professional measurement accuracy
 * Handles reference object calibration, unit conversion, and measurement validation
 * @version 1.0.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ARPoint } from '../types/measurement';

export interface CalibrationReference {
  /** Reference object type */
  type: 'business_card' | 'coin' | 'ruler' | 'known_length' | 'custom';
  /** Known real-world dimensions in meters */
  realWorldSize: {
    width: number;
    height: number;
  };
  /** Measured pixel dimensions */
  pixelSize: {
    width: number;
    height: number;
  };
  /** Calibration timestamp */
  timestamp: Date;
  /** Confidence in calibration */
  confidence: number;
  /** Distance from camera when measured */
  distance?: number;
}

export interface CalibrationResult {
  /** Pixels per meter conversion factor */
  pixelsPerMeter: number;
  /** Calibration quality score (0-1) */
  qualityScore: number;
  /** Whether calibration is valid for use */
  isValid: boolean;
  /** Error messages if invalid */
  errors: string[];
  /** Reference object used */
  reference: CalibrationReference;
}

export class CalibrationService {
  private static readonly STORAGE_KEY = 'measurement_calibration';
  private static readonly MIN_QUALITY_SCORE = 0.7;
  
  private currentCalibration: CalibrationResult | null = null;

  /**
   * Standard reference objects with known dimensions
   */
  private static readonly STANDARD_REFERENCES: Record<string, { width: number; height: number }> = {
    business_card: { width: 0.0889, height: 0.0508 }, // 3.5" x 2" in meters
    credit_card: { width: 0.0856, height: 0.0539 }, // 85.6mm x 53.9mm
    us_quarter: { width: 0.02426, height: 0.02426 }, // 24.26mm diameter
    us_penny: { width: 0.01955, height: 0.01955 }, // 19.55mm diameter
    iphone_14: { width: 0.0715, height: 0.1468 }, // iPhone 14 dimensions
    ruler_inch: { width: 0.0254, height: 0.0254 }, // 1 inch
    ruler_cm: { width: 0.01, height: 0.01 }, // 1 cm
  };

  /**
   * Initialize calibration service and load saved calibration
   */
  async initialize(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(CalibrationService.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (this.isCalibrationValid(parsed)) {
          this.currentCalibration = {
            ...parsed,
            reference: {
              ...parsed.reference,
              timestamp: new Date(parsed.reference.timestamp)
            }
          };
        }
      }
    } catch (error) {
      console.warn('Failed to load saved calibration:', error);
    }
  }

  /**
   * Perform calibration using a reference object
   */
  async calibrateWithReference(
    referenceType: string,
    measuredPixelSize: { width: number; height: number },
    customRealSize?: { width: number; height: number },
    distance?: number
  ): Promise<CalibrationResult> {
    try {
      // Get real-world dimensions
      const realWorldSize = customRealSize || 
        CalibrationService.STANDARD_REFERENCES[referenceType];
      
      if (!realWorldSize) {
        throw new Error(`Unknown reference type: ${referenceType}`);
      }

      // Validate pixel measurements
      if (measuredPixelSize.width <= 0 || measuredPixelSize.height <= 0) {
        throw new Error('Invalid pixel measurements');
      }

      // Calculate pixels per meter (using width as primary measurement)
      const pixelsPerMeter = measuredPixelSize.width / realWorldSize.width;
      
      // Calculate quality score based on aspect ratio consistency
      const pixelAspectRatio = measuredPixelSize.width / measuredPixelSize.height;
      const realAspectRatio = realWorldSize.width / realWorldSize.height;
      const aspectRatioError = Math.abs(pixelAspectRatio - realAspectRatio) / realAspectRatio;
      const qualityScore = Math.max(0, 1 - aspectRatioError);

      // Create calibration reference
      const reference: CalibrationReference = {
        type: referenceType as any,
        realWorldSize,
        pixelSize: measuredPixelSize,
        timestamp: new Date(),
        confidence: qualityScore,
        distance,
      };

      // Create calibration result
      const result: CalibrationResult = {
        pixelsPerMeter,
        qualityScore,
        isValid: qualityScore >= CalibrationService.MIN_QUALITY_SCORE,
        errors: qualityScore < CalibrationService.MIN_QUALITY_SCORE 
          ? ['Calibration quality too low. Please remeasure the reference object more carefully.']
          : [],
        reference,
      };

      // Save if valid
      if (result.isValid) {
        this.currentCalibration = result;
        await this.saveCalibration(result);
      }

      return result;
    } catch (error) {
      return {
        pixelsPerMeter: 0,
        qualityScore: 0,
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Calibration failed'],
        reference: {
          type: referenceType as any,
          realWorldSize: customRealSize || { width: 0, height: 0 },
          pixelSize: measuredPixelSize,
          timestamp: new Date(),
          confidence: 0,
          distance,
        },
      };
    }
  }

  /**
   * Convert pixel coordinates to real-world coordinates
   */
  pixelsToMeters(pixelDistance: number): number {
    if (!this.currentCalibration || !this.currentCalibration.isValid) {
      throw new Error('No valid calibration available');
    }
    return pixelDistance / this.currentCalibration.pixelsPerMeter;
  }

  /**
   * Convert real-world coordinates to pixel coordinates
   */
  metersToPixels(meterDistance: number): number {
    if (!this.currentCalibration || !this.currentCalibration.isValid) {
      throw new Error('No valid calibration available');
    }
    return meterDistance * this.currentCalibration.pixelsPerMeter;
  }

  /**
   * Calculate area in square meters from pixel area
   */
  pixelAreaToSquareMeters(pixelArea: number): number {
    if (!this.currentCalibration || !this.currentCalibration.isValid) {
      throw new Error('No valid calibration available');
    }
    const pixelsPerMeterSquared = this.currentCalibration.pixelsPerMeter ** 2;
    return pixelArea / pixelsPerMeterSquared;
  }

  /**
   * Apply calibration to measurement points
   */
  calibratePoints(points: { x: number; y: number }[]): ARPoint[] {
    if (!this.currentCalibration || !this.currentCalibration.isValid) {
      throw new Error('No valid calibration available');
    }

    return points.map((point, index) => ({
      x: this.pixelsToMeters(point.x),
      y: this.pixelsToMeters(point.y),
      z: 0, // Assume 2D measurements for now
      confidence: this.currentCalibration!.qualityScore,
      timestamp: new Date(),
      sensorAccuracy: this.currentCalibration!.qualityScore > 0.9 ? 'high' : 
        this.currentCalibration!.qualityScore > 0.8 ? 'medium' : 'low',
    }));
  }

  /**
   * Get current calibration status
   */
  getCalibrationStatus(): {
    isCalibrated: boolean;
    quality: number;
    reference?: CalibrationReference;
    ageHours: number;
  } {
    if (!this.currentCalibration) {
      return { isCalibrated: false, quality: 0, ageHours: 0 };
    }

    const ageMs = Date.now() - this.currentCalibration.reference.timestamp.getTime();
    const ageHours = ageMs / (1000 * 60 * 60);

    return {
      isCalibrated: this.currentCalibration.isValid,
      quality: this.currentCalibration.qualityScore,
      reference: this.currentCalibration.reference,
      ageHours,
    };
  }

  /**
   * Clear current calibration
   */
  async clearCalibration(): Promise<void> {
    this.currentCalibration = null;
    await AsyncStorage.removeItem(CalibrationService.STORAGE_KEY);
  }

  /**
   * Get list of standard reference objects
   */
  getStandardReferences(): Array<{ id: string; name: string; size: string; }> {
    return [
      { id: 'business_card', name: 'Business Card', size: '3.5" × 2"' },
      { id: 'credit_card', name: 'Credit Card', size: '85.6mm × 53.9mm' },
      { id: 'us_quarter', name: 'US Quarter', size: '24.3mm diameter' },
      { id: 'us_penny', name: 'US Penny', size: '19.6mm diameter' },
      { id: 'iphone_14', name: 'iPhone 14', size: '71.5mm × 146.8mm' },
      { id: 'ruler_inch', name: '1 Inch', size: '25.4mm' },
      { id: 'ruler_cm', name: '1 Centimeter', size: '10mm' },
    ];
  }

  /**
   * Validate calibration age and quality
   */
  private isCalibrationValid(calibration: any): boolean {
    if (!calibration || !calibration.reference) return false;
    
    // Check age (expire after 24 hours)
    const ageMs = Date.now() - new Date(calibration.reference.timestamp).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    if (ageHours > 24) return false;

    // Check quality
    return calibration.qualityScore >= CalibrationService.MIN_QUALITY_SCORE;
  }

  /**
   * Save calibration to storage
   */
  private async saveCalibration(calibration: CalibrationResult): Promise<void> {
    try {
      await AsyncStorage.setItem(
        CalibrationService.STORAGE_KEY,
        JSON.stringify(calibration)
      );
    } catch (error) {
      console.warn('Failed to save calibration:', error);
    }
  }
}

// Singleton instance
export const calibrationService = new CalibrationService();