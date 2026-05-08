import {
  createPublicQuizDeepLink as createPublicQuizDeepLinkUrl,
  parseDeepLinkIntent,
} from "@/utils/deepLinks";

export function createPublicQuizDeepLink(quizId: string) {
  return createPublicQuizDeepLinkUrl(quizId);
}

export function extractPublicQuizIdFromUrl(url: string) {
  const intent = parseDeepLinkIntent(url);
  if (intent?.type === "publicQuiz") {
    return intent.quizId;
  }

  return null;
}
