/**
 * ErrorScreen.tsx
 * 
 * Enterprise-ready error handling and user feedback with modular components,
 * accessibility features, and state management placeholders.
 * 
 * Features:
 * - Comprehensive error display and categorization
 * - User-friendly error messages and recovery options
 * - Error reporting and debugging tools
 * - Offline error handling
 * - System diagnostics and health checks
 * - Recovery suggestions and troubleshooting
 * 
 * TODO: Integrate with error monitoring service (Sentry, Bugsnag)
 * TODO: Add error analytics and reporting
 * TODO: Connect to crash reporting backend
 * TODO: Implement auto-recovery mechanisms
 * TODO: Add error screenshots and device info
 * TODO: Add network connectivity diagnostics
 * TODO: Implement error retry functionality
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';

// TypeScript interfaces for error handling
interface AppError {
  id: string;
  type: 'network' | 'authentication' | 'validation' | 'system' | 'permission' | 'data' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  code: string;
  message: string;
  userMessage: string;
  timestamp: string;
  stack?: string;
  context?: {
    screen?: string;
    action?: string;
    userId?: string;
    deviceInfo?: DeviceInfo;
    [key: string]: any;
  };
  recoveryOptions: RecoveryOption[];
  isResolved: boolean;
  reportedToUser: boolean;
}

interface RecoveryOption {
  id: string;
  label: string;
  description: string;
  action: 'retry' | 'navigate' | 'reset' | 'contact' | 'refresh' | 'custom';
  actionData?: any;
  icon: string;
  priority: number;
}

interface SystemDiagnostic {
  category: string;
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  value?: string;
  message?: string;
  lastChecked: string;
}

interface ErrorReportProps {
  error: AppError;
  onResolve: (errorId: string) => void;
  onReport: (errorId: string) => void;
  onRetry: (errorId: string, option: RecoveryOption) => void;
}

interface DiagnosticItemProps {
  diagnostic: SystemDiagnostic;
  onRefresh: (category: string) => void;
}

interface ErrorStatsProps {
  totalErrors: number;
  resolvedErrors: number;
  criticalErrors: number;
  lastErrorTime?: string;
}

// Demo error data - Replace with actual error tracking
const DEMO_ERRORS: AppError[] = [
  {
    id: 'error_001',
    type: 'network',
    severity: 'medium',
    code: 'NETWORK_TIMEOUT',
    message: 'Request timeout after 30 seconds',
    userMessage: 'Unable to connect to server. Please check your internet connection.',
    timestamp: '2024-01-15T14:30:00Z',
    context: {
      screen: 'ReportsScreen',
      action: 'generateReport',
    },
    recoveryOptions: [
      {
        id: 'retry',
        label: 'Try Again',
        description: 'Retry the failed operation',
        action: 'retry',
        icon: '🔄',
        priority: 1,
      },
      {
        id: 'offline',
        label: 'Work Offline',
        description: 'Continue using cached data',
        action: 'navigate',
        actionData: { screen: 'OfflineMode' },
        icon: '📱',
        priority: 2,
      },
    ],
    isResolved: false,
    reportedToUser: true,
  },
  {
    id: 'error_002',
    type: 'permission',
    severity: 'high',
    code: 'CAMERA_PERMISSION_DENIED',
    message: 'Camera permission not granted',
    userMessage: 'Camera access is required for roof measurements. Please enable camera permissions in your device settings.',
    timestamp: '2024-01-15T13:45:00Z',
    context: {
      screen: 'MeasureRoofScreen',
      action: 'requestCameraPermission',
    },
    recoveryOptions: [
      {
        id: 'settings',
        label: 'Open Settings',
        description: 'Go to device settings to enable camera access',
        action: 'custom',
        actionData: { type: 'openSettings' },
        icon: '⚙️',
        priority: 1,
      },
      {
        id: 'manual',
        label: 'Manual Entry',
        description: 'Enter measurements manually',
        action: 'navigate',
        actionData: { screen: 'ManualMeasurement' },
        icon: '✏️',
        priority: 2,
      },
    ],
    isResolved: false,
    reportedToUser: true,
  },
];

const DEMO_DIAGNOSTICS: SystemDiagnostic[] = [
  {
    category: 'Network',
    name: 'Internet Connection',
    status: 'healthy',
    value: 'Connected (WiFi)',
    lastChecked: '2024-01-15T14:30:00Z',
  },
  {
    category: 'Network',
    name: 'API Connectivity',
    status: 'healthy',
    value: '200ms response time',
    lastChecked: '2024-01-15T14:30:00Z',
  },
  {
    category: 'Storage',
    name: 'Available Space',
    status: 'warning',
    value: '1.2 GB remaining',
    message: 'Consider freeing up space',
    lastChecked: '2024-01-15T14:30:00Z',
  },
  {
    category: 'Storage',
    name: 'Cache Size',
    status: 'healthy',
    value: '45 MB',
    lastChecked: '2024-01-15T14:30:00Z',
  },
  {
    category: 'Permissions',
    name: 'Camera Access',
    status: 'error',
    value: 'Denied',
    message: 'Required for roof measurements',
    lastChecked: '2024-01-15T14:30:00Z',
  },
  {
    category: 'Permissions',
    name: 'Location Access',
    status: 'healthy',
    value: 'Granted',
    lastChecked: '2024-01-15T14:30:00Z',
  },
];

// Get responsive dimensions
const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

/**
 * Get status color for diagnostics
 */
function getStatusColor(status: SystemDiagnostic['status']): string {
  switch (status) {
    case 'healthy': return '#4CAF50';
    case 'warning': return '#FF9800';
    case 'error': return '#F44336';
    case 'unknown': return '#9E9E9E';
    default: return '#9E9E9E';
  }
}

/**
 * Get status icon for diagnostics
 */
function getStatusIcon(status: SystemDiagnostic['status']): string {
  switch (status) {
    case 'healthy': return '✅';
    case 'warning': return '⚠️';
    case 'error': return '❌';
    case 'unknown': return '❓';
    default: return '❓';
  }
}

/**
 * Error statistics component
 */
const ErrorStats: React.FC<ErrorStatsProps> = ({
  totalErrors,
  resolvedErrors,
  criticalErrors,
  lastErrorTime,
}) => (
  <View style={styles.statsContainer}>
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{totalErrors}</Text>
      <Text style={styles.statLabel}>Total Errors</Text>
    </View>
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: '#4CAF50' }]}>{resolvedErrors}</Text>
      <Text style={styles.statLabel}>Resolved</Text>
    </View>
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: '#F44336' }]}>{criticalErrors}</Text>
      <Text style={styles.statLabel}>Critical</Text>
    </View>
    {lastErrorTime && (
      <View style={styles.statItem}>
        <Text style={styles.statValue}>
          {new Date(lastErrorTime).toLocaleDateString()}
        </Text>
        <Text style={styles.statLabel}>Last Error</Text>
      </View>
    )}
  </View>
);

/**
 * Diagnostic item component
 */
const DiagnosticItem: React.FC<DiagnosticItemProps> = ({
  diagnostic,
  onRefresh,
}) => (
  <TouchableOpacity
    style={styles.diagnosticItem}
    onPress={() => onRefresh(diagnostic.category)}
    accessible={true}
    accessibilityRole="button"
    accessibilityLabel={`${diagnostic.name}: ${diagnostic.status}`}
    accessibilityHint={`${diagnostic.value || ''} ${diagnostic.message || ''}`}
  >
    <View style={styles.diagnosticContent}>
      <View style={styles.diagnosticHeader}>
        <Text style={styles.diagnosticIcon}>
          {getStatusIcon(diagnostic.status)}
        </Text>
        <Text style={styles.diagnosticName}>{diagnostic.name}</Text>
        <View style={[
          styles.diagnosticStatusBadge,
          { backgroundColor: getStatusColor(diagnostic.status) }
        ]}>
          <Text style={styles.diagnosticStatusText}>
            {diagnostic.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      {diagnostic.value && (
        <Text style={styles.diagnosticValue}>{diagnostic.value}</Text>
      )}
      
      {diagnostic.message && (
        <Text style={styles.diagnosticMessage}>{diagnostic.message}</Text>
      )}
      
      <Text style={styles.diagnosticTimestamp}>
        Last checked: {new Date(diagnostic.lastChecked).toLocaleTimeString()}
      </Text>
    </View>
  </TouchableOpacity>
);

/**
 * Error report component
 */
const ErrorReport: React.FC<ErrorReportProps> = ({
  error,
  onResolve,
  onReport,
  onRetry,
}) => {
  const getSeverityColor = useCallback((severity: AppError['severity']) => {
    switch (severity) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#F44336';
      case 'critical': return '#9C27B0';
      default: return '#9E9E9E';
    }
  }, []);

  const getTypeIcon = useCallback((type: AppError['type']) => {
    switch (type) {
      case 'network': return '📡';
      case 'authentication': return '🔐';
      case 'validation': return '✅';
      case 'system': return '⚙️';
      case 'permission': return '🔒';
      case 'data': return '📊';
      case 'unknown': return '❓';
      default: return '⚠️';
    }
  }, []);

  return (
    <View style={styles.errorReport}>
      <View style={styles.errorHeader}>
        <Text style={styles.errorIcon}>{getTypeIcon(error.type)}</Text>
        <View style={styles.errorMeta}>
          <Text style={styles.errorCode}>{error.code}</Text>
          <View style={[
            styles.severityBadge,
            { backgroundColor: getSeverityColor(error.severity) }
          ]}>
            <Text style={styles.severityText}>
              {error.severity.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.errorTimestamp}>
          {new Date(error.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      
      <Text style={styles.errorMessage}>{error.userMessage}</Text>
      
      {error.context?.screen && (
        <Text style={styles.errorContext}>
          Occurred in: {error.context.screen}
          {error.context.action && ` (${error.context.action})`}
        </Text>
      )}
      
      <View style={styles.recoveryOptions}>
        <Text style={styles.recoveryTitle}>Recovery Options:</Text>
        {error.recoveryOptions
          .sort((a, b) => a.priority - b.priority)
          .map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.recoveryOption}
              onPress={() => onRetry(error.id, option)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityHint={option.description}
            >
              <Text style={styles.recoveryIcon}>{option.icon}</Text>
              <View style={styles.recoveryContent}>
                <Text style={styles.recoveryLabel}>{option.label}</Text>
                <Text style={styles.recoveryDescription}>{option.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
      </View>
      
      <View style={styles.errorActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onReport(error.id)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Report this error"
        >
          <Text style={styles.actionButtonText}>Report Error</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.resolveButton]}
          onPress={() => onResolve(error.id)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Mark as resolved"
        >
          <Text style={[styles.actionButtonText, styles.resolveButtonText]}>
            Mark Resolved
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Main ErrorScreen component
 */
export default function ErrorScreen() {
  const navigation = useNavigation();
  
  // State management placeholders - TODO: Replace with actual error context/Redux
  const [errors, setErrors] = useState<AppError[]>(DEMO_ERRORS);
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostic[]>(DEMO_DIAGNOSTICS);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'errors' | 'diagnostics'>('errors');

  // Error statistics
  const errorStats = React.useMemo(() => {
    const totalErrors = errors.length;
    const resolvedErrors = errors.filter(e => e.isResolved).length;
    const criticalErrors = errors.filter(e => e.severity === 'critical').length;
    const lastErrorTime = errors.length > 0 ? 
      Math.max(...errors.map(e => new Date(e.timestamp).getTime())) : 
      undefined;
    
    return {
      totalErrors,
      resolvedErrors,
      criticalErrors,
      lastErrorTime: lastErrorTime ? new Date(lastErrorTime).toISOString() : undefined,
    };
  }, [errors]);

  // Error handling functions
  const handleResolveError = useCallback((errorId: string) => {
    setErrors(prev => prev.map(error => 
      error.id === errorId ? { ...error, isResolved: true } : error
    ));
    // TODO: Sync with error tracking service
  }, []);

  const handleReportError = useCallback((errorId: string) => {
    const error = errors.find(e => e.id === errorId);
    if (error) {
      Alert.alert(
        'Report Error',
        'This error will be sent to our development team for analysis.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send Report',
            onPress: () => {
              // TODO: Send error report to backend/monitoring service
              Alert.alert('Thank You', 'Error report has been sent successfully.');
            },
          },
        ]
      );
    }
  }, [errors]);

  const handleRetryError = useCallback((errorId: string, option: RecoveryOption) => {
    const error = errors.find(e => e.id === errorId);
    if (!error) return;

    switch (option.action) {
      case 'retry':
        // TODO: Retry the original operation
        Alert.alert('Retrying', 'Attempting to retry the failed operation...');
        break;
      case 'navigate':
        // TODO: Navigate to specified screen
        if (option.actionData?.screen) {
          // navigation.navigate(option.actionData.screen);
          Alert.alert('Navigation', `Navigating to ${option.actionData.screen}`);
        }
        break;
      case 'reset':
        // TODO: Reset application state
        Alert.alert('Reset', 'Resetting application state...');
        break;
      case 'refresh':
        // TODO: Refresh current screen/data
        Alert.alert('Refresh', 'Refreshing data...');
        break;
      case 'contact':
        // TODO: Open support contact
        Alert.alert('Contact Support', 'Opening support contact...');
        break;
      case 'custom':
        // TODO: Handle custom actions
        if (option.actionData?.type === 'openSettings') {
          Alert.alert('Settings', 'Opening device settings...');
        }
        break;
    }
  }, [errors]);

  // Diagnostic functions
  const handleRefreshDiagnostic = useCallback((category: string) => {
    setIsRunningDiagnostics(true);
    // TODO: Run actual diagnostic checks
    setTimeout(() => {
      setIsRunningDiagnostics(false);
      Alert.alert('Diagnostics', `${category} diagnostics refreshed`);
    }, 1000);
  }, []);

  const handleRunAllDiagnostics = useCallback(() => {
    setIsRunningDiagnostics(true);
    // TODO: Run comprehensive system diagnostics
    setTimeout(() => {
      setIsRunningDiagnostics(false);
      Alert.alert('Diagnostics Complete', 'All system checks completed');
    }, 2000);
  }, []);

  const handleClearAllErrors = useCallback(() => {
    Alert.alert(
      'Clear All Errors',
      'Are you sure you want to clear all resolved errors?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setErrors(prev => prev.filter(error => !error.isResolved));
          },
        },
      ]
    );
  }, []);

  const handleExportLogs = useCallback(() => {
    Alert.alert(
      'Export Error Logs',
      'Export error logs for technical support?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            // TODO: Generate and export error logs
            Alert.alert('Export Started', 'Error logs will be saved to your device');
          },
        },
      ]
    );
  }, []);

  // Group diagnostics by category
  const diagnosticsByCategory = React.useMemo(() => {
    return diagnostics.reduce((acc, diagnostic) => {
      if (!acc[diagnostic.category]) {
        acc[diagnostic.category] = [];
      }
      acc[diagnostic.category].push(diagnostic);
      return acc;
    }, {} as Record<string, SystemDiagnostic[]>);
  }, [diagnostics]);

  return (
    <View style={styles.container}>
      {/* Header with Stats */}
      <View style={styles.header}>
        <ErrorStats {...errorStats} />
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleRunAllDiagnostics}
            disabled={isRunningDiagnostics}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Run system diagnostics"
          >
            <Text style={styles.headerButtonText}>
              {isRunningDiagnostics ? 'Running...' : 'Run Diagnostics'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleExportLogs}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Export error logs"
          >
            <Text style={styles.headerButtonText}>Export Logs</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'errors' && styles.activeTab]}
          onPress={() => setSelectedTab('errors')}
          accessible={true}
          accessibilityRole="tab"
          accessibilityLabel="Error reports"
          accessibilityState={{ selected: selectedTab === 'errors' }}
        >
          <Text style={[styles.tabText, selectedTab === 'errors' && styles.activeTabText]}>
            Errors ({errors.filter(e => !e.isResolved).length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'diagnostics' && styles.activeTab]}
          onPress={() => setSelectedTab('diagnostics')}
          accessible={true}
          accessibilityRole="tab"
          accessibilityLabel="System diagnostics"
          accessibilityState={{ selected: selectedTab === 'diagnostics' }}
        >
          <Text style={[styles.tabText, selectedTab === 'diagnostics' && styles.activeTabText]}>
            Diagnostics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        accessible={true}
        accessibilityLabel={selectedTab === 'errors' ? 'Error reports list' : 'System diagnostics list'}
      >
        {selectedTab === 'errors' ? (
          <View>
            {errors.filter(error => !error.isResolved).length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>✅</Text>
                <Text style={styles.emptyStateTitle}>No Active Errors</Text>
                <Text style={styles.emptyStateMessage}>
                  Great! Your app is running smoothly with no active errors.
                </Text>
              </View>
            ) : (
              errors
                .filter(error => !error.isResolved)
                .map((error) => (
                  <ErrorReport
                    key={error.id}
                    error={error}
                    onResolve={handleResolveError}
                    onReport={handleReportError}
                    onRetry={handleRetryError}
                  />
                ))
            )}
            
            {errors.filter(error => error.isResolved).length > 0 && (
              <View style={styles.resolvedSection}>
                <View style={styles.resolvedHeader}>
                  <Text style={styles.resolvedTitle}>
                    Resolved Errors ({errors.filter(error => error.isResolved).length})
                  </Text>
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={handleClearAllErrors}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Clear all resolved errors"
                  >
                    <Text style={styles.clearButtonText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View>
            {Object.entries(diagnosticsByCategory).map(([category, categoryDiagnostics]) => (
              <View key={category} style={styles.diagnosticCategory}>
                <Text style={styles.categoryTitle}>{category}</Text>
                {categoryDiagnostics.map((diagnostic, index) => (
                  <DiagnosticItem
                    key={`${category}-${index}`}
                    diagnostic={diagnostic}
                    onRefresh={handleRefreshDiagnostic}
                  />
                ))}
              </View>
            ))}
          </View>
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
  header: {
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
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  headerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.colors.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  errorReport: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  errorIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  errorMeta: {
    flex: 1,
  },
  errorCode: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  severityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  errorTimestamp: {
    fontSize: 12,
    color: '#999',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  errorContext: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  recoveryOptions: {
    marginBottom: 16,
  },
  recoveryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  recoveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginVertical: 2,
  },
  recoveryIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  recoveryContent: {
    flex: 1,
  },
  recoveryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  recoveryDescription: {
    fontSize: 12,
    color: '#666',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  resolveButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  resolveButtonText: {
    color: 'white',
  },
  diagnosticCategory: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 12,
  },
  diagnosticItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginVertical: 4,
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
  diagnosticContent: {
    flex: 1,
  },
  diagnosticHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  diagnosticIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  diagnosticName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  diagnosticStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  diagnosticStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  diagnosticValue: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  diagnosticMessage: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  diagnosticTimestamp: {
    fontSize: 11,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
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
  resolvedSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  resolvedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resolvedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});