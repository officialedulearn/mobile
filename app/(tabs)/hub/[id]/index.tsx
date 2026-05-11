import { RoomComposer } from "@/components/Hub/RoomComposer";
import { RoomHeader } from "@/components/Hub/RoomHeader";
import { RoomMessageActionsSheet } from "@/components/Hub/RoomMessageActionsSheet";
import { RoomMessagesList } from "@/components/Hub/RoomMessagesList";
import { styles } from "@/components/Hub/room.styles";
import useCommunityStore from "@/core/communityState";
import useMobileStore from "@/core/mobileStore";
import useUserStore from "@/core/userState";
import type {
  CommunityMember,
  RoomMessage,
  RoomMessageWithUI,
} from "@/interface/Community";
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

const Room = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const communityId = Array.isArray(id) ? id[0] : (id ?? "");
  const theme = useUserStore((state) => state.theme);
  const user = useUserStore((state) => state.user);

  const community = useCommunityStore((state) =>
    communityId ? state.communityById[communityId] : undefined,
  );
  const roomEntry = useCommunityStore((state) =>
    communityId ? state.roomMessagesByCommunityId[communityId] : undefined,
  );
  const realtime = useCommunityStore((state) =>
    communityId ? state.roomRealtimeByCommunityId[communityId] : undefined,
  );
  const communityMembersRows = useCommunityStore((state) =>
    communityId ? (state.communityMembersByCommunityId[communityId] ?? []) : [],
  );
  const isInitialLoading = useCommunityStore((state) =>
    communityId
      ? (state.roomMessagesInitialLoadingByCommunityId[communityId] ?? false)
      : false,
  );
  const isLoadingMore = useCommunityStore((state) =>
    communityId
      ? (state.roomMessagesMoreLoadingByCommunityId[communityId] ?? false)
      : false,
  );

  const hydrateCommunityRoomFeed = useCommunityStore(
    (state) => state.hydrateCommunityRoomFeed,
  );
  const fetchCommunityMembersForRoom = useCommunityStore(
    (state) => state.fetchCommunityMembersForRoom,
  );
  const fetchMoreRoomMessages = useCommunityStore(
    (state) => state.fetchMoreRoomMessages,
  );
  const setRoomMessagesCache = useCommunityStore(
    (state) => state.setRoomMessagesCache,
  );
  const resolveCommunityMentions = useCommunityStore(
    (state) => state.resolveCommunityMentions,
  );
  const createCommunityRoomMessageRest = useCommunityStore(
    (state) => state.createCommunityRoomMessageRest,
  );
  const deleteCommunityRoomMessageRest = useCommunityStore(
    (state) => state.deleteCommunityRoomMessageRest,
  );
  const addCommunityRoomReactionRest = useCommunityStore(
    (state) => state.addCommunityRoomReactionRest,
  );
  const communityRoomStartTyping = useCommunityStore(
    (state) => state.communityRoomStartTyping,
  );
  const communityRoomStopTyping = useCommunityStore(
    (state) => state.communityRoomStopTyping,
  );
  const subscribeCommunityRoom = useMobileStore(
    (state) => state.subscribeCommunityRoom,
  );
  const unsubscribeCommunityRoom = useMobileStore(
    (state) => state.unsubscribeCommunityRoom,
  );

  const [message, setMessage] = useState("");
  const [loadAttempted, setLoadAttempted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [inputSelection, setInputSelection] = useState({ start: 0, end: 0 });
  const [footerHeight, setFooterHeight] = useState(0);
  const textInputRef = useRef<TextInput>(null);
  const legendListRef = useRef<LegendListRef | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingOpacity = useRef(new Animated.Value(0)).current;
  const composerHeight = useSharedValue(0);

  const emptyMessages = useMemo<RoomMessageWithUI[]>(() => [], []);
  const messages = roomEntry?.messages ?? emptyMessages;
  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);
  const onlineCount = realtime?.onlineCount ?? 1;
  const typingUsers = realtime?.typingUsernames ?? [];
  const isMod = roomEntry?.isMod ?? false;
  const hasMoreMessages = roomEntry?.hasMore ?? true;
  const messageActionSheetRef = useRef<BottomSheetModal>(null);
  const [selectedMessage, setSelectedMessage] =
    useState<RoomMessageWithUI | null>(null);
  const snapPoints = useMemo(() => ["50%"], []);

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

  const processMessage = useCallback(
    (
      msg: RoomMessage & {
        reactionCounts?: { [key: string]: number };
        isMod?: boolean;
      },
    ): RoomMessageWithUI => {
      const timestamp = new Date(msg.createdAt);
      return {
        ...msg,
        date: formatMessageDate(timestamp),
        time: formatMessageTime(timestamp),
        isCurrentUser: msg.user.id === user?.id,
        reactions: msg.reactionCounts ? { ...msg.reactionCounts } : {},
        userAvatar: msg.user.profilePictureURL || undefined,
        userName: `@${msg.user.username}`,
        isMod: msg.isMod || false,
        message: msg.content,
      };
    },
    [user?.id],
  );

  const updateRoomMessages = useCallback(
    (
      updater: (
        entry: NonNullable<typeof roomEntry>,
      ) => NonNullable<typeof roomEntry>,
    ) => {
      if (!communityId) return;
      const entry =
        useCommunityStore.getState().roomMessagesByCommunityId[communityId];
      if (!entry) return;
      setRoomMessagesCache(communityId, updater(entry));
    },
    [communityId, setRoomMessagesCache],
  );

  useEffect(() => {
    if (!communityId || !user?.id) return;
    let cancelled = false;
    setLoadAttempted(false);

    Promise.all([
      hydrateCommunityRoomFeed(communityId, user.id, { messagesLimit: 20 }),
      fetchCommunityMembersForRoom(communityId).catch(() => []),
    ]).finally(() => {
      if (!cancelled) setLoadAttempted(true);
    });

    return () => {
      cancelled = true;
    };
  }, [
    communityId,
    user?.id,
    hydrateCommunityRoomFeed,
    fetchCommunityMembersForRoom,
  ]);

  useEffect(() => {
    if (!communityId || !user?.id) return;
    subscribeCommunityRoom(communityId, user.id).catch(() => {});

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      communityRoomStopTyping(communityId).catch(() => {});
      unsubscribeCommunityRoom(communityId);
    };
  }, [
    communityId,
    user?.id,
    subscribeCommunityRoom,
    unsubscribeCommunityRoom,
    communityRoomStopTyping,
  ]);

  useEffect(() => {
    Animated.timing(typingOpacity, {
      toValue: typingUsers.length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [typingOpacity, typingUsers.length]);

  useEffect(() => {
    if (!isInitialLoading && messages.length > 0) {
      setTimeout(() => {
        void legendListRef.current?.scrollToEnd({ animated: false });
      }, 150);
    }
  }, [isInitialLoading, messages.length]);

  const onRefresh = useCallback(async () => {
    if (!communityId || !user?.id) return;
    setRefreshing(true);
    try {
      await hydrateCommunityRoomFeed(communityId, user.id, {
        messagesLimit: 20,
      });
      await fetchCommunityMembersForRoom(communityId).catch(() => []);
    } finally {
      setRefreshing(false);
      setLoadAttempted(true);
    }
  }, [
    communityId,
    user?.id,
    hydrateCommunityRoomFeed,
    fetchCommunityMembersForRoom,
  ]);

  const loadMoreMessages = useCallback(async () => {
    if (!communityId || !user?.id || !hasMoreMessages || isLoadingMore) return;
    await fetchMoreRoomMessages(communityId, user.id, { limit: 20 });
  }, [
    communityId,
    user?.id,
    hasMoreMessages,
    isLoadingMore,
    fetchMoreRoomMessages,
  ]);

  const handleSendMessage = async () => {
    if (!message.trim() || !communityId || !user?.id || !roomEntry) return;

    const messageContent = message.trim();
    const tempId = `temp-${Date.now()}`;
    setMessage("");

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    communityRoomStopTyping(communityId).catch(() => {});

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
      isMod,
      message: messageContent,
    };

    updateRoomMessages((entry) => ({
      ...entry,
      messages: [optimisticMessage, ...entry.messages],
    }));

    setTimeout(() => {
      void legendListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const mentionedUsernames = parseMentions(messageContent);
      let mentionedUserIds: string[] = [];

      if (mentionedUsernames.length > 0) {
        const resolvedMentions =
          await resolveCommunityMentions(mentionedUsernames);
        mentionedUserIds = resolvedMentions.map((m) => m.userId);
      }

      const savedMessage = await createCommunityRoomMessageRest(
        communityId,
        messageContent,
        mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
        user.id,
      );

      const realMessage = processMessage({
        ...savedMessage,
        reactionCounts: {},
        isMod,
      });

      updateRoomMessages((entry) => ({
        ...entry,
        messages: entry.messages.map((m) =>
          m.id === tempId ? realMessage : m,
        ),
      }));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      updateRoomMessages((entry) => ({
        ...entry,
        messages: entry.messages.filter((m) => m.id !== tempId),
      }));
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
    if (!communityId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (text.length > 0) {
      communityRoomStartTyping(communityId).catch(() => {});
      typingTimeoutRef.current = setTimeout(() => {
        communityRoomStopTyping(communityId).catch(() => {});
      }, 3000) as unknown as NodeJS.Timeout;
    } else {
      communityRoomStopTyping(communityId).catch(() => {});
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!selectedMessage || !user?.id || !communityId) return;

    try {
      updateRoomMessages((entry) => ({
        ...entry,
        messages: entry.messages.map((msg) =>
          msg.id === selectedMessage.id
            ? {
                ...msg,
                reactions: {
                  ...msg.reactions,
                  [emoji]: (msg.reactions[emoji] || 0) + 1,
                },
              }
            : msg,
        ),
      }));

      await addCommunityRoomReactionRest(
        selectedMessage.id,
        emoji,
        user.id,
        communityId,
      );

      handleCloseMessageActions();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      updateRoomMessages((entry) => ({
        ...entry,
        messages: entry.messages.map((msg) =>
          msg.id === selectedMessage.id
            ? {
                ...msg,
                reactions: {
                  ...msg.reactions,
                  [emoji]: Math.max(0, (msg.reactions[emoji] || 0) - 1),
                },
              }
            : msg,
        ),
      }));
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
      await deleteCommunityRoomMessageRest(selectedMessage.id, user.id);
      updateRoomMessages((entry) => ({
        ...entry,
        messages: entry.messages.filter((m) => m.id !== selectedMessage.id),
      }));
      handleCloseMessageActions();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [
    selectedMessage,
    user?.id,
    deleteCommunityRoomMessageRest,
    updateRoomMessages,
  ]);

  const themeMode = theme === "dark" ? "dark" : "light";
  const isLoading =
    isInitialLoading || (!loadAttempted && (!community || !roomEntry));

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
        communityId={communityId}
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
