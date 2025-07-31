import BackButton from "@/components/backButton";
import useUserStore from "@/core/userState";
import { AIService } from "@/services/ai.service";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {};

const Quiz = (props: Props) => {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const [questions, setQuestions] = React.useState<Array<any>>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [timeLeft, setTimeLeft] = useState(60); 
  const aiService = new AIService();
  const user = useUserStore((s) => s.user);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          // Handle time up scenario
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Cleanup timer on component unmount
    return () => clearInterval(timer);
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  React.useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await aiService.generateQuiz({
          chatId,
          userId: user?.id as unknown as string,
        });
        setQuestions(response);
      } catch (error) {
        console.error("Error fetching quiz questions:", error);
      }
    };

    fetchQuestions();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.topNav}>
        <BackButton />
        <Text style={styles.header}>Ongoing quiz</Text>
      </View>

      <View style={styles.metrics}>
        <View>
          <Text style={styles.metricText}>Question</Text>
          <Text style={styles.questionsText}>{currentQuestionIndex} of 5</Text>
        </View>

        <View style={styles.timeContainer}>
          <Text style={styles.metricText}>Time Left</Text>
          <Text style={[
            styles.timeLeft,
            timeLeft < 10 ? styles.timeWarning : null
          ]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default Quiz;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F9FBFC",
    marginTop: 40,
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
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
});
