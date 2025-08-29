import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import BackButton from "@/components/backButton";
import { WalletService } from "@/services/wallet.service";
import AsyncStorage from '@react-native-async-storage/async-storage';
import useUserStore from "@/core/userState";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
const { width } = Dimensions.get("window");

const walletService = new WalletService();

const planData = [
  {
    name: "Free",
    price: 0,
    features: [
      "Basic AI chat support",
      "5 quizzes per day",
      "Basic progress tracking",
      "Community access",
    ],
  },
  {
    name: "Pro",
    price: 5,
    features: [
      "Unlimited AI chat support",
      "Unlimited quizzes",
      "Advanced analytics",
      "Priority support",
    ],
  },
];

const PlanCard = ({
  name,
  price,
  isAnnual,
  features,
}: {
  name: string;
  price: number;
  isAnnual: boolean;
  features: string[];
}) => {
  const isFree = price === 0;
  return (
    <View style={styles.planCard}>
      <Text style={styles.billingLabel}>
        {isAnnual ? "🔥 Annually" : "🔥 Monthly"}
      </Text>

      <View style={styles.priceContainer}>
        <Text style={styles.numberPriceText}>
          ${isAnnual ? price * 10 : price}
        </Text>
        <Text style={styles.littlePriceText}>/{isAnnual ? "year" : "month"}</Text>
      </View>

      <Text style={styles.planName}>{isFree ? "Free" : name}</Text>

      <Text style={styles.planDescription}>
        Upgrade your edulearn Plan to get access to more features that aren’t
        available on the free plan
      </Text>

      <Text style={styles.featuresTitle}>Features:</Text>

      <View style={styles.featureList}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Image source={require("@/assets/images/icons/checkmark.png")} style={styles.checkmarkIcon} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const Subscription = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const user = useUserStore(s => s.user)
  const scrollViewRef = useRef<ScrollView>(null);


  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const cardWidth = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(scrollPosition / cardWidth);
    setCurrentPlanIndex(index);
  };

  const handleUpgrade = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please log in again.');
      return;
    }

    const currentPlan = planData[currentPlanIndex];
    if (currentPlan.price === 0) {
      Alert.alert('Info', 'You are already on the free plan.');
      return;
    }

    const planAmount = isAnnual ? 80 : 8; 

    Alert.alert(
      'Confirm Upgrade',
      `Are you sure you want to upgrade to ${currentPlan.name} plan for $${planAmount} USDC${isAnnual ? ' (Annual)' : ' (Monthly)'}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => processPremiumPayment(planAmount),
        },
      ]
    );
  };

  const processPremiumPayment = async (amount: number) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const result = await walletService.upgradeToPremium(user.id, amount);
      
      Alert.alert(
        'Success!',
        `Premium upgrade successful! Transaction: ${result.signature}`,
        [
          {
            text: 'View Transaction',
            onPress: () => {
              console.log(`Transaction link: https://solscan.io/tx/${result.signature}`);
            },
          },
          {
            text: 'OK',
            style: 'default',
          },
        ]
      );
    } catch (error: any) {
      console.error('Premium upgrade error:', error);
      
      let errorMessage = 'Failed to process premium upgrade. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.data?.error) {
        errorMessage = error.response.data.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Upgrade Failed', 
        errorMessage,
        [
          {
            text: 'OK',
            style: 'default',
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />  
      <View style={styles.topNav}>
        <BackButton />
        <Text style={styles.headerText}>Upgrade your Plan</Text>
      </View>

      <View style={styles.switchPills}>
        <TouchableOpacity
          style={[styles.switchPill, !isAnnual && styles.switchPillActive]}
          onPress={() => setIsAnnual(false)}
        >
          <Text style={[styles.pillText, !isAnnual && styles.pillTextActive]}>
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.switchPill,
            isAnnual && styles.switchPillActive,
          ]}
          onPress={() => setIsAnnual(true)}
        >
          <View style={styles.annuallyContent}>
            <Text style={[styles.pillText, isAnnual && styles.pillTextActive]}>
              Annually
            </Text>
            <View style={styles.discountBox}>
              <Text style={styles.discountBoxText}>-20%</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {planData.map((plan, index) => (
          <View key={index} style={styles.cardContainer}>
            <PlanCard
              name={plan.name}
              price={plan.price}
              isAnnual={isAnnual}
              features={plan.features}
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsContainer}>
        {planData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentPlanIndex === index && styles.activeDot,
            ]}
          />
        ))}
      </View>

      <TouchableOpacity 
        style={[
          styles.upgradeButton, 
          (isLoading || planData[currentPlanIndex].price === 0) && styles.upgradeButtonDisabled
        ]}
        onPress={handleUpgrade}
        disabled={isLoading || planData[currentPlanIndex].price === 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#00FF80" size="small" />
            <Text style={styles.upgradeButtonText}>Processing...</Text>
          </View>
        ) : (
          <Text style={[
            styles.upgradeButtonText,
            planData[currentPlanIndex].price === 0 && styles.upgradeButtonTextDisabled
          ]}>
            {planData[currentPlanIndex].price === 0 ? 'Current Plan' : 'Upgrade'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default Subscription;

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    flex: 1,
    backgroundColor: "#F9FBFC",
    paddingHorizontal: 16,
  },
  topNav: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2D3C52",
    fontFamily: "Satoshi",
  },
  switchPills: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EDF3FC",
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
    paddingRight: 12,
    paddingBottom: 4,
    paddingLeft: 4,
    marginTop: 16,
  },
  switchPill: {
    backgroundColor: "transparent",
    alignItems: "center",
    flexDirection: "column",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flex: 1,
  },
  switchPillActive: {
    backgroundColor: "#000",
  },
  pillText: {
    fontSize: 14,
    color: "#2D3C52",
    fontFamily: "Satoshi",
  },
  pillTextActive: {
    color: "#00FF80",
    fontFamily: "Satoshi",
  },
  discountBox: {
    borderRadius: 16,
    backgroundColor: "#000",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  discountBoxText: {
    fontSize: 10,
    color: "#00FF80",
    textAlign: "center",
    fontFamily: "Satoshi",
  },
  annuallyContent: {
    flexDirection: "row",
    gap: 8,
  },
  scrollView: {
    marginTop: 16,
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  cardContainer: {
    width: width - 32,
    paddingHorizontal: 16,
    flex: 1,
  },
  planCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#00FF80",
    borderRadius: 16,
    padding: 16,
    gap: 16,
    flexDirection: "column",
    minHeight: 450,
  },
  billingLabel: {
    fontSize: 12,
    color: "#61728C",
    backgroundColor: "#F9FBFC",
    borderWidth: 1,
    borderColor: "#EDF3FC",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
    fontFamily: "Satoshi",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  numberPriceText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2D3C52",
    fontFamily: "Satoshi",
    lineHeight: 32,
  },
  littlePriceText: {
    fontSize: 14,
    color: "#61728C",
    marginLeft: 4,
    fontFamily: "Satoshi",
    lineHeight: 24,
  },
  planName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3C52",
    marginTop: 4,
    fontFamily: "Satoshi",
  },
  planDescription: {
    fontSize: 14,
    color: "#2D3C52",
    marginTop: 4,
    lineHeight: 20,
    fontFamily: "Satoshi",
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3C52",
    marginTop: 16,
    marginBottom: 8,
    fontFamily: "Satoshi",
  },
  featureList: {
    backgroundColor: "#F9FBFC",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EDF3FC",
    gap: 6,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkmarkIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: "#2D3C52",
    fontFamily: "Satoshi",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EDF3FC",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#00FF80",
  },
  upgradeButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 40,
  },
  upgradeButtonDisabled: {
    backgroundColor: "#EDF3FC",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  upgradeButtonText: {
    color: "#00FF80",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Satoshi",
  },
  upgradeButtonTextDisabled: {
    color: "#61728C",
  },
});
