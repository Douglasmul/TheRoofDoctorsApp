import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COMPANY_INFO } from '../constants/company';

export default function HomeScreen() {
  const navigation = useNavigation();
  // Only show testing menu in development mode by default
  const [showTestingMenu, setShowTestingMenu] = useState(__DEV__ || false);

  // Testing screens organized by category
  const testingScreens = {
    'Authentication': [
      { name: 'Login', screen: 'Login' },
      { name: 'Sign Up', screen: 'Signup' }
    ],
    'User Account': [
      { name: 'Profile', screen: 'Profile' },
      { name: 'Settings', screen: 'Settings' },
      { name: 'Notifications', screen: 'Notifications' }
    ],
    'Core Features': [
      { name: 'AR Camera', screen: 'RoofARCamera' },
      { name: 'Welcome', screen: 'OpenApp' }
    ],
    'Business': [
      { name: 'Reports', screen: 'Reports' },
      { name: 'Admin Panel', screen: 'Admin' }
    ],
    'Support': [
      { name: 'Help & Support', screen: 'Help' },
      { name: 'Legal Info', screen: 'Legal' },
      { name: 'Error Screen', screen: 'Error' }
    ]
  };

  const renderTestingButton = (item: { name: string; screen: string }) => {
    return (
      <TouchableOpacity
        key={item.screen}
        style={styles.testingButton}
        onPress={() => navigation.navigate(item.screen as never)}
      >
        <Text style={styles.testingButtonText}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const renderTestingCategory = (category: string, screens: { name: string; screen: string }[]) => {
    return (
      <View key={category} style={styles.testingCategory}>
        <Text style={styles.testingCategoryTitle}>{category}</Text>
        <View style={styles.testingCategoryButtons}>
          {screens.map(renderTestingButton)}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      <Text style={styles.header}>{COMPANY_INFO.name}</Text>
      <Text style={styles.subheader}>Welcome to your enterprise roofing assistant.</Text>
      
      {/* Main App Buttons */}
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
          <Text style={styles.buttonText}>Get a Quote</Text>
        </TouchableOpacity>
      </View>

      {/* Testing Menu Toggle */}
      <TouchableOpacity
        style={styles.testingToggle}
        onPress={() => setShowTestingMenu(!showTestingMenu)}
      >
        <Text style={styles.testingToggleText}>
          {showTestingMenu ? '▼ Hide Testing Menu' : '▶ Show Testing Menu'}
        </Text>
      </TouchableOpacity>

      {/* Testing Menu */}
      {showTestingMenu && (
        <View style={styles.testingMenu}>
          <Text style={styles.testingMenuTitle}>🧪 Screen Testing Navigation</Text>
          <Text style={styles.testingMenuSubtitle}>Access all screens for testing purposes</Text>
          
          {Object.entries(testingScreens).map(([category, screens]) =>
            renderTestingCategory(category, screens)
          )}
          
          <Text style={styles.testingNote}>
            📝 Note: This testing menu should be hidden in production builds
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f6f8fc',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: '100%',
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
    marginBottom: 24,
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
  
  // Testing Menu Styles
  testingToggle: {
    backgroundColor: '#e8f4fd',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#234e70',
    marginVertical: 10,
  },
  testingToggleText: {
    color: '#234e70',
    fontSize: 16,
    fontWeight: '500',
  },
  testingMenu: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testingMenuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 8,
    textAlign: 'center',
  },
  testingMenuSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  testingCategory: {
    marginBottom: 20,
  },
  testingCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#234e70',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
    paddingBottom: 4,
  },
  testingCategoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  testingButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginVertical: 4,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#dee2e6',
    minWidth: '48%',
    alignItems: 'center',
  },
  testingButtonText: {
    color: '#495057',
    fontSize: 14,
    fontWeight: '500',
  },
  testingNote: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
});