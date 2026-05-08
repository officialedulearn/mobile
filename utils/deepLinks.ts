import AsyncStorage from "@react-native-async-storage/async-storage";

export const APP_SCHEME = "edulearnv2";
export const MOBILE_LINK_HOST = "mobile.edulearn.fun";
export const PENDING_DEEP_LINK_KEY = "pending_deep_link_intent";

export type DeepLinkIntent =
  | { type: "referral"; referralCode: string }
  | { type: "publicQuiz"; quizId: string }
  | { type: "communityInvite"; inviteCode: string }
  | { type: "chatQuiz"; chatId: string };

export function createReferralDeepLink(referralCode: string) {
  return `https://${MOBILE_LINK_HOST}/ref/${encodeURIComponent(
    referralCode.trim().toUpperCase(),
  )}`;
}

export function createPublicQuizDeepLink(quizId: string) {
  return `https://${MOBILE_LINK_HOST}/quizzes/${encodeURIComponent(
    quizId.trim(),
  )}`;
}

export function createCommunityInviteDeepLink(inviteCode: string) {
  return `https://${MOBILE_LINK_HOST}/community/${encodeURIComponent(
    inviteCode.trim().toUpperCase(),
  )}`;
}

export function isAuthCallbackUrl(url: string) {
  return url.toLowerCase().includes("auth/callback");
}

export function parseDeepLinkIntent(url: string): DeepLinkIntent | null {
  const decodedUrl = safeDecodeUriComponent(url.trim());

  if (isAuthCallbackUrl(decodedUrl)) {
    return null;
  }

  const parsed = tryParseUrl(decodedUrl);
  if (parsed) {
    const scheme = parsed.protocol.replace(":", "").toLowerCase();
    const host = parsed.host.toLowerCase();

    if (
      (scheme === "http" || scheme === "https") &&
      host === MOBILE_LINK_HOST
    ) {
      const fromHttps = parseFromSegments(
        parsed.pathname.split("/").filter(Boolean),
        parsed.searchParams,
      );
      if (fromHttps) return fromHttps;
    }

    if (scheme === APP_SCHEME.toLowerCase()) {
      const segments = [
        parsed.hostname,
        ...parsed.pathname.split("/").filter(Boolean),
      ].filter(Boolean);
      const fromScheme = parseFromSegments(segments, parsed.searchParams);
      if (fromScheme) return fromScheme;
    }
  }

  return parseFromLegacyPatterns(decodedUrl);
}

export async function setPendingDeepLinkIntent(intent: DeepLinkIntent) {
  await AsyncStorage.setItem(PENDING_DEEP_LINK_KEY, JSON.stringify(intent));
}

export async function popPendingDeepLinkIntent(): Promise<DeepLinkIntent | null> {
  const raw = await AsyncStorage.getItem(PENDING_DEEP_LINK_KEY);
  if (!raw) return null;
  await AsyncStorage.removeItem(PENDING_DEEP_LINK_KEY);
  return parseStoredIntent(raw);
}

function parseFromSegments(
  segments: string[],
  searchParams: URLSearchParams,
): DeepLinkIntent | null {
  if (segments.length === 0) return null;

  const [head, second] = segments;
  if (head === "ref" && second) {
    return { type: "referral", referralCode: second.toUpperCase() };
  }

  if ((head === "quizzes" || head === "public-quiz") && second) {
    return { type: "publicQuiz", quizId: second };
  }

  if (head === "community" && second) {
    return { type: "communityInvite", inviteCode: second.toUpperCase() };
  }

  if (head === "quiz" && second) {
    return { type: "chatQuiz", chatId: second };
  }

  const quizId = searchParams.get("quizId") || searchParams.get("publicQuizId");
  if (quizId) {
    return { type: "publicQuiz", quizId };
  }

  const refCode = searchParams.get("ref") || searchParams.get("referralCode");
  if (refCode) {
    return { type: "referral", referralCode: refCode.toUpperCase() };
  }

  return null;
}

function parseFromLegacyPatterns(url: string): DeepLinkIntent | null {
  const referralMatch = url.match(/(?:^|[/:])ref\/([^/?#]+)/i);
  if (referralMatch?.[1]) {
    return { type: "referral", referralCode: referralMatch[1].toUpperCase() };
  }

  const communityMatch = url.match(/(?:^|[/:])community\/([^/?#]+)/i);
  if (communityMatch?.[1]) {
    return {
      type: "communityInvite",
      inviteCode: communityMatch[1].toUpperCase(),
    };
  }

  const publicQuizMatch = url.match(
    /(?:^|[/:])(quizzes|public-quiz)\/([^/?#]+)/i,
  );
  if (publicQuizMatch?.[2]) {
    return { type: "publicQuiz", quizId: publicQuizMatch[2] };
  }

  const chatQuizMatch = url.match(/(?:^|[/:])quiz\/([^/?#]+)/i);
  if (chatQuizMatch?.[1]) {
    return { type: "chatQuiz", chatId: chatQuizMatch[1] };
  }

  const queryQuizMatch = url.match(/[?&](quizId|publicQuizId)=([^&#]+)/i);
  if (queryQuizMatch?.[2]) {
    return { type: "publicQuiz", quizId: queryQuizMatch[2] };
  }

  return null;
}

function parseStoredIntent(raw: string): DeepLinkIntent | null {
  try {
    const parsed = JSON.parse(raw) as DeepLinkIntent;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.type === "referral" && "referralCode" in parsed) return parsed;
    if (parsed.type === "publicQuiz" && "quizId" in parsed) return parsed;
    if (parsed.type === "communityInvite" && "inviteCode" in parsed)
      return parsed;
    if (parsed.type === "chatQuiz" && "chatId" in parsed) return parsed;
    return null;
  } catch {
    return null;
  }
}

function tryParseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function safeDecodeUriComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
