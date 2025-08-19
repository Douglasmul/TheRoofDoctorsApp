import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COMPANY_INFO } from '../constants/company';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'contractor' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  lastActive: string;
  measurementCount: number;
  quoteCount: number;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalMeasurements: number;
  totalQuotes: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

type AdminTab = 'overview' | 'users' | 'settings' | 'system';

export default function AdminScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalUsers: 12,
    activeUsers: 8,
    totalMeasurements: 347,
    totalQuotes: 189,
    systemHealth: 'healthy',
  });

  // Mock user data - in real app, this would come from API
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'John Smith',
      email: 'john@roofdoctors.com',
      role: 'admin',
      status: 'active',
      lastActive: '2 hours ago',
      measurementCount: 45,
      quoteCount: 23,
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@roofdoctors.com',
      role: 'manager',
      status: 'active',
      lastActive: '1 day ago',
      measurementCount: 67,
      quoteCount: 34,
    },
    {
      id: '3',
      name: 'Mike Wilson',
      email: 'mike@roofdoctors.com',
      role: 'contractor',
      status: 'active',
      lastActive: '3 hours ago',
      measurementCount: 123,
      quoteCount: 89,
    },
    {
      id: '4',
      name: 'Lisa Brown',
      email: 'lisa@contractor.com',
      role: 'contractor',
      status: 'inactive',
      lastActive: '1 week ago',
      measurementCount: 12,
      quoteCount: 7,
    },
  ]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserAction = (userId: string, action: 'activate' | 'deactivate' | 'delete' | 'edit') => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    switch (action) {
      case 'activate':
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, status: 'active' as const } : u
        ));
        Alert.alert('Success', `${user.name} has been activated.`);
        break;
      
      case 'deactivate':
        Alert.alert(
          'Confirm Deactivation',
          `Are you sure you want to deactivate ${user.name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Deactivate', 
              style: 'destructive',
              onPress: () => {
                setUsers(prev => prev.map(u => 
                  u.id === userId ? { ...u, status: 'inactive' as const } : u
                ));
              }
            },
          ]
        );
        break;
      
      case 'delete':
        Alert.alert(
          'Confirm Deletion',
          `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Delete', 
              style: 'destructive',
              onPress: () => {
                setUsers(prev => prev.filter(u => u.id !== userId));
              }
            },
          ]
        );
        break;
      
      case 'edit':
        Alert.alert('Edit User', `Edit functionality for ${user.name} will be implemented in the next update.`);
        break;
    }
  };

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'admin': return '#dc2626';
      case 'manager': return '#2563eb';
      case 'contractor': return '#059669';
      case 'viewer': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'inactive': return '#6b7280';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const renderOverview = () => (
    <View style={styles.tabContent}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>👥</Text>
          <Text style={styles.statValue}>{adminStats.totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
          <Text style={styles.statSubtext}>{adminStats.activeUsers} active</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📏</Text>
          <Text style={styles.statValue}>{adminStats.totalMeasurements}</Text>
          <Text style={styles.statLabel}>Measurements</Text>
          <Text style={styles.statSubtext}>All time</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>💰</Text>
          <Text style={styles.statValue}>{adminStats.totalQuotes}</Text>
          <Text style={styles.statLabel}>Quotes</Text>
          <Text style={styles.statSubtext}>Generated</Text>
        </View>

        <View style={[styles.statCard, { borderLeftWidth: 4, borderLeftColor: getSystemHealthColor() }]}>
          <Text style={styles.statIcon}>⚡</Text>
          <Text style={[styles.statValue, { color: getSystemHealthColor() }]}>
            {adminStats.systemHealth.toUpperCase()}
          </Text>
          <Text style={styles.statLabel}>System Status</Text>
          <Text style={styles.statSubtext}>All services operational</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setActiveTab('users')}
        >
          <Text style={styles.actionIcon}>👥</Text>
          <Text style={styles.actionText}>Manage Users</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Reports' as never)}
        >
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>View Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={styles.actionIcon}>⚙️</Text>
          <Text style={styles.actionText}>System Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityItem}>
          <Text style={styles.activityText}>Mike Wilson completed 3 measurements</Text>
          <Text style={styles.activityTime}>2 hours ago</Text>
        </View>
        <View style={styles.activityItem}>
          <Text style={styles.activityText}>Sarah Johnson generated quote #1234</Text>
          <Text style={styles.activityTime}>4 hours ago</Text>
        </View>
        <View style={styles.activityItem}>
          <Text style={styles.activityText}>New user Lisa Brown registered</Text>
          <Text style={styles.activityTime}>1 day ago</Text>
        </View>
      </View>
    </View>
  );

  const renderUsers = () => (
    <View style={styles.tabContent}>
      <View style={styles.userHeader}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add User</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.userList}>
        {filteredUsers.map(user => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.userMeta}>
                <View style={[styles.roleTag, { backgroundColor: getRoleColor(user.role) }]}>
                  <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
                </View>
                <View style={[styles.statusTag, { backgroundColor: getStatusColor(user.status) }]}>
                  <Text style={styles.statusText}>{user.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.userStats}>
                {user.measurementCount} measurements • {user.quoteCount} quotes
              </Text>
              <Text style={styles.lastActive}>Last active: {user.lastActive}</Text>
            </View>

            <View style={styles.userActions}>
              {user.status === 'inactive' ? (
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.activateBtn]}
                  onPress={() => handleUserAction(user.id, 'activate')}
                >
                  <Text style={styles.actionBtnText}>Activate</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.deactivateBtn]}
                  onPress={() => handleUserAction(user.id, 'deactivate')}
                >
                  <Text style={styles.actionBtnText}>Deactivate</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.actionBtn, styles.editBtn]}
                onPress={() => handleUserAction(user.id, 'edit')}
              >
                <Text style={styles.actionBtnText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={() => handleUserAction(user.id, 'delete')}
              >
                <Text style={styles.actionBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>System Settings</Text>
      
      <View style={styles.settingSection}>
        <Text style={styles.settingTitle}>Application Settings</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Default Measurement Units</Text>
          <Text style={styles.settingValue}>Imperial (ft/in)</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Auto-backup Frequency</Text>
          <Text style={styles.settingValue}>Daily</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Data Retention Period</Text>
          <Text style={styles.settingValue}>7 years</Text>
        </View>
      </View>

      <View style={styles.settingSection}>
        <Text style={styles.settingTitle}>Security Settings</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Two-Factor Authentication</Text>
          <Text style={styles.settingValue}>Required</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Session Timeout</Text>
          <Text style={styles.settingValue}>8 hours</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Password Policy</Text>
          <Text style={styles.settingValue}>Strong (12+ chars)</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.settingButton}>
        <Text style={styles.settingButtonText}>Update Settings</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSystem = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>System Information</Text>
      
      <View style={styles.systemInfo}>
        <View style={styles.systemItem}>
          <Text style={styles.systemLabel}>App Version:</Text>
          <Text style={styles.systemValue}>{COMPANY_INFO.app.version}</Text>
        </View>
        <View style={styles.systemItem}>
          <Text style={styles.systemLabel}>Database Status:</Text>
          <Text style={[styles.systemValue, { color: '#22c55e' }]}>Connected</Text>
        </View>
        <View style={styles.systemItem}>
          <Text style={styles.systemLabel}>API Status:</Text>
          <Text style={[styles.systemValue, { color: '#22c55e' }]}>Operational</Text>
        </View>
        <View style={styles.systemItem}>
          <Text style={styles.systemLabel}>Last Backup:</Text>
          <Text style={styles.systemValue}>2 hours ago</Text>
        </View>
      </View>

      <View style={styles.systemActions}>
        <TouchableOpacity style={styles.systemButton}>
          <Text style={styles.systemButtonText}>🔄 Force Sync</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.systemButton}>
          <Text style={styles.systemButtonText}>💾 Backup Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.systemButton}>
          <Text style={styles.systemButtonText}>🧹 Clear Cache</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getSystemHealthColor = () => {
    switch (adminStats.systemHealth) {
      case 'healthy': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'users', label: 'Users', icon: '👥' },
    { key: 'settings', label: 'Settings', icon: '⚙️' },
    { key: 'system', label: 'System', icon: '🔧' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'users': return renderUsers();
      case 'settings': return renderSettings();
      case 'system': return renderSystem();
      default: return renderOverview();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <Text style={styles.headerSubtitle}>Manage users and system settings</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.key as AdminTab)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {renderContent()}
      </ScrollView>

      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
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
  header: {
    backgroundColor: '#234e70',
    padding: 24,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e5e7eb',
  },
  tabContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginRight: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#234e70',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#234e70',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  // Overview styles
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
  quickActions: {
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  recentActivity: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  // Users styles
  userHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#234e70',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  userList: {
    flex: 1,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  userStats: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  lastActive: {
    fontSize: 12,
    color: '#9ca3af',
  },
  userActions: {
    gap: 6,
    minWidth: 80,
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
  },
  activateBtn: {
    backgroundColor: '#22c55e',
  },
  deactivateBtn: {
    backgroundColor: '#f59e0b',
  },
  editBtn: {
    backgroundColor: '#3b82f6',
  },
  deleteBtn: {
    backgroundColor: '#ef4444',
  },
  actionBtnText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
  },
  // Settings styles
  settingSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  settingButton: {
    backgroundColor: '#234e70',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  settingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // System styles
  systemInfo: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  systemItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  systemLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  systemValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  systemActions: {
    gap: 12,
  },
  systemButton: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  systemButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  backButton: {
    margin: 16,
    backgroundColor: '#6b7280',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});