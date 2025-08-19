/**
 * @fileoverview Manual Measurement Screen for roof measurement
 * Features: Manual point selection, roof section type selection, clear UI feedback
 * @version 1.0.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RoofMeasurementEngine } from '../services/RoofMeasurementEngine';
import { RoofPlane, ARPoint } from '../types/measurement';

/**
 * Manual measurement session state
 */
interface ManualMeasurementSession {
  id: string;
  startTime: Date;
  currentSurface: Partial<RoofPlane> | null;
  completedSurfaces: RoofPlane[];
  selectedPoints: ARPoint[];
  mode: 'selecting_type' | 'selecting_points' | 'reviewing_surface' | 'complete';
}

/**
 * Roof surface type options
 */
const SURFACE_TYPES: Array<{ type: RoofPlane['type']; label: string; description: string; color: string }> = [
  { type: 'primary', label: 'Main Roof', description: 'Primary roof surface', color: '#4CAF50' },
  { type: 'secondary', label: 'Secondary Roof', description: 'Secondary roof section', color: '#2196F3' },
  { type: 'dormer', label: 'Dormer', description: 'Dormer window roof', color: '#FF9800' },
  { type: 'hip', label: 'Hip', description: 'Hip roof section', color: '#E91E63' },
  { type: 'chimney', label: 'Chimney', description: 'Around chimney area', color: '#9C27B0' },
  { type: 'other', label: 'Other', description: 'Other roof feature', color: '#607D8B' },
];

/**
 * Material type options
 */
const MATERIAL_TYPES: Array<{ type: RoofPlane['material']; label: string }> = [
  { type: 'shingle', label: 'Asphalt Shingles' },
  { type: 'tile', label: 'Tile' },
  { type: 'metal', label: 'Metal' },
  { type: 'flat', label: 'Flat/Membrane' },
  { type: 'unknown', label: 'Unknown/Other' },
];

/**
 * Surface Type Selector Component
 */
interface SurfaceTypeSelectorProps {
  onSelect: (type: RoofPlane['type']) => void;
  onCancel: () => void;
}

const SurfaceTypeSelector: React.FC<SurfaceTypeSelectorProps> = ({ onSelect, onCancel }) => {
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Roof Surface Type</Text>
        <Text style={styles.modalDescription}>
          Choose the type of roof surface you want to measure:
        </Text>
        
        <ScrollView style={styles.surfaceTypeList}>
          {SURFACE_TYPES.map((surface) => (
            <TouchableOpacity
              key={surface.type}
              style={[styles.surfaceTypeItem, { borderLeftColor: surface.color }]}
              onPress={() => onSelect(surface.type)}
            >
              <View style={[styles.surfaceTypeColor, { backgroundColor: surface.color }]} />
              <View style={styles.surfaceTypeText}>
                <Text style={styles.surfaceTypeLabel}>{surface.label}</Text>
                <Text style={styles.surfaceTypeDescription}>{surface.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Surface Review Component
 */
interface SurfaceReviewProps {
  surface: Partial<RoofPlane>;
  onSave: () => void;
  onEdit: () => void;
  onCancel: () => void;
}

const SurfaceReview: React.FC<SurfaceReviewProps> = ({ surface, onSave, onEdit, onCancel }) => {
  const surfaceInfo = SURFACE_TYPES.find(s => s.type === surface.type);
  
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Review Surface</Text>
        
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Type:</Text>
          <View style={styles.reviewTypeContainer}>
            <View style={[styles.reviewTypeColor, { backgroundColor: surfaceInfo?.color || '#607D8B' }]} />
            <Text style={styles.reviewValue}>{surfaceInfo?.label || 'Unknown'}</Text>
          </View>
        </View>
        
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Material:</Text>
          <Text style={styles.reviewValue}>
            {MATERIAL_TYPES.find(m => m.type === surface.material)?.label || 'Not specified'}
          </Text>
        </View>
        
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Points Selected:</Text>
          <Text style={styles.reviewValue}>{surface.boundaries?.length || 0}</Text>
        </View>
        
        {surface.area && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>Estimated Area:</Text>
            <Text style={styles.reviewValue}>{surface.area.toFixed(2)} m²</Text>
          </View>
        )}
        
        <View style={styles.modalButtonRow}>
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <Text style={styles.editButtonText}>Edit Points</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={onSave}>
            <Text style={styles.saveButtonText}>Save Surface</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Manual Measurement Screen
 */
export default function ManualMeasurementScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const measurementEngine = useRef(new RoofMeasurementEngine());
  
  const [session, setSession] = useState<ManualMeasurementSession>({
    id: `manual_${Date.now()}`,
    startTime: new Date(),
    currentSurface: null,
    completedSurfaces: [],
    selectedPoints: [],
    mode: 'selecting_type',
  });

  // Handle points returned from point selection camera
  useEffect(() => {
    if (route.params?.pointsSelected) {
      const points = route.params.pointsSelected as ARPoint[];
      const surfaceType = route.params.surfaceType as RoofPlane['type'];
      
      handlePointsSelected(points);
    }
  }, [route.params]);

  /**
   * Start measuring a new surface
   */
  const startNewSurface = useCallback(() => {
    setSession(prev => ({
      ...prev,
      mode: 'selecting_type',
      currentSurface: null,
      selectedPoints: [],
    }));
  }, []);

  /**
   * Handle surface type selection
   */
  const handleSurfaceTypeSelect = useCallback((type: RoofPlane['type']) => {
    setSession(prev => ({
      ...prev,
      mode: 'selecting_points',
      currentSurface: {
        id: `surface_${Date.now()}`,
        type,
        material: 'unknown',
        boundaries: [],
        normal: { x: 0, y: 1, z: 0 }, // Default normal vector
        pitchAngle: 0,
        azimuthAngle: 0,
        area: 0,
        projectedArea: 0,
        confidence: 1.0, // High confidence for manual measurements
      },
    }));
    
    // Navigate to point selection camera
    navigation.navigate('ManualPointSelection', {
      sessionId: session.id,
      surfaceType: type,
    });
  }, [session.id, navigation]);

  /**
   * Handle points selected from camera
   */
  const handlePointsSelected = useCallback((points: ARPoint[]) => {
    if (!session.currentSurface) return;

    // Calculate area from points (simple polygon area calculation)
    const calculatePolygonArea = (vertices: ARPoint[]) => {
      if (vertices.length < 3) return 0;
      
      let area = 0;
      for (let i = 0; i < vertices.length; i++) {
        const j = (i + 1) % vertices.length;
        area += vertices[i].x * vertices[j].y;
        area -= vertices[j].x * vertices[i].y;
      }
      return Math.abs(area) / 2;
    };

    const area = calculatePolygonArea(points);
    
    setSession(prev => ({
      ...prev,
      mode: 'reviewing_surface',
      selectedPoints: points,
      currentSurface: prev.currentSurface ? {
        ...prev.currentSurface,
        boundaries: points,
        area,
        projectedArea: area, // For manual measurements, assume no pitch correction needed initially
      } : null,
    }));
  }, [session.currentSurface]);

  /**
   * Save current surface
   */
  const saveCurrentSurface = useCallback(() => {
    if (!session.currentSurface || !session.currentSurface.boundaries?.length) {
      Alert.alert('Error', 'No surface data to save');
      return;
    }

    const completeSurface: RoofPlane = {
      ...session.currentSurface,
      boundaries: session.currentSurface.boundaries,
    } as RoofPlane;

    setSession(prev => ({
      ...prev,
      completedSurfaces: [...prev.completedSurfaces, completeSurface],
      currentSurface: null,
      selectedPoints: [],
      mode: 'selecting_type',
    }));

    Alert.alert('Success', 'Surface saved successfully!');
  }, [session.currentSurface]);

  /**
   * Complete measurement session
   */
  const completeMeasurement = useCallback(async () => {
    if (session.completedSurfaces.length === 0) {
      Alert.alert('No Measurements', 'Please measure at least one roof surface before completing.');
      return;
    }

    try {
      // Calculate final measurement using the measurement engine
      const measurement = await measurementEngine.current.calculateRoofMeasurement(
        session.completedSurfaces,
        session.id,
        'current_user' // TODO: Get from auth context
      );

      // Navigate to review screen
      navigation.navigate('MeasurementReview', { measurement, isManual: true });
    } catch (error) {
      console.error('Error completing measurement:', error);
      Alert.alert('Error', 'Failed to complete measurement calculation.');
    }
  }, [session.completedSurfaces, session.id, navigation]);

  /**
   * Reset measurement session
   */
  const resetMeasurement = useCallback(() => {
    Alert.alert(
      'Reset Measurement',
      'Are you sure you want to start over? All measurements will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setSession({
              id: `manual_${Date.now()}`,
              startTime: new Date(),
              currentSurface: null,
              completedSurfaces: [],
              selectedPoints: [],
              mode: 'selecting_type',
            });
          },
        },
      ]
    );
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manual Roof Measurement</Text>
        <Text style={styles.headerSubtitle}>
          Touch to select points and measure roof surfaces manually
        </Text>
      </View>

      {/* Progress Summary */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Measurement Progress</Text>
        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatNumber}>{session.completedSurfaces.length}</Text>
            <Text style={styles.progressStatLabel}>Surfaces Measured</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatNumber}>
              {session.completedSurfaces.reduce((sum, surface) => sum + surface.area, 0).toFixed(1)}
            </Text>
            <Text style={styles.progressStatLabel}>Total Area (m²)</Text>
          </View>
        </View>
      </View>

      {/* Completed Surfaces List */}
      <ScrollView style={styles.surfacesList}>
        <Text style={styles.surfacesListTitle}>Measured Surfaces</Text>
        {session.completedSurfaces.length === 0 ? (
          <View style={styles.emptySurfaces}>
            <Text style={styles.emptySurfacesText}>No surfaces measured yet</Text>
            <Text style={styles.emptySurfacesSubtext}>Tap "Measure New Surface" to begin</Text>
          </View>
        ) : (
          session.completedSurfaces.map((surface, index) => {
            const surfaceInfo = SURFACE_TYPES.find(s => s.type === surface.type);
            return (
              <View key={surface.id} style={styles.surfaceItem}>
                <View style={[styles.surfaceItemColor, { backgroundColor: surfaceInfo?.color || '#607D8B' }]} />
                <View style={styles.surfaceItemContent}>
                  <Text style={styles.surfaceItemTitle}>
                    {surfaceInfo?.label || 'Unknown'} #{index + 1}
                  </Text>
                  <Text style={styles.surfaceItemDetails}>
                    Area: {surface.area.toFixed(2)} m² • Points: {surface.boundaries.length}
                  </Text>
                  {surface.material && surface.material !== 'unknown' && (
                    <Text style={styles.surfaceItemMaterial}>
                      Material: {MATERIAL_TYPES.find(m => m.type === surface.material)?.label}
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.measureButton}
          onPress={startNewSurface}
        >
          <Text style={styles.measureButtonText}>Measure New Surface</Text>
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetMeasurement}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.completeButton,
              session.completedSurfaces.length === 0 && styles.completeButtonDisabled
            ]}
            onPress={completeMeasurement}
            disabled={session.completedSurfaces.length === 0}
          >
            <Text style={styles.completeButtonText}>Complete Measurement</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals */}
      {session.mode === 'selecting_type' && session.currentSurface === null && (
        <SurfaceTypeSelector
          onSelect={handleSurfaceTypeSelect}
          onCancel={() => setSession(prev => ({ ...prev, mode: 'complete' }))}
        />
      )}

      {session.mode === 'reviewing_surface' && session.currentSurface && (
        <SurfaceReview
          surface={session.currentSurface}
          onSave={saveCurrentSurface}
          onEdit={() => {
            // Go back to point selection
            navigation.navigate('ManualPointSelection', {
              sessionId: session.id,
              surfaceType: session.currentSurface?.type,
              existingPoints: session.selectedPoints,
            });
          }}
          onCancel={() => setSession(prev => ({ ...prev, mode: 'complete' }))}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fc',
  },
  header: {
    backgroundColor: '#234e70',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  progressCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 12,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  surfacesList: {
    flex: 1,
    padding: 16,
  },
  surfacesListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 12,
  },
  emptySurfaces: {
    alignItems: 'center',
    padding: 40,
  },
  emptySurfacesText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  emptySurfacesSubtext: {
    fontSize: 14,
    color: '#999',
  },
  surfaceItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  surfaceItemColor: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  surfaceItemContent: {
    flex: 1,
  },
  surfaceItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 2,
  },
  surfaceItemDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  surfaceItemMaterial: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  measureButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  measureButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resetButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  completeButton: {
    backgroundColor: '#234e70',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 2,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
    minWidth: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  surfaceTypeList: {
    maxHeight: 300,
  },
  surfaceTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  surfaceTypeColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  surfaceTypeText: {
    flex: 1,
  },
  surfaceTypeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 2,
  },
  surfaceTypeDescription: {
    fontSize: 12,
    color: '#666',
  },
  reviewSection: {
    marginBottom: 12,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 14,
    color: '#666',
  },
  reviewTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewTypeColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  modalButtonRow: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});