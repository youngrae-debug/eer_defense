import { StyleSheet, Text, View } from 'react-native';

import type { Hero } from '@/src/store/gameStore';
import { theme } from '@/src/theme/theme';

interface HeroCardProps {
  hero: Hero;
}

export function HeroCard({ hero }: HeroCardProps) {
  return (
    <View style={[styles.container, { borderColor: theme.colors.rarity[hero.rarity] }]}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{hero.name.slice(0, 1)}</Text>
      </View>
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>
          {hero.name}
        </Text>
        <Text style={styles.meta}>DPS {hero.dps}</Text>
        <Text style={styles.meta}>RANGE {hero.range}</Text>
        <Text style={styles.meta}>LV {hero.level} · {hero.rarity.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 168,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
    ...theme.shadow.soft,
  },
  avatarPlaceholder: {
    height: 84,
    borderRadius: theme.radius.md,
    backgroundColor: '#0B1220',
    borderWidth: 1,
    borderColor: theme.colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  content: {
    gap: theme.spacing.xxs,
  },
  name: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
});
