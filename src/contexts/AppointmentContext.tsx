/**
 * @fileoverview Appointment context and provider for state management
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  Appointment,
  AppointmentBookingRequest,
  AppointmentUpdateRequest,
  AppointmentFilters,
  AppointmentStats,
  AvailabilitySlot,
  AppointmentConflict,
  CalendarEvent,
  CalendarView,
  AppointmentNotificationSettings,
  AppointmentStatus
} from '../types/appointment';
import { appointmentService } from '../services/AppointmentService';

// Appointment state interface
interface AppointmentState {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  stats: AppointmentStats | null;
  availability: AvailabilitySlot[];
  calendarEvents: CalendarEvent[];
  selectedAppointment: Appointment | null;
  filters: AppointmentFilters | null;
  syncStatus: {
    lastSync: Date | null;
    pendingOperations: number;
    inProgress: boolean;
    error: string | null;
  };
  notificationSettings: AppointmentNotificationSettings | null;
}

// Appointment actions
type AppointmentAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_APPOINTMENTS'; payload: Appointment[] }
  | { type: 'ADD_APPOINTMENT'; payload: Appointment }
  | { type: 'UPDATE_APPOINTMENT'; payload: { id: string; appointment: Appointment } }
  | { type: 'REMOVE_APPOINTMENT'; payload: string }
  | { type: 'SET_STATS'; payload: AppointmentStats }
  | { type: 'SET_AVAILABILITY'; payload: AvailabilitySlot[] }
  | { type: 'SET_CALENDAR_EVENTS'; payload: CalendarEvent[] }
  | { type: 'SET_SELECTED_APPOINTMENT'; payload: Appointment | null }
  | { type: 'SET_FILTERS'; payload: AppointmentFilters | null }
  | { type: 'SET_SYNC_STATUS'; payload: AppointmentState['syncStatus'] }
  | { type: 'SET_NOTIFICATION_SETTINGS'; payload: AppointmentNotificationSettings };

// Initial state
const initialState: AppointmentState = {
  appointments: [],
  isLoading: false,
  error: null,
  stats: null,
  availability: [],
  calendarEvents: [],
  selectedAppointment: null,
  filters: null,
  syncStatus: {
    lastSync: null,
    pendingOperations: 0,
    inProgress: false,
    error: null
  },
  notificationSettings: null
};

// Appointment reducer
function appointmentReducer(state: AppointmentState, action: AppointmentAction): AppointmentState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_APPOINTMENTS':
      return { ...state, appointments: action.payload, error: null };
    case 'ADD_APPOINTMENT':
      return { 
        ...state, 
        appointments: [...state.appointments, action.payload],
        error: null 
      };
    case 'UPDATE_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.map(apt =>
          apt.id === action.payload.id ? action.payload.appointment : apt
        ),
        selectedAppointment: state.selectedAppointment?.id === action.payload.id 
          ? action.payload.appointment 
          : state.selectedAppointment,
        error: null
      };
    case 'REMOVE_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.filter(apt => apt.id !== action.payload),
        selectedAppointment: state.selectedAppointment?.id === action.payload 
          ? null 
          : state.selectedAppointment,
        error: null
      };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'SET_AVAILABILITY':
      return { ...state, availability: action.payload };
    case 'SET_CALENDAR_EVENTS':
      return { ...state, calendarEvents: action.payload };
    case 'SET_SELECTED_APPOINTMENT':
      return { ...state, selectedAppointment: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.payload };
    case 'SET_NOTIFICATION_SETTINGS':
      return { ...state, notificationSettings: action.payload };
    default:
      return state;
  }
}

// Appointment context interface
interface AppointmentContextType extends AppointmentState {
  // Appointment CRUD operations
  createAppointment: (request: AppointmentBookingRequest) => Promise<Appointment>;
  updateAppointment: (id: string, updates: AppointmentUpdateRequest) => Promise<Appointment>;
  deleteAppointment: (id: string) => Promise<void>;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  
  // Data fetching
  fetchAppointments: (filters?: AppointmentFilters) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchAvailability: (startDate: Date, endDate: Date, assignedTo?: string) => Promise<void>;
  fetchCalendarEvents: (startDate: Date, endDate: Date, view: CalendarView) => Promise<void>;
  
  // Appointment management
  selectAppointment: (appointment: Appointment | null) => void;
  applyFilters: (filters: AppointmentFilters | null) => Promise<void>;
  checkConflicts: (
    appointmentId: string | null,
    scheduledFor: Date,
    duration: number,
    assignedTo?: string
  ) => Promise<AppointmentConflict[]>;
  
  // Sync operations
  syncWithServer: () => Promise<void>;
  
  // Settings
  getNotificationSettings: () => Promise<void>;
  updateNotificationSettings: (settings: AppointmentNotificationSettings) => Promise<void>;
  
  // Utility
  clearError: () => void;
  refreshData: () => Promise<void>;
}

// Create context
const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

// Appointment provider component
export function AppointmentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appointmentReducer, initialState);

  // Initialize data on mount
  useEffect(() => {
    initializeData();
  }, []);

  // Set up periodic sync status updates
  useEffect(() => {
    const interval = setInterval(() => {
      const syncStatus = appointmentService.getSyncStatus();
      dispatch({ type: 'SET_SYNC_STATUS', payload: syncStatus });
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const initializeData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Load initial data
      await Promise.all([
        fetchAppointments(),
        fetchStats(),
        getNotificationSettings()
      ]);
    } catch (error) {
      console.error('Error initializing appointment data:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to initialize' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createAppointment = useCallback(async (request: AppointmentBookingRequest): Promise<Appointment> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const appointment = await appointmentService.createAppointment(request);
      dispatch({ type: 'ADD_APPOINTMENT', payload: appointment });
      
      // Refresh stats
      await fetchStats();
      
      return appointment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create appointment';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const updateAppointment = useCallback(async (id: string, updates: AppointmentUpdateRequest): Promise<Appointment> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const appointment = await appointmentService.updateAppointment(id, updates);
      dispatch({ type: 'UPDATE_APPOINTMENT', payload: { id, appointment } });
      
      // Refresh stats if status changed
      if (updates.status) {
        await fetchStats();
      }
      
      return appointment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update appointment';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const deleteAppointment = useCallback(async (id: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      await appointmentService.deleteAppointment(id);
      dispatch({ type: 'REMOVE_APPOINTMENT', payload: id });
      
      // Refresh stats
      await fetchStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete appointment';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const updateAppointmentStatus = useCallback(async (id: string, status: AppointmentStatus): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const appointment = await appointmentService.updateAppointmentStatus(id, status);
      dispatch({ type: 'UPDATE_APPOINTMENT', payload: { id, appointment } });
      
      // Refresh stats
      await fetchStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update appointment status';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const fetchAppointments = useCallback(async (filters?: AppointmentFilters): Promise<void> => {
    try {
      const appointments = await appointmentService.getAppointments(filters);
      dispatch({ type: 'SET_APPOINTMENTS', payload: appointments });
      
      if (filters) {
        dispatch({ type: 'SET_FILTERS', payload: filters });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch appointments';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const fetchStats = useCallback(async (): Promise<void> => {
    try {
      const stats = await appointmentService.getAppointmentStats();
      dispatch({ type: 'SET_STATS', payload: stats });
    } catch (error) {
      console.error('Error fetching appointment stats:', error);
    }
  }, []);

  const fetchAvailability = useCallback(async (
    startDate: Date, 
    endDate: Date, 
    assignedTo?: string
  ): Promise<void> => {
    try {
      const availability = await appointmentService.getAvailability(startDate, endDate, assignedTo);
      dispatch({ type: 'SET_AVAILABILITY', payload: availability });
    } catch (error) {
      console.error('Error fetching availability:', error);
      dispatch({ type: 'SET_AVAILABILITY', payload: [] });
    }
  }, []);

  const fetchCalendarEvents = useCallback(async (
    startDate: Date, 
    endDate: Date, 
    view: CalendarView
  ): Promise<void> => {
    try {
      const events = await appointmentService.getCalendarEvents(startDate, endDate, view);
      dispatch({ type: 'SET_CALENDAR_EVENTS', payload: events });
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      dispatch({ type: 'SET_CALENDAR_EVENTS', payload: [] });
    }
  }, []);

  const selectAppointment = useCallback((appointment: Appointment | null) => {
    dispatch({ type: 'SET_SELECTED_APPOINTMENT', payload: appointment });
  }, []);

  const applyFilters = useCallback(async (filters: AppointmentFilters | null): Promise<void> => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
    await fetchAppointments(filters || undefined);
  }, [fetchAppointments]);

  const checkConflicts = useCallback(async (
    appointmentId: string | null,
    scheduledFor: Date,
    duration: number,
    assignedTo?: string
  ): Promise<AppointmentConflict[]> => {
    return appointmentService.checkConflicts(appointmentId, scheduledFor, duration, assignedTo);
  }, []);

  const syncWithServer = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await appointmentService.forceSync();
      
      // Refresh data after sync
      await refreshData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const getNotificationSettings = useCallback(async (): Promise<void> => {
    try {
      const settings = await appointmentService.getNotificationSettings();
      dispatch({ type: 'SET_NOTIFICATION_SETTINGS', payload: settings });
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  }, []);

  const updateNotificationSettings = useCallback(async (settings: AppointmentNotificationSettings): Promise<void> => {
    try {
      await appointmentService.updateNotificationSettings(settings);
      dispatch({ type: 'SET_NOTIFICATION_SETTINGS', payload: settings });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update settings';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const refreshData = useCallback(async (): Promise<void> => {
    try {
      await Promise.all([
        fetchAppointments(state.filters || undefined),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error refreshing appointment data:', error);
    }
  }, [state.filters, fetchAppointments, fetchStats]);

  const value: AppointmentContextType = {
    ...state,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    updateAppointmentStatus,
    fetchAppointments,
    fetchStats,
    fetchAvailability,
    fetchCalendarEvents,
    selectAppointment,
    applyFilters,
    checkConflicts,
    syncWithServer,
    getNotificationSettings,
    updateNotificationSettings,
    clearError,
    refreshData
  };

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
}

// Hook to use appointment context
export function useAppointments(): AppointmentContextType {
  const context = useContext(AppointmentContext);
  if (context === undefined) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
}

export default AppointmentContext;