/**
 * @fileoverview Shared form components for quote system
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../theme/theme';

/**
 * Props for FormField component
 */
interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: ViewStyle;
}

/**
 * Reusable form field component
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required = false,
  multiline = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  style,
}) => {
  return (
    <View style={[styles.fieldContainer, style]}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          error && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text + '80'}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

/**
 * Props for FormPicker component
 */
interface FormPickerProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string }[];
  error?: string;
  required?: boolean;
  style?: ViewStyle;
}

/**
 * Reusable picker component
 */
export const FormPicker: React.FC<FormPickerProps> = ({
  label,
  value,
  onValueChange,
  options,
  error,
  required = false,
  style,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <View style={[styles.fieldContainer, style]}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TouchableOpacity
        style={[styles.picker, error && styles.inputError]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={[styles.pickerText, !selectedOption && styles.pickerPlaceholder]}>
          {selectedOption?.label || 'Select an option'}
        </Text>
        <Text style={styles.pickerArrow}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.pickerOptions}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.pickerOption,
                option.value === value && styles.pickerOptionSelected,
              ]}
              onPress={() => {
                onValueChange(option.value);
                setIsOpen(false);
              }}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  option.value === value && styles.pickerOptionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

/**
 * Props for FormSection component
 */
interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Form section component with title
 */
export const FormSection: React.FC<FormSectionProps> = ({
  title,
  children,
  style,
}) => {
  return (
    <View style={[styles.section, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
};

/**
 * Props for FormButton component
 */
interface FormButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

/**
 * Reusable form button component
 */
export const FormButton: React.FC<FormButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle = styles.button;
    switch (variant) {
      case 'secondary':
        return { ...baseStyle, ...styles.buttonSecondary };
      case 'outline':
        return { ...baseStyle, ...styles.buttonOutline };
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
    >
      <Text style={[getTextStyle(), disabled && styles.buttonTextDisabled]}>
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * Styles for form components
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
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: 'white',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    marginTop: 4,
  },
  picker: {
    borderWidth: 1,
    borderColor: theme.colors.text + '40',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  pickerPlaceholder: {
    color: theme.colors.text + '80',
  },
  pickerArrow: {
    fontSize: 12,
    color: theme.colors.text,
  },
  pickerOptions: {
    borderWidth: 1,
    borderColor: theme.colors.text + '40',
    borderRadius: 8,
    backgroundColor: 'white',
    marginTop: 4,
    maxHeight: 200,
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.text + '20',
  },
  pickerOptionSelected: {
    backgroundColor: theme.colors.primary + '20',
  },
  pickerOptionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  pickerOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 16,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.accent,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.text + '40',
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
  buttonTextDisabled: {
    color: theme.colors.text + '60',
  },
});