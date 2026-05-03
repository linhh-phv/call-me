import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchUsers, type User } from '../api';

type Props = { onPick: (user: User) => void };

export function UserPickerScreen({ onPick }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Cannot load users</Text>
        <Text style={styles.errorSmall}>{error}</Text>
      </View>
    );
  }

  if (users.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Who are you?</Text>
      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => onPick(item)}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.id}>@{item.id}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#0b0b10' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0b10' },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a22',
    borderRadius: 12,
    marginBottom: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 16, backgroundColor: '#333' },
  name: { color: '#fff', fontSize: 18, fontWeight: '600' },
  id: { color: '#888', fontSize: 14 },
  error: { color: '#ff6b6b', fontSize: 18, marginBottom: 8 },
  errorSmall: { color: '#888', fontSize: 12, textAlign: 'center', paddingHorizontal: 24 },
});
