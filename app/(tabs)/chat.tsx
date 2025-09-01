import Chat from "@/components/Chat";
import useUserStore from "@/core/userState";
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
      if (!chatIdFromNav) {
        setIsLoading(false);
        setChat(undefined);
        setInitialMessages([]);
        return;
      }

      setIsLoading(true);
      setChat(undefined);
      setInitialMessages([]);

      try {
        const chatService = new ChatService();
        
        try {
          const chatData = await chatService.getChatById(currentChatId);
          const messages = await chatService.getMessagesInChat(currentChatId);
          
          if (chatData) {
            setChat(chatData);
            setInitialMessages(messages || []);
          } else {
            setChat(undefined);
            setInitialMessages([]);
          }
        } catch (chatError) {
          console.log("Chat not found, preparing for new chat:", currentChatId);
          setChat(undefined);
          setInitialMessages([]);
        }
      } catch (error) {
        console.error("Error in chat setup:", error);
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
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      enabled={true}
    >
      <SafeAreaView style={[styles.safeArea, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
        <StatusBar style="light" />
        <View style={[styles.container, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
          <Chat
            title={chat?.title || "AI Tutor Chat"}
            initialMessages={initialMessages}
            chatId={currentChatId}
            key={`${currentChatId}-${refresh || 'new'}`} 
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
