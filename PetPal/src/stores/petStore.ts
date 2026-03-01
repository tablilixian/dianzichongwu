import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PetState, PetStage, DEFAULT_PET_STATE, STAGE_DURATION } from '../types/pet';

const STORAGE_KEY = '@petpal:pet';

interface PetStore extends PetState {
  feed: () => void;
  water: () => void;
  bathe: () => void;
  pet: () => void;
  evolve: () => void;
  tick: () => void;
  reset: () => void;
  loadPet: () => Promise<void>;
  savePet: () => Promise<void>;
  setCreatedAt: (timestamp: number) => void;
}

const calculateStage = (createdAt: number): PetStage => {
  const now = Date.now();
  const age = now - createdAt;
  if (age >= STAGE_DURATION.adult) return 'evolved';
  if (age >= STAGE_DURATION.young) return 'adult';
  if (age >= STAGE_DURATION.baby) return 'young';
  return 'baby';
};

const applyDecay = (state: PetState): PetState => {
  const now = Date.now();
  const hoursPassed = (now - state.lastUpdated) / (1000 * 60 * 60);
  if (hoursPassed < 0.1) return state;
  
  return {
    ...state,
    hunger: Math.max(0, state.hunger - Math.floor(hoursPassed * 5)),
    thirst: Math.max(0, state.thirst - Math.floor(hoursPassed * 8)),
    hygiene: Math.max(0, state.hygiene - Math.floor(hoursPassed * 3)),
    mood: Math.max(0, state.mood - Math.floor(hoursPassed * 2)),
    lastUpdated: now,
  };
};

export const usePetStore = create<PetStore>((set, get) => ({
  ...DEFAULT_PET_STATE,
  
  feed: () => {
    set((state) => ({
      hunger: Math.min(100, state.hunger + 20),
      mood: Math.min(100, state.mood + 5),
      lastUpdated: Date.now(),
    }));
    get().savePet();
  },
  
  water: () => {
    set((state) => ({
      thirst: Math.min(100, state.thirst + 20),
      mood: Math.min(100, state.mood + 5),
      lastUpdated: Date.now(),
    }));
    get().savePet();
  },
  
  bathe: () => {
    set((state) => ({
      hygiene: Math.min(100, state.hygiene + 30),
      mood: Math.min(100, state.mood + 5),
      lastUpdated: Date.now(),
    }));
    get().savePet();
  },
  
  pet: () => {
    set((state) => ({
      intimacy: Math.min(100, state.intimacy + 5),
      mood: Math.min(100, state.mood + 10),
      lastUpdated: Date.now(),
    }));
    get().savePet();
  },
  
  evolve: () => {
    set((state) => {
      const stageOrder: PetStage[] = ['baby', 'young', 'adult', 'evolved'];
      const currentIndex = stageOrder.indexOf(state.stage);
      const nextStage = stageOrder[Math.min(currentIndex + 1, stageOrder.length - 1)];
      return { stage: nextStage, lastUpdated: Date.now() };
    });
    get().savePet();
  },
  
  tick: () => {
    set((state) => {
      const decayed = applyDecay(state);
      const newStage = calculateStage(decayed.createdAt);
      return { ...decayed, stage: newStage };
    });
    get().savePet();
  },
  
  reset: () => {
    const newPet = { ...DEFAULT_PET_STATE, createdAt: Date.now(), lastUpdated: Date.now() };
    set(newPet);
    get().savePet();
  },
  
  setCreatedAt: (timestamp: number) => {
    set((state) => {
      const newStage = calculateStage(timestamp);
      return { createdAt: timestamp, stage: newStage, lastUpdated: Date.now() };
    });
    get().savePet();
  },
  
  loadPet: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const pet = JSON.parse(data);
        const decayed = applyDecay(pet);
        set({ ...decayed, stage: calculateStage(decayed.createdAt) });
      }
    } catch (error) {
      console.error('Failed to load pet:', error);
    }
  },
  
  savePet: async () => {
    try {
      const state = {
        hunger: get().hunger,
        thirst: get().thirst,
        hygiene: get().hygiene,
        mood: get().mood,
        intimacy: get().intimacy,
        stage: get().stage,
        createdAt: get().createdAt,
        lastUpdated: get().lastUpdated,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save pet:', error);
    }
  },
}));
