import type { IsoDateString, NumericString } from "./common.types";

export type DeviceInfo = {
  uuid: string;
  device: string;
  os: string;
  browser: string;
  ip: string;
};

export type WalletBalance = {
  sol: number;
  tokenAccount: number;
};

export type WalletBalanceResponse = {
  balance: WalletBalance;
};

export type BurnResponse = {
  message: string;
  signature: string;
  transactionLink: string;
};

export type SwapResponse = {
  response: string;
};

export type ClaimEarningsTransaction = {
  type: "sol" | "edln";
  amount: number;
  tx: string;
};

export type ClaimEarningsResponse = {
  success: boolean;
  message: string;
  transactions?: ClaimEarningsTransaction[];
};

export type UserEarnings = {
  sol: number;
  edln: number;
  hasEarnings: boolean;
};

export type UserEarningsEnvelope = {
  earnings: UserEarnings;
};

export type DecryptPrivateKeyResponse = {
  success: boolean;
  publicKey?: string;
  error?: string;
  privateKey?: string;
};

export type InitiateOnrampResponse = {
  message: string;
  result: {
    initiated: unknown;
    email: string;
    address: string;
  };
};

export type VerifyOnrampRequest = {
  email: string;
  otp: string;
  deviceInfo: DeviceInfo;
};

export type VerifyOnrampResponse = {
  message: string;
  verifiedResponse: unknown;
};

export type CreateOnrampOrderRequest = {
  amount: number;
  verifiedResponse: unknown;
};

export type OnrampOrderResponse = {
  message: string;
  order: unknown;
};

export type OnrampWebhookEvent = {
  id: string;
  address?: string;
  signature?: string;
  mint: string;
  currency: string;
  amount: number;
  usdcAmount?: number;
  fiatAmount: number;
  sender?: string;
  recipient: string;
  rate: number;
  status: string;
  transactionType: string;
  accountNumber?: string;
  accountName?: string;
  bank?: string;
  createdAt?: string;
};

export type PendingWebhookEventsResponse = {
  events: OnrampWebhookEvent[];
  hasUpdates: boolean;
};

export type ClearWebhookEventRequest = {
  eventId: string;
};

export type TokenPricesResponse = {
  SOL: number;
  EDLN: number;
};

export type PremiumUpgradeRequest = {
  amount: number;
};

export type Claim = {
  id: string;
  wallet: string;
  claimedAt: IsoDateString | Date;
};

export type Earning = {
  id: string;
  userId: string;
  sol: NumericString;
  edln: NumericString;
  createdAt: IsoDateString | Date;
};

export type PremiumTransaction = {
  id: string;
  userId: string;
  signature: string;
  amount: number;
  createdAt: IsoDateString | Date | null;
};

export type TotalVolumes = {
  id: number;
  totalRevenue: NumericString;
  totalEdlnBurned: NumericString;
  createdAt: IsoDateString | Date;
};
