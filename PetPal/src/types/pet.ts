// Pet types
export type PetStage = 'baby' | 'young' | 'adult' | 'evolved';

export interface PetState {
  hunger: number;
  thirst: number;
  hygiene: number;
  mood: number;
  intimacy: number;
  stage: PetStage;
  createdAt: number;
  lastUpdated: number;
}

export const STATUS_THRESHOLDS = {
  happy: 80,
  normal: 50,
  worried: 20,
  critical: 0,
} as const;

export const STAGE_DURATION: Record<PetStage, number> = {
  baby: 3 * 24 * 60 * 60 * 1000,
  young: 7 * 24 * 60 * 60 * 1000,
  adult: 14 * 24 * 60 * 60 * 1000,
  evolved: Infinity,
};

export const DEFAULT_PET_STATE: PetState = {
  hunger: 80,
  thirst: 80,
  hygiene: 80,
  mood: 80,
  intimacy: 50,
  stage: 'baby',
  createdAt: Date.now(),
  lastUpdated: Date.now(),
};
