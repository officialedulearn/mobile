import BackButton from "@/components/common/backButton";
import ScreenLoader from "@/components/common/ScreenLoader";
import { QuizErrorScreen } from "@/components/quiz/QuizErrorScreen";
import { QuizLoadingScreen } from "@/components/quiz/QuizLoadingScreen";
import { QuizProgress } from "@/components/quiz/QuizProgress";
import { QuizQuestionsScreen } from "@/components/quiz/QuizQuestionsScreen";
import { QuizResultsScreen } from "@/components/quiz/QuizResultsScreen";
import type { Question, UserAnswer } from "@/core/quizState";
import usePublicQuizStore from "@/core/quizStore";
import useUserStore from "@/core/userState";
import { createPublicQuizDeepLink } from "@/utils/quizLinks";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Image,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Presets } from "react-native-pulsar";

export default function PublicQuizDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const quizId = useMemo(
    () =>
      typeof id === "string" ? id : Array.isArray(id) ? (id[0] ?? "") : "",
    [id],
  );

  const userId = useUserStore((s) => s.user?.id);
  const theme = useUserStore((s) => s.theme);
  const updateUserPointsFromQuiz = useUserStore(
    (s) => s.updateUserPointsFromQuiz,
  );
  const {
    fetchQuiz,
    joinQuiz,
    submitQuiz,
    quiz,
    quizLoading,
    quizError,
    clearParticipation,
  } = usePublicQuizStore();

  const detail = quizId ? quiz[quizId] : undefined;
  const loading = quizId ? quizLoading[quizId] : false;

  const questions: Question[] = useMemo(() => {
    const list = detail?.questions;
    if (!list?.length) return [];
    return list.map((q) => ({
      question: q.question,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    }));
  }, [detail]);

  const [sessionReady, setSessionReady] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(string | null)[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [reviewAnswers, setReviewAnswers] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [timerStarted, setTimerStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resultScore, setResultScore] = useState(0);
  const [resultXp, setResultXp] = useState(0);
  const [resultUserAnswers, setResultUserAnswers] = useState<UserAnswer[]>([]);

  const initRef = useRef<string | null>(null);
  const handleFinishRef = useRef<(() => Promise<void>) | undefined>(undefined);

  useEffect(() => {
    initRef.current = null;
  }, [quizId]);

  useEffect(() => {
    return () => {
      if (quizId) clearParticipation(quizId);
    };
  }, [quizId, clearParticipation]);

  useEffect(() => {
    if (!quizId || !userId) return;
    let cancelled = false;
    setSessionReady(false);
    (async () => {
      try {
        await fetchQuiz(quizId);
        if (cancelled) return;
        await joinQuiz(quizId);
        if (!cancelled) setSessionReady(true);
      } catch {
        if (!cancelled) setSessionReady(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [quizId, userId, fetchQuiz, joinQuiz]);

  useEffect(() => {
    if (!quizId || !detail?.questions?.length) return;
    if (initRef.current === quizId) return;
    initRef.current = quizId;
    setSelectedAnswers(detail.questions.map(() => null));
    setCurrentQuestionIndex(0);
    setQuizCompleted(false);
    setReviewAnswers(false);
    setTimerStarted(false);
    setTimeLeft(90);
    setSubmitError(null);
    setResultUserAnswers([]);
  }, [quizId, detail]);

  useEffect(() => {
    if (
      questions.length > 0 &&
      sessionReady &&
      !loading &&
      !quizCompleted &&
      !timerStarted
    ) {
      const t = setTimeout(() => setTimerStarted(true), 1000);
      return () => clearTimeout(t);
    }
  }, [questions.length, sessionReady, loading, quizCompleted, timerStarted]);

  useEffect(() => {
    if (quizCompleted || !timerStarted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          void handleFinishRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quizCompleted, timerStarted]);

  const selectAnswer = useCallback(
    (option: string) => {
      setSelectedAnswers((prev) => {
        const next = [...prev];
        next[currentQuestionIndex] = option;
        return next;
      });
    },
    [currentQuestionIndex],
  );

  const goToQuestion = useCallback(
    (index: number) => {
      setCurrentQuestionIndex(
        Math.max(0, Math.min(index, questions.length - 1)),
      );
    },
    [questions.length],
  );

  const handleFinish = useCallback(async () => {
    if (
      !quizId ||
      !userId ||
      !questions.length ||
      isSubmitting ||
      quizCompleted
    )
      return;
    const participationId =
      usePublicQuizStore.getState().participationByQuiz[quizId];
    if (!participationId) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await submitQuiz(quizId, {
        userId: userId as string,
        participationId,
        answers: questions.map((_, i) => ({
          questionIndex: i,
          selectedAnswer: selectedAnswers[i] ?? "",
        })),
      });

      updateUserPointsFromQuiz(response.xpEarned);
      const ua: UserAnswer[] = response.results.map((r) => ({
        question: questions[r.questionIndex]?.question ?? "",
        selectedAnswer: r.selectedAnswer,
        correctAnswer: r.correctAnswer,
        isCorrect: r.isCorrect,
      }));
      setResultUserAnswers(ua);
      setResultScore(response.score);
      setResultXp(response.xpEarned);
      setQuizCompleted(true);
      response.score <= 4 ? Presets.alarm() : Presets.ascent();
    } catch {
      setSubmitError(
        usePublicQuizStore.getState().quizError ?? "Could not submit quiz",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    quizId,
    userId,
    questions,
    isSubmitting,
    quizCompleted,
    selectedAnswers,
    submitQuiz,
    updateUserPointsFromQuiz,
  ]);

  useEffect(() => {
    handleFinishRef.current = handleFinish;
  }, [handleFinish]);

  const retryLoad = useCallback(async () => {
    if (!quizId || !userId) return;
    setSessionReady(false);
    try {
      await fetchQuiz(quizId);
      await joinQuiz(quizId);
      setSessionReady(true);
    } catch {
      setSessionReady(false);
    }
  }, [quizId, userId, fetchQuiz, joinQuiz]);

  const shareQuiz = useCallback(async () => {
    if (!quizId) return;
    const title = detail?.title ?? "EduLearn quiz";
    const url = createPublicQuizDeepLink(quizId);
    await Share.share({
      title,
      message: `Try this EduLearn quiz: ${url}`,
      url,
    });
  }, [detail?.title, quizId]);

  const renderBody = () => {
    if (!userId) {
      return (
        <View style={styles.centerBlock}>
          <Text
            style={[
              styles.fallbackText,
              theme === "dark" && { color: "#B3B3B3" },
            ]}
          >
            Sign in to take this quiz.
          </Text>
        </View>
      );
    }

    if (quizError && !sessionReady) {
      return (
        <QuizErrorScreen
          error={quizError}
          theme={theme}
          onRetry={retryLoad}
          onReturn={() => router.back()}
        />
      );
    }

    if (
      !quizCompleted &&
      !quizError &&
      !isSubmitting &&
      (!detail || loading || !sessionReady)
    ) {
      return <QuizLoadingScreen theme={theme} />;
    }

    if (!loading && detail && !questions.length) {
      return (
        <View style={styles.centerBlock}>
          <Text
            style={[
              styles.fallbackText,
              theme === "dark" && { color: "#B3B3B3" },
            ]}
          >
            No questions available.
          </Text>
        </View>
      );
    }

    if (quizCompleted) {
      return (
        <QuizResultsScreen
          reviewAnswers={reviewAnswers}
          score={resultScore}
          totalQuestions={questions.length}
          userAnswers={resultUserAnswers}
          theme={theme}
          xpEarned={resultXp}
          onToggleReview={() => setReviewAnswers(!reviewAnswers)}
          onReturnToQuizzes={() => router.back()}
        />
      );
    }

    const q = questions[currentQuestionIndex];
    return q ? (
      <QuizQuestionsScreen
        question={q}
        selectedOption={selectedAnswers[currentQuestionIndex] ?? null}
        currentIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        isSubmitting={isSubmitting}
        theme={theme}
        onSelectOption={selectAnswer}
        onPrevious={() => goToQuestion(currentQuestionIndex - 1)}
        onNext={() => goToQuestion(currentQuestionIndex + 1)}
        onFinish={handleFinish}
      />
    ) : (
      <View style={styles.centerBlock}>
        <Text
          style={[
            styles.fallbackText,
            theme === "dark" && { color: "#B3B3B3" },
          ]}
        >
          Loading...
        </Text>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        theme === "dark" && { backgroundColor: "#0D0D0D" },
      ]}
    >
      {theme === "dark" ? (
        <StatusBar style="light" />
      ) : (
        <StatusBar style="dark" />
      )}
      <View
        style={[
          styles.topNav,
          theme === "dark" && { backgroundColor: "#0D0D0D" },
        ]}
      >
        <BackButton />
        <Text style={[styles.header, theme === "dark" && { color: "#E0E0E0" }]}>
          {quizCompleted ? "Quiz Results" : "Ongoing quiz"}
        </Text>
        <TouchableOpacity
          style={[
            styles.shareButton,
            theme === "dark" && styles.shareButtonDark,
          ]}
          onPress={shareQuiz}
          activeOpacity={0.8}
        >
          <Image
            source={require("@/assets/images/icons/share.png")}
            style={[
              styles.shareIcon,
              theme === "dark" && { tintColor: "#00FF80" },
            ]}
          />
        </TouchableOpacity>
      </View>
      {submitError ? (
        <Text
          style={[styles.submitErr, theme === "dark" && { color: "#FF6B6B" }]}
        >
          {submitError}
        </Text>
      ) : null}
      {!quizCompleted && questions.length > 0 && sessionReady && !loading ? (
        <QuizProgress
          currentIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          timeLeft={timeLeft}
          theme={theme}
        />
      ) : null}
      {renderBody()}
      <ScreenLoader visible={isSubmitting} message="Submitting quiz..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F9FBFC", flex: 1, paddingHorizontal: 20 },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingVertical: 10,
    marginTop: 50,
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "500",
    fontFamily: "Satoshi-Regular",
    color: "#2D3C52",
    flex: 1,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 0.5,
    borderColor: "#EDF3FC",
  },
  shareButtonDark: {
    backgroundColor: "#131313",
    borderColor: "#2E3033",
  },
  shareIcon: {
    width: 19,
    height: 19,
    resizeMode: "contain",
  },
  fallbackText: {
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    color: "#61728C",
    textAlign: "center",
    marginTop: 15,
  },
  centerBlock: { flex: 1, justifyContent: "center" },
  submitErr: {
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "Satoshi-Regular",
    fontSize: 14,
  },
});
