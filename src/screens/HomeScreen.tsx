import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COMPANY_INFO } from '../constants/company';

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{COMPANY_INFO.name}</Text>
      <Text style={styles.subheader}>Welcome to your enterprise roofing assistant.</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('MeasureRoof' as never)}
        >
          <Text style={styles.buttonText}>Measure Roof</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Quote' as never)}
        >
          <Text style={styles.buttonText}>Get a Quote</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.sectionTitle}>Enterprise Features</Text>
      <View style={styles.enterpriseGrid}>
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => navigation.navigate('Profile' as never)}
        >
          <Text style={styles.smallButtonText}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => navigation.navigate('Settings' as never)}
        >
          <Text style={styles.smallButtonText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => navigation.navigate('Notifications' as never)}
        >
          <Text style={styles.smallButtonText}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => navigation.navigate('Admin' as never)}
        >
          <Text style={styles.smallButtonText}>Admin</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => navigation.navigate('Reports' as never)}
        >
          <Text style={styles.smallButtonText}>Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => navigation.navigate('Help' as never)}
        >
          <Text style={styles.smallButtonText}>Help</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => navigation.navigate('Legal' as never)}
        >
          <Text style={styles.smallButtonText}>Legal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => navigation.navigate('Error' as never)}
        >
          <Text style={styles.smallButtonText}>Error</Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 16,
  },
  subheader: {
    fontSize: 18,
    color: '#234e70',
    marginBottom: 32,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#234e70',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#234e70',
    marginBottom: 16,
    textAlign: 'center',
  },
  enterpriseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  smallButton: {
    backgroundColor: '#e67e22',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    margin: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  smallButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});