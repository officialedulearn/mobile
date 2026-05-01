import { Question } from "@/core/quizState";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

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
    fontSize: 14,
    fontFamily: "Satoshi-Regular",
    marginBottom: 20,
  },
});
