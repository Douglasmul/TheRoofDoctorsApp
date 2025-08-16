import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function MeasureRoofScreen() {
  const navigation = useNavigation();
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [area, setArea] = useState<number | null>(null);

  const calculateArea = () => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    if (!isNaN(l) && !isNaN(w)) {
      setArea(l * w);
    } else {
      setArea(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Measure Your Roof</Text>
      <Text style={styles.label}>Length (meters):</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={length}
        onChangeText={setLength}
        placeholder="Enter length"
      />
      <Text style={styles.label}>Width (meters):</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={width}
        onChangeText={setWidth}
        placeholder="Enter width"
      />
      <Button title="Calculate Area" onPress={calculateArea} />
      {area !== null && (
        <Text style={styles.result}>Roof Area: {area} m²</Text>
      )}
      <View style={{ marginTop: 24 }}>
        <Button
          title="Proceed to Quote"
          onPress={() => navigation.navigate('Quote' as never)}
          disabled={area === null}
        />
      </View>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    color: '#234e70',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  result: {
    fontSize: 18,
    color: '#234e70',
    marginTop: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
