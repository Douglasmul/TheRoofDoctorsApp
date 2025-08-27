/**
 * @fileoverview Environment detection utilities
 * Provides safe methods to detect browser environment and prevent DOM access in React Native
 * @version 1.0.0
 */

/**
 * Safely checks if we're running in a browser environment
 */
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

/**
 * Safely checks if document and document.head exist
 */
export const hasDocumentHead = (): boolean => {
  return isBrowser() && 
         typeof document !== 'undefined' && 
         document.head !== null && 
         document.head !== undefined;
};

/**
 * Safely checks if a DOM method exists on an element
 */
export const hasMethod = (element: any, methodName: string): boolean => {
  return element !== null && 
         element !== undefined &&
         typeof element === 'object' && 
         typeof element[methodName] === 'function';
};

/**
 * Safe wrapper for document.head.contains() that works in both browser and React Native
 */
export const safeDocumentHeadContains = (element: Element | null): boolean => {
  if (!hasDocumentHead() || !element) {
    return false;
  }
  
  if (!hasMethod(document.head, 'contains')) {
    // Fallback for environments where contains method might not exist
    return false;
  }
  
  try {
    return document.head.contains(element);
  } catch (error) {
    console.warn('Error checking document.head.contains:', error);
    return false;
  }
};

/**
 * Safe wrapper for DOM operations that should only run in browser environments
 */
export const safeDOMOperation = <T>(operation: () => T, fallbackValue: T): T => {
  if (!isBrowser()) {
    return fallbackValue;
  }
  
  try {
    return operation();
  } catch (error) {
    console.warn('DOM operation failed:', error);
    return fallbackValue;
  }
};