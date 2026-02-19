import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Battlefield } from '@/src/components/Battlefield';
import { HeroCard } from '@/src/components/HeroCard';
import { HUD } from '@/src/components/HUD';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { ShopPanel } from '@/src/components/ShopPanel';
import { SkillButton } from '@/src/components/SkillButton';
import { useGameStore } from '@/src/store/gameStore';
import { theme } from '@/src/theme/theme';
import { Text } from 'react-native';

export function GameScreen() {
  const {
    life,
    gold,
    lanes,
    castlePosition,
    selectedLane,
    defenders,
    enemies,
    selectedHero,
    isShopOpen,
    skill,
    wave,
    selectLane,
    startNextWave,
    toggleShop,
    closeShop,
    buyTower,
    summonUnit,
    summonHero,
    evolveHero,
    triggerSkill,
    tick,
  } = useGameStore();

  useEffect(() => {
    const interval = setInterval(() => {
      tick(100);
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [tick]);

  const progressLabel =
    wave.active || wave.enemiesToSpawn > 0
      ? `Wave ${wave.waveNumber} · Spawn ${wave.enemiesSpawned}/${wave.enemiesToSpawn} · Enemies ${enemies.length}`
      : 'Start Wave를 눌러 6개 길 방어를 시작하세요';

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
                Lane {laneId + 1}
              </Text>
            </Pressable>
          ))}
        </View>

        <Battlefield
          lanes={lanes}
          castlePosition={castlePosition}
          defenders={defenders}
          enemies={enemies}
          progressLabel={progressLabel}
        />

        <View style={styles.bottomPanel}>
          <HeroCard hero={selectedHero} />

          <View style={styles.actions}>
            <View style={styles.mainButtons}>
              <PrimaryButton onPress={startNextWave} style={styles.actionButton} disabled={wave.active}>
                Start Wave
              </PrimaryButton>
              <PrimaryButton onPress={toggleShop} style={styles.actionButton}>
                Shop / Summon
              </PrimaryButton>
            </View>

            <SkillButton
              label="Skill"
              isCoolingDown={skill.isCoolingDown}
              cooldownRemainingMs={skill.cooldownRemainingMs}
              cooldownTotalMs={skill.cooldownTotalMs}
              onPress={triggerSkill}
            />
          </View>
        </View>

        <ShopPanel
          visible={isShopOpen}
          onClose={closeShop}
          onBuyTower={() => {
            buyTower();
          }}
          onSummonMarine={() => {
            summonUnit('marine');
          }}
          onSummonFirebat={() => {
            summonUnit('firebat');
          }}
          onSummonHero={() => {
            summonHero();
          }}
          onEvolveHero={() => {
            evolveHero();
          }}
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
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.md,
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
  bottomPanel: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  actions: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  mainButtons: {
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
