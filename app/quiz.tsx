import BackButton from "@/components/backButton";
import useActivityStore from "@/core/activityState";
import useUserStore from "@/core/userState";
import { AIService } from "@/services/ai.service";
import { ChatService } from "@/services/chat.service";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
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
  const [timeLeft, setTimeLeft] = useState(60);
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

  const aiService = new AIService();
  const chatService = new ChatService();

  const { user, updateUserPoints } = useUserStore();
  const { addActivity } = useActivityStore();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleFinishQuiz(); 
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

    fetchQuestions();
  }, [chatId, user?.id, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleSelectOption = (option: string) => {
    setSelectedOption(option);

    const updatedAnswers = [...questionAnswers];
    updatedAnswers[currentQuestionIndex] = option;
    setQuestionAnswers(updatedAnswers);
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prevIndex) => prevIndex - 1);
      setSelectedOption(questionAnswers[currentQuestionIndex - 1]);
    }
  };

  const handleNextQuestion = () => {
    if (!selectedOption) return;

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);

      setSelectedOption(questionAnswers[currentQuestionIndex + 1] || null);
    }
  };

  const handleFinishQuiz = async () => {
    if (!questions.length) return;

    const userAnswersList: UserAnswer[] = [];
    let correctCount = 0;

    questions.forEach((question, index) => {
      const selectedAnswer = questionAnswers[index];
      if (!selectedAnswer) return;

      const isCorrect = selectedAnswer === question.correctAnswer;
      if (isCorrect) correctCount++;

      userAnswersList.push({
        question: question.question,
        selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
      });
    });

    setUserAnswers(userAnswersList);
    setScore(correctCount);
    setQuizCompleted(true);

    try {
      const activityData = {
        userId: user?.id as string,
        xpEarned: correctCount,
        title: chatTitle || "Quiz",
        type: "quiz" as const,
      };

      // updateUserPoints(activityData);

      await addActivity(activityData);
    } catch (error) {
      console.error("Error saving quiz result:", error);
    }
  };

  const renderQuizContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FF80" />
          <Text style={styles.loadingText}>Loading quiz questions...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{error}</Text>
          <TouchableOpacity
            style={styles.returnButton}
            onPress={handleRetry}
          >
            <Text style={styles.returnButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.returnButton}
            onPress={() => router.back()}
          >
            <Text style={styles.returnButtonText}>Return to Quizzes</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (questions.length === 0 && !loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            No questions available. Please try again later.
          </Text>
          <TouchableOpacity
            style={styles.returnButton}
            onPress={() => router.back()}
          >
            <Text style={styles.returnButtonText}>Return to Quizzes</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (quizCompleted) {
      return (
        <View style={styles.resultsContainer}>
          {!reviewAnswers && (
            <>
              <Text style={[styles.quizResult, { marginBottom: 15 }]}>
                Quiz Result
              </Text>
              <Image
                source={
                  score >= 3
                    ? require("@/assets/images/Trophy.png")
                    : require("@/assets/images/trophy-red.png")
                }
                style={styles.medalImage}
              />
              {score >= 3 ? (
                <Text style={styles.quizResult}></Text>
              ) : (
                <Text style={styles.quizResult}>
                  Don't worry, learning is a journey.
                </Text>
              )}
              <Text style={[styles.scoreText, { marginTop: 10 }]}>
                Your Score
              </Text>

              <Text style={styles.score}>
                {score >= 3 ? (
                  <Text style={{ color: "#" }}>{score}</Text>
                ) : (
                  score
                )}
                /5
              </Text>

              <Text style={styles.resultsMessage}>
                {score >= 3
                  ? "You're one step closer to your next badge. Keep the momentum going!Want to sharpen your skills even more? Try a follow-up quiz or review your answers."
                  : "You got" +
                    score +
                    " out of 5, which means there's room to grow. You still earned 2 XP just for trying, and now you know where to improve. Review your answers and give it another go. You've got this!"}
              </Text>

              <Text style={styles.scoreText}>Earned XP</Text>
              <View style={styles.xpContainer}>
                <Image
                  source={require("@/assets/images/icons/medal-05.png")}
                  style={styles.xpImage}
                />

                <Text style={styles.score}>+{score}XP</Text>
              </View>
            </>
          )}
          {reviewAnswers && (
            <View style={styles.fullScreenAnswers}>
              <Text style={styles.answersTitle}>Your Answers:</Text>
              <ScrollView style={styles.answersList} contentContainerStyle={styles.answersListContent}>
                {userAnswers.map((answer, index) => (
                  <View key={index} style={styles.answerItem}>
                    <Text style={styles.answerQuestion} numberOfLines={2}>
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
                        Your answer: {answer.selectedAnswer}
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

          <View style={styles.bottomButtonsContainer}>
            <View style={styles.navigationButtons}>
              <TouchableOpacity
                style={[styles.navButton, styles.prevButton]}
                onPress={() => setReviewAnswers(!reviewAnswers)}
              >
                <Text style={styles.navButtonText}>
                  {reviewAnswers ? "Hide Answers" : " Answers"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navButton, styles.nextButton]}
                onPress={() => router.back()}
              >
                <Text style={[styles.navButtonText, styles.nextButtonText]}>
                  Return 
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
          <Text style={styles.loadingText}>Question not available</Text>
        </View>
      );
    }

    return (
      <View style={styles.questionContainer}>
        <Text style={styles.question}>{currentQuestion.question}</Text>

        <View style={styles.options}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionItem,
                selectedOption === option ? styles.selectedOption : {},
              ]}
              onPress={() => handleSelectOption(option)}
            >
              <View
                style={[
                  styles.radioButton,
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
                  selectedOption === option ? styles.selectedOptionText : {},
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomButtonsContainer}>
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.prevButton,
                currentQuestionIndex === 0 ? styles.disabledButton : {},
              ]}
              onPress={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navButton,
                styles.nextButton,
                !selectedOption ? styles.disabledButton : {},
              ]}
              disabled={!selectedOption}
              onPress={
                currentQuestionIndex < questions.length - 1
                  ? handleNextQuestion
                  : handleFinishQuiz
              }
            >
              <Text style={[styles.navButtonText, styles.nextButtonText]}>
                {currentQuestionIndex < questions.length - 1
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
    <View style={styles.container}>
      <View style={styles.topNav}>
        <BackButton />
        <Text style={styles.header}>
          {quizCompleted ? "Quiz Results" : "Ongoing quiz"}
        </Text>
      </View>

      {!quizCompleted && questions.length > 0 && (
        <>
          <View style={styles.metrics}>
            <View>
              <Text style={styles.metricText}>Question</Text>
              <Text style={styles.questionsText}>
                {currentQuestionIndex + 1} of {questions.length}
              </Text>
            </View>

            <View style={styles.timeContainer}>
              <Text style={styles.metricText}>Time Left</Text>
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
            style={{ height: 10, borderRadius: 5, marginVertical: 20 }}
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
    marginTop: 20,
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
    color: "#000", // Default color
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
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#F9FBFC",
    width: "100%",
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
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
});
