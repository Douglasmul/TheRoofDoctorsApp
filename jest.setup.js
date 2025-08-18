// Basic Jest setup for React Native
// Mock dependencies that aren't available in test environment
jest.mock('expo-camera', () => ({
  CameraView: () => null,
  useCameraPermissions: () => [null, { granted: true }],
}));

jest.mock('expo-sensors', () => ({
  DeviceMotion: {
    isAvailableAsync: jest.fn().mockResolvedValue(true),
    setUpdateInterval: jest.fn(),
    addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  },
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/documents/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
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
      Version: '15.0',
    },
    AccessibilityInfo: {
      announceForAccessibility: jest.fn(),
    },
    Share: {
      share: jest.fn().mockResolvedValue({ action: 'shared' }),
    },
  };
});

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};