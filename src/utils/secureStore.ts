import * as SecureStore from 'expo-secure-store';

export async function saveSecureItem(key: string, value: string): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(key, value);
    return true;
  } catch (error) {
    console.error(`Error saving secure item with key "${key}":`, error);
    return false;
  }
}

export async function getSecureItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`Error getting secure item with key "${key}":`, error);
    return null;
  }
}

export async function deleteSecureItem(key: string): Promise<boolean> {
  try {
    await SecureStore.deleteItemAsync(key);
    return true;
  } catch (error) {
    console.error(`Error deleting secure item with key "${key}":`, error);
    return false;
  }
}

export async function hasSecureItem(key: string): Promise<boolean> {
  const item = await getSecureItem(key);
  return item !== null;
}
