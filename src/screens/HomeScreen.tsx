import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HomeScreen: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Welcome to TheRoofDoctorsApp!</Text>
    <Text style={styles.body}>Your professional enterprise mobile app starter is ready.</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16
  },
  body: {
    fontSize: 16
  }
});

export default HomeScreen;