import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';

export default function MeasureRoofScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const navigation = useNavigation();

  const startARMeasurement = () => {
    navigation.navigate('RoofARCamera');
  };

  const startManualMeasurement = () => {
    navigation.navigate('ManualMeasurement');
  };

  const start3DMeasurement = () => {
    navigation.navigate('Measurement3D' as never);
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
        <Text style={styles.statusText}>No access to camera. Please enable permissions in settings.</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Request Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Roof Measurement Options</Text>
      
      <View style={styles.optionContainer}>
        <Text style={styles.optionTitle}>AR Measurement</Text>
        <Text style={styles.optionDescription}>
          Use advanced AR technology to accurately measure roof surfaces with real-time guidance and pitch detection.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={startARMeasurement}>
          <Text style={styles.primaryButtonText}>Start AR Measurement</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.optionContainer}>
        <Text style={styles.optionTitle}>Traditional Measurement</Text>
        <Text style={styles.optionDescription}>
          Manual point selection for measuring roof sections. Touch to select points and measure any roof surface manually.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={startManualMeasurement}>
          <Text style={styles.primaryButtonText}>Start Manual Measurement</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.optionContainer}>
        <Text style={styles.optionTitle}>3D Measurement</Text>
        <Text style={styles.optionDescription}>
          Visualize and interact with 3D roof geometry. Import existing measurements or create new 3D models for advanced analysis.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={start3DMeasurement}>
          <Text style={styles.primaryButtonText}>Start 3D Measurement</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fc',
    padding: 24,
    justifyContent: 'flex-start',
  },
  header: {
    fontSize: 24,
    color: '#234e70',
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  optionContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#234e70',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#e9ecef',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 16,
    color: '#234e70',
    textAlign: 'center',
    marginTop: 100,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#234e70',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
