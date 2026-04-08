import { RoadmapService } from "@/services/roadmap.service";
import type { Roadmap, RoadmapWithSteps } from "@/interface/Roadmap";
import { create } from "zustand";

interface RoadmapState {
  roadmaps: Roadmap[];
  roadmapsUserId: string | null;
  roadmapWithStepsById: Record<string, RoadmapWithSteps>;
  isLoading: boolean;
  error: string | null;

  fetchRoadmaps: (userId: string) => Promise<void>;
  fetchRoadmapById: (roadmapId: string) => Promise<RoadmapWithSteps | undefined>;
  resetState: () => void;
}

const roadmapService = new RoadmapService();

const useRoadmapStore = create<RoadmapState>((set, get) => ({
  roadmaps: [],
  roadmapsUserId: null,
  roadmapWithStepsById: {},
  isLoading: false,
  error: null,

  fetchRoadmaps: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const roadmaps = await roadmapService.getUserRoadmaps(userId);
      set({
        roadmaps,
        roadmapsUserId: userId,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch roadmaps:", error);
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch roadmaps",
      });
      throw error;
    }
  },

  fetchRoadmapById: async (roadmapId: string) => {
    try {
      const data = await roadmapService.getRoadmapById(roadmapId);
      set((state) => ({
        roadmapWithStepsById: { ...state.roadmapWithStepsById, [roadmapId]: data },
      }));
      return data;
    } catch (error) {
      console.error("Failed to fetch roadmap by ID:", error);
      return undefined;
    }
  },

  resetState: () => {
    set({
      roadmaps: [],
      roadmapsUserId: null,
      roadmapWithStepsById: {},
      isLoading: false,
      error: null,
    });
  },
}));

export default useRoadmapStore;
