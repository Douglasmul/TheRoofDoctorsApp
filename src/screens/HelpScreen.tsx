import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function HelpScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Help</Text>
      <Text style={styles.subheader}>Support and FAQ coming soon!</Text>
      <Button title="Go Back" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 16,
    textAlign: 'center',
  },
  subheader: {
    fontSize: 18,
    color: '#234e70',
    marginBottom: 32,
    textAlign: 'center',
  },
});