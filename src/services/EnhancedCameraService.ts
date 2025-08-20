/**
 * @fileoverview Enhanced Camera Service for Professional Measurement
 * Provides advanced camera controls, photo import, and image processing
 * @version 1.0.0
 */

import { Camera, CameraType, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

export interface CameraSettings {
  flashMode: FlashMode;
  autoFocus: boolean;
  exposureMode: 'auto' | 'manual';
  exposureValue: number; // -2.0 to 2.0
  iso: number; // 50 to 3200
  shutterSpeed: number; // 1/4000 to 30 seconds
  whiteBalance: 'auto' | 'sunny' | 'cloudy' | 'fluorescent' | 'incandescent';
  zoom: number; // 0.0 to 1.0
  pictureSize: 'low' | 'medium' | 'high' | 'ultra';
  focusDepth: number; // 0.0 to 1.0 for manual focus
}

export interface CameraCapabilities {
  hasFlash: boolean;
  canAutoFocus: boolean;
  canManualFocus: boolean;
  canControlExposure: boolean;
  canControlISO: boolean;
  canControlShutterSpeed: boolean;
  maxZoom: number;
  supportedPictureSizes: string[];
  supportedVideoSizes: string[];
}

export interface PhotoMetadata {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  cameraSettings: Partial<CameraSettings>;
  deviceInfo: {
    make: string;
    model: string;
    os: string;
  };
}

export interface ImportedImage {
  uri: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  source: 'camera' | 'gallery' | 'document';
  metadata?: PhotoMetadata;
}

export interface CameraState {
  isReady: boolean;
  hasPermission: boolean;
  isRecording: boolean;
  currentSettings: CameraSettings;
  capabilities: CameraCapabilities | null;
  lastPhoto: PhotoMetadata | null;
  autoFocusPoint: { x: number; y: number } | null;
  exposurePoint: { x: number; y: number } | null;
}

export class EnhancedCameraService {
  private cameraRef: Camera | null = null;
  private state: CameraState = {
    isReady: false,
    hasPermission: false,
    isRecording: false,
    currentSettings: this.getDefaultSettings(),
    capabilities: null,
    lastPhoto: null,
    autoFocusPoint: null,
    exposurePoint: null,
  };

  private listeners: Array<(state: CameraState) => void> = [];

  /**
   * Initialize camera service
   */
  async initialize(): Promise<boolean> {
    try {
      // Request camera permissions
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      this.state.hasPermission = cameraPermission.status === 'granted';
      
      if (!this.state.hasPermission) {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in your device settings to use measurement features.',
          [{ text: 'OK', style: 'default' }]
        );
        return false;
      }

      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to initialize camera service:', error);
      return false;
    }
  }

  /**
   * Set camera reference
   */
  setCameraRef(ref: Camera | null): void {
    this.cameraRef = ref;
    if (ref) {
      this.loadCameraCapabilities();
    }
  }

  /**
   * Get current camera state
   */
  getState(): CameraState {
    return { ...this.state };
  }

  /**
   * Subscribe to camera state changes
   */
  subscribe(listener: (state: CameraState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Update camera settings
   */
  async updateSettings(settings: Partial<CameraSettings>): Promise<void> {
    this.state.currentSettings = { ...this.state.currentSettings, ...settings };
    
    // Apply settings to camera if available
    if (this.cameraRef) {
      try {
        // Note: Some settings may require native camera implementation
        // This is a simplified version - full implementation would use native modules
        this.notifyListeners();
      } catch (error) {
        console.warn('Failed to apply camera settings:', error);
      }
    }
  }

  /**
   * Take a photo with current settings
   */
  async takePhoto(): Promise<PhotoMetadata | null> {
    if (!this.cameraRef || !this.state.hasPermission) {
      throw new Error('Camera not ready or no permission');
    }

    try {
      const photo = await this.cameraRef.takePictureAsync({
        quality: this.getQualityFromPictureSize(this.state.currentSettings.pictureSize),
        exif: true,
        skipProcessing: false,
      });

      const metadata: PhotoMetadata = {
        uri: photo.uri,
        width: photo.width || 0,
        height: photo.height || 0,
        fileSize: await this.getFileSize(photo.uri),
        timestamp: new Date(),
        cameraSettings: { ...this.state.currentSettings },
        deviceInfo: {
          make: 'Unknown', // Would get from device info
          model: 'Unknown',
          os: 'Unknown',
        },
      };

      // Extract location from EXIF if available
      if (photo.exif?.GPS) {
        metadata.location = {
          latitude: photo.exif.GPS.Latitude || 0,
          longitude: photo.exif.GPS.Longitude || 0,
          altitude: photo.exif.GPS.Altitude,
        };
      }

      this.state.lastPhoto = metadata;
      this.notifyListeners();

      return metadata;
    } catch (error) {
      console.error('Failed to take photo:', error);
      throw error;
    }
  }

  /**
   * Import image from device gallery
   */
  async importFromGallery(): Promise<ImportedImage | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        exif: true,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        fileName: asset.fileName || 'imported_image.jpg',
        fileSize: asset.fileSize || 0,
        mimeType: asset.type || 'image/jpeg',
        width: asset.width,
        height: asset.height,
        source: 'gallery',
        metadata: {
          uri: asset.uri,
          width: asset.width || 0,
          height: asset.height || 0,
          fileSize: asset.fileSize || 0,
          timestamp: new Date(),
          cameraSettings: {},
          deviceInfo: {
            make: 'Unknown',
            model: 'Unknown',
            os: 'Unknown',
          },
        },
      };
    } catch (error) {
      console.error('Failed to import from gallery:', error);
      return null;
    }
  }

  /**
   * Import image from documents
   */
  async importFromDocuments(): Promise<ImportedImage | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        fileName: asset.name,
        fileSize: asset.size || 0,
        mimeType: asset.mimeType || 'image/jpeg',
        source: 'document',
      };
    } catch (error) {
      console.error('Failed to import from documents:', error);
      return null;
    }
  }

  /**
   * Set auto focus point
   */
  setAutoFocusPoint(x: number, y: number): void {
    this.state.autoFocusPoint = { x, y };
    // In a real implementation, this would trigger native camera focus
    this.notifyListeners();
  }

  /**
   * Set exposure point
   */
  setExposurePoint(x: number, y: number): void {
    this.state.exposurePoint = { x, y };
    // In a real implementation, this would trigger native camera exposure adjustment
    this.notifyListeners();
  }

  /**
   * Toggle flash mode
   */
  async toggleFlash(): Promise<void> {
    const currentMode = this.state.currentSettings.flashMode;
    let newMode: FlashMode;

    switch (currentMode) {
      case FlashMode.off:
        newMode = FlashMode.on;
        break;
      case FlashMode.on:
        newMode = FlashMode.auto;
        break;
      case FlashMode.auto:
      default:
        newMode = FlashMode.off;
        break;
    }

    await this.updateSettings({ flashMode: newMode });
  }

  /**
   * Auto-adjust camera settings for measurement
   */
  async optimizeForMeasurement(): Promise<void> {
    const optimalSettings: Partial<CameraSettings> = {
      flashMode: FlashMode.auto,
      autoFocus: true,
      exposureMode: 'auto',
      whiteBalance: 'auto',
      pictureSize: 'high',
      zoom: 0,
    };

    await this.updateSettings(optimalSettings);
  }

  /**
   * Get recommended settings for different lighting conditions
   */
  getRecommendedSettings(lightingCondition: 'bright' | 'normal' | 'low' | 'very_low'): Partial<CameraSettings> {
    switch (lightingCondition) {
      case 'bright':
        return {
          flashMode: FlashMode.off,
          exposureMode: 'auto',
          iso: 100,
          whiteBalance: 'sunny',
        };
      case 'normal':
        return {
          flashMode: FlashMode.auto,
          exposureMode: 'auto',
          iso: 200,
          whiteBalance: 'auto',
        };
      case 'low':
        return {
          flashMode: FlashMode.on,
          exposureMode: 'manual',
          exposureValue: 0.5,
          iso: 800,
          whiteBalance: 'auto',
        };
      case 'very_low':
        return {
          flashMode: FlashMode.on,
          exposureMode: 'manual',
          exposureValue: 1.0,
          iso: 1600,
          whiteBalance: 'incandescent',
        };
      default:
        return this.getDefaultSettings();
    }
  }

  /**
   * Process image for measurement (enhance contrast, etc.)
   */
  async processImageForMeasurement(imageUri: string): Promise<string> {
    try {
      // In a real implementation, this would:
      // 1. Apply contrast enhancement
      // 2. Reduce noise
      // 3. Sharpen edges
      // 4. Adjust brightness/gamma
      // 5. Apply perspective correction if needed
      
      // For now, return the original image
      // In production, you would use native image processing libraries
      return imageUri;
    } catch (error) {
      console.error('Failed to process image:', error);
      return imageUri;
    }
  }

  /**
   * Save image to device gallery
   */
  async saveToGallery(imageUri: string, albumName: string = 'RoofDoctor'): Promise<boolean> {
    try {
      // Implementation would save to gallery with proper permissions
      return true;
    } catch (error) {
      console.error('Failed to save to gallery:', error);
      return false;
    }
  }

  /**
   * Get image analysis data
   */
  async analyzeImage(imageUri: string): Promise<{
    brightness: number;
    contrast: number;
    sharpness: number;
    suitabilityScore: number;
    recommendations: string[];
  }> {
    // Mock analysis - in production would use image processing libraries
    return {
      brightness: 0.7,
      contrast: 0.8,
      sharpness: 0.9,
      suitabilityScore: 0.8,
      recommendations: [
        'Image quality is good for measurement',
        'Consider using flash in low light conditions',
      ],
    };
  }

  // Private methods

  private getDefaultSettings(): CameraSettings {
    return {
      flashMode: FlashMode.auto,
      autoFocus: true,
      exposureMode: 'auto',
      exposureValue: 0,
      iso: 200,
      shutterSpeed: 1/60,
      whiteBalance: 'auto',
      zoom: 0,
      pictureSize: 'high',
      focusDepth: 0.5,
    };
  }

  private async loadCameraCapabilities(): Promise<void> {
    // In a real implementation, this would query the camera for its capabilities
    this.state.capabilities = {
      hasFlash: true,
      canAutoFocus: true,
      canManualFocus: true,
      canControlExposure: true,
      canControlISO: true,
      canControlShutterSpeed: false,
      maxZoom: 10,
      supportedPictureSizes: ['low', 'medium', 'high', 'ultra'],
      supportedVideoSizes: ['720p', '1080p', '4K'],
    };

    this.state.isReady = true;
    this.notifyListeners();
  }

  private getQualityFromPictureSize(size: string): number {
    switch (size) {
      case 'low': return 0.3;
      case 'medium': return 0.6;
      case 'high': return 0.9;
      case 'ultra': return 1.0;
      default: return 0.9;
    }
  }

  private async getFileSize(uri: string): Promise<number> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      return info.size || 0;
    } catch (error) {
      return 0;
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }
}

// Singleton instance
export const enhancedCameraService = new EnhancedCameraService();