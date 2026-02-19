import { useSyncExternalStore } from 'react';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type WorkerState = 'idle' | 'moving' | 'building' | 'executing';
export type MonsterState = 'moving' | 'attacking';
export type CommandType = 'MOVE' | 'STOP' | 'BUILD_SUNKEN' | 'ATTACK';

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

export type SelectedEntity =
  | { type: 'worker'; id: string }
  | { type: 'hero'; id: string }
  | { type: 'tower'; id: string }
  | null;

export interface PendingCommand {
  type: CommandType;
  entityId: string;
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
  moveProgress: number;
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
  selectedEntity: SelectedEntity;
  pendingCommand: PendingCommand | null;
  previewTile: Point | null;
  heroUnits: HeroUnit[];
  wave: WaveState;
  selectedHero: Hero;
  skill: SkillState;
}

interface GameActions {
  selectLane: (lineId: number) => void;
  issueCommand: (type: CommandType) => void;
  cancelCommand: () => void;
  mapHoverTile: (tileX: number, tileY: number) => void;
  mapClickTile: (tileX: number, tileY: number) => void;
  startNextWave: () => void;
  buyWorker: () => boolean;
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

function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
}

function manhattan(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function createGrid(): Tile[][] {
  return Array.from({ length: GRID_SIZE }, (_, y) =>
    Array.from({ length: GRID_SIZE }, (_, x) => ({ x, y, walkable: true }))
  );
}

function aStar(grid: Tile[][], start: Point, goal: Point): Point[] | null {
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  const gScore = Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => Number.POSITIVE_INFINITY));
  const fScore = Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => Number.POSITIVE_INFINITY));
  const parent: Array<Array<Point | null>> = Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => null));
  const open: Point[] = [{ ...start }];
  const inOpen = Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => false));

  gScore[start.y][start.x] = 0;
  fScore[start.y][start.x] = manhattan(start, goal);
  inOpen[start.y][start.x] = true;

  while (open.length > 0) {
    let bestIndex = 0;
    for (let i = 1; i < open.length; i += 1) {
      if (fScore[open[i].y][open[i].x] < fScore[open[bestIndex].y][open[bestIndex].x]) {
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
      return path.reverse();
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
          inOpen[ny][nx] = true;
          open.push({ x: nx, y: ny });
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

function getEntityAtTile(line: LineState, tile: Point): SelectedEntity {
  const worker = line.workers.find((w) => w.x === tile.x && w.y === tile.y);
  if (worker) {
    return { type: 'worker', id: worker.id };
  }
  const hero = state.heroUnits.find((h) => h.lineId === line.id && h.x === tile.x && h.y === tile.y);
  if (hero) {
    return { type: 'hero', id: hero.id };
  }
  const tower = line.towers.find((t) => t.x === tile.x && t.y === tile.y);
  if (tower) {
    return { type: 'tower', id: tower.id };
  }
  return null;
}

function applyCommand(lines: LineState[], selectedLine: number, command: PendingCommand, tile: Point): { selectedEntity: SelectedEntity; pendingCommand: null } {
  const line = getLine(lines, selectedLine);
  if (command.type === 'MOVE') {
    const worker = line.workers.find((w) => w.id === command.entityId);
    const hero = state.heroUnits.find((h) => h.id === command.entityId && h.lineId === selectedLine);
    if (worker) {
      worker.target = tile;
      worker.state = 'moving';
      worker.moveProgress = 0;
      return { selectedEntity: { type: 'worker', id: worker.id }, pendingCommand: null };
    }
    if (hero) {
      hero.x = tile.x;
      hero.y = tile.y;
      return { selectedEntity: { type: 'hero', id: hero.id }, pendingCommand: null };
    }
  }

  if (command.type === 'BUILD_SUNKEN') {
    const worker = line.workers.find((w) => w.id === command.entityId);
    const tileRef = line.grid[tile.y][tile.x];
    if (worker && !worker.assignedTowerId && tileRef.walkable && !tileRef.towerId) {
      worker.target = { ...tile };
      worker.state = 'executing';
      worker.moveProgress = 0;
    }
    return { selectedEntity: worker ? { type: 'worker', id: worker.id } : null, pendingCommand: null };
  }

  if (command.type === 'ATTACK') {
    return { selectedEntity: state.selectedEntity, pendingCommand: null };
  }

  return { selectedEntity: state.selectedEntity, pendingCommand: null };
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
    selectedEntity: null,
    pendingCommand: null,
    previewTile: null,
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
      setState({ selectedLine: lineId, selectedEntity: null, pendingCommand: null, previewTile: null });
    },
    issueCommand: (type) => {
      if (!state.selectedEntity) {
        return;
      }
      if (type === 'STOP') {
        const linesNext = state.lines.map(cloneLine);
        const line = getLine(linesNext, state.selectedLine);
        if (state.selectedEntity.type === 'worker') {
          const worker = line.workers.find((w) => w.id === state.selectedEntity?.id);
          if (worker) {
            worker.state = 'idle';
            worker.target = undefined;
          }
        }
        setState({ lines: linesNext, pendingCommand: null, previewTile: null });
        return;
      }
      setState({
        pendingCommand: {
          type,
          entityId: state.selectedEntity.id,
        },
      });
    },
    cancelCommand: () => {
      setState({ pendingCommand: null, previewTile: null });
    },
    mapHoverTile: (tileX, tileY) => {
      if (!inBounds(tileX, tileY) || !state.pendingCommand || state.pendingCommand.type !== 'BUILD_SUNKEN') {
        setState({ previewTile: null });
        return;
      }
      setState({ previewTile: { x: tileX, y: tileY } });
    },
    mapClickTile: (tileX, tileY) => {
      if (!inBounds(tileX, tileY)) {
        return;
      }
      const tile = { x: tileX, y: tileY };
      const linesNext = state.lines.map(cloneLine);

      if (state.pendingCommand) {
        const commandResult = applyCommand(linesNext, state.selectedLine, state.pendingCommand, tile);
        setState({ lines: linesNext, selectedEntity: commandResult.selectedEntity, pendingCommand: null, previewTile: null });
        return;
      }

      const line = getLine(linesNext, state.selectedLine);
      const entity = getEntityAtTile(line, tile);
      setState({ selectedEntity: entity, pendingCommand: null, previewTile: null });
    },
    startNextWave: () => {
      if (state.wave.active) {
        return;
      }
      const nextLines = state.lines.map(cloneLine);
      nextLines.forEach((line) => {
        line.cachedPath = aStar(line.grid, line.spawn, line.goal) ?? [];
      });

      const nextWave = state.wave.waveNumber + 1;
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
      const worker: Worker = {
        id: `worker-${workerCounter}`,
        lineId: line.id,
        x: line.goal.x,
        y: line.goal.y,
        state: 'idle',
        moveProgress: 0,
      };
      line.workers.push(worker);
      setState({ lines: nextLines, gold: state.gold - WORKER_COST, selectedEntity: { type: 'worker', id: worker.id } });
      return true;
    },
    summonHero: () => {
      if (state.gold < HERO_COST) {
        return false;
      }
      heroCounter += 1;
      const heroUnits = state.heroUnits.concat({ id: `hero-${heroCounter}`, lineId: state.selectedLine, x: GOAL.x, y: GOAL.y, level: 1 });
      setState({ gold: state.gold - HERO_COST, heroUnits, selectedEntity: { type: 'hero', id: `hero-${heroCounter}` } });
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
      const linesNext = state.lines.map(cloneLine);
      const line = getLine(linesNext, state.selectedLine);
      let killed = 0;
      line.monsters = line.monsters.filter((monster) => {
        const hp = monster.hp - (80 + state.selectedHero.level * 8);
        if (hp <= 0) {
          killed += 1;
          return false;
        }
        monster.hp = hp;
        return true;
      });
      setState({ lines: linesNext, gold: state.gold + killed * MONSTER_REWARD, skill: { ...state.skill, lastUsed: now } });
    },
  };
}

let state: GameStore = initializeState();
const listeners: Array<() => void> = [];

function setState(patch: Partial<GameStore>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function updateWorkers(lines: LineState[], deltaMs: number, now: number) {
  for (let li = 0; li < lines.length; li += 1) {
    const line = lines[li];
    for (let wi = 0; wi < line.workers.length; wi += 1) {
      const worker = line.workers[wi];
      if (!worker.target || (worker.state !== 'moving' && worker.state !== 'executing')) {
        if (worker.state === 'building' && worker.buildStartTime && now - worker.buildStartTime >= BUILD_DURATION_MS && worker.target) {
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
          worker.moveProgress = 0;
        }
        continue;
      }

      worker.moveProgress += deltaMs / 1000;
      if (worker.moveProgress < 0.2) {
        continue;
      }
      worker.moveProgress = 0;

      const dx = worker.target.x - worker.x;
      const dy = worker.target.y - worker.y;
      if (Math.abs(dx) > 0) {
        worker.x += Math.sign(dx);
      } else if (Math.abs(dy) > 0) {
        worker.y += Math.sign(dy);
      }

      if (worker.x === worker.target.x && worker.y === worker.target.y) {
        if (worker.state === 'executing') {
          worker.state = 'building';
          worker.buildStartTime = now;
        } else {
          worker.state = 'idle';
          worker.target = undefined;
        }
      }
    }
  }
}

function updateMonsters(lines: LineState[], deltaMs: number): { lifeLoss: number; goldGain: number } {
  let lifeLoss = 0;
  let goldGain = 0;

  for (let li = 0; li < lines.length; li += 1) {
    const line = lines[li];
    const alive: Monster[] = [];

    for (let mi = 0; mi < line.monsters.length; mi += 1) {
      const monster = line.monsters[mi];
      if (line.cachedPath.length === 0) {
        monster.state = 'attacking';
      }

      if (monster.state === 'attacking') {
        const tower = line.towers.find((t) => t.completed);
        if (tower) {
          tower.hp -= monster.damage * (deltaMs / 1000);
          if (tower.hp <= 0) {
            line.towers = line.towers.filter((t) => t.id !== tower.id);
            line.grid[tower.y][tower.x].walkable = true;
            line.grid[tower.y][tower.x].towerId = undefined;
            const owner = line.workers.find((w) => w.assignedTowerId === tower.id);
            if (owner) {
              owner.assignedTowerId = undefined;
            }
            line.cachedPath = aStar(line.grid, line.spawn, line.goal) ?? [];
          }
        }
        monster.state = line.cachedPath.length > 0 ? 'moving' : 'attacking';
      }

      if (monster.state === 'moving') {
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

      alive.push(monster);
    }

    for (let ti = 0; ti < line.towers.length; ti += 1) {
      const tower = line.towers[ti];
      const target = alive.find((m) => manhattan(m, tower) <= 3);
      if (target) {
        target.hp -= 15 * (deltaMs / 1000);
      }
    }

    for (let hi = 0; hi < state.heroUnits.length; hi += 1) {
      const hero = state.heroUnits[hi];
      if (hero.lineId !== line.id) {
        continue;
      }
      const target = alive.find((m) => manhattan(m, hero) <= state.selectedHero.range);
      if (target) {
        target.hp -= state.selectedHero.dps * (deltaMs / 1000);
      }
    }

    line.monsters = alive.filter((m) => {
      if (m.hp <= 0) {
        goldGain += MONSTER_REWARD;
        return false;
      }
      return true;
    });
  }

  return { lifeLoss, goldGain };
}

function updateWave(lines: LineState[], wave: WaveState, deltaMs: number): WaveState {
  const nextWave = { ...wave, spawnTimerMs: wave.spawnTimerMs + deltaMs };
  if (!nextWave.active || nextWave.enemiesSpawned >= nextWave.enemiesToSpawn) {
    return nextWave;
  }

  while (nextWave.spawnTimerMs >= nextWave.spawnIntervalMs && nextWave.enemiesSpawned < nextWave.enemiesToSpawn) {
    nextWave.spawnTimerMs -= nextWave.spawnIntervalMs;
    const lineId = nextWave.enemiesSpawned % LINE_COUNT;
    const line = getLine(lines, lineId);
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

  if (nextWave.enemiesSpawned >= nextWave.enemiesToSpawn && lines.every((line) => line.monsters.length === 0)) {
    nextWave.active = false;
  }

  return nextWave;
}

let loopStarted = false;
let lastFrame = 0;

function frame(time: number) {
  if (!loopStarted) {
    return;
  }
  if (lastFrame === 0) {
    lastFrame = time;
  }
  const deltaMs = Math.min(100, time - lastFrame);
  lastFrame = time;

  const linesNext = state.lines.map(cloneLine);
  updateWorkers(linesNext, deltaMs, time);
  const monsterResult = updateMonsters(linesNext, deltaMs);
  const waveNext = updateWave(linesNext, state.wave, deltaMs);
  const life = Math.max(0, state.life - monsterResult.lifeLoss);

  if (life <= 0) {
    state = initializeState();
    listeners.forEach((listener) => listener());
  } else {
    setState({ lines: linesNext, wave: waveNext, life, gold: state.gold + monsterResult.goldGain });
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
