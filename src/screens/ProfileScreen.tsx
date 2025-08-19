/**
 * @fileoverview Complete Profile Screen with full UI/UX and features
 * Comprehensive user profile management with edit capabilities, avatar, stats, and settings
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
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme/theme';
import { FormField, FormButton, FormSection } from '../components/FormComponents';
import { SuccessMessage, ErrorMessage } from '../components/common/FeedbackMessages';
import { DEMO_PROFILE } from '../constants/demoData';
import { I18nManager } from '../i18n';
import { RootStackParamList } from '../types/navigation';

/**
 * Profile data interface
 */
interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  joinedDate: Date;
  lastActive: Date;
  profilePicture: string | null;
  certifications: string[];
  stats: {
    totalMeasurements: number;
    accuracyRating: number;
    averageProjectSize: number;
  };
}

/**
 * Complete Profile Screen Component
 */
export default function ProfileScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  
  // State management
  const [profile, setProfile] = useState<ProfileData>(DEMO_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<ProfileData>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  /**
   * Refresh profile data
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, this would fetch fresh data from the server
    // For demo purposes, we'll just reset any local changes
    setProfile(DEMO_PROFILE);
    setMessage({ type: 'success', text: t('common.success') });
    
    setRefreshing(false);
  }, [t]);

  /**
   * Start editing mode
   */
  const handleEditPress = () => {
    setIsEditing(true);
    setEditedProfile({
      name: profile.name,
      email: profile.email,
      company: profile.company,
      role: profile.role,
    });
    setValidationErrors({});
    setMessage(null);
  };

  /**
   * Cancel editing
   */
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProfile({});
    setValidationErrors({});
    setMessage(null);
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!editedProfile.name?.trim()) {
      errors.name = t('profile.edit.validation.nameRequired');
    }

    if (!editedProfile.email?.trim()) {
      errors.email = t('profile.edit.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedProfile.email)) {
      errors.email = t('profile.edit.validation.emailInvalid');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Save profile changes
   */
  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update profile data
      setProfile(prev => ({
        ...prev,
        ...editedProfile,
      }));

      setIsEditing(false);
      setMessage({ type: 'success', text: t('profile.edit.saveSuccess') });
      
      // Announce for accessibility
      I18nManager.announceForAccessibility(t('profile.edit.saveSuccess'));
      
    } catch (error) {
      setMessage({ type: 'error', text: t('profile.edit.saveError') });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle profile photo change
   */
  const handleChangePhoto = () => {
    Alert.alert(
      t('profile.photo.selectSource'),
      '',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('profile.photo.camera'), onPress: () => handlePhotoSource('camera') },
        { text: t('profile.photo.gallery'), onPress: () => handlePhotoSource('gallery') },
      ]
    );
  };

  /**
   * Handle photo source selection
   */
  const handlePhotoSource = (source: 'camera' | 'gallery') => {
    // In a real app, this would open camera or gallery
    // For demo, we'll just show a message
    setMessage({ 
      type: 'success', 
      text: `${t('profile.photo.' + source)} - ${t('common.done')}` 
    });
  };

  /**
   * Handle remove photo
   */
  const handleRemovePhoto = () => {
    Alert.alert(
      t('profile.photo.removeConfirm'),
      '',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('profile.actions.removePhoto'), 
          style: 'destructive',
          onPress: () => {
            setProfile(prev => ({ ...prev, profilePicture: null }));
            setMessage({ type: 'success', text: t('common.success') });
          }
        },
      ]
    );
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    Alert.alert(
      t('profile.actions.logout'),
      '',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('profile.actions.logout'), 
          style: 'destructive',
          onPress: () => {
            // Navigate to login or handle logout
            navigation.navigate('Login');
          }
        },
      ]
    );
  };

  /**
   * Render profile avatar
   */
  const renderAvatar = () => (
    <View style={styles.avatarContainer}>
      <View style={styles.avatarWrapper}>
        {profile.profilePicture ? (
          <Image source={{ uri: profile.profilePicture }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </Text>
          </View>
        )}
        
        {isEditing && (
          <View style={styles.avatarActions}>
            <TouchableOpacity 
              style={styles.avatarActionButton}
              onPress={handleChangePhoto}
            >
              <Text style={styles.avatarActionText}>📷</Text>
            </TouchableOpacity>
            {profile.profilePicture && (
              <TouchableOpacity 
                style={styles.avatarActionButton}
                onPress={handleRemovePhoto}
              >
                <Text style={styles.avatarActionText}>🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );

  /**
   * Render personal information section
   */
  const renderPersonalInfo = () => (
    <FormSection title={t('profile.personalInfo.title')}>
      {isEditing ? (
        <>
          <FormField
            label={t('profile.personalInfo.name')}
            value={editedProfile.name || ''}
            onChangeText={(text) => setEditedProfile(prev => ({ ...prev, name: text }))}
            placeholder={t('profile.personalInfo.name')}
            error={validationErrors.name}
            required
          />
          
          <FormField
            label={t('profile.personalInfo.email')}
            value={editedProfile.email || ''}
            onChangeText={(text) => setEditedProfile(prev => ({ ...prev, email: text }))}
            placeholder={t('profile.personalInfo.email')}
            keyboardType="email-address"
            autoCapitalize="none"
            error={validationErrors.email}
            required
          />
          
          <FormField
            label={t('profile.personalInfo.company')}
            value={editedProfile.company || ''}
            onChangeText={(text) => setEditedProfile(prev => ({ ...prev, company: text }))}
            placeholder={t('profile.personalInfo.company')}
          />
          
          <FormField
            label={t('profile.personalInfo.role')}
            value={editedProfile.role || ''}
            onChangeText={(text) => setEditedProfile(prev => ({ ...prev, role: text }))}
            placeholder={t('profile.personalInfo.role')}
          />
        </>
      ) : (
        <View style={styles.infoGrid}>
          <InfoItem label={t('profile.personalInfo.name')} value={profile.name} />
          <InfoItem label={t('profile.personalInfo.email')} value={profile.email} />
          <InfoItem label={t('profile.personalInfo.company')} value={profile.company} />
          <InfoItem label={t('profile.personalInfo.role')} value={profile.role} />
          <InfoItem 
            label={t('profile.personalInfo.joinedDate')} 
            value={I18nManager.formatDate(profile.joinedDate, { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} 
          />
          <InfoItem 
            label={t('profile.personalInfo.lastActive')} 
            value={I18nManager.formatDate(profile.lastActive, { 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })} 
          />
        </View>
      )}
    </FormSection>
  );

  /**
   * Render statistics section
   */
  const renderStats = () => (
    <FormSection title={t('profile.stats.title')}>
      <View style={styles.statsGrid}>
        <StatCard
          label={t('profile.stats.totalMeasurements')}
          value={profile.stats.totalMeasurements.toString()}
          icon="📏"
        />
        <StatCard
          label={t('profile.stats.accuracyRating')}
          value={`${profile.stats.accuracyRating}%`}
          icon="🎯"
        />
        <StatCard
          label={t('profile.stats.averageProjectSize')}
          value={I18nManager.formatArea(profile.stats.averageProjectSize, 'imperial')}
          icon="🏠"
        />
      </View>
    </FormSection>
  );

  /**
   * Render certifications section
   */
  const renderCertifications = () => (
    <FormSection title={t('profile.certifications.title')}>
      {profile.certifications.length > 0 ? (
        <View style={styles.certificationsList}>
          {profile.certifications.map((cert, index) => (
            <View key={index} style={styles.certificationItem}>
              <Text style={styles.certificationText}>🏆 {cert}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noCertifications}>
          {t('profile.certifications.noCertifications')}
        </Text>
      )}
    </FormSection>
  );

  /**
   * Render action buttons
   */
  const renderActions = () => (
    <View style={styles.actionsSection}>
      {isEditing ? (
        <View style={styles.editActions}>
          <FormButton
            title={t('profile.actions.save')}
            onPress={handleSaveProfile}
            loading={isLoading}
            style={styles.actionButton}
          />
          <FormButton
            title={t('profile.actions.cancel')}
            onPress={handleCancelEdit}
            variant="outline"
            style={styles.actionButton}
          />
        </View>
      ) : (
        <View style={styles.viewActions}>
          <FormButton
            title={t('profile.actions.edit')}
            onPress={handleEditPress}
            style={styles.actionButton}
          />
          <FormButton
            title={t('navigation.settings')}
            onPress={() => navigation.navigate('Settings')}
            variant="secondary"
            style={styles.actionButton}
          />
          <FormButton
            title={t('profile.actions.logout')}
            onPress={handleLogout}
            variant="outline"
            style={styles.actionButton}
          />
        </View>
      )}
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
        <Text style={styles.title}>{t('profile.title')}</Text>
        <Text style={styles.subtitle}>{t('profile.subtitle')}</Text>
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

      {/* Profile Avatar */}
      {renderAvatar()}

      {/* Profile Content */}
      {renderPersonalInfo()}
      {renderStats()}
      {renderCertifications()}
      {renderActions()}
    </ScrollView>
  );
}

/**
 * Info item component for displaying read-only data
 */
interface InfoItemProps {
  label: string;
  value: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

/**
 * Stat card component for displaying statistics
 */
interface StatCardProps {
  label: string;
  value: string;
  icon: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => (
  <View style={styles.statCard}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/**
 * Styles for the ProfileScreen
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
  
  // Avatar styles
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: theme.colors.primary,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: theme.colors.primary,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  avatarActions: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    flexDirection: 'row',
    gap: 8,
  },
  avatarActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarActionText: {
    fontSize: 16,
  },
  
  // Info grid styles
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.text + '20',
  },
  infoLabel: {
    fontSize: 16,
    color: theme.colors.text,
    opacity: 0.7,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  
  // Stats styles
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text,
    textAlign: 'center',
    opacity: 0.7,
  },
  
  // Certifications styles
  certificationsList: {
    gap: 8,
  },
  certificationItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
  },
  certificationText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  noCertifications: {
    fontSize: 16,
    color: theme.colors.text,
    opacity: 0.6,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  
  // Actions styles
  actionsSection: {
    marginTop: 24,
  },
  editActions: {
    gap: 12,
  },
  viewActions: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
});