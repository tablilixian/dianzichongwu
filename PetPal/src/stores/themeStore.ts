import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  isDarkMode: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  bgmEnabled: boolean;
  toggleDarkMode: () => void;
  toggleSound: () => void;
  toggleVibration: () => void;
  toggleBgm: () => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

const STORAGE_KEY = '@petpal:settings';

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDarkMode: false,
  soundEnabled: true,
  vibrationEnabled: true,
  bgmEnabled: false,
  
  toggleDarkMode: () => {
    set((state) => ({ isDarkMode: !state.isDarkMode }));
    get().saveSettings();
  },
  
  toggleSound: () => {
    set((state) => ({ soundEnabled: !state.soundEnabled }));
    get().saveSettings();
  },
  
  toggleVibration: () => {
    set((state) => ({ vibrationEnabled: !state.vibrationEnabled }));
    get().saveSettings();
  },
  
  toggleBgm: () => {
    set((state) => ({ bgmEnabled: !state.bgmEnabled }));
    get().saveSettings();
  },
  
  loadSettings: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const settings = JSON.parse(data);
        set({
          isDarkMode: settings.isDarkMode ?? false,
          soundEnabled: settings.soundEnabled ?? true,
          vibrationEnabled: settings.vibrationEnabled ?? true,
          bgmEnabled: settings.bgmEnabled ?? false,
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },
  
  saveSettings: async () => {
    try {
      const { isDarkMode, soundEnabled, vibrationEnabled, bgmEnabled } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        isDarkMode,
        soundEnabled,
        vibrationEnabled,
        bgmEnabled,
      }));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },
}));
