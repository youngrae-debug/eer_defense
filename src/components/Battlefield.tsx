import { DimensionValue, StyleSheet, Text, View } from 'react-native';

import type { Defender, Enemy, Point } from '@/src/store/gameStore';
import { theme } from '@/src/theme/theme';

interface BattlefieldProps {
  path: Point[];
  defenders: Defender[];
  enemies: Enemy[];
  progressLabel: string;
}

function pointToStyle(point: Point): { left: DimensionValue; top: DimensionValue } {
  return {
    left: `${point.x}%` as DimensionValue,
    top: `${point.y}%` as DimensionValue,
  };
}

export function Battlefield({ path, defenders, enemies, progressLabel }: BattlefieldProps) {
  const pathDots = path.map((point, index) => (
    <View key={`path-${index}`} style={[styles.pathDot, pointToStyle(point)]} />
  ));

  const defenderNodes = defenders.map((defender) => {
    const color = defender.unitType === 'hero' ? theme.colors.secondary : theme.colors.primary;
    return (
      <View key={defender.id} style={[styles.defender, pointToStyle(defender.position), { borderColor: color }]}>
        <Text style={styles.markerLabel}>{defender.unitType === 'hero' ? 'H' : defender.unitType === 'marine' ? 'M' : 'F'}</Text>
      </View>
    );
  });

  const enemyNodes = enemies.map((enemy) => (
    <View key={enemy.id} style={[styles.enemy, pointToStyle(enemy.position)]}>
      <View style={[styles.hpBar, { width: `${Math.max(8, (enemy.hp / enemy.maxHp) * 100)}%` }]} />
    </View>
  ));

  return (
    <View style={styles.mapArea}>
      <Text style={styles.mapLabel}>Path Defense Field</Text>
      <Text style={styles.subLabel}>{progressLabel}</Text>
      <View style={styles.mapCanvas}>
        {pathDots}
        {defenderNodes}
        {enemyNodes}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapArea: {
    flex: 1,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0B1220',
    padding: theme.spacing.sm,
    minHeight: 260,
  },
  mapLabel: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  subLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  mapCanvas: {
    flex: 1,
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  pathDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: '#334155',
    transform: [{ translateX: -4 }, { translateY: -4 }],
  },
  defender: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    transform: [{ translateX: -10 }, { translateY: -10 }],
  },
  markerLabel: {
    color: theme.colors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  enemy: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.danger,
    transform: [{ translateX: -6 }, { translateY: -6 }],
  },
  hpBar: {
    position: 'absolute',
    top: -6,
    left: -2,
    height: 2,
    backgroundColor: '#22C55E',
  },
});
