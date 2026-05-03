import { Platform } from 'react-native';

// Mac's LAN IP — both real iOS devices and Android emulators reach here.
// Find with: `ipconfig getifaddr en0` and replace the placeholder below.
const HOST_IP = '192.168.1.10';

export const BACKEND_URL = `http://${HOST_IP}:3000`;

// Override the LiveKit URL the backend returns so the device dials a host it
// can reach. Set to null when using LiveKit Cloud.
export const LIVEKIT_URL_OVERRIDE: string | null = `ws://${HOST_IP}:7880`;

// Reserved for future per-platform tweaks if needed.
void Platform;
