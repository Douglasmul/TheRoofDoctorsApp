import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COMPANY_INFO } from '../constants/company';

export default function OpenAppScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome to {COMPANY_INFO.app.displayName} App</Text>
      <Text style={styles.subheader}>{COMPANY_INFO.app.description}</Text>
      <Button
        title="Measure Roof with Camera"
        onPress={() => navigation.navigate('MeasureRoof')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fc',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 24,
    textAlign: 'center',
  },
  subheader: {
    fontSize: 18,
    color: '#234e70',
    marginBottom: 24,
    textAlign: 'center',
  },
});
