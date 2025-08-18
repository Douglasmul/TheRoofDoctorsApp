/**
 * SettingsScreen.tsx
 * 
 * Enterprise-ready application settings and preferences screen with modular components,
 * accessibility features, and state management placeholders.
 * 
 * Features:
 * - Application preferences and configuration
 * - Account and privacy settings
 * - Notification preferences
 * - Data management and sync settings
 * - Theme and display options
 * - Export/import functionality
 * 
 * TODO: Integrate with app-wide settings context
 * TODO: Add settings persistence (AsyncStorage/SecureStore)
 * TODO: Connect to user preferences API
 * TODO: Add settings validation and error handling
 * TODO: Implement theme switching functionality
 * TODO: Add data export/import features
 * TODO: Add biometric authentication settings
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';

// TypeScript interfaces for settings management
interface AppSettings {
  notifications: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    projectUpdates: boolean;
    marketingEmails: boolean;
    reminders: boolean;
  };
  privacy: {
    dataCollection: boolean;
    analytics: boolean;
    crashReporting: boolean;
    locationTracking: boolean;
  };
  display: {
    darkMode: boolean;
    fontSize: 'small' | 'medium' | 'large';
    language: string;
    units: 'metric' | 'imperial';
  };
  data: {
    autoSync: boolean;
    cellularSync: boolean;
    offlineMode: boolean;
    cacheSize: number;
  };
  security: {
    biometricEnabled: boolean;
    autoLock: boolean;
    lockTimeout: number;
    requireAuthForExport: boolean;
  };
}

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  accessibilityLabel?: string;
}

interface SettingsRowProps {
  title: string;
  description?: string;
  value?: string | boolean;
  onPress?: () => void;
  showArrow?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

interface SettingsOptionProps {
  title: string;
  options: string[];
  selectedOption: string;
  onSelect: (option: string) => void;
  accessibilityLabel?: string;
}

// Demo settings data - Replace with actual settings from context/storage
const DEMO_SETTINGS: AppSettings = {
  notifications: {
    pushEnabled: true,
    emailEnabled: true,
    projectUpdates: true,
    marketingEmails: false,
    reminders: true,
  },
  privacy: {
    dataCollection: true,
    analytics: true,
    crashReporting: true,
    locationTracking: false,
  },
  display: {
    darkMode: false,
    fontSize: 'medium',
    language: 'English',
    units: 'imperial',
  },
  data: {
    autoSync: true,
    cellularSync: false,
    offlineMode: true,
    cacheSize: 100,
  },
  security: {
    biometricEnabled: false,
    autoLock: true,
    lockTimeout: 300,
    requireAuthForExport: true,
  },
};

// Get responsive dimensions
const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

/**
 * Reusable SettingsSection component for modular design
 */
const SettingsSection: React.FC<SettingsSectionProps> = ({ 
  title, 
  description, 
  children, 
  accessibilityLabel 
}) => (
  <View 
    style={styles.section}
    accessible={true}
    accessibilityLabel={accessibilityLabel || `${title} settings section`}
    accessibilityRole="region"
  >
    <Text style={styles.sectionTitle}>{title}</Text>
    {description && (
      <Text style={styles.sectionDescription}>{description}</Text>
    )}
    {children}
  </View>
);

/**
 * Settings row component with optional switch or navigation
 */
const SettingsRow: React.FC<SettingsRowProps> = ({
  title,
  description,
  value,
  onPress,
  showArrow = false,
  switchValue,
  onSwitchChange,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const isSwitch = switchValue !== undefined && onSwitchChange !== undefined;
  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={styles.settingsRow}
      onPress={onPress}
      accessible={true}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole={isSwitch ? "switch" : onPress ? "button" : "text"}
    >
      <View style={styles.settingsRowContent}>
        <Text style={styles.settingsRowTitle}>{title}</Text>
        {description && (
          <Text style={styles.settingsRowDescription}>{description}</Text>
        )}
        {value && typeof value === 'string' && (
          <Text style={styles.settingsRowValue}>{value}</Text>
        )}
      </View>
      
      {isSwitch && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#e0e0e0', true: theme.colors.primary }}
          thumbColor={switchValue ? '#fff' : '#f4f3f4'}
          accessible={true}
          accessibilityLabel={`${title} toggle`}
        />
      )}
      
      {showArrow && (
        <Text style={styles.arrow}>›</Text>
      )}
    </Component>
  );
};

/**
 * Settings option selector component
 */
const SettingsOption: React.FC<SettingsOptionProps> = ({
  title,
  options,
  selectedOption,
  onSelect,
  accessibilityLabel,
}) => {
  const handlePress = useCallback(() => {
    Alert.alert(
      title,
      'Select an option',
      options.map(option => ({
        text: option,
    const buttons = options.map((option: string) => ({
      text: option,
      onPress: () => onSelect(option),
      style: 'default',
    })).concat([{ text: 'Cancel', style: 'cancel' }]);
    Alert.alert(
      title,
      'Select an option',
      buttons
    );
  }, [title, options, selectedOption, onSelect]);

  return (
    <SettingsRow
      title={title}
      value={selectedOption}
      onPress={handlePress}
      showArrow={true}
      accessibilityLabel={accessibilityLabel || `${title} setting`}
      accessibilityHint={`Currently set to ${selectedOption}. Tap to change.`}
    />
  );
};

/**
 * Main SettingsScreen component
 */
export default function SettingsScreen() {
  const navigation = useNavigation();
  
  // State management placeholders - TODO: Replace with actual settings context
  const [settings, setSettings] = useState<AppSettings>(DEMO_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);

  // Settings update handlers
  const updateNotificationSetting = useCallback((key: keyof AppSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
    // TODO: Persist to storage and sync with backend
  }, []);

  const updatePrivacySetting = useCallback((key: keyof AppSettings['privacy'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      privacy: { ...prev.privacy, [key]: value }
    }));
    // TODO: Persist to storage and update privacy settings
  }, []);

  const updateDisplaySetting = useCallback((key: keyof AppSettings['display'], value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      display: { ...prev.display, [key]: value }
    }));
    // TODO: Apply theme changes immediately
  }, []);

  const updateDataSetting = useCallback((key: keyof AppSettings['data'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      data: { ...prev.data, [key]: value }
    }));
    // TODO: Update sync settings and apply immediately
  }, []);

  const updateSecuritySetting = useCallback((key: keyof AppSettings['security'], value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      security: { ...prev.security, [key]: value }
    }));
    // TODO: Update security settings and apply immediately
  }, []);

  // Action handlers
  const handleResetSettings = useCallback(() => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default values? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setSettings(DEMO_SETTINGS);
            // TODO: Clear stored settings and reset to defaults
          },
        },
      ]
    );
  }, []);

  const handleExportSettings = useCallback(() => {
    setIsLoading(true);
    // TODO: Implement settings export functionality
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Export Complete', 'Settings have been exported successfully.');
    }, 1000);
  }, []);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data and temporary files. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement cache clearing
            Alert.alert('Cache Cleared', 'All cached data has been cleared.');
          },
        },
      ]
    );
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      accessible={true}
      accessibilityLabel="Settings screen"
    >
      {/* Notifications Settings */}
      <SettingsSection 
        title="Notifications"
        description="Manage how you receive notifications and updates"
      >
        <SettingsRow
          title="Push Notifications"
          description="Receive push notifications on this device"
          switchValue={settings.notifications.pushEnabled}
          onSwitchChange={(value) => updateNotificationSetting('pushEnabled', value)}
        />
        <SettingsRow
          title="Email Notifications"
          description="Receive notifications via email"
          switchValue={settings.notifications.emailEnabled}
          onSwitchChange={(value) => updateNotificationSetting('emailEnabled', value)}
        />
        <SettingsRow
          title="Project Updates"
          description="Get notified about project status changes"
          switchValue={settings.notifications.projectUpdates}
          onSwitchChange={(value) => updateNotificationSetting('projectUpdates', value)}
        />
        <SettingsRow
          title="Marketing Emails"
          description="Receive promotional and marketing emails"
          switchValue={settings.notifications.marketingEmails}
          onSwitchChange={(value) => updateNotificationSetting('marketingEmails', value)}
        />
        <SettingsRow
          title="Reminders"
          description="Get reminded about scheduled tasks and appointments"
          switchValue={settings.notifications.reminders}
          onSwitchChange={(value) => updateNotificationSetting('reminders', value)}
        />
      </SettingsSection>

      {/* Privacy Settings */}
      <SettingsSection 
        title="Privacy & Data"
        description="Control how your data is collected and used"
      >
        <SettingsRow
          title="Data Collection"
          description="Allow app to collect usage data for improvement"
          switchValue={settings.privacy.dataCollection}
          onSwitchChange={(value) => updatePrivacySetting('dataCollection', value)}
        />
        <SettingsRow
          title="Analytics"
          description="Share anonymous analytics to help improve the app"
          switchValue={settings.privacy.analytics}
          onSwitchChange={(value) => updatePrivacySetting('analytics', value)}
        />
        <SettingsRow
          title="Crash Reporting"
          description="Send crash reports to help fix bugs"
          switchValue={settings.privacy.crashReporting}
          onSwitchChange={(value) => updatePrivacySetting('crashReporting', value)}
        />
        <SettingsRow
          title="Location Tracking"
          description="Allow location tracking for enhanced features"
          switchValue={settings.privacy.locationTracking}
          onSwitchChange={(value) => updatePrivacySetting('locationTracking', value)}
        />
      </SettingsSection>

      {/* Display Settings */}
      <SettingsSection 
        title="Display & Appearance"
        description="Customize the app's look and feel"
      >
        <SettingsRow
          title="Dark Mode"
          description="Use dark theme throughout the app"
          switchValue={settings.display.darkMode}
          onSwitchChange={(value) => updateDisplaySetting('darkMode', value)}
        />
        <SettingsOption
          title="Font Size"
          options={['Small', 'Medium', 'Large']}
          selectedOption={settings.display.fontSize.charAt(0).toUpperCase() + settings.display.fontSize.slice(1)}
          onSelect={(option) => updateDisplaySetting('fontSize', option.toLowerCase() as 'small' | 'medium' | 'large')}
        />
        <SettingsOption
          title="Language"
          options={['English', 'Spanish', 'French', 'German']}
          selectedOption={settings.display.language}
          onSelect={(option) => updateDisplaySetting('language', option)}
        />
        <SettingsOption
          title="Units"
          options={['Imperial', 'Metric']}
          selectedOption={settings.display.units.charAt(0).toUpperCase() + settings.display.units.slice(1)}
          onSelect={(option) => updateDisplaySetting('units', option.toLowerCase() as 'metric' | 'imperial')}
        />
      </SettingsSection>

      {/* Data & Sync Settings */}
      <SettingsSection 
        title="Data & Sync"
        description="Manage data synchronization and storage"
      >
        <SettingsRow
          title="Auto Sync"
          description="Automatically sync data when connected to WiFi"
          switchValue={settings.data.autoSync}
          onSwitchChange={(value) => updateDataSetting('autoSync', value)}
        />
        <SettingsRow
          title="Cellular Sync"
          description="Allow syncing over cellular data"
          switchValue={settings.data.cellularSync}
          onSwitchChange={(value) => updateDataSetting('cellularSync', value)}
        />
        <SettingsRow
          title="Offline Mode"
          description="Allow app to work without internet connection"
          switchValue={settings.data.offlineMode}
          onSwitchChange={(value) => updateDataSetting('offlineMode', value)}
        />
        <SettingsRow
          title="Clear Cache"
          description="Free up storage space by clearing cached data"
          onPress={handleClearCache}
          showArrow={true}
          accessibilityHint="Tap to clear all cached data"
        />
      </SettingsSection>

      {/* Security Settings */}
      <SettingsSection 
        title="Security"
        description="Manage app security and access controls"
      >
        <SettingsRow
          title="Biometric Authentication"
          description="Use fingerprint or face recognition to secure the app"
          switchValue={settings.security.biometricEnabled}
          onSwitchChange={(value) => updateSecuritySetting('biometricEnabled', value)}
        />
        <SettingsRow
          title="Auto Lock"
          description="Automatically lock the app when idle"
          switchValue={settings.security.autoLock}
          onSwitchChange={(value) => updateSecuritySetting('autoLock', value)}
        />
        <SettingsRow
          title="Require Auth for Export"
          description="Require authentication before exporting data"
          switchValue={settings.security.requireAuthForExport}
          onSwitchChange={(value) => updateSecuritySetting('requireAuthForExport', value)}
        />
      </SettingsSection>

      {/* Advanced Actions */}
      <SettingsSection 
        title="Advanced"
        description="Additional settings and actions"
      >
        <SettingsRow
          title="Export Settings"
          description="Export current settings configuration"
          onPress={handleExportSettings}
          showArrow={true}
          accessibilityHint="Tap to export settings"
        />
        <SettingsRow
          title="Reset to Defaults"
          description="Reset all settings to their default values"
          onPress={handleResetSettings}
          showArrow={true}
          accessibilityHint="Tap to reset all settings"
        />
      </SettingsSection>

      {/* Version info */}
      <View style={styles.versionInfo}>
        <Text style={styles.versionText}>Version 1.0.0 (Build 1)</Text>
        <Text style={styles.versionText}>© 2025 The Roof Doctors</Text>
      </View>
    </ScrollView>
  );
}

// Responsive and accessible styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 16,
    paddingBottom: 12,
    lineHeight: 20,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  settingsRowContent: {
    flex: 1,
  },
  settingsRowTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  settingsRowDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  settingsRowValue: {
    fontSize: 14,
    color: theme.colors.primary,
    marginTop: 4,
  },
  arrow: {
    fontSize: 20,
    color: '#c0c0c0',
    marginLeft: 8,
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});