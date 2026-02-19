import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/src/theme/theme';

interface HUDProps {
  wave: number;
  gold: number;
}

export function HUD({ wave, gold }: HUDProps) {
  return (
    <View style={styles.container}>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>WAVE</Text>
        <Text style={styles.statValue}>{wave}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>GOLD</Text>
        <Text style={[styles.statValue, styles.gold]}>{gold}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceGlass,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  statLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  statValue: {
    color: theme.colors.textPrimary,
    ...theme.typography.numeric,
    marginTop: theme.spacing.xxs,
  },
  gold: {
    color: theme.colors.gold,
  },
});
