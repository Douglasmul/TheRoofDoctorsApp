/**
 * @fileoverview Comprehensive Settings Screen with full configuration options
 * Enterprise-grade settings management with user preferences, app configuration, and internationalization
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  RefreshControl,
  Image,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../theme/theme';
import { FormSection, FormPicker, FormButton, FormField } from '../components/FormComponents';
import { SuccessMessage, ErrorMessage } from '../components/common/FeedbackMessages';
import { I18nManager } from '../i18n';
import { RootStackParamList } from '../types/navigation';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { useCompanyBranding } from '../hooks/useCompanyBranding';
import { DEFAULT_COMPANY_INFO } from '../constants/company';

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

  // Company settings
  const companySettings = useCompanySettings();
  const [tempCompanyName, setTempCompanyName] = useState('');

  // Company branding state
  const {
    companyInfo,
    settings: brandingSettings,
    updateCompanyName,
    updateCompanyLogo,
    clearBranding,
    isLoading: brandingLoading,
  } = useCompanyBranding();
  
  const [tempBrandingName, setTempBrandingName] = useState('');

  // Initialize temp company name when company settings load
  React.useEffect(() => {
    if (!companySettings.isLoading) {
      setTempCompanyName(companySettings.settings.name || '');
    }
  }, [companySettings.isLoading, companySettings.settings.name]);

  // Initialize temp branding name when branding loads
  useEffect(() => {
    if (brandingSettings.customName) {
      setTempBrandingName(brandingSettings.customName);
    }
  }, [brandingSettings.customName]);

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
   * Handle company name save
   */
  const handleSaveCompanyName = async () => {
    if (tempCompanyName.trim() === companySettings.settings.name) {
      return; // No change
    }

    const success = await companySettings.updateSettings({
      name: tempCompanyName.trim() || undefined,
    });

    if (success) {
      setMessage({ type: 'success', text: 'Company name updated successfully' });
    } else {
      setMessage({ type: 'error', text: 'Failed to update company name' });
    }
  };

  /**
   * Handle logo selection from gallery
   */
  const handleSelectLogo = async () => {
    try {
      // Request permission to access media library
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photo library to select a logo.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for logo
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const success = await companySettings.updateSettings({
          logoUri: result.assets[0].uri,
          logoSource: 'gallery',
        });

        if (success) {
          setMessage({ type: 'success', text: 'Logo updated successfully' });
        } else {
          setMessage({ type: 'error', text: 'Failed to update logo' });
        }
      }
    } catch (error) {
      console.error('Error selecting logo:', error);
      setMessage({ type: 'error', text: 'Failed to select logo' });
    }
  };

  /**
   * Handle logo capture from camera
   */
  const handleCaptureLogo = async () => {
    try {
      // Request permission to access camera
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your camera to take a photo.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for logo
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const success = await companySettings.updateSettings({
          logoUri: result.assets[0].uri,
          logoSource: 'camera',
        });

        if (success) {
          setMessage({ type: 'success', text: 'Logo updated successfully' });
        } else {
          setMessage({ type: 'error', text: 'Failed to update logo' });
        }
      }
    } catch (error) {
      console.error('Error capturing logo:', error);
      setMessage({ type: 'error', text: 'Failed to capture logo' });
    }
  };

  /**
   * Handle logo removal
   */
  const handleRemoveLogo = async () => {
    Alert.alert(
      'Remove Logo',
      'Are you sure you want to remove the custom logo? This will restore the default appearance.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await companySettings.updateSettings({
              logoUri: undefined,
              logoSource: 'default',
            });

            if (success) {
              setMessage({ type: 'success', text: 'Logo removed successfully' });
            } else {
              setMessage({ type: 'error', text: 'Failed to remove logo' });
            }
          },
        },
      ]
    );
  };

  /**
   * Handle company logo selection
   */
  const handleBrandingLogoSelection = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to select a logo image.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3], // More flexible aspect ratio for logos
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await updateCompanyLogo(result.assets[0].uri);
        setMessage({ type: 'success', text: 'Logo updated successfully' });
      }
    } catch (error) {
      console.error('Failed to select logo:', error);
      setMessage({ type: 'error', text: 'Failed to update logo' });
    }
  };

  /**
   * Handle company name update
   */
  const handleBrandingNameUpdate = async () => {
    try {
      await updateCompanyName(tempBrandingName);
      setMessage({ type: 'success', text: 'Company name updated successfully' });
    } catch (error) {
      console.error('Failed to update company name:', error);
      setMessage({ type: 'error', text: 'Failed to update company name' });
    }
  };

  /**
   * Handle clearing all branding
   */
  const handleClearBranding = () => {
    Alert.alert(
      'Clear Branding',
      'Are you sure you want to remove all custom branding? This will restore the default company name and logo.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearBranding();
              setTempBrandingName('');
              setMessage({ type: 'success', text: 'Branding cleared successfully' });
            } catch (error) {
              setMessage({ type: 'error', text: 'Failed to clear branding' });
            }
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

      {/* Company Branding */}
      <FormSection title="Company Branding">
        {/* Current Branding Preview */}
        <View style={styles.brandingPreview}>
          <Text style={styles.brandingPreviewTitle}>Current Branding</Text>
          <View style={styles.brandingPreviewContent}>
            {companyInfo.logoUri ? (
              <Image source={{ uri: companyInfo.logoUri }} style={styles.brandingLogoPreview} />
            ) : (
              <View style={styles.brandingLogoPlaceholder}>
                <Text style={styles.brandingLogoPlaceholderText}>No Logo</Text>
              </View>
            )}
            <View style={styles.brandingInfo}>
              <Text style={styles.companyNamePreview}>{companyInfo.name}</Text>
              <Text style={styles.brandingStatus}>
                {companyInfo.hasCustomBranding ? 'Custom Branding Active' : 'Default Branding'}
              </Text>
            </View>
          </View>
        </View>

        {/* Company Name Input */}
        <View style={styles.settingRowVertical}>
          <Text style={styles.settingLabel}>Company Name</Text>
          <Text style={styles.settingDescription}>
            Enter your company name to customize branding throughout the app
          </Text>
          <View style={styles.companyNameInput}>
            <TextInput
              style={styles.textInput}
              value={tempBrandingName}
              onChangeText={setTempBrandingName}
              placeholder={companyInfo.name}
              placeholderTextColor={theme.colors.text + '60'}
            />
            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleBrandingNameUpdate}
              disabled={!tempBrandingName.trim() || brandingLoading}
            >
              <Text style={styles.updateButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logo Selection */}
        <View style={styles.settingRowVertical}>
          <Text style={styles.settingLabel}>Company Logo</Text>
          <Text style={styles.settingDescription}>
            Select an image to use as your company logo in quotes and headers
          </Text>
          <TouchableOpacity
            style={styles.logoButton}
            onPress={handleBrandingLogoSelection}
            disabled={brandingLoading}
          >
            <Text style={styles.logoButtonText}>
              {companyInfo.logoUri ? 'Change Logo' : 'Select Logo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Clear Branding */}
        {companyInfo.hasCustomBranding && (
          <View style={styles.settingRowVertical}>
            <TouchableOpacity
              style={styles.clearBrandingButton}
              onPress={handleClearBranding}
              disabled={brandingLoading}
            >
              <Text style={styles.clearBrandingButtonText}>Clear Custom Branding</Text>
            </TouchableOpacity>
          </View>
        )}
      </FormSection>

      {/* Company Settings */}
      <FormSection title="Company Settings">
        {/* Company Name */}
        <View style={styles.settingRowVertical}>
          <Text style={styles.settingLabel}>Company Name</Text>
          <Text style={styles.settingDescription}>
            Customize your company name displayed throughout the app
          </Text>
          <View style={styles.companyNameContainer}>
            <FormField
              label=""
              value={tempCompanyName}
              onChangeText={setTempCompanyName}
              placeholder={DEFAULT_COMPANY_INFO.name}
              style={styles.companyNameInput}
            />
            <TouchableOpacity
              style={[
                styles.saveButton,
                tempCompanyName.trim() === companySettings.settings.name && styles.saveButtonDisabled,
              ]}
              onPress={handleSaveCompanyName}
              disabled={tempCompanyName.trim() === companySettings.settings.name}
            >
              <Text style={[
                styles.saveButtonText,
                tempCompanyName.trim() === companySettings.settings.name && styles.saveButtonTextDisabled,
              ]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.currentValue}>
            Current: {companySettings.getEffectiveName(DEFAULT_COMPANY_INFO.name)}
          </Text>
        </View>

        {/* Company Logo */}
        <View style={styles.settingRowVertical}>
          <Text style={styles.settingLabel}>Company Logo</Text>
          <Text style={styles.settingDescription}>
            Upload or capture a custom logo for your company
          </Text>
          
          {/* Logo Preview */}
          <View style={styles.logoContainer}>
            {companySettings.hasCustomLogo() ? (
              <Image
                source={{ uri: companySettings.getEffectiveLogoUri()! }}
                style={styles.logoPreview}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoPlaceholderText}>No Custom Logo</Text>
                <Text style={styles.logoPlaceholderSubtext}>Default appearance will be used</Text>
              </View>
            )}
          </View>

          {/* Logo Actions */}
          <View style={styles.logoActions}>
            <TouchableOpacity
              style={styles.logoActionButton}
              onPress={handleSelectLogo}
            >
              <Text style={styles.logoActionButtonText}>Select from Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.logoActionButton}
              onPress={handleCaptureLogo}
            >
              <Text style={styles.logoActionButtonText}>Take Photo</Text>
            </TouchableOpacity>
            
            {companySettings.hasCustomLogo() && (
              <TouchableOpacity
                style={[styles.logoActionButton, styles.logoRemoveButton]}
                onPress={handleRemoveLogo}
              >
                <Text style={[styles.logoActionButtonText, styles.logoRemoveButtonText]}>Remove Logo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </FormSection>

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
  
  // Company settings styles
  companyNameContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
    gap: 12,
  },
  companyNameInput: {
    flex: 1,
    marginBottom: 0,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.text + '30',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: theme.colors.text + '60',
  },
  currentValue: {
    fontSize: 12,
    color: theme.colors.text,
    opacity: 0.6,
    marginTop: 4,
    fontStyle: 'italic',
  },
  
  // Company branding styles
  brandingPreview: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.text + '20',
  },
  brandingPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  brandingPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandingLogoPreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  brandingLogoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.text + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  brandingLogoPlaceholderText: {
    fontSize: 10,
    color: theme.colors.text,
    opacity: 0.6,
    textAlign: 'center',
  },
  brandingInfo: {
    flex: 1,
  },
  companyNamePreview: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  brandingStatus: {
    fontSize: 12,
    color: theme.colors.primary,
    opacity: 0.8,
  },
  companyNameInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.text + '30',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  updateButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  logoButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  logoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  clearBrandingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  clearBrandingButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  logoContainer: {
    marginTop: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  logoPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.text + '20',
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.text + '20',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.text + '05',
  },
  logoPlaceholderText: {
    fontSize: 11,
    color: theme.colors.text,
    opacity: 0.6,
    textAlign: 'center',
    fontWeight: '500',
  },
  logoPlaceholderSubtext: {
    fontSize: 9,
    color: theme.colors.text,
    opacity: 0.4,
    textAlign: 'center',
    marginTop: 2,
  },
  logoActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  logoActionButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  logoActionButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
  logoRemoveButton: {
    backgroundColor: '#DC3545',
  },
  logoRemoveButtonText: {
    color: 'white',
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