/**
 * @fileoverview Forgot Password Screen for password recovery
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme/theme';
import { useAuth } from '../contexts/AuthContext';
import { AuthFormField, AuthButton } from '../components/auth/AuthFormComponents';
import { validateEmail, validateRequired } from '../utils/authValidation';
import { PasswordResetRequest } from '../types/auth';

interface ForgotPasswordForm {
  email: string;
}

interface ForgotPasswordErrors {
  email?: string;
  general?: string;
}

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { forgotPassword, isLoading, error, clearError } = useAuth();

  // Form state
  const [form, setForm] = useState<ForgotPasswordForm>({
    email: '',
  });

  // Validation errors
  const [errors, setErrors] = useState<ForgotPasswordErrors>({});

  // Success state
  const [isSuccess, setIsSuccess] = useState(false);

  // Clear auth errors when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Update form field
  const updateForm = useCallback((field: keyof ForgotPasswordForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field as keyof ForgotPasswordErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear general error
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }

    // Clear success state when user starts typing
    if (isSuccess) {
      setIsSuccess(false);
    }
  }, [errors, isSuccess]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: ForgotPasswordErrors = {};

    // Email validation
    if (!validateRequired(form.email)) {
      newErrors.email = t('auth.errors.required');
    } else if (!validateEmail(form.email)) {
      newErrors.email = t('auth.errors.invalidEmail');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, t]);

  // Handle forgot password submission
  const handleForgotPassword = useCallback(async () => {
    // Clear previous errors
    clearError();
    setErrors({});
    setIsSuccess(false);

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      const request: PasswordResetRequest = {
        email: form.email.trim(),
      };

      await forgotPassword(request);
      
      // Success
      setIsSuccess(true);
      Alert.alert(
        t('common.success'),
        t('auth.forgotPassword.success', { email: form.email }),
        [{ text: t('common.ok') }]
      );
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      // Set specific error message
      if (error.code === 'USER_NOT_FOUND') {
        setErrors({ email: t('auth.forgotPassword.notFound') });
      } else if (error.code === 'RATE_LIMITED') {
        setErrors({ general: t('auth.forgotPassword.rateLimited') });
      } else {
        setErrors({ general: error.message || t('auth.errors.unknownError') });
      }
    }
  }, [form, forgotPassword, validateForm, clearError, t]);

  // Navigate back to login
  const navigateToLogin = useCallback(() => {
    navigation.navigate('Login' as never);
  }, [navigation]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('auth.forgotPassword.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.forgotPassword.subtitle')}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* General Error */}
          {(errors.general || error) && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {errors.general || error}
              </Text>
            </View>
          )}

          {/* Success Message */}
          {isSuccess && (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                {t('auth.forgotPassword.success', { email: form.email })}
              </Text>
            </View>
          )}

          {/* Email Field */}
          <AuthFormField
            label={t('auth.forgotPassword.email')}
            value={form.email}
            onChangeText={(value) => updateForm('email', value)}
            placeholder="Enter your email address"
            error={errors.email}
            required
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            testID="forgot-password-email"
            accessibilityLabel="Email address"
            accessibilityHint="Enter your email to receive password reset instructions"
          />

          {/* Send Reset Button */}
          <AuthButton
            title={t('auth.forgotPassword.sendButton')}
            onPress={handleForgotPassword}
            loading={isLoading}
            disabled={isLoading || isSuccess}
            style={styles.sendButton}
            testID="forgot-password-submit"
            accessibilityLabel="Send reset link"
            accessibilityHint="Tap to send password reset instructions to your email"
          />

          {/* Additional Information */}
          {isSuccess && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Check your email for password reset instructions. The link will expire in 1 hour.
              </Text>
              <Text style={styles.infoText}>
                If you don't see the email, check your spam folder.
              </Text>
            </View>
          )}

          {/* Back to Login */}
          <TouchableOpacity 
            style={styles.backToLoginContainer}
            onPress={navigateToLogin}
            testID="forgot-password-back"
            accessible={true}
            accessibilityLabel="Back to login"
            accessibilityHint="Return to the login screen"
            accessibilityRole="button"
          >
            <Text style={styles.backToLoginText}>
              ← {t('auth.forgotPassword.backToLogin')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  title: {
    fontSize: 32,
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
  form: {
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
  sendButton: {
    marginBottom: 24,
  },
  infoContainer: {
    backgroundColor: theme.colors.primary + '10',
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    color: theme.colors.text + '80',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  backToLoginContainer: {
    alignSelf: 'center',
    padding: 16,
  },
  backToLoginText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});