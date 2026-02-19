import { DimensionValue, StyleSheet, Text, View } from 'react-native';

import type { Point } from '@/src/store/gameStore';
import { theme } from '@/src/theme/theme';

interface MiniMapProps {
  lanes: Point[][];
  castlePosition: Point;
  selectedLane: number;
}

function pointToStyle(point: Point): { left: DimensionValue; top: DimensionValue } {
  return {
    left: `${point.x}%` as DimensionValue,
    top: `${point.y}%` as DimensionValue,
  };
}

export function MiniMap({ lanes, castlePosition, selectedLane }: MiniMapProps) {
  const dots = lanes.reduce<any[]>((acc, lane, laneIndex) => {
    lane.forEach((point, pointIndex) => {
      acc.push(
        <View
          key={`mini-${laneIndex}-${pointIndex}`}
          style={[styles.dot, pointToStyle(point), laneIndex === selectedLane && styles.activeDot]}
        />
      );
    });
    return acc;
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MAP</Text>
      <View style={styles.canvas}>
        {dots}
        <View style={[styles.castle, pointToStyle(castlePosition)]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 120,
    height: 120,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    padding: 6,
  },
  title: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  canvas: {
    flex: 1,
    borderRadius: theme.radius.sm,
    backgroundColor: '#020617',
    overflow: 'hidden',
  },
  dot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#475569',
    transform: [{ translateX: -2 }, { translateY: -2 }],
  },
  activeDot: {
    backgroundColor: theme.colors.primary,
  },
  castle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.gold,
    transform: [{ translateX: -4 }, { translateY: -4 }],
  },
});
