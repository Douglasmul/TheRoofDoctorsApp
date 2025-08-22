/**
 * @fileoverview 3D geometry type definitions for roof visualization
 * Integrates with existing RoofPlane system for 3D rendering capabilities
 * @version 1.0.0
 */

import { RoofPlane, ARPoint } from './measurement';
import * as THREE from 'three';

/**
 * 3D Geometry vertex point
 */
export interface Vertex3D {
  /** X coordinate in 3D space */
  x: number;
  /** Y coordinate in 3D space */
  y: number;
  /** Z coordinate in 3D space */
  z: number;
  /** Optional normal vector for lighting */
  normal?: { x: number; y: number; z: number };
  /** Optional UV coordinates for texturing */
  uv?: { u: number; v: number };
}

/**
 * 3D face definition (triangle or quad)
 */
export interface Face3D {
  /** Vertex indices that form this face */
  vertices: number[];
  /** Material index for this face */
  materialIndex?: number;
  /** Face normal vector */
  normal?: { x: number; y: number; z: number };
}

/**
 * 3D material definition for roof surfaces
 */
export interface Material3D {
  /** Unique material identifier */
  id: string;
  /** Material name */
  name: string;
  /** Material type matching RoofPlane materials */
  type: 'shingle' | 'tile' | 'metal' | 'flat' | 'unknown' | 'custom';
  /** Diffuse color (hex or RGB) */
  color: string;
  /** Material opacity (0-1) */
  opacity?: number;
  /** Roughness for PBR materials (0-1) */
  roughness?: number;
  /** Metallic factor for PBR materials (0-1) */
  metallic?: number;
  /** Texture map URLs */
  textures?: {
    diffuse?: string;
    normal?: string;
    roughness?: string;
    metallic?: string;
  };
}

/**
 * 3D roof geometry object
 */
export interface RoofGeometry3D {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Associated roof plane ID if derived from AR measurement */
  roofPlaneId?: string;
  /** Array of 3D vertices */
  vertices: Vertex3D[];
  /** Array of faces defining the geometry */
  faces: Face3D[];
  /** Array of materials used */
  materials: Material3D[];
  /** Bounding box for the geometry */
  boundingBox: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  /** Geometry metadata */
  metadata: {
    /** Creation timestamp */
    created: Date;
    /** Last modified timestamp */
    modified: Date;
    /** Source of the geometry (manual, ar_scan, import) */
    source: 'manual' | 'ar_scan' | 'import' | 'generated';
    /** Geometry complexity level */
    complexity: 'low' | 'medium' | 'high';
    /** Total surface area */
    totalArea: number;
    /** Geometry validation status */
    isValid: boolean;
  };
}

/**
 * 3D roof model containing multiple geometry objects
 */
export interface RoofModel3D {
  /** Unique model identifier */
  id: string;
  /** Model name */
  name: string;
  /** Description */
  description?: string;
  /** Array of geometry objects in this model */
  geometries: RoofGeometry3D[];
  /** Model transform (position, rotation, scale) */
  transform: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
  };
  /** Model metadata */
  metadata: {
    created: Date;
    modified: Date;
    version: string;
    author?: string;
    totalVertices: number;
    totalFaces: number;
    totalGeometries: number;
  };
}

/**
 * 3D viewer camera configuration
 */
export interface Camera3DConfig {
  /** Camera position */
  position: { x: number; y: number; z: number };
  /** Camera target/look-at point */
  target: { x: number; y: number; z: number };
  /** Field of view in degrees */
  fov: number;
  /** Camera aspect ratio */
  aspect: number;
  /** Near clipping plane */
  near: number;
  /** Far clipping plane */
  far: number;
  /** Camera controls enabled */
  controlsEnabled: boolean;
}

/**
 * 3D scene lighting configuration
 */
export interface Lighting3DConfig {
  /** Ambient light intensity */
  ambientIntensity: number;
  /** Ambient light color */
  ambientColor: string;
  /** Directional lights */
  directionalLights: Array<{
    intensity: number;
    color: string;
    position: { x: number; y: number; z: number };
    target?: { x: number; y: number; z: number };
  }>;
  /** Point lights */
  pointLights?: Array<{
    intensity: number;
    color: string;
    position: { x: number; y: number; z: number };
    distance?: number;
  }>;
}

/**
 * 3D viewer configuration
 */
export interface Viewer3DConfig {
  /** Camera configuration */
  camera: Camera3DConfig;
  /** Lighting configuration */
  lighting: Lighting3DConfig;
  /** Renderer settings */
  renderer: {
    /** Background color */
    backgroundColor: string;
    /** Enable shadows */
    shadows: boolean;
    /** Anti-aliasing */
    antialias: boolean;
    /** Tone mapping */
    toneMapping: 'none' | 'linear' | 'reinhard' | 'cineon' | 'aces';
  };
  /** Grid helper settings */
  grid?: {
    enabled: boolean;
    size: number;
    divisions: number;
    color: string;
  };
  /** Axes helper settings */
  axes?: {
    enabled: boolean;
    size: number;
  };
}

/**
 * Conversion utilities from RoofPlane to 3D geometry
 */
export interface RoofPlaneToGeometry3DConverter {
  /** Convert a RoofPlane to 3D geometry */
  convertPlaneToGeometry(plane: RoofPlane, options?: {
    /** Extrusion height for flat planes */
    extrusionHeight?: number;
    /** Material assignment */
    material?: Material3D;
    /** Level of detail */
    lod?: 'low' | 'medium' | 'high';
  }): RoofGeometry3D;
  
  /** Convert multiple RoofPlanes to a complete 3D model */
  convertPlanesToModel(planes: RoofPlane[], options?: {
    /** Model name */
    name?: string;
    /** Auto-generate materials based on plane types */
    autoMaterials?: boolean;
    /** Merge adjacent planes */
    mergeAdjacent?: boolean;
  }): RoofModel3D;
}

/**
 * 3D geometry export formats
 */
export type GeometryExportFormat = 'obj' | 'gltf' | 'ply' | 'stl' | 'json';

/**
 * 3D geometry import/export service interface
 */
export interface Geometry3DIOService {
  /** Export geometry to specified format */
  exportGeometry(geometry: RoofGeometry3D, format: GeometryExportFormat): Promise<string | Blob>;
  
  /** Export model to specified format */
  exportModel(model: RoofModel3D, format: GeometryExportFormat): Promise<string | Blob>;
  
  /** Import geometry from file/data */
  importGeometry(data: string | Blob, format: GeometryExportFormat): Promise<RoofGeometry3D>;
  
  /** Import model from file/data */
  importModel(data: string | Blob, format: GeometryExportFormat): Promise<RoofModel3D>;
}

/**
 * 3D viewer event types
 */
export interface Viewer3DEvents {
  /** Model loaded event */
  onModelLoaded: (model: RoofModel3D) => void;
  /** Geometry selected event */
  onGeometrySelected: (geometry: RoofGeometry3D | null) => void;
  /** Camera changed event */
  onCameraChanged: (camera: Camera3DConfig) => void;
  /** Error event */
  onError: (error: Error) => void;
}