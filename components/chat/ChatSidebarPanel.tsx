import Avatar from "@/components/common/Avatar";
import { useChatNavigation } from "@/contexts/ChatContext";
import useChatStore from "@/core/chatState";
import useUserStore from "@/core/userState";
import { Chat } from "@/interface/Chat";
import Design from "@/utils/design";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const groupChatsByRecency = (chats: Chat[]) => {
  const now = new Date();
  const oneDayAgo = new Date(now);
  oneDayAgo.setDate(now.getDate() - 1);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const recent = chats.filter((chat) => new Date(chat.createdAt) >= oneDayAgo);
  const lastWeek = chats.filter(
    (chat) =>
      new Date(chat.createdAt) < oneDayAgo &&
      new Date(chat.createdAt) >= sevenDaysAgo,
  );
  const lastMonth = chats.filter(
    (chat) =>
      new Date(chat.createdAt) < sevenDaysAgo &&
      new Date(chat.createdAt) >= thirtyDaysAgo,
  );
  const older = chats.filter((chat) => new Date(chat.createdAt) < thirtyDaysAgo);

  return { recent, lastWeek, lastMonth, older };
};

type Props = {
  onAfterNavigate: () => void;
};

type ChatListItemProps = {
  id: string;
  title: string | null | undefined;
  isDark: boolean;
  isNavigating: boolean;
  onPress: (id: string) => void;
};

const ChatListItem = React.memo(
  ({ id, title, isDark, isNavigating, onPress }: ChatListItemProps) => {
    const handlePress = React.useCallback(() => {
      onPress(id);
    }, [id, onPress]);

    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.chatItem,
          isDark && styles.chatItemDark,
          isNavigating && styles.disabledChatItem,
        ]}
        disabled={isNavigating}
        activeOpacity={0.7}
      >
        <View style={styles.chatInfo}>
          <Text
            style={[styles.chatTitle, isDark && styles.chatTitleDark]}
            numberOfLines={1}
          >
            {title || "Untitled Chat"}
          </Text>
        </View>
        {!isNavigating && (
          <Image
            source={
              isDark
                ? require("@/assets/images/icons/dark/CaretRight.png")
                : require("@/assets/images/icons/CaretRight.png")
            }
            style={[styles.arrowIcon, isDark && styles.arrowIconDark]}
          />
        )}
      </TouchableOpacity>
    );
  },
  (prev, next) =>
    prev.id === next.id &&
    prev.title === next.title &&
    prev.isDark === next.isDark &&
    prev.isNavigating === next.isNavigating &&
    prev.onPress === next.onPress,
);
ChatListItem.displayName = "ChatListItem";

const ChatSidebarPanel = React.memo(({ onAfterNavigate }: Props) => {
  const userId = useUserStore((s) => s.user?.id);
  const userName = useUserStore((s) => s.user?.name);
  const username = useUserStore((s) => s.user?.username);
  const profilePictureURL = useUserStore((s) => s.user?.profilePictureURL);
  const theme = useUserStore((s) => s.theme);
  const isDark = theme === "dark";
  const router = useRouter();
  const { isNavigating, navigateToChat, createNewChat } = useChatNavigation();
  const chats = useChatStore((s) => s.chatList);
  const isLoading = useChatStore((s) => s.isLoading);
  const fetchChatList = useChatStore((s) => s.fetchChatList);
  const [searchQuery, setSearchQuery] = React.useState("");

  const displayName = React.useMemo(() => {
    const n = userName?.trim();
    if (n) return n;
    const u = username?.trim();
    if (u) return u.startsWith("@") ? u : `@${u}`;
    return "Account";
  }, [userName, username]);

  const avatarInitials = React.useMemo(() => {
    const n = userName?.trim() || username?.trim() || "?";
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }, [userName, username]);

  const handleGoHome = React.useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    onAfterNavigate();
    router.navigate("/(tabs)");
  }, [onAfterNavigate, router]);

  const filteredChats = React.useMemo(() => {
    if (!searchQuery.trim()) return chats;

    return chats.filter(
      (chat) =>
        chat.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.title === null,
    );
  }, [chats, searchQuery]);

  const groupedChats = React.useMemo(() => {
    return groupChatsByRecency(filteredChats);
  }, [filteredChats]);

  React.useEffect(() => {
    if (userId) {
      fetchChatList(userId as unknown as string);
    }
  }, [userId, fetchChatList]);

  const goToChat = React.useCallback(
    (id: string) => {
      if (isNavigating) return;
      navigateToChat(id);
      onAfterNavigate();
    },
    [isNavigating, navigateToChat, onAfterNavigate],
  );

  const handleCreateNewChat = React.useCallback(() => {
    if (isNavigating) return;
    createNewChat();
    onAfterNavigate();
  }, [isNavigating, createNewChat, onAfterNavigate]);

  const renderChatSection = React.useCallback((title: string, sectionChats: Chat[]) => {
    if (sectionChats.length === 0) return null;

    return (
      <View style={styles.chatSection} key={title}>
        <Text
          style={[styles.sectionHeader, isDark && styles.textDark]}
        >
          {title}
        </Text>
        {sectionChats.map((chat) => (
          <ChatListItem
            key={chat.id}
            id={chat.id}
            title={chat.title}
            isDark={isDark}
            isNavigating={isNavigating}
            onPress={goToChat}
          />
        ))}
      </View>
    );
  }, [goToChat, isDark, isNavigating]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={isDark ? "#00FF80" : "#2D3C52"}
          />
          <Text
            style={[styles.loadingText, isDark && styles.textDark]}
          >
            Loading chats...
          </Text>
        </View>
      );
    }

    if (chats.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text
            style={[styles.emptyStateText, isDark && styles.textDark]}
          >
            No chat history yet
          </Text>
          <Text
            style={[
              styles.emptyStateSubtext,
              isDark && styles.subtextDark,
            ]}
          >
            Tap the pen above to start a chat.
          </Text>
        </View>
      );
    }

    if (filteredChats.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text
            style={[styles.emptyStateText, isDark && styles.textDark]}
          >
            No chats found
          </Text>
          <Text
            style={[
              styles.emptyStateSubtext,
              isDark && styles.subtextDark,
            ]}
          >
            Try adjusting your search terms
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.chatListContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.chatListContent}
      >
        {renderChatSection("Recent", groupedChats.recent)}
        {renderChatSection("Last 7 Days", groupedChats.lastWeek)}
        {renderChatSection("Last 30 Days", groupedChats.lastMonth)}
        {renderChatSection("Older", groupedChats.older)}
      </ScrollView>
    );
  };

  return (
    <View
      style={[styles.root, isDark && styles.rootDark]}
    >
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TextInput
          placeholder="Search chats..."
          placeholderTextColor={isDark ? "#B3B3B3" : "#61728C"}
          style={[
            styles.searchInput,
            isDark && styles.searchInputDark,
          ]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          editable={!isNavigating}
        />
        <TouchableOpacity
          style={[
            styles.button,
            isDark && styles.buttonDark,
            isNavigating && styles.disabledButton,
          ]}
          activeOpacity={0.8}
          onPress={handleCreateNewChat}
          disabled={isNavigating}
        >
          {isNavigating ? (
            <ActivityIndicator
              size="small"
              color={isDark ? "#E0E0E0" : "#2D3C52"}
            />
          ) : (
            <Image
              source={
                isDark
                  ? require("@/assets/images/icons/dark/pen.png")
                  : require("@/assets/images/icons/pen.png")
              }
              style={{ width: 20, height: 20 }}
            />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {renderContent()}
      </View>

      <View
        style={[
          styles.profileFooter,
          isDark && styles.profileFooterDark,
        ]}
      >
        <Avatar
          size="small"
          initials={avatarInitials}
          source={
            profilePictureURL
              ? { uri: profilePictureURL }
              : undefined
          }
        />
        <Text
          style={[
            styles.profileName,
            isDark && styles.textDark,
          ]}
          numberOfLines={1}
        >
          {displayName}
        </Text>
        <TouchableOpacity
          accessibilityLabel="Go to Home"
          accessibilityRole="button"
          onPress={handleGoHome}
          style={[
            styles.homeButton,
            isDark && styles.homeButtonDark,
          ]}
          activeOpacity={0.85}
        >
          <Image
            source={
              isDark
                ? require("@/assets/images/icons/dark/home.png")
                : require("@/assets/images/icons/home.png")
            }
            style={styles.homeIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});
ChatSidebarPanel.displayName = "ChatSidebarPanel";

export default ChatSidebarPanel;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
  },
  rootDark: {
    backgroundColor: "#131313",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Design.spacing.sm,
    paddingBottom: Design.spacing.md,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF3FC",
  },
  headerDark: {
    borderBottomColor: "#2E3033",
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  chatListContainer: {
    flex: 1,
  },
  chatListContent: {
    paddingBottom: Design.spacing.md,
  },
  chatSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontFamily: "Satoshi-Regular",
    fontSize: 14,
    fontWeight: "500",
    color: "#2D3C52",
    paddingHorizontal: 20,
    paddingVertical: 8,
    lineHeight: 24,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 2,
  },
  chatItemDark: {
    backgroundColor: "#0D0D0D",
  },
  disabledChatItem: {
    opacity: 0.6,
  },
  chatInfo: {
    flex: 1,
  },
  chatTitle: {
    fontFamily: "Satoshi-Regular",
    fontSize: 14,
    color: "#2D3C52",
    marginBottom: 4,
  },
  chatTitleDark: {
    color: "#B3B3B3",
  },
  arrowIcon: {
    width: 16,
    height: 16,
    tintColor: "#777777",
  },
  arrowIconDark: {
    tintColor: "#777777",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 16,
  },
  loadingText: {
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    color: "#2D3C52",
  },
  searchInput: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 20,
    fontFamily: "Urbanist",
    backgroundColor: "#FFFFFF",
    borderColor: "#EDF3FC",
    borderWidth: 1,
    borderRadius: 12,
    flex: 1,
    padding: 10,
    fontSize: 16,
    color: "#2D3C52",
    marginRight: 12,
  },
  searchInputDark: {
    backgroundColor: "#0D0D0D",
    borderColor: "#2E3033",
    color: "#E0E0E0",
  },
  emptyStateText: {
    fontFamily: "Satoshi-Regular",
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3C52",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontFamily: "Satoshi-Regular",
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
  },
  textDark: {
    color: "#E0E0E0",
  },
  subtextDark: {
    color: "#B3B3B3",
  },
  profileFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#EDF3FC",
    backgroundColor: "#FFFFFF",
  },
  profileFooterDark: {
    backgroundColor: "#0D0D0D",
    borderTopColor: "#2E3033",
  },
  profileName: {
    flex: 1,
    fontFamily: "Satoshi-Medium",
    fontSize: 15,
    color: "#2D3C52",
  },
  homeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#EDF3FC",
  },
  homeButtonDark: {
    backgroundColor: "#131313",
    borderColor: "#2E3033",
  },
  homeIcon: {
    width: 22,
    height: 22,
    resizeMode: "contain",
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
  buttonDark: {
    backgroundColor: "#0D0D0D",
    borderColor: "#2E3033",
  },
  disabledButton: {
    opacity: 0.6,
  },
});
