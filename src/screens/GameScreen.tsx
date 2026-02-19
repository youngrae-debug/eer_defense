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

export function GameScreen() {
  const {
    life,
    gold,
    lanes,
    castlePosition,
    selectedLane,
    workers,
    selectedWorkerId,
    isTowerPlacementMode,
    defenders,
    enemies,
    selectedHero,
    skill,
    wave,
    selectLane,
    selectWorker,
    startTowerPlacementMode,
    cancelTowerPlacementMode,
    placeTowerForSelectedWorker,
    buyWorker,
    upgradeSelectedWorkerTower,
    startNextWave,
    summonUnit,
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

  const laneDefenders = useMemo(
    () => defenders.filter((defender) => defender.laneId === selectedLane || defender.kind === 'hero'),
    [defenders, selectedLane]
  );
  const laneEnemies = useMemo(
    () => enemies.filter((enemy) => enemy.laneId === selectedLane),
    [enemies, selectedLane]
  );
  const laneWorkers = useMemo(
    () => workers.filter((worker) => worker.laneId === selectedLane),
    [workers, selectedLane]
  );

  const progressLabel =
    wave.active || wave.enemiesToSpawn > 0
      ? `Lane ${selectedLane + 1} · Wave ${wave.waveNumber} · Enemies ${laneEnemies.length}`
      : `Lane ${selectedLane + 1} 준비 완료`;

  const renderBottomPanel = () => {
    if (activeTab === 'shop') {
      return (
        <ShopPanel
          onBuyWorker={buyWorker}
          onStartPlacement={startTowerPlacementMode}
          onUpgradeTower={upgradeSelectedWorkerTower}
          onSummonHero={summonHero}
          onSummonMarine={() => {
            summonUnit('marine');
          }}
          onSummonFirebat={() => {
            summonUnit('firebat');
          }}
        />
      );
    }

    if (activeTab === 'workers') {
      return (
        <View style={styles.workersPanel}>
          <Text style={styles.panelTitle}>Workers</Text>
          <View style={styles.workerRow}>
            {workers.map((worker) => (
              <Pressable
                key={worker.id}
                onPress={() => {
                  selectWorker(worker.id);
                }}
                style={[styles.workerChip, selectedWorkerId === worker.id && styles.workerChipActive]}
              >
                <Text style={styles.workerChipLabel}>
                  {worker.id.replace('worker-', 'W')} · L{worker.laneId + 1}{' '}
                  {worker.towerId ? 'T' : '-'}
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
            lane={lanes[selectedLane]}
            castlePosition={castlePosition}
            defenders={laneDefenders}
            enemies={laneEnemies}
            workers={laneWorkers}
            selectedWorkerId={selectedWorkerId}
            isTowerPlacementMode={isTowerPlacementMode}
            progressLabel={progressLabel}
            onPressMap={(point) => {
              if (isTowerPlacementMode) {
                placeTowerForSelectedWorker(point);
              }
            }}
          />
          <View style={styles.minimapWrap}>
            <MiniMap lanes={lanes} castlePosition={castlePosition} selectedLane={selectedLane} />
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
