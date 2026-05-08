import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";

type Theme = "light" | "dark";

export const QuizLoadingScreen = ({ theme }: { theme: Theme }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#00FF80" />
    <Text
      style={[styles.loadingText, theme === "dark" && { color: "#B3B3B3" }]}
    >
      Loading quiz questions...
    </Text>
  </View>
);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    color: "#61728C",
    textAlign: "center",
    marginTop: 15,
  },
});
