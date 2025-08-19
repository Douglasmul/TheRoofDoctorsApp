/**
 * @fileoverview Enterprise feedback message components
 * Provides success, error, warning, and info message components for consistent UX
 * @version 1.0.0
 * @enterprise
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export type MessageType = 'success' | 'error' | 'warning' | 'info';

export interface FeedbackMessageProps {
  type: MessageType;
  title: string;
  message: string;
  onDismiss?: () => void;
  actionText?: string;
  onAction?: () => void;
}

/**
 * Enterprise feedback message component
 */
export function FeedbackMessage({
  type,
  title,
  message,
  onDismiss,
  actionText,
  onAction,
}: FeedbackMessageProps) {
  const messageStyles = [
    styles.messageContainer,
    styles[`${type}Container`],
  ];

  const textStyles = [
    styles.messageText,
    styles[`${type}Text`],
  ];

  return (
    <View style={messageStyles}>
      <View style={styles.messageContent}>
        <Text style={[styles.messageTitle, textStyles]}>{title}</Text>
        <Text style={[styles.messageBody, textStyles]}>{message}</Text>
      </View>
      
      <View style={styles.messageActions}>
        {actionText && onAction && (
          <TouchableOpacity
            style={[styles.actionButton, styles[`${type}Button`]]}
            onPress={onAction}
          >
            <Text style={[styles.actionButtonText, textStyles]}>
              {actionText}
            </Text>
          </TouchableOpacity>
        )}
        
        {onDismiss && (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
          >
            <Text style={styles.dismissButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/**
 * Success message component
 */
export function SuccessMessage(props: Omit<FeedbackMessageProps, 'type'>) {
  return <FeedbackMessage {...props} type="success" />;
}

/**
 * Error message component
 */
export function ErrorMessage(props: Omit<FeedbackMessageProps, 'type'>) {
  return <FeedbackMessage {...props} type="error" />;
}

/**
 * Warning message component
 */
export function WarningMessage(props: Omit<FeedbackMessageProps, 'type'>) {
  return <FeedbackMessage {...props} type="warning" />;
}

/**
 * Info message component
 */
export function InfoMessage(props: Omit<FeedbackMessageProps, 'type'>) {
  return <FeedbackMessage {...props} type="info" />;
}

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  messageContent: {
    flex: 1,
    marginRight: 8,
  },
  
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  
  messageBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  messageText: {
    color: '#333',
  },
  
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  dismissButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  
  dismissButtonText: {
    fontSize: 16,
    color: '#666',
  },
  
  // Success styles
  successContainer: {
    backgroundColor: '#f0f9f4',
    borderColor: '#22c55e',
  },
  
  successText: {
    color: '#15803d',
  },
  
  successButton: {
    backgroundColor: '#22c55e',
  },
  
  // Error styles
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  
  errorText: {
    color: '#dc2626',
  },
  
  errorButton: {
    backgroundColor: '#ef4444',
  },
  
  // Warning styles
  warningContainer: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
  },
  
  warningText: {
    color: '#d97706',
  },
  
  warningButton: {
    backgroundColor: '#f59e0b',
  },
  
  // Info styles
  infoContainer: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  
  infoText: {
    color: '#2563eb',
  },
  
  infoButton: {
    backgroundColor: '#3b82f6',
  },
});