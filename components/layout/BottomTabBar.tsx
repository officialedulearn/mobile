import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Keyboard,
  Platform,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';
import Animated, {
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import useUserStore from '@/core/userState';
import AnimatedTabIcon from './AnimatedTabIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BottomTabBarProps {
  onTabPress?: (tabName: string) => void;
}

const TAB_ORDER = ['index', 'hub', 'chat', 'rewards', 'profile'];

const BottomTabBar: React.FC<BottomTabBarProps> = ({ onTabPress }) => {
  const theme = useUserStore((s) => s.theme);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const isChatTab = segments.includes('chat');

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidHideListener?.remove();
      keyboardDidShowListener?.remove();
    };
  }, []);

  const shouldHide = isKeyboardVisible || streakModalVisible || isChatTab;

  return (
    <View
      style={[
        styles.container,
        {
          borderTopColor: theme === 'dark' ? '#0d0d0d' : '#F9FBFC',
          backgroundColor: theme === 'dark' ? '#0d0d0d' : '#F9FBFC',
          height: 70 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 15),
          paddingTop: 15,
          display: shouldHide ? 'none' : 'flex',
        },
      ]}
    >
      <View style={styles.tabsRow}>
        {TAB_ORDER.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onTabPress?.(tab);
            }}
            style={styles.tabButton}
          >
            <View />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    elevation: 0,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flex: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BottomTabBar;
