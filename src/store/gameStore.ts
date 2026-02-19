import { useSyncExternalStore } from 'react';

export type UnitType = 'marine' | 'firebat' | 'hero';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

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
  laneId: number;
}

interface Enemy {
  id: string;
  hp: number;
  maxHp: number;
  speed: number;
  rewardGold: number;
  laneId: number;
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

interface GameState {
  life: number;
  gold: number;
  castlePosition: Point;
  lanes: Point[][];
  selectedLane: number;
  laneBuildCounts: number[];
  defenders: Defender[];
  enemies: Enemy[];
  wave: WaveState;
  selectedHero: Hero;
  isShopOpen: boolean;
  skill: SkillState;
}

interface GameActions {
  selectLane: (laneId: number) => void;
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

const LANE_COUNT = 6;
const SKILL_COOLDOWN_MS = 7000;
const BASE_ENEMY_HP = 55;
const MAX_STRUCTURES_PER_LANE = 5;

const castlePosition: Point = { x: 50, y: 50 };

const lanes: Point[][] = [
  [
    { x: 2, y: 20 },
    { x: 22, y: 24 },
    { x: 36, y: 35 },
    castlePosition,
  ],
  [
    { x: 2, y: 50 },
    { x: 20, y: 50 },
    { x: 34, y: 50 },
    castlePosition,
  ],
  [
    { x: 2, y: 80 },
    { x: 22, y: 76 },
    { x: 36, y: 65 },
    castlePosition,
  ],
  [
    { x: 98, y: 20 },
    { x: 78, y: 24 },
    { x: 64, y: 35 },
    castlePosition,
  ],
  [
    { x: 98, y: 50 },
    { x: 80, y: 50 },
    { x: 66, y: 50 },
    castlePosition,
  ],
  [
    { x: 98, y: 80 },
    { x: 78, y: 76 },
    { x: 64, y: 65 },
    castlePosition,
  ],
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

function getLaneSlotPoint(laneId: number, slotIndex: number): Point {
  const lane = lanes[laneId];
  const center = lane[lane.length - 1];
  const start = lane[0];
  const nearCenter = lane[lane.length - 2];
  const ratio = clamp(0.32 + slotIndex * 0.14, 0.32, 0.82);
  const baseX = start.x + (nearCenter.x - start.x) * ratio;
  const baseY = start.y + (nearCenter.y - start.y) * ratio;

  const dirX = center.x - baseX;
  const dirY = center.y - baseY;
  const length = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
  const perpX = -dirY / length;
  const perpY = dirX / length;

  const side = laneId < 3 ? 1 : -1;
  return {
    x: clamp(baseX + perpX * 5 * side, 6, 94),
    y: clamp(baseY + perpY * 5 * side, 6, 94),
  };
}

function createEnemy(waveNumber: number, laneId: number): Enemy {
  const hp = BASE_ENEMY_HP + waveNumber * 18;
  const start = lanes[laneId][0];
  enemyId += 1;
  return {
    id: `enemy-${enemyId}`,
    hp,
    maxHp: hp,
    speed: 11 + waveNumber * 0.75,
    rewardGold: 12 + waveNumber * 2,
    laneId,
    pathIndex: 0,
    progress: 0,
    position: { ...start },
    alive: true,
  };
}

function createDefender(type: UnitType, laneId: number, slotIndex: number): Defender {
  defenderId += 1;
  const slot = getLaneSlotPoint(laneId, slotIndex);

  if (type === 'hero') {
    return {
      id: `defender-${defenderId}`,
      kind: 'hero',
      unitType: 'hero',
      position: slot,
      range: 30,
      damage: 24,
      attackCooldownMs: 700,
      cooldownRemainingMs: 0,
      level: 1,
      laneId,
    };
  }

  if (type === 'firebat') {
    return {
      id: `defender-${defenderId}`,
      kind: 'tower',
      unitType: 'firebat',
      position: slot,
      range: 19,
      damage: 14,
      attackCooldownMs: 560,
      cooldownRemainingMs: 0,
      level: 1,
      laneId,
    };
  }

  return {
    id: `defender-${defenderId}`,
    kind: 'tower',
    unitType: 'marine',
    position: slot,
    range: 25,
    damage: 10,
    attackCooldownMs: 500,
    cooldownRemainingMs: 0,
    level: 1,
    laneId,
  };
}

function moveEnemy(enemy: Enemy, deltaMs: number) {
  if (!enemy.alive) {
    return enemy;
  }

  const lane = lanes[enemy.laneId];
  let next = { ...enemy };
  let remainingDistance = (next.speed * deltaMs) / 1000;

  while (remainingDistance > 0) {
    const segmentLength = getSegmentLength(lane, next.pathIndex);
    if (segmentLength <= 0) {
      return { ...next, alive: false, position: { ...lane[lane.length - 1] } };
    }

    const remainingOnSegment = segmentLength - next.progress;

    if (remainingDistance >= remainingOnSegment) {
      next.pathIndex += 1;
      next.progress = 0;
      remainingDistance -= remainingOnSegment;

      if (next.pathIndex >= lane.length - 1) {
        return { ...next, alive: false, position: { ...lane[lane.length - 1] } };
      }
    } else {
      next.progress += remainingDistance;
      remainingDistance = 0;
    }
  }

  const start = lane[next.pathIndex];
  const end = lane[next.pathIndex + 1];
  const segmentLength = getSegmentLength(lane, next.pathIndex);
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

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function initializeStore(): GameStore {
  return {
    life: 20,
    gold: 500,
    castlePosition,
    lanes,
    selectedLane: 0,
    laneBuildCounts: Array.from({ length: LANE_COUNT }, () => 0),
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
      dps: 24,
      range: 30,
      rarity: 'rare',
      level: 1,
    },
    isShopOpen: false,
    skill: {
      isCoolingDown: false,
      cooldownRemainingMs: 0,
      cooldownTotalMs: SKILL_COOLDOWN_MS,
    },
    selectLane: (laneId) => {
      if (laneId < 0 || laneId >= LANE_COUNT) {
        return;
      }
      setState({ selectedLane: laneId });
    },
    startNextWave: () => {
      if (state.wave.active) {
        return;
      }
      const nextWaveNumber = state.wave.waveNumber + 1;
      const count = 12 + nextWaveNumber * 4;
      setState({
        wave: {
          ...state.wave,
          active: true,
          waveNumber: nextWaveNumber,
          enemiesToSpawn: count,
          enemiesSpawned: 0,
          spawnIntervalMs: clamp(820 - nextWaveNumber * 40, 220, 820),
          spawnTimerMs: 0,
        },
      });
    },
    toggleShop: () => setState({ isShopOpen: !state.isShopOpen }),
    closeShop: () => setState({ isShopOpen: false }),
    buyTower: () => {
      const cost = 100;
      if (state.gold < cost) {
        return false;
      }

      const laneId = state.selectedLane;
      const laneCount = state.laneBuildCounts[laneId];
      if (laneCount >= MAX_STRUCTURES_PER_LANE) {
        return false;
      }

      const newDefender = createDefender('marine', laneId, laneCount);
      const nextLaneBuildCounts = [...state.laneBuildCounts];
      nextLaneBuildCounts[laneId] += 1;

      setState({
        gold: state.gold - cost,
        defenders: [...state.defenders, newDefender],
        laneBuildCounts: nextLaneBuildCounts,
      });
      return true;
    },
    summonUnit: (type) => {
      const cost = type === 'marine' ? 70 : 90;
      if (state.gold < cost) {
        return false;
      }

      const laneId = state.selectedLane;
      const laneCount = state.laneBuildCounts[laneId];
      if (laneCount >= MAX_STRUCTURES_PER_LANE) {
        return false;
      }

      const newDefender = createDefender(type, laneId, laneCount);
      const nextLaneBuildCounts = [...state.laneBuildCounts];
      nextLaneBuildCounts[laneId] += 1;

      setState({
        gold: state.gold - cost,
        defenders: [...state.defenders, newDefender],
        laneBuildCounts: nextLaneBuildCounts,
      });
      return true;
    },
    summonHero: () => {
      const cost = 200;
      if (state.gold < cost) {
        return false;
      }

      const laneId = state.selectedLane;
      const laneCount = state.laneBuildCounts[laneId];
      if (laneCount >= MAX_STRUCTURES_PER_LANE) {
        return false;
      }

      const heroDefender = createDefender('hero', laneId, laneCount);
      const nextLaneBuildCounts = [...state.laneBuildCounts];
      nextLaneBuildCounts[laneId] += 1;

      setState({
        gold: state.gold - cost,
        defenders: [...state.defenders, heroDefender],
        laneBuildCounts: nextLaneBuildCounts,
      });
      return true;
    },
    evolveHero: () => {
      const cost = 160;
      if (state.gold < cost) {
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
      let nextEnemies = state.enemies.map((enemy) => moveEnemy(enemy, deltaMs));

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
          const laneId = nextWave.enemiesSpawned % LANE_COUNT;
          nextWave.enemiesSpawned += 1;
          nextEnemies.push(createEnemy(nextWave.waveNumber, laneId));
        }
      }

      if (nextWave.active && nextWave.enemiesSpawned >= nextWave.enemiesToSpawn && nextEnemies.length === 0) {
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
        nextGold = 500;
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
    },
  };
}

state = initializeStore();

export function useGameStore(): GameStore {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export type { Hero, Enemy, Defender, Point };
