import { useSyncExternalStore } from 'react';

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
}

interface GameActions {
  incrementWave: () => void;
  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean;
  toggleShop: () => void;
  closeShop: () => void;
  triggerSkill: () => void;
  tickSkillCooldown: (deltaMs: number) => void;
}

type GameStore = GameState & GameActions;

const initialSkillCooldownMs = 7000;

let state: GameStore = {
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
  incrementWave: () => {
    setState({ wave: state.wave + 1 });
  },
  addGold: (amount) => {
    setState({ gold: state.gold + amount });
  },
  spendGold: (amount) => {
    if (state.gold < amount) {
      return false;
    }
    setState({ gold: state.gold - amount });
    return true;
  },
  toggleShop: () => {
    setState({ isShopOpen: !state.isShopOpen });
  },
  closeShop: () => {
    setState({ isShopOpen: false });
  },
  triggerSkill: () => {
    if (state.skill.isCoolingDown) {
      return;
    }
    setState({
      skill: {
        ...state.skill,
        isCoolingDown: true,
        cooldownRemainingMs: state.skill.cooldownTotalMs,
      },
    });
  },
  tickSkillCooldown: (deltaMs) => {
    if (!state.skill.isCoolingDown) {
      return;
    }
    const nextRemaining = Math.max(0, state.skill.cooldownRemainingMs - deltaMs);
    setState({
      skill: {
        ...state.skill,
        cooldownRemainingMs: nextRemaining,
        isCoolingDown: nextRemaining > 0,
      },
    });
  },
};

const listeners = new Set<() => void>();

function setState(partial: Partial<GameStore>) {
  state = { ...state, ...partial };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useGameStore(): GameStore {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export type { Hero };
