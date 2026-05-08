import { Question } from "@/core/quizState";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnswerOption } from "./AnswerOption";
import { QuestionCard } from "./QuestionCard";

type Theme = "light" | "dark";

export const QuizQuestionsScreen = ({
  question,
  selectedOption,
  currentIndex,
  totalQuestions,
  isSubmitting,
  theme,
  onSelectOption,
  onPrevious,
  onNext,
  onFinish,
}: {
  question: Question;
  selectedOption: string | null;
  currentIndex: number;
  totalQuestions: number;
  isSubmitting: boolean;
  theme: Theme;
  onSelectOption: (option: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const handleSelectOption = (option: string) => {
    Haptics.selectionAsync();
    onSelectOption(option);
  };

  const handlePrevious = () => {
    Haptics.selectionAsync();
    onPrevious();
  };

  const handleNext = () => {
    Haptics.selectionAsync();
    onNext();
  };

  const handleFinish = () => {
    Haptics.selectionAsync();
    onFinish();
  };

  return (
    <View style={styles.questionContainer}>
      <QuestionCard question={question} theme={theme} />

      <ScrollView
        style={styles.options}
        contentContainerStyle={styles.optionsContent}
        showsVerticalScrollIndicator={false}
      >
        {question.options.map((option, index) => (
          <AnswerOption
            key={index}
            option={option}
            isSelected={selectedOption === option}
            theme={theme}
            onPress={() => handleSelectOption(option)}
          />
        ))}
      </ScrollView>

      <View
        style={[
          styles.bottomButtonsContainer,
          theme === "dark" && { backgroundColor: "#0D0D0D" },
        ]}
      >
        <View
          style={[styles.navigationButtons, { paddingBottom: insets.bottom }]}
        >
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.prevButton,
              theme === "dark" && {
                backgroundColor: "#131313",
                borderColor: "#2E3033",
              },
              currentIndex === 0 && styles.disabledButton,
            ]}
            onPress={handlePrevious}
            disabled={currentIndex === 0}
          >
            <Text
              style={[
                styles.navButtonText,
                theme === "dark" && { color: "#E0E0E0" },
              ]}
            >
              Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              styles.nextButton,
              theme === "dark" && { backgroundColor: "#00FF80" },
              (!selectedOption || isSubmitting) && styles.disabledButton,
            ]}
            disabled={!selectedOption || isSubmitting}
            onPress={isLastQuestion ? handleFinish : handleNext}
          >
            <Text
              style={[
                styles.navButtonText,
                styles.nextButtonText,
                theme === "dark" && { color: "#000" },
              ]}
            >
              {isSubmitting
                ? "Submitting..."
                : isLastQuestion
                  ? "Finish Quiz"
                  : "Next"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  questionContainer: {
    flex: 1,
  },
  options: {
    marginTop: 10,
    flex: 1,
  },
  optionsContent: {
    flexDirection: "column",
    gap: 12,
    paddingVertical: 8,
  },
  bottomButtonsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    backgroundColor: "#F9FBFC",
    width: "100%",
    alignItems: "center",
  },
  navigationButtons: {
    flexDirection: "row",
    width: "100%",
    maxWidth: 400,
    gap: 16,
    alignItems: "stretch",
    justifyContent: "center",
  },
  navButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    minWidth: 140,
  },
  prevButton: {
    display: "flex",
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    flex: 1,
    alignSelf: "stretch",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#000",
    backgroundColor: "#FFFFFF",
  },
  nextButton: {
    display: "flex",
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    flex: 1,
    alignSelf: "stretch",
    borderRadius: 16,
    backgroundColor: "#000",
  },
  navButtonText: {
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
    color: "#000",
  },
  nextButtonText: {
    color: "#00FF80",
  },
  disabledButton: {
    opacity: 0.5,
  },
});
