import axios from "axios";
import { BaseService } from "./base.service";

const LAMPORTS_PER_SOL = 1000000000;

interface BalanceResponse {
  sol: number;
  tokenAccount: number;
}

interface BurnResponse {
  message: string;
  signature: string;
  transactionLink: string;
}

interface SwapResponse {
  response: string;
}

interface ClaimEarningsResponse {
  success: boolean;
  message: string;
  transactions?: {
    type: "sol" | "edln";
    amount: number;
    tx: string;
  }[];
}

interface UserEarningsResponse {
  sol: number;
  edln: number;
  hasEarnings: boolean;
}

interface DecryptPrivateKeyResponse {
  success: boolean;
  publicKey?: string;
  error?: string;
  privateKey?: string;
}

export interface DeviceInfo {
  uuid: string;
  device: string;
  os: string;
  browser: string;
  ip: string;
}

interface InitiateOnrampResponse {
  message: string;
  result: {
    initiated: any;
    email: string;
    address: string;
  };
}

interface VerifyOnrampResponse {
  message: string;
  verifiedResponse: any;
}

interface OnrampOrderResponse {
  message: string;
  order: any;
}

interface PendingWebhookEventsResponse {
  events: {
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
  }[];
  hasUpdates: boolean;
}

interface PriceResponse {
  SOL: number;
  EDLN: number;
}

export interface AndroidSubscriptionStatus {
  isTrialActive: boolean;
  trialStart?: string;
  trialEnd?: string;
  nextBillingDate?: string;
  planType?: "monthly" | "annual";
}

export interface AndroidSubscriptionResponse {
  success: boolean;
  message: string;
  subscription?: AndroidSubscriptionStatus;
  signature?: string;
}

export class WalletService extends BaseService {
  async getBalance(publicKey: string): Promise<BalanceResponse> {
    const response = await this.executeRequest(
      this.getClient().get(`/wallet/balance/${publicKey}`),
    );
    if (response.error) throw response.error;
    return response.data?.balance ?? { sol: 0, tokenAccount: 0 };
  }

  async getPrices(): Promise<PriceResponse> {
    const SOL_ADDRESS = "So11111111111111111111111111111111111111112";
    const EDLN_ADDRESS = "CFw2KxMpWuxivoowkF8vRCrnMuDeg5VMHRR7zjE7pBLV";

    const response = await axios.get(
      `https://lite-api.jup.ag/price/v3?ids=${SOL_ADDRESS},${EDLN_ADDRESS}`,
    );

    return {
      SOL: response.data[SOL_ADDRESS]?.usdPrice || 0,
      EDLN: response.data[EDLN_ADDRESS]?.usdPrice || 0,
    };
  }

  async upgradeToPremium(userId: string, planAmount: number): Promise<any> {
    const response = await this.executeRequest(
      this.getClient().post(`/wallet/upgrade/${userId}`, {
        amount: planAmount,
      }),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async purchaseStreakShield(
    userId: string,
  ): Promise<{ success: boolean; expiresAt: Date }> {
    const response = await this.executeRequest(
      this.getClient().post(`/subscription/purchase/streak-shield/${userId}`),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async purchaseQuizRefresh(
    userId: string,
  ): Promise<{ success: boolean; newLimit: number }> {
    const response = await this.executeRequest(
      this.getClient().post(`/subscription/purchase/quiz-refresh/${userId}`),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async startAndroidSubscriptionTrial(
    userId: string,
    planType: "monthly" | "annual",
  ): Promise<AndroidSubscriptionResponse> {
    const response = await this.executeRequest(
      this.getClient().post(`/subscription/android/trial/${userId}`, {
        planType,
      }),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async getUserEarnings(userId: string): Promise<UserEarningsResponse> {
    const response = await this.executeRequest(
      this.getClient().get(`/wallet/earnings/${userId}`),
    );
    if (response.error) throw response.error;
    return response.data?.earnings ?? { sol: 0, edln: 0, hasEarnings: false };
  }

  async swapSolToEDLN(userId: string, amount: number): Promise<SwapResponse> {
    const response = await this.executeRequest(
      this.getClient().post("/wallet/swap", { userId, amount }),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async burnEDLN(userId: string, amount: number): Promise<BurnResponse> {
    const response = await this.executeRequest(
      this.getClient().post("/wallet/burn", { userId, amount }),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async claimEarnings(
    userId: string,
    type: "sol" | "edln" | "all",
  ): Promise<ClaimEarningsResponse> {
    const response = await this.executeRequest(
      this.getClient().post("/wallet/earnings/claim", { userId, type }),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async decryptPrivateKey(userId: string): Promise<DecryptPrivateKeyResponse> {
    const response = await this.executeRequest(
      this.getClient().post("/wallet/decrypt-private-key", { userId }),
    );
    if (response.error) {
      return {
        success: false,
        error: "Failed to decrypt private key",
      };
    }
    return {
      success: response.data?.success ?? false,
      publicKey: response.data?.publicKey,
      privateKey: response.data?.privateKey,
    };
  }

  formatSolAmount(lamports: number): string {
    return (lamports / LAMPORTS_PER_SOL).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 9,
    });
  }

  formatTokenAmount(amount: number): string {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }

  getShortenedAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  }

  async initiateOnramp(userId: string): Promise<InitiateOnrampResponse> {
    const response = await this.executeRequest(
      this.getClient().post(`/wallet/onramp/initiate/${userId}`),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async verifyOnramp(
    email: string,
    otp: string,
    deviceInfo: DeviceInfo,
  ): Promise<VerifyOnrampResponse> {
    const response = await this.executeRequest(
      this.getClient().post("/wallet/onramp/verify", {
        email,
        otp,
        deviceInfo,
      }),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async onrampFiatToEdln(
    userId: string,
    amount: number,
    verifiedResponse: any,
  ): Promise<OnrampOrderResponse> {
    const response = await this.executeRequest(
      this.getClient().post(`/wallet/onramp/create-order/${userId}`, {
        amount,
        verifiedResponse,
      }),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async onrampFiatToSol(
    userId: string,
    amount: number,
    verifiedResponse: any,
  ): Promise<OnrampOrderResponse> {
    const response = await this.executeRequest(
      this.getClient().post(`/wallet/onramp/create-order-sol/${userId}`, {
        amount,
        verifiedResponse,
      }),
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async getPendingWebhookEvents(
    address: string,
  ): Promise<PendingWebhookEventsResponse> {
    const response = await this.executeRequest(
      this.getClient().get(`/wallet/onramp-webhook/pending/${address}`),
    );
    if (response.error) return { events: [], hasUpdates: false };
    return response.data ?? { events: [], hasUpdates: false };
  }

  async clearWebhookEvent(address: string, eventId: string): Promise<void> {
    await this.executeRequest(
      this.getClient().post(`/wallet/onramp-webhook/clear/${address}`, {
        eventId,
      }),
    );
  }
}
