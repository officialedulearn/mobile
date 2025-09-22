import useUserStore from "@/core/userState";
import { Message } from "@/interface/Chat";
import { AIService } from "@/services/ai.service";
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
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from 'expo-audio';
import ChatDrawer from "./ChatDrawer";
import { MessageItem, ThinkingMessage } from "./MessageItem";
import { useRouter, useLocalSearchParams } from "expo-router";

type Props = {
  title: string;
  initialMessages?: Array<Message>;
  chatId: string;
};

const Chat = ({ title, initialMessages = [], chatId }: Props) => {
  const aiService = new AIService();
  const [messages, setMessages] = useState<Array<Message>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const user = useUserStore((s) => s.user);
  const theme = useUserStore((s) => s.theme);
  const [inputText, setInputText] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [activeChatId, setActiveChatId] = useState(chatId);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const router = useRouter();
  const searchParams = useLocalSearchParams();

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

  // Audio permissions and setup
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

  const resetChatState = useCallback(() => {
    setMessages([]);
    setIsGenerating(false);
    setInputText("");
    setShowScrollButton(false);
    setDrawerOpen(false);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
  }, []);

  useEffect(() => {
    const newChatId = Array.isArray(searchParams.chatIdFromNav)
      ? searchParams.chatIdFromNav[0]
      : searchParams.chatIdFromNav || chatId;

    if (newChatId && newChatId !== activeChatId) {
      setIsTransitioning(true);
      resetChatState();
      setActiveChatId(newChatId);

      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }
  }, [searchParams.chatIdFromNav, chatId, activeChatId, resetChatState]);

  useEffect(() => {
    if (!isTransitioning && activeChatId && initialMessages.length > 0) {
      const relevantMessages = initialMessages.filter(
        (msg) => msg.chatId === activeChatId,
      );
      setMessages(relevantMessages);
    } else if (!isTransitioning && initialMessages.length === 0) {
      setMessages([]);
    }
  }, [activeChatId, initialMessages, isTransitioning]);

  useEffect(() => {
    if (messages.length > 0 && !isTransitioning) {
      scrollToBottom();
    }
  }, [messages, isTransitioning, keyboardHeight]);

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
    if (user?.id && messages.length === 0) {
      fetchSuggestions();
    }
  }, [user?.id, fetchSuggestions, messages.length]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollViewRef.current && !isTransitioning) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  }, [isTransitioning]);

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
      setShowScrollButton(!isCloseToBottom && messages.length > 2);
    },
    [messages.length],
  );

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (textToSend === "" || isGenerating || isTransitioning) return;

    setInputText("");

    const newMessage: Message = {
      id: generateUUID(),
      role: "user",
      content: textToSend,
      createdAt: new Date(),
      chatId: activeChatId,
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setIsGenerating(true);

    try {
      const response = await aiService.generateMessages({
        messages: updatedMessages,
        chatId: activeChatId,
        userId: user?.id as unknown as string,
      });

      const assistantMessage: Message = {
        id: response.id,
        role: "assistant",
        content:
          typeof response.content === "string"
            ? response.content
            : response.content,
        createdAt: response.createdAt,
        chatId: response.chatId || activeChatId,
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    } catch (error) {
      console.error("Error generating message:", error);
      setInputText(textToSend);
    } finally {
      setIsGenerating(false);
      scrollToBottom();
    }
  };

  const handleCreateNewChat = useCallback(() => {
    const newChatId = generateUUID();

    setDrawerOpen(false);

    router.replace({
      pathname: "/(tabs)/chat",
      params: {
        chatIdFromNav: newChatId,
        refresh: Date.now().toString(),
      },
    });
  }, [router]);

  const handleSuggestionPress = useCallback(
    (suggestion: string) => {
      if (isGenerating || isTransitioning) return;
      handleSendMessage(suggestion);
    },
    [isGenerating, isTransitioning, handleSendMessage],
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

  if (isTransitioning) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          theme === "dark" && { backgroundColor: "#131313" },
        ]}
      >
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        <View
          style={[
            styles.container,
            theme === "dark" && { backgroundColor: "#131313" },
          ]}
        >
          <View style={styles.loadingContainer}>
            <Text
              style={[
                styles.loadingText,
                theme === "dark" && { color: "#E0E0E0" },
              ]}
            >
              Loading chat...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
          keyboardVerticalOffset={Platform.OS === "ios" ? 30 : 0}
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
            <TouchableOpacity
              style={[
                styles.button,
                theme === "dark" && {
                  backgroundColor: "#0D0D0D",
                  borderColor: "#2E3033",
                },
              ]}
              activeOpacity={0.8}
              onPress={handleCreateNewChat}
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
            {messages.length === 0 ? (
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
                  {!loadingSuggestions &&
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
                disabled={isGenerating || isTransitioning || isTranscribing}
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
                editable={!isGenerating && !isTransitioning}
                textAlignVertical="center"
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => handleSendMessage()}
                disabled={
                  inputText.trim() === "" || isGenerating || isTransitioning
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
                      isTransitioning) &&
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
    marginTop: 30,
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
});
