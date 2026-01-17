import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import React, { useState, useEffect } from "react";
import useUserStore from "@/core/userState";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { router } from "expo-router";
import Purchases from "react-native-purchases";

const trialFeatures = [
  {
    icon: "💬",
    title: "Unlimited Chat Messages",
  },
  {
    icon: "📝",
    title: "More Quiz Attempts and Credits Daily",
  },
  {
    icon: "🎖️",
    title: "Exclusive Premium Badges",
  },
  {
    icon: "🔄",
    title: "Credit Rollovers",
  },
];

const FreeTrialIntro = () => {
  const { theme } = useUserStore();
  const [hasTrialEligibility, setHasTrialEligibility] = useState(false);
  const [trialText, setTrialText] = useState('');

  useEffect(() => {
    const checkTrialEligibility = async () => {
      try {
        const productIds = Platform.OS === 'android' 
          ? ['premium_monthly', 'premium_annual']
          : ['rc_499_edulearn', 'rc_4999_edulearn'];
        
        const products = await Purchases.getProducts(productIds);
        
        if (products.length > 0) {
          const monthlyProduct = products.find(p => 
            p.identifier === 'rc_499_edulearn' || p.identifier === 'premium_monthly'
          );
          
          if (monthlyProduct) {
            const intro = monthlyProduct.introPrice;
            
            if (intro && intro.periodNumberOfUnits === 3 && intro.periodUnit === 'DAY') {
              setHasTrialEligibility(true);
              setTrialText(`3-day free trial, then ${monthlyProduct.priceString}/month`);
            } else if (intro) {
              const periodText = intro.periodUnit === 'DAY' ? 'day' : 
                                 intro.periodUnit === 'WEEK' ? 'week' : 
                                 intro.periodUnit === 'MONTH' ? 'month' : 'period';
              setHasTrialEligibility(true);
              setTrialText(`${intro.periodNumberOfUnits}-${periodText} free trial, then ${monthlyProduct.priceString}/month`);
            }
          }
        }
      } catch (error) {
        console.log('Error checking trial eligibility:', error);
      }
    };
    checkTrialEligibility();
  }, []);

  const handleLearnMore = () => {
    router.push("/subscription");
  };

  const handleSkip = () => {
    router.back()
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
            Unlock the Full Eddy Experience
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          {trialFeatures.map((feature, index) => (
            <View 
              key={index} 
              style={[styles.featureCard, theme === "dark" && styles.featureCardDark]}
            >
              <View style={[styles.featureIconContainer, theme === "dark" && styles.featureIconContainerDark]}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, theme === "dark" && styles.featureTitleDark]}>
                  {feature.title}
                </Text>
                
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      <View style={styles.bottomContainer}>
        {hasTrialEligibility && (
          <View style={styles.trialBannerContainer}>
            <View style={[styles.trialBanner, theme === "dark" && styles.trialBannerDark]}>
              <Text style={[styles.trialBannerText, theme === "dark" && styles.trialBannerTextDark]}>
                🎉 {trialText}
              </Text>
              <Text style={[styles.trialBannerSubtext, theme === "dark" && styles.trialBannerSubtextDark]}>
                Cancel anytime before trial ends
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.startButton, theme === "dark" && styles.startButtonDark]}
          onPress={handleLearnMore}
        >
          <Text style={[styles.startButtonText, theme === "dark" && styles.startButtonTextDark]}>
            Learn More
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
    fontFamily: "Satoshi-Bold",
    textAlign: "center",
    marginBottom: 8,
    marginTop: 16,
  },
  heroTitleDark: {
    color: "#E0E0E0",
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#61728C",
    fontFamily: "Satoshi-Regular",
    textAlign: "center",
  },
  heroSubtitleDark: {
    color: "#B3B3B3",
  },
  featuresContainer: {
    
  },
  featureCard: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  featureCardDark: {
    backgroundColor: "#131313",
    borderColor: "#2E3033",
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8F5E9",
    borderWidth: 2,
    borderColor: "#00FF80",
    alignItems: "center",
    justifyContent: "center",
  },
  featureIconContainerDark: {
    backgroundColor: "#1A2E1A",
    borderColor: "#00FF80",
  },
  featureIcon: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    marginBottom: 4,
  },
  featureTitleDark: {
    color: "#E0E0E0",
  },
  featureDescription: {
    fontSize: 14,
    color: "#61728C",
    fontFamily: "Satoshi-Regular",
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
    fontFamily: "Satoshi-Regular",
    textAlign: "center",
    marginBottom: 4,
  },
  trialInfoTextDark: {
    color: "#E0E0E0",
  },
  trialInfoSubtext: {
    fontSize: 14,
    color: "#61728C",
    fontFamily: "Satoshi-Regular",
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
    fontFamily: "Satoshi-Regular",
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
    fontFamily: "Satoshi-Regular",
  },
  skipTextDark: {
    color: "#B3B3B3",
  },
  trialBannerContainer: {
    marginBottom: 12,
  },
  trialBanner: {
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E0F2FE",
    alignItems: "center",
  },
  trialBannerDark: {
    backgroundColor: "#1A1A1A",
    borderColor: "#2E3033",
  },
  trialBannerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    textAlign: "center",
    marginBottom: 4,
  },
  trialBannerTextDark: {
    color: "#E0E0E0",
  },
  trialBannerSubtext: {
    fontSize: 12,
    color: "#61728C",
    fontFamily: "Satoshi-Regular",
    textAlign: "center",
  },
  trialBannerSubtextDark: {
    color: "#B3B3B3",
  },
});

