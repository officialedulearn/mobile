import { RoomComposer } from "@/components/Hub/RoomComposer";
import { RoomHeader } from "@/components/Hub/RoomHeader";
import { RoomMessageActionsSheet } from "@/components/Hub/RoomMessageActionsSheet";
import { RoomMessagesList } from "@/components/Hub/RoomMessagesList";
import { styles } from "@/components/Hub/room.styles";
import useCommunityStore from "@/core/communityState";
import useUserStore from "@/core/userState";
import type {
  Community,
  CommunityMember,
  NewMessageEvent,
  ReactionEvent,
  RoomMessage,
  RoomMessageWithUI,
} from "@/interface/Community";
import { CommunityService } from "@/services/community.service";
import {
  filterMembersForMention,
  getActiveMentionRange,
  parseMentions,
} from "@/utils/hub/mentions";
import {
  formatMessageDate,
  formatMessageTime,
} from "@/utils/hub/roomFormatting";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import type { LegendListRef } from "@legendapp/list";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSharedValue } from "react-native-reanimated";

const communityService = new CommunityService();

const Room = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useUserStore((state) => state.theme);
  const user = useUserStore((state) => state.user);
  const [message, setMessage] = useState("");
  const [community, setCommunity] = useState<Community | null>(null);
  const [messages, setMessages] = useState<RoomMessageWithUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMod, setIsMod] = useState(false);
  const [moderatorId, setModeratorId] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [messageOffset, setMessageOffset] = useState(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [communityMembersRows, setCommunityMembersRows] = useState<
    CommunityMember[]
  >([]);
  const [inputSelection, setInputSelection] = useState({ start: 0, end: 0 });
  const textInputRef = useRef<TextInput>(null);
  const legendListRef = useRef<LegendListRef | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingOpacity = useRef(new Animated.Value(0)).current;
  const [footerHeight, setFooterHeight] = useState(0);
  const composerHeight = useSharedValue(0);

  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  const cursorPos = inputSelection.end;
  const activeMention = useMemo(
    () => getActiveMentionRange(message, cursorPos),
    [message, cursorPos],
  );
  const mentionSuggestions = useMemo(
    () =>
      activeMention
        ? filterMembersForMention(communityMembersRows, activeMention.query)
        : [],
    [activeMention, communityMembersRows],
  );

  const messageActionSheetRef = useRef<BottomSheetModal>(null);
  const [selectedMessage, setSelectedMessage] =
    useState<RoomMessageWithUI | null>(null);
  const snapPoints = useMemo(() => ["50%"], []);

  const mergeCommunity = useCommunityStore((s) => s.mergeCommunity);
  const setRoomMessagesCache = useCommunityStore((s) => s.setRoomMessagesCache);
  const [refreshing, setRefreshing] = useState(false);

  const processMessage = useCallback(
    (
      msg: RoomMessage & {
        reactionCounts?: { [key: string]: number };
        isMod?: boolean;
      },
    ): RoomMessageWithUI => {
      const timestamp = new Date(msg.createdAt);
      const reactions: { [key: string]: number } = {};
      if (msg.reactionCounts) {
        Object.entries(msg.reactionCounts).forEach(([emoji, count]) => {
          reactions[emoji] = count;
        });
      }

      return {
        ...msg,
        date: formatMessageDate(timestamp),
        time: formatMessageTime(timestamp),
        isCurrentUser: msg.user.id === user?.id,
        reactions: reactions,
        userAvatar: msg.user.profilePictureURL || undefined,
        userName: `@${msg.user.username}`,
        isMod: msg.isMod || false,
        message: msg.content,
      };
    },
    [user?.id],
  );

  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      setTimeout(() => {
        void legendListRef.current?.scrollToEnd({ animated: false });
      }, 150);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  useEffect(() => {
    const communityId = Array.isArray(id) ? id[0] : id;
    if (!communityId) return;
    let cancelled = false;
    communityService
      .getCommunityMembers(communityId)
      .then((rows) => {
        if (!cancelled) setCommunityMembersRows(rows);
      })
      .catch(() => {
        if (!cancelled) setCommunityMembersRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const communityId = Array.isArray(id) ? id[0] : id;
    if (!communityId || !user?.id) return;

    const setupWebSocket = async () => {
      if (!user?.id || !communityId) return;

      try {
        await communityService.connectWebSocket();
        communityService.joinRoom(communityId, user.id, (response) => {
          if (response?.error && __DEV__) {
            /* noop */
          }
        });

        communityService.onRoomJoined((data) => {
          if (data.onlineCount !== undefined) {
            setOnlineCount(data.onlineCount);
          }
        });

        communityService.onRoomUserJoined((data) => {
          if (data.onlineCount !== undefined) {
            setOnlineCount(data.onlineCount);
          } else {
            setOnlineCount((prev) => prev + 1);
          }
        });

        communityService.onRoomUserLeft((data) => {
          if (data.onlineCount !== undefined) {
            setOnlineCount(data.onlineCount);
          } else {
            setOnlineCount((prev) => Math.max(1, prev - 1));
          }
        });

        communityService.onNewMessage(async (event: NewMessageEvent) => {
          if (event.user.id === user?.id) {
            return;
          }

          try {
            const reactions = await communityService.getMessageReactions(
              event.id,
            );
            const reactionCounts: { [key: string]: number } = {};
            reactions.forEach((r) => {
              reactionCounts[r.reaction] =
                (reactionCounts[r.reaction] || 0) + 1;
            });
            const newMessage = processMessage({ ...event, reactionCounts });
            setMessages((prev) => {
              if (prev.some((msg) => msg.id === newMessage.id)) {
                return prev;
              }
              return [newMessage, ...prev];
            });
          } catch {
            const newMessage = processMessage({ ...event });
            setMessages((prev) => {
              if (prev.some((msg) => msg.id === newMessage.id)) {
                return prev;
              }
              return [newMessage, ...prev];
            });
          }
        });

        communityService.onUserTyping((event) => {
          if (event.userId !== user?.id) {
            setTypingUsers((prev) => {
              if (!prev.includes(event.username)) {
                const newUsers = [...prev, event.username];
                if (newUsers.length === 1) {
                  Animated.timing(typingOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                  }).start();
                }
                return newUsers;
              }
              return prev;
            });
          }
        });

        communityService.onUserStoppedTyping((event) => {
          setTypingUsers((prev) => {
            const newUsers = prev.filter((u) => u !== event.username);
            if (newUsers.length === 0) {
              Animated.timing(typingOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start();
            }
            return newUsers;
          });
        });

        communityService.onReactionAdded((event: ReactionEvent) => {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === event.messageId) {
                const reactions: { [key: string]: number } = {};
                event.reactionCounts.forEach((rc) => {
                  reactions[rc.reaction] = rc.count;
                });
                return {
                  ...msg,
                  reactions,
                };
              }
              return msg;
            }),
          );
        });

        communityService.onReactionRemoved((event) => {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === event.messageId) {
                const reactions: { [key: string]: number } = {};
                event.reactionCounts.forEach((rc) => {
                  reactions[rc.reaction] = rc.count;
                });
                return {
                  ...msg,
                  reactions,
                };
              }
              return msg;
            }),
          );
        });
      } catch {
        /* websocket setup */
      }
    };

    setupWebSocket();

    return () => {
      const communityId = Array.isArray(id) ? id[0] : id;
      if (communityId) {
        try {
          communityService.leaveRoom(communityId);
        } catch {
          /* best-effort leave */
        }
      }
      communityService.disconnectWebSocket();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [id, moderatorId, processMessage, typingOpacity, user?.id]);

  const loadCommunityData = useCallback(
    async (opts?: { isRefresh?: boolean }) => {
      const communityId = Array.isArray(id) ? id[0] : id;
      if (!communityId || !user?.id) return;

      const isRefresh = opts?.isRefresh === true;
      try {
        if (!isRefresh) setIsLoading(true);
        const [communityData, messagesData] = await Promise.all([
          communityService.getCommunityById(communityId),
          communityService.getRoomMessages(communityId, 20, 0, user.id),
        ]);

        setCommunity(communityData);
        mergeCommunity(communityData);

        let modUserId: string | null = null;
        try {
          const modData = await communityService.getCommunityMod(communityId);
          if (modData) {
            modUserId = modData.user.id;
            setModeratorId(modData.user.id);
            setIsMod(modData.user.id === user.id);
          } else {
            setModeratorId(null);
            setIsMod(false);
          }
        } catch {
          setModeratorId(null);
          setIsMod(false);
        }

        const messagesWithReactions = await Promise.all(
          messagesData.map(async (msg) => {
            try {
              const reactions = await communityService.getMessageReactions(
                msg.id,
              );
              const reactionCounts: { [key: string]: number } = {};
              reactions.forEach((r) => {
                reactionCounts[r.reaction] =
                  (reactionCounts[r.reaction] || 0) + 1;
              });
              return {
                ...msg,
                reactionCounts,
                isMod: modUserId === msg.user.id,
              };
            } catch {
              return {
                ...msg,
                reactionCounts: {},
                isMod: modUserId === msg.user.id,
              };
            }
          }),
        );

        const processedMessages = messagesWithReactions.map(processMessage);
        setMessages(processedMessages);
        setHasMoreMessages(messagesData.length === 20);
        setMessageOffset(20);
      } catch {
        /* load error */
      } finally {
        if (!isRefresh) setIsLoading(false);
      }
    },
    [id, user?.id, mergeCommunity, processMessage],
  );

  const loadMoreMessages = useCallback(async () => {
    const communityId = Array.isArray(id) ? id[0] : id;
    if (!communityId || !user?.id || !hasMoreMessages || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const messagesData = await communityService.getRoomMessages(
        communityId,
        20,
        messageOffset,
        user.id,
      );

      const messagesWithReactions = await Promise.all(
        messagesData.map(async (msg) => {
          try {
            const reactions = await communityService.getMessageReactions(
              msg.id,
            );
            const reactionCounts: { [key: string]: number } = {};
            reactions.forEach((r) => {
              reactionCounts[r.reaction] =
                (reactionCounts[r.reaction] || 0) + 1;
            });
            return {
              ...msg,
              reactionCounts,
              isMod: moderatorId === msg.user.id,
            };
          } catch {
            return {
              ...msg,
              reactionCounts: {},
              isMod: moderatorId === msg.user.id,
            };
          }
        }),
      );

      const processedMessages = messagesWithReactions.map(processMessage);
      setMessages((prev) => [...prev, ...processedMessages]);
      setHasMoreMessages(messagesData.length === 20);
      setMessageOffset((prev) => prev + 20);
    } catch {
      /* load more error */
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    id,
    user?.id,
    hasMoreMessages,
    isLoadingMore,
    messageOffset,
    moderatorId,
    processMessage,
  ]);

  useEffect(() => {
    const communityId = Array.isArray(id) ? id[0] : id;
    if (!communityId || !user?.id) return;
    const cached =
      useCommunityStore.getState().roomMessagesByCommunityId[communityId];
    if (cached) {
      setMessages(cached.messages);
      setHasMoreMessages(cached.hasMore);
      setMessageOffset(cached.messageOffset);
      setModeratorId(cached.moderatorId);
      setIsMod(cached.isMod);
      const c = useCommunityStore.getState().communityById[communityId];
      if (c) {
        setCommunity(c);
      } else {
        communityService.getCommunityById(communityId).then((data) => {
          if (data) {
            setCommunity(data);
            mergeCommunity(data);
          }
        });
      }
      setIsLoading(false);
      return;
    }
    setMessages([]);
    setCommunity(null);
    setHasMoreMessages(true);
    setMessageOffset(0);
    void loadCommunityData();
  }, [id, user?.id, loadCommunityData, mergeCommunity]);

  useEffect(() => {
    const communityId = Array.isArray(id) ? id[0] : id;
    if (!communityId || isLoading) return;
    setRoomMessagesCache(communityId, {
      messages,
      hasMore: hasMoreMessages,
      messageOffset,
      moderatorId,
      isMod,
    });
  }, [
    messages,
    hasMoreMessages,
    messageOffset,
    moderatorId,
    isMod,
    isLoading,
    id,
    setRoomMessagesCache,
  ]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadCommunityData({ isRefresh: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadCommunityData]);

  const handleSendMessage = async () => {
    const communityId = Array.isArray(id) ? id[0] : id;
    if (!message.trim() || !communityId || !user?.id) return;

    const messageContent = message.trim();
    const tempId = `temp-${Date.now()}`;

    setMessage("");

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    communityService.stopTyping(communityId);

    const optimisticMessage: RoomMessageWithUI = {
      id: tempId,
      content: messageContent,
      createdAt: new Date().toISOString(),
      user: {
        id: user.id,
        username: user.username,
        name: user.name || user.username,
        profilePictureURL: user.profilePictureURL || null,
      },
      date: formatMessageDate(new Date()),
      time: formatMessageTime(new Date()),
      isCurrentUser: true,
      reactions: {},
      userAvatar: user.profilePictureURL || undefined,
      userName: `@${user.username}`,
      isMod: isMod,
      message: messageContent,
    };

    setMessages((prev) => [optimisticMessage, ...prev]);
    setTimeout(() => {
      void legendListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      if (!communityService.isConnected()) {
        await communityService.connectWebSocket();
        communityService.joinRoom(communityId, user.id);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      const mentionedUsernames = parseMentions(messageContent);
      let mentionedUserIds: string[] = [];

      if (mentionedUsernames.length > 0) {
        try {
          const resolvedMentions =
            await communityService.resolveMentions(mentionedUsernames);
          mentionedUserIds = resolvedMentions.map((m) => m.userId);
        } catch {
          /* mention resolve */
        }
      }

      let callbackReceived = false;

      setTimeout(() => {
        if (!callbackReceived && __DEV__) {
          console.warn(
            "⏱️ Message callback timeout - keeping optimistic message",
          );
        }
      }, 5000);

      communityService.sendMessage(
        communityId,
        messageContent,
        mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
        user.id,
        async (response) => {
          callbackReceived = true;

          if (response?.error) {
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
            setMessage(messageContent);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          } else if (response?.message) {
            try {
              const reactions = await communityService.getMessageReactions(
                response.message.id,
              );
              const reactionCounts: { [key: string]: number } = {};
              reactions.forEach((r) => {
                reactionCounts[r.reaction] =
                  (reactionCounts[r.reaction] || 0) + 1;
              });
              const realMessage = processMessage({
                ...response.message,
                reactionCounts,
              });

              setMessages((prev) =>
                prev.map((m) => (m.id === tempId ? realMessage : m)),
              );
            } catch {
              const realMessage = processMessage(response.message);
              setMessages((prev) =>
                prev.map((m) => (m.id === tempId ? realMessage : m)),
              );
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } else if (__DEV__) {
            console.warn(
              "⚠️ Callback received but no message or error in response:",
              response,
            );
          }
        },
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setMessage(messageContent);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const applyMention = useCallback(
    (member: CommunityMember) => {
      const cursor = inputSelection.end;
      const range = getActiveMentionRange(message, cursor);
      if (!range) return;
      const before = message.slice(0, range.start);
      const after = message.slice(cursor);
      const insert = `@${member.user.username} `;
      const next = before + insert + after;
      setMessage(next);
      const pos = before.length + insert.length;
      requestAnimationFrame(() => {
        textInputRef.current?.setNativeProps({
          selection: { start: pos, end: pos },
        });
        setInputSelection({ start: pos, end: pos });
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [message, inputSelection.end],
  );

  const handleTyping = (text: string) => {
    setMessage(text);

    const communityId = Array.isArray(id) ? id[0] : id;
    if (!communityId) return;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (text.length > 0) {
      communityService.startTyping(communityId);

      typingTimeoutRef.current = setTimeout(() => {
        communityService.stopTyping(communityId);
      }, 3000) as unknown as NodeJS.Timeout;
    } else {
      communityService.stopTyping(communityId);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!selectedMessage || !user?.id) return;
    const communityId = Array.isArray(id) ? id[0] : id;
    if (!communityId) return;

    try {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === selectedMessage.id) {
            const currentCount = msg.reactions[emoji] || 0;
            return {
              ...msg,
              reactions: {
                ...msg.reactions,
                [emoji]: currentCount + 1,
              },
            };
          }
          return msg;
        }),
      );

      await communityService.addReaction(
        selectedMessage.id,
        emoji,
        user.id,
        communityId,
      );

      handleCloseMessageActions();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === selectedMessage.id) {
            const currentCount = msg.reactions[emoji] || 0;
            return {
              ...msg,
              reactions: {
                ...msg.reactions,
                [emoji]: Math.max(0, currentCount - 1),
              },
            };
          }
          return msg;
        }),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleMessageLongPress = (msg: RoomMessageWithUI) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMessage(msg);
    messageActionSheetRef.current?.present();
  };

  const handleCloseMessageActions = () => {
    messageActionSheetRef.current?.dismiss();
    setSelectedMessage(null);
  };

  const handleDeleteSelectedMessage = useCallback(async () => {
    if (!selectedMessage || !user?.id) return;
    try {
      await communityService.deleteMessage(selectedMessage.id, user.id);
      setMessages((prev) => prev.filter((m) => m.id !== selectedMessage.id));
      handleCloseMessageActions();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [selectedMessage, user?.id]);

  const communityIdStr = Array.isArray(id) ? id[0] : (id ?? "");
  const themeMode = theme === "dark" ? "dark" : "light";

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          themeMode === "dark" && styles.darkContainer,
        ]}
      >
        <ActivityIndicator
          size="large"
          color={themeMode === "dark" ? "#00FF80" : "#000"}
        />
        <Text
          style={[styles.loadingText, themeMode === "dark" && styles.darkText]}
        >
          Loading community...
        </Text>
      </View>
    );
  }

  if (!community) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          themeMode === "dark" && styles.darkContainer,
        ]}
      >
        <Text
          style={[styles.errorText, themeMode === "dark" && styles.darkText]}
        >
          Community not found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, themeMode === "dark" && styles.darkContainer]}
    >
      <RoomHeader
        community={community}
        communityId={communityIdStr}
        onlineCount={onlineCount}
        theme={themeMode}
      />

      <View style={{ flex: 1 }}>
        <RoomMessagesList
          listRef={legendListRef}
          reversedMessages={reversedMessages}
          theme={themeMode}
          isLoadingMore={isLoadingMore}
          refreshing={refreshing}
          onRefresh={onRefresh}
          footerHeight={footerHeight}
          composerHeight={composerHeight}
          onLoadOlder={loadMoreMessages}
          onLongPress={handleMessageLongPress}
        />
      </View>

      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
        <RoomComposer
          theme={themeMode}
          message={message}
          onChangeText={handleTyping}
          onSend={handleSendMessage}
          textInputRef={textInputRef}
          onSelectionChange={(sel) => setInputSelection(sel)}
          typingUsers={typingUsers}
          typingOpacity={typingOpacity}
          activeMentionSuggestions={
            activeMention !== null ? mentionSuggestions : []
          }
          onFooterLayout={setFooterHeight}
          composerHeight={composerHeight}
          onApplyMention={applyMention}
        />
      </KeyboardStickyView>

      <RoomMessageActionsSheet
        sheetRef={messageActionSheetRef}
        snapPoints={snapPoints}
        theme={themeMode}
        selectedMessage={selectedMessage}
        isMod={isMod}
        onClose={handleCloseMessageActions}
        onReaction={handleReaction}
        onDeleteMessage={handleDeleteSelectedMessage}
      />
    </View>
  );
};

export default Room;
