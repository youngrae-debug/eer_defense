import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/src/components/PrimaryButton';
import { theme } from '@/src/theme/theme';

interface ShopPanelProps {
  onBuyWorker: () => void;
  onStartPlacement: () => void;
  onUpgradeTower: () => void;
  onSummonHero: () => void;
  onSummonMarine: () => void;
  onSummonFirebat: () => void;
}

export function ShopPanel({
  onBuyWorker,
  onStartPlacement,
  onUpgradeTower,
  onSummonHero,
  onSummonMarine,
  onSummonFirebat,
}: ShopPanelProps) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Shop</Text>
      <View style={styles.row}>
        <PrimaryButton onPress={onBuyWorker} style={styles.button}>Worker 80</PrimaryButton>
        <PrimaryButton onPress={onStartPlacement} style={styles.button}>Build Tower 100</PrimaryButton>
      </View>
      <View style={styles.row}>
        <PrimaryButton onPress={onUpgradeTower} style={styles.button}>Upgrade Tower 140</PrimaryButton>
        <PrimaryButton onPress={onSummonHero} style={styles.button}>Hero 200</PrimaryButton>
      </View>
      <View style={styles.row}>
        <PrimaryButton onPress={onSummonMarine} style={styles.button}>Marine 70</PrimaryButton>
        <PrimaryButton onPress={onSummonFirebat} style={styles.button}>Firebat 90</PrimaryButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  button: {
    flex: 1,
    minHeight: 42,
  },
});
