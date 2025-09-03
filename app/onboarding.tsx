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
import useUserStore from "@/core/userState";

type OnBoardingSteps = {
  title: string;
  subtitle: string;
  illustration: any;
  buttonTexts: string[];
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH / 6; 
const VELOCITY_THRESHOLD = 0.2; 

const OnBoarding = () => {
  const [stepIndex, setStepIndex] = React.useState(0);
  const theme = useUserStore((state) => state.theme);
  const pan = useRef(new Animated.ValueXY()).current;
  const isAnimating = useRef(false); 
  const currentPanValue = useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    const listenerId = pan.addListener((value) => {
      currentPanValue.current = value;
    });

    return () => {
      pan.removeListener(listenerId);
    };
  }, [pan]);

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
    if (isAnimating.current) return;
    
    isAnimating.current = true;
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start(() => {
      isAnimating.current = false;
    });
  };

  const animateToStep = (direction: 'next' | 'prev') => {
    if (isAnimating.current) return;
    
    isAnimating.current = true;
    let newStepIndex = stepIndex;
    if (direction === 'next') {
      newStepIndex = Math.min(stepIndex + 1, onBoardingSteps.length - 1);
    } else {
      newStepIndex = Math.max(stepIndex - 1, 0);
    }
    
    console.log(`Animating ${direction}: from step ${stepIndex} to step ${newStepIndex}`);
    setStepIndex(newStepIndex);
    
    const targetX = direction === 'next' ? -SCREEN_WIDTH : SCREEN_WIDTH;
    
    Animated.timing(pan, {
      toValue: { x: targetX, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      pan.setValue({ x: 0, y: 0 });
      isAnimating.current = false;
      console.log(`Animation complete, now at step ${newStepIndex}`);
    });
  };

  const goToNextStep = () => {
    if (stepIndex < onBoardingSteps.length - 1) {
      animateToStep('next');
    }
  };

  const goToPrevStep = () => {
    if (stepIndex > 0) {
      animateToStep('prev');
    }
  };

  const handleSkip = () => {
    goToNextStep();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isAnimating.current,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !isAnimating.current && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({ x: 0, y: 0 });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gestureState) => {
        let dx = gestureState.dx;
      
        if (stepIndex === 0 && dx > 0) {
          dx = dx * 0.2; 
        } else if (stepIndex === onBoardingSteps.length - 1 && dx < 0) {
          dx = dx * 0.2;
        }
        
        pan.setValue({ x: dx, y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        
        const { dx, vx } = gestureState;
        const absVx = Math.abs(vx);
        const absDx = Math.abs(dx);
        
        console.log(`Swipe: dx=${dx}, vx=${vx}, stepIndex=${stepIndex}, absDx=${absDx}, absVx=${absVx}, canGoNext=${stepIndex < onBoardingSteps.length - 1}, canGoPrev=${stepIndex > 0}`);
        
        const shouldChangeStep = absDx > SWIPE_THRESHOLD || absVx > VELOCITY_THRESHOLD;
        
        if (shouldChangeStep) {
          if (dx < 0 && stepIndex < onBoardingSteps.length - 1) {
            goToNextStep();
          } else if (dx > 0 && stepIndex > 0) {
            goToPrevStep();
          } else {
            resetPosition();
          }
        } else {
          console.log(`Not enough distance/velocity (threshold: ${SWIPE_THRESHOLD}, velocity: ${VELOCITY_THRESHOLD}), resetting position`);
          resetPosition();
        }
      },
      onPanResponderTerminate: () => {
        pan.flattenOffset();
        resetPosition();
      },
    })
  ).current;

  const currentStep = onBoardingSteps[stepIndex];

  return (
    <SafeAreaView style={[styles.container, theme === "dark" && styles.containerDark]}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      <View style={styles.topNavigation}>
        <Image
          source={theme === "dark" ? require("@/assets/images/logo.png") : require("@/assets/images/LOGO-1.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        {stepIndex < onBoardingSteps.length - 1 && (
          <TouchableOpacity 
            style={[styles.skipButton, theme === "dark" && styles.skipButtonDark]} 
            onPress={handleSkip}
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
          <Text style={[styles.title, theme === "dark" && styles.titleDark]}>{currentStep.title}</Text>
          <Text style={[styles.subtitle, theme === "dark" && styles.subtitleDark]}>{currentStep.subtitle}</Text>
        </View>
      </Animated.View>

      <View style={[styles.stepsDisplay, theme === "dark" && styles.stepsDisplayDark]}>
        {onBoardingSteps.map((_, index) => (
          <TouchableOpacity 
            key={index} 
            onPress={() => {
              setStepIndex(index);
              resetPosition();
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
        {stepIndex === onBoardingSteps.length - 1 ? (
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
    fontFamily: "Satoshi",
  },
  skipTextDark: {
    color: "#E0E0E0",
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
  titleDark: {
    color: "#E0E0E0",
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
    fontFamily: "Satoshi",
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
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  signInTextDark: {
    color: "#00FF80",
  },
  signUpText: {
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "700",
    color: "#00FF80",
  },
  signUpTextDark: {
    color: "#000",
  },
});
