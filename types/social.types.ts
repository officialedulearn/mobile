import type { IsoDateString } from "./common.types";
import type { UserLevel } from "./user.types";

export type FollowNotificationPreferences = {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  inAppNotifications?: boolean;
};

export type UserFollow = {
  id: string;
  followerId: string;
  followingId: string;
  emailNotifications: boolean | null;
  pushNotifications: boolean | null;
  inAppNotifications: boolean | null;
  createdAt: IsoDateString | Date;
};

export type SocialFollowerPreview = {
  id: string;
  username: string | null;
  name: string;
  email: string;
  profilePictureURL: string | null;
  level: UserLevel | string;
  xp: number;
  verified: boolean | null;
  createdAt: IsoDateString | Date;
};

export type FollowStats = {
  followersCount: number;
  followingCount: number;
};

export type FollowersResponse = {
  followers: SocialFollowerPreview[];
};

export type FollowingResponse = {
  following: SocialFollowerPreview[];
};

export type IsFollowingResponse = {
  isFollowing: boolean;
};
