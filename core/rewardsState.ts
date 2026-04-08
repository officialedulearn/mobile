import { RewardsService } from "@/services/rewards.service";
import { create } from "zustand";

export interface Reward {
  id: string;
  type: "certificate" | "points";
  title: string;
  description: string;
  imageUrl?: string;
  createdAt?: string;
  ipfs?: string;
}

export interface UserRewardWithDetails {
  id: string;
  type: "certificate" | "points";
  title: string;
  description: string;
  earnedAt: string;
  signature?: string;
  imageUrl?: string;
}

interface ClaimStatus {
  claimed: boolean;
  awarded: boolean;
  signature?: string;
}

interface RewardsState {
  allRewards: Reward[];
  userRewardsByUserId: Record<string, UserRewardWithDetails[]>;
  rewardById: Record<string, Reward>;
  claimStatusByKey: Record<string, ClaimStatus>;
  isLoading: boolean;
  error: string | null;

  fetchAllRewards: () => Promise<void>;
  fetchUserRewards: (userId: string) => Promise<void>;
  fetchRewardById: (id: string) => Promise<Reward | undefined>;
  fetchClaimStatus: (userId: string, rewardId: string) => Promise<ClaimStatus>;
  invalidateUserRewards: (userId: string) => void;
  resetState: () => void;
}

const rewardsService = new RewardsService();

const useRewardsStore = create<RewardsState>((set, get) => ({
  allRewards: [],
  userRewardsByUserId: {},
  rewardById: {},
  claimStatusByKey: {},
  isLoading: false,
  error: null,

  fetchAllRewards: async () => {
    try {
      set({ isLoading: true, error: null });
      const allRewards = await rewardsService.getAllRewards();
      set((state) => {
        const rewardById = { ...state.rewardById };
        allRewards.forEach((r) => {
          rewardById[r.id] = r;
        });
        return { allRewards, rewardById, isLoading: false };
      });
    } catch (error) {
      console.error("Failed to fetch all rewards:", error);
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch rewards",
      });
    }
  },

  fetchUserRewards: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const userRewards = await rewardsService.getUserRewards(userId);
      set((state) => ({
        userRewardsByUserId: { ...state.userRewardsByUserId, [userId]: userRewards },
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to fetch user rewards:", error);
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch user rewards",
      });
    }
  },

  fetchRewardById: async (id: string) => {
    try {
      const reward = await rewardsService.getRewardById(id);
      set((state) => ({
        rewardById: { ...state.rewardById, [id]: reward },
      }));
      return reward;
    } catch (error) {
      console.error("Failed to fetch reward by ID:", error);
      return undefined;
    }
  },

  fetchClaimStatus: async (userId: string, rewardId: string) => {
    try {
      const status = await rewardsService.getClaimStatus(userId, rewardId);
      const key = `${userId}-${rewardId}`;
      set((state) => ({
        claimStatusByKey: { ...state.claimStatusByKey, [key]: status },
      }));
      return status;
    } catch (error) {
      console.error("Failed to fetch claim status:", error);
      throw error;
    }
  },

  invalidateUserRewards: (userId: string) => {
    set((state) => {
      const next = { ...state.userRewardsByUserId };
      delete next[userId];
      return { userRewardsByUserId: next };
    });
  },

  resetState: () => {
    set({
      allRewards: [],
      userRewardsByUserId: {},
      rewardById: {},
      claimStatusByKey: {},
      isLoading: false,
      error: null,
    });
  },
}));

export default useRewardsStore;
