import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchToken, type TokenResponse, type User } from '../api';
import { requestCallPermissions } from '../permissions';

type Props = {
  user: User;
  onJoin: (info: TokenResponse) => void;
  onBack: () => void;
};

export function LobbyScreen({ user, onJoin, onBack }: Props) {
  const [room, setRoom] = useState('demo-room');
  const [loading, setLoading] = useState(false);

  const join = async () => {
    if (!room.trim()) return;
    setLoading(true);
    try {
      const ok = await requestCallPermissions();
      if (!ok) {
        Alert.alert('Permissions denied', 'Camera & microphone are required.');
        return;
      }
      const info = await fetchToken(user.id, room.trim());
      onJoin(info);
    } catch (e: any) {
      Alert.alert('Failed to join', String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.hello}>Hi, {user.name}</Text>
      <Text style={styles.label}>Room name</Text>
      <TextInput
        value={room}
        onChangeText={setRoom}
        autoCapitalize="none"
        placeholder="demo-room"
        placeholderTextColor="#555"
        style={styles.input}
      />

      <TouchableOpacity
        style={[styles.button, (loading || !room.trim()) && styles.buttonDisabled]}
        onPress={join}
        disabled={loading || !room.trim()}>
        <Text style={styles.buttonText}>{loading ? 'Joining…' : 'Join call'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#0b0b10' },
  back: { color: '#888', marginBottom: 24, fontSize: 16 },
  hello: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 32 },
  label: { color: '#aaa', marginBottom: 8 },
  input: {
    backgroundColor: '#1a1a22',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  button: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
