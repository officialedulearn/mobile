import useUserStore from "@/core/userState";
import { getThemedColors, tabIconGift, tabIconHome, tabIconUser } from "@/utils/design";
import { Tabs, usePathname, useSegments } from "expo-router";

import * as Haptics from 'expo-haptics';
import { Image } from "expo-image";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Dimensions, Keyboard, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TAB_ORDER = ['index', 'hub', 'chat', 'rewards', 'profile'];

export const SlideTransitionContext = createContext<{
  direction: 'left' | 'right';
}>({ direction: 'right' });

type Props = Record<string, never>;

const BouncyTabBarButton = React.forwardRef<any, any>(({ onPress, ...rest }, ref) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const runBounce = () => {
    scale.value = withSequence(
      withTiming(0.88, { duration: 100, easing: Easing.out(Easing.quad) }),
      withTiming(1.06, { duration: 150, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 250, easing: Easing.out(Easing.back(1.2)) }),
    );
  };

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <TouchableOpacity
        ref={ref}
        {...rest}
        activeOpacity={1}
        onPressIn={(e) => {
          runBounce();
          rest.onPressIn?.(e);
        }}
        onPress={(e) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.(e);
        }}
      />
    </Animated.View>
  );
});
BouncyTabBarButton.displayName = 'BouncyTabBarButton';

const AnimatedTabIcon: React.FC<{
  source: any;
  color: string;
  focused: boolean;
  style?: any;
}> = ({ source, color, focused, style }) => {
  const scale = useSharedValue(focused ? 1 : 0.95);
  const opacity = useSharedValue(focused ? 1 : 0.8);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.95, {
      damping: 15,
      stiffness: 300,
    });
    opacity.value = withTiming(focused ? 1 : 0.8, { duration: 200 });
  }, [focused, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Image source={source} style={[style, { tintColor: color }]} />
    </Animated.View>
  );
};

const ChatIconComponent: React.FC<{ focused: boolean }> = ({ focused }) => {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, {
      damping: 15,
      stiffness: 300,
    });
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Image
        source={require("@/assets/images/icons/Button.png")}
        style={styles.chatIcon}
      />
    </Animated.View>
  );
};

const TabLayout = (props: Props) => {
  const theme = useUserStore(s => s.theme);
  const colors = getThemedColors(theme);
  const streakModalVisible = useUserStore(s => s.streakModalVisible);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const segments = useSegments();
  const previousPathRef = useRef(pathname);
  const isChatTab = (segments as string[]).includes("chat");
  const isQuizDetailScreen = /^\/quizzes\/[^/]+$/.test(pathname);
  const isFlashcardDetailScreen = /^\/flashcards\/[^/]+$/.test(pathname);
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  useEffect(() => {
    const currentTab = pathname.split('/')[1] || 'index';
    const previousTab = previousPathRef.current.split('/')[1] || 'index';
    
    const currentIndex = TAB_ORDER.indexOf(currentTab);
    const previousIndex = TAB_ORDER.indexOf(previousTab);
    
    if (currentIndex !== previousIndex && currentIndex !== -1 && previousIndex !== -1) {
      setDirection(currentIndex > previousIndex ? 'right' : 'left');
    }
    
    previousPathRef.current = pathname;
  }, [pathname]);

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
  return (
    <SlideTransitionContext.Provider value={{ direction }}>
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Tabs
        screenOptions={{
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        animation: 'shift',
        sceneStyle: { backgroundColor: colors.canvas },
        tabBarStyle: [
          {
            borderTopWidth: 0,
            elevation: 0,
            height: 70 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 15),
            paddingTop: 15,
            backgroundColor: colors.tabBarBg,
            borderColor: colors.tabBarBg,
            borderWidth: 1,
          },
          (isKeyboardVisible || streakModalVisible || isChatTab || isQuizDetailScreen || isFlashcardDetailScreen) && {
            display: "none",
          },
        ],
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
          fontFamily: "Satoshi-Regular",
        },
        headerShown: false,
        tabBarShowLabel: true,
        tabBarItemStyle: {
          backgroundColor: "transparent",
        },
        tabBarButton: (props: any) => <BouncyTabBarButton {...props} />,
      }}
    >
      <Tabs.Screen
        name="index"
        
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              source={tabIconHome(theme)}
              color={color}
              focused={focused}
              style={styles.tabIcon}
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="hub"
        options={{
          title: "Hub",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              source={require("@/assets/images/icons/hub.png")}
              color={color}
              focused={focused}
              style={styles.tabIcon}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: "", 
          tabBarIcon: ({ focused }) => <ChatIconComponent focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="rewards"
        options={{
          title: "Rewards",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              source={tabIconGift(theme)}
              color={color}
              focused={focused}
              style={styles.tabIcon}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              source={tabIconUser(theme)}
              color={color}
              focused={focused}
              style={styles.tabIcon}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="quizzes"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="flashcards"
        options={{
          href: null,
        }}
      />
      </Tabs>
      </View>
    </SlideTransitionContext.Provider>
  );
};

export const useSlideTransition = () => useContext(SlideTransitionContext);

export const SlideTransitionWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { direction } = useSlideTransition();
  const theme = useUserStore(s => s.theme);
  const colors = getThemedColors(theme);
  
  const slideInRight = () => {
    'worklet';
    const animations = {
      originX: withSpring(0, {
        damping: 14,
        stiffness: 180,
        mass: 0.6,
      }),
    };
    const initialValues = {
      originX: SCREEN_WIDTH,
    };
    return {
      initialValues,
      animations,
    };
  };

  const slideInLeft = () => {
    'worklet';
    const animations = {
      originX: withSpring(0, {
        damping: 14,
        stiffness: 180,
        mass: 0.6,
      }),
    };
    const initialValues = {
      originX: -SCREEN_WIDTH,
    };
    return {
      initialValues,
      animations,
    };
  };
  
  return (
    <Animated.View 
      style={{ flex: 1, backgroundColor: colors.canvas }}
      entering={direction === 'right' ? slideInRight : slideInLeft}
    >
      {children}
    </Animated.View>
  );
};

export default TabLayout;

const styles = StyleSheet.create({
  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
    elevation: 998,
  },
  tabIcon: {
    width: 20,
    height: 20,
  },
  chatIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  nativeTabIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  nativeTabChatIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  }
});
