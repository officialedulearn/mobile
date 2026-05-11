import type {
  CommunityJoinRequest,
  RoomMessage,
  RoomMessageWithUI,
} from "@/interface/Community";
import type {
  CommunityDetails,
  CommunityRoomRealtimeState,
  CommunityRoomSocketContext,
  CommunityStore,
  RoomMessagesCacheEntry,
} from "@/types/communityStore.types";
import { CommunityService } from "@/services/community.service";
import {
  formatMessageDate,
  formatMessageTime,
} from "@/utils/hub/roomFormatting";
import type {
  CommunityMessageCreatedPayload,
  CommunityMessageDeletedPayload,
  CommunityReactionUpdatedPayload,
  CommunityRoomPresencePayload,
  CommunityTypingPayload,
  RealtimeEventName,
  RealtimeEventPayloadMap,
} from "@/types/realtime.types";
import type { StoreApi } from "zustand";
import { create } from "zustand";

export type {
  CommunityDetails,
  CommunityRoomRealtimeState,
  CommunityRoomSocketContext,
  CommunityStore,
  CommunityStoreActions,
  CommunityStoreState,
  RoomInfoCacheEntry,
  RoomMessagesCacheEntry,
} from "@/types/communityStore.types";

const communityService = new CommunityService();

function reactionsRecordFromReactions(
  reactions: { reaction: string }[],
): Record<string, number> {
  const reactionCounts: Record<string, number> = {};
  for (const r of reactions) {
    reactionCounts[r.reaction] = (reactionCounts[r.reaction] || 0) + 1;
  }
  return reactionCounts;
}

function reactionRecordFromCounts(
  counts: { reaction: string; count: number }[],
): Record<string, number> {
  const reactionCounts: Record<string, number> = {};
  for (const rc of counts) {
    reactionCounts[rc.reaction] = rc.count;
  }
  return reactionCounts;
}

function toRoomMessageWithUI(
  msg: RoomMessage & {
    reactionCounts?: Record<string, number>;
    isMod?: boolean;
  },
  viewerUserId: string | undefined,
): RoomMessageWithUI {
  const timestamp = new Date(msg.createdAt);
  return {
    ...msg,
    date: formatMessageDate(timestamp),
    time: formatMessageTime(timestamp),
    isCurrentUser: viewerUserId !== undefined && msg.user.id === viewerUserId,
    reactions: msg.reactionCounts ? { ...msg.reactionCounts } : {},
    userAvatar: msg.user.profilePictureURL || undefined,
    userName: `@${msg.user.username}`,
    isMod: msg.isMod ?? false,
    message: msg.content,
  };
}

async function enrichMessagesWithReactions(
  messagesRaw: RoomMessage[],
  moderatorId: string | null,
): Promise<
  (RoomMessage & { reactionCounts: Record<string, number>; isMod: boolean })[]
> {
  return Promise.all(
    messagesRaw.map(async (msg) => {
      try {
        const reactions = await communityService.getMessageReactions(msg.id);
        return {
          ...msg,
          reactionCounts: reactionsRecordFromReactions(reactions),
          isMod: moderatorId === msg.user.id,
        };
      } catch {
        return {
          ...msg,
          reactionCounts: {},
          isMod: moderatorId === msg.user.id,
        };
      }
    }),
  );
}

function handleCommunityRealtimeEvent(
  get: () => CommunityStore,
  setState: StoreApi<CommunityStore>["setState"],
  eventName: RealtimeEventName,
  payload: unknown,
): void {
  if (eventName === "subscription.ready") {
    const event = payload as RealtimeEventPayloadMap["subscription.ready"];
    if (event.subscription.channel !== "community.room") return;
    const cid = event.subscription.id;
    if (event.onlineCount === undefined) return;
    setState((state) => ({
      roomRealtimeByCommunityId: {
        ...state.roomRealtimeByCommunityId,
        [cid]: {
          typingUsernames:
            state.roomRealtimeByCommunityId[cid]?.typingUsernames ?? [],
          onlineCount: event.onlineCount ?? 1,
        },
      },
    }));
    return;
  }

  if (
    eventName === "community.room.user_joined" ||
    eventName === "community.room.user_left"
  ) {
    const event = payload as CommunityRoomPresencePayload;
    const cid = event.communityId;
    setState((state) => {
      const prev = state.roomRealtimeByCommunityId[cid];
      return {
        roomRealtimeByCommunityId: {
          ...state.roomRealtimeByCommunityId,
          [cid]: {
            typingUsernames: prev?.typingUsernames ?? [],
            onlineCount: event.onlineCount,
          },
        },
      };
    });
    return;
  }

  if (eventName === "community.message.created") {
    void (async () => {
      const event = payload as CommunityMessageCreatedPayload;
      const cid = event.roomId;
      const sub = get().socketSubscriberByCommunityId[cid];
      if (!sub || event.user.id === sub.viewerUserId) {
        return;
      }

      let reactionCounts: Record<string, number> = {};
      try {
        const reactions = await communityService.getMessageReactions(event.id);
        reactionCounts = reactionsRecordFromReactions(reactions);
      } catch {
        reactionCounts = {};
      }

      const moderatorId =
        get().roomMessagesByCommunityId[cid]?.moderatorId ?? null;
      const processed = toRoomMessageWithUI(
        {
          ...event,
          reactionCounts,
          isMod: moderatorId === event.user.id,
        },
        sub.viewerUserId,
      );

      setState((state) => {
        const entry = state.roomMessagesByCommunityId[cid];
        if (!entry || entry.messages.some((m) => m.id === processed.id)) {
          return {};
        }
        return {
          roomMessagesByCommunityId: {
            ...state.roomMessagesByCommunityId,
            [cid]: {
              ...entry,
              messages: [processed, ...entry.messages],
            },
          },
        };
      });
    })();
    return;
  }

  if (eventName === "community.message.deleted") {
    const event = payload as CommunityMessageDeletedPayload;
    const cid = event.communityId;
    setState((state) => {
      const entry = state.roomMessagesByCommunityId[cid];
      if (!entry) return {};
      return {
        roomMessagesByCommunityId: {
          ...state.roomMessagesByCommunityId,
          [cid]: {
            ...entry,
            messages: entry.messages.filter((m) => m.id !== event.messageId),
          },
        },
      };
    });
    return;
  }

  if (
    eventName === "community.typing.started" ||
    eventName === "community.typing.stopped"
  ) {
    const event = payload as CommunityTypingPayload;
    const cid = event.communityId;
    const sub = get().socketSubscriberByCommunityId[cid];
    if (!sub || event.userId === sub.viewerUserId || !event.username) {
      return;
    }
    const username = event.username;

    setState((state) => {
      const prevRt = state.roomRealtimeByCommunityId[cid] ?? defaultRealtime();
      const nextTyping =
        eventName === "community.typing.started"
          ? prevRt.typingUsernames.includes(username)
            ? prevRt.typingUsernames
            : [...prevRt.typingUsernames, username]
          : prevRt.typingUsernames.filter((u) => u !== username);

      if (nextTyping === prevRt.typingUsernames) return {};

      return {
        roomRealtimeByCommunityId: {
          ...state.roomRealtimeByCommunityId,
          [cid]: {
            onlineCount: prevRt.onlineCount,
            typingUsernames: nextTyping,
          },
        },
      };
    });
    return;
  }

  if (eventName === "community.reaction.updated") {
    const event = payload as CommunityReactionUpdatedPayload;
    const reactions = reactionRecordFromCounts(event.reactionCounts);
    setState((state) => {
      let changed = false;
      const nextRooms = { ...state.roomMessagesByCommunityId };
      for (const cid of Object.keys(nextRooms)) {
        const entry = nextRooms[cid];
        if (!entry.messages.some((m) => m.id === event.messageId)) {
          continue;
        }
        changed = true;
        nextRooms[cid] = {
          ...entry,
          messages: entry.messages.map((msg) =>
            msg.id === event.messageId ? { ...msg, reactions } : msg,
          ),
        };
      }
      return changed ? { roomMessagesByCommunityId: nextRooms } : {};
    });
  }
}

function removeCommunityKey<T extends Record<string, unknown>>(
  record: T,
  communityId: string,
): T {
  const { [communityId]: _removed, ...rest } = record;
  return rest as T;
}

const defaultRealtime = (): CommunityRoomRealtimeState => ({
  onlineCount: 1,
  typingUsernames: [],
});

const useCommunityStore = create<CommunityStore>((set, get) => ({
  userCommunities: [],
  userCommunitiesUserId: null,
  communityDetailsById: {},
  publicCommunities: [],
  communityById: {},
  roomMessagesByCommunityId: {},
  roomInfoByCommunityId: {},
  communityMembersByCommunityId: {},
  roomRealtimeByCommunityId: {},
  socketSubscriberByCommunityId: {},
  roomMessagesInitialLoadingByCommunityId: {},
  roomMessagesMoreLoadingByCommunityId: {},
  isLoading: false,
  error: null,

  mergeCommunity: (community) => {
    set((state) => ({
      communityById: { ...state.communityById, [community.id]: community },
    }));
  },

  setRoomMessagesCache: (communityId, entry) => {
    set((state) => ({
      roomMessagesByCommunityId: {
        ...state.roomMessagesByCommunityId,
        [communityId]: entry,
      },
    }));
  },

  setRoomInfoCache: (communityId, entry) => {
    set((state) => ({
      roomInfoByCommunityId: {
        ...state.roomInfoByCommunityId,
        [communityId]: entry,
      },
    }));
  },

  fetchUserCommunities: async (userId, options) => {
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
            const countData = await communityService.getMemberCount(
              community.id,
            );
            details[community.id] = {
              memberCount: countData.count,
              description: `Join ${community.title} to connect with like-minded learners`,
            };
          } catch {
            details[community.id] = {
              memberCount: 0,
              description: "Join this community",
            };
          }
        }),
      );
      set((state) => ({
        userCommunities: data,
        userCommunitiesUserId: userId,
        communityDetailsById: { ...state.communityDetailsById, ...details },
        isLoading: false,
      }));
    } catch {
      set({
        isLoading: false,
        error: "Failed to load communities",
      });
    }
  },

  fetchCommunityDetails: async (communityId, title) => {
    try {
      const countData = await communityService.getMemberCount(communityId);
      const details = {
        memberCount: countData.count,
        description: title
          ? `Join ${title} to connect with like-minded learners`
          : undefined,
      };
      set((state) => ({
        communityDetailsById: {
          ...state.communityDetailsById,
          [communityId]: details,
        },
      }));
      return details;
    } catch {
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
            const countData = await communityService.getMemberCount(
              community.id,
            );
            details[community.id] = { memberCount: countData.count };
          } catch {
            details[community.id] = { memberCount: 0 };
          }
        }),
      );
      set((state) => ({
        publicCommunities: data,
        communityDetailsById: { ...state.communityDetailsById, ...details },
        isLoading: false,
      }));
    } catch {
      set({
        isLoading: false,
        error: "Failed to load public communities",
      });
    }
  },

  fetchAllCommunities: async () => communityService.getAllCommunities(),

  fetchCommunityById: async (communityId) => {
    try {
      const community = await communityService.getCommunityById(communityId);
      set((state) => ({
        communityById: { ...state.communityById, [communityId]: community },
      }));
      return community;
    } catch {
      return undefined;
    }
  },

  fetchCommunityByInviteCode: async (inviteCode) => {
    const community =
      await communityService.getCommunityByInviteCode(inviteCode);
    set((state) => ({
      communityById: { ...state.communityById, [community.id]: community },
    }));
    return community;
  },

  fetchInitialRoomMessages: async (communityId, viewerUserId, options) => {
    const limit = options?.limit ?? 20;
    set((state) => ({
      roomMessagesInitialLoadingByCommunityId: {
        ...state.roomMessagesInitialLoadingByCommunityId,
        [communityId]: true,
      },
    }));
    try {
      const modData = await communityService
        .getCommunityMod(communityId)
        .catch(() => null);
      const moderatorId = modData?.user.id ?? null;
      const messagesRaw = await communityService.getRoomMessages(
        communityId,
        limit,
        0,
        viewerUserId,
      );
      const messagesWithReactions = await enrichMessagesWithReactions(
        messagesRaw,
        moderatorId,
      );
      const messages = messagesWithReactions.map((msg) =>
        toRoomMessageWithUI(msg, viewerUserId),
      );
      const cacheEntry: RoomMessagesCacheEntry = {
        messages,
        hasMore: messagesRaw.length === limit,
        messageOffset: messagesRaw.length,
        moderatorId,
        isMod: moderatorId === viewerUserId,
      };
      set((state) => ({
        roomMessagesByCommunityId: {
          ...state.roomMessagesByCommunityId,
          [communityId]: cacheEntry,
        },
      }));
    } finally {
      set((state) => ({
        roomMessagesInitialLoadingByCommunityId: removeCommunityKey(
          state.roomMessagesInitialLoadingByCommunityId,
          communityId,
        ),
      }));
    }
  },

  fetchMoreRoomMessages: async (communityId, viewerUserId, options) => {
    const limit = options?.limit ?? 20;
    const prev = get().roomMessagesByCommunityId[communityId];
    if (!prev?.hasMore) {
      return;
    }

    set((state) => ({
      roomMessagesMoreLoadingByCommunityId: {
        ...state.roomMessagesMoreLoadingByCommunityId,
        [communityId]: true,
      },
    }));

    try {
      const messagesRaw = await communityService.getRoomMessages(
        communityId,
        limit,
        prev.messageOffset,
        viewerUserId,
      );
      const messagesWithReactions = await enrichMessagesWithReactions(
        messagesRaw,
        prev.moderatorId,
      );
      const processed = messagesWithReactions.map((msg) =>
        toRoomMessageWithUI(msg, viewerUserId),
      );

      set((state) => {
        const entry = state.roomMessagesByCommunityId[communityId];
        if (!entry) {
          return {};
        }
        return {
          roomMessagesByCommunityId: {
            ...state.roomMessagesByCommunityId,
            [communityId]: {
              ...entry,
              messages: [...entry.messages, ...processed],
              hasMore: messagesRaw.length === limit,
              messageOffset: entry.messageOffset + messagesRaw.length,
            },
          },
        };
      });
    } finally {
      set((state) => ({
        roomMessagesMoreLoadingByCommunityId: removeCommunityKey(
          state.roomMessagesMoreLoadingByCommunityId,
          communityId,
        ),
      }));
    }
  },

  hydrateCommunityRoomFeed: async (communityId, viewerUserId, options) => {
    await Promise.all([
      get().fetchCommunityById(communityId),
      get().fetchInitialRoomMessages(communityId, viewerUserId, {
        limit: options?.messagesLimit,
      }),
    ]);
  },

  fetchCommunityRoomInfo: async (communityId, viewerUserId) => {
    const members = await communityService.getCommunityMembers(communityId);
    const moderator = await communityService
      .getCommunityMod(communityId)
      .catch(() => null);
    let pendingRequests: CommunityJoinRequest[] = [];
    if (moderator && viewerUserId && moderator.user.id === viewerUserId) {
      pendingRequests = await communityService
        .getPendingJoinRequests(communityId, viewerUserId)
        .catch(() => []);
    }
    const entry = {
      members,
      moderator,
      pendingRequests,
      isMod: !!(
        moderator &&
        viewerUserId &&
        moderator.user.id === viewerUserId
      ),
    };
    set((state) => ({
      roomInfoByCommunityId: {
        ...state.roomInfoByCommunityId,
        [communityId]: entry,
      },
    }));
    return entry;
  },

  fetchCommunityMembersForRoom: async (communityId) => {
    const rows = await communityService.getCommunityMembers(communityId);
    set((state) => ({
      communityMembersByCommunityId: {
        ...state.communityMembersByCommunityId,
        [communityId]: rows,
      },
    }));
    return rows;
  },

  ensureCommunitySocketConnected: async () => {},

  subscribeCommunityRoomRealtime: (communityId, viewerUserId) => {
    const ctx: CommunityRoomSocketContext = { viewerUserId };
    set((state) => ({
      socketSubscriberByCommunityId: {
        ...state.socketSubscriberByCommunityId,
        [communityId]: ctx,
      },
      roomRealtimeByCommunityId: {
        ...state.roomRealtimeByCommunityId,
        [communityId]:
          state.roomRealtimeByCommunityId[communityId] ?? defaultRealtime(),
      },
    }));
  },

  unsubscribeCommunityRoomRealtime: (communityId) => {
    set((state) => ({
      socketSubscriberByCommunityId: removeCommunityKey(
        state.socketSubscriberByCommunityId,
        communityId,
      ),
    }));
  },

  disconnectCommunitySocket: () => {
    set({ socketSubscriberByCommunityId: {} });
  },

  isCommunitySocketConnected: () => false,

  sendCommunityRoomMessage: async (
    communityId,
    content,
    viewerUserId,
    mentionedUserIds,
    callback,
  ) => {
    try {
      const message = await communityService.createMessage(
        communityId,
        content,
        mentionedUserIds,
        viewerUserId,
      );
      callback?.({ success: true, message });
    } catch (error) {
      callback?.({
        error: error instanceof Error ? error.message : "Failed to send message",
      });
    }
  },

  deleteCommunityRoomMessageWs: async (messageId, _communityId, callback) => {
    try {
      await communityService.deleteMessage(messageId);
      callback?.({ success: true });
    } catch (error) {
      callback?.({
        error:
          error instanceof Error ? error.message : "Failed to delete message",
      });
    }
  },

  communityRoomStartTyping: async (communityId) => {
    await communityService.sendTyping(communityId, true);
  },

  communityRoomStopTyping: async (communityId) => {
    await communityService.sendTyping(communityId, false);
  },

  communityRoomAddReactionWs: async (messageId, communityId, reaction, callback) => {
    try {
      const result = await communityService.addReaction(
        messageId,
        reaction,
        undefined,
        communityId,
      );
      callback?.({ success: true, reaction: result });
    } catch (error) {
      callback?.({
        error:
          error instanceof Error ? error.message : "Failed to add reaction",
      });
    }
  },

  communityRoomRemoveReactionWs: async (messageId, _communityId, callback) => {
    try {
      await communityService.removeReaction(messageId);
      callback?.({ success: true });
    } catch (error) {
      callback?.({
        error:
          error instanceof Error ? error.message : "Failed to remove reaction",
      });
    }
  },

  fetchCommunityOnlineUsers: async () => [],

  fetchCommunityRoomPresence: async (communityId) =>
    get().roomRealtimeByCommunityId[communityId] ?? defaultRealtime(),

  resolveCommunityMentions: (usernames) =>
    communityService.resolveMentions(usernames),

  createCommunityRoomMessageRest: (
    communityId,
    content,
    mentionedUserIds,
    userId,
  ) =>
    communityService.createMessage(
      communityId,
      content,
      mentionedUserIds,
      userId,
    ),

  getCommunityRoomMessageCount: (communityId) =>
    communityService.getMessageCount(communityId),

  getCommunityRoomMessageById: (messageId) =>
    communityService.getMessageById(messageId),

  updateCommunityRoomMessage: (messageId, content) =>
    communityService.updateMessage(messageId, content),

  deleteCommunityRoomMessageRest: (messageId, userId) =>
    communityService.deleteMessage(messageId, userId),

  addCommunityRoomReactionRest: (messageId, reaction, userId, communityId) =>
    communityService.addReaction(messageId, reaction, userId, communityId),

  getCommunityRoomMessageReactions: (messageId) =>
    communityService.getMessageReactions(messageId),

  getCommunityRoomReactionCounts: (messageId) =>
    communityService.getReactionCounts(messageId),

  removeCommunityRoomReactionRest: (messageId) =>
    communityService.removeReaction(messageId),

  getCommunityRoomMessageMentions: (messageId) =>
    communityService.getMessageMentions(messageId),

  getCommunityUserMentions: (userId, limit) =>
    communityService.getUserMentions(userId, limit),

  updateCommunityRecord: (communityId, data) =>
    communityService.updateCommunity(communityId, data),

  deleteCommunityRecord: (communityId) =>
    communityService.deleteCommunity(communityId),

  addCommunityMemberRecord: (communityId, userId, role) =>
    communityService.addMember(communityId, userId, role),

  updateCommunityMemberRoleRecord: (communityId, userId, role) =>
    communityService.updateMemberRole(communityId, userId, role),

  removeCommunityMemberRecord: (communityId, userId) =>
    communityService.removeMember(communityId, userId),

  updateCommunityModByXpRecord: (communityId) =>
    communityService.updateCommunityModByXP(communityId),

  createCommunityJoinRequestRecord: (communityId, userId) =>
    communityService.createJoinRequest(communityId, userId),

  getCommunityPendingJoinRequestsRecord: (communityId, userId) =>
    communityService.getPendingJoinRequests(communityId, userId),

  updateCommunityJoinRequestStatusRecord: (
    requestId,
    status,
    communityId,
    userId,
  ) =>
    communityService.updateJoinRequestStatus(
      requestId,
      status,
      communityId,
      userId,
    ),

  deleteCommunityJoinRequestRecord: (requestId) =>
    communityService.deleteJoinRequest(requestId),

  handleCommunityRealtimeEvent: (eventName, payload) => {
    handleCommunityRealtimeEvent(get, set, eventName, payload);
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
      communityMembersByCommunityId: {},
      roomRealtimeByCommunityId: {},
      socketSubscriberByCommunityId: {},
      roomMessagesInitialLoadingByCommunityId: {},
      roomMessagesMoreLoadingByCommunityId: {},
      isLoading: false,
      error: null,
    });
  },
}));

export default useCommunityStore;
