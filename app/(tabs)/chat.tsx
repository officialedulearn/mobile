import Chat from "@/components/Chat";
import { Chat as chatInterface, Message } from "@/interface/Chat";
import { ChatService } from "@/services/chat.service";
import { generateUUID } from "@/utils/constants";
import { router, useLocalSearchParams } from "expo-router";
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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [chat, setChat] = useState<chatInterface>();
  const [initialMessages, setInitialMessages] = useState<Array<Message>>([]);
  const chatId = generateUUID();

  useEffect(() => {
    setChat(undefined);
    setInitialMessages([]);

    const fetchChatAndMessages = async () => {
      try {
        if (!chatIdFromNav) return;

        console.log("Fetching chat data for ID:", chatIdFromNav);
        const chatService = new ChatService();
        const chatData = await chatService.getChatById(chatIdFromNav);
        const messages = await chatService.getMessagesInChat(chatIdFromNav);

        console.log("Fetched chat data:", chatData);
        console.log("Fetched messages:", messages);

        setChat(chatData);
        setInitialMessages(messages);
      } catch (error) {
        console.error("Error fetching chat data:", error);
      }
    };

    fetchChatAndMessages();
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
  const navigateToChat = (id: string) => {
    router.push({
      pathname: "/(tabs)/chat",
      params: { chatIdFromNav: id, refresh: Date.now().toString() },
    });
  };

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
              chatId={chatIdFromNav}
            />
          ) : (
            <Chat title="AI Tutor Chat" initialMessages={[]} chatId={chatId} />
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
