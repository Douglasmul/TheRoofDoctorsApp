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
  GestureResponderEvent,
} from 'react-native';
import Svg, { Line, Polygon } from 'react-native-svg';
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
  isDrawing: boolean;
  onDismiss: () => void;
}

const Instructions: React.FC<InstructionsProps> = ({ pointCount, isEditing, isDrawing, onDismiss }) => {
  const getInstructionText = () => {
    if (isEditing) {
      return 'Edit Mode: Drag points to adjust their position. Tap point markers to select/deselect them. Use control buttons below to add or remove points.';
    }
    
    if (isDrawing) {
      if (pointCount === 0) {
        return 'Drawing Mode: Drag your finger to draw measurement points continuously. Start from any corner and trace the roof outline.';
      } else {
        return `Drawing Mode: Continue tracing the roof outline. ${pointCount} points drawn. Drag to add more points or complete the shape.`;
      }
    }
    
    if (pointCount === 0) {
      return 'Getting Started: Tap anywhere on the roof surface to mark your first corner point. Aim for a clear roof edge or corner for best accuracy.';
    } else if (pointCount === 1) {
      return 'Point 1 marked! Continue tapping to mark the next corner point. Work your way around the roof perimeter in order.';
    } else if (pointCount === 2) {
      return '2 points marked! Add at least 1 more point to form a complete roof section. Keep following the roof edge.';
    } else if (pointCount < 6) {
      return `${pointCount} points selected. You can add more corner points for complex shapes, or tap "Review Points" if the basic shape is complete.`;
    } else {
      return `${pointCount} points selected. Great detail! You can add more points for very complex shapes or proceed to review.`;
    }
  };

  const getInstructionTitle = () => {
    if (isEditing) return 'Edit Points';
    if (isDrawing) return 'Draw Mode';
    if (pointCount === 0) return 'Start Measuring';
    if (pointCount < 3) return 'Mark Corners';
    return 'Shape Complete';
  };

  const getInstructionIcon = () => {
    if (isEditing) return '✏️';
    if (isDrawing) return '🖊️';
    if (pointCount === 0) return '📍';
    if (pointCount < 3) return '🔄';
    return '✅';
  };

  return (
    <View style={styles.instructions}>
      <View style={styles.instructionHeader}>
        <Text style={styles.instructionIcon}>{getInstructionIcon()}</Text>
        <Text style={styles.instructionTitle}>{getInstructionTitle()}</Text>
        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
          <Text style={styles.dismissButtonText}>×</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.instructionText}>{getInstructionText()}</Text>
      {pointCount >= 3 && !isEditing && (
        <View style={styles.instructionTips}>
          <Text style={styles.tipText}>💡 Tip: Add more points at roof edges for better accuracy</Text>
        </View>
      )}
    </View>
  );
};

/**
 * Connection Lines Component - Shows visual lines connecting points
 */
interface ConnectionLinesProps {
  points: SelectedPoint[];
}

const ConnectionLines: React.FC<ConnectionLinesProps> = ({ points }) => {
  if (points.length < 2) return null;

  // Create polygon path points
  const polygonPoints = points.map(point => `${point.screenX},${point.screenY}`).join(' ');
  
  // Create individual line segments
  const lines = [];
  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    lines.push(
      <Line
        key={`line-${i}`}
        x1={current.screenX}
        y1={current.screenY}
        x2={next.screenX}
        y2={next.screenY}
        stroke="rgba(76, 175, 80, 0.8)"
        strokeWidth="2"
        strokeDasharray={points.length >= 3 ? "0" : "5,5"}
      />
    );
  }

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
        {/* Fill polygon if we have 3+ points */}
        {points.length >= 3 && (
          <Polygon
            points={polygonPoints}
            fill="rgba(76, 175, 80, 0.1)"
            stroke="rgba(76, 175, 80, 0.8)"
            strokeWidth="2"
          />
        )}
        {/* Individual lines for incomplete polygons */}
        {points.length < 3 && lines}
      </Svg>
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
  const [zoom, setZoom] = useState(0); // Camera zoom level (0-1)
  const cameraRef = useRef<CameraView>(null);
  
  // Point selection state
  const [selectedPoints, setSelectedPoints] = useState<SelectedPoint[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  // Drawing state
  const [isCurrentlyDrawing, setIsCurrentlyDrawing] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Create pan responder for drawing mode
  const drawingPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return isDrawing && !isEditing && Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: (evt) => {
        if (!isDrawing || isEditing) return;
        setIsCurrentlyDrawing(true);
        const { locationX, locationY } = evt.nativeEvent;
        addPointAtLocation(locationX, locationY);
        Vibration.vibrate(30);
        lastPointRef.current = { x: locationX, y: locationY, time: Date.now() };
      },
      onPanResponderMove: (evt) => {
        if (!isCurrentlyDrawing || !isDrawing || isEditing) return;
        const { locationX, locationY } = evt.nativeEvent;
        const lastPoint = lastPointRef.current;
        
        if (lastPoint) {
          const dx = locationX - lastPoint.x;
          const dy = locationY - lastPoint.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const timeDiff = Date.now() - lastPoint.time;
          
          // Add point if moved enough distance or enough time passed
          if (distance > 20 || timeDiff > 100) {
            addPointAtLocation(locationX, locationY);
            lastPointRef.current = { x: locationX, y: locationY, time: Date.now() };
          }
        }
      },
      onPanResponderRelease: () => {
        setIsCurrentlyDrawing(false);
        lastPointRef.current = null;
        Vibration.vibrate(50);
      },
    })
  ).current;

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
   * Add point at specific screen location with improved coordinate mapping
   */
  const addPointAtLocation = useCallback((locationX: number, locationY: number) => {
    if (!cameraReady) return;

    // Convert screen coordinates to world coordinates with consistent scaling
    // Normalize to range [-1, 1] then scale to meters
    const normalizedX = (locationX - screenWidth / 2) / (screenWidth / 2);
    const normalizedZ = (locationY - screenHeight / 2) / (screenHeight / 2);
    
    // Scale to realistic dimensions - adjust for zoom level
    // Base scale represents realistic measurement area, zoom reduces effective area  
    const baseScale = 8; // 8 meters from center at 0% zoom for better small feature resolution
    const zoomFactor = 1 - (zoom * 0.8); // Zoom reduces the effective area by up to 80%
    const effectiveScale = baseScale * zoomFactor;
    
    const worldX = normalizedX * effectiveScale;
    const worldY = 0; // Assume ground level for manual measurement
    const worldZ = normalizedZ * effectiveScale;

    const newPoint: SelectedPoint = {
      id: `point_${Date.now()}_${Math.random()}`,
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
  }, [cameraReady, zoom]);

  /**
   * Handle camera tap to add new point
   */
  const handleCameraTap = useCallback((event: any) => {
    if (isEditing || !cameraReady || isDrawing) return;

    const { locationX, locationY } = event.nativeEvent;
    addPointAtLocation(locationX, locationY);
    
    // Haptic feedback
    Vibration.vibrate(50);
  }, [isEditing, cameraReady, isDrawing, addPointAtLocation]);

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
        // Update both screen and world coordinates using consistent scaling
        const normalizedX = (screenX - screenWidth / 2) / (screenWidth / 2);
        const normalizedZ = (screenY - screenHeight / 2) / (screenHeight / 2);
        const baseScale = 8;
        const zoomFactor = 1 - (zoom * 0.8);
        const effectiveScale = baseScale * zoomFactor;
        const worldX = normalizedX * effectiveScale;
        const worldZ = normalizedZ * effectiveScale;
        
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
  }, [zoom]);

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
   * Enhanced area calculation with improved scaling for real-world measurements
   */
  const calculatePreviewArea = useCallback(() => {
    if (selectedPoints.length < 3) return 0;

    // Use shoelace formula with proper coordinate selection
    let area = 0;
    for (let i = 0; i < selectedPoints.length; i++) {
      const j = (i + 1) % selectedPoints.length;
      // Use x and z coordinates for 2D projection (since y is ground level)
      area += selectedPoints[i].x * selectedPoints[j].z;
      area -= selectedPoints[j].x * selectedPoints[i].z;
    }
    const calculatedArea = Math.abs(area) / 2;
    
    // Apply realistic scaling factor for roof measurements
    // Assume each unit in screen space represents roughly 1 meter
    const scaleFactor = 1.0; // More realistic scale factor for actual roof measurements
    return calculatedArea * scaleFactor;
  }, [selectedPoints]);

  /**
   * Enhanced perimeter calculation with proper 3D distance
   */
  const calculatePreviewPerimeter = useCallback(() => {
    if (selectedPoints.length < 3) return 0;

    let perimeter = 0;
    for (let i = 0; i < selectedPoints.length; i++) {
      const j = (i + 1) % selectedPoints.length;
      const dx = selectedPoints[j].x - selectedPoints[i].x;
      const dy = selectedPoints[j].y - selectedPoints[i].y;
      const dz = selectedPoints[j].z - selectedPoints[i].z;
      
      // Calculate 3D Euclidean distance
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      perimeter += distance;
    }
    
    // Apply realistic scaling factor for roof measurements
    // Match the area calculation scale factor for consistency
    const scaleFactor = 1.0; // Consistent with area calculation
    return perimeter * scaleFactor;
  }, [selectedPoints]);

  /**
   * Validate polygon shape with real-time feedback
   */
  const validateCurrentShape = useCallback(() => {
    if (selectedPoints.length < 3) {
      return { isValid: false, message: `Need ${3 - selectedPoints.length} more points` };
    }

    // Check for very small area - Threshold adjusted for realistic scaling including small features
    const area = calculatePreviewArea();
    if (area < 0.5) {
      return { isValid: false, message: 'Area too small - spread points further apart' };
    }

    // Check for reasonable aspect ratio
    const bounds = {
      minX: Math.min(...selectedPoints.map(p => p.x)),
      maxX: Math.max(...selectedPoints.map(p => p.x)),
      minY: Math.min(...selectedPoints.map(p => p.y)),
      maxY: Math.max(...selectedPoints.map(p => p.y)),
    };
    
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    
    if (aspectRatio > 15) {
      return { isValid: false, message: 'Very narrow shape - check point placement' };
    }

    return { isValid: true, message: 'Shape looks good!' };
  }, [selectedPoints, calculatePreviewArea]);

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
          zoom={zoom}
          onCameraReady={() => setCameraReady(true)}
          onTouchEnd={handleCameraTap}
        />
        
        {/* Overlay */}
        <View style={styles.overlay} {...(isDrawing ? drawingPanResponder.panHandlers : {})}>
          {/* Instructions */}
          {showInstructions && (
            <Instructions
              pointCount={selectedPoints.length}
              isEditing={isEditing}
              isDrawing={isDrawing}
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
            <ConnectionLines points={selectedPoints} />
          )}

          {/* Crosshair */}
          <View style={styles.crosshair}>
            <View style={styles.crosshairHorizontal} />
            <View style={styles.crosshairVertical} />
          </View>

          {/* Status overlay with enhanced feedback */}
          <View style={styles.statusOverlay}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>Roof Measurement</Text>
              <Text style={styles.statusMode}>
                {isDrawing ? '🖊️ Draw Mode' : isEditing ? '✏️ Edit Mode' : '📍 Tap Mode'}
              </Text>
            </View>
            
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Surface</Text>
                <Text style={styles.statusValue}>{surfaceType}</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Points</Text>
                <Text style={styles.statusValue}>{selectedPoints.length}</Text>
              </View>
            </View>

            {selectedPoints.length >= 3 && (
              <View style={styles.statusGrid}>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Area</Text>
                  <Text style={styles.statusValue}>
                    {calculatePreviewArea().toFixed(2)} m²
                  </Text>
                  <Text style={styles.statusSecondary}>
                    ({(calculatePreviewArea() * 10.764).toFixed(0)} sq ft)
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Perimeter</Text>
                  <Text style={styles.statusValue}>
                    {calculatePreviewPerimeter().toFixed(1)} m
                  </Text>
                </View>
              </View>
            )}

            {(() => {
              if (selectedPoints.length >= 3) {
                const validation = validateCurrentShape();
                return (
                  <Text style={[
                    styles.statusFeedback,
                    validation.isValid ? styles.statusSuccess : styles.statusWarning
                  ]}>
                    {validation.message}
                  </Text>
                );
              } else if (selectedPoints.length > 0) {
                return (
                  <Text style={styles.statusFeedback}>
                    Need {3 - selectedPoints.length} more points to complete shape
                  </Text>
                );
              } else {
                return (
                  <Text style={styles.statusHint}>
                    {isDrawing ? 'Drag to draw measurement points' : 'Tap to place your first point'}
                  </Text>
                );
              }
            })()}

            {isCurrentlyDrawing && (
              <Text style={styles.drawingIndicator}>
                ✏️ Drawing...
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        {/* Top row - mode controls */}
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={[styles.controlButton, isDrawing && styles.controlButtonActive]}
            onPress={() => {
              setIsDrawing(!isDrawing);
              setIsEditing(false);
              setIsCurrentlyDrawing(false);
            }}
          >
            <Text style={styles.controlButtonText}>
              {isDrawing ? 'Stop Drawing' : 'Draw Mode'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, isEditing && styles.controlButtonActive]}
            onPress={() => {
              setIsEditing(!isEditing);
              setIsDrawing(false);
            }}
            disabled={selectedPoints.length === 0}
          >
            <Text style={styles.controlButtonText}>
              {isEditing ? 'Stop Editing' : 'Edit Points'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.clearButton]}
            onPress={clearAllPoints}
            disabled={selectedPoints.length === 0}
          >
            <Text style={styles.controlButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Second row - editing controls */}
        {isEditing && selectedPointIndex !== null && (
          <View style={styles.controlRow}>
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
          </View>
        )}

        {/* Zoom controls */}
        <View style={styles.controlRow}>
          <TouchableOpacity
            style={[styles.controlButton, styles.zoomButton]}
            onPress={() => setZoom(Math.max(0, zoom - 0.1))}
            disabled={zoom <= 0}
          >
            <Text style={styles.controlButtonText}>Zoom Out</Text>
          </TouchableOpacity>
          
          <Text style={styles.zoomIndicator}>
            Zoom: {Math.round(zoom * 100)}%
          </Text>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.zoomButton]}
            onPress={() => setZoom(Math.min(1, zoom + 0.1))}
            disabled={zoom >= 1}
          >
            <Text style={styles.controlButtonText}>Zoom In</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  instructionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  instructionTips: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  tipText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontStyle: 'italic',
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
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusMode: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusItem: {
    flex: 1,
    marginRight: 16,
  },
  statusLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  statusValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusSecondary: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
  },
  statusFeedback: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  drawingIndicator: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
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
  statusSuccess: {
    color: '#4CAF50',
    fontSize: 12,
    marginBottom: 2,
    fontWeight: 'bold',
  },
  statusHint: {
    color: '#2196F3',
    fontSize: 12,
    marginBottom: 2,
    fontStyle: 'italic',
  },
  controlPanel: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 20,
    paddingBottom: 20,
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
  zoomButton: {
    backgroundColor: '#9C27B0',
  },
  zoomIndicator: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    alignSelf: 'center',
    paddingHorizontal: 16,
    minWidth: 80,
    textAlign: 'center',
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