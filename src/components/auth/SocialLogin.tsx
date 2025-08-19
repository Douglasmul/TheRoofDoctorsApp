/**
 * @fileoverview Social login components
 * @version 1.0.0
 * © 2025 The Roof Doctors
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ViewStyle,
} from 'react-native';
import { theme } from '../../theme/theme';
import { SocialLoginProvider } from '../../types/auth';
import { authService } from '../../services/AuthService';

/**
 * Props for SocialLoginButton component
 */
interface SocialLoginButtonProps {
  provider: SocialLoginProvider;
  onSuccess: () => void;
  onError: (error: string) => void;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Individual social login button
 */
export const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  provider,
  onSuccess,
  onError,
  disabled = false,
  style,
  testID,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = async () => {
    try {
      setIsLoading(true);
      await authService.socialLogin(provider.id);
      onSuccess();
    } catch (error: any) {
      console.error(`${provider.name} login error:`, error);
      onError(error.message || `${provider.name} login failed`);
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderIcon = () => {
    switch (provider.id) {
      case 'google':
        return 'G';
      case 'apple':
        return '';
      case 'facebook':
        return 'f';
      default:
        return '?';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.socialButton,
        { borderColor: provider.color + '40' },
        disabled && styles.socialButtonDisabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || isLoading}
      testID={testID}
      accessible={true}
      accessibilityLabel={`Continue with ${provider.name}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || isLoading }}
    >
      <View style={styles.socialButtonContent}>
        <View style={[styles.socialIcon, { backgroundColor: provider.color }]}>
          <Text style={styles.socialIconText}>
            {getProviderIcon()}
          </Text>
        </View>
        <Text style={styles.socialButtonText}>
          {isLoading ? 'Connecting...' : `Continue with ${provider.name}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Props for SocialLoginSection component
 */
interface SocialLoginSectionProps {
  title?: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Complete social login section with all providers
 */
export const SocialLoginSection: React.FC<SocialLoginSectionProps> = ({
  title = 'Or continue with',
  onSuccess,
  onError,
  disabled = false,
  style,
  testID,
}) => {
  const providers = authService.getSocialProviders();

  if (providers.length === 0) {
    return null;
  }

  return (
    <View style={[styles.socialSection, style]} testID={testID}>
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{title}</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialButtonsContainer}>
        {providers.map((provider) => (
          <SocialLoginButton
            key={provider.id}
            provider={provider}
            onSuccess={onSuccess}
            onError={onError}
            disabled={disabled}
            style={styles.socialButtonSpacing}
            testID={`${testID}-${provider.id}`}
          />
        ))}
      </View>
    </View>
  );
};

/**
 * Props for CompactSocialLogin component
 */
interface CompactSocialLoginProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Compact social login with icon-only buttons
 */
export const CompactSocialLogin: React.FC<CompactSocialLoginProps> = ({
  onSuccess,
  onError,
  disabled = false,
  style,
  testID,
}) => {
  const providers = authService.getSocialProviders();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  if (providers.length === 0) {
    return null;
  }

  const handlePress = async (provider: SocialLoginProvider) => {
    try {
      setLoadingProvider(provider.id);
      await authService.socialLogin(provider.id);
      onSuccess();
    } catch (error: any) {
      console.error(`${provider.name} login error:`, error);
      onError(error.message || `${provider.name} login failed`);
    } finally {
      setLoadingProvider(null);
    }
  };

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return 'G';
      case 'apple':
        return '';
      case 'facebook':
        return 'f';
      default:
        return '?';
    }
  };

  return (
    <View style={[styles.compactSection, style]} testID={testID}>
      <View style={styles.compactButtonsContainer}>
        {providers.map((provider) => (
          <TouchableOpacity
            key={provider.id}
            style={[
              styles.compactButton,
              { backgroundColor: provider.color },
              disabled && styles.compactButtonDisabled,
            ]}
            onPress={() => handlePress(provider)}
            disabled={disabled || loadingProvider !== null}
            testID={`${testID}-${provider.id}`}
            accessible={true}
            accessibilityLabel={`Sign in with ${provider.name}`}
            accessibilityRole="button"
            accessibilityState={{ disabled: disabled || loadingProvider !== null }}
          >
            <Text style={styles.compactButtonIcon}>
              {loadingProvider === provider.id ? '...' : getProviderIcon(provider.id)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

/**
 * Styles for social login components
 */
const styles = StyleSheet.create({
  socialSection: {
    marginVertical: 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.text + '20',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: theme.colors.text + '80',
  },
  socialButtonsContainer: {
    gap: 12,
  },
  socialButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    minHeight: 56,
  },
  socialButtonDisabled: {
    opacity: 0.5,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  socialIconText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  socialButtonSpacing: {
    marginBottom: 8,
  },
  compactSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  compactButtonsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  compactButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  compactButtonDisabled: {
    opacity: 0.5,
  },
  compactButtonIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});