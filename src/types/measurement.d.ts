/**
 * @fileoverview Enterprise-grade type definitions for AR roof measurement system
 * Includes audit trails, compliance, export formats, and security controls
 * @version 1.0.0
 * @enterprise
 */

/**
 * 3D coordinate point in AR space
 */
export interface ARPoint {
  /** X coordinate in meters */
  x: number;
  /** Y coordinate in meters */
  y: number;
  /** Z coordinate in meters */
  z: number;
  /** Confidence score (0-1) from AR system */
  confidence: number;
  /** Timestamp when point was captured */
  timestamp: Date;
  /** Device sensor accuracy at capture time */
  sensorAccuracy: 'low' | 'medium' | 'high';
}

/**
 * Detected roof plane with orientation and boundaries
 */
export interface RoofPlane {
  /** Unique identifier for the plane */
  id: string;
  /** Corner points defining the plane boundary */
  boundaries: ARPoint[];
  /** Normal vector of the plane */
  normal: { x: number; y: number; z: number };
  /** Pitch angle in degrees (0-90) */
  pitchAngle: number;
  /** Azimuth angle in degrees (0-360) */
  azimuthAngle: number;
  /** Calculated area in square meters */
  area: number;
  /** Perimeter in meters */
  perimeter: number;
  /** Pitch-corrected projected area */
  projectedArea: number;
  /** Plane type classification */
  type: 'primary' | 'secondary' | 'dormer' | 'hip' | 'chimney' | 'other' | 'custom';
  /** Confidence in plane detection */
  confidence: number;
  /** Material classification if detected */
  material?: 'shingle' | 'tile' | 'metal' | 'flat' | 'unknown';
  /** 3D visualization metadata */
  visualization3D?: {
    /** Whether this plane has been converted to 3D geometry */
    hasGeometry: boolean;
    /** Reference to 3D geometry ID if created */
    geometryId?: string;
    /** 3D rendering preferences */
    renderPreferences?: {
      /** Material override for 3D rendering */
      materialOverride?: string;
      /** Extrusion height for flat surfaces */
      extrusionHeight?: number;
      /** Level of detail for 3D mesh */
      levelOfDetail?: 'low' | 'medium' | 'high';
    };
  };
}

/**
 * Material calculation results
 */
export interface MaterialCalculation {
  /** Base area without waste factor */
  baseArea: number;
  /** Area with waste factor applied */
  adjustedArea: number;
  /** Total area including waste */
  totalArea?: number;
  /** Waste percentage applied */
  wastePercent?: number;
  /** Dominant material type across all surfaces */
  dominantMaterial?: string;
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
export interface RoofMeasurement {
  /** Unique measurement session ID */
  id: string;
  /** Property address or identifier */
  propertyId: string;
  /** User who performed the measurement */
  userId: string;
  /** Measurement session timestamp */
  timestamp: Date;
  /** Collection of detected roof planes */
  planes: RoofPlane[];
  /** Total roof area (sum of all planes) */
  totalArea: number;
  /** Total projected area for material calculations */
  totalProjectedArea: number;
  /** Measurement accuracy estimate */
  accuracy: number;
  /** Weather conditions during measurement */
  weatherConditions?: WeatherCondition;
  /** Device information used for measurement */
  deviceInfo: DeviceInfo;
  /** GPS coordinates of measurement location */
  location?: GeoLocation;
  /** Session quality metrics */
  qualityMetrics: QualityMetrics;
  /** Audit trail for compliance */
  auditTrail: AuditEntry[];
  /** Export history */
  exports: ExportRecord[];
  /** Compliance status */
  complianceStatus: ComplianceStatus;
  /** Validation results from measurement engine */
  validationResult?: any;
  /** Additional metadata */
  metadata: Record<string, any>;
}

/**
 * Weather conditions during measurement
 */
export interface WeatherCondition {
  /** Temperature in Celsius */
  temperature: number;
  /** Light conditions */
  lighting: 'excellent' | 'good' | 'fair' | 'poor';
  /** Wind speed in m/s */
  windSpeed?: number;
  /** Cloud coverage percentage */
  cloudCover?: number;
  /** Overall measurement suitability */
  suitability: 'optimal' | 'acceptable' | 'marginal' | 'unsuitable';
}

/**
 * Device information for audit purposes
 */
export interface DeviceInfo {
  /** Device model and manufacturer */
  model: string;
  /** Operating system version */
  osVersion: string;
  /** App version */
  appVersion: string;
  /** AR capabilities */
  arSupport: {
    /** ARKit version (iOS) */
    arkitVersion?: string;
    /** ARCore version (Android) */
    arcoreVersion?: string;
    /** Plane detection support */
    planeDetection: boolean;
    /** Light estimation support */
    lightEstimation: boolean;
  };
  /** Sensor calibration status */
  sensorCalibration: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * GPS location information
 */
export interface GeoLocation {
  /** Latitude in decimal degrees */
  latitude: number;
  /** Longitude in decimal degrees */
  longitude: number;
  /** Altitude in meters */
  altitude?: number;
  /** Horizontal accuracy in meters */
  accuracy: number;
  /** Timestamp of location capture */
  timestamp: Date;
}

/**
 * Measurement quality metrics
 */
export interface QualityMetrics {
  /** Overall quality score (0-100) */
  overallScore: number;
  /** AR tracking stability */
  trackingStability: number;
  /** Point density per square meter */
  pointDensity: number;
  /** Measurement duration in seconds */
  duration: number;
  /** Number of tracking interruptions */
  trackingInterruptions: number;
  /** Lighting quality assessment */
  lightingQuality: number;
  /** Device movement smoothness */
  movementSmoothness: number;
}

/**
 * Audit trail entry for compliance
 */
export interface AuditEntry {
  /** Unique audit entry ID */
  id: string;
  /** Timestamp of the action */
  timestamp: Date;
  /** Type of action performed */
  action: 'create' | 'modify' | 'export' | 'sync' | 'view' | 'delete';
  /** User who performed the action */
  userId: string;
  /** Detailed description of the action */
  description: string;
  /** IP address of the action origin */
  ipAddress?: string;
  /** Session ID for tracking */
  sessionId: string;
  /** Data integrity hash */
  dataHash: string;
}

/**
 * Export record tracking
 */
export interface ExportRecord {
  /** Unique export ID */
  id: string;
  /** Export timestamp */
  timestamp: Date;
  /** Export format */
  format: 'pdf' | 'csv' | 'json' | 'image' | 'cad';
  /** File size in bytes */
  fileSize: number;
  /** Export destination */
  destination: 'local' | 'cloud' | 'email' | 'api';
  /** User who performed export */
  userId: string;
  /** Export parameters used */
  parameters: Record<string, any>;
  /** Export status */
  status: 'pending' | 'completed' | 'failed' | 'expired';
  /** Error message if failed */
  errorMessage?: string;
  /** Download URL if applicable */
  downloadUrl?: string;
  /** Expiration date for download */
  expiresAt?: Date;
}

/**
 * Compliance status and certifications
 */
export interface ComplianceStatus {
  /** Overall compliance status */
  status: 'compliant' | 'non-compliant' | 'pending' | 'unknown';
  /** Industry standards met */
  standards: string[];
  /** Certification details */
  certifications: {
    /** Certification name */
    name: string;
    /** Certification body */
    authority: string;
    /** Certification level/grade */
    level: string;
    /** Expiration date */
    expiresAt: Date;
    /** Certification number */
    certificateNumber: string;
  }[];
  /** Last compliance check */
  lastCheck: Date;
  /** Next required check */
  nextCheck: Date;
  /** Compliance notes */
  notes: string[];
}

/**
 * API response wrapper for measurements
 */
export interface MeasurementResponse {
  /** Response status */
  success: boolean;
  /** Measurement data */
  data?: RoofMeasurement;
  /** Error message if failed */
  error?: string;
  /** Error code for client handling */
  errorCode?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Measurement filter criteria for API queries
 */
export interface MeasurementFilter {
  /** Property ID filter */
  propertyId?: string;
  /** User ID filter */
  userId?: string;
  /** Date range filter */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** Minimum area filter */
  minArea?: number;
  /** Maximum area filter */
  maxArea?: number;
  /** Compliance status filter */
  complianceStatus?: ComplianceStatus['status'];
  /** Quality score filter */
  minQuality?: number;
  /** Sort criteria */
  sortBy?: 'timestamp' | 'area' | 'quality' | 'propertyId';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Pagination */
  page?: number;
  /** Results per page */
  limit?: number;
}

/**
 * Real-time measurement update event
 */
export interface MeasurementUpdateEvent {
  /** Event type */
  type: 'plane_detected' | 'plane_updated' | 'measurement_complete' | 'error';
  /** Event timestamp */
  timestamp: Date;
  /** Event payload */
  payload: any;
  /** Session ID */
  sessionId: string;
}

/**
 * Enterprise integration webhook payload
 */
export interface WebhookPayload {
  /** Event type */
  event: 'measurement.created' | 'measurement.updated' | 'measurement.exported';
  /** Measurement data */
  measurement: RoofMeasurement;
  /** Organization context */
  organization: {
    id: string;
    name: string;
  };
  /** User context */
  user: {
    id: string;
    email: string;
    role: string;
  };
  /** Webhook metadata */
  metadata: {
    /** Webhook version */
    version: string;
    /** Delivery attempt */
    attempt: number;
    /** Webhook signature for verification */
    signature: string;
  };
}

/**
 * ERP integration data structure
 */
export interface ERPIntegration {
  /** ERP system identifier */
  system: 'sap' | 'oracle' | 'microsoft' | 'salesforce' | 'custom';
  /** Integration configuration */
  config: {
    /** API endpoint */
    endpoint: string;
    /** Authentication method */
    authMethod: 'oauth' | 'api_key' | 'basic' | 'cert';
    /** Field mappings */
    fieldMappings: Record<string, string>;
    /** Sync frequency */
    syncFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  };
  /** Last sync status */
  lastSync: {
    /** Sync timestamp */
    timestamp: Date;
    /** Sync status */
    status: 'success' | 'failure' | 'partial';
    /** Records processed */
    recordsProcessed: number;
    /** Error details if failed */
    error?: string;
  };
}

// TODO: Implement ARKit/ARCore native bridge types
// TODO: Add insurance integration types
// TODO: Add regulatory compliance types (local building codes)
// TODO: Add multi-tenant organization support
// TODO: Add advanced analytics and reporting types
// TODO: Add real-time collaboration types for team measurements
// TODO: Add AI/ML model integration for automated roof analysis