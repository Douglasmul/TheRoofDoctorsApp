/**
 * @fileoverview 3D Measurement View Component
 * Provides 3D visualization and interaction for roof geometry using expo-three
 * Compatible with Expo Go - no custom native modules required
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { GLView } from 'expo-gl';
import { ExpoWebGLRenderingContext, WebGLObject } from 'expo-gl';
import ExpoTHREE, { Renderer } from 'expo-three';
import * as THREE from 'three';
import { RoofPlane, RoofMeasurement } from '../types/measurement.d';
import { measurement3DDataService, Measurement3DSessionType, Face3DType } from '../services/Measurement3DDataService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Measurement3DViewProps {
  /** Initial roof measurement data */
  measurement?: RoofMeasurement;
  /** 3D session ID for data management */
  sessionId: string;
  /** Callback when measurement is updated */
  onMeasurementUpdate?: (measurement: RoofMeasurement) => void;
  /** Callback when 3D interaction occurs */
  onInteraction?: (type: 'select' | 'move' | 'rotate', data: any) => void;
  /** View mode for 3D display */
  viewMode?: 'wireframe' | 'solid' | 'mixed';
  /** Enable interaction controls */
  interactive?: boolean;
}

/**
 * 3D Measurement View Component
 * Renders and manages 3D roof geometry visualization
 */
export const Measurement3DView: React.FC<Measurement3DViewProps> = ({
  measurement,
  sessionId,
  onMeasurementUpdate,
  onInteraction,
  viewMode = 'solid',
  interactive = true,
}) => {
  // Component state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Measurement3DSessionType | null>(null);
  const [selectedFace, setSelectedFace] = useState<string | null>(null);

  // Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const frameId = useRef<number | null>(null);

  // Initialize 3D session and data
  useEffect(() => {
    initializeSession();
    return () => {
      // Cleanup on unmount
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
    };
  }, [sessionId, measurement]);

  /**
   * Initialize the 3D measurement session
   */
  const initializeSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create or get existing session
      let currentSession = measurement3DDataService.getSession(sessionId);
      if (!currentSession) {
        currentSession = measurement3DDataService.createSession(sessionId);
      }

      // Convert measurement data to 3D if provided
      if (measurement && measurement.planes.length > 0) {
        const success = measurement3DDataService.convertRoofPlanesTo3D(sessionId, measurement.planes);
        if (!success) {
          throw new Error('Failed to convert measurement data to 3D');
        }
        currentSession = measurement3DDataService.getSession(sessionId)!;
      }

      setSession(currentSession);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize 3D session');
      setIsLoading(false);
    }
  };

  /**
   * Setup Three.js scene, camera, and renderer
   */
  const setupThreeJS = (gl: ExpoWebGLRenderingContext) => {
    try {
      // Create renderer
      const renderer = new ExpoTHREE.Renderer({ gl });
      renderer.setSize(screenWidth, screenHeight);
      renderer.setClearColor(0xf0f0f0, 1);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;

      // Create scene
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0xf0f0f0, 1, 1000);
      sceneRef.current = scene;

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        75,
        screenWidth / screenHeight,
        0.1,
        1000
      );
      camera.position.set(0, 10, 15);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // Add lighting
      setupLighting(scene);

      // Add 3D geometry if session exists
      if (session) {
        add3DGeometry(scene);
      }

      // Start render loop
      startRenderLoop();

    } catch (err) {
      setError(`Failed to setup 3D scene: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  /**
   * Setup scene lighting
   */
  const setupLighting = (scene: THREE.Scene) => {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 25);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);

    // Helper light for better visualization
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 0.3);
    scene.add(hemisphereLight);
  };

  /**
   * Add 3D geometry from session data
   */
  const add3DGeometry = (scene: THREE.Scene) => {
    if (!session) return;

    // Create materials
    const materials = createMaterials();

    // Add faces as meshes
    session.faces.forEach((face) => {
      const mesh = createFaceMesh(face, materials);
      if (mesh) {
        mesh.userData = { faceId: face.id, type: 'face' };
        scene.add(mesh);
      }
    });

    // Add wireframe overlay if in mixed mode
    if (viewMode === 'wireframe' || viewMode === 'mixed') {
      addWireframeOverlay(scene);
    }

    // Add ground plane for reference
    addGroundPlane(scene);

    // Add coordinate axes helper
    if (interactive) {
      const axesHelper = new THREE.AxesHelper(5);
      scene.add(axesHelper);
    }
  };

  /**
   * Create materials for different roof surfaces
   */
  const createMaterials = () => {
    return {
      shingle: new THREE.MeshLambertMaterial({ 
        color: 0x8B4513,
        transparent: true,
        opacity: 0.8,
      }),
      tile: new THREE.MeshLambertMaterial({ 
        color: 0xCD853F,
        transparent: true,
        opacity: 0.8,
      }),
      metal: new THREE.MeshLambertMaterial({ 
        color: 0x708090,
        transparent: true,
        opacity: 0.8,
      }),
      flat: new THREE.MeshLambertMaterial({ 
        color: 0x696969,
        transparent: true,
        opacity: 0.8,
      }),
      unknown: new THREE.MeshLambertMaterial({ 
        color: 0x888888,
        transparent: true,
        opacity: 0.8,
      }),
      selected: new THREE.MeshLambertMaterial({ 
        color: 0x00ff00,
        transparent: true,
        opacity: 0.6,
      }),
    };
  };

  /**
   * Create mesh for a 3D face
   */
  const createFaceMesh = (face: Face3DType, materials: any): THREE.Mesh | null => {
    if (!session || face.vertexIds.length < 3) return null;

    try {
      // Get vertices
      const vertices: THREE.Vector3[] = [];
      for (const vertexId of face.vertexIds) {
        const vertex = session.vertices.get(vertexId);
        if (vertex) {
          vertices.push(new THREE.Vector3(vertex.x, vertex.y, vertex.z));
        }
      }

      if (vertices.length < 3) return null;

      // Create geometry using triangulation for complex polygons
      const geometry = new THREE.BufferGeometry();
      
      // Simple triangulation for now (TODO: Implement proper triangulation)
      const positions: number[] = [];
      const normals: number[] = [];
      
      // Fan triangulation from first vertex
      for (let i = 1; i < vertices.length - 1; i++) {
        // Triangle: 0, i, i+1
        positions.push(
          vertices[0].x, vertices[0].y, vertices[0].z,
          vertices[i].x, vertices[i].y, vertices[i].z,
          vertices[i + 1].x, vertices[i + 1].y, vertices[i + 1].z
        );
        
        // Add face normal for each vertex
        for (let j = 0; j < 3; j++) {
          normals.push(face.normal.x, face.normal.y, face.normal.z);
        }
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));

      // Select material based on face type
      let material = materials[face.material.type] || materials.unknown;
      if (selectedFace === face.id) {
        material = materials.selected;
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.receiveShadow = true;
      mesh.castShadow = true;

      return mesh;
    } catch (err) {
      console.warn(`Failed to create mesh for face ${face.id}:`, err);
      return null;
    }
  };

  /**
   * Add wireframe overlay for better visualization
   */
  const addWireframeOverlay = (scene: THREE.Scene) => {
    if (!session) return;

    const wireframeMaterial = new THREE.LineBasicMaterial({ 
      color: 0x333333,
      linewidth: 2,
    });

    session.edges.forEach((edge) => {
      const startVertex = session.vertices.get(edge.startVertexId);
      const endVertex = session.vertices.get(edge.endVertexId);
      
      if (startVertex && endVertex) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(startVertex.x, startVertex.y, startVertex.z),
          new THREE.Vector3(endVertex.x, endVertex.y, endVertex.z),
        ]);
        
        const line = new THREE.Line(geometry, wireframeMaterial);
        line.userData = { edgeId: edge.id, type: 'edge' };
        scene.add(line);
      }
    });
  };

  /**
   * Add ground plane for reference
   */
  const addGroundPlane = (scene: THREE.Scene) => {
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x90EE90,
      transparent: true,
      opacity: 0.3,
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);
  };

  /**
   * Start the render loop
   */
  const startRenderLoop = () => {
    const animate = () => {
      frameId.current = requestAnimationFrame(animate);
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        // Simple rotation for demonstration
        if (sceneRef.current.children.length > 0) {
          sceneRef.current.rotation.y += 0.005;
        }
        
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        rendererRef.current.getContext().flush?.();
      }
    };
    
    animate();
  };

  /**
   * Handle GL context creation
   */
  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    setupThreeJS(gl);
  };

  /**
   * Handle face selection
   */
  const handleFaceSelect = (faceId: string) => {
    setSelectedFace(faceId === selectedFace ? null : faceId);
    onInteraction?.('select', { faceId, sessionId });
  };

  /**
   * Export current 3D session to measurement
   */
  const exportToMeasurement = () => {
    if (!session) return;

    const exportedMeasurement = measurement3DDataService.convertToRoofMeasurement(
      sessionId,
      measurement || {}
    );

    if (exportedMeasurement) {
      onMeasurementUpdate?.(exportedMeasurement);
      Alert.alert('Success', '3D measurement exported successfully');
    } else {
      Alert.alert('Error', 'Failed to export 3D measurement');
    }
  };

  // Memoized statistics
  const statistics = useMemo(() => {
    if (!session) return null;
    
    return {
      vertices: session.metadata.vertexCount,
      edges: session.metadata.edgeCount,
      faces: session.metadata.faceCount,
      totalArea: session.totalArea.toFixed(2),
      complexity: session.metadata.complexityScore.toFixed(0),
    };
  }, [session]);

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>3D Visualization Error</Text>
        <Text style={styles.errorDetail}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializeSession}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing 3D View...</Text>
        <Text style={styles.loadingDetail}>Processing measurement data</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 3D Viewport */}
      <GLView
        style={styles.glView}
        onContextCreate={onContextCreate}
        msaaSamples={4}
      />
      
      {/* Controls Overlay */}
      {interactive && (
        <View style={styles.controlsOverlay}>
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.controlButton}>
              <Text style={styles.controlButtonText}>Reset View</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={exportToMeasurement}
            >
              <Text style={styles.controlButtonText}>Export</Text>
            </TouchableOpacity>
          </View>
          
          {/* Statistics */}
          {statistics && (
            <View style={styles.statsPanel}>
              <Text style={styles.statsTitle}>3D Model Statistics</Text>
              <Text style={styles.statsText}>Vertices: {statistics.vertices}</Text>
              <Text style={styles.statsText}>Faces: {statistics.faces}</Text>
              <Text style={styles.statsText}>Total Area: {statistics.totalArea} m²</Text>
              <Text style={styles.statsText}>Complexity: {statistics.complexity}/100</Text>
            </View>
          )}
        </View>
      )}
      
      {/* Selected Face Info */}
      {selectedFace && session && (
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionTitle}>Selected Surface</Text>
          <Text style={styles.selectionText}>ID: {selectedFace}</Text>
          {(() => {
            const face = session.faces.get(selectedFace);
            return face ? (
              <>
                <Text style={styles.selectionText}>Area: {face.area.toFixed(2)} m²</Text>
                <Text style={styles.selectionText}>Material: {face.material.type}</Text>
                <Text style={styles.selectionText}>Slope: {face.slopeAngle.toFixed(1)}°</Text>
              </>
            ) : null;
          })()}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  glView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 8,
  },
  loadingDetail: {
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#234e70',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  controlButton: {
    backgroundColor: 'rgba(35, 78, 112, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 8,
  },
  statsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  selectionInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 8,
    minWidth: 200,
  },
  selectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 8,
  },
  selectionText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
});

export default Measurement3DView;

// TODO: Implement advanced 3D interaction features:
// TODO: - Touch-based camera controls (pan, zoom, rotate)
// TODO: - Multi-touch gesture support for 3D manipulation
// TODO: - Face selection and editing capabilities
// TODO: - Real-time measurement tools in 3D space
// TODO: - Material and texture editing interface
// TODO: - Animation controls for model presentation
// TODO: - Screenshot and screen recording capabilities
// TODO: - Integration with AR anchoring for overlay mode
// TODO: - Performance optimization for complex models
// TODO: - Accessibility support for 3D interactions