import type { IsoDateString } from "./common.types";

export type InAppNotification = {
  id: string;
  content: string;
  title: string;
  userId: string;
  createdAt: IsoDateString | Date;
  type: NotificationType;
  metadata?: NotificationMetadata;
};

export type NotificationType =
  | "quiz_ready"
  | "roadmap_ready"
  | "mention"
  | "leaderboard_update"
  | "streak_warning"
  | "nft_claimed"
  | "system_announcement";

export type NotificationMetadataMap = {
  quiz_ready: { quizId: string };
  roadmap_ready: { roadmapId: string };
  mention: {
    communityId: string;
    messageId?: string;
    mentionedByUserId?: string;
  };
  leaderboard_update: { period?: "daily" | "weekly" | "monthly" };
  streak_warning: { streakDays?: number };
  nft_claimed: { nftId: string };
  system_announcement: Record<string, never>;
};

export type NotificationMetadata = {
  [K in NotificationType]: NotificationMetadataMap[K];
}[NotificationType];

export type NotificationsListResponse = {
  notifications: InAppNotification[];
};

export type DeleteNotificationResponse = {
  message: string;
};
