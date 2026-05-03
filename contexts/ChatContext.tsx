import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { generateUUID } from '@/utils/constants';
import useChatStore from '@/core/chatState';

interface ChatContextType {
  isNavigating: boolean;
  navigateToChat: (chatId: string) => void;
  createNewChat: () => void;
  refreshChatList: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatNavigation = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatNavigation must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const navigateToChat = useCallback((chatId: string) => {
    setIsNavigating(true);
    router.replace({
      pathname: "/(tabs)/chat",
      params: { chatIdFromNav: chatId },
    });
    setTimeout(() => setIsNavigating(false), 300);
  }, [router]);

  const createNewChat = useCallback(() => {
    const newChatId = generateUUID();
    navigateToChat(newChatId);
  }, [navigateToChat]);

  const refreshChatList = useCallback(() => {
    useChatStore.getState().refreshChatList();
  }, []);

  const value = useMemo(
    () => ({
      isNavigating,
      navigateToChat,
      createNewChat,
      refreshChatList,
    }),
    [isNavigating, navigateToChat, createNewChat, refreshChatList],
  );

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
