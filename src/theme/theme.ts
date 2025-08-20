/**
 * @fileoverview Enhanced theme system for The Roof Doctors App
 * Professional design system with accessibility and modern UI/UX principles
 * @version 2.0.0
 */

import { normalize, fontSize, spacing } from '../utils/responsive';

// Enhanced color palette with accessibility compliance (WCAG AA)
export const colors = {
  // Primary brand colors
  primary: {
    50: '#f0f7ff',
    100: '#e0efff',
    200: '#b8ddff',
    300: '#78c2ff',
    400: '#3fa4ff',
    500: '#1d89e4',
    600: '#234e70', // Main brand color
    700: '#1e4161',
    800: '#1a3752',
    900: '#162d43',
  },
  
  // Secondary/accent colors
  secondary: {
    50: '#fdf6e3',
    100: '#f9ebc7',
    200: '#f2d590',
    300: '#e8b959',
    400: '#e67e22', // Accent color
    500: '#d35400',
    600: '#b8470f',
    700: '#9d3c0a',
    800: '#823106',
    900: '#672702',
  },
  
  // Neutral grays
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  // Semantic colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Special colors
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
};

// Enhanced typography system
export const typography = {
  // Font families
  fontFamily: {
    primary: 'System', // System font for better performance
    mono: 'Courier New',
  },
  
  // Font weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Typography scale with responsive sizing
  heading: {
    h1: {
      fontSize: fontSize['5xl'],
      fontWeight: '700',
      lineHeight: fontSize['5xl'] * 1.2,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: fontSize['4xl'],
      fontWeight: '600',
      lineHeight: fontSize['4xl'] * 1.25,
      letterSpacing: -0.25,
    },
    h3: {
      fontSize: fontSize['3xl'],
      fontWeight: '600',
      lineHeight: fontSize['3xl'] * 1.3,
    },
    h4: {
      fontSize: fontSize['2xl'],
      fontWeight: '600',
      lineHeight: fontSize['2xl'] * 1.35,
    },
    h5: {
      fontSize: fontSize.xl,
      fontWeight: '500',
      lineHeight: fontSize.xl * 1.4,
    },
    h6: {
      fontSize: fontSize.lg,
      fontWeight: '500',
      lineHeight: fontSize.lg * 1.4,
    },
  },
  
  body: {
    large: {
      fontSize: fontSize.lg,
      fontWeight: '400',
      lineHeight: fontSize.lg * 1.5,
    },
    regular: {
      fontSize: fontSize.base,
      fontWeight: '400',
      lineHeight: fontSize.base * 1.5,
    },
    small: {
      fontSize: fontSize.sm,
      fontWeight: '400',
      lineHeight: fontSize.sm * 1.5,
    },
  },
  
  caption: {
    fontSize: fontSize.xs,
    fontWeight: '400',
    lineHeight: fontSize.xs * 1.4,
  },
};

// Shadow system for depth and elevation
export const shadows = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
};

// Border radius system
export const borderRadius = {
  none: 0,
  sm: normalize(4),
  md: normalize(8),
  lg: normalize(12),
  xl: normalize(16),
  '2xl': normalize(20),
  full: 9999,
};

// Animation timing values
export const animations = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  easing: {
    easeInOut: 'ease-in-out',
    easeOut: 'ease-out',
    easeIn: 'ease-in',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

// Component-specific theme tokens
export const components = {
  button: {
    height: {
      sm: normalize(36),
      md: normalize(44),
      lg: normalize(52),
    },
    padding: {
      sm: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
      md: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
      lg: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
    },
  },
  
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[50],
    ...shadows.md,
  },
  
  input: {
    height: normalize(48),
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
};

// Main theme object
export const theme = {
  colors,
  typography,
  shadows,
  borderRadius,
  animations,
  components,
  spacing,
  
  // Legacy colors for backward compatibility
  colors_legacy: {
    primary: colors.primary[600],
    accent: colors.secondary[400],
    background: colors.gray[50],
    text: colors.gray[800],
    success: colors.success[600],
    warning: colors.warning[500],
    error: colors.error[600],
  },
};
