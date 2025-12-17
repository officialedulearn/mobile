export interface Community {
  id: string;
  title: string;
  createdAt: Date | string;
  inviteCode: string;
  visibility: 'public' | 'private';
  imageUrl?: string | null;
}

export interface CommunityMember {
  id: string;
  role: 'mod' | 'member';
  user: {
    id: string;
    username: string;
    name: string;
    profilePictureURL?: string | null;
    level: string;
  };
}

export interface UserCommunity {
  id: string;
  title: string;
  imageUrl?: string | null;
  visibility: 'public' | 'private';
  createdAt: Date | string;
  role: 'mod' | 'member';
}

export interface CommunityJoinRequest {
  id: string;
  createdAt: Date | string;
  status: 'pending' | 'approved' | 'rejected';
  user: {
    id: string;
    username: string;
    name: string;
    profilePictureURL?: string | null;
  };
}

export interface RoomMessage {
  id: string;
  content: string;
  createdAt: Date | string;
  user: {
    id: string;
    username: string;
    name: string;
    profilePictureURL?: string | null;
  };
  mentionedUserIds?: string[];
}

export interface MessageReaction {
  id: string;
  reaction: string;
  user: {
    id: string;
    username: string;
    name: string;
    profilePictureURL?: string | null;
  };
}

export interface ReactionCount {
  reaction: string;
  count: number;
}

export interface MessageMention {
  id: string;
  mentionedUser: {
    id: string;
    username: string;
    name: string;
    profilePictureURL?: string | null;
  };
}

export interface UserMention {
  id: string;
  message: {
    id: string;
    content: string;
    createdAt: Date | string;
    roomId: string;
  };
  mentionedBy: {
    id: string;
    username: string;
    name: string;
    profilePictureURL?: string | null;
  };
}

export interface CommunityMod {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    name: string;
    xp: number;
    level: string;
    profilePictureURL?: string | null;
  };
}

// WebSocket Event Types
export interface UserStatusEvent {
  userId: string;
  username: string;
  status: 'online' | 'offline';
  timestamp: string;
}

export interface RoomPresence {
  onlineUsers: string[];
  onlineCount: number;
  typingUsers?: string[];
}

export interface TypingEvent {
  userId: string;
  username: string;
  communityId: string;
  timestamp: string;
}

export interface NewMessageEvent extends RoomMessage {
  roomId: string;
}

export interface MessageDeletedEvent {
  messageId: string;
  communityId: string;
  deletedBy: string;
  timestamp: string;
}

export interface ReactionEvent {
  messageId: string;
  reaction: string;
  userId: string;
  username: string;
  reactionCounts: ReactionCount[];
  timestamp: string;
}

