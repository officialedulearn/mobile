import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type Theme = "light" | "dark";

export const QuizErrorScreen = ({
  error,
  theme,
  onRetry,
  onReturn,
}: {
  error: string;
  theme: Theme;
  onRetry: () => void;
  onReturn: () => void;
}) => (
  <View style={styles.loadingContainer}>
    <Text style={[styles.errorText, theme === "dark" && { color: "#B3B3B3" }]}>
      {error}
    </Text>
    <View style={styles.errorButtonsContainer}>
      <TouchableOpacity
        style={[
          styles.errorButton,
          theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" },
        ]}
        onPress={onRetry}
      >
        <Text
          style={[
            styles.errorButtonText,
            theme === "dark" && { color: "#E0E0E0" },
          ]}
        >
          Retry
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.errorButton,
          styles.errorButtonPrimary,
          theme === "dark" && { backgroundColor: "#00FF80" },
        ]}
        onPress={onReturn}
      >
        <Text
          style={[
            styles.errorButtonText,
            styles.errorButtonTextPrimary,
            theme === "dark" && { color: "#000" },
          ]}
        >
          Return to Quizzes
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    color: "#61728C",
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  errorButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    maxWidth: 400,
    paddingHorizontal: 20,
  },
  errorButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDF3FC",
  },
  errorButtonPrimary: {
    backgroundColor: "#00FF80",
    borderColor: "#00FF80",
  },
  errorButtonText: {
    fontFamily: "Satoshi-Regular",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    color: "#2D3C52",
    textAlign: "center",
  },
  errorButtonTextPrimary: {
    color: "#000000",
  },
});
