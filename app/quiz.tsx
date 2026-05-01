import BackButton from "@/components/common/backButton";
import { QuizErrorScreen } from "@/components/quiz/QuizErrorScreen";
import { QuizLoadingScreen } from "@/components/quiz/QuizLoadingScreen";
import { QuizProgress } from "@/components/quiz/QuizProgress";
import { QuizQuestionsScreen } from "@/components/quiz/QuizQuestionsScreen";
import QuizRefreshModal from "@/components/quiz/QuizRefreshModal";
import { QuizResultsScreen } from "@/components/quiz/QuizResultsScreen";
import useChatStore from "@/core/chatState";
import useQuizStore from "@/core/quizState";
import useUserStore from "@/core/userState";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as StoreReview from "expo-store-review";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

const Quiz = () => {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const [chatTitle, setChatTitle] = useState("");
  const [timeLeft, setTimeLeft] = useState(90);
  const [timerStarted, setTimerStarted] = useState(false);
  const [reviewAnswers, setReviewAnswers] = useState(false);
  const [showQuizRefreshModal, setShowQuizRefreshModal] = useState(false);

  const { user, updateUserPointsFromQuiz, theme } = useUserStore();
  const { fetchChatById } = useChatStore();
  const quizState = useQuizStore();
  const handleFinishQuizRef = useRef<(() => Promise<void>) | undefined>(undefined);

  useEffect(() => {
    const fetch = async () => {
      try {
        const chat = await fetchChatById(chatId);
        setChatTitle(chat?.title || "Quiz");
      } catch {
        setChatTitle("Quiz");
      }
      await quizState.generateQuiz(chatId, user?.id as string);
    };
    if (chatId && user?.id) fetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, user?.id]);

  useEffect(() => {
    if (quizState.questions.length > 0 && !quizState.loading && !timerStarted && !quizState.quizCompleted) {
      setTimeout(() => setTimerStarted(true), 1000);
    }
  }, [quizState.questions.length, quizState.loading, timerStarted, quizState.quizCompleted]);

  const handleFinish = useCallback(async () => {
    if (!quizState.questions.length) return;
    try {
      const result = await quizState.submitQuizAnswers(user?.id as string, chatId, chatTitle);
      updateUserPointsFromQuiz(result.xpEarned);
      Haptics.notificationAsync(result.score > 2 ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
      setTimeout(async () => {
        try {
          if (await StoreReview.isAvailableAsync() && await StoreReview.hasAction()) {
            const last = await AsyncStorage.getItem("lastReviewRequest");
            if (!last || Date.now() - parseInt(last) > 7 * 24 * 60 * 60 * 1000) {
              await StoreReview.requestReview();
              await AsyncStorage.setItem("lastReviewRequest", Date.now().toString());
            }
          }
        } catch {}
      }, 2000);
    } catch (err) {
    }
  }, [quizState, user?.id, chatId, chatTitle, updateUserPointsFromQuiz]);

  useEffect(() => {
    handleFinishQuizRef.current = handleFinish;
  }, [handleFinish]);

  useEffect(() => {
    if (quizState.quizCompleted || !timerStarted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishQuizRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quizState.quizCompleted, timerStarted]);

  const renderContent = () => {
    if (quizState.loading) return <QuizLoadingScreen theme={theme} />;
    if (quizState.error && quizState.error !== "quiz_limit") {
      return <QuizErrorScreen error={quizState.error} theme={theme} onRetry={() => quizState.generateQuiz(chatId, user?.id as string)} onReturn={() => router.back()} />;
    }
    if (!quizState.questions.length) {
      return <View style={styles.container}><Text style={[styles.text, theme === "dark" && { color: "#B3B3B3" }]}>No questions available</Text></View>;
    }
    if (quizState.quizCompleted) {
      return <QuizResultsScreen reviewAnswers={reviewAnswers} score={quizState.score} totalQuestions={quizState.questions.length} userAnswers={quizState.userAnswers} theme={theme} onToggleReview={() => setReviewAnswers(!reviewAnswers)} onReturnToQuizzes={() => { quizState.clearQuiz(); router.back(); }} />;
    }
    const q = quizState.questions[quizState.currentQuestionIndex];
    return q ? <QuizQuestionsScreen question={q} selectedOption={quizState.selectedAnswers[quizState.currentQuestionIndex] || null} currentIndex={quizState.currentQuestionIndex} totalQuestions={quizState.questions.length} isSubmitting={false} theme={theme} onSelectOption={quizState.selectAnswer} onPrevious={() => quizState.goToQuestion(quizState.currentQuestionIndex - 1)} onNext={() => quizState.goToQuestion(quizState.currentQuestionIndex + 1)} onFinish={handleFinish} /> : <View style={styles.container}><Text style={[styles.text, theme === "dark" && { color: "#B3B3B3" }]}>Loading...</Text></View>;
  };

  return (
    <View style={[styles.container, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
      {theme === "dark" ? <StatusBar style="light" /> : <StatusBar style="dark" />}
      <View style={[styles.topNav, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
        <BackButton />
        <Text style={[styles.header, theme === "dark" && { color: "#E0E0E0" }]}>{quizState.quizCompleted ? "Quiz Results" : "Ongoing quiz"}</Text>
      </View>
      {!quizState.quizCompleted && quizState.questions.length > 0 && <QuizProgress currentIndex={quizState.currentQuestionIndex} totalQuestions={quizState.questions.length} timeLeft={timeLeft} theme={theme} />}
      {renderContent()}
      <QuizRefreshModal visible={showQuizRefreshModal} onClose={() => setShowQuizRefreshModal(false)} onSuccess={() => { setShowQuizRefreshModal(false); useUserStore.getState().setUserAsync(); }} />
    </View>
  );
};

export default Quiz;

const styles = StyleSheet.create({
  container: { backgroundColor: "#F9FBFC", flex: 1, paddingHorizontal: 20 },
  topNav: { flexDirection: "row", alignItems: "center", gap: 20, paddingVertical: 10, marginTop: 50, marginBottom: 20 },
  header: { fontSize: 24, fontWeight: "500", fontFamily: "Satoshi-Regular", color: "#2D3C52" },
  text: { fontFamily: "Satoshi-Regular", fontSize: 16, color: "#61728C", textAlign: "center", marginTop: 15 },
});
