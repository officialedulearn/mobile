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
const SWIPE_THRESHOLD = SCREEN_WIDTH / 6; 
const VELOCITY_THRESHOLD = 0.2; 

const OnBoarding = () => {
  const [stepIndex, setStepIndex] = React.useState(0);
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
      </Animated.View>

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
