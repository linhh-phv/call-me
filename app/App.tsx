import React, { useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import type { TokenResponse, User } from './src/api';
import { CallScreen } from './src/screens/CallScreen';
import { LobbyScreen } from './src/screens/LobbyScreen';
import { UserPickerScreen } from './src/screens/UserPickerScreen';

type Stage =
  | { kind: 'pick' }
  | { kind: 'lobby'; user: User }
  | { kind: 'call'; user: User; info: TokenResponse };

function App() {
  const [stage, setStage] = useState<Stage>({ kind: 'pick' });

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0b0b10" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0b0b10' }} edges={['top']}>
        {stage.kind === 'pick' && (
          <UserPickerScreen onPick={(user) => setStage({ kind: 'lobby', user })} />
        )}
        {stage.kind === 'lobby' && (
          <LobbyScreen
            user={stage.user}
            onBack={() => setStage({ kind: 'pick' })}
            onJoin={(info) => setStage({ kind: 'call', user: stage.user, info })}
          />
        )}
        {stage.kind === 'call' && (
          <CallScreen info={stage.info} onLeave={() => setStage({ kind: 'lobby', user: stage.user })} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default App;
