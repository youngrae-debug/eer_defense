import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

import { theme } from '@/src/theme/theme';

interface SkillButtonProps {
  label: string;
  isCoolingDown: boolean;
  cooldownRemainingMs: number;
  cooldownTotalMs: number;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.createAnimatedComponent(View);
const size = 64;

export function SkillButton({
  label,
  isCoolingDown,
  cooldownRemainingMs,
  cooldownTotalMs,
  onPress,
}: SkillButtonProps) {
  const scale = useSharedValue(1);
  const progress = useSharedValue(0);

  const ratio = cooldownTotalMs > 0 ? cooldownRemainingMs / cooldownTotalMs : 0;

  useEffect(() => {
    progress.value = withTiming(ratio, { duration: 120 });
  }, [progress, ratio]);

  const pressAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(progress.value, [0, 1], [theme.colors.primary, theme.colors.textSecondary]),
    opacity: 0.5 + progress.value * 0.5,
  }));

  return (
    <View style={styles.root}>
      <AnimatedView style={[styles.ring, ringStyle]} />
      <AnimatedPressable
        onPress={onPress}
        disabled={isCoolingDown}
        style={[styles.button, pressAnimatedStyle, isCoolingDown && styles.disabled]}
        onPressIn={() => {
          scale.value = withTiming(0.95, { duration: 120 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 120 });
        }}
      >
        <Text style={styles.label}>{label}</Text>
      </AnimatedPressable>
      {isCoolingDown ? <Text style={styles.timer}>{Math.ceil(cooldownRemainingMs / 1000)}s</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: size,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: theme.radius.pill,
    borderWidth: 6,
  },
  button: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: theme.colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  timer: {
    position: 'absolute',
    bottom: -18,
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.8,
  },
});
