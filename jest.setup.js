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
  getInfoAsync: jest.fn().mockResolvedValue({ size: 1024 }),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{
      uri: 'mock://image.jpg',
      fileName: 'mock-image.jpg',
      fileSize: 1024,
      type: 'image/jpeg',
      width: 800,
      height: 600,
    }]
  }),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{
      uri: 'mock://document.pdf',
      name: 'mock-document.pdf',
      size: 2048,
      mimeType: 'application/pdf',
    }]
  }),
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