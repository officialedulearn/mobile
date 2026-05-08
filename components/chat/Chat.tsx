import { useChatNavigation } from "@/contexts/ChatContext";
import useAgentStore from "@/core/agentStore";
import useChatStore from "@/core/chatState";
import useUserStore from "@/core/userState";
import { Message } from "@/interface/Chat";
import { AIService } from "@/services/ai.service";
import { generateUUID } from "@/utils/constants";
import Design, { getScreenTopPadding } from "@/utils/design";
import {
  KeyboardChatLegendList,
  useKeyboardScrollToEnd,
} from "@legendapp/list/keyboard-chat";
import type { LegendListRef } from "@legendapp/list/react-native";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  KeyboardGestureArea,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import QuizRefreshModal from "../quiz/QuizRefreshModal";
import { ChatRecordingRow, ChatTextInputRow } from "./ChatComposerInput";
import ChatHeaderBar from "./ChatHeaderBar";
import ChatSidebarPanel from "./ChatSidebarPanel";
import ChatTypingIndicator from "./ChatTypingIndicator";
import { MessageItem } from "./MessageItem";

const chatAiService = new AIService();

const DRAWER_TIMING_MS = 280;
const EASE_OUT_RN_EASE = Easing.bezier(0, 0, 0.58, 1);
const KEYBOARD_MAINTAIN_SCROLL_AT_END = {
  animated: false,
  on: {
    dataChange: true,
    itemLayout: true,
    layout: true,
  },
} as const;

const DEFAULT_HEADER_TITLE = "AI Tutor Chat";
const MESSAGE_PAGE_LIMIT = 5;

const keyExtractor = (item: Message) => item.id;
const dismissKeyboard = () => Keyboard.dismiss();

const areMessageArraysEqual = (prev: Message[], next: Message[]) => {
  if (prev === next) return true;
  if (prev.length !== next.length) return false;
  for (let index = 0; index < prev.length; index += 1) {
    const prevMessage = prev[index];
    const nextMessage = next[index];
    if (
      prevMessage?.id !== nextMessage?.id ||
      prevMessage?.role !== nextMessage?.role ||
      prevMessage?.content !== nextMessage?.content
    ) {
      return false;
    }
  }
  return true;
};

type Props = {
  title: string;
  initialMessages?: Message[];
  chatId: string;
};

const Chat = ({ title, initialMessages = [], chatId }: Props) => {
  const deleteChat = useChatStore((s) => s.deleteChat);
  const addMessage = useChatStore((s) => s.addMessage);
  const syncMessagesToStore = useChatStore((s) => s.setMessages);
  const fetchOlderMessages = useChatStore((s) => s.fetchOlderMessages);
  const { isNavigating, createNewChat, refreshChatList } = useChatNavigation();
  const messagesRef = React.useRef<Message[]>([]);
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [isGenerating, setIsGenerating] = useState(false);

  const { user, theme, updateUserCredits } = useUserStore();
  const userId = user?.id;
  const [inputText, setInputText] = useState("");
  const dragStartOffset = useSharedValue(0);
  const sidebarWidthSV = useSharedValue(0);
  const [showQuizRefreshModal, setShowQuizRefreshModal] = useState(false);
  const legendListRef = useRef<LegendListRef | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const isNearBottomRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [waitingForStream, setWaitingForStream] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [hasMoreOlderMessages, setHasMoreOlderMessages] = useState(
    initialMessages.length >= MESSAGE_PAGE_LIMIT,
  );
  const { scrollMessageToEnd } = useKeyboardScrollToEnd({
    listRef: legendListRef,
  });

  const [selectedAttachments, setSelectedAttachments] = useState<
    {
      uri: string;
      kind: "image" | "document";
      name?: string;
      mimeType?: string;
    }[]
  >([]);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );

  const messageContentRef = useRef<Map<string, string>>(new Map());
  const streamingAssistantIdRef = useRef<string | null>(null);
  const showScrollButtonRef = useRef(false);
  const lastOlderCursorRef = useRef<string | null>(null);
  const streamCleanupRef = useRef<null | (() => void)>(null);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const userHasAgent = useAgentStore((s) => s.userHasAgent);
  const agentName = useAgentStore((s) => s.agent?.name);
  const fetchUserAgent = useAgentStore((s) => s.fetchUserAgent);

  useEffect(() => {
    if (userId) {
      fetchUserAgent(userId);
    }
  }, [userId, fetchUserAgent]);

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
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const sidebarWidth = windowWidth * 0.8;
  const topPadding = getScreenTopPadding(insets);
  const rowTranslateX = useSharedValue(-sidebarWidth);

  useEffect(() => {
    sidebarWidthSV.value = sidebarWidth;
    rowTranslateX.value = Math.max(
      -sidebarWidth,
      Math.min(0, rowTranslateX.value),
    );
  }, [sidebarWidth, rowTranslateX, sidebarWidthSV]);

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

  useEffect(
    () => () => {
      if (scrollRafRef.current != null) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
      streamCleanupRef.current?.();
      streamCleanupRef.current = null;
    },
    [],
  );

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const len = messages?.length ?? 0;
    if (len <= 2 && showScrollButtonRef.current) {
      showScrollButtonRef.current = false;
      setShowScrollButton(false);
    }
  }, [messages?.length]);

  useEffect(() => {
    if (initialMessages && Array.isArray(initialMessages)) {
      safeSetMessages((currentMessages) =>
        areMessageArraysEqual(currentMessages, initialMessages)
          ? currentMessages
          : initialMessages,
      );
    }
  }, [initialMessages, safeSetMessages]);

  useEffect(() => {
    setIsLoadingOlderMessages(false);
    setHasMoreOlderMessages(initialMessages.length >= MESSAGE_PAGE_LIMIT);
    lastOlderCursorRef.current = null;
  }, [chatId, initialMessages.length]);

  const fetchSuggestions = useCallback(async () => {
    if (!userId) return;

    try {
      setLoadingSuggestions(true);
      const fetchedSuggestions = await chatAiService.generateSuggestions({
        userId,
      });
      setSuggestions(fetchedSuggestions || []);
    } catch (error) {
      setSuggestions([
        "Teach me about DeFi",
        "Learn about RWAs",
        "Blockchain basics",
      ]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId && messages.length === 0) {
      fetchSuggestions();
    }
  }, [userId, fetchSuggestions, messages.length]);

  const flushScrollToBottom = useCallback(() => {
    isNearBottomRef.current = true;
    if (scrollRafRef.current != null) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    }
    scrollMessageToEnd({ animated: true, closeKeyboard: true });
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      void legendListRef.current?.scrollToEnd({ animated: false });
    });
  }, [scrollMessageToEnd]);

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
      isNearBottomRef.current = isCloseToBottom;
      const len = messagesRef.current?.length ?? 0;
      const nextShow = !isCloseToBottom && len > 2;
      if (nextShow !== showScrollButtonRef.current) {
        showScrollButtonRef.current = nextShow;
        setShowScrollButton(nextShow);
      }
    },
    [],
  );

  const handleLoadOlderMessages = useCallback(async () => {
    if (isLoadingOlderMessages || !hasMoreOlderMessages) return;

    const currentMessages = messagesRef.current || [];
    if (!currentMessages.length) {
      setHasMoreOlderMessages(false);
      return;
    }

    const oldestLoadedMessage = currentMessages[0];
    if (!oldestLoadedMessage?.id) {
      return;
    }

    if (lastOlderCursorRef.current === oldestLoadedMessage.id) {
      return;
    }

    lastOlderCursorRef.current = oldestLoadedMessage.id;
    setIsLoadingOlderMessages(true);

    try {
      const olderMessages = await fetchOlderMessages(
        chatId,
        oldestLoadedMessage.id,
        MESSAGE_PAGE_LIMIT,
      );

      const nextMessages = useChatStore.getState().messagesByChatId[chatId];
      if (nextMessages && nextMessages.length > 0) {
        safeSetMessages(nextMessages);
      }

      setHasMoreOlderMessages(olderMessages.length >= MESSAGE_PAGE_LIMIT);
    } catch {
      lastOlderCursorRef.current = null;
    } finally {
      setIsLoadingOlderMessages(false);
    }
  }, [
    chatId,
    fetchOlderMessages,
    hasMoreOlderMessages,
    isLoadingOlderMessages,
    safeSetMessages,
  ]);

  const handleSendMessage = useCallback(
    async (messageText?: string) => {
      const textToSend = messageText || inputText.trim();
      if (textToSend === "" || isGenerating || isNavigating) return;

      requestAnimationFrame(() => {
        scrollMessageToEnd({ animated: true, closeKeyboard: true });
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const currentCredits = Number(user?.credits) || 0;

      if (currentCredits <= 0.5) {
        router.push({
          pathname: "/freeTrialIntro",
          params: { source: "chat_limit" },
        });
        return;
      }

      updateUserCredits(currentCredits - 0.5);

      const attachmentsDraft = selectedAttachments;
      setInputText("");
      setSelectedAttachments([]);

      const inferMimeTypeFromUri = (
        uri: string,
        kind: "image" | "document",
      ) => {
        const ext = uri
          .split("?")[0]
          ?.split("#")[0]
          ?.split(".")
          .pop()
          ?.toLowerCase();
        if (kind === "image") {
          if (ext === "png") return "image/png";
          if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
          if (ext === "webp") return "image/webp";
          if (ext === "heic") return "image/heic";
          return "image/jpeg";
        }
        if (ext === "pdf") return "application/pdf";
        if (ext === "txt") return "text/plain";
        if (ext === "md") return "text/markdown";
        if (ext === "json") return "application/json";
        if (ext === "docx")
          return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        return "application/octet-stream";
      };

      let attachmentsPayload: {
        data: string;
        mimeType: string;
        name?: string;
        kind?: "image" | "document";
        localUri?: string;
      }[] = [];

      if (attachmentsDraft.length > 0) {
        try {
          attachmentsPayload = await Promise.all(
            attachmentsDraft.map(async (att) => {
              const data = await FileSystem.readAsStringAsync(att.uri, {
                // Some Expo runtimes/types don't expose EncodingType; string literal is supported.
                encoding: "base64" as any,
              });
              return {
                data,
                mimeType:
                  att.mimeType || inferMimeTypeFromUri(att.uri, att.kind),
                name: att.name,
                kind: att.kind,
                localUri: att.uri,
              };
            }),
          );
        } catch (e) {
          Alert.alert(
            "Attachment error",
            "Couldn't attach that file. Try again with a smaller file.",
          );
        }
      }

      const newMessage: Message = {
        id: generateUUID(),
        role: "user",
        content:
          attachmentsPayload.length > 0
            ? { text: textToSend, attachments: attachmentsPayload }
            : textToSend,
        createdAt: new Date(),
        chatId: chatId,
      };

      const updatedMessages = [...(messagesRef.current || []), newMessage];

      const messagesForApi = updatedMessages.map((m) => {
        if (
          m &&
          typeof m.content === "object" &&
          m.content &&
          "attachments" in (m.content as any) &&
          Array.isArray((m.content as any).attachments)
        ) {
          const c: any = m.content;
          return {
            ...m,
            content: {
              ...c,
              attachments: c.attachments.map((a: any) => {
                const { localUri, ...rest } = a || {};
                return rest;
              }),
            },
          };
        }
        return m;
      });
      safeSetMessages(updatedMessages);
      addMessage(chatId, newMessage);
      setIsGenerating(true);
      setWaitingForStream(true);
      streamCleanupRef.current?.();
      streamCleanupRef.current = null;

      const assistantMessageId = generateUUID();
      let messageCreated = false;

      try {
        const cleanup = await chatAiService.generateMessagesStream(
          {
            messages: messagesForApi,
            chatId: chatId,
            userId: userId as unknown as string,
          },
          (token: string, _type?: string) => {
            if (!messageCreated) {
              setWaitingForStream(false);
              setStreamingMessageId(assistantMessageId);
              streamingAssistantIdRef.current = assistantMessageId;
              messageContentRef.current.set(assistantMessageId, "");
              const assistantMessage: Message = {
                id: assistantMessageId,
                role: "assistant",
                content: "",
                createdAt: new Date(),
                chatId: chatId,
              };
              addMessage(chatId, assistantMessage);
              safeSetMessages((currentMessages) => {
                const messagesCopy = [...currentMessages];
                messagesCopy.push(assistantMessage);
                return messagesCopy;
              });
              messageCreated = true;
            }

            const currentContent =
              messageContentRef.current.get(assistantMessageId) || "";
            const newContent = currentContent + token;
            messageContentRef.current.set(assistantMessageId, newContent);
            safeSetMessages((currentMessages) => {
              const messagesCopy = [...currentMessages];
              const messageIndex = messagesCopy.findIndex(
                (msg) => msg && msg.id === assistantMessageId,
              );
              if (messageIndex === -1) return currentMessages;
              const message = messagesCopy[messageIndex];
              messagesCopy[messageIndex] = {
                ...message,
                content: newContent,
              };
              return messagesCopy;
            });
          },
          (_fullMessage: Message) => {
            messageContentRef.current.delete(assistantMessageId);
            streamingAssistantIdRef.current = null;
            streamCleanupRef.current = null;
            setIsGenerating(false);
            setStreamingMessageId(null);
            queueMicrotask(() => {
              syncMessagesToStore(chatId, messagesRef.current);
              refreshChatList();
            });
          },
          (error: Error) => {
            setInputText(textToSend);

            messageContentRef.current.delete(assistantMessageId);
            streamingAssistantIdRef.current = null;
            streamCleanupRef.current = null;

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

        streamCleanupRef.current = cleanup ?? null;
      } catch (error: any) {
        setInputText(textToSend);
        setIsGenerating(false);
        setWaitingForStream(false);
        setStreamingMessageId(null);

        messageContentRef.current.delete(assistantMessageId);
        streamingAssistantIdRef.current = null;
        streamCleanupRef.current = null;

        if (messageCreated) {
          safeSetMessages((currentMessages) =>
            currentMessages.filter((msg) => msg.id !== assistantMessageId),
          );
        }

        Alert.alert(
          "Error",
          error.message || "Failed to start streaming. Please try again.",
        );
        requestAnimationFrame(() => {
          scrollMessageToEnd({ animated: true, closeKeyboard: true });
        });
      }
    },
    [
      addMessage,
      chatId,
      inputText,
      isGenerating,
      isNavigating,
      refreshChatList,
      router,
      safeSetMessages,
      selectedAttachments,
      syncMessagesToStore,
      updateUserCredits,
      user?.credits,
      userId,
    ],
  );

  const dismissKeyboardJs = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const closeDrawer = useCallback(() => {
    rowTranslateX.value = withTiming(-sidebarWidth, {
      duration: DRAWER_TIMING_MS,
      easing: EASE_OUT_RN_EASE,
    });
  }, [rowTranslateX, sidebarWidth]);

  const openDrawer = useCallback(() => {
    Keyboard.dismiss();
    rowTranslateX.value = withTiming(0, {
      duration: DRAWER_TIMING_MS,
      easing: EASE_OUT_RN_EASE,
    });
  }, [rowTranslateX]);

  const focusMainPane = closeDrawer;

  const rowPanGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-18, 18])
        .failOffsetY([-14, 14])
        .onStart(() => {
          dragStartOffset.value = rowTranslateX.value;
        })
        .onUpdate((e) => {
          const w = sidebarWidthSV.value;
          const next = dragStartOffset.value + e.translationX;
          rowTranslateX.value = Math.max(-w, Math.min(0, next));
        })
        .onEnd((e) => {
          const w = sidebarWidthSV.value;
          const x = rowTranslateX.value;
          const v = e.velocityX;
          let target = x > -w / 2 ? 0 : -w;
          if (v > 520) target = 0;
          if (v < -520) target = -w;
          rowTranslateX.value = withTiming(target, {
            duration: DRAWER_TIMING_MS,
            easing: EASE_OUT_RN_EASE,
          });
          if (target === 0) {
            runOnJS(dismissKeyboardJs)();
          }
        }),
    [dismissKeyboardJs, dragStartOffset, rowTranslateX, sidebarWidthSV],
  );

  const rowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rowTranslateX.value }],
  }));

  const handleCreateNewChat = useCallback(() => {
    focusMainPane();
    createNewChat();
  }, [createNewChat, focusMainPane]);

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
      });
    }
  }, [
    inputContainerOpacity,
    micButtonRotation,
    micButtonScale,
    recorderState.isRecording,
    recordingContainerScale,
    recordingOpacity,
    waveAnimations,
  ]);

  const startRecording = useCallback(async () => {
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
      Alert.alert("Error", "Failed to start recording");

      micButtonScale.value = withTiming(1, { duration: 150 });
      micButtonRotation.value = withTiming(0, { duration: 150 });
    }
  }, [audioRecorder, micButtonRotation, micButtonScale]);

  const stopRecording = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await audioRecorder.stop();
      if (audioRecorder.uri) {
        try {
          setIsTranscribing(true);
          const response = await chatAiService.transcribeAudio({
            audioUri: audioRecorder.uri,
          });

          setInputText(response.transcription);
        } catch (transcriptionError) {
          Alert.alert(
            "Error",
            "Failed to process your audio message. Please try again.",
          );
        } finally {
          setIsTranscribing(false);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to stop recording");
    }
  }, [audioRecorder]);

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

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <MessageItem
        message={item}
        isStreaming={item.id === streamingMessageId}
        theme={theme}
      />
    ),
    [streamingMessageId, theme],
  );

  const listFooter = useMemo(
    () => (waitingForStream ? <ChatTypingIndicator /> : null),
    [waitingForStream],
  );

  const listHeader = useMemo(
    () =>
      isLoadingOlderMessages ? (
        <View style={styles.loadingOlderMessagesContainer}>
          <Text
            style={[
              styles.loadingOlderMessagesText,
              theme === "dark" && { color: "#A7B1C2" },
            ]}
          >
            Loading older messages...
          </Text>
        </View>
      ) : null,
    [isLoadingOlderMessages, theme],
  );

  const listExtraData = useMemo(
    () => ({ streamingMessageId, theme }),
    [streamingMessageId, theme],
  );

  const anchoredEndSpace = useMemo(
    () =>
      filteredMessages.length > 0
        ? { anchorIndex: filteredMessages.length - 1, anchorOffset: 16 }
        : undefined,
    [filteredMessages.length],
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
      router.push({
        pathname: "/freeTrialIntro",
        params: { source: "chat_limit" },
      });
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
      focusMainPane();
      createNewChat();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to delete chat. Please try again.");
    }
  }, [chatId, deleteChat, refreshChatList, createNewChat, focusMainPane]);

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
          {
            paddingTop: topPadding,
          },
          theme === "dark" && { backgroundColor: "#131313" },
        ]}
      >
        <View style={styles.stackRoot}>
          <GestureDetector gesture={rowPanGesture}>
            <Animated.View
              style={[
                styles.sideBySideRow,
                { width: sidebarWidth + windowWidth },
                rowAnimatedStyle,
              ]}
            >
              <View
                style={[
                  styles.sidebarColumn,
                  { width: sidebarWidth },
                  theme === "dark" && { backgroundColor: "#131313" },
                ]}
              >
                <ChatSidebarPanel onAfterNavigate={focusMainPane} />
              </View>
              <View
                style={[
                  styles.mainColumn,
                  { width: windowWidth },
                  theme === "dark" && { backgroundColor: "#131313" },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <TouchableWithoutFeedback onPress={dismissKeyboard}>
                    <View>
                      <ChatHeaderBar
                        title={
                          title && title !== DEFAULT_HEADER_TITLE
                            ? title
                            : userHasAgent
                              ? agentName || DEFAULT_HEADER_TITLE
                              : DEFAULT_HEADER_TITLE
                        }
                        theme={theme}
                        isEmpty={!messages || messages.length === 0}
                        onOpenDrawer={openDrawer}
                        onNewChat={handleCreateNewChat}
                        onQuiz={handleHeaderQuiz}
                        onRequestDelete={handleConfirmDeleteChat}
                      />
                    </View>
                  </TouchableWithoutFeedback>

                  <QuizRefreshModal
                    visible={showQuizRefreshModal}
                    onClose={() => setShowQuizRefreshModal(false)}
                    onSuccess={() => {
                      setShowQuizRefreshModal(false);
                      useUserStore.getState().setUserAsync();
                    }}
                  />

                  <KeyboardGestureArea
                    interpolator="ios"
                    offset={60}
                    style={styles.chatContent}
                  >
                    {!messages || messages.length === 0 ? (
                      <TouchableWithoutFeedback onPress={dismissKeyboard}>
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
                      </TouchableWithoutFeedback>
                    ) : (
                      <View style={styles.messagesContainer}>
                        <KeyboardChatLegendList
                          ref={legendListRef}
                          data={filteredMessages}
                          alignItemsAtEnd
                          anchoredEndSpace={anchoredEndSpace}
                          estimatedItemSize={140}
                          extraData={listExtraData}
                          initialScrollAtEnd
                          keyboardShouldPersistTaps="handled"
                          maintainScrollAtEnd={KEYBOARD_MAINTAIN_SCROLL_AT_END}
                          maintainScrollAtEndThreshold={0.16}
                          maintainVisibleContentPosition
                          keyExtractor={keyExtractor}
                          renderItem={renderMessage}
                          ListHeaderComponent={listHeader}
                          ListFooterComponent={listFooter}
                          onStartReached={handleLoadOlderMessages}
                          onStartReachedThreshold={0.1}
                          onScroll={handleScroll}
                          onScrollBeginDrag={dismissKeyboard}
                          scrollEventThrottle={16}
                          showsVerticalScrollIndicator={false}
                          style={styles.messagesScroll}
                          contentContainerStyle={styles.messagesScrollContent}
                          keyboardDismissMode="interactive"
                          keyboardLiftBehavior="whenAtEnd"
                          applyWorkaroundForContentInsetHitTestBug
                        />

                        {showScrollButton && (
                          <TouchableOpacity
                            style={styles.scrollToBottomButton}
                            onPress={flushScrollToBottom}
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
                  </KeyboardGestureArea>

                  <KeyboardStickyView
                    offset={{ closed: 0, opened: insets.bottom }}
                  >
                    <View>
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
                              contentContainerStyle={
                                styles.suggestionsScrollContent
                              }
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
                                  onPress={() =>
                                    handleSuggestionPress(suggestion)
                                  }
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
                          { paddingBottom: Math.max(insets.bottom, 8) },
                          theme === "dark" && {
                            borderTopColor: "#2E3033",
                            backgroundColor: "#131313",
                          },
                        ]}
                      >
                        {recorderState.isRecording ? (
                          <ChatRecordingRow
                            waveAnimations={waveAnimations}
                            theme={theme}
                            recordingOpacity={recordingOpacity}
                            recordingContainerScale={recordingContainerScale}
                            onStop={stopRecording}
                          />
                        ) : (
                          <ChatTextInputRow
                            theme={theme}
                            inputText={inputText}
                            setInputText={setInputText}
                            isTranscribing={isTranscribing}
                            isGenerating={isGenerating}
                            isNavigating={isNavigating}
                            handleSendMessage={handleSendMessage}
                            selectedAttachments={selectedAttachments}
                            setSelectedAttachments={setSelectedAttachments}
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
            </Animated.View>
          </GestureDetector>
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
  },
  stackRoot: {
    flex: 1,
    overflow: "hidden",
  },
  sideBySideRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
  },
  sidebarColumn: {
    backgroundColor: "#FFFFFF",
  },
  mainColumn: {
    backgroundColor: "#F9FBFC",
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
    paddingVertical: Design.spacing.md,
    borderRadius: 12,
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
    fontSize: Design.typography.fontSize.xs,
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
  scrollDismissHitTarget: {
    flex: 1,
    minHeight: 0,
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
  loadingOlderMessagesContainer: {
    alignItems: "center",
    paddingBottom: 8,
  },
  loadingOlderMessagesText: {
    fontFamily: "Satoshi-Regular",
    fontSize: 12,
    color: "#6B7C93",
  },
  inputContainer: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 3,
    borderTopWidth: 1,
    borderTopColor: "#EDF3FC",
    backgroundColor: "#FFFFFF",
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
