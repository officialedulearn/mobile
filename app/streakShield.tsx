import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import React, { useState } from "react";
import BackButton from "@/components/common/backButton";
import useUserStore from "@/core/userState";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import Purchases from "react-native-purchases";
import { WalletService } from "@/services/wallet.service";

export default function StreakShieldScreen() {
  const { user, theme } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const walletService = new WalletService();

  const handlePurchase = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      if (Platform.OS === "ios") {
        await Purchases.logIn(user.id);
        const products = await Purchases.getProducts(["rc_099_streak_shield"]);
        if (products.length === 0) {
          throw new Error("Streak Shield product not found");
        }
        await Purchases.purchaseStoreProduct(products[0]);
      } else {
        await walletService.purchaseStreakShield(user.id);
      }

      Alert.alert(
        "Streak Shield Activated!",
        `Your ${user.streak}-day streak is now protected for 7 days. You can miss one day without losing your progress!`,
        [{ text: "Awesome!", onPress: () => router.back() }],
      );
    } catch (error: any) {
      if (!error?.userCancelled) {
        Alert.alert("Purchase Failed", error?.message || "Please try again");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, theme === "dark" && styles.containerDark]}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <View style={styles.headerNav}>
        <BackButton />
        <Text
          style={[
            styles.headerTitle,
            theme === "dark" && styles.headerTitleDark,
          ]}
        >
          Streak Shield
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, theme === "dark" && styles.titleDark]}>
          Protect your {user?.streak || 0}-day streak from expiring!
        </Text>
        <Text
          style={[styles.subtitle, theme === "dark" && styles.subtitleDark]}
        >
          Shield valid for 7 days. Automatically activates when you miss a day.
        </Text>

        <View
          style={[
            styles.benefitsCard,
            theme === "dark" && styles.benefitsCardDark,
          ]}
        >
          <Text
            style={[styles.benefit, theme === "dark" && styles.benefitDark]}
          >
            Protects against one missed day
          </Text>
          <Text
            style={[styles.benefit, theme === "dark" && styles.benefitDark]}
          >
            Valid for 7 days
          </Text>
          <Text
            style={[styles.benefit, theme === "dark" && styles.benefitDark]}
          >
            Automatically activates when needed
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.purchaseButton,
            theme === "dark" && styles.purchaseButtonDark,
            isLoading && styles.purchaseButtonDisabled,
          ]}
          onPress={handlePurchase}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={theme === "dark" ? "#000" : "#00FF80"} />
          ) : (
            <Text
              style={[
                styles.purchaseButtonText,
                theme === "dark" && styles.purchaseButtonTextDark,
              ]}
            >
              Get Streak Shield - $0.99
            </Text>
          )}
        </TouchableOpacity>

        {Platform.OS === "android" && (
          <Text style={[styles.hint, theme === "dark" && styles.hintDark]}>
            Payment via USDC from your wallet
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FBFC",
    padding: 20,
  },
  containerDark: {
    backgroundColor: "#0D0D0D",
  },
  headerNav: {
    marginTop: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 32,
  },
  headerTitle: {
    color: "#2D3C52",
    fontSize: 20,
    fontFamily: "Satoshi-Regular",
  },
  headerTitleDark: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    marginBottom: 12,
  },
  titleDark: {
    color: "#E0E0E0",
  },
  subtitle: {
    fontSize: 16,
    color: "#61728C",
    fontFamily: "Satoshi-Regular",
    marginBottom: 24,
    lineHeight: 24,
  },
  subtitleDark: {
    color: "#B3B3B3",
  },
  benefitsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#EDF3FC",
  },
  benefitsCardDark: {
    backgroundColor: "#131313",
    borderColor: "#2E3033",
  },
  benefit: {
    fontSize: 16,
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    marginBottom: 12,
  },
  benefitDark: {
    color: "#E0E0E0",
  },
  purchaseButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  purchaseButtonDark: {
    backgroundColor: "#00FF80",
  },
  purchaseButtonDisabled: {
    opacity: 0.7,
  },
  purchaseButtonText: {
    color: "#00FF80",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Satoshi-Regular",
  },
  purchaseButtonTextDark: {
    color: "#000",
  },
  hint: {
    fontSize: 12,
    color: "#61728C",
    fontFamily: "Satoshi-Regular",
    textAlign: "center",
    marginTop: 16,
  },
  hintDark: {
    color: "#B3B3B3",
  },
});
