import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COMPANY_INFO } from '../constants/company';

interface ErrorDetails {
  title?: string;
  message?: string;
  errorCode?: string;
  timestamp?: string;
  userAction?: string;
  stackTrace?: string;
}

export default function ErrorScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [errorDetails, setErrorDetails] = useState<ErrorDetails>({
    title: 'Application Error',
    message: 'An unexpected error occurred. Please try again.',
    errorCode: 'ERR_GENERAL',
    timestamp: new Date().toISOString(),
  });

  useEffect(() => {
    // Extract error details from route params if provided
    const params = route.params as any;
    if (params?.error) {
      setErrorDetails(prev => ({
        ...prev,
        ...params.error,
        timestamp: new Date().toISOString(),
      }));
    }
  }, [route.params]);

  const handleSendErrorReport = async () => {
    const errorReport = `
ERROR REPORT - ${COMPANY_INFO.app.displayName}
═══════════════════════════════════════

Title: ${errorDetails.title}
Message: ${errorDetails.message}
Error Code: ${errorDetails.errorCode}
Timestamp: ${errorDetails.timestamp}
User Action: ${errorDetails.userAction || 'Not specified'}

App Version: ${COMPANY_INFO.app.version}
Platform: React Native

${errorDetails.stackTrace ? `\nStack Trace:\n${errorDetails.stackTrace}` : ''}

Please send this report to ${COMPANY_INFO.legal.supportEmail}
    `.trim();

    try {
      await Share.share({
        message: errorReport,
        title: 'Error Report - The Roof Doctors App',
      });
    } catch (error) {
      console.error('Failed to share error report:', error);
    }
  };

  const getErrorIcon = () => {
    switch (errorDetails.errorCode) {
      case 'ERR_NETWORK':
        return '🌐';
      case 'ERR_CAMERA':
        return '📷';
      case 'ERR_STORAGE':
        return '💾';
      case 'ERR_MEASUREMENT':
        return '📏';
      case 'ERR_QUOTE':
        return '💰';
      default:
        return '⚠️';
    }
  };

  const getSuggestedActions = () => {
    switch (errorDetails.errorCode) {
      case 'ERR_NETWORK':
        return [
          'Check your internet connection',
          'Try again in a few moments',
          'Contact support if problem persists',
        ];
      case 'ERR_CAMERA':
        return [
          'Check camera permissions',
          'Ensure good lighting conditions',
          'Restart the app',
        ];
      case 'ERR_STORAGE':
        return [
          'Free up device storage space',
          'Check app permissions',
          'Restart the app',
        ];
      default:
        return [
          'Try the action again',
          'Restart the app if needed',
          'Contact support for assistance',
        ];
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.iconContainer}>
        <Text style={styles.errorIcon}>{getErrorIcon()}</Text>
      </View>

      <Text style={styles.header}>{errorDetails.title}</Text>
      <Text style={styles.message}>{errorDetails.message}</Text>

      {errorDetails.errorCode && (
        <View style={styles.errorCodeContainer}>
          <Text style={styles.errorCodeLabel}>Error Code:</Text>
          <Text style={styles.errorCode}>{errorDetails.errorCode}</Text>
        </View>
      )}

      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Suggested Actions:</Text>
        {getSuggestedActions().map((action, index) => (
          <Text key={index} style={styles.suggestionItem}>
            • {action}
          </Text>
        ))}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Home' as never)}
        >
          <Text style={styles.secondaryButtonText}>Go to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reportButton}
          onPress={handleSendErrorReport}
        >
          <Text style={styles.reportButtonText}>Send Error Report</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.supportInfo}>
        <Text style={styles.supportTitle}>Need Help?</Text>
        <Text style={styles.supportText}>
          Contact our support team at {COMPANY_INFO.legal.supportEmail}
        </Text>
        <Text style={styles.supportText}>
          Or call: {COMPANY_INFO.legal.phone}
        </Text>
      </View>

      {errorDetails.timestamp && (
        <Text style={styles.timestamp}>
          Error occurred at: {new Date(errorDetails.timestamp).toLocaleString()}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fc',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: '100%',
  },
  iconContainer: {
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 48,
    textAlign: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorCodeContainer: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    alignSelf: 'stretch',
  },
  errorCodeLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  errorCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'monospace',
  },
  suggestionsContainer: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  suggestionItem: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
    lineHeight: 20,
  },
  actionButtons: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#234e70',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  reportButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  reportButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  supportInfo: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 8,
    alignSelf: 'stretch',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d4ed8',
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    color: '#2563eb',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});