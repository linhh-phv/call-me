import {
  LiveKitRoom,
  useTracks,
  VideoTrack,
  useLocalParticipant,
  useConnectionState,
} from '@livekit/react-native';
import { ConnectionState, type LocalVideoTrack, Track } from 'livekit-client';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { TokenResponse } from '../api';
import { LIVEKIT_URL_OVERRIDE } from '../config';

type Props = {
  info: TokenResponse;
  onLeave: () => void;
};

export function CallScreen({ info, onLeave }: Props) {
  const serverUrl = LIVEKIT_URL_OVERRIDE ?? info.url;
  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={info.token}
      connect={true}
      audio={true}
      video={false}
      options={{
        adaptiveStream: { pixelDensity: 'screen' },
        videoCaptureDefaults: { facingMode: 'user', resolution: { width: 640, height: 480, frameRate: 30 } },
      }}>
      <RoomView room={info.room} onLeave={onLeave} />
    </LiveKitRoom>
  );
}

function RoomView({ room, onLeave }: { room: string; onLeave: () => void }) {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: true });
  const { localParticipant } = useLocalParticipant();
  const [micOn, setMicOn] = React.useState(true);
  const [camOn, setCamOn] = React.useState(true);
  const [facingMode, setFacingMode] = React.useState<'user' | 'environment'>('user');

  // Wait for the room to be fully connected before enabling the camera. Enabling earlier
  // races with track-publish setup and silently fails on Android.
  // We pass facingMode (instead of deviceId="default") so Android Camera2 picks a real camera.
  const connectionState = useConnectionState();
  React.useEffect(() => {
    if (connectionState !== ConnectionState.Connected) return;
    // Pass undefined options so livekit-client uses room.videoCaptureDefaults (no deviceId="default").
    localParticipant
      .setCameraEnabled(true)
      .catch((e) => console.warn('camera enable failed:', e));
  }, [connectionState, localParticipant]);

  const toggleMic = async () => {
    const next = !micOn;
    await localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
  };

  const toggleCam = async () => {
    const next = !camOn;
    await localParticipant.setCameraEnabled(next);
    setCamOn(next);
  };

  const switchCamera = async () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    const cam = localParticipant.getTrackPublication(Track.Source.Camera)?.track as
      | LocalVideoTrack
      | undefined;
    if (!cam) return;
    try {
      await cam.restartTrack({ facingMode: next });
      setFacingMode(next);
    } catch (e) {
      console.warn('switch camera failed:', e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.roomName}>#{room}</Text>
        <Text style={styles.count}>{tracks.length} in call</Text>
      </View>

      <FlatList
        data={tracks}
        keyExtractor={(t, i) => `${t.participant.identity}-${t.source}-${i}`}
        numColumns={tracks.length > 1 ? 2 : 1}
        key={tracks.length > 1 ? 'two-col' : 'one-col'}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <View style={[styles.tile, tracks.length > 1 && styles.tileHalf]}>
            <VideoTrack
              trackRef={item}
              style={styles.video}
              mirror={item.participant.isLocal && facingMode === 'user'}
            />
            <Text style={styles.tileLabel}>
              {item.participant.identity}
              {item.participant.isLocal ? ' (you)' : ''}
            </Text>
          </View>
        )}
      />

      <View style={styles.controls}>
        <ControlButton label={micOn ? 'Mic on' : 'Mic off'} onPress={toggleMic} active={micOn} />
        <ControlButton label={camOn ? 'Cam on' : 'Cam off'} onPress={toggleCam} active={camOn} />
        <ControlButton label="Flip" onPress={switchCamera} />
        <ControlButton label="Leave" onPress={onLeave} danger />
      </View>
    </View>
  );
}

function ControlButton({
  label,
  onPress,
  active,
  danger,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.ctrl,
        active === false && styles.ctrlOff,
        danger && styles.ctrlDanger,
      ]}>
      <Text style={styles.ctrlText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between' },
  roomName: { color: '#fff', fontWeight: '700', fontSize: 16 },
  count: { color: '#888' },
  grid: { padding: 8, flexGrow: 1 },
  tile: { flex: 1, aspectRatio: 3 / 4, margin: 4, backgroundColor: '#111', borderRadius: 12, overflow: 'hidden' },
  tileHalf: { flex: 0.5 },
  video: { flex: 1 },
  tileLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  ctrl: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 999,
    minWidth: 80,
    alignItems: 'center',
  },
  ctrlOff: { backgroundColor: '#374151' },
  ctrlDanger: { backgroundColor: '#dc2626' },
  ctrlText: { color: '#fff', fontWeight: '600' },
});
