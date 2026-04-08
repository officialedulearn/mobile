import { Chat, Message } from "@/interface/Chat";
import { ChatService } from "@/services/chat.service";
import { create } from "zustand";

const MAX_CACHED_CHATS = 10;

interface ChatState {
  chatList: Chat[];
  chatListUserId: string | null;
  messagesByChatId: Record<string, Message[]>;
  messagesLruOrder: string[];
  chatById: Record<string, Chat>;
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: Date | null;

  fetchChatList: (userId: string) => Promise<void>;
  fetchMessages: (chatId: string) => Promise<Message[]>;
  fetchChatById: (chatId: string) => Promise<Chat | undefined>;
  addMessage: (chatId: string, message: Message) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  deleteChat: (chatId: string) => Promise<void>;
  refreshChatList: () => Promise<void>;
  resetState: () => void;
}

const chatService = new ChatService();

const evictLruIfNeeded = (
  messagesByChatId: Record<string, Message[]>,
  messagesLruOrder: string[],
  newChatId: string
): { messagesByChatId: Record<string, Message[]>; messagesLruOrder: string[] } => {
  const order = messagesLruOrder.filter((id) => id !== newChatId);
  order.push(newChatId);
  if (order.length <= MAX_CACHED_CHATS) {
    return { messagesByChatId, messagesLruOrder: order };
  }
  const toEvict = order.shift()!;
  const next = { ...messagesByChatId };
  delete next[toEvict];
  return { messagesByChatId: next, messagesLruOrder: order };
};

const useChatStore = create<ChatState>((set, get) => ({
  chatList: [],
  chatListUserId: null,
  messagesByChatId: {},
  messagesLruOrder: [],
  chatById: {},
  isLoading: false,
  error: null,
  lastFetchedAt: null,

  fetchChatList: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const chatList = await chatService.getHistory(userId);
      const sorted = chatList.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      set({
        chatList: sorted,
        chatListUserId: userId,
        isLoading: false,
        lastFetchedAt: new Date(),
      });
    } catch (error) {
      console.error("Failed to fetch chat list:", error);
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch chat list",
      });
    }
  },

  fetchMessages: async (chatId: string) => {
    try {
      const messages = await chatService.getMessagesInChat(chatId);
      const { messagesByChatId, messagesLruOrder } = evictLruIfNeeded(
        get().messagesByChatId,
        get().messagesLruOrder,
        chatId
      );
      set({
        messagesByChatId: { ...messagesByChatId, [chatId]: messages || [] },
        messagesLruOrder,
      });
      return messages || [];
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      throw error;
    }
  },

  fetchChatById: async (chatId: string) => {
    try {
      const chat = await chatService.getChatById(chatId);
      set((state) => ({
        chatById: { ...state.chatById, [chatId]: chat },
      }));
      return chat;
    } catch (error) {
      console.error("Failed to fetch chat by ID:", error);
      return undefined;
    }
  },

  addMessage: (chatId: string, message: Message) => {
    set((state) => {
      const current = state.messagesByChatId[chatId] || [];
      const exists = current.some((m) => m.id === message.id);
      if (exists) {
        const updated = current.map((m) =>
          m.id === message.id ? message : m
        );
        return {
          messagesByChatId: { ...state.messagesByChatId, [chatId]: updated },
        };
      }
      const { messagesByChatId, messagesLruOrder } = evictLruIfNeeded(
        state.messagesByChatId,
        state.messagesLruOrder,
        chatId
      );
      return {
        messagesByChatId: {
          ...messagesByChatId,
          [chatId]: [...(messagesByChatId[chatId] || []), message],
        },
        messagesLruOrder,
      };
    });
  },

  setMessages: (chatId: string, messages: Message[]) => {
    const { messagesByChatId, messagesLruOrder } = evictLruIfNeeded(
      get().messagesByChatId,
      get().messagesLruOrder,
      chatId
    );
    set({
      messagesByChatId: { ...messagesByChatId, [chatId]: messages },
      messagesLruOrder,
    });
  },

  deleteChat: async (chatId: string) => {
    await chatService.deleteChat(chatId);
    const { chatListUserId } = get();
    set((state) => {
      const nextMessages = { ...state.messagesByChatId };
      delete nextMessages[chatId];
      const nextChatById = { ...state.chatById };
      delete nextChatById[chatId];
      return {
        chatList: state.chatList.filter((c) => c.id !== chatId),
        messagesByChatId: nextMessages,
        messagesLruOrder: state.messagesLruOrder.filter((id) => id !== chatId),
        chatById: nextChatById,
      };
    });
    if (chatListUserId) {
      get().fetchChatList(chatListUserId);
    }
  },

  refreshChatList: async () => {
    const { chatListUserId } = get();
    if (chatListUserId) {
      await get().fetchChatList(chatListUserId);
    }
  },

  resetState: () => {
    set({
      chatList: [],
      chatListUserId: null,
      messagesByChatId: {},
      messagesLruOrder: [],
      chatById: {},
      isLoading: false,
      error: null,
      lastFetchedAt: null,
    });
  },
}));

export default useChatStore;
