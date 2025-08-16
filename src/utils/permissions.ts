import { useCameraPermissions } from 'expo-camera';
import { Alert } from 'react-native';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

// Note: These functions are now mostly for compatibility since expo-camera 
// recommends using the useCameraPermissions hook directly in components
export const checkCameraPermission = async (): Promise<PermissionStatus> => {
  console.warn('checkCameraPermission is deprecated. Use useCameraPermissions hook instead.');
  return 'undetermined'; // Can't easily check without the hook
};

export const requestCameraPermission = async (): Promise<boolean> => {
  console.warn('requestCameraPermission is deprecated. Use useCameraPermissions hook instead.');
  return false; // Can't easily request without the hook
};

export const showPermissionAlert = (permissionType: string): void => {
  Alert.alert(
    'Permission Required',
    `This app needs ${permissionType} permission to function properly. Please enable it in your device settings.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Settings', onPress: () => {
        // In a real app, you might want to open the settings
        console.log('Redirect to settings');
      }}
    ]
  );
};