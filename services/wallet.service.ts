import httpClient from "@/utils/httpClient";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

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

export class WalletService {
  async getBalance(publicKey: string): Promise<BalanceResponse> {
    try {
      const response = await httpClient.get(`/wallet/balance/${publicKey}`);
      return response.data.balance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  }

  async upgradeToPremium(userId: string): Promise<any> {
    try {
      const response = await httpClient.post(`/wallet/upgrade/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      throw error;
    }
  }
  async swapSolToEDLN(userId: string, amount: number): Promise<SwapResponse> {
    try {
      const response = await httpClient.post('/wallet/swap', { userId, amount });
      return response.data;
    } catch (error) {
      console.error('Error swapping SOL to EDLN:', error);
      throw error;
    }
  }

  async burnEDLN(userId: string, amount: number): Promise<BurnResponse> {
    try {
      const response = await httpClient.post('/wallet/burn', { userId, amount });
      return response.data;
    } catch (error) {
      console.error('Error burning EDLN tokens:', error);
      throw error;
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
}