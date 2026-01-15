import useUserStore from "@/core/userState";
import { Tabs, usePathname } from "expo-router";
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import React, { useEffect, useState, useRef, createContext, useContext } from "react";
import { Image, StyleSheet, Keyboard, Platform, TouchableOpacity, View, Dimensions } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { BlurView } from "expo-blur";
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming,
  SlideInRight,
  SlideInLeft,
  Easing,
} from 'react-native-reanimated';
import * as Device from 'expo-device';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const supportsNativeTabs = Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 26;

const TAB_ORDER = ['index', 'hub', 'chat', 'rewards', 'profile'];

export const SlideTransitionContext = createContext<{
  direction: 'left' | 'right';
}>({ direction: 'right' });

type Props = {};

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
  }, [focused]);

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

const TabLayout = (props: Props) => {
  const theme = useUserStore(s => s.theme);
  const streakModalVisible = useUserStore(s => s.streakModalVisible);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const previousPathRef = useRef(pathname);
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

  if (supportsNativeTabs) {
    return (
      <SlideTransitionContext.Provider value={{ direction }}>
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Label>Home</Label>
            <Icon sf="house.fill" />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="hub">
            <Label>Hub</Label>
            <Icon sf="square.grid.2x2.fill" />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="chat">
            <Label>Chat</Label>
            <Icon sf="message.fill" />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="rewards">
            <Label>Rewards</Label>
            <Icon sf="gift.fill" />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="profile">
            <Label>Profile</Label>
            <Icon sf="person.fill" />
          </NativeTabs.Trigger>
        </NativeTabs>
      </SlideTransitionContext.Provider>
    );
  }

  return (
    <SlideTransitionContext.Provider value={{ direction }}>
      <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#0d0d0d' : '#F9FBFC' }}>
      <Tabs
        screenOptions={{
        tabBarActiveTintColor: theme === "dark" ? '#fff' : '#00FF80',
        tabBarInactiveTintColor: theme === "dark" ? '#777777' : '#000',
        animation: 'shift',
        sceneStyle: { backgroundColor: theme === 'dark' ? '#0d0d0d' : '#F9FBFC' },
        tabBarStyle: [
          {
            borderTopWidth: 0,
            elevation: 0,
            height: 70 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 15),
            paddingTop: 15,
            backgroundColor: theme === 'dark' ? '#0d0d0d' : "#F9FBFC",
            borderColor: theme === 'dark' ? '#0d0d0d' : "#F9FBFC",
            borderWidth: 1,
          },
          (isKeyboardVisible || streakModalVisible) && {
            display: 'none',
          }
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
        tabBarButton: ({ onPress, ...props }: any) => (
          <TouchableOpacity
            {...props}
            onPress={(e: any) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPress?.(e);
            }}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              source={theme === 'dark' ? require("@/assets/images/icons/dark/home.png") : require("@/assets/images/icons/home.png")}
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
          tabBarIcon: ({ focused }) => {
            const scale = useSharedValue(1);
            
            React.useEffect(() => {
              scale.value = withSpring(focused ? 1.1 : 1, {
                damping: 15,
                stiffness: 300,
              });
            }, [focused]);

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
          },
        }}
      />

      <Tabs.Screen
        name="rewards"
        options={{
          title: "Rewards",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              source={theme === 'dark' ? require("@/assets/images/icons/dark/gift.png") : require("@/assets/images/icons/gift.png")}
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
              source={theme === 'dark' ? require("@/assets/images/icons/dark/user.png") : require("@/assets/images/icons/user.png")}
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
      </Tabs>
      </View>
    </SlideTransitionContext.Provider>
  );
};

export const useSlideTransition = () => useContext(SlideTransitionContext);

export const SlideTransitionWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { direction } = useSlideTransition();
  const theme = useUserStore(s => s.theme);
  
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
      style={{ flex: 1, backgroundColor: theme === 'dark' ? '#0d0d0d' : '#F9FBFC' }}
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
