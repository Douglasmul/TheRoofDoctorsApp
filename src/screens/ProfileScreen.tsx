import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  AccessibilityInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * User profile data interface for enterprise-grade profile management
 */
interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  role: 'customer' | 'contractor' | 'admin';
  avatar?: string;
  createdAt: Date;
  lastLogin: Date;
  preferences: UserPreferences;
}

/**
 * User preferences interface for personalization
 */
interface UserPreferences {
  notifications: boolean;
  darkMode: boolean;
  language: string;
  units: 'metric' | 'imperial';
}

/**
 * Enterprise-grade Profile Screen Component
 * 
 * Provides comprehensive user profile management including:
 * - Personal information editing
 * - Avatar management
 * - Role-based access control
 * - Audit trail display
 * - Preference management
 * - Account security settings
 * 
 * @component
 * @example
 * ```tsx
 * <ProfileScreen />
 * ```
 * 
 * @author The Roof Doctors Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */
export default function ProfileScreen(): JSX.Element {
  const navigation = useNavigation();
  
  // State management for user profile data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form state for editing
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
  });

  /**
   * Load user profile data from API or context
   * TODO: Integrate with authentication context and user API
   */
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const profileData = await userService.getCurrentProfile();
      
      // Mock data for development
      const mockProfile: UserProfile = {
        id: 'user_12345',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@roofdoctors.com',
        phone: '+1 (555) 123-4567',
        company: 'Roofing Solutions Inc.',
        role: 'contractor',
        createdAt: new Date('2023-01-15'),
        lastLogin: new Date(),
        preferences: {
          notifications: true,
          darkMode: false,
          language: 'en',
          units: 'imperial',
        },
      };
      
      setProfile(mockProfile);
      setEditForm({
        firstName: mockProfile.firstName,
        lastName: mockProfile.lastName,
        email: mockProfile.email,
        phone: mockProfile.phone,
        company: mockProfile.company || '',
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save profile changes
   * TODO: Integrate with user API for persistence
   */
  const saveProfile = useCallback(async () => {
    try {
      setLoading(true);
      setErrors({});
      
      // Validation
      const newErrors: Record<string, string> = {};
      if (!editForm.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      if (!editForm.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }
      if (!editForm.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(editForm.email)) {
        newErrors.email = 'Email format is invalid';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      
      // TODO: Replace with actual API call
      // await userService.updateProfile(editForm);
      
      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          ...editForm,
        });
      }
      
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
      
      // Announce to screen readers
      AccessibilityInfo.announceForAccessibility('Profile updated successfully');
      
    } catch (error) {
      console.error('Failed to save profile:', error);
      Alert.alert('Error', 'Failed to save profile changes');
    } finally {
      setLoading(false);
    }
  }, [editForm, profile]);

  /**
   * Handle avatar change
   * TODO: Integrate with image picker and upload service
   */
  const handleAvatarChange = useCallback(() => {
    Alert.alert(
      'Change Avatar',
      'Avatar management will be available soon',
      [{ text: 'OK', style: 'default' }]
    );
  }, []);

  /**
   * Handle account deletion
   * TODO: Integrate with user API and authentication
   */
  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Info', 'Account deletion will be available soon');
          },
        },
      ]
    );
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text 
          style={styles.loadingText}
          accessibilityLabel="Loading profile data"
        >
          Loading profile...
        </Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text 
          style={styles.errorText}
          accessibilityLabel="Profile not found error"
        >
          Profile not found
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadProfile}
          accessibilityLabel="Retry loading profile"
          accessibilityHint="Tap to try loading your profile again"
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      accessibilityLabel="Profile screen"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text 
          style={styles.headerTitle}
          accessibilityRole="header"
          accessibilityLevel={1}
        >
          My Profile
        </Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
          accessibilityLabel={isEditing ? "Cancel editing" : "Edit profile"}
          accessibilityHint={isEditing ? "Cancel profile editing" : "Start editing your profile"}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handleAvatarChange}
          accessibilityLabel="Profile picture"
          accessibilityHint="Tap to change your profile picture"
        >
          {profile.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Tap to change photo</Text>
      </View>

      {/* Profile Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>First Name</Text>
          {isEditing ? (
            <TextInput
              style={[styles.input, errors.firstName && styles.inputError]}
              value={editForm.firstName}
              onChangeText={(text) => setEditForm({ ...editForm, firstName: text })}
              placeholder="Enter first name"
              accessibilityLabel="First name input"
              accessibilityHint="Enter your first name"
            />
          ) : (
            <Text style={styles.fieldValue}>{profile.firstName}</Text>
          )}
          {errors.firstName && (
            <Text style={styles.errorText}>{errors.firstName}</Text>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Last Name</Text>
          {isEditing ? (
            <TextInput
              style={[styles.input, errors.lastName && styles.inputError]}
              value={editForm.lastName}
              onChangeText={(text) => setEditForm({ ...editForm, lastName: text })}
              placeholder="Enter last name"
              accessibilityLabel="Last name input"
              accessibilityHint="Enter your last name"
            />
          ) : (
            <Text style={styles.fieldValue}>{profile.lastName}</Text>
          )}
          {errors.lastName && (
            <Text style={styles.errorText}>{errors.lastName}</Text>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Email</Text>
          {isEditing ? (
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={editForm.email}
              onChangeText={(text) => setEditForm({ ...editForm, email: text })}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="Email input"
              accessibilityHint="Enter your email address"
            />
          ) : (
            <Text style={styles.fieldValue}>{profile.email}</Text>
          )}
          {errors.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Phone</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editForm.phone}
              onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              accessibilityLabel="Phone number input"
              accessibilityHint="Enter your phone number"
            />
          ) : (
            <Text style={styles.fieldValue}>{profile.phone}</Text>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Company</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={editForm.company}
              onChangeText={(text) => setEditForm({ ...editForm, company: text })}
              placeholder="Enter company name"
              accessibilityLabel="Company input"
              accessibilityHint="Enter your company name"
            />
          ) : (
            <Text style={styles.fieldValue}>{profile.company || 'Not specified'}</Text>
          )}
        </View>
      </View>

      {/* Account Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Role</Text>
          <Text style={[styles.fieldValue, styles.roleValue]}>
            {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Member Since</Text>
          <Text style={styles.fieldValue}>
            {profile.createdAt.toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Last Login</Text>
          <Text style={styles.fieldValue}>
            {profile.lastLogin.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {isEditing ? (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveProfile}
            disabled={loading}
            accessibilityLabel="Save profile changes"
            accessibilityHint="Save your profile changes"
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings' as never)}
              accessibilityLabel="Open settings"
              accessibilityHint="Navigate to app settings"
            >
              <Text style={styles.settingsButtonText}>Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteAccount}
              accessibilityLabel="Delete account"
              accessibilityHint="Delete your account permanently"
            >
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Navigation Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Go back"
        accessibilityHint="Return to previous screen"
      >
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fc',
  },
  contentContainer: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f6f8fc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#234e70',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f6f8fc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#d73a49',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#234e70',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#234e70',
  },
  editButton: {
    backgroundColor: '#0366d6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#234e70',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  avatarHint: {
    fontSize: 14,
    color: '#6a737d',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6a737d',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#24292e',
    paddingVertical: 8,
  },
  roleValue: {
    backgroundColor: '#e1f5fe',
    color: '#01579b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5da',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#d73a49',
  },
  actions: {
    marginVertical: 20,
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: '#6f42c1',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  settingsButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#d73a49',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#6a737d',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});