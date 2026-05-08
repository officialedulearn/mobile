import type { IsoDateString } from "./common.types";

export type RewardType = "certificate" | "points";

export type Reward = {
  id: string;
  type: RewardType;
  title: string;
  description: string;
  imageUrl: string | null;
  ipfs: string | null;
  createdAt: IsoDateString | Date;
};

export type UserReward = {
  userId: string;
  rewardId: string;
  earnedAt: IsoDateString | Date;
  signature: string | null;
  lockTransactionId: string | null;
};

export type UserRewardWithEarned = {
  id: string;
  type: RewardType;
  title: string;
  description: string;
  imageUrl: string | null;
  createdAt: IsoDateString | Date;
  earnedAt: IsoDateString | Date;
  ipfs: string | null;
  signature: string | null;
};

export type ClaimRewardRequest = {
  userId: string;
  rewardId: string;
};

export type ClaimRewardResponse = {
  success: boolean;
  signature: string;
  message: string;
};

export type CreateRewardRequest = {
  type: RewardType;
  title: string;
  description: string;
  imageUrl?: string;
  ipfs?: string;
};

export type RewardClaimStatus = {
  claimed: boolean;
  signature?: string;
  awarded: boolean;
};

export type DeleteRewardResponse = {
  success: boolean;
  message: string;
};
