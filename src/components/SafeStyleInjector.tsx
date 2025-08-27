/**
 * @fileoverview Safe style injection component
 * Demonstrates how to safely inject styles in both web and React Native environments
 * This addresses the "document.head.contains" error mentioned in the issue
 */

import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { safeDocumentHeadContains, safeDOMOperation, isBrowser, safeDocumentHeadAppendChild, safeDocumentHeadRemoveChild } from '../utils/environment';

interface SafeStyleInjectorProps {
  cssText: string;
  id?: string;
}

/**
 * Component that safely injects CSS styles in web environments
 * and gracefully handles React Native environments where document doesn't exist
 */
export const SafeStyleInjector: React.FC<SafeStyleInjectorProps> = ({ 
  cssText, 
  id = 'injected-styles' 
}) => {
  const styleElementRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    // Only attempt DOM operations in browser environments
    if (!isBrowser()) {
      console.log('SafeStyleInjector: Skipping style injection in React Native environment');
      return;
    }

    const injectStyles = () => {
      // Create style element
      const style = document.createElement('style');
      style.id = id;
      style.textContent = cssText;

      // Safe check if style is already in document head
      // This is where the original error "Cannot read property 'contains' of undefined" occurred
      const isAlreadyInHead = safeDocumentHeadContains(style);
      
      if (!isAlreadyInHead) {
        // Safely append to document head using the safe wrapper
        const success = safeDocumentHeadAppendChild(style);
        if (success) {
          styleElementRef.current = style;
        }
      }

      return style;
    };

    const cleanup = () => {
      if (styleElementRef.current) {
        safeDocumentHeadRemoveChild(styleElementRef.current);
        styleElementRef.current = null;
      }
    };

    // Inject styles
    injectStyles();

    // Cleanup on unmount
    return cleanup;
  }, [cssText, id]);

  // This component doesn't render anything visible
  return null;
};

/**
 * Hook for safely managing dynamic styles
 */
export const useSafeStyleInjection = (cssText: string, id?: string) => {
  useEffect(() => {
    if (!isBrowser()) {
      return;
    }

    const injectStyle = () => {
      // Check if style already exists
      const existingStyle = safeDOMOperation(() => 
        document.getElementById(id || 'dynamic-style'), null
      );

      if (!existingStyle) {
        const style = document.createElement('style');
        style.id = id || 'dynamic-style';
        style.textContent = cssText;
        
        // Use safe wrapper to append to head
        safeDocumentHeadAppendChild(style);
      }
    };

    injectStyle();

    return () => {
      safeDOMOperation(() => {
        const style = document.getElementById(id || 'dynamic-style') as HTMLStyleElement;
        if (style) {
          safeDocumentHeadRemoveChild(style);
        }
        return true;
      }, false);
    };
  }, [cssText, id]);
};

/**
 * Example of problematic code that would cause the error
 * This demonstrates the issue mentioned in the problem statement
 */
export const ProblematicStyleChecker = (styleElement: HTMLStyleElement) => {
  // ❌ This would cause: TypeError: Cannot read property 'contains' of undefined
  // if (document.head.contains(styleElement)) {
  //   console.log('Style is in head');
  // }

  // ✅ This is the safe approach
  if (safeDocumentHeadContains(styleElement)) {
    console.log('Style is safely checked and found in head');
  } else {
    console.log('Style is not in head or we are in React Native environment');
  }
};

export default SafeStyleInjector;