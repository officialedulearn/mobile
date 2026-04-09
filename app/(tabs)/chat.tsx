import Chat from '@/components/chat/Chat';
import useUserStore from '@/core/userState';
import useChatStore from '@/core/chatState';
import { Chat as chatInterface, Message } from '@/interface/Chat';
import { generateUUID } from '@/utils/constants';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useScreenStyles } from '@/hooks/useScreenStyles';

const ChatScreen = () => {
  const { chatIdFromNav } = useLocalSearchParams<{
    chatIdFromNav: string;
  }>();
  const [chat, setChat] = useState<chatInterface>();
  const [initialMessages, setInitialMessages] = useState<Array<Message>>([]);
  const { isDark } = useTheme();
  const screenStyles = useScreenStyles();
  const { fetchMessages, fetchChatById } = useChatStore();

  const [currentChatId, setCurrentChatId] = useState<string>(() =>
    chatIdFromNav || generateUUID()
  );

  useEffect(() => {
    if (chatIdFromNav && chatIdFromNav !== currentChatId) {
      setCurrentChatId(chatIdFromNav);
    }
  }, [chatIdFromNav]);

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
        console.error('Error loading chat:', error);
        setChat(undefined);
        setInitialMessages([]);
      }
    };

    loadChatAndMessages();
  }, [currentChatId]);

  return (
    <SafeAreaView style={[screenStyles.container]}>
      {isDark ? <StatusBar style="light" /> : <StatusBar style="dark" />}
      <View style={[screenStyles.container]}>
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
