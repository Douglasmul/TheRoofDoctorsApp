import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';

type QuoteScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Quote'>;

export default function QuoteScreen() {
  const navigation = useNavigation<QuoteScreenNavigationProp>();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Get a Quote</Text>
      <Text style={styles.subheader}>Quote functionality coming soon!</Text>
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