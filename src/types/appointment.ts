/**
 * @fileoverview Appointment system types and interfaces
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

// Appointment status types
export type AppointmentStatus = 
  | 'pending'
  | 'confirmed' 
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

// Appointment priority levels
export type AppointmentPriority = 'low' | 'medium' | 'high' | 'urgent';

// Appointment types
export type AppointmentType = 
  | 'inspection'
  | 'measurement'
  | 'estimate'
  | 'consultation'
  | 'repair'
  | 'installation'
  | 'follow_up';

// Contact information for appointment
export interface AppointmentContact {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}

// Appointment reminder settings
export interface AppointmentReminder {
  id: string;
  appointmentId: string;
  type: 'email' | 'sms' | 'push';
  scheduledFor: Date;
  message: string;
  sent: boolean;
  sentAt?: Date;
}

// Main appointment interface
export interface Appointment {
  id: string;
  title: string;
  description?: string;
  type: AppointmentType;
  status: AppointmentStatus;
  priority: AppointmentPriority;
  
  // Scheduling
  scheduledFor: Date;
  duration: number; // in minutes
  timeZone: string;
  
  // Contact and location
  contact: AppointmentContact;
  
  // Assignment
  assignedTo?: string; // User ID of assigned contractor/inspector
  assignedBy?: string; // User ID who assigned the appointment
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
  
  // Related data
  measurementId?: string; // If related to a measurement
  quoteId?: string; // If related to a quote
  
  // Reminders
  reminders: AppointmentReminder[];
  
  // Notes and attachments
  notes?: string;
  attachments?: string[]; // File URLs or IDs
  
  // Offline sync
  syncStatus?: 'synced' | 'pending' | 'failed';
  lastSyncAt?: Date;
}

// Appointment availability slot
export interface AvailabilitySlot {
  id: string;
  date: Date;
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  duration: number; // in minutes
  available: boolean;
  assignedTo?: string; // User ID
  blockedReason?: string;
}

// Appointment booking request
export interface AppointmentBookingRequest {
  title: string;
  description?: string;
  type: AppointmentType;
  priority?: AppointmentPriority;
  scheduledFor: Date;
  duration: number;
  contact: AppointmentContact;
  assignedTo?: string;
  notes?: string;
  reminders?: Omit<AppointmentReminder, 'id' | 'appointmentId' | 'sent' | 'sentAt'>[];
}

// Appointment update request
export interface AppointmentUpdateRequest {
  title?: string;
  description?: string;
  type?: AppointmentType;
  status?: AppointmentStatus;
  priority?: AppointmentPriority;
  scheduledFor?: Date;
  duration?: number;
  contact?: Partial<AppointmentContact>;
  assignedTo?: string;
  notes?: string;
}

// Appointment filter options
export interface AppointmentFilters {
  status?: AppointmentStatus[];
  type?: AppointmentType[];
  priority?: AppointmentPriority[];
  assignedTo?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

// Appointment statistics
export interface AppointmentStats {
  total: number;
  byStatus: Record<AppointmentStatus, number>;
  byType: Record<AppointmentType, number>;
  byPriority: Record<AppointmentPriority, number>;
  upcomingToday: number;
  upcomingWeek: number;
  overdue: number;
}

// Calendar view types
export type CalendarView = 'day' | 'week' | 'month' | 'agenda';

// Calendar event for appointment
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: AppointmentType;
  status: AppointmentStatus;
  priority: AppointmentPriority;
  contact: string; // Contact name
  location: string; // Address string
  color?: string; // For visual distinction
}

// Notification preferences for appointments
export interface AppointmentNotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  reminderTimes: number[]; // Minutes before appointment [1440, 60, 15]
  statusUpdates: boolean;
  assignmentChanges: boolean;
}

// Error types for appointment operations
export class AppointmentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppointmentError';
  }
}

// Appointment conflict detection
export interface AppointmentConflict {
  conflictingAppointmentId: string;
  type: 'time_overlap' | 'double_booking' | 'resource_conflict';
  message: string;
  suggestedAlternatives?: Date[];
}