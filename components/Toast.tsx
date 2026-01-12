import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useUserStore from '@/core/userState';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

type ToastProps = {
  visible: boolean;
  type: ToastType;
  message: string;
  duration?: number;
  onDismiss?: () => void;
};

const Toast = ({ visible, type, message, duration = 3000, onDismiss }: ToastProps) => {
  const insets = useSafeAreaInsets();
  const { theme } = useUserStore();
  const scale = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      triggerHaptic(type);
      scale.value = withSpring(1, { damping: 18, stiffness: 200, mass: 0.8 });
      contentOpacity.value = withDelay(150, withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) }));

      if (duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      scale.value = withTiming(0, { duration: 250, easing: Easing.in(Easing.ease) });
      contentOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const triggerHaptic = (toastType: ToastType) => {
    switch (toastType) {
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'info':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
    }
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    contentOpacity.value = withTiming(0, { duration: 100 });
    scale.value = withTiming(0, { duration: 250, easing: Easing.in(Easing.ease) }, () => {
      if (onDismiss) {
        runOnJS(onDismiss)();
      }
    });
  };

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: scale.value },
      { scaleY: interpolate(scale.value, [0, 0.5, 1], [0.6, 0.9, 1]) },
    ],
    opacity: interpolate(scale.value, [0, 0.3, 1], [0, 1, 1]),
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          accentColor: '#00FF80',
          icon: 'checkmark-circle' as const,
        };
      case 'error':
        return {
          accentColor: '#FF3B30',
          icon: 'close-circle' as const,
        };
      case 'warning':
        return {
          accentColor: '#F59E0B',
          icon: 'warning' as const,
        };
      case 'info':
        return {
          accentColor: '#3B82F6',
          icon: 'information-circle' as const,
        };
    }
  };

  const config = getToastConfig();
  const backgroundColor = theme === 'light' ? '#0A0A0A' : '#FFFFFF';
  const textColor = theme === 'light' ? '#FFFFFF' : '#000000';
  const closeIconColor = theme === 'light' ? '#888' : '#61728C';

  if (!visible) return null;

  return (
    <View style={[styles.container, { top: insets.top + 10 }]}>
      <Animated.View style={[styles.pillWrapper, pillAnimatedStyle]}>
        <Pressable onPress={handleDismiss}>
          <View style={[styles.toast, { 
            shadowColor: config.accentColor, 
            borderColor: config.accentColor,
            backgroundColor 
          }]}>
            <Animated.View style={[styles.content, contentAnimatedStyle]}>
              <Ionicons name={config.icon} size={22} color={config.accentColor} />
              <Text style={[styles.message, { color: textColor }]}>{message}</Text>
              <Pressable onPress={handleDismiss} hitSlop={8}>
                <Ionicons name="close" size={18} color={closeIconColor} />
              </Pressable>
            </Animated.View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

export default Toast;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  pillWrapper: {
    borderRadius: 50,
    overflow: 'hidden',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    minWidth: 280,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Satoshi-Regular',
  },
});

