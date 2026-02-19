import { useSyncExternalStore } from 'react';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type WorkerState = 'idle' | 'moving' | 'building';
export type MonsterState = 'moving' | 'attacking';

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
  lineId: number;
  x: number;
  y: number;
  state: WorkerState;
  target?: Point;
  buildStartTime?: number;
  assignedTowerId?: string;
}

export interface Tower {
  id: string;
  lineId: number;
  x: number;
  y: number;
  hp: number;
  completed: boolean;
  workerId: string;
}

export interface Monster {
  id: string;
  lineId: number;
  x: number;
  y: number;
  hp: number;
  damage: number;
  speed: number;
  state: MonsterState;
  pathIndex: number;
  travelProgress: number;
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
  cooldown: number;
  lastUsed: number;
}

interface WaveState {
  active: boolean;
  waveNumber: number;
  enemiesToSpawn: number;
  enemiesSpawned: number;
  spawnIntervalMs: number;
  spawnTimerMs: number;
}

interface HeroUnit {
  id: string;
  lineId: number;
  x: number;
  y: number;
  level: number;
}

interface LineState {
  id: number;
  spawn: Point;
  goal: Point;
  grid: Tile[][];
  workers: Worker[];
  towers: Tower[];
  monsters: Monster[];
  cachedPath: Point[];
}

interface GameState {
  life: number;
  gold: number;
  lines: LineState[];
  selectedLine: number;
  selectedWorkerId: string | null;
  isTowerPlacementMode: boolean;
  heroUnits: HeroUnit[];
  wave: WaveState;
  selectedHero: Hero;
  skill: SkillState;
}

interface GameActions {
  selectLane: (lineId: number) => void;
  selectWorker: (workerId: string | null) => void;
  startTowerPlacementMode: () => void;
  cancelTowerPlacementMode: () => void;
  requestBuildAtTile: (tileX: number, tileY: number) => boolean;
  buyWorker: () => boolean;
  upgradeSelectedWorkerTower: () => boolean;
  startNextWave: () => void;
  summonHero: () => boolean;
  evolveHero: () => boolean;
  triggerSkill: () => void;
}

export type GameStore = GameState & GameActions;

const GRID_SIZE = 32;
const LINE_COUNT = 6;
const START_GOLD = 900;
const START_LIFE = 20;
const WORKER_COST = 80;
const BUILD_TOWER_COST = 100;
const UPGRADE_TOWER_COST = 140;
const HERO_COST = 200;
const BUILD_DURATION_MS = 2000;
const MONSTER_REWARD = 10;
const SKILL_COOLDOWN_MS = 7000;
const SPAWN: Point = { x: 16, y: 1 };
const GOAL: Point = { x: 16, y: 30 };

let workerCounter = 0;
let towerCounter = 0;
let monsterCounter = 0;
let heroCounter = 0;

function createGrid(): Tile[][] {
  const grid: Tile[][] = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    const row: Tile[] = [];
    for (let x = 0; x < GRID_SIZE; x += 1) {
      row.push({ x, y, walkable: true });
    }
    grid.push(row);
  }
  return grid;
}

function manhattan(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
}

function aStar(grid: Tile[][], start: Point, goal: Point): Point[] | null {
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  const gScore: number[][] = [];
  const fScore: number[][] = [];
  const open: Point[] = [];
  const inOpen: boolean[][] = [];
  const parent: Array<Array<Point | null>> = [];

  for (let y = 0; y < GRID_SIZE; y += 1) {
    gScore.push(Array.from({ length: GRID_SIZE }, () => Number.POSITIVE_INFINITY));
    fScore.push(Array.from({ length: GRID_SIZE }, () => Number.POSITIVE_INFINITY));
    inOpen.push(Array.from({ length: GRID_SIZE }, () => false));
    parent.push(Array.from({ length: GRID_SIZE }, () => null));
  }

  gScore[start.y][start.x] = 0;
  fScore[start.y][start.x] = manhattan(start, goal);
  open.push({ ...start });
  inOpen[start.y][start.x] = true;

  while (open.length > 0) {
    let bestIndex = 0;
    for (let i = 1; i < open.length; i += 1) {
      const p = open[i];
      const best = open[bestIndex];
      if (fScore[p.y][p.x] < fScore[best.y][best.x]) {
        bestIndex = i;
      }
    }

    const current = open.splice(bestIndex, 1)[0];
    inOpen[current.y][current.x] = false;

    if (current.x === goal.x && current.y === goal.y) {
      const path: Point[] = [];
      let node: Point | null = current;
      while (node) {
        path.push({ ...node });
        node = parent[node.y][node.x];
      }
      path.reverse();
      return path;
    }

    for (let d = 0; d < dirs.length; d += 1) {
      const nx = current.x + dirs[d].x;
      const ny = current.y + dirs[d].y;
      if (!inBounds(nx, ny) || !grid[ny][nx].walkable) {
        continue;
      }
      const tentativeG = gScore[current.y][current.x] + 1;
      if (tentativeG < gScore[ny][nx]) {
        parent[ny][nx] = current;
        gScore[ny][nx] = tentativeG;
        fScore[ny][nx] = tentativeG + manhattan({ x: nx, y: ny }, goal);
        if (!inOpen[ny][nx]) {
          open.push({ x: nx, y: ny });
          inOpen[ny][nx] = true;
        }
      }
    }
  }

  return null;
}

function createLine(id: number): LineState {
  const grid = createGrid();
  return {
    id,
    spawn: { ...SPAWN },
    goal: { ...GOAL },
    grid,
    workers: [],
    towers: [],
    monsters: [],
    cachedPath: aStar(grid, SPAWN, GOAL) ?? [],
  };
}

function cloneLine(line: LineState): LineState {
  return {
    ...line,
    spawn: { ...line.spawn },
    goal: { ...line.goal },
    grid: line.grid.map((row) => row.map((tile) => ({ ...tile }))),
    workers: line.workers.map((worker) => ({ ...worker, target: worker.target ? { ...worker.target } : undefined })),
    towers: line.towers.map((tower) => ({ ...tower })),
    monsters: line.monsters.map((monster) => ({ ...monster })),
    cachedPath: line.cachedPath.map((point) => ({ ...point })),
  };
}

function getLine(lines: LineState[], lineId: number): LineState {
  return lines.find((line) => line.id === lineId) ?? lines[0];
}

function lineNeedsRepath(line: LineState): void {
  line.cachedPath = aStar(line.grid, line.spawn, line.goal) ?? [];
}

function initializeState(): GameStore {
  const lines: LineState[] = [];
  for (let i = 0; i < LINE_COUNT; i += 1) {
    lines.push(createLine(i));
  }

  return {
    life: START_LIFE,
    gold: START_GOLD,
    lines,
    selectedLine: 0,
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
      range: 4,
      rarity: 'rare',
      level: 1,
    },
    skill: {
      cooldown: SKILL_COOLDOWN_MS,
      lastUsed: -SKILL_COOLDOWN_MS,
    },
    selectLane: (lineId) => {
      if (lineId < 0 || lineId >= LINE_COUNT) {
        return;
      }
      setState({ selectedLine: lineId, selectedWorkerId: null, isTowerPlacementMode: false });
    },
    selectWorker: (workerId) => {
      setState({ selectedWorkerId: workerId, isTowerPlacementMode: false });
    },
    startTowerPlacementMode: () => {
      if (!state.selectedWorkerId) {
        return;
      }
      const line = getLine(state.lines, state.selectedLine);
      const worker = line.workers.find((w) => w.id === state.selectedWorkerId);
      if (!worker || worker.assignedTowerId) {
        return;
      }
      setState({ isTowerPlacementMode: true });
    },
    cancelTowerPlacementMode: () => {
      setState({ isTowerPlacementMode: false });
    },
    requestBuildAtTile: (tileX, tileY) => {
      if (!state.isTowerPlacementMode || !state.selectedWorkerId || state.gold < BUILD_TOWER_COST) {
        return false;
      }
      if (!inBounds(tileX, tileY)) {
        return false;
      }

      const nextLines = state.lines.map(cloneLine);
      const line = getLine(nextLines, state.selectedLine);
      const worker = line.workers.find((w) => w.id === state.selectedWorkerId);
      if (!worker || worker.assignedTowerId) {
        return false;
      }
      const tile = line.grid[tileY][tileX];
      if (!tile.walkable || tile.towerId || (tileX === line.spawn.x && tileY === line.spawn.y) || (tileX === line.goal.x && tileY === line.goal.y)) {
        return false;
      }

      worker.target = { x: tileX, y: tileY };
      worker.state = 'moving';
      worker.buildStartTime = undefined;

      setState({ lines: nextLines, isTowerPlacementMode: false, gold: state.gold - BUILD_TOWER_COST });
      return true;
    },
    buyWorker: () => {
      if (state.gold < WORKER_COST) {
        return false;
      }
      const nextLines = state.lines.map(cloneLine);
      const line = getLine(nextLines, state.selectedLine);
      if (line.workers.length >= 3) {
        return false;
      }
      workerCounter += 1;
      line.workers.push({
        id: `worker-${workerCounter}`,
        lineId: line.id,
        x: line.goal.x,
        y: line.goal.y,
        state: 'idle',
      });
      setState({ lines: nextLines, gold: state.gold - WORKER_COST, selectedWorkerId: `worker-${workerCounter}` });
      return true;
    },
    upgradeSelectedWorkerTower: () => {
      if (!state.selectedWorkerId || state.gold < UPGRADE_TOWER_COST) {
        return false;
      }
      const nextLines = state.lines.map(cloneLine);
      const line = getLine(nextLines, state.selectedLine);
      const worker = line.workers.find((w) => w.id === state.selectedWorkerId);
      if (!worker?.assignedTowerId) {
        return false;
      }
      const tower = line.towers.find((t) => t.id === worker.assignedTowerId);
      if (!tower || !tower.completed) {
        return false;
      }
      tower.hp += 120;
      setState({ lines: nextLines, gold: state.gold - UPGRADE_TOWER_COST });
      return true;
    },
    startNextWave: () => {
      if (state.wave.active) {
        return;
      }
      const nextWave = state.wave.waveNumber + 1;
      const nextLines = state.lines.map(cloneLine);
      for (let i = 0; i < nextLines.length; i += 1) {
        lineNeedsRepath(nextLines[i]);
      }
      setState({
        lines: nextLines,
        wave: {
          active: true,
          waveNumber: nextWave,
          enemiesToSpawn: 18 + nextWave * 4,
          enemiesSpawned: 0,
          spawnIntervalMs: Math.max(220, 900 - nextWave * 35),
          spawnTimerMs: 0,
        },
      });
    },
    summonHero: () => {
      if (state.gold < HERO_COST) {
        return false;
      }
      heroCounter += 1;
      const heroUnits = state.heroUnits.concat({
        id: `hero-${heroCounter}`,
        lineId: state.selectedLine,
        x: GOAL.x,
        y: GOAL.y,
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
        },
      });
      return true;
    },
    triggerSkill: () => {
      const now = performance.now();
      if (now - state.skill.lastUsed < state.skill.cooldown) {
        return;
      }
      const nextLines = state.lines.map(cloneLine);
      const line = getLine(nextLines, state.selectedLine);
      let killed = 0;
      line.monsters = line.monsters.filter((monster) => {
        const nextHp = monster.hp - (80 + state.selectedHero.level * 8);
        if (nextHp <= 0) {
          killed += 1;
          return false;
        }
        monster.hp = nextHp;
        return true;
      });
      setState({
        lines: nextLines,
        gold: state.gold + killed * MONSTER_REWARD,
        skill: { ...state.skill, lastUsed: now },
      });
    },
  };
}

let state: GameStore = initializeState();
const listeners: Array<() => void> = [];

function setState(patch: Partial<GameStore>) {
  state = { ...state, ...patch };
  for (let i = 0; i < listeners.length; i += 1) {
    listeners[i]();
  }
}

let loopStarted = false;
let lastFrame = 0;

function updateWorkers(nextLines: LineState[], now: number): void {
  for (let li = 0; li < nextLines.length; li += 1) {
    const line = nextLines[li];
    for (let wi = 0; wi < line.workers.length; wi += 1) {
      const worker = line.workers[wi];
      if (worker.state === 'moving' && worker.target) {
        if (worker.x === worker.target.x && worker.y === worker.target.y) {
          worker.state = 'building';
          worker.buildStartTime = now;
          continue;
        }
        const dx = worker.target.x - worker.x;
        const dy = worker.target.y - worker.y;
        if (Math.abs(dx) > 0) {
          worker.x += Math.sign(dx);
        } else if (Math.abs(dy) > 0) {
          worker.y += Math.sign(dy);
        }
      } else if (worker.state === 'building' && worker.target && worker.buildStartTime && now - worker.buildStartTime >= BUILD_DURATION_MS) {
        towerCounter += 1;
        const tower: Tower = {
          id: `tower-${towerCounter}`,
          lineId: line.id,
          x: worker.target.x,
          y: worker.target.y,
          hp: 240,
          completed: true,
          workerId: worker.id,
        };
        line.towers.push(tower);
        line.grid[tower.y][tower.x].walkable = false;
        line.grid[tower.y][tower.x].towerId = tower.id;
        const nextPath = aStar(line.grid, line.spawn, line.goal);
        if (!nextPath) {
          line.towers = line.towers.filter((t) => t.id !== tower.id);
          line.grid[tower.y][tower.x].walkable = true;
          line.grid[tower.y][tower.x].towerId = undefined;
        } else {
          line.cachedPath = nextPath;
          worker.assignedTowerId = tower.id;
        }
        worker.state = 'idle';
        worker.target = undefined;
        worker.buildStartTime = undefined;
      }
    }
  }
}

function pickBlockingTower(line: LineState): Tower | null {
  return line.towers.find((tower) => tower.completed) ?? null;
}

function updateMonsters(nextLines: LineState[], deltaMs: number): { goldGain: number; lifeLoss: number } {
  let goldGain = 0;
  let lifeLoss = 0;

  for (let li = 0; li < nextLines.length; li += 1) {
    const line = nextLines[li];
    const remaining: Monster[] = [];

    for (let mi = 0; mi < line.monsters.length; mi += 1) {
      const monster = line.monsters[mi];
      if (line.cachedPath.length === 0) {
        monster.state = 'attacking';
      }

      if (monster.state === 'attacking') {
        const blockingTower = pickBlockingTower(line);
        if (blockingTower) {
          blockingTower.hp -= monster.damage * (deltaMs / 1000);
          if (blockingTower.hp <= 0) {
            line.towers = line.towers.filter((tower) => tower.id !== blockingTower.id);
            line.grid[blockingTower.y][blockingTower.x].walkable = true;
            line.grid[blockingTower.y][blockingTower.x].towerId = undefined;
            const owner = line.workers.find((worker) => worker.assignedTowerId === blockingTower.id);
            if (owner) {
              owner.assignedTowerId = undefined;
            }
            lineNeedsRepath(line);
            monster.state = line.cachedPath.length > 0 ? 'moving' : 'attacking';
          }
          remaining.push(monster);
          continue;
        }
        monster.state = line.cachedPath.length > 0 ? 'moving' : 'attacking';
      }

      if (monster.state === 'moving') {
        if (monster.pathIndex >= line.cachedPath.length - 1) {
          lifeLoss += 1;
          continue;
        }
        monster.travelProgress += (monster.speed * deltaMs) / 1000;
        while (monster.travelProgress >= 1 && monster.pathIndex < line.cachedPath.length - 1) {
          monster.travelProgress -= 1;
          monster.pathIndex += 1;
          monster.x = line.cachedPath[monster.pathIndex].x;
          monster.y = line.cachedPath[monster.pathIndex].y;
        }
        if (monster.pathIndex >= line.cachedPath.length - 1) {
          lifeLoss += 1;
          continue;
        }
      }

      remaining.push(monster);
    }

    line.monsters = remaining;

    for (let ti = 0; ti < line.towers.length; ti += 1) {
      const tower = line.towers[ti];
      if (!tower.completed) {
        continue;
      }
      const target = line.monsters.find((monster) => Math.abs(monster.x - tower.x) + Math.abs(monster.y - tower.y) <= 3);
      if (target) {
        target.hp -= (tower.hp > 300 ? 20 : 12) * (deltaMs / 1000);
      }
    }

    const alive: Monster[] = [];
    for (let mi = 0; mi < line.monsters.length; mi += 1) {
      if (line.monsters[mi].hp > 0) {
        alive.push(line.monsters[mi]);
      } else {
        goldGain += MONSTER_REWARD;
      }
    }
    line.monsters = alive;

    for (let hi = 0; hi < state.heroUnits.length; hi += 1) {
      const hero = state.heroUnits[hi];
      if (hero.lineId !== line.id) {
        continue;
      }
      const target = line.monsters.find((monster) => manhattan(monster, hero) <= state.selectedHero.range);
      if (target) {
        target.hp -= state.selectedHero.dps * (deltaMs / 1000);
      }
    }
  }

  return { goldGain, lifeLoss };
}

function updateWave(nextLines: LineState[], wave: WaveState, deltaMs: number): WaveState {
  const nextWave = { ...wave, spawnTimerMs: wave.spawnTimerMs + deltaMs };
  if (!nextWave.active || nextWave.enemiesSpawned >= nextWave.enemiesToSpawn) {
    return nextWave;
  }

  while (nextWave.spawnTimerMs >= nextWave.spawnIntervalMs && nextWave.enemiesSpawned < nextWave.enemiesToSpawn) {
    nextWave.spawnTimerMs -= nextWave.spawnIntervalMs;
    const lineId = nextWave.enemiesSpawned % LINE_COUNT;
    const line = getLine(nextLines, lineId);
    if (line.monsters.length >= 120) {
      continue;
    }
    monsterCounter += 1;
    line.monsters.push({
      id: `monster-${monsterCounter}`,
      lineId,
      x: line.spawn.x,
      y: line.spawn.y,
      hp: 80 + nextWave.waveNumber * 22,
      damage: 18,
      speed: 3 + nextWave.waveNumber * 0.2,
      state: line.cachedPath.length > 0 ? 'moving' : 'attacking',
      pathIndex: 0,
      travelProgress: 0,
    });
    nextWave.enemiesSpawned += 1;
  }

  return nextWave;
}

function checkWaveEnd(lines: LineState[], wave: WaveState): WaveState {
  if (!wave.active) {
    return wave;
  }
  const activeMonsters = lines.reduce((count, line) => count + line.monsters.length, 0);
  if (wave.enemiesSpawned >= wave.enemiesToSpawn && activeMonsters === 0) {
    return { ...wave, active: false };
  }
  return wave;
}

function frame(time: number) {
  if (!loopStarted) {
    return;
  }
  if (lastFrame === 0) {
    lastFrame = time;
  }
  const deltaMs = Math.min(100, time - lastFrame);
  lastFrame = time;

  const nextLines = state.lines.map(cloneLine);
  updateWorkers(nextLines, time);
  const monsterResult = updateMonsters(nextLines, deltaMs);
  let nextWave = updateWave(nextLines, state.wave, deltaMs);
  nextWave = checkWaveEnd(nextLines, nextWave);

  const nextLife = Math.max(0, state.life - monsterResult.lifeLoss);
  if (nextLife === 0) {
    state = initializeState();
    for (let i = 0; i < listeners.length; i += 1) {
      listeners[i]();
    }
  } else {
    setState({
      lines: nextLines,
      wave: nextWave,
      life: nextLife,
      gold: state.gold + monsterResult.goldGain,
    });
  }

  requestAnimationFrame(frame);
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  if (!loopStarted) {
    loopStarted = true;
    requestAnimationFrame(frame);
  }

  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) {
      listeners.splice(idx, 1);
    }
  };
}

export function useGameStore(): GameStore {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
