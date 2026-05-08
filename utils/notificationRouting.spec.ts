import { getNotificationRoute } from "./notificationRouting";
import type { InAppNotification } from "@/types/notifications.types";

const baseNotification = {
  id: "n1",
  title: "title",
  content: "content",
  userId: "u1",
  createdAt: new Date(),
} as const;

describe("getNotificationRoute", () => {
  it("routes quiz_ready to quiz details", () => {
    const notification: InAppNotification = {
      ...baseNotification,
      type: "quiz_ready",
      metadata: { quizId: "q1" },
    };
    expect(getNotificationRoute(notification)).toEqual({
      pathname: "/(tabs)/quizzes/[id]",
      params: { id: "q1" },
    });
  });

  it("returns null for quiz_ready without quizId", () => {
    const notification: InAppNotification = {
      ...baseNotification,
      type: "quiz_ready",
      metadata: {} as never,
    };
    expect(getNotificationRoute(notification)).toBeNull();
  });

  it("routes mention to room screen", () => {
    const notification: InAppNotification = {
      ...baseNotification,
      type: "mention",
      metadata: { communityId: "room1" },
    };
    expect(getNotificationRoute(notification)).toEqual({
      pathname: "/room/[id]",
      params: { id: "room1" },
    });
  });

  it("returns null for system_announcement", () => {
    const notification: InAppNotification = {
      ...baseNotification,
      type: "system_announcement",
      metadata: {},
    };
    expect(getNotificationRoute(notification)).toBeNull();
  });
});
