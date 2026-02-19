import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeroCard } from '@/src/components/HeroCard';
import { HUD } from '@/src/components/HUD';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { ShopPanel } from '@/src/components/ShopPanel';
import { SkillButton } from '@/src/components/SkillButton';
import { useGameStore } from '@/src/store/gameStore';
import { theme } from '@/src/theme/theme';

export function GameScreen() {
  const {
    wave,
    gold,
    selectedHero,
    isShopOpen,
    skill,
    incrementWave,
    spendGold,
    toggleShop,
    closeShop,
    triggerSkill,
    tickSkillCooldown,
  } = useGameStore();

  useEffect(() => {
    const interval = setInterval(() => {
      tickSkillCooldown(100);
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [tickSkillCooldown]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <HUD wave={wave} gold={gold} />

        <View style={styles.mapArea}>
          <Text style={styles.mapLabel}>Battlefield</Text>
        </View>

        <View style={styles.bottomPanel}>
          <HeroCard hero={selectedHero} />

          <View style={styles.actions}>
            <View style={styles.mainButtons}>
              <PrimaryButton onPress={incrementWave} style={styles.actionButton}>
                Hero
              </PrimaryButton>
              <PrimaryButton onPress={toggleShop} style={styles.actionButton}>
                Shop
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
          onBuyTurret={() => {
            if (spendGold(120)) {
              closeShop();
            }
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
  mapArea: {
    flex: 1,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0B1220',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
  },
  mapLabel: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
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
