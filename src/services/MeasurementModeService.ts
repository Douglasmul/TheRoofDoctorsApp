/**
 * @fileoverview Enhanced Measurement Modes Service
 * Provides multiple measurement techniques: tap-to-point, freehand, edge detection
 * @version 1.0.0
 */

import { ARPoint } from '../types/measurement';

export type MeasurementMode = 'tap_to_point' | 'freehand_drawing' | 'edge_detection' | 'snap_to_grid';

export interface MeasurementPoint {
  x: number;
  y: number;
  confidence: number;
  mode: MeasurementMode;
  timestamp: Date;
  snapPoint?: { x: number; y: number }; // Original point before snapping
}

export interface EdgeDetectionResult {
  edges: Array<{ x: number; y: number }>;
  confidence: number;
  method: 'canny' | 'sobel' | 'harris' | 'corner_detection';
}

export interface GridSettings {
  enabled: boolean;
  spacing: number; // in pixels
  snapThreshold: number; // pixel distance for snapping
  showGrid: boolean;
  gridColor: string;
  gridOpacity: number;
}

export interface UndoRedoState {
  canUndo: boolean;
  canRedo: boolean;
  currentActionIndex: number;
  totalActions: number;
}

export interface MeasurementAction {
  type: 'add_point' | 'remove_point' | 'move_point' | 'clear_all' | 'change_mode';
  timestamp: Date;
  data: any;
  previousState?: MeasurementPoint[];
}

export class MeasurementModeService {
  private currentMode: MeasurementMode = 'tap_to_point';
  private points: MeasurementPoint[] = [];
  private gridSettings: GridSettings = {
    enabled: false,
    spacing: 20,
    snapThreshold: 10,
    showGrid: false,
    gridColor: '#00ff00',
    gridOpacity: 0.3,
  };
  
  // Undo/Redo functionality
  private actionHistory: MeasurementAction[] = [];
  private currentActionIndex: number = -1;
  private maxHistorySize: number = 50;
  
  // Freehand drawing state
  private isDrawing: boolean = false;
  private lastDrawPoint: { x: number; y: number } | null = null;
  private drawingThreshold: number = 15; // minimum distance between points

  /**
   * Set the current measurement mode
   */
  setMode(mode: MeasurementMode): void {
    if (mode !== this.currentMode) {
      this.addToHistory({
        type: 'change_mode',
        timestamp: new Date(),
        data: { from: this.currentMode, to: mode },
        previousState: [...this.points],
      });
      this.currentMode = mode;
    }
  }

  /**
   * Get current measurement mode
   */
  getMode(): MeasurementMode {
    return this.currentMode;
  }

  /**
   * Add a point using the current measurement mode
   */
  addPoint(x: number, y: number, confidence: number = 1.0): MeasurementPoint {
    let finalPoint = { x, y };
    
    // Apply grid snapping if enabled
    if (this.gridSettings.enabled && this.currentMode !== 'freehand_drawing') {
      const snapped = this.snapToGrid(x, y);
      if (snapped) {
        finalPoint = snapped.snapped;
      }
    }

    const point: MeasurementPoint = {
      x: finalPoint.x,
      y: finalPoint.y,
      confidence,
      mode: this.currentMode,
      timestamp: new Date(),
      snapPoint: finalPoint !== { x, y } ? { x, y } : undefined,
    };

    // Mode-specific logic
    switch (this.currentMode) {
      case 'freehand_drawing':
        if (this.shouldAddFreehandPoint(x, y)) {
          this.points.push(point);
          this.lastDrawPoint = { x, y };
        }
        break;
      
      case 'tap_to_point':
      case 'edge_detection':
      case 'snap_to_grid':
        this.points.push(point);
        break;
    }

    this.addToHistory({
      type: 'add_point',
      timestamp: new Date(),
      data: point,
      previousState: [...this.points.slice(0, -1)],
    });

    return point;
  }

  /**
   * Start freehand drawing session
   */
  startFreehandDrawing(x: number, y: number): void {
    if (this.currentMode === 'freehand_drawing') {
      this.isDrawing = true;
      this.lastDrawPoint = { x, y };
      this.addPoint(x, y);
    }
  }

  /**
   * Continue freehand drawing
   */
  continueFreehandDrawing(x: number, y: number): MeasurementPoint | null {
    if (this.currentMode === 'freehand_drawing' && this.isDrawing) {
      return this.addPoint(x, y);
    }
    return null;
  }

  /**
   * End freehand drawing session
   */
  endFreehandDrawing(): void {
    this.isDrawing = false;
    this.lastDrawPoint = null;
  }

  /**
   * Remove a point by index
   */
  removePoint(index: number): boolean {
    if (index >= 0 && index < this.points.length) {
      const removedPoint = this.points[index];
      this.addToHistory({
        type: 'remove_point',
        timestamp: new Date(),
        data: { index, point: removedPoint },
        previousState: [...this.points],
      });
      this.points.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Move a point to new coordinates
   */
  movePoint(index: number, newX: number, newY: number): boolean {
    if (index >= 0 && index < this.points.length) {
      const oldPoint = { ...this.points[index] };
      
      // Apply grid snapping if enabled
      let finalPoint = { x: newX, y: newY };
      if (this.gridSettings.enabled) {
        const snapped = this.snapToGrid(newX, newY);
        if (snapped) {
          finalPoint = snapped.snapped;
        }
      }

      this.addToHistory({
        type: 'move_point',
        timestamp: new Date(),
        data: { index, oldPoint, newPoint: finalPoint },
        previousState: [...this.points],
      });

      this.points[index] = {
        ...this.points[index],
        x: finalPoint.x,
        y: finalPoint.y,
        snapPoint: finalPoint !== { x: newX, y: newY } ? { x: newX, y: newY } : undefined,
        timestamp: new Date(),
      };
      return true;
    }
    return false;
  }

  /**
   * Clear all points
   */
  clearAllPoints(): void {
    this.addToHistory({
      type: 'clear_all',
      timestamp: new Date(),
      data: {},
      previousState: [...this.points],
    });
    this.points = [];
    this.isDrawing = false;
    this.lastDrawPoint = null;
  }

  /**
   * Get all current points
   */
  getPoints(): MeasurementPoint[] {
    return [...this.points];
  }

  /**
   * Undo last action
   */
  undo(): boolean {
    if (this.canUndo()) {
      const action = this.actionHistory[this.currentActionIndex];
      if (action.previousState) {
        this.points = [...action.previousState];
      }
      this.currentActionIndex--;
      return true;
    }
    return false;
  }

  /**
   * Redo last undone action
   */
  redo(): boolean {
    if (this.canRedo()) {
      this.currentActionIndex++;
      const action = this.actionHistory[this.currentActionIndex];
      
      switch (action.type) {
        case 'add_point':
          this.points.push(action.data);
          break;
        case 'remove_point':
          this.points.splice(action.data.index, 1);
          break;
        case 'move_point':
          if (action.data.index < this.points.length) {
            this.points[action.data.index] = {
              ...this.points[action.data.index],
              ...action.data.newPoint,
            };
          }
          break;
        case 'clear_all':
          this.points = [];
          break;
      }
      return true;
    }
    return false;
  }

  /**
   * Get undo/redo state
   */
  getUndoRedoState(): UndoRedoState {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      currentActionIndex: this.currentActionIndex,
      totalActions: this.actionHistory.length,
    };
  }

  /**
   * Configure grid settings
   */
  configureGrid(settings: Partial<GridSettings>): void {
    this.gridSettings = { ...this.gridSettings, ...settings };
  }

  /**
   * Get current grid settings
   */
  getGridSettings(): GridSettings {
    return { ...this.gridSettings };
  }

  /**
   * Snap coordinates to grid
   */
  snapToGrid(x: number, y: number): { snapped: { x: number; y: number }; distance: number } | null {
    if (!this.gridSettings.enabled) return null;

    const spacing = this.gridSettings.spacing;
    const snappedX = Math.round(x / spacing) * spacing;
    const snappedY = Math.round(y / spacing) * spacing;
    
    const distance = Math.sqrt(
      Math.pow(snappedX - x, 2) + Math.pow(snappedY - y, 2)
    );

    if (distance <= this.gridSettings.snapThreshold) {
      return {
        snapped: { x: snappedX, y: snappedY },
        distance,
      };
    }

    return null;
  }

  /**
   * Simple edge detection (mock implementation - would use native CV library in production)
   */
  async detectEdges(imageData: any, threshold: number = 0.5): Promise<EdgeDetectionResult> {
    // This is a mock implementation. In a real app, you would use:
    // - OpenCV for React Native
    // - Native iOS/Android computer vision APIs
    // - ML-based edge detection models
    
    // Mock edge detection - generates some reasonable edge points
    const mockEdges: Array<{ x: number; y: number }> = [];
    const imageWidth = 400; // Mock image dimensions
    const imageHeight = 600;
    
    // Generate mock rectangular edges
    const margin = 50;
    const numPointsPerSide = 10;
    
    // Top edge
    for (let i = 0; i < numPointsPerSide; i++) {
      mockEdges.push({
        x: margin + (i / (numPointsPerSide - 1)) * (imageWidth - 2 * margin),
        y: margin,
      });
    }
    
    // Right edge
    for (let i = 0; i < numPointsPerSide; i++) {
      mockEdges.push({
        x: imageWidth - margin,
        y: margin + (i / (numPointsPerSide - 1)) * (imageHeight - 2 * margin),
      });
    }
    
    // Bottom edge
    for (let i = 0; i < numPointsPerSide; i++) {
      mockEdges.push({
        x: imageWidth - margin - (i / (numPointsPerSide - 1)) * (imageWidth - 2 * margin),
        y: imageHeight - margin,
      });
    }
    
    // Left edge
    for (let i = 0; i < numPointsPerSide; i++) {
      mockEdges.push({
        x: margin,
        y: imageHeight - margin - (i / (numPointsPerSide - 1)) * (imageHeight - 2 * margin),
      });
    }

    return {
      edges: mockEdges,
      confidence: 0.8,
      method: 'canny',
    };
  }

  /**
   * Auto-select points from detected edges
   */
  autoSelectFromEdges(edges: Array<{ x: number; y: number }>, maxPoints: number = 20): void {
    this.clearAllPoints();
    
    // Select evenly spaced points from edges
    const step = Math.max(1, Math.floor(edges.length / maxPoints));
    const selectedEdges = edges.filter((_, index) => index % step === 0);
    
    selectedEdges.forEach((edge) => {
      this.addPoint(edge.x, edge.y, 0.8);
    });
  }

  /**
   * Calculate area from current points
   */
  calculateArea(): number {
    if (this.points.length < 3) return 0;

    // Shoelace formula for polygon area
    let area = 0;
    const n = this.points.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += this.points[i].x * this.points[j].y;
      area -= this.points[j].x * this.points[i].y;
    }
    
    return Math.abs(area) / 2;
  }

  /**
   * Calculate perimeter from current points
   */
  calculatePerimeter(): number {
    if (this.points.length < 2) return 0;

    let perimeter = 0;
    const n = this.points.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const dx = this.points[j].x - this.points[i].x;
      const dy = this.points[j].y - this.points[i].y;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }
    
    return perimeter;
  }

  /**
   * Export points as ARPoint array
   */
  exportAsARPoints(): ARPoint[] {
    return this.points.map((point) => ({
      x: point.x,
      y: point.y,
      z: 0,
      confidence: point.confidence,
      timestamp: point.timestamp,
      sensorAccuracy: point.confidence > 0.9 ? 'high' : point.confidence > 0.7 ? 'medium' : 'low',
    }));
  }

  // Private helper methods

  private canUndo(): boolean {
    return this.currentActionIndex >= 0;
  }

  private canRedo(): boolean {
    return this.currentActionIndex < this.actionHistory.length - 1;
  }

  private addToHistory(action: MeasurementAction): void {
    // Remove any actions after current index (redo history)
    this.actionHistory = this.actionHistory.slice(0, this.currentActionIndex + 1);
    
    // Add new action
    this.actionHistory.push(action);
    this.currentActionIndex++;
    
    // Limit history size
    if (this.actionHistory.length > this.maxHistorySize) {
      this.actionHistory.shift();
      this.currentActionIndex--;
    }
  }

  private shouldAddFreehandPoint(x: number, y: number): boolean {
    if (!this.lastDrawPoint) return true;
    
    const distance = Math.sqrt(
      Math.pow(x - this.lastDrawPoint.x, 2) + Math.pow(y - this.lastDrawPoint.y, 2)
    );
    
    return distance >= this.drawingThreshold;
  }
}

// Singleton instance
export const measurementModeService = new MeasurementModeService();