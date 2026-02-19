import { useMemo, useState } from 'react';
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
    lines,
    selectedLine,
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
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<BottomTab>('battle');
  const line = lines[selectedLine];

  const lanePath = useMemo(() => line.cachedPath.map((p) => orientPoint(tileToPercent(p))), [line.cachedPath]);

  const laneDefenders = useMemo(() => {
    const defs = line.towers.map((tower) => ({
      id: tower.id,
      kind: 'tower' as const,
      position: orientPoint(tileToPercent({ x: tower.x, y: tower.y })),
      level: tower.hp > 320 ? 2 : 1,
    }));

    const heroes = heroUnits
      .filter((hero) => hero.lineId === selectedLine)
      .map((hero) => ({
        id: hero.id,
        kind: 'hero' as const,
        position: orientPoint(tileToPercent({ x: hero.x, y: hero.y })),
        level: hero.level,
      }));

    return defs.concat(heroes);
  }, [heroUnits, line.towers, selectedLine]);

  const laneWorkers = useMemo(
    () => line.workers.map((worker) => ({ ...worker, ...orientPoint(tileToPercent({ x: worker.x, y: worker.y })) })),
    [line.workers]
  );

  const laneEnemies = useMemo(
    () =>
      line.monsters.map((monster) => ({
        id: monster.id,
        hp: monster.hp,
        maxHp: 180,
        position: orientPoint(tileToPercent({ x: monster.x, y: monster.y })),
      })),
    [line.monsters]
  );

  const cooldownRemainingMs = Math.max(0, skill.cooldown - (performance.now() - skill.lastUsed));

  const progressLabel =
    wave.active || wave.enemiesToSpawn > 0
      ? `Line ${selectedLine + 1} · Wave ${wave.waveNumber} · Enemies ${line.monsters.length}`
      : `Line ${selectedLine + 1} 준비 완료`;

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
                  {worker.id.replace('worker-', 'W')} · {worker.assignedTowerId ? 'Tower Ready' : worker.state}
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
            isCoolingDown={cooldownRemainingMs > 0}
            cooldownRemainingMs={cooldownRemainingMs}
            cooldownTotalMs={skill.cooldown}
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
          {lines.map((_, lineId) => (
            <Pressable
              key={`lane-button-${lineId}`}
              onPress={() => {
                selectLane(lineId);
              }}
              style={[styles.laneButton, selectedLine === lineId && styles.laneButtonActive]}
            >
              <Text style={[styles.laneLabel, selectedLine === lineId && styles.laneLabelActive]}>
                Line {lineId + 1}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.fieldWrapper}>
          <Battlefield
            lane={lanePath}
            castlePosition={orientPoint(tileToPercent({ x: 16, y: 30 }))}
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
            <MiniMap
              lanes={lines.map((lineState) => lineState.cachedPath.map(tileToPercent))}
              castlePosition={tileToPercent({ x: 16, y: 30 })}
              selectedLane={selectedLine}
            />
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
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  laneSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  laneButton: {
    flex: 1,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    paddingVertical: 8,
    alignItems: 'center',
  },
  laneButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#172554',
  },
  laneLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  laneLabelActive: {
    color: theme.colors.textPrimary,
  },
  fieldWrapper: {
    flex: 1,
    minHeight: 360,
    gap: theme.spacing.sm,
  },
  minimapWrap: {
    height: 100,
  },
  battlePanel: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0F172A',
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  battleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  startButton: {
    minWidth: 120,
  },
  workersPanel: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0F172A',
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
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: '#475569',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#111827',
  },
  workerChipActive: {
    borderColor: theme.colors.gold,
    backgroundColor: '#1E293B',
  },
  workerChipLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  workerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  workerActionButton: {
    minWidth: 130,
  },
  tabBar: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  tabButton: {
    flex: 1,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0B1220',
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#172554',
  },
  tabLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: theme.colors.textPrimary,
  },
});
