import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ProgressBar } from "react-native-paper";

type Theme = "light" | "dark";

export const QuizProgress = ({
  currentIndex,
  totalQuestions,
  timeLeft,
  theme,
}: {
  currentIndex: number;
  totalQuestions: number;
  timeLeft: number;
  theme: Theme;
}) => {
  const progress = (currentIndex + 1) / totalQuestions;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <>
      <View style={styles.metrics}>
        <View>
          <Text
            style={[
              styles.metricText,
              theme === "dark" && { color: "#B3B3B3" },
            ]}
          >
            Question
          </Text>
          <Text
            style={[
              styles.questionsText,
              theme === "dark" && { color: "#E0E0E0" },
            ]}
          >
            {currentIndex + 1} of {totalQuestions}
          </Text>
        </View>

        <View style={styles.timeContainer}>
          <Text
            style={[
              styles.metricText,
              theme === "dark" && { color: "#B3B3B3" },
            ]}
          >
            Time Left
          </Text>
          <Text
            style={[styles.timeLeft, timeLeft < 10 ? styles.timeWarning : null]}
          >
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      <ProgressBar
        progress={Math.min(Math.max(progress, 0), 1)}
        color="#00FF80"
        style={{
          height: 10,
          borderRadius: 5,
          marginVertical: 20,
          backgroundColor: theme === "dark" ? "#2E3033" : "#EDF3FC",
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  metrics: {
    justifyContent: "space-between",
    flexDirection: "row",
    marginBottom: 10,
  },
  metricText: {
    color: "#61728C",
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 26,
  },
  questionsText: {
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 30,
  },
  timeContainer: {
    alignItems: "flex-end",
  },
  timeLeft: {
    color: "#f00",
    fontFamily: "Satoshi-Regular",
    textTransform: "uppercase",
    lineHeight: 24,
    fontWeight: "500",
    fontSize: 14,
  },
  timeWarning: {
    color: "#ff0000",
  },
});
