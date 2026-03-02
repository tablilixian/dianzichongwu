import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HomeScreen } from './src/screens/HomeScreen';
import { useApiStore } from './src/stores/apiStore';
import { useChatStore } from './src/stores/chatStore';

const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    useApiStore.getState().loadApiSettings();
    useChatStore.getState().loadChatData();
  }, []);
  return <>{children}</>;
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppInitializer>
        <HomeScreen />
      </AppInitializer>
    </GestureHandlerRootView>
  );
}
