import type {
  Community,
  CommunityJoinRequest,
  CommunityMember,
  CommunityMod,
  MessageMention,
  MessageReaction,
  ReactionCount,
  RoomMessage,
  RoomMessageWithUI,
  UserCommunity,
  UserMention,
} from "@/interface/Community";

export type CommunityDetails = {
  memberCount: number;
  description?: string;
};

export type RoomMessagesCacheEntry = {
  messages: RoomMessageWithUI[];
  hasMore: boolean;
  messageOffset: number;
  moderatorId: string | null;
  isMod: boolean;
};

export type RoomInfoCacheEntry = {
  members: CommunityMember[];
  moderator: CommunityMod | null;
  pendingRequests: CommunityJoinRequest[];
  isMod: boolean;
};

export type CommunityRoomRealtimeState = {
  onlineCount: number;
  typingUsernames: string[];
};

export type CommunityRoomSocketContext = {
  viewerUserId: string;
};

export type CommunityStoreState = {
  userCommunities: UserCommunity[];
  userCommunitiesUserId: string | null;
  communityDetailsById: Record<string, CommunityDetails>;
  publicCommunities: Community[];
  communityById: Record<string, Community>;
  roomMessagesByCommunityId: Record<string, RoomMessagesCacheEntry>;
  roomInfoByCommunityId: Record<string, RoomInfoCacheEntry>;
  communityMembersByCommunityId: Record<string, CommunityMember[]>;
  roomRealtimeByCommunityId: Record<string, CommunityRoomRealtimeState>;
  socketSubscriberByCommunityId: Record<string, CommunityRoomSocketContext>;
  roomMessagesInitialLoadingByCommunityId: Record<string, boolean>;
  roomMessagesMoreLoadingByCommunityId: Record<string, boolean>;
  isLoading: boolean;
  error: string | null;
};

export type CommunityStoreActions = {
  mergeCommunity: (community: Community) => void;
  setRoomMessagesCache: (
    communityId: string,
    entry: RoomMessagesCacheEntry,
  ) => void;
  setRoomInfoCache: (communityId: string, entry: RoomInfoCacheEntry) => void;

  fetchUserCommunities: (
    userId: string,
    options?: { force?: boolean },
  ) => Promise<void>;
  fetchCommunityDetails: (
    communityId: string,
    title?: string,
  ) => Promise<CommunityDetails>;
  fetchPublicCommunities: () => Promise<void>;
  fetchAllCommunities: () => Promise<Community[]>;
  fetchCommunityById: (communityId: string) => Promise<Community | undefined>;
  fetchCommunityByInviteCode: (inviteCode: string) => Promise<Community>;

  fetchInitialRoomMessages: (
    communityId: string,
    viewerUserId: string,
    options?: { limit?: number },
  ) => Promise<void>;
  fetchMoreRoomMessages: (
    communityId: string,
    viewerUserId: string,
    options?: { limit?: number },
  ) => Promise<void>;
  hydrateCommunityRoomFeed: (
    communityId: string,
    viewerUserId: string,
    options?: { messagesLimit?: number },
  ) => Promise<void>;

  fetchCommunityRoomInfo: (
    communityId: string,
    viewerUserId?: string,
  ) => Promise<RoomInfoCacheEntry>;
  fetchCommunityMembersForRoom: (
    communityId: string,
  ) => Promise<CommunityMember[]>;

  ensureCommunitySocketConnected: () => Promise<void>;
  subscribeCommunityRoomRealtime: (
    communityId: string,
    viewerUserId: string,
  ) => Promise<void>;
  unsubscribeCommunityRoomRealtime: (communityId: string) => void;
  disconnectCommunitySocket: () => void;
  isCommunitySocketConnected: () => boolean;

  sendCommunityRoomMessage: (
    communityId: string,
    content: string,
    viewerUserId: string,
    mentionedUserIds?: string[],
    callback?: (response: unknown) => void,
  ) => void;
  deleteCommunityRoomMessageWs: (
    messageId: string,
    communityId: string,
    callback?: (response: unknown) => void,
  ) => void;
  communityRoomStartTyping: (communityId: string) => void;
  communityRoomStopTyping: (communityId: string) => void;
  communityRoomAddReactionWs: (
    messageId: string,
    communityId: string,
    reaction: string,
    callback?: (response: unknown) => void,
  ) => void;
  communityRoomRemoveReactionWs: (
    messageId: string,
    communityId: string,
    callback?: (response: unknown) => void,
  ) => void;
  fetchCommunityOnlineUsers: () => Promise<unknown>;
  fetchCommunityRoomPresence: (communityId: string) => Promise<unknown>;

  resolveCommunityMentions: (
    usernames: string[],
  ) => Promise<{ username: string; userId: string }[]>;
  createCommunityRoomMessageRest: (
    communityId: string,
    content: string,
    mentionedUserIds?: string[],
    userId?: string,
  ) => Promise<RoomMessage>;
  getCommunityRoomMessageCount: (
    communityId: string,
  ) => Promise<{ count: number }>;
  getCommunityRoomMessageById: (messageId: string) => Promise<RoomMessage>;
  updateCommunityRoomMessage: (
    messageId: string,
    content: string,
  ) => Promise<RoomMessage>;
  deleteCommunityRoomMessageRest: (
    messageId: string,
    userId?: string,
  ) => Promise<{ message: string }>;
  addCommunityRoomReactionRest: (
    messageId: string,
    reaction: string,
    userId?: string,
    communityId?: string,
  ) => Promise<MessageReaction>;
  getCommunityRoomMessageReactions: (
    messageId: string,
  ) => Promise<MessageReaction[]>;
  getCommunityRoomReactionCounts: (
    messageId: string,
  ) => Promise<ReactionCount[]>;
  removeCommunityRoomReactionRest: (
    messageId: string,
  ) => Promise<{ message: string }>;
  getCommunityRoomMessageMentions: (
    messageId: string,
  ) => Promise<MessageMention[]>;
  getCommunityUserMentions: (
    userId: string,
    limit?: number,
  ) => Promise<UserMention[]>;

  updateCommunityRecord: (
    communityId: string,
    data: {
      title?: string;
      visibility?: "public" | "private";
      imageUrl?: string;
      inviteCode?: string;
    },
  ) => Promise<Community>;
  deleteCommunityRecord: (communityId: string) => Promise<{ message: string }>;
  addCommunityMemberRecord: (
    communityId: string,
    userId: string,
    role?: "mod" | "member",
  ) => Promise<CommunityMember>;
  updateCommunityMemberRoleRecord: (
    communityId: string,
    userId: string,
    role: "mod" | "member",
  ) => Promise<CommunityMember>;
  removeCommunityMemberRecord: (
    communityId: string,
    userId: string,
  ) => Promise<{ message: string }>;
  updateCommunityModByXpRecord: (
    communityId: string,
  ) => Promise<{ message: string }>;
  createCommunityJoinRequestRecord: (
    communityId: string,
    userId: string,
  ) => Promise<CommunityJoinRequest>;
  getCommunityPendingJoinRequestsRecord: (
    communityId: string,
    userId?: string,
  ) => Promise<CommunityJoinRequest[]>;
  updateCommunityJoinRequestStatusRecord: (
    requestId: string,
    status: "approved" | "rejected",
    communityId: string,
    userId?: string,
  ) => Promise<CommunityJoinRequest>;
  deleteCommunityJoinRequestRecord: (
    requestId: string,
  ) => Promise<{ message: string }>;

  resetState: () => void;
};

export type CommunityStore = CommunityStoreState & CommunityStoreActions;
