import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Question } from "@/core/quizState";

type Theme = "light" | "dark";

export const QuestionCard = ({
  question,
  theme,
}: {
  question: Question;
  theme: Theme;
}) => (
  <View>
    <Text
      style={[
        styles.question,
        theme === "dark" && { color: "#E0E0E0" },
      ]}
    >
      {question.question}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  question: {
    color: "#2D3C52",
    lineHeight: 30,
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Satoshi-Regular",
    marginBottom: 20,
  },
});
