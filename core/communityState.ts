import { CommunityService } from "@/services/community.service";
import type {
  Community,
  UserCommunity,
  CommunityMember,
  CommunityMod,
  CommunityJoinRequest,
  RoomMessageWithUI,
} from "@/interface/Community";
import { create } from "zustand";

interface CommunityDetails {
  memberCount: number;
  description?: string;
}

export interface RoomMessagesCacheEntry {
  messages: RoomMessageWithUI[];
  hasMore: boolean;
  messageOffset: number;
  moderatorId: string | null;
  isMod: boolean;
}

export interface RoomInfoCacheEntry {
  members: CommunityMember[];
  moderator: CommunityMod | null;
  pendingRequests: CommunityJoinRequest[];
  isMod: boolean;
}

interface CommunityState {
  userCommunities: UserCommunity[];
  userCommunitiesUserId: string | null;
  communityDetailsById: Record<string, CommunityDetails>;
  publicCommunities: Community[];
  communityById: Record<string, Community>;
  roomMessagesByCommunityId: Record<string, RoomMessagesCacheEntry>;
  roomInfoByCommunityId: Record<string, RoomInfoCacheEntry>;
  isLoading: boolean;
  error: string | null;

  fetchUserCommunities: (userId: string, options?: { force?: boolean }) => Promise<void>;
  fetchCommunityDetails: (communityId: string, title?: string) => Promise<CommunityDetails>;
  fetchPublicCommunities: () => Promise<void>;
  fetchCommunityById: (communityId: string) => Promise<Community | undefined>;
  mergeCommunity: (community: Community) => void;
  setRoomMessagesCache: (communityId: string, entry: RoomMessagesCacheEntry) => void;
  setRoomInfoCache: (communityId: string, entry: RoomInfoCacheEntry) => void;
  resetState: () => void;
}

const communityService = new CommunityService();

const useCommunityStore = create<CommunityState>((set, get) => ({
  userCommunities: [],
  userCommunitiesUserId: null,
  communityDetailsById: {},
  publicCommunities: [],
  communityById: {},
  roomMessagesByCommunityId: {},
  roomInfoByCommunityId: {},
  isLoading: false,
  error: null,

  mergeCommunity: (community: Community) => {
    set((state) => ({
      communityById: { ...state.communityById, [community.id]: community },
    }));
  },

  setRoomMessagesCache: (communityId: string, entry: RoomMessagesCacheEntry) => {
    set((state) => ({
      roomMessagesByCommunityId: {
        ...state.roomMessagesByCommunityId,
        [communityId]: entry,
      },
    }));
  },

  setRoomInfoCache: (communityId: string, entry: RoomInfoCacheEntry) => {
    set((state) => ({
      roomInfoByCommunityId: {
        ...state.roomInfoByCommunityId,
        [communityId]: entry,
      },
    }));
  },

  fetchUserCommunities: async (userId: string, options?: { force?: boolean }) => {
    if (!options?.force && get().userCommunitiesUserId === userId) {
      return;
    }
    try {
      set({ isLoading: true, error: null });
      const data = await communityService.getUserCommunities(userId);
      const details: Record<string, CommunityDetails> = {};
      await Promise.all(
        data.map(async (community) => {
          try {
            const countData = await communityService.getMemberCount(community.id);
            details[community.id] = {
              memberCount: countData.count,
              description: `Join ${community.title} to connect with like-minded learners`,
            };
          } catch (err) {
            console.error(`Error fetching details for ${community.id}:`, err);
            details[community.id] = { memberCount: 0, description: "Join this community" };
          }
        })
      );
      set((state) => ({
        userCommunities: data,
        userCommunitiesUserId: userId,
        communityDetailsById: { ...state.communityDetailsById, ...details },
        isLoading: false,
      }));
    } catch (err) {
      console.error("Error fetching user communities:", err);
      set({
        isLoading: false,
        error: "Failed to load communities",
      });
    }
  },

  fetchCommunityDetails: async (communityId: string, title?: string) => {
    try {
      const countData = await communityService.getMemberCount(communityId);
      const details: CommunityDetails = {
        memberCount: countData.count,
        description: title ? `Join ${title} to connect with like-minded learners` : undefined,
      };
      set((state) => ({
        communityDetailsById: { ...state.communityDetailsById, [communityId]: details },
      }));
      return details;
    } catch (err) {
      console.error(`Error fetching details for ${communityId}:`, err);
      return { memberCount: 0 };
    }
  },

  fetchPublicCommunities: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await communityService.getPublicCommunities();
      const details: Record<string, CommunityDetails> = {};
      await Promise.all(
        data.map(async (community) => {
          try {
            const countData = await communityService.getMemberCount(community.id);
            details[community.id] = { memberCount: countData.count };
          } catch (err) {
            console.error(`Error fetching member count for ${community.id}:`, err);
            details[community.id] = { memberCount: 0 };
          }
        })
      );
      set((state) => ({
        publicCommunities: data,
        communityDetailsById: { ...state.communityDetailsById, ...details },
        isLoading: false,
      }));
    } catch (err) {
      console.error("Error fetching public communities:", err);
      set({ isLoading: false });
    }
  },

  fetchCommunityById: async (communityId: string) => {
    try {
      const community = await communityService.getCommunityById(communityId);
      set((state) => ({
        communityById: { ...state.communityById, [communityId]: community },
      }));
      return community;
    } catch (error) {
      console.error("Failed to fetch community by ID:", error);
      return undefined;
    }
  },

  resetState: () => {
    set({
      userCommunities: [],
      userCommunitiesUserId: null,
      communityDetailsById: {},
      publicCommunities: [],
      communityById: {},
      roomMessagesByCommunityId: {},
      roomInfoByCommunityId: {},
      isLoading: false,
      error: null,
    });
  },
}));

export default useCommunityStore;
