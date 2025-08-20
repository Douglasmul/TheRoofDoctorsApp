/**
 * @fileoverview Enhanced Main Menu with responsive design and accessibility
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  AccessibilityInfo,
  Alert,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCompanyBranding } from '../hooks/useCompanyBranding';
import { useAuth } from '../contexts/AuthContext';
import { useAppointments } from '../contexts/AppointmentContext';

const { width, height } = Dimensions.get('window');

// Menu item interface
interface MenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  screen: string;
  category: string;
  color: string;
  priority: number;
  accessibilityLabel: string;
  accessibilityHint: string;
  badge?: number;
}

// Category interface
interface MenuCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  items: MenuItem[];
}

export default function EnhancedMainMenu() {
  const navigation = useNavigation();
  const { companyInfo } = useCompanyBranding();
  const { user, isAuthenticated } = useAuth();
  const { stats, syncStatus } = useAppointments();
  
  // Accessibility and UI state
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('services');
  const [isTablet, setIsTablet] = useState(width > 768);

  // Check accessibility settings
  useEffect(() => {
    const checkScreenReader = async () => {
      const enabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(enabled);
    };
    
    checkScreenReader();
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', setIsScreenReaderEnabled);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  // Update layout on orientation change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setIsTablet(window.width > 768);
    });
    
    return () => subscription?.remove();
  }, []);

  // Define menu structure
  const menuCategories: MenuCategory[] = [
    {
      id: 'services',
      title: 'Services',
      icon: '🏗️',
      color: '#3b82f6',
      items: [
        {
          id: 'measure_roof',
          title: 'Measure Roof',
          subtitle: 'AR measurement tools',
          icon: '📐',
          screen: 'MeasureRoof',
          category: 'services',
          color: '#3b82f6',
          priority: 1,
          accessibilityLabel: 'Measure Roof',
          accessibilityHint: 'Start roof measurement using AR technology'
        },
        {
          id: 'get_quote',
          title: 'Get Quote',
          subtitle: 'Request pricing',
          icon: '💰',
          screen: 'Quote',
          category: 'services',
          color: '#10b981',
          priority: 2,
          accessibilityLabel: 'Get Quote',
          accessibilityHint: 'Request a price quote for roofing services'
        },
        {
          id: 'calibration',
          title: 'Calibration',
          subtitle: 'Setup measurement tools',
          icon: '⚙️',
          screen: 'Calibration',
          category: 'services',
          color: '#f59e0b',
          priority: 3,
          accessibilityLabel: 'Calibration',
          accessibilityHint: 'Calibrate measurement tools for accuracy'
        }
      ]
    },
    {
      id: 'appointments',
      title: 'Appointments',
      icon: '📅',
      color: '#8b5cf6',
      items: [
        {
          id: 'book_appointment',
          title: 'Book Appointment',
          subtitle: 'Schedule a visit',
          icon: '➕',
          screen: 'AppointmentBooking',
          category: 'appointments',
          color: '#8b5cf6',
          priority: 1,
          accessibilityLabel: 'Book Appointment',
          accessibilityHint: 'Schedule a new appointment'
        },
        {
          id: 'my_appointments',
          title: 'My Appointments',
          subtitle: 'View & manage',
          icon: '📋',
          screen: 'AppointmentManagement',
          category: 'appointments',
          color: '#6366f1',
          priority: 2,
          accessibilityLabel: 'My Appointments',
          accessibilityHint: 'View and manage your scheduled appointments',
          badge: stats?.upcomingToday || 0
        }
      ]
    },
    {
      id: 'profile',
      title: 'Profile',
      icon: '👤',
      color: '#f97316',
      items: [
        {
          id: 'my_profile',
          title: 'My Profile',
          subtitle: 'Account information',
          icon: '👤',
          screen: 'Profile',
          category: 'profile',
          color: '#f97316',
          priority: 1,
          accessibilityLabel: 'My Profile',
          accessibilityHint: 'View and edit your profile information'
        },
        {
          id: 'settings',
          title: 'Settings',
          subtitle: 'App preferences',
          icon: '⚙️',
          screen: 'Settings',
          category: 'profile',
          color: '#6b7280',
          priority: 2,
          accessibilityLabel: 'Settings',
          accessibilityHint: 'Manage app settings and preferences'
        },
        {
          id: 'notifications',
          title: 'Notifications',
          subtitle: 'Alerts & messages',
          icon: '🔔',
          screen: 'Notifications',
          category: 'profile',
          color: '#ef4444',
          priority: 3,
          accessibilityLabel: 'Notifications',
          accessibilityHint: 'View notifications and alerts'
        }
      ]
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: '💬',
      color: '#06b6d4',
      items: [
        {
          id: 'help_support',
          title: 'Help & Support',
          subtitle: 'Get assistance',
          icon: '❓',
          screen: 'Help',
          category: 'help',
          color: '#06b6d4',
          priority: 1,
          accessibilityLabel: 'Help and Support',
          accessibilityHint: 'Get help and support for using the app'
        },
        {
          id: 'reports',
          title: 'Reports',
          subtitle: 'Analytics & data',
          icon: '📊',
          screen: 'Reports',
          category: 'help',
          color: '#8b5cf6',
          priority: 2,
          accessibilityLabel: 'Reports',
          accessibilityHint: 'View analytics and reports'
        },
        {
          id: 'legal',
          title: 'Legal Info',
          subtitle: 'Terms & privacy',
          icon: '📄',
          screen: 'Legal',
          category: 'help',
          color: '#6b7280',
          priority: 3,
          accessibilityLabel: 'Legal Information',
          accessibilityHint: 'View terms of service and privacy policy'
        }
      ]
    }
  ];

  // Get current category
  const currentCategory = menuCategories.find(cat => cat.id === selectedCategory);

  // Handle menu item press
  const handleMenuItemPress = (item: MenuItem) => {
    // Add haptic feedback if available
    if (Platform.OS === 'ios') {
      // Would use Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    navigation.navigate(item.screen as never);
  };

  // Render sync status indicator
  const renderSyncStatus = () => {
    if (syncStatus.pendingOperations === 0) return null;

    return (
      <View style={styles.syncStatusContainer}>
        <Text style={styles.syncStatusText}>
          {syncStatus.inProgress ? '🔄 Syncing...' : `⏳ ${syncStatus.pendingOperations} pending`}
        </Text>
      </View>
    );
  };

  // Render welcome header
  const renderHeader = () => (
    <View style={styles.header}>
      <StatusBar barStyle="light-content" backgroundColor="#234e70" />
      <View style={styles.headerGradient}>
        <View style={styles.headerContent}>
          {companyInfo.logoUri && (
            <Image source={{ uri: companyInfo.logoUri }} style={styles.companyLogo} />
          )}
          <View style={styles.headerText}>
            <Text style={styles.welcomeText}>
              Welcome{isAuthenticated && user ? `, ${user.name}` : ''}
            </Text>
            <Text style={styles.companyName}>{companyInfo.name}</Text>
            {companyInfo.hasCustomBranding && (
              <Text style={styles.brandingIndicator}>Premium Member</Text>
            )}
          </View>
        </View>
        {renderSyncStatus()}
      </View>
    </View>
  );

  // Render category tabs
  const renderCategoryTabs = () => (
    <View style={styles.categoryTabs}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryTabsContent}
      >
        {menuCategories.map((category) => {
          const isSelected = selectedCategory === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryTab,
                isSelected && styles.selectedCategoryTab,
                { borderBottomColor: category.color }
              ]}
              onPress={() => setSelectedCategory(category.id)}
              accessibilityLabel={`${category.title} category`}
              accessibilityHint={`Switch to ${category.title} menu items`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={styles.categoryTabIcon}>{category.icon}</Text>
              <Text 
                style={[
                  styles.categoryTabText,
                  isSelected && styles.selectedCategoryTabText
                ]}
              >
                {category.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // Render menu item
  const renderMenuItem = (item: MenuItem) => {
    const hasLargeTouchTarget = isScreenReaderEnabled || isTablet;
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.menuItem,
          hasLargeTouchTarget && styles.largeMenuItemTouchTarget,
          isTablet && styles.tabletMenuItem
        ]}
        onPress={() => handleMenuItemPress(item)}
        accessibilityLabel={item.accessibilityLabel}
        accessibilityHint={item.accessibilityHint}
        accessibilityRole="button"
        accessible={true}
      >
        <View style={styles.menuItemGradient}>
          <View style={styles.menuItemContent}>
            <View style={[styles.menuItemIcon, { backgroundColor: item.color + '20' }]}>
              <Text style={styles.menuItemIconText}>{item.icon}</Text>
              {item.badge && item.badge > 0 && (
                <View style={styles.menuItemBadge}>
                  <Text style={styles.menuItemBadgeText}>
                    {item.badge > 99 ? '99+' : item.badge.toString()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.menuItemTextContainer}>
              <Text style={styles.menuItemTitle}>{item.title}</Text>
              <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={[styles.menuItemArrow, { color: item.color }]}>›</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render menu grid
  const renderMenuGrid = () => {
    if (!currentCategory) return null;

    const sortedItems = [...currentCategory.items].sort((a, b) => a.priority - b.priority);
    
    return (
      <View style={styles.menuGrid}>
        <Text style={styles.categoryTitle}>
          {currentCategory.icon} {currentCategory.title}
        </Text>
        <View style={[styles.menuItems, isTablet && styles.tabletMenuItems]}>
          {sortedItems.map(renderMenuItem)}
        </View>
      </View>
    );
  };

  // Render quick stats
  const renderQuickStats = () => {
    if (!stats || !isAuthenticated) return null;

    return (
      <View style={styles.quickStats}>
        <Text style={styles.quickStatsTitle}>Quick Overview</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.upcomingToday}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.upcomingWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#ef4444' }]}>{stats.overdue}</Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderCategoryTabs()}
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderQuickStats()}
        {renderMenuGrid()}
        
        {/* Additional spacing for better scrolling */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fc',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
  },
  headerGradient: {
    backgroundColor: '#234e70',
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  companyLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 2,
  },
  brandingIndicator: {
    fontSize: 12,
    color: '#fbbf24',
    fontWeight: '600',
    marginTop: 2,
  },
  syncStatusContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 12,
  },
  syncStatusText: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
  },
  categoryTabs: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoryTabsContent: {
    paddingHorizontal: 4,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    minWidth: 120,
  },
  selectedCategoryTab: {
    borderBottomWidth: 3,
  },
  categoryTabIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  selectedCategoryTabText: {
    color: '#374151',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  quickStats: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickStatsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  menuGrid: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  menuItems: {
    gap: 12,
  },
  tabletMenuItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  menuItem: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tabletMenuItem: {
    width: (width - 72) / 2,
  },
  largeMenuItemTouchTarget: {
    minHeight: 80,
  },
  menuItemGradient: {
    flex: 1,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  menuItemIconText: {
    fontSize: 24,
  },
  menuItemBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  menuItemBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  menuItemArrow: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});

// Export with accessibility wrapper
export { EnhancedMainMenu as default };

// Add display name for debugging
EnhancedMainMenu.displayName = 'EnhancedMainMenu';