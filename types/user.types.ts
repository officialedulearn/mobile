import type { IsoDateString, NumericString } from './common.types';

export type UserLevel =
  | 'novice'
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'expert';

/** Mirrors api `user` row; omit server-only fields for client/API responses. */
export type UserPublic = {
  id: string;
  address: string | null;
  xp: number;
  credits: NumericString;
  name: string;
  email: string;
  lastLoggedIn: IsoDateString | Date;
  streak: number;
  referralCode: string | null;
  referralCount: number | null;
  learning: string | null;
  referredBy: string | null;
  level: UserLevel;
  username: string | null;
  quizCompleted: number;
  lastCreditRenewal: IsoDateString | Date | null;
  isPremium: boolean | null;
  premiumUntil: IsoDateString | Date | null;
  verified: boolean | null;
  imageUploadLimit: number | null;
  quizLimits: number | null;
  totalEarnings: NumericString | null;
  expoPushToken: string | null;
  profilePictureURL: string | null;
  oauthProvider: string | null;
  oauthProviderId: string | null;
  hasCompletedProfile: boolean | null;
  streakShieldActive: boolean | null;
  streakShieldExpiry: IsoDateString | Date | null;
  streakShieldPurchases: number | null;
};

/** auth.service UserResponse: adds quizLimit (API may mirror quizLimits). */
export type UserResponse = UserPublic & {
  quizLimit: number;
};

export type CommunityUserPreview = {
  id: string;
  username: string | null;
  name: string;
  profilePictureURL?: string | null;
};
