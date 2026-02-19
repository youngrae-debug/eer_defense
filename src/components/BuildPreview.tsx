import { DimensionValue, StyleSheet, View } from 'react-native';

import type { Point } from '@/src/store/gameStore';

interface BuildPreviewProps {
  point: Point;
  valid: boolean;
}

function pointToStyle(point: Point): { left: DimensionValue; top: DimensionValue } {
  return {
    left: `${point.x}%` as DimensionValue,
    top: `${point.y}%` as DimensionValue,
  };
}

export function BuildPreview({ point, valid }: BuildPreviewProps) {
  return <View style={[styles.preview, pointToStyle(point), valid ? styles.valid : styles.invalid]} />;
}

const styles = StyleSheet.create({
  preview: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    transform: [{ translateX: -9 }, { translateY: -9 }],
    borderWidth: 2,
  },
  valid: {
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34,197,94,0.25)',
  },
  invalid: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239,68,68,0.25)',
  },
});
