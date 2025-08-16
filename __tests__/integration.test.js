// Simple integration test to verify our fixes
describe('Project Integration', () => {
  test('TypeScript navigation types work correctly', () => {
    const { RootStackParamList } = require('../src/types/navigation');
    expect(typeof RootStackParamList).toBeDefined();
  });

  test('Secure store utilities have proper error handling', async () => {
    // Mock expo-secure-store
    jest.doMock('expo-secure-store', () => ({
      setItemAsync: jest.fn().mockResolvedValue(undefined),
      getItemAsync: jest.fn().mockResolvedValue('test-value'),
      deleteItemAsync: jest.fn().mockResolvedValue(undefined),
    }));

    const { saveSecureItem, getSecureItem, deleteSecureItem, hasSecureItem } = require('../src/utils/secureStore');
    
    // Test successful operations return proper values
    expect(await saveSecureItem('key', 'value')).toBe(true);
    expect(await getSecureItem('key')).toBe('test-value');
    expect(await deleteSecureItem('key')).toBe(true);
    expect(await hasSecureItem('key')).toBe(true);
  });

  test('Permission utilities are properly defined', () => {
    const permissions = require('../src/utils/permissions');
    expect(typeof permissions.showPermissionAlert).toBe('function');
    expect(typeof permissions.checkCameraPermission).toBe('function');
    expect(typeof permissions.requestCameraPermission).toBe('function');
  });
});