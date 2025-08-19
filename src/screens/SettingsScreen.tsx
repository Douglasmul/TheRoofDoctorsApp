/**
 * @fileoverview Comprehensive Settings Screen with full configuration options
 * Enterprise-grade settings management with user preferences, app configuration, and internationalization
 * @version 1.0.0
 * © 2025 The Roof Doctors
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
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme/theme';
import { FormSection, FormPicker, FormButton } from '../components/FormComponents';
import { SuccessMessage, ErrorMessage } from '../components/common/FeedbackMessages';
import { I18nManager } from '../i18n';
import { RootStackParamList } from '../types/navigation';

/**
 * Settings data interface
 */
interface SettingsData {
  // Language & Region
  language: string;
  region: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  
  // Measurement Units
  measurementSystem: 'metric' | 'imperial';
  areaUnits: 'sqm' | 'sqft';
  lengthUnits: 'meters' | 'feet';
  
  // App Preferences
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  
  // AR & Camera
  arQuality: 'low' | 'medium' | 'high';
  autoCapture: boolean;
  gridOverlay: boolean;
  voiceGuidance: boolean;
  
  // Privacy & Security
  dataCollection: boolean;
  analyticsOptIn: boolean;
  locationServices: boolean;
  biometricAuth: boolean;
  
  // Advanced
  developerMode: boolean;
  debugMode: boolean;
  cachingEnabled: boolean;
  offlineMode: boolean;
}

/**
 * Default settings configuration
 */
const DEFAULT_SETTINGS: SettingsData = {
  language: 'en',
  region: 'US',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  measurementSystem: 'imperial',
  areaUnits: 'sqft',
  lengthUnits: 'feet',
  theme: 'light',
  notifications: true,
  pushNotifications: true,
  emailNotifications: false,
  arQuality: 'high',
  autoCapture: false,
  gridOverlay: true,
  voiceGuidance: false,
  dataCollection: true,
  analyticsOptIn: false,
  locationServices: true,
  biometricAuth: false,
  developerMode: false,
  debugMode: false,
  cachingEnabled: true,
  offlineMode: false,
};

/**
 * Comprehensive Settings Screen Component
 */
export default function SettingsScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { t, i18n } = useTranslation();
  
  // State management
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  /**
   * Refresh settings data
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    
    // Simulate loading settings from storage/server
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, this would load settings from AsyncStorage or server
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(false);
    setMessage({ type: 'success', text: t('common.success') });
    
    setRefreshing(false);
  }, [t]);

  /**
   * Update a setting value
   */
  const updateSetting = useCallback(<K extends keyof SettingsData>(
    key: K, 
    value: SettingsData[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    
    // Handle immediate effects for certain settings
    if (key === 'language') {
      I18nManager.changeLanguage(value as string);
    }
  }, []);

  /**
   * Save all settings
   */
  const handleSaveSettings = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, this would save to AsyncStorage and/or server
      // await AsyncStorage.setItem('userSettings', JSON.stringify(settings));
      
      setHasChanges(false);
      setMessage({ type: 'success', text: t('settings.saveSuccess') });
      
      // Announce for accessibility
      I18nManager.announceForAccessibility(t('settings.saveSuccess'));
      
    } catch (error) {
      setMessage({ type: 'error', text: t('settings.saveError') });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset settings to defaults
   */
  const handleResetSettings = () => {
    Alert.alert(
      t('settings.reset.title'),
      t('settings.reset.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('settings.reset.confirm'), 
          style: 'destructive',
          onPress: () => {
            setSettings(DEFAULT_SETTINGS);
            setHasChanges(true);
            setMessage({ type: 'success', text: t('settings.reset.success') });
          }
        },
      ]
    );
  };

  /**
   * Language options
   */
  const languageOptions = I18nManager.getAvailableLanguages().map(lang => ({
    label: `${lang.name} (${lang.nativeName})`,
    value: lang.code,
  }));

  /**
   * Render a setting row with switch
   */
  const renderSwitchSetting = (
    key: keyof SettingsData,
    label: string,
    description?: string
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      <Switch
        value={settings[key] as boolean}
        onValueChange={(value) => updateSetting(key, value as any)}
        trackColor={{ false: '#767577', true: theme.colors.primary }}
        thumbColor={settings[key] ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  /**
   * Render a setting row with picker
   */
  const renderPickerSetting = (
    key: keyof SettingsData,
    label: string,
    options: { label: string; value: string }[],
    description?: string
  ) => (
    <View style={styles.settingRowVertical}>
      <Text style={styles.settingLabel}>{label}</Text>
      {description && (
        <Text style={styles.settingDescription}>{description}</Text>
      )}
      <FormPicker
        label=""
        value={settings[key] as string}
        onValueChange={(value) => updateSetting(key, value as any)}
        options={options}
        style={styles.pickerContainer}
      />
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
        <Text style={styles.subtitle}>{t('settings.subtitle')}</Text>
      </View>

      {/* Messages */}
      {message && (
        <View style={styles.messageContainer}>
          {message.type === 'success' ? (
            <SuccessMessage
              title={t('common.success')}
              message={message.text}
              onDismiss={() => setMessage(null)}
            />
          ) : (
            <ErrorMessage
              title={t('common.error')}
              message={message.text}
              onDismiss={() => setMessage(null)}
            />
          )}
        </View>
      )}

      {/* Language & Region Settings */}
      <FormSection title={t('settings.language.title')}>
        {renderPickerSetting(
          'language',
          t('settings.language.language'),
          languageOptions,
          t('settings.language.languageDescription')
        )}
        
        {renderPickerSetting(
          'timeFormat',
          t('settings.language.timeFormat'),
          [
            { label: t('settings.language.time12h'), value: '12h' },
            { label: t('settings.language.time24h'), value: '24h' },
          ]
        )}
      </FormSection>

      {/* Measurement Units */}
      <FormSection title={t('settings.units.title')}>
        {renderPickerSetting(
          'measurementSystem',
          t('settings.units.system'),
          [
            { label: t('settings.units.imperial'), value: 'imperial' },
            { label: t('settings.units.metric'), value: 'metric' },
          ],
          t('settings.units.systemDescription')
        )}
        
        {renderPickerSetting(
          'areaUnits',
          t('settings.units.area'),
          [
            { label: t('settings.units.squareFeet'), value: 'sqft' },
            { label: t('settings.units.squareMeters'), value: 'sqm' },
          ]
        )}
      </FormSection>

      {/* App Preferences */}
      <FormSection title={t('settings.app.title')}>
        {renderPickerSetting(
          'theme',
          t('settings.app.theme'),
          [
            { label: t('settings.app.themeLight'), value: 'light' },
            { label: t('settings.app.themeDark'), value: 'dark' },
            { label: t('settings.app.themeAuto'), value: 'auto' },
          ]
        )}
        
        {renderSwitchSetting(
          'notifications',
          t('settings.app.notifications'),
          t('settings.app.notificationsDescription')
        )}
        
        {renderSwitchSetting(
          'pushNotifications',
          t('settings.app.pushNotifications'),
          t('settings.app.pushNotificationsDescription')
        )}
      </FormSection>

      {/* AR & Camera Settings */}
      <FormSection title={t('settings.ar.title')}>
        {renderPickerSetting(
          'arQuality',
          t('settings.ar.quality'),
          [
            { label: t('settings.ar.qualityHigh'), value: 'high' },
            { label: t('settings.ar.qualityMedium'), value: 'medium' },
            { label: t('settings.ar.qualityLow'), value: 'low' },
          ],
          t('settings.ar.qualityDescription')
        )}
        
        {renderSwitchSetting(
          'autoCapture',
          t('settings.ar.autoCapture'),
          t('settings.ar.autoCaptureDescription')
        )}
        
        {renderSwitchSetting(
          'gridOverlay',
          t('settings.ar.gridOverlay'),
          t('settings.ar.gridOverlayDescription')
        )}
        
        {renderSwitchSetting(
          'voiceGuidance',
          t('settings.ar.voiceGuidance'),
          t('settings.ar.voiceGuidanceDescription')
        )}
      </FormSection>

      {/* Privacy & Security */}
      <FormSection title={t('settings.privacy.title')}>
        {renderSwitchSetting(
          'locationServices',
          t('settings.privacy.location'),
          t('settings.privacy.locationDescription')
        )}
        
        {renderSwitchSetting(
          'dataCollection',
          t('settings.privacy.dataCollection'),
          t('settings.privacy.dataCollectionDescription')
        )}
        
        {renderSwitchSetting(
          'analyticsOptIn',
          t('settings.privacy.analytics'),
          t('settings.privacy.analyticsDescription')
        )}
      </FormSection>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        {hasChanges && (
          <FormButton
            title={t('settings.save')}
            onPress={handleSaveSettings}
            loading={isLoading}
            style={styles.actionButton}
          />
        )}
        
        <FormButton
          title={t('settings.reset.title')}
          onPress={handleResetSettings}
          variant="outline"
          style={styles.actionButton}
        />
        
        <FormButton
          title={t('navigation.profile')}
          onPress={() => navigation.navigate('Profile')}
          variant="secondary"
          style={styles.actionButton}
        />
      </View>
    </ScrollView>
  );
}

/**
 * Styles for the SettingsScreen
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    opacity: 0.8,
  },
  messageContainer: {
    marginBottom: 16,
  },
  
  // Setting row styles
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.text + '20',
  },
  settingRowVertical: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.text + '20',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: theme.colors.text,
    opacity: 0.7,
    lineHeight: 20,
  },
  pickerContainer: {
    marginTop: 8,
  },
  
  // Actions styles
  actionsSection: {
    marginTop: 32,
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
});