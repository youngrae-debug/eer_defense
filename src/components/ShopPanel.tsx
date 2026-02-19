import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { PrimaryButton } from '@/src/components/PrimaryButton';
import { theme } from '@/src/theme/theme';

interface ShopPanelProps {
  visible: boolean;
  onClose: () => void;
  onBuyTower: () => void;
  onSummonMarine: () => void;
  onSummonFirebat: () => void;
  onSummonHero: () => void;
  onEvolveHero: () => void;
}

export function ShopPanel({
  visible,
  onClose,
  onBuyTower,
  onSummonMarine,
  onSummonFirebat,
  onSummonHero,
  onEvolveHero,
}: ShopPanelProps) {
  const translateY = useSharedValue(420);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : 420, { duration: 240 });
  }, [translateY, visible]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <>
      {visible ? <Pressable style={styles.backdrop} onPress={onClose} /> : null}
      <Animated.View style={[styles.panel, panelStyle]} pointerEvents={visible ? 'auto' : 'none'}>
        <View style={styles.handle} />
        <Text style={styles.title}>Defense Shop</Text>

        <View style={styles.itemCard}>
          <Text style={styles.itemName}>Bunker Tower</Text>
          <Text style={styles.itemDescription}>선택한 Lane에 기본 구조물 설치 (100 Gold)</Text>
          <PrimaryButton onPress={onBuyTower} style={styles.buyButton}>
            Build Tower
          </PrimaryButton>
        </View>

        <View style={styles.row}>
          <PrimaryButton onPress={onSummonMarine} style={styles.rowButton}>
            Marine 70
          </PrimaryButton>
          <PrimaryButton onPress={onSummonFirebat} style={styles.rowButton}>
            Firebat 90
          </PrimaryButton>
        </View>

        <View style={styles.row}>
          <PrimaryButton onPress={onSummonHero} style={styles.rowButton}>
            Hero 200
          </PrimaryButton>
          <PrimaryButton onPress={onEvolveHero} style={styles.rowButton}>
            Evolve 160
          </PrimaryButton>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '75%',
    backgroundColor: theme.colors.surfaceGlass,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.textSecondary,
    opacity: 0.5,
  },
  title: {
    color: theme.colors.textPrimary,
    ...theme.typography.title,
  },
  itemCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  itemName: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  itemDescription: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  buyButton: {
    alignSelf: 'flex-start',
    minWidth: 132,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  rowButton: {
    flex: 1,
  },
});
