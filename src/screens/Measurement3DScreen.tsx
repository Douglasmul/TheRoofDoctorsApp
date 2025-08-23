/**
 * @fileoverview 3D Measurement Screen
 * Main screen for 3D roof geometry measurement and visualization
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RoofMeasurement } from '../types/measurement.d';
import Measurement3DView from '../components/Measurement3DView';
import { measurement3DDataService } from '../services/Measurement3DDataService';
import * as Crypto from 'expo-crypto';

interface Measurement3DScreenProps {
  measurement?: RoofMeasurement;
  sessionId?: string;
}

/**
 * 3D Measurement Screen Component
 * Provides interface for 3D roof measurement workflow
 */
export default function Measurement3DScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as Measurement3DScreenProps | undefined;

  // State management
  const [sessionId] = useState(() => params?.sessionId || Crypto.randomUUID());
  const [currentMeasurement, setCurrentMeasurement] = useState<RoofMeasurement | undefined>(params?.measurement);
  const [viewMode, setViewMode] = useState<'wireframe' | 'solid' | 'mixed'>('solid');
  const [isInteractive, setIsInteractive] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    // Session is automatically created by the Measurement3DView component
    // This is just for any additional initialization
  }, []);

  /**
   * Handle measurement updates from 3D view
   */
  const handleMeasurementUpdate = useCallback((measurement: RoofMeasurement) => {
    setCurrentMeasurement(measurement);
  }, []);

  /**
   * Handle 3D interactions
   */
  const handleInteraction = useCallback((type: 'select' | 'move' | 'rotate', data: any) => {
    console.log('3D Interaction:', type, data);
    // TODO: Implement interaction handling based on type
  }, []);

  /**
   * Switch between view modes
   */
  const toggleViewMode = () => {
    const modes: Array<'wireframe' | 'solid' | 'mixed'> = ['solid', 'wireframe', 'mixed'];
    const currentIndex = modes.indexOf(viewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setViewMode(modes[nextIndex]);
  };

  /**
   * Save measurement and navigate to review
   */
  const saveAndReview = async () => {
    if (!currentMeasurement) {
      Alert.alert('No Data', 'No measurement data to save. Please create or import measurement data first.');
      return;
    }

    try {
      // Navigate to measurement review screen
      navigation.navigate('MeasurementReview' as never, {
        measurement: currentMeasurement,
        isManual: false,
      } as never);
    } catch (error) {
      Alert.alert('Error', 'Failed to save measurement data');
    }
  };

  /**
   * Import existing measurement data
   */
  const importMeasurement = () => {
    Alert.alert(
      'Import Measurement',
      'Import measurement data from AR or Manual measurement?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'From AR Measurement', 
          onPress: () => {
            // TODO: Navigate to AR measurement or import from saved data
            Alert.alert('Coming Soon', 'AR measurement import will be implemented in future updates');
          }
        },
        { 
          text: 'From Manual Measurement', 
          onPress: () => {
            // TODO: Navigate to manual measurement or import from saved data
            Alert.alert('Coming Soon', 'Manual measurement import will be implemented in future updates');
          }
        },
      ]
    );
  };

  /**
   * Create new 3D measurement from scratch
   */
  const createNew3DMeasurement = () => {
    Alert.alert(
      'Create New 3D Measurement',
      'This will create a new 3D measurement session. Any unsaved changes will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            // Clear current measurement
            setCurrentMeasurement(undefined);
            // The 3D view will create a new session automatically
            setShowInstructions(true);
          }
        },
      ]
    );
  };

  /**
   * Export 3D model
   */
  const export3DModel = () => {
    Alert.alert(
      'Export 3D Model',
      'Choose export format:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Standard Measurement', 
          onPress: saveAndReview
        },
        { 
          text: 'CAD Format (Coming Soon)', 
          onPress: () => {
            Alert.alert('Coming Soon', 'CAD export will be implemented in future updates');
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>3D Measurement</Text>
        <TouchableOpacity style={styles.menuButton} onPress={toggleViewMode}>
          <Text style={styles.menuButtonText}>{viewMode.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions (if shown) */}
      {showInstructions && (
        <View style={styles.instructionsContainer}>
          <ScrollView style={styles.instructionsScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.instructionsTitle}>3D Measurement Instructions</Text>
            <Text style={styles.instructionsText}>
              • Import existing AR or Manual measurements to visualize in 3D{'\n'}
              • Use touch gestures to rotate and explore the 3D model{'\n'}
              • Tap on roof surfaces to select and view details{'\n'}
              • Switch between solid, wireframe, and mixed view modes{'\n'}
              • Export measurements back to standard format when done
            </Text>
            <Text style={styles.compatibilityNote}>
              ✓ Compatible with Expo Go - No custom native modules required
            </Text>
            <TouchableOpacity 
              style={styles.dismissButton}
              onPress={() => setShowInstructions(false)}
            >
              <Text style={styles.dismissButtonText}>Got it!</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* 3D View */}
      <View style={styles.viewContainer}>
        <Measurement3DView
          measurement={currentMeasurement}
          sessionId={sessionId}
          onMeasurementUpdate={handleMeasurementUpdate}
          onInteraction={handleInteraction}
          viewMode={viewMode}
          interactive={isInteractive}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionButtons}
        >
          <TouchableOpacity style={styles.actionButton} onPress={importMeasurement}>
            <Text style={styles.actionButtonText}>Import Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={createNew3DMeasurement}>
            <Text style={styles.actionButtonText}>New Session</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryActionButton]} 
            onPress={saveAndReview}
            disabled={!currentMeasurement}
          >
            <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>
              Save & Review
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={export3DModel}>
            <Text style={styles.actionButtonText}>Export</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setShowInstructions(true)}
          >
            <Text style={styles.actionButtonText}>Help</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          Session: {sessionId.slice(0, 8)}...
        </Text>
        <Text style={styles.statusText}>
          {currentMeasurement ? `${currentMeasurement.planes.length} planes` : 'No data'}
        </Text>
        <Text style={styles.statusText}>
          View: {viewMode}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50, // Account for status bar
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#234e70',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#234e70',
  },
  menuButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#234e70',
    borderRadius: 6,
  },
  menuButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  instructionsContainer: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    zIndex: 1000,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  instructionsScroll: {
    maxHeight: 250,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  compatibilityNote: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  dismissButton: {
    backgroundColor: '#234e70',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'center',
  },
  dismissButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  viewContainer: {
    flex: 1,
  },
  actionContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 12,
  },
  actionButtons: {
    paddingHorizontal: 16,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  primaryActionButton: {
    backgroundColor: '#234e70',
    borderColor: '#234e70',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#234e70',
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryActionButtonText: {
    color: 'white',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
});

// TODO: Future enhancements for 3D measurement screen:
// TODO: - Implement gesture controls for 3D navigation
// TODO: - Add real-time measurement tools in 3D space
// TODO: - Integrate with AR camera for hybrid mode
// TODO: - Add collaborative features for team measurements
// TODO: - Implement advanced material and texture editing
// TODO: - Add animation controls for model presentation
// TODO: - Integrate with cloud storage for 3D model backup
// TODO: - Add accessibility support for 3D interactions
// TODO: - Implement performance optimization for complex models
// TODO: - Add integration with CAD and BIM systems