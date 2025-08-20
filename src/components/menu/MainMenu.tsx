/**
 * @fileoverview MainMenu component - Enhanced navigation experience
 * Modern, accessible, and responsive main menu with professional UI/UX
 * @version 1.0.0
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MenuSection } from './MenuSection';
import { MenuItem } from './MenuItem';
import { theme } from '../../theme/theme';
import { layout, responsiveStyle } from '../../utils/responsive';

interface MainMenuProps {
  userRole?: 'user' | 'admin' | 'developer';
  showDevTools?: boolean;
  onNavigate?: (screen: string) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  userRole = 'user',
  showDevTools = __DEV__,
  onNavigate,
}) => {
  const navigation = useNavigation();

  const handleNavigation = (screen: string, description?: string) => {
    try {
      if (onNavigate) {
        onNavigate(screen);
      }
      
      // Accessibility announcement
      AccessibilityInfo.announceForAccessibility(
        `Navigating to ${description || screen}`
      );
      
      navigation.navigate(screen as never);
    } catch (error) {
      console.warn('Navigation error:', error);
      AccessibilityInfo.announceForAccessibility('Navigation failed');
    }
  };

  // Core features always visible
  const coreFeatures = [
    {
      title: 'Measure Roof',
      description: 'Use AR technology to measure roofs accurately',
      icon: '📐',
      screen: 'MeasureRoof',
    },
    {
      title: 'Get a Quote',
      description: 'Generate instant quotes for your measurements',
      icon: '💰',
      screen: 'Quote',
    },
    {
      title: 'AR Camera',
      description: 'Advanced augmented reality roof measurement',
      icon: '📷',
      screen: 'RoofARCamera',
    },
  ];

  // User account features
  const accountFeatures = [
    {
      title: 'Profile',
      description: 'Manage your account information',
      icon: '👤',
      screen: 'Profile',
    },
    {
      title: 'Settings',
      description: 'App preferences and configuration',
      icon: '⚙️',
      screen: 'Settings',
    },
    {
      title: 'Notifications',
      description: 'View and manage your notifications',
      icon: '🔔',
      screen: 'Notifications',
      badge: 3, // Example notification count
    },
  ];

  // Authentication features
  const authFeatures = [
    {
      title: 'Sign In',
      description: 'Access your account',
      icon: '🔐',
      screen: 'Login',
    },
    {
      title: 'Sign Up',
      description: 'Create a new account',
      icon: '📝',
      screen: 'Signup',
    },
  ];

  // Business features (role-based)
  const businessFeatures = [
    {
      title: 'Reports',
      description: 'View analytics and measurement history',
      icon: '📊',
      screen: 'Reports',
    },
    ...(userRole === 'admin' ? [{
      title: 'Admin Panel',
      description: 'Administrative controls and user management',
      icon: '🛠️',
      screen: 'Admin',
    }] : []),
  ];

  // Support and help features
  const supportFeatures = [
    {
      title: 'Help & Support',
      description: 'Get assistance and view documentation',
      icon: '❓',
      screen: 'Help',
    },
    {
      title: 'Legal Information',
      description: 'Terms of service and privacy policy',
      icon: '📄',
      screen: 'Legal',
    },
  ];

  // Developer tools (only in development)
  const devFeatures = [
    {
      title: 'Welcome Screen',
      description: 'App introduction and onboarding',
      icon: '👋',
      screen: 'OpenApp',
    },
    {
      title: 'Error Testing',
      description: 'Test error handling and feedback',
      icon: '⚠️',
      screen: 'Error',
      variant: 'warning' as const,
    },
  ];

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      accessibilityRole="menu"
      accessibilityLabel="Main navigation menu"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Navigation</Text>
        <Text style={styles.headerSubtitle}>
          Choose a feature to get started
        </Text>
      </View>

      {/* Core Features - Always expanded */}
      <MenuSection
        title="Core Features"
        icon="🏗️"
        defaultExpanded={true}
        variant="primary"
        testID="core-features-section"
      >
        {coreFeatures.map((feature) => (
          <MenuItem
            key={feature.screen}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
            onPress={() => handleNavigation(feature.screen, feature.title)}
            variant="primary"
            testID={`menu-item-${feature.screen}`}
          />
        ))}
      </MenuSection>

      {/* Account Management */}
      <MenuSection
        title="Account"
        icon="👤"
        defaultExpanded={false}
        variant="secondary"
        testID="account-section"
      >
        {accountFeatures.map((feature) => (
          <MenuItem
            key={feature.screen}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
            onPress={() => handleNavigation(feature.screen, feature.title)}
            badge={feature.badge}
            testID={`menu-item-${feature.screen}`}
          />
        ))}
      </MenuSection>

      {/* Authentication */}
      <MenuSection
        title="Authentication"
        icon="🔐"
        defaultExpanded={false}
        variant="secondary"
        testID="auth-section"
      >
        {authFeatures.map((feature) => (
          <MenuItem
            key={feature.screen}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
            onPress={() => handleNavigation(feature.screen, feature.title)}
            testID={`menu-item-${feature.screen}`}
          />
        ))}
      </MenuSection>

      {/* Business Features */}
      {(userRole === 'admin' || businessFeatures.length > 0) && (
        <MenuSection
          title="Business"
          icon="📊"
          defaultExpanded={false}
          variant="secondary"
          testID="business-section"
        >
          {businessFeatures.map((feature) => (
            <MenuItem
              key={feature.screen}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              onPress={() => handleNavigation(feature.screen, feature.title)}
              testID={`menu-item-${feature.screen}`}
            />
          ))}
        </MenuSection>
      )}

      {/* Support */}
      <MenuSection
        title="Support"
        icon="💬"
        defaultExpanded={false}
        variant="secondary"
        testID="support-section"
      >
        {supportFeatures.map((feature) => (
          <MenuItem
            key={feature.screen}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
            onPress={() => handleNavigation(feature.screen, feature.title)}
            testID={`menu-item-${feature.screen}`}
          />
        ))}
      </MenuSection>

      {/* Developer Tools - Only in development */}
      {showDevTools && (
        <MenuSection
          title="Developer Tools"
          icon="🔧"
          defaultExpanded={false}
          variant="tertiary"
          testID="dev-tools-section"
        >
          {devFeatures.map((feature) => (
            <MenuItem
              key={feature.screen}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              onPress={() => handleNavigation(feature.screen, feature.title)}
              variant={feature.variant || 'secondary'}
              testID={`menu-item-${feature.screen}`}
            />
          ))}
          
          {/* Development notice */}
          <View style={styles.devNotice}>
            <Text style={styles.devNoticeText}>
              🔧 Development tools will be hidden in production builds
            </Text>
          </View>
        </MenuSection>
      )}

      {/* Footer spacing */}
      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray[50],
  },
  
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['2xl'],
  },
  
  header: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  
  headerTitle: {
    ...theme.typography.heading.h2,
    color: theme.colors.gray[800],
    textAlign: 'center' as const,
    marginBottom: theme.spacing.xs,
  },
  
  headerSubtitle: {
    ...theme.typography.body.regular,
    color: theme.colors.gray[600],
    textAlign: 'center' as const,
  },
  
  devNotice: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.warning[50],
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.warning[400],
  },
  
  devNoticeText: {
    ...theme.typography.body.small,
    color: theme.colors.warning[700],
    fontStyle: 'italic',
  },
  
  footer: {
    height: theme.spacing.xl,
  },
});