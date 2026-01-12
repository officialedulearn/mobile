import httpClient from "@/utils/httpClient";
import axios from "axios";

const LAMPORTS_PER_SOL = 1000000000

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
  transactions?: Array<{
    type: 'sol' | 'edln';
    amount: number;
    tx: string;
  }>;
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
  events: Array<{
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
  }>;
  hasUpdates: boolean;
}

interface PriceResponse {
  SOL: number;
  EDLN: number;
}

export class WalletService {
  async getBalance(publicKey: string): Promise<BalanceResponse> {
    try {
      const response = await httpClient.get(`/wallet/balance/${publicKey}`);
      return response.data.balance;
    } catch (error: any) {
      console.error('Error fetching balance:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch balance';
      throw new Error(errorMessage);
    }
  }

  async getPrices(): Promise<PriceResponse> {
    const SOL_ADDRESS = "So11111111111111111111111111111111111111112";
    const EDLN_ADDRESS = "CFw2KxMpWuxivoowkF8vRCrnMuDeg5VMHRR7zjE7pBLV";
    
    const response = await axios.get(
      `https://lite-api.jup.ag/price/v3?ids=${SOL_ADDRESS},${EDLN_ADDRESS}`
    );

    return {
      SOL: response.data[SOL_ADDRESS]?.usdPrice || 0,
      EDLN: response.data[EDLN_ADDRESS]?.usdPrice || 0
    }
  }

  async upgradeToPremium(userId: string, planAmount: number): Promise<any> {
    try {
      const response = await httpClient.post(`/wallet/upgrade/${userId}`, {
        amount: planAmount
      });
      return response.data;
    } catch (error: any) {
      console.error('Error upgrading to premium:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to upgrade to premium';
      throw new Error(errorMessage);
    }
  }

  async getUserEarnings(userId: string): Promise<UserEarningsResponse> {
    try {
      const response = await httpClient.get(`/wallet/earnings/${userId}`);
      return response.data.earnings;
    } catch (error: any) {
      console.error('Error fetching user earnings:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch earnings';
      throw new Error(errorMessage);
    }
  }

  async swapSolToEDLN(userId: string, amount: number): Promise<SwapResponse> {
    try {
      const response = await httpClient.post('/wallet/swap', { userId, amount });
      return response.data;
    } catch (error: any) {
      console.error('Error swapping SOL to EDLN:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to complete swap transaction';
      throw new Error(errorMessage);
    }
  }

  async burnEDLN(userId: string, amount: number): Promise<BurnResponse> {
    try {
      const response = await httpClient.post('/wallet/burn', { userId, amount });
      return response.data;
    } catch (error: any) {
      console.error('Error burning EDLN tokens:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to burn EDLN tokens';
      throw new Error(errorMessage);
    }
  }

  async claimEarnings(userId: string, type: 'sol' | 'edln' | 'all'): Promise<ClaimEarningsResponse> {
    try {
      const response = await httpClient.post('/wallet/earnings/claim', { userId, type });
      return response.data;
    } catch (error: any) {
      console.error('Error claiming earnings:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to claim earnings';
      throw new Error(errorMessage);
    }
  }
  async decryptPrivateKey(userId: string): Promise<DecryptPrivateKeyResponse> {
    try {
      const response = await httpClient.post('/wallet/decrypt-private-key', { userId });
      return {
        success: response.data.success,
        publicKey: response.data.publicKey,
        privateKey: response.data.privateKey
      };
    } catch (error) {
      console.error('Error decrypting private key:', error);
      return {
        success: false,
        error: 'Failed to decrypt private key'
      };
    }
  }

  formatSolAmount(lamports: number): string {
    return (lamports / LAMPORTS_PER_SOL).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 9
    });
  }

  formatTokenAmount(amount: number): string {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    });
  }

  getShortenedAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  }

  async initiateOnramp(userId: string): Promise<InitiateOnrampResponse> {
    try {
      const response = await httpClient.post(`/wallet/onramp/initiate/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error initiating onramp:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to initiate onramp';
      throw new Error(errorMessage);
    }
  }

  async verifyOnramp(email: string, otp: string, deviceInfo: DeviceInfo): Promise<VerifyOnrampResponse> {
    try {
      const response = await httpClient.post('/wallet/onramp/verify', {
        email,
        otp,
        deviceInfo
      });
      return response.data;
    } catch (error: any) {
      console.error('Error verifying onramp:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to verify onramp';
      throw new Error(errorMessage);
    }
  }

  async onrampFiatToEdln(userId: string, amount: number, verifiedResponse: any): Promise<OnrampOrderResponse> {
    try {
      const response = await httpClient.post(`/wallet/onramp/create-order/${userId}`, {
        amount,
        verifiedResponse
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating onramp order:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create onramp order';
      throw new Error(errorMessage);
    }
  }

  async onrampFiatToSol(userId: string, amount: number, verifiedResponse: any): Promise<OnrampOrderResponse> {
    try {
      const response = await httpClient.post(`/wallet/onramp/create-order-sol/${userId}`, {
        amount,
        verifiedResponse
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating SOL onramp order:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create SOL onramp order';
      throw new Error(errorMessage);
    }
  }

  async getPendingWebhookEvents(address: string): Promise<PendingWebhookEventsResponse> {
    try {
      const response = await httpClient.get(`/wallet/onramp-webhook/pending/${address}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching pending webhook events:', error);
      return { events: [], hasUpdates: false };
    }
  }

  async clearWebhookEvent(address: string, eventId: string): Promise<void> {
    try {
      await httpClient.post(`/wallet/onramp-webhook/clear/${address}`, { eventId });
    } catch (error: any) {
      console.error('Error clearing webhook event:', error);
    }
  }
}