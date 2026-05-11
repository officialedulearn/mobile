import type {
  NewMessageEvent,
  ReactionCount,
  RoomMessage,
} from "@/interface/Community";

export type RealtimeSubscription =
  | {
      channel: "community.room";
      id: string;
    };

export type RealtimeEventName =
  | "realtime.connected"
  | "subscription.ready"
  | "subscription.error"
  | "community.room.user_joined"
  | "community.room.user_left"
  | "community.message.created"
  | "community.message.deleted"
  | "community.typing.started"
  | "community.typing.stopped"
  | "community.reaction.updated";

export type CommunityRoomPresencePayload = {
  communityId: string;
  userId: string;
  username?: string;
  timestamp: string;
  onlineCount: number;
  onlineUsers?: string[];
};

export type CommunityMessageCreatedPayload = NewMessageEvent;

export type CommunityMessageDeletedPayload = {
  messageId: string;
  communityId: string;
  deletedBy: string;
  timestamp: string;
};

export type CommunityTypingPayload = {
  userId: string;
  username?: string;
  communityId: string;
  timestamp: string;
};

export type CommunityReactionUpdatedPayload = {
  messageId: string;
  communityId: string;
  reaction?: string;
  userId: string;
  username?: string;
  reactionCounts: ReactionCount[];
  timestamp: string;
};

export type RealtimeEventPayloadMap = {
  "realtime.connected": {
    userId: string;
    username?: string;
    onlineUsers: number;
  };
  "subscription.ready": {
    subscription: RealtimeSubscription;
    onlineUsers?: string[];
    onlineCount?: number;
  };
  "subscription.error": {
    subscription?: RealtimeSubscription;
    error: string;
  };
  "community.room.user_joined": CommunityRoomPresencePayload;
  "community.room.user_left": CommunityRoomPresencePayload;
  "community.message.created": CommunityMessageCreatedPayload | RoomMessage;
  "community.message.deleted": CommunityMessageDeletedPayload;
  "community.typing.started": CommunityTypingPayload;
  "community.typing.stopped": CommunityTypingPayload;
  "community.reaction.updated": CommunityReactionUpdatedPayload;
};

export type RealtimeEventPayload<EventName extends RealtimeEventName> =
  RealtimeEventPayloadMap[EventName];
