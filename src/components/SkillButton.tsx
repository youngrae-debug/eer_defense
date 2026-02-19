import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { theme } from '@/src/theme/theme';

interface SkillButtonProps {
  label: string;
  isCoolingDown: boolean;
  cooldownRemainingMs: number;
  cooldownTotalMs: number;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const size = 64;
const strokeWidth = 6;
const radius = (size - strokeWidth) / 2;
const circumference = 2 * Math.PI * radius;

export function SkillButton({
  label,
  isCoolingDown,
  cooldownRemainingMs,
  cooldownTotalMs,
  onPress,
}: SkillButtonProps) {
  const scale = useSharedValue(1);

  const ratio = cooldownTotalMs > 0 ? cooldownRemainingMs / cooldownTotalMs : 0;
  const ringOffset = circumference * ratio;

  const pressAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.root}>
      <Svg width={size} height={size} style={styles.ring}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.textSecondary}
          strokeOpacity={0.3}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.primary}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={ringOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
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
