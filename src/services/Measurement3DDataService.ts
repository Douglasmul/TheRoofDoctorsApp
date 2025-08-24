/**
 * @fileoverview 3D Measurement Data Service
 * Manages 3D geometry data including vertices, edges, faces, and transformations
 * Compatible with Expo Go and extends existing measurement infrastructure
 * @version 1.0.0
 */

import { ARPoint, RoofPlane, RoofMeasurement } from '../types/measurement.d';
import * as THREE from 'three';

/**
 * 3D Vertex with enhanced metadata
 */
export interface Vertex3D extends ARPoint {
  /** Unique vertex identifier */
  id: string;
  /** Associated face IDs */
  faces: string[];
  /** Vertex normal vector */
  normal?: THREE.Vector3;
  /** UV texture coordinates */
  uv?: { u: number; v: number };
  /** Vertex color (for material visualization) */
  color?: THREE.Color;
}

/**
 * 3D Edge connecting two vertices
 */
export interface Edge3D {
  /** Unique edge identifier */
  id: string;
  /** Start vertex ID */
  startVertexId: string;
  /** End vertex ID */
  endVertexId: string;
  /** Edge length in meters */
  length: number;
  /** Associated face IDs */
  faces: string[];
  /** Edge type classification */
  type: 'ridge' | 'eave' | 'gable' | 'valley' | 'hip' | 'internal';
}

/**
 * 3D Face (polygon) with vertices and properties
 */
export interface Face3D {
  /** Unique face identifier */
  id: string;
  /** Ordered vertex IDs forming the face */
  vertexIds: string[];
  /** Face normal vector */
  normal: THREE.Vector3;
  /** Face area in square meters */
  area: number;
  /** Face perimeter in meters */
  perimeter: number;
  /** Associated roof plane ID */
  roofPlaneId?: string;
  /** Material properties */
  material: {
    type: 'shingle' | 'tile' | 'metal' | 'flat' | 'unknown';
    color?: THREE.Color;
    texture?: string;
    roughness?: number;
    metalness?: number;
  };
  /** Face slope angle in degrees */
  slopeAngle: number;
  /** Face orientation (azimuth) in degrees */
  orientation: number;
}

/**
 * 3D Measurement session data
 */
export interface Measurement3DSession {
  /** Session identifier */
  id: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** 3D vertices collection */
  vertices: Map<string, Vertex3D>;
  /** 3D edges collection */
  edges: Map<string, Edge3D>;
  /** 3D faces collection */
  faces: Map<string, Face3D>;
  /** 3D model bounding box */
  boundingBox: THREE.Box3;
  /** Total surface area */
  totalArea: number;
  /** Session metadata */
  metadata: {
    /** Number of vertices */
    vertexCount: number;
    /** Number of edges */
    edgeCount: number;
    /** Number of faces */
    faceCount: number;
    /** Model complexity score */
    complexityScore: number;
    /** Validation status */
    isValid: boolean;
  };
}

/**
 * 3D Measurement Data Service
 * Manages 3D geometry data for roof measurements
 */
export class Measurement3DDataService {
  private sessions = new Map<string, Measurement3DSession>();

  /**
   * Create a new 3D measurement session
   */
  createSession(id: string): Measurement3DSession {
    const session: Measurement3DSession = {
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      vertices: new Map(),
      edges: new Map(),
      faces: new Map(),
      boundingBox: new THREE.Box3(),
      totalArea: 0,
      metadata: {
        vertexCount: 0,
        edgeCount: 0,
        faceCount: 0,
        complexityScore: 0,
        isValid: false,
      },
    };

    this.sessions.set(id, session);
    return session;
  }

  /**
   * Get an existing 3D measurement session
   */
  getSession(id: string): Measurement3DSession | undefined {
    return this.sessions.get(id);
  }

  /**
   * Add a vertex to the 3D measurement session
   */
  addVertex(sessionId: string, vertex: Vertex3D): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;

    session.vertices.set(vertex.id, vertex);
    session.updatedAt = new Date();
    this.updateSessionMetadata(session);
    return true;
  }

  /**
   * Add an edge to the 3D measurement session
   */
  addEdge(sessionId: string, edge: Edge3D): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;

    // Validate that both vertices exist
    if (!session.vertices.has(edge.startVertexId) || !session.vertices.has(edge.endVertexId)) {
      return false;
    }

    session.edges.set(edge.id, edge);
    session.updatedAt = new Date();
    this.updateSessionMetadata(session);
    return true;
  }

  /**
   * Add a face to the 3D measurement session
   */
  addFace(sessionId: string, face: Face3D): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;

    // Validate that all vertices exist
    for (const vertexId of face.vertexIds) {
      if (!session.vertices.has(vertexId)) {
        return false;
      }
    }

    session.faces.set(face.id, face);
    session.updatedAt = new Date();
    this.updateSessionMetadata(session);
    return true;
  }

  /**
   * Convert 2D roof planes to 3D geometry
   * TODO: Implement advanced 3D extrusion from 2D roof measurements
   */
  convertRoofPlanesTo3D(sessionId: string, roofPlanes: RoofPlane[]): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;

    for (const plane of roofPlanes) {
      this.convertPlaneToFace(session, plane);
    }

    this.updateSessionMetadata(session);
    return true;
  }

  /**
   * Convert a single roof plane to 3D face
   */
  private convertPlaneToFace(session: Measurement3DSession, plane: RoofPlane): void {
    // Create vertices from plane boundaries
    const vertexIds: string[] = [];
    
    for (let i = 0; i < plane.boundaries.length; i++) {
      const point = plane.boundaries[i];
      const vertexId = `${plane.id}_v${i}`;
      
      const vertex: Vertex3D = {
        ...point,
        id: vertexId,
        faces: [plane.id],
        normal: new THREE.Vector3(plane.normal.x, plane.normal.y, plane.normal.z),
      };

      session.vertices.set(vertexId, vertex);
      vertexIds.push(vertexId);
    }

    // Create edges between consecutive vertices
    for (let i = 0; i < vertexIds.length; i++) {
      const startVertexId = vertexIds[i];
      const endVertexId = vertexIds[(i + 1) % vertexIds.length];
      const edgeId = `${plane.id}_e${i}`;

      const startVertex = session.vertices.get(startVertexId)!;
      const endVertex = session.vertices.get(endVertexId)!;
      
      const length = Math.sqrt(
        Math.pow(endVertex.x - startVertex.x, 2) +
        Math.pow(endVertex.y - startVertex.y, 2) +
        Math.pow(endVertex.z - startVertex.z, 2)
      );

      const edge: Edge3D = {
        id: edgeId,
        startVertexId,
        endVertexId,
        length,
        faces: [plane.id],
        type: 'eave', // TODO: Implement edge type detection
      };

      session.edges.set(edgeId, edge);
    }

    // Create face from the plane
    const face: Face3D = {
      id: plane.id,
      vertexIds,
      normal: new THREE.Vector3(plane.normal.x, plane.normal.y, plane.normal.z),
      area: plane.area,
      perimeter: plane.perimeter,
      roofPlaneId: plane.id,
      material: {
        type: plane.material || 'unknown',
        color: new THREE.Color(0x888888), // Default gray
      },
      slopeAngle: plane.pitchAngle,
      orientation: plane.azimuthAngle,
    };

    session.faces.set(face.id, face);
  }

  /**
   * Export 3D session to THREE.js geometry
   * TODO: Implement BufferGeometry generation for rendering
   */
  exportToThreeGeometry(sessionId: string): THREE.BufferGeometry | null {
    const session = this.getSession(sessionId);
    if (!session) return null;

    const geometry = new THREE.BufferGeometry();
    
    // TODO: Convert vertices, faces to THREE.js BufferGeometry
    // This will be implemented in future iterations
    
    return geometry;
  }

  /**
   * Convert 3D session back to standard RoofMeasurement
   */
  convertToRoofMeasurement(sessionId: string, baseData: Partial<RoofMeasurement>): RoofMeasurement | null {
    const session = this.getSession(sessionId);
    if (!session) return null;

    const planes: RoofPlane[] = [];

    // Convert faces back to roof planes
    session.faces.forEach((face) => {
      if (face.roofPlaneId) {
        const boundaries: ARPoint[] = face.vertexIds.map(vid => {
          const vertex = session.vertices.get(vid)!;
          return {
            x: vertex.x,
            y: vertex.y,
            z: vertex.z,
            confidence: vertex.confidence,
            timestamp: vertex.timestamp,
            sensorAccuracy: vertex.sensorAccuracy,
          };
        });

        const plane: RoofPlane = {
          id: face.id,
          boundaries,
          normal: {
            x: face.normal.x,
            y: face.normal.y,
            z: face.normal.z,
          },
          pitchAngle: face.slopeAngle,
          azimuthAngle: face.orientation,
          area: face.area,
          perimeter: face.perimeter,
          projectedArea: face.area * Math.cos((face.slopeAngle * Math.PI) / 180),
          type: 'primary', // TODO: Determine type from 3D analysis
          confidence: 0.85, // TODO: Calculate from 3D validation
          material: face.material.type,
        };

        planes.push(plane);
      }
    });

    const measurement: RoofMeasurement = {
      id: baseData.id || sessionId,
      propertyId: baseData.propertyId || '',
      userId: baseData.userId || '',
      timestamp: baseData.timestamp || new Date(),
      planes,
      totalArea: session.totalArea,
      totalProjectedArea: planes.reduce((sum, p) => sum + p.projectedArea, 0),
      accuracy: baseData.accuracy || 0.85,
      deviceInfo: baseData.deviceInfo || {
        model: 'Unknown',
        osVersion: 'Unknown',
        appVersion: '1.0.0',
        arSupport: {
          planeDetection: false,
          lightEstimation: false,
        },
        sensorCalibration: 'good',
      },
      qualityMetrics: baseData.qualityMetrics || {
        overallScore: 75,
        trackingStability: 80,
        pointDensity: 10,
        duration: 300,
        trackingInterruptions: 0,
        lightingQuality: 75,
        movementSmoothness: 85,
      },
      auditTrail: baseData.auditTrail || [],
      exports: baseData.exports || [],
      complianceStatus: baseData.complianceStatus || {
        status: 'pending',
        standards: [],
        certifications: [],
        lastCheck: new Date(),
        nextCheck: new Date(),
        notes: [],
      },
      metadata: baseData.metadata || {},
    };

    return measurement;
  }

  /**
   * Update session metadata based on current geometry
   */
  private updateSessionMetadata(session: Measurement3DSession): void {
    session.metadata.vertexCount = session.vertices.size;
    session.metadata.edgeCount = session.edges.size;
    session.metadata.faceCount = session.faces.size;
    
    // Calculate total area
    session.totalArea = Array.from(session.faces.values())
      .reduce((sum, face) => sum + face.area, 0);

    // Calculate complexity score based on geometry
    session.metadata.complexityScore = this.calculateComplexityScore(session);
    
    // Update bounding box
    this.updateBoundingBox(session);
    
    // Validate geometry
    session.metadata.isValid = this.validateGeometry(session);
  }

  /**
   * Calculate complexity score for the 3D model
   */
  private calculateComplexityScore(session: Measurement3DSession): number {
    const vertexWeight = session.metadata.vertexCount * 0.1;
    const edgeWeight = session.metadata.edgeCount * 0.05;
    const faceWeight = session.metadata.faceCount * 0.2;
    
    return Math.min(100, vertexWeight + edgeWeight + faceWeight);
  }

  /**
   * Update the bounding box for the 3D model
   */
  private updateBoundingBox(session: Measurement3DSession): void {
    session.boundingBox.makeEmpty();
    
    session.vertices.forEach((vertex) => {
      session.boundingBox.expandByPoint(new THREE.Vector3(vertex.x, vertex.y, vertex.z));
    });
  }

  /**
   * Validate the 3D geometry for consistency
   */
  private validateGeometry(session: Measurement3DSession): boolean {
    // Basic validation checks
    if (session.vertices.size < 3) return false;
    if (session.faces.size === 0) return false;
    
    // TODO: Implement comprehensive 3D geometry validation
    // - Check for manifold geometry
    // - Validate edge-face relationships
    // - Check for self-intersections
    // - Validate normal vectors
    
    return true;
  }

  /**
   * Delete a measurement session
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): Measurement3DSession[] {
    return Array.from(this.sessions.values());
  }
}

// Export singleton instance
export const measurement3DDataService = new Measurement3DDataService();

// Export types for use in other modules
export type {
  Vertex3D as Vertex3DType,
  Edge3D as Edge3DType,
  Face3D as Face3DType,
  Measurement3DSession as Measurement3DSessionType,
};

// TODO: Implement advanced 3D analysis features:
// TODO: - Roof pitch and orientation analysis from 3D data
// TODO: - Automatic edge type classification (ridge, valley, hip, etc.)
// TODO: - 3D model simplification and optimization
// TODO: - Export to CAD formats (OBJ, STL, PLY)
// TODO: - Integration with AR anchoring for precise placement
// TODO: - Multi-material support with texture mapping
// TODO: - Drainage analysis and water flow simulation
// TODO: - Structural load analysis preparation
// TODO: - Integration with BIM (Building Information Modeling)
// TODO: - Real-time collaboration on 3D models