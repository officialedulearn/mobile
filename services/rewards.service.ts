import httpClient from "@/utils/httpClient";

interface Reward {
  id: string;
  type: 'certificate' | 'points';
  title: string;
  description: string;
  imageUrl?: string;
  createdAt?: string;
  ipfs?: string;
}
interface UserRewardWithDetails {
  id: string;
  type: 'certificate' | 'points';
  title: string;
  description: string;
  earnedAt: string;
  signature?: string;
}

export class RewardsService {
  async claimReward(userId: string, rewardId: string): Promise<any> {
    try {
      const response = await httpClient.post('/rewards/claim', { userId, rewardId });
      return response.data;
    } catch (error: any) {
      console.error(`Error claiming reward ${rewardId} for user ${userId}:`, error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to claim reward';
      throw new Error(errorMessage);
    }
  }

  async claimRewardAdmin(userId: string, rewardId: string): Promise<any> {
    try {
      console.log('🔄 Calling /rewards/claim/admin endpoint...', {
        userId,
        rewardId,
        timestamp: new Date().toISOString(),
      });

      const response = await httpClient.post('/rewards/claim/admin', { userId, rewardId });
      
      console.log('✅ /rewards/claim/admin response:', {
        status: response.status,
        data: response.data,
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Error calling /rewards/claim/admin:', {
        userId,
        rewardId,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        errorData: error?.response?.data,
        errorMessage: error?.message,
        fullError: error,
      });
      
      let errorMessage = 'Failed to claim badge. Please try again.';
      
      if (error?.response?.data?.message) {
        const apiMessage = error.response.data.message;
        
        if (apiMessage.includes('insufficient') || apiMessage.includes('Insufficient')) {
          errorMessage = apiMessage.replace(/claim/g, 'process').replace(/admin/gi, '');
        } else if (apiMessage.includes('already been claimed')) {
          errorMessage = 'This badge has already been claimed.';
        } else if (apiMessage.includes('has not been awarded')) {
          errorMessage = 'You need to earn this badge before claiming it.';
        } else if (apiMessage.includes('wallet')) {
          errorMessage = 'There was an issue with your wallet. Please contact support.';
        } else if (apiMessage.includes('network') || apiMessage.includes('timeout')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          // Generic sanitized message for other errors
          errorMessage = apiMessage.replace(/\/rewards\/claim\/admin/gi, 'the server')
                                    .replace(/claim\/admin/gi, 'process')
                                    .replace(/admin/gi, '');
        }
      } else if (error?.message) {
        errorMessage = error.message.replace(/\/rewards\/claim\/admin/gi, 'the server')
                                    .replace(/claim\/admin/gi, 'process')
                                    .replace(/admin/gi, '');
      }
      
      throw new Error(errorMessage);
    }
  }

  async getAllRewards(): Promise<Reward[]> {
    try {
      const response = await httpClient.get('/rewards');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching rewards:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch rewards';
      throw new Error(errorMessage);
    }
  }

  async getRewardById(id: string): Promise<Reward> {
    try {
      const response = await httpClient.get(`/rewards/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching reward with ID ${id}:`, error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch reward';
      throw new Error(errorMessage);
    }
  }

  async createReward(data: {
    type: 'certificate' | 'points';
    title: string;
    description: string;
    imageUrl?: string;
  }): Promise<Reward> {
    try {
      const response = await httpClient.post('/rewards', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating reward:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create reward';
      throw new Error(errorMessage);
    }
  }

  async updateReward(
    id: string,
    data: {
      type?: 'certificate' | 'points';
      title?: string;
      description?: string;
      imageUrl?: string;
    }
  ): Promise<Reward> {
    try {
      const response = await httpClient.put(`/rewards/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error(`Error updating reward with ID ${id}:`, error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update reward';
      throw new Error(errorMessage);
    }
  }

  async deleteReward(id: string): Promise<boolean> {
    try {
      const response = await httpClient.delete(`/rewards/${id}`);
      return response.data.success;
    } catch (error: any) {
      console.error(`Error deleting reward with ID ${id}:`, error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete reward';
      throw new Error(errorMessage);
    }
  }

  async getUserRewards(userId: string): Promise<UserRewardWithDetails[]> {
    try {
      const response = await httpClient.get(`/rewards/user/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching rewards for user ${userId}:`, error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch user rewards';
      throw new Error(errorMessage);
    }
  }

  async awardRewardToUser(userId: string, rewardId: string): Promise<UserRewardWithDetails> {
    try {
      const response = await httpClient.post('/rewards/award', { userId, rewardId });
      return response.data;
    } catch (error: any) {
      console.error(`Error awarding reward ${rewardId} to user ${userId}:`, error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to award reward';
      throw new Error(errorMessage);
    }
  }

  async removeRewardFromUser(userId: string, rewardId: string): Promise<boolean> {
    try {
      const response = await httpClient.delete(`/rewards/user?userId=${userId}&rewardId=${rewardId}`);
      return response.data.success;
    } catch (error: any) {
      console.error(`Error removing reward ${rewardId} from user ${userId}:`, error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to remove reward from user';
      throw new Error(errorMessage);
    }
  }

  async getUserCertificateCount(userId: string): Promise<number> {
    try {
      const response = await httpClient.get(`/rewards/user/${userId}/certificate-count`);
      return response.data.count;
    } catch (error: any) {
      console.error(`Error fetching certificate count for user ${userId}:`, error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch certificate count';
      throw new Error(errorMessage);
    }
  }

  async getUsersWithReward(rewardId: string): Promise<any[]> {
    try {
      const response = await httpClient.get(`/rewards/recipients/${rewardId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching users with reward ${rewardId}:`, error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch reward recipients';
      throw new Error(errorMessage);
    }
  }

  async getClaimStatus(userId: string, rewardId: string): Promise<{
    claimed: boolean;
    signature?: string;
    awarded: boolean;
  }> {
    try {
      const response = await httpClient.get(`/rewards/claim-status/${userId}/${rewardId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching claim status for reward ${rewardId}:`, error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch claim status';
      throw new Error(errorMessage);
    }
  }
}