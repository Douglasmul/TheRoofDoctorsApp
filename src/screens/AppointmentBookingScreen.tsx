/**
 * @fileoverview Appointment Booking Screen with calendar integration
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
  Platform,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppointments } from '../contexts/AppointmentContext';
import {
  AppointmentType,
  AppointmentPriority,
  AppointmentBookingRequest,
  AppointmentConflict
} from '../types/appointment';

const { width } = Dimensions.get('window');

// Time slot interface for availability
interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

export default function AppointmentBookingScreen() {
  const navigation = useNavigation();
  const {
    createAppointment,
    fetchAvailability,
    checkConflicts,
    availability,
    isLoading,
    error,
    clearError
  } = useAppointments();

  // Form state
  const [formData, setFormData] = useState<Partial<AppointmentBookingRequest>>({
    title: '',
    description: '',
    type: 'inspection',
    priority: 'medium',
    duration: 60,
    contact: {
      name: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      }
    },
    notes: ''
  });

  // UI state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [conflicts, setConflicts] = useState<AppointmentConflict[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Basic Info, 2: Date/Time, 3: Contact, 4: Review

  // Load availability when date changes
  useEffect(() => {
    if (selectedDate) {
      loadAvailabilityForDate(selectedDate);
    }
  }, [selectedDate]);

  // Generate time slots for the selected date
  const loadAvailabilityForDate = useCallback(async (date: Date) => {
    try {
      const endDate = new Date(date);
      endDate.setDate(date.getDate() + 1);
      
      await fetchAvailability(date, endDate);
      
      // Generate time slots based on availability
      const slots: TimeSlot[] = [];
      for (let hour = 9; hour < 17; hour++) {
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        const slotDate = new Date(date);
        slotDate.setHours(hour, 0, 0, 0);
        
        const availabilitySlot = availability.find(slot => 
          slot.date.getDate() === date.getDate() &&
          slot.startTime === timeStr
        );
        
        slots.push({
          time: timeStr,
          available: availabilitySlot?.available ?? true,
          reason: availabilitySlot?.blockedReason
        });
      }
      
      setTimeSlots(slots);
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  }, [fetchAvailability, availability]);

  // Check for conflicts when date/time changes
  useEffect(() => {
    if (selectedDate && selectedTime && formData.duration) {
      checkAppointmentConflicts();
    }
  }, [selectedDate, selectedTime, formData.duration]);

  const checkAppointmentConflicts = async () => {
    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledFor = new Date(selectedDate);
      scheduledFor.setHours(hours, minutes, 0, 0);
      
      const conflictList = await checkConflicts(
        null,
        scheduledFor,
        formData.duration || 60
      );
      
      setConflicts(conflictList);
    } catch (error) {
      console.error('Error checking conflicts:', error);
    }
  };

  // Form validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.title && formData.type);
      case 2:
        return !!(selectedDate && selectedTime);
      case 3:
        return !!(
          formData.contact?.name &&
          formData.contact?.email &&
          formData.contact?.phone &&
          formData.contact?.address?.street &&
          formData.contact?.address?.city &&
          formData.contact?.address?.state &&
          formData.contact?.address?.zipCode
        );
      case 4:
        return true;
      default:
        return false;
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep(4)) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (conflicts.length > 0) {
      Alert.alert(
        'Scheduling Conflict',
        'There are conflicts with this appointment time. Please choose a different time.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledFor = new Date(selectedDate);
      scheduledFor.setHours(hours, minutes, 0, 0);

      const appointmentRequest: AppointmentBookingRequest = {
        ...formData,
        scheduledFor,
        contact: formData.contact!
      } as AppointmentBookingRequest;

      await createAppointment(appointmentRequest);
      
      Alert.alert(
        'Success',
        'Appointment has been scheduled successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create appointment'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render calendar for date selection
  const renderCalendar = () => {
    const today = new Date();
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.emptyDay} />);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const isPast = date < today;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayButton,
            isSelected && styles.selectedDay,
            isToday && styles.todayDay,
            (isPast || isWeekend) && styles.disabledDay
          ]}
          onPress={() => !isPast && !isWeekend && setSelectedDate(date)}
          disabled={isPast || isWeekend}
        >
          <Text
            style={[
              styles.dayText,
              isSelected && styles.selectedDayText,
              isToday && styles.todayDayText,
              (isPast || isWeekend) && styles.disabledDayText
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return (
      <View style={styles.calendar}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setSelectedDate(newDate);
            }}
            style={styles.calendarNavButton}
          >
            <Text style={styles.calendarNavText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.calendarTitle}>
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity
            onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setSelectedDate(newDate);
            }}
            style={styles.calendarNavButton}
          >
            <Text style={styles.calendarNavText}>›</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.weekDays}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text key={day} style={styles.weekDayText}>{day}</Text>
          ))}
        </View>
        
        <View style={styles.daysGrid}>{days}</View>
      </View>
    );
  };

  // Render time slots
  const renderTimeSlots = () => (
    <View style={styles.timeSlots}>
      <Text style={styles.sectionTitle}>Available Times</Text>
      <View style={styles.timeSlotsGrid}>
        {timeSlots.map(slot => (
          <TouchableOpacity
            key={slot.time}
            style={[
              styles.timeSlot,
              selectedTime === slot.time && styles.selectedTimeSlot,
              !slot.available && styles.unavailableTimeSlot
            ]}
            onPress={() => slot.available && setSelectedTime(slot.time)}
            disabled={!slot.available}
          >
            <Text
              style={[
                styles.timeSlotText,
                selectedTime === slot.time && styles.selectedTimeSlotText,
                !slot.available && styles.unavailableTimeSlotText
              ]}
            >
              {slot.time}
            </Text>
            {!slot.available && slot.reason && (
              <Text style={styles.timeSlotReason}>{slot.reason}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render step 1: Basic Information
  const renderBasicInfo = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Appointment Details</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
          placeholder="Enter appointment title"
          accessibilityLabel="Appointment title"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Type *</Text>
        <View style={styles.typeGrid}>
          {(['inspection', 'measurement', 'estimate', 'consultation', 'repair', 'installation'] as AppointmentType[]).map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                formData.type === type && styles.selectedTypeButton
              ]}
              onPress={() => setFormData(prev => ({ ...prev, type }))}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  formData.type === type && styles.selectedTypeButtonText
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Priority</Text>
        <View style={styles.priorityContainer}>
          {(['low', 'medium', 'high', 'urgent'] as AppointmentPriority[]).map(priority => (
            <TouchableOpacity
              key={priority}
              style={[
                styles.priorityButton,
                formData.priority === priority && styles.selectedPriorityButton
              ]}
              onPress={() => setFormData(prev => ({ ...prev, priority }))}
            >
              <Text
                style={[
                  styles.priorityButtonText,
                  formData.priority === priority && styles.selectedPriorityButtonText
                ]}
              >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Duration (minutes)</Text>
        <TextInput
          style={styles.input}
          value={formData.duration?.toString()}
          onChangeText={(text) => setFormData(prev => ({ ...prev, duration: parseInt(text) || 60 }))}
          placeholder="60"
          keyboardType="numeric"
          accessibilityLabel="Appointment duration in minutes"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
          placeholder="Enter appointment description (optional)"
          multiline
          numberOfLines={3}
          accessibilityLabel="Appointment description"
        />
      </View>
    </View>
  );

  // Render step 2: Date and Time
  const renderDateTime = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Date & Time</Text>
      {renderCalendar()}
      {selectedDate && renderTimeSlots()}
      
      {conflicts.length > 0 && (
        <View style={styles.conflictsContainer}>
          <Text style={styles.conflictsTitle}>⚠️ Scheduling Conflicts</Text>
          {conflicts.map((conflict, index) => (
            <Text key={index} style={styles.conflictText}>
              {conflict.message}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  // Render step 3: Contact Information
  const renderContactInfo = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Contact Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.contact?.name}
          onChangeText={(text) => setFormData(prev => ({
            ...prev,
            contact: { ...prev.contact!, name: text }
          }))}
          placeholder="Enter contact name"
          accessibilityLabel="Contact name"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          value={formData.contact?.email}
          onChangeText={(text) => setFormData(prev => ({
            ...prev,
            contact: { ...prev.contact!, email: text }
          }))}
          placeholder="Enter email address"
          keyboardType="email-address"
          accessibilityLabel="Contact email"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone *</Text>
        <TextInput
          style={styles.input}
          value={formData.contact?.phone}
          onChangeText={(text) => setFormData(prev => ({
            ...prev,
            contact: { ...prev.contact!, phone: text }
          }))}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          accessibilityLabel="Contact phone"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Street Address *</Text>
        <TextInput
          style={styles.input}
          value={formData.contact?.address?.street}
          onChangeText={(text) => setFormData(prev => ({
            ...prev,
            contact: {
              ...prev.contact!,
              address: { ...prev.contact!.address, street: text }
            }
          }))}
          placeholder="Enter street address"
          accessibilityLabel="Street address"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 2 }]}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            value={formData.contact?.address?.city}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              contact: {
                ...prev.contact!,
                address: { ...prev.contact!.address, city: text }
              }
            }))}
            placeholder="City"
            accessibilityLabel="City"
          />
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
          <Text style={styles.label}>State *</Text>
          <TextInput
            style={styles.input}
            value={formData.contact?.address?.state}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              contact: {
                ...prev.contact!,
                address: { ...prev.contact!.address, state: text }
              }
            }))}
            placeholder="State"
            accessibilityLabel="State"
          />
        </View>

        <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
          <Text style={styles.label}>ZIP *</Text>
          <TextInput
            style={styles.input}
            value={formData.contact?.address?.zipCode}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              contact: {
                ...prev.contact!,
                address: { ...prev.contact!.address, zipCode: text }
              }
            }))}
            placeholder="ZIP"
            keyboardType="numeric"
            accessibilityLabel="ZIP code"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.notes}
          onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
          placeholder="Additional notes (optional)"
          multiline
          numberOfLines={3}
          accessibilityLabel="Additional notes"
        />
      </View>
    </View>
  );

  // Render step 4: Review
  const renderReview = () => {
    const scheduledFor = selectedDate && selectedTime ? 
      (() => {
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const date = new Date(selectedDate);
        date.setHours(hours, minutes, 0, 0);
        return date;
      })() : null;

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Review Appointment</Text>
        
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Appointment Details</Text>
          <Text style={styles.reviewItem}>Title: {formData.title}</Text>
          <Text style={styles.reviewItem}>Type: {formData.type}</Text>
          <Text style={styles.reviewItem}>Priority: {formData.priority}</Text>
          <Text style={styles.reviewItem}>Duration: {formData.duration} minutes</Text>
          {formData.description && (
            <Text style={styles.reviewItem}>Description: {formData.description}</Text>
          )}
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Date & Time</Text>
          <Text style={styles.reviewItem}>
            {scheduledFor?.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          <Text style={styles.reviewItem}>
            {scheduledFor?.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
          </Text>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Contact Information</Text>
          <Text style={styles.reviewItem}>Name: {formData.contact?.name}</Text>
          <Text style={styles.reviewItem}>Email: {formData.contact?.email}</Text>
          <Text style={styles.reviewItem}>Phone: {formData.contact?.phone}</Text>
          <Text style={styles.reviewItem}>
            Address: {formData.contact?.address?.street}, {formData.contact?.address?.city}, {formData.contact?.address?.state} {formData.contact?.address?.zipCode}
          </Text>
          {formData.notes && (
            <Text style={styles.reviewItem}>Notes: {formData.notes}</Text>
          )}
        </View>
      </View>
    );
  };

  // Navigation buttons
  const renderNavigation = () => (
    <View style={styles.navigation}>
      {currentStep > 1 && (
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCurrentStep(currentStep - 1)}
        >
          <Text style={styles.navButtonText}>Back</Text>
        </TouchableOpacity>
      )}
      
      {currentStep < 4 ? (
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.primaryNavButton,
            !validateStep(currentStep) && styles.disabledNavButton
          ]}
          onPress={() => setCurrentStep(currentStep + 1)}
          disabled={!validateStep(currentStep)}
        >
          <Text style={[styles.navButtonText, styles.primaryNavButtonText]}>
            Next
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.primaryNavButton,
            (isSubmitting || !validateStep(currentStep)) && styles.disabledNavButton
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || !validateStep(currentStep)}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={[styles.navButtonText, styles.primaryNavButtonText]}>
              Book Appointment
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  // Step indicator
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map(step => (
        <View
          key={step}
          style={[
            styles.stepDot,
            step <= currentStep && styles.activeStepDot
          ]}
        >
          <Text
            style={[
              styles.stepDotText,
              step <= currentStep && styles.activeStepDotText
            ]}
          >
            {step}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {renderStepIndicator()}
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError} style={styles.errorDismiss}>
              <Text style={styles.errorDismissText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {currentStep === 1 && renderBasicInfo()}
        {currentStep === 2 && renderDateTime()}
        {currentStep === 3 && renderContactInfo()}
        {currentStep === 4 && renderReview()}
      </ScrollView>

      {renderNavigation()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fc',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 20,
  },
  stepDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStepDot: {
    backgroundColor: '#3b82f6',
  },
  stepDotText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeStepDotText: {
    color: '#ffffff',
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#234e70',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  selectedTypeButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectedTypeButtonText: {
    color: '#ffffff',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  selectedPriorityButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  selectedPriorityButtonText: {
    color: '#ffffff',
  },
  calendar: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarNavText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    paddingVertical: 8,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: width / 7 - 20,
    height: 40,
  },
  dayButton: {
    width: width / 7 - 20,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 2,
  },
  selectedDay: {
    backgroundColor: '#3b82f6',
  },
  todayDay: {
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  disabledDay: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedDayText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  todayDayText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  disabledDayText: {
    color: '#9ca3af',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  timeSlots: {
    marginTop: 20,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  unavailableTimeSlot: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    opacity: 0.6,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedTimeSlotText: {
    color: '#ffffff',
  },
  unavailableTimeSlotText: {
    color: '#9ca3af',
  },
  timeSlotReason: {
    fontSize: 10,
    color: '#ef4444',
    marginTop: 2,
  },
  conflictsContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  conflictsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
  },
  conflictText: {
    fontSize: 14,
    color: '#dc2626',
    marginBottom: 4,
  },
  reviewSection: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  reviewItem: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  navButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  primaryNavButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  disabledNavButton: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  primaryNavButtonText: {
    color: '#ffffff',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    margin: 20,
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
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
});