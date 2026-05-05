const APP_SCHEME = "edulearnv2";
const QUIZ_PATH = "quizzes";

export function createPublicQuizDeepLink(quizId: string) {
  return `${APP_SCHEME}://${QUIZ_PATH}/${encodeURIComponent(quizId)}`;
}

export function extractPublicQuizIdFromUrl(url: string) {
  const decoded = decodeURIComponent(url);
  const patterns = [
    /(?:^|[/:])quizzes\/([^/?#]+)/i,
    /(?:^|[/:])public-quiz\/([^/?#]+)/i,
    /[?&]quizId=([^&#]+)/i,
    /[?&]publicQuizId=([^&#]+)/i,
  ];

  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}
