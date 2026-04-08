import type { NumericString } from './common.types';
import type { UserLevel, UserPublic, UserResponse } from './user.types';

export type SignUpDetails = {
  id: string;
  name: string;
  email: string;
  referralCode?: string;
  referredBy?: string;
  username: string;
  oauthProvider?: 'google' | 'apple' | null;
  oauthProviderId?: string | null;
  hasCompletedProfile?: boolean;
};

export type OAuthUserData = {
  id: string;
  email: string;
  name: string;
  provider: 'google' | 'apple';
  providerId: string;
};

export type OAuthCallbackResult = {
  user: unknown;
  isNewUser: boolean;
  needsUsername: boolean;
};

export type CheckAvailabilityRequest = {
  email?: string;
  username?: string;
};

export type CheckUserAvailabilityResult = {
  emailAvailable: boolean;
  usernameAvailable: boolean;
  message?: string;
};

export type EditUserRequest = {
  name: string;
  email: string;
  username: string;
  learning: string;
};

export type UpdateUserAddressQuery = {
  email: string;
  address: string;
};

export type ReferralIncrementResponse = {
  referrer: string;
};

export type ExpoPushTokenRequest = {
  expoPushToken: string;
  userId: string;
};

export type UpdateStreakRequest = {
  streak: number;
};

export type UpdateStreakResponse = {
  streak: number;
};

export type SetUserLevelRequest = {
  level: UserLevel;
};

export type SetUserLevelResponse = {
  level: string;
};

export type UpdateCreditsRequest = {
  credits: number;
};

export type UpdateCreditsResponse = {
  credits: NumericString | number;
};

export type OAuthCallbackRequest = {
  supabaseUserId: string;
  email: string;
  name: string;
  provider: 'google' | 'apple';
  providerId: string;
};

export type CompleteProfileRequest = {
  userId: string;
  username: string;
};

export type CompleteProfileResponse = {
  success: boolean;
  user: UserResponse | UserPublic;
};

export type LeaderboardUsersResponse = {
  users: UserPublic[];
};
