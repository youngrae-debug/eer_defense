import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Battlefield } from '@/src/components/Battlefield';
import { HeroCard } from '@/src/components/HeroCard';
import { HUD } from '@/src/components/HUD';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { ShopPanel } from '@/src/components/ShopPanel';
import { SkillButton } from '@/src/components/SkillButton';
import { useGameStore } from '@/src/store/gameStore';
import { theme } from '@/src/theme/theme';

export function GameScreen() {
  const {
    life,
    gold,
    path,
    defenders,
    enemies,
    selectedHero,
    isShopOpen,
    skill,
    wave,
    progress,
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
      : '웨이브 시작을 눌러 전투를 시작하세요';

  const startWaveDisabled =
    wave.active || (progress.step !== 'start_wave' && progress.step !== 'free_play');

  const disableBuyTower = !(progress.step === 'build_tower' || progress.step === 'free_play');
  const disableSummonMarine = !(
    progress.step === 'summon_marine' ||
    progress.step === 'start_wave' ||
    progress.step === 'clear_wave' ||
    progress.step === 'summon_hero' ||
    progress.step === 'evolve_hero' ||
    progress.step === 'free_play'
  );
  const disableSummonFirebat = !(progress.step === 'start_wave' || progress.step === 'clear_wave' || progress.step === 'free_play');
  const disableSummonHero = !(progress.step === 'summon_hero' || progress.step === 'free_play');
  const disableEvolveHero = !(progress.step === 'evolve_hero' || progress.step === 'free_play');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <HUD wave={wave.waveNumber} gold={gold} life={life} waveActive={wave.active} />

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Mission Flow</Text>
          <Text style={styles.progressText}>{progress.message}</Text>
        </View>

        <Battlefield path={path} defenders={defenders} enemies={enemies} progressLabel={progressLabel} />

        <View style={styles.bottomPanel}>
          <HeroCard hero={selectedHero} />

          <View style={styles.actions}>
            <View style={styles.mainButtons}>
              <PrimaryButton onPress={startNextWave} style={styles.actionButton} disabled={startWaveDisabled}>
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
          disableBuyTower={disableBuyTower}
          disableSummonMarine={disableSummonMarine}
          disableSummonFirebat={disableSummonFirebat}
          disableSummonHero={disableSummonHero}
          disableEvolveHero={disableEvolveHero}
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
  progressCard: {
    backgroundColor: theme.colors.surfaceGlass,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  progressTitle: {
    color: theme.colors.secondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  progressText: {
    color: theme.colors.textPrimary,
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
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
