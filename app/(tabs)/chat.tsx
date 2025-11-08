import Chat from "@/components/Chat";
import useUserStore from "@/core/userState";
import { Chat as chatInterface, Message } from "@/interface/Chat";
import { ChatService } from "@/services/chat.service";
import { generateUUID } from "@/utils/constants";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";

type Props = {};

const ChatScreen = (props: Props) => {
  const { chatIdFromNav } = useLocalSearchParams<{
    chatIdFromNav: string;
  }>();
  const [chat, setChat] = useState<chatInterface>();
  const [initialMessages, setInitialMessages] = useState<Array<Message>>([]);
  const theme = useUserStore((state) => state.theme);

  const [currentChatId, setCurrentChatId] = useState<string>(() => 
    chatIdFromNav || generateUUID()
  );

  useEffect(() => {
    if (chatIdFromNav && chatIdFromNav !== currentChatId) {
      setCurrentChatId(chatIdFromNav);
    }
  }, [chatIdFromNav]);

  useEffect(() => {
    const fetchChatAndMessages = async () => {
      if (!currentChatId) {
        setChat(undefined);
        setInitialMessages([]);
        return;
      }

      try {
        const chatService = new ChatService();
          
        const messages = await chatService.getMessagesInChat(currentChatId);
        setInitialMessages(messages || []);
        
        if (messages && messages.length > 0) {
          try {
            const chatData = await chatService.getChatById(currentChatId);
            setChat(chatData);
          } catch {
            setChat(undefined);
          }
        } else {
          setChat(undefined);
        }
      } catch (error) {
        console.error("Error loading chat:", error);
        setChat(undefined);
        setInitialMessages([]);
      }
    };

    fetchChatAndMessages();
  }, [currentChatId]);

  return (
    <SafeAreaView style={[styles.safeArea, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
      <StatusBar style="light" />
      <View style={[styles.container, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
        <Chat
          title={chat?.title || "AI Tutor Chat"}
          initialMessages={initialMessages}
          chatId={currentChatId}
          key={currentChatId}
        />
      </View>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FBFC",
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FBFC",
  },
});
