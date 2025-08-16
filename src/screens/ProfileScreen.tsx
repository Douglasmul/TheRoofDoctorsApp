/**
 * ProfileScreen.tsx
 * 
 * Enterprise-ready user profile management screen with modular components,
 * accessibility features, and state management placeholders.
 * 
 * Features:
 * - User profile information display and editing
 * - Avatar/photo management
 * - Account settings quick access
 * - Professional information for contractors
 * - Activity history and statistics
 * 
 * TODO: Integrate with user context/authentication system
 * TODO: Add photo upload functionality
 * TODO: Connect to backend API for profile updates
 * TODO: Add validation for profile fields
 * TODO: Implement profile image cropping/editing
 * TODO: Add professional certifications section
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';

// TypeScript interfaces for type safety
interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  avatar?: string;
  joinedDate: string;
  lastActive: string;
  completedProjects: number;
  totalRevenue: number;
  certifications: string[];
}

interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
  accessibilityLabel?: string;
}

interface QuickActionProps {
  title: string;
  icon: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

// Demo data - Replace with actual user data from context/API
const DEMO_USER_PROFILE: UserProfile = {
  id: 'user_123',
  firstName: 'John',
  lastName: 'Contractor',
  email: 'john.contractor@example.com',
  phone: '+1 (555) 123-4567',
  company: 'Elite Roofing Solutions',
  role: 'Senior Roof Inspector',
  joinedDate: '2023-01-15',
  joinedDate: joinedDate,
  lastActive: lastActive,
  completedProjects: 45,
  totalRevenue: 125000,
  certifications: ['NRCA Certified', 'OSHA 30-Hour', 'Drone Pilot License'],
};

// Get responsive dimensions
const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

/**
 * Reusable ProfileSection component for modular design
 */
const ProfileSection: React.FC<ProfileSectionProps> = ({ 
  title, 
  children, 
  accessibilityLabel 
}) => (
  <View 
    style={styles.section}
    accessible={true}
    accessibilityLabel={accessibilityLabel || `${title} section`}
    accessibilityRole="region"
  >
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

/**
 * Quick action button component
 */
const QuickAction: React.FC<QuickActionProps> = ({ 
  title, 
  icon, 
  onPress, 
  accessibilityLabel 
}) => (
  <TouchableOpacity
    style={styles.quickAction}
    onPress={onPress}
    accessible={true}
    accessibilityLabel={accessibilityLabel || `${title} button`}
    accessibilityRole="button"
    accessibilityHint={`Tap to ${title.toLowerCase()}`}
  >
    <Text style={styles.quickActionIcon}>{icon}</Text>
    <Text style={styles.quickActionText}>{title}</Text>
  </TouchableOpacity>
);

/**
 * Main ProfileScreen component
 */
export default function ProfileScreen() {
  const navigation = useNavigation();
  
  // State management placeholders - TODO: Replace with actual state management
  const [userProfile, setUserProfile] = useState<UserProfile>(DEMO_USER_PROFILE);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Callback handlers for future implementation
  const handleEditProfile = useCallback(() => {
    setIsEditing(!isEditing);
    // TODO: Implement edit mode toggle
  }, [isEditing]);

  const handleSaveProfile = useCallback(() => {
    setIsLoading(true);
    // TODO: Implement profile save to backend
    setTimeout(() => {
      setIsLoading(false);
      setIsEditing(false);
    }, 1000);
  }, []);

  const handleAvatarPress = useCallback(() => {
    // TODO: Implement photo picker/camera functionality
    console.log('Avatar pressed - implement photo selection');
  }, []);

  const handleQuickAction = useCallback((action: string) => {
    // TODO: Implement navigation to specific settings/actions
    console.log(`Quick action: ${action}`);
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      accessible={true}
      accessibilityLabel="Profile screen"
    >
      {/* Header Section with Avatar */}
      <ProfileSection 
        title="Profile Information"
        accessibilityLabel="User profile information section"
      >
        <View style={styles.headerSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleAvatarPress}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Profile picture"
            accessibilityHint="Tap to change profile picture"
          >
            {userProfile.avatar ? (
              <Image source={{ uri: userProfile.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {userProfile.firstName[0]}{userProfile.lastName[0]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {userProfile.firstName} {userProfile.lastName}
            </Text>
            <Text style={styles.userRole}>{userProfile.role}</Text>
            <Text style={styles.userCompany}>{userProfile.company}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isEditing ? "Cancel editing" : "Edit profile"}
          >
            <Text style={styles.editButtonText}>
              {isEditing ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>
      </ProfileSection>

      {/* Contact Information */}
      <ProfileSection title="Contact Information">
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{userProfile.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoValue}>{userProfile.phone}</Text>
        </View>
      </ProfileSection>

      {/* Professional Stats */}
      <ProfileSection title="Professional Statistics">
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userProfile.completedProjects}</Text>
            <Text style={styles.statLabel}>Projects Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              ${userProfile.totalRevenue.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>
        </View>
      </ProfileSection>

      {/* Certifications */}
      <ProfileSection title="Certifications">
        <View style={styles.certificationsContainer}>
          {userProfile.certifications.map((cert, index) => (
            <View key={index} style={styles.certificationTag}>
              <Text style={styles.certificationText}>{cert}</Text>
            </View>
          ))}
        </View>
      </ProfileSection>

      {/* Quick Actions */}
      <ProfileSection title="Quick Actions">
        <View style={styles.quickActionsContainer}>
          <QuickAction
            title="Settings"
            icon="⚙️"
            onPress={() => handleQuickAction('settings')}
            accessibilityLabel="Go to settings"
          />
          <QuickAction
            title="Reports"
            icon="📊"
            onPress={() => handleQuickAction('reports')}
            accessibilityLabel="View reports"
          />
          <QuickAction
            title="Help"
            icon="❓"
            onPress={() => handleQuickAction('help')}
            accessibilityLabel="Get help"
          />
          <QuickAction
            title="Logout"
            icon="🚪"
            onPress={() => handleQuickAction('logout')}
            accessibilityLabel="Logout from account"
          />
        </View>
      </ProfileSection>

      {/* Save button when editing */}
      {isEditing && (
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSaveProfile}
          disabled={isLoading}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Save profile changes"
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      )}
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
    padding: 16,
    marginVertical: 8,
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
    marginBottom: 12,
  },
  headerSection: {
    flexDirection: isTablet ? 'row' : 'column',
    alignItems: isTablet ? 'flex-start' : 'center',
    gap: 16,
  },
  avatarContainer: {
    alignSelf: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    alignItems: isTablet ? 'flex-start' : 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: theme.colors.primary,
    marginBottom: 2,
  },
  userCompany: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: isTablet ? 'flex-start' : 'center',
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    flex: 2,
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  certificationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  certificationTag: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  certificationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: isTablet ? 150 : 120,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});