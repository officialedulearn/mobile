import useUserStore from "@/core/userState";
import { Message } from "@/interface/Chat";
import { AIService } from "@/services/ai.service";
import { generateUUID } from "@/utils/constants";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ChatDrawer from "./ChatDrawer";
import { MessageItem, ThinkingMessage } from "./MessageItem";

type Props = {
  title: string;
  initialMessages?: Array<Message>; 
  chatId: string;
};

const Chat = ({ title, initialMessages, chatId }: Props) => {
  const aiService = new AIService();
  const [messages, setMessages] = useState<Array<Message>>(
    Array.isArray(initialMessages) ? initialMessages : []
  )
  const [isGenerating, setIsGenerating] = useState(false);
  const user = useUserStore((s) => s.user);
  const [inputText, setInputText] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const chatIdRef = useRef(chatId);

  useEffect(() => {
    if (Array.isArray(initialMessages)) {
      setMessages(initialMessages);
    }
    if (chatId && chatId !== chatIdRef.current) {
      chatIdRef.current = chatId;
    }
  }, [initialMessages, chatId]);

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

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);


  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  const handleScroll = (event: { nativeEvent: { layoutMeasurement: any; contentOffset: any; contentSize: any; }; }) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;
    setShowScrollButton(!isCloseToBottom && messages.length > 2);
  };

  const handleSendMessage = async () => {
    if (inputText.trim() === "") return;
    
    const currentChatId = chatIdRef.current;
    
    const newMessage: Message = {
      id: generateUUID(),
      role: "user",
      content: inputText, 
      createdAt: new Date(),
      chatId: currentChatId,
    };

    const updatedMessages = [...messages, newMessage];
    
    setMessages(updatedMessages);
    setInputText("");
    setIsGenerating(true);

    try {
      const response = await aiService.generateMessages({
        messages: updatedMessages,
        chatId: currentChatId,
        userId: user?.id as unknown as string,
      });
      
      const assistantMessage: Message = {
        id: response.id,
        role: "assistant",
        content: typeof response.content === 'string' 
          ? response.content 
          : response.content,
        createdAt: response.createdAt,
        chatId: response.chatId || currentChatId, 
      };

      setMessages(currentMessages => [...currentMessages, assistantMessage]);
    } catch (error) {
      console.error("Error generating message:", error);
    } finally {
      setIsGenerating(false);
      scrollToBottom();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.container}>
          <View style={styles.topNav}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <TouchableOpacity
                style={styles.button}
                onPress={() => setDrawerOpen(true)}
                activeOpacity={0.8}
              >
                <Image
                  source={require("@/assets/images/icons/menu.png")}
                  style={{ width: 30, height: 30 }}
                />
              </TouchableOpacity>
              <Text style={styles.headerText}>{title || "AI Tutor Chat"}</Text>
            </View>
            <TouchableOpacity style={styles.button} activeOpacity={0.8}>
              <Image
                source={require("@/assets/images/icons/pen.png")}
                style={{ width: 30, height: 30 }}
              />
            </TouchableOpacity>
          </View>

          {drawerOpen && (
            <>
              <View
                style={styles.backdrop}
                onTouchStart={() => setDrawerOpen(false)}
              />
              <ChatDrawer onClose={() => setDrawerOpen(false)} />
            </>
          )}

          <View
            style={[
              styles.chatContent,
              keyboardVisible && styles.chatContentWithKeyboard,
            ]}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Image
                  source={require("@/assets/images/LOGO-1.png")}
                  style={styles.logo}
                />
                {/* <Text style={styles.welcomeText}>Welcome to EduLearn</Text> */}
                <View style={styles.suggestions}>
                  <TouchableOpacity
                    style={styles.suggestion}
                    onPress={() => {
                      setInputText("Teach me about DeFi");
                      handleSendMessage();
                    }}
                  >
                    <Text style={styles.suggestionText}>
                      Teach me about DeFi
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.suggestion}
                    onPress={() => {
                      setInputText("Learn about RWAs");
                      handleSendMessage();
                    }}
                  >
                    <Text style={styles.suggestionText}>Learn about RWAs</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.suggestion}
                    onPress={() => {
                      setInputText("Blockchain basics");
                      handleSendMessage();
                    }}
                  >
                    <Text style={styles.suggestionText}>Blockchain basics</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.messagesContainer}>
                <ScrollView
                  ref={scrollViewRef}
                  style={styles.messagesScroll}
                  contentContainerStyle={styles.messagesScrollContent}
                  onScroll={handleScroll}
                  scrollEventThrottle={400}
                >
                  {messages.map((message) => (
                    <MessageItem key={message.id} message={message} />
                  ))}

                  {isGenerating && <ThinkingMessage />}
                </ScrollView>

                {showScrollButton && (
                  <TouchableOpacity
                    style={styles.scrollToBottomButton}
                    onPress={scrollToBottom}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={require("@/assets/images/icons/CaretDown.png")}
                      style={styles.scrollToBottomIcon}
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TouchableOpacity style={styles.attachmentButton}>
                <Image
                  source={require("@/assets/images/icons/attachement.png")}
                  style={{ width: 24, height: 24 }}
                />
              </TouchableOpacity>
              <TextInput
                placeholder="Type a message..."
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                returnKeyType="send"
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendMessage}
                disabled={inputText.trim() === ""}
              >
                <Image
                  source={require("@/assets/images/icons/send-2.png")}
                  style={[
                    { width: 24, height: 24 },
                    inputText.trim() === "" && styles.disabledSend,
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default Chat;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FBFC",
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FBFC",
    display: "flex",
    flexDirection: "column",
    marginTop: 50,
  },
  button: {
    borderRadius: 50,
    borderWidth: 0.5,
    borderColor: "#EDF3FC",
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
    backgroundColor: "#FFFFFF",
  },
  headerText: {
    color: "#2D3C52",
    fontSize: 20,
    fontWeight: "500",
    fontFamily: "Satoshi",
    lineHeight: 24,
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#F9FBFC",
    borderBottomWidth: 1,
    borderBottomColor: "#EDF3FC",
    borderRadius: 10,
    marginHorizontal: 10,
    marginTop: 10,
  },
  chatContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  chatContentWithKeyboard: {
    justifyContent: "flex-start",
    paddingTop: 20,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginBottom: 20,
  },
  welcomeText: {
    color: "#2D3C52",
    textAlign: "center",
    fontFamily: "Satoshi",
    fontWeight: "700",
    fontSize: 24,
    marginBottom: 30,
    lineHeight: 32,
  },
  suggestions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  suggestion: {
    padding: 16,
    backgroundColor: "#F0F4FF",
    borderRadius: 12,
    minWidth: 100,
    flex: 1,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  suggestionText: {
    fontFamily: "Satoshi",
    color: "#2D3C52",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  messagesContainer: {
    flex: 1,
    width: "100%",
    position: "relative",
  },
  messagesScroll: {
    flex: 1,
  },
  messagesScrollContent: {
    paddingVertical: 10,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#EDF3FC",
    backgroundColor: "#FFFFFF",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F4FF",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  attachmentButton: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    padding: 10,
    fontFamily: "Urbanist",
    fontSize: 16,
    color: "#2D3C52",
  },
  sendButton: {
    marginLeft: 10,
    padding: 5,
  },
  disabledSend: {
    opacity: 0.5,
  },
  backdrop: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.4)",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  scrollToBottomButton: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#00FF80",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  scrollToBottomIcon: {
    width: 24,
    height: 24,
    tintColor: "#2D3C52",
  },
});
