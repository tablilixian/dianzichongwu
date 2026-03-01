import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
}

interface AchievementState {
  achievements: Achievement[];
  checkAndUnlock: (pet: any) => void;
  loadAchievements: () => Promise<void>;
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_feed', icon: '🍖', title: '第一次喂食', description: '给你的宠物喂第一次食物', unlocked: false },
  { id: 'first_water', icon: '💧', title: '第一次喝水', description: '给你的宠物喝第一次水', unlocked: false },
  { id: 'first_bathe', icon: '🛁', title: '第一次洗澡', description: '给你的宠物洗第一次澡', unlocked: false },
  { id: 'first_pet', icon: '✋', title: '第一次抚摸', description: '第一次抚摸你的宠物', unlocked: false },
  { id: 'seven_days', icon: '📅', title: '一周相伴', description: '宠物存活7天', unlocked: false },
  { id: 'thirty_days', icon: '🗓️', title: '一月之交', description: '宠物存活30天', unlocked: false },
  { id: 'intimacy_50', icon: '💕', title: '初结情缘', description: '亲密度达到50%', unlocked: false },
  { id: 'intimacy_100', icon: '💖', title: '生死相依', description: '亲密度达到100%', unlocked: false },
  { id: 'evolution', icon: '🦋', title: '破茧成蝶', description: '宠物完成第一次进化', unlocked: false },
  { id: 'all_status_full', icon: '⭐', title: '完美状态', description: '所有状态都达到100%', unlocked: false },
];

const STORAGE_KEY = '@petpal:achievements';

export const useAchievementStore = create<AchievementState>((set, get) => ({
  achievements: DEFAULT_ACHIEVEMENTS,
  
  checkAndUnlock: (pet: any) => {
    const { achievements } = get();
    const now = Date.now();
    const daysAlive = Math.floor((now - pet.createdAt) / (1000 * 60 * 60 * 24));
    
    const newAchievements = achievements.map(achievement => {
      if (achievement.unlocked) return achievement;
      
      let shouldUnlock = false;
      
      switch (achievement.id) {
        case 'first_feed':
          shouldUnlock = pet.hunger < 100;
          break;
        case 'first_water':
          shouldUnlock = pet.thirst < 100;
          break;
        case 'first_bathe':
          shouldUnlock = pet.hygiene < 100;
          break;
        case 'first_pet':
          shouldUnlock = pet.intimacy > 0;
          break;
        case 'seven_days':
          shouldUnlock = daysAlive >= 7;
          break;
        case 'thirty_days':
          shouldUnlock = daysAlive >= 30;
          break;
        case 'intimacy_50':
          shouldUnlock = pet.intimacy >= 50;
          break;
        case 'intimacy_100':
          shouldUnlock = pet.intimacy >= 100;
          break;
        case 'evolution':
          shouldUnlock = pet.stage !== 'baby';
          break;
        case 'all_status_full':
          shouldUnlock = pet.hunger >= 100 && pet.thirst >= 100 && pet.hygiene >= 100 && pet.mood >= 100;
          break;
      }
      
      if (shouldUnlock) {
        return { ...achievement, unlocked: true, unlockedAt: now };
      }
      
      return achievement;
    });
    
    set({ achievements: newAchievements });
    get().saveAchievements();
  },
  
  loadAchievements: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const saved = JSON.parse(data);
        const merged = DEFAULT_ACHIEVEMENTS.map(defaultAch => {
          const savedAch = saved.find((s: Achievement) => s.id === defaultAch.id);
          return savedAch || defaultAch;
        });
        set({ achievements: merged });
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
  },
  
  saveAchievements: async () => {
    try {
      const { achievements } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(achievements));
    } catch (error) {
      console.error('Failed to save achievements:', error);
    }
  },
}));
