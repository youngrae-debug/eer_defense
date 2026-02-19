import { useSyncExternalStore } from 'react';

export type UnitType = 'marine' | 'firebat' | 'hero';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type WorkerState = 'idle' | 'moving' | 'building';

export interface Point {
  x: number;
  y: number;
}

export interface Tile {
  x: number;
  y: number;
  walkable: boolean;
  towerId?: string;
}

export interface Worker {
  id: string;
  laneId: number;
  x: number;
  y: number;
  state: WorkerState;
  target?: Point;
  buildStartTime?: number;
  plannedTowerTile?: Point;
  towerId?: string;
}

export interface Tower {
  id: string;
  laneId: number;
  x: number;
  y: number;
  hp: number;
  completed: boolean;
}

export interface Monster {
  id: string;
  laneId: number;
  x: number;
  y: number;
  hp: number;
  speed: number;
  pathIndex: number;
  state: 'moving' | 'attacking';
}

export interface Hero {
  id: string;
  name: string;
  dps: number;
  range: number;
  rarity: Rarity;
  level: number;
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

interface LaneState {
  id: number;
  grid: Tile[][];
  workers: Worker[];
  towers: Tower[];
  monsters: Monster[];
  cachedPath: Point[];
}

interface GameState {
  life: number;
  gold: number;
  lanes: LaneState[];
  selectedLane: number;
  selectedWorkerId: string | null;
  isTowerPlacementMode: boolean;
  heroUnits: Array<{ id: string; laneId: number; x: number; y: number; level: number }>;
  wave: WaveState;
  selectedHero: Hero;
  isShopOpen: boolean;
  skill: SkillState;
}

interface GameActions {
  selectLane: (laneId: number) => void;
  selectWorker: (workerId: string | null) => void;
  startTowerPlacementMode: () => void;
  cancelTowerPlacementMode: () => void;
  requestBuildAtTile: (tileX: number, tileY: number) => boolean;
  buyWorker: () => boolean;
  upgradeSelectedWorkerTower: () => boolean;
  startNextWave: () => void;
  toggleShop: () => void;
  closeShop: () => void;
  summonHero: () => boolean;
  evolveHero: () => boolean;
  triggerSkill: () => void;
  tick: (deltaMs: number) => void;
}

export type GameStore = GameState & GameActions;

const GRID_SIZE = 32;
const LANE_COUNT = 6;
const START_GOLD = 900;
const WORKER_COST = 80;
const BUILD_TOWER_COST = 100;
const UPGRADE_TOWER_COST = 140;
const HERO_COST = 200;
const BUILD_DURATION_MS = 2000;
const SKILL_COOLDOWN_MS = 7000;
const WORKER_SPEED_TILES_PER_SEC = 7;
const MONSTER_REWARD = 10;
const GOAL_TILE = { x: 16, y: 30 };
const SPAWN_TILE = { x: 16, y: 1 };

let workerCounter = 0;
let towerCounter = 0;
let monsterCounter = 0;
let heroCounter = 0;

function createGrid(): Tile[][] {
  const rows: Tile[][] = [];
  let y = 0;
  while (y < GRID_SIZE) {
    const row: Tile[] = [];
    let x = 0;
    while (x < GRID_SIZE) {
      row.push({ x, y, walkable: true });
      x += 1;
    }
    rows.push(row);
    y += 1;
  }
  return rows;
}

function createLane(id: number): LaneState {
  return {
    id,
    grid: createGrid(),
    workers: [],
    towers: [],
    monsters: [],
    cachedPath: computePath(createGrid(), SPAWN_TILE, GOAL_TILE),
  };
}

function cloneLane(lane: LaneState): LaneState {
  const grid = lane.grid.map((row) => row.map((tile) => ({ ...tile })));
  return {
    id: lane.id,
    grid,
    workers: lane.workers.map((worker) => ({ ...worker })),
    towers: lane.towers.map((tower) => ({ ...tower })),
    monsters: lane.monsters.map((monster) => ({ ...monster })),
    cachedPath: lane.cachedPath.map((p) => ({ ...p })),
  };
}

function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
}

function computePath(grid: Tile[][], start: Point, goal: Point): Point[] {
  const queue: Point[] = [{ x: start.x, y: start.y }];
  const visited: boolean[][] = [];
  const parent: Array<Array<Point | null>> = [];

  let y = 0;
  while (y < GRID_SIZE) {
    const visitedRow: boolean[] = [];
    const parentRow: Array<Point | null> = [];
    let x = 0;
    while (x < GRID_SIZE) {
      visitedRow.push(false);
      parentRow.push(null);
      x += 1;
    }
    visited.push(visitedRow);
    parent.push(parentRow);
    y += 1;
  }

  visited[start.y][start.x] = true;

  let qi = 0;
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  while (qi < queue.length) {
    const cur = queue[qi];
    qi += 1;

    if (cur.x === goal.x && cur.y === goal.y) {
      const path: Point[] = [];
      let node: Point | null = cur;
      while (node) {
        path.push({ x: node.x, y: node.y });
        node = parent[node.y][node.x];
      }
      path.reverse();
      return path;
    }

    let di = 0;
    while (di < dirs.length) {
      const nx = cur.x + dirs[di].x;
      const ny = cur.y + dirs[di].y;
      if (inBounds(nx, ny) && !visited[ny][nx] && grid[ny][nx].walkable) {
        visited[ny][nx] = true;
        parent[ny][nx] = cur;
        queue.push({ x: nx, y: ny });
      }
      di += 1;
    }
  }

  return [];
}

function tileToPercent(tile: Point): Point {
  return {
    x: ((tile.x + 0.5) / GRID_SIZE) * 100,
    y: ((tile.y + 0.5) / GRID_SIZE) * 100,
  };
}

function laneToDisplay(point: Point): Point {
  const center = { x: 50, y: 88 };
  const dx = point.x - 50;
  const dy = point.y - 50;
  return {
    x: Math.max(4, Math.min(96, center.x + dx)),
    y: Math.max(4, Math.min(96, center.y + dy)),
  };
}

function getSelectedLane(lanes: LaneState[], selectedLane: number): LaneState {
  let i = 0;
  while (i < lanes.length) {
    if (lanes[i].id === selectedLane) {
      return lanes[i];
    }
    i += 1;
  }
  return lanes[0];
}

let state: GameStore;

const listeners: Array<() => void> = [];

function setState(partial: Partial<GameStore>) {
  state = { ...state, ...partial };
  let i = 0;
  while (i < listeners.length) {
    listeners[i]();
    i += 1;
  }
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) {
      listeners.splice(idx, 1);
    }
  };
}

function initializeStore(): GameStore {
  const lanesData: LaneState[] = [];
  let laneId = 0;
  while (laneId < LANE_COUNT) {
    lanesData.push(createLane(laneId));
    laneId += 1;
  }

  return {
    life: 20,
    gold: START_GOLD,
    lanes: lanesData,
    selectedLane: 0,
    selectedWorkerId: null,
    isTowerPlacementMode: false,
    heroUnits: [],
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
    selectLane: (laneIdParam) => {
      if (laneIdParam < 0 || laneIdParam >= LANE_COUNT) {
        return;
      }
      setState({ selectedLane: laneIdParam, selectedWorkerId: null, isTowerPlacementMode: false });
    },
    selectWorker: (workerIdParam) => {
      setState({ selectedWorkerId: workerIdParam, isTowerPlacementMode: false });
    },
    startTowerPlacementMode: () => {
      const lane = getSelectedLane(state.lanes, state.selectedLane);
      let selectedWorker: Worker | null = null;
      let i = 0;
      while (i < lane.workers.length) {
        if (lane.workers[i].id === state.selectedWorkerId) {
          selectedWorker = lane.workers[i];
          break;
        }
        i += 1;
      }
      if (!selectedWorker || selectedWorker.towerId) {
        return;
      }
      setState({ isTowerPlacementMode: true });
    },
    cancelTowerPlacementMode: () => {
      setState({ isTowerPlacementMode: false });
    },
    requestBuildAtTile: (tileX, tileY) => {
      if (!state.isTowerPlacementMode || state.gold < BUILD_TOWER_COST) {
        return false;
      }
      if (!inBounds(tileX, tileY)) {
        return false;
      }

      const lanesNext = state.lanes.map((lane) => cloneLane(lane));
      const lane = getSelectedLane(lanesNext, state.selectedLane);

      let selectedWorker: Worker | null = null;
      let wi = 0;
      while (wi < lane.workers.length) {
        if (lane.workers[wi].id === state.selectedWorkerId) {
          selectedWorker = lane.workers[wi];
          break;
        }
        wi += 1;
      }

      if (!selectedWorker || selectedWorker.towerId) {
        return false;
      }

      const tile = lane.grid[tileY][tileX];
      if (!tile.walkable || tile.towerId) {
        return false;
      }

      tile.walkable = false;
      const pathCheck = computePath(lane.grid, SPAWN_TILE, GOAL_TILE);
      tile.walkable = true;
      if (pathCheck.length === 0) {
        return false;
      }

      selectedWorker.state = 'moving';
      selectedWorker.target = { x: tileX, y: tileY };
      selectedWorker.plannedTowerTile = { x: tileX, y: tileY };
      selectedWorker.buildStartTime = undefined;

      setState({ lanes: lanesNext, isTowerPlacementMode: false });
      return true;
    },
    buyWorker: () => {
      if (state.gold < WORKER_COST) {
        return false;
      }
      const lanesNext = state.lanes.map((lane) => cloneLane(lane));
      const lane = getSelectedLane(lanesNext, state.selectedLane);
      workerCounter += 1;
      const spawn = laneToDisplay(tileToPercent(GOAL_TILE));
      const worker: Worker = {
        id: `worker-${workerCounter}`,
        laneId: lane.id,
        x: spawn.x + (Math.random() - 0.5) * 4,
        y: spawn.y + (Math.random() - 0.5) * 4,
        state: 'idle',
        towerId: null,
      };
      lane.workers.push(worker);

      setState({
        lanes: lanesNext,
        gold: state.gold - WORKER_COST,
        selectedWorkerId: worker.id,
      });
      return true;
    },
    upgradeSelectedWorkerTower: () => {
      if (state.gold < UPGRADE_TOWER_COST || !state.selectedWorkerId) {
        return false;
      }

      const lanesNext = state.lanes.map((lane) => cloneLane(lane));
      const lane = getSelectedLane(lanesNext, state.selectedLane);
      let targetTowerId: string | null = null;

      let wi = 0;
      while (wi < lane.workers.length) {
        if (lane.workers[wi].id === state.selectedWorkerId) {
          targetTowerId = lane.workers[wi].towerId || null;
          break;
        }
        wi += 1;
      }
      if (!targetTowerId) {
        return false;
      }

      let upgraded = false;
      let ti = 0;
      while (ti < lane.towers.length) {
        if (lane.towers[ti].id === targetTowerId && lane.towers[ti].completed && lane.towers[ti].hp > 0) {
          lane.towers[ti].hp += 150;

          upgraded = true;
          break;
        }
        ti += 1;
      }
      if (!upgraded) {
        return false;
      }

      setState({ lanes: lanesNext, gold: state.gold - UPGRADE_TOWER_COST });
      return true;
    },
    startNextWave: () => {
      if (state.wave.active) {
        return;
      }
      const nextWaveNumber = state.wave.waveNumber + 1;
      setState({
        wave: {
          ...state.wave,
          active: true,
          waveNumber: nextWaveNumber,
          enemiesToSpawn: 18 + nextWaveNumber * 4,
          enemiesSpawned: 0,
          spawnIntervalMs: clamp(900 - nextWaveNumber * 35, 220, 900),
          spawnTimerMs: 0,
        },
      });
    },
    toggleShop: () => setState({ isShopOpen: !state.isShopOpen }),
    closeShop: () => setState({ isShopOpen: false }),
    summonUnit: () => false,
    summonHero: () => {
      if (state.gold < HERO_COST) {
        return false;
      }
      heroCounter += 1;
      const center = laneToDisplay(tileToPercent(GOAL_TILE));
      const heroUnits = state.heroUnits.concat({
        id: `hero-${heroCounter}`,
        laneId: state.selectedLane,
        x: center.x + (Math.random() - 0.5) * 5,
        y: center.y + (Math.random() - 0.5) * 5,
        level: 1,
      });
      setState({ gold: state.gold - HERO_COST, heroUnits });
      return true;
    },
    evolveHero: () => {
      const cost = 160;
      if (state.gold < cost) {
        return false;
      }
      setState({
        gold: state.gold - cost,
        selectedHero: {
          ...state.selectedHero,
          level: state.selectedHero.level + 1,
          dps: Math.round(state.selectedHero.dps * 1.2),
          range: state.selectedHero.range + 1,
        },
      });
      return true;
    },
    triggerSkill: () => {
      if (state.skill.isCoolingDown) {
        return;
      }
      const lanesNext = state.lanes.map((lane) => cloneLane(lane));
      const lane = getSelectedLane(lanesNext, state.selectedLane);
      let bonusGold = 0;
      const survivors: Monster[] = [];
      let i = 0;
      while (i < lane.monsters.length) {
        const nextHp = lane.monsters[i].hp - (80 + state.selectedHero.level * 8);
        if (nextHp > 0) {
          survivors.push({ ...lane.monsters[i], hp: nextHp });
        } else {
          bonusGold += MONSTER_REWARD;
        }
        i += 1;
      }
      lane.monsters = survivors;
      setState({
        lanes: lanesNext,
        gold: state.gold + bonusGold,
        skill: {
          ...state.skill,
          isCoolingDown: true,
          cooldownRemainingMs: SKILL_COOLDOWN_MS,
        },
      });
    },
    tick: (deltaMs) => {
      const lanesNext = state.lanes.map((lane) => cloneLane(lane));
      let nextGold = state.gold;
      let nextLife = state.life;

      let li = 0;
      while (li < lanesNext.length) {
        const lane = lanesNext[li];

        let wi = 0;
        while (wi < lane.workers.length) {
          const worker = lane.workers[wi];
          if (worker.state === 'moving' && worker.target) {
            const targetWorld = laneToDisplay(tileToPercent(worker.target));
            const dx = targetWorld.x - worker.x;
            const dy = targetWorld.y - worker.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const step = (WORKER_SPEED_TILES_PER_SEC * deltaMs) / 1000;
            if (dist <= step || dist <= 0.3) {
              worker.x = targetWorld.x;
              worker.y = targetWorld.y;
              worker.state = 'building';
              worker.buildStartTime = Date.now();
            } else {
              worker.x += (dx / dist) * step;
              worker.y += (dy / dist) * step;
            }
          } else if (worker.state === 'building' && worker.buildStartTime && worker.plannedTowerTile) {
            if (Date.now() - worker.buildStartTime >= BUILD_DURATION_MS) {
              towerCounter += 1;
              const tower: Tower = {
                id: `tower-${towerCounter}`,
                laneId: lane.id,
                x: worker.plannedTowerTile.x,
                y: worker.plannedTowerTile.y,
                hp: 220,
                completed: true,
              };

              lane.towers.push(tower);
              lane.grid[tower.y][tower.x].walkable = false;
              lane.grid[tower.y][tower.x].towerId = tower.id;

              const nextPath = computePath(lane.grid, SPAWN_TILE, GOAL_TILE);
              if (nextPath.length === 0) {
                lane.grid[tower.y][tower.x].walkable = true;
                lane.grid[tower.y][tower.x].towerId = undefined;
                lane.towers.pop();
                worker.state = 'idle';
                worker.target = undefined;
                worker.buildStartTime = undefined;
                worker.plannedTowerTile = undefined;
              } else {
                lane.cachedPath = nextPath;
                worker.state = 'idle';
                worker.target = undefined;
                worker.buildStartTime = undefined;
                worker.plannedTowerTile = undefined;
                worker.towerId = tower.id;
              }
            }
          }
          wi += 1;
        }

        let mi = 0;
        while (mi < lane.monsters.length) {
          const monster = lane.monsters[mi];
          if (lane.cachedPath.length === 0) {
            monster.state = 'attacking';
            if (lane.towers.length > 0) {
              lane.towers[0].hp -= 20 * (deltaMs / 1000);
              if (lane.towers[0].hp <= 0) {
                const deadTower = lane.towers[0];
                lane.grid[deadTower.y][deadTower.x].walkable = true;
                lane.grid[deadTower.y][deadTower.x].towerId = undefined;
                lane.towers.splice(0, 1);
                lane.cachedPath = computePath(lane.grid, SPAWN_TILE, GOAL_TILE);
              }
            }
            mi += 1;
            continue;
          }

          monster.state = 'moving';
          const path = lane.cachedPath;
          const currentPathPoint = path[monster.pathIndex] || path[path.length - 1];
          const targetWorld = laneToDisplay(tileToPercent(currentPathPoint));
          const dx = targetWorld.x - monster.x;
          const dy = targetWorld.y - monster.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const step = (monster.speed * deltaMs) / 1000;

          if (dist <= step || dist <= 0.4) {
            monster.x = targetWorld.x;
            monster.y = targetWorld.y;
            monster.pathIndex += 1;
            if (monster.pathIndex >= path.length) {
              monster.hp = 0;
              nextLife -= 1;
            }
          } else {
            monster.x += (dx / dist) * step;
            monster.y += (dy / dist) * step;
          }
          mi += 1;
        }

        const aliveMonsters: Monster[] = [];
        let mci = 0;
        while (mci < lane.monsters.length) {
          if (lane.monsters[mci].hp > 0) {
            aliveMonsters.push(lane.monsters[mci]);
          } else {
            nextGold += MONSTER_REWARD;
          }
          mci += 1;
        }
        lane.monsters = aliveMonsters;

        let d = 0;
        while (d < lane.towers.length) {
          const tower = lane.towers[d];
          if (tower.completed) {
            const pos = laneToDisplay(tileToPercent({ x: tower.x, y: tower.y }));
            const range = 12;
            let t = 0;
            while (t < lane.monsters.length) {
              const m = lane.monsters[t];
              const ddx = pos.x - m.x;
              const ddy = pos.y - m.y;
              const dist = Math.sqrt(ddx * ddx + ddy * ddy);
              if (dist <= range) {
                m.hp -= tower.hp > 240 ? 24 * (deltaMs / 1000) : 15 * (deltaMs / 1000);
                break;
              }
              t += 1;
            }
          }
          d += 1;
        }

        li += 1;
      }

      let nextWave = { ...state.wave, spawnTimerMs: state.wave.spawnTimerMs + deltaMs };
      if (nextWave.active && nextWave.enemiesSpawned < nextWave.enemiesToSpawn) {
        while (
          nextWave.spawnTimerMs >= nextWave.spawnIntervalMs &&
          nextWave.enemiesSpawned < nextWave.enemiesToSpawn
        ) {
          nextWave.spawnTimerMs -= nextWave.spawnIntervalMs;
          const laneId = nextWave.enemiesSpawned % LANE_COUNT;
          const lane = getSelectedLane(lanesNext, laneId);
          monsterCounter += 1;
          const spawn = laneToDisplay(tileToPercent(SPAWN_TILE));
          lane.monsters.push({
            id: `monster-${monsterCounter}`,
            laneId,
            x: spawn.x,
            y: spawn.y,
            hp: 80 + nextWave.waveNumber * 22,
            speed: 6 + nextWave.waveNumber * 0.4,
            pathIndex: 1,
            state: 'moving',
          });
          nextWave.enemiesSpawned += 1;
        }
      }

      if (nextWave.active) {
        let remainingMonsters = 0;
        let l = 0;
        while (l < lanesNext.length) {
          remainingMonsters += lanesNext[l].monsters.length;
          l += 1;
        }
        if (nextWave.enemiesSpawned >= nextWave.enemiesToSpawn && remainingMonsters === 0) {
          nextWave.active = false;
        }
      }

      let nextSkill = state.skill;
      if (state.skill.isCoolingDown) {
        const remain = state.skill.cooldownRemainingMs - deltaMs;
        nextSkill = {
          ...state.skill,
          cooldownRemainingMs: remain > 0 ? remain : 0,
          isCoolingDown: remain > 0,
        };
      }

      if (nextLife <= 0) {
        const resetLanes: LaneState[] = [];
        let laneId = 0;
        while (laneId < LANE_COUNT) {
          resetLanes.push(createLane(laneId));
          laneId += 1;
        }

        setState({
          life: 20,
          gold: START_GOLD,
          lanes: resetLanes,
          selectedLane: 0,
          selectedWorkerId: null,
          isTowerPlacementMode: false,
          heroUnits: [],
          wave: {
            active: false,
            waveNumber: 0,
            enemiesToSpawn: 0,
            enemiesSpawned: 0,
            spawnIntervalMs: 900,
            spawnTimerMs: 0,
          },
          skill: {
            ...state.skill,
            isCoolingDown: false,
            cooldownRemainingMs: 0,
          },
        });
        return;
      }

      setState({
        life: nextLife,
        gold: nextGold,
        lanes: lanesNext,
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
