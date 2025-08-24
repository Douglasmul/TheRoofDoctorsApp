/**
 * @fileoverview Enterprise Appointment Service with offline support
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import {
  Appointment,
  AppointmentBookingRequest,
  AppointmentUpdateRequest,
  AppointmentFilters,
  AppointmentStats,
  AvailabilitySlot,
  AppointmentConflict,
  AppointmentError,
  AppointmentStatus,
  AppointmentNotificationSettings,
  CalendarEvent,
  CalendarView
} from '../types/appointment';

// Offline operation types
interface OfflineAppointmentOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'status_change';
  appointmentId?: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  priority: number;
}

// Sync status information
interface SyncStatus {
  lastSync: Date | null;
  pendingOperations: number;
  inProgress: boolean;
  error: string | null;
}

/**
 * Enterprise Appointment Service
 * Handles appointment operations with offline support and encryption
 */
class AppointmentService {
  private baseURL = process.env.EXPO_PUBLIC_API_URL || 'https://api.theroofDoctors.com';
  private offlineQueue: OfflineAppointmentOperation[] = [];
  private isOnline = true;
  private syncStatus: SyncStatus = {
    lastSync: null,
    pendingOperations: 0,
    inProgress: false,
    error: null
  };

  // Storage keys
  private readonly STORAGE_KEYS = {
    APPOINTMENTS: 'appointments_cache',
    OFFLINE_QUEUE: 'appointment_offline_queue',
    AVAILABILITY: 'availability_cache',
    SETTINGS: 'appointment_notification_settings',
    SYNC_STATUS: 'appointment_sync_status'
  };

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize the service
   */
  private async initializeService() {
    await this.loadOfflineQueue();
    await this.loadSyncStatus();
    this.checkConnectivity();
    
    // Set up periodic sync
    setInterval(() => {
      if (this.isOnline && this.offlineQueue.length > 0) {
        this.processOfflineQueue();
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Check network connectivity
   */
  private async checkConnectivity() {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'HEAD',
        timeout: 5000
      });
      this.isOnline = response.ok;
    } catch {
      this.isOnline = false;
    }
  }

  /**
   * Encrypt sensitive appointment data
   */
  private async encryptData(data: string): Promise<string> {
    try {
      // Generate a random key for this data
      const key = await Crypto.getRandomBytesAsync(32);
      const keyBase64 = Crypto.getRandomValues(key).join('');
      
      // For demo purposes, using base64 encoding
      // In production, implement proper AES encryption
      const encrypted = btoa(data);
      
      // Store encryption key securely
      const keyHex = Array.from(key).map(byte => byte.toString(16).padStart(2, '0')).join('');
      
      // For demo purposes, using base64 encoding
      // In production, implement proper AES encryption
      const encrypted = btoa(data);
      
      // Store encryption key securely
      await SecureStore.setItemAsync(`appointment_key_${Date.now()}`, keyHex);
      
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      return btoa(data); // Fallback to base64
    }
  }

  /**
   * Decrypt appointment data
   */
  private async decryptData(encryptedData: string): Promise<string> {
    try {
      // In production, implement proper AES decryption
      return atob(encryptedData);
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedData;
    }
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const authToken = await SecureStore.getItemAsync('auth_token');
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken ? `Bearer ${authToken}` : '',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new AppointmentError(
        `API request failed: ${response.statusText}`,
        `HTTP_${response.status}`,
        { endpoint, status: response.status }
      );
    }

    return response.json();
  }

  /**
   * Add operation to offline queue
   */
  private async addToOfflineQueue(operation: Omit<OfflineAppointmentOperation, 'id'>) {
    const queuedOperation: OfflineAppointmentOperation = {
      ...operation,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.offlineQueue.push(queuedOperation);
    await this.saveOfflineQueue();
    this.updateSyncStatus();
  }

  /**
   * Save offline queue to storage
   */
  private async saveOfflineQueue() {
    try {
      const encrypted = await this.encryptData(JSON.stringify(this.offlineQueue));
      await AsyncStorage.setItem(this.STORAGE_KEYS.OFFLINE_QUEUE, encrypted);
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  /**
   * Load offline queue from storage
   */
  private async loadOfflineQueue() {
    try {
      const encrypted = await AsyncStorage.getItem(this.STORAGE_KEYS.OFFLINE_QUEUE);
      if (encrypted) {
        const decrypted = await this.decryptData(encrypted);
        this.offlineQueue = JSON.parse(decrypted);
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
      this.offlineQueue = [];
    }
  }

  /**
   * Process offline queue when back online
   */
  private async processOfflineQueue() {
    if (!this.isOnline || this.offlineQueue.length === 0 || this.syncStatus.inProgress) {
      return;
    }

    this.syncStatus.inProgress = true;
    this.updateSyncStatus();

    try {
      // Sort by priority and timestamp
      const sortedQueue = [...this.offlineQueue].sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return a.timestamp.getTime() - b.timestamp.getTime();
      });

      for (const operation of sortedQueue) {
        try {
          await this.executeOfflineOperation(operation);
          this.removeFromQueue(operation.id);
        } catch (error) {
          console.error(`Failed to execute offline operation ${operation.id}:`, error);
          operation.retryCount++;
          
          // Remove operations that have failed too many times
          if (operation.retryCount >= 3) {
            this.removeFromQueue(operation.id);
          }
        }
      }

      await this.saveOfflineQueue();
      this.syncStatus.lastSync = new Date();
      this.syncStatus.error = null;
    } catch (error) {
      console.error('Error processing offline queue:', error);
      this.syncStatus.error = error instanceof Error ? error.message : 'Sync failed';
    } finally {
      this.syncStatus.inProgress = false;
      this.updateSyncStatus();
    }
  }

  /**
   * Execute an offline operation
   */
  private async executeOfflineOperation(operation: OfflineAppointmentOperation) {
    switch (operation.type) {
      case 'create':
        await this.apiRequest('/appointments', {
          method: 'POST',
          body: JSON.stringify(operation.data)
        });
        break;
      case 'update':
        await this.apiRequest(`/appointments/${operation.appointmentId}`, {
          method: 'PUT',
          body: JSON.stringify(operation.data)
        });
        break;
      case 'delete':
        await this.apiRequest(`/appointments/${operation.appointmentId}`, {
          method: 'DELETE'
        });
        break;
      case 'status_change':
        await this.apiRequest(`/appointments/${operation.appointmentId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: operation.data.status })
        });
        break;
    }
  }

  /**
   * Remove operation from queue
   */
  private removeFromQueue(operationId: string) {
    this.offlineQueue = this.offlineQueue.filter(op => op.id !== operationId);
  }

  /**
   * Update sync status
   */
  private updateSyncStatus() {
    this.syncStatus.pendingOperations = this.offlineQueue.length;
  }

  /**
   * Save sync status to storage
   */
  private async saveSyncStatus() {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.SYNC_STATUS, JSON.stringify(this.syncStatus));
    } catch (error) {
      console.error('Error saving sync status:', error);
    }
  }

  /**
   * Load sync status from storage
   */
  private async loadSyncStatus() {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.SYNC_STATUS);
      if (stored) {
        this.syncStatus = { ...this.syncStatus, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  }

  /**
   * Cache appointments locally
   */
  private async cacheAppointments(appointments: Appointment[]) {
    try {
      const encrypted = await this.encryptData(JSON.stringify(appointments));
      await AsyncStorage.setItem(this.STORAGE_KEYS.APPOINTMENTS, encrypted);
    } catch (error) {
      console.error('Error caching appointments:', error);
    }
  }

  /**
   * Get cached appointments
   */
  private async getCachedAppointments(): Promise<Appointment[]> {
    try {
      const encrypted = await AsyncStorage.getItem(this.STORAGE_KEYS.APPOINTMENTS);
      if (encrypted) {
        const decrypted = await this.decryptData(encrypted);
        return JSON.parse(decrypted);
      }
    } catch (error) {
      console.error('Error loading cached appointments:', error);
    }
    return [];
  }

  // PUBLIC API METHODS

  /**
   * Create a new appointment
   */
  async createAppointment(request: AppointmentBookingRequest): Promise<Appointment> {
    const appointment: Appointment = {
      id: `appointment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...request,
      status: 'pending',
      priority: request.priority || 'medium',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current_user', // TODO: Get from auth context
      reminders: request.reminders?.map(r => ({
        ...r,
        id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        appointmentId: '',
        sent: false
      })) || [],
      syncStatus: this.isOnline ? 'synced' : 'pending'
    };

    // Set reminder appointment IDs
    appointment.reminders.forEach(reminder => {
      reminder.appointmentId = appointment.id;
    });

    if (this.isOnline) {
      try {
        const response = await this.apiRequest('/appointments', {
          method: 'POST',
          body: JSON.stringify(appointment)
        });
        appointment.id = response.id;
        appointment.syncStatus = 'synced';
        appointment.lastSyncAt = new Date();
      } catch (error) {
        appointment.syncStatus = 'failed';
        await this.addToOfflineQueue({
          type: 'create',
          data: appointment,
          timestamp: new Date(),
          retryCount: 0,
          priority: 1
        });
      }
    } else {
      await this.addToOfflineQueue({
        type: 'create',
        data: appointment,
        timestamp: new Date(),
        retryCount: 0,
        priority: 1
      });
    }

    // Update cache
    const cached = await this.getCachedAppointments();
    cached.push(appointment);
    await this.cacheAppointments(cached);

    return appointment;
  }

  /**
   * Get appointments with filtering
   */
  async getAppointments(filters?: AppointmentFilters): Promise<Appointment[]> {
    let appointments: Appointment[] = [];

    if (this.isOnline) {
      try {
        const queryParams = new URLSearchParams();
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined) {
              queryParams.append(key, JSON.stringify(value));
            }
          });
        }

        appointments = await this.apiRequest(`/appointments?${queryParams.toString()}`);
        await this.cacheAppointments(appointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        appointments = await this.getCachedAppointments();
      }
    } else {
      appointments = await this.getCachedAppointments();
    }

    // Apply client-side filtering if needed
    if (filters) {
      appointments = this.applyFilters(appointments, filters);
    }

    return appointments;
  }

  /**
   * Apply filters to appointments array
   */
  private applyFilters(appointments: Appointment[], filters: AppointmentFilters): Appointment[] {
    return appointments.filter(appointment => {
      if (filters.status && !filters.status.includes(appointment.status)) {
        return false;
      }
      if (filters.type && !filters.type.includes(appointment.type)) {
        return false;
      }
      if (filters.priority && !filters.priority.includes(appointment.priority)) {
        return false;
      }
      if (filters.assignedTo && !filters.assignedTo.includes(appointment.assignedTo || '')) {
        return false;
      }
      if (filters.dateRange) {
        const appointmentDate = new Date(appointment.scheduledFor);
        if (appointmentDate < filters.dateRange.start || appointmentDate > filters.dateRange.end) {
          return false;
        }
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchFields = [
          appointment.title,
          appointment.description || '',
          appointment.contact.name,
          appointment.contact.email,
          appointment.notes || ''
        ];
        if (!searchFields.some(field => field.toLowerCase().includes(query))) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Update an appointment
   */
  async updateAppointment(id: string, updates: AppointmentUpdateRequest): Promise<Appointment> {
    const appointments = await this.getCachedAppointments();
    const appointmentIndex = appointments.findIndex(a => a.id === id);
    
    if (appointmentIndex === -1) {
      throw new AppointmentError('Appointment not found', 'NOT_FOUND', { id });
    }

    const appointment = {
      ...appointments[appointmentIndex],
      ...updates,
      updatedAt: new Date(),
      syncStatus: this.isOnline ? 'synced' : 'pending' as const
    };

    appointments[appointmentIndex] = appointment;

    if (this.isOnline) {
      try {
        await this.apiRequest(`/appointments/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates)
        });
        appointment.syncStatus = 'synced';
        appointment.lastSyncAt = new Date();
      } catch (error) {
        appointment.syncStatus = 'failed';
        await this.addToOfflineQueue({
          type: 'update',
          appointmentId: id,
          data: updates,
          timestamp: new Date(),
          retryCount: 0,
          priority: 1
        });
      }
    } else {
      await this.addToOfflineQueue({
        type: 'update',
        appointmentId: id,
        data: updates,
        timestamp: new Date(),
        retryCount: 0,
        priority: 1
      });
    }

    await this.cacheAppointments(appointments);
    return appointment;
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    return this.updateAppointment(id, { status });
  }

  /**
   * Delete an appointment
   */
  async deleteAppointment(id: string): Promise<void> {
    const appointments = await this.getCachedAppointments();
    const filteredAppointments = appointments.filter(a => a.id !== id);

    if (this.isOnline) {
      try {
        await this.apiRequest(`/appointments/${id}`, { method: 'DELETE' });
      } catch (error) {
        await this.addToOfflineQueue({
          type: 'delete',
          appointmentId: id,
          data: {},
          timestamp: new Date(),
          retryCount: 0,
          priority: 1
        });
      }
    } else {
      await this.addToOfflineQueue({
        type: 'delete',
        appointmentId: id,
        data: {},
        timestamp: new Date(),
        retryCount: 0,
        priority: 1
      });
    }

    await this.cacheAppointments(filteredAppointments);
  }

  /**
   * Get appointment statistics
   */
  async getAppointmentStats(): Promise<AppointmentStats> {
    const appointments = await this.getAppointments();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const stats: AppointmentStats = {
      total: appointments.length,
      byStatus: {
        pending: 0,
        confirmed: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
        rescheduled: 0
      },
      byType: {
        inspection: 0,
        measurement: 0,
        estimate: 0,
        consultation: 0,
        repair: 0,
        installation: 0,
        follow_up: 0
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0
      },
      upcomingToday: 0,
      upcomingWeek: 0,
      overdue: 0
    };

    appointments.forEach(appointment => {
      const appointmentDate = new Date(appointment.scheduledFor);
      
      stats.byStatus[appointment.status]++;
      stats.byType[appointment.type]++;
      stats.byPriority[appointment.priority]++;

      if (appointmentDate >= today && appointmentDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
        stats.upcomingToday++;
      }

      if (appointmentDate >= today && appointmentDate < weekFromNow) {
        stats.upcomingWeek++;
      }

      if (appointmentDate < today && appointment.status !== 'completed' && appointment.status !== 'cancelled') {
        stats.overdue++;
      }
    });

    return stats;
  }

  /**
   * Get availability for date range
   */
  async getAvailability(startDate: Date, endDate: Date, assignedTo?: string): Promise<AvailabilitySlot[]> {
    if (this.isOnline) {
      try {
        const queryParams = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          ...(assignedTo && { assignedTo })
        });

        return await this.apiRequest(`/appointments/availability?${queryParams.toString()}`);
      } catch (error) {
        console.error('Error fetching availability:', error);
      }
    }

    // Fallback: generate basic availability from cached appointments
    const appointments = await this.getCachedAppointments();
    return this.generateBasicAvailability(startDate, endDate, appointments, assignedTo);
  }

  /**
   * Generate basic availability from cached appointments
   */
  private generateBasicAvailability(
    startDate: Date,
    endDate: Date,
    appointments: Appointment[],
    assignedTo?: string
  ): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      // Skip weekends for basic availability
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        for (let hour = 9; hour < 17; hour++) {
          const slotStart = new Date(current);
          slotStart.setHours(hour, 0, 0, 0);
          
          const slotEnd = new Date(slotStart);
          slotEnd.setHours(hour + 1);

          const hasConflict = appointments.some(apt => {
            const aptStart = new Date(apt.scheduledFor);
            const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);
            
            return (
              (assignedTo ? apt.assignedTo === assignedTo : true) &&
              ((aptStart <= slotStart && aptEnd > slotStart) ||
               (aptStart < slotEnd && aptEnd >= slotEnd) ||
               (aptStart >= slotStart && aptEnd <= slotEnd))
            );
          });

          slots.push({
            id: `slot_${slotStart.getTime()}`,
            date: new Date(current),
            startTime: `${hour.toString().padStart(2, '0')}:00`,
            endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
            duration: 60,
            available: !hasConflict,
            assignedTo,
            ...(hasConflict && { blockedReason: 'Appointment scheduled' })
          });
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return slots;
  }

  /**
   * Check for appointment conflicts
   */
  async checkConflicts(
    appointmentId: string | null,
    scheduledFor: Date,
    duration: number,
    assignedTo?: string
  ): Promise<AppointmentConflict[]> {
    const appointments = await this.getAppointments();
    const conflicts: AppointmentConflict[] = [];

    const newStart = new Date(scheduledFor);
    const newEnd = new Date(newStart.getTime() + duration * 60000);

    appointments.forEach(appointment => {
      if (appointment.id === appointmentId) return; // Skip self

      const aptStart = new Date(appointment.scheduledFor);
      const aptEnd = new Date(aptStart.getTime() + appointment.duration * 60000);

      // Check time overlap
      const hasTimeOverlap = (
        (aptStart <= newStart && aptEnd > newStart) ||
        (aptStart < newEnd && aptEnd >= newEnd) ||
        (aptStart >= newStart && aptEnd <= newEnd)
      );

      if (hasTimeOverlap) {
        if (assignedTo && appointment.assignedTo === assignedTo) {
          conflicts.push({
            conflictingAppointmentId: appointment.id,
            type: 'double_booking',
            message: `Double booking conflict with "${appointment.title}" at ${aptStart.toLocaleString()}`,
            suggestedAlternatives: this.generateAlternativeTimes(scheduledFor, duration)
          });
        } else {
          conflicts.push({
            conflictingAppointmentId: appointment.id,
            type: 'time_overlap',
            message: `Time overlap with "${appointment.title}" at ${aptStart.toLocaleString()}`,
            suggestedAlternatives: this.generateAlternativeTimes(scheduledFor, duration)
          });
        }
      }
    });

    return conflicts;
  }

  /**
   * Generate alternative appointment times
   */
  private generateAlternativeTimes(originalTime: Date, duration: number): Date[] {
    const alternatives: Date[] = [];
    const baseDate = new Date(originalTime);
    
    // Generate alternatives within the same day
    for (let hourOffset = 1; hourOffset <= 3; hourOffset++) {
      const alt1 = new Date(baseDate);
      alt1.setHours(alt1.getHours() + hourOffset);
      alternatives.push(alt1);

      const alt2 = new Date(baseDate);
      alt2.setHours(alt2.getHours() - hourOffset);
      if (alt2.getHours() >= 9) { // Business hours
        alternatives.push(alt2);
      }
    }

    // Generate alternatives for next few days
    for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
      const alt = new Date(baseDate);
      alt.setDate(alt.getDate() + dayOffset);
      alternatives.push(alt);
    }

    return alternatives.slice(0, 5); // Return max 5 alternatives
  }

  /**
   * Get calendar events for appointments
   */
  async getCalendarEvents(startDate: Date, endDate: Date, view: CalendarView): Promise<CalendarEvent[]> {
    const appointments = await this.getAppointments({
      dateRange: { start: startDate, end: endDate }
    });

    return appointments.map(appointment => ({
      id: appointment.id,
      title: appointment.title,
      start: new Date(appointment.scheduledFor),
      end: new Date(new Date(appointment.scheduledFor).getTime() + appointment.duration * 60000),
      type: appointment.type,
      status: appointment.status,
      priority: appointment.priority,
      contact: appointment.contact.name,
      location: `${appointment.contact.address.street}, ${appointment.contact.address.city}`,
      color: this.getStatusColor(appointment.status)
    }));
  }

  /**
   * Get color for appointment status
   */
  private getStatusColor(status: AppointmentStatus): string {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      in_progress: '#10b981',
      completed: '#6b7280',
      cancelled: '#ef4444',
      rescheduled: '#8b5cf6'
    };
    return colors[status];
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Force sync with server
   */
  async forceSync(): Promise<void> {
    await this.checkConnectivity();
    if (this.isOnline) {
      await this.processOfflineQueue();
    } else {
      throw new AppointmentError('No internet connection', 'NO_CONNECTION');
    }
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<AppointmentNotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.SETTINGS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }

    // Default settings
    return {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      reminderTimes: [1440, 60, 15], // 24 hours, 1 hour, 15 minutes
      statusUpdates: true,
      assignmentChanges: true
    };
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings: AppointmentNotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
      throw new AppointmentError('Failed to save settings', 'STORAGE_ERROR');
    }
  }
}

// Singleton instance
export const appointmentService = new AppointmentService();
export default appointmentService;