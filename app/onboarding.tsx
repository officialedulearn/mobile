import useUserStore from "@/core/userState";
import { getScreenTopPadding } from '@/utils/design';
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useRef } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type OnBoardingSteps = {
  title: string;
  subtitle: string;
  illustration: any;
  buttonTexts: string[];
};

const ONBOARDING_STEPS: OnBoardingSteps[] = [
  {
    title: "Welcome to EduLearn",
    subtitle:
      "Your personal tutor always ready to explain, quiz, and guide you on web3.",
    illustration: require("@/assets/images/eddie/Mischievous.png"),
    buttonTexts: ["Get Started"],
  },
  {
    title: "Earn Rewards While You Learn",
    subtitle:
      "Collect XP, climb leaderboards, and unlock unique badges as you grow.",
    illustration: require("@/assets/images/xp.png"),
    buttonTexts: ["Continue"],
  },
  {
    title: "Track Progress, Compete With Friends",
    subtitle:
      "Collect XP, climb leaderboards, and unlock unique badges as you grow.",
    illustration: require("@/assets/images/compete.png"),
    buttonTexts: ["Sign In", "Sign Up"],
  },
];

const OnBoarding = () => {
  const [stepIndex, setStepIndex] = React.useState(0);
  const theme = useUserStore((state) => state.theme);
  const insets = useSafeAreaInsets();
  const topPadding = getScreenTopPadding(insets);
  const { width: windowWidth } = useWindowDimensions();
  const listRef = useRef<FlatList<OnBoardingSteps>>(null);

  const goToStep = useCallback(
    (index: number) => {
      if (index < 0 || index >= ONBOARDING_STEPS.length || index === stepIndex) return;
      listRef.current?.scrollToIndex({ index, animated: true });
    },
    [stepIndex]
  );

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const idx = Math.round(x / windowWidth);
      const clamped = Math.min(ONBOARDING_STEPS.length - 1, Math.max(0, idx));
      setStepIndex(clamped);
    },
    [windowWidth]
  );

  const goToNextStep = () => {
    if (stepIndex < ONBOARDING_STEPS.length - 1) {
      Haptics.selectionAsync();
      goToStep(stepIndex + 1);
    }
  };

  const currentStep = ONBOARDING_STEPS[stepIndex];

  const renderStep = useCallback(
    ({ item }: { item: OnBoardingSteps }) => (
      <View style={[styles.page, { width: windowWidth }]}>
        <View style={styles.content}>
          <Image source={item.illustration} style={styles.illustration} resizeMode="contain" />
          <Text style={[styles.title, theme === "dark" && styles.titleDark]}>{item.title}</Text>
          <Text style={[styles.subtitle, theme === "dark" && styles.subtitleDark]}>{item.subtitle}</Text>
        </View>
      </View>
    ),
    [theme, windowWidth]
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: windowWidth,
      offset: windowWidth * index,
      index,
    }),
    [windowWidth]
  );

  return (
    <SafeAreaView style={[styles.container, theme === "dark" && styles.containerDark, { paddingTop: topPadding }]}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      <View style={styles.topNavigation}>
        <Image
          source={theme === "dark" ? require("@/assets/images/logo.png") : require("@/assets/images/LOGO-1.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        {stepIndex < ONBOARDING_STEPS.length - 1 && (
          <TouchableOpacity 
            style={[styles.skipButton, theme === "dark" && styles.skipButtonDark]} 
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/auth?signUp=1");
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.skipText, theme === "dark" && styles.skipTextDark]}>Skip</Text>
            <Image
              source={theme === "dark" ? require("@/assets/images/icons/dark/CaretRight.png") : require("@/assets/images/icons/CaretRight.png")}
              style={styles.skipIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={ONBOARDING_STEPS}
        keyExtractor={(_, index) => String(index)}
        renderItem={renderStep}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        style={styles.stepsList}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={({ index }) => {
          listRef.current?.scrollToOffset({ offset: index * windowWidth, animated: true });
        }}
      />

      <View style={[styles.stepsDisplay, theme === "dark" && styles.stepsDisplayDark]}>
        {ONBOARDING_STEPS.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              Haptics.selectionAsync();
              goToStep(index);
            }}
          >
            <View
              style={[
                styles.dot, 
                stepIndex === index && styles.activeDot,
                theme === "dark" && styles.dotDark,
                theme === "dark" && stepIndex === index && styles.activeDotDark
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        {stepIndex === ONBOARDING_STEPS.length - 1 ? (
          <View style={styles.authButtonsContainer}>
            <TouchableOpacity
              style={[styles.signInButton, theme === "dark" && styles.signInButtonDark]}
              onPress={() => {
                router.push({
                  pathname: "/auth",
                  params: { signUp: '0' },
                });
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.signInText, theme === "dark" && styles.signInTextDark]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.signUpButton, theme === "dark" && styles.signUpButtonDark]}
              onPress={() => {
                router.push({
                  pathname: "/auth",
                  params: { signUp: '1' },
                });
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.signUpText, theme === "dark" && styles.signUpTextDark]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.getStarted, theme === "dark" && styles.getStartedDark]}
            onPress={goToNextStep}
          >
            <Text style={[styles.getStartedText, theme === "dark" && styles.getStartedTextDark]}>
              {currentStep.buttonTexts[0]}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export default OnBoarding;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FBFC",
    paddingTop: Platform.OS === "ios" ? 0 : 30,
  },
  containerDark: {
    backgroundColor: "#0D0D0D",
  },
  topNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: Platform.OS === "ios" ? 10 : 30,
    height: 60,
  },
  logo: {
    width: 130,
    height: 160,
    resizeMode: "contain",
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 50,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  skipButtonDark: {
    backgroundColor: "#131313",
    borderColor: "#2E3033",
    borderWidth: 1,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
    fontFamily: "Satoshi-Regular",
  },
  skipTextDark: {
    color: "#E0E0E0",
  },
  skipIcon: {
    width: 16,
    height: 16,
  },
  stepsList: {
    flex: 1,
  },
  page: {
    flex: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingTop: Platform.OS === "ios" ? 20 : 0,
  },
  illustration: {
    width: "100%",
    height: Platform.OS === "ios" ? 240 : 260,
    marginBottom: Platform.OS === "ios" ? 30 : 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 42,
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
  },
  titleDark: {
    color: "#E0E0E0",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#61728C",
    fontWeight: "500",
    lineHeight: 24,
    fontFamily: "Satoshi-Regular",
    paddingHorizontal: 10,
    maxWidth: Platform.OS === "ios" ? "90%" : "100%",
    alignSelf: "center",
  },
  subtitleDark: {
    color: "#B3B3B3",
  },
  stepsDisplay: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: Platform.OS === "ios" ? 30 : 20,
    backgroundColor: "rgba(0, 255, 128, 0.10)",
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  stepsDisplayDark: {
    backgroundColor: "rgba(0, 255, 128, 0.15)",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#000",
    opacity: 0.2,
    marginHorizontal: 5,
  },
  dotDark: {
    backgroundColor: "#E0E0E0",
    opacity: 0.3,
  },
  activeDot: {
    opacity: 1,
    backgroundColor: "#00FF80",
  },
  activeDotDark: {
    opacity: 1,
    backgroundColor: "#00FF80",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    paddingTop: 10,
  },
  getStarted: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: "#000",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  getStartedDark: {
    backgroundColor: "#00FF80",
  },
  getStartedText: {
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    fontWeight: "700",
    color: "#00FF80",
  },
  getStartedTextDark: {
    color: "#000",
  },
  authButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  signInButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EDF3FC",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  signInButtonDark: {
    backgroundColor: "#131313",
    borderColor: "#2E3033",
  },
  signUpButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: "#000",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  signUpButtonDark: {
    backgroundColor: "#00FF80",
  },
  signInText: {
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  signInTextDark: {
    color: "#00FF80",
  },
  signUpText: {
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    fontWeight: "700",
    color: "#00FF80",
  },
  signUpTextDark: {
    color: "#000",
  },
});
