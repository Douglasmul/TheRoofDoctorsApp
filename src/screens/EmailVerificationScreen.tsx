/**
 * @fileoverview Email Verification Screen
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme/theme';
import { useAuth } from '../contexts/AuthContext';
import { AuthButton } from '../components/auth/AuthFormComponents';

interface EmailVerificationRouteParams {
  email?: string;
  token?: string;
}

export default function EmailVerificationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { 
    verifyEmail, 
    resendVerificationEmail, 
    isLoading, 
    error, 
    clearError, 
    user,
    isEmailVerified 
  } = useAuth();

  // Get email and token from route params
  const params = route.params as EmailVerificationRouteParams;
  const email = params?.email || user?.email || '';
  const token = params?.token;

  // State
  const [isResendSuccess, setIsResendSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Auto-verify if token is provided
  useEffect(() => {
    if (token) {
      handleVerifyEmail(token);
    }
  }, [token]);

  // Navigate to home if email is verified
  useEffect(() => {
    if (isEmailVerified) {
      navigation.navigate('Home' as never);
    }
  }, [isEmailVerified, navigation]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Clear auth errors when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Handle email verification
  const handleVerifyEmail = useCallback(async (verificationToken: string) => {
    try {
      clearError();
      await verifyEmail(verificationToken);
      
      Alert.alert(
        t('common.success'),
        t('auth.emailVerification.success'),
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.navigate('Home' as never),
          },
        ]
      );
    } catch (error: any) {
      console.error('Email verification error:', error);
      
      if (error.code === 'INVALID_TOKEN') {
        Alert.alert(
          t('common.error'),
          t('auth.emailVerification.invalidToken'),
          [{ text: t('common.ok') }]
        );
      } else if (error.code === 'ALREADY_VERIFIED') {
        Alert.alert(
          t('common.success'),
          t('auth.emailVerification.alreadyVerified'),
          [
            {
              text: t('common.ok'),
              onPress: () => navigation.navigate('Home' as never),
            },
          ]
        );
      } else {
        Alert.alert(
          t('common.error'),
          error.message || t('auth.errors.unknownError'),
          [{ text: t('common.ok') }]
        );
      }
    }
  }, [verifyEmail, clearError, t, navigation]);

  // Handle resend verification email
  const handleResendVerification = useCallback(async () => {
    try {
      clearError();
      setIsResendSuccess(false);
      
      await resendVerificationEmail();
      
      setIsResendSuccess(true);
      setResendCooldown(60); // 60 second cooldown
      
      Alert.alert(
        t('common.success'),
        t('auth.emailVerification.resendSuccess'),
        [{ text: t('common.ok') }]
      );
    } catch (error: any) {
      console.error('Resend verification error:', error);
      Alert.alert(
        t('common.error'),
        error.message || t('auth.errors.unknownError'),
        [{ text: t('common.ok') }]
      );
    }
  }, [resendVerificationEmail, clearError, t]);

  // Navigate to change email (would be implemented in profile)
  const navigateToChangeEmail = useCallback(() => {
    navigation.navigate('Profile' as never);
  }, [navigation]);

  // Navigate to login
  const navigateToLogin = useCallback(() => {
    navigation.navigate('Login' as never);
  }, [navigation]);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📧</Text>
        </View>
        <Text style={styles.title}>{t('auth.emailVerification.title')}</Text>
        <Text style={styles.subtitle}>
          {t('auth.emailVerification.subtitle', { email })}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Success Message */}
        {isResendSuccess && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>
              {t('auth.emailVerification.resendSuccess')}
            </Text>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            {t('auth.emailVerification.instructions')}
          </Text>
        </View>

        {/* Resend Button */}
        <AuthButton
          title={
            resendCooldown > 0 
              ? `Resend in ${resendCooldown}s`
              : t('auth.emailVerification.resendButton')
          }
          onPress={handleResendVerification}
          loading={isLoading}
          disabled={isLoading || resendCooldown > 0}
          variant="outline"
          style={styles.resendButton}
          testID="email-verification-resend"
          accessibilityLabel="Resend verification email"
          accessibilityHint="Tap to send another verification email"
        />

        {/* Additional Help */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            {t('auth.emailVerification.checkSpam')}
          </Text>
        </View>

        {/* Change Email */}
        <TouchableOpacity 
          style={styles.linkContainer}
          onPress={navigateToChangeEmail}
          testID="email-verification-change"
          accessible={true}
          accessibilityLabel="Change email address"
          accessibilityHint="Update your email address"
          accessibilityRole="button"
        >
          <Text style={styles.linkText}>
            {t('auth.emailVerification.changeEmail')}
          </Text>
        </TouchableOpacity>

        {/* Back to Login */}
        <TouchableOpacity 
          style={styles.linkContainer}
          onPress={navigateToLogin}
          testID="email-verification-login"
          accessible={true}
          accessibilityLabel="Back to login"
          accessibilityHint="Return to the login screen"
          accessibilityRole="button"
        >
          <Text style={styles.linkText}>
            ← Back to Login
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text + '80',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: theme.colors.error + '10',
    borderWidth: 1,
    borderColor: theme.colors.error + '40',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  successContainer: {
    backgroundColor: theme.colors.success + '10',
    borderWidth: 1,
    borderColor: theme.colors.success + '40',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  successText: {
    color: theme.colors.success,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
  instructionsContainer: {
    backgroundColor: theme.colors.primary + '10',
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
  },
  instructionsText: {
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  resendButton: {
    marginBottom: 32,
  },
  helpContainer: {
    marginBottom: 24,
  },
  helpText: {
    color: theme.colors.text + '60',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  linkContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  linkText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});