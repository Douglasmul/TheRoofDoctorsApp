/**
 * @fileoverview Loading component for auth initialization
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export const AuthLoadingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#234e70" />
      <Text style={styles.text}>Initializing...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
    fontFamily: 'System',
  },
});