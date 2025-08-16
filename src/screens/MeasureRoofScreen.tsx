import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';

type MeasureRoofScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MeasureRoof'>;

export default function MeasureRoofScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation<MeasureRoofScreenNavigationProp>();

  const handleRequestPermission = async () => {
    try {
      await requestPermission();
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      Alert.alert('Error', 'Failed to request camera permission');
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Loading camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Camera Permission Required</Text>
        <Text style={styles.subheader}>
          Please grant camera permissions to use this feature.
        </Text>
        <Button title="Grant Permission" onPress={handleRequestPermission} />
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Measure Roof (Camera)</Text>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          ref={cameraRef}
        />
      </View>
      <Button title="Go Back" onPress={() => navigation.goBack()} />
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
    marginBottom: 16,
    textAlign: 'center',
  },
  subheader: {
    fontSize: 16,
    color: '#234e70',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#222',
  },
  camera: {
    flex: 1,
  },
});
