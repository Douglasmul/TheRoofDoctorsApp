import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  Badge,
  AccessibilityInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * Notification item interface for enterprise messaging system
 */
interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'quote' | 'system' | 'marketing';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
  actionable: boolean;
  actionUrl?: string;
  actionText?: string;
  category: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Notification statistics interface
 */
interface NotificationStats {
  total: number;
  unread: number;
  categories: Record<string, number>;
  priorities: Record<string, number>;
}

/**
 * Notification filter options
 */
interface NotificationFilters {
  type?: NotificationItem['type'][];
  priority?: NotificationItem['priority'][];
  read?: boolean;
  category?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Available notification categories
 */
const NOTIFICATION_CATEGORIES = [
  { id: 'quotes', name: 'Quotes', color: '#0366d6' },
  { id: 'system', name: 'System', color: '#6a737d' },
  { id: 'updates', name: 'Updates', color: '#28a745' },
  { id: 'marketing', name: 'Marketing', color: '#6f42c1' },
  { id: 'security', name: 'Security', color: '#d73a49' },
];

/**
 * Notification type configurations
 */
const NOTIFICATION_TYPES = {
  info: { icon: 'ℹ️', color: '#0366d6' },
  success: { icon: '✅', color: '#28a745' },
  warning: { icon: '⚠️', color: '#ffc107' },
  error: { icon: '❌', color: '#d73a49' },
  quote: { icon: '📋', color: '#17a2b8' },
  system: { icon: '🔧', color: '#6a737d' },
  marketing: { icon: '📢', color: '#6f42c1' },
};

/**
 * Enterprise-grade Notifications Screen Component
 * 
 * Provides comprehensive notification and messaging management including:
 * - Real-time notification display
 * - Categorized message organization
 * - Priority-based sorting and filtering
 * - Read/unread status management
 * - Bulk operations (mark all read, delete)
 * - Actionable notifications with deep linking
 * - Push notification settings integration
 * - Notification analytics and insights
 * 
 * @component
 * @example
 * ```tsx
 * <NotificationsScreen />
 * ```
 * 
 * @author The Roof Doctors Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */
export default function NotificationsScreen(): JSX.Element {
  const navigation = useNavigation();
  
  // State management
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(false);

  /**
   * Load notifications from API or notification service
   * TODO: Integrate with real-time notification service
   */
  const loadNotifications = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // TODO: Replace with actual notification service
      // const notificationData = await notificationService.getNotifications(filters);
      
      // Mock notifications for development
      const mockNotifications: NotificationItem[] = [
        {
          id: 'notif_001',
          title: 'Quote Request Approved',
          message: 'Your roof inspection quote #QR-2024-001 has been approved. Work can begin on Monday.',
          type: 'success',
          priority: 'high',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          read: false,
          actionable: true,
          actionUrl: '/quotes/QR-2024-001',
          actionText: 'View Quote',
          category: 'quotes',
          sender: {
            id: 'contractor_123',
            name: 'Mike Johnson',
          },
        },
        {
          id: 'notif_002',
          title: 'System Maintenance',
          message: 'Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM EST.',
          type: 'warning',
          priority: 'medium',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          read: true,
          actionable: false,
          category: 'system',
        },
        {
          id: 'notif_003',
          title: 'Payment Reminder',
          message: 'Invoice #INV-2024-045 is due in 3 days. Amount: $2,450.00',
          type: 'warning',
          priority: 'high',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
          read: false,
          actionable: true,
          actionUrl: '/invoices/INV-2024-045',
          actionText: 'Pay Now',
          category: 'quotes',
        },
        {
          id: 'notif_004',
          title: 'New Feature Available',
          message: 'Try our new AR roof measurement tool for more accurate quotes!',
          type: 'info',
          priority: 'low',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          read: false,
          actionable: true,
          actionUrl: '/features/ar-measurement',
          actionText: 'Learn More',
          category: 'updates',
        },
        {
          id: 'notif_005',
          title: 'Security Alert',
          message: 'New device login detected from Chrome on Windows. If this wasn\'t you, please secure your account.',
          type: 'error',
          priority: 'urgent',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
          read: true,
          actionable: true,
          actionUrl: '/security/devices',
          actionText: 'Review',
          category: 'security',
        },
      ];
      
      setNotifications(mockNotifications);
      
      // Calculate stats
      const notificationStats: NotificationStats = {
        total: mockNotifications.length,
        unread: mockNotifications.filter(n => !n.read).length,
        categories: {},
        priorities: {},
      };
      
      mockNotifications.forEach(notification => {
        // Count by category
        notificationStats.categories[notification.category] = 
          (notificationStats.categories[notification.category] || 0) + 1;
        
        // Count by priority
        notificationStats.priorities[notification.priority] = 
          (notificationStats.priorities[notification.priority] || 0) + 1;
      });
      
      setStats(notificationStats);
      
    } catch (error) {
      console.error('Failed to load notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  /**
   * Mark notification as read
   * TODO: Integrate with notification service
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // TODO: Replace with actual API call
      // await notificationService.markAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      
      // Update stats
      setStats(prev => prev ? {
        ...prev,
        unread: prev.unread - 1
      } : null);
      
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      // TODO: Replace with actual API call
      // await notificationService.markAllAsRead();
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      setStats(prev => prev ? { ...prev, unread: 0 } : null);
      
      Alert.alert('Success', 'All notifications marked as read');
      AccessibilityInfo.announceForAccessibility('All notifications marked as read');
      
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  }, []);

  /**
   * Delete notification
   * TODO: Integrate with notification service
   */
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      // TODO: Replace with actual API call
      // await notificationService.deleteNotification(notificationId);
      
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
      
      setStats(prev => prev ? {
        ...prev,
        total: prev.total - 1
      } : null);
      
    } catch (error) {
      console.error('Failed to delete notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  }, []);

  /**
   * Handle notification action (deep link)
   * TODO: Integrate with navigation service
   */
  const handleNotificationAction = useCallback((notification: NotificationItem) => {
    if (!notification.actionable || !notification.actionUrl) return;
    
    // Mark as read when action is taken
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // TODO: Implement deep linking
    Alert.alert(
      'Action',
      `Would navigate to: ${notification.actionUrl}`,
      [{ text: 'OK', style: 'default' }]
    );
  }, [markAsRead]);

  /**
   * Filter notifications based on current filters
   */
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(n => n.category === selectedCategory);
    }
    
    // Filter by read status
    if (showUnreadOnly) {
      filtered = filtered.filter(n => !n.read);
    }
    
    // Sort by priority and timestamp
    filtered.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
    
    return filtered;
  }, [notifications, selectedCategory, showUnreadOnly]);

  /**
   * Format relative time
   */
  const formatRelativeTime = useCallback((date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }, []);

  /**
   * Render notification item
   */
  const renderNotificationItem = useCallback(({ item }: { item: NotificationItem }) => {
    const typeConfig = NOTIFICATION_TYPES[item.type];
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.read && styles.unreadNotification,
          item.priority === 'urgent' && styles.urgentNotification,
        ]}
        onPress={() => {
          if (!item.read) markAsRead(item.id);
        }}
        accessibilityLabel={`${item.title}. ${item.message}. ${item.read ? 'Read' : 'Unread'}`}
        accessibilityHint={item.actionable ? 'Tap to view details' : 'Tap to mark as read'}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationMeta}>
            <Text style={[styles.notificationIcon, { color: typeConfig.color }]}>
              {typeConfig.icon}
            </Text>
            <Text style={styles.notificationTime}>
              {formatRelativeTime(item.timestamp)}
            </Text>
            {item.priority === 'urgent' && (
              <Text style={styles.urgentBadge}>URGENT</Text>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteNotification(item.id)}
            accessibilityLabel="Delete notification"
          >
            <Text style={styles.deleteButtonText}>×</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>
          {item.title}
        </Text>
        
        <Text style={styles.notificationMessage}>
          {item.message}
        </Text>
        
        {item.sender && (
          <Text style={styles.notificationSender}>
            From: {item.sender.name}
          </Text>
        )}
        
        {item.actionable && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleNotificationAction(item)}
            accessibilityLabel={`${item.actionText || 'Take action'}`}
          >
            <Text style={styles.actionButtonText}>
              {item.actionText || 'View'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }, [markAsRead, deleteNotification, formatRelativeTime, handleNotificationAction]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text 
          style={styles.loadingText}
          accessibilityLabel="Loading notifications"
        >
          Loading notifications...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text 
          style={styles.headerTitle}
          accessibilityRole="header"
          accessibilityLevel={1}
        >
          Notifications
        </Text>
        {stats && stats.unread > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
            accessibilityLabel={`Mark all ${stats.unread} notifications as read`}
          >
            <Text style={styles.markAllButtonText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, styles.unreadNumber]}>
              {stats.unread}
            </Text>
            <Text style={styles.statLabel}>Unread</Text>
          </View>
        </View>
      )}

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        style={styles.categoryFilter}
        showsHorizontalScrollIndicator={false}
        accessibilityLabel="Notification categories"
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategory === 'all' && styles.activeCategoryChip
          ]}
          onPress={() => setSelectedCategory('all')}
          accessibilityLabel="Show all notifications"
        >
          <Text style={[
            styles.categoryChipText,
            selectedCategory === 'all' && styles.activeCategoryChipText
          ]}>
            All
          </Text>
        </TouchableOpacity>
        
        {NOTIFICATION_CATEGORIES.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.activeCategoryChip,
              { borderColor: category.color }
            ]}
            onPress={() => setSelectedCategory(category.id)}
            accessibilityLabel={`Show ${category.name} notifications`}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category.id && styles.activeCategoryChipText
            ]}>
              {category.name}
            </Text>
            {stats?.categories[category.id] && (
              <Text style={styles.categoryCount}>
                {stats.categories[category.id]}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filter Toggle */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setShowUnreadOnly(!showUnreadOnly)}
          accessibilityLabel={`${showUnreadOnly ? 'Show all' : 'Show unread only'} notifications`}
        >
          <Text style={[
            styles.filterToggleText,
            showUnreadOnly && styles.activeFilterText
          ]}>
            {showUnreadOnly ? 'Show All' : 'Unread Only'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        style={styles.notificationsList}
        contentContainerStyle={styles.notificationsContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadNotifications(true)}
            tintColor="#234e70"
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {showUnreadOnly ? 'No unread notifications' : 'No notifications'}
            </Text>
          </View>
        )}
        accessibilityLabel="Notifications list"
      />

      {/* Navigation Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Go back"
        accessibilityHint="Return to previous screen"
      >
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fc',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#234e70',
  },
  markAllButton: {
    backgroundColor: '#0366d6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  markAllButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    marginRight: 32,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#234e70',
  },
  unreadNumber: {
    color: '#d73a49',
  },
  statLabel: {
    fontSize: 12,
    color: '#6a737d',
    marginTop: 2,
  },
  categoryFilter: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5da',
    backgroundColor: '#ffffff',
    marginRight: 12,
  },
  activeCategoryChip: {
    backgroundColor: '#0366d6',
    borderColor: '#0366d6',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#24292e',
    fontWeight: '500',
  },
  activeCategoryChipText: {
    color: '#ffffff',
  },
  categoryCount: {
    fontSize: 12,
    color: '#6a737d',
    marginLeft: 8,
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  filterContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  filterToggle: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5da',
  },
  filterToggleText: {
    fontSize: 14,
    color: '#24292e',
  },
  activeFilterText: {
    color: '#0366d6',
    fontWeight: '600',
  },
  notificationsList: {
    flex: 1,
  },
  notificationsContent: {
    paddingHorizontal: 24,
  },
  notificationItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#0366d6',
  },
  urgentNotification: {
    borderLeftColor: '#d73a49',
    backgroundColor: '#ffeaea',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6a737d',
    marginRight: 8,
  },
  urgentBadge: {
    fontSize: 10,
    color: '#d73a49',
    backgroundColor: '#ffeaea',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 20,
    color: '#6a737d',
    fontWeight: 'bold',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#24292e',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#586069',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationSender: {
    fontSize: 12,
    color: '#6a737d',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  actionButton: {
    backgroundColor: '#0366d6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6a737d',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#6a737d',
    paddingVertical: 16,
    margin: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});