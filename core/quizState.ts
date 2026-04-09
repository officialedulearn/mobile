import { AIService } from "@/services/ai.service";
import { ActivityService } from "@/services/activity.service";
import { create } from "zustand";

export type Question = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
};

export type UserAnswer = {
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
};

interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  selectedAnswers: (string | null)[];
  userAnswers: UserAnswer[];
  score: number;
  quizCompleted: boolean;
  loading: boolean;
  error: string | null;
  
  generateQuiz: (chatId: string, userId: string) => Promise<void>;
  fetchQuiz: (chatId: string, userId: string) => Promise<void>;
  submitQuizAnswers: (userId: string, chatId: string, chatTitle: string) => Promise<{ score: number; xpEarned: number; validatedAnswers: UserAnswer[] }>;
  selectAnswer: (option: string) => void;
  goToQuestion: (index: number) => void;
  clearQuiz: () => void;
}

const aiService = new AIService();
const activityService = new ActivityService();

const useQuizStore = create<QuizState>((set, get) => ({
  questions: [],
  currentQuestionIndex: 0,
  selectedAnswers: [],
  userAnswers: [],
  score: 0,
  quizCompleted: false,
  loading: false,
  error: null,

  generateQuiz: async (chatId: string, userId: string) => {
    try {
      set({ loading: true, error: null });
      const response = await aiService.generateQuiz({ chatId, userId });
      
      if (Array.isArray(response) && response.length > 0) {
        set({
          questions: response,
          selectedAnswers: new Array(response.length).fill(null),
          loading: false,
        });
      } else {
        set({
          loading: false,
          error: "No quiz questions could be generated from this conversation. Please ensure you had an educational discussion and try again.",
        });
      }
    } catch (error: any) {
      const msg = error?.message || "";
      if (msg.includes("quiz limit") || msg.includes("No quiz attempts")) {
        set({
          loading: false,
          error: "quiz_limit",
        });
      } else if (error.name === "QuizGenerationError" && error.message) {
        set({ loading: false, error: error.message });
      } else {
        set({
          loading: false,
          error: "Something went wrong while generating your quiz. Please try again later.",
        });
      }
    }
  },

  fetchQuiz: async (chatId: string, userId: string) => {
    try {
      set({ loading: true, error: null });
      const response = await aiService.generateQuiz({ chatId, userId });
      
      if (Array.isArray(response) && response.length > 0) {
        set({
          questions: response,
          selectedAnswers: new Array(response.length).fill(null),
          loading: false,
        });
      } else {
        set({
          loading: false,
          error: "No quiz questions could be generated from this conversation. Please ensure you had an educational discussion and try again.",
        });
      }
    } catch (error: any) {
      const msg = error?.message || "";
      if (msg.includes("quiz limit") || msg.includes("No quiz attempts")) {
        set({
          loading: false,
          error: "quiz_limit",
        });
      } else if (error.name === "QuizGenerationError" && error.message) {
        set({ loading: false, error: error.message });
      } else {
        set({
          loading: false,
          error: "Something went wrong while generating your quiz. Please try again later.",
        });
      }
    }
  },

  submitQuizAnswers: async (userId: string, chatId: string, chatTitle: string) => {
    const state = get();
    const { questions, selectedAnswers } = state;
    
    if (!questions.length) {
      throw new Error("No questions available");
    }

    try {
      set({ loading: true });
      
      const quizAnswers = questions.map((question, index) => ({
        question: question.question,
        selectedAnswer: selectedAnswers[index] || '',
        correctAnswer: question.correctAnswer,
      }));

      const result = await activityService.submitQuiz({
        userId,
        chatId,
        title: chatTitle || "Quiz",
        answers: quizAnswers,
      });

      const userAnswersList: UserAnswer[] = result.validatedAnswers.map((answer: any) => ({
        question: answer.question,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: answer.correctAnswer,
        isCorrect: answer.isCorrect,
      }));

      set({
        userAnswers: userAnswersList,
        score: result.score,
        quizCompleted: true,
        loading: false,
      });

      return {
        score: result.score,
        xpEarned: result.xpEarned,
        validatedAnswers: userAnswersList,
      };
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "Failed to submit quiz" });
      throw error;
    }
  },

  selectAnswer: (option: string) => {
    const state = get();
    const updatedAnswers = [...state.selectedAnswers];
    updatedAnswers[state.currentQuestionIndex] = option;
    set({ selectedAnswers: updatedAnswers });
  },

  goToQuestion: (index: number) => {
    const state = get();
    if (index >= 0 && index < state.questions.length) {
      set({ currentQuestionIndex: index });
    }
  },

  clearQuiz: () => {
    set({
      questions: [],
      currentQuestionIndex: 0,
      selectedAnswers: [],
      userAnswers: [],
      score: 0,
      quizCompleted: false,
      loading: false,
      error: null,
    });
  },
}));

export default useQuizStore;
