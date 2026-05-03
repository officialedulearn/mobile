import { UserAnswer } from "@/core/quizState";
import { Image } from "expo-image";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Theme = "light" | "dark";

const ScoreBreakdown = ({
  score,
  totalQuestions,
  theme,
  xpEarned,
}: {
  score: number;
  totalQuestions: number;
  theme: Theme;
  xpEarned?: number;
}) => {
  const insets = useSafeAreaInsets();
  const isPassing = score >= totalQuestions / 2;
  const xp = xpEarned ?? score;

  return (
    <>
      <Text
        style={[
          styles.quizResult,
          { marginBottom: 15 },
          theme === "dark" && { color: "#E0E0E0" },
        ]}
      >
        Quiz Result
      </Text>
      <Image
        source={
          isPassing
            ? require("@/assets/images/eddie/congrats.png")
            : require("@/assets/images/eddie/failed.png")
        }
        style={styles.medalImage}
      />
      <Text style={[styles.quizResult, theme === "dark" && { color: "#E0E0E0" }]}>
        {isPassing ? "Congratulations" : "Don't worry, learning is a journey."}
      </Text>

      <Text style={[styles.resultsMessage, theme === "dark" && { color: "#B3B3B3" }]}>
        {isPassing
          ? "You're one step closer to your next badge. Keep the momentum going! Want to sharpen your skills even more? Try a follow-up quiz or review your answers."
          : `You got ${score} out of ${totalQuestions}, which means there's room to grow. You still earned ${xp} XP just for trying, and now you know where to improve. Review your answers and give it another go. You've got this!`}
      </Text>

      <Text style={[styles.scoreText, { marginTop: 10 }, theme === "dark" && { color: "#E0E0E0" }]}>
        Your Score
      </Text>

      <Text style={[styles.score, theme === "dark" && { color: "#E0E0E0" }]}>
        {isPassing ? <Text style={{ color: "#00FF80" }}>{score}</Text> : score}/{totalQuestions}
      </Text>

      <Text style={[styles.scoreText, theme === "dark" && { color: "#E0E0E0" }]}>
        Earned XP
      </Text>
      <View style={styles.xpContainer}>
        <Image source={require("@/assets/images/icons/medal-05.png")} style={styles.xpImage} />
        <Text style={[styles.score, theme === "dark" && { color: "#E0E0E0" }]}>
          +{xp} XP
        </Text>
      </View>
    </>
  );
};

const AnswersReview = ({
  userAnswers,
  theme,
}: {
  userAnswers: UserAnswer[];
  theme: Theme;
}) => (
  <View
    style={[
      styles.fullScreenAnswers,
      theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" },
    ]}
  >
    <Text style={[styles.answersTitle, theme === "dark" && { color: "#E0E0E0" }]}>
      Your Answers:
    </Text>
    <ScrollView style={styles.answersList} contentContainerStyle={styles.answersListContent}>
      {userAnswers.map((answer, index) => (
        <View
          key={index}
          style={[styles.answerItem, theme === "dark" && { borderBottomColor: "#2E3033" }]}
        >
          <Text
            style={[
              styles.answerQuestion,
              theme === "dark" && { color: "#E0E0E0" },
            ]}
            numberOfLines={2}
          >
            {index + 1}. {answer.question}
          </Text>
          <View style={styles.answerDetails}>
            <Text
              style={[
                styles.answerText,
                answer.isCorrect ? styles.correctAnswer : styles.wrongAnswer,
              ]}
            >
              Your answer: {answer.selectedAnswer ? (
                answer.selectedAnswer
              ) : (
                <Text style={{ fontStyle: "italic", opacity: 0.6 }}>Not answered</Text>
              )}
            </Text>
            {!answer.isCorrect && (
              <Text style={styles.correctAnswerText}>
                Correct answer: {answer.correctAnswer}
              </Text>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  </View>
);

export const QuizResultsScreen = ({
  reviewAnswers,
  score,
  totalQuestions,
  userAnswers,
  theme,
  onToggleReview,
  onReturnToQuizzes,
  xpEarned,
}: {
  reviewAnswers: boolean;
  score: number;
  totalQuestions: number;
  userAnswers: UserAnswer[];
  theme: Theme;
  onToggleReview: () => void;
  onReturnToQuizzes: () => void;
  xpEarned?: number;
}) => {
  const insets = useSafeAreaInsets();
  return (
  <View style={[styles.resultsContainer, { paddingBottom: insets.bottom }]}>
    {!reviewAnswers && (
      <ScoreBreakdown
        score={score}
        totalQuestions={totalQuestions}
        theme={theme}
        xpEarned={xpEarned}
      />
    )}
    {reviewAnswers && <AnswersReview userAnswers={userAnswers} theme={theme} />}

    <View
      style={[
        styles.bottomButtonsContainer,
        theme === "dark" && { backgroundColor: "#0D0D0D" },
      ]}
    >
      <View style={[styles.navigationButtons, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={[
            styles.resultsButton,
            theme === "dark" && {
              backgroundColor: "#131313",
              borderColor: "#2E3033",
            },
          ]}
          onPress={onToggleReview}
        >
          <Text
            style={[
              styles.resultsButtonText,
              theme === "dark" && { color: "#E0E0E0" },
            ]}
          >
            {reviewAnswers ? "Hide Answers" : "Review Answers"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.resultsButton,
            styles.resultsButtonPrimary,
            theme === "dark" && {
              backgroundColor: "#00FF80",
              borderColor: "#00FF80",
            },
          ]}
          onPress={onReturnToQuizzes}
        >
          <Text
            style={[
              styles.resultsButtonText,
              styles.resultsButtonTextPrimary,
              theme === "dark" && { color: "#000" },
            ]}
          >
            Return to Quizzes
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);
};

const styles = StyleSheet.create({
  resultsContainer: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    marginTop: 40,
  },
  medalImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  quizResult: {
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    fontWeight: "700",
    lineHeight: 30,
    fontSize: 16,
  },
  scoreText: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    lineHeight: 24,
    marginBottom: 10,
  },
  score: {
    fontSize: 32,
    fontWeight: "700",
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    textAlign: "center",
    lineHeight: 48,
    marginBottom: 20,
  },
  resultsMessage: {
    fontSize: 16,
    color: "#61728C",
    fontFamily: "Satoshi-Regular",
    textAlign: "center",
    marginBottom: 30,
  },
  xpContainer: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    flexDirection: "row",
    justifyContent: "center",
    alignContent: "center",
    marginTop: 10,
  },
  xpImage: {
    width: 50,
    height: 50,
  },
  fullScreenAnswers: {
    width: "100%",
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  answersTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    marginBottom: 15,
  },
  answersList: {
    width: "100%",
    flex: 1,
  },
  answersListContent: {
    paddingBottom: 80,
  },
  answerItem: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF3FC",
  },
  answerQuestion: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    marginBottom: 5,
  },
  answerDetails: {
    marginLeft: 10,
  },
  answerText: {
    fontSize: 14,
    fontFamily: "Satoshi-Regular",
    marginBottom: 2,
  },
  correctAnswer: {
    color: "#00FF80",
  },
  wrongAnswer: {
    color: "#FF3B30",
  },
  correctAnswerText: {
    fontSize: 14,
    color: "#00FF80",
    fontFamily: "Satoshi-Regular",
  },
  bottomButtonsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  resultsButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDF3FC",
    minWidth: 120,
  },
  resultsButtonPrimary: {
    backgroundColor: "#00FF80",
    borderColor: "#00FF80",
  },
  resultsButtonText: {
    fontFamily: "Satoshi-Regular",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    color: "#2D3C52",
    textAlign: "center",
  },
  resultsButtonTextPrimary: {
    color: "#000000",
  },
});
