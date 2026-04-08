import type { ChatMessageContentPart } from './chat.types';

export type AiMessageRole = 'user' | 'assistant';

export type AiConversationMessage = {
  role: AiMessageRole | string;
  content: ChatMessageContentPart[];
};

export type GenerateMessageRequest = {
  messages: AiConversationMessage[];
  chatId: string;
  userId: string;
};

export type GenerateQuizRequest = {
  chatId: string;
  userId: string;
};

export type GenerateSuggestionsRequest = {
  userId: string;
};
