/**
 * @fileoverview Enhanced Signup Screen with full authentication functionality
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
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme/theme';
import { useAuth } from '../contexts/AuthContext';
import { AuthFormField, AuthButton, CheckboxField, PasswordField } from '../components/auth/AuthFormComponents';
import { SocialLoginSection } from '../components/auth/SocialLogin';
import { validateEmail, validateRequired, validateName } from '../utils/authValidation';
import { SignupCredentials, PasswordStrength } from '../types/auth';

interface SignupForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

interface SignupErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
  agreeToPrivacy?: string;
  general?: string;
}

export default function SignupScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { signup, isLoading, error, clearError, isAuthenticated } = useAuth();

  // Form state
  const [form, setForm] = useState<SignupForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
  });

  // Validation errors
  const [errors, setErrors] = useState<SignupErrors>({});

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

  // Field focus tracking
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Navigate to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigation.navigate('Home' as never);
    }
  }, [isAuthenticated, navigation]);

  // Clear auth errors when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Update form field
  const updateForm = useCallback((field: keyof SignupForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field as keyof SignupErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear general error
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }

    // Clear confirm password error if passwords now match
    if (field === 'password' && form.confirmPassword) {
      if (value === form.confirmPassword && errors.confirmPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: undefined }));
      }
    }
    
    if (field === 'confirmPassword' && form.password) {
      if (value === form.password && errors.confirmPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: undefined }));
      }
    }
  }, [errors, form.confirmPassword, form.password]);

  // Handle password strength change
  const handlePasswordStrengthChange = useCallback((strength: PasswordStrength) => {
    setPasswordStrength(strength);
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: SignupErrors = {};

    // First name validation
    if (!validateRequired(form.firstName)) {
      newErrors.firstName = t('auth.errors.required');
    } else if (!validateName(form.firstName)) {
      newErrors.firstName = 'Please enter a valid first name';
    }

    // Last name validation
    if (!validateRequired(form.lastName)) {
      newErrors.lastName = t('auth.errors.required');
    } else if (!validateName(form.lastName)) {
      newErrors.lastName = 'Please enter a valid last name';
    }

    // Email validation
    if (!validateRequired(form.email)) {
      newErrors.email = t('auth.errors.required');
    } else if (!validateEmail(form.email)) {
      newErrors.email = t('auth.errors.invalidEmail');
    }

    // Password validation
    if (!validateRequired(form.password)) {
      newErrors.password = t('auth.errors.required');
    } else if (passwordStrength && passwordStrength.score < 2) {
      newErrors.password = t('auth.errors.weakPassword');
    }

    // Confirm password validation
    if (!validateRequired(form.confirmPassword)) {
      newErrors.confirmPassword = t('auth.errors.required');
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = t('auth.errors.passwordMismatch');
    }

    // Terms validation
    if (!form.agreeToTerms) {
      newErrors.agreeToTerms = t('auth.signup.termsRequired');
    }

    // Privacy validation
    if (!form.agreeToPrivacy) {
      newErrors.agreeToPrivacy = t('auth.signup.termsRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, passwordStrength, t]);

  // Handle signup submission
  const handleSignup = useCallback(async () => {
    // Clear previous errors
    clearError();
    setErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      const credentials: SignupCredentials = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        agreeToTerms: form.agreeToTerms,
        agreeToPrivacy: form.agreeToPrivacy,
      };

      await signup(credentials);
      
      // Success - show verification message
      Alert.alert(
        t('common.success'),
        t('auth.signup.verificationSent', { email: form.email }),
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.navigate('EmailVerification' as never, { email: form.email }),
          },
        ]
      );
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Set specific error message
      if (error.code === 'EMAIL_EXISTS') {
        setErrors({ email: t('auth.signup.emailExists') });
      } else if (error.code === 'WEAK_PASSWORD') {
        setErrors({ password: t('auth.signup.weakPassword') });
      } else if (error.code === 'TERMS_NOT_ACCEPTED') {
        setErrors({ general: t('auth.signup.termsRequired') });
      } else if (error.field) {
        // Field-specific error
        setErrors({ [error.field]: error.message });
      } else {
        setErrors({ general: error.message || t('auth.errors.unknownError') });
      }
    }
  }, [form, signup, validateForm, clearError, t, navigation]);

  // Handle social login success
  const handleSocialLoginSuccess = useCallback(() => {
    Alert.alert(
      t('common.success'),
      t('auth.signup.success'),
      [{ text: t('common.ok') }]
    );
  }, [t]);

  // Handle social login error
  const handleSocialLoginError = useCallback((errorMessage: string) => {
    setErrors({ general: errorMessage });
  }, []);

  // Navigate to login
  const navigateToLogin = useCallback(() => {
    navigation.navigate('Login' as never);
  }, [navigation]);

  // Open terms of service
  const openTermsOfService = useCallback(() => {
    Linking.openURL('https://theroofDoctors.com/terms');
  }, []);

  // Open privacy policy
  const openPrivacyPolicy = useCallback(() => {
    Linking.openURL('https://theroofDoctors.com/privacy');
  }, []);

  // Handle field focus
  const handleFieldFocus = useCallback((fieldName: string) => {
    setFocusedField(fieldName);
  }, []);

  const handleFieldBlur = useCallback(() => {
    setFocusedField(null);
  }, []);

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
          <Text style={styles.title}>{t('auth.signup.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.signup.subtitle')}</Text>
        </View>

        {/* Signup Form */}
        <View style={styles.form}>
          {/* General Error */}
          {(errors.general || error) && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {errors.general || error}
              </Text>
            </View>
          )}

          {/* Name Fields Row */}
          <View style={styles.nameRow}>
            <AuthFormField
              label={t('auth.signup.firstName')}
              value={form.firstName}
              onChangeText={(value) => updateForm('firstName', value)}
              placeholder="First name"
              error={errors.firstName}
              required
              autoCapitalize="words"
              autoComplete="name"
              textContentType="givenName"
              onFocus={() => handleFieldFocus('firstName')}
              onBlur={handleFieldBlur}
              style={styles.nameField}
              testID="signup-first-name"
              accessibilityLabel="First name"
              accessibilityHint="Enter your first name"
            />

            <AuthFormField
              label={t('auth.signup.lastName')}
              value={form.lastName}
              onChangeText={(value) => updateForm('lastName', value)}
              placeholder="Last name"
              error={errors.lastName}
              required
              autoCapitalize="words"
              autoComplete="name"
              textContentType="familyName"
              onFocus={() => handleFieldFocus('lastName')}
              onBlur={handleFieldBlur}
              style={styles.nameField}
              testID="signup-last-name"
              accessibilityLabel="Last name"
              accessibilityHint="Enter your last name"
            />
          </View>

          {/* Email Field */}
          <AuthFormField
            label={t('auth.signup.email')}
            value={form.email}
            onChangeText={(value) => updateForm('email', value)}
            placeholder="Enter your email"
            error={errors.email}
            required
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            onFocus={() => handleFieldFocus('email')}
            onBlur={handleFieldBlur}
            testID="signup-email"
            accessibilityLabel="Email address"
            accessibilityHint="Enter your email address for your account"
          />

          {/* Password Field */}
          <PasswordField
            label={t('auth.signup.password')}
            value={form.password}
            onChangeText={(value) => updateForm('password', value)}
            placeholder="Create a password"
            error={errors.password}
            required
            showStrengthIndicator={true}
            onStrengthChange={handlePasswordStrengthChange}
            autoComplete="new-password"
            textContentType="newPassword"
            onFocus={() => handleFieldFocus('password')}
            onBlur={handleFieldBlur}
            testID="signup-password"
            accessibilityLabel="Password"
            accessibilityHint="Create a strong password for your account"
          />

          {/* Confirm Password Field */}
          <PasswordField
            label={t('auth.signup.confirmPassword')}
            value={form.confirmPassword}
            onChangeText={(value) => updateForm('confirmPassword', value)}
            placeholder="Confirm your password"
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
            textContentType="newPassword"
            onFocus={() => handleFieldFocus('confirmPassword')}
            onBlur={handleFieldBlur}
            testID="signup-confirm-password"
            accessibilityLabel="Confirm password"
            accessibilityHint="Re-enter your password to confirm"
          />

          {/* Terms Agreement */}
          <CheckboxField
            label={
              <Text>
                I agree to the{' '}
                <Text style={styles.linkText} onPress={openTermsOfService}>
                  Terms of Service
                </Text>
              </Text>
            }
            value={form.agreeToTerms}
            onValueChange={(value) => updateForm('agreeToTerms', value)}
            error={errors.agreeToTerms}
            required
            testID="signup-terms"
            accessibilityLabel="Agree to Terms of Service"
            accessibilityHint="Required to create an account"
          />

          {/* Privacy Agreement */}
          <CheckboxField
            label={
              <Text>
                I agree to the{' '}
                <Text style={styles.linkText} onPress={openPrivacyPolicy}>
                  Privacy Policy
                </Text>
              </Text>
            }
            value={form.agreeToPrivacy}
            onValueChange={(value) => updateForm('agreeToPrivacy', value)}
            error={errors.agreeToPrivacy}
            required
            testID="signup-privacy"
            accessibilityLabel="Agree to Privacy Policy"
            accessibilityHint="Required to create an account"
          />

          {/* Signup Button */}
          <AuthButton
            title={t('auth.signup.signupButton')}
            onPress={handleSignup}
            loading={isLoading}
            disabled={isLoading || !form.agreeToTerms || !form.agreeToPrivacy}
            style={styles.signupButton}
            testID="signup-submit"
            accessibilityLabel="Create account"
            accessibilityHint="Tap to create your new account"
          />

          {/* Social Login */}
          <SocialLoginSection
            title={t('auth.signup.socialSignup')}
            onSuccess={handleSocialLoginSuccess}
            onError={handleSocialLoginError}
            disabled={isLoading}
            testID="signup-social"
          />

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              {t('auth.signup.haveAccount')}{' '}
            </Text>
            <TouchableOpacity 
              onPress={navigateToLogin}
              testID="signup-login-link"
              accessible={true}
              accessibilityLabel="Sign in"
              accessibilityHint="Sign in to your existing account"
              accessibilityRole="button"
            >
              <Text style={styles.loginLink}>
                {t('auth.signup.loginLink')}
              </Text>
            </TouchableOpacity>
          </View>
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
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameField: {
    flex: 1,
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  signupButton: {
    marginBottom: 24,
    marginTop: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 16,
  },
  loginText: {
    fontSize: 14,
    color: theme.colors.text + '80',
  },
  loginLink: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});