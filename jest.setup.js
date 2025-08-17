// Basic Jest setup for React Native
// Mock dependencies that aren't available in test environment
jest.mock('expo-camera', () => ({
  CameraView: () => null,
  useCameraPermissions: () => [null, { granted: true }],
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
    Vibration: {
      vibrate: jest.fn(),
    },
    Platform: {
      OS: 'ios',
    },
    AccessibilityInfo: {
      announceForAccessibility: jest.fn(),
    },
  };
});

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};