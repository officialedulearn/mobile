import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef } from "react";
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Dimensions,
  Animated,
  PanResponder,
} from "react-native";

type OnBoardingSteps = {
  title: string;
  subtitle: string;
  illustration: any;
  buttonTexts: string[];
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH / 3;

const OnBoarding = () => {
  const [stepIndex, setStepIndex] = React.useState(0);
  const pan = useRef(new Animated.ValueXY()).current;
  
  const onBoardingSteps: OnBoardingSteps[] = [
    {
      title: "Welcome to EduLearn",
      subtitle:
        "Your personal tutor always ready to explain, quiz, and guide you.",
      illustration: require("@/assets/images/bot.png"),
      buttonTexts: ["Get Started"],
    },
    {
      title: "Earn Rewards While You Learn",
      subtitle:
        "Collect XP, climb leaderboards, and unlock unique NFTs as you grow.",
      illustration: require("@/assets/images/xp.png"),
      buttonTexts: ["Continue"],
    },
    {
      title: "Track Progress, Compete With Friends",
      subtitle:
        "Collect XP, climb leaderboards, and unlock unique NFTs as you grow.",
      illustration: require("@/assets/images/compete.png"),
      buttonTexts: ["Sign In", "Sign Up"],
    },
  ];

  const resetPosition = () => {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const goToNextStep = () => {
    if (stepIndex < onBoardingSteps.length - 1) {
      setStepIndex((prev) => prev + 1);
      resetPosition();
    }
  };

  const goToPrevStep = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
      resetPosition();
    }
  };

  const handleSkip = () => {
    goToNextStep();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swiped left
          goToNextStep();
        } else if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swiped right
          goToPrevStep();
        } else {
          // Reset position
          resetPosition();
        }
      },
    })
  ).current;

  const currentStep = onBoardingSteps[stepIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.topNavigation}>
        <Image
          source={require("@/assets/images/LOGO-1.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        {stepIndex < onBoardingSteps.length - 1 && (
          <TouchableOpacity 
            style={styles.skipButton} 
            onPress={handleSkip}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.skipText}>Skip</Text>
            <Image
              source={require("@/assets/images/icons/CaretRight.png")}
              style={styles.skipIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>

      <Animated.View 
        style={[
          styles.contentContainer, 
          { transform: [{ translateX: pan.x }] }
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.content}>
          <Image
            source={currentStep.illustration}
            style={styles.illustration}
            resizeMode="contain"
          />
          <Text style={styles.title}>{currentStep.title}</Text>
          <Text style={styles.subtitle}>{currentStep.subtitle}</Text>
        </View>

        <View style={styles.stepsDisplay}>
          {onBoardingSteps.map((_, index) => (
            <TouchableOpacity 
              key={index} 
              onPress={() => {
                setStepIndex(index);
                resetPosition();
              }}
            >
              <View
                style={[styles.dot, stepIndex === index && styles.activeDot]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <View style={styles.footer}>
        {stepIndex === onBoardingSteps.length - 1 ? (
          <View style={styles.authButtonsContainer}>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => {
                router.push({
                  pathname: "/auth",
                  params: { signUp: '0' },
                });
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={() => {
                router.push({
                  pathname: "/auth",
                  params: { signUp: '1' },
                });
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.getStarted}
            onPress={goToNextStep}
          >
            <Text style={styles.getStartedText}>
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
  topNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: Platform.OS === "ios" ? 10 : 30,
    height: 60,
  },
  logo: {
    width: 120,
    height: 40,
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
  skipText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
    fontFamily: "Satoshi",
  },
  skipIcon: {
    width: 16,
    height: 16,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
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
    fontFamily: "Satoshi",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#61728C",
    fontWeight: "500",
    lineHeight: 24,
    fontFamily: "Satoshi",
    paddingHorizontal: 10,
    maxWidth: Platform.OS === "ios" ? "90%" : "100%",
    alignSelf: "center",
  },
  stepsDisplay: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Platform.OS === "ios" ? 30 : 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#000",
    opacity: 0.2,
    marginHorizontal: 5,
  },
  activeDot: {
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
  getStartedText: {
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "700",
    color: "#00FF80",
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
  signUpButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: "#000",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  signInText: {
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  signUpText: {
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "700",
    color: "#00FF80",
  },
});
