import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import BackButton from "@/components/backButton";
import useUserStore from "@/core/userState";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import Purchases from "react-native-purchases";
import { router } from "expo-router";
const { width } = Dimensions.get("window");

const planData = [
  {
    name: "Basic",
    price: 0,
    features: [
      "Basic AI models (Gemini 2.5 Flash)",
      "5 quiz attempts per day",
      "5 chat credits per day",
      "Daily credit renewal",
      "Basic Badge rewards",
      "Community access"
    ],
  },
  {
    name: "Premium",
    price: 5,
    features: [
      "Advanced AI models (Gemini 2.5 Pro)",
      "10 quiz attempts per day",
      "10 chat credits per day",
      "Credit rollovers & priority support",
      "Exclusive premium badges",
      "Enhanced earning opportunities"
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
  const { theme } = useUserStore();
  const isFree = price === 0;
  return (
    <View style={[styles.planCard, theme === "dark" && styles.planCardDark]}>
      <Text style={[styles.billingLabel, theme === "dark" && styles.billingLabelDark]}>
        {isAnnual ? "🔥 Annually" : "🔥 Monthly"}
      </Text>

      <View style={styles.priceContainer}>
        <Text style={[styles.numberPriceText, theme === "dark" && styles.numberPriceTextDark]}>
          ${isAnnual ? price * 10 : price}
        </Text>
        <Text style={[styles.littlePriceText, theme === "dark" && styles.littlePriceTextDark]}>/{isAnnual ? "year" : "month"}</Text>
      </View>

      <Text style={[styles.planName, theme === "dark" && styles.planNameDark]}>{isFree ? "Free" : name}</Text>

      <Text style={[styles.planDescription, theme === "dark" && styles.planDescriptionDark]}>
        Upgrade your edulearn Plan to get access to more features that aren't
        available on the free plan
      </Text>

      <Text style={[styles.featuresTitle, theme === "dark" && styles.featuresTitleDark]}>Features:</Text>

      <View style={[styles.featureList, theme === "dark" && styles.featureListDark]}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Image 
              source={require("@/assets/images/icons/checkmark.png")} 
              style={styles.checkmarkIcon} 
            />
            <Text style={[styles.featureText, theme === "dark" && styles.featureTextDark]}>{feature}</Text>
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
  const { user, theme } = useUserStore();
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

    setIsLoading(true);
    try {
      await Purchases.logIn(user.id);
      console.log('📢 Logged in user:', user.id);

      let productIdentifier: string;
      
      if (Platform.OS === 'android') {
        productIdentifier = isAnnual 
          ? 'premium_yearly' 
          : 'premium_monthly';
      } else {
        productIdentifier = isAnnual 
          ? 'rc_4999_edulearn'
          : 'rc_499_edulearn';
      }
      
      const products = await Purchases.getProducts([productIdentifier]);
      
      if (products.length === 0) {
        Alert.alert('Error', 'Product not found. Please check your product identifiers.');
        setIsLoading(false);
        return;
      }

      const product = products[0];
      const { customerInfo } = await Purchases.purchaseStoreProduct(product);
      
      console.log('📢 Purchase successful, customer info:', customerInfo);
      console.log('📢 Active entitlements:', customerInfo.entitlements.active);

      const isPremium = Object.keys(customerInfo.entitlements.active).length > 0;
      console.log('📢 User is premium:', isPremium);
      
      Alert.alert(
        'Success!',
        'Premium upgrade successful! The app will now reload.',
        [
          {
            text: 'OK',
            style: 'default',
            onPress: async () => {
              try {
                router.reload()
              } catch (error) {
                console.log('📢 Error reloading app:', error);
              }
            },
          },
        ]
      );
    } catch (e: any) {
      console.log('📢 Purchase error:', e);
      
      let errorMessage = 'Failed to process premium upgrade. Please try again.';
      
      if (e.userCancelled) {
        errorMessage = 'Purchase cancelled.';
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      Alert.alert(
        'Purchase Failed', 
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

  const restorePurchases = async () => {
    try {
      setIsLoading(true);
      const customerInfo = await Purchases.restorePurchases();
      console.log('Restored purchases:', customerInfo);
      
      const isPremium = Object.keys(customerInfo.entitlements.active).length > 0;
      
      if (isPremium) {
        Alert.alert(
          'Success!',
          'Purchases restored successfully! The app will now reload.',
          [
            {
              text: 'OK',
              style: 'default',
              onPress: async () => {
                try {
                  router.reload()
                } catch (error) {
                  console.log('📢 Error reloading app:', error);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases were found to restore.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Unable to restore purchases. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchCustomerInfo = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        console.log("📢 Customer info:", customerInfo.originalAppUserId.toString());
      } catch (error) {
        console.log('📢 Error fetching customer info:', error);
      }
    };
    fetchCustomerInfo();
  }, []);

  useEffect(() => {
    const testProductFetch = async () => {
      try {
        console.log('📢 Testing product fetch with your IDs...');
        console.log(`📢 Platform: ${Platform.OS}`);
        
        const productIds = Platform.OS === 'android' 
          ? ['premium_monthly', 'premium_annual']
          : ['rc_499_edulearn', 'rc_4999_edulearn'];
        
        console.log('📢 Looking for:', productIds);
        const products = await Purchases.getProducts(productIds);
        console.log('📢 Products found count:', products.length);
        console.log('📢 Products found:', products);
        
        products.forEach((product) => {
          console.log('📢 Product identifier:', product.identifier);
          console.log('📢 Product price:', product.priceString);
          console.log('📢 Product currency:', product.currencyCode);
        });
      } catch (error) {
        console.log('📢 Error fetching products:', error);
      }
    };
    testProductFetch();
  }, []);

  return (
    <View style={[styles.container, theme === "dark" && styles.containerDark]}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />  
      <View style={styles.topNav}>
        <BackButton />
        <Text style={[styles.headerText, theme === "dark" && styles.headerTextDark]}>Upgrade your Plan</Text>
      </View>

      <View style={[styles.switchPills, theme === "dark" && styles.switchPillsDark]}>
        <TouchableOpacity
          style={[
            styles.switchPill, 
            !isAnnual && styles.switchPillActive,
            theme === "dark" && !isAnnual && styles.switchPillActiveDark
          ]}
          onPress={() => setIsAnnual(false)}
        >
          <Text style={[
            styles.pillText, 
            theme === "dark" && styles.pillTextDark,
            !isAnnual && theme === "dark" && styles.pillTextActiveDark,
            !isAnnual && theme === "light" && styles.pillTextActive,
          ]}>
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.switchPill,
            isAnnual && styles.switchPillActive,
            theme === "dark" && isAnnual && styles.switchPillActiveDark
          ]}
          onPress={() => setIsAnnual(true)}
        >
          <View style={styles.annuallyContent}>
            <Text style={[
              styles.pillText, 
              theme === "dark" && styles.pillTextDark,
              isAnnual && theme === "dark" && styles.pillTextActiveDark,
              isAnnual && theme === "light" && styles.pillTextActive,
            ]}>
              Annually
            </Text>
            <View style={[styles.discountBox, theme === "dark" && styles.discountBoxDark]}>
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
              theme === "dark" && styles.dotDark,
              theme === "dark" && currentPlanIndex === index && styles.activeDotDark,
            ]}
          />
        ))}
      </View>

      <TouchableOpacity 
        style={[
          styles.upgradeButton, 
          (isLoading || planData[currentPlanIndex].price === 0) && styles.upgradeButtonDisabled,
          theme === "dark" && styles.upgradeButtonDark,
          theme === "dark" && (isLoading || planData[currentPlanIndex].price === 0) && styles.upgradeButtonDisabledDark
        ]}
        onPress={handleUpgrade}
        disabled={isLoading || planData[currentPlanIndex].price === 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#00FF80" size="small" />
            <Text style={[
              styles.upgradeButtonText,
              theme === "dark" && styles.upgradeButtonTextDark
            ]}>Processing...</Text>
          </View>
        ) : (
          <Text style={[
            styles.upgradeButtonText,
            planData[currentPlanIndex].price === 0 && styles.upgradeButtonTextDisabled,
            theme === "dark" && styles.upgradeButtonTextDark,
            theme === "dark" && planData[currentPlanIndex].price === 0 && styles.upgradeButtonTextDisabledDark
          ]}>
            {planData[currentPlanIndex].price === 0 ? 'Current Plan' : 'Upgrade'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={restorePurchases}
        disabled={isLoading}
        style={styles.restoreButton}
      >
        <Text style={[
          styles.restoreButtonText,
          theme === "dark" && styles.restoreButtonTextDark,
          isLoading && styles.restoreButtonTextDisabled
        ]}>
          Restore Purchases
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Subscription;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FBFC",
  },
  containerDark: {
    backgroundColor: "#0D0D0D",
  },
  topNav: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    marginBottom: 16,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2D3C52",
    fontFamily: "Satoshi",
  },
  headerTextDark: {
    color: "#E0E0E0",
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
    marginHorizontal: 16,
    marginBottom: 16,
  },
  switchPillsDark: {
    backgroundColor: "#131313",
    borderColor: "#2E3033",
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
  switchPillActiveDark: {
    backgroundColor: "#00FF80",
  },
  pillText: {
    fontSize: 14,
    color: "#2D3C52",
    fontFamily: "Satoshi",
  },
  pillTextDark: {
    color: "#E0E0E0",
  },
  pillTextActive: {
    color: "#00FF80",
    fontFamily: "Satoshi",
  },
  pillTextActiveDark: {
    color: "#000",
    fontFamily: "Satoshi",
  },
  discountBox: {
    borderRadius: 16,
    backgroundColor: "#000",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  discountBoxDark: {
    backgroundColor: "#2E3033",
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
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: width - 32,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  planCardDark: {
    backgroundColor: "#131313",
    borderColor: "#00FF80",
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
  billingLabelDark: {
    color: "#B3B3B3",
    backgroundColor: "#2E3033",
    borderColor: "#2E3033",
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
  numberPriceTextDark: {
    color: "#E0E0E0",
  },
  littlePriceText: {
    fontSize: 14,
    color: "#61728C",
    marginLeft: 4,
    fontFamily: "Satoshi",
    lineHeight: 24,
  },
  littlePriceTextDark: {
    color: "#B3B3B3",
  },
  planName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3C52",
    marginTop: 4,
    fontFamily: "Satoshi",
  },
  planNameDark: {
    color: "#E0E0E0",
  },
  planDescription: {
    fontSize: 14,
    color: "#2D3C52",
    marginTop: 4,
    lineHeight: 20,
    fontFamily: "Satoshi",
  },
  planDescriptionDark: {
    color: "#B3B3B3",
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3C52",
    marginTop: 16,
    marginBottom: 8,
    fontFamily: "Satoshi",
  },
  featuresTitleDark: {
    color: "#E0E0E0",
  },
  featureList: {
    backgroundColor: "#F9FBFC",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EDF3FC",
    gap: 6,
  },
  featureListDark: {
    backgroundColor: "#0D0D0D",
    borderColor: "#2E3033",
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
  featureTextDark: {
    color: "#E0E0E0",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EDF3FC",
    marginHorizontal: 4,
  },
  dotDark: {
    backgroundColor: "#2E3033",
  },
  activeDot: {
    backgroundColor: "#00FF80",
  },
  activeDotDark: {
    backgroundColor: "#00FF80",
  },
  upgradeButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginBottom: 40,
  },
  upgradeButtonDark: {
    backgroundColor: "#00FF80",
  },
  upgradeButtonDisabled: {
    backgroundColor: "#EDF3FC",
  },
  upgradeButtonDisabledDark: {
    backgroundColor: "#2E3033",
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
  upgradeButtonTextDark: {
    color: "#000",
  },
  upgradeButtonTextDisabled: {
    color: "#61728C",
  },
  upgradeButtonTextDisabledDark: {
    color: "#B3B3B3",
  },
  restoreButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 32,
  },
  restoreButtonText: {
    color: "#61728C",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Satoshi",
  },
  restoreButtonTextDark: {
    color: "#B3B3B3",
  },
  restoreButtonTextDisabled: {
    opacity: 0.5,
  },
});
