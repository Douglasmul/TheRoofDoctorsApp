/**
 * @fileoverview Enhanced Login Screen with full authentication functionality
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
import { AuthFormField, AuthButton, CheckboxField, PasswordField } from '../components/auth/AuthFormComponents';
import { SocialLoginSection } from '../components/auth/SocialLogin';
import { validateEmail, validateRequired } from '../utils/authValidation';
import { LoginCredentials } from '../types/auth';

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();

  // Form state
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
    rememberMe: false,
  });

  // Validation errors
  const [errors, setErrors] = useState<LoginErrors>({});

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
  const updateForm = useCallback((field: keyof LoginForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field as keyof LoginErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear general error
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  }, [errors]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: LoginErrors = {};

    // Email validation
    if (!validateRequired(form.email)) {
      newErrors.email = t('auth.errors.required');
    } else if (!validateEmail(form.email)) {
      newErrors.email = t('auth.errors.invalidEmail');
    }

    // Password validation
    if (!validateRequired(form.password)) {
      newErrors.password = t('auth.errors.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, t]);

  // Handle login submission
  const handleLogin = useCallback(async () => {
    // Clear previous errors
    clearError();
    setErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      const credentials: LoginCredentials = {
        email: form.email.trim(),
        password: form.password,
        rememberMe: form.rememberMe,
      };

      await login(credentials);
      
      // Success - navigation will happen automatically via useEffect
      Alert.alert(
        t('common.success'),
        t('auth.login.success'),
        [{ text: t('common.ok') }]
      );
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Set specific error message
      if (error.code === 'RATE_LIMITED') {
        setErrors({ general: error.message });
      } else if (error.code === 'INVALID_CREDENTIALS') {
        setErrors({ general: t('auth.login.invalidCredentials') });
      } else if (error.code === 'EMAIL_NOT_VERIFIED') {
        setErrors({ general: t('auth.login.emailNotVerified') });
        // Could navigate to email verification screen here
      } else if (error.code === 'ACCOUNT_LOCKED') {
        setErrors({ general: t('auth.login.accountLocked') });
      } else {
        setErrors({ general: error.message || t('auth.errors.unknownError') });
      }
    }
  }, [form, login, validateForm, clearError, t]);

  // Handle social login success
  const handleSocialLoginSuccess = useCallback(() => {
    Alert.alert(
      t('common.success'),
      t('auth.login.success'),
      [{ text: t('common.ok') }]
    );
  }, [t]);

  // Handle social login error
  const handleSocialLoginError = useCallback((errorMessage: string) => {
    setErrors({ general: errorMessage });
  }, []);

  // Navigate to signup
  const navigateToSignup = useCallback(() => {
    navigation.navigate('Signup' as never);
  }, [navigation]);

  // Navigate to forgot password
  const navigateToForgotPassword = useCallback(() => {
    navigation.navigate('ForgotPassword' as never);
  }, [navigation]);

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
          <Text style={styles.title}>{t('auth.login.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          {/* General Error */}
          {(errors.general || error) && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {errors.general || error}
              </Text>
            </View>
          )}

          {/* Email Field */}
          <AuthFormField
            label={t('auth.login.email')}
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
            testID="login-email"
            accessibilityLabel="Email address"
            accessibilityHint="Enter your email address to sign in"
          />

          {/* Password Field */}
          <PasswordField
            label={t('auth.login.password')}
            value={form.password}
            onChangeText={(value) => updateForm('password', value)}
            placeholder="Enter your password"
            error={errors.password}
            required
            autoComplete="password"
            textContentType="password"
            onFocus={() => handleFieldFocus('password')}
            onBlur={handleFieldBlur}
            testID="login-password"
            accessibilityLabel="Password"
            accessibilityHint="Enter your password to sign in"
          />

          {/* Remember Me Checkbox */}
          <CheckboxField
            label={t('auth.login.rememberMe')}
            value={form.rememberMe}
            onValueChange={(value) => updateForm('rememberMe', value)}
            testID="login-remember-me"
            accessibilityLabel="Remember me"
            accessibilityHint="Keep me signed in on this device"
          />

          {/* Forgot Password Link */}
          <TouchableOpacity 
            style={styles.forgotPasswordContainer}
            onPress={navigateToForgotPassword}
            testID="login-forgot-password"
            accessible={true}
            accessibilityLabel="Forgot password"
            accessibilityHint="Reset your password if you've forgotten it"
            accessibilityRole="button"
          >
            <Text style={styles.forgotPasswordText}>
              {t('auth.login.forgotPassword')}
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <AuthButton
            title={t('auth.login.loginButton')}
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.loginButton}
            testID="login-submit"
            accessibilityLabel="Sign in"
            accessibilityHint="Tap to sign in to your account"
          />

          {/* Social Login */}
          <SocialLoginSection
            title={t('auth.login.socialLogin')}
            onSuccess={handleSocialLoginSuccess}
            onError={handleSocialLoginError}
            disabled={isLoading}
            testID="login-social"
          />

          {/* Signup Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>
              {t('auth.login.noAccount')}{' '}
            </Text>
            <TouchableOpacity 
              onPress={navigateToSignup}
              testID="login-signup-link"
              accessible={true}
              accessibilityLabel="Sign up"
              accessibilityHint="Create a new account"
              accessibilityRole="button"
            >
              <Text style={styles.signupLink}>
                {t('auth.login.signupLink')}
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
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    padding: 4,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: 24,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 16,
  },
  signupText: {
    fontSize: 14,
    color: theme.colors.text + '80',
  },
  signupLink: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});