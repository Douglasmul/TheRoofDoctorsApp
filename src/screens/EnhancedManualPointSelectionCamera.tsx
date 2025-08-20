/**
 * @fileoverview Enhanced Manual Point Selection Camera for professional roof measurement
 * Features: Multiple measurement modes, calibration, undo/redo, professional camera controls
 * @version 2.0.0
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
  Modal,
} from 'react-native';
import Svg, { Line, Polygon, Circle, Rect, Defs, Pattern } from 'react-native-svg';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ARPoint, RoofPlane } from '../types/measurement';
import { measurementModeService, MeasurementMode, UndoRedoState } from '../services/MeasurementModeService';
import { calibrationService } from '../services/CalibrationService';
import { enhancedCameraService, CameraState } from '../services/EnhancedCameraService';
import { tutorialService } from '../services/TutorialService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Enhanced selected point with professional features
 */
interface EnhancedSelectedPoint extends ARPoint {
  id: string;
  screenX: number;
  screenY: number;
  mode: MeasurementMode;
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
 * Professional Point Marker Component
 */
interface PointMarkerProps {
  point: EnhancedSelectedPoint;
  index: number;
  isSelected: boolean;
  onPress: () => void;
  onMove: (x: number, y: number) => void;
  isEditable: boolean;
  calibrated: boolean;
}

const EnhancedPointMarker: React.FC<PointMarkerProps> = ({ 
  point, 
  index, 
  isSelected, 
  onPress, 
  onMove, 
  isEditable,
  calibrated
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

  const getMarkerColor = () => {
    switch (point.mode) {
      case 'tap_to_point': return '#4CAF50';
      case 'freehand_drawing': return '#2196F3';
      case 'edge_detection': return '#FF9800';
      case 'snap_to_grid': return '#9C27B0';
      default: return '#4CAF50';
    }
  };

  return (
    <Animated.View
      style={[
        styles.pointMarker,
        {
          transform: pan.getTranslateTransform(),
          backgroundColor: getMarkerColor(),
          borderColor: calibrated ? '#4CAF50' : '#FF9800',
          borderWidth: calibrated ? 2 : 1,
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
        <Text style={styles.pointConfidence}>
          {(point.confidence * 100).toFixed(0)}%
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * Enhanced Manual Point Selection Camera Screen
 */
export default function EnhancedManualPointSelectionCamera() {
  const [permission, requestPermission] = useCameraPermissions();
  const navigation = useNavigation();
  const route = useRoute();
  const { sessionId, surfaceType, existingPoints } = route.params as RouteParams;

  // Camera and services state
  const [cameraState, setCameraState] = useState<CameraState | null>(null);
  const [undoRedoState, setUndoRedoState] = useState<UndoRedoState>({
    canUndo: false,
    canRedo: false,
    currentActionIndex: -1,
    totalActions: 0,
  });

  // Enhanced measurement state
  const [currentMode, setCurrentMode] = useState<MeasurementMode>('tap_to_point');
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calibrationQuality, setCalibrationQuality] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(0);
  
  // UI state
  const [selectedPoints, setSelectedPoints] = useState<EnhancedSelectedPoint[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showCameraControls, setShowCameraControls] = useState(false);
  
  // Tutorial and help
  const [helpTip, setHelpTip] = useState<string | null>(null);
  const [showCalibrationPrompt, setShowCalibrationPrompt] = useState(false);

  // Refs
  const cameraRef = useRef<CameraView>(null);
  const lastPointRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Initialize services
  useEffect(() => {
    initializeServices();
  }, []);

  const initializeServices = async () => {
    // Initialize measurement mode service
    measurementModeService.setMode('tap_to_point');
    
    // Check calibration status
    await calibrationService.initialize();
    const calibrationStatus = calibrationService.getCalibrationStatus();
    setIsCalibrated(calibrationStatus.isCalibrated);
    setCalibrationQuality(calibrationStatus.quality);

    // Initialize camera service
    await enhancedCameraService.initialize();
    const unsubscribeCamera = enhancedCameraService.subscribe(setCameraState);
    
    // Set camera ref
    if (cameraRef.current) {
      enhancedCameraService.setCameraRef(cameraRef.current);
    }

    // Show calibration prompt if not calibrated
    if (!calibrationStatus.isCalibrated) {
      setShowCalibrationPrompt(true);
    }

    // Show help tip for first-time users
    const tip = tutorialService.getHelpTip('screen_enter');
    if (tip) {
      setHelpTip(tip.message);
      tutorialService.markHelpTipShown(tip.id);
    }

    // Update undo/redo state
    updateUndoRedoState();

    return () => {
      unsubscribeCamera();
    };
  };

  const updateUndoRedoState = () => {
    setUndoRedoState(measurementModeService.getUndoRedoState());
  };

  // Enhanced point addition with multiple modes
  const addPointAtLocation = useCallback((x: number, y: number) => {
    let confidence = 1.0;
    
    // Adjust confidence based on calibration and mode
    if (!isCalibrated) confidence *= 0.7;
    if (currentMode === 'edge_detection') confidence *= 0.9;
    if (currentMode === 'snap_to_grid') confidence *= 0.95;

    const point = measurementModeService.addPoint(x, y, confidence);
    
    // Convert to enhanced format
    const enhancedPoint: EnhancedSelectedPoint = {
      id: `point_${Date.now()}`,
      x: point.x,
      y: point.y,
      z: 0,
      screenX: point.x,
      screenY: point.y,
      confidence: point.confidence,
      timestamp: point.timestamp,
      sensorAccuracy: 'medium',
      mode: point.mode,
    };

    setSelectedPoints(prev => [...prev, enhancedPoint]);
    updateUndoRedoState();
    
    // Haptic feedback
    Vibration.vibrate(30);

    // Check for tutorial progress
    if (selectedPoints.length === 0) {
      const tip = tutorialService.getHelpTip('button_hover');
      if (tip) {
        setHelpTip(tip.message);
        tutorialService.markHelpTipShown(tip.id);
      }
    }
  }, [selectedPoints, isCalibrated, currentMode]);

  // Handle touch events based on current mode
  const handleCameraTouch = (event: any) => {
    if (isEditing) return;

    const { locationX, locationY } = event.nativeEvent;

    switch (currentMode) {
      case 'tap_to_point':
        addPointAtLocation(locationX, locationY);
        break;
      case 'freehand_drawing':
        if (!isDrawing) {
          setIsDrawing(true);
          measurementModeService.startFreehandDrawing(locationX, locationY);
        }
        addPointAtLocation(locationX, locationY);
        break;
      case 'snap_to_grid':
        // Apply grid snapping
        const gridSettings = measurementModeService.getGridSettings();
        const snapped = measurementModeService.snapToGrid(locationX, locationY);
        if (snapped) {
          addPointAtLocation(snapped.snapped.x, snapped.snapped.y);
        } else {
          addPointAtLocation(locationX, locationY);
        }
        break;
      default:
        addPointAtLocation(locationX, locationY);
    }
  };

  // Mode switching
  const switchMeasurementMode = (mode: MeasurementMode) => {
    measurementModeService.setMode(mode);
    setCurrentMode(mode);
    setIsDrawing(mode === 'freehand_drawing');
    setShowModeSelector(false);
    updateUndoRedoState();

    // Show mode-specific help
    let helpMessage = '';
    switch (mode) {
      case 'tap_to_point':
        helpMessage = 'Tap on roof corners to mark measurement points';
        break;
      case 'freehand_drawing':
        helpMessage = 'Hold and drag to draw the roof outline continuously';
        break;
      case 'edge_detection':
        helpMessage = 'The app will automatically detect roof edges';
        break;
      case 'snap_to_grid':
        helpMessage = 'Points will snap to grid intersections for precision';
        break;
    }
    setHelpTip(helpMessage);
  };

  // Enhanced undo/redo
  const handleUndo = () => {
    if (measurementModeService.undo()) {
      syncPointsFromService();
      updateUndoRedoState();
    }
  };

  const handleRedo = () => {
    if (measurementModeService.redo()) {
      syncPointsFromService();
      updateUndoRedoState();
    }
  };

  const syncPointsFromService = () => {
    const points = measurementModeService.getPoints();
    setSelectedPoints(points.map((p, index) => ({
      id: `point_${index}`,
      x: p.x,
      y: p.y,
      z: 0,
      screenX: p.x,
      screenY: p.y,
      confidence: p.confidence,
      timestamp: p.timestamp,
      sensorAccuracy: 'medium',
      mode: p.mode,
    })));
  };

  // Camera controls
  const toggleFlash = async () => {
    if (cameraState) {
      await enhancedCameraService.toggleFlash();
    }
  };

  const toggleGrid = () => {
    const newShowGrid = !showGrid;
    setShowGrid(newShowGrid);
    measurementModeService.configureGrid({ 
      enabled: newShowGrid,
      showGrid: newShowGrid 
    });
  };

  // Edge detection
  const performEdgeDetection = async () => {
    try {
      setHelpTip('Detecting edges...');
      const edges = await measurementModeService.detectEdges(null, 0.5);
      measurementModeService.autoSelectFromEdges(edges.edges);
      syncPointsFromService();
      updateUndoRedoState();
      setHelpTip('Edges detected! Review and adjust points as needed.');
    } catch (error) {
      Alert.alert('Edge Detection', 'Could not detect edges. Try better lighting or manual selection.');
      setHelpTip('Edge detection failed. Try improving lighting or use manual selection.');
    }
  };

  // Calibration
  const openCalibration = () => {
    navigation.navigate('Calibration');
  };

  // Point editing
  const movePoint = (index: number, newX: number, newY: number) => {
    measurementModeService.movePoint(index, newX, newY);
    
    const updatedPoints = [...selectedPoints];
    updatedPoints[index] = {
      ...updatedPoints[index],
      screenX: newX,
      screenY: newY,
      x: newX,
      y: newY,
    };
    setSelectedPoints(updatedPoints);
    updateUndoRedoState();
  };

  const removePoint = (index: number) => {
    measurementModeService.removePoint(index);
    setSelectedPoints(prev => prev.filter((_, i) => i !== index));
    setSelectedIndex(null);
    updateUndoRedoState();
  };

  // Save points and navigate back
  const savePoints = useCallback(() => {
    if (selectedPoints.length < 3) {
      Alert.alert('Insufficient Points', 'Please select at least 3 points to define a roof surface.');
      return;
    }

    // Apply calibration if available
    let calibratedPoints: ARPoint[];
    if (isCalibrated) {
      try {
        calibratedPoints = calibrationService.calibratePoints(
          selectedPoints.map(p => ({ x: p.x, y: p.y }))
        );
      } catch (error) {
        Alert.alert('Calibration Error', 'Using uncalibrated measurements. Consider recalibrating.');
        calibratedPoints = selectedPoints.map(point => ({
          x: point.x,
          y: point.y,
          z: point.z,
          confidence: point.confidence,
          timestamp: point.timestamp,
          sensorAccuracy: point.sensorAccuracy,
        }));
      }
    } else {
      calibratedPoints = selectedPoints.map(point => ({
        x: point.x,
        y: point.y,
        z: point.z,
        confidence: point.confidence * 0.7, // Reduce confidence for uncalibrated
        timestamp: point.timestamp,
        sensorAccuracy: point.sensorAccuracy,
      }));
    }

    // Navigate back with the points
    navigation.navigate('ManualMeasurement', {
      pointsSelected: calibratedPoints,
      sessionId,
      surfaceType,
    });
  }, [selectedPoints, sessionId, surfaceType, navigation, isCalibrated]);

  // Calculate preview area
  const calculatePreviewArea = useCallback(() => {
    if (selectedPoints.length < 3) return 0;

    const area = measurementModeService.calculateArea();
    
    // Apply calibration if available
    if (isCalibrated) {
      try {
        return calibrationService.pixelAreaToSquareMeters(area);
      } catch (error) {
        return area * 0.0001; // Fallback conversion
      }
    }
    
    return area * 0.0001; // Fallback conversion for uncalibrated
  }, [selectedPoints, isCalibrated]);

  // Render grid overlay
  const renderGridOverlay = () => {
    if (!showGrid) return null;

    const gridSettings = measurementModeService.getGridSettings();
    const lines = [];
    
    // Vertical lines
    for (let x = 0; x < screenWidth; x += gridSettings.spacing) {
      lines.push(
        <Line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={screenHeight}
          stroke={gridSettings.gridColor}
          strokeWidth={1}
          opacity={gridSettings.gridOpacity}
        />
      );
    }
    
    // Horizontal lines
    for (let y = 0; y < screenHeight; y += gridSettings.spacing) {
      lines.push(
        <Line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={screenWidth}
          y2={y}
          stroke={gridSettings.gridColor}
          strokeWidth={1}
          opacity={gridSettings.gridOpacity}
        />
      );
    }

    return (
      <Svg width={screenWidth} height={screenHeight} style={styles.gridOverlay}>
        {lines}
      </Svg>
    );
  };

  // Render measurement lines
  const renderMeasurementLines = () => {
    if (selectedPoints.length < 2) return null;

    const lines = [];
    for (let i = 0; i < selectedPoints.length; i++) {
      const nextIndex = (i + 1) % selectedPoints.length;
      const point1 = selectedPoints[i];
      const point2 = selectedPoints[nextIndex];
      
      lines.push(
        <Line
          key={`line-${i}`}
          x1={point1.screenX}
          y1={point1.screenY}
          x2={point2.screenX}
          y2={point2.screenY}
          stroke="#4CAF50"
          strokeWidth={2}
          strokeDasharray={selectedPoints.length < 3 ? "5,5" : undefined}
        />
      );
    }

    return (
      <Svg width={screenWidth} height={screenHeight} style={styles.linesOverlay}>
        {lines}
      </Svg>
    );
  };

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
        <Text style={styles.statusText}>Camera permission required for measurement</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        onTouchEnd={handleCameraTouch}
        zoom={zoom}
        flash={cameraState?.currentSettings.flashMode || FlashMode.auto}
      />

      {/* Grid Overlay */}
      {renderGridOverlay()}

      {/* Measurement Lines */}
      {renderMeasurementLines()}

      {/* Point Markers */}
      {selectedPoints.map((point, index) => (
        <EnhancedPointMarker
          key={point.id}
          point={point}
          index={index}
          isSelected={selectedIndex === index}
          onPress={() => setSelectedIndex(selectedIndex === index ? null : index)}
          onMove={(x, y) => movePoint(index, x, y)}
          isEditable={isEditing}
          calibrated={isCalibrated}
        />
      ))}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Enhanced Measurement</Text>
          <Text style={styles.headerSubtitle}>
            {currentMode.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Mode
          </Text>
        </View>
        <TouchableOpacity style={styles.calibrationButton} onPress={openCalibration}>
          <Text style={[styles.calibrationButtonText, { color: isCalibrated ? '#4CAF50' : '#FF9800' }]}>
            {isCalibrated ? `✓ ${(calibrationQuality * 100).toFixed(0)}%` : '⚠ Cal'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mode Selector */}
      <TouchableOpacity 
        style={styles.modeButton} 
        onPress={() => setShowModeSelector(true)}
      >
        <Text style={styles.modeButtonText}>
          {currentMode.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Text>
      </TouchableOpacity>

      {/* Camera Controls */}
      <View style={styles.cameraControls}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
          <Text style={styles.controlButtonText}>
            {cameraState?.currentSettings.flashMode === FlashMode.on ? '⚡' : 
             cameraState?.currentSettings.flashMode === FlashMode.auto ? '⚡A' : '⚡Off'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={toggleGrid}>
          <Text style={styles.controlButtonText}>{showGrid ? '⊞' : '⊡'}</Text>
        </TouchableOpacity>
        
        {currentMode === 'edge_detection' && (
          <TouchableOpacity style={styles.controlButton} onPress={performEdgeDetection}>
            <Text style={styles.controlButtonText}>🔍</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Undo/Redo */}
        <View style={styles.undoRedoContainer}>
          <TouchableOpacity 
            style={[styles.undoButton, !undoRedoState.canUndo && styles.disabledButton]} 
            onPress={handleUndo}
            disabled={!undoRedoState.canUndo}
          >
            <Text style={styles.undoButtonText}>↶</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.redoButton, !undoRedoState.canRedo && styles.disabledButton]} 
            onPress={handleRedo}
            disabled={!undoRedoState.canRedo}
          >
            <Text style={styles.redoButtonText}>↷</Text>
          </TouchableOpacity>
        </View>

        {/* Info Display */}
        <View style={styles.infoContainer}>
          <Text style={styles.pointCount}>{selectedPoints.length} points</Text>
          {selectedPoints.length >= 3 && (
            <Text style={styles.areaText}>
              Area: {calculatePreviewArea().toFixed(2)} m²
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={() => setIsEditing(!isEditing)}
          >
            <Text style={styles.editButtonText}>
              {isEditing ? 'Done' : 'Edit'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.saveButton, selectedPoints.length < 3 && styles.disabledButton]} 
            onPress={savePoints}
            disabled={selectedPoints.length < 3}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Help Tip */}
      {helpTip && (
        <View style={styles.helpTip}>
          <Text style={styles.helpTipText}>{helpTip}</Text>
          <TouchableOpacity onPress={() => setHelpTip(null)}>
            <Text style={styles.helpTipClose}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Mode Selector Modal */}
      <Modal
        visible={showModeSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModeSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modeSelector}>
            <Text style={styles.modeSelectorTitle}>Select Measurement Mode</Text>
            
            {[
              { mode: 'tap_to_point' as MeasurementMode, name: 'Tap to Point', desc: 'Tap corners precisely' },
              { mode: 'freehand_drawing' as MeasurementMode, name: 'Freehand Drawing', desc: 'Draw outline continuously' },
              { mode: 'edge_detection' as MeasurementMode, name: 'Edge Detection', desc: 'Automatic edge finding' },
              { mode: 'snap_to_grid' as MeasurementMode, name: 'Snap to Grid', desc: 'Grid-aligned precision' },
            ].map(({ mode, name, desc }) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeOption,
                  currentMode === mode && styles.modeOptionSelected
                ]}
                onPress={() => switchMeasurementMode(mode)}
              >
                <Text style={styles.modeOptionName}>{name}</Text>
                <Text style={styles.modeOptionDesc}>{desc}</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setShowModeSelector(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Calibration Prompt */}
      <Modal
        visible={showCalibrationPrompt}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalibrationPrompt(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calibrationPrompt}>
            <Text style={styles.calibrationPromptTitle}>Improve Accuracy</Text>
            <Text style={styles.calibrationPromptText}>
              For the most accurate measurements, calibrate using a reference object like a business card or coin.
            </Text>
            <View style={styles.calibrationPromptButtons}>
              <TouchableOpacity 
                style={styles.calibrateButton} 
                onPress={() => {
                  setShowCalibrationPrompt(false);
                  openCalibration();
                }}
              >
                <Text style={styles.calibrateButtonText}>Calibrate Now</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.skipButton} 
                onPress={() => setShowCalibrationPrompt(false)}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  },
  linesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#ccc',
    fontSize: 12,
  },
  calibrationButton: {
    padding: 5,
  },
  calibrationButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modeButton: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  modeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  cameraControls: {
    position: 'absolute',
    top: 150,
    right: 20,
    flexDirection: 'column',
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 18,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  undoRedoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  undoButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  redoButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  undoButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  redoButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.3,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  pointCount: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  areaText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    backgroundColor: 'rgba(255,152,0,0.9)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flex: 0.45,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: 'rgba(76,175,80,0.9)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flex: 0.45,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pointMarker: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  pointMarkerTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointMarkerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pointConfidence: {
    color: 'white',
    fontSize: 8,
  },
  pointMarkerSelected: {
    transform: [{ scale: 1.2 }],
  },
  pointMarkerDragging: {
    transform: [{ scale: 1.3 }],
    opacity: 0.8,
  },
  helpTip: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(33,150,243,0.9)',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpTipText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
  helpTipClose: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    paddingLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeSelector: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modeSelectorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modeOption: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
  },
  modeOptionSelected: {
    backgroundColor: 'rgba(76,175,80,0.2)',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  modeOptionName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modeOptionDesc: {
    fontSize: 14,
    color: '#666',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  calibrationPrompt: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  calibrationPromptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  calibrationPromptText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  calibrationPromptButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calibrateButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flex: 0.6,
  },
  calibrateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  skipButton: {
    backgroundColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flex: 0.35,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignSelf: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});