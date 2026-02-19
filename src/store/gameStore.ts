import { create } from 'zustand';

interface Hero {
  id: string;
  name: string;
  dps: number;
  range: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
}

interface SkillState {
  isCoolingDown: boolean;
  cooldownRemainingMs: number;
  cooldownTotalMs: number;
}

interface GameState {
  wave: number;
  gold: number;
  selectedHero: Hero;
  isShopOpen: boolean;
  skill: SkillState;
  incrementWave: () => void;
  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean;
  toggleShop: () => void;
  closeShop: () => void;
  triggerSkill: () => void;
  tickSkillCooldown: (deltaMs: number) => void;
}

const initialSkillCooldownMs = 7000;

export const useGameStore = create<GameState>((set, get) => ({
  wave: 12,
  gold: 320,
  selectedHero: {
    id: 'hero-001',
    name: 'Astra Ranger',
    dps: 125,
    range: 5,
    rarity: 'epic',
  },
  isShopOpen: false,
  skill: {
    isCoolingDown: false,
    cooldownRemainingMs: 0,
    cooldownTotalMs: initialSkillCooldownMs,
  },
  incrementWave: () => set((state) => ({ wave: state.wave + 1 })),
  addGold: (amount) => set((state) => ({ gold: state.gold + amount })),
  spendGold: (amount) => {
    const currentGold = get().gold;
    if (currentGold < amount) {
      return false;
    }
    set({ gold: currentGold - amount });
    return true;
  },
  toggleShop: () => set((state) => ({ isShopOpen: !state.isShopOpen })),
  closeShop: () => set({ isShopOpen: false }),
  triggerSkill: () => {
    const skill = get().skill;
    if (skill.isCoolingDown) {
      return;
    }
    set({
      skill: {
        ...skill,
        isCoolingDown: true,
        cooldownRemainingMs: skill.cooldownTotalMs,
      },
    });
  },
  tickSkillCooldown: (deltaMs) => {
    const skill = get().skill;
    if (!skill.isCoolingDown) {
      return;
    }
    const nextRemaining = Math.max(0, skill.cooldownRemainingMs - deltaMs);
    set({
      skill: {
        ...skill,
        cooldownRemainingMs: nextRemaining,
        isCoolingDown: nextRemaining > 0,
      },
    });
  },
}));

export type { Hero };
