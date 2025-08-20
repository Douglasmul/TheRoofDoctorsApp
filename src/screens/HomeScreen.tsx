import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COMPANY_INFO } from '../constants/company';
import { useCompanyBranding } from '../hooks/useCompanyBranding';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { companyInfo } = useCompanyBranding();
  
  // Always show main menu in production, but allow toggle for better UX
  const [showMainMenu, setShowMainMenu] = useState(true);

  // Main app menu organized by category with icons
  const menuSections = {
    'Account': [
      { name: 'Profile', screen: 'Profile', icon: 'person', iconSet: 'MaterialIcons' },
      { name: 'Settings', screen: 'Settings', icon: 'settings', iconSet: 'MaterialIcons' },
      { name: 'Notifications', screen: 'Notifications', icon: 'notifications', iconSet: 'MaterialIcons' }
    ],
    'Tools': [
      { name: 'AR Camera', screen: 'RoofARCamera', icon: 'camera-alt', iconSet: 'MaterialIcons' },
      { name: 'Manual Measurement', screen: 'ManualMeasurement', icon: 'straighten', iconSet: 'MaterialIcons' },
      { name: 'Welcome Guide', screen: 'OpenApp', icon: 'info', iconSet: 'MaterialIcons' }
    ],
    'Business': [
      { name: 'Reports', screen: 'Reports', icon: 'bar-chart', iconSet: 'MaterialIcons' },
      { name: 'Quote Generator', screen: 'Quote', icon: 'description', iconSet: 'MaterialIcons' }
    ],
    'Support': [
      { name: 'Help & Support', screen: 'Help', icon: 'help', iconSet: 'MaterialIcons' },
      { name: 'Legal Info', screen: 'Legal', icon: 'gavel', iconSet: 'MaterialIcons' }
    ],
    'Authentication': [
      { name: 'Login', screen: 'Login', icon: 'login', iconSet: 'MaterialIcons' },
      { name: 'Sign Up', screen: 'Signup', icon: 'person-add', iconSet: 'MaterialIcons' },
      { name: 'Logout', action: 'logout', icon: 'logout', iconSet: 'MaterialIcons' }
    ]
  };

  // Developer tools - only visible in development mode
  const developerTools = {
    'Developer Tools': [
      { name: 'Admin Panel', screen: 'Admin', icon: 'admin-panel-settings', iconSet: 'MaterialIcons' },
      { name: 'Error Screen', screen: 'Error', icon: 'error', iconSet: 'MaterialIcons' }
    ]
  };

  const handleMenuAction = (item: { name: string; screen?: string; action?: string }) => {
    if (item.action === 'logout') {
      // Handle logout action - you might want to add actual logout logic here
      console.log('Logout pressed - implement logout logic');
      // For demo purposes, just show an alert or navigate to login
      navigation.navigate('Login' as never);
    } else if (item.screen) {
      navigation.navigate(item.screen as never);
    }
  };

  const renderMenuButton = (item: { name: string; screen?: string; action?: string; icon: string; iconSet: string }) => {
    const IconComponent = item.iconSet === 'MaterialCommunityIcons' ? MaterialCommunityIcons : MaterialIcons;
    
    return (
      <TouchableOpacity
        key={item.screen || item.action || item.name}
        style={styles.menuButton}
        onPress={() => handleMenuAction(item)}
      >
        <IconComponent name={item.icon as any} size={20} color="#234e70" style={styles.menuButtonIcon} />
        <Text style={styles.menuButtonText}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const renderMenuCategory = (category: string, items: { name: string; screen?: string; action?: string; icon: string; iconSet: string }[]) => {
    return (
      <View key={category} style={styles.menuCategory}>
        <Text style={styles.menuCategoryTitle}>{category}</Text>
        <View style={styles.menuCategoryButtons}>
          {items.map(renderMenuButton)}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      {/* Company Header with Logo and Name */}
      <View style={styles.companyHeader}>
        {companyInfo.logoUri && (
          <Image source={{ uri: companyInfo.logoUri }} style={styles.companyLogo} />
        )}
        <Text style={styles.header}>{companyInfo.name}</Text>
        {companyInfo.hasCustomBranding && (
          <Text style={styles.brandingIndicator}>Custom Branding</Text>
        )}
      </View>
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
      </View>

      {/* Main Menu Toggle */}
      <TouchableOpacity
        style={styles.menuToggle}
        onPress={() => setShowMainMenu(!showMainMenu)}
      >
        <MaterialIcons 
          name={showMainMenu ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
          size={20} 
          color="#234e70" 
        />
        <Text style={styles.menuToggleText}>
          {showMainMenu ? 'Hide Menu' : 'Show Menu'}
        </Text>
      </TouchableOpacity>

      {/* Main App Menu */}
      {showMainMenu && (
        <View style={styles.mainMenu}>
          <Text style={styles.mainMenuTitle}>📱 App Menu</Text>
          <Text style={styles.mainMenuSubtitle}>Access all features and settings</Text>
          
          {Object.entries(menuSections).map(([category, items]) =>
            renderMenuCategory(category, items)
          )}
          
          {/* Developer Tools - Only in Development */}
          {__DEV__ && (
            <>
              <View style={styles.devToolsSeparator}>
                <Text style={styles.devToolsLabel}>Development Only</Text>
              </View>
              {Object.entries(developerTools).map(([category, items]) =>
                renderMenuCategory(category, items)
              )}
            </>
          )}
          
          {__DEV__ && (
            <Text style={styles.devNote}>
              🧪 Developer tools are hidden in production builds
            </Text>
          )}
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
  companyHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  companyLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#234e70',
    textAlign: 'center',
  },
  brandingIndicator: {
    fontSize: 12,
    color: '#28a745',
    marginTop: 4,
    fontWeight: '500',
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
  
  // Main Menu Styles
  menuToggle: {
    backgroundColor: '#e8f4fd',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#234e70',
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  menuToggleText: {
    color: '#234e70',
    fontSize: 16,
    fontWeight: '500',
  },
  mainMenu: {
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
  mainMenuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 8,
    textAlign: 'center',
  },
  mainMenuSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  menuCategory: {
    marginBottom: 20,
  },
  menuCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#234e70',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
    paddingBottom: 6,
  },
  menuCategoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  menuButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#dee2e6',
    minWidth: '48%',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuButtonIcon: {
    flexShrink: 0,
  },
  menuButtonText: {
    color: '#495057',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  devNote: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  devToolsSeparator: {
    marginTop: 20,
    marginBottom: 10,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#e1e8ed',
    alignItems: 'center',
  },
  devToolsLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    marginTop: -8,
  },
});