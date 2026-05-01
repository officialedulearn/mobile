import Avatar from "@/components/common/Avatar";
import { useChatNavigation } from "@/contexts/ChatContext";
import useChatStore from "@/core/chatState";
import useUserStore from "@/core/userState";
import { Chat } from "@/interface/Chat";
import Design from "@/utils/design";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Image,
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

const ChatSidebarPanel = ({ onAfterNavigate }: Props) => {
  const user = useUserStore((s) => s.user);
  const theme = useUserStore((s) => s.theme);
  const router = useRouter();
  const { isNavigating, navigateToChat, createNewChat } = useChatNavigation();
  const { chatList: chats, isLoading, fetchChatList } = useChatStore();
  const [searchQuery, setSearchQuery] = React.useState("");

  const displayName = React.useMemo(() => {
    const n = user?.name?.trim();
    if (n) return n;
    const u = user?.username?.trim();
    if (u) return u.startsWith("@") ? u : `@${u}`;
    return "Account";
  }, [user?.name, user?.username]);

  const avatarInitials = React.useMemo(() => {
    const n = user?.name?.trim() || user?.username?.trim() || "?";
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }, [user?.name, user?.username]);

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
    if (user?.id) {
      fetchChatList(user.id as unknown as string);
    }
  }, [user?.id, fetchChatList]);

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

  const renderChatSection = (title: string, sectionChats: Chat[]) => {
    if (sectionChats.length === 0) return null;

    return (
      <View style={styles.chatSection} key={title}>
        <Text
          style={[styles.sectionHeader, theme === "dark" && { color: "#E0E0E0" }]}
        >
          {title}
        </Text>
        {sectionChats.map((chat) => (
          <TouchableOpacity
            key={chat.id}
            onPress={() => goToChat(chat.id)}
            style={[
              styles.chatItem,
              theme === "dark" && { backgroundColor: "#0D0D0D" },
              isNavigating && styles.disabledChatItem,
            ]}
            disabled={isNavigating}
            activeOpacity={0.7}
          >
            <View style={styles.chatInfo}>
              <Text
                style={[
                  styles.chatTitle,
                  theme === "dark" && { color: "#B3B3B3" },
                ]}
                numberOfLines={1}
              >
                {chat.title || "Untitled Chat"}
              </Text>
            </View>
            {!isNavigating && (
              <Image
                source={
                  theme === "dark"
                    ? require("@/assets/images/icons/dark/CaretRight.png")
                    : require("@/assets/images/icons/CaretRight.png")
                }
                style={[
                  styles.arrowIcon,
                  theme === "dark" && { tintColor: "#777777" },
                ]}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={theme === "dark" ? "#00FF80" : "#2D3C52"}
          />
          <Text
            style={[styles.loadingText, theme === "dark" && { color: "#E0E0E0" }]}
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
            style={[styles.emptyStateText, theme === "dark" && { color: "#E0E0E0" }]}
          >
            No chat history yet
          </Text>
          <Text
            style={[
              styles.emptyStateSubtext,
              theme === "dark" && { color: "#B3B3B3" },
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
            style={[styles.emptyStateText, theme === "dark" && { color: "#E0E0E0" }]}
          >
            No chats found
          </Text>
          <Text
            style={[
              styles.emptyStateSubtext,
              theme === "dark" && { color: "#B3B3B3" },
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
      style={[styles.root, theme === "dark" && { backgroundColor: "#131313" }]}
    >
      <View style={[styles.header, theme === "dark" && { borderBottomColor: "#2E3033" }]}>
        <TextInput
          placeholder="Search chats..."
          placeholderTextColor={theme === "dark" ? "#B3B3B3" : "#61728C"}
          style={[
            styles.searchInput,
            theme === "dark" && {
              backgroundColor: "#0D0D0D",
              borderColor: "#2E3033",
              color: "#E0E0E0",
            },
          ]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          editable={!isNavigating}
        />
        <TouchableOpacity
          style={[
            styles.button,
            theme === "dark" && {
              backgroundColor: "#0D0D0D",
              borderColor: "#2E3033",
            },
            isNavigating && styles.disabledButton,
          ]}
          activeOpacity={0.8}
          onPress={handleCreateNewChat}
          disabled={isNavigating}
        >
          {isNavigating ? (
            <ActivityIndicator
              size="small"
              color={theme === "dark" ? "#E0E0E0" : "#2D3C52"}
            />
          ) : (
            <Image
              source={
                theme === "dark"
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
          theme === "dark" && {
            backgroundColor: "#0D0D0D",
            borderTopColor: "#2E3033",
          },
        ]}
      >
        <Avatar
          size="small"
          initials={avatarInitials}
          source={
            user?.profilePictureURL
              ? { uri: user.profilePictureURL }
              : undefined
          }
        />
        <Text
          style={[
            styles.profileName,
            theme === "dark" && { color: "#E0E0E0" },
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
            theme === "dark" && {
              backgroundColor: "#131313",
              borderColor: "#2E3033",
            },
          ]}
          activeOpacity={0.85}
        >
          <Image
            source={
              theme === "dark"
                ? require("@/assets/images/icons/dark/home.png")
                : require("@/assets/images/icons/home.png")
            }
            style={styles.homeIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatSidebarPanel;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
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
  arrowIcon: {
    width: 16,
    height: 16,
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
  disabledButton: {
    opacity: 0.6,
  },
});
