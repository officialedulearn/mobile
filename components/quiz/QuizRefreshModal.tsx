import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import useUserStore from "@/core/userState";
import { router } from "expo-router";
import Purchases from "react-native-purchases";
import { WalletService } from "@/services/wallet.service";

function getNextMidnight(): Date {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight;
}

function CountdownTimer({
  until,
  theme,
}: {
  until: Date;
  theme?: "light" | "dark";
}) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const diff = until.getTime() - now.getTime();
      if (diff <= 0) {
        setRemaining("Resetting...");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setRemaining(`${hours}h ${mins}m`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [until]);

  return (
    <Text
      style={[styles.countdownText, theme === "dark" && { color: "#E0E0E0" }]}
    >
      {remaining}
    </Text>
  );
}

interface QuizRefreshModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QuizRefreshModal({
  visible,
  onClose,
  onSuccess,
}: QuizRefreshModalProps) {
  const { user, theme, setUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const walletService = new WalletService();

  const handleQuizRefresh = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      if (Platform.OS === "ios") {
        await Purchases.logIn(user.id);
        const products = await Purchases.getProducts(["rc_049_quiz_refresh"]);
        if (products.length === 0) {
          throw new Error("Quiz refresh product not found");
        }
        await Purchases.purchaseStoreProduct(products[0]);
      } else {
        const result = await walletService.purchaseQuizRefresh(user.id);
        if (setUser && result.newLimit) {
          setUser({ ...user, quizLimit: result.newLimit });
        }
      }

      Alert.alert("Success!", "You now have 5 more quiz attempts.", [
        {
          text: "OK",
          onPress: () => {
            onClose();
            onSuccess?.();
          },
        },
      ]);
    } catch (error: any) {
      if (!error?.userCancelled) {
        Alert.alert("Purchase Failed", error?.message || "Please try again");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = () => {
    onClose();
    router.push({
      pathname: "/subscription",
      params: { source: "quiz_limit" },
    });
  };

  const maxAttempts = user?.isPremium ? 15 : 5;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContent,
            theme === "dark" && styles.modalContentDark,
          ]}
        >
          <Text
            style={[
              styles.modalTitle,
              theme === "dark" && styles.modalTitleDark,
            ]}
          >
            Out of Quiz Attempts
          </Text>
          <Text
            style={[styles.modalText, theme === "dark" && styles.modalTextDark]}
          >
            You have used all {maxAttempts} daily attempts.
          </Text>

          <View style={styles.optionsContainer}>
            <Text
              style={[
                styles.optionLabel,
                theme === "dark" && styles.optionLabelDark,
              ]}
            >
              Next free attempt in:
            </Text>
            <CountdownTimer until={getNextMidnight()} theme={theme} />

            <Text
              style={[styles.orText, theme === "dark" && styles.orTextDark]}
            >
              OR
            </Text>

            <TouchableOpacity
              style={[
                styles.refreshButton,
                theme === "dark" && styles.refreshButtonDark,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleQuizRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator
                  color={theme === "dark" ? "#000" : "#00FF80"}
                  size="small"
                />
              ) : (
                <Text
                  style={[
                    styles.refreshButtonText,
                    theme === "dark" && styles.refreshButtonTextDark,
                  ]}
                >
                  Get 5 More Attempts - $0.49
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.premiumButton,
                theme === "dark" && styles.premiumButtonDark,
              ]}
              onPress={handleUpgrade}
            >
              <Text
                style={[
                  styles.premiumButtonText,
                  theme === "dark" && styles.premiumButtonTextDark,
                ]}
              >
                Upgrade to Premium (15 daily attempts)
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text
              style={[
                styles.closeButtonText,
                theme === "dark" && styles.closeButtonTextDark,
              ]}
            >
              Maybe Later
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
  },
  modalContentDark: {
    backgroundColor: "#131313",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    textAlign: "center",
    marginBottom: 12,
  },
  modalTitleDark: {
    color: "#E0E0E0",
  },
  modalText: {
    fontSize: 16,
    color: "#61728C",
    fontFamily: "Satoshi-Regular",
    textAlign: "center",
    marginBottom: 20,
  },
  modalTextDark: {
    color: "#B3B3B3",
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionLabel: {
    fontSize: 14,
    color: "#61728C",
    fontFamily: "Satoshi-Regular",
    textAlign: "center",
    marginBottom: 8,
  },
  optionLabelDark: {
    color: "#B3B3B3",
  },
  countdownText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    textAlign: "center",
    marginBottom: 16,
  },
  orText: {
    fontSize: 14,
    color: "#61728C",
    fontFamily: "Satoshi-Regular",
    textAlign: "center",
    marginVertical: 12,
  },
  orTextDark: {
    color: "#B3B3B3",
  },
  refreshButton: {
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  refreshButtonDark: {
    backgroundColor: "#00FF80",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  refreshButtonText: {
    color: "#00FF80",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Satoshi-Regular",
  },
  refreshButtonTextDark: {
    color: "#000",
  },
  premiumButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#00FF80",
  },
  premiumButtonDark: {
    borderColor: "#00FF80",
  },
  premiumButtonText: {
    color: "#00FF80",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Satoshi-Regular",
  },
  premiumButtonTextDark: {
    color: "#00FF80",
  },
  closeButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 14,
    color: "#61728C",
    fontFamily: "Satoshi-Regular",
  },
  closeButtonTextDark: {
    color: "#B3B3B3",
  },
});
