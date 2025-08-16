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
    } catch (error) {
      console.error(`Error claiming reward ${rewardId} for user ${userId}:`, error);
      throw error;
    }
  }

  async getAllRewards(): Promise<Reward[]> {
    try {
      const response = await httpClient.get('/rewards');
      return response.data;
    } catch (error) {
      console.error('Error fetching rewards:', error);
      throw error;
    }
  }

  async getRewardById(id: string): Promise<Reward> {
    try {
      const response = await httpClient.get(`/rewards/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching reward with ID ${id}:`, error);
      throw error;
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
    } catch (error) {
      console.error('Error creating reward:', error);
      throw error;
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
    } catch (error) {
      console.error(`Error updating reward with ID ${id}:`, error);
      throw error;
    }
  }

  async deleteReward(id: string): Promise<boolean> {
    try {
      const response = await httpClient.delete(`/rewards/${id}`);
      return response.data.success;
    } catch (error) {
      console.error(`Error deleting reward with ID ${id}:`, error);
      throw error;
    }
  }

  async getUserRewards(userId: string): Promise<UserRewardWithDetails[]> {
    try {
      const response = await httpClient.get(`/rewards/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching rewards for user ${userId}:`, error);
      throw error;
    }
  }

  async awardRewardToUser(userId: string, rewardId: string): Promise<UserRewardWithDetails> {
    try {
      const response = await httpClient.post('/rewards/award', { userId, rewardId });
      return response.data;
    } catch (error) {
      console.error(`Error awarding reward ${rewardId} to user ${userId}:`, error);
      throw error;
    }
  }

  async removeRewardFromUser(userId: string, rewardId: string): Promise<boolean> {
    try {
      const response = await httpClient.delete(`/rewards/user?userId=${userId}&rewardId=${rewardId}`);
      return response.data.success;
    } catch (error) {
      console.error(`Error removing reward ${rewardId} from user ${userId}:`, error);
      throw error;
    }
  }

  async getUserCertificateCount(userId: string): Promise<number> {
    try {
      const response = await httpClient.get(`/rewards/user/${userId}/certificate-count`);
      return response.data.count;
    } catch (error) {
      console.error(`Error fetching certificate count for user ${userId}:`, error);
      throw error;
    }
  }

  async getUsersWithReward(rewardId: string): Promise<any[]> {
    try {
      const response = await httpClient.get(`/rewards/recipients/${rewardId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching users with reward ${rewardId}:`, error);
      throw error;
    }
  }
}