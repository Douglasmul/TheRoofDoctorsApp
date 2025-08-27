import { registerRootComponent } from 'expo';

// Fix for document.head.contains TypeError in React Native
// This polyfill prevents the error: "Cannot read property 'contains' of undefined"
// that occurs when React Navigation tries to use DOM APIs in React Native environment
if (typeof document === 'undefined') {
  // Create minimal document polyfill for React Native
  global.document = {
    head: {
      contains: () => false,
      appendChild: () => {},
      removeChild: () => {},
    },
    body: {
      clientWidth: 375,
      clientHeight: 812,
    },
    createElement: () => ({
      textContent: '',
      style: {},
    }),
  };
  
  // Also add window polyfill for completeness
  if (typeof window === 'undefined') {
    global.window = {
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  }
}

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
