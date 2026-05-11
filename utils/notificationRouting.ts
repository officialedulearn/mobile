import type { InAppNotification } from "@/types/notifications.types";

type NotificationRoute =
  | { pathname: "/(tabs)/quizzes/[id]"; params: { id: string } }
  | { pathname: "/roadmaps/[id]"; params: { id: string } }
  | { pathname: "/hub/[id]"; params: { id: string } }
  | { pathname: "/leaderboard"; params?: undefined }
  | { pathname: "/(tabs)/profile"; params?: undefined }
  | { pathname: "/nft/[id]"; params: { id: string } };

const hasId = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const getNotificationRoute = (
  notification: InAppNotification,
): NotificationRoute | null => {
  const metadata = (notification.metadata ?? {}) as Record<string, unknown>;

  switch (notification.type) {
    case "quiz_ready":
      return hasId(metadata.quizId)
        ? { pathname: "/(tabs)/quizzes/[id]", params: { id: metadata.quizId } }
        : null;
    case "roadmap_ready":
      return hasId(metadata.roadmapId)
        ? { pathname: "/roadmaps/[id]", params: { id: metadata.roadmapId } }
        : null;
    case "mention":
      return hasId(metadata.communityId)
        ? { pathname: "/hub/[id]", params: { id: metadata.communityId } }
        : null;
    case "leaderboard_update":
      return { pathname: "/leaderboard" };
    case "streak_warning":
      return { pathname: "/(tabs)/profile" };
    case "nft_claimed":
      return hasId(metadata.nftId)
        ? { pathname: "/nft/[id]", params: { id: metadata.nftId } }
        : null;
    case "system_announcement":
    default:
      return null;
  }
};
