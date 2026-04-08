import type { IsoDateString } from './common.types';

export type ChatVisibility = 'public' | 'private';

export type Chat = {
  id: string;
  createdAt: IsoDateString | Date;
  title: string;
  userId: string;
  visibility: ChatVisibility;
  tested: boolean | null;
  testLimit: number | null;
};

export type ChatMessageContentPart =
  | { type: 'text'; text?: string }
  | { type: 'image'; image?: string };

export type RoadmapPromptMessageContent = { text: string };

export type MessageContentJson =
  | ChatMessageContentPart[]
  | RoadmapPromptMessageContent
  | Record<string, unknown>;

export type Message = {
  id: string;
  chatId: string;
  role: string;
  content: MessageContentJson;
  createdAt: IsoDateString | Date;
};

export type CreateChatRequest = {
  title: string;
  userId: string;
};

export type SaveMessagesRequest = {
  messages: Message[];
};
