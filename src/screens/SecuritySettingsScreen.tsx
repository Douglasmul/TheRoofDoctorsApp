/**
 * @fileoverview Security Settings Screen with 2FA and security preferences
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSecurity } from '../contexts/SecurityContext';
import { useAuth } from '../contexts/AuthContext';
import {
  TwoFactorMethod,
  TwoFactorSetupResponse
} from '../services/TwoFactorAuthService';

export default function SecuritySettingsScreen() {
  const navigation = useNavigation();
  const {
    securitySettings,
    twoFactorSettings,
    isLoading,
    error,
    riskLevel,
    recommendations,
    deviceTrusted,
    updateSecuritySettings,
    setupTwoFactor,
    verifyTwoFactorSetup,
    disableTwoFactor,
    regenerateBackupCodes,
    clearError,
    loadSecurityDashboard
  } = useSecurity();
  
  const { user } = useAuth();

  // Local state for modals and forms
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<TwoFactorMethod>('totp');
  const [setupResponse, setSetupResponse] = useState<TwoFactorSetupResponse | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data on mount
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
    loadSecurityDashboard();
  }, [user, loadSecurityDashboard]);

  // Handle 2FA setup
  const handle2FASetup = async () => {
    try {
      setIsSubmitting(true);
      clearError();

      const request = {
        method: selectedMethod,
        ...(selectedMethod === 'sms' && { phoneNumber }),
        ...(selectedMethod === 'email' && { email })
      };

      const response = await setupTwoFactor(request);
      setSetupResponse(response);
      
      if (selectedMethod === 'totp') {
        // Show QR code or secret for TOTP setup
        Alert.alert(
          'Setup TOTP',
          'Scan the QR code with your authenticator app or enter the secret key manually.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to setup 2FA. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle 2FA verification
  const handle2FAVerification = async () => {
    try {
      setIsSubmitting(true);
      clearError();

      if (!setupResponse) {
        throw new Error('No setup response available');
      }

      await verifyTwoFactorSetup(selectedMethod, verificationCode, setupResponse.setupToken);
      
      setShow2FASetup(false);
      setSetupResponse(null);
      setVerificationCode('');
      
      Alert.alert('Success', '2FA has been enabled successfully!');
    } catch (error) {
      Alert.alert('Error', 'Invalid verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle 2FA disable
  const handle2FADisable = async () => {
    try {
      setIsSubmitting(true);
      clearError();

      await disableTwoFactor(verificationCode);
      
      setShowDisable2FA(false);
      setVerificationCode('');
      
      Alert.alert('Success', '2FA has been disabled.');
    } catch (error) {
      Alert.alert('Error', 'Invalid verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle backup codes regeneration
  const handleRegenerateBackupCodes = async () => {
    Alert.alert(
      'Regenerate Backup Codes',
      'This will invalidate all existing backup codes. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              const codes = await regenerateBackupCodes(verificationCode);
              setBackupCodes(codes);
              setShowBackupCodes(true);
            } catch (error) {
              Alert.alert('Error', 'Failed to regenerate backup codes.');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  // Handle security setting toggle
  const handleSecurityToggle = async (setting: string, value: boolean) => {
    if (!securitySettings) return;

    try {
      const updatedSettings = {
        ...securitySettings,
        [setting]: value
      };

      await updateSecuritySettings(updatedSettings);
    } catch (error) {
      Alert.alert('Error', 'Failed to update security setting.');
    }
  };

  // Get risk level color
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#f97316';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Render security overview
  const renderSecurityOverview = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Security Overview</Text>
      
      <View style={styles.overviewCard}>
        <View style={styles.riskLevel}>
          <Text style={styles.riskLevelTitle}>Current Risk Level</Text>
          <View style={[styles.riskBadge, { backgroundColor: getRiskLevelColor(riskLevel) }]}>
            <Text style={styles.riskBadgeText}>{riskLevel.toUpperCase()}</Text>
          </View>
        </View>
        
        {deviceTrusted && (
          <View style={styles.trustStatus}>
            <Text style={styles.trustStatusText}>✓ This device is trusted</Text>
          </View>
        )}
      </View>

      {recommendations.length > 0 && (
        <View style={styles.recommendations}>
          <Text style={styles.recommendationsTitle}>Security Recommendations</Text>
          {recommendations.map((recommendation, index) => (
            <Text key={index} style={styles.recommendationItem}>
              • {recommendation}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  // Render 2FA section
  const render2FASection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Two-Factor Authentication</Text>
      
      {twoFactorSettings?.isEnabled ? (
        <View style={styles.twoFactorEnabled}>
          <View style={styles.twoFactorStatus}>
            <Text style={styles.enabledText}>✓ Enabled</Text>
            <Text style={styles.methodText}>
              Primary method: {twoFactorSettings.primaryMethod?.toUpperCase()}
            </Text>
            {twoFactorSettings.backupCodesRemaining > 0 && (
              <Text style={styles.backupCodesText}>
                {twoFactorSettings.backupCodesRemaining} backup codes remaining
              </Text>
            )}
          </View>
          
          <View style={styles.twoFactorActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleRegenerateBackupCodes}
              disabled={isSubmitting}
            >
              <Text style={styles.secondaryButtonText}>Regenerate Backup Codes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={() => setShowDisable2FA(true)}
              disabled={isSubmitting}
            >
              <Text style={styles.dangerButtonText}>Disable 2FA</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.twoFactorDisabled}>
          <Text style={styles.disabledText}>Two-factor authentication is not enabled</Text>
          <Text style={styles.disabledDescription}>
            Add an extra layer of security to your account by enabling 2FA
          </Text>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => setShow2FASetup(true)}
            disabled={isSubmitting}
          >
            <Text style={styles.primaryButtonText}>Enable 2FA</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Render security settings
  const renderSecuritySettings = () => {
    if (!securitySettings) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Settings</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Require 2FA for all users</Text>
            <Text style={styles.settingDescription}>
              Enforce two-factor authentication for enhanced security
            </Text>
          </View>
          <Switch
            value={securitySettings.twoFactorRequired}
            onValueChange={(value) => handleSecurityToggle('twoFactorRequired', value)}
            disabled={isSubmitting}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Real-time Security Analysis</Text>
            <Text style={styles.settingDescription}>
              Monitor and analyze security events in real-time
            </Text>
          </View>
          <Switch
            value={securitySettings.auditSettings.realTimeAnalysis}
            onValueChange={(value) => handleSecurityToggle('auditSettings.realTimeAnalysis', value)}
            disabled={isSubmitting}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Security Audit Logging</Text>
            <Text style={styles.settingDescription}>
              Log security events for compliance and monitoring
            </Text>
          </View>
          <Switch
            value={securitySettings.auditSettings.enabled}
            onValueChange={(value) => handleSecurityToggle('auditSettings.enabled', value)}
            disabled={isSubmitting}
          />
        </View>
      </View>
    );
  };

  // Render 2FA setup modal
  const render2FASetupModal = () => (
    <Modal
      visible={show2FASetup}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShow2FASetup(false)}>
            <Text style={styles.modalHeaderButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Setup 2FA</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          {!setupResponse ? (
            // Method selection
            <View>
              <Text style={styles.stepTitle}>Choose 2FA Method</Text>
              
              <TouchableOpacity
                style={[
                  styles.methodOption,
                  selectedMethod === 'totp' && styles.selectedMethod
                ]}
                onPress={() => setSelectedMethod('totp')}
              >
                <Text style={styles.methodTitle}>📱 Authenticator App (TOTP)</Text>
                <Text style={styles.methodDescription}>
                  Use apps like Google Authenticator or Authy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodOption,
                  selectedMethod === 'sms' && styles.selectedMethod
                ]}
                onPress={() => setSelectedMethod('sms')}
              >
                <Text style={styles.methodTitle}>📞 SMS</Text>
                <Text style={styles.methodDescription}>
                  Receive codes via text message
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodOption,
                  selectedMethod === 'email' && styles.selectedMethod
                ]}
                onPress={() => setSelectedMethod('email')}
              >
                <Text style={styles.methodTitle}>📧 Email</Text>
                <Text style={styles.methodDescription}>
                  Receive codes via email
                </Text>
              </TouchableOpacity>

              {selectedMethod === 'sms' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.textInput}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="+1234567890"
                    keyboardType="phone-pad"
                  />
                </View>
              )}

              {selectedMethod === 'email' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="email@example.com"
                    keyboardType="email-address"
                  />
                </View>
              )}

              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handle2FASetup}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            // Verification step
            <View>
              <Text style={styles.stepTitle}>Verify Setup</Text>
              
              {selectedMethod === 'totp' && setupResponse.secretKey && (
                <View style={styles.totpSetup}>
                  <Text style={styles.totpInstructions}>
                    1. Open your authenticator app{'\n'}
                    2. Scan the QR code or enter this secret key:{'\n'}
                  </Text>
                  <Text style={styles.secretKey}>{setupResponse.secretKey}</Text>
                  <Text style={styles.totpInstructions}>
                    3. Enter the 6-digit code from your app:
                  </Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Verification Code</Text>
                <TextInput
                  style={styles.textInput}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="000000"
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>

              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handle2FAVerification}
                disabled={isSubmitting || verificationCode.length !== 6}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify & Enable</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  // Render disable 2FA modal
  const renderDisable2FAModal = () => (
    <Modal
      visible={showDisable2FA}
      animationType="fade"
      transparent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.alertModal}>
          <Text style={styles.alertTitle}>Disable 2FA</Text>
          <Text style={styles.alertMessage}>
            Enter your current 2FA code to disable two-factor authentication:
          </Text>
          
          <TextInput
            style={styles.textInput}
            value={verificationCode}
            onChangeText={setVerificationCode}
            placeholder="000000"
            keyboardType="numeric"
            maxLength={6}
          />

          <View style={styles.alertActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => {
                setShowDisable2FA(false);
                setVerificationCode('');
              }}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={handle2FADisable}
              disabled={isSubmitting || verificationCode.length !== 6}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.dangerButtonText}>Disable</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render backup codes modal
  const renderBackupCodesModal = () => (
    <Modal
      visible={showBackupCodes}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View style={{ width: 60 }} />
          <Text style={styles.modalTitle}>Backup Codes</Text>
          <TouchableOpacity onPress={() => setShowBackupCodes(false)}>
            <Text style={styles.modalHeaderButton}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.backupCodesInstructions}>
            Save these backup codes in a secure place. Each code can only be used once:
          </Text>
          
          <View style={styles.backupCodesList}>
            {backupCodes.map((code, index) => (
              <Text key={index} style={styles.backupCode}>
                {code}
              </Text>
            ))}
          </View>
          
          <Text style={styles.backupCodesWarning}>
            ⚠️ If you lose access to your 2FA device, these codes are the only way to access your account.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
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
            <Text style={styles.loadingText}>Loading security settings...</Text>
          </View>
        )}

        {renderSecurityOverview()}
        {render2FASection()}
        {renderSecuritySettings()}
      </ScrollView>

      {render2FASetupModal()}
      {renderDisable2FAModal()}
      {renderBackupCodesModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fc',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  overviewCard: {
    marginBottom: 16,
  },
  riskLevel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskLevelTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  trustStatus: {
    backgroundColor: '#f0f9ff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  trustStatusText: {
    fontSize: 14,
    color: '#0369a1',
    textAlign: 'center',
  },
  recommendations: {
    backgroundColor: '#fefce8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde047',
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a16207',
    marginBottom: 8,
  },
  recommendationItem: {
    fontSize: 14,
    color: '#a16207',
    marginBottom: 4,
  },
  twoFactorEnabled: {
    marginBottom: 16,
  },
  twoFactorStatus: {
    marginBottom: 16,
  },
  enabledText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 4,
  },
  methodText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  backupCodesText: {
    fontSize: 14,
    color: '#6b7280',
  },
  twoFactorActions: {
    gap: 12,
  },
  twoFactorDisabled: {
    alignItems: 'center',
    padding: 20,
  },
  disabledText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  disabledDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingText: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
  },
  dangerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
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
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
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
  // Modal styles
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
    fontWeight: '500',
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
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 20,
    textAlign: 'center',
  },
  methodOption: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedMethod: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f9ff',
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  totpSetup: {
    marginBottom: 20,
  },
  totpInstructions: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  secretKey: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertModal: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 12,
  },
  alertMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  backupCodesInstructions: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  backupCodesList: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  backupCode: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  backupCodesWarning: {
    fontSize: 14,
    color: '#f59e0b',
    textAlign: 'center',
    fontWeight: '500',
  },
});