import { useSyncExternalStore } from 'react';

export type UnitType = 'marine' | 'firebat' | 'hero';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type ProgressStep =
  | 'build_tower'
  | 'summon_marine'
  | 'start_wave'
  | 'clear_wave'
  | 'summon_hero'
  | 'evolve_hero'
  | 'free_play';

interface Point {
  x: number;
  y: number;
}

interface Hero {
  id: string;
  name: string;
  dps: number;
  range: number;
  rarity: Rarity;
  level: number;
}

interface Defender {
  id: string;
  kind: 'tower' | 'hero';
  unitType: UnitType;
  position: Point;
  range: number;
  damage: number;
  attackCooldownMs: number;
  cooldownRemainingMs: number;
  level: number;
}

interface Enemy {
  id: string;
  hp: number;
  maxHp: number;
  speed: number;
  rewardGold: number;
  pathIndex: number;
  progress: number;
  position: Point;
  alive: boolean;
}

interface SkillState {
  isCoolingDown: boolean;
  cooldownRemainingMs: number;
  cooldownTotalMs: number;
}

interface WaveState {
  active: boolean;
  waveNumber: number;
  enemiesToSpawn: number;
  enemiesSpawned: number;
  spawnIntervalMs: number;
  spawnTimerMs: number;
}

interface ProgressState {
  step: ProgressStep;
  message: string;
}

interface GameState {
  life: number;
  gold: number;
  path: Point[];
  defenders: Defender[];
  enemies: Enemy[];
  wave: WaveState;
  selectedHero: Hero;
  isShopOpen: boolean;
  skill: SkillState;
  progress: ProgressState;
}

interface GameActions {
  startNextWave: () => void;
  toggleShop: () => void;
  closeShop: () => void;
  buyTower: () => boolean;
  summonUnit: (type: Exclude<UnitType, 'hero'>) => boolean;
  summonHero: () => boolean;
  evolveHero: () => boolean;
  triggerSkill: () => void;
  tick: (deltaMs: number) => void;
}

type GameStore = GameState & GameActions;

const SKILL_COOLDOWN_MS = 7000;
const BASE_ENEMY_HP = 55;

const progressMessages: Record<ProgressStep, string> = {
  build_tower: 'STEP 1: 상점에서 구조물을 1개 설치하세요.',
  summon_marine: 'STEP 2: Marine 유닛을 소환하세요.',
  start_wave: 'STEP 3: Start Wave로 전투를 시작하세요.',
  clear_wave: 'STEP 4: 현재 웨이브를 방어해 클리어하세요.',
  summon_hero: 'STEP 5: Hero를 소환해 화력을 보강하세요.',
  evolve_hero: 'STEP 6: Hero를 진화시켜 핵심 딜러로 만드세요.',
  free_play: 'FREE PLAY: 웨이브를 올리며 방어선을 최적화하세요.',
};

const pathTemplate: Point[] = [
  { x: 0, y: 45 },
  { x: 20, y: 45 },
  { x: 20, y: 20 },
  { x: 55, y: 20 },
  { x: 55, y: 70 },
  { x: 82, y: 70 },
  { x: 82, y: 45 },
  { x: 100, y: 45 },
];

const defenseSlots: Point[] = [
  { x: 12, y: 32 },
  { x: 30, y: 58 },
  { x: 46, y: 36 },
  { x: 66, y: 62 },
  { x: 74, y: 28 },
];

let enemyId = 0;
let defenderId = 0;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distance(a: Point, b: Point) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getSegmentLength(path: Point[], index: number) {
  const start = path[index];
  const end = path[index + 1];
  if (!start || !end) {
    return 0;
  }
  return distance(start, end);
}

function createEnemy(waveNumber: number): Enemy {
  const hp = BASE_ENEMY_HP + waveNumber * 18;
  const start = pathTemplate[0];
  enemyId += 1;
  return {
    id: `enemy-${enemyId}`,
    hp,
    maxHp: hp,
    speed: 12 + waveNumber * 0.8,
    rewardGold: 12 + waveNumber * 2,
    pathIndex: 0,
    progress: 0,
    position: { ...start },
    alive: true,
  };
}

function createDefender(type: UnitType, slotIndex: number): Defender {
  defenderId += 1;
  const slot = defenseSlots[slotIndex % defenseSlots.length];
  if (type === 'hero') {
    return {
      id: `defender-${defenderId}`,
      kind: 'hero',
      unitType: 'hero',
      position: slot,
      range: 28,
      damage: 22,
      attackCooldownMs: 700,
      cooldownRemainingMs: 0,
      level: 1,
    };
  }
  if (type === 'firebat') {
    return {
      id: `defender-${defenderId}`,
      kind: 'tower',
      unitType: 'firebat',
      position: slot,
      range: 18,
      damage: 14,
      attackCooldownMs: 550,
      cooldownRemainingMs: 0,
      level: 1,
    };
  }
  return {
    id: `defender-${defenderId}`,
    kind: 'tower',
    unitType: 'marine',
    position: slot,
    range: 24,
    damage: 10,
    attackCooldownMs: 500,
    cooldownRemainingMs: 0,
    level: 1,
  };
}

function moveEnemy(enemy: Enemy, deltaMs: number, path: Point[]) {
  if (!enemy.alive) {
    return enemy;
  }

  let next = { ...enemy };
  let remainingDistance = (next.speed * deltaMs) / 1000;

  while (remainingDistance > 0) {
    const segmentLength = getSegmentLength(path, next.pathIndex);
    if (segmentLength <= 0) {
      return { ...next, alive: false, position: { ...path[path.length - 1] } };
    }

    const remainingOnSegment = segmentLength - next.progress;

    if (remainingDistance >= remainingOnSegment) {
      next.pathIndex += 1;
      next.progress = 0;
      remainingDistance -= remainingOnSegment;

      if (next.pathIndex >= path.length - 1) {
        return { ...next, alive: false, position: { ...path[path.length - 1] } };
      }
    } else {
      next.progress += remainingDistance;
      remainingDistance = 0;
    }
  }

  const start = path[next.pathIndex];
  const end = path[next.pathIndex + 1];
  const segmentLength = getSegmentLength(path, next.pathIndex);
  const ratio = segmentLength > 0 ? next.progress / segmentLength : 0;

  next.position = {
    x: start.x + (end.x - start.x) * ratio,
    y: start.y + (end.y - start.y) * ratio,
  };

  return next;
}

let state: GameStore;

const listeners = new Set<() => void>();

function setState(partial: Partial<GameStore>) {
  state = { ...state, ...partial };
  listeners.forEach((listener) => listener());
}

function setProgress(step: ProgressStep) {
  setState({
    progress: {
      step,
      message: progressMessages[step],
    },
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function initializeStore(): GameStore {
  return {
    life: 20,
    gold: 220,
    path: pathTemplate,
    defenders: [],
    enemies: [],
    wave: {
      active: false,
      waveNumber: 0,
      enemiesToSpawn: 0,
      enemiesSpawned: 0,
      spawnIntervalMs: 900,
      spawnTimerMs: 0,
    },
    selectedHero: {
      id: 'hero-profile-1',
      name: 'Duke Nova',
      dps: 22,
      range: 28,
      rarity: 'rare',
      level: 1,
    },
    isShopOpen: false,
    skill: {
      isCoolingDown: false,
      cooldownRemainingMs: 0,
      cooldownTotalMs: SKILL_COOLDOWN_MS,
    },
    progress: {
      step: 'build_tower',
      message: progressMessages.build_tower,
    },
    startNextWave: () => {
      if (state.wave.active) {
        return;
      }
      if (state.progress.step !== 'start_wave' && state.progress.step !== 'free_play') {
        return;
      }
      const nextWaveNumber = state.wave.waveNumber + 1;
      const count = 5 + nextWaveNumber * 2;
      setState({
        wave: {
          ...state.wave,
          active: true,
          waveNumber: nextWaveNumber,
          enemiesToSpawn: count,
          enemiesSpawned: 0,
          spawnIntervalMs: clamp(900 - nextWaveNumber * 45, 260, 900),
          spawnTimerMs: 0,
        },
      });
      if (state.progress.step === 'start_wave') {
        setProgress('clear_wave');
      }
    },
    toggleShop: () => setState({ isShopOpen: !state.isShopOpen }),
    closeShop: () => setState({ isShopOpen: false }),
    buyTower: () => {
      const cost = 120;
      if (state.gold < cost) {
        return false;
      }
      if (state.progress.step !== 'build_tower' && state.progress.step !== 'free_play') {
        return false;
      }

      const newDefender = createDefender('marine', state.defenders.length);
      setState({
        gold: state.gold - cost,
        defenders: [...state.defenders, newDefender],
      });

      if (state.progress.step === 'build_tower') {
        setProgress('summon_marine');
      }
      return true;
    },
    summonUnit: (type) => {
      const cost = type === 'marine' ? 70 : 90;
      if (state.gold < cost) {
        return false;
      }

      if (state.progress.step === 'summon_marine' && type !== 'marine') {
        return false;
      }
      if (
        !['summon_marine', 'start_wave', 'clear_wave', 'summon_hero', 'evolve_hero', 'free_play'].includes(
          state.progress.step
        )
      ) {
        return false;
      }

      const newDefender = createDefender(type, state.defenders.length);
      setState({
        gold: state.gold - cost,
        defenders: [...state.defenders, newDefender],
      });

      if (state.progress.step === 'summon_marine') {
        setProgress('start_wave');
      }
      return true;
    },
    summonHero: () => {
      const cost = 220;
      if (state.gold < cost) {
        return false;
      }
      if (state.progress.step !== 'summon_hero' && state.progress.step !== 'free_play') {
        return false;
      }

      const heroDefender = createDefender('hero', state.defenders.length);
      const rarity: Rarity = state.selectedHero.level >= 5 ? 'epic' : 'rare';
      setState({
        gold: state.gold - cost,
        defenders: [...state.defenders, heroDefender],
        selectedHero: {
          ...state.selectedHero,
          rarity,
        },
      });

      if (state.progress.step === 'summon_hero') {
        setProgress('evolve_hero');
      }
      return true;
    },
    evolveHero: () => {
      const cost = 180;
      if (state.gold < cost) {
        return false;
      }
      if (state.progress.step !== 'evolve_hero' && state.progress.step !== 'free_play') {
        return false;
      }

      const nextLevel = state.selectedHero.level + 1;
      const rarity: Rarity =
        nextLevel >= 8 ? 'mythic' : nextLevel >= 6 ? 'legendary' : nextLevel >= 4 ? 'epic' : 'rare';

      const boostedDefenders = state.defenders.map((defender) => {
        if (defender.unitType !== 'hero') {
          return defender;
        }
        return {
          ...defender,
          damage: Math.round(defender.damage * 1.18),
          range: defender.range + 1,
          level: defender.level + 1,
        };
      });

      setState({
        gold: state.gold - cost,
        defenders: boostedDefenders,
        selectedHero: {
          ...state.selectedHero,
          level: nextLevel,
          dps: Math.round(state.selectedHero.dps * 1.2),
          range: state.selectedHero.range + 1,
          rarity,
        },
      });

      if (state.progress.step === 'evolve_hero') {
        setProgress('free_play');
      }
      return true;
    },
    triggerSkill: () => {
      if (state.skill.isCoolingDown) {
        return;
      }
      const burstDamage = 45 + state.selectedHero.level * 6;
      const damaged = state.enemies.map((enemy) => ({
        ...enemy,
        hp: enemy.hp - burstDamage,
      }));
      const survivors: Enemy[] = [];
      let bonusGold = 0;
      damaged.forEach((enemy) => {
        if (enemy.hp > 0) {
          survivors.push(enemy);
        } else {
          bonusGold += enemy.rewardGold;
        }
      });

      setState({
        enemies: survivors,
        gold: state.gold + bonusGold,
        skill: {
          ...state.skill,
          isCoolingDown: true,
          cooldownRemainingMs: state.skill.cooldownTotalMs,
        },
      });
    },
    tick: (deltaMs) => {
      let nextLife = state.life;
      let nextGold = state.gold;
      let nextEnemies = state.enemies.map((enemy) => moveEnemy(enemy, deltaMs, state.path));

      const filteredByLife: Enemy[] = [];
      nextEnemies.forEach((enemy) => {
        if (!enemy.alive) {
          nextLife -= 1;
        } else {
          filteredByLife.push(enemy);
        }
      });
      nextEnemies = filteredByLife;

      const updatedDefenders = state.defenders.map((defender) => ({
        ...defender,
        cooldownRemainingMs: Math.max(0, defender.cooldownRemainingMs - deltaMs),
      }));

      const enemyDamageMap = new Map<string, number>();

      updatedDefenders.forEach((defender, defenderIndex) => {
        if (defender.cooldownRemainingMs > 0) {
          return;
        }

        let target: Enemy | undefined;
        let closestDistance = Number.POSITIVE_INFINITY;

        nextEnemies.forEach((enemy) => {
          const d = distance(defender.position, enemy.position);
          if (d <= defender.range && d < closestDistance) {
            target = enemy;
            closestDistance = d;
          }
        });

        if (!target) {
          return;
        }

        enemyDamageMap.set(target.id, (enemyDamageMap.get(target.id) ?? 0) + defender.damage);
        updatedDefenders[defenderIndex] = {
          ...defender,
          cooldownRemainingMs: defender.attackCooldownMs,
        };
      });

      const combatResolved: Enemy[] = [];
      nextEnemies.forEach((enemy) => {
        const damage = enemyDamageMap.get(enemy.id) ?? 0;
        const hp = enemy.hp - damage;
        if (hp <= 0) {
          nextGold += enemy.rewardGold;
        } else {
          combatResolved.push({ ...enemy, hp });
        }
      });
      nextEnemies = combatResolved;

      let nextWave = { ...state.wave, spawnTimerMs: state.wave.spawnTimerMs + deltaMs };

      if (nextWave.active && nextWave.enemiesSpawned < nextWave.enemiesToSpawn) {
        while (
          nextWave.spawnTimerMs >= nextWave.spawnIntervalMs &&
          nextWave.enemiesSpawned < nextWave.enemiesToSpawn
        ) {
          nextWave.spawnTimerMs -= nextWave.spawnIntervalMs;
          nextWave.enemiesSpawned += 1;
          nextEnemies.push(createEnemy(nextWave.waveNumber));
        }
      }

      const clearedWave =
        nextWave.active && nextWave.enemiesSpawned >= nextWave.enemiesToSpawn && nextEnemies.length === 0;

      if (clearedWave) {
        nextWave = {
          ...nextWave,
          active: false,
        };
      }

      let nextSkill = state.skill;
      if (state.skill.isCoolingDown) {
        const remaining = Math.max(0, state.skill.cooldownRemainingMs - deltaMs);
        nextSkill = {
          ...state.skill,
          cooldownRemainingMs: remaining,
          isCoolingDown: remaining > 0,
        };
      }

      if (nextLife <= 0) {
        nextLife = 20;
        nextGold = 220;
        nextEnemies = [];
        nextWave = {
          active: false,
          waveNumber: 0,
          enemiesToSpawn: 0,
          enemiesSpawned: 0,
          spawnIntervalMs: 900,
          spawnTimerMs: 0,
        };
      }

      setState({
        life: nextLife,
        gold: nextGold,
        enemies: nextEnemies,
        defenders: updatedDefenders,
        wave: nextWave,
        skill: nextSkill,
      });

      if (clearedWave && state.progress.step === 'clear_wave') {
        setProgress('summon_hero');
      }
    },
  };
}

state = initializeStore();

export function useGameStore(): GameStore {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export type { Hero, Enemy, Defender, Point };
