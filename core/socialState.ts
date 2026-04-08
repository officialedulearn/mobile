import {
  SocialService,
  FollowStats,
  UserFollow,
  NotificationPreferences,
} from "@/services/social.service";
import { create } from "zustand";

interface SocialState {
  followStatsByUserId: Record<string, FollowStats>;
  followersByUserId: Record<string, UserFollow[]>;
  followingByUserId: Record<string, UserFollow[]>;
  isFollowingByKey: Record<string, boolean>;
  notificationPrefsByUserId: Record<string, NotificationPreferences>;
  isLoading: boolean;
  error: string | null;

  fetchFollowStats: (userId: string) => Promise<void>;
  fetchFollowers: (userId: string) => Promise<void>;
  fetchFollowing: (userId: string) => Promise<void>;
  checkIsFollowing: (currentUserId: string, targetUserId: string) => Promise<boolean>;
  fetchNotificationPreferences: (userId: string) => Promise<void>;
  followUser: (userId: string, preferences?: Partial<NotificationPreferences>) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  updateNotificationPreferences: (userId: string, prefs: Partial<NotificationPreferences>) => Promise<void>;
  setFollowingCache: (currentUserId: string, targetUserId: string, isFollowing: boolean) => void;
  setNotificationPrefsCache: (userId: string, prefs: NotificationPreferences) => void;
  resetState: () => void;
}

const socialService = new SocialService();

const followKey = (a: string, b: string) => `${a}-${b}`;

const useSocialStore = create<SocialState>((set, get) => ({
  followStatsByUserId: {},
  followersByUserId: {},
  followingByUserId: {},
  isFollowingByKey: {},
  notificationPrefsByUserId: {},
  isLoading: false,
  error: null,

  fetchFollowStats: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const stats = await socialService.getFollowStats(userId);
      set((state) => ({
        followStatsByUserId: { ...state.followStatsByUserId, [userId]: stats },
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to fetch follow stats:", error);
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch follow stats",
      });
    }
  },

  fetchFollowers: async (userId: string) => {
    try {
      const followers = await socialService.getFollowers(userId);
      set((state) => ({
        followersByUserId: { ...state.followersByUserId, [userId]: followers },
      }));
    } catch (error) {
      console.error("Failed to fetch followers:", error);
      throw error;
    }
  },

  fetchFollowing: async (userId: string) => {
    try {
      const following = await socialService.getFollowing(userId);
      set((state) => ({
        followingByUserId: { ...state.followingByUserId, [userId]: following },
      }));
    } catch (error) {
      console.error("Failed to fetch following:", error);
      throw error;
    }
  },

  checkIsFollowing: async (currentUserId: string, targetUserId: string) => {
    try {
      const isFollowing = await socialService.isFollowing(targetUserId);
      const key = followKey(currentUserId, targetUserId);
      set((state) => ({
        isFollowingByKey: { ...state.isFollowingByKey, [key]: isFollowing },
      }));
      return isFollowing;
    } catch (error) {
      console.error("Failed to check follow status:", error);
      throw error;
    }
  },

  fetchNotificationPreferences: async (userId: string) => {
    try {
      const prefs = await socialService.getNotificationPreferences(userId);
      set((state) => ({
        notificationPrefsByUserId: { ...state.notificationPrefsByUserId, [userId]: prefs },
      }));
      return;
    } catch (error) {
      console.error("Failed to fetch notification preferences:", error);
      throw error;
    }
  },

  followUser: async (userId: string, preferences?: Partial<NotificationPreferences>) => {
    await socialService.followUser(userId, preferences);
  },

  unfollowUser: async (userId: string) => {
    await socialService.unfollowUser(userId);
  },

  updateNotificationPreferences: async (userId: string, prefs: Partial<NotificationPreferences>) => {
    await socialService.updateNotificationPreferences(userId, prefs);
  },

  setFollowingCache: (currentUserId: string, targetUserId: string, isFollowing: boolean) => {
    const key = followKey(currentUserId, targetUserId);
    set((state) => ({
      isFollowingByKey: { ...state.isFollowingByKey, [key]: isFollowing },
    }));
  },

  setNotificationPrefsCache: (userId: string, prefs: NotificationPreferences) => {
    set((state) => ({
      notificationPrefsByUserId: { ...state.notificationPrefsByUserId, [userId]: prefs },
    }));
  },

  resetState: () => {
    set({
      followStatsByUserId: {},
      followersByUserId: {},
      followingByUserId: {},
      isFollowingByKey: {},
      notificationPrefsByUserId: {},
      isLoading: false,
      error: null,
    });
  },
}));

export default useSocialStore;
