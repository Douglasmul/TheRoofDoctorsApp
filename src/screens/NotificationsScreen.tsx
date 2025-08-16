/**
 * NotificationsScreen.tsx
 * 
 * Enterprise-ready notification management center with modular components,
 * accessibility features, and state management placeholders.
 * 
 * Features:
 * - Real-time notification feed
 * - Notification categories and filtering
 * - Mark as read/unread functionality
 * - Notification preferences
 * - Push notification settings
 * - Archive and delete functionality
 * 
 * TODO: Integrate with push notification service
 * TODO: Add real-time notification updates
 * TODO: Connect to notification backend API
 * TODO: Implement notification scheduling
 * TODO: Add notification analytics
 * TODO: Add custom notification sounds
 * TODO: Implement notification grouping
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';

// TypeScript interfaces for notification management
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'project' | 'system' | 'reminder';
  timestamp: string;
  isRead: boolean;
  isArchived: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  metadata?: {
    projectId?: string;
    userId?: string;
    [key: string]: any;
  };
}

interface NotificationStats {
  total: number;
  unread: number;
  archived: number;
  byType: Record<string, number>;
}

interface NotificationFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  accessibilityLabel?: string;
}

interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
  onMarkRead: (id: string, isRead: boolean) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

interface NotificationHeaderProps {
  stats: NotificationStats;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

// Demo notifications data - Replace with actual notifications from backend
const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Project Update Required',
    message: 'Project "Downtown Office Building" requires your attention. Please update the roof measurements.',
    type: 'project',
    timestamp: '2024-01-15T14:30:00Z',
    isRead: false,
    isArchived: false,
    priority: 'high',
    metadata: { projectId: 'proj_123' },
  },
  {
    id: '2',
    title: 'New Quote Request',
    message: 'A new quote request has been submitted for residential roofing work.',
    type: 'info',
    timestamp: '2024-01-15T12:15:00Z',
    isRead: false,
    isArchived: false,
    priority: 'medium',
  },
  {
    id: '3',
    title: 'Measurement Completed',
    message: 'Roof measurement for "Warehouse Complex" has been completed successfully.',
    type: 'success',
    timestamp: '2024-01-15T10:45:00Z',
    isRead: true,
    isArchived: false,
    priority: 'low',
    metadata: { projectId: 'proj_456' },
  },
  {
    id: '4',
    title: 'Weather Alert',
    message: 'Heavy rain expected in your area. Consider rescheduling outdoor work.',
    type: 'warning',
    timestamp: '2024-01-15T09:00:00Z',
    isRead: false,
    isArchived: false,
    priority: 'medium',
  },
  {
    id: '5',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur tonight from 2-4 AM EST. Some features may be unavailable.',
    type: 'system',
    timestamp: '2024-01-14T16:00:00Z',
    isRead: true,
    isArchived: false,
    priority: 'low',
  },
  {
    id: '6',
    title: 'Reminder: Training Session',
    message: 'Your mandatory safety training session is scheduled for tomorrow at 10 AM.',
    type: 'reminder',
    timestamp: '2024-01-14T08:00:00Z',
    isRead: false,
    isArchived: false,
    priority: 'high',
  },
];

// Get responsive dimensions
const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

// Notification type icons and colors
const getNotificationStyle = (type: Notification['type'], priority: Notification['priority']) => {
  const typeStyles = {
    info: { icon: '📋', color: '#2196F3' },
    warning: { icon: '⚠️', color: '#FF9800' },
    error: { icon: '❌', color: '#F44336' },
    success: { icon: '✅', color: '#4CAF50' },
    project: { icon: '🏗️', color: theme.colors.primary },
    system: { icon: '⚙️', color: '#9E9E9E' },
    reminder: { icon: '🔔', color: theme.colors.accent },
  };

  const priorityOpacity = {
    low: 0.7,
    medium: 0.85,
    high: 1,
    urgent: 1,
  };

  return {
    ...typeStyles[type],
    opacity: priorityOpacity[priority],
    borderColor: priority === 'urgent' ? '#F44336' : 'transparent',
  };
};

/**
 * Notification filter component
 */
const NotificationFilter: React.FC<NotificationFilterProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  accessibilityLabel,
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={styles.filterContainer}
    contentContainerStyle={styles.filterContent}
    accessible={true}
    accessibilityLabel={accessibilityLabel || "Notification filters"}
  >
    {categories.map((category) => (
      <TouchableOpacity
        key={category}
        style={[
          styles.filterButton,
          selectedCategory === category && styles.filterButtonActive,
        ]}
        onPress={() => onCategorySelect(category)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Filter by ${category}`}
        accessibilityState={{ selected: selectedCategory === category }}
      >
        <Text
          style={[
            styles.filterButtonText,
            selectedCategory === category && styles.filterButtonTextActive,
          ]}
        >
          {category}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

/**
 * Notification header component with stats and actions
 */
const NotificationHeader: React.FC<NotificationHeaderProps> = ({
  stats,
  onMarkAllRead,
  onClearAll,
}) => (
  <View style={styles.headerContainer}>
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.total}</Text>
        <Text style={styles.statLabel}>Total</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: theme.colors.accent }]}>
          {stats.unread}
        </Text>
        <Text style={styles.statLabel}>Unread</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.archived}</Text>
        <Text style={styles.statLabel}>Archived</Text>
      </View>
    </View>
    
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onMarkAllRead}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Mark all as read"
      >
        <Text style={styles.actionButtonText}>Mark All Read</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, styles.secondaryButton]}
        onPress={onClearAll}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Clear all notifications"
      >
        <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
          Clear All
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

/**
 * Individual notification item component
 */
const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onMarkRead,
  onArchive,
  onDelete,
}) => {
  const notificationStyle = getNotificationStyle(notification.type, notification.priority);
  const timeAgo = getTimeAgo(notification.timestamp);

  const handleLongPress = useCallback(() => {
    Alert.alert(
      'Notification Actions',
      notification.title,
      [
        {
          text: notification.isRead ? 'Mark as Unread' : 'Mark as Read',
          onPress: () => onMarkRead(notification.id, !notification.isRead),
        },
        {
          text: 'Archive',
          onPress: () => onArchive(notification.id),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(notification.id),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [notification, onMarkRead, onArchive, onDelete]);

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !notification.isRead && styles.notificationItemUnread,
        notification.priority === 'urgent' && styles.notificationItemUrgent,
      ]}
      onPress={() => onPress(notification)}
      onLongPress={handleLongPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${notification.title}. ${notification.message}`}
      accessibilityHint={`${notification.isRead ? 'Read' : 'Unread'} ${notification.type} notification. Long press for options.`}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationIcon}>{notificationStyle.icon}</Text>
          <View style={styles.notificationMeta}>
            <Text style={styles.notificationTitle} numberOfLines={1}>
              {notification.title}
            </Text>
            <Text style={styles.notificationTime}>{timeAgo}</Text>
          </View>
          {!notification.isRead && <View style={styles.unreadDot} />}
        </View>
        
        <Text 
          style={styles.notificationMessage} 
          numberOfLines={2}
        >
          {notification.message}
        </Text>
        
        {notification.priority === 'urgent' && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentBadgeText}>URGENT</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

/**
 * Utility function to calculate time ago
 */
function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return time.toLocaleDateString();
}

/**
 * Main NotificationsScreen component
 */
export default function NotificationsScreen() {
  const navigation = useNavigation();
  
  // State management placeholders - TODO: Replace with actual notification context/Redux
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate notification statistics
  const stats: NotificationStats = React.useMemo(() => {
    const filtered = notifications.filter(n => !n.isArchived);
    return {
      total: filtered.length,
      unread: filtered.filter(n => !n.isRead).length,
      archived: notifications.filter(n => n.isArchived).length,
      byType: filtered.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }, [notifications]);

  // Filter categories
  const categories = React.useMemo(() => {
    const types = ['All', ...Object.keys(stats.byType)];
    return types.map(type => 
      type.charAt(0).toUpperCase() + type.slice(1)
    );
  }, [stats.byType]);

  // Filtered notifications based on selected category
  const filteredNotifications = React.useMemo(() => {
    let filtered = notifications.filter(n => !n.isArchived);
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(n => 
        n.type === selectedCategory.toLowerCase()
      );
    }
    
    return filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [notifications, selectedCategory]);

  // Handlers for notification actions
  const handleNotificationPress = useCallback((notification: Notification) => {
    // Mark as read when opened
    if (!notification.isRead) {
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );
    }

    // TODO: Navigate to specific screen based on notification type/actionUrl
    if (notification.actionUrl) {
      // navigation.navigate(notification.actionUrl);
    }
  }, []);

  const handleMarkRead = useCallback((id: string, isRead: boolean) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead } : n))
    );
    // TODO: Sync with backend
  }, []);

  const handleArchive = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isArchived: true } : n))
    );
    // TODO: Sync with backend
  }, []);

  const handleDelete = useCallback((id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setNotifications(prev => prev.filter(n => n.id !== id));
            // TODO: Sync with backend
          },
        },
      ]
    );
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
    // TODO: Sync with backend
  }, []);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            setNotifications([]);
            // TODO: Sync with backend
          },
        },
      ]
    );
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // TODO: Fetch latest notifications from backend
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, []);

  // TODO: Set up real-time notification listener
  useEffect(() => {
    // TODO: Subscribe to push notifications
    // TODO: Set up WebSocket for real-time updates
    // TODO: Request notification permissions
    
    return () => {
      // TODO: Cleanup subscriptions
    };
  }, []);

  return (
    <View style={styles.container}>
      <NotificationHeader
        stats={stats}
        onMarkAllRead={handleMarkAllRead}
        onClearAll={handleClearAll}
      />
      
      <NotificationFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      <ScrollView
        style={styles.notificationsList}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        accessible={true}
        accessibilityLabel="Notifications list"
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📭</Text>
            <Text style={styles.emptyStateTitle}>No Notifications</Text>
            <Text style={styles.emptyStateMessage}>
              {selectedCategory === 'All' 
                ? "You're all caught up! No notifications to display."
                : `No ${selectedCategory.toLowerCase()} notifications found.`
              }
            </Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onPress={handleNotificationPress}
              onMarkRead={handleMarkRead}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// Responsive and accessible styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
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
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
  },
  filterContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  notificationItemUnread: {
    backgroundColor: '#f8f9ff',
    borderLeftColor: theme.colors.primary,
  },
  notificationItemUrgent: {
    borderWidth: 1,
    borderColor: '#F44336',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  notificationMeta: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accent,
    marginLeft: 8,
    marginTop: 6,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 32,
  },
  urgentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 8,
    marginLeft: 32,
  },
  urgentBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});