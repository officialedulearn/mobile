import type { IsoDateString } from "./common.types";

export type XpActivityType = "quiz" | "chat" | "streak";

export type XpActivity = {
  id: string;
  userId: string;
  type: XpActivityType;
  title: string | null;
  xpEarned: number;
  createdAt: IsoDateString | Date;
};

export type ListActivitiesQuery = {
  limit?: number;
  page?: number;
};

export type ActivityPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type PaginatedActivitiesResponse = {
  data: XpActivity[];
  pagination: ActivityPagination;
};

export type CreateActivityRequest = {
  userId: string;
  type: XpActivityType;
  title: string;
  xpEarned: number;
};

export type QuizAnswerSubmit = {
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
};

export type SubmitQuizRequest = {
  userId: string;
  chatId?: string;
  title: string;
  answers: QuizAnswerSubmit[];
};

export type QuizValidatedAnswer = QuizAnswerSubmit & {
  isCorrect: boolean;
};

export type SubmitQuizResponse = {
  activity: XpActivity;
  score: number;
  totalQuestions: number;
  xpEarned: number;
  validatedAnswers: QuizValidatedAnswer[];
  chatId?: string;
};
