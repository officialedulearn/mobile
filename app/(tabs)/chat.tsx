import Chat from "@/components/Chat";
import { Chat as chatInterface, Message } from "@/interface/Chat";
import { ChatService } from "@/services/chat.service";
import { generateUUID } from "@/utils/constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
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

  const chatIdRef = useRef<string>(chatIdFromNav || generateUUID());
  const chatId = chatIdRef.current;

  useEffect(() => {
    if (chatIdFromNav && chatIdFromNav !== chatIdRef.current) {
      chatIdRef.current = chatIdFromNav;
    }

    if (chatId) {
      setChat(undefined);
      setInitialMessages([]);

      const fetchChatAndMessages = async () => {
        try {
          const chatService = new ChatService();
          const chatData = await chatService.getChatById(chatId);
          const messages = await chatService.getMessagesInChat(chatId);

          setChat(chatData);
          setInitialMessages(messages);
        } catch (error) {
          console.error("Error fetching chat data:", error);
        }
      };

      fetchChatAndMessages();
    }
  }, [chatIdFromNav, refresh]);

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
          {chatIdFromNav && chat ? (
            <Chat
              title={chat.title || "Chat"}
              initialMessages={initialMessages}
              chatId={chatId}
            />
          ) : (
            <Chat title="AI Tutor Chat" initialMessages={initialMessages} chatId={chatId} />
          )}
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
