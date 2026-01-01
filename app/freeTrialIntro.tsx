import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import React from "react";
import useUserStore from "@/core/userState";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { router } from "expo-router";

const trialFeatures = [
  {
    icon: "🤖",
    title: "Advanced AI Models",
    description: "Access to Gemini 2.5 Pro for smarter learning"
  },
  {
    icon: "💬",
    title: "Unlimited Chat Messages",
    description: "Chat with your AI tutor without limits"
  },
  {
    icon: "📝",
    title: "15 Quiz Attempts Daily",
    description: "Test your knowledge more frequently"
  },
  {
    icon: "⚡",
    title: "20 Chat Credits Per Day",
    description: "More credits for advanced features"
  },
  {
    icon: "🎖️",
    title: "Exclusive Premium Badges",
    description: "Unlock special achievements and rewards"
  },
  {
    icon: "🔄",
    title: "Credit Rollovers",
    description: "Unused credits carry over to the next day"
  },
];

const FreeTrialIntro = () => {
  const { theme } = useUserStore();

  const handleLearnMore = () => {
    router.push("/subscription");
  };

  const handleSkip = () => {
    router.push("/(tabs)");
  };

  return (
    <View style={[styles.container, theme === "dark" && styles.containerDark]}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipButton}
        >
          <Image 
            source={theme === "dark" 
              ? require("@/assets/images/icons/dark/cancel.png")
              : require("@/assets/images/icons/cancel.png")
            } 
            style={styles.skipIcon} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, theme === "dark" && styles.heroTitleDark]}>
            Start Your Free Trial
          </Text>
          <Text style={[styles.heroSubtitle, theme === "dark" && styles.heroSubtitleDark]}>
            Experience premium features at no cost
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          {trialFeatures.map((feature, index) => (
            <View 
              key={index} 
              style={[styles.featureCard, theme === "dark" && styles.featureCardDark]}
            >
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, theme === "dark" && styles.featureTitleDark]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDescription, theme === "dark" && styles.featureDescriptionDark]}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.trialInfoContainer}>
          <View style={[styles.trialInfoBox, theme === "dark" && styles.trialInfoBoxDark]}>
            <Text style={[styles.trialInfoText, theme === "dark" && styles.trialInfoTextDark]}>
              🎉 3-day free trial, then ${Platform.OS === 'android' ? '5' : '4.99'}/month
            </Text>
            <Text style={[styles.trialInfoSubtext, theme === "dark" && styles.trialInfoSubtextDark]}>
              Cancel anytime before trial ends. No charges until trial is over.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[styles.startButton, theme === "dark" && styles.startButtonDark]}
          onPress={handleLearnMore}
        >
          <Text style={[styles.startButtonText, theme === "dark" && styles.startButtonTextDark]}>
            Learn More
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.skipTextButton}
          onPress={handleSkip}
        >
          <Text style={[styles.skipText, theme === "dark" && styles.skipTextDark]}>
            Continue with Free Plan
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FreeTrialIntro;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FBFC",
  },
  containerDark: {
    backgroundColor: "#0D0D0D",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 8,
  },
  skipButton: {
    padding: 8,
  },
  skipIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 32,
    paddingTop: 8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#2D3C52",
    fontFamily: "Satoshi",
    textAlign: "center",
    marginBottom: 8,
  },
  heroTitleDark: {
    color: "#E0E0E0",
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#61728C",
    fontFamily: "Satoshi",
    textAlign: "center",
  },
  heroSubtitleDark: {
    color: "#B3B3B3",
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "#EDF3FC",
  },
  featureCardDark: {
    backgroundColor: "#131313",
    borderColor: "#2E3033",
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F9FBFC",
    alignItems: "center",
    justifyContent: "center",
  },
  featureIcon: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3C52",
    fontFamily: "Satoshi",
    marginBottom: 4,
  },
  featureTitleDark: {
    color: "#E0E0E0",
  },
  featureDescription: {
    fontSize: 14,
    color: "#61728C",
    fontFamily: "Satoshi",
    lineHeight: 20,
  },
  featureDescriptionDark: {
    color: "#B3B3B3",
  },
  trialInfoContainer: {
    marginBottom: 16,
  },
  trialInfoBox: {
    backgroundColor: "#F0F9FF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0F2FE",
  },
  trialInfoBoxDark: {
    backgroundColor: "#1A1A1A",
    borderColor: "#2E3033",
  },
  trialInfoText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3C52",
    fontFamily: "Satoshi",
    textAlign: "center",
    marginBottom: 4,
  },
  trialInfoTextDark: {
    color: "#E0E0E0",
  },
  trialInfoSubtext: {
    fontSize: 14,
    color: "#61728C",
    fontFamily: "Satoshi",
    textAlign: "center",
  },
  trialInfoSubtextDark: {
    color: "#B3B3B3",
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  startButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonDark: {
    backgroundColor: "#00FF80",
  },
  startButtonText: {
    color: "#00FF80",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Satoshi",
  },
  startButtonTextDark: {
    color: "#000",
  },
  skipTextButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  skipText: {
    color: "#61728C",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Satoshi",
  },
  skipTextDark: {
    color: "#B3B3B3",
  },
});

