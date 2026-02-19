import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Battlefield } from '@/src/components/Battlefield';
import { HeroCard } from '@/src/components/HeroCard';
import { HUD } from '@/src/components/HUD';
import { MiniMap } from '@/src/components/MiniMap';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { ShopPanel } from '@/src/components/ShopPanel';
import { SkillButton } from '@/src/components/SkillButton';
import { useGameStore } from '@/src/store/gameStore';
import { theme } from '@/src/theme/theme';

type BottomTab = 'battle' | 'shop' | 'workers';

function orientPoint(point: { x: number; y: number }) {
  return {
    x: Math.max(4, Math.min(96, point.x)),
    y: Math.max(4, Math.min(96, point.y + 38)),
  };
}

function tileToPercent(tile: { x: number; y: number }) {
  return {
    x: ((tile.x + 0.5) / 32) * 100,
    y: ((tile.y + 0.5) / 32) * 100,
  };
}

export function GameScreen() {
  const {
    life,
    gold,
    lanes,
    selectedLane,
    workers,
    selectedWorkerId,
    isTowerPlacementMode,
    heroUnits,
    wave,
    selectedHero,
    skill,
    selectLane,
    selectWorker,
    startTowerPlacementMode,
    cancelTowerPlacementMode,
    requestBuildAtTile,
    buyWorker,
    upgradeSelectedWorkerTower,
    startNextWave,
    summonHero,
    evolveHero,
    triggerSkill,
    tick,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<BottomTab>('battle');

  useEffect(() => {
    const interval = setInterval(() => {
      tick(100);
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [tick]);

  const lane = lanes[selectedLane];

  const lanePath = useMemo(
    () => lane.cachedPath.map((p) => orientPoint(tileToPercent(p))),
    [lane.cachedPath]
  );

  const laneDefenders = useMemo(() => {
    const defs = lane.towers.map((tower) => ({
      id: tower.id,
      kind: 'tower' as const,
      unitType: tower.hp > 260 ? ('firebat' as const) : ('marine' as const),
      position: orientPoint(tileToPercent({ x: tower.x, y: tower.y })),
      range: 0,
      damage: 0,
      attackCooldownMs: 0,
      cooldownRemainingMs: 0,
      level: tower.hp > 260 ? 2 : 1,
      laneId: tower.laneId,
    }));

    const heroes = heroUnits
      .filter((hero) => hero.laneId === selectedLane)
      .map((hero) => ({
        id: hero.id,
        kind: 'hero' as const,
        unitType: 'hero' as const,
        position: orientPoint({ x: hero.x, y: hero.y }),
        range: 0,
        damage: 0,
        attackCooldownMs: 0,
        cooldownRemainingMs: 0,
        level: hero.level,
        laneId: hero.laneId,
      }));

    return ([] as any[]).concat(defs, heroes);
  }, [heroUnits, lane.towers, selectedLane]);

  const laneWorkers = useMemo(() => lane.workers, [lane.workers]);

  const laneEnemies = useMemo(
    () => lane.monsters.map((monster) => ({
      id: monster.id,
      laneId: monster.laneId,
      hp: monster.hp,
      maxHp: 180,
      speed: monster.speed,
      rewardGold: 0,
      pathIndex: monster.pathIndex,
      progress: 0,
      alive: true,
      position: orientPoint({ x: monster.x, y: monster.y }),
    })),
    [lane.monsters]
  );

  const progressLabel =
    wave.active || wave.enemiesToSpawn > 0
      ? `Line ${selectedLane + 1} · Wave ${wave.waveNumber} · Enemies ${lane.monsters.length}`
      : `Line ${selectedLane + 1} 준비 완료`;

  const renderBottomPanel = () => {
    if (activeTab === 'shop') {
      return (
        <ShopPanel
          onBuyWorker={buyWorker}
          onStartPlacement={startTowerPlacementMode}
          onUpgradeTower={upgradeSelectedWorkerTower}
          onSummonHero={summonHero}
          onSummonMarine={() => {}}
          onSummonFirebat={() => {}}
        />
      );
    }

    if (activeTab === 'workers') {
      return (
        <View style={styles.workersPanel}>
          <Text style={styles.panelTitle}>Workers (1 Worker = 1 Tower)</Text>
          <View style={styles.workerRow}>
            {laneWorkers.map((worker) => (
              <Pressable
                key={worker.id}
                onPress={() => {
                  selectWorker(worker.id);
                }}
                style={[styles.workerChip, selectedWorkerId === worker.id && styles.workerChipActive]}
              >
                <Text style={styles.workerChipLabel}>
                  {worker.id.replace('worker-', 'W')} · {worker.towerId ? 'Tower Ready' : worker.state}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.workerActions}>
            <PrimaryButton
              onPress={() => {
                if (isTowerPlacementMode) {
                  cancelTowerPlacementMode();
                } else {
                  startTowerPlacementMode();
                }
              }}
              style={styles.workerActionButton}
            >
              {isTowerPlacementMode ? 'Cancel Build Mode' : 'Build Mode'}
            </PrimaryButton>
            <PrimaryButton onPress={upgradeSelectedWorkerTower} style={styles.workerActionButton}>
              Upgrade Tower
            </PrimaryButton>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.battlePanel}>
        <HeroCard hero={selectedHero} />
        <View style={styles.battleActions}>
          <PrimaryButton onPress={startNextWave} style={styles.startButton} disabled={wave.active}>
            Start Wave
          </PrimaryButton>
          <PrimaryButton onPress={evolveHero} style={styles.startButton}>
            Evolve Hero
          </PrimaryButton>
          <SkillButton
            label="Skill"
            isCoolingDown={skill.isCoolingDown}
            cooldownRemainingMs={skill.cooldownRemainingMs}
            cooldownTotalMs={skill.cooldownTotalMs}
            onPress={triggerSkill}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <HUD wave={wave.waveNumber} gold={gold} life={life} waveActive={wave.active} />

        <View style={styles.laneSelector}>
          {lanes.map((_, laneId) => (
            <Pressable
              key={`lane-button-${laneId}`}
              onPress={() => {
                selectLane(laneId);
              }}
              style={[styles.laneButton, selectedLane === laneId && styles.laneButtonActive]}
            >
              <Text style={[styles.laneLabel, selectedLane === laneId && styles.laneLabelActive]}>
                Line {laneId + 1}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.fieldWrapper}>
          <Battlefield
            lane={lanePath}
            castlePosition={orientPoint({ x: 50, y: 50 })}
            defenders={laneDefenders}
            enemies={laneEnemies}
            workers={laneWorkers}
            selectedWorkerId={selectedWorkerId}
            isTowerPlacementMode={isTowerPlacementMode}
            progressLabel={progressLabel}
            onPressMap={(point) => {
              if (isTowerPlacementMode) {
                const tileX = Math.max(0, Math.min(31, Math.floor((point.x / 100) * 32)));
                const tileY = Math.max(0, Math.min(31, Math.floor(((point.y - 38) / 100) * 32)));
                requestBuildAtTile(tileX, tileY);
              }
            }}
          />
          <View style={styles.minimapWrap}>
            <MiniMap lanes={lanes.map((laneState) => laneState.cachedPath.map(tileToPercent))} castlePosition={{ x: 50, y: 88 }} selectedLane={selectedLane} />
          </View>
        </View>

        {renderBottomPanel()}

        <View style={styles.tabBar}>
          {(['battle', 'shop', 'workers'] as BottomTab[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {
                setActiveTab(tab);
              }}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            >
              <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{tab.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 1280 : undefined,
    alignSelf: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  laneSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  laneButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
  },
  laneButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#0F2530',
  },
  laneLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  laneLabelActive: {
    color: theme.colors.primary,
  },
  fieldWrapper: {
    flex: 1,
    position: 'relative',
  },
  minimapWrap: {
    position: 'absolute',
    left: 8,
    bottom: 8,
  },
  battlePanel: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.md,
  },
  battleActions: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  startButton: {
    flex: 1,
  },
  workersPanel: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  panelTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  workerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  workerChip: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: theme.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  workerChipActive: {
    borderColor: theme.colors.gold,
    backgroundColor: '#2A1A08',
  },
  workerChipLabel: {
    color: theme.colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  workerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  workerActionButton: {
    flex: 1,
    minHeight: 42,
  },
  tabBar: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: '#0B1220',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    minHeight: 38,
  },
  tabButtonActive: {
    backgroundColor: '#0F2530',
  },
  tabLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  tabLabelActive: {
    color: theme.colors.primary,
  },
});
