import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressableComponent = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  scale?: number;
  hapticFeedback?: boolean;
  hapticStyle?: 'light' | 'medium' | 'heavy';
  animationType?: 'spring' | 'timing';
  duration?: number;
}

/**
 * AnimatedPressable - A reusable animated pressable component
 * 
 * Features:
 * - Scale animation on press (default 0.95)
 * - Optional haptic feedback
 * - Configurable animation type (spring/timing)
 * - Smooth opacity feedback
 */
export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  scale = 0.95,
  hapticFeedback = true,
  hapticStyle = 'light',
  animationType = 'spring',
  duration = 150,
  onPressIn,
  onPressOut,
  ...pressableProps
}) => {
  const scaleValue = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleValue.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = (event: any) => {
    if (hapticFeedback) {
      const feedbackStyle = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      }[hapticStyle];
      
      Haptics.impactAsync(feedbackStyle);
    }

    if (animationType === 'spring') {
      scaleValue.value = withSpring(scale, {
        damping: 15,
        stiffness: 300,
      });
    } else {
      scaleValue.value = withTiming(scale, { duration });
    }
    
    opacity.value = withTiming(0.7, { duration: 100 });

    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    if (animationType === 'spring') {
      scaleValue.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
    } else {
      scaleValue.value = withTiming(1, { duration });
    }
    
    opacity.value = withTiming(1, { duration: 150 });

    onPressOut?.(event);
  };

  return (
    <AnimatedPressableComponent
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
      {...pressableProps}
    >
      {children}
    </AnimatedPressableComponent>
  );
};

export default AnimatedPressable;

