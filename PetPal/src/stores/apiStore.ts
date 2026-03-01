import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ApiProvider = 'gemini' | 'bigmodel';

interface ApiSettingsState {
  provider: ApiProvider;
  apiKey: string;
  setProvider: (provider: ApiProvider) => void;
  setApiKey: (key: string) => void;
  validateApiKey: () => Promise<{ valid: boolean; error?: string }>;
  loadApiSettings: () => Promise<void>;
  saveApiSettings: () => Promise<void>;
}

const STORAGE_KEY = '@petpal:api';

// Validate API key based on provider
export const validateApiKey = async (provider: ApiProvider, apiKey: string): Promise<{ valid: boolean; error?: string }> => {
  if (!apiKey || apiKey.trim() === '') {
    return { valid: false, error: '请输入 API Key' };
  }
  
  if (provider === 'bigmodel') {
    // Test bigmodel API with a simple request
    try {
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'glm-4-flash',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 10,
        }),
      });
      
      if (response.ok) {
        return { valid: true };
      } else {
        const errorData = await response.json();
        return { valid: false, error: errorData.error?.message || 'API Key 验证失败' };
      }
    } catch (error) {
      return { valid: false, error: '网络错误，请检查网络连接' };
    }
  } else {
    // For Gemini, just check format (should start with AIza)
    if (!apiKey.startsWith('AIza')) {
      return { valid: false, error: 'Google API Key 格式不正确' };
    }
    return { valid: true };
  }
};

export const useApiStore = create<ApiSettingsState>((set, get) => ({
  provider: 'bigmodel',
  apiKey: '',
  
  setProvider: (provider: ApiProvider) => {
    set({ provider });
    get().saveApiSettings();
  },
  
  setApiKey: (key: string) => {
    set({ apiKey: key });
    get().saveApiSettings();
  },
  
  validateApiKey: async () => {
    const { provider, apiKey } = get();
    return validateApiKey(provider, apiKey);
  },
  
  loadApiSettings: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const settings = JSON.parse(data);
        set({ 
          provider: settings.provider || 'bigmodel',
          apiKey: settings.apiKey || '' 
        });
      }
    } catch (error) {
      console.error('Failed to load API settings:', error);
    }
  },
  
  saveApiSettings: async () => {
    try {
      const { provider, apiKey } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ provider, apiKey }));
    } catch (error) {
      console.error('Failed to save API settings:', error);
    }
  },
}));
