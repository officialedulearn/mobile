import { AgentService } from "@/services/agent.service";
import type { Agent, createAgentRequest } from "@/types/agent.types";
import { create } from "zustand";

const agentService = new AgentService();

export interface AgentStore {
  agent: Agent | null;
  agentUserId: string | null;
  userHasAgent: boolean;
  isLoading: boolean;
  error: string | null;
  fetchUserAgent: (userId: string) => Promise<void>;
  fetchAgent: (agentId: string) => Promise<void>;
  createAgent: (request: createAgentRequest) => Promise<Agent | undefined>;
  uploadAgentProfilePicture: (
    agentId: string,
    imageUri: string,
  ) => Promise<{ profile_picture_url: string }>;
  resetState: () => void;
}

const useAgentStore = create<AgentStore>((set) => ({
  agent: null,
  agentUserId: null,
  userHasAgent: false,
  isLoading: false,
  error: null,

  fetchUserAgent: async (userId: string) => {
    const state = useAgentStore.getState();
    if (state.isLoading || (state.agentUserId === userId && state.agent)) {
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const agent = await agentService.getUserAgent(userId);
      set({ agent, agentUserId: userId, userHasAgent: true, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch user agent:", error);
      set({
        agent: null,
        agentUserId: userId,
        userHasAgent: false,
        isLoading: false,
        error: "Failed to load agent",
      });
    }
  },

  fetchAgent: async (agentId: string) => {
    try {
      set({ isLoading: true, error: null });
      const agent = await agentService.getAgent(agentId);
      set({ agent, userHasAgent: true, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch agent:", error);
      set({ isLoading: false, error: "Failed to load agent" });
    }
  },

  createAgent: async (request: createAgentRequest) => {
    try {
      set({ isLoading: true, error: null });
      const agent = await agentService.createAgent(request);
      set({
        agent,
        agentUserId: request.userId,
        userHasAgent: true,
        isLoading: false,
      });
      return agent;
    } catch (error) {
      console.error("Failed to create agent:", error);
      set({ isLoading: false, error: "Failed to create agent" });
      return undefined;
    }
  },

  uploadAgentProfilePicture: async (
    agentId: string,
    imageUri: string,
  ): Promise<{ profile_picture_url: string }> => {
    try {
      const result = await agentService.uploadAgentProfilePicture(
        agentId,
        imageUri,
      );
      set((state) => ({
        agent:
          state.agent?.id === agentId
            ? {
                ...state.agent,
                profile_picture_url: result.profile_picture_url,
              }
            : state.agent,
      }));
      return result;
    } catch (error) {
      console.error("Failed to upload agent profile picture:", error);
      set({ error: "Failed to upload agent photo" });
      throw error;
    }
  },

  resetState: () => {
    set({
      agent: null,
        agentUserId: null,
      userHasAgent: false,
      isLoading: false,
      error: null,
    });
  },
}));

export default useAgentStore;
