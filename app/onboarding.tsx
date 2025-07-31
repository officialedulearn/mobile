import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type OnBoardingSteps = {
  title: string;
  subtitle: string;
  illustration: any;
  buttonTexts: string[];
};

const OnBoarding = () => {
  const [stepIndex, setStepIndex] = React.useState(0);

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

  const handleSkip = () => {
    if (stepIndex < onBoardingSteps.length - 1) {
      setStepIndex((prev) => prev + 1);
    }
  };

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
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
            <Image
              source={require("@/assets/images/icons/CaretRight.png")}
              style={styles.skipIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>

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
          <View
            key={index}
            style={[styles.dot, stepIndex === index && styles.activeDot]}
          />
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
            >
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.getStarted}
            onPress={() => setStepIndex((prev) => prev + 1)}
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
  },
  topNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 30,
  },
  logo: {
    width: 130,
    height: 160,
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
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    marginTop: 20,
  },
  illustration: {
    width: "100%",
    height: 300,
    marginBottom: 32,
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
  },
  stepsDisplay: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
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
    paddingBottom: 40,
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
