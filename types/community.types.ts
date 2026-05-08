import type { IsoDateString } from "./common.types";
import type { CommunityUserPreview } from "./user.types";

export type CommunityVisibility = "public" | "private";

export type Community = {
  id: string;
  title: string;
  createdAt: IsoDateString | Date;
  inviteCode: string;
  visibility: CommunityVisibility;
  imageUrl: string | null;
};

export type CommunityMember = {
  id: string;
  role: "mod" | "member";
  user: CommunityUserPreview & { level: string };
};

export type UserCommunity = {
  id: string;
  title: string;
  imageUrl?: string | null;
  visibility: CommunityVisibility;
  createdAt: IsoDateString | Date;
  role: "mod" | "member";
};

export type CommunityJoinRequest = {
  id: string;
  createdAt: IsoDateString | Date;
  status: "pending" | "approved" | "rejected";
  user: CommunityUserPreview;
};

export type CreateCommunityRequest = {
  title: string;
  inviteCode: string;
  visibility?: CommunityVisibility;
  imageUrl?: string;
};

export type UpdateCommunityRequest = {
  title?: string;
  visibility?: CommunityVisibility;
  imageUrl?: string;
  inviteCode?: string;
};

export type AddCommunityMemberRequest = {
  userId: string;
  role?: "mod" | "member";
};

export type RoomMessage = {
  id: string;
  content: string;
  createdAt: IsoDateString | Date;
  user: CommunityUserPreview;
  mentionedUserIds?: string[];
};

export type MessageReaction = {
  id: string;
  reaction: string;
  user: CommunityUserPreview;
};

export type ReactionCount = {
  reaction: string;
  count: number;
};

export type MessageMention = {
  id: string;
  mentionedUser: CommunityUserPreview;
};

export type UserMention = {
  id: string;
  message: {
    id: string;
    content: string;
    createdAt: IsoDateString | Date;
    roomId: string;
  };
  mentionedBy: CommunityUserPreview;
};

export type CommunityMod = {
  id: string;
  userId: string;
  user: CommunityUserPreview & {
    xp: number;
    level: string;
  };
};
