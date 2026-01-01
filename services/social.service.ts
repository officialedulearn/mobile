import httpClient from "@/utils/httpClient";

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

export class SocialService {
    async followUser(
        userId: string, 
        preferences?: Partial<NotificationPreferences>
    ): Promise<{ message: string }> {
        try {
            const response = await httpClient.post(`/social/follow/${userId}`, preferences);
            return response.data;
        } catch (error) {
            console.error("Error following user:", error);
            throw error;
        }
    }

    async unfollowUser(userId: string): Promise<{ message: string }> {
        try {
            const response = await httpClient.delete(`/social/unfollow/${userId}`);
            return response.data;
        } catch (error) {
            console.error("Error unfollowing user:", error);
            throw error;
        }
    }

    async isFollowing(userId: string): Promise<boolean> {
        try {
            const response = await httpClient.get(`/social/is-following/${userId}`);
            return response.data.isFollowing;
        } catch (error) {
            console.error("Error checking follow status:", error);
            throw error;
        }
    }

    async getFollowers(userId: string): Promise<UserFollow[]> {
        try {
            const response = await httpClient.get(`/social/followers/${userId}`);
            return response.data.followers;
        } catch (error) {
            console.error("Error fetching followers:", error);
            throw error;
        }
    }

    async getFollowing(userId: string): Promise<UserFollow[]> {
        try {
            const response = await httpClient.get(`/social/following/${userId}`);
            return response.data.following;
        } catch (error) {
            console.error("Error fetching following:", error);
            throw error;
        }
    }

    async getFollowStats(userId: string): Promise<FollowStats> {
        try {
            const response = await httpClient.get(`/social/stats/${userId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching follow stats:", error);
            throw error;
        }
    }

    async updateNotificationPreferences(
        userId: string,
        preferences: Partial<NotificationPreferences>
    ): Promise<{ message: string }> {
        try {
            const response = await httpClient.put(`/social/notification-preferences/${userId}`, preferences);
            return response.data;
        } catch (error) {
            console.error("Error updating notification preferences:", error);
            throw error;
        }
    }

    async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
        try {
            const response = await httpClient.get(`/social/notification-preferences/${userId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching notification preferences:", error);
            throw error;
        }
    }
}