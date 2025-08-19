/**
 * @fileoverview Authentication form components
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../theme/theme';
import { validateEmail, validatePasswordStrength, debounce } from '../../utils/authValidation';
import { PasswordStrength } from '../../types/auth';

/**
 * Props for AuthFormField component
 */
interface AuthFormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'username' | 'name' | 'tel' | 'off';
  textContentType?: 'emailAddress' | 'password' | 'newPassword' | 'givenName' | 'familyName' | 'telephoneNumber';
  style?: ViewStyle;
  onBlur?: () => void;
  onFocus?: () => void;
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * Enhanced form field component for authentication
 */
export const AuthFormField: React.FC<AuthFormFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required = false,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete = 'off',
  textContentType,
  style,
  onBlur,
  onFocus,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  return (
    <View style={[styles.fieldContainer, style]} testID={testID}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text + '60'}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        textContentType={textContentType}
        accessible={accessible}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint}
        testID={`${testID}-input`}
      />
      {error && (
        <Text style={styles.errorText} testID={`${testID}-error`} accessible={true}>
          {error}
        </Text>
      )}
    </View>
  );
};

/**
 * Props for PasswordField component
 */
interface PasswordFieldProps extends Omit<AuthFormFieldProps, 'secureTextEntry'> {
  showPasswordToggle?: boolean;
  showStrengthIndicator?: boolean;
  onStrengthChange?: (strength: PasswordStrength) => void;
}

/**
 * Enhanced password field with visibility toggle and strength indicator
 */
export const PasswordField: React.FC<PasswordFieldProps> = ({
  showPasswordToggle = true,
  showStrengthIndicator = false,
  onStrengthChange,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

  // Debounced password strength validation
  const debouncedValidation = useCallback(
    debounce((password: string) => {
      if (showStrengthIndicator && password) {
        const strength = validatePasswordStrength(password);
        setPasswordStrength(strength);
        onStrengthChange?.(strength);
      } else {
        setPasswordStrength(null);
      }
    }, 300),
    [showStrengthIndicator, onStrengthChange]
  );

  const handlePasswordChange = useCallback(
    (text: string) => {
      props.onChangeText(text);
      if (showStrengthIndicator) {
        debouncedValidation(text);
      }
    },
    [props.onChangeText, showStrengthIndicator, debouncedValidation]
  );

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible(prev => !prev);
  }, []);

  const getStrengthColor = (score: number): string => {
    switch (score) {
      case 0:
      case 1:
        return theme.colors.error;
      case 2:
        return theme.colors.warning;
      case 3:
        return '#3498db';
      case 4:
        return theme.colors.success;
      default:
        return theme.colors.text + '40';
    }
  };

  const getStrengthLabel = (score: number): string => {
    switch (score) {
      case 0:
        return 'Very Weak';
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Strong';
      default:
        return '';
    }
  };

  return (
    <View style={props.style}>
      <View style={styles.passwordContainer}>
        <AuthFormField
          {...props}
          onChangeText={handlePasswordChange}
          secureTextEntry={!isPasswordVisible}
          textContentType={props.textContentType || 'password'}
          style={styles.passwordInput}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={togglePasswordVisibility}
            testID={`${props.testID}-toggle`}
            accessible={true}
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
          >
            <Text style={styles.passwordToggleText}>
              {isPasswordVisible ? '🙈' : '👁️'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {showStrengthIndicator && passwordStrength && props.value && (
        <View style={styles.strengthContainer} testID={`${props.testID}-strength`}>
          <View style={styles.strengthHeader}>
            <Text style={styles.strengthLabel}>Password Strength</Text>
            <Text style={[styles.strengthScore, { color: getStrengthColor(passwordStrength.score) }]}>
              {getStrengthLabel(passwordStrength.score)}
            </Text>
          </View>
          
          <View style={styles.strengthBar}>
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={[
                  styles.strengthSegment,
                  {
                    backgroundColor:
                      index < passwordStrength.score
                        ? getStrengthColor(passwordStrength.score)
                        : theme.colors.text + '20',
                  },
                ]}
              />
            ))}
          </View>

          {passwordStrength.feedback.length > 0 && (
            <View style={styles.strengthFeedback}>
              {passwordStrength.feedback.map((item, index) => (
                <Text key={index} style={styles.strengthFeedbackText}>
                  • {item}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

/**
 * Props for AuthButton component
 */
interface AuthButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'social';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: ViewStyle;
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * Enhanced button component for authentication
 */
export const AuthButton: React.FC<AuthButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle = styles.button;
    switch (variant) {
      case 'secondary':
        return { ...baseStyle, ...styles.buttonSecondary };
      case 'outline':
        return { ...baseStyle, ...styles.buttonOutline };
      case 'social':
        return { ...baseStyle, ...styles.buttonSocial };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle = styles.buttonText;
    switch (variant) {
      case 'secondary':
        return { ...baseStyle, ...styles.buttonTextSecondary };
      case 'outline':
        return { ...baseStyle, ...styles.buttonTextOutline };
      case 'social':
        return { ...baseStyle, ...styles.buttonTextSocial };
      default:
        return baseStyle;
    }
  };

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color="white" testID={`${testID}-loading`} />
      ) : (
        <View style={styles.buttonContent}>
          {icon && <Text style={styles.buttonIcon}>{icon}</Text>}
          <Text style={[getTextStyle(), disabled && styles.buttonTextDisabled]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

/**
 * Props for CheckboxField component
 */
interface CheckboxFieldProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  error?: string;
  required?: boolean;
  style?: ViewStyle;
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * Checkbox component for terms agreement
 */
export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  label,
  value,
  onValueChange,
  error,
  required = false,
  style,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
}) => {
  return (
    <View style={[styles.checkboxContainer, style]} testID={testID}>
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => onValueChange(!value)}
        testID={`${testID}-checkbox`}
        accessible={accessible}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: value }}
      >
        <View style={[styles.checkbox, value && styles.checkboxChecked]}>
          {value && <Text style={styles.checkboxTick}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </TouchableOpacity>
      {error && (
        <Text style={styles.errorText} testID={`${testID}-error`} accessible={true}>
          {error}
        </Text>
      )}
    </View>
  );
};

/**
 * Styles for authentication components
 */
const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  required: {
    color: theme.colors.error,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.text + '40',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: 'white',
    minHeight: 56,
  },
  inputFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    marginTop: 4,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    marginBottom: 0,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 40, // Adjust based on label height
    padding: 8,
  },
  passwordToggleText: {
    fontSize: 18,
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthLabel: {
    fontSize: 14,
    color: theme.colors.text,
  },
  strengthScore: {
    fontSize: 14,
    fontWeight: '600',
  },
  strengthBar: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  strengthSegment: {
    flex: 1,
    marginRight: 2,
    borderRadius: 2,
  },
  strengthFeedback: {
    marginTop: 4,
  },
  strengthFeedbackText: {
    fontSize: 12,
    color: theme.colors.text + '80',
    lineHeight: 16,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.accent,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  buttonSocial: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.text + '40',
  },
  buttonDisabled: {
    backgroundColor: theme.colors.text + '40',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  buttonTextSecondary: {
    color: 'white',
  },
  buttonTextOutline: {
    color: theme.colors.primary,
  },
  buttonTextSocial: {
    color: theme.colors.text,
  },
  buttonTextDisabled: {
    color: theme.colors.text + '60',
  },
  checkboxContainer: {
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: theme.colors.text + '40',
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxTick: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
});