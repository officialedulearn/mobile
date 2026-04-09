import useUserStore from "@/core/userState";
import { Message } from "@/interface/Chat";
import { AIService } from "@/services/ai.service";
import { useChatNavigation } from "@/contexts/ChatContext";
import { generateUUID } from "@/utils/constants";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  Image,
  Keyboard,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import {
  KeyboardChatScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import * as Haptics from "expo-haptics";
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from "expo-audio";
import ChatDrawer from "./ChatDrawer";
import ChatHeaderBar from "./ChatHeaderBar";
import { ChatRecordingRow, ChatTextInputRow } from "./ChatComposerInput";
import ChatTypingIndicator from "./ChatTypingIndicator";
import { MessageItem } from "./MessageItem";
import QuizRefreshModal from "../quiz/QuizRefreshModal";
import { useRouter } from "expo-router";
import {
  withRepeat,
  withTiming,
  withSequence,
  useSharedValue,
  Easing,
} from "react-native-reanimated";
import useChatStore from "@/core/chatState";

type Props = {
  title: string;
  initialMessages?: Message[];
  chatId: string;
};

const Chat = ({ title, initialMessages = [], chatId }: Props) => {
  const aiService = new AIService();
  const {
    deleteChat,
    addMessage,
    setMessages: syncMessagesToStore,
  } = useChatStore();
  const { isNavigating, createNewChat, refreshChatList } = useChatNavigation();
  const messagesRef = React.useRef<Message[]>([]);
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const user = useUserStore((s) => s.user);
  const theme = useUserStore((s) => s.theme);
  const updateUserCredits = useUserStore((s) => s.updateUserCredits);
  const [inputText, setInputText] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showQuizRefreshModal, setShowQuizRefreshModal] = useState(false);
  const flashListRef = useRef<FlashListRef<Message>>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);
  const composerHeight = useSharedValue(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [waitingForStream, setWaitingForStream] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );

  const tokenQueueRef = useRef<string[]>([]);
  const processingTokensRef = useRef(false);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const waveAnimation1 = useSharedValue(0);
  const waveAnimation2 = useSharedValue(0);
  const waveAnimation3 = useSharedValue(0);
  const waveAnimation4 = useSharedValue(0);
  const waveAnimation5 = useSharedValue(0);
  const waveAnimations = useRef([
    waveAnimation1,
    waveAnimation2,
    waveAnimation3,
    waveAnimation4,
    waveAnimation5,
  ]).current;

  const micButtonScale = useSharedValue(1);
  const micButtonRotation = useSharedValue(0);
  const inputContainerOpacity = useSharedValue(1);
  const recordingContainerScale = useSharedValue(0.95);

  const router = useRouter();

  const safeSetMessages = useCallback(
    (updater: Message[] | ((prev: Message[]) => Message[])) => {
      setMessages((prev) => {
        const prevMessages = prev || [];
        if (typeof updater === "function") {
          const result = updater(prevMessages);
          return Array.isArray(result) ? result : [];
        }
        return Array.isArray(updater) ? updater : [];
      });
    },
    [],
  );

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert("Permission to access microphone was denied");
      }

      setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (initialMessages && Array.isArray(initialMessages)) {
      safeSetMessages(initialMessages);
    }
  }, [initialMessages, safeSetMessages]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      scrollToBottom();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && messages && messages.length === 0) {
      fetchSuggestions();
    }
  }, [user?.id, fetchSuggestions, messages]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (flashListRef.current) {
        flashListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  }, []);

  const processTokenQueue = useCallback(
    (assistantMessageId: string) => {
      if (processingTokensRef.current || tokenQueueRef.current.length === 0) {
        return;
      }

      processingTokensRef.current = true;

      const processChunk = () => {
        if (tokenQueueRef.current.length === 0) {
          processingTokensRef.current = false;
          return;
        }

        const allTokens = tokenQueueRef.current
          .splice(0, tokenQueueRef.current.length)
          .join("");

        safeSetMessages((currentMessages) => {
          const messagesCopy = [...currentMessages];
          const messageIndex = messagesCopy.findIndex(
            (msg) => msg && msg.id === assistantMessageId,
          );

          if (messageIndex !== -1) {
            const message = messagesCopy[messageIndex];
            const currentContent =
              typeof message.content === "string"
                ? message.content
                : message.content || "";
            message.content = currentContent + allTokens;
          }

          return messagesCopy;
        });

        scrollToBottom();
        processingTokensRef.current = false;
      };

      processChunk();
    },
    [scrollToBottom, safeSetMessages],
  );

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

    const currentCredits = Number(user?.credits) || 0;

    if (currentCredits <= 0.5) {
      console.log(
        "User has insufficient credits, redirecting to freeTrialIntro",
      );
      router.push("/freeTrialIntro");
      return;
    }

    updateUserCredits(currentCredits - 0.5);

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
    addMessage(chatId, newMessage);
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
              addMessage(chatId, assistantMessage);
              return messagesCopy;
            });
            messageCreated = true;
          }

          tokenQueueRef.current.push(token);
          processTokenQueue(assistantMessageId);
        },
        (fullMessage: Message) => {
          const checkQueueComplete = () => {
            if (
              tokenQueueRef.current.length === 0 &&
              !processingTokensRef.current
            ) {
              setIsGenerating(false);
              setStreamingMessageId(null);
              syncMessagesToStore(chatId, messagesRef.current);
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
              currentMessages.filter((msg) => msg.id !== assistantMessageId),
            );
          }

          setIsGenerating(false);
          setWaitingForStream(false);
          setStreamingMessageId(null);
          Alert.alert(
            "Error",
            error.message || "Failed to generate response. Please try again.",
          );
        },
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
          currentMessages.filter((msg) => msg.id !== assistantMessageId),
        );
      }

      Alert.alert(
        "Error",
        error.message || "Failed to start streaming. Please try again.",
      );
    }
  };

  const handleCreateNewChat = useCallback(() => {
    setDrawerOpen(false);
    createNewChat();
  }, [createNewChat]);

  const handleGoHome = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    router.navigate("/(tabs)");
  }, [router]);

  const handleSuggestionPress = useCallback(
    (suggestion: string) => {
      if (isGenerating || isNavigating) return;
      handleSendMessage(suggestion);
    },
    [isGenerating, isNavigating, handleSendMessage],
  );

  const recordingOpacity = useSharedValue(0);

  useEffect(() => {
    if (recorderState.isRecording) {
      inputContainerOpacity.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });

      recordingContainerScale.value = withSequence(
        withTiming(0.95, { duration: 0 }),
        withTiming(1.02, { duration: 200, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 150, easing: Easing.inOut(Easing.ease) }),
      );

      recordingOpacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });

      waveAnimations.forEach((anim, index) => {
        setTimeout(() => {
          anim.value = withRepeat(
            withSequence(
              withTiming(0.2, {
                duration: 200 + index * 40,
                easing: Easing.inOut(Easing.ease),
              }),
              withTiming(1, {
                duration: 300 + index * 50,
                easing: Easing.inOut(Easing.sin),
              }),
              withTiming(0.3, {
                duration: 300 + index * 50,
                easing: Easing.inOut(Easing.sin),
              }),
              withTiming(0.2, {
                duration: 200 + index * 40,
                easing: Easing.inOut(Easing.ease),
              }),
            ),
            -1,
            false,
          );
        }, index * 30);
      });
    } else {
      inputContainerOpacity.value = withTiming(1, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      });

      recordingContainerScale.value = withTiming(0.95, {
        duration: 200,
        easing: Easing.in(Easing.cubic),
      });

      recordingOpacity.value = withTiming(0, {
        duration: 200,
        easing: Easing.in(Easing.cubic),
      });

      waveAnimations.forEach((anim) => {
        anim.value = withTiming(0, {
          duration: 200,
          easing: Easing.in(Easing.ease),
        });
      });

      micButtonScale.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
      micButtonRotation.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      });
    }
  }, [recorderState.isRecording]);

  const startRecording = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      micButtonScale.value = withSequence(
        withTiming(0.85, { duration: 100, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 150, easing: Easing.out(Easing.back(1.5)) }),
      );

      micButtonRotation.value = withSequence(
        withTiming(15, { duration: 100, easing: Easing.out(Easing.cubic) }),
        withTiming(-10, { duration: 100, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 100, easing: Easing.out(Easing.ease) }),
      );

      Keyboard.dismiss();
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (error) {
      console.error("Error starting recording:", error);
      Alert.alert("Error", "Failed to start recording");

      micButtonScale.value = withTiming(1, { duration: 150 });
      micButtonRotation.value = withTiming(0, { duration: 150 });
    }
  };

  const stopRecording = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await audioRecorder.stop();
      if (audioRecorder.uri) {
        try {
          setIsTranscribing(true);
          const response = await aiService.transcribeAudio({
            audioUri: audioRecorder.uri,
          });

          setInputText(response.transcription);
        } catch (transcriptionError) {
          console.error("Error transcribing audio:", transcriptionError);
          Alert.alert(
            "Error",
            "Failed to process your audio message. Please try again.",
          );
        } finally {
          setIsTranscribing(false);
        }
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
      Alert.alert("Error", "Failed to stop recording");
    }
  };

  const filteredMessages = useMemo(() => {
    if (!messages || !Array.isArray(messages)) return [];
    return messages.filter((message) => {
      if (!message || !message.id) return false;
      if (message.role === "user") return true;
      let content = "";
      if (typeof message.content === "string") {
        content = message.content;
      } else if (
        message.content &&
        typeof message.content === "object" &&
        "text" in message.content
      ) {
        content = (message.content as any).text || "";
      }
      return content.length > 0 || message.id === streamingMessageId;
    });
  }, [messages, streamingMessageId]);

  const renderScrollComponent = useCallback(
    (props: object) => (
      <KeyboardChatScrollView
        {...props}
        applyWorkaroundForContentInsetHitTestBug
        extraContentPadding={composerHeight}
        keyboardDismissMode="interactive"
        keyboardLiftBehavior="whenAtEnd"
        offset={footerHeight}
      />
    ),
    [composerHeight, footerHeight],
  );

  const handleHeaderQuiz = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const quizLimit = user?.quizLimit ?? 0;
    const currentCredits = Number(user?.credits) || 0;
    if (quizLimit <= 0) {
      setShowQuizRefreshModal(true);
      return;
    }
    if (currentCredits <= 0.5) {
      router.push("/freeTrialIntro");
      return;
    }
    router.navigate({
      pathname: "/quiz",
      params: { chatId },
    });
  }, [user?.quizLimit, user?.credits, chatId, router]);

  const handleConfirmDeleteChat = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await deleteChat(chatId);
      refreshChatList();
      Alert.alert("Success", "Chat deleted successfully");
      createNewChat();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to delete chat. Please try again.");
    }
  }, [chatId, deleteChat, refreshChatList, createNewChat]);

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        theme === "dark" && { backgroundColor: "#131313" },
      ]}
      edges={["left", "right"]}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <View
        style={[
          styles.container,
          theme === "dark" && { backgroundColor: "#131313" },
        ]}
      >
        <View style={{ flex: 1 }}>
          <ChatHeaderBar
            title={title || "AI Tutor Chat"}
            theme={theme}
            isEmpty={!messages || messages.length === 0}
            onOpenDrawer={() => setDrawerOpen(true)}
            onNewChat={handleCreateNewChat}
            onQuiz={handleHeaderQuiz}
            onRequestDelete={handleConfirmDeleteChat}
          />

          {drawerOpen && (
            <>
              <View
                style={styles.backdrop}
                onTouchStart={() => setDrawerOpen(false)}
              />
              <ChatDrawer onClose={() => setDrawerOpen(false)} />
            </>
          )}

          <QuizRefreshModal
            visible={showQuizRefreshModal}
            onClose={() => setShowQuizRefreshModal(false)}
            onSuccess={() => {
              setShowQuizRefreshModal(false);
              useUserStore.getState().setUserAsync();
            }}
          />

          <View style={styles.chatContent}>
            {!messages || messages.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <View style={styles.emptyImageContainer}>
                  <Image
                    source={require("@/assets/images/eddie/Mischievous.png")}
                    style={styles.emptyImage}
                  />
                  <Image
                    source={
                      theme === "dark"
                        ? require("@/assets/images/logo.png")
                        : require("@/assets/images/LOGO-2.png")
                    }
                    style={styles.logo}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.messagesContainer}>
                <FlashList
                  ref={flashListRef}
                  data={filteredMessages}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled={Platform.OS === "android"}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <MessageItem
                      message={item}
                      isStreaming={item.id === streamingMessageId}
                    />
                  )}
                  renderScrollComponent={renderScrollComponent}
                  ListFooterComponent={
                    waitingForStream ? <ChatTypingIndicator /> : null
                  }
                  onScroll={handleScroll}
                  onScrollBeginDrag={Keyboard.dismiss}
                  scrollEventThrottle={16}
                  showsVerticalScrollIndicator={false}
                  style={styles.messagesScroll}
                  contentContainerStyle={styles.messagesScrollContent}
                />

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

          <KeyboardStickyView offset={{ closed: 0, opened: 10 }}>
            <View
              onLayout={(e: LayoutChangeEvent) => {
                setFooterHeight(e.nativeEvent.layout.height);
              }}
            >
              <View style={styles.chatEscapeRow}>
                <TouchableOpacity
                  accessibilityLabel="Go to Home"
                  accessibilityRole="button"
                  activeOpacity={0.85}
                  onPress={handleGoHome}
                  style={[
                    styles.escapePill,
                    theme === "dark" && styles.escapePillDark,
                  ]}
                >
                  <Image
                    source={
                      theme === "dark"
                        ? require("@/assets/images/icons/dark/home.png")
                        : require("@/assets/images/icons/home.png")
                    }
                    style={styles.escapePillIcon}
                  />
                  <Text
                    style={[
                      styles.escapePillLabel,
                      theme === "dark" && styles.escapePillLabelDark,
                    ]}
                  >
                    Home
                  </Text>
                </TouchableOpacity>
              </View>

              {(!messages || messages.length === 0) &&
                !loadingSuggestions &&
                suggestions &&
                suggestions.length > 0 && (
                  <View
                    style={[
                      styles.suggestionsContainer,
                      theme === "dark" && {
                        backgroundColor: "#131313",
                        borderTopColor: "#2E3033",
                      },
                    ]}
                  >
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.suggestionsScrollContent}
                      style={styles.suggestionsScroll}
                    >
                      {suggestions.map((suggestion, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.suggestion,
                            theme === "dark" && {
                              backgroundColor: "#0D0D0D",
                              borderColor: "#2E3033",
                            },
                          ]}
                          onPress={() => handleSuggestionPress(suggestion)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.suggestionText,
                              theme === "dark" && { color: "#E0E0E0" },
                            ]}
                            numberOfLines={2}
                          >
                            {suggestion}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

              <View
                style={[
                  styles.inputContainer,
                  theme === "dark" && {
                    borderTopColor: "#2E3033",
                    backgroundColor: "#131313",
                  },
                ]}
              >
                {recorderState.isRecording ? (
                  <ChatRecordingRow
                    composerHeight={composerHeight}
                    waveAnimations={waveAnimations}
                    theme={theme}
                    recordingOpacity={recordingOpacity}
                    recordingContainerScale={recordingContainerScale}
                    onStop={stopRecording}
                  />
                ) : (
                  <ChatTextInputRow
                    composerHeight={composerHeight}
                    theme={theme}
                    inputText={inputText}
                    setInputText={setInputText}
                    isTranscribing={isTranscribing}
                    isGenerating={isGenerating}
                    isNavigating={isNavigating}
                    handleSendMessage={() => {
                      void handleSendMessage();
                    }}
                    scrollToBottom={scrollToBottom}
                    startRecording={startRecording}
                    inputContainerOpacity={inputContainerOpacity}
                    micButtonScale={micButtonScale}
                    micButtonRotation={micButtonRotation}
                  />
                )}
              </View>
            </View>
          </KeyboardStickyView>
        </View>
      </View>
    </SafeAreaView>
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
  chatContent: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 20,
  },
  chatEscapeRow: {
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 4,
  },
  escapePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  escapePillDark: {
    backgroundColor: "rgba(30,30,30,0.96)",
    borderColor: "#2E3033",
  },
  escapePillIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
  escapePillLabel: {
    fontFamily: "Satoshi-Regular",
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3C52",
  },
  escapePillLabelDark: {
    color: "#E8E8E8",
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
  },
  suggestionsContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#EDF3FC",
    backgroundColor: "#FFFFFF",
  },
  suggestionsScroll: {
    flexGrow: 0,
  },
  suggestionsScrollContent: {
    paddingHorizontal: 4,
    gap: 10,
  },
  suggestion: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    minWidth: 120,
    maxWidth: 280,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F4FF",
    borderWidth: 1,
    borderColor: "#EDF3FC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionText: {
    fontFamily: "Satoshi-Regular",
    color: "#2D3C52",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 20,
  },
  messagesContainer: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    position: "relative",
  },
  messagesScroll: {
    flex: 1,
    minHeight: 0,
  },
  messagesScrollContent: {
    paddingVertical: 10,
    paddingBottom: 20,
    flexGrow: 1,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 8 : 6,
    borderTopWidth: 1,
    borderTopColor: "#EDF3FC",
    backgroundColor: "#FFFFFF",
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
  emptyImage: {
    width: 140,
    height: 159,
    resizeMode: "contain",
  },
  emptyImageContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 40,
  },
});
