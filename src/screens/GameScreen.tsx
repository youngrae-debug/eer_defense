import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Battlefield } from '@/src/components/Battlefield';
import { CommandCard } from '@/src/components/CommandCard';
import { HeroCard } from '@/src/components/HeroCard';
import { HUD } from '@/src/components/HUD';
import { MiniMap } from '@/src/components/MiniMap';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { SelectionPanel } from '@/src/components/SelectionPanel';
import { SkillButton } from '@/src/components/SkillButton';
import { useGameStore } from '@/src/store/gameStore';
import { theme } from '@/src/theme/theme';

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
    selectedEntity,
    pendingCommand,
    previewTile,
    heroUnits,
    wave,
    selectedHero,
    skill,
    selectLane,
    issueCommand,
    cancelCommand,
    mapHoverTile,
    mapClickTile,
    startNextWave,
    buyWorker,
    summonHero,
    evolveHero,
    triggerSkill,
  } = useGameStore();

  const line = lines[selectedLine];

  const lanePath = useMemo(() => line.cachedPath.map((p) => orientPoint(tileToPercent(p))), [line.cachedPath]);

  const defenders = useMemo(() => {
    const towers = line.towers.map((tower) => ({
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

    return towers.concat(heroes);
  }, [heroUnits, line.towers, selectedLine]);

  const workers = useMemo(
    () => line.workers.map((worker) => ({ id: worker.id, state: worker.state, ...orientPoint(tileToPercent({ x: worker.x, y: worker.y })) })),
    [line.workers]
  );

  const enemies = useMemo(
    () => line.monsters.map((monster) => ({ id: monster.id, hp: monster.hp, maxHp: 180, position: orientPoint(tileToPercent({ x: monster.x, y: monster.y })) })),
    [line.monsters]
  );

  const buildPreview = useMemo(() => {
    if (!previewTile || pendingCommand?.type !== 'BUILD_SUNKEN') {
      return null;
    }
    const tile = line.grid[previewTile.y]?.[previewTile.x];
    return {
      point: orientPoint(tileToPercent(previewTile)),
      valid: Boolean(tile?.walkable && !tile?.towerId),
    };
  }, [line.grid, pendingCommand?.type, previewTile]);

  const cooldownRemainingMs = Math.max(0, skill.cooldown - (performance.now() - skill.lastUsed));

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
              <Text style={styles.laneButtonLabel}>L{lineId + 1}</Text>
            </Pressable>
          ))}
        </View>

        <SelectionPanel selectedEntity={selectedEntity} />

        <View style={styles.fieldRow}>
          <View style={styles.fieldColumn}>
            <Battlefield
              lane={lanePath}
              castlePosition={orientPoint(tileToPercent({ x: 16, y: 30 }))}
              defenders={defenders}
              enemies={enemies}
              workers={workers}
              selectedEntity={selectedEntity}
              buildPreview={buildPreview}
              progressLabel={`Line ${selectedLine + 1} · Wave ${wave.waveNumber}`}
              onHoverMap={(point) => {
                const tileX = Math.max(0, Math.min(31, Math.floor((point.x / 100) * 32)));
                const tileY = Math.max(0, Math.min(31, Math.floor(((point.y - 38) / 100) * 32)));
                mapHoverTile(tileX, tileY);
              }}
              onPressMap={(point) => {
                const tileX = Math.max(0, Math.min(31, Math.floor((point.x / 100) * 32)));
                const tileY = Math.max(0, Math.min(31, Math.floor(((point.y - 38) / 100) * 32)));
                mapClickTile(tileX, tileY);
              }}
            />
          </View>
          <View style={styles.sideColumn}>
            <MiniMap
              lanes={lines.map((lineState) => lineState.cachedPath.map(tileToPercent))}
              castlePosition={tileToPercent({ x: 16, y: 30 })}
              selectedLane={selectedLine}
            />
            <HeroCard hero={selectedHero} />
          </View>
        </View>

        <View style={styles.actionsRow}>
          <PrimaryButton onPress={buyWorker} style={styles.actionButton}>
            Train Worker
          </PrimaryButton>
          <PrimaryButton onPress={summonHero} style={styles.actionButton}>
            Summon Hero
          </PrimaryButton>
          <PrimaryButton onPress={evolveHero} style={styles.actionButton}>
            Evolve Hero
          </PrimaryButton>
          <PrimaryButton onPress={startNextWave} style={styles.actionButton} disabled={wave.active}>
            Start Wave
          </PrimaryButton>
          <SkillButton
            label="Skill"
            isCoolingDown={cooldownRemainingMs > 0}
            cooldownRemainingMs={cooldownRemainingMs}
            cooldownTotalMs={skill.cooldown}
            onPress={triggerSkill}
          />
        </View>

        <CommandCard
          selectedEntity={selectedEntity}
          pendingCommand={pendingCommand}
          onIssueCommand={issueCommand}
          onCancel={cancelCommand}
        />
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
    gap: theme.spacing.xs,
  },
  laneButton: {
    flex: 1,
    minHeight: 28,
    borderRadius: theme.radius.pill,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  laneButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  laneButtonLabel: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  fieldRow: {
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  fieldColumn: {
    flex: 1,
  },
  sideColumn: {
    width: 170,
    gap: theme.spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  actionButton: {
    minWidth: 120,
  },
});
