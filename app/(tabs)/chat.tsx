import Chat from '@/components/chat/Chat';

import useChatStore from '@/core/chatState';
import { useTheme } from '@/hooks/useTheme';
import { Chat as chatInterface, Message } from '@/interface/Chat';
import { generateUUID } from '@/utils/constants';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ChatScreen = () => {
  const { chatIdFromNav } = useLocalSearchParams<{
    chatIdFromNav: string;
  }>();
  const [chat, setChat] = useState<chatInterface>();
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const { statusBarStyle, colors } = useTheme();
  const fetchMessages = useChatStore((s) => s.fetchMessages);
  const fetchChatById = useChatStore((s) => s.fetchChatById);

  const [currentChatId, setCurrentChatId] = useState<string>(() =>
    chatIdFromNav || generateUUID()
  );

  useEffect(() => {
    if (chatIdFromNav && chatIdFromNav !== currentChatId) {
      setCurrentChatId(chatIdFromNav);
    }
  }, [chatIdFromNav, currentChatId]);

  useEffect(() => {
    const loadChatAndMessages = async () => {
      if (!currentChatId) {
        setChat(undefined);
        setInitialMessages([]);
        return;
      }

      const state = useChatStore.getState();
      const cached = state.messagesByChatId[currentChatId];
      const cachedChat = state.chatById[currentChatId];

      if (cached && cached.length > 0) {
        setInitialMessages(cached);
        setChat(cachedChat);
        return;
      }

      try {
        const messages = await fetchMessages(currentChatId);
        setInitialMessages(messages || []);

        if (messages && messages.length > 0) {
          const chatData = await fetchChatById(currentChatId);
          setChat(chatData);
        } else {
          setChat(undefined);
        }
      } catch (error) {
        setChat(undefined);
        setInitialMessages([]);
      }
    };

    loadChatAndMessages();
  }, [currentChatId, fetchMessages, fetchChatById]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      edges={["left", "right"]}
    >
      <StatusBar style={statusBarStyle} />
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <Chat
          title={chat?.title || 'AI Tutor Chat'}
          initialMessages={initialMessages}
          chatId={currentChatId}
          key={currentChatId}
        />
      </View>
    </SafeAreaView>
  );
};

export default ChatScreen;
