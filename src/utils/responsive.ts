/**
 * @fileoverview Mobile responsiveness utilities
 * Provides consistent responsive design utilities for enterprise mobile app
 * @version 1.0.0
 * @enterprise
 */

import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Device type detection
export const isTablet = () => {
  const pixelDensity = PixelRatio.get();
  const adjustedWidth = SCREEN_WIDTH * pixelDensity;
  const adjustedHeight = SCREEN_HEIGHT * pixelDensity;
  
  if (pixelDensity < 2 && (adjustedWidth >= 1000 || adjustedHeight >= 1000)) {
    return true;
  } else {
    return (
      pixelDensity === 2 && 
      (adjustedWidth >= 1920 || adjustedHeight >= 1920)
    );
  }
};

export const isSmallDevice = () => SCREEN_WIDTH < 375;
export const isMediumDevice = () => SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
export const isLargeDevice = () => SCREEN_WIDTH >= 414;

// Responsive dimensions
export const normalize = (size: number) => {
  const scale = SCREEN_WIDTH / 375; // Base on iPhone 6/7/8 width
  const newSize = size * scale;
  
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

// Responsive font sizes
export const fontSize = {
  xs: normalize(10),
  sm: normalize(12),
  base: normalize(14),
  lg: normalize(16),
  xl: normalize(18),
  '2xl': normalize(20),
  '3xl': normalize(24),
  '4xl': normalize(28),
  '5xl': normalize(32),
  '6xl': normalize(36),
};

// Responsive spacing
export const spacing = {
  xs: normalize(4),
  sm: normalize(8),
  md: normalize(12),
  lg: normalize(16),
  xl: normalize(20),
  '2xl': normalize(24),
  '3xl': normalize(32),
  '4xl': normalize(40),
  '5xl': normalize(48),
};

// Responsive breakpoints
export const breakpoints = {
  sm: 375,
  md: 414,
  lg: 768,
  xl: 1024,
};

// Layout utilities
export const layout = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  isSmall: isSmallDevice(),
  isMedium: isMediumDevice(),
  isLarge: isLargeDevice(),
  isTablet: isTablet(),
  
  // Safe area considerations
  headerHeight: Platform.OS === 'ios' ? (isTablet() ? 70 : 60) : 56,
  tabBarHeight: Platform.OS === 'ios' ? (isTablet() ? 70 : 49) : 56,
  
  // Card and component sizing
  cardPadding: isSmallDevice() ? spacing.md : spacing.lg,
  sectionPadding: isSmallDevice() ? spacing.lg : spacing.xl,
  
  // Grid systems
  gridColumns: isTablet() ? 3 : (isLargeDevice() ? 2 : 1),
  gridGap: isSmallDevice() ? spacing.sm : spacing.md,
};

// Responsive styles generator
export const responsiveStyle = {
  // Responsive padding
  padding: (base: number) => ({
    padding: isSmallDevice() ? base * 0.75 : base,
  }),
  
  // Responsive margin
  margin: (base: number) => ({
    margin: isSmallDevice() ? base * 0.75 : base,
  }),
  
  // Responsive font size
  text: (baseSize: number) => ({
    fontSize: normalize(baseSize),
    lineHeight: normalize(baseSize * 1.4),
  }),
  
  // Responsive button
  button: (height: number = 48) => ({
    height: normalize(height),
    paddingHorizontal: normalize(16),
    borderRadius: normalize(8),
  }),
  
  // Responsive card
  card: () => ({
    padding: layout.cardPadding,
    borderRadius: normalize(12),
    marginBottom: spacing.md,
  }),
  
  // Responsive input
  input: () => ({
    height: normalize(48),
    paddingHorizontal: spacing.md,
    fontSize: fontSize.base,
    borderRadius: normalize(8),
  }),
  
  // Responsive icon
  icon: (size: number = 24) => ({
    width: normalize(size),
    height: normalize(size),
  }),
};

// Typography scale
export const typography = {
  // Headings
  h1: {
    fontSize: fontSize['5xl'],
    fontWeight: 'bold' as const,
    lineHeight: fontSize['5xl'] * 1.2,
  },
  h2: {
    fontSize: fontSize['4xl'],
    fontWeight: 'bold' as const,
    lineHeight: fontSize['4xl'] * 1.2,
  },
  h3: {
    fontSize: fontSize['3xl'],
    fontWeight: '600' as const,
    lineHeight: fontSize['3xl'] * 1.3,
  },
  h4: {
    fontSize: fontSize['2xl'],
    fontWeight: '600' as const,
    lineHeight: fontSize['2xl'] * 1.3,
  },
  h5: {
    fontSize: fontSize.xl,
    fontWeight: '600' as const,
    lineHeight: fontSize.xl * 1.4,
  },
  h6: {
    fontSize: fontSize.lg,
    fontWeight: '600' as const,
    lineHeight: fontSize.lg * 1.4,
  },
  
  // Body text
  body: {
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.5,
  },
  bodyLarge: {
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * 1.5,
  },
  bodySmall: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.4,
  },
  
  // Labels and captions
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500' as const,
    lineHeight: fontSize.sm * 1.3,
  },
  caption: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.3,
  },
  
  // Interactive text
  button: {
    fontSize: fontSize.base,
    fontWeight: '600' as const,
    lineHeight: fontSize.base * 1.2,
  },
  link: {
    fontSize: fontSize.base,
    fontWeight: '500' as const,
    lineHeight: fontSize.base * 1.4,
  },
};

// Color palette (optimized for mobile readability)
export const colors = {
  // Brand colors
  primary: '#234e70',
  primaryLight: '#3b82f6',
  primaryDark: '#1e40af',
  
  // Semantic colors
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Neutral colors
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  
  // Background colors
  background: '#f6f8fc',
  surface: '#ffffff',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Text colors
  textPrimary: '#374151',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textInverse: '#ffffff',
  
  // Border colors
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  borderDark: '#d1d5db',
};

// Shadows (optimized for mobile performance)
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export default {
  layout,
  spacing,
  fontSize,
  typography,
  colors,
  shadows,
  responsiveStyle,
  normalize,
  isTablet,
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
};