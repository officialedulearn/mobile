import type { ReferralOverviewResponse } from "@/interface/referral";
import { ReferralService } from "@/services/referral.service";
import { create } from "zustand";

interface FetchReferralOptions {
  force?: boolean;
}

interface ReferralState {
  overview: ReferralOverviewResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchedAt: number | null;
  fetchReferralOverview: (options?: FetchReferralOptions) => Promise<void>;
  refreshReferralOverview: () => Promise<void>;
  resetState: () => void;
}

const referralService = new ReferralService();

const useReferralStore = create<ReferralState>((set, get) => ({
  overview: null,
  isLoading: false,
  error: null,
  fetchedAt: null,

  fetchReferralOverview: async ({ force = false } = {}) => {
    const { overview, isLoading } = get();

    if (!force && overview) {
      return;
    }

    if (isLoading) {
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const payload = await referralService.getMyReferralOverview();
      console.log("payload", payload);
      set({
        overview: payload,
        isLoading: false,
        error: null,
        fetchedAt: Date.now(),
      });
    } catch (error) {
      console.log("error", error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load referral leaderboard",
      });
    }
  },

  refreshReferralOverview: async () => {
    await get().fetchReferralOverview({ force: true });
  },

  resetState: () => {
    set({
      overview: null,
      isLoading: false,
      error: null,
      fetchedAt: null,
    });
  },
}));

export default useReferralStore;
