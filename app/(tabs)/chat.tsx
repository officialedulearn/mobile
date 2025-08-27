import Chat from "@/components/Chat";
import { Chat as chatInterface, Message } from "@/interface/Chat";
import { ChatService } from "@/services/chat.service";
import { generateUUID } from "@/utils/constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";

type Props = {};

const ChatScreen = (props: Props) => {
  const { chatIdFromNav, refresh } = useLocalSearchParams<{
    chatIdFromNav: string;
    refresh: string;
  }>();
  const router = useRouter();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [chat, setChat] = useState<chatInterface>();
  const [initialMessages, setInitialMessages] = useState<Array<Message>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [currentChatId, setCurrentChatId] = useState<string>(() => 
    chatIdFromNav || generateUUID()
  );

  useEffect(() => {
    if (chatIdFromNav && chatIdFromNav !== currentChatId) {
      setCurrentChatId(chatIdFromNav);
    }
  }, [chatIdFromNav]);

  useEffect(() => {
    setIsLoading(true);
    setChat(undefined);
    setInitialMessages([]);

    const fetchChatAndMessages = async () => {
      try {
        if (chatIdFromNav) {
          // Only fetch if we have a specific chat ID from navigation
          const chatService = new ChatService();
          const chatData = await chatService.getChatById(currentChatId);
          const messages = await chatService.getMessagesInChat(currentChatId);

          setChat(chatData);
          setInitialMessages(messages);
        } else {
          // For new chats, just clear the state
          setChat(undefined);
          setInitialMessages([]);
        }
      } catch (error) {
        console.error("Error fetching chat data:", error);
        // Reset to prevent showing stale data
        setChat(undefined);
        setInitialMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatAndMessages();
  }, [currentChatId, chatIdFromNav, refresh]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.container}>
          <Chat
            title={chat?.title || "AI Tutor Chat"}
            initialMessages={initialMessages}
            chatId={currentChatId}
            key={currentChatId} // Force re-render when chat ID changes
          />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
