import { saveSecureItem, getSecureItem, deleteSecureItem, hasSecureItem } from '../../src/utils/secureStore';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';

const mockSetItemAsync = SecureStore.setItemAsync as jest.MockedFunction<typeof SecureStore.setItemAsync>;
const mockGetItemAsync = SecureStore.getItemAsync as jest.MockedFunction<typeof SecureStore.getItemAsync>;
const mockDeleteItemAsync = SecureStore.deleteItemAsync as jest.MockedFunction<typeof SecureStore.deleteItemAsync>;

describe('secureStore utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveSecureItem', () => {
    it('should save item successfully', async () => {
      mockSetItemAsync.mockResolvedValue();
      
      const result = await saveSecureItem('test-key', 'test-value');
      
      expect(result).toBe(true);
      expect(mockSetItemAsync).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should handle errors gracefully', async () => {
      mockSetItemAsync.mockRejectedValue(new Error('Storage error'));
      
      const result = await saveSecureItem('test-key', 'test-value');
      
      expect(result).toBe(false);
    });
  });

  describe('getSecureItem', () => {
    it('should retrieve item successfully', async () => {
      mockGetItemAsync.mockResolvedValue('test-value');
      
      const result = await getSecureItem('test-key');
      
      expect(result).toBe('test-value');
      expect(mockGetItemAsync).toHaveBeenCalledWith('test-key');
    });

    it('should handle errors gracefully', async () => {
      mockGetItemAsync.mockRejectedValue(new Error('Storage error'));
      
      const result = await getSecureItem('test-key');
      
      expect(result).toBe(null);
    });
  });

  describe('deleteSecureItem', () => {
    it('should delete item successfully', async () => {
      mockDeleteItemAsync.mockResolvedValue();
      
      const result = await deleteSecureItem('test-key');
      
      expect(result).toBe(true);
      expect(mockDeleteItemAsync).toHaveBeenCalledWith('test-key');
    });

    it('should handle errors gracefully', async () => {
      mockDeleteItemAsync.mockRejectedValue(new Error('Storage error'));
      
      const result = await deleteSecureItem('test-key');
      
      expect(result).toBe(false);
    });
  });

  describe('hasSecureItem', () => {
    it('should return true when item exists', async () => {
      mockGetItemAsync.mockResolvedValue('test-value');
      
      const result = await hasSecureItem('test-key');
      
      expect(result).toBe(true);
    });

    it('should return false when item does not exist', async () => {
      mockGetItemAsync.mockResolvedValue(null);
      
      const result = await hasSecureItem('test-key');
      
      expect(result).toBe(false);
    });
  });
});