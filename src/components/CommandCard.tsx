import { StyleSheet, Text, View } from 'react-native';

import { CommandButton } from '@/src/components/CommandButton';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import type { CommandType, PendingCommand, SelectedEntity } from '@/src/store/gameStore';
import { theme } from '@/src/theme/theme';

interface CommandCardProps {
  selectedEntity: SelectedEntity;
  pendingCommand: PendingCommand | null;
  onIssueCommand: (command: CommandType) => void;
  onCancel: () => void;
}

export function CommandCard({ selectedEntity, pendingCommand, onIssueCommand, onCancel }: CommandCardProps) {
  const disabled = selectedEntity === null;

  const renderWorkerGrid = () => (
    <>
      <CommandButton label="Move" onPress={() => onIssueCommand('MOVE')} disabled={disabled} />
      <CommandButton label="Stop" onPress={() => onIssueCommand('STOP')} disabled={disabled} />
      <CommandButton label="Build" onPress={() => onIssueCommand('BUILD_SUNKEN')} disabled={disabled} />
      <View style={styles.empty} />
      <View style={styles.empty} />
      <View style={styles.empty} />
      <View style={styles.empty} />
      <View style={styles.empty} />
      <View style={styles.empty} />
    </>
  );

  const renderHeroGrid = () => (
    <>
      <CommandButton label="Move" onPress={() => onIssueCommand('MOVE')} disabled={disabled} />
      <CommandButton label="Stop" onPress={() => onIssueCommand('STOP')} disabled={disabled} />
      <CommandButton label="Attack" onPress={() => onIssueCommand('ATTACK')} disabled={disabled} />
      <View style={styles.empty} />
      <View style={styles.empty} />
      <View style={styles.empty} />
      <View style={styles.empty} />
      <View style={styles.empty} />
      <View style={styles.empty} />
    </>
  );

  const renderTowerGrid = () => (
    <>
      <CommandButton label="Stop" onPress={() => onIssueCommand('STOP')} disabled={disabled} />
      <View style={styles.empty} />
      <View style={styles.empty} />
      <View style={styles.empty} />
      <View style={styles.empty} />
      <View style={styles.empty} />
      <View style={styles.empty} />
      <View style={styles.empty} />
      <View style={styles.empty} />
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Command Card</Text>
        <PrimaryButton onPress={onCancel} disabled={!pendingCommand} style={styles.cancelButton}>
          Cancel
        </PrimaryButton>
      </View>
      <Text style={styles.subtitle}>
        {pendingCommand ? `Pending: ${pendingCommand.type}` : selectedEntity ? `${selectedEntity.type.toUpperCase()} selected` : 'No selection'}
      </Text>
      <View style={styles.grid}>
        {selectedEntity?.type === 'hero' && renderHeroGrid()}
        {selectedEntity?.type === 'tower' && renderTowerGrid()}
        {(!selectedEntity || selectedEntity.type === 'worker') && renderWorkerGrid()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0F172A',
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  cancelButton: {
    minHeight: 42,
    minWidth: 96,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  grid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  empty: {
    minHeight: 56,
    width: '31%',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#020617',
  },
});
