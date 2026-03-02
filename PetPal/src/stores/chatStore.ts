import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '../services/chatService';

export type AgeGroup = 'toddler' | 'child' | 'teen';

// 用户画像
export interface UserProfile {
  nickname: string;
  preferredName: string;
  preferences: string[];
  dislikes: string[];
  favoriteFood: string;
  favoriteColor: string;
  hobby: string;
  createdAt: number;
  updatedAt: number;
}

// 记忆清单
export interface MemoryItem {
  id: string;
  content: string;
  location?: string;
  category?: string;
  timestamp: number;
  lastQueried?: number;
}

export interface ChatSettingsState {
  ageGroup: AgeGroup;
  messages: ChatMessage[];
  storageSize: number;
  userProfile: UserProfile;
  memories: MemoryItem[];
  setAgeGroup: (ageGroup: AgeGroup) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => Promise<void>;
  loadChatData: () => Promise<void>;
  saveChatData: () => Promise<void>;
  getStorageSize: () => number;
  exportChatData: () => Promise<string>;
  importChatData: (jsonData: string) => Promise<boolean>;
  updateUserName: (name: string) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  addMemory: (content: string, location?: string, category?: string) => void;
  queryMemory: (query: string) => MemoryItem[] | null;
  removeMemory: (id: string) => void;
  clearMemories: () => void;
}

const STORAGE_KEY = '@petpal:chat';
const MAX_STORAGE_SIZE = 50 * 1024 * 1024;

const DEFAULT_USER_PROFILE: UserProfile = {
  nickname: '',
  preferredName: '',
  preferences: [],
  dislikes: [],
  favoriteFood: '',
  favoriteColor: '',
  hobby: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

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
  userProfile: DEFAULT_USER_PROFILE,
  memories: [],

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
          storageSize: parsed.messages ? JSON.stringify(parsed.messages).length : 0,
          userProfile: parsed.userProfile || DEFAULT_USER_PROFILE,
          memories: parsed.memories || [],
        });
      }
    } catch (error) {
      console.error('Failed to load chat data:', error);
    }
  },

  saveChatData: async () => {
    try {
      const { ageGroup, messages, storageSize, userProfile, memories } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ 
        ageGroup, 
        messages,
        storageSize,
        userProfile,
        memories,
      }));
    } catch (error) {
      console.error('Failed to save chat data:', error);
    }
  },

  getStorageSize: () => {
    return get().storageSize;
  },

  exportChatData: async () => {
    const { ageGroup, messages, userProfile, memories } = get();
    const exportData = {
      version: 2,
      exportTime: Date.now(),
      ageGroup,
      messages,
      userProfile,
      memories,
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
        userProfile: data.userProfile || DEFAULT_USER_PROFILE,
        memories: data.memories || [],
      });
      await get().saveChatData();
      return true;
    } catch (error) {
      console.error('Failed to import chat data:', error);
      return false;
    }
  },

  updateUserName: (name: string) => {
    set((state) => ({
      userProfile: {
        ...state.userProfile,
        preferredName: name,
        updatedAt: Date.now(),
      },
    }));
    get().saveChatData();
  },

  updateUserProfile: (profile: Partial<UserProfile>) => {
    set((state) => ({
      userProfile: {
        ...state.userProfile,
        ...profile,
        updatedAt: Date.now(),
      },
    }));
    get().saveChatData();
  },

  addMemory: (content: string, location?: string, category?: string) => {
    const newMemory: MemoryItem = {
      id: Date.now().toString(),
      content,
      location,
      category,
      timestamp: Date.now(),
    };
    set((state) => ({
      memories: [...state.memories, newMemory],
    }));
    get().saveChatData();
  },

  queryMemory: (query: string): MemoryItem[] | null => {
    const { memories } = get();
    if (!query.trim()) return null;
    
    const keywords = query.toLowerCase().split(/[,，\s]+/).filter(k => k.length > 1);
    if (keywords.length === 0) return null;
    
    const results = memories.filter(m => {
      const text = (m.content + ' ' + (m.location || '')).toLowerCase();
      return keywords.some(k => text.includes(k));
    });
    
    if (results.length > 0) {
      results.forEach(r => {
        r.lastQueried = Date.now();
      });
      get().saveChatData();
    }
    
    return results.length > 0 ? results : null;
  },

  removeMemory: (id: string) => {
    set((state) => ({
      memories: state.memories.filter(m => m.id !== id),
    }));
    get().saveChatData();
  },

  clearMemories: () => {
    set({ memories: [] });
    get().saveChatData();
  },
}));
