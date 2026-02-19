import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/src/theme/theme';

interface HUDProps {
  wave: number;
  gold: number;
  life: number;
  waveActive: boolean;
}

export function HUD({ wave, gold, life, waveActive }: HUDProps) {
  return (
    <View style={styles.container}>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>WAVE</Text>
        <Text style={styles.statValue}>{wave}</Text>
        <Text style={styles.sub}>{waveActive ? 'IN PROGRESS' : 'READY'}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>GOLD</Text>
        <Text style={[styles.statValue, styles.gold]}>{gold}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>LIFE</Text>
        <Text style={[styles.statValue, life <= 5 && styles.danger]}>{life}</Text>
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
  sub: {
    color: theme.colors.secondary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  gold: {
    color: theme.colors.gold,
  },
  danger: {
    color: theme.colors.danger,
  },
});
