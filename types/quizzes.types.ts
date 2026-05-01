/** ISO 8601 from JSON, e.g. "2026-04-20T12:00:00.000Z" */
export type IsoDateString = string;

export type UuidString = string;

/** Legacy DB table `quiz` — not used by public quiz HTTP API */
export type LegacyQuiz = {
  id: UuidString;
  title: string;
  description: string;
  createdAt: IsoDateString;
};

/** `public_quiz.questions` JSON — API validates 4 options + correctAnswer ∈ options on publish */
export type PublicQuizQuestion = {
  question: string;
  options: [string, string, string, string];
  correctAnswer: string;
  explanation: string;
};

// --- POST /quizzes/public (JWT) ---

export type PublishPublicQuizRequest = {
  title: string;
  description?: string;
  questions: PublicQuizQuestion[];
  /** 1–20 questions (class-validator) */
  sourceChatId?: UuidString;
};

export type PublishPublicQuizResponse = {
  id: UuidString;
  title: string;
  description: string | null;
  createdBy: UuidString;
  createdAt: IsoDateString;
  viewCount: number;
  attemptCount: number;
};

// --- GET /quizzes/public?limit&offset&sort ---

export type PublicQuizListSort = "recent" | "popular";

export type PublicQuizListItem = {
  id: UuidString;
  title: string;
  description: string | null;
  createdBy: UuidString;
  viewCount: number;
  attemptCount: number;
  createdAt: IsoDateString;
  creatorUsername: string | null;
};

/** Response body: PublicQuizListItem[] */
export type ListPublicQuizzesResponse = PublicQuizListItem[];

// --- GET /quizzes/mine?limit&offset (JWT) ---

/** Same shape as list item; response body: PublicQuizListItem[] */
export type ListMyPublicQuizzesResponse = PublicQuizListItem[];

// --- GET /quizzes/public/:id (no auth) ---

export type PublicQuizDetail = {
  id: UuidString;
  title: string;
  description: string | null;
  questions: PublicQuizQuestion[];
  createdBy: UuidString;
  sourceChatId: UuidString | null;
  createdAt: IsoDateString;
  viewCount: number;
  attemptCount: number;
};

// --- POST /quizzes/public/:id/participate (JWT) ---

export type StartPublicQuizParticipationResponse = {
  participationId: UuidString;
  quizId: UuidString;
  joinedAt: IsoDateString;
};

// --- POST /quizzes/public/:id/attempt (JWT) ---

export type SubmitPublicQuizAnswer = {
  questionIndex: number;
  selectedAnswer: string;
};

export type SubmitPublicQuizRequest = {
  userId: UuidString;
  answers: SubmitPublicQuizAnswer[];
  participationId?: UuidString;
};

export type PublicQuizAttemptResultRow = {
  questionIndex: number;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
};

/** Row inserted into `activity` (xp_activity) */
export type XpActivity = {
  id: UuidString;
  userId: UuidString;
  type: "quiz" | "chat" | "streak";
  title: string | null;
  xpEarned: number;
  createdAt: IsoDateString;
};

export type SubmitPublicQuizResponse = {
  score: number;
  totalQuestions: number;
  results: PublicQuizAttemptResultRow[];
  xpEarned: number;
  activity: XpActivity;
};

// --- Optional: service method signatures ---

export type ListQuizzesQuery = {
  limit?: number;
  offset?: number;
  sort?: PublicQuizListSort;
};
