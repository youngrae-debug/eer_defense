import { useState } from 'react';
import { DimensionValue, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { BuildPreview } from '@/src/components/BuildPreview';
import type { Point, SelectedEntity } from '@/src/store/gameStore';
import { theme } from '@/src/theme/theme';

interface BattlefieldProps {
  lane: Point[];
  castlePosition: Point;
  defenders: Array<{ id: string; kind: 'tower' | 'hero'; position: Point; level: number }>;
  enemies: Array<{ id: string; hp: number; maxHp: number; position: Point }>;
  workers: Array<{ id: string; x: number; y: number; state: string }>;
  selectedEntity: SelectedEntity;
  buildPreview: { point: Point; valid: boolean } | null;
  progressLabel: string;
  onHoverMap: (point: Point) => void;
  onPressMap: (point: Point) => void;
}

function pointToStyle(point: Point): { left: DimensionValue; top: DimensionValue } {
  return {
    left: `${point.x}%` as DimensionValue,
    top: `${point.y}%` as DimensionValue,
  };
}

export function Battlefield({
  lane,
  castlePosition,
  defenders,
  enemies,
  workers,
  selectedEntity,
  buildPreview,
  progressLabel,
  onHoverMap,
  onPressMap,
}: BattlefieldProps) {
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });

  const laneDots = lane.map((point, pointIndex) => (
    <View key={`point-${pointIndex}`} style={[styles.pathDot, pointToStyle(point)]} />
  ));

  const defenderNodes = defenders.map((defender) => {
    const color = defender.kind === 'hero' ? theme.colors.secondary : theme.colors.primary;
    const selected = selectedEntity?.id === defender.id;
    return (
      <View key={defender.id} style={[styles.defender, pointToStyle(defender.position), { borderColor: color }]}>
        <Text style={styles.markerLabel}>{defender.kind === 'hero' ? 'H' : defender.level === 2 ? 'T2' : 'T1'}</Text>
        {selected ? <View style={styles.selectionRing} /> : null}
      </View>
    );
  });

  const enemyNodes = enemies.map((enemy) => (
    <View key={enemy.id} style={[styles.enemy, pointToStyle(enemy.position)]}>
      <View style={[styles.hpBar, { width: `${Math.max(8, (enemy.hp / enemy.maxHp) * 100)}%` }]} />
    </View>
  ));

  const workerNodes = workers.map((worker) => {
    const selected = selectedEntity?.id === worker.id;
    return (
      <View key={worker.id} style={[styles.worker, pointToStyle({ x: worker.x, y: worker.y })]}>
        <Text style={styles.workerLabel}>W</Text>
        {selected ? <View style={styles.selectionRing} /> : null}
      </View>
    );
  });

  return (
    <View style={styles.mapArea}>
      <Text style={styles.mapLabel}>Selected Lane Field</Text>
      <Text style={styles.subLabel}>{progressLabel}</Text>
      <Pressable
        style={styles.mapCanvas}
        onLayout={(event: LayoutChangeEvent) => {
          const { width, height } = event.nativeEvent.layout;
          setCanvasSize({ width: Math.max(1, width), height: Math.max(1, height) });
        }}
        onHoverIn={(event) => {
          const { locationX, locationY } = event.nativeEvent;
          const x = Math.max(4, Math.min(96, (locationX / canvasSize.width) * 100));
          const y = Math.max(4, Math.min(96, (locationY / canvasSize.height) * 100));
          onHoverMap({ x, y });
        }}
        onPress={(event) => {
          const { locationX, locationY } = event.nativeEvent;
          const x = Math.max(4, Math.min(96, (locationX / canvasSize.width) * 100));
          const y = Math.max(4, Math.min(96, (locationY / canvasSize.height) * 100));
          onPressMap({ x, y });
        }}
      >
        {laneDots}
        <View style={[styles.castle, pointToStyle(castlePosition)]}>
          <Text style={styles.castleLabel}>CASTLE</Text>
        </View>
        {defenderNodes}
        {workerNodes}
        {enemyNodes}
        {buildPreview ? <BuildPreview point={buildPreview.point} valid={buildPreview.valid} /> : null}
      </Pressable>
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
  selectionRing: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.colors.gold,
    transform: [{ translateX: -3 }, { translateY: -3 }],
  },
  castle: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: theme.colors.gold,
    backgroundColor: '#422006',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -22 }, { translateY: -22 }],
  },
  castleLabel: {
    color: theme.colors.textPrimary,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  defender: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    transform: [{ translateX: -11 }, { translateY: -11 }],
  },
  markerLabel: {
    color: theme.colors.textPrimary,
    fontSize: 8,
    fontWeight: '700',
  },
  worker: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#64748B',
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -9 }, { translateY: -9 }],
  },
  workerLabel: {
    color: theme.colors.textPrimary,
    fontSize: 9,
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
