import { BaseService } from "./base.service";

export interface FollowStats {
  followersCount: number;
  followingCount: number;
}

export interface UserFollow {
  id: string;
  username: string;
  name: string;
  email: string;
  profilePictureURL?: string;
  level: string;
  xp: number;
  verified: boolean;
  createdAt: Date;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
}

export class SocialService extends BaseService {
  async followUser(
    userId: string,
    preferences?: Partial<NotificationPreferences>
  ): Promise<{ message: string }> {
    const response = await this.executeRequest(
      this.getClient().post(`/social/follow/${userId}`, preferences)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async unfollowUser(userId: string): Promise<{ message: string }> {
    const response = await this.executeRequest(
      this.getClient().delete(`/social/unfollow/${userId}`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async isFollowing(userId: string): Promise<boolean> {
    const response = await this.executeRequest(
      this.getClient().get(`/social/is-following/${userId}`)
    );
    if (response.error) throw response.error;
    return response.data?.isFollowing ?? false;
  }

  async getFollowers(userId: string): Promise<UserFollow[]> {
    const response = await this.executeRequest(
      this.getClient().get(`/social/followers/${userId}`)
    );
    if (response.error) throw response.error;
    return response.data?.followers ?? [];
  }

  async getFollowing(userId: string): Promise<UserFollow[]> {
    const response = await this.executeRequest(
      this.getClient().get(`/social/following/${userId}`)
    );
    if (response.error) throw response.error;
    return response.data?.following ?? [];
  }

  async getFollowStats(userId: string): Promise<FollowStats> {
    const response = await this.executeRequest<FollowStats>(
      this.getClient().get(`/social/stats/${userId}`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<{ message: string }> {
    const response = await this.executeRequest(
      this.getClient().put(`/social/notification-preferences/${userId}`, preferences)
    );
    if (response.error) throw response.error;
    return response.data!;
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const response = await this.executeRequest<NotificationPreferences>(
      this.getClient().get(`/social/notification-preferences/${userId}`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }
}
