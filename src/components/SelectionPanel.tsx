import { StyleSheet, Text, View } from 'react-native';

import type { SelectedEntity } from '@/src/store/gameStore';
import { theme } from '@/src/theme/theme';

interface SelectionPanelProps {
  selectedEntity: SelectedEntity;
}

export function SelectionPanel({ selectedEntity }: SelectionPanelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selection</Text>
      <Text style={styles.value}>
        {selectedEntity ? `${selectedEntity.type.toUpperCase()} · ${selectedEntity.id}` : 'None'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: 4,
  },
  title: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  value: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
});
