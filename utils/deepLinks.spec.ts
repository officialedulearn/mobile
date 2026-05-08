import { isAuthCallbackUrl, parseDeepLinkIntent } from "./deepLinks";

describe("parseDeepLinkIntent", () => {
  it("parses referral https links", () => {
    expect(
      parseDeepLinkIntent("https://mobile.edulearn.fun/ref/abc123"),
    ).toEqual({
      type: "referral",
      referralCode: "ABC123",
    });
  });

  it("parses public quiz https links", () => {
    expect(
      parseDeepLinkIntent("https://mobile.edulearn.fun/quizzes/quiz_123"),
    ).toEqual({
      type: "publicQuiz",
      quizId: "quiz_123",
    });
  });

  it("parses community https links", () => {
    expect(
      parseDeepLinkIntent("https://mobile.edulearn.fun/community/invite77"),
    ).toEqual({
      type: "communityInvite",
      inviteCode: "INVITE77",
    });
  });

  it("parses custom-scheme links", () => {
    expect(parseDeepLinkIntent("edulearnv2://ref/xyz999")).toEqual({
      type: "referral",
      referralCode: "XYZ999",
    });
    expect(parseDeepLinkIntent("edulearnv2://quizzes/quiz_9")).toEqual({
      type: "publicQuiz",
      quizId: "quiz_9",
    });
    expect(parseDeepLinkIntent("edulearnv2://community/code12")).toEqual({
      type: "communityInvite",
      inviteCode: "CODE12",
    });
  });

  it("parses legacy chat and query link shapes", () => {
    expect(parseDeepLinkIntent("edulearnv2://quiz/chat-room-1")).toEqual({
      type: "chatQuiz",
      chatId: "chat-room-1",
    });
    expect(
      parseDeepLinkIntent("https://edulearn.fun/open?quizId=quiz-55"),
    ).toEqual({
      type: "publicQuiz",
      quizId: "quiz-55",
    });
  });

  it("ignores auth callback links", () => {
    expect(parseDeepLinkIntent("edulearnv2://auth/callback?code=1")).toBeNull();
  });

  it("handles malformed escaping without throwing", () => {
    expect(() =>
      parseDeepLinkIntent("https://mobile.edulearn.fun/ref/%E0%A4%A"),
    ).not.toThrow();
    expect(parseDeepLinkIntent("just-some-random-text")).toBeNull();
  });
});

describe("isAuthCallbackUrl", () => {
  it("detects callback path", () => {
    expect(isAuthCallbackUrl("edulearnv2://auth/callback?code=abc")).toBe(true);
  });
});
