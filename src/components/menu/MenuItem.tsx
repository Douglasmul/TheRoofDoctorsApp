/**
 * @fileoverview MenuItem component with modern design and accessibility
 * Professional menu item with icons, descriptions, and interaction feedback
 * @version 1.0.0
 */

import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { theme } from '../../theme/theme';
import { responsiveStyle } from '../../utils/responsive';

interface MenuItemProps {
  title: string;
  description?: string;
  icon?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning';
  disabled?: boolean;
  badge?: string | number;
  testID?: string;
  accessibilityLabel?: string;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  title,
  description,
  icon,
  onPress,
  variant = 'primary',
  disabled = false,
  badge,
  testID,
  accessibilityLabel,
}) => {
  // Separate animated values for different properties to avoid conflicts:
  // scaleAnim: For transform animations (can use native driver)
  // pressAnim: For backgroundColor animation (requires JS thread)
  const [scaleAnim] = useState(new Animated.Value(1));
  const [pressAnim] = useState(new Animated.Value(0));

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true, // Transform animations can use native driver
        tension: 300,
        friction: 10,
      }),
      Animated.timing(pressAnim, {
        toValue: 1,
        duration: theme.animations.duration.fast,
        useNativeDriver: false, // backgroundColor requires JS thread
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true, // Transform animations can use native driver
        tension: 300,
        friction: 10,
      }),
      Animated.timing(pressAnim, {
        toValue: 0,
        duration: theme.animations.duration.fast,
        useNativeDriver: false, // backgroundColor requires JS thread
      }),
    ]).start();
  };

  const handlePress = () => {
    if (!disabled) {
      // Haptic feedback (if available)
      // HapticFeedback.impactAsync(HapticFeedback.ImpactFeedbackStyle.Light);
      
      // Accessibility announcement
      AccessibilityInfo.announceForAccessibility(`${title} selected`);
      
      onPress();
    }
  };

  const getVariantStyles = () => {
    const baseStyles = {
      backgroundColor: 'transparent',
      textColor: theme.colors.gray[700],
      iconColor: theme.colors.gray[600],
      descriptionColor: theme.colors.gray[500],
    };

    if (disabled) {
      return {
        ...baseStyles,
        textColor: theme.colors.gray[400],
        iconColor: theme.colors.gray[300],
        descriptionColor: theme.colors.gray[300],
      };
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          textColor: theme.colors.primary[700],
          iconColor: theme.colors.primary[600],
        };
      case 'secondary':
        return baseStyles;
      case 'danger':
        return {
          ...baseStyles,
          textColor: theme.colors.error[600],
          iconColor: theme.colors.error[500],
        };
      case 'warning':
        return {
          ...baseStyles,
          textColor: theme.colors.warning[600],
          iconColor: theme.colors.warning[500],
        };
      default:
        return baseStyles;
    }
  };

  const variantStyles = getVariantStyles();

  const backgroundColorInterpolate = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', theme.colors.gray[100]],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          backgroundColor: backgroundColorInterpolate,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || `${title}${description ? `, ${description}` : ''}`}
        accessibilityState={{ disabled }}
        testID={testID}
        accessible={true}
      >
        <View style={styles.content}>
          {icon && (
            <View style={styles.iconContainer}>
              <Text style={[styles.icon, { color: variantStyles.iconColor }]}>
                {icon}
              </Text>
            </View>
          )}
          
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: variantStyles.textColor }]}>
              {title}
            </Text>
            {description && (
              <Text style={[styles.description, { color: variantStyles.descriptionColor }]}>
                {description}
              </Text>
            )}
          </View>
          
          <View style={styles.rightContainer}>
            {badge && (
              <View style={[
                styles.badge,
                variant === 'danger' && styles.badgeDanger,
                variant === 'warning' && styles.badgeWarning,
              ]}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            )}
            
            <Text style={[styles.chevron, { color: variantStyles.iconColor }]}>
              ›
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.xs,
    overflow: 'hidden',
  },
  
  touchable: {
    minHeight: 56, // Accessibility: minimum touch target
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  
  icon: {
    fontSize: 20,
    textAlign: 'center' as const,
  },
  
  textContainer: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  
  title: {
    ...theme.typography.body.regular,
    fontWeight: theme.typography.fontWeight.medium as any,
    marginBottom: 2,
  },
  
  description: {
    ...theme.typography.body.small,
    lineHeight: theme.typography.body.small.lineHeight,
  },
  
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  badge: {
    backgroundColor: theme.colors.primary[100],
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    marginRight: theme.spacing.sm,
    minWidth: 20,
    alignItems: 'center',
  },
  
  badgeDanger: {
    backgroundColor: theme.colors.error[100],
  },
  
  badgeWarning: {
    backgroundColor: theme.colors.warning[100],
  },
  
  badgeText: {
    ...theme.typography.caption,
    fontWeight: theme.typography.fontWeight.semibold as any,
    color: theme.colors.primary[700],
    textAlign: 'center' as const,
  },
  
  chevron: {
    fontSize: 18,
    fontWeight: 'bold',
    opacity: 0.6,
  },
});