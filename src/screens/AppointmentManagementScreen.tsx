/**
 * @fileoverview Appointment Management Screen with calendar view and filtering
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppointments } from '../contexts/AppointmentContext';
import {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  AppointmentPriority,
  AppointmentFilters,
  CalendarView
} from '../types/appointment';

const { width } = Dimensions.get('window');

// Filter modal component
interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: AppointmentFilters | null;
  onApply: (filters: AppointmentFilters | null) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, filters, onApply }) => {
  const [localFilters, setLocalFilters] = useState<AppointmentFilters>(filters || {});

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    onApply(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalHeaderButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filter Appointments</Text>
          <TouchableOpacity onPress={handleApply}>
            <Text style={[styles.modalHeaderButton, styles.modalApplyButton]}>Apply</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Status filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Status</Text>
            <View style={styles.filterOptionsGrid}>
              {(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as AppointmentStatus[]).map(status => {
                const isSelected = localFilters.status?.includes(status) || false;
                return (
                  <TouchableOpacity
                    key={status}
                    style={[styles.filterOption, isSelected && styles.selectedFilterOption]}
                    onPress={() => {
                      const currentStatus = localFilters.status || [];
                      if (isSelected) {
                        setLocalFilters(prev => ({
                          ...prev,
                          status: currentStatus.filter(s => s !== status)
                        }));
                      } else {
                        setLocalFilters(prev => ({
                          ...prev,
                          status: [...currentStatus, status]
                        }));
                      }
                    }}
                  >
                    <Text style={[styles.filterOptionText, isSelected && styles.selectedFilterOptionText]}>
                      {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Type filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Type</Text>
            <View style={styles.filterOptionsGrid}>
              {(['inspection', 'measurement', 'estimate', 'consultation', 'repair', 'installation'] as AppointmentType[]).map(type => {
                const isSelected = localFilters.type?.includes(type) || false;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.filterOption, isSelected && styles.selectedFilterOption]}
                    onPress={() => {
                      const currentType = localFilters.type || [];
                      if (isSelected) {
                        setLocalFilters(prev => ({
                          ...prev,
                          type: currentType.filter(t => t !== type)
                        }));
                      } else {
                        setLocalFilters(prev => ({
                          ...prev,
                          type: [...currentType, type]
                        }));
                      }
                    }}
                  >
                    <Text style={[styles.filterOptionText, isSelected && styles.selectedFilterOptionText]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Priority filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Priority</Text>
            <View style={styles.filterOptionsGrid}>
              {(['low', 'medium', 'high', 'urgent'] as AppointmentPriority[]).map(priority => {
                const isSelected = localFilters.priority?.includes(priority) || false;
                return (
                  <TouchableOpacity
                    key={priority}
                    style={[styles.filterOption, isSelected && styles.selectedFilterOption]}
                    onPress={() => {
                      const currentPriority = localFilters.priority || [];
                      if (isSelected) {
                        setLocalFilters(prev => ({
                          ...prev,
                          priority: currentPriority.filter(p => p !== priority)
                        }));
                      } else {
                        setLocalFilters(prev => ({
                          ...prev,
                          priority: [...currentPriority, priority]
                        }));
                      }
                    }}
                  >
                    <Text style={[styles.filterOptionText, isSelected && styles.selectedFilterOptionText]}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Search query */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Search</Text>
            <TextInput
              style={styles.searchInput}
              value={localFilters.searchQuery || ''}
              onChangeText={(text) => setLocalFilters(prev => ({ ...prev, searchQuery: text }))}
              placeholder="Search appointments..."
              accessibilityLabel="Search appointments"
            />
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function AppointmentManagementScreen() {
  const navigation = useNavigation();
  const {
    appointments,
    isLoading,
    error,
    stats,
    syncStatus,
    filters,
    fetchAppointments,
    fetchStats,
    applyFilters,
    updateAppointmentStatus,
    deleteAppointment,
    syncWithServer,
    clearError,
    refreshData,
    selectAppointment
  } = useAppointments();

  // UI state
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        fetchAppointments(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error loading appointment data:', error);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  const handleSync = useCallback(async () => {
    try {
      await syncWithServer();
      Alert.alert('Success', 'Data synchronized successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync data. Please try again.');
    }
  }, [syncWithServer]);

  const handleStatusUpdate = async (appointmentId: string, newStatus: AppointmentStatus) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      setShowStatusModal(false);
      setSelectedAppointment(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update appointment status');
    }
  };

  const handleDeleteAppointment = (appointment: Appointment) => {
    Alert.alert(
      'Delete Appointment',
      `Are you sure you want to delete "${appointment.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAppointment(appointment.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete appointment');
            }
          }
        }
      ]
    );
  };

  // Get status color
  const getStatusColor = (status: AppointmentStatus): string => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      in_progress: '#10b981',
      completed: '#6b7280',
      cancelled: '#ef4444',
      rescheduled: '#8b5cf6'
    };
    return colors[status];
  };

  // Get priority color
  const getPriorityColor = (priority: AppointmentPriority): string => {
    const colors = {
      low: '#6b7280',
      medium: '#f59e0b',
      high: '#f97316',
      urgent: '#ef4444'
    };
    return colors[priority];
  };

  // Render appointment card
  const renderAppointmentCard = (appointment: Appointment) => {
    const isUpcoming = new Date(appointment.scheduledFor) > new Date();
    const isPending = appointment.syncStatus === 'pending';

    return (
      <TouchableOpacity
        key={appointment.id}
        style={[styles.appointmentCard, isPending && styles.pendingSyncCard]}
        onPress={() => {
          selectAppointment(appointment);
          navigation.navigate('AppointmentDetails' as never, { appointmentId: appointment.id } as never);
        }}
      >
        <View style={styles.appointmentHeader}>
          <View style={styles.appointmentTitleContainer}>
            <Text style={styles.appointmentTitle} numberOfLines={1}>
              {appointment.title}
            </Text>
            {isPending && (
              <View style={styles.syncPendingIndicator}>
                <Text style={styles.syncPendingText}>⏳</Text>
              </View>
            )}
          </View>
          <View style={styles.appointmentActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setSelectedAppointment(appointment);
                setShowStatusModal(true);
              }}
            >
              <Text style={styles.actionButtonText}>📝</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteAppointment(appointment)}
            >
              <Text style={styles.actionButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.appointmentMeta}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(appointment.status) }
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {appointment.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(appointment.priority) }
            ]}
          >
            <Text style={styles.priorityBadgeText}>
              {appointment.priority.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.appointmentType}>
            {appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1)}
          </Text>
        </View>

        <View style={styles.appointmentDetails}>
          <Text style={styles.appointmentDateTime}>
            📅 {new Date(appointment.scheduledFor).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
          <Text style={styles.appointmentDateTime}>
            ⏰ {new Date(appointment.scheduledFor).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })} ({appointment.duration} min)
          </Text>
        </View>

        <View style={styles.appointmentContact}>
          <Text style={styles.contactName}>👤 {appointment.contact.name}</Text>
          <Text style={styles.contactLocation}>
            📍 {appointment.contact.address.city}, {appointment.contact.address.state}
          </Text>
        </View>

        {appointment.description && (
          <Text style={styles.appointmentDescription} numberOfLines={2}>
            {appointment.description}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // Render stats summary
  const renderStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.upcomingToday}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.upcomingWeek}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#ef4444' }]}>{stats.overdue}</Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
      </View>
    );
  };

  // Render sync status
  const renderSyncStatus = () => {
    if (syncStatus.pendingOperations === 0) return null;

    return (
      <TouchableOpacity style={styles.syncStatusContainer} onPress={handleSync}>
        <Text style={styles.syncStatusText}>
          {syncStatus.inProgress ? '🔄 Syncing...' : `⏳ ${syncStatus.pendingOperations} changes pending sync`}
        </Text>
        {!syncStatus.inProgress && (
          <Text style={styles.syncTapText}>Tap to sync</Text>
        )}
      </TouchableOpacity>
    );
  };

  // Status update modal
  const renderStatusModal = () => (
    <Modal visible={showStatusModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.statusModalContainer}>
          <Text style={styles.statusModalTitle}>Update Status</Text>
          <Text style={styles.statusModalSubtitle}>
            {selectedAppointment?.title}
          </Text>
          
          <View style={styles.statusOptions}>
            {(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as AppointmentStatus[]).map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  selectedAppointment?.status === status && styles.currentStatusOption
                ]}
                onPress={() => selectedAppointment && handleStatusUpdate(selectedAppointment.id, status)}
              >
                <View
                  style={[
                    styles.statusOptionDot,
                    { backgroundColor: getStatusColor(status) }
                  ]}
                />
                <Text style={styles.statusOptionText}>
                  {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
                {selectedAppointment?.status === status && (
                  <Text style={styles.currentStatusIndicator}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.statusModalClose}
            onPress={() => {
              setShowStatusModal(false);
              setSelectedAppointment(null);
            }}
          >
            <Text style={styles.statusModalCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Filter today's appointments
  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.scheduledFor);
    const today = new Date();
    return aptDate.toDateString() === today.toDateString();
  });

  // Filter upcoming appointments
  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.scheduledFor);
    const now = new Date();
    return aptDate > now;
  }).sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Appointments</Text>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewToggleButton, view === 'list' && styles.activeViewToggle]}
              onPress={() => setView('list')}
            >
              <Text style={[styles.viewToggleText, view === 'list' && styles.activeViewToggleText]}>
                📋
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleButton, view === 'calendar' && styles.activeViewToggle]}
              onPress={() => setView('calendar')}
            >
              <Text style={[styles.viewToggleText, view === 'calendar' && styles.activeViewToggleText]}>
                📅
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.headerButtonText}>
              🔍 {filters ? 'Filtered' : 'Filter'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, styles.primaryHeaderButton]}
            onPress={() => navigation.navigate('AppointmentBooking' as never)}
          >
            <Text style={[styles.headerButtonText, styles.primaryHeaderButtonText]}>
              + Book
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError} style={styles.errorDismiss}>
            <Text style={styles.errorDismissText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sync status */}
      {renderSyncStatus()}

      {/* Stats */}
      {renderStats()}

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {isLoading && appointments.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading appointments...</Text>
          </View>
        ) : appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Appointments</Text>
            <Text style={styles.emptySubtitle}>
              Tap the "Book" button to schedule your first appointment
            </Text>
          </View>
        ) : (
          <>
            {/* Today's appointments */}
            {todayAppointments.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Today ({todayAppointments.length})</Text>
                {todayAppointments.map(renderAppointmentCard)}
              </View>
            )}

            {/* Upcoming appointments */}
            {upcomingAppointments.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Upcoming ({upcomingAppointments.length})
                </Text>
                {upcomingAppointments.slice(0, 10).map(renderAppointmentCard)}
                {upcomingAppointments.length > 10 && (
                  <Text style={styles.moreText}>
                    And {upcomingAppointments.length - 10} more...
                  </Text>
                )}
              </View>
            )}

            {/* All appointments */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Appointments</Text>
              {appointments.map(renderAppointmentCard)}
            </View>
          </>
        )}
      </ScrollView>

      {/* Filter modal */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={applyFilters}
      />

      {/* Status update modal */}
      {renderStatusModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fc',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#234e70',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 2,
  },
  viewToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeViewToggle: {
    backgroundColor: '#ffffff',
  },
  viewToggleText: {
    fontSize: 16,
  },
  activeViewToggleText: {
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  primaryHeaderButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  primaryHeaderButtonText: {
    color: '#ffffff',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  syncStatusContainer: {
    backgroundColor: '#fef3c7',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  syncStatusText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
  },
  syncTapText: {
    fontSize: 12,
    color: '#92400e',
    textAlign: 'center',
    marginTop: 2,
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pendingSyncCard: {
    borderColor: '#fbbf24',
    backgroundColor: '#fffbeb',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  appointmentTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  syncPendingIndicator: {
    marginLeft: 8,
  },
  syncPendingText: {
    fontSize: 16,
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  actionButtonText: {
    fontSize: 16,
  },
  appointmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  appointmentType: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  appointmentDetails: {
    marginBottom: 8,
  },
  appointmentDateTime: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  appointmentContact: {
    marginBottom: 8,
  },
  contactName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  contactLocation: {
    fontSize: 14,
    color: '#6b7280',
  },
  appointmentDescription: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  moreText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    margin: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
  },
  errorDismiss: {
    padding: 4,
  },
  errorDismissText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: 'bold',
  },
  // Filter modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalHeaderButton: {
    fontSize: 16,
    color: '#3b82f6',
  },
  modalApplyButton: {
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  clearButton: {
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  selectedFilterOption: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectedFilterOptionText: {
    color: '#ffffff',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  // Status modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  statusModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusModalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusOptions: {
    marginBottom: 20,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  currentStatusOption: {
    backgroundColor: '#f0f9ff',
  },
  statusOptionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  currentStatusIndicator: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  statusModalClose: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusModalCloseText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
});