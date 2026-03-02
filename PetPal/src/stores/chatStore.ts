import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '../services/chatService';

export type AgeGroup = 'toddler' | 'child' | 'teen';

export interface ChatSettingsState {
  ageGroup: AgeGroup;
  messages: ChatMessage[];
  storageSize: number;
  setAgeGroup: (ageGroup: AgeGroup) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => Promise<void>;
  loadChatData: () => Promise<void>;
  saveChatData: () => Promise<void>;
  getStorageSize: () => number;
  exportChatData: () => Promise<string>;
  importChatData: (jsonData: string) => Promise<boolean>;
}

const STORAGE_KEY = '@petpal:chat';
const MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB

const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  toddler: '幼儿 (3-6岁)',
  child: '儿童 (7-10岁)',
  teen: '青少年 (11-14岁)',
};

export { AGE_GROUP_LABELS };

export const useChatStore = create<ChatSettingsState>((set, get) => ({
  ageGroup: 'child',
  messages: [],
  storageSize: 0,

  setAgeGroup: (ageGroup: AgeGroup) => {
    set({ ageGroup });
    get().saveChatData();
  },

  addMessage: (message: ChatMessage) => {
    set((state) => {
      const newMessages = [...state.messages, message];
      let size = JSON.stringify(newMessages).length;
      let trimmedMessages = newMessages;
      
      while (size > MAX_STORAGE_SIZE * 0.8 && trimmedMessages.length > 10) {
        trimmedMessages = trimmedMessages.slice(1);
        size = JSON.stringify(trimmedMessages).length;
      }
      
      return { messages: trimmedMessages, storageSize: size };
    });
    get().saveChatData();
  },

  clearMessages: async () => {
    set({ messages: [], storageSize: 0 });
    await get().saveChatData();
  },

  loadChatData: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        set({ 
          ageGroup: parsed.ageGroup || 'child',
          messages: parsed.messages || [],
          storageSize: parsed.messages ? JSON.stringify(parsed.messages).length : 0
        });
      }
    } catch (error) {
      console.error('Failed to load chat data:', error);
    }
  },

  saveChatData: async () => {
    try {
      const { ageGroup, messages, storageSize } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ 
        ageGroup, 
        messages,
        storageSize 
      }));
    } catch (error) {
      console.error('Failed to save chat data:', error);
    }
  },

  getStorageSize: () => {
    return get().storageSize;
  },

  exportChatData: async () => {
    const { ageGroup, messages } = get();
    const exportData = {
      version: 1,
      exportTime: Date.now(),
      ageGroup,
      messages,
    };
    return JSON.stringify(exportData, null, 2);
  },

  importChatData: async (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (!data.messages || !Array.isArray(data.messages)) {
        throw new Error('Invalid format');
      }
      const messages: ChatMessage[] = data.messages;
      const storageSize = JSON.stringify(messages).length;
      set({
        ageGroup: data.ageGroup || 'child',
        messages,
        storageSize,
      });
      await get().saveChatData();
      return true;
    } catch (error) {
      console.error('Failed to import chat data:', error);
      return false;
    }
  },
}));
