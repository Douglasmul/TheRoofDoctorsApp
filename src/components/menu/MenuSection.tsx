/**
 * @fileoverview MenuSection component with expand/collapse functionality
 * Professional menu section with smooth animations and accessibility
 * @version 1.0.0
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  AccessibilityInfo,
} from 'react-native';
import { theme } from '../../theme/theme';
import { responsiveStyle, layout } from '../../utils/responsive';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface MenuSectionProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  variant?: 'primary' | 'secondary' | 'tertiary';
  testID?: string;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  title,
  icon,
  children,
  defaultExpanded = false,
  variant = 'primary',
  testID,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [rotateAnim] = useState(new Animated.Value(defaultExpanded ? 1 : 0));

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    
    // Smooth layout animation
    LayoutAnimation.configureNext({
      duration: theme.animations.duration.normal,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
    
    // Rotate animation for chevron
    Animated.timing(rotateAnim, {
      toValue: newExpanded ? 1 : 0,
      duration: theme.animations.duration.normal,
      useNativeDriver: true,
    }).start();
    
    setIsExpanded(newExpanded);
    
    // Announce state change for accessibility
    AccessibilityInfo.announceForAccessibility(
      `${title} section ${newExpanded ? 'expanded' : 'collapsed'}`
    );
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primary[50],
          borderColor: theme.colors.primary[200],
          titleColor: theme.colors.primary[700],
        };
      case 'secondary':
        return {
          backgroundColor: theme.colors.gray[50],
          borderColor: theme.colors.gray[200],
          titleColor: theme.colors.gray[700],
        };
      case 'tertiary':
        return {
          backgroundColor: 'transparent',
          borderColor: theme.colors.gray[200],
          titleColor: theme.colors.gray[600],
        };
      default:
        return {
          backgroundColor: theme.colors.primary[50],
          borderColor: theme.colors.primary[200],
          titleColor: theme.colors.primary[700],
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View 
      style={[
        styles.container,
        { 
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
        }
      ]}
      testID={testID}
    >
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpanded}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityLabel={`${title} section, ${isExpanded ? 'expanded' : 'collapsed'}, double tap to ${isExpanded ? 'collapse' : 'expand'}`}
        accessible={true}
      >
        <View style={styles.headerContent}>
          {icon && (
            <Text style={[styles.icon, { color: variantStyles.titleColor }]}>
              {icon}
            </Text>
          )}
          <Text style={[styles.title, { color: variantStyles.titleColor }]}>
            {title}
          </Text>
        </View>
        
        <Animated.Text
          style={[
            styles.chevron,
            { 
              color: variantStyles.titleColor,
              transform: [{ rotate: rotateInterpolate }],
            }
          ]}
        >
          ▼
        </Animated.Text>
      </TouchableOpacity>
      
      {isExpanded && (
        <View 
          style={styles.content}
          accessibilityRole="list"
        >
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    ...responsiveStyle.button(48),
    minHeight: 56, // Accessibility: minimum touch target
  },
  
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  icon: {
    fontSize: theme.typography.heading.h4.fontSize,
    marginRight: theme.spacing.md,
    width: 24,
    textAlign: 'center' as const,
  },
  
  title: {
    ...theme.typography.heading.h5,
    flex: 1,
  },
  
  chevron: {
    fontSize: theme.typography.body.regular.fontSize,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
  
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    paddingTop: 0,
  },
});