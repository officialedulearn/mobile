import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { generateUUID } from '@/utils/constants';

interface ChatContextType {
  isNavigating: boolean;
  navigateToChat: (chatId: string) => void;
  createNewChat: () => void;
  refreshChatList: () => void;
  chatListVersion: number;
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
  const [chatListVersion, setChatListVersion] = useState(0);

  const navigateToChat = useCallback((chatId: string) => {
    setIsNavigating(true);
    router.replace({
      pathname: "/(tabs)/chat",
      params: { chatIdFromNav: chatId },
    });
    // Reset after navigation animation completes
    setTimeout(() => setIsNavigating(false), 300);
  }, [router]);

  const createNewChat = useCallback(() => {
    const newChatId = generateUUID();
    navigateToChat(newChatId);
  }, [navigateToChat]);

  const refreshChatList = useCallback(() => {
    setChatListVersion(prev => prev + 1);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        isNavigating,
        navigateToChat,
        createNewChat,
        refreshChatList,
        chatListVersion,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

