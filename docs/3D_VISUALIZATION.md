# 3D Roof Visualization Documentation

## Overview

The TheRoofDoctorsApp now includes comprehensive 3D geometry rendering capabilities for visualizing roof structures captured through AR measurement. This feature integrates seamlessly with the existing roof measurement system and provides an immersive 3D viewing experience.

## Features

### Core 3D Capabilities
- **Real-time 3D Visualization**: Convert captured roof planes to interactive 3D models
- **Material System**: Realistic material rendering for different roof types (shingle, tile, metal, flat)
- **Export/Import**: Support for multiple 3D formats (JSON, OBJ, PLY)
- **Interactive Viewer**: Full 3D navigation with camera controls, lighting, and visual helpers

### Integration Points
- **AR Camera Integration**: Direct access to 3D visualization from AR measurement screen
- **Navigation Support**: Seamless integration with existing app navigation
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Technical Architecture

### Key Components

#### 1. Type Definitions (`src/types/geometry3d.d.ts`)
```typescript
// Core 3D geometry types
interface RoofGeometry3D
interface RoofModel3D
interface Material3D
interface Viewer3DConfig
```

#### 2. Geometry Service (`src/services/Geometry3DService.ts`)
```typescript
class Geometry3DService {
  // Convert roof planes to 3D geometry
  convertPlaneToGeometry(plane: RoofPlane): RoofGeometry3D
  
  // Convert multiple planes to complete model
  convertPlanesToModel(planes: RoofPlane[]): RoofModel3D
  
  // Export/import functionality
  exportGeometry(geometry: RoofGeometry3D, format: string): Promise<string | Blob>
  importGeometry(data: string | Blob, format: string): Promise<RoofGeometry3D>
}
```

#### 3. 3D Viewer Component (`src/components/Roof3DViewer.tsx`)
```typescript
const Roof3DViewer: React.FC<{
  model?: RoofModel3D;
  geometry?: RoofGeometry3D;
  config?: Partial<Viewer3DConfig>;
  events?: Partial<Viewer3DEvents>;
}>
```

#### 4. Visualization Screen (`src/screens/Roof3DVisualizationScreen.tsx`)
- Complete UI for 3D roof visualization
- Settings panel for viewer configuration
- Export functionality
- Integration with navigation system

## Usage Guide

### Accessing 3D Visualization

#### From AR Camera Screen
1. Capture roof planes using the AR camera
2. Tap the **"View 3D"** button in the control panel
3. The app automatically converts planes to 3D and displays them

#### From Main Menu
1. Navigate to **Core Features** → **3D Roof Viewer**
2. View the demo geometry or load previously captured data

### 3D Viewer Controls

#### Navigation
- **Auto-rotation**: Automatically rotates the model for better viewing
- **Camera positioning**: Optimized viewing angles for roof structures

#### Visual Settings
- **Grid Helper**: Toggle coordinate grid display
- **Axes Helper**: Show X, Y, Z axes for orientation
- **Shadows**: Enable/disable shadow rendering
- **Lighting**: Configurable ambient and directional lighting

#### Export Options
- **JSON Format**: Complete geometry data with metadata
- **OBJ Format**: Standard 3D mesh format for external tools

## Material System

### Default Materials
```typescript
const DEFAULT_MATERIALS = {
  shingle: { color: '#8B4513', roughness: 0.8, metallic: 0.0 },
  tile: { color: '#D2691E', roughness: 0.6, metallic: 0.0 },
  metal: { color: '#708090', roughness: 0.3, metallic: 0.8 },
  flat: { color: '#696969', roughness: 0.9, metallic: 0.0 },
  unknown: { color: '#A0A0A0', roughness: 0.5, metallic: 0.2 },
};
```

### Material Properties
- **PBR Support**: Physically-based rendering with roughness and metallic properties
- **Auto-assignment**: Materials automatically assigned based on roof plane material detection
- **Customization**: Override materials for specific visualization needs

## Sample Geometry

The system includes a built-in sample gabled roof geometry for demonstration:

```typescript
// Access sample geometry
const service = new Geometry3DService();
const sampleGeometry = service.generateSampleGeometry();
```

Sample includes:
- 6 vertices (gabled roof structure)
- 4 faces (front slope, back slope, two gable ends)
- Shingle material
- Proper bounding box and metadata

## API Reference

### Geometry3DService Methods

#### `convertPlaneToGeometry(plane: RoofPlane, options?): RoofGeometry3D`
Converts a single roof plane to 3D geometry.

**Options:**
- `extrusionHeight?: number` - Thickness of the roof surface (default: 0.1m)
- `material?: Material3D` - Override material
- `lod?: 'low' | 'medium' | 'high'` - Level of detail

#### `convertPlanesToModel(planes: RoofPlane[], options?): RoofModel3D`
Converts multiple roof planes to a complete 3D model.

**Options:**
- `name?: string` - Model name
- `autoMaterials?: boolean` - Auto-assign materials based on plane types
- `mergeAdjacent?: boolean` - Merge adjacent planes (future feature)

#### `exportGeometry(geometry: RoofGeometry3D, format): Promise<string | Blob>`
Exports geometry to specified format.

**Supported Formats:**
- `'json'` - Complete geometry data
- `'obj'` - Wavefront OBJ mesh format
- `'ply'` - Stanford PLY format

### Viewer3DConfig Interface

```typescript
interface Viewer3DConfig {
  camera: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
    fov: number;
    // ... more camera options
  };
  lighting: {
    ambientIntensity: number;
    ambientColor: string;
    directionalLights: Array<{
      intensity: number;
      color: string;
      position: { x: number; y: number; z: number };
    }>;
  };
  renderer: {
    backgroundColor: string;
    shadows: boolean;
    antialias: boolean;
    toneMapping: 'none' | 'linear' | 'reinhard' | 'cineon' | 'aces';
  };
}
```

## Performance Considerations

### Optimization Features
- **Geometry Caching**: Converted geometries are cached to avoid redundant calculations
- **Level of Detail**: Support for different LOD levels for performance tuning
- **Lazy Loading**: 3D components loaded only when needed

### Memory Management
- **Automatic Cleanup**: Three.js objects properly disposed on component unmount
- **Cache Management**: Explicit cache clearing methods available

## Testing

Comprehensive test suite included:

```bash
npm test -- --testPathPatterns=Geometry3DService.test.ts
```

**Test Coverage:**
- Geometry conversion from roof planes
- Material assignment and customization
- Export/import functionality
- Error handling
- Caching behavior
- Sample geometry generation

## Dependencies

### New Dependencies Added
```json
{
  "three": "^0.179.1",
  "@types/three": "^0.179.0",
  "expo-gl": "^15.1.7",
  "expo-gl-cpp": "^11.4.0"
}
```

### Integration Requirements
- **Expo GL**: For WebGL context in React Native
- **Three.js**: Core 3D rendering engine
- **TypeScript**: Full type safety for 3D operations

## Future Enhancements

### Planned Features
- **Advanced Geometry**: Support for complex roof shapes (valleys, hips, dormers)
- **Texture Mapping**: Photo-realistic material textures
- **Animation**: Animated visualization modes
- **AR Integration**: Overlay 3D model on live AR view
- **Collaboration**: Multi-user 3D viewing and annotation

### Export Formats
- **GLTF**: Industry-standard 3D format
- **STL**: For 3D printing
- **DXF/DWG**: CAD integration

## Troubleshooting

### Common Issues

#### WebGL Not Available
- Ensure device supports WebGL
- Check Expo GL installation
- Verify React Native version compatibility

#### Performance Issues
- Reduce geometry complexity using lower LOD
- Disable shadows for better performance
- Clear cache if memory usage is high

#### Export Failures
- Check available storage space
- Verify export format is supported
- Ensure geometry is valid before export

## Examples

### Basic Usage
```typescript
import { Geometry3DService } from '../services/Geometry3DService';
import Roof3DViewer from '../components/Roof3DViewer';

// Convert captured planes to 3D
const service = new Geometry3DService();
const model = service.convertPlanesToModel(capturedPlanes);

// Render in viewer
<Roof3DViewer model={model} />
```

### Custom Configuration
```typescript
const customConfig = {
  renderer: {
    backgroundColor: '#87CEEB', // Sky blue
    shadows: true,
  },
  camera: {
    position: { x: 15, y: 10, z: 15 },
    fov: 60,
  },
};

<Roof3DViewer model={model} config={customConfig} />
```

### Export Example
```typescript
const geometry = service.convertPlaneToGeometry(roofPlane);
const objData = await service.exportGeometry(geometry, 'obj');
// Save or share objData
```

This 3D visualization system provides a comprehensive foundation for viewing and analyzing roof structures in three dimensions, enhancing the overall user experience of the TheRoofDoctorsApp.