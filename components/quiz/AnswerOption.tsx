import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type Theme = "light" | "dark";

export const AnswerOption = ({
  option,
  isSelected,
  theme,
  onPress,
}: {
  option: string;
  isSelected: boolean;
  theme: Theme;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[
      styles.optionItem,
      theme === "dark" && {
        backgroundColor: "#131313",
        borderColor: "#2E3033",
      },
      isSelected && [
        styles.selectedOption,
        theme === "dark" && {
          backgroundColor: "rgba(0, 255, 128, 0.1)",
          borderColor: "#00FF80",
        },
      ],
    ]}
    onPress={onPress}
  >
    <View
      style={[
        styles.radioButton,
        theme === "dark" && { borderColor: "#B3B3B3" },
        isSelected && styles.radioButtonSelected,
      ]}
    >
      {isSelected && <View style={styles.radioButtonInner} />}
    </View>
    <Text
      style={[
        styles.optionText,
        theme === "dark" && { color: "#E0E0E0" },
        isSelected && styles.selectedOptionText,
      ]}
    >
      {option}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EDF3FC",
  },
  selectedOption: {
    borderColor: "#00FF80",
    backgroundColor: "#F0FFF9",
  },
  radioButton: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#61728C",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioButtonSelected: {
    borderColor: "#00FF80",
  },
  radioButtonInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: "#00FF80",
  },
  optionText: {
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    fontWeight: "400",
    flex: 1,
  },
  selectedOptionText: {
    fontWeight: "500",
  },
});
