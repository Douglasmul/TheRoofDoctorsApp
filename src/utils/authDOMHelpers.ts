/**
 * @fileoverview Safe authentication utilities
 * Provides safe wrappers for authentication-related DOM operations
 * Addresses potential document.head.contains errors in React Native environments
 */

import { safeDOMOperation, safeDocumentHeadContains, isBrowser } from './environment';

// Platform check that works across environments
const getPlatform = (): string => {
  try {
    const { Platform } = require('react-native');
    return Platform.OS;
  } catch {
    return typeof window !== 'undefined' ? 'web' : 'unknown';
  }
};

/**
 * Safely checks if authentication scripts are loaded in web environments
 * This prevents errors when running in React Native environments
 */
export const checkAuthScriptsLoaded = (): boolean => {
  return safeDOMOperation(() => {
    // Check for common authentication library scripts
    const scripts = document.querySelectorAll('script[src*="auth"], script[src*="firebase"], script[src*="oauth"]');
    return scripts.length > 0;
  }, false); // Return false in React Native (no external auth scripts needed)
};

/**
 * Safely injects authentication-related styles if needed for web
 */
export const injectAuthStyles = (cssText: string): boolean => {
  if (!isBrowser()) {
    // In React Native, styles are handled differently (StyleSheet.create)
    return true;
  }

  return safeDOMOperation(() => {
    const existingStyle = document.getElementById('auth-styles');
    if (existingStyle && safeDocumentHeadContains(existingStyle)) {
      return true; // Already injected
    }

    const style = document.createElement('style');
    style.id = 'auth-styles';
    style.textContent = cssText;
    document.head.appendChild(style);
    return true;
  }, false);
};

/**
 * Safely handles token storage meta tags in web environments
 */
export const setTokenMetaTags = (tokens: { access?: string; refresh?: string }): boolean => {
  if (!isBrowser()) {
    // React Native uses SecureStore instead of meta tags
    return true;
  }

  return safeDOMOperation(() => {
    // Remove existing token meta tags for security
    const existingMetas = document.querySelectorAll('meta[name^="auth-"]');
    existingMetas.forEach(meta => {
      if (safeDocumentHeadContains(meta)) {
        document.head.removeChild(meta);
      }
    });

    // In a real app, you probably wouldn't store tokens in meta tags
    // This is just an example of safe DOM manipulation
    if (tokens.access) {
      const meta = document.createElement('meta');
      meta.name = 'auth-timestamp';
      meta.content = new Date().toISOString();
      document.head.appendChild(meta);
    }

    return true;
  }, false);
};

/**
 * Safely clears authentication-related DOM elements
 */
export const clearAuthDOM = (): boolean => {
  if (!isBrowser()) {
    return true; // Nothing to clear in React Native
  }

  return safeDOMOperation(() => {
    // Clear auth styles
    const authStyle = document.getElementById('auth-styles');
    if (authStyle && safeDocumentHeadContains(authStyle)) {
      document.head.removeChild(authStyle);
    }

    // Clear auth meta tags
    const authMetas = document.querySelectorAll('meta[name^="auth-"]');
    authMetas.forEach(meta => {
      if (safeDocumentHeadContains(meta)) {
        document.head.removeChild(meta);
      }
    });

    return true;
  }, false);
};

/**
 * Example of how to fix the specific error mentioned in AuthContext.tsx
 * This demonstrates safe DOM checking that works in both web and React Native
 */
export const exampleSafeDOMCheck = (element: Element | null): boolean => {
  // ❌ This would cause: TypeError: Cannot read property 'contains' of undefined
  // if (document.head.contains(element)) {
  //   return true;
  // }

  // ✅ This is the safe approach that works in both environments
  return safeDocumentHeadContains(element);
};

/**
 * Platform-aware authentication helper
 * Demonstrates how to handle different behaviors in web vs React Native
 */
export const platformAwareAuthSetup = (): { success: boolean; platform: string } => {
  const platform = getPlatform();
  
  if (platform === 'web') {
    // Web-specific authentication setup
    const webSetupSuccess = safeDOMOperation(() => {
      // Inject necessary auth styles
      injectAuthStyles(`
        .auth-form { 
          max-width: 400px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .auth-error { 
          color: #ff4444; 
          margin: 10px 0; 
        }
      `);
      
      return true;
    }, false);
    
    return { success: webSetupSuccess, platform };
  } else {
    // React Native-specific setup (iOS/Android)
    // No DOM operations needed, all styling done via StyleSheet
    return { success: true, platform };
  }
};