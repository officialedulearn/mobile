import { BaseService } from "./base.service";

interface Reward {
  id: string;
  type: "certificate" | "points";
  title: string;
  description: string;
  imageUrl?: string;
  createdAt?: string;
  ipfs?: string;
}

interface UserRewardWithDetails {
  id: string;
  type: "certificate" | "points";
  title: string;
  description: string;
  earnedAt: string;
  signature?: string;
}

export class RewardsService extends BaseService {
  async claimReward(userId: string, rewardId: string): Promise<any> {
    const response = await this.executeRequest(
      this.getClient().post("/rewards/claim", { userId, rewardId })
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async claimRewardAdmin(userId: string, rewardId: string): Promise<any> {
    const response = await this.executeRequest(
      this.getClient().post("/rewards/claim/admin", { userId, rewardId })
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async getAllRewards(): Promise<Reward[]> {
    const response = await this.executeRequest<Reward[]>(
      this.getClient().get("/rewards")
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getRewardById(id: string): Promise<Reward> {
    const response = await this.executeRequest<Reward>(
      this.getClient().get(`/rewards/${id}`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async createReward(data: {
    type: "certificate" | "points";
    title: string;
    description: string;
    imageUrl?: string;
  }): Promise<Reward> {
    const response = await this.executeRequest<Reward>(
      this.getClient().post("/rewards", data)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async updateReward(
    id: string,
    data: {
      type?: "certificate" | "points";
      title?: string;
      description?: string;
      imageUrl?: string;
    }
  ): Promise<Reward> {
    const response = await this.executeRequest<Reward>(
      this.getClient().put(`/rewards/${id}`, data)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async deleteReward(id: string): Promise<boolean> {
    const response = await this.executeRequest(
      this.getClient().delete(`/rewards/${id}`)
    );
    if (response.error) throw response.error;
    return response.data?.success ?? false;
  }

  async getUserRewards(userId: string): Promise<UserRewardWithDetails[]> {
    const response = await this.executeRequest<UserRewardWithDetails[]>(
      this.getClient().get(`/rewards/user/${userId}`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async awardRewardToUser(userId: string, rewardId: string): Promise<UserRewardWithDetails> {
    const response = await this.executeRequest<UserRewardWithDetails>(
      this.getClient().post("/rewards/award", { userId, rewardId })
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async removeRewardFromUser(userId: string, rewardId: string): Promise<boolean> {
    const response = await this.executeRequest(
      this.getClient().delete(`/rewards/user?userId=${userId}&rewardId=${rewardId}`)
    );
    if (response.error) throw response.error;
    return response.data?.success ?? false;
  }

  async getUserCertificateCount(userId: string): Promise<number> {
    const response = await this.executeRequest(
      this.getClient().get(`/rewards/user/${userId}/certificate-count`)
    );
    if (response.error) throw response.error;
    return response.data?.count ?? 0;
  }

  async getUsersWithReward(rewardId: string): Promise<any[]> {
    const response = await this.executeRequest<any[]>(
      this.getClient().get(`/rewards/recipients/${rewardId}`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getClaimStatus(
    userId: string,
    rewardId: string
  ): Promise<{
    claimed: boolean;
    signature?: string;
    awarded: boolean;
  }> {
    const response = await this.executeRequest(
      this.getClient().get(`/rewards/claim-status/${userId}/${rewardId}`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }
}
