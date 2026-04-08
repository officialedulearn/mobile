import type { ReactionCount, RoomMessage } from './community.types';

export type RoomMessageWithUI = RoomMessage & {
  date: string;
  time: string;
  isCurrentUser: boolean;
  reactions: Record<string, number>;
  userAvatar?: string;
  userName?: string;
  isMod?: boolean;
  message?: string;
};

export type UserStatusEvent = {
  userId: string;
  username: string;
  status: 'online' | 'offline';
  timestamp: string;
};

export type RoomPresence = {
  onlineUsers: string[];
  onlineCount: number;
  typingUsers?: string[];
};

export type TypingEvent = {
  userId: string;
  username: string;
  communityId: string;
  timestamp: string;
};

export type NewMessageEvent = RoomMessage & {
  roomId: string;
};

export type MessageDeletedEvent = {
  messageId: string;
  communityId: string;
  deletedBy: string;
  timestamp: string;
};

export type ReactionEvent = {
  messageId: string;
  reaction: string;
  userId: string;
  username: string;
  reactionCounts: ReactionCount[];
  timestamp: string;
};
