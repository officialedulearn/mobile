import httpClient from "@/utils/httpClient";

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

  async getUserEarnings(userId: string): Promise<UserEarningsResponse> {
    try {
      const response = await httpClient.get(`/wallet/earnings/${userId}`);
      return response.data.earnings;
    } catch (error) {
      console.error('Error fetching user earnings:', error);
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

  async claimEarnings(userId: string, type: 'sol' | 'edln' | 'all'): Promise<ClaimEarningsResponse> {
    try {
      const response = await httpClient.post('/wallet/earnings/claim', { userId, type });
      return response.data;
    } catch (error) {
      console.error('Error claiming earnings:', error);
      throw error;
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
}