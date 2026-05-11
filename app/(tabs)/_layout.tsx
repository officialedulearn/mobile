import useUserStore from "@/core/userState";
import {
  getThemedColors,
  tabIconGift,
  tabIconHome,
  tabIconUser,
} from "@/utils/design";
import { Tabs, usePathname, useSegments } from "expo-router";

import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Keyboard,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const BouncyTabBarButtonBase = React.forwardRef<any, any>(
  ({ onPress, ...rest }, ref) => {
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
  },
);
BouncyTabBarButtonBase.displayName = "BouncyTabBarButton";
const BouncyTabBarButton = React.memo(BouncyTabBarButtonBase);
BouncyTabBarButton.displayName = "BouncyTabBarButton";

const AnimatedTabIcon = React.memo(function AnimatedTabIcon({
  source,
  color,
  focused,
  style,
}: {
  source: any;
  color: string;
  focused: boolean;
  style?: any;
}) {
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
});

const ChatIconComponent = React.memo(function ChatIconComponent({
  focused,
}: {
  focused: boolean;
}) {
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
});

const TabLayout = () => {
  const theme = useUserStore((s) => s.theme);
  const colors = useMemo(() => getThemedColors(theme), [theme]);
  const streakModalVisible = useUserStore((s) => s.streakModalVisible);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const segments = useSegments();
  const isChatTab = (segments as string[]).includes("chat");
  const isQuizDetailScreen = /^\/quizzes\/[^/]+$/.test(pathname);
  const isFlashcardDetailScreen = /^\/flashcards\/[^/]+$/.test(pathname);
  const isHubDetailScreen = /^\/hub\/[^/]+(?:\/info)?$/.test(pathname);
  const shouldHideTabBar =
    isKeyboardVisible ||
    streakModalVisible ||
    isChatTab ||
    isQuizDetailScreen ||
    isFlashcardDetailScreen ||
    isHubDetailScreen;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false),
    );

    return () => {
      keyboardDidHideListener?.remove();
      keyboardDidShowListener?.remove();
    };
  }, []);

  const tabBarStyle = useMemo(
    () => [
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
      shouldHideTabBar && styles.hiddenTabBar,
    ],
    [colors.tabBarBg, insets.bottom, shouldHideTabBar],
  );

  const renderTabBarButton = useCallback(
    (buttonProps: any) => <BouncyTabBarButton {...buttonProps} />,
    [],
  );

  const screenOptions = useMemo(
    () => ({
      tabBarActiveTintColor: colors.tabBarActive,
      tabBarInactiveTintColor: colors.tabBarInactive,
      animation: "shift" as const,
      freezeOnBlur: true,
      sceneStyle: { backgroundColor: colors.canvas },
      tabBarStyle,
      tabBarLabelStyle: styles.tabBarLabel,
      headerShown: false,
      tabBarShowLabel: true,
      tabBarItemStyle: styles.tabBarItem,
      tabBarButton: renderTabBarButton,
    }),
    [
      colors.canvas,
      colors.tabBarActive,
      colors.tabBarInactive,
      renderTabBarButton,
      tabBarStyle,
    ],
  );

  const homeIconSource = useMemo(() => tabIconHome(theme), [theme]);
  const rewardIconSource = useMemo(() => tabIconGift(theme), [theme]);
  const profileIconSource = useMemo(() => tabIconUser(theme), [theme]);

  const homeOptions = useMemo(
    () => ({
      title: "Home",
      tabBarIcon: ({
        color,
        focused,
      }: {
        color: string;
        focused: boolean;
      }) => (
        <AnimatedTabIcon
          source={homeIconSource}
          color={color}
          focused={focused}
          style={styles.tabIcon}
        />
      ),
    }),
    [homeIconSource],
  );

  const hubOptions = useMemo(
    () => ({
      title: "Hub",
      tabBarIcon: ({
        color,
        focused,
      }: {
        color: string;
        focused: boolean;
      }) => (
        <AnimatedTabIcon
          source={require("@/assets/images/icons/hub.png")}
          color={color}
          focused={focused}
          style={styles.tabIcon}
        />
      ),
    }),
    [],
  );

  const chatOptions = useMemo(
    () => ({
      title: "",
      tabBarIcon: ({ focused }: { focused: boolean }) => (
        <ChatIconComponent focused={focused} />
      ),
    }),
    [],
  );

  const rewardsOptions = useMemo(
    () => ({
      title: "Rewards",
      tabBarIcon: ({
        color,
        focused,
      }: {
        color: string;
        focused: boolean;
      }) => (
        <AnimatedTabIcon
          source={rewardIconSource}
          color={color}
          focused={focused}
          style={styles.tabIcon}
        />
      ),
    }),
    [rewardIconSource],
  );

  const profileOptions = useMemo(
    () => ({
      title: "Profile",
      tabBarIcon: ({
        color,
        focused,
      }: {
        color: string;
        focused: boolean;
      }) => (
        <AnimatedTabIcon
          source={profileIconSource}
          color={color}
          focused={focused}
          style={styles.tabIcon}
        />
      ),
    }),
    [profileIconSource],
  );

  const hiddenTabOptions = useMemo(() => ({ href: null }), []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Tabs screenOptions={screenOptions}>
        <Tabs.Screen name="index" options={homeOptions} />

        <Tabs.Screen name="hub" options={hubOptions} />

        <Tabs.Screen name="chat" options={chatOptions} />

        <Tabs.Screen name="rewards" options={rewardsOptions} />

        <Tabs.Screen name="profile" options={profileOptions} />

        <Tabs.Screen name="quizzes" options={hiddenTabOptions} />
        <Tabs.Screen name="flashcards" options={hiddenTabOptions} />
      </Tabs>
    </View>
  );
};

export default TabLayout;

const styles = StyleSheet.create({
  hiddenTabBar: {
    display: "none",
  },
  tabBarLabel: {
    fontSize: 12,
    marginBottom: 5,
    fontFamily: "Satoshi-Regular",
  },
  tabBarItem: {
    backgroundColor: "transparent",
  },
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
    resizeMode: "contain",
  },
  nativeTabIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  nativeTabChatIcon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
});
