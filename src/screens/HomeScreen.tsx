import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COMPANY_INFO } from '../constants/company';
import { useCompanyBranding } from '../hooks/useCompanyBranding';
import { MainMenu } from '../components/menu';
import { theme } from '../theme/theme';
import { layout, responsiveStyle } from '../utils/responsive';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { companyInfo } = useCompanyBranding();
  
  // Toggle between traditional and enhanced menu
  const [useEnhancedMenu, setUseEnhancedMenu] = useState(true);
  
  // Only show testing menu in development mode by default
  const [showTestingMenu, setShowTestingMenu] = useState(__DEV__ && !useEnhancedMenu);

  // Legacy testing screens for backward compatibility
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

  const handleQuickNavigation = (screen: string) => {
    navigation.navigate(screen as never);
  };

  if (useEnhancedMenu) {
    return (
      <View style={styles.enhancedContainer}>
        {/* Enhanced Header */}
        <View style={styles.enhancedHeader}>
          {companyInfo.logoUri && (
            <Image source={{ uri: companyInfo.logoUri }} style={styles.enhancedLogo} />
          )}
          <Text style={styles.enhancedTitle}>{companyInfo.name}</Text>
          {companyInfo.hasCustomBranding && (
            <Text style={styles.enhancedBrandingIndicator}>Custom Branding</Text>
          )}
          <Text style={styles.enhancedSubtitle}>
            Professional roofing solutions at your fingertips
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => handleQuickNavigation('MeasureRoof')}
            accessibilityRole="button"
            accessibilityLabel="Quick access to measure roof"
          >
            <Text style={styles.quickActionIcon}>📐</Text>
            <Text style={styles.quickActionText}>Quick Measure</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => handleQuickNavigation('Quote')}
            accessibilityRole="button"
            accessibilityLabel="Quick access to get quote"
          >
            <Text style={styles.quickActionIcon}>💰</Text>
            <Text style={styles.quickActionText}>Quick Quote</Text>
          </TouchableOpacity>
        </View>

        {/* Enhanced Main Menu */}
        <MainMenu 
          userRole="user" // This could be determined from user context
          showDevTools={__DEV__}
          onNavigate={(screen) => {
            console.log(`Navigating to: ${screen}`);
          }}
        />

        {/* Menu Toggle for Development */}
        {__DEV__ && (
          <TouchableOpacity
            style={styles.menuToggle}
            onPress={() => setUseEnhancedMenu(!useEnhancedMenu)}
          >
            <Text style={styles.menuToggleText}>
              Switch to {useEnhancedMenu ? 'Legacy' : 'Enhanced'} Menu
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Legacy menu for comparison/fallback
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

      {/* Testing Menu Toggle */}
      <TouchableOpacity
        style={styles.testingToggle}
        onPress={() => setShowTestingMenu(!showTestingMenu)}
      >
        <Text style={styles.testingToggleText}>
          {showTestingMenu ? '▼ Hide Testing Menu' : '▶ Show Testing Menu'}
        </Text>
      </TouchableOpacity>

      {/* Legacy Testing Menu */}
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

      {/* Menu Toggle for Development */}
      {__DEV__ && (
        <TouchableOpacity
          style={styles.menuToggle}
          onPress={() => setUseEnhancedMenu(!useEnhancedMenu)}
        >
          <Text style={styles.menuToggleText}>
            Switch to Enhanced Menu
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Enhanced Menu Styles
  enhancedContainer: {
    flex: 1,
    backgroundColor: theme.colors.gray[50],
  },
  
  enhancedHeader: {
    backgroundColor: theme.colors.primary[600],
    paddingTop: layout.headerHeight,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  
  enhancedLogo: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.md,
    borderWidth: 3,
    borderColor: 'white',
  },
  
  enhancedTitle: {
    ...theme.typography.heading.h2,
    color: 'white',
    textAlign: 'center' as const,
    marginBottom: theme.spacing.xs,
  },
  
  enhancedBrandingIndicator: {
    ...theme.typography.body.small,
    color: theme.colors.primary[100],
    fontWeight: theme.typography.fontWeight.medium as any,
    marginBottom: theme.spacing.sm,
  },
  
  enhancedSubtitle: {
    ...theme.typography.body.regular,
    color: theme.colors.primary[100],
    textAlign: 'center' as const,
    opacity: 0.9,
  },
  
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  
  quickActionButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.md,
    minHeight: 80,
    justifyContent: 'center',
  },
  
  quickActionIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  
  quickActionText: {
    ...theme.typography.body.regular,
    fontWeight: theme.typography.fontWeight.medium as any,
    color: theme.colors.primary[700],
  },
  
  menuToggle: {
    margin: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.info[100],
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.info[300],
  },
  
  menuToggleText: {
    ...theme.typography.body.small,
    color: theme.colors.info[700],
    textAlign: 'center' as const,
    fontWeight: theme.typography.fontWeight.medium as any,
  },

  // Legacy Menu Styles (backward compatibility)
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