/**
 * @fileoverview 3D Geometry Service for roof visualization
 * Handles conversion from RoofPlane to 3D geometry and geometry management
 * @version 1.0.0
 */

import { RoofPlane, ARPoint } from '../types/measurement';
import {
  RoofGeometry3D,
  RoofModel3D,
  Material3D,
  Vertex3D,
  Face3D,
  RoofPlaneToGeometry3DConverter,
  Geometry3DIOService,
  GeometryExportFormat
} from '../types/geometry3d';

/**
 * Default materials for different roof types
 */
const DEFAULT_MATERIALS: Record<string, Material3D> = {
  shingle: {
    id: 'shingle_default',
    name: 'Asphalt Shingle',
    type: 'shingle',
    color: '#8B4513',
    opacity: 1.0,
    roughness: 0.8,
    metallic: 0.0,
  },
  tile: {
    id: 'tile_default',
    name: 'Clay Tile',
    type: 'tile',
    color: '#D2691E',
    opacity: 1.0,
    roughness: 0.6,
    metallic: 0.0,
  },
  metal: {
    id: 'metal_default',
    name: 'Metal Roofing',
    type: 'metal',
    color: '#708090',
    opacity: 1.0,
    roughness: 0.3,
    metallic: 0.8,
  },
  flat: {
    id: 'flat_default',
    name: 'Flat Membrane',
    type: 'flat',
    color: '#696969',
    opacity: 1.0,
    roughness: 0.9,
    metallic: 0.0,
  },
  unknown: {
    id: 'unknown_default',
    name: 'Unknown Material',
    type: 'unknown',
    color: '#A0A0A0',
    opacity: 0.8,
    roughness: 0.5,
    metallic: 0.2,
  },
};

/**
 * Service for managing 3D geometry operations
 */
export class Geometry3DService implements RoofPlaneToGeometry3DConverter, Geometry3DIOService {
  private geometryCache: Map<string, RoofGeometry3D> = new Map();
  private modelCache: Map<string, RoofModel3D> = new Map();

  /**
   * Convert a RoofPlane to 3D geometry
   */
  public convertPlaneToGeometry(
    plane: RoofPlane,
    options: {
      extrusionHeight?: number;
      material?: Material3D;
      lod?: 'low' | 'medium' | 'high';
    } = {}
  ): RoofGeometry3D {
    const {
      extrusionHeight = 0.1, // 10cm default thickness
      material = this.getMaterialForPlane(plane),
      lod = 'medium'
    } = options;

    // Check cache first
    const cacheKey = this.generateCacheKey(plane, options);
    if (this.geometryCache.has(cacheKey)) {
      return this.geometryCache.get(cacheKey)!;
    }

    // Convert boundary points to vertices
    const vertices = this.convertBoundariesToVertices(plane.boundaries, extrusionHeight, lod);
    
    // Generate faces from the vertices
    const faces = this.generateFacesFromVertices(vertices, plane.boundaries.length);
    
    // Calculate bounding box
    const boundingBox = this.calculateBoundingBox(vertices);

    const geometry: RoofGeometry3D = {
      id: `geometry_${plane.id}`,
      name: `${plane.type} Geometry`,
      roofPlaneId: plane.id,
      vertices,
      faces,
      materials: [material],
      boundingBox,
      metadata: {
        created: new Date(),
        modified: new Date(),
        source: 'ar_scan',
        complexity: lod,
        totalArea: plane.area,
        isValid: this.validateGeometry(vertices, faces),
      },
    };

    // Cache the result
    this.geometryCache.set(cacheKey, geometry);
    
    return geometry;
  }

  /**
   * Convert multiple RoofPlanes to a complete 3D model
   */
  public convertPlanesToModel(
    planes: RoofPlane[],
    options: {
      name?: string;
      autoMaterials?: boolean;
      mergeAdjacent?: boolean;
    } = {}
  ): RoofModel3D {
    const {
      name = 'Roof Model',
      autoMaterials = true,
      mergeAdjacent = false
    } = options;

    // Convert each plane to geometry
    const geometries = planes.map(plane => {
      const material = autoMaterials ? this.getMaterialForPlane(plane) : DEFAULT_MATERIALS.unknown;
      return this.convertPlaneToGeometry(plane, { material });
    });

    // TODO: Implement mergeAdjacent logic for adjacent planes
    if (mergeAdjacent) {
      // This would require complex geometric algorithms to detect and merge adjacent planes
      console.log('Merge adjacent planes feature not yet implemented');
    }

    // Calculate total statistics
    const totalVertices = geometries.reduce((sum, geo) => sum + geo.vertices.length, 0);
    const totalFaces = geometries.reduce((sum, geo) => sum + geo.faces.length, 0);

    const model: RoofModel3D = {
      id: `model_${Date.now()}`,
      name,
      description: `3D model generated from ${planes.length} roof planes`,
      geometries,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      metadata: {
        created: new Date(),
        modified: new Date(),
        version: '1.0.0',
        totalVertices,
        totalFaces,
        totalGeometries: geometries.length,
      },
    };

    // Cache the model
    this.modelCache.set(model.id, model);

    return model;
  }

  /**
   * Export geometry to specified format
   */
  public async exportGeometry(geometry: RoofGeometry3D, format: GeometryExportFormat): Promise<string | Blob> {
    switch (format) {
      case 'json':
        return JSON.stringify(geometry, null, 2);
      
      case 'obj':
        return this.exportToOBJ(geometry);
      
      case 'ply':
        return this.exportToPLY(geometry);
      
      default:
        throw new Error(`Export format ${format} not yet implemented`);
    }
  }

  /**
   * Export model to specified format
   */
  public async exportModel(model: RoofModel3D, format: GeometryExportFormat): Promise<string | Blob> {
    switch (format) {
      case 'json':
        return JSON.stringify(model, null, 2);
      
      case 'obj':
        return this.exportModelToOBJ(model);
      
      default:
        throw new Error(`Model export format ${format} not yet implemented`);
    }
  }

  /**
   * Import geometry from file/data
   */
  public async importGeometry(data: string | Blob, format: GeometryExportFormat): Promise<RoofGeometry3D> {
    switch (format) {
      case 'json':
        const jsonData = typeof data === 'string' ? data : await data.text();
        return JSON.parse(jsonData) as RoofGeometry3D;
      
      default:
        throw new Error(`Import format ${format} not yet implemented`);
    }
  }

  /**
   * Import model from file/data
   */
  public async importModel(data: string | Blob, format: GeometryExportFormat): Promise<RoofModel3D> {
    switch (format) {
      case 'json':
        const jsonData = typeof data === 'string' ? data : await data.text();
        return JSON.parse(jsonData) as RoofModel3D;
      
      default:
        throw new Error(`Model import format ${format} not yet implemented`);
    }
  }

  /**
   * Generate sample/demo geometry for testing
   */
  public generateSampleGeometry(): RoofGeometry3D {
    // Create a simple gabled roof geometry for demonstration
    const vertices: Vertex3D[] = [
      // Bottom vertices (ground level)
      { x: -5, y: 0, z: -3 },  // 0: front left
      { x: 5, y: 0, z: -3 },   // 1: front right
      { x: 5, y: 0, z: 3 },    // 2: back right
      { x: -5, y: 0, z: 3 },   // 3: back left
      
      // Top vertices (ridge)
      { x: -5, y: 3, z: 0 },   // 4: ridge front left
      { x: 5, y: 3, z: 0 },    // 5: ridge front right
    ];

    const faces: Face3D[] = [
      // Front roof plane
      { vertices: [0, 1, 5, 4], materialIndex: 0 },
      // Back roof plane
      { vertices: [2, 3, 4, 5], materialIndex: 0 },
      // Left gable end
      { vertices: [0, 4, 3], materialIndex: 0 },
      // Right gable end
      { vertices: [1, 2, 5], materialIndex: 0 },
    ];

    const material = DEFAULT_MATERIALS.shingle;

    return {
      id: 'sample_gabled_roof',
      name: 'Sample Gabled Roof',
      vertices,
      faces,
      materials: [material],
      boundingBox: this.calculateBoundingBox(vertices),
      metadata: {
        created: new Date(),
        modified: new Date(),
        source: 'generated',
        complexity: 'low',
        totalArea: 60, // Approximate area
        isValid: true,
      },
    };
  }

  /**
   * Get appropriate material for a roof plane
   */
  private getMaterialForPlane(plane: RoofPlane): Material3D {
    const materialType = plane.material || 'unknown';
    return DEFAULT_MATERIALS[materialType] || DEFAULT_MATERIALS.unknown;
  }

  /**
   * Convert boundary points to 3D vertices with extrusion
   */
  private convertBoundariesToVertices(
    boundaries: ARPoint[],
    extrusionHeight: number,
    lod: 'low' | 'medium' | 'high'
  ): Vertex3D[] {
    const vertices: Vertex3D[] = [];

    // Add bottom vertices (at ground level)
    boundaries.forEach(point => {
      vertices.push({
        x: point.x,
        y: 0, // Ground level
        z: point.z,
      });
    });

    // Add top vertices (extruded upward)
    boundaries.forEach(point => {
      vertices.push({
        x: point.x,
        y: extrusionHeight,
        z: point.z,
      });
    });

    // For higher LOD, could add intermediate vertices
    if (lod === 'high') {
      // TODO: Add subdivided vertices for smoother surfaces
    }

    return vertices;
  }

  /**
   * Generate faces from vertices
   */
  private generateFacesFromVertices(vertices: Vertex3D[], boundaryCount: number): Face3D[] {
    const faces: Face3D[] = [];

    // Top face (roof surface)
    const topVertices = Array.from({ length: boundaryCount }, (_, i) => i + boundaryCount);
    faces.push({ vertices: topVertices, materialIndex: 0 });

    // Bottom face
    const bottomVertices = Array.from({ length: boundaryCount }, (_, i) => i).reverse();
    faces.push({ vertices: bottomVertices, materialIndex: 0 });

    // Side faces (connecting top and bottom)
    for (let i = 0; i < boundaryCount; i++) {
      const next = (i + 1) % boundaryCount;
      faces.push({
        vertices: [i, next, next + boundaryCount, i + boundaryCount],
        materialIndex: 0,
      });
    }

    return faces;
  }

  /**
   * Calculate bounding box for vertices
   */
  private calculateBoundingBox(vertices: Vertex3D[]) {
    if (vertices.length === 0) {
      return {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
      };
    }

    const min = { x: Infinity, y: Infinity, z: Infinity };
    const max = { x: -Infinity, y: -Infinity, z: -Infinity };

    vertices.forEach(vertex => {
      min.x = Math.min(min.x, vertex.x);
      min.y = Math.min(min.y, vertex.y);
      min.z = Math.min(min.z, vertex.z);
      max.x = Math.max(max.x, vertex.x);
      max.y = Math.max(max.y, vertex.y);
      max.z = Math.max(max.z, vertex.z);
    });

    return { min, max };
  }

  /**
   * Validate geometry for consistency
   */
  private validateGeometry(vertices: Vertex3D[], faces: Face3D[]): boolean {
    // Basic validation checks
    if (vertices.length < 3) return false;
    if (faces.length === 0) return false;

    // Check that all face vertex indices are valid
    for (const face of faces) {
      for (const vertexIndex of face.vertices) {
        if (vertexIndex < 0 || vertexIndex >= vertices.length) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Generate cache key for geometry
   */
  private generateCacheKey(plane: RoofPlane, options: any): string {
    return `${plane.id}_${JSON.stringify(options)}`;
  }

  /**
   * Export geometry to OBJ format
   */
  private exportToOBJ(geometry: RoofGeometry3D): string {
    let obj = `# Generated by TheRoofDoctorsApp\n`;
    obj += `# Geometry: ${geometry.name}\n\n`;

    // Export vertices
    geometry.vertices.forEach(vertex => {
      obj += `v ${vertex.x} ${vertex.y} ${vertex.z}\n`;
    });

    obj += '\n';

    // Export faces (OBJ uses 1-based indexing)
    geometry.faces.forEach(face => {
      const indices = face.vertices.map(i => i + 1).join(' ');
      obj += `f ${indices}\n`;
    });

    return obj;
  }

  /**
   * Export geometry to PLY format
   */
  private exportToPLY(geometry: RoofGeometry3D): string {
    let ply = `ply\nformat ascii 1.0\n`;
    ply += `comment Generated by TheRoofDoctorsApp\n`;
    ply += `element vertex ${geometry.vertices.length}\n`;
    ply += `property float x\nproperty float y\nproperty float z\n`;
    ply += `element face ${geometry.faces.length}\n`;
    ply += `property list uchar int vertex_indices\n`;
    ply += `end_header\n`;

    // Export vertices
    geometry.vertices.forEach(vertex => {
      ply += `${vertex.x} ${vertex.y} ${vertex.z}\n`;
    });

    // Export faces
    geometry.faces.forEach(face => {
      ply += `${face.vertices.length} ${face.vertices.join(' ')}\n`;
    });

    return ply;
  }

  /**
   * Export model to OBJ format
   */
  private exportModelToOBJ(model: RoofModel3D): string {
    let obj = `# Generated by TheRoofDoctorsApp\n`;
    obj += `# Model: ${model.name}\n\n`;

    let vertexOffset = 0;

    model.geometries.forEach((geometry, index) => {
      obj += `# Geometry ${index + 1}: ${geometry.name}\n`;
      obj += `g ${geometry.name.replace(/\s+/g, '_')}\n\n`;

      // Export vertices for this geometry
      geometry.vertices.forEach(vertex => {
        obj += `v ${vertex.x} ${vertex.y} ${vertex.z}\n`;
      });

      obj += '\n';

      // Export faces with vertex offset
      geometry.faces.forEach(face => {
        const indices = face.vertices.map(i => i + vertexOffset + 1).join(' ');
        obj += `f ${indices}\n`;
      });

      obj += '\n';
      vertexOffset += geometry.vertices.length;
    });

    return obj;
  }

  /**
   * Clear caches
   */
  public clearCache(): void {
    this.geometryCache.clear();
    this.modelCache.clear();
  }
}