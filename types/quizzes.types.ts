import type { IsoDateString } from './common.types';
import type { XpActivity } from './activity.types';

/** api `quiz` table */
export type Quiz = {
  id: string;
  title: string;
  description: string;
  createdAt: IsoDateString | Date;
};

export type PublicQuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

export type PublishQuizQuestionRequest = PublicQuizQuestion;

export type PublishQuizRequest = {
  title: string;
  description?: string;
  questions: PublishQuizQuestionRequest[];
  sourceChatId?: string;
};

export type PublishQuizResponse = {
  id: string;
  title: string;
  description: string | null;
  createdBy: string;
  createdAt: IsoDateString | Date;
  viewCount: number;
  attemptCount: number;
};

export type PublicQuizListItem = {
  id: string;
  title: string;
  description: string | null;
  createdBy: string;
  viewCount: number;
  attemptCount: number;
  createdAt: IsoDateString | Date;
  creatorUsername: string | null;
};

export type PublicQuizDetail = {
  id: string;
  title: string;
  description: string | null;
  questions: PublicQuizQuestion[];
  createdBy: string;
  sourceChatId: string | null;
  createdAt: IsoDateString | Date;
  viewCount: number;
  attemptCount: number;
};

export type PublicQuizAnswerSubmit = {
  questionIndex: number;
  selectedAnswer: string;
};

export type SubmitPublicQuizRequest = {
  userId: string;
  answers: PublicQuizAnswerSubmit[];
};

export type PublicQuizAttemptResultRow = {
  questionIndex: number;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
};

export type SubmitPublicQuizResponse = {
  score: number;
  totalQuestions: number;
  results: PublicQuizAttemptResultRow[];
  xpEarned: number;
  activity: XpActivity;
};
