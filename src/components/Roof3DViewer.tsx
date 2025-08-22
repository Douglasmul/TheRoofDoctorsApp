/**
 * @fileoverview 3D Roof Viewer Component
 * Renders 3D roof geometry using three.js and expo-gl
 * @version 1.0.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Text, Alert } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';

import { RoofGeometry3D, RoofModel3D, Viewer3DConfig, Viewer3DEvents } from '../types/geometry3d';

interface Roof3DViewerProps {
  /** 3D model to display */
  model?: RoofModel3D;
  /** Individual geometry to display (if no model provided) */
  geometry?: RoofGeometry3D;
  /** Viewer configuration */
  config?: Partial<Viewer3DConfig>;
  /** Event handlers */
  events?: Partial<Viewer3DEvents>;
  /** Component styling */
  style?: any;
  /** Enable/disable viewer controls */
  controlsEnabled?: boolean;
}

/**
 * Default viewer configuration
 */
const DEFAULT_CONFIG: Viewer3DConfig = {
  camera: {
    position: { x: 10, y: 8, z: 10 },
    target: { x: 0, y: 0, z: 0 },
    fov: 75,
    aspect: 1,
    near: 0.1,
    far: 1000,
    controlsEnabled: true,
  },
  lighting: {
    ambientIntensity: 0.4,
    ambientColor: '#ffffff',
    directionalLights: [
      {
        intensity: 0.8,
        color: '#ffffff',
        position: { x: 10, y: 10, z: 5 },
        target: { x: 0, y: 0, z: 0 },
      },
    ],
  },
  renderer: {
    backgroundColor: '#87CEEB', // Sky blue
    shadows: true,
    antialias: true,
    toneMapping: 'aces',
  },
  grid: {
    enabled: true,
    size: 20,
    divisions: 20,
    color: '#888888',
  },
  axes: {
    enabled: true,
    size: 5,
  },
};

/**
 * 3D Roof Viewer Component
 */
export const Roof3DViewer: React.FC<Roof3DViewerProps> = ({
  model,
  geometry,
  config = {},
  events = {},
  style,
  controlsEnabled = true,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  // Three.js objects
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<Renderer>();
  const frameRef = useRef<number>();

  // Merged configuration
  const viewerConfig: Viewer3DConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    camera: { ...DEFAULT_CONFIG.camera, ...config.camera },
    lighting: { ...DEFAULT_CONFIG.lighting, ...config.lighting },
    renderer: { ...DEFAULT_CONFIG.renderer, ...config.renderer },
  };

  /**
   * Initialize Three.js scene
   */
  const initializeScene = useCallback(async (gl: WebGLRenderingContext) => {
    try {
      setIsLoading(true);
      setError(null);

      // Create renderer
      const renderer = new Renderer({ gl });
      renderer.setSize(dimensions.width, dimensions.height);
      renderer.setClearColor(viewerConfig.renderer.backgroundColor);
      
      if (viewerConfig.renderer.shadows) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }

      rendererRef.current = renderer;

      // Create scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        viewerConfig.camera.fov,
        dimensions.width / dimensions.height,
        viewerConfig.camera.near,
        viewerConfig.camera.far
      );
      
      camera.position.set(
        viewerConfig.camera.position.x,
        viewerConfig.camera.position.y,
        viewerConfig.camera.position.z
      );
      
      camera.lookAt(
        viewerConfig.camera.target.x,
        viewerConfig.camera.target.y,
        viewerConfig.camera.target.z
      );

      cameraRef.current = camera;

      // Add lighting
      setupLighting(scene);

      // Add helpers
      if (viewerConfig.grid?.enabled) {
        addGridHelper(scene);
      }
      
      if (viewerConfig.axes?.enabled) {
        addAxesHelper(scene);
      }

      // Load and add geometry/model
      if (model) {
        await addModelToScene(scene, model);
        events.onModelLoaded?.(model);
      } else if (geometry) {
        await addGeometryToScene(scene, geometry);
      }

      // Start render loop
      startRenderLoop(renderer, scene, camera);

      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      events.onError?.(new Error(errorMessage));
      setIsLoading(false);
    }
  }, [model, geometry, viewerConfig, dimensions, events]);

  /**
   * Setup scene lighting
   */
  const setupLighting = (scene: THREE.Scene) => {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(
      viewerConfig.lighting.ambientColor,
      viewerConfig.lighting.ambientIntensity
    );
    scene.add(ambientLight);

    // Directional lights
    viewerConfig.lighting.directionalLights.forEach(lightConfig => {
      const directionalLight = new THREE.DirectionalLight(
        lightConfig.color,
        lightConfig.intensity
      );
      
      directionalLight.position.set(
        lightConfig.position.x,
        lightConfig.position.y,
        lightConfig.position.z
      );

      if (lightConfig.target) {
        directionalLight.target.position.set(
          lightConfig.target.x,
          lightConfig.target.y,
          lightConfig.target.z
        );
        scene.add(directionalLight.target);
      }

      if (viewerConfig.renderer.shadows) {
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
      }

      scene.add(directionalLight);
    });

    // Point lights (if any)
    viewerConfig.lighting.pointLights?.forEach(lightConfig => {
      const pointLight = new THREE.PointLight(
        lightConfig.color,
        lightConfig.intensity,
        lightConfig.distance || 0
      );
      
      pointLight.position.set(
        lightConfig.position.x,
        lightConfig.position.y,
        lightConfig.position.z
      );

      scene.add(pointLight);
    });
  };

  /**
   * Add grid helper to scene
   */
  const addGridHelper = (scene: THREE.Scene) => {
    const gridHelper = new THREE.GridHelper(
      viewerConfig.grid!.size,
      viewerConfig.grid!.divisions,
      viewerConfig.grid!.color,
      viewerConfig.grid!.color
    );
    scene.add(gridHelper);
  };

  /**
   * Add axes helper to scene
   */
  const addAxesHelper = (scene: THREE.Scene) => {
    const axesHelper = new THREE.AxesHelper(viewerConfig.axes!.size);
    scene.add(axesHelper);
  };

  /**
   * Add model to scene
   */
  const addModelToScene = async (scene: THREE.Scene, model: RoofModel3D) => {
    const modelGroup = new THREE.Group();
    modelGroup.name = model.name;

    // Apply model transform
    modelGroup.position.set(
      model.transform.position.x,
      model.transform.position.y,
      model.transform.position.z
    );
    
    modelGroup.rotation.set(
      model.transform.rotation.x,
      model.transform.rotation.y,
      model.transform.rotation.z
    );
    
    modelGroup.scale.set(
      model.transform.scale.x,
      model.transform.scale.y,
      model.transform.scale.z
    );

    // Add each geometry to the model group
    for (const geometry of model.geometries) {
      const mesh = await createMeshFromGeometry(geometry);
      modelGroup.add(mesh);
    }

    scene.add(modelGroup);
  };

  /**
   * Add single geometry to scene
   */
  const addGeometryToScene = async (scene: THREE.Scene, geometry: RoofGeometry3D) => {
    const mesh = await createMeshFromGeometry(geometry);
    scene.add(mesh);
  };

  /**
   * Create Three.js mesh from geometry data
   */
  const createMeshFromGeometry = async (geometry: RoofGeometry3D): Promise<THREE.Mesh> => {
    // Create Three.js geometry
    const threeGeometry = new THREE.BufferGeometry();

    // Convert vertices to Three.js format
    const vertices: number[] = [];
    const indices: number[] = [];

    geometry.vertices.forEach(vertex => {
      vertices.push(vertex.x, vertex.y, vertex.z);
    });

    // Convert faces to indices
    geometry.faces.forEach(face => {
      if (face.vertices.length === 3) {
        // Triangle
        indices.push(face.vertices[0], face.vertices[1], face.vertices[2]);
      } else if (face.vertices.length === 4) {
        // Quad - split into two triangles
        const [a, b, c, d] = face.vertices;
        indices.push(a, b, c);
        indices.push(a, c, d);
      }
    });

    threeGeometry.setIndex(indices);
    threeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    threeGeometry.computeVertexNormals();

    // Create material
    const material = createMaterialFromGeometry(geometry);

    // Create mesh
    const mesh = new THREE.Mesh(threeGeometry, material);
    mesh.name = geometry.name;
    mesh.castShadow = viewerConfig.renderer.shadows;
    mesh.receiveShadow = viewerConfig.renderer.shadows;

    return mesh;
  };

  /**
   * Create Three.js material from geometry data
   */
  const createMaterialFromGeometry = (geometry: RoofGeometry3D): THREE.Material => {
    if (geometry.materials.length === 0) {
      return new THREE.MeshStandardMaterial({ color: 0x888888 });
    }

    const materialData = geometry.materials[0];
    
    return new THREE.MeshStandardMaterial({
      color: materialData.color,
      opacity: materialData.opacity || 1.0,
      transparent: (materialData.opacity || 1.0) < 1.0,
      roughness: materialData.roughness || 0.5,
      metalness: materialData.metallic || 0.0,
    });
  };

  /**
   * Start render loop
   */
  const startRenderLoop = (
    renderer: Renderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) => {
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      // Simple auto-rotation for demo purposes
      if (controlsEnabled && scene.children.length > 0) {
        scene.rotation.y += 0.005;
      }

      renderer.render(scene, camera);
      renderer.getContext().endFrameEXP();
    };

    animate();
  };

  /**
   * Cleanup Three.js objects
   */
  const cleanup = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    if (sceneRef.current) {
      // Dispose of geometries and materials
      sceneRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }
  }, []);

  /**
   * Handle dimension changes
   */
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
      
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.width / window.height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.width, window.height);
      }
    });

    return () => subscription?.remove();
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  if (error) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>3D Viewer Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <GLView
        style={styles.glView}
        onContextCreate={initializeScene}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading 3D Model...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  glView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e53e3e',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default Roof3DViewer;