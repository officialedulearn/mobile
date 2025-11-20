import BackButton from "@/components/backButton";
import useUserStore from "@/core/userState";
import { AIService } from "@/services/ai.service";
import { ChatService } from "@/services/chat.service";
import { ActivityService } from "@/services/activity.service";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useCallback, useRef } from "react";
import * as Haptics from 'expo-haptics';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { ProgressBar } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {};

type Question = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
};

type UserAnswer = {
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
};

const Quiz = (props: Props) => {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const [questions, setQuestions] = React.useState<Array<Question>>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [timeLeft, setTimeLeft] = useState(80);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState("");
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [reviewAnswers, setReviewAnswers] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [questionAnswers, setQuestionAnswers] = useState<(string | null)[]>([]);
  const [timerStarted, setTimerStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const aiService = new AIService();
  const chatService = new ChatService();
  const activityService = new ActivityService();

  const { user, updateUserPointsFromQuiz, theme } = useUserStore();
  
  const handleFinishQuizRef = useRef<(() => Promise<void>) | undefined>(undefined);
  
  const requestReviewIfAppropriate = async (score: number) => {
    try {
    
      const isAvailable = await StoreReview.isAvailableAsync();
      if (!isAvailable) return;

      const hasAction = await StoreReview.hasAction();
      if (!hasAction) return;

      const lastReviewRequest = await AsyncStorage.getItem('lastReviewRequest');
      const now = Date.now();
      const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;

      if (lastReviewRequest) {
        const lastRequestTime = parseInt(lastReviewRequest);
        if (now - lastRequestTime < oneWeekInMs) {
          return; 
        }
      }

      await StoreReview.requestReview();
    
      await AsyncStorage.setItem('lastReviewRequest', now.toString());
      
    } catch (error) {
      console.log('Review request failed:', error);
    }
  };


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  React.useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);

        try {
          const chat = await chatService.getChatById(chatId);
          if (chat && chat.title) {
            setChatTitle(chat.title);
          } else {
            setChatTitle("Quiz");
          }
        } catch (chatError) {
          console.error("Error fetching chat:", chatError);
          setChatTitle("Quiz");
        }

        const response = await aiService.generateQuiz({
          chatId,
          userId: user?.id as unknown as string,
        });

        if (Array.isArray(response) && response.length > 0) {
          setQuestions(response);
          setQuestionAnswers(new Array(response.length).fill(null));
        } else {
          console.error("No questions returned from API");
          setError("No quiz questions could be generated from this conversation. Please ensure you had an educational discussion and try again.");
        }

        setLoading(false);
      } catch (error: any) {
        console.error("Error fetching quiz questions:", error);
        setLoading(false);
        
        if (error.name === 'QuizGenerationError' && error.message) {
          setError(error.message);
        } else {
          setError("Something went wrong while generating your quiz. Please try again later.");
        }
      }
    };

    if (chatId && user?.id) {
      fetchQuestions();
    }
  }, [chatId, user?.id, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  useEffect(() => {
    if (questions.length > 0 && !loading && !error && !timerStarted && !quizCompleted) {
      const delayTimer = setTimeout(() => {
        setTimerStarted(true);
      }, 2000);

      return () => clearTimeout(delayTimer);
    }
  }, [questions.length, loading, error, timerStarted, quizCompleted]);

  const handleSelectOption = (option: string) => {
  Haptics.selectionAsync();
    setSelectedOption(option);
    const updatedAnswers = [...questionAnswers];
    updatedAnswers[currentQuestionIndex] = option;
    setQuestionAnswers(updatedAnswers);
  };

  const handlePreviousQuestion = () => {
    Haptics.selectionAsync();
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prevIndex) => prevIndex - 1);
      setSelectedOption(questionAnswers[currentQuestionIndex - 1]);
    }
  };

  const handleNextQuestion = () => {
    Haptics.selectionAsync();
    if (!selectedOption) return;

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);

      setSelectedOption(questionAnswers[currentQuestionIndex + 1] || null);
    }
  };

  const handleFinishQuiz = useCallback(async () => {
    if (!questions.length || isSubmitting) return;

    setIsSubmitting(true);

    const quizAnswers = questions.map((question, index) => ({
      question: question.question,
      selectedAnswer: questionAnswers[index] || '',
      correctAnswer: question.correctAnswer,
    }));

    try {
      const result = await activityService.submitQuiz({
        userId: user?.id as string,
        chatId: chatId,
        title: chatTitle || "Quiz",
        answers: quizAnswers,
      });

      const userAnswersList: UserAnswer[] = result.validatedAnswers.map((answer: any) => ({
        question: answer.question,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: answer.correctAnswer,
        isCorrect: answer.isCorrect,
      }));

      setUserAnswers(userAnswersList);
      setScore(result.score);

      updateUserPointsFromQuiz(result.xpEarned);

      if(result.score > 2) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setQuizCompleted(true);

      setTimeout(() => {
        requestReviewIfAppropriate(result.score);
      }, 2000);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      setQuizCompleted(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [questions, questionAnswers, user?.id, chatId, chatTitle, activityService, isSubmitting]);

  useEffect(() => {
    handleFinishQuizRef.current = handleFinishQuiz;
  }, [handleFinishQuiz]);

  useEffect(() => {
    if (quizCompleted || !timerStarted) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleFinishQuizRef.current?.();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizCompleted, timerStarted]);

  const renderQuizContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FF80" />
          <Text style={[styles.loadingText, theme === "dark" && { color: "#B3B3B3" }]}>Loading quiz questions...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, theme === "dark" && { color: "#B3B3B3" }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.returnButton, theme === "dark" && { backgroundColor: "#00FF80" }]}
            onPress={handleRetry}
          >
            <Text style={[styles.returnButtonText, theme === "dark" && { color: "#000" }]}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.returnButton, theme === "dark" && { backgroundColor: "#00FF80" }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.returnButtonText, theme === "dark" && { color: "#000" }]}>Return to Quizzes</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (questions.length === 0 && !loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, theme === "dark" && { color: "#B3B3B3" }]}>
            No questions available. Please try again later.
          </Text>
          <TouchableOpacity
            style={[styles.returnButton, theme === "dark" && { backgroundColor: "#00FF80" }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.returnButtonText, theme === "dark" && { color: "#000" }]}>Return to Quizzes</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (quizCompleted) {
      return (
        <View style={styles.resultsContainer}>
          {!reviewAnswers && (
            <>
              <Text style={[styles.quizResult, { marginBottom: 15 }, theme === "dark" && { color: "#E0E0E0" }]}>
                Quiz Result
              </Text>
              <Image
                source={
                  score >= questions.length / 2
                    ? require("@/assets/images/Trophy.png")
                    : require("@/assets/images/trophy-red.png")
                }
                style={styles.medalImage}
              />
              {score >= questions.length / 2 ? (
                <Text style={[styles.quizResult, theme === "dark" && { color: "#E0E0E0" }]}>Congratulations</Text>
              ) : (
                <Text style={[styles.quizResult, theme === "dark" && { color: "#E0E0E0" }]}>
                  Don't worry, learning is a journey.
                </Text>
              )}

<Text style={[styles.resultsMessage, theme === "dark" && { color: "#B3B3B3" }]}>
                {score >= questions.length / 2
                  ? "You're one step closer to your next badge. Keep the momentum going! Want to sharpen your skills even more? Try a follow-up quiz or review your answers."
                  : "You got" +
                    score +
                    " out of 1o, which means there's room to grow. You still earned 2 XP just for trying, and now you know where to improve. Review your answers and give it another go. You've got this!"}
              </Text>

              <Text style={[styles.scoreText, { marginTop: 10 }, theme === "dark" && { color: "#E0E0E0" }]}>
                Your Score
              </Text>

              <Text style={[styles.score, theme === "dark" && { color: "#E0E0E0" }]}>
                {score >= questions.length / 2 ? (
                  <Text style={{ color: "#00FF80" }}>{score}</Text>
                ) : (
                  score
                )}
                /{questions.length}
              </Text>

              <Text style={[styles.scoreText, theme === "dark" && { color: "#E0E0E0" }]}>Earned XP</Text>
              <View style={styles.xpContainer}>
                <Image
                  source={require("@/assets/images/icons/medal-05.png")}
                  style={styles.xpImage}
                />

                <Text style={[styles.score, theme === "dark" && { color: "#E0E0E0" }]}>+{score}XP</Text>
              </View>
            </>
          )}
          {reviewAnswers && (
            <View style={[styles.fullScreenAnswers, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}>
              <Text style={[styles.answersTitle, theme === "dark" && { color: "#E0E0E0" }]}>Your Answers:</Text>
              <ScrollView style={styles.answersList} contentContainerStyle={styles.answersListContent}>
                {userAnswers.map((answer, index) => (
                  <View key={index} style={[styles.answerItem, theme === "dark" && { borderBottomColor: "#2E3033" }]}>
                    <Text style={[styles.answerQuestion, theme === "dark" && { color: "#E0E0E0" }]} numberOfLines={2}>
                      {index + 1}. {answer.question}
                    </Text>
                    <View style={styles.answerDetails}>
                      <Text
                        style={[
                          styles.answerText,
                          answer.isCorrect
                            ? styles.correctAnswer
                            : styles.wrongAnswer,
                        ]}
                      >
                        Your answer: {answer.selectedAnswer ? answer.selectedAnswer : <Text style={{ fontStyle: 'italic', opacity: 0.6 }}>Not answered</Text>}
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
          )}

          <View style={[styles.bottomButtonsContainer, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
            <View style={styles.navigationButtons}>
              <TouchableOpacity
                style={[
                  styles.resultsButton,
                  theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }
                ]}
                onPress={() => setReviewAnswers(!reviewAnswers)}
              >
                <Text style={[styles.resultsButtonText, theme === "dark" && { color: "#E0E0E0" }]}>
                  {reviewAnswers ? "Hide Answers" : "Review Answers"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.resultsButton, 
                  styles.resultsButtonPrimary,
                  theme === "dark" && { backgroundColor: "#00FF80", borderColor: "#00FF80" }
                ]}
                onPress={() => router.back()}
              >
                <Text style={[styles.resultsButtonText, styles.resultsButtonTextPrimary, theme === "dark" && { color: "#000" }]}>
                  Return to Quizzes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, theme === "dark" && { color: "#B3B3B3" }]}>Question not available</Text>
        </View>
      );
    }

    return (
      <View style={styles.questionContainer}>
        <Text style={[styles.question, theme === "dark" && { color: "#E0E0E0" }]}>{currentQuestion.question}</Text>

        <View style={styles.options}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionItem,
                theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" },
                selectedOption === option ? [
                  styles.selectedOption,
                  theme === "dark" && { backgroundColor: "rgba(0, 255, 128, 0.1)", borderColor: "#00FF80" }
                ] : {},
              ]}
              onPress={() => handleSelectOption(option)}
            >
              <View
                style={[
                  styles.radioButton,
                  theme === "dark" && { borderColor: "#B3B3B3" },
                  selectedOption === option ? styles.radioButtonSelected : {},
                ]}
              >
                {selectedOption === option && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
              <Text
                style={[
                  styles.optionText,
                  theme === "dark" && { color: "#E0E0E0" },
                  selectedOption === option ? styles.selectedOptionText : {},
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.bottomButtonsContainer, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.prevButton,
                theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" },
                currentQuestionIndex === 0 ? styles.disabledButton : {},
              ]}
              onPress={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <Text style={[styles.navButtonText, theme === "dark" && { color: "#E0E0E0" }]}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navButton,
                styles.nextButton,
                theme === "dark" && { backgroundColor: "#00FF80" },
                (!selectedOption || isSubmitting) ? styles.disabledButton : {},
              ]}
              disabled={!selectedOption || isSubmitting}
              onPress={
                currentQuestionIndex < questions.length - 1
                  ? handleNextQuestion
                  : handleFinishQuiz
              }
            >
              <Text style={[styles.navButtonText, styles.nextButtonText, theme === "dark" && { color: "#000" }]}>
                {isSubmitting 
                  ? "Submitting..." 
                  : currentQuestionIndex < questions.length - 1
                    ? "Next"
                    : "Finish Quiz"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const calculateProgress = () => {
    if (!questions.length) return 0;
    const progress = (currentQuestionIndex + 1) / questions.length;
    return Math.min(Math.max(progress, 0), 1);
  };

  return (
    <View style={[styles.container, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
      {theme === "dark" ? <StatusBar style="light" /> : <StatusBar style="dark" />}
      <View style={[styles.topNav, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
        <BackButton />
        <Text style={[styles.header, theme === "dark" && { color: "#E0E0E0" }]}>
          {quizCompleted ? "Quiz Results" : "Ongoing quiz"}
        </Text>
      </View>

      {!quizCompleted && questions.length > 0 && (
        <>
          <View style={styles.metrics}>
            <View>
              <Text style={[styles.metricText, theme === "dark" && { color: "#B3B3B3" }]}>Question</Text>
              <Text style={[styles.questionsText, theme === "dark" && { color: "#E0E0E0" }]}>
                {currentQuestionIndex + 1} of {questions.length}
              </Text>
            </View>

            <View style={styles.timeContainer}>
              <Text style={[styles.metricText, theme === "dark" && { color: "#B3B3B3" }]}>Time Left</Text>
              <Text
                style={[
                  styles.timeLeft,
                  timeLeft < 10 ? styles.timeWarning : null,
                ]}
              >
                {formatTime(timeLeft)}
              </Text>
            </View>
          </View>

          <ProgressBar
            progress={calculateProgress()}
            color="#00FF80"
            style={{ 
              height: 10, 
              borderRadius: 5, 
              marginVertical: 20,
              backgroundColor: theme === "dark" ? "#2E3033" : "#EDF3FC"
            }}
          />
        </>
      )}

      {renderQuizContent()}
    </View>
  );
};

export default Quiz;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F9FBFC",
    flex: 1,
    paddingHorizontal: 20,
  },
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
    fontFamily: "Satoshi",
    color: "#2D3C52",
  },
  metricText: {
    color: "#61728C",
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 26,
  },
  questionsText: {
    color: "#2D3C52",
    fontFamily: "Satoshi",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 30,
  },
  metrics: {
    justifyContent: "space-between",
    flexDirection: "row",
    marginBottom: 10,
  },
  timeContainer: {
    alignItems: "flex-end",
  },
  timeLeft: {
    color: "#f00",
    fontFamily: "Satoshi",
    textTransform: "uppercase",
    lineHeight: 24,
    fontWeight: "500",
    fontSize: 14,
  },
  timeWarning: {
    color: "#ff0000",
  },
  quizResult: {
    color: "#2D3C52",
    fontFamily: "Satoshi",
    fontWeight: "700",
    lineHeight: 30,
    fontSize: 16,
  },
  questionContainer: {
    flex: 1,
  },
  question: {
    color: "#2D3C52",
    lineHeight: 30,
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Satoshi",
    marginBottom: 20,
  },
  options: {
    marginTop: 10,
  },
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
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "400",
    flex: 1,
  },
  selectedOptionText: {
    fontWeight: "500",
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
  navButtonText: {
    fontFamily: "Satoshi",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "Satoshi",
    fontSize: 16,
    color: "#61728C",
  },
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
  scoreText: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
    color: "#2D3C52",
    fontFamily: "Satoshi",
    lineHeight: 24,
    marginBottom: 10,
  },
  resultsMessage: {
    fontSize: 16,
    color: "#61728C",
    fontFamily: "Satoshi",
    textAlign: "center",
    marginBottom: 30,
  },
  answersContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EDF3FC",
    maxHeight: 300,
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
    fontFamily: "Satoshi",
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
  score: {
    fontSize: 32,
    fontWeight: "700",
    color: "#2D3C52",
    fontFamily: "Satoshi",
    textAlign: "center",
    lineHeight: 48,
    marginBottom: 20,
  },
  answerQuestion: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2D3C52",
    fontFamily: "Satoshi",
    marginBottom: 5,
  },
  answerDetails: {
    marginLeft: 10,
  },
  answerText: {
    fontSize: 14,
    fontFamily: "Satoshi",
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
    fontFamily: "Satoshi",
  },
  returnButton: {
    backgroundColor: "#000",
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    width: "80%",
  },
  returnButtonText: {
    color: "#00FF80",
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomButtonsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
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
  reviewButton: {
    backgroundColor: "#F0FFF9",
    borderWidth: 1,
    borderColor: "#00FF80",
  },
  reviewButtonText: {
    color: "#00FF80",
  },
  returnQuizButton: {
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  returnQuizButtonText: {
    color: "#FF3B30",
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
    fontFamily: "Satoshi",
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
