import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
  Animated,
  LayoutChangeEvent,
  RefreshControl,
  ScrollView,
  type StyleProp,
  type TextStyle,
} from "react-native";
import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import {
  KeyboardChatScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSharedValue } from "react-native-reanimated";
import BackButton from "@/components/common/backButton";
import useUserStore from "@/core/userState";
import useCommunityStore from "@/core/communityState";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Entypo from "@expo/vector-icons/Entypo";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import AnimatedPressable from "@/components/common/AnimatedPressable";
import { router, useLocalSearchParams } from "expo-router";
import { CommunityService } from "@/services/community.service";
import type {
  Community,
  CommunityMember,
  RoomMessage,
  NewMessageEvent,
  ReactionEvent,
  RoomMessageWithUI,
} from "@/interface/Community";

const communityService = new CommunityService();

const parseMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const matches = text.match(mentionRegex);
  if (!matches) return [];

  return matches.map((match) => match.substring(1));
};

const getActiveMentionRange = (
  text: string,
  cursor: number,
): { start: number; query: string } | null => {
  const safeCursor = Math.min(Math.max(0, cursor), text.length);
  const before = text.slice(0, safeCursor);
  const at = before.lastIndexOf("@");
  if (at === -1) return null;
  if (at > 0 && !/\s/.test(before[at - 1] ?? "")) return null;
  const afterAt = before.slice(at + 1);
  if (/\s/.test(afterAt)) return null;
  if (afterAt.length > 48) return null;
  return { start: at, query: afterAt };
};

const filterMembersForMention = (
  members: CommunityMember[],
  query: string,
): CommunityMember[] => {
  const q = query.toLowerCase();
  const scored = members
    .map((m) => {
      const u = m.user.username.toLowerCase();
      const n = m.user.name.toLowerCase();
      let score = 100;
      if (!q) {
        score = 0;
      } else if (u.startsWith(q) || n.startsWith(q)) {
        score = 0;
      } else if (u.includes(q) || n.includes(q)) {
        score = 1;
      } else {
        score = -1;
      }
      return { m, score };
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return a.m.user.username.localeCompare(b.m.user.username);
    });
  return scored.slice(0, 20).map((x) => x.m);
};

function MessageBodyWithMentions({
  content,
  baseStyle,
  mentionStyle,
}: {
  content: string;
  baseStyle: StyleProp<TextStyle>;
  mentionStyle: StyleProp<TextStyle>;
}) {
  const text = content || "";
  const re = /@(\w+)/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(text.slice(last, m.index));
    }
    nodes.push(
      <Text key={`m-${m.index}`} style={[baseStyle, mentionStyle]}>
        @{m[1]}
      </Text>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    nodes.push(text.slice(last));
  }
  if (nodes.length === 0) {
    return <Text style={baseStyle}>{text}</Text>;
  }
  return <Text style={baseStyle}>{nodes}</Text>;
}

const formatDateHeader = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = dateString.split("T")[0];
  const todayStr = today.toISOString().split("T")[0];
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (dateOnly === todayStr) {
    return "Today";
  } else if (dateOnly === yesterdayStr) {
    return "Yesterday";
  } else {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  }
};

const formatMessageTime = (timestamp: Date | string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatMessageDate = (timestamp: Date | string) => {
  const date = new Date(timestamp);
  return date.toISOString().split("T")[0];
};

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
  const [communityMembers, setCommunityMembers] = useState<CommunityMember[]>(
    [],
  );
  const [inputSelection, setInputSelection] = useState({ start: 0, end: 0 });
  const textInputRef = useRef<TextInput>(null);
  const flashListRef = useRef<FlashListRef<RoomMessageWithUI>>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingOpacity = useRef(new Animated.Value(0)).current;
  const isNearBottom = useRef(true);
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
        ? filterMembersForMention(communityMembers, activeMention.query)
        : [],
    [activeMention, communityMembers],
  );

  const messageActionSheetRef = useRef<BottomSheetModal>(null);
  const [selectedMessage, setSelectedMessage] = useState<RoomMessageWithUI | null>(
    null,
  );
  const snapPoints = useMemo(() => ["50%"], []);

  const mergeCommunity = useCommunityStore((s) => s.mergeCommunity);
  const setRoomMessagesCache = useCommunityStore((s) => s.setRoomMessagesCache);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      setTimeout(
        () => flashListRef.current?.scrollToEnd({ animated: false }),
        150,
      );
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
        if (!cancelled) setCommunityMembers(rows);
      })
      .catch(() => {
        if (!cancelled) setCommunityMembers([]);
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
          if (response?.error) {
            console.error("Error joining room:", response.error);
          } else {
            console.log("✅ Successfully joined room:", communityId);
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

        communityService.onUserStatus((data) => {
          if (data.status === "online" || data.status === "offline") {
            console.log("User status changed:", data.userId, data.status);
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
          } catch (error) {
            console.error("Error processing new message:", error);
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
      } catch (error) {
        console.error("WebSocket setup error:", error);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    };
  }, [id, user?.id, moderatorId]);

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
        } catch (error) {
          console.error("Error fetching mod info:", error);
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
              return { ...msg, reactionCounts, isMod: modUserId === msg.user.id };
            } catch (error) {
              console.error(
                `Error fetching reactions for message ${msg.id}:`,
                error,
              );
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
      } catch (error) {
        console.error("Error loading community data:", error);
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
          } catch (error) {
            console.error(
              `Error fetching reactions for message ${msg.id}:`,
              error,
            );
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
    } catch (error) {
      console.error("Error loading more messages:", error);
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
    setTimeout(
      () => flashListRef.current?.scrollToEnd({ animated: true }),
      100,
    );
    console.log("📤 Sending message:", {
      tempId,
      content: messageContent,
      communityId,
    });

    try {
      if (!communityService.isConnected()) {
        console.log("🔄 WebSocket not connected, reconnecting...");
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
        } catch (error) {
          console.error("Error resolving mentions:", error);
        }
      }

      console.log("🚀 Emitting send_message event");

      let callbackReceived = false;

      setTimeout(() => {
        if (!callbackReceived) {
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
          console.log("📨 Message callback received:", response);

          if (response?.error) {
            console.error("Error sending message:", response.error);

            setMessages((prev) => prev.filter((m) => m.id !== tempId));
            setMessage(messageContent);

            const errorMessage =
              response.error === "Database connection error. Please try again."
                ? "Connection issue. Please try again."
                : response.error || "Failed to send message";

            console.error("Error details:", errorMessage);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          } else if (response?.message) {
            console.log("✅ Message sent successfully, replacing temp message");
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
            } catch (error) {
              console.error("Error processing sent message:", error);
              const realMessage = processMessage(response.message);
              setMessages((prev) =>
                prev.map((m) => (m.id === tempId ? realMessage : m)),
              );
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } else {
            console.warn(
              "⚠️ Callback received but no message or error in response:",
              response,
            );
          }
        },
      );
    } catch (error) {
      console.error("Error sending message:", error);
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
    } catch (error) {
      console.error("Error adding reaction:", error);
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

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );
  const handleMessageLongPress = (msg: RoomMessageWithUI) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMessage(msg);
    messageActionSheetRef.current?.present();
  };

  const handleCloseMessageActions = () => {
    messageActionSheetRef.current?.dismiss();
    setSelectedMessage(null);
  };

  const renderScrollComponent = useCallback(
    (props: any) => (
      <KeyboardChatScrollView
        {...props}
        extraContentPadding={composerHeight}
        keyboardLiftBehavior="always"
        offset={footerHeight}
      />
    ),
    [composerHeight, footerHeight],
  );

  const handleListScroll = useCallback(
    (event: any) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      isNearBottom.current =
        contentOffset.y + layoutMeasurement.height >= contentSize.height - 100;
      if (contentOffset.y < 200 && hasMoreMessages && !isLoadingMore) {
        loadMoreMessages();
      }
    },
    [hasMoreMessages, isLoadingMore, loadMoreMessages],
  );

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          theme === "dark" && styles.darkContainer,
        ]}
      >
        <ActivityIndicator
          size="large"
          color={theme === "dark" ? "#00FF80" : "#000"}
        />
        <Text style={[styles.loadingText, theme === "dark" && styles.darkText]}>
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
          theme === "dark" && styles.darkContainer,
        ]}
      >
        <Text style={[styles.errorText, theme === "dark" && styles.darkText]}>
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
    <View style={[styles.container, theme === "dark" && styles.darkContainer]}>
      <View style={[styles.topNav, theme === "dark" && styles.darkTopNav]}>
        <BackButton />
        <View style={styles.centerSection}>
          <Image
            source={{
              uri:
                community.imageUrl ||
                "https://s2.coinmarketcap.com/static/img/coins/200x200/5426.png",
            }}
            style={styles.communityImage}
          />
          <View>
            <Text style={[styles.title, theme === "dark" && styles.darkTitle]}>
              {community.title}
            </Text>
            <Text
              style={[
                styles.onlineStatus,
                theme === "dark" && styles.darkOnlineStatus,
              ]}
            >
              {onlineCount === 1 ? "Just you here" : `🟢 ${onlineCount} online`}
            </Text>
          </View>
        </View>

        <AnimatedPressable
          style={[styles.infoButton, theme === "dark" && styles.darkInfoButton]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({
              pathname: "/roomInfo/[id]",
              params: { id: Array.isArray(id) ? id[0] : id },
            });
          }}
          scale={0.9}
          hapticFeedback={true}
        >
          <Image
            source={
              theme === "dark"
                ? require("@/assets/images/icons/dark/information-circle.png")
                : require("@/assets/images/icons/information-circle.png")
            }
            style={styles.infoIcon}
          />
        </AnimatedPressable>
      </View>

      <FlashList
        ref={flashListRef}
        data={reversedMessages}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.messagesContent}
        renderScrollComponent={renderScrollComponent}
        onScroll={handleListScroll}
        scrollEventThrottle={16}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme === "dark" ? "#00FF80" : "#000"}
          />
        }
        ListHeaderComponent={
          isLoadingMore ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator
                size="small"
                color={theme === "dark" ? "#00FF80" : "#000"}
              />
            </View>
          ) : null
        }
        renderItem={({ item: msg, index }) => {
          const prevMsg = reversedMessages[index - 1];
          const showDateDivider = !prevMsg || msg.date !== prevMsg.date;

          return (
            <View>
              {showDateDivider && (
                <View style={styles.dateDivider}>
                  <View
                    style={[
                      styles.dateDividerLine,
                      theme === "dark" && styles.darkDateDividerLine,
                    ]}
                  />
                  <Text
                    style={[
                      styles.dateDividerText,
                      theme === "dark" && styles.darkDateDividerText,
                    ]}
                  >
                    {formatDateHeader(msg.date)}
                  </Text>
                  <View
                    style={[
                      styles.dateDividerLine,
                      theme === "dark" && styles.darkDateDividerLine,
                    ]}
                  />
                </View>
              )}

              <View style={styles.messageWrapper}>
                {msg.isCurrentUser ? (
                  <>
                    <View style={styles.currentUserMessageContainer}>
                      <AnimatedPressable
                        style={[
                          styles.currentUserMessage,
                          theme === "dark" && styles.darkCurrentUserMessage,
                          msg.id.startsWith("temp-") && styles.tempMessage,
                        ]}
                        onLongPress={() => handleMessageLongPress(msg)}
                        scale={0.98}
                        hapticFeedback={true}
                        hapticStyle="medium"
                      >
                        <MessageBodyWithMentions
                          content={msg.message || msg.content}
                          baseStyle={styles.currentUserMessageText}
                          mentionStyle={styles.currentUserMentionText}
                        />
                      </AnimatedPressable>
                    </View>

                    {Object.keys(msg.reactions).length > 0 && (
                      <View style={styles.currentUserReactionsContainer}>
                        <View style={styles.currentUserReactions}>
                          {Object.entries(msg.reactions).map(
                            ([emoji, count]) => (
                              <View
                                key={emoji}
                                style={[
                                  styles.reactionBadge,
                                  theme === "dark" && styles.darkReactionBadge,
                                ]}
                              >
                                <Text style={styles.reactionEmoji}>
                                  {emoji}
                                </Text>
                                <Text
                                  style={[
                                    styles.reactionCount,
                                    theme === "dark" &&
                                      styles.darkReactionCount,
                                  ]}
                                >
                                  {String(count)}
                                </Text>
                              </View>
                            ),
                          )}
                        </View>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    <View style={styles.otherUserMessageContainer}>
                      <Image
                        source={{
                          uri:
                            msg.userAvatar ||
                            msg.user.profilePictureURL ||
                            "https://i.pravatar.cc/150",
                        }}
                        style={styles.userAvatar}
                      />
                      <AnimatedPressable
                        style={[
                          styles.otherUserMessage,
                          theme === "dark" && styles.darkOtherUserMessage,
                        ]}
                        onLongPress={() => handleMessageLongPress(msg)}
                        scale={0.98}
                        hapticFeedback={true}
                        hapticStyle="medium"
                      >
                        <View style={styles.messageHeader}>
                          <View style={styles.userNameRow}>
                            <Text
                              style={[
                                styles.userName,
                                theme === "dark" && styles.darkUserName,
                              ]}
                            >
                              {msg.userName || `@${msg.user.username}`}
                            </Text>
                            {msg.isMod && (
                              <View
                                style={[
                                  styles.modBadge,
                                  theme === "dark" && styles.darkModBadge,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.modBadgeText,
                                    theme === "dark" && styles.darkModBadgeText,
                                  ]}
                                >
                                  MOD
                                </Text>
                              </View>
                            )}
                            <Text style={styles.timestamp}> • {msg.time}</Text>
                          </View>
                        </View>
                        <MessageBodyWithMentions
                          content={msg.message || msg.content}
                          baseStyle={[
                            styles.messageText,
                            theme === "dark" && styles.darkMessageText,
                          ]}
                          mentionStyle={[
                            styles.messageMentionText,
                            theme === "dark" && styles.darkMessageMentionText,
                          ]}
                        />
                      </AnimatedPressable>
                    </View>
                    {Object.keys(msg.reactions).length > 0 && (
                      <View style={styles.otherUserReactionsContainer}>
                        <View style={styles.reactions}>
                          {Object.entries(msg.reactions).map(
                            ([emoji, count]) => (
                              <View
                                key={emoji}
                                style={[
                                  styles.reactionBadge,
                                  theme === "dark" && styles.darkReactionBadge,
                                ]}
                              >
                                <Text style={styles.reactionEmoji}>
                                  {emoji}
                                </Text>
                                <Text
                                  style={[
                                    styles.reactionCount,
                                    theme === "dark" &&
                                      styles.darkReactionCount,
                                  ]}
                                >
                                  {String(count)}
                                </Text>
                              </View>
                            ),
                          )}
                        </View>
                      </View>
                    )}
                  </>
                )}
              </View>
            </View>
          );
        }}
      />

      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
        <View
          onLayout={(e: LayoutChangeEvent) => {
            setFooterHeight(e.nativeEvent.layout.height);
          }}
        >
          {typingUsers.length > 0 && (
            <Animated.View
              style={[
                styles.typingIndicatorContainer,
                theme === "dark" && styles.darkTypingIndicatorContainer,
                { opacity: typingOpacity },
              ]}
            >
              <Text
                style={[
                  styles.typingIndicatorText,
                  theme === "dark" && styles.darkTypingIndicatorText,
                ]}
              >
                {typingUsers.length === 1
                  ? `${typingUsers[0]} is typing...`
                  : `${typingUsers.slice(0, 2).join(", ")}${typingUsers.length > 2 ? ` and ${typingUsers.length - 2} others` : ""} are typing...`}
              </Text>
            </Animated.View>
          )}

          {activeMention !== null && mentionSuggestions.length > 0 && (
            <View
              style={[
                styles.mentionSuggestionWrap,
                theme === "dark" && styles.darkMentionSuggestionWrap,
              ]}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                style={styles.mentionSuggestionScroll}
                showsVerticalScrollIndicator={false}
              >
                {mentionSuggestions.map((member) => (
                  <TouchableOpacity
                    key={member.user.id}
                    style={[
                      styles.mentionSuggestionRow,
                      theme === "dark" && styles.darkMentionSuggestionRow,
                    ]}
                    onPress={() => applyMention(member)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={
                        member.user.profilePictureURL
                          ? { uri: member.user.profilePictureURL }
                          : require("@/assets/images/memoji.png")
                      }
                      style={styles.mentionSuggestionAvatar}
                    />
                    <View style={styles.mentionSuggestionTextCol}>
                      <Text
                        style={[
                          styles.mentionSuggestionName,
                          theme === "dark" && styles.darkMentionSuggestionName,
                        ]}
                        numberOfLines={1}
                      >
                        {member.user.name}
                      </Text>
                      <Text
                        style={[
                          styles.mentionSuggestionUser,
                          theme === "dark" && styles.darkMentionSuggestionUser,
                        ]}
                        numberOfLines={1}
                      >
                        @{member.user.username}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View
            onLayout={(e: LayoutChangeEvent) => {
              composerHeight.value = e.nativeEvent.layout.height;
            }}
            style={[
              styles.inputContainer,
              theme === "dark" && styles.darkInputContainer,
            ]}
          >
            <TextInput
              ref={textInputRef}
              style={[styles.input, theme === "dark" && styles.darkInput]}
              placeholder="Type a message..."
              placeholderTextColor={theme === "dark" ? "#b3b3b3" : "#A0AEC0"}
              value={message}
              onChangeText={handleTyping}
              onSelectionChange={(e) =>
                setInputSelection(e.nativeEvent.selection)
              }
              multiline
            />
            <AnimatedPressable
              style={styles.sendButton}
              scale={0.85}
              hapticFeedback={true}
              hapticStyle="medium"
              onPress={handleSendMessage}
              disabled={!message.trim()}
            >
              <Image
                source={
                  theme === "dark"
                    ? require("@/assets/images/icons/dark/send-2.png")
                    : require("@/assets/images/icons/send-2.png")
                }
                style={styles.messageActionIcon}
              />
            </AnimatedPressable>
          </View>
        </View>
      </KeyboardStickyView>

      <BottomSheetModal
        ref={messageActionSheetRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={[
          styles.bottomSheetBackground,
          theme === "dark" && styles.darkBottomSheetBackground,
        ]}
        handleIndicatorStyle={[
          styles.bottomSheetIndicator,
          theme === "dark" && styles.darkBottomSheetIndicator,
        ]}
        enablePanDownToClose={true}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <AnimatedPressable
            style={styles.closeButton}
            onPress={handleCloseMessageActions}
            scale={0.85}
            hapticFeedback={true}
          >
            <FontAwesome5
              name="times"
              size={20}
              color={theme === "dark" ? "#b3b3b3" : "#61728C"}
            />
          </AnimatedPressable>

          <View style={styles.reactingToSection}>
            <View style={styles.reactingToHeader}>
              <Entypo
                name="emoji-happy"
                size={16}
                color={theme === "dark" ? "#b3b3b3" : "#61728C"}
              />
              <Text
                style={[
                  styles.reactingToText,
                  theme === "dark" && styles.darkReactingToText,
                ]}
              >
                Reacting to
              </Text>
            </View>
            <View
              style={[
                styles.reactingToMessageBox,
                theme === "dark" && styles.darkReactingToMessageBox,
              ]}
            >
              <Text
                style={[
                  styles.reactingToMessage,
                  theme === "dark" && styles.darkReactingToMessage,
                ]}
              >
                <Text
                  style={[
                    styles.mentionText,
                    theme === "dark" && styles.darkMentionText,
                  ]}
                >
                  {selectedMessage?.userName ||
                    `@${selectedMessage?.user.username}` ||
                    "@user"}
                </Text>{" "}
                <MessageBodyWithMentions
                  content={
                    selectedMessage?.message || selectedMessage?.content || ""
                  }
                  baseStyle={[
                    styles.reactingToMessage,
                    theme === "dark" && styles.darkReactingToMessage,
                  ]}
                  mentionStyle={[
                    styles.mentionText,
                    theme === "dark" && styles.darkMentionText,
                  ]}
                />
              </Text>
            </View>
          </View>
          <View style={styles.emojiReactionsRow}>
            <AnimatedPressable
              style={styles.emojiReactionButton}
              scale={0.85}
              hapticFeedback={true}
              onPress={() => handleReaction("💚")}
            >
              <Text style={styles.emojiReaction}>💚</Text>
            </AnimatedPressable>
            <AnimatedPressable
              style={styles.emojiReactionButton}
              scale={0.85}
              hapticFeedback={true}
              onPress={() => handleReaction("💪")}
            >
              <Text style={styles.emojiReaction}>💪</Text>
            </AnimatedPressable>
            <AnimatedPressable
              style={styles.emojiReactionButton}
              scale={0.85}
              hapticFeedback={true}
              onPress={() => handleReaction("👍")}
            >
              <Text style={styles.emojiReaction}>👍</Text>
            </AnimatedPressable>
            <AnimatedPressable
              style={styles.emojiReactionButton}
              scale={0.85}
              hapticFeedback={true}
              onPress={() => handleReaction("👎")}
            >
              <Text style={styles.emojiReaction}>👎</Text>
            </AnimatedPressable>
            <AnimatedPressable
              style={styles.emojiReactionButton}
              scale={0.85}
              hapticFeedback={true}
              onPress={() => handleReaction("💔")}
            >
              <Text style={styles.emojiReaction}>💔</Text>
            </AnimatedPressable>
            <AnimatedPressable
              style={styles.emojiReactionButton}
              scale={0.85}
              hapticFeedback={true}
              onPress={() => handleReaction("😊")}
            >
              <Text style={styles.emojiReaction}>😊</Text>
            </AnimatedPressable>
          </View>
          <View style={styles.actionButtonsContainer}>
            <AnimatedPressable
              style={styles.actionButton}
              scale={0.97}
              hapticFeedback={true}
            >
              <FontAwesome5
                name="copy"
                size={18}
                color={theme === "dark" ? "#b3b3b3" : "#4A5568"}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  theme === "dark" && styles.darkActionButtonText,
                ]}
              >
                Copy Text
              </Text>
            </AnimatedPressable>

            <AnimatedPressable
              style={styles.actionButton}
              scale={0.97}
              hapticFeedback={true}
            >
              <FontAwesome5
                name="user"
                size={18}
                color={theme === "dark" ? "#b3b3b3" : "#4A5568"}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  theme === "dark" && styles.darkActionButtonText,
                ]}
              >
                View Profile
              </Text>
            </AnimatedPressable>

            {isMod && (
              <AnimatedPressable
                style={[styles.actionButton, styles.actionButtonDanger]}
                scale={0.97}
                hapticFeedback={true}
                hapticStyle="medium"
              >
                <FontAwesome5 name="user-times" size={18} color="#FF3B30" />
                <Text
                  style={[
                    styles.actionButtonText,
                    styles.actionButtonTextDanger,
                  ]}
                >
                  Remove User
                </Text>
              </AnimatedPressable>
            )}

            {(isMod || selectedMessage?.isCurrentUser) && selectedMessage && (
              <AnimatedPressable
                style={[styles.actionButton, styles.actionButtonDanger]}
                scale={0.97}
                hapticFeedback={true}
                hapticStyle="medium"
                onPress={async () => {
                  if (!selectedMessage || !user?.id) return;
                  try {
                    await communityService.deleteMessage(
                      selectedMessage.id,
                      user.id,
                    );
                    setMessages((prev) =>
                      prev.filter((m) => m.id !== selectedMessage.id),
                    );
                    handleCloseMessageActions();
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success,
                    );
                  } catch (error) {
                    console.error("Error deleting message:", error);
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Error,
                    );
                  }
                }}
              >
                <FontAwesome5 name="trash" size={18} color="#FF3B30" />
                <Text
                  style={[
                    styles.actionButtonText,
                    styles.actionButtonTextDanger,
                  ]}
                >
                  Delete Message
                </Text>
              </AnimatedPressable>
            )}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
};

export default Room;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FBFC",
  },
  darkContainer: {
    backgroundColor: "#0d0d0d",
  },
  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EDF3FC",
  },
  darkTopNav: {
    backgroundColor: "#131313",
    borderBottomColor: "#2E3033",
  },
  messageActionIcon: {
    width: 24,
    height: 24,
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 12,
  },
  communityImage: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "500",
    fontFamily: "Satoshi",
    color: "#2D3C52",
  },
  darkTitle: {
    color: "#FFFFFF",
  },
  onlineStatus: {
    fontSize: 13,
    fontWeight: "400",
    color: "#61728C",
    fontFamily: "Satoshi",
    marginTop: 4,
  },
  darkOnlineStatus: {
    color: "#B3B3B3",
  },
  infoButton: {
    padding: 10,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
    backgroundColor: "#fff",
    borderWidth: 0.5,
    borderColor: "#EDF3FC",
  },
  darkInfoButton: {
    backgroundColor: "#131313",
    borderColor: "#2E3033",
  },
  infoIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#F9FBFC",
  },
  darkMessagesContainer: {
    backgroundColor: "#0d0d0d",
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  dateDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  dateDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  darkDateDividerLine: {
    backgroundColor: "#2e3033",
  },
  dateDividerText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#A0AEC0",
    fontFamily: "Satoshi",
  },
  darkDateDividerText: {
    color: "#b3b3b3",
  },
  messageWrapper: {
    marginBottom: 12,
  },
  otherUserMessageContainer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    width: "100%",
    marginBottom: 4,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    flexShrink: 0,
  },
  otherUserMessage: {
    maxWidth: "75%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    flexShrink: 1,
    flexGrow: 0,
  },
  darkOtherUserMessage: {
    backgroundColor: "#131313",
    borderWidth: 1,
    borderColor: "#2e3033",
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3C52",
    fontFamily: "Satoshi",
  },
  darkUserName: {
    color: "#e0e0e0",
  },
  timestamp: {
    fontSize: 11,
    fontWeight: "400",
    color: "#A0AEC0",
    fontFamily: "Satoshi",
  },
  messageText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#4A5568",
    fontFamily: "Satoshi",
    lineHeight: 20,
  },
  darkMessageText: {
    color: "#e0e0e0",
  },
  reactionsContainer: {
    marginTop: 6,
  },
  otherUserReactionsContainer: {
    paddingLeft: 44,
    marginTop: 6,
  },
  currentUserReactionsContainer: {
    paddingRight: 0,
    marginTop: 6,
    alignItems: "flex-end",
  },
  reactions: {
    flexDirection: "row",
    gap: 8,
  },
  reactionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 0.5,
    borderColor: "#EDF3FC",
  },
  darkReactionBadge: {
    backgroundColor: "#131313",
    borderColor: "#2e3033",
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: "500",
    color: "#4A5568",
    fontFamily: "Satoshi",
  },
  darkReactionCount: {
    color: "#b3b3b3",
  },
  messageActionButton: {
    padding: 4,
  },
  messageEmoji: {
    fontSize: 20,
  },
  // Current User Messages (Blue)
  currentUserMessageContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    width: "100%",
    marginBottom: 4,
  },
  currentUserMessage: {
    maxWidth: "75%",
    backgroundColor: "#131313",
    borderRadius: 12,
    padding: 12,
  },
  darkCurrentUserMessage: {
    backgroundColor: "#131313",
    borderWidth: 1,
    borderColor: "#2e3033",
  },
  tempMessage: {
    opacity: 0.7,
  },
  loadingMoreContainer: {
    paddingVertical: 16,
    alignItems: "center",
  },
  typingIndicatorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F7FAFC",
    borderTopWidth: 1,
    borderTopColor: "#EDF3FC",
  },
  darkTypingIndicatorContainer: {
    backgroundColor: "#131313",
    borderTopColor: "#2e3033",
  },
  typingIndicatorText: {
    fontSize: 13,
    fontFamily: "Satoshi",
    color: "#61728C",
    fontStyle: "italic",
  },
  darkTypingIndicatorText: {
    color: "#B3B3B3",
  },
  currentUserMessageHeader: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  currentUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  currentUserInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  currentUserName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00FF80",
    fontFamily: "Satoshi",
  },
  verifiedBadge: {
    width: 16,
    height: 16,
  },
  modBadge: {
    backgroundColor: "#000000",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 4,
  },
  darkModBadge: {
    backgroundColor: "#00FF80",
  },
  modBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#00FF80",
    fontFamily: "Satoshi",
  },
  darkModBadgeText: {
    color: "#000000",
  },
  currentUserTimestamp: {
    fontSize: 11,
    fontWeight: "400",
    color: "#A0AEC0",
    fontFamily: "Satoshi",
  },
  currentUserMessageText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#FFFFFF",
    fontFamily: "Satoshi",
    lineHeight: 20,
  },
  currentUserMentionText: {
    fontWeight: "700",
    color: "#FFFFFF",
  },
  messageMentionText: {
    fontWeight: "700",
  },
  darkMessageMentionText: {
    fontWeight: "700",
    color: "#00FF80",
  },
  mentionSuggestionWrap: {
    maxHeight: 200,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EDF3FC",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  darkMentionSuggestionWrap: {
    backgroundColor: "#1a1a1a",
    borderColor: "#2E3033",
  },
  mentionSuggestionScroll: {
    maxHeight: 200,
  },
  mentionSuggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EDF3FC",
  },
  darkMentionSuggestionRow: {
    borderBottomColor: "#2E3033",
  },
  mentionSuggestionAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  mentionSuggestionTextCol: {
    flex: 1,
    minWidth: 0,
  },
  mentionSuggestionName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3C52",
    fontFamily: "Satoshi",
  },
  darkMentionSuggestionName: {
    color: "#E0E0E0",
  },
  mentionSuggestionUser: {
    fontSize: 12,
    color: "#61728C",
    fontFamily: "Satoshi",
  },
  darkMentionSuggestionUser: {
    color: "#B3B3B3",
  },
  currentUserReactions: {
    flexDirection: "row",
    gap: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EDF3FC",
    gap: 12,
  },
  darkInputContainer: {
    backgroundColor: "#131313",
    borderTopColor: "#2E3033",
  },
  emojiButton: {
    width: 36,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FBFC",
    borderWidth: 0.6,
    borderColor: "#EDF3FC",
    padding: 5.5,
    gap: 100,
  },
  emojiButtonText: {
    fontSize: 24,
  },
  input: {
    flex: 1,
    backgroundColor: "#F7FAFC",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Satoshi",
    color: "#61728C",
    height: 48,
    maxHeight: 100,
  },
  darkInput: {
    backgroundColor: "#0d0d0d",
    color: "#e0e0e0",
    borderWidth: 0.688,
    borderColor: "#2e3033",
  },
  sendButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3C52",
  },
  darkText: {
    color: "#E0E0E0",
  },
  errorText: {
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "500",
    color: "#FF3B30",
    textAlign: "center",
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: "#000",
    borderRadius: 16,
    marginTop: 16,
  },
  backButtonText: {
    color: "#00FF80",
    fontFamily: "Satoshi",
    fontSize: 14,
    fontWeight: "600",
  },
  // Bottom Sheet Styles
  bottomSheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  darkBottomSheetBackground: {
    backgroundColor: "#131313",
  },
  bottomSheetIndicator: {
    backgroundColor: "#EDF3FC",
    width: 40,
    height: 4,
  },
  darkBottomSheetIndicator: {
    backgroundColor: "#2e3033",
  },
  bottomSheetContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 24,
    zIndex: 10,
    padding: 4,
  },
  reactingToSection: {
    marginBottom: 24,
  },
  reactingToHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  reactingToText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#61728C",
    fontFamily: "Satoshi",
  },
  darkReactingToText: {
    color: "#b3b3b3",
  },
  reactingToMessageBox: {
    backgroundColor: "#C8F4DD",
    borderRadius: 12,
    padding: 12,
  },
  darkReactingToMessageBox: {
    backgroundColor: "#131313",
    borderWidth: 1,
    borderColor: "#2e3033",
  },
  reactingToMessage: {
    fontSize: 13,
    fontWeight: "400",
    color: "#2D3C52",
    fontFamily: "Satoshi",
    lineHeight: 18,
  },
  darkReactingToMessage: {
    color: "#e0e0e0",
  },
  mentionText: {
    fontWeight: "600",
    color: "#2D3C52",
  },
  darkMentionText: {
    color: "#00FF80",
  },
  emojiReactionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  emojiReactionButton: {
    padding: 8,
  },
  emojiReaction: {
    fontSize: 32,
  },
  actionButtonsContainer: {
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#4A5568",
    fontFamily: "Satoshi",
  },
  darkActionButtonText: {
    color: "#b3b3b3",
  },
  actionButtonDanger: {},
  actionButtonTextDanger: {
    color: "#FF3B30",
  },
});
