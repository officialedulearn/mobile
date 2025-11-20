import useUserStore from "@/core/userState";
import { Message } from "@/interface/Chat";
import { AIService } from "@/services/ai.service";
import { useChatNavigation } from "@/contexts/ChatContext";
import { generateUUID } from "@/utils/constants";
import { StatusBar } from "expo-status-bar";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import React, { useEffect, useRef, useState, useCallback } from "react";
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
  Dimensions,
  Alert,
} from "react-native";
import * as Haptics from 'expo-haptics';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from 'expo-audio';
import ChatDrawer from "./ChatDrawer";
import { MessageItem } from "./MessageItem";
import { useRouter } from "expo-router";
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence 
} from 'react-native-reanimated';
import { ChatService } from "@/services/chat.service";

type Props = {
  title: string;
  initialMessages?: Array<Message>;
  chatId: string;
};

const Chat = ({ title, initialMessages = [], chatId }: Props) => {
  const aiService = new AIService();
  const chatService = new ChatService();
  const { isNavigating, createNewChat, refreshChatList } = useChatNavigation();
  const [messages, setMessages] = useState<Array<Message>>(initialMessages || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const user = useUserStore((s) => s.user);
  const theme = useUserStore((s) => s.theme);
  const [inputText, setInputText] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [waitingForStream, setWaitingForStream] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const tokenQueueRef = useRef<string[]>([]);
  const processingTokensRef = useRef(false);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const safeSetMessages = useCallback((updater: Array<Message> | ((prev: Array<Message>) => Array<Message>)) => {
    setMessages((prev) => {
      const prevMessages = prev || [];
      if (typeof updater === 'function') {
        const result = updater(prevMessages);
        return Array.isArray(result) ? result : [];
      }
      return Array.isArray(updater) ? updater : [];
    });
  }, []);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission to access microphone was denied');
      }

      setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  useEffect(() => {
    if (initialMessages && Array.isArray(initialMessages)) {
      safeSetMessages(initialMessages);
    }
  }, [initialMessages, safeSetMessages]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, keyboardHeight]);

  const fetchSuggestions = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoadingSuggestions(true);
      const fetchedSuggestions = await aiService.generateSuggestions({
        userId: user.id,
      });
      setSuggestions(fetchedSuggestions || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([
        "Teach me about DeFi",
        "Learn about RWAs",
        "Blockchain basics",
      ]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && messages && messages.length === 0) {
      fetchSuggestions();
    }
  }, [user?.id, fetchSuggestions, messages]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  }, []);

  const processTokenQueue = useCallback((assistantMessageId: string) => {
    if (processingTokensRef.current || tokenQueueRef.current.length === 0) {
      return;
    }

    processingTokensRef.current = true;

    const processChunk = () => {
      if (tokenQueueRef.current.length === 0) {
        processingTokensRef.current = false;
        return;
      }

      const allTokens = tokenQueueRef.current.splice(0, tokenQueueRef.current.length).join('');
      
      safeSetMessages((currentMessages) => {
        const messagesCopy = [...currentMessages];
        const messageIndex = messagesCopy.findIndex(msg => msg && msg.id === assistantMessageId);
        
        if (messageIndex !== -1) {
          const message = messagesCopy[messageIndex];
          const currentContent = typeof message.content === 'string' 
            ? message.content 
            : (message.content || '');
          message.content = currentContent + allTokens;
        }
        
        return messagesCopy;
      });

      scrollToBottom();
      processingTokensRef.current = false;
    };

    processChunk();
  }, [scrollToBottom, safeSetMessages]);

  const handleScroll = useCallback(
    (event: {
      nativeEvent: {
        layoutMeasurement: any;
        contentOffset: any;
        contentSize: any;
      };
    }) => {
      const { layoutMeasurement, contentOffset, contentSize } =
        event.nativeEvent;
      const paddingToBottom = 20;
      const isCloseToBottom =
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - paddingToBottom;
      setShowScrollButton(!isCloseToBottom && messages && messages.length > 2);
    },
    [messages],
  );

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (textToSend === "" || isGenerating || isNavigating) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setInputText("");

    const newMessage: Message = {
      id: generateUUID(),
      role: "user",
      content: textToSend,
      createdAt: new Date(),
      chatId: chatId,
    };

    const updatedMessages = [...(messages || []), newMessage];
    safeSetMessages(updatedMessages);
    setIsGenerating(true);
    setWaitingForStream(true);

    const assistantMessageId = generateUUID();
    let messageCreated = false;

    try {
      const cleanup = await aiService.generateMessagesStream(
        {
          messages: updatedMessages,
          chatId: chatId,
          userId: user?.id as unknown as string,
        },
        (token: string, type?: string) => {
          if (!messageCreated) {
            setWaitingForStream(false);
            setStreamingMessageId(assistantMessageId);
            safeSetMessages((currentMessages) => {
              const messagesCopy = [...currentMessages];
              const assistantMessage: Message = {
                id: assistantMessageId,
                role: "assistant",
                content: "",
                createdAt: new Date(),
                chatId: chatId,
              };
              messagesCopy.push(assistantMessage);
              return messagesCopy;
            });
            messageCreated = true;
          }
          
          tokenQueueRef.current.push(token);
          processTokenQueue(assistantMessageId);
        },
        (fullMessage: Message) => {
          const checkQueueComplete = () => {
            if (tokenQueueRef.current.length === 0 && !processingTokensRef.current) {
              setIsGenerating(false);
              setStreamingMessageId(null);
              refreshChatList();
              scrollToBottom();
            } else {
              setTimeout(checkQueueComplete, 50);
            }
          };
          checkQueueComplete();
        },
        (error: Error) => {
          console.error("Error generating message:", error);
          setInputText(textToSend);
          
          tokenQueueRef.current = [];
          processingTokensRef.current = false;
          
          if (messageCreated) {
            safeSetMessages((currentMessages) => 
              currentMessages.filter(msg => msg.id !== assistantMessageId)
            );
          }
          
          setIsGenerating(false);
          setWaitingForStream(false);
          setStreamingMessageId(null);
          Alert.alert('Error', error.message || 'Failed to generate response. Please try again.');
        }
      );


    } catch (error: any) {
      console.error("Error generating message:", error);
      setInputText(textToSend);
      setIsGenerating(false);
      setWaitingForStream(false);
      setStreamingMessageId(null);
      
      tokenQueueRef.current = [];
      processingTokensRef.current = false;
      
      if (messageCreated) {
        safeSetMessages((currentMessages) => 
          currentMessages.filter(msg => msg.id !== assistantMessageId)
        );
      }
      
      Alert.alert('Error', error.message || 'Failed to start streaming. Please try again.');
    }
  };

  const handleCreateNewChat = useCallback(() => {
    setDrawerOpen(false);
    createNewChat();
  }, [createNewChat]);

  const handleSuggestionPress = useCallback(
    (suggestion: string) => {
      if (isGenerating || isNavigating) return;
      handleSendMessage(suggestion);
    },
    [isGenerating, isNavigating, handleSendMessage],
  );

  const startRecording = async () => {
    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorder.stop();
      if (audioRecorder.uri) {
        setRecordingUri(audioRecorder.uri);
        console.log('Recording saved to:', audioRecorder.uri);
      
        try {
          setIsTranscribing(true);
          const response = await aiService.transcribeAudio({
            audioUri: audioRecorder.uri,
          });
          
          setInputText(response.transcription);
          
          setTimeout(() => {
            
          }, 100);
          
        } catch (transcriptionError) {
          console.error('Error transcribing audio:', transcriptionError);
          Alert.alert('Error', 'Failed to process your audio message. Please try again.');
        } finally {
          setIsTranscribing(false);
        }
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };


  return (
    <View
      style={[
        styles.safeArea,
        theme === "dark" && { backgroundColor: "#131313" },
      ]}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <SafeAreaView
        style={[
          styles.container,
          theme === "dark" && { backgroundColor: "#131313" },
        ]}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
          <View
            style={[
              styles.topNav,
              theme === "dark" && {
                backgroundColor: "#131313",
                borderBottomColor: "#2E3033",
              },
            ]}
          >
            <View style={styles.leftNavContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  theme === "dark" && {
                    backgroundColor: "#0D0D0D",
                    borderColor: "#2E3033",
                  },
                ]}
                onPress={() => setDrawerOpen(true)}
                activeOpacity={0.8}
              >
                <Image
                  source={
                    theme === "dark"
                      ? require("@/assets/images/icons/dark/menu.png")
                      : require("@/assets/images/icons/menu.png")
                  }
                  style={{ width: 20, height: 20 }}
                />
              </TouchableOpacity>
              <Text
                style={[
                  styles.headerText,
                  theme === "dark" && { color: "#E0E0E0" },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title || "AI Tutor Chat"}
              </Text>
            </View>
           {
            messages.length === 0 && (
              <TouchableOpacity
              style={[
                styles.button,
                theme === "dark" && {
                  backgroundColor: "#0D0D0D",
                  borderColor: "#2E3033",
                },
              ]}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleCreateNewChat();
              }}
            >
              <Image
                source={
                  theme === "dark"
                    ? require("@/assets/images/icons/dark/pen.png")
                    : require("@/assets/images/icons/pen.png")
                }
                style={{ width: 20, height: 20 }}
              />
            </TouchableOpacity>
            )
           }
            
            {messages.length > 0 && (

              <View style={{ flexDirection: 'row', gap: 8 }}>

              <TouchableOpacity
                style={[
                  styles.button,
                  theme === "dark" && {
                    backgroundColor: "#0D0D0D",
                    borderColor: "#2E3033",
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.navigate({
                    pathname: "/quiz",
                    params: {
                      chatId: chatId,
                    },
                  });
                }}
              >
                <Image
                  source={theme === "dark"
                    ? require("@/assets/images/icons/dark/BrainChat.png")
                    : require("@/assets/images/icons/BrainChat.png")
                  }
                  style={{ width: 20, height: 20 }}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  theme === "dark" && {
                    backgroundColor: "#0D0D0D",
                    borderColor: "#2E3033",
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert(
                    "Delete Chat",
                    "Are you sure you want to delete this chat? This action cannot be undone.",
                    [
                      {
                        text: "Cancel",
                        style: "cancel",
                        onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                          try {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            await chatService.deleteChat(chatId);
                            await refreshChatList();
                            Alert.alert("Success", "Chat deleted successfully");
                            createNewChat();
                          } catch (error) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                            Alert.alert("Error", "Failed to delete chat. Please try again.");
                          }
                        }
                      }
                    ]
                  );
                }}
              >
                <Image
                  source={theme === "dark"
                    ? require("@/assets/images/icons/dark/delete.png")
                    : require("@/assets/images/icons/delete.png")
                  }
                  style={{ width: 20, height: 20 }}
                />
              </TouchableOpacity>
            </View>
            )}
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

          <View style={styles.chatContent}>
            {!messages || messages.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Image
                  source={
                    theme === "dark"
                      ? require("@/assets/images/logo.png")
                      : require("@/assets/images/LOGO-1.png")
                  }
                  style={styles.logo}
                />
                <View style={styles.suggestions}>
                  {!loadingSuggestions && suggestions && Array.isArray(suggestions) &&
                    suggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.suggestion,
                          theme === "dark" && {
                            backgroundColor: "#0D0D0D",
                            borderColor: "#2E3033",
                            borderWidth: 1,
                          },
                        ]}
                        onPress={() => handleSuggestionPress(suggestion)}
                      >
                        <Text
                          style={[
                            styles.suggestionText,
                            theme === "dark" && { color: "#E0E0E0" },
                          ]}
                        >
                          {suggestion}
                        </Text>
                      </TouchableOpacity>
                    ))}
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
                  showsVerticalScrollIndicator={false}
                >
                  {messages && Array.isArray(messages) && messages
                    .filter(message => {
                      if (!message || !message.id) return false;
                      
                      if (message.role === 'user') return true;
                      
                      let content = '';
                      if (typeof message.content === 'string') {
                        content = message.content;
                      } else if (message.content && typeof message.content === 'object' && 'text' in message.content) {
                        content = (message.content as any).text || '';
                      }
                        
                      return content.length > 0 || message.id === streamingMessageId;
                    })
                    .map((message) => {
                      const isStreaming = message.id === streamingMessageId;
                      return (
                        <MessageItem 
                          key={message.id} 
                          message={message}
                          isStreaming={isStreaming}
                        />
                      );
                    })}

                  {waitingForStream && <AITypingIndicator />}
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

          <View
            style={[
              styles.inputContainer,
              theme === "dark" && {
                borderTopColor: "#2E3033",
                backgroundColor: "#131313",
              },
            ]}
          >
            <View
              style={[
                styles.inputWrapper,
                theme === "dark" && {
                  backgroundColor: "#0D0D0D",
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.attachmentButton,
                  (recorderState.isRecording || isTranscribing) && styles.recordingButton
                ]}
                onPress={recorderState.isRecording ? stopRecording : startRecording}
                disabled={isGenerating || isNavigating || isTranscribing}
              >
                <FontAwesome 
                  name={recorderState.isRecording ? "stop" : "microphone"} 
                  size={24} 
                  color={recorderState.isRecording ? "#FF4444" : (theme === "dark" ? "#E0E0E0" : "black")} 
                />
              </TouchableOpacity>
              {(recorderState.isRecording || isTranscribing) && (
                <Text style={[
                  styles.recordingText,
                  theme === "dark" && { color: "#FF4444" }
                ]}>
                  {recorderState.isRecording ? "Recording..." : "Transcribing..."}
                </Text>
              )}
              <TextInput
                placeholder="Type a message..."
                placeholderTextColor={theme === "dark" ? "#B3B3B3" : "#61728C"}
                style={[
                  styles.textInput,
                  theme === "dark" && { color: "#E0E0E0" },
                ]}
                value={inputText}
                onChangeText={setInputText}
                returnKeyType="send"
                onSubmitEditing={() => handleSendMessage()}
                onFocus={() => {
                  setTimeout(() => scrollToBottom(), 100);
                }}
                multiline={true}
                editable={!isGenerating && !isNavigating}
                textAlignVertical="center"
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => handleSendMessage()}
                disabled={
                  inputText.trim() === "" || isGenerating || isNavigating
                }
              >
                <Image
                  source={
                    theme === "dark"
                      ? require("@/assets/images/icons/dark/send-2.png")
                      : require("@/assets/images/icons/send-2.png")
                  }
                  style={[
                    { width: 24, height: 24 },
                    (inputText.trim() === "" ||
                      isGenerating ||
                      isNavigating) &&
                      styles.disabledSend,
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const AITypingIndicator = () => {
  const theme = useUserStore((s) => s.theme);

  const cursorStyle = useAnimatedStyle(() => {
    return {
      opacity: withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0, { duration: 500 })
        ),
        -1,
        false
      ),
    };
  });

  return (
    <View style={styles.messageContainer}>
      <View style={styles.avatarContainer}>
        <Image
          source={
            theme === "dark"
              ? require("@/assets/images/icons/dark/LOGO.png")
              : require("@/assets/images/chatbotlogo.png")
          }
          style={[styles.avatar, theme === "dark" && { width: 20, height: 20 }]}
        />
      </View>

      <View
        style={[
          styles.messageBubble,
          styles.botBubble,
          theme === "dark" && {
            backgroundColor: "#131313",
          },
          { paddingVertical: 8 }
        ]}
      >
        <Animated.View style={[styles.cursorContainer, cursorStyle]}>
          <Text style={[styles.cursor, theme === "dark" && { color: "#E0E0E0" }]}>|</Text>
        </Animated.View>
      </View>
    </View>
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
    flex: 1,
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
  },
  leftNavContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  chatContent: {
    flex: 1,
    paddingHorizontal: 20,
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
    paddingBottom: 20,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 16 : 12,
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
  recordingButton: {
    backgroundColor: "#FFE6E6",
    borderRadius: 20,
    padding: 8,
  },
  recordingText: {
    color: "#FF4444",
    fontSize: 12,
    fontFamily: "Urbanist",
    marginLeft: 5,
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
  disabledButton: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "Satoshi",
    fontSize: 16,
    color: "#2D3C52",
  },
  cursorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  cursor: {
    fontSize: 18,
    color: "#2D3C52",
    fontFamily: "Urbanist",
    fontWeight: "400" as const,
  },
  messageContainer: {
    flexDirection: "row",
    marginVertical: 8,
    paddingHorizontal: 16,
    alignItems: "flex-start",
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 7,
  },
  avatar: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: 12,
    marginBottom: 4,
  },
  botBubble: {
    backgroundColor: "#F0F4FF",
    borderTopLeftRadius: 4,
  },
});
