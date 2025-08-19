/**
 * @fileoverview Manual Point Selection Camera for roof measurement
 * Features: Touch-based point selection, clear visual feedback, point editing
 * @version 1.0.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ARPoint, RoofPlane } from '../types/measurement';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Selected point with visual properties
 */
interface SelectedPoint extends ARPoint {
  id: string;
  screenX: number;
  screenY: number;
  isEditing?: boolean;
}

/**
 * Route params for this screen
 */
interface RouteParams {
  sessionId: string;
  surfaceType: RoofPlane['type'];
  existingPoints?: ARPoint[];
}

/**
 * Point Marker Component
 */
interface PointMarkerProps {
  point: SelectedPoint;
  index: number;
  isSelected: boolean;
  onPress: () => void;
  onMove: (x: number, y: number) => void;
  isEditable: boolean;
}

const PointMarker: React.FC<PointMarkerProps> = ({ 
  point, 
  index, 
  isSelected, 
  onPress, 
  onMove, 
  isEditable 
}) => {
  const [pan] = useState(new Animated.ValueXY({ x: point.screenX, y: point.screenY }));
  const [isDragging, setIsDragging] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => isEditable,
      onPanResponderGrant: () => {
        setIsDragging(true);
        Vibration.vibrate(50);
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false);
        const newX = point.screenX + gestureState.dx;
        const newY = point.screenY + gestureState.dy;
        
        // Constrain to screen bounds
        const constrainedX = Math.max(20, Math.min(screenWidth - 20, newX));
        const constrainedY = Math.max(100, Math.min(screenHeight - 200, newY));
        
        onMove(constrainedX, constrainedY);
        
        pan.setOffset({
          x: constrainedX - point.screenX,
          y: constrainedY - point.screenY,
        });
        pan.setValue({ x: 0, y: 0 });
      },
    })
  ).current;

  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
    pan.setOffset({ x: point.screenX, y: point.screenY });
  }, [point.screenX, point.screenY, pan]);

  return (
    <Animated.View
      style={[
        styles.pointMarker,
        {
          transform: pan.getTranslateTransform(),
        },
        isSelected && styles.pointMarkerSelected,
        isDragging && styles.pointMarkerDragging,
      ]}
      {...(isEditable ? panResponder.panHandlers : {})}
    >
      <TouchableOpacity
        style={styles.pointMarkerTouchable}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.pointMarkerText}>{index + 1}</Text>
      </TouchableOpacity>
      
      {/* Confidence indicator */}
      <View style={[styles.confidenceIndicator, { 
        backgroundColor: point.confidence > 0.8 ? '#4CAF50' : 
                        point.confidence > 0.5 ? '#FF9800' : '#F44336' 
      }]} />
    </Animated.View>
  );
};

/**
 * Instructions Component
 */
interface InstructionsProps {
  pointCount: number;
  isEditing: boolean;
  onDismiss: () => void;
}

const Instructions: React.FC<InstructionsProps> = ({ pointCount, isEditing, onDismiss }) => {
  const getInstructionText = () => {
    if (isEditing) {
      return 'Drag points to adjust their position. Tap "Save Points" when finished.';
    }
    
    if (pointCount === 0) {
      return 'Tap on the roof surface to mark corner points. Start with any corner and work around the perimeter.';
    } else if (pointCount < 3) {
      return `${pointCount} point${pointCount > 1 ? 's' : ''} selected. Continue tapping to mark corners (minimum 3 points required).`;
    } else {
      return `${pointCount} points selected. You can add more points or tap "Review Points" to continue.`;
    }
  };

  return (
    <View style={styles.instructions}>
      <Text style={styles.instructionText}>{getInstructionText()}</Text>
      <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
        <Text style={styles.dismissButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * Manual Point Selection Camera Screen
 */
export default function ManualPointSelectionCamera() {
  const navigation = useNavigation();
  const route = useRoute();
  const { sessionId, surfaceType, existingPoints } = route.params as RouteParams;
  
  // Camera and permissions
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  
  // Point selection state
  const [selectedPoints, setSelectedPoints] = useState<SelectedPoint[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  // Initialize with existing points if provided
  useEffect(() => {
    if (existingPoints && existingPoints.length > 0) {
      const pointsWithScreenCoords = existingPoints.map((point, index) => ({
        ...point,
        id: `point_${index}`,
        screenX: screenWidth * 0.2 + (index * 50), // Spread points across screen
        screenY: screenHeight * 0.3 + (index * 30),
      }));
      setSelectedPoints(pointsWithScreenCoords);
    }
  }, [existingPoints]);

  /**
   * Handle camera tap to add new point
   */
  const handleCameraTap = useCallback((event: any) => {
    if (isEditing || !cameraReady) return;

    const { locationX, locationY } = event.nativeEvent;
    
    // Convert screen coordinates to world coordinates (simplified)
    const worldX = (locationX - screenWidth / 2) / 100; // Scale factor
    const worldY = 0; // Assume ground level for manual measurement
    const worldZ = (locationY - screenHeight / 2) / 100;

    const newPoint: SelectedPoint = {
      id: `point_${Date.now()}`,
      x: worldX,
      y: worldY,
      z: worldZ,
      confidence: 1.0, // High confidence for manual selection
      timestamp: new Date(),
      sensorAccuracy: 'high',
      screenX: locationX,
      screenY: locationY,
    };

    setSelectedPoints(prev => [...prev, newPoint]);
    
    // Haptic feedback
    Vibration.vibrate(50);
  }, [isEditing, cameraReady]);

  /**
   * Handle point selection for editing
   */
  const handlePointSelect = useCallback((index: number) => {
    if (isEditing) {
      setSelectedPointIndex(selectedPointIndex === index ? null : index);
    }
  }, [isEditing, selectedPointIndex]);

  /**
   * Handle point movement during editing
   */
  const handlePointMove = useCallback((index: number, screenX: number, screenY: number) => {
    setSelectedPoints(prev => prev.map((point, i) => {
      if (i === index) {
        // Update both screen and world coordinates
        const worldX = (screenX - screenWidth / 2) / 100;
        const worldZ = (screenY - screenHeight / 2) / 100;
        
        return {
          ...point,
          screenX,
          screenY,
          x: worldX,
          z: worldZ,
        };
      }
      return point;
    }));
  }, []);

  /**
   * Remove selected point
   */
  const removeSelectedPoint = useCallback(() => {
    if (selectedPointIndex === null) return;

    Alert.alert(
      'Remove Point',
      'Are you sure you want to remove this point?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setSelectedPoints(prev => prev.filter((_, index) => index !== selectedPointIndex));
            setSelectedPointIndex(null);
          },
        },
      ]
    );
  }, [selectedPointIndex]);

  /**
   * Clear all points
   */
  const clearAllPoints = useCallback(() => {
    Alert.alert(
      'Clear All Points',
      'Are you sure you want to remove all points?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setSelectedPoints([]);
            setSelectedPointIndex(null);
            setIsEditing(false);
          },
        },
      ]
    );
  }, []);

  /**
   * Insert point between two existing points
   */
  const insertPointBetween = useCallback((index: number) => {
    const nextIndex = (index + 1) % selectedPoints.length;
    const currentPoint = selectedPoints[index];
    const nextPoint = selectedPoints[nextIndex];
    
    // Calculate midpoint
    const midX = (currentPoint.x + nextPoint.x) / 2;
    const midY = (currentPoint.y + nextPoint.y) / 2;
    const midZ = (currentPoint.z + nextPoint.z) / 2;
    const midScreenX = (currentPoint.screenX + nextPoint.screenX) / 2;
    const midScreenY = (currentPoint.screenY + nextPoint.screenY) / 2;
    
    const newPoint: SelectedPoint = {
      id: `point_${Date.now()}`,
      x: midX,
      y: midY,
      z: midZ,
      confidence: 1.0,
      timestamp: new Date(),
      sensorAccuracy: 'high',
      screenX: midScreenX,
      screenY: midScreenY,
    };
    
    setSelectedPoints(prev => {
      const newPoints = [...prev];
      newPoints.splice(nextIndex, 0, newPoint);
      return newPoints;
    });
    
    Vibration.vibrate(50);
  }, [selectedPoints]);

  /**
   * Save points and return to manual measurement screen
   */
  const savePoints = useCallback(() => {
    if (selectedPoints.length < 3) {
      Alert.alert('Insufficient Points', 'Please select at least 3 points to define a roof surface.');
      return;
    }

    // Convert selected points to ARPoint format
    const arPoints: ARPoint[] = selectedPoints.map(point => ({
      x: point.x,
      y: point.y,
      z: point.z,
      confidence: point.confidence,
      timestamp: point.timestamp,
      sensorAccuracy: point.sensorAccuracy,
    }));

    // Navigate back to manual measurement screen with the points
    navigation.navigate('ManualMeasurement', {
      pointsSelected: arPoints,
      sessionId,
      surfaceType,
    });
  }, [selectedPoints, sessionId, surfaceType, navigation]);

  /**
   * Calculate approximate area for preview
   */
  const calculatePreviewArea = useCallback(() => {
    if (selectedPoints.length < 3) return 0;

    // Simple polygon area calculation using shoelace formula
    let area = 0;
    for (let i = 0; i < selectedPoints.length; i++) {
      const j = (i + 1) % selectedPoints.length;
      area += selectedPoints[i].x * selectedPoints[j].z;
      area -= selectedPoints[j].x * selectedPoints[i].z;
    }
    return Math.abs(area) / 2;
  }, [selectedPoints]);

  /**
   * Calculate approximate perimeter for preview
   */
  const calculatePreviewPerimeter = useCallback(() => {
    if (selectedPoints.length < 3) return 0;

    let perimeter = 0;
    for (let i = 0; i < selectedPoints.length; i++) {
      const j = (i + 1) % selectedPoints.length;
      const dx = selectedPoints[j].x - selectedPoints[i].x;
      const dy = selectedPoints[j].y - selectedPoints[i].y;
      const dz = selectedPoints[j].z - selectedPoints[i].z;
      perimeter += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    return perimeter;
  }, [selectedPoints]);

  // Permission handling
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
          onTouchEnd={handleCameraTap}
        />
        
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Instructions */}
          {showInstructions && (
            <Instructions
              pointCount={selectedPoints.length}
              isEditing={isEditing}
              onDismiss={() => setShowInstructions(false)}
            />
          )}

          {/* Point markers */}
          {selectedPoints.map((point, index) => (
            <PointMarker
              key={point.id}
              point={point}
              index={index}
              isSelected={selectedPointIndex === index}
              onPress={() => handlePointSelect(index)}
              onMove={(x, y) => handlePointMove(index, x, y)}
              isEditable={isEditing}
            />
          ))}

          {/* Connection lines between points */}
          {selectedPoints.length > 1 && (
            <View style={styles.connectionLines}>
              {/* SVG or Canvas lines would go here for production */}
              {/* For now, we'll skip the visual connections */}
            </View>
          )}

          {/* Crosshair */}
          <View style={styles.crosshair}>
            <View style={styles.crosshairHorizontal} />
            <View style={styles.crosshairVertical} />
          </View>

          {/* Status overlay */}
          <View style={styles.statusOverlay}>
            <Text style={styles.statusText}>Surface: {surfaceType}</Text>
            <Text style={styles.statusText}>Points: {selectedPoints.length}</Text>
            {selectedPoints.length >= 3 && (
              <>
                <Text style={styles.statusText}>
                  Area: {calculatePreviewArea().toFixed(2)} m² ({(calculatePreviewArea() * 10.764).toFixed(0)} sq ft)
                </Text>
                <Text style={styles.statusText}>
                  Perimeter: {calculatePreviewPerimeter().toFixed(1)} m
                </Text>
              </>
            )}
            {selectedPoints.length > 0 && selectedPoints.length < 3 && (
              <Text style={styles.statusWarning}>
                Need {3 - selectedPoints.length} more points
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        {/* Top row - editing controls */}
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={[styles.controlButton, isEditing && styles.controlButtonActive]}
            onPress={() => setIsEditing(!isEditing)}
            disabled={selectedPoints.length === 0}
          >
            <Text style={styles.controlButtonText}>
              {isEditing ? 'Stop Editing' : 'Edit Points'}
            </Text>
          </TouchableOpacity>

          {isEditing && selectedPointIndex !== null && (
            <>
              <TouchableOpacity
                style={[styles.controlButton, styles.insertButton]}
                onPress={() => insertPointBetween(selectedPointIndex)}
              >
                <Text style={styles.controlButtonText}>Insert Point</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.controlButton, styles.removeButton]}
                onPress={removeSelectedPoint}
              >
                <Text style={styles.controlButtonText}>Remove Point</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.controlButton, styles.clearButton]}
            onPress={clearAllPoints}
            disabled={selectedPoints.length === 0}
          >
            <Text style={styles.controlButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom row - main actions */}
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={[styles.controlButton, styles.backButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.controlButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              styles.saveButton,
              selectedPoints.length < 3 && styles.saveButtonDisabled
            ]}
            onPress={savePoints}
            disabled={selectedPoints.length < 3}
          >
            <Text style={styles.controlButtonText}>
              Save Points ({selectedPoints.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  instructions: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
    lineHeight: 18,
  },
  dismissButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  dismissButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pointMarker: {
    position: 'absolute',
    width: 40,
    height: 40,
    marginLeft: -20,
    marginTop: -20,
    zIndex: 100,
  },
  pointMarkerSelected: {
    transform: [{ scale: 1.2 }],
  },
  pointMarkerDragging: {
    transform: [{ scale: 1.3 }],
  },
  pointMarkerTouchable: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    borderWidth: 3,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pointMarkerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  confidenceIndicator: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  connectionLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    marginTop: -10,
    marginLeft: -10,
  },
  crosshairHorizontal: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: -0.5,
  },
  crosshairVertical: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginLeft: -0.5,
  },
  statusOverlay: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 2,
  },
  statusWarning: {
    color: '#FF9800',
    fontSize: 12,
    marginBottom: 2,
    fontWeight: 'bold',
  },
  controlPanel: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 20,
    paddingBottom: 40,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  controlButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  controlButtonActive: {
    backgroundColor: '#FF9800',
  },
  removeButton: {
    backgroundColor: '#F44336',
  },
  insertButton: {
    backgroundColor: '#2196F3',
  },
  clearButton: {
    backgroundColor: '#FF5722',
  },
  backButton: {
    backgroundColor: '#6c757d',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    flex: 2,
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});