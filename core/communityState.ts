import type {
  CommunityJoinRequest,
  NewMessageEvent,
  ReactionEvent,
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
import type { Socket } from "socket.io-client";
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

let realtimeHandlersBoundToSocket: Socket | null = null;

/** Presence events omit community id; assume single foreground room (last subscribed wins). */
let realtimePresenceCommunityId: string | null = null;

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

function bindCommunityRealtimeHandlers(
  get: () => CommunityStore,
  setState: StoreApi<CommunityStore>["setState"],
): void {
  const socket = communityService.getSocket();
  if (!socket || realtimeHandlersBoundToSocket === socket) {
    return;
  }
  realtimeHandlersBoundToSocket = socket;

  communityService.onRoomJoined((data) => {
    const cid = data.communityId;
    if (data.onlineCount === undefined) {
      return;
    }
    setState((state) => ({
      roomRealtimeByCommunityId: {
        ...state.roomRealtimeByCommunityId,
        [cid]: {
          typingUsernames:
            state.roomRealtimeByCommunityId[cid]?.typingUsernames ?? [],
          onlineCount: data.onlineCount,
        },
      },
    }));
  });

  communityService.onRoomUserJoined((data) => {
    const cid = realtimePresenceCommunityId;
    if (!cid) {
      return;
    }
    setState((state) => {
      const prev = state.roomRealtimeByCommunityId[cid];
      const nextOnline =
        data.onlineCount !== undefined
          ? data.onlineCount
          : (prev?.onlineCount ?? 1) + 1;
      return {
        roomRealtimeByCommunityId: {
          ...state.roomRealtimeByCommunityId,
          [cid]: {
            typingUsernames: prev?.typingUsernames ?? [],
            onlineCount: nextOnline,
          },
        },
      };
    });
  });

  communityService.onRoomUserLeft((data) => {
    const cid = realtimePresenceCommunityId;
    if (!cid) {
      return;
    }
    setState((state) => {
      const prev = state.roomRealtimeByCommunityId[cid];
      const nextOnline =
        data.onlineCount !== undefined
          ? data.onlineCount
          : Math.max(1, (prev?.onlineCount ?? 1) - 1);
      return {
        roomRealtimeByCommunityId: {
          ...state.roomRealtimeByCommunityId,
          [cid]: {
            typingUsernames: prev?.typingUsernames ?? [],
            onlineCount: nextOnline,
          },
        },
      };
    });
  });

  communityService.onNewMessage(async (event: NewMessageEvent) => {
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
      if (!entry) {
        return {};
      }
      if (entry.messages.some((m) => m.id === processed.id)) {
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
  });

  communityService.onMessageDeleted((event) => {
    const cid = event.communityId;
    setState((state) => {
      const entry = state.roomMessagesByCommunityId[cid];
      if (!entry) {
        return {};
      }
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
  });

  communityService.onUserTyping((event) => {
    const cid = event.communityId;
    const sub = get().socketSubscriberByCommunityId[cid];
    if (!sub || event.userId === sub.viewerUserId) {
      return;
    }
    setState((state) => {
      const prevRt = state.roomRealtimeByCommunityId[cid] ?? {
        onlineCount: 1,
        typingUsernames: [],
      };
      if (prevRt.typingUsernames.includes(event.username)) {
        return {};
      }
      return {
        roomRealtimeByCommunityId: {
          ...state.roomRealtimeByCommunityId,
          [cid]: {
            onlineCount: prevRt.onlineCount,
            typingUsernames: [...prevRt.typingUsernames, event.username],
          },
        },
      };
    });
  });

  communityService.onUserStoppedTyping((event) => {
    const cid = event.communityId;
    setState((state) => {
      const prevRt = state.roomRealtimeByCommunityId[cid];
      if (!prevRt) {
        return {};
      }
      const nextTyping = prevRt.typingUsernames.filter(
        (u) => u !== event.username,
      );
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
  });

  communityService.onReactionAdded((event: ReactionEvent) => {
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
  });

  communityService.onReactionRemoved((event) => {
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
  });
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

  ensureCommunitySocketConnected: async () => {
    await communityService.connectWebSocket();
    bindCommunityRealtimeHandlers(get, set);
  },

  subscribeCommunityRoomRealtime: async (communityId, viewerUserId) => {
    await get().ensureCommunitySocketConnected();
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
    realtimePresenceCommunityId = communityId;
    communityService.joinRoom(communityId, viewerUserId);
  },

  unsubscribeCommunityRoomRealtime: (communityId) => {
    communityService.leaveRoom(communityId);
    if (realtimePresenceCommunityId === communityId) {
      realtimePresenceCommunityId = null;
    }
    set((state) => ({
      socketSubscriberByCommunityId: removeCommunityKey(
        state.socketSubscriberByCommunityId,
        communityId,
      ),
    }));
  },

  disconnectCommunitySocket: () => {
    realtimeHandlersBoundToSocket = null;
    realtimePresenceCommunityId = null;
    communityService.disconnectWebSocket();
  },

  isCommunitySocketConnected: () => communityService.isConnected(),

  sendCommunityRoomMessage: (
    communityId,
    content,
    viewerUserId,
    mentionedUserIds,
    callback,
  ) => {
    communityService.sendMessage(
      communityId,
      content,
      mentionedUserIds,
      viewerUserId,
      callback,
    );
  },

  deleteCommunityRoomMessageWs: (messageId, communityId, callback) => {
    communityService.deleteMessageWS(messageId, communityId, callback);
  },

  communityRoomStartTyping: (communityId) => {
    communityService.startTyping(communityId);
  },

  communityRoomStopTyping: (communityId) => {
    communityService.stopTyping(communityId);
  },

  communityRoomAddReactionWs: (messageId, communityId, reaction, callback) => {
    communityService.addReactionWS(messageId, communityId, reaction, callback);
  },

  communityRoomRemoveReactionWs: (messageId, communityId, callback) => {
    communityService.removeReactionWS(messageId, communityId, callback);
  },

  fetchCommunityOnlineUsers: () =>
    new Promise<unknown>((resolve, reject) => {
      if (!communityService.isConnected()) {
        reject(new Error("WebSocket not connected"));
        return;
      }
      communityService.getOnlineUsers((response: unknown) => {
        const r = response as { error?: string } | undefined;
        if (r && typeof r === "object" && "error" in r && r.error) {
          reject(new Error(String(r.error)));
          return;
        }
        resolve(response);
      });
    }),

  fetchCommunityRoomPresence: (communityId) =>
    new Promise<unknown>((resolve, reject) => {
      if (!communityService.isConnected()) {
        reject(new Error("WebSocket not connected"));
        return;
      }
      communityService.getRoomPresence(communityId, (response: unknown) => {
        const r = response as { error?: string } | undefined;
        if (r && typeof r === "object" && "error" in r && r.error) {
          reject(new Error(String(r.error)));
          return;
        }
        resolve(response);
      });
    }),

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

  resetState: () => {
    realtimeHandlersBoundToSocket = null;
    realtimePresenceCommunityId = null;
    communityService.disconnectWebSocket();
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
