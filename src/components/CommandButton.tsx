import { StyleSheet } from 'react-native';

import { PrimaryButton } from '@/src/components/PrimaryButton';

interface CommandButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export function CommandButton({ label, onPress, disabled = false }: CommandButtonProps) {
  return (
    <PrimaryButton onPress={onPress} disabled={disabled} style={styles.button}>
      {label}
    </PrimaryButton>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    width: '31%',
  },
});
