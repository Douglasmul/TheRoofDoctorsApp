/**
 * @fileoverview 3D Roof Visualization Screen
 * Provides UI for viewing and interacting with 3D roof models
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Roof3DViewer from '../components/Roof3DViewer';
import { Geometry3DService } from '../services/Geometry3DService';
import { RoofGeometry3D, RoofModel3D, Viewer3DConfig } from '../types/geometry3d';
import { RoofPlane } from '../types/measurement';

interface Roof3DVisualizationScreenProps {
  navigation: any;
  route?: {
    params?: {
      roofPlanes?: RoofPlane[];
      model?: RoofModel3D;
      geometry?: RoofGeometry3D;
    };
  };
}

/**
 * 3D Roof Visualization Screen Component
 */
export default function Roof3DVisualizationScreen({
  navigation,
  route,
}: Roof3DVisualizationScreenProps) {
  const [model, setModel] = useState<RoofModel3D | null>(null);
  const [geometry, setGeometry] = useState<RoofGeometry3D | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewerConfig, setViewerConfig] = useState<Partial<Viewer3DConfig>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [enableShadows, setEnableShadows] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);

  const geometryService = new Geometry3DService();

  /**
   * Initialize screen with data from route params or demo data
   */
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);

      try {
        // Check if we have route parameters
        const { roofPlanes, model: routeModel, geometry: routeGeometry } = route?.params || {};

        if (routeModel) {
          setModel(routeModel);
        } else if (routeGeometry) {
          setGeometry(routeGeometry);
        } else if (roofPlanes && roofPlanes.length > 0) {
          // Convert roof planes to 3D model
          const convertedModel = geometryService.convertPlanesToModel(roofPlanes, {
            name: 'Measured Roof Model',
            autoMaterials: true,
          });
          setModel(convertedModel);
        } else {
          // Load demo geometry
          const demoGeometry = geometryService.generateSampleGeometry();
          setGeometry(demoGeometry);
        }
      } catch (error) {
        console.error('Error initializing 3D data:', error);
        Alert.alert(
          'Error',
          'Failed to load 3D data. Loading demo geometry instead.',
          [
            {
              text: 'OK',
              onPress: () => {
                const demoGeometry = geometryService.generateSampleGeometry();
                setGeometry(demoGeometry);
              },
            },
          ]
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [route?.params]);

  /**
   * Update viewer configuration based on settings
   */
  useEffect(() => {
    setViewerConfig({
      grid: {
        enabled: showGrid,
        size: 20,
        divisions: 20,
        color: '#888888',
      },
      axes: {
        enabled: showAxes,
        size: 5,
      },
      renderer: {
        backgroundColor: '#87CEEB',
        shadows: enableShadows,
        antialias: true,
        toneMapping: 'aces',
      },
    });
  }, [showGrid, showAxes, enableShadows]);

  /**
   * Handle model loaded event
   */
  const handleModelLoaded = useCallback((loadedModel: RoofModel3D) => {
    console.log('3D Model loaded:', loadedModel.name);
    // Could trigger analytics or other events here
  }, []);

  /**
   * Handle geometry selection
   */
  const handleGeometrySelected = useCallback((selectedGeometry: RoofGeometry3D | null) => {
    if (selectedGeometry) {
      Alert.alert(
        'Geometry Selected',
        `Selected: ${selectedGeometry.name}\nArea: ${selectedGeometry.metadata.totalArea.toFixed(
          2
        )} m²`,
        [{ text: 'OK' }]
      );
    }
  }, []);

  /**
   * Handle viewer errors
   */
  const handleViewerError = useCallback((error: Error) => {
    console.error('3D Viewer Error:', error);
    Alert.alert('3D Viewer Error', error.message, [{ text: 'OK' }]);
  }, []);

  /**
   * Export current model
   */
  const handleExport = useCallback(async () => {
    if (!model && !geometry) {
      Alert.alert('No Data', 'No 3D data available to export.', [{ text: 'OK' }]);
      return;
    }

    Alert.alert(
      'Export 3D Model',
      'Choose export format:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'JSON',
          onPress: async () => {
            try {
              const data = model
                ? await geometryService.exportModel(model, 'json')
                : await geometryService.exportGeometry(geometry!, 'json');
              
              // In a real app, you'd save this to a file or share it
              console.log('Exported JSON:', data);
              Alert.alert('Export Complete', 'Model exported as JSON format.', [{ text: 'OK' }]);
            } catch (error) {
              Alert.alert('Export Error', 'Failed to export model.', [{ text: 'OK' }]);
            }
          },
        },
        {
          text: 'OBJ',
          onPress: async () => {
            try {
              const data = model
                ? await geometryService.exportModel(model, 'obj')
                : await geometryService.exportGeometry(geometry!, 'obj');
              
              console.log('Exported OBJ:', data);
              Alert.alert('Export Complete', 'Model exported as OBJ format.', [{ text: 'OK' }]);
            } catch (error) {
              Alert.alert('Export Error', 'Failed to export model.', [{ text: 'OK' }]);
            }
          },
        },
      ]
    );
  }, [model, geometry, geometryService]);

  /**
   * Load demo geometry
   */
  const handleLoadDemo = useCallback(() => {
    const demoGeometry = geometryService.generateSampleGeometry();
    setGeometry(demoGeometry);
    setModel(null);
  }, [geometryService]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading 3D Model...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>3D Roof Visualization</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* 3D Viewer */}
      <View style={styles.viewerContainer}>
        <Roof3DViewer
          model={model || undefined}
          geometry={geometry || undefined}
          config={viewerConfig}
          controlsEnabled={autoRotate}
          events={{
            onModelLoaded: handleModelLoaded,
            onGeometrySelected: handleGeometrySelected,
            onError: handleViewerError,
          }}
          style={styles.viewer}
        />
      </View>

      {/* Info Panel */}
      <View style={styles.infoPanel}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.infoContent}>
            {model && (
              <>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Model</Text>
                  <Text style={styles.infoValue}>{model.name}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Geometries</Text>
                  <Text style={styles.infoValue}>{model.geometries.length}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Vertices</Text>
                  <Text style={styles.infoValue}>{model.metadata.totalVertices}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Faces</Text>
                  <Text style={styles.infoValue}>{model.metadata.totalFaces}</Text>
                </View>
              </>
            )}
            {geometry && !model && (
              <>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Geometry</Text>
                  <Text style={styles.infoValue}>{geometry.name}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Area</Text>
                  <Text style={styles.infoValue}>{geometry.metadata.totalArea.toFixed(1)} m²</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Vertices</Text>
                  <Text style={styles.infoValue}>{geometry.vertices.length}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Faces</Text>
                  <Text style={styles.infoValue}>{geometry.faces.length}</Text>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionPanel}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLoadDemo}>
          <Text style={styles.actionButtonText}>Load Demo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleExport}>
          <Text style={styles.actionButtonText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettings(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>3D Viewer Settings</Text>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Text style={styles.modalCloseButton}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Show Grid</Text>
              <Switch value={showGrid} onValueChange={setShowGrid} />
            </View>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Show Axes</Text>
              <Switch value={showAxes} onValueChange={setShowAxes} />
            </View>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Enable Shadows</Text>
              <Switch value={enableShadows} onValueChange={setEnableShadows} />
            </View>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Auto Rotate</Text>
              <Switch value={autoRotate} onValueChange={setAutoRotate} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  settingsButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  settingsButtonText: {
    fontSize: 18,
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewer: {
    flex: 1,
  },
  infoPanel: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 12,
  },
  infoContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  infoItem: {
    marginRight: 24,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionPanel: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
});