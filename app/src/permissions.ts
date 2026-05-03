import { PermissionsAndroid, Platform } from 'react-native';

export async function requestCallPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const granted = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.CAMERA,
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  ]);

  return (
    granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED &&
    granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
  );
}
